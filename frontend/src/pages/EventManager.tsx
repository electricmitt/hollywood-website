import { useEffect, useState } from "react";
import { apiClient } from "app";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Pencil, Trash2, Plus, Calendar, MapPin, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
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

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type ScheduleType = "weekly" | "monthly-last" | "one-off" | "date-range";

const emptyForm = (): CreateEventRequest => ({
  title: "",
  time: "",
  location: "",
  description: "",
  color: "bg-indigo-500",
  featured: false,
  imageUrl: "",
  date: null,
  dateRange: null,
  recurrence: null,
});

export default function EventManager() {
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ChurchEvent | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Form state
  const [form, setForm] = useState<CreateEventRequest>(emptyForm());
  const [scheduleType, setScheduleType] = useState<ScheduleType>("weekly");
  const [recurDay, setRecurDay] = useState<number>(6);
  const [oneOffDate, setOneOffDate] = useState("");
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");

  const loadEvents = async () => {
    try {
      const res = await apiClient.get_events();
      const data = await res.json();
      setEvents(data.events ?? []);
    } catch {
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEvents(); }, []);

  const openAdd = () => {
    setEditingEvent(null);
    setForm(emptyForm());
    setScheduleType("weekly");
    setRecurDay(6);
    setOneOffDate("");
    setRangeStart("");
    setRangeEnd("");
    setDialogOpen(true);
  };

  const openEdit = (event: ChurchEvent) => {
    setEditingEvent(event);
    setForm({
      title: event.title,
      time: event.time,
      location: event.location,
      description: event.description,
      color: event.color ?? "bg-indigo-500",
      featured: event.featured ?? false,
      imageUrl: event.imageUrl ?? "",
      date: event.date ?? null,
      dateRange: event.dateRange ?? null,
      recurrence: event.recurrence ?? null,
    });
    // Determine schedule type from event
    if (event.recurrence?.type === "weekly") {
      setScheduleType("weekly");
      setRecurDay(event.recurrence.dayOfWeek ?? 6);
    } else if (event.recurrence?.type === "monthly-last") {
      setScheduleType("monthly-last");
      setRecurDay(event.recurrence.dayOfWeek ?? 6);
    } else if (event.dateRange) {
      setScheduleType("date-range");
      setRangeStart(event.dateRange.start);
      setRangeEnd(event.dateRange.end);
    } else {
      setScheduleType("one-off");
      setOneOffDate(event.date ?? "");
    }
    setDialogOpen(true);
  };

  const buildPayload = (): CreateEventRequest => {
    const base = {
      title: form.title,
      time: form.time,
      location: form.location,
      description: form.description,
      color: form.color,
      featured: form.featured,
      imageUrl: form.imageUrl || null,
      date: null as string | null,
      dateRange: null as { start: string; end: string } | null,
      recurrence: null as { type: string; dayOfWeek?: number } | null,
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
        await apiClient.update_event({ eventId: editingEvent.id }, payload);
        toast.success("Event updated");
      } else {
        await apiClient.create_event(payload);
        toast.success("Event created");
      }
      setDialogOpen(false);
      await loadEvents();
    } catch {
      toast.error("Failed to save event");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiClient.delete_event({ eventId: id });
      toast.success("Event deleted");
      setDeleteConfirmId(null);
      await loadEvents();
    } catch {
      toast.error("Failed to delete event");
    }
  };

  const scheduleLabel = (event: ChurchEvent) => {
    if (event.recurrence?.type === "weekly") return `Every ${DAY_NAMES[event.recurrence.dayOfWeek ?? 0]}`;
    if (event.recurrence?.type === "monthly-last") return `Last ${DAY_NAMES[event.recurrence.dayOfWeek ?? 0]} of month`;
    if (event.dateRange) return `${event.dateRange.start} → ${event.dateRange.end}`;
    if (event.date) return event.date;
    return "—";
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="container px-4 md:px-6 mx-auto max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold">Event Manager</h1>
            <p className="text-muted-foreground mt-1">Add, edit, or remove church events</p>
          </div>
          <Button onClick={openAdd} size="lg">
            <Plus className="mr-2 h-4 w-4" /> Add Event
          </Button>
        </div>

        {/* Event list */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 rounded-xl bg-card border border-border animate-pulse" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground">
            No events yet. Click "Add Event" to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {events.map(event => (
              <div key={event.id} className="bg-card border border-border rounded-xl p-5 flex items-start gap-4 hover:border-border/80 transition-colors">
                {/* Color swatch */}
                <div className={`w-1.5 self-stretch rounded-full flex-shrink-0 ${event.color ?? "bg-indigo-500"}`} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-base truncate">{event.title}</h3>
                    {event.featured && <Badge variant="secondary" className="text-xs">Featured</Badge>}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar size={13} />{scheduleLabel(event)}</span>
                    <span className="flex items-center gap-1"><Clock size={13} />{event.time}</span>
                    <span className="flex items-center gap-1"><MapPin size={13} />{event.location}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(event)}>
                    <Pencil size={15} />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteConfirmId(event.id)}>
                    <Trash2 size={15} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEvent ? "Edit Event" : "Add New Event"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Title */}
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input placeholder="e.g. Sabbath Worship" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>

            {/* Schedule type */}
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

            {/* Schedule detail */}
            {(scheduleType === "weekly" || scheduleType === "monthly-last") && (
              <div className="space-y-1.5">
                <Label>Day of Week *</Label>
                <Select value={String(recurDay)} onValueChange={v => setRecurDay(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DAY_NAMES.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}
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

            {/* Time */}
            <div className="space-y-1.5">
              <Label>Time *</Label>
              <Input placeholder="e.g. 11:00 AM - Sunset" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
            </div>

            {/* Location */}
            <div className="space-y-1.5">
              <Label>Location *</Label>
              <Input placeholder="e.g. Main Sanctuary" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea rows={3} placeholder="Brief description of the event..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>

            {/* Image URL */}
            <div className="space-y-1.5">
              <Label>Image URL <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input placeholder="https://..." value={form.imageUrl ?? ""} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} />
            </div>

            <Separator />

            {/* Color */}
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

            {/* Featured */}
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
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editingEvent ? "Save Changes" : "Create Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="text-destructive h-5 w-5" /> Delete Event
            </DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            Are you sure you want to delete this event? This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
