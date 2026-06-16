import { useEffect, useState } from "react";
import { apiClient } from "app";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, MapPin, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { ChurchEvent } from "../apiclient/data-contracts";

// Convert API event recurrence/date into a human-readable string
function scheduleLabel(event: ChurchEvent): string {
  const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  if (event.recurrence?.type === "weekly" && event.recurrence.dayOfWeek !== undefined) {
    return `Every ${DAY_NAMES[event.recurrence.dayOfWeek]}`;
  }
  if (event.recurrence?.type === "monthly-last" && event.recurrence.dayOfWeek !== undefined) {
    return `Last ${DAY_NAMES[event.recurrence.dayOfWeek]} of each month`;
  }
  if (event.dateRange) {
    return `${event.dateRange.start} – ${event.dateRange.end}`;
  }
  if (event.date) return event.date;
  return "";
}

export default function Events() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get_events()
      .then(res => res.json())
      .then(data => setEvents(data.events ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const featured = events.filter(e => e.featured);
  const regular = events.filter(e => !e.featured);

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="absolute inset-0 bg-grid-white/[0.02] -z-10" />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background/80 -z-10" />

      <div className="container px-4 md:px-6 mx-auto">
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
                            <span>{scheduleLabel(event)}</span>
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
                        <Button className="w-full mt-auto">Learn More</Button>
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
                          <span>{scheduleLabel(event)}</span>
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
                      <Button variant="outline" className="w-full mt-auto">View Details</Button>
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
                  Don't miss out on our special events and gatherings. Sign up to
                  receive notifications and reserve your spot at our upcoming church
                  activities.
                </p>
                <Button className="bg-white text-purple-900 hover:bg-white/90">Sign Up Now</Button>
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
    </div>
  );
}
