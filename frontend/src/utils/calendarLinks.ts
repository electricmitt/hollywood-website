// Helpers for letting visitors add a single event occurrence to their own
// calendar — either via a Google Calendar "add event" link or a downloadable
// .ics file that Apple Calendar / Outlook understand.

import { API_HOST, API_PATH } from "../constants";

/** Base URL of the backend API, mirroring the apiClient's own resolution. */
function apiBase(): string {
  if (typeof window !== "undefined" && window.location.origin.includes("localhost")) {
    return `${window.location.origin}${API_PATH}`;
  }
  return `${API_HOST}${API_PATH}`;
}

/** Build a URL to a backend API path (mirrors the apiClient's base resolution). */
export function apiUrl(path: string): string {
  return `${apiBase()}${path}`;
}

/** Public https URL of the live iCal subscription feed. */
export function subscriptionFeedUrl(): string {
  return `${apiBase()}/events/calendar.ics`;
}

/** webcal:// form of the feed — clicking it opens the user's calendar app to subscribe. */
export function subscriptionFeedWebcal(): string {
  return subscriptionFeedUrl().replace(/^https?:\/\//, "webcal://");
}

export interface CalendarEventInput {
  title: string;
  /** Free-text time field, e.g. "11:00 AM - 12:30 PM" or "11:00 AM - Sunset". */
  time: string;
  location?: string;
  description?: string;
}

/** Schedule fields shared by the API contract and the calendar's event type. */
export interface ScheduleLike {
  date?: string | null;
  dateRange?: { start: string; end: string } | null;
  recurrence?: { type: string; dayOfWeek?: number | null } | null;
}

const DAY_NAMES_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** Parse a YYYY-MM-DD string as a local date (no timezone shift). */
function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Human-readable schedule, e.g. "Every Sunday" or "2026-04-13 – 2026-04-20". */
export function formatSchedule(ev: ScheduleLike): string {
  const dow = ev.recurrence?.dayOfWeek;
  if (ev.recurrence?.type === "weekly" && dow != null) return `Every ${DAY_NAMES_FULL[dow]}`;
  if (ev.recurrence?.type === "monthly-last" && dow != null) return `Last ${DAY_NAMES_FULL[dow]} of each month`;
  if (ev.dateRange) return `${ev.dateRange.start} – ${ev.dateRange.end}`;
  if (ev.date) return ev.date;
  return "";
}

function firstOnOrAfter(d: Date, dow: number): Date {
  const out = new Date(d);
  for (let i = 0; i < 7; i++) {
    if (out.getDay() === dow) return out;
    out.setDate(out.getDate() + 1);
  }
  return out;
}

function lastWeekdayOfMonth(year: number, month: number, dow: number): Date {
  const last = new Date(year, month + 1, 0); // last day of `month`
  while (last.getDay() !== dow) last.setDate(last.getDate() - 1);
  return last;
}

/** The next (or current) occurrence date for an event, for "add to calendar". */
export function nextOccurrence(ev: ScheduleLike): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (ev.date) return parseLocalDate(ev.date);
  if (ev.dateRange) return parseLocalDate(ev.dateRange.start);
  const dow = ev.recurrence?.dayOfWeek;
  if (ev.recurrence?.type === "weekly" && dow != null) return firstOnOrAfter(today, dow);
  if (ev.recurrence?.type === "monthly-last" && dow != null) {
    const thisMonth = lastWeekdayOfMonth(today.getFullYear(), today.getMonth(), dow);
    if (thisMonth >= today) return thisMonth;
    return lastWeekdayOfMonth(today.getFullYear(), today.getMonth() + 1, dow);
  }
  return today;
}

type HM = { h: number; m: number };

// The church is in West Park, FL — all event times are Eastern.
// (Mirrors the time handling in backend/app/apis/events_manager.)
const CHURCH_TZ = "America/New_York";
const CHURCH_LAT = 25.99;
const CHURCH_LON = -80.21;

// RFC 5545 definition of US Eastern time (DST: 2nd Sunday of March to 1st Sunday of November).
const VTIMEZONE = [
  "BEGIN:VTIMEZONE",
  `TZID:${CHURCH_TZ}`,
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
];

