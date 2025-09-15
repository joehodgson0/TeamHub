import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users } from "lucide-react";
import { format } from "date-fns";

export default function TeamCalendar() {
  const { user } = useAuth();

  // Fetch upcoming events
  const { data: eventsResponse } = useQuery<{ success: boolean; events: any[] }>({
    queryKey: ['/api/events/upcoming-session'],
    enabled: !!user,
  });

  // Filter for only social events
  const getSocialEvents = () => {
    if (!eventsResponse?.events) return [];

    const socialEvents = eventsResponse.events
      .filter(event => event.type === "social")
      .map(event => ({
        ...event,
        startTime: new Date(event.startTime),
        endTime: new Date(event.endTime)
      }))
      .slice(0, 5); // Show up to 5 upcoming social events

    return socialEvents;
  };

  const socialEvents = getSocialEvents();

  const formatEventDate = (date: Date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today, ${format(date, "h:mm a")}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow, ${format(date, "h:mm a")}`;
    } else {
      return format(date, "MMM d, h:mm a");
    }
  };

  return (
    <Card data-testid="card-team-calendar">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-primary" />
          <span>Team Calendar</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {socialEvents.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Calendar className="w-8 h-8 mx-auto mb-3 opacity-50" />
              <p className="font-medium mb-1">No Upcoming Social Events</p>
              <p className="text-xs">Social events will appear here when scheduled</p>
            </div>
          ) : (
            socialEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-start space-x-3 p-3 bg-muted/50 rounded-md"
                data-testid={`social-event-${event.id}`}
              >
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 text-green-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate" data-testid={`event-name-${event.id}`}>
                    {event.name || 'Social Event'}
                  </p>
                  <p className="text-xs text-muted-foreground" data-testid={`event-time-${event.id}`}>
                    {formatEventDate(event.startTime)}
                  </p>
                  {event.location && (
                    <p className="text-xs text-muted-foreground truncate" data-testid={`event-location-${event.id}`}>
                      📍 {event.location}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}