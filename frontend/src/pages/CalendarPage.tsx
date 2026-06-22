import { useEffect, useState } from "react";
import { apiClient } from "app";
import { ChurchCalendar, type ChurchEvent } from "components/ChurchCalendar";
import { EventFormDialog } from "components/EventFormDialog";
import { AdminLoginDialog } from "components/AdminLoginDialog";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, AlertCircle, Lock, Unlock, LogOut, Bell, Copy, Check, CalendarPlus } from "lucide-react";
import { subscriptionFeedUrl, subscriptionFeedWebcal } from "utils/calendarLinks";
import { useAdminSession } from "utils/useAdminSession";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function CalendarPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Admin session ──
  const { isAdmin, authHeaders, login, logout } = useAdminSession();
  const [loginOpen, setLoginOpen] = useState(false);

  // ── Subscribe dialog state ──
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // ── Event dialog state ──
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ChurchEvent | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

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

  const handleLogout = async () => {
    await logout();
    toast.success("Admin mode disabled");
  };

  const openAdd = () => { setEditingEvent(null); setDialogOpen(true); };
  const openEdit = (event: ChurchEvent) => { setEditingEvent(event); setDialogOpen(true); };

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
                onClick={() => setLoginOpen(true)}
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
      <AdminLoginDialog open={loginOpen} onOpenChange={setLoginOpen} login={login} />

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
      <EventFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingEvent={editingEvent}
        authHeaders={authHeaders}
        onSaved={loadEvents}
      />

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