// A clock time in the free-text time field: "7:30 PM", "7:30p", "7pm", "10 a.m.", "19:30".
// The leading group stands in for a lookbehind, which older Safari can't parse.
const TIME_TOKEN_RE = /(^|[^\d:])(\d{1,2})(?::(\d{2}))?\s*(?:([ap])\.?\s?m?\.?)?(?!\w)/gi;
const SUNSET_RE = /\b(sunset|sundown)\b/i;

type Meridiem = "a" | "p" | null;
type TimeToken = { h: number; m: number; ap: Meridiem; inherited: boolean };

/**
 * Best-effort parse of the free-text time field. Times without am/pm borrow it from
 * the other end of the range ("7:30 - 9:30pm"); a lone time with no am/pm is too
 * ambiguous and is ignored. untilSunset is true for e.g. "10:00am - Sunset".
 */
export function parseTimes(time: string): { start?: HM; end?: HM; untilSunset: boolean } {
  const text = (time ?? "").replace(/\bnoon\b/gi, "12:00pm");

  const toks: TimeToken[] = [];
  for (const match of text.matchAll(TIME_TOKEN_RE)) {
    const [whole, , hs, ms = "", apRaw = ""] = match;
    const after = text.slice((match.index ?? 0) + whole.length);
    // A bare number is only a time when it opens a range ("11 - 1pm"), not "Room 7".
    if (!ms && !apRaw && !/^\s*(-|–|—|to\b)/.test(after)) continue;
    const h = Number(hs);
    const m = Number(ms || 0);
    const ap = (apRaw.toLowerCase() || null) as Meridiem;
    if (m > 59 || h > 23 || (ap && (h < 1 || h > 12))) continue;
    toks.push({ h, m, ap, inherited: false });
    if (toks.length === 2) break;
  }

  if (toks.length === 2) {
    const [a, b] = toks;
    if (!a.ap && b.ap) Object.assign(a, { ap: b.ap, inherited: true });
    else if (!b.ap && a.ap) Object.assign(b, { ap: a.ap, inherited: true });
  }

  const to24h = (t: TimeToken): HM | undefined => {
    let h = t.h;
    if (t.ap === "p" && h !== 12) h += 12;
    else if (t.ap === "a" && h === 12) h = 0;
    else if (!t.ap && h <= 12) return undefined; // "7:30" alone: morning or evening?
    return { h, m: t.m };
  };

  let start = toks[0] ? to24h(toks[0]) : undefined;
  let end = toks[1] && start ? to24h(toks[1]) : undefined;

  // A borrowed am/pm that puts the end before the start was the wrong guess:
  // "11 - 1pm" means 11am-1pm, "11:30am - 1:00" means 11:30am-1pm.
  const mins = (x: HM) => x.h * 60 + x.m;
  if (start && end && mins(end) <= mins(start)) {
    if (toks[0].inherited && toks[0].ap === "p") start = { h: start.h - 12, m: start.m };
    else if (toks[1].inherited && toks[1].ap === "a" && end.h < 12) end = { h: end.h + 12, m: end.m };
  }

  const untilSunset = !!start && !end && SUNSET_RE.test(time ?? "");
  return { start, end, untilSunset };
}

/** UTC offset in hours for US Eastern time on a calendar date (-4 in DST, else -5). */
function easternUtcOffset(y: number, month: number, d: number): number {
  const nthSunday = (mo: number, n: number) => {
    const firstDow = new Date(Date.UTC(y, mo, 1)).getUTCDay();
    return Date.UTC(y, mo, 1 + ((7 - firstDow) % 7) + 7 * (n - 1));
  };
  const day = Date.UTC(y, month, d);
  return day >= nthSunday(2, 2) && day < nthSunday(10, 1) ? -4 : -5;
}

