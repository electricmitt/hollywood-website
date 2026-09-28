import os
import re
import json
import math
import secrets
import httpx
from datetime import date, datetime, timedelta, timezone
from fastapi import APIRouter, HTTPException, Depends, Response, UploadFile, File
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field, model_validator
from typing import Optional

from app.apis.admin_auth import require_admin
from app.libs.storage import json_get, json_put, DATA_DIR

router = APIRouter(prefix="/events")

STORAGE_KEY = "church_events"

# ─── Models ──────────────────────────────────────────────────────────────────

_FREQS = ("weekly", "monthly", "yearly")
_WEEKS_OF_MONTH = (1, 2, 3, 4, -1)  # -1 = last
_HHMM_RE = re.compile(r"([01]\d|2[0-3]):[0-5]\d")


def _check_date(value: Optional[str], field: str) -> Optional[str]:
    """Validate an optional YYYY-MM-DD string; empty becomes None."""
    if not value:
        return None
    try:
        datetime.strptime(value, "%Y-%m-%d")
    except ValueError:
        raise ValueError(f"{field} must be a YYYY-MM-DD date.")
    return value


def _check_hhmm(value: Optional[str], field: str) -> Optional[str]:
    """Validate an optional 24-hour HH:MM string; empty becomes None."""
    if not value:
        return None
    if not _HHMM_RE.fullmatch(value):
        raise ValueError(f"{field} must be a 24-hour HH:MM time.")
    return value


class RecurrenceRule(BaseModel):
    freq: Optional[str] = None         # "weekly" | "monthly" | "yearly"
    interval: int = 1                  # every N weeks / months / years
    dayOfWeek: Optional[int] = None    # 0=Sun … 6=Sat (weekly, monthly)
    weekOfMonth: Optional[int] = None  # monthly: 1-4, or -1 for the last one
    startDate: Optional[str] = None    # series can't occur before this (required for every-N and yearly)
    endDate: Optional[str] = None      # last possible date, inclusive
    exceptions: list[str] = []         # skipped dates, YYYY-MM-DD
    type: Optional[str] = Field(default=None, exclude=True)  # legacy input: "weekly" | "monthly-last"

    @model_validator(mode="after")
    def _upgrade_legacy(self):
        """Accept the older {type, dayOfWeek} shape."""
        if not self.freq and self.type == "weekly":
            self.freq = "weekly"
        elif not self.freq and self.type == "monthly-last":
            self.freq, self.weekOfMonth = "monthly", -1
        return self


class DateRange(BaseModel):
    start: str  # YYYY-MM-DD
    end: str    # YYYY-MM-DD, inclusive


class EventFields(BaseModel):
    """Fields shared by stored events and create/update requests."""
    title: str
    date: Optional[str] = None               # YYYY-MM-DD for a one-time event
    dateRange: Optional[DateRange] = None    # multi-day event
    recurrence: Optional[RecurrenceRule] = None
    startTime: Optional[str] = None          # "HH:MM" 24h, church-local
    endTime: Optional[str] = None
    endsAtSunset: bool = False
    allDay: bool = False
    time: str = ""                           # display label, e.g. "7:30 PM – 9:30 PM"
    location: str
    description: str = ""
    color: Optional[str] = "bg-indigo-500"
    featured: Optional[bool] = False
    imageUrl: Optional[str] = None


class ChurchEvent(EventFields):
    id: int


