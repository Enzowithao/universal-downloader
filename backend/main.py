import os
import time
import uuid
import threading
import subprocess
import yt_dlp
from fastapi import FastAPI, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel
from typing import Optional, List, Dict
import json
import asyncio
import re

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
DOWNLOAD_DIR = os.getenv("DOWNLOAD_DIR", os.path.join(os.getcwd(), "downloads"))
if not os.path.exists(DOWNLOAD_DIR):
    os.makedirs(DOWNLOAD_DIR)

# Vérification de FFmpeg (Crucial pour le merge audio/vidéo)
def check_dependencies():
    import shutil
    if not shutil.which("ffmpeg"):
        print("\n" + "="*50)
        print("⚠️  WARNING: FFMPEG NOT FOUND  ⚠️")
        print("High quality video downloads (1080p+) requiring merges might fail.")
        print("Please install ffmpeg: sudo apt install ffmpeg")
        print("="*50 + "\n")
    else:
        print("✅ FFmpeg detected. Audio/Video merging enabled.")

check_dependencies()

# --- WEBSOCKET CONNECTION MANAGER ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        # Broadcast to all connected clients
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                # Handle broken pipes/disconnections gracefully
                pass

manager = ConnectionManager()


# --- GLOBAL STATE (In-Memory Download Manager) ---
# Structure: { task_id: { "status": "downloading"|"finished"|"error", "progress": 0.0, "filename": "...", "filepath": "...", "title": "..." } }
download_tasks: Dict[str, dict] = {}


@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection open, we primarily push data from server
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


def cleanup_file(filepath: str):
    """Supprime le fichier après envoi."""
    try:
        if os.path.exists(filepath):
            os.remove(filepath)
            print(f"File deleted: {filepath}")
    except Exception as e:
        print(f"Error deleting file: {e}")


def convert_to_gif(input_path: str, output_path: str):
    """Convertit une vidéo en GIF optimisé."""
    # Palette generation for better quality
    palette_path = os.path.join(os.path.dirname(input_path), "palette.png")
    
    try:
        # 1. Generate palette
        subprocess.run([
            "ffmpeg", "-y", "-i", input_path, 
            "-vf", "fps=15,scale=480:-1:flags=lanczos,palettegen", 
            palette_path
        ], check=True)
        
        # 2. Convert to GIF using palette
        subprocess.run([
            "ffmpeg", "-y", "-i", input_path, "-i", palette_path,
            "-lavfi", "fps=15,scale=480:-1:flags=lanczos [x]; [x][1:v] paletteuse",
            output_path
        ], check=True)
        
    except subprocess.CalledProcessError as e:
        print(f"GIF Conversion Error: {e}")
        raise e
    finally:
        if os.path.exists(palette_path):
            os.remove(palette_path)


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

