import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { format } from "date-fns";

// Mock club events for demo
const clubEvents = [
  {
    id: "event1",
    title: "Club AGM",
    date: new Date(2025, 2, 15), // March 15, 2025
    type: "meeting"
  },
  {
    id: "event2", 
    title: "Fundraising Event",
    date: new Date(2025, 2, 22), // March 22, 2025
    type: "fundraiser"
  },
  {
    id: "event3",
    title: "End of Season Awards",
    date: new Date(2025, 3, 5), // April 5, 2025
    type: "awards"
  }
];

export default function ClubCalendar() {
  return (
    <Card data-testid="card-club-calendar">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-primary" />
          <span>Club Calendar</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {clubEvents.map((event) => (
            <div
              key={event.id}
              className="text-sm p-2 bg-muted/50 rounded"
              data-testid={`club-event-${event.id}`}
            >
              <p className="font-medium" data-testid={`event-title-${event.id}`}>
                {event.title}
              </p>
              <p className="text-muted-foreground text-xs" data-testid={`event-date-${event.id}`}>
                {format(event.date, "MMMM do")}
              </p>
            </div>
          ))}
          
          {clubEvents.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              <Calendar className="w-6 h-6 mx-auto mb-2 opacity-50" />
              <p className="text-xs">No upcoming club events</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