class CreateEventRequest(EventFields):
    @model_validator(mode="after")
    def _validate(self):
        self.date = _check_date(self.date, "Date")
        if self.dateRange:
            _check_date(self.dateRange.start, "Start date")
            _check_date(self.dateRange.end, "End date")
            if self.dateRange.end < self.dateRange.start:
                raise ValueError("The end date is before the start date.")

        rec = self.recurrence
        if rec:
            if rec.freq not in _FREQS:
                raise ValueError("Repeat must be weekly, monthly, or yearly.")
            if not 1 <= rec.interval <= 12:
                raise ValueError("Repeat interval must be between 1 and 12.")
            if rec.freq in ("weekly", "monthly") and (rec.dayOfWeek is None or not 0 <= rec.dayOfWeek <= 6):
                raise ValueError("Choose a day of the week.")
            if rec.freq == "monthly" and rec.weekOfMonth not in _WEEKS_OF_MONTH:
                raise ValueError("Choose which week of the month (first to fourth, or last).")
            rec.startDate = _check_date(rec.startDate, "Start date")
            rec.endDate = _check_date(rec.endDate, "End date")
            if (rec.freq == "yearly" or rec.interval > 1) and not rec.startDate:
                raise ValueError("This repeat needs a start date.")
            if rec.startDate and rec.endDate and rec.endDate < rec.startDate:
                raise ValueError("The repeat ends before it starts.")
            if len(rec.exceptions) > 500:
                raise ValueError("Too many skipped dates.")
            rec.exceptions = sorted({_check_date(d, "Skipped date") for d in rec.exceptions if d})

        if sum(bool(x) for x in (self.date, self.dateRange, rec)) != 1:
            raise ValueError("Choose one schedule: a single date, a date range, or a repeat.")

        self.startTime = _check_hhmm(self.startTime, "Start time")
        self.endTime = _check_hhmm(self.endTime, "End time")
        if self.allDay:
            self.startTime = self.endTime = None
            self.endsAtSunset = False
        if self.endsAtSunset:
            self.endTime = None
        if (self.endTime or self.endsAtSunset) and not self.startTime:
            raise ValueError("Set a start time.")
        return self

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

def _fmt_hhmm(t: Optional[tuple[int, int]]) -> Optional[str]:
    return f"{t[0]:02d}:{t[1]:02d}" if t else None


def _fill_times_from_text(ev: dict) -> None:
    """Give an event structured times parsed from its time label, if it has none."""
    if ev.get("allDay") or ev.get("startTime") or not ev.get("time"):
        return
    start, end, sunset = _parse_times(ev["time"])
    ev.update(startTime=_fmt_hhmm(start), endTime=_fmt_hhmm(end), endsAtSunset=sunset)


def _upgrade_stored_event(ev: dict) -> bool:
    """Bring an event saved by an older version up to the current shape, in place.

    Returns True if anything changed.
    """
    changed = False
    rec = ev.get("recurrence")
    if rec is not None:
        if not rec.get("freq"):
            if rec.get("type") == "weekly":
                rec["freq"] = "weekly"
            elif rec.get("type") == "monthly-last":
                rec["freq"], rec["weekOfMonth"] = "monthly", -1
            changed = True
        for key, default in (("interval", 1), ("exceptions", [])):
            if key not in rec:
                rec[key] = default
                changed = True
        if "type" in rec:
            del rec["type"]
            changed = True
    if "startTime" not in ev:
        ev.update(startTime=None, endTime=None, endsAtSunset=False, allDay=False)
        _fill_times_from_text(ev)
        changed = True
    if ev.get("date") == "":
        ev["date"] = None
        changed = True
    return changed


def load_events() -> list[dict]:
    """Load events from storage, seeding defaults if not yet set."""
    data = json_get(STORAGE_KEY, default=None)
    if data is None:
        # First run — seed with a copy of the defaults.
        data = json.loads(json.dumps(DEFAULT_EVENTS))
        for ev in data:
            _upgrade_stored_event(ev)
        json_put(STORAGE_KEY, data)
        return data

    original = json.loads(json.dumps(data))
    if any([_upgrade_stored_event(ev) for ev in data]):
        # One-time upgrade of older data; keep a copy of what was there first.
        json_put(f"{STORAGE_KEY}_backup_{datetime.now():%Y%m%d%H%M%S}", original)
        json_put(STORAGE_KEY, data)
        print(f"Upgraded stored events to the current format ({len(data)} events)")
    return data

def save_events(events: list[dict]) -> None:
    json_put(STORAGE_KEY, events)

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
    _fill_times_from_text(new_event)
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
    _fill_times_from_text(updated)
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


class SkipDateRequest(BaseModel):
    date: str          # YYYY-MM-DD occurrence to skip
    skip: bool = True  # False restores a previously skipped date


@router.post("/skip-date/{event_id}", dependencies=[Depends(require_admin)])
def skip_date(event_id: int, body: SkipDateRequest) -> ChurchEvent:
    """Skip (or restore) a single date of a repeating event."""
    try:
        day = _check_date(body.date, "Date")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not day:
        raise HTTPException(status_code=400, detail="A date is required.")

    raw = load_events()
    ev = next((e for e in raw if e["id"] == event_id), None)
    if ev is None:
        raise HTTPException(status_code=404, detail=f"Event {event_id} not found")
    rec = ev.get("recurrence")
    if not rec:
        raise HTTPException(status_code=400, detail="Only repeating events have dates to skip.")

    skipped = set(rec.get("exceptions") or [])
    if body.skip:
        skipped.add(day)
    else:
        skipped.discard(day)
    rec["exceptions"] = sorted(skipped)
    save_events(raw)
    print(f"{'Skipped' if body.skip else 'Restored'} {day} for event id={event_id}")
    return ChurchEvent(**ev)


