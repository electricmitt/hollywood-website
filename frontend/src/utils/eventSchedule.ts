// When church events happen: reading times, repeat rules, finding occurrences,
// and describing schedules in words.
//
// The repeat logic mirrors the subscription feed in
// backend/app/apis/events_manager (_first_occurrence / _rrule) — keep them in sync.

export type HM = { h: number; m: number };
export type Freq = "weekly" | "monthly" | "yearly";

export interface Recurrence {
  freq?: string | null;
  interval?: number | null;
  dayOfWeek?: number | null;   // 0=Sun … 6=Sat
  weekOfMonth?: number | null; // monthly: 1-4, or -1 for the last one
  startDate?: string | null;   // YYYY-MM-DD
  endDate?: string | null;     // YYYY-MM-DD, inclusive
  exceptions?: string[] | null; // skipped dates
  /** Older shape: "weekly" | "monthly-last". */
  type?: string | null;
}

export interface SchedulableEvent {
  date?: string | null;
  dateRange?: { start: string; end: string } | null;
  recurrence?: Recurrence | null;
  startTime?: string | null; // "HH:MM" 24h, church-local
  endTime?: string | null;
  endsAtSunset?: boolean | null;
  allDay?: boolean | null;
  time?: string | null; // display label; parsed when there are no structured times
}

interface NormalRecurrence {
  freq: Freq | null;
  interval: number;
  dayOfWeek: number | null;
  weekOfMonth: number;
  startDate: string | null;
  endDate: string | null;
  exceptions: string[];
}

export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const WEEK_OF_MONTH_LABELS: Record<number, string> = { 1: "First", 2: "Second", 3: "Third", 4: "Fourth", [-1]: "Last" };

// ─── Dates ──────────────────────────────────────────────────────────────────

const DAY_MS = 86400000;

/** Parse a YYYY-MM-DD string as a local date (no timezone shift). */
export function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

/** Whole days from a to b (DST-safe). */
function daysBetween(a: Date, b: Date): number {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / DAY_MS);
}

function firstOnOrAfter(d: Date, dow: number): Date {
  return addDays(startOfDay(d), (dow - d.getDay() + 7) % 7);
}

/** The nth (1-4) or last (-1) given weekday of a month (month may overflow). */
export function nthWeekday(year: number, month: number, dow: number, n: number): Date {
  if (n === -1) {
    const last = new Date(year, month + 1, 0);
    return addDays(last, -((last.getDay() - dow + 7) % 7));
  }
  const first = new Date(year, month, 1);
  return addDays(first, ((dow - first.getDay() + 7) % 7) + 7 * (n - 1));
}

const shortDate = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

// ─── Repeat rules ─────────────────────────────────────────────────────────────

/** Accept both the current and the older {type, dayOfWeek} repeat shapes. */
export function normalizeRecurrence(r: Recurrence): NormalRecurrence {
  let freq = r.freq;
  let weekOfMonth = r.weekOfMonth ?? null;
  if (!freq && r.type === "weekly") freq = "weekly";
  if (!freq && r.type === "monthly-last") {
    freq = "monthly";
    weekOfMonth = -1;
  }
  return {
    freq: freq === "weekly" || freq === "monthly" || freq === "yearly" ? freq : null,
    interval: Math.max(1, r.interval ?? 1),
    dayOfWeek: r.dayOfWeek ?? null,
    weekOfMonth: weekOfMonth ?? -1,
    startDate: r.startDate || null,
    endDate: r.endDate || null,
    exceptions: r.exceptions ?? [],
  };
}

/** First date of a repeating series. Mirrors _first_occurrence() in the backend. */
export function firstOccurrence(r: NormalRecurrence, today: Date = new Date()): Date | null {
  const start = r.startDate ? parseLocalDate(r.startDate) : null;
  if (r.freq === "weekly" && r.dayOfWeek != null) {
    return firstOnOrAfter(start ?? new Date(today.getFullYear(), 0, 1), r.dayOfWeek);
  }
  if (r.freq === "monthly" && r.dayOfWeek != null) {
    const base = start ?? new Date(today.getFullYear(), today.getMonth(), 1);
    for (let k = 0; k < 24; k++) {
      const d = nthWeekday(base.getFullYear(), base.getMonth() + k, r.dayOfWeek, r.weekOfMonth);
      if (d >= base) return d;
    }
    return null;
  }
  if (r.freq === "yearly") return start;
  return null;
}

