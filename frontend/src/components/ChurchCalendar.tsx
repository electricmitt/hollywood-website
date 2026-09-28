import { useState, useMemo, type KeyboardEvent } from "react";
import { ChevronLeft, ChevronRight, MapPin, Clock, Pencil, Trash2, CalendarPlus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { occursOn, sameDay, startMinutes, startOfDay, timeLabel } from "utils/eventSchedule";
import type { ChurchEvent } from "../apiclient/data-contracts";

export type { ChurchEvent };

type ViewMode = "day" | "week" | "month" | "year";

interface Props {
  events: ChurchEvent[];
  onEdit?: (event: ChurchEvent) => void;
  onDelete?: (id: number) => void;
  /** Open the shared detail dialog for an event on a specific day. */
  onViewDetails?: (event: ChurchEvent, occurrenceDate: Date) => void;
  /** Admin: start a new event on the given day. */
  onAddOnDate?: (day: Date) => void;
}

// ─── Constants & helpers ───────────────────────────────────────────────────────

const DAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const EVENT_COLORS = [
  "bg-indigo-500", "bg-purple-500", "bg-amber-500",
  "bg-emerald-500", "bg-rose-500", "bg-sky-500",
];

function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function startOfWeek(d: Date) { return addDays(d, -d.getDay()); }

// ─── Component ───────────────────────────────────────────────────────────────

export function ChurchCalendar({ events, onEdit, onDelete, onViewDetails, onAddOnDate }: Props) {
  const today = startOfDay(new Date());
  const [view, setView] = useState<ViewMode>("month");
  const [cursor, setCursor] = useState<Date>(today);

  const eventColors = useMemo(() => {
    const map: Record<number, string> = {};
    events.forEach((e, i) => { map[e.id] = e.color ?? EVENT_COLORS[i % EVENT_COLORS.length]; });
    return map;
  }, [events]);

  const eventsOnDay = (day: Date) =>
    events.filter(e => occursOn(e, day)).sort((a, b) => startMinutes(a) - startMinutes(b));
  const isToday = (day: Date) => sameDay(day, today);

  // ── Navigation ──
  const shift = (dir: number) => {
    if (view === "day") setCursor(c => addDays(c, dir));
    else if (view === "week") setCursor(c => addDays(c, dir * 7));
    else if (view === "month") setCursor(c => new Date(c.getFullYear(), c.getMonth() + dir, 1));
    else setCursor(c => new Date(c.getFullYear() + dir, c.getMonth(), 1));
  };
  const goToday = () => setCursor(today);
  const openDay = (day: Date) => { setCursor(day); setView("day"); };

  const label = () => {
    if (view === "day") return `${DAY_FULL[cursor.getDay()]}, ${MONTH_NAMES[cursor.getMonth()]} ${cursor.getDate()}, ${cursor.getFullYear()}`;
    if (view === "week") {
      const s = startOfWeek(cursor); const e = addDays(s, 6);
      const sM = MONTH_ABBR[s.getMonth()]; const eM = MONTH_ABBR[e.getMonth()];
      return s.getMonth() === e.getMonth()
        ? `${sM} ${s.getDate()} – ${e.getDate()}, ${e.getFullYear()}`
        : `${sM} ${s.getDate()} – ${eM} ${e.getDate()}, ${e.getFullYear()}`;
    }
    if (view === "month") return `${MONTH_NAMES[cursor.getMonth()]} ${cursor.getFullYear()}`;
    return `${cursor.getFullYear()}`;
  };

  // Day cells hold event buttons, so they're focusable containers rather than
  // <button>s (buttons can't nest). Enter/Space opens the day like a click.
  const dayCellProps = (day: Date) => ({
    role: "button",
    tabIndex: 0,
    "aria-label": `${DAY_FULL[day.getDay()]}, ${MONTH_NAMES[day.getMonth()]} ${day.getDate()}`,
    onClick: () => openDay(day),
    onKeyDown: (e: KeyboardEvent) => {
      if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        openDay(day);
      }
    },
  });

  // ── Reusable event pill (grids) ──
  const pill = (ev: ChurchEvent, day: Date) => (
    <button
      key={ev.id}
      onClick={(e) => { e.stopPropagation(); onViewDetails?.(ev, day); }}
      className={cn("block w-full text-left text-[10px] leading-tight font-medium text-white rounded px-1 py-px truncate hover:brightness-110", eventColors[ev.id])}
      title={ev.title}
    >
      {ev.title}
    </button>
  );

  return (
    <div className="w-full">
      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <button onClick={() => shift(-1)} className="p-2 rounded-lg hover:bg-accent transition-colors text-foreground" aria-label="Previous"><ChevronLeft size={20} /></button>
          <button onClick={() => shift(1)} className="p-2 rounded-lg hover:bg-accent transition-colors text-foreground" aria-label="Next"><ChevronRight size={20} /></button>
          <Button variant="outline" size="sm" onClick={goToday} className="text-xs h-8 px-3">Today</Button>
          <h3 className="text-lg sm:text-xl font-bold tracking-tight ml-1">{label()}</h3>
        </div>

        {/* View toggle */}
        <div className="inline-flex rounded-lg border border-border bg-card p-0.5">
          {(["day", "week", "month", "year"] as ViewMode[]).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors",
                view === v ? "bg-indigo-500 text-white" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* ── Body ── */}
      {view === "month" && renderMonth()}
      {view === "week" && renderWeek()}
      {view === "day" && renderDay()}
      {view === "year" && renderYear()}
    </div>
  );

  // ── Month grid ──
  function renderMonth() {
    const y = cursor.getFullYear(); const m = cursor.getMonth();
    const firstPad = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < firstPad; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(y, m, d));
    while (cells.length % 7 !== 0) cells.push(null);

    return (
      <div>
        <div className="grid grid-cols-7 mb-2">
          {DAY_ABBR.map(d => <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2 uppercase tracking-wider">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden border border-border">
          {cells.map((day, idx) => {
            if (!day) return <div key={`b-${idx}`} className="bg-card/40 min-h-[96px] md:min-h-[124px]" />;
            const dayEvents = eventsOnDay(day);
            return (
              <div
                key={day.toISOString()}
                {...dayCellProps(day)}
                className="relative bg-card min-h-[96px] md:min-h-[124px] p-2 text-left cursor-pointer hover:bg-accent/60 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              >
                <span className={cn("inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold", isToday(day) ? "bg-indigo-500 text-white" : "text-foreground")}>{day.getDate()}</span>
                <div className="mt-1 flex flex-col gap-0.5 overflow-hidden">
                  {dayEvents.slice(0, 3).map(ev => pill(ev, day))}
                  {dayEvents.length > 3 && <span className="text-[10px] text-muted-foreground pl-1">+{dayEvents.length - 3} more</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Week grid ──
  function renderWeek() {
    const start = startOfWeek(cursor);
    const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-px bg-border rounded-xl overflow-hidden border border-border">
        {days.map(day => {
          const dayEvents = eventsOnDay(day);
          return (
            <div
              key={day.toISOString()}
              {...dayCellProps(day)}
              className="bg-card min-h-[160px] p-2 text-left cursor-pointer hover:bg-accent/60 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            >
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase">{DAY_ABBR[day.getDay()]}</span>
                <span className={cn("inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold", isToday(day) ? "bg-indigo-500 text-white" : "text-foreground")}>{day.getDate()}</span>
              </div>
              <div className="flex flex-col gap-1 overflow-hidden">
                {dayEvents.map(ev => pill(ev, day))}
                {dayEvents.length === 0 && <span className="text-[10px] text-muted-foreground">—</span>}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ── Day agenda (rich rows, admin controls) ──
  function renderDay() {
    const dayEvents = eventsOnDay(cursor);
    return (
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {dayEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3"><span className="text-2xl">📅</span></div>
            <p className="font-medium text-sm">No events scheduled</p>
            <p className="text-xs text-muted-foreground mt-1">Nothing on this day</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {dayEvents.map(ev => (
              <div key={ev.id} className="p-5 flex items-start gap-3">
                <div className={cn("w-1 self-stretch rounded-full flex-shrink-0", eventColors[ev.id])} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <button onClick={() => onViewDetails?.(ev, cursor)} className="font-semibold text-base leading-snug text-left hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">{ev.title}</button>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => onViewDetails?.(ev, cursor)} className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="View details / add to calendar"><CalendarPlus size={15} /></button>
                      {onEdit && <button onClick={() => onEdit(ev)} className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors" title="Edit event"><Pencil size={15} /></button>}
                      {onDelete && <button onClick={() => onDelete(ev.id)} className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-destructive transition-colors" title="Delete event"><Trash2 size={15} /></button>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-2">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Clock size={13} />{timeLabel(ev)}</span>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin size={13} />{ev.location}</span>
                  </div>
                  {ev.description && <p className="text-sm text-muted-foreground leading-relaxed">{ev.description}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
        {onAddOnDate && (
          <div className="border-t border-border p-3 flex justify-center">
            <Button variant="outline" size="sm" onClick={() => onAddOnDate(cursor)}>
              <Plus className="mr-1.5 h-4 w-4" /> Add event on this day
            </Button>
          </div>
        )}
      </div>
    );
  }

  // ── Year grid (12 mini months) ──
  function renderYear() {
    const y = cursor.getFullYear();
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {MONTH_NAMES.map((name, m) => {
          const firstPad = new Date(y, m, 1).getDay();
          const daysInMonth = new Date(y, m + 1, 0).getDate();
          const cells: (Date | null)[] = [];
          for (let i = 0; i < firstPad; i++) cells.push(null);
          for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(y, m, d));
          return (
            <div key={m} className="bg-card border border-border rounded-lg p-3">
              <button onClick={() => { setCursor(new Date(y, m, 1)); setView("month"); }} className="text-sm font-semibold mb-2 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">{name}</button>
              <div className="grid grid-cols-7 gap-0.5">
                {DAY_ABBR.map(d => <div key={d} className="text-center text-[9px] text-muted-foreground">{d[0]}</div>)}
                {cells.map((day, idx) => {
                  if (!day) return <div key={`b-${idx}`} />;
                  const has = eventsOnDay(day).length > 0;
                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => openDay(day)}
                      className={cn(
                        "aspect-square flex items-center justify-center text-[10px] rounded-full transition-colors",
                        isToday(day) ? "bg-indigo-500 text-white font-bold" : has ? "bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-semibold hover:bg-indigo-500/30" : "text-muted-foreground hover:bg-accent/60",
                      )}
                      title={has ? `${eventsOnDay(day).length} event(s)` : undefined}
                    >
                      {day.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }
}
