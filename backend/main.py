import os
import uuid
import yt_dlp
import threading
import time
import re
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel
from typing import Optional, List, Dict

app = FastAPI()

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dossier temporaire pour les téléchargements
DOWNLOAD_DIR = os.path.join(os.getcwd(), "downloads")
if not os.path.exists(DOWNLOAD_DIR):
    os.makedirs(DOWNLOAD_DIR)

# --- GLOBAL STATE (In-Memory Download Manager) ---
# Structure: { task_id: { "status": "downloading"|"finished"|"error", "progress": 0.0, "filename": "...", "filepath": "...", "title": "..." } }
download_tasks: Dict[str, dict] = {}


def cleanup_file(filepath: str):
    """Supprime le fichier après envoi."""
    try:
        if os.path.exists(filepath):
            os.remove(filepath)
            print(f"File deleted: {filepath}")
    except Exception as e:
        print(f"Error deleting file: {e}")


class VideoInfo(BaseModel):
    title: str
    uploader: str
    duration: str
    thumbnail: str
    views: int
    original_url: str
    formats: List[dict]  # New: list of available qualities


@app.get("/")
def read_root():
    return {"status": "Universal Downloader Backend Running"}

@app.get("/api/info", response_model=VideoInfo)
async def get_video_info(url: str):
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            # --- Logic to extract useful formats (1080p, 720p, etc.) ---
            formats_list = []
            seen_qualities = set()
            
            if 'formats' in info:
                for f in info['formats']:
                    # Filter for video only or video+audio (mp4 preferred)
                    if f.get('vcodec') != 'none' and f.get('height'):
                        height = f['height']
                        # Group roughly by common resolutions
                        label = f"{height}p"
                        
                        # We want unique labels for the UI (e.g. one "1080p" option)
                        if label not in seen_qualities:
                            # Estimate size if available
                            filesize = f.get('filesize') or f.get('filesize_approx')
                            
                            # Fallback: Calculate from bitrate if filesize is missing
                            if not filesize:
                                tbr = f.get('tbr') or ((f.get('vbr') or 0) + (f.get('abr') or 0))
                                duration = info.get('duration')
                                if tbr and duration:
                                    filesize = (tbr * 1024 / 8) * duration # tbr is usually in kbit/s

                            size_str = f"{filesize / 1024 / 1024:.1f} MB" if filesize else "N/A"
                            
                            formats_list.append({
                                "id": f['format_id'], # yt-dlp format id
                                "height": height,
                                "label": label,
                                "ext": f['ext'],
                                "size": size_str
                            })
                            seen_qualities.add(label)
            
            # Sort by quality (highest first)
            formats_list.sort(key=lambda x: x['height'], reverse=True)
            
            # Add Audio Only option (Estimated at 192kbps)
            audio_size = "N/A"
            duration = info.get('duration')
            if duration:
                # 192 kbps = 24 KB/s
                # size (MB) = duration (s) * 24 / 1024
                estimated_size = duration * 24 / 1024
                audio_size = f"{estimated_size:.1f} MB"

            formats_list.append({
                "id": "bestaudio/best",
                "height": 0,
                "label": "Audio (MP3)",
                "ext": "mp3",
                "size": audio_size
            })

            return {
                "title": info.get('title', 'Unknown Title'),
                "uploader": info.get('uploader', 'Unknown Uploader'),
                "duration": info.get('duration_string', '0:00'),
                "thumbnail": info.get('thumbnail', ''),
                "views": info.get('view_count', 0),
                "original_url": url,
                "formats": formats_list
            }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# --- STREAMING PROXY (Direct pipe from yt-dlp to client) ---
# Used for video playback preview only
@app.get("/api/stream")
async def stream_video(url: str):
    try:
        # Get direct URL
        ydl_opts = {'format': 'best[ext=mp4]/best', 'quiet': True}
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            stream_url = info['url']
            
        # Proxy with requests
        import requests
        def iterfile():
            with requests.get(stream_url, stream=True) as r:
                for chunk in r.iter_content(chunk_size=1024*1024):
                    if chunk:
                        yield chunk
                        
        return StreamingResponse(iterfile(), media_type="video/mp4")
    except Exception as e:
        print(f"Stream error: {e}")
        return HTTPException(status_code=500, detail="Streaming failed")


