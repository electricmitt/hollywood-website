import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Calendar, Clock, MapPin, CalendarPlus, CalendarDays } from "lucide-react";
import { googleCalendarUrl, downloadEventIcs, nextOccurrence, formatSchedule } from "utils/calendarLinks";

export interface DetailEvent {
  title: string;
  time: string;
  location: string;
  description: string;
  imageUrl?: string | null;
  color?: string | null;
  date?: string | null;
  dateRange?: { start: string; end: string } | null;
  recurrence?: { type: string; dayOfWeek?: number | null } | null;
}

interface Props {
  event: DetailEvent | null;
  onOpenChange: (open: boolean) => void;
  /** Specific occurrence to add to calendar (e.g. the day clicked on the calendar). Defaults to the next occurrence. */
  occurrenceDate?: Date;
  /** When provided, shows a "View in Calendar" button that calls this. */
  onViewCalendar?: () => void;
}

/** Read-only event details with add-to-calendar and an optional link to the full calendar. */
export function EventDetailDialog({ event, onOpenChange, occurrenceDate, onViewCalendar }: Props) {
  const occurrence = occurrenceDate ?? (event ? nextOccurrence(event) : new Date());

  return (
    <Dialog open={event !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        {event && (
          <>
            {event.imageUrl && (
              <div className="-mx-6 -mt-6 mb-2 h-48 overflow-hidden">
                <img src={event.imageUrl} alt={event.title} className="object-cover w-full h-full" />
              </div>
            )}
            <DialogHeader>
              <DialogTitle className="text-2xl">{event.title}</DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar size={15} className="flex-shrink-0" />
                <span>{formatSchedule(event)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock size={15} className="flex-shrink-0" />
                <span>{event.time}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin size={15} className="flex-shrink-0" />
                <span>{event.location}</span>
              </div>
              {event.description && (
                <p className="text-sm leading-relaxed pt-2 whitespace-pre-line">{event.description}</p>
              )}
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              {onViewCalendar && (
                <Button variant="outline" onClick={onViewCalendar} className="w-full sm:w-auto">
                  <CalendarDays className="mr-2 h-4 w-4" /> View in Calendar
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="w-full sm:w-auto">
                    <CalendarPlus className="mr-2 h-4 w-4" /> Add to Calendar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() =>
                      window.open(googleCalendarUrl(event, occurrence), "_blank", "noopener,noreferrer")
                    }
                  >
                    Google Calendar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => downloadEventIcs(event, occurrence)}>
                    Apple / Outlook (.ics)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
