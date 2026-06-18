import { useEffect, useState } from "react";
import { apiClient } from "app";
import { ChurchCalendar, type ChurchEvent } from "components/ChurchCalendar";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, AlertCircle, Lock, Unlock, LogOut, Bell, Copy, Check, CalendarPlus } from "lucide-react";
import { subscriptionFeedUrl, subscriptionFeedWebcal } from "utils/calendarLinks";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
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

const ADMIN_TOKEN_KEY = "hollywood_admin_token";

type ScheduleType = "weekly" | "monthly-last" | "one-off" | "date-range";

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

export default function CalendarPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Admin session ──
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // ── Subscribe dialog state ──
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // ── Event dialog state ──
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ChurchEvent | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // ── Form state ──
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
      const mapped: ChurchEvent[] = (data.events ?? []).map((e: any) => ({
        id: e.id,
        title: e.title,
        date: e.date ?? undefined,
        dateRange: e.dateRange ?? undefined,
        recurrence: e.recurrence ?? undefined,
        time: e.time,
        location: e.location,
        description: e.description,
        color: e.color ?? "bg-indigo-500",
        featured: e.featured ?? false,
        imageUrl: e.imageUrl ?? undefined,
      }));
      setEvents(mapped);
    } catch {
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEvents(); }, []);

  // ── Restore admin session from a previously stored token ──
  useEffect(() => {
    const stored = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!stored) return;
    apiClient.admin_verify({ token: stored })
      .then(res => res.json())
      .then(data => {
        if (data.valid) {
          setAdminToken(stored);
          setIsAdmin(true);
        } else {
          localStorage.removeItem(ADMIN_TOKEN_KEY);
        }
      })
      .catch(() => localStorage.removeItem(ADMIN_TOKEN_KEY));
  }, []);

  // Auth header for admin-only requests.
  const authHeaders = () => ({ headers: { "X-Admin-Token": adminToken ?? "" } });

  // ── Admin login ──
  const handleLogin = async () => {
    if (!passwordInput.trim()) return;
    setLoginLoading(true);
    setLoginError("");
    try {
      const res = await apiClient.admin_login({ password: passwordInput });
      const data = await res.json();
      if (data.token) {
        setAdminToken(data.token);
        setIsAdmin(true);
        localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
        setLoginOpen(false);
        setPasswordInput("");
        toast.success("Admin mode enabled");
      } else {
        setLoginError("Incorrect password. Please try again.");
      }
    } catch {
      setLoginError("Incorrect password. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  // ── Admin logout ──
  const handleLogout = async () => {
    if (adminToken) {
      try { await apiClient.admin_logout({ token: adminToken }); } catch { /* ignore */ }
    }
    setIsAdmin(false);
    setAdminToken(null);
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    toast.success("Admin mode disabled");
  };

  // ── Open Add dialog ──
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

  // ── Open Edit dialog ──
  const openEdit = (event: ChurchEvent) => {
    setEditingEvent(event);
    setForm({
      title: event.title,
      time: event.time,
      location: event.location,
      description: event.description,
      color: (event as any).color ?? "bg-indigo-500",
      featured: (event as any).featured ?? false,
      imageUrl: (event as any).imageUrl ?? null,
      date: event.date ?? null,
      dateRange: event.dateRange ?? null,
      recurrence: event.recurrence ?? null,
    });
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

  // ── Build save payload ──
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

  // ── Save event ──
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
      setDialogOpen(false);
      await loadEvents();
    } catch {
      toast.error("Failed to save event. Your admin session may have expired — try logging in again.");
    } finally {
      setSaving(false);
    }
  };

  // ── Copy feed URL ──
  const handleCopyFeed = async () => {
    try {
      await navigator.clipboard.writeText(subscriptionFeedUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — please copy the link manually");
    }
  };

  // ── Delete event ──
  const handleDelete = async (id: number) => {
    try {
      await apiClient.delete_event({ eventId: id }, authHeaders());
      toast.success("Event deleted");
      setDeleteConfirmId(null);
      await loadEvents();
    } catch {
      toast.error("Failed to delete event. Your admin session may have expired — try logging in again.");
    }
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="absolute inset-0 bg-grid-white/[0.02] -z-10" />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background/80 -z-10" />

      <div className="container px-4 md:px-6 mx-auto">
        {/* Back link */}
        <button
          onClick={() => navigate("/events")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Events
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-12">
          <div>
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl mb-2">Church Calendar</h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Browse all upcoming services, studies, and special events. Click any date to see what's happening.
            </p>
          </div>

          {/* Admin controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Visitor: subscribe to the calendar feed */}
            <Button variant="outline" size="lg" onClick={() => { setCopied(false); setSubscribeOpen(true); }}>
              <Bell className="mr-2 h-4 w-4" /> Subscribe
            </Button>
            {isAdmin && (
              <>
                <Button onClick={openAdd} size="lg">
                  <Plus className="mr-2 h-4 w-4" /> Add Event
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleLogout}
                  title="Exit admin mode"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            )}
            {!isAdmin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setPasswordInput(""); setLoginError(""); setLoginOpen(true); }}
                className="text-muted-foreground hover:text-foreground"
                title="Admin login"
              >
                <Lock className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Admin mode banner */}
        {isAdmin && (
          <div className="flex items-center gap-2 text-sm text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-2 mb-6">
            <Unlock className="h-4 w-4 flex-shrink-0" />
            <span>Admin mode is active — you can add, edit, and delete events.</span>
          </div>
        )}

        {/* Calendar */}
        {loading ? (
          <Skeleton className="h-[600px] w-full rounded-xl" />
        ) : (
          <ChurchCalendar
            events={events}
            onEdit={isAdmin ? openEdit : undefined}
            onDelete={isAdmin ? (id) => setDeleteConfirmId(id) : undefined}
          />
        )}
      </div>

      {/* ── Admin Login Dialog ── */}
      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" /> Admin Login
            </DialogTitle>
            <DialogDescription>
              Enter the admin password to unlock event management controls.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              type="password"
              placeholder="Password"
              value={passwordInput}
              onChange={e => { setPasswordInput(e.target.value); setLoginError(""); }}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              autoFocus
            />
            {loginError && (
              <p className="text-sm text-destructive flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" /> {loginError}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLoginOpen(false)}>Cancel</Button>
            <Button onClick={handleLogin} disabled={loginLoading || !passwordInput.trim()}>
              {loginLoading ? "Verifying..." : "Login"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Subscribe Dialog ── */}
      <Dialog open={subscribeOpen} onOpenChange={setSubscribeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" /> Subscribe to the Calendar
            </DialogTitle>
            <DialogDescription>
              Subscribe once and every event — including future additions and changes — syncs
              automatically into your calendar app, which will send you reminders.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <a href={subscriptionFeedWebcal()} className="block">
              <Button className="w-full">
                <CalendarPlus className="mr-2 h-4 w-4" /> Add to my calendar app
              </Button>
            </a>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Or copy the feed link</Label>
              <div className="flex gap-2">
                <Input readOnly value={subscriptionFeedUrl()} className="text-xs" onFocus={e => e.currentTarget.select()} />
                <Button variant="outline" size="icon" onClick={handleCopyFeed} title="Copy link">
                  {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="text-xs text-muted-foreground space-y-1.5 border-t border-border pt-3">
              <p><span className="font-medium text-foreground">Apple Calendar / Outlook:</span> click "Add to my calendar app" above, or paste the link via File → New Calendar Subscription.</p>
              <p><span className="font-medium text-foreground">Google Calendar:</span> Settings → Add calendar → From URL, then paste the copied link.</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSubscribeOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add / Edit Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editingEvent ? "Save Changes" : "Create Event"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ── */}
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
            <Button variant="destructive" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
