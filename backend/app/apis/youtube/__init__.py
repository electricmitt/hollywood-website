from fastapi import APIRouter, HTTPException, Depends
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
import databutton as db
from pydantic import BaseModel
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.formatters import JSONFormatter
import re

router = APIRouter()

YOUTUBE_API_SERVICE_NAME = "youtube"
YOUTUBE_API_VERSION = "v3"

def get_youtube_service():
    api_key = db.secrets.get("YOUTUBE_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="YouTube API key is not set.")
    return build(YOUTUBE_API_SERVICE_NAME, YOUTUBE_API_VERSION, developerKey=api_key)

def get_sermon_details(youtube, playlist_id):
    sermons = []
    overrides = db.storage.json.get('sermon_overrides', default={})
    next_page_token = None
    while True:
        pl_request = youtube.playlistItems().list(
            part='snippet,contentDetails',
            playlistId=playlist_id,
            maxResults=50,
            pageToken=next_page_token
        )
        pl_response = pl_request.execute()

        video_ids = [item['contentDetails']['videoId'] for item in pl_response['items']]
        vid_request = youtube.videos().list(
            part='snippet,contentDetails',
            id=','.join(video_ids)
        )
        vid_response = vid_request.execute()

        for item in pl_response['items']:
            video_id = item['contentDetails']['videoId']
            video_data = next((v for v in vid_response['items'] if v['id'] == video_id), None)
            
            if not video_data:
                continue

            duration_iso = video_data['contentDetails']['duration']
            m = re.match(r'PT(\d+H)?(\d+M)?(\d+S)?', duration_iso)
            h, m_str, s = m.groups()
            duration_min = (int(h[:-1]) * 60 if h else 0) + (int(m_str[:-1]) if m_str else 0) + (int(s[:-1]) / 60 if s else 0)
            
            # Start with YouTube data
            sermon_data = {
                "video_id": video_id,
                "title": item['snippet']['title'],
                "description": item['snippet']['description'],
                "published_at": item['snippet']['publishedAt'],
                "thumbnail_url": item['snippet']['thumbnails'].get('high', {}).get('url'),
                "speaker": item['snippet'].get('videoOwnerChannelTitle', 'N/A').replace(' - Topic', ''),
                "duration": round(duration_min),
                "scripture": None, # Default value
            }

            # Check for and apply overrides
            if video_id in overrides:
                sermon_data.update(overrides[video_id])

            sermons.append(sermon_data)

        next_page_token = pl_response.get('nextPageToken')
        if not next_page_token:
            break
    
    return sermons

@router.get("/sermons")
def get_sermons(playlistId: str, youtube: build = Depends(get_youtube_service)):
    try:
        sermons = get_sermon_details(youtube, playlistId)
        return sermons
    except Exception as e:
        print(f"An error occurred: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch sermons.")

@router.get("/transcript/{video_id}")
def get_transcript_route(video_id: str):
    try:
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
        transcript = transcript_list.find_transcript(['en', 'en-US'])
        return transcript.fetch()
    except Exception:
        return {"error": "Transcript not found or failed to fetch."}
