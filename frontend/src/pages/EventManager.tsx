import { useEffect, useState } from "react";
import { apiClient } from "app";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Pencil, Trash2, Plus, Calendar, MapPin, Clock, AlertCircle, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAdminSession } from "utils/useAdminSession";
import { formatSchedule } from "utils/calendarLinks";
import { EventFormDialog } from "components/EventFormDialog";
import type { ChurchEvent } from "../apiclient/data-contracts";

export default function EventManager() {
  const navigate = useNavigate();
  const { adminToken, authChecked, authHeaders } = useAdminSession();
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ChurchEvent | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

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

  const openAdd = () => { setEditingEvent(null); setDialogOpen(true); };
  const openEdit = (event: ChurchEvent) => { setEditingEvent(event); setDialogOpen(true); };

  const handleDelete = async (id: number) => {
    try {
      await apiClient.delete_event({ eventId: id }, authHeaders());
      toast.success("Event deleted");
      setDeleteConfirmId(null);
      await loadEvents();
    } catch {
      toast.error("Failed to delete event. Your admin session may have expired — log in again.");
    }
  };

  // Wait for the session check before rendering anything, so non-admins never
  // see the management UI flash on screen.
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-16">
        <div className="container px-4 md:px-6 mx-auto max-w-5xl">
          <div className="h-24 rounded-xl bg-card border border-border animate-pulse" />
        </div>
      </div>
    );
  }

  // Admin-only gate: without a valid session, send users to the calendar login.
  if (!adminToken) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-16">
        <div className="container px-4 md:px-6 mx-auto max-w-md">
          <div className="bg-card border border-border rounded-xl p-8 flex flex-col items-center text-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Lock className="h-6 w-6 text-amber-500" />
            </div>
            <h1 className="text-2xl font-bold">Admin Access Required</h1>
            <p className="text-muted-foreground text-sm">
              Sign in as an administrator from the calendar to manage events.
            </p>
            <Button onClick={() => navigate("/calendarpage")}>Go to Calendar to Log In</Button>
          </div>
        </div>
      </div>
    );
  }

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
                    <span className="flex items-center gap-1"><Calendar size={13} />{formatSchedule(event) || "—"}</span>
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
      <EventFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingEvent={editingEvent}
        authHeaders={authHeaders}
        onSaved={loadEvents}
      />

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
