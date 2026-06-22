import { useEffect, useState } from "react";
import { apiClient } from "app";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar, MapPin, Clock, Bell, Lock, LogOut, Plus, Pencil, Trash2, Unlock, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { subscriptionFeedWebcal, formatSchedule } from "utils/calendarLinks";
import { useAdminSession } from "utils/useAdminSession";
import { EventFormDialog } from "components/EventFormDialog";
import { AdminLoginDialog } from "components/AdminLoginDialog";
import { EventDetailDialog } from "components/EventDetailDialog";
import { toast } from "sonner";
import type { ChurchEvent } from "../apiclient/data-contracts";

export default function Events() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Admin session ──
  const { isAdmin, authHeaders, login, logout } = useAdminSession();
  const [loginOpen, setLoginOpen] = useState(false);

  // ── Event edit/delete state ──
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ChurchEvent | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // ── Visitor detail view ──
  const [detailEvent, setDetailEvent] = useState<ChurchEvent | null>(null);

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

  const handleLogout = async () => {
    await logout();
    toast.success("Admin mode disabled");
  };

  const openAdd = () => { setEditingEvent(null); setDialogOpen(true); };
  const openEdit = (event: ChurchEvent) => { setEditingEvent(event); setDialogOpen(true); };

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

  const featured = events.filter(e => e.featured);
  const regular = events.filter(e => !e.featured);

  // Small admin edit/delete row shown on each card when logged in.
  const adminActions = (event: ChurchEvent) => (
    isAdmin && (
      <div className="flex gap-2 mb-4">
        <Button size="sm" variant="outline" onClick={() => openEdit(event)}>
          <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
        </Button>
        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteConfirmId(event.id)}>
          <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
        </Button>
      </div>
    )
  );

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="absolute inset-0 bg-grid-white/[0.02] -z-10" />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background/80 -z-10" />

      <div className="container px-4 md:px-6 mx-auto">
        {/* Admin controls */}
        <div className="flex justify-end mb-4">
          {isAdmin ? (
            <div className="flex items-center gap-2">
              <Button onClick={openAdd}>
                <Plus className="mr-2 h-4 w-4" /> Add Event
              </Button>
              <Button variant="outline" onClick={handleLogout} title="Exit admin mode">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
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

        {/* Admin mode banner */}
        {isAdmin && (
          <div className="flex items-center gap-2 text-sm text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-2 mb-6">
            <Unlock className="h-4 w-4 flex-shrink-0" />
            <span>Admin mode is active — you can add, edit, and delete events.</span>
          </div>
        )}

        {/* Hero */}
        <div className="flex flex-col items-center text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl mb-6">Events</h1>
          <p className="text-xl text-muted-foreground max-w-3xl">
            Join us for worship, fellowship, and spiritual growth opportunities.
          </p>
        </div>

        {/* Featured Events */}
        {(loading || featured.length > 0) && (
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-8">Upcoming Special Events</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {loading
                ? [1, 2].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)
                : featured.map(event => (
                  <Card key={event.id} className="overflow-hidden hover:shadow-md transition-all">
                    <div className="grid md:grid-cols-2">
                      <div className="h-60 md:h-full relative overflow-hidden">
                        {event.imageUrl ? (
                          <img
                            src={event.imageUrl}
                            alt={event.title}
                            className="object-cover w-full h-full transition-transform duration-500 hover:scale-105"
                          />
                        ) : (
                          <div className={`w-full h-full ${event.color ?? "bg-indigo-500"} opacity-80`} />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:hidden flex flex-col justify-end p-4">
                          <h3 className="text-white font-bold text-xl mb-2">{event.title}</h3>
                        </div>
                      </div>
                      <CardContent className="p-6 flex flex-col">
                        <div className="md:block hidden">
                          <h3 className="text-2xl font-bold mb-2">{event.title}</h3>
                        </div>
                        <div className="flex flex-col space-y-3 mb-4">
                          <div className="flex items-center text-muted-foreground">
                            <Calendar size={16} className="mr-2" />
                            <span>{formatSchedule(event)}</span>
                          </div>
                          <div className="flex items-center text-muted-foreground">
                            <Clock size={16} className="mr-2" />
                            <span>{event.time}</span>
                          </div>
                          <div className="flex items-center text-muted-foreground">
                            <MapPin size={16} className="mr-2" />
                            <span>{event.location}</span>
                          </div>
                        </div>
                        <p className="text-muted-foreground mb-6 flex-grow">{event.description}</p>
                        {adminActions(event)}
                        <Button className="w-full mt-auto" onClick={() => setDetailEvent(event)}>Learn More</Button>
                      </CardContent>
                    </div>
                  </Card>
                ))}
            </div>
          </section>
        )}

        {/* Regular Events */}
        {(loading || regular.length > 0) && (
          <section className="mb-16">
            <h2 className="text-2xl font-bold mb-8">Regular Events</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading
                ? [1, 2, 3].map(i => <Skeleton key={i} className="h-72 rounded-xl" />)
                : regular.map(event => (
                  <Card key={event.id} className="overflow-hidden hover:shadow-md transition-all flex flex-col h-full">
                    <div className="aspect-video relative overflow-hidden">
                      {event.imageUrl ? (
                        <img
                          src={event.imageUrl}
                          alt={event.title}
                          className="object-cover w-full h-full transition-transform duration-500 hover:scale-105"
                        />
                      ) : (
                        <div className={`w-full h-full ${event.color ?? "bg-indigo-500"} opacity-80`} />
                      )}
                    </div>
                    <CardContent className="p-6 flex flex-col flex-grow">
                      <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                      <div className="flex flex-col space-y-2 mb-4">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar size={14} className="mr-2" />
                          <span>{formatSchedule(event)}</span>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock size={14} className="mr-2" />
                          <span>{event.time}</span>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin size={14} className="mr-2" />
                          <span>{event.location}</span>
                        </div>
                      </div>
                      <p className="text-muted-foreground mb-4 flex-grow">{event.description}</p>
                      {adminActions(event)}
                      <Button variant="outline" className="w-full mt-auto" onClick={() => setDetailEvent(event)}>View Details</Button>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </section>
        )}

        {/* Calendar CTA */}
        <section className="mb-16">
          <div className="bg-card border border-border rounded-xl p-8 md:p-12 flex flex-col items-center text-center gap-6">
            <div className="w-14 h-14 rounded-full bg-indigo-500/10 flex items-center justify-center">
              <Calendar className="h-7 w-7 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">View the Full Calendar</h2>
              <p className="text-muted-foreground max-w-md">
                Browse every service and event laid out by month. Click any date
                to see exactly what's happening that day.
              </p>
            </div>
            <Button size="lg" onClick={() => navigate("/calendarpage")}>
              <Calendar className="mr-2 h-5 w-5" />
              Open Calendar
            </Button>
          </div>
        </section>

        {/* Registration CTA */}
        <section>
          <div className="bg-gradient-to-r from-purple-900 to-indigo-800 rounded-lg overflow-hidden shadow-lg">
            <div className="grid md:grid-cols-2">
              <div className="p-8 md:p-10">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                  Register for Upcoming Events
                </h2>
                <p className="text-white/90 mb-6">
                  Don't miss out on our special events and gatherings. Subscribe to our
                  calendar and every event syncs to your phone or computer automatically —
                  with reminders before each one.
                </p>
                <div className="flex flex-wrap gap-3">
                  <a href={subscriptionFeedWebcal()}>
                    <Button className="bg-white text-purple-900 hover:bg-white/90">
                      <Bell className="mr-2 h-4 w-4" /> Subscribe for Reminders
                    </Button>
                  </a>
                  <Button
                    variant="outline"
                    className="border-white/40 bg-transparent text-white hover:bg-white/10"
                    onClick={() => navigate("/calendarpage")}
                  >
                    More Options
                  </Button>
                </div>
              </div>
              <div className="relative hidden md:block">
                <img
                  src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1000&auto=format&fit=crop"
                  alt="People at church event"
                  className="object-cover w-full h-full"
                />
                <div className="absolute inset-0 bg-black/20" />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ── Event Detail (visitor) ── */}
      <EventDetailDialog
        event={detailEvent}
        onOpenChange={(o) => { if (!o) setDetailEvent(null); }}
        onViewCalendar={() => { setDetailEvent(null); navigate("/calendarpage"); }}
      />

      {/* ── Admin Login Dialog ── */}
      <AdminLoginDialog open={loginOpen} onOpenChange={setLoginOpen} login={login} />

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