# ─── iCal subscription feed ───────────────────────────────────────────────────

# Maps our dayOfWeek (0=Sun … 6=Sat) to RFC 5545 BYDAY codes.
_BYDAY = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"]

# The church is in West Park, FL — all event times are Eastern.
CHURCH_TZ = "America/New_York"
_CHURCH_LAT = 25.99
_CHURCH_LON = -80.21

# RFC 5545 definition of US Eastern time (DST: 2nd Sunday of March to 1st Sunday of November).
_VTIMEZONE = [
    "BEGIN:VTIMEZONE",
    f"TZID:{CHURCH_TZ}",
    "BEGIN:DAYLIGHT",
    "TZOFFSETFROM:-0500",
    "TZOFFSETTO:-0400",
    "TZNAME:EDT",
    "DTSTART:19700308T020000",
    "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU",
    "END:DAYLIGHT",
    "BEGIN:STANDARD",
    "TZOFFSETFROM:-0400",
    "TZOFFSETTO:-0500",
    "TZNAME:EST",
    "DTSTART:19701101T020000",
    "RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU",
    "END:STANDARD",
    "END:VTIMEZONE",
]

# A clock time inside the free-text time field: "7:30 PM", "7:30p", "7pm", "10 a.m.", "19:30".
_TIME_TOKEN_RE = re.compile(r"(?<![\d:])(\d{1,2})(?::(\d{2}))?\s*(?:([ap])\.?\s?m?\.?)?(?!\w)", re.I)
_SUNSET_RE = re.compile(r"\b(sunset|sundown)\b", re.I)


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


def _parse_times(time_str: str) -> tuple[Optional[tuple[int, int]], Optional[tuple[int, int]], bool]:
    """Best-effort extract (start, end, until_sunset) from the free-text time field.

    start/end are (hour, minute) in 24h, or None. Times without am/pm borrow it from
    the other end of the range ("7:30 - 9:30pm"); a lone time with no am/pm is too
    ambiguous and is ignored. until_sunset is True for e.g. "10:00am - Sunset".
    """
    text = re.sub(r"\bnoon\b", "12:00pm", time_str or "", flags=re.I)

    toks: list[list] = []  # [hour, minute, meridiem ('a'|'p'|None), inherited]
    for match in _TIME_TOKEN_RE.finditer(text):
        h, m, ap = match.group(1), match.group(2) or "", match.group(3) or ""
        # A bare number is only a time when it opens a range ("11 - 1pm"), not "Room 7".
        if not m and not ap and not re.match(r"\s*(-|–|—|to\b)", text[match.end():]):
            continue
        h, mi = int(h), int(m or 0)
        if mi > 59 or h > 23 or (ap and not 1 <= h <= 12):
            continue
        toks.append([h, mi, ap.lower() or None, False])
        if len(toks) == 2:
            break

    if len(toks) == 2:
        a, b = toks
        if a[2] is None and b[2]:
            a[2], a[3] = b[2], True
        elif b[2] is None and a[2]:
            b[2], b[3] = a[2], True

    def to_24h(t: list) -> Optional[tuple[int, int]]:
        h, m, ap, _ = t
        if ap == "p" and h != 12:
            h += 12
        elif ap == "a" and h == 12:
            h = 0
        elif ap is None and h <= 12:
            return None  # "7:30" alone: morning or evening?
        return (h, m)

    start = to_24h(toks[0]) if toks else None
    end = to_24h(toks[1]) if len(toks) > 1 and start else None

    # A borrowed am/pm that puts the end before the start was the wrong guess:
    # "11 - 1pm" means 11am-1pm, "11:30am - 1:00" means 11:30am-1pm.
    if start and end and end <= start:
        if toks[0][3] and toks[0][2] == "p":
            start = (start[0] - 12, start[1])
        elif toks[1][3] and toks[1][2] == "a" and end[0] < 12:
            end = (end[0] + 12, end[1])

    until_sunset = bool(start and not end and _SUNSET_RE.search(time_str or ""))
    return start, end, until_sunset


