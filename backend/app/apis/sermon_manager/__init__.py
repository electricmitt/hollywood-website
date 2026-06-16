import databutton as db
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

STORAGE_KEY = "sermon_overrides"

class SermonOverride(BaseModel):
    title: Optional[str] = None
    speaker: Optional[str] = None
    description: Optional[str] = None
    scripture: Optional[str] = None

@router.get("/sermon-overrides")
def get_all_overrides():
    """
    Retrieve all sermon overrides from storage.
    """
    return db.storage.json.get(STORAGE_KEY, default={})

@router.get("/sermon-overrides/{video_id}")
def get_override(video_id: str):
    """
    Retrieve a specific sermon override from storage.
    """
    overrides = db.storage.json.get(STORAGE_KEY, default={})
    return overrides.get(video_id, {})

@router.post("/sermon-overrides/{video_id}")
def save_override(video_id: str, override: SermonOverride):
    """
    Save or update a sermon override in storage.
    """
    try:
        overrides = db.storage.json.get(STORAGE_KEY, default={})
        
        # Update existing override or create a new one
        if video_id not in overrides:
            overrides[video_id] = {}
            
        update_data = override.dict(exclude_unset=True)
        overrides[video_id].update(update_data)
        
        db.storage.json.put(STORAGE_KEY, overrides)
        return {"message": "Override saved successfully."}
    except Exception as e:
        print(f"An error occurred while saving override: {e}")
        raise HTTPException(status_code=500, detail="Failed to save sermon override.")

@router.delete("/sermon-overrides/{video_id}")
def delete_override(video_id: str):
    """
    Delete a sermon override from storage.
    """
    try:
        overrides = db.storage.json.get(STORAGE_KEY, default={})
        if video_id in overrides:
            del overrides[video_id]
            db.storage.json.put(STORAGE_KEY, overrides)
            return {"message": "Override deleted successfully."}
        else:
            raise HTTPException(status_code=404, detail="Override not found.")
    except Exception as e:
        print(f"An error occurred while deleting override: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete sermon override.")