@app.get("/api/info")
async def get_video_info(url: str):
    ydl_opts = {
        'format': 'bestvideo+bestaudio/best',
        'quiet': True,
        'no_warnings': True,
        'noplaylist': False,  # Allow playlist extraction (mixed video+list)
        'extract_flat': 'in_playlist', # Efficient playlist loading
        'http_headers': {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
        }
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # extract_flat=True is much faster for playlists
            info = ydl.extract_info(url, download=False)
            
            # --- PLAYLIST DETECTION ---
            if info.get('_type') == 'playlist':
                entries = []
                for entry in info.get('entries', []):
                    if entry:
                        entries.append({
                            "id": entry.get('id'),
                            "title": entry.get('title'),
                            "uploader": entry.get('uploader'),
                            "duration": str(entry.get('duration', 0)),
                            "thumbnail": entry.get('thumbnails', [{}])[0].get('url', '') if entry.get('thumbnails') else '',
                            "url": entry.get('url') or f"https://www.youtube.com/watch?v={entry.get('id')}"
                        })

                return {
                    "type": "playlist",
                    "title": info.get('title', 'Unknown Playlist'),
                    "uploader": info.get('uploader', 'Unknown Uploader'),
                    "thumbnail": entries[0]['thumbnail'] if entries else '',
                    "original_url": url,
                    "entries": entries
                }
            
            # --- SINGLE VIDEO ---
            
            # --- Logic to extract useful formats (1080p, 720p, etc.) ---
            formats_list = []
            seen_qualities = set()
            
            # User Preference: Only Main Resolutions
            TARGET_RESOLUTIONS = {
                480: "480p",
                720: "720p",
                1080: "1080p",
                1280: "720p", # TikTok/Reels often use this height
                1920: "1080p",
                1440: "2K",
                2160: "4K"
            }
            
            if 'formats' in info:
                # Iterate in REVERSE to get the BEST bitrate for each resolution first
                for f in reversed(info['formats']):
                    if f.get('vcodec') != 'none' and f.get('height'):
                        height = f['height']
                        
                        if height in TARGET_RESOLUTIONS:
                            label = TARGET_RESOLUTIONS[height]
                            
                            if label not in seen_qualities:
                                filesize = f.get('filesize') or f.get('filesize_approx')
                                if not filesize:
                                    tbr = f.get('tbr') or ((f.get('vbr') or 0) + (f.get('abr') or 0))
                                    duration = info.get('duration')
                                    
                                    if tbr and duration:
                                        filesize = (tbr * 1024 / 8) * duration
                                    elif duration:
                                        filesize = 1.5 * 1024 * 1024 * (duration / 60)
                                        
                                size_str = f"{filesize / 1024 / 1024:.1f} MB" if filesize else "Unk."
                                
                                formats_list.append({
                                    "id": f"{f['format_id']}+bestaudio/best" if f.get('acodec') == 'none' else f['format_id'],
                                    "height": height,
                                    "label": label,
                                    "ext": "mp4",
                                    "size": size_str
                                })
                                seen_qualities.add(label)

            # FALLBACK: If video quality is low or non-standard
            if not formats_list and 'formats' in info:
                best_video = None
                for f in reversed(info['formats']):
                     if f.get('vcodec') != 'none' and f.get('height'):
                         best_video = f
                         break
                
                if best_video:
                    height = best_video['height']
                    label = f"{height}p" 
                    filesize = best_video.get('filesize') or best_video.get('filesize_approx')
                    if not filesize:
                        duration = info.get('duration')
                        if duration:
                             filesize = 1.5 * 1024 * 1024 * (duration / 60)

                    size_str = f"{filesize / 1024 / 1024:.1f} MB" if filesize else "N/A"

                    formats_list.append({
                        "id": f"{best_video['format_id']}+bestaudio/best" if best_video.get('acodec') == 'none' else best_video['format_id'],
                        "height": height,
                        "label": label,
                        "ext": "mp4",
                        "size": size_str
                    })

            # Sort by quality (highest first)
            formats_list.sort(key=lambda x: x['height'], reverse=True)
            
            # Add Audio Only option
            audio_size = "N/A"
            duration = info.get('duration')
            if duration:
                estimated_size = duration * 24 / 1024
                audio_size = f"{estimated_size:.1f} MB"

            formats_list.append({
                "id": "bestaudio/best",
                "height": 0,
                "label": "Audio (MP3)",
                "ext": "mp3",
                "size": audio_size
            })

            # --- Aspect Ratio / Orientation Detection ---
            width = info.get('width')
            height = info.get('height')
            
            # Fallback Orientation Logic
            url_lower = url.lower()
            is_vertical_url = "tiktok.com" in url_lower or "/shorts/" in url_lower or "/reel/" in url_lower
            
            if height and width:
                if height > width:
                    orientation = "portrait"
                    is_vertical = True
                elif height == width:
                    orientation = "square"
                    is_vertical = False
                else:
                    orientation = "landscape"
                    is_vertical = False
            elif is_vertical_url:
                orientation = "portrait"
                is_vertical = True
            else:
                orientation = "landscape"
                is_vertical = False

            # SAFE DURATION FORMATTING
            duration_val = info.get('duration', 0)
            if duration_val:
                mins = int(duration_val) // 60
                secs = int(duration_val) % 60
                duration_str = f"{mins}:{secs:02d}"
            else:
                duration_str = "N/A"

            return {
                "type": "video",
                "title": info.get('title', 'Unknown Title'),
                "uploader": info.get('uploader', 'Unknown Uploader'),
                "duration": duration_str,
                "views": info.get('view_count'),
                "thumbnail": info.get('thumbnail'),
                "original_url": url,
                "formats": formats_list,
                "is_vertical": is_vertical,
                "orientation": orientation,
                "avatar": info.get('uploader_url')
            }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/proxy_image")
async def proxy_image(url: str):
    try:
        if not url:
            raise HTTPException(status_code=400, detail="URL required")
            
        import requests
        
        user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        
        headers = {
            "User-Agent": user_agent,
            "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
            "Sec-Fetch-Dest": "image",
            "Sec-Fetch-Mode": "no-cors",
            "Sec-Fetch-Site": "cross-site",
        }

        if "instagram" in url or "fbcdn" in url:
             headers["Referer"] = "https://www.instagram.com/"
        elif "tiktok" in url:
             headers["Referer"] = "https://www.tiktok.com/"
        
        req = requests.get(url, headers=headers, stream=True, timeout=10)
        
        if req.status_code != 200:
             if "Referer" in headers:
                  del headers["Referer"]
             else:
                  if "tiktok" in url: headers["Referer"] = "https://www.tiktok.com/"
                  if "instagram" in url: headers["Referer"] = "https://www.instagram.com/"

             req = requests.get(url, headers=headers, stream=True, timeout=10)
        
        if req.status_code != 200:
            raise HTTPException(status_code=400, detail=f"Image fetch failed: {req.status_code}")

        return StreamingResponse(
            req.iter_content(chunk_size=1024),
            media_type=req.headers.get('Content-Type', 'image/jpeg')
        )
    except Exception as e:
        print(f"Image Proxy error: {e}")
        return HTTPException(status_code=400, detail="Image Proxy failed")


# --- STREAMING PROXY (Direct pipe from yt-dlp to client) ---
@app.get("/api/stream")
async def stream_video(url: str):
    try:
        ydl_opts = {'format': 'best[ext=mp4]/best', 'quiet': True}
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            stream_url = info['url']
            
        import requests
        def iterfile():
            with requests.get(stream_url, stream=True) as r:
                for chunk in r.iter_content(chunk_size=1024*1024):
                    if chunk:
                        yield chunk
                        
        return StreamingResponse(iterfile(), media_type="video/mp4")
    except Exception as e:
        error_msg = str(e)
        if "DRM" in error_msg:
            raise HTTPException(status_code=400, detail="Ce contenu est protégé (DRM) et ne peut pas être téléchargé. 🔒")
        raise HTTPException(status_code=400, detail=f"Erreur lors de la récupération : {str(e)}")


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

        # Helper to strip ANSI codes
        def clean_str(s):
            if not s: return ""
            ansi_escape = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')
            return ansi_escape.sub('', str(s))

        # BROADCAST UPDATE
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        speed = clean_str(d.get('_speed_str', 'N/A')) if d.get('status') == 'downloading' else ''
        eta = clean_str(d.get('_eta_str', 'N/A')) if d.get('status') == 'downloading' else ''

        loop.run_until_complete(manager.broadcast({
            "type": "progress",
            "taskId": task_id,
            "status": task['status'],
            "progress": task['progress'],
            "speed": speed,
            "eta": eta,
        }))
        loop.close()

    is_gif_mode = (format_id == "gif")
    
    # If GIF mode, we initially download as video (e.g. 720p or best available but not too huge)
    actual_format = "bestvideo[height<=720]+bestaudio/best" if is_gif_mode else (format_id if format_id != "bestaudio/best" else "bestaudio/best")

    # Config yt-dlp
    ydl_opts = {
        'format': actual_format,
        'outtmpl': os.path.join(DOWNLOAD_DIR, f"{task_id}_%(title)s.%(ext)s"),
        'progress_hooks': [progress_hook],
        'quiet': True,
        'noplaylist': True,
        # Performance Optimizations
        'concurrent_fragment_downloads': 8, # Download 8 fragments in parallel
        'buffersize': 1024 * 1024, # 1MB buffer
    }

    # Audio conversion
    if format_id == "bestaudio/best" and not is_gif_mode:
        ydl_opts['postprocessors'] = [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }]

    # Video cutting
    if start_time > 0 or end_time > 0:
        final_end = end_time if end_time > 0 else None
        ydl_opts['download_ranges'] = yt_dlp.utils.download_range_func(None, [(start_time, final_end)])
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            if 'requested_downloads' in info:
                filepath = info['requested_downloads'][0]['filepath']
            else:
                filename = ydl.prepare_filename(info)
                if format_id == "bestaudio/best":
                    filename = os.path.splitext(filename)[0] + ".mp3"
                filepath = filename
            
            task['filepath'] = filepath
            task['filename'] = os.path.basename(filepath)
            
            # --- GIF CONVERSION ---
            if is_gif_mode:
                task['status'] = 'processing'
                gif_filename = os.path.splitext(task['filename'])[0] + ".gif"
                gif_filepath = os.path.join(DOWNLOAD_DIR, gif_filename)
                
                try:
                    convert_to_gif(filepath, gif_filepath)
                    # Remove original video after conversion
                    if os.path.exists(filepath):
                        os.remove(filepath)
                    
                    task['filepath'] = gif_filepath
                    task['filename'] = gif_filename
                except Exception as e:
                    raise Exception(f"GIF Conversion failed: {str(e)}")

            # Apply custom title
            if custom_title:
                ext = os.path.splitext(task['filepath'])[1]
                new_filename = f"{custom_title}{ext}" 
                # Sanitize
                new_filename = "".join([c for c in new_filename if c.isalpha() or c.isdigit() or c in (' ', '.', '_', '-')]).rstrip()
                new_filepath = os.path.join(os.path.dirname(task['filepath']), new_filename)
                
                # Check collision
                if os.path.exists(new_filepath):
                    base, ex = os.path.splitext(new_filename)
                    new_filename = f"{base}_{int(time.time())}{ex}"
                    new_filepath = os.path.join(os.path.dirname(task['filepath']), new_filename)

                os.rename(task['filepath'], new_filepath)
                task['filepath'] = new_filepath
                task['filename'] = new_filename

            task['status'] = 'finished'
            task['progress'] = 100.0

            # --- FINAL SUCCESS BROADCAST ---
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(manager.broadcast({
                "type": "progress",
                "taskId": task_id,
                "status": "finished",
                "progress": 100.0,
                "title": task.get('title', custom_title)
            }))
            loop.close()

    except Exception as e:
        print(f"Download Error: {e}")
        task['status'] = 'error'
        task['error'] = str(e)
        
        # Broadcast Error
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(manager.broadcast({
            "type": "progress",
            "taskId": task_id,
            "status": "error",
            "error": str(e)
        }))
        loop.close()