def _eastern_utc_offset(d: date) -> int:
    """UTC offset in hours for US Eastern time on a date (-4 in DST, else -5)."""
    march_first = date(d.year, 3, 1)
    dst_start = march_first + timedelta(days=(6 - march_first.weekday()) % 7 + 7)  # 2nd Sunday
    nov_first = date(d.year, 11, 1)
    dst_end = nov_first + timedelta(days=(6 - nov_first.weekday()) % 7)  # 1st Sunday
    return -4 if dst_start <= d < dst_end else -5


def _sunset_local(d: date) -> tuple[int, int]:
    """Sunset (hour, minute) in church-local time on a date — standard sunrise equation."""
    n = d.toordinal() - date(2000, 1, 1).toordinal()
    j_star = n - _CHURCH_LON / 360.0
    m_anom = math.radians((357.5291 + 0.98560028 * j_star) % 360)
    center = 1.9148 * math.sin(m_anom) + 0.02 * math.sin(2 * m_anom) + 0.0003 * math.sin(3 * m_anom)
    ecl_lon = math.radians((math.degrees(m_anom) + center + 180 + 102.9372) % 360)
    j_transit = 2451545.0 + j_star + 0.0053 * math.sin(m_anom) - 0.0069 * math.sin(2 * ecl_lon)
    decl = math.asin(math.sin(ecl_lon) * math.sin(math.radians(23.4397)))
    lat = math.radians(_CHURCH_LAT)
    cos_w0 = (math.sin(math.radians(-0.833)) - math.sin(lat) * math.sin(decl)) / (math.cos(lat) * math.cos(decl))
    j_set = j_transit + math.degrees(math.acos(cos_w0)) / 360.0

    utc = datetime(1970, 1, 1) + timedelta(seconds=round((j_set - 2440587.5) * 86400))
    local = utc + timedelta(hours=_eastern_utc_offset(d))
    return (local.hour, local.minute)


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


def _parse_iso(value: Optional[str]) -> Optional[date]:
    return datetime.strptime(value, "%Y-%m-%d").date() if value else None


def _hhmm_tuple(value: Optional[str]) -> Optional[tuple[int, int]]:
    if not value:
        return None
    h, m = value.split(":")
    return (int(h), int(m))


def _event_times(ev: dict) -> tuple[Optional[tuple[int, int]], Optional[tuple[int, int]], bool]:
    """(start, end, until_sunset) from the structured fields, else parsed from the label."""
    if ev.get("allDay"):
        return None, None, False
    start = _hhmm_tuple(ev.get("startTime"))
    if start:
        end = _hhmm_tuple(ev.get("endTime"))
        return start, end, bool(ev.get("endsAtSunset")) and not end
    return _parse_times(ev.get("time", ""))


def _nth_weekday(year: int, month: int, dow: int, n: int) -> date:
    """The nth (1-4) or last (-1) given weekday of a month."""
    if n == -1:
        return _last_weekday_of_month(year, month, dow)
    first = date(year, month, 1)
    return first + timedelta(days=(dow - _our_dow(first)) % 7 + 7 * (n - 1))


def _add_months(year: int, month: int, k: int) -> tuple[int, int]:
    total = year * 12 + (month - 1) + k
    return total // 12, total % 12 + 1


def _first_occurrence(rec: dict) -> Optional[date]:
    """First date of a repeating series (its DTSTART).

    Mirrors firstOccurrence() in frontend/src/utils/eventSchedule.ts — keep in sync.
    """
    start = _parse_iso(rec.get("startDate"))
    today = date.today()
    freq, dow = rec.get("freq"), rec.get("dayOfWeek")
    if freq == "weekly":
        return _first_on_or_after(start or date(today.year, 1, 1), dow)
    if freq == "monthly":
        base = start or date(today.year, today.month, 1)
        for k in range(24):
            y, m = _add_months(base.year, base.month, k)
            d = _nth_weekday(y, m, dow, rec.get("weekOfMonth") or -1)
            if d >= base:
                return d
        return None
    if freq == "yearly":
        return start
    return None


def _until(end: date, all_day: bool) -> str:
    """RRULE UNTIL for an inclusive end date (UTC when the series has a TZID start)."""
    if all_day:
        return f"{end:%Y%m%d}"
    local = datetime(end.year, end.month, end.day, 23, 59, 59)
    return f"{local - timedelta(hours=_eastern_utc_offset(end)):%Y%m%dT%H%M%SZ}"


