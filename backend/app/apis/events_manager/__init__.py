import re
from datetime import date, datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException, Depends, Response
from pydantic import BaseModel
from typing import Optional
import databutton as db

from app.apis.admin_auth import require_admin

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

@router.post("/create-event", dependencies=[Depends(require_admin)])
def create_event(body: CreateEventRequest) -> ChurchEvent:
    """Add a new event."""
    raw = load_events()
    new_event = body.model_dump()
    new_event["id"] = next_id(raw)
    raw.append(new_event)
    save_events(raw)
    print(f"Created event id={new_event['id']}: {new_event['title']}")
    return ChurchEvent(**new_event)

@router.put("/update-event/{event_id}", dependencies=[Depends(require_admin)])
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

@router.delete("/delete-event/{event_id}", dependencies=[Depends(require_admin)])
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


# ─── iCal subscription feed ───────────────────────────────────────────────────

# Maps our dayOfWeek (0=Sun … 6=Sat) to RFC 5545 BYDAY codes.
_BYDAY = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"]

# Matches a clock time like "11:00 AM" or "7:30 pm" inside the free-text time field.
_TIME_RE = re.compile(r"(\d{1,2}):(\d{2})\s*([AaPp][Mm])")


def _our_dow(d: date) -> int:
    """Return weekday as 0=Sun … 6=Sat (matches the stored dayOfWeek)."""
    return d.isoweekday() % 7


def _first_on_or_after(d: date, target_dow: int) -> date:
    for i in range(7):
        cand = d + timedelta(days=i)
        if _our_dow(cand) == target_dow:
            return cand
    return d  # unreachable


def _last_weekday_of_month(year: int, month: int, target_dow: int) -> date:
    first_next = date(year + 1, 1, 1) if month == 12 else date(year, month + 1, 1)
    last = first_next - timedelta(days=1)
    for i in range(7):
        cand = last - timedelta(days=i)
        if _our_dow(cand) == target_dow:
            return cand
    return last  # unreachable


def _parse_times(time_str: str) -> tuple[Optional[tuple[int, int]], Optional[tuple[int, int]]]:
    """Best-effort extract (start, end) (hour, minute) from free text.

    Returns (None, None) when no clock time is present (e.g. "Sunset").
    """
    matches = _TIME_RE.findall(time_str or "")

    def to_24h(h: int, m: int, ampm: str) -> tuple[int, int]:
        ampm = ampm.lower()
        if ampm == "pm" and h != 12:
            h += 12
        elif ampm == "am" and h == 12:
            h = 0
        return (h % 24, m % 60)

    start = to_24h(int(matches[0][0]), int(matches[0][1]), matches[0][2]) if matches else None
    end = to_24h(int(matches[1][0]), int(matches[1][1]), matches[1][2]) if len(matches) > 1 else None
    return start, end


def _escape(text: str) -> str:
    """Escape a TEXT value per RFC 5545."""
    return (
        (text or "")
        .replace("\\", "\\\\")
        .replace(";", "\\;")
        .replace(",", "\\,")
        .replace("\r\n", "\\n")
        .replace("\n", "\\n")
    )


def _fold(line: str) -> str:
    """Fold a content line to <=75 octets, continuation lines start with a space."""
    if len(line.encode("utf-8")) <= 75:
        return line
    out = []
    chunk = ""
    for ch in line:
        if len((chunk + ch).encode("utf-8")) > 74:
            out.append(chunk)
            chunk = " " + ch  # leading space marks a continuation line
        else:
            chunk += ch
    if chunk:
        out.append(chunk)
    return "\r\n".join(out)