/** Sunset in church-local time on a date — standard sunrise equation. */
function sunsetLocal(day: Date): HM {
  const y = day.getFullYear();
  const mo = day.getMonth();
  const d = day.getDate();
  const rad = Math.PI / 180;
  const n = Math.round((Date.UTC(y, mo, d) - Date.UTC(2000, 0, 1)) / 86400000);
  const jStar = n - CHURCH_LON / 360;
  const mAnom = ((357.5291 + 0.98560028 * jStar) % 360) * rad;
  const center = 1.9148 * Math.sin(mAnom) + 0.02 * Math.sin(2 * mAnom) + 0.0003 * Math.sin(3 * mAnom);
  const eclLon = ((mAnom / rad + center + 180 + 102.9372) % 360) * rad;
  const jTransit = 2451545 + jStar + 0.0053 * Math.sin(mAnom) - 0.0069 * Math.sin(2 * eclLon);
  const decl = Math.asin(Math.sin(eclLon) * Math.sin(23.4397 * rad));
  const lat = CHURCH_LAT * rad;
  const cosW0 = (Math.sin(-0.833 * rad) - Math.sin(lat) * Math.sin(decl)) / (Math.cos(lat) * Math.cos(decl));
  const jSet = jTransit + Math.acos(cosW0) / rad / 360;

  const utcMs = Math.round((jSet - 2440587.5) * 86400) * 1000;
  const local = new Date(utcMs + easternUtcOffset(y, mo, d) * 3600000);
  return { h: local.getUTCHours(), m: local.getUTCMinutes() };
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Returns the start/end wall-clock times (church-local) for an event on a given day. */
function resolveRange(ev: CalendarEventInput, day: Date): { start: Date; end: Date; allDay: boolean } {
  const { start, end, untilSunset } = parseTimes(ev.time);
  if (!start) {
    // No parseable time → treat as an all-day event.
    const s = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    const e = new Date(s);
    e.setDate(e.getDate() + 1);
    return { start: s, end: e, allDay: true };
  }
  const s = new Date(day.getFullYear(), day.getMonth(), day.getDate(), start.h, start.m);
  let endHM = end;
  if (!endHM && untilSunset) {
    const sunset = sunsetLocal(day);
    if (sunset.h * 60 + sunset.m > start.h * 60 + start.m) endHM = sunset;
  }
  let e: Date;
  if (endHM) {
    e = new Date(day.getFullYear(), day.getMonth(), day.getDate(), endHM.h, endHM.m);
    // End earlier than start → assume it rolls into the next day.
    if (e <= s) e.setDate(e.getDate() + 1);
  } else {
    e = new Date(s.getTime() + 60 * 60 * 1000); // default 1 hour
  }
  return { start: s, end: e, allDay: false };
}

/** Local floating timestamp: YYYYMMDDTHHMMSS (no timezone marker). */
function fmtLocal(d: Date): string {
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `T${pad(d.getHours())}${pad(d.getMinutes())}00`
  );
}

/** Date-only stamp: YYYYMMDD. */
function fmtDate(d: Date): string {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

/** Build a Google Calendar "create event" URL for one occurrence. */
export function googleCalendarUrl(ev: CalendarEventInput, day: Date): string {
  const { start, end, allDay } = resolveRange(ev, day);
  const dates = allDay
    ? `${fmtDate(start)}/${fmtDate(end)}`
    : `${fmtLocal(start)}/${fmtLocal(end)}`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: ev.title,
    dates,
    details: ev.description ?? "",
    location: ev.location ?? "",
  });
  // Times are church-local; without ctz Google would read them in the viewer's zone.
  if (!allDay) params.set("ctz", CHURCH_TZ);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function escapeIcs(text: string): string {
  return (text ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Build a one-event .ics document for a single occurrence. */
export function buildEventIcs(ev: CalendarEventInput, day: Date): string {
  const { start, end, allDay } = resolveRange(ev, day);
  const uid = `${fmtDate(start)}-${Math.random().toString(36).slice(2, 8)}@hollywood-church`;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""); // UTC, per RFC 5545
  const dtLines = allDay
    ? [`DTSTART;VALUE=DATE:${fmtDate(start)}`, `DTEND;VALUE=DATE:${fmtDate(end)}`]
    : [`DTSTART;TZID=${CHURCH_TZ}:${fmtLocal(start)}`, `DTEND;TZID=${CHURCH_TZ}:${fmtLocal(end)}`];

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Hollywood Church//Events//EN",
    ...(allDay ? [] : VTIMEZONE),
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    ...dtLines,
    `SUMMARY:${escapeIcs(ev.title)}`,
    ...(ev.location ? [`LOCATION:${escapeIcs(ev.location)}`] : []),
    ...(ev.description ? [`DESCRIPTION:${escapeIcs(ev.description)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n") + "\r\n";
}

/** Trigger a browser download of a one-event .ics file. */
export function downloadEventIcs(ev: CalendarEventInput, day: Date): void {
  const ics = buildEventIcs(ev, day);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${ev.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "event"}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
