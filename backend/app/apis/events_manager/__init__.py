from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import databutton as db

router = APIRouter(prefix="/events")

STORAGE_KEY = "church_events"

# ─── Models ──────────────────────────────────────────────────────────────────

class RecurrenceRule(BaseModel):
    type: str  # "weekly" | "monthly-last"
    dayOfWeek: Optional[int] = None  # 0=Sun … 6=Sat

class DateRange(BaseModel):
    start: str  # YYYY-MM-DD
    end: str    # YYYY-MM-DD

class ChurchEvent(BaseModel):
    id: int
    title: str
    date: Optional[str] = None          # YYYY-MM-DD for one-off
    dateRange: Optional[DateRange] = None
    recurrence: Optional[RecurrenceRule] = None
    time: str
    location: str
    description: str
    color: Optional[str] = "bg-indigo-500"
    featured: Optional[bool] = False
    imageUrl: Optional[str] = None

class CreateEventRequest(BaseModel):
    title: str
    date: Optional[str] = None
    dateRange: Optional[DateRange] = None
    recurrence: Optional[RecurrenceRule] = None
    time: str
    location: str
    description: str
    color: Optional[str] = "bg-indigo-500"
    featured: Optional[bool] = False
    imageUrl: Optional[str] = None

class EventsResponse(BaseModel):
    events: list[ChurchEvent]

class DeleteResponse(BaseModel):
    success: bool
    message: str

# ─── Seed data ───────────────────────────────────────────────────────────────

DEFAULT_EVENTS = [
    {
        "id": 1,
        "title": "Sabbath Worship Service",
        "recurrence": {"type": "weekly", "dayOfWeek": 6},
        "time": "11:00 AM - Sunset",
        "location": "Main Sanctuary",
        "description": "Join us for our weekly worship service featuring praise, prayer, and powerful teaching from God's Word.",
        "color": "bg-indigo-500",
        "featured": True,
        "imageUrl": "https://i.imgur.com/kqp3QYR.jpg",
    },
    {
        "id": 2,
        "title": "Bible Study",
        "recurrence": {"type": "weekly", "dayOfWeek": 2},
        "time": "7:00 PM - 8:30 PM",
        "location": "Fellowship Hall",
        "description": "Deepen your understanding of Scripture through in-depth study and discussion in community.",
        "color": "bg-purple-500",
        "featured": False,
        "imageUrl": "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?q=80&w=1000&auto=format&fit=crop",
    },
    {
        "id": 3,
        "title": "Youth Fellowship",
        "recurrence": {"type": "weekly", "dayOfWeek": 5},
        "time": "6:30 PM - 8:30 PM",
        "location": "Youth Center",
        "description": "A time for young people to connect, grow in faith, and have fun in a safe and supportive environment.",
        "color": "bg-emerald-500",
        "featured": False,
        "imageUrl": "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1000&auto=format&fit=crop",
    },
    {
        "id": 4,
        "title": "Community Outreach",
        "date": "2025-03-23",
        "time": "9:00 AM - 1:00 PM",
        "location": "Community Center",
        "description": "Join us as we serve our local community through food distribution and various support services.",
        "color": "bg-amber-500",
        "featured": False,
        "imageUrl": "https://i.imgur.com/Xxt3zsv.jpg",
    },
    {
        "id": 5,
        "title": "Passover 2025",
        "dateRange": {"start": "2025-04-13", "end": "2025-04-20"},
        "time": "7:00 PM - 9:00 PM",
        "location": "Main Sanctuary",
        "description": "7 days of powerful preaching, prayer, and praise as we seek spiritual renewal and revival.",
        "color": "bg-rose-500",
        "featured": True,
        "imageUrl": "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=1000&auto=format&fit=crop",
    },
    {
        "id": 6,
        "title": "Monthly Prayer Meeting",
        "recurrence": {"type": "monthly-last", "dayOfWeek": 6},
        "time": "8:00 AM - 10:00 AM",
        "location": "Prayer Room",
        "description": "Gather with fellow believers to intercede for our church, community, and world.",
        "color": "bg-sky-500",
        "featured": False,
        "imageUrl": "https://images.unsplash.com/photo-1494774157365-9e04c6720e47?q=80&w=1000&auto=format&fit=crop",
    },
]

# ─── Storage helpers ──────────────────────────────────────────────────────────

def load_events() -> list[dict]:
    """Load events from storage, seeding defaults if not yet set."""
    data = db.storage.json.get(STORAGE_KEY, default=None)
    if data is None:
        # First run — seed with defaults
        db.storage.json.put(STORAGE_KEY, DEFAULT_EVENTS)
        return DEFAULT_EVENTS
    return data

def save_events(events: list[dict]) -> None:
    db.storage.json.put(STORAGE_KEY, events)

def next_id(events: list[dict]) -> int:
    if not events:
        return 1
    return max(e["id"] for e in events) + 1

# ─── Endpoints ───────────────────────────────────────────────────────────────

@router.get("/get-events")
def get_events() -> EventsResponse:
    """Return all stored events."""
    raw = load_events()
    return EventsResponse(events=[ChurchEvent(**e) for e in raw])

@router.post("/create-event")
def create_event(body: CreateEventRequest) -> ChurchEvent:
    """Add a new event."""
    raw = load_events()
    new_event = body.model_dump()
    new_event["id"] = next_id(raw)
    raw.append(new_event)
    save_events(raw)
    print(f"Created event id={new_event['id']}: {new_event['title']}")
    return ChurchEvent(**new_event)

@router.put("/update-event/{event_id}")
def update_event(event_id: int, body: CreateEventRequest) -> ChurchEvent:
    """Update an existing event by ID."""
    raw = load_events()
    idx = next((i for i, e in enumerate(raw) if e["id"] == event_id), None)
    if idx is None:
        raise HTTPException(status_code=404, detail=f"Event {event_id} not found")
    updated = body.model_dump()
    updated["id"] = event_id
    raw[idx] = updated
    save_events(raw)
    print(f"Updated event id={event_id}: {updated['title']}")
    return ChurchEvent(**updated)

@router.delete("/delete-event/{event_id}")
def delete_event(event_id: int) -> DeleteResponse:
    """Delete an event by ID."""
    raw = load_events()
    before = len(raw)
    raw = [e for e in raw if e["id"] != event_id]
    if len(raw) == before:
        raise HTTPException(status_code=404, detail=f"Event {event_id} not found")
    save_events(raw)
    print(f"Deleted event id={event_id}")
    return DeleteResponse(success=True, message=f"Event {event_id} deleted")
