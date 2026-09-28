import { useEffect, useMemo, useRef, useState } from "react";
import { apiClient } from "app";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Sparkles, Loader2, ImagePlus, X, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { apiUrl } from "utils/calendarLinks";
import {
  DAY_NAMES,
  WEEK_OF_MONTH_LABELS,
  describeSchedule,
  eventClock,
  hmToString,
  nextOccurrence,
  normalizeRecurrence,
  occursOn,
  parseLocalDate,
  parseTimes,
  timeLabel,
  toIsoDate,
  type Freq,
  type SchedulableEvent,
} from "utils/eventSchedule";
import type { ChurchEvent, CreateEventRequest } from "../apiclient/data-contracts";

const COLOR_OPTIONS = [
  { label: "Indigo", value: "bg-indigo-500" },
  { label: "Purple", value: "bg-purple-500" },
  { label: "Emerald", value: "bg-emerald-500" },
  { label: "Amber", value: "bg-amber-500" },
  { label: "Rose", value: "bg-rose-500" },
  { label: "Sky", value: "bg-sky-500" },
  { label: "Orange", value: "bg-orange-500" },
  { label: "Teal", value: "bg-teal-500" },
];

type ScheduleKind = "once" | "range" | "repeat";
type EndMode = "none" | "time" | "sunset";

interface Details {
  title: string;
  location: string;
  description: string;
  color: string;
  featured: boolean;
  imageUrl: string | null;
}

interface RepeatState {
  freq: Freq;
  interval: number;
  dayOfWeek: number;
  weekOfMonth: number;
  startDate: string;
  endDate: string;
  exceptions: string[];
}

const INTERVAL_OPTIONS: Record<Freq, { value: number; label: string }[]> = {
  weekly: [
    { value: 1, label: "Every week" },
    { value: 2, label: "Every other week" },
    { value: 3, label: "Every 3 weeks" },
    { value: 4, label: "Every 4 weeks" },
  ],
  monthly: [
    { value: 1, label: "every month" },
    { value: 2, label: "every other month" },
    { value: 3, label: "every 3 months" },
    { value: 6, label: "every 6 months" },
  ],
  yearly: [
    { value: 1, label: "Every year" },
    { value: 2, label: "Every other year" },
  ],
};

const emptyDetails = (): Details => ({
  title: "",
  location: "",
  description: "",
  color: "bg-indigo-500",
  featured: false,
  imageUrl: null,
});

/** Which week of its month a date falls in (1-4, or -1 for a 5th week). */
const weekOfMonthFor = (d: Date) => {
  const n = Math.ceil(d.getDate() / 7);
  return n >= 5 ? -1 : n;
};

const defaultRepeat = (day: Date): RepeatState => ({
  freq: "weekly",
  interval: 1,
  dayOfWeek: day.getDay(),
  weekOfMonth: weekOfMonthFor(day),
  startDate: toIsoDate(day),
  endDate: "",
  exceptions: [],
});

const shortDate = (iso: string) =>
  parseLocalDate(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });

/** Readable message from a failed API call (FastAPI 4xx body), if there is one. */
function apiErrorMessage(err: unknown): string | null {
  const e = err as { status?: number; error?: { detail?: unknown } } | undefined;
  if (e?.status === 401) return "Your admin session has expired — please log in again.";
  const detail = e?.error?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail[0]?.msg) return String(detail[0].msg).replace(/^Value error, /, "");
  return null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Event being edited, or null to add a new one. */
  editingEvent: ChurchEvent | null;
  /** New events: start on this day (e.g. the day selected on the calendar). */
  initialDate?: Date | null;
  /** Returns RequestParams carrying the admin token header. */
  authHeaders: () => { headers: { "X-Admin-Token": string } };
  /** Called after a successful create/update so the caller can reload. */
  onSaved: () => void | Promise<void>;
}

