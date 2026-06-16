import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, MapPin, Clock, X, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ChurchEvent {
  id: number;
  title: string;
  /** ISO date string (YYYY-MM-DD) for one-off events */
  date?: string;
  /** ISO date range strings for multi-day events */
  dateRange?: { start: string; end: string };
  /** Recurring rule */
  recurrence?: {
    type: "weekly" | "monthly-last";
    /** 0 = Sunday … 6 = Saturday */
    dayOfWeek?: number;
  };
  time: string;
  location: string;
  description: string;
  color?: string; // tailwind bg class
}

interface Props {
  events: ChurchEvent[];
  onEdit?: (event: ChurchEvent) => void;
  onDelete?: (id: number) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toLocalDate(iso: string): Date {
  // Parse YYYY-MM-DD without timezone shift
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

/** Returns the last occurrence of dayOfWeek in a given month/year */
function lastWeekdayOfMonth(year: number, month: number, dow: number): Date {
  const lastDay = new Date(year, month + 1, 0);
  const diff = (lastDay.getDay() - dow + 7) % 7;
  return new Date(year, month, lastDay.getDate() - diff);
}

/** Check whether a given calendar day has this event */
function eventOccursOn(event: ChurchEvent, day: Date): boolean {
  // One-off date
  if (event.date) {
    return sameDay(toLocalDate(event.date), day);
  }
  // Date range (inclusive)
  if (event.dateRange) {
    const start = toLocalDate(event.dateRange.start);
    const end = toLocalDate(event.dateRange.end);
    return day >= start && day <= end;
  }
  // Recurring
  if (event.recurrence) {
    if (event.recurrence.type === "weekly" && event.recurrence.dayOfWeek !== undefined) {
      return day.getDay() === event.recurrence.dayOfWeek;
    }
    if (event.recurrence.type === "monthly-last" && event.recurrence.dayOfWeek !== undefined) {
      const last = lastWeekdayOfMonth(day.getFullYear(), day.getMonth(), event.recurrence.dayOfWeek);
      return sameDay(day, last);
    }
  }
  return false;
}

// ─── Color palette per event index ───────────────────────────────────────────
const EVENT_COLORS = [
  "bg-indigo-500",
  "bg-purple-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-rose-500",
  "bg-sky-500",
];

// ─── Component ───────────────────────────────────────────────────────────────

export function ChurchCalendar({ events, onEdit, onDelete }: Props) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  // Assign stable colors to each event
  const eventColors = useMemo(() => {
    const map: Record<number, string> = {};
    events.forEach((e, i) => {
      map[e.id] = e.color ?? EVENT_COLORS[i % EVENT_COLORS.length];
    });
    return map;
  }, [events]);

  // ── Build calendar grid ──
  const calendarDays = useMemo(() => {
    const firstOfMonth = new Date(viewYear, viewMonth, 1);
    const lastOfMonth = new Date(viewYear, viewMonth + 1, 0);
    const startPad = firstOfMonth.getDay(); // 0-6 blanks before the 1st
    const days: (Date | null)[] = [];

    for (let i = 0; i < startPad; i++) days.push(null);
    for (let d = 1; d <= lastOfMonth.getDate(); d++) {
      days.push(new Date(viewYear, viewMonth, d));
    }
    // Pad to complete last row
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [viewYear, viewMonth]);

  // ── Events for a given day ──
  const eventsOnDay = (day: Date) =>
    events.filter(e => eventOccursOn(e, day));

  // ── Selected day events ──
  const selectedEvents = selectedDay ? eventsOnDay(selectedDay) : [];

  // ── Navigation ──
  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }
  function goToday() {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedDay(today);
  }

  const isToday = (day: Date) => sameDay(day, today);
  const isSelected = (day: Date) => selectedDay ? sameDay(day, selectedDay) : false;

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full">
      {/* ── Calendar Grid ── */}
      <div className="flex-1 min-w-0">
        {/* Header: month nav */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={prevMonth}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-foreground"
            aria-label="Previous month"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold tracking-tight">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={goToday}
              className="text-xs h-7 px-3"
            >
              Today
            </Button>
          </div>

          <button
            onClick={nextMonth}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-foreground"
            aria-label="Next month"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 mb-2">
          {DAY_NAMES.map(d => (
            <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2 uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden border border-border">
          {calendarDays.map((day, idx) => {
            if (!day) {
              return (
                <div
                  key={`blank-${idx}`}
                  className="bg-card/40 min-h-[80px] md:min-h-[100px]"
                />
              );
            }

            const dayEvents = eventsOnDay(day);
            const selected = isSelected(day);
            const todayFlag = isToday(day);

            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDay(selected ? null : day)}
                className={cn(
                  "relative bg-card min-h-[80px] md:min-h-[100px] p-2 text-left transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500",
                  selected
                    ? "bg-indigo-950/80 ring-2 ring-inset ring-indigo-500"
                    : "hover:bg-white/5",
                )}
              >
                {/* Date number */}
                <span
                  className={cn(
                    "inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold",
                    todayFlag
                      ? "bg-indigo-500 text-white"
                      : selected
                      ? "text-indigo-300"
                      : "text-foreground",
                  )}
                >
                  {day.getDate()}
                </span>

                {/* Event dots / pills */}
                <div className="mt-1 flex flex-col gap-0.5 overflow-hidden">
                  {dayEvents.slice(0, 3).map(ev => (
                    <span
                      key={ev.id}
                      className={cn(
                        "block text-[10px] leading-tight font-medium text-white rounded px-1 py-px truncate",
                        eventColors[ev.id],
                      )}
                    >
                      <span className="hidden sm:inline">{ev.title}</span>
                      <span className="sm:hidden w-1.5 h-1.5 rounded-full inline-block" />
                    </span>
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="text-[10px] text-muted-foreground pl-1">+{dayEvents.length - 3} more</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-3">
          {events.map(ev => (
            <div key={ev.id} className="flex items-center gap-1.5">
              <span className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", eventColors[ev.id])} />
              <span className="text-xs text-muted-foreground">{ev.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Detail Panel ── */}
      <div
        className={cn(
          "lg:w-80 xl:w-96 transition-all duration-300",
          selectedDay ? "opacity-100" : "opacity-40 pointer-events-none",
        )}
      >
        <div className="bg-card border border-border rounded-xl overflow-hidden h-full">
          {selectedDay ? (
            <>
              {/* Panel header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-card">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                    {DAY_NAMES[selectedDay.getDay()]}
                  </p>
                  <h4 className="text-lg font-bold">
                    {MONTH_NAMES[selectedDay.getMonth()]} {selectedDay.getDate()}, {selectedDay.getFullYear()}
                  </h4>
                </div>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-muted-foreground"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Events list */}
              <div className="divide-y divide-border overflow-y-auto max-h-[420px]">
                {selectedEvents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                      <span className="text-2xl">📅</span>
                    </div>
                    <p className="font-medium text-sm">No events scheduled</p>
                    <p className="text-xs text-muted-foreground mt-1">Enjoy your day of rest</p>
                  </div>
                ) : (
                  selectedEvents.map(ev => (
                    <div key={ev.id} className="p-5">
                      <div className="flex items-start gap-3">
                        <div className={cn("w-1 self-stretch rounded-full flex-shrink-0 mt-0.5", eventColors[ev.id])} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h5 className="font-semibold text-sm leading-snug">{ev.title}</h5>
                            {(onEdit || onDelete) && (
                              <div className="flex items-center gap-1 flex-shrink-0">
                                {onEdit && (
                                  <button
                                    onClick={() => onEdit(ev)}
                                    className="p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                                    title="Edit event"
                                  >
                                    <Pencil size={13} />
                                  </button>
                                )}
                                {onDelete && (
                                  <button
                                    onClick={() => onDelete(ev.id)}
                                    className="p-1 rounded hover:bg-white/10 text-muted-foreground hover:text-destructive transition-colors"
                                    title="Delete event"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-1.5 mb-3">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Clock size={12} className="flex-shrink-0" />
                              <span>{ev.time}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <MapPin size={12} className="flex-shrink-0" />
                              <span>{ev.location}</span>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{ev.description}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-16 px-6 text-center">
              <div className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <span className="text-3xl">📅</span>
              </div>
              <p className="font-semibold">Select a Day</p>
              <p className="text-sm text-muted-foreground mt-1">Click any date to see scheduled events</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