/** Does the event happen on this calendar day? */
export function occursOn(ev: SchedulableEvent, day: Date): boolean {
  const d = startOfDay(day);
  if (ev.date) return sameDay(parseLocalDate(ev.date), d);
  if (ev.dateRange) return d >= parseLocalDate(ev.dateRange.start) && d <= parseLocalDate(ev.dateRange.end);
  if (!ev.recurrence) return false;

  const r = normalizeRecurrence(ev.recurrence);
  if (!r.freq) return false;
  const iso = toIsoDate(d);
  if (r.exceptions.includes(iso)) return false;
  if (r.startDate && iso < r.startDate) return false;
  if (r.endDate && iso > r.endDate) return false;

  if (r.freq === "weekly") {
    if (r.dayOfWeek == null || d.getDay() !== r.dayOfWeek) return false;
    if (r.interval === 1) return true;
    const first = firstOccurrence(r);
    if (!first) return false;
    const diff = daysBetween(first, d);
    return diff >= 0 && (diff / 7) % r.interval === 0;
  }

  if (r.freq === "monthly") {
    if (r.dayOfWeek == null) return false;
    if (!sameDay(nthWeekday(d.getFullYear(), d.getMonth(), r.dayOfWeek, r.weekOfMonth), d)) return false;
    if (r.interval === 1) return true;
    const first = firstOccurrence(r);
    if (!first) return false;
    const months = (d.getFullYear() - first.getFullYear()) * 12 + (d.getMonth() - first.getMonth());
    return months >= 0 && months % r.interval === 0;
  }

  // yearly: same month and day as the start date, every `interval` years
  const start = r.startDate ? parseLocalDate(r.startDate) : null;
  if (!start || d.getMonth() !== start.getMonth() || d.getDate() !== start.getDate()) return false;
  const years = d.getFullYear() - start.getFullYear();
  return years >= 0 && years % r.interval === 0;
}

/** The next day (from `from`, inclusive) the event happens, or null if it's over. */
export function nextOccurrence(ev: SchedulableEvent, from: Date = new Date()): Date | null {
  const start = startOfDay(from);
  if (ev.date) {
    const d = parseLocalDate(ev.date);
    return d >= start ? d : null;
  }
  if (ev.dateRange) {
    const s = parseLocalDate(ev.dateRange.start);
    if (parseLocalDate(ev.dateRange.end) < start) return null;
    return s > start ? s : start;
  }
  if (!ev.recurrence) return null;
  const r = normalizeRecurrence(ev.recurrence);
  if (!r.freq || (r.endDate && r.endDate < toIsoDate(start))) return null;
  const horizon = 366 * r.interval + 31;
  for (let i = 0; i <= horizon; i++) {
    const d = addDays(start, i);
    if (occursOn(ev, d)) return d;
  }
  return null;
}

/** A sensible single date to act on (next occurrence, else the event's own date). */
export function linkOccurrence(ev: SchedulableEvent): Date {
  return (
    nextOccurrence(ev) ??
    (ev.date ? parseLocalDate(ev.date) : ev.dateRange ? parseLocalDate(ev.dateRange.start) : startOfDay(new Date()))
  );
}

