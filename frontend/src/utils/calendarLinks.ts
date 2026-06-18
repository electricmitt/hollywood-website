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

type HM = { h: number; m: number };

const TIME_RE = /(\d{1,2}):(\d{2})\s*([AaPp][Mm])/g;

/** Best-effort parse of start/end clock times from the free-text time field. */
function parseTimes(time: string): { start?: HM; end?: HM } {
  const matches = [...(time ?? "").matchAll(TIME_RE)];
  const to24h = (h: number, m: number, ampm: string): HM => {
    const lower = ampm.toLowerCase();
    if (lower === "pm" && h !== 12) h += 12;
    else if (lower === "am" && h === 12) h = 0;
    return { h: h % 24, m: m % 60 };
  };
  const start = matches[0] ? to24h(+matches[0][1], +matches[0][2], matches[0][3]) : undefined;
  const end = matches[1] ? to24h(+matches[1][1], +matches[1][2], matches[1][3]) : undefined;
  return { start, end };
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Returns the start/end instants for an event on a given day. */
function resolveRange(ev: CalendarEventInput, day: Date): { start: Date; end: Date; allDay: boolean } {
  const { start, end } = parseTimes(ev.time);
  if (!start) {
    // No parseable time → treat as an all-day event.
    const s = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    const e = new Date(s);
    e.setDate(e.getDate() + 1);
    return { start: s, end: e, allDay: true };
  }
  const s = new Date(day.getFullYear(), day.getMonth(), day.getDate(), start.h, start.m);
  let e: Date;
  if (end) {
    e = new Date(day.getFullYear(), day.getMonth(), day.getDate(), end.h, end.m);
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
  const stamp = fmtLocal(new Date());
  const dtLines = allDay
    ? [`DTSTART;VALUE=DATE:${fmtDate(start)}`, `DTEND;VALUE=DATE:${fmtDate(end)}`]
    : [`DTSTART:${fmtLocal(start)}`, `DTEND:${fmtLocal(end)}`];

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Hollywood Church//Events//EN",
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
