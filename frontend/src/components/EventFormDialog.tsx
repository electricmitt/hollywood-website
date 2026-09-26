import { useEffect, useRef, useState } from "react";
import { apiClient } from "app";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Sparkles, Loader2, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { apiUrl } from "utils/calendarLinks";
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
  const [parsing, setParsing] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

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
    if (url) setForm(f => ({ ...f, imageUrl: url }));

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
      setForm(f => ({
        ...f,
        title: p.title || f.title,
        time: p.time || f.time,
        location: p.location || f.location,
        description: p.description || f.description,
      }));
      if (p.date) {
        setScheduleType("one-off");
        setOneOffDate(p.date);
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
      setForm(f => ({ ...f, imageUrl: url }));
      toast.success("Image uploaded");
    } else {
      toast.error("Couldn't upload the image. Please try again.");
    }
    setUploadingImg(false);
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

          <div className="space-y-2">
            <Label>Event Image <span className="text-muted-foreground text-xs">(optional)</span></Label>

            {form.imageUrl ? (
              <div className="relative w-full overflow-hidden rounded-lg border border-border">
                <img src={form.imageUrl} alt="Event" className="w-full max-h-48 object-cover" />
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, imageUrl: null }))}
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
              {uploadingImg ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Uploading…</> : <><ImagePlus className="mr-1.5 h-4 w-4" /> {form.imageUrl ? "Replace image" : "Upload image"}</>}
            </Button>

            <details className="text-xs">
              <summary className="text-muted-foreground cursor-pointer hover:text-foreground">or paste an image URL</summary>
              <Input className="mt-1.5" placeholder="https://..." value={form.imageUrl ?? ""} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value || null }))} />
            </details>
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
                    form.color === c.value ? "ring-2 ring-foreground ring-offset-2 scale-110" : "opacity-70 hover:opacity-100"
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
