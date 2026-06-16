from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import yt_dlp
import os

router = APIRouter()

class DownloadRequest(BaseModel):
    video_id: str

@router.post("/download_audio")
async def download_audio(request: DownloadRequest):
    video_url = f"https://www.youtube.com/watch?v={request.video_id}"
    
    ydl_opts = {
        'format': 'bestaudio/best',
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
        'outtmpl': f'/tmp/%(id)s.%(ext)s',
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(video_url, download=True)
            file_path = f"/tmp/{info['id']}.mp3"
            
            if os.path.exists(file_path):
                # In a real app, you'd return a URL to the file
                # For now, we'll just confirm it was created
                return {"message": "Audio downloaded successfully", "file_path": file_path}
            else:
                raise HTTPException(status_code=500, detail="Audio file not found after download.")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to download audio: {str(e)}")
