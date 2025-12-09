import os
import uuid
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import yt_dlp
from urllib.parse import quote, unquote

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- UTILITAIRES ---

def format_size(bytes_size):
    if not bytes_size:
        return "N/A"
    return f"{round(bytes_size / (1024 * 1024), 1)} MB"

def get_best_size(formats, is_audio=False, limit_res=False):
    best_size = 0
    if is_audio:
        for f in formats:
            if f.get('acodec') != 'none' and f.get('vcodec') == 'none':
                size = f.get('filesize') or f.get('filesize_approx') or 0
                if size > best_size:
                    best_size = size
        return format_size(best_size) if best_size > 0 else "Estim. ~4 MB"

    video_size = 0
    audio_size = 0
    for f in formats:
        if f.get('acodec') != 'none' and f.get('vcodec') == 'none':
            audio_size = f.get('filesize') or f.get('filesize_approx') or 0
            break

    for f in formats:
        if f.get('vcodec') == 'none': continue
        size = f.get('filesize') or f.get('filesize_approx') or 0
        height = f.get('height') or 0
        width = f.get('width') or 0
        
        if limit_res:
            if height > 800 and width > 800: continue
            if size > video_size: video_size = size
        else:
            if size > video_size: video_size = size

    total = video_size + audio_size
    if total > 0: return format_size(total)
    return "Estim. ~" + ("45 MB" if limit_res else "120 MB")

def cleanup_file(path: str):
    try:
        if os.path.exists(path):
            os.remove(path)
    except Exception as e:
        print(f"Erreur suppression fichier: {e}")

# --- ROUTES API ---

@app.get("/")
def read_root():
    return {"status": "online", "message": "Le moteur est chaud 🔥"}

@app.get("/api/info")
def get_video_info(url: str):
    # --- NETTOYAGE DU LIEN (Anti-Playlist) ---
    if "&list=" in url:
        url = url.split("&list=")[0]
    # -----------------------------------------

    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'extract_flat': False,
        'noplaylist': True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            title = info.get('title', 'Titre inconnu')
            avatar_url = info.get('channel_thumbnail') or info.get('uploader_thumbnail') or info.get('avatar') or None
            formats = info.get('formats', [])

            size_max = get_best_size(formats, is_audio=False, limit_res=False) 
            size_eco = get_best_size(formats, is_audio=False, limit_res=True)  
            size_audio = get_best_size(formats, is_audio=True)

            return {
                "title": title,
                "thumbnail": info.get('thumbnail', ''),
                "uploader": info.get('uploader', 'Auteur'),
                "avatar": avatar_url,
                "duration": info.get('duration_string', 'N/A'),
                "views": info.get('view_count'),
                "original_url": url,
                "options": [
                    {"type": "video", "quality": "1080p", "ext": "mp4", "size": size_max},
                    {"type": "video", "quality": "720p", "ext": "mp4", "size": size_eco},
                    {"type": "audio", "quality": "320kbps", "ext": "mp3", "size": size_audio},
                ]
            }

    except Exception as e:
        print(f"ERREUR INFO: {e}")
        raise HTTPException(status_code=400, detail="Impossible de récupérer la vidéo.")

@app.get("/api/download")
def download_video(url: str, type: str, quality: str, background_tasks: BackgroundTasks, title: str = None):
    # --- NETTOYAGE DU LIEN (Anti-Playlist) ---
    if "&list=" in url:
        url = url.split("&list=")[0]
    # -----------------------------------------

    try:
        filename_id = str(uuid.uuid4())
        
        ydl_opts = {
            'outtmpl': f'downloads/{filename_id}.%(ext)s',
            'quiet': True,
            'writethumbnail': True,
            'noplaylist': True,
        }

        if type == 'audio':
            ydl_opts.update({
                'format': 'bestaudio/best',
                'postprocessors': [
                    {
                        'key': 'FFmpegExtractAudio',
                        'preferredcodec': 'mp3',
                        'preferredquality': '192',
                    },
                    {
                        'key': 'FFmpegThumbnailsConvertor', # Convertit WebP -> JPG
                        'format': 'jpg',
                    },
                    {
                        'key': 'EmbedThumbnail', # AtomicParsley l'utilise ici
                    },
                    {
                        'key': 'FFmpegMetadata',
                        'add_metadata': True,
                    },
                ],
            })
            final_filename = f"downloads/{filename_id}.mp3"
            media_type = "audio/mpeg"
        else: 
            if quality == "1080p":
                ydl_opts['format'] = 'bestvideo+bestaudio/best'
            else:
                ydl_opts['format'] = 'bestvideo[height<=720]+bestaudio/bestvideo[width<=720]+bestaudio/best[height<=720]/best[width<=720]'
            
            ydl_opts['postprocessors'] = [
                {'key': 'FFmpegMetadata', 'add_metadata': True},
                {'key': 'EmbedThumbnail'}
            ]
            ydl_opts['merge_output_format'] = 'mp4'
            
            final_filename = f"downloads/{filename_id}.mp4"
            media_type = "video/mp4"

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            
            if title:
                base_name = unquote(title) 
            else:
                base_name = info.get('title', 'video')
            
            clean_title = base_name.replace('/', '_').replace('\\', '_').replace(':', '')
            
            if type == 'audio':
                download_name = f"{clean_title}.mp3"
            else:
                download_name = f"{clean_title}.mp4"

        encoded_filename = quote(download_name)
        background_tasks.add_task(cleanup_file, final_filename)
        
        return FileResponse(
            path=final_filename, 
            filename=download_name,
            media_type=media_type,
            headers={"Content-Disposition": f"attachment; filename*=utf-8''{encoded_filename}"}
        )

    except Exception as e:
        print(f"Erreur Download: {e}")
        raise HTTPException(status_code=400, detail=f"Erreur téléchargement: {str(e)}")