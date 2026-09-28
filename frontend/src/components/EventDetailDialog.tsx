import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Calendar, Clock, MapPin, CalendarPlus, CalendarDays, Pencil, Trash2, CalendarX } from "lucide-react";
import { googleCalendarUrl, downloadEventIcs } from "utils/calendarLinks";
import { describeSchedule, linkOccurrence, timeLabel } from "utils/eventSchedule";
import type { ChurchEvent } from "../apiclient/data-contracts";

interface Props {
  event: ChurchEvent | null;
  onOpenChange: (open: boolean) => void;
  /** Specific occurrence to add to calendar (e.g. the day clicked on the calendar). Defaults to the next occurrence. */
  occurrenceDate?: Date;
  /** When provided, shows a "View in Calendar" button that calls this. */
  onViewCalendar?: () => void;
  /** Admin actions — each is shown only when provided. */
  onEdit?: (event: ChurchEvent) => void;
  onDelete?: (event: ChurchEvent) => void;
  /** Skip just this occurrence of a repeating event (needs occurrenceDate). */
  onSkipDate?: (event: ChurchEvent, day: Date) => void;
}

/** Event details with add-to-calendar, plus admin actions when enabled. */
export function EventDetailDialog({ event, onOpenChange, occurrenceDate, onViewCalendar, onEdit, onDelete, onSkipDate }: Props) {
  const occurrence = occurrenceDate ?? (event ? linkOccurrence(event) : new Date());
  const canSkip = !!(onSkipDate && event?.recurrence && occurrenceDate);
  const hasAdminActions = !!(onEdit || onDelete || canSkip);

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
                <span>{describeSchedule(event)}</span>
              </div>
              {timeLabel(event) && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock size={15} className="flex-shrink-0" />
                  <span>{timeLabel(event)}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin size={15} className="flex-shrink-0" />
                <span>{event.location}</span>
              </div>
              {event.description && (
                <p className="text-sm leading-relaxed pt-2 whitespace-pre-line">{event.description}</p>
              )}
            </div>

            {hasAdminActions && (
              <div className="flex flex-wrap gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                {onEdit && (
                  <Button size="sm" variant="outline" onClick={() => onEdit(event)}>
                    <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
                  </Button>
                )}
                {canSkip && (
                  <Button size="sm" variant="outline" onClick={() => onSkipDate!(event, occurrenceDate!)}>
                    <CalendarX className="mr-1.5 h-3.5 w-3.5" />
                    Skip {occurrenceDate!.toLocaleDateString("en-US", { month: "short", day: "numeric" })} only
                  </Button>
                )}
                {onDelete && (
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => onDelete(event)}>
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete{event.recurrence ? " series" : ""}
                  </Button>
                )}
              </div>
            )}

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