/** Shared admin dialog for creating and editing church events. */
export function EventFormDialog({ open, onOpenChange, editingEvent, initialDate, authHeaders, onSaved }: Props) {
  const [details, setDetails] = useState<Details>(emptyDetails());

  // When
  const [kind, setKind] = useState<ScheduleKind>("once");
  const [oneOffDate, setOneOffDate] = useState("");
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [repeat, setRepeat] = useState<RepeatState>(defaultRepeat(new Date()));
  const [skipInput, setSkipInput] = useState("");

  // Time
  const [allDay, setAllDay] = useState(false);
  const [startTime, setStartTime] = useState(""); // "HH:MM"
  const [endMode, setEndMode] = useState<EndMode>("none");
  const [endTime, setEndTime] = useState("");
  const [legacyTime, setLegacyTime] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const updateRepeat = (patch: Partial<RepeatState>) => setRepeat(r => ({ ...r, ...patch }));

  // Populate (edit) or reset (add) the form each time the dialog opens.
  useEffect(() => {
    if (!open) return;
    const ev = editingEvent;
    const base = initialDate ?? new Date();
    setSkipInput("");

    if (!ev) {
      setDetails(emptyDetails());
      setKind("once");
      setOneOffDate(initialDate ? toIsoDate(initialDate) : "");
      setRangeStart("");
      setRangeEnd("");
      setRepeat(defaultRepeat(base));
      setAllDay(false);
      setStartTime("");
      setEndMode("none");
      setEndTime("");
      setLegacyTime(null);
      return;
    }

    setDetails({
      title: ev.title,
      location: ev.location,
      description: ev.description ?? "",
      color: ev.color ?? "bg-indigo-500",
      featured: ev.featured ?? false,
      imageUrl: ev.imageUrl ?? null,
    });
    setOneOffDate(ev.date ?? "");
    setRangeStart(ev.dateRange?.start ?? "");
    setRangeEnd(ev.dateRange?.end ?? "");
    if (ev.recurrence) {
      const r = normalizeRecurrence(ev.recurrence);
      const d = defaultRepeat(base);
      setRepeat({
        freq: r.freq ?? "weekly",
        interval: r.interval,
        dayOfWeek: r.dayOfWeek ?? d.dayOfWeek,
        weekOfMonth: r.weekOfMonth,
        startDate: r.startDate ?? "",
        endDate: r.endDate ?? "",
        exceptions: r.exceptions,
      });
      setKind("repeat");
    } else {
      setRepeat(defaultRepeat(base));
      setKind(ev.dateRange ? "range" : "once");
    }

    if (ev.allDay) {
      setAllDay(true);
      setStartTime("");
      setEndMode("none");
      setEndTime("");
      setLegacyTime(null);
    } else {
      const clock = eventClock(ev);
      setAllDay(false);
      setStartTime(clock.start ? hmToString(clock.start) : "");
      setEndMode(clock.end ? "time" : clock.untilSunset ? "sunset" : "none");
      setEndTime(clock.end ? hmToString(clock.end) : "");
      setLegacyTime(!clock.start && ev.time ? ev.time : null);
    }
  }, [open, editingEvent, initialDate]);

  // The event as currently filled in (schedule + time), for preview and saving.
  const draft: SchedulableEvent = {
    date: kind === "once" ? oneOffDate || null : null,
    dateRange: kind === "range" && rangeStart && rangeEnd ? { start: rangeStart, end: rangeEnd } : null,
    recurrence:
      kind === "repeat"
        ? {
            freq: repeat.freq,
            interval: repeat.interval,
            dayOfWeek: repeat.freq === "yearly" ? null : repeat.dayOfWeek,
            weekOfMonth: repeat.freq === "monthly" ? repeat.weekOfMonth : null,
            startDate: repeat.startDate || null,
            endDate: repeat.endDate || null,
            exceptions: repeat.exceptions,
          }
        : null,
    allDay,
    startTime: allDay ? null : startTime || null,
    endTime: !allDay && endMode === "time" ? endTime || null : null,
    endsAtSunset: !allDay && endMode === "sunset",
  };

  // Next few dates of a repeat, so the admin can check it's right before saving.
  const draftKey = JSON.stringify(draft.recurrence);
  const upcomingDates = useMemo(() => {
    if (kind !== "repeat") return [];
    const out: Date[] = [];
    let from = new Date();
    for (let i = 0; i < 4; i++) {
      const d = nextOccurrence(draft, from);
      if (!d) break;
      out.push(d);
      from = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, draftKey]);

  const addSkippedDate = () => {
    if (!skipInput) return;
    const withoutSkips = { ...draft, recurrence: { ...draft.recurrence, exceptions: [] } };
    if (!occursOn(withoutSkips, parseLocalDate(skipInput))) {
      toast.error(`${shortDate(skipInput)} isn't one of this event's dates.`);
      return;
    }
    updateRepeat({ exceptions: [...new Set([...repeat.exceptions, skipInput])].sort() });
    setSkipInput("");
  };

  const validate = (): string | null => {
    if (!details.title.trim()) return "Add a title.";
    if (!details.location.trim()) return "Add a location.";
    if (kind === "once" && !oneOffDate) return "Pick the event date.";
    if (kind === "range") {
      if (!rangeStart || !rangeEnd) return "Pick the first and last day.";
      if (rangeEnd < rangeStart) return "The last day is before the first day.";
    }
    if (kind === "repeat") {
      if ((repeat.freq === "yearly" || repeat.interval > 1) && !repeat.startDate) return "This repeat needs a start date.";
      if (repeat.startDate && repeat.endDate && repeat.endDate < repeat.startDate) return "The repeat ends before it starts.";
    }
    if (!allDay && !startTime) return "Set a start time, or mark the event as all day.";
    if (!allDay && endMode === "time" && !endTime) return "Set the end time.";
    return null;
  };

  // Upload an image file to the backend; returns its hosted URL, or null on failure.
  const uploadImageFile = async (file: File): Promise<string | null> => {
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(apiUrl("/events/upload-image"), {
        method: "POST",
        headers: { ...authHeaders().headers }, // no Content-Type — browser sets the multipart boundary
        body: fd,
      });
      if (!res.ok) return null;
      const { url } = await res.json();
      return url ?? null;
    } catch {
      return null;
    }
  };

  // Attach the flyer as the event image, then ask the AI to read its details.
  // The two steps are independent: the image is kept even if reading fails.
  const handleFlyer = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file (JPG, PNG, or WEBP).");
      return;
    }
    setParsing(true);

    const url = await uploadImageFile(file);
    if (url) setDetails(d => ({ ...d, imageUrl: url }));

    try {
      const dataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await fetch(apiUrl("/events/parse-flyer"), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders().headers },
        body: JSON.stringify({ image_base64: dataUrl.split(",")[1], media_type: file.type }),
      });
      if (!res.ok) {
        let detail = "";
        try { detail = (await res.json()).detail ?? ""; } catch { /* non-JSON error */ }
        throw new Error(detail);
      }
      const p = await res.json();
      setDetails(d => ({
        ...d,
        title: p.title || d.title,
        location: p.location || d.location,
        description: p.description || d.description,
      }));
      if (p.date) {
        setKind("once");
        setOneOffDate(p.date);
      }
      if (p.time) {
        const clock = parseTimes(p.time);
        if (clock.start) {
          setAllDay(false);
          setStartTime(hmToString(clock.start));
          setEndMode(clock.end ? "time" : clock.untilSunset ? "sunset" : "none");
          setEndTime(clock.end ? hmToString(clock.end) : "");
          setLegacyTime(null);
        }
      }
      toast.success(url
        ? "Flyer read and attached as the event image — review, then save."
        : "Flyer read — review the details, then save.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      const reason = msg.includes("credit balance")
        ? "auto-reading is unavailable until Anthropic API credits are added"
        : "the details couldn't be read automatically";
      toast.error(url
        ? `Flyer attached as the event image, but ${reason}. Fill in the details, then save.`
        : `Couldn't process the flyer: ${reason}.`);
    } finally {
      setParsing(false);
    }
  };

  // Upload an event image and store its URL on the form.
  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file (JPG, PNG, WEBP, or GIF).");
      return;
    }
    setUploadingImg(true);
    const url = await uploadImageFile(file);
    if (url) {
      setDetails(d => ({ ...d, imageUrl: url }));
      toast.success("Image uploaded");
    } else {
      toast.error("Couldn't upload the image. Please try again.");
    }
    setUploadingImg(false);
  };

  const handleSave = async () => {
    const problem = validate();
    if (problem) {
      toast.error(problem);
      return;
    }
    const payload: CreateEventRequest = {
      title: details.title.trim(),
      location: details.location.trim(),
      description: details.description,
      color: details.color,
      featured: details.featured,
      imageUrl: details.imageUrl || null,
      date: draft.date ?? null,
      dateRange: draft.dateRange ?? null,
      recurrence: draft.recurrence ?? null,
      allDay: !!draft.allDay,
      startTime: draft.startTime ?? null,
      endTime: draft.endTime ?? null,
      endsAtSunset: !!draft.endsAtSunset,
      time: timeLabel(draft), // stored display label
    };
    setSaving(true);
    try {
      if (editingEvent) {
        await apiClient.update_event({ eventId: editingEvent.id }, payload, authHeaders());
        toast.success("Event updated");
      } else {
        await apiClient.create_event(payload, authHeaders());
        toast.success("Event created");
      }
      onOpenChange(false);
      await onSaved();
    } catch (err) {
      toast.error(apiErrorMessage(err) ?? "Failed to save event. Your admin session may have expired — try logging in again.");
    } finally {
      setSaving(false);
    }
  };

  const dayOfWeekSelect = (
    <Select value={String(repeat.dayOfWeek)} onValueChange={v => updateRepeat({ dayOfWeek: Number(v) })}>
      <SelectTrigger className="w-[140px]" aria-label="Day of the week"><SelectValue /></SelectTrigger>
      <SelectContent>
        {DAY_NAMES.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}
      </SelectContent>
    </Select>
  );

  const intervalSelect = (
    <Select value={String(repeat.interval)} onValueChange={v => updateRepeat({ interval: Number(v) })}>
      <SelectTrigger className="w-[170px]" aria-label="How often"><SelectValue /></SelectTrigger>
      <SelectContent>
        {INTERVAL_OPTIONS[repeat.freq].map(o => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}
      </SelectContent>
    </Select>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingEvent ? "Edit Event" : "Add New Event"}</DialogTitle>
        </DialogHeader>

        {/* Flyer auto-fill */}
        <div className="rounded-lg border border-dashed border-indigo-500/40 bg-indigo-500/5 p-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-indigo-400" /> Auto-fill from a flyer</p>
            <p className="text-xs text-muted-foreground">Upload a flyer — it becomes the event image, and we'll read the details for you to review.</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFlyer(f); e.target.value = ""; }}
          />
          <Button type="button" variant="outline" size="sm" disabled={parsing} onClick={() => fileInputRef.current?.click()} className="flex-shrink-0">
            {parsing ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Reading…</> : "Upload flyer"}
          </Button>
        </div>

        <div className="space-y-5 py-2">
          <div className="space-y-1.5">
            <Label>Title *</Label>
            <Input placeholder="e.g. Sabbath Worship" value={details.title} onChange={e => setDetails(d => ({ ...d, title: e.target.value }))} />
          </div>

          {/* ── When ── */}
          <div className="space-y-3">
            <Label>When *</Label>
            <Select value={kind} onValueChange={v => setKind(v as ScheduleKind)}>
              <SelectTrigger aria-label="Schedule type"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="once">One day</SelectItem>
                <SelectItem value="range">Several days in a row</SelectItem>
                <SelectItem value="repeat">Repeats</SelectItem>
              </SelectContent>
            </Select>

            {kind === "once" && (
              <Input type="date" aria-label="Date" value={oneOffDate} onChange={e => setOneOffDate(e.target.value)} />
            )}

            {kind === "range" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">First day</Label>
                  <Input type="date" value={rangeStart} onChange={e => setRangeStart(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Last day</Label>
                  <Input type="date" value={rangeEnd} onChange={e => setRangeEnd(e.target.value)} />
                </div>
              </div>
            )}

            {kind === "repeat" && (
              <div className="space-y-3 rounded-lg border border-border p-3">
                <Select
                  value={repeat.freq}
                  onValueChange={v => updateRepeat({ freq: v as Freq, interval: 1 })}
                >
                  <SelectTrigger aria-label="Repeat frequency"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly (on a weekday)</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>

                {repeat.freq === "weekly" && (
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    {intervalSelect}
                    <span>on</span>
                    {dayOfWeekSelect}
                  </div>
                )}

                {repeat.freq === "monthly" && (
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span>The</span>
                    <Select value={String(repeat.weekOfMonth)} onValueChange={v => updateRepeat({ weekOfMonth: Number(v) })}>
                      <SelectTrigger className="w-[110px]" aria-label="Week of the month"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, -1].map(n => <SelectItem key={n} value={String(n)}>{WEEK_OF_MONTH_LABELS[n]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {dayOfWeekSelect}
                    <span>of</span>
                    {intervalSelect}
                  </div>
                )}

                {repeat.freq === "yearly" && (
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    {intervalSelect}
                    <span className="text-muted-foreground">on the start date's month and day</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Starts on{repeat.freq === "yearly" || repeat.interval > 1 ? " *" : ""}
                    </Label>
                    <Input type="date" value={repeat.startDate} onChange={e => updateRepeat({ startDate: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Ends on (optional)</Label>
                    <Input type="date" value={repeat.endDate} onChange={e => updateRepeat({ endDate: e.target.value })} />
                  </div>
                </div>

                {/* Skipped dates */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Skipped dates (optional)</Label>
                  {repeat.exceptions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {repeat.exceptions.map(d => (
                        <span key={d} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs">
                          {shortDate(d)}
                          <button
                            type="button"
                            onClick={() => updateRepeat({ exceptions: repeat.exceptions.filter(x => x !== d) })}
                            className="text-muted-foreground hover:text-foreground"
                            aria-label={`Restore ${shortDate(d)}`}
                            title="Restore this date"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input type="date" aria-label="Date to skip" value={skipInput} onChange={e => setSkipInput(e.target.value)} />
                    <Button type="button" variant="outline" size="sm" className="h-10 flex-shrink-0" disabled={!skipInput} onClick={addSkippedDate}>
                      Skip date
                    </Button>
                  </div>
                </div>

                {/* Preview */}
                <div className="rounded-md bg-muted/60 px-3 py-2 text-xs">
                  <p className="font-medium flex items-center gap-1.5"><CalendarClock className="h-3.5 w-3.5" /> {describeSchedule(draft) || "Choose when it repeats"}</p>
                  <p className="text-muted-foreground mt-0.5">
                    {upcomingDates.length
                      ? `Next: ${upcomingDates.map(d => d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })).join(" · ")}`
                      : "No upcoming dates"}
                  </p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* ── Time ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <Label>Time *</Label>
              <div className="flex items-center gap-2">
                <Switch id="allDay" checked={allDay} onCheckedChange={setAllDay} />
                <Label htmlFor="allDay" className="text-sm font-normal">All day</Label>
              </div>
            </div>
            {!allDay && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Starts</Label>
                  <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Ends</Label>
                  <Select value={endMode} onValueChange={v => setEndMode(v as EndMode)}>
                    <SelectTrigger aria-label="How it ends"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No end time</SelectItem>
                      <SelectItem value="time">At a set time</SelectItem>
                      <SelectItem value="sunset">At sunset</SelectItem>
                    </SelectContent>
                  </Select>
                  {endMode === "time" && (
                    <Input type="time" aria-label="End time" value={endTime} onChange={e => setEndTime(e.target.value)} />
                  )}
                </div>
              </div>
            )}
            {legacyTime && !startTime && !allDay && (
              <p className="text-xs text-amber-700 dark:text-amber-500">
                This event's old time, "{legacyTime}", couldn't be read automatically — please set the start time above.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Location *</Label>
            <Input placeholder="e.g. Main Sanctuary" value={details.location} onChange={e => setDetails(d => ({ ...d, location: e.target.value }))} />
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea rows={3} placeholder="Brief description of the event..." value={details.description} onChange={e => setDetails(d => ({ ...d, description: e.target.value }))} />
          </div>

          <div className="space-y-2">
            <Label>Event Image <span className="text-muted-foreground text-xs">(optional)</span></Label>

            {details.imageUrl ? (
              <div className="relative w-full overflow-hidden rounded-lg border border-border">
                <img src={details.imageUrl} alt="Event" className="w-full max-h-48 object-cover" />
                <button
                  type="button"
                  onClick={() => setDetails(d => ({ ...d, imageUrl: null }))}
                  className="absolute top-2 right-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80 transition-colors"
                  title="Remove image"
                >
                  <X size={15} />
                </button>
              </div>
            ) : null}

            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); e.target.value = ""; }}
            />
            <Button type="button" variant="outline" size="sm" disabled={uploadingImg} onClick={() => imageInputRef.current?.click()}>
              {uploadingImg ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Uploading…</> : <><ImagePlus className="mr-1.5 h-4 w-4" /> {details.imageUrl ? "Replace image" : "Upload image"}</>}
            </Button>

            <details className="text-xs">
              <summary className="text-muted-foreground cursor-pointer hover:text-foreground">or paste an image URL</summary>
              <Input className="mt-1.5" placeholder="https://..." value={details.imageUrl ?? ""} onChange={e => setDetails(d => ({ ...d, imageUrl: e.target.value || null }))} />
            </details>
          </div>

          <Separator />

          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  aria-label={c.label}
                  onClick={() => setDetails(d => ({ ...d, color: c.value }))}
                  className={`w-7 h-7 rounded-full ${c.value} ring-offset-background transition-all ${
                    details.color === c.value ? "ring-2 ring-foreground ring-offset-2 scale-110" : "opacity-70 hover:opacity-100"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="featured"
              checked={details.featured}
              onCheckedChange={v => setDetails(d => ({ ...d, featured: v }))}
            />
            <Label htmlFor="featured">Mark as Featured event</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : editingEvent ? "Save Changes" : "Create Event"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
