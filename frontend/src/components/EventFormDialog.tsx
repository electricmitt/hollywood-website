import { useEffect, useState } from "react";
import { apiClient } from "app";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import type { CreateEventRequest } from "../apiclient/data-contracts";

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

const DAY_NAMES_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type ScheduleType = "weekly" | "monthly-last" | "one-off" | "date-range";

/** Loose shape both the calendar's ChurchEvent and the API contract satisfy. */
export interface EditableEvent {
  id: number;
  title: string;
  time: string;
  location: string;
  description: string;
  color?: string | null;
  featured?: boolean | null;
  imageUrl?: string | null;
  date?: string | null;
  dateRange?: { start: string; end: string } | null;
  recurrence?: { type: string; dayOfWeek?: number | null } | null;
}

const emptyForm = (): CreateEventRequest => ({
  title: "",
  time: "",
  location: "",
  description: "",
  color: "bg-indigo-500",
  featured: false,
  imageUrl: null,
  date: null,
  dateRange: null,
  recurrence: null,
});

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Event being edited, or null to add a new one. */
  editingEvent: EditableEvent | null;
  /** Returns RequestParams carrying the admin token header. */
  authHeaders: () => { headers: { "X-Admin-Token": string } };
  /** Called after a successful create/update so the caller can reload. */
  onSaved: () => void | Promise<void>;
}

/** Shared admin dialog for creating and editing church events. */
export function EventFormDialog({ open, onOpenChange, editingEvent, authHeaders, onSaved }: Props) {
  const [form, setForm] = useState<CreateEventRequest>(emptyForm());
  const [scheduleType, setScheduleType] = useState<ScheduleType>("weekly");
  const [recurDay, setRecurDay] = useState<number>(6);
  const [oneOffDate, setOneOffDate] = useState("");
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [saving, setSaving] = useState(false);

  // Populate (edit) or reset (add) the form each time the dialog opens.
  useEffect(() => {
    if (!open) return;
    if (editingEvent) {
      setForm({
        title: editingEvent.title,
        time: editingEvent.time,
        location: editingEvent.location,
        description: editingEvent.description,
        color: editingEvent.color ?? "bg-indigo-500",
        featured: editingEvent.featured ?? false,
        imageUrl: editingEvent.imageUrl ?? null,
        date: editingEvent.date ?? null,
        dateRange: editingEvent.dateRange ?? null,
        recurrence: editingEvent.recurrence
          ? { type: editingEvent.recurrence.type, dayOfWeek: editingEvent.recurrence.dayOfWeek ?? undefined }
          : null,
      });
      if (editingEvent.recurrence?.type === "weekly") {
        setScheduleType("weekly");
        setRecurDay(editingEvent.recurrence.dayOfWeek ?? 6);
      } else if (editingEvent.recurrence?.type === "monthly-last") {
        setScheduleType("monthly-last");
        setRecurDay(editingEvent.recurrence.dayOfWeek ?? 6);
      } else if (editingEvent.dateRange) {
        setScheduleType("date-range");
        setRangeStart(editingEvent.dateRange.start);
        setRangeEnd(editingEvent.dateRange.end);
      } else {
        setScheduleType("one-off");
        setOneOffDate(editingEvent.date ?? "");
      }
    } else {
      setForm(emptyForm());
      setScheduleType("weekly");
      setRecurDay(6);
      setOneOffDate("");
      setRangeStart("");
      setRangeEnd("");
    }
  }, [open, editingEvent]);

  const buildPayload = (): CreateEventRequest => {
    const base: CreateEventRequest = {
      title: form.title,
      time: form.time,
      location: form.location,
      description: form.description,
      color: form.color,
      featured: form.featured,
      imageUrl: form.imageUrl || null,
      date: null,
      dateRange: null,
      recurrence: null,
    };
    if (scheduleType === "weekly") {
      base.recurrence = { type: "weekly", dayOfWeek: recurDay };
    } else if (scheduleType === "monthly-last") {
      base.recurrence = { type: "monthly-last", dayOfWeek: recurDay };
    } else if (scheduleType === "one-off") {
      base.date = oneOffDate;
    } else if (scheduleType === "date-range") {
      base.dateRange = { start: rangeStart, end: rangeEnd };
    }
    return base;
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.time.trim() || !form.location.trim()) {
      toast.error("Title, time, and location are required");
      return;
    }
    setSaving(true);
    try {
      const payload = buildPayload();
      if (editingEvent) {
        await apiClient.update_event({ eventId: editingEvent.id }, payload, authHeaders());
        toast.success("Event updated");
      } else {
        await apiClient.create_event(payload, authHeaders());
        toast.success("Event created");
      }
      onOpenChange(false);
      await onSaved();
    } catch {
      toast.error("Failed to save event. Your admin session may have expired — try logging in again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingEvent ? "Edit Event" : "Add New Event"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-1.5">
            <Label>Title *</Label>
            <Input placeholder="e.g. Sabbath Worship" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>

          <div className="space-y-1.5">
            <Label>Schedule Type *</Label>
            <Select value={scheduleType} onValueChange={v => setScheduleType(v as ScheduleType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly (repeats every week)</SelectItem>
                <SelectItem value="monthly-last">Last [Day] of Each Month</SelectItem>
                <SelectItem value="one-off">Single Date</SelectItem>
                <SelectItem value="date-range">Date Range (multi-day)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(scheduleType === "weekly" || scheduleType === "monthly-last") && (
            <div className="space-y-1.5">
              <Label>Day of Week *</Label>
              <Select value={String(recurDay)} onValueChange={v => setRecurDay(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DAY_NAMES_FULL.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          {scheduleType === "one-off" && (
            <div className="space-y-1.5">
              <Label>Date *</Label>
              <Input type="date" value={oneOffDate} onChange={e => setOneOffDate(e.target.value)} />
            </div>
          )}
          {scheduleType === "date-range" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start Date *</Label>
                <Input type="date" value={rangeStart} onChange={e => setRangeStart(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>End Date *</Label>
                <Input type="date" value={rangeEnd} onChange={e => setRangeEnd(e.target.value)} />
              </div>
            </div>
          )}

          <Separator />

          <div className="space-y-1.5">
            <Label>Time *</Label>
            <Input placeholder="e.g. 11:00 AM - Sunset" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
          </div>

          <div className="space-y-1.5">
            <Label>Location *</Label>
            <Input placeholder="e.g. Main Sanctuary" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea rows={3} placeholder="Brief description of the event..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>

          <div className="space-y-1.5">
            <Label>Image URL <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Input placeholder="https://..." value={form.imageUrl ?? ""} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} />
          </div>

          <Separator />

          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map(c => (
                <button
                  key={c.value}
                  title={c.label}
                  onClick={() => setForm(f => ({ ...f, color: c.value }))}
                  className={`w-7 h-7 rounded-full ${c.value} ring-offset-background transition-all ${
                    form.color === c.value ? "ring-2 ring-white ring-offset-2 scale-110" : "opacity-70 hover:opacity-100"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="featured"
              checked={form.featured ?? false}
              onCheckedChange={v => setForm(f => ({ ...f, featured: v }))}
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