def _vevent_lines(ev: dict, dtstamp: str) -> list[str]:
    """Build the VEVENT body lines for one stored event, or [] if unschedulable."""
    start_t, end_t = _parse_times(ev.get("time", ""))
    uid = f"hollywood-event-{ev['id']}@church"

    def timed(d: date) -> tuple[str, str]:
        sh, sm = start_t
        dtstart = f"{d:%Y%m%d}T{sh:02d}{sm:02d}00"
        if end_t:
            eh, em = end_t
            end_date = d
            # If the end clock time is earlier than start, assume it rolls to next day.
            if (eh, em) <= (sh, sm):
                end_date = d + timedelta(days=1)
            dtend = f"{end_date:%Y%m%d}T{eh:02d}{em:02d}00"
        else:
            # Default 1-hour duration when only a start time is known.
            end_dt = datetime(d.year, d.month, d.day, sh, sm) + timedelta(hours=1)
            dtend = f"{end_dt:%Y%m%dT%H%M%S}"
        return f"DTSTART:{dtstart}", f"DTEND:{dtend}"

    def all_day(d: date, days: int = 1) -> tuple[str, str]:
        return (
            f"DTSTART;VALUE=DATE:{d:%Y%m%d}",
            f"DTEND;VALUE=DATE:{(d + timedelta(days=days)):%Y%m%d}",
        )

    dt_lines: list[str] = []
    rrule: Optional[str] = None

    if ev.get("date"):
        d = datetime.strptime(ev["date"], "%Y-%m-%d").date()
        dt_lines = list(timed(d) if start_t else all_day(d))
    elif ev.get("dateRange"):
        start = datetime.strptime(ev["dateRange"]["start"], "%Y-%m-%d").date()
        end = datetime.strptime(ev["dateRange"]["end"], "%Y-%m-%d").date()
        # Multi-day events render as an all-day span (DTEND is exclusive).
        dt_lines = list(all_day(start, days=(end - start).days + 1))
    elif ev.get("recurrence"):
        rec = ev["recurrence"]
        dow = rec.get("dayOfWeek")
        if dow is None:
            return []
        if rec.get("type") == "weekly":
            anchor = _first_on_or_after(date(date.today().year, 1, 1), dow)
            rrule = f"RRULE:FREQ=WEEKLY;BYDAY={_BYDAY[dow]}"
        elif rec.get("type") == "monthly-last":
            today = date.today()
            anchor = _last_weekday_of_month(today.year, today.month, dow)
            rrule = f"RRULE:FREQ=MONTHLY;BYDAY=-1{_BYDAY[dow]}"
        else:
            return []
        dt_lines = list(timed(anchor) if start_t else all_day(anchor))
    else:
        return []

    lines = [
        "BEGIN:VEVENT",
        f"UID:{uid}",
        f"DTSTAMP:{dtstamp}",
        *dt_lines,
    ]
    if rrule:
        lines.append(rrule)
    lines.append(f"SUMMARY:{_escape(ev.get('title', 'Event'))}")
    if ev.get("location"):
        lines.append(f"LOCATION:{_escape(ev['location'])}")
    desc_bits = [b for b in [ev.get("description", ""), f"Time: {ev.get('time', '')}".strip()] if b]
    if desc_bits:
        lines.append(f"DESCRIPTION:{_escape('  '.join(desc_bits))}")
    lines.append("END:VEVENT")
    return lines


@router.get("/calendar.ics")
def calendar_feed() -> Response:
    """Public iCal feed visitors can subscribe to in their calendar app."""
    raw = load_events()
    dtstamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")

    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Hollywood Church//Events//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "X-WR-CALNAME:Hollywood Church Events",
        "X-WR-TIMEZONE:America/Los_Angeles",
    ]
    for ev in raw:
        try:
            lines.extend(_vevent_lines(ev, dtstamp))
        except Exception as e:
            print(f"Skipping event {ev.get('id')} in feed: {e}")
            continue
    lines.append("END:VCALENDAR")

    body = "\r\n".join(_fold(ln) for ln in lines) + "\r\n"
    return Response(
        content=body,
        media_type="text/calendar; charset=utf-8",
        headers={"Content-Disposition": 'inline; filename="hollywood-church.ics"'},
    )