def _rrule(rec: dict, all_day: bool) -> str:
    freq = rec["freq"]
    parts = [f"FREQ={freq.upper()}"]
    if (rec.get("interval") or 1) > 1:
        parts.append(f"INTERVAL={rec['interval']}")
    if freq == "weekly":
        parts.append(f"BYDAY={_BYDAY[rec['dayOfWeek']]}")
    elif freq == "monthly":
        parts.append(f"BYDAY={rec.get('weekOfMonth') or -1}{_BYDAY[rec['dayOfWeek']]}")
    end = _parse_iso(rec.get("endDate"))
    if end:
        parts.append(f"UNTIL={_until(end, all_day)}")
    return "RRULE:" + ";".join(parts)


def _vevent_lines(ev: dict, dtstamp: str) -> list[str]:
    """Build the VEVENT body lines for one stored event, or [] if unschedulable."""
    start_t, end_t, until_sunset = _event_times(ev)
    uid = f"hollywood-event-{ev['id']}@church"

    def timed(d: date, sunset_ref: Optional[date] = None) -> tuple[str, str]:
        sh, sm = start_t
        dtstart = f"{d:%Y%m%d}T{sh:02d}{sm:02d}00"
        end = end_t
        if not end and until_sunset:
            sunset = _sunset_local(sunset_ref or d)
            if sunset > (sh, sm):
                end = sunset
        if end:
            eh, em = end
            # If the end clock time is earlier than start, assume it rolls to next day.
            end_date = d + timedelta(days=1) if (eh, em) <= (sh, sm) else d
            dtend = f"{end_date:%Y%m%d}T{eh:02d}{em:02d}00"
        else:
            # Default 1-hour duration when only a start time is known.
            end_dt = datetime(d.year, d.month, d.day, sh, sm) + timedelta(hours=1)
            dtend = f"{end_dt:%Y%m%dT%H%M%S}"
        return f"DTSTART;TZID={CHURCH_TZ}:{dtstart}", f"DTEND;TZID={CHURCH_TZ}:{dtend}"

    def all_day(d: date, days: int = 1) -> tuple[str, str]:
        return (
            f"DTSTART;VALUE=DATE:{d:%Y%m%d}",
            f"DTEND;VALUE=DATE:{(d + timedelta(days=days)):%Y%m%d}",
        )

    dt_lines: list[str] = []
    rrule: Optional[str] = None
    exdates: list[str] = []

    if ev.get("date"):
        d = _parse_iso(ev["date"])
        dt_lines = list(timed(d) if start_t else all_day(d))
    elif ev.get("dateRange"):
        start = _parse_iso(ev["dateRange"]["start"])
        end = _parse_iso(ev["dateRange"]["end"])
        if start_t:
            # Timed multi-day event: the same hours each day through the end date.
            dt_lines = list(timed(start))
            rrule = f"RRULE:FREQ=DAILY;UNTIL={_until(end, all_day=False)}"
        else:
            # All-day span (DTEND is exclusive).
            dt_lines = list(all_day(start, days=(end - start).days + 1))
    elif ev.get("recurrence"):
        rec = ev["recurrence"]
        if rec.get("freq") in ("weekly", "monthly") and rec.get("dayOfWeek") is None:
            return []
        first = _first_occurrence(rec)
        last = _parse_iso(rec.get("endDate"))
        if first is None or (last and first > last):
            return []
        # One RRULE shares a single end time, so a recurring "until sunset" uses
        # today's sunset; subscribers re-fetch the feed, so it tracks the season.
        dt_lines = list(timed(first, sunset_ref=date.today()) if start_t else all_day(first))
        rrule = _rrule(rec, all_day=not start_t)
        skipped = sorted(_parse_iso(d) for d in rec.get("exceptions") or [])
        if skipped and start_t:
            sh, sm = start_t
            exdates.append(f"EXDATE;TZID={CHURCH_TZ}:" + ",".join(f"{d:%Y%m%d}T{sh:02d}{sm:02d}00" for d in skipped))
        elif skipped:
            exdates.append("EXDATE;VALUE=DATE:" + ",".join(f"{d:%Y%m%d}" for d in skipped))
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
    lines.extend(exdates)
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
        f"X-WR-TIMEZONE:{CHURCH_TZ}",
        *_VTIMEZONE,
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