# --- BACKGROUND DOWNLOAD WORKER ---
def background_download(task_id: str, url: str, format_id: str, custom_title: str, start_time: int = 0, end_time: int = 0):
    task = download_tasks[task_id]
    
    def progress_hook(d):
        if d['status'] == 'downloading':
            try:
                total = d.get('total_bytes') or d.get('total_bytes_estimate')
                downloaded = d.get('downloaded_bytes', 0)
                if total:
                    p = (downloaded / total) * 100
                    task['progress'] = float(p)
            except Exception as e:
                print(f"Error updating progress: {e}")
        elif d['status'] == 'finished':
            task['progress'] = 100.0
            task['status'] = 'processing' # Processing/Converting phase

    # Config yt-dlp
    ydl_opts = {
        'format': format_id if format_id != "bestaudio/best" else "bestaudio/best",
        'outtmpl': os.path.join(DOWNLOAD_DIR, f"{task_id}_%(title)s.%(ext)s"),
        'progress_hooks': [progress_hook],
        'quiet': True,
        'noplaylist': True,
    }

    # Audio conversion
    if format_id == "bestaudio/best":
        ydl_opts['postprocessors'] = [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }]

    # Video cutting
    if start_time > 0 or end_time > 0:
        # If end_time is 0, it means "until the end", so we pass None to yt-dlp
        final_end = end_time if end_time > 0 else None
        ydl_opts['download_ranges'] = yt_dlp.utils.download_range_func(None, [(start_time, final_end)])
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            # Find the file path
            if 'requested_downloads' in info:
                filepath = info['requested_downloads'][0]['filepath']
            else:
                # Fallback mechanism to find file
                filename = ydl.prepare_filename(info)
                if format_id == "bestaudio/best":
                    filename = os.path.splitext(filename)[0] + ".mp3"
                filepath = filename
            
            task['filepath'] = filepath
            task['filename'] = os.path.basename(filepath)
            
            # Apply custom title if needed
            if custom_title:
                ext = os.path.splitext(filepath)[1]
                new_filename = f"{custom_title}{ext}" 
                # Sanitize filename
                new_filename = "".join([c for c in new_filename if c.isalpha() or c.isdigit() or c in (' ', '.', '_', '-')]).rstrip()
                new_filepath = os.path.join(os.path.dirname(filepath), new_filename)
                os.rename(filepath, new_filepath)
                task['filepath'] = new_filepath
                task['filename'] = new_filename

            task['status'] = 'finished'

    except Exception as e:
        print(f"Download Error: {e}")
        task['status'] = 'error'
        task['error'] = str(e)


@app.post("/api/prepare")
async def prepare_download(url: str, format_id: str, title: str, start: int = 0, end: int = 0):
    task_id = str(uuid.uuid4())
    download_tasks[task_id] = {
        "status": "downloading",
        "progress": 0.0,
        "title": title
    }
    
    # Start background thread
    thread = threading.Thread(
        target=background_download,
        args=(task_id, url, format_id, title, start, end),
        daemon=True
    )
    thread.start()
    
    return {"task_id": task_id}


@app.get("/api/progress/{task_id}")
async def get_progress(task_id: str):
    task = download_tasks.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@app.get("/api/download/{task_id}")
async def download_file(task_id: str, background_tasks: BackgroundTasks):
    task = download_tasks.get(task_id)
    if not task or task['status'] != 'finished':
        raise HTTPException(status_code=404, detail="File not ready or task not found")
        
    filepath = task['filepath']
    filename = task['filename']
    
    # Schedule cleanup after response is sent
    background_tasks.add_task(cleanup_file, filepath)
    
    # Clean up task from memory (optional, but good practice)
    # We delay explicit deletion slightly or rely on the user having downloaded it.
    # Current simplistic approach: Delete from map immediately after serving request start? 
    # Or keep it? If we delete it, subsequent retries fail.
    # Check logic: we are returning FileResponse. 
    # Let's keep it in map for now, or maybe add a timestamp for cleanup?
    # For simplicity, let's just leave it in the map. It will clear on server restart. 
    # Or better: cleanup on fetch.
    del download_tasks[task_id]

    return FileResponse(
        path=filepath, 
        filename=filename, 
        media_type='application/octet-stream'
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)