/** Human-readable schedule, e.g. "Every other Tuesday" or "First Saturday of every month". */
export function describeSchedule(ev: SchedulableEvent): string {
  if (ev.date) {
    return parseLocalDate(ev.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  }
  if (ev.dateRange) return `${shortDate(parseLocalDate(ev.dateRange.start))} – ${shortDate(parseLocalDate(ev.dateRange.end))}`;
  if (!ev.recurrence) return "";

  const r = normalizeRecurrence(ev.recurrence);
  const day = r.dayOfWeek != null ? DAY_NAMES[r.dayOfWeek] : "";
  const every = (unit: string, units: string) =>
    r.interval === 1 ? `every ${unit}` : r.interval === 2 ? `every other ${unit}` : `every ${r.interval} ${units}`;

  let text = "";
  if (r.freq === "weekly" && day) {
    text = r.interval === 1 ? `Every ${day}` : r.interval === 2 ? `Every other ${day}` : `Every ${r.interval} weeks on ${day}`;
  } else if (r.freq === "monthly" && day) {
    text = `${WEEK_OF_MONTH_LABELS[r.weekOfMonth] ?? "Last"} ${day} of ${every("month", "months")}`;
  } else if (r.freq === "yearly" && r.startDate) {
    const md = parseLocalDate(r.startDate).toLocaleDateString("en-US", { month: "long", day: "numeric" });
    text = `${every("year", "years").replace(/^e/, "E")} on ${md}`;
  }
  if (!text) return "";

  const today = startOfDay(new Date());
  if (r.freq !== "yearly" && r.startDate && parseLocalDate(r.startDate) > today) {
    text += `, starting ${shortDate(parseLocalDate(r.startDate))}`;
  }
  if (r.endDate) text += `, until ${shortDate(parseLocalDate(r.endDate))}`;
  return text;
}

// ─── Times ────────────────────────────────────────────────────────────────────

// A clock time in the free-text time field: "7:30 PM", "7:30p", "7pm", "10 a.m.", "19:30".
// The leading group stands in for a lookbehind, which older Safari can't parse.
const TIME_TOKEN_RE = /(^|[^\d:])(\d{1,2})(?::(\d{2}))?\s*(?:([ap])\.?\s?m?\.?)?(?!\w)/gi;
const SUNSET_RE = /\b(sunset|sundown)\b/i;

type Meridiem = "a" | "p" | null;
type TimeToken = { h: number; m: number; ap: Meridiem; inherited: boolean };

/**
 * Best-effort parse of a free-text time label. Times without am/pm borrow it from
 * the other end of the range ("7:30 - 9:30pm"); a lone time with no am/pm is too
 * ambiguous and is ignored. untilSunset is true for e.g. "10:00am - Sunset".
 * Mirrors _parse_times() in the backend.
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

/** "19:30" → {h: 19, m: 30}. */
export function hmFromString(value?: string | null): HM | undefined {
  const m = /^(\d{2}):(\d{2})$/.exec(value ?? "");
  return m ? { h: Number(m[1]), m: Number(m[2]) } : undefined;
}

export const hmToString = (t: HM) => `${String(t.h).padStart(2, "0")}:${String(t.m).padStart(2, "0")}`;

/** {h: 19, m: 30} → "7:30 PM". */
export function formatClock(t: HM): string {
  return `${t.h % 12 || 12}:${String(t.m).padStart(2, "0")} ${t.h < 12 ? "AM" : "PM"}`;
}

/** Start/end clock times, from the structured fields or else parsed from the label. */
export function eventClock(ev: SchedulableEvent): { start?: HM; end?: HM; untilSunset: boolean } {
  if (ev.allDay) return { untilSunset: false };
  const start = hmFromString(ev.startTime);
  if (start) {
    const end = hmFromString(ev.endTime);
    return { start, end, untilSunset: !!ev.endsAtSunset && !end };
  }
  return parseTimes(ev.time ?? "");
}

/** Display time, e.g. "7:30 PM – 9:30 PM", "10:00 AM – Sunset", "All day". */
export function timeLabel(ev: SchedulableEvent): string {
  if (ev.allDay) return "All day";
  const start = hmFromString(ev.startTime);
  if (!start) return ev.time ?? "";
  const end = hmFromString(ev.endTime);
  if (end) return `${formatClock(start)} – ${formatClock(end)}`;
  return ev.endsAtSunset ? `${formatClock(start)} – Sunset` : formatClock(start);
}

/** Minutes after midnight the event starts, for sorting (-1 = all day / unknown). */
export function startMinutes(ev: SchedulableEvent): number {
  const { start } = eventClock(ev);
  return start ? start.h * 60 + start.m : -1;
}