@app.post("/api/prepare")
async def prepare_download(url: str, format_id: str, title: str, start: int = 0, end: int = 0):
    # Cleanup old tasks (older than 1 hour)
    current_time = time.time()
    toremove = [k for k, v in download_tasks.items() if current_time - v.get('created_at', 0) > 3600]
    for k in toremove:
        if k in download_tasks:
            del download_tasks[k]

    task_id = str(uuid.uuid4())
    download_tasks[task_id] = {
        "status": "downloading",
        "progress": 0.0,
        "title": title,
        "created_at": time.time()
    }

    # Notify start
    await manager.broadcast({
        "type": "progress",
        "taskId": task_id,
        "status": "pending",
        "progress": 0,
        "title": title
    })
    
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
    
    # NO AUTO DELETE HERE for Library feature
    # We clear the task from memory but keep the file on disk
    # We clear the task from memory but keep the file on disk
    # del download_tasks[task_id] # FIX: Don't delete immediately to allow multiple triggers/retries

    return FileResponse(
        path=filepath, 
        filename=filename, 
        media_type='application/octet-stream'
    )


# --- LIBRARY ENDPOINTS ---

@app.get("/api/library")
async def get_library():
    files = []
    try:
        with os.scandir(DOWNLOAD_DIR) as entries:
            for entry in entries:
                if entry.is_file():
                    stat = entry.stat()
                    # Detect type
                    ext = os.path.splitext(entry.name)[1].lower()
                    if ext in ['.mp4', '.mkv', '.webm']:
                        ftype = "video"
                    elif ext in ['.mp3', '.m4a', '.wav']:
                        ftype = "audio"
                    elif ext in ['.gif']:
                        ftype = "gif"
                    else:
                        continue # Skip temp files or others

                    files.append({
                        "name": entry.name,
                        "size": stat.st_size,
                        "created": stat.st_ctime,
                        "type": ftype
                    })
        # Sort by newest first
        files.sort(key=lambda x: x['created'], reverse=True)
        return files
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/library/{filename}")
async def delete_library_item(filename: str):
    filepath = os.path.join(DOWNLOAD_DIR, filename)
    # Security check: ensure no directory traversal
    if os.path.commonpath([filepath, DOWNLOAD_DIR]) != DOWNLOAD_DIR:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if os.path.exists(filepath):
        try:
            os.remove(filepath)
            return {"status": "deleted"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    raise HTTPException(status_code=404, detail="File not found")


@app.get("/api/library/stream/{filename}")
async def stream_library_item(filename: str):
    filepath = os.path.join(DOWNLOAD_DIR, filename)
    # Security check
    if os.path.commonpath([filepath, DOWNLOAD_DIR]) != DOWNLOAD_DIR:
        raise HTTPException(status_code=403, detail="Access denied")
        
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(filepath)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)