# ─── Event image upload (admin) + serving (public) ────────────────────────────

_IMAGE_EXTS = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}
_MAX_IMAGE_BYTES = 10 * 1024 * 1024  # 10 MB


@router.post("/upload-image", dependencies=[Depends(require_admin)])
async def upload_image(file: UploadFile = File(...)) -> dict:
    """Store an uploaded event image on the data volume and return its URL."""
    ext = _IMAGE_EXTS.get(file.content_type or "")
    if not ext:
        raise HTTPException(status_code=400, detail="Unsupported image type — use JPG, PNG, WEBP, or GIF.")
    data = await file.read()
    if len(data) > _MAX_IMAGE_BYTES:
        raise HTTPException(status_code=400, detail="Image too large (max 10 MB).")

    images_dir = DATA_DIR / "images"
    images_dir.mkdir(parents=True, exist_ok=True)
    name = f"{secrets.token_hex(8)}{ext}"
    (images_dir / name).write_bytes(data)
    return {"url": f"/api/events/image/{name}"}


@router.get("/image/{name}")
def get_image(name: str) -> FileResponse:
    """Serve a previously uploaded event image (public)."""
    safe = os.path.basename(name)  # guard against path traversal
    path = DATA_DIR / "images" / safe
    if not path.exists():
        raise HTTPException(status_code=404, detail="Image not found.")
    return FileResponse(str(path))


# ─── Flyer parsing (admin, AI vision) ─────────────────────────────────────────

class FlyerRequest(BaseModel):
    image_base64: str
    media_type: str  # e.g. "image/jpeg", "image/png", "image/webp"


class ParsedFlyer(BaseModel):
    title: str = ""
    date: Optional[str] = None  # YYYY-MM-DD
    time: str = ""
    location: str = ""
    description: str = ""


_FLYER_PROMPT = (
    "You are extracting event details from a church event flyer image. "
    "Today's date is {today}. Return ONLY a JSON object (no prose, no code fences) "
    "with exactly these keys: title, date, time, location, description.\n"
    "- title: the event name.\n"
    "- date: the single event date as YYYY-MM-DD. If the flyer shows a date with no year, "
    "pick the nearest FUTURE occurrence relative to today. If no date is shown, use null.\n"
    "- time: the time exactly as shown (e.g. '7:00 PM' or '10:00 AM - Sunset'), or an empty string.\n"
    "- location: the venue or address, or an empty string.\n"
    "- description: a concise one or two sentence summary, or an empty string."
)


@router.post("/parse-flyer", dependencies=[Depends(require_admin)])
def parse_flyer(body: FlyerRequest) -> ParsedFlyer:
    """Extract event fields from an uploaded flyer image using Claude vision."""
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY is not configured on the server.")

    model = os.environ.get("FLYER_MODEL", "claude-sonnet-5")
    prompt = _FLYER_PROMPT.format(today=date.today().isoformat())

    payload = {
        "model": model,
        "max_tokens": 1024,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": body.media_type,
                            "data": body.image_base64,
                        },
                    },
                    {"type": "text", "text": prompt},
                ],
            }
        ],
    }

    try:
        resp = httpx.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json=payload,
            timeout=60.0,
        )
    except Exception as e:
        print(f"Flyer parse request failed: {e}")
        raise HTTPException(status_code=502, detail="Could not reach the AI service.")

    if resp.status_code != 200:
        print(f"Anthropic API error {resp.status_code}: {resp.text[:500]}")
        detail = "The AI service returned an error."
        try:
            msg = resp.json().get("error", {}).get("message")
            if msg:
                detail = f"AI service error ({resp.status_code}): {msg}"
        except Exception:
            pass
        raise HTTPException(status_code=502, detail=detail)

    try:
        text = resp.json()["content"][0]["text"].strip()
        # Strip accidental code fences.
        if text.startswith("```"):
            text = text.strip("`")
            text = text[text.find("{"): text.rfind("}") + 1]
        data = json.loads(text)
    except Exception as e:
        print(f"Failed to parse AI response: {e}")
        raise HTTPException(status_code=502, detail="Could not read event details from the flyer.")

    return ParsedFlyer(
        title=(data.get("title") or "").strip(),
        date=(data.get("date") or None),
        time=(data.get("time") or "").strip(),
        location=(data.get("location") or "").strip(),
        description=(data.get("description") or "").strip(),
    )
