import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Trophy, Clock, MapPin, Users } from "lucide-react";
import { format } from "date-fns";
import { getEventMeetTime } from "@shared/event-duration";

export default function UpcomingEventsWidget() {
  const { user } = useAuth();

  // Fetch upcoming events
  const { data: eventsResponse } = useQuery<{ success: boolean; events: any[] }>({
    queryKey: ['/api/events/upcoming-session'],
    enabled: !!user,
  });
  
  // Fetch user's teams for filtering
  const { data: teamsResponse } = useQuery<{ success: boolean; teams: any[] }>({
    queryKey: ['/api/teams/club', user?.clubId],
    enabled: !!user?.clubId,
  });
  
  // Fetch user's players for filtering
  const { data: playersResponse } = useQuery<{ success: boolean; players: any[] }>({
    queryKey: ['/api/players/parent', user?.id],
    enabled: !!user && user?.roles.includes('parent'),
  });
  
  const getUpcomingEvents = () => {
    if (!user || !eventsResponse?.events) return [];

    let events = eventsResponse.events.map(event => ({
      ...event,
      startTime: new Date(event.startTime),
      endTime: new Date(event.endTime)
    }));
    
    // Filter out fixtures (matches and friendlies) - only show events
    events = events.filter(event => 
      event.type !== "match" && event.type !== "friendly"
    );
    
    // Filter events based on user's teams
    if (user.roles.includes("coach") && teamsResponse?.teams) {
      const teamIds = teamsResponse.teams.map(team => team.id);
      events = events.filter(event => teamIds.includes(event.teamId));
    } else if (user.roles.includes("parent") && playersResponse?.players) {
      const teamIds = playersResponse.players.map(player => player.teamId);
      events = events.filter(event => teamIds.includes(event.teamId));
    }

    return events
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
      .slice(0, 3); // Show only next 3 events
  };

  const upcomingEvents = getUpcomingEvents();

  const getEventIcon = (type: string) => {
    switch (type) {
      case "match":
      case "friendly":
        return <Trophy className="text-primary text-sm" />;
      case "training":
        return <Clock className="text-secondary text-sm" />;
      default:
        return <Calendar className="text-accent text-sm" />;
    }
  };

  const formatEventTime = (date: Date) => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === now.toDateString()) {
      return `Today, ${format(date, "h:mm a")}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow, ${format(date, "h:mm a")}`;
    } else {
      return format(date, "MMM d, h:mm a");
    }
  };

  const getEventTitle = (event: any) => {
    if (event.name) return event.name;
    if (event.type === "training") return "Training Session";
    if (event.type === "tournament") return "Tournament";
    if (event.type === "social") return "Social Event";
    return "Event";
  };

  const getEventType = (event: any) => {
    if (event.type === "training") return "Training";
    if (event.type === "tournament") return "Tournament";
    if (event.type === "social") return "Social";
    return event.type;
  };

  const getTeamName = (teamId: string) => {
    const team = teamsResponse?.teams?.find((item: any) => item.id === teamId);
    return team?.ageGroup ? `${team.ageGroup} ${team.name}` : team?.name;
  };

  return (
    <Card data-testid="widget-upcoming-events">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-primary" />
          <span>Upcoming Events</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {upcomingEvents.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No upcoming events</p>
            </div>
          ) : (
            upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-start space-x-3 rounded-lg border border-border bg-muted/30 p-3"
                data-testid={`event-${event.id}`}
              >
                <div className="w-10 h-10 shrink-0 bg-primary/10 rounded-full flex items-center justify-center">
                  {getEventIcon(event.type)}
                </div>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-sm" data-testid={`event-name-${event.id}`}>
                      {getEventTitle(event)}
                    </p>
                    <Badge variant="secondary" className="shrink-0 text-[10px] uppercase">
                      {getEventType(event)}
                    </Badge>
                  </div>
                  {event.teamId && getTeamName(event.teamId) && (
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      {getTeamName(event.teamId)}
                    </p>
                  )}
                  {event.meetBeforeMinutes > 0 && (
                    <p className="flex items-center gap-1.5 text-xs font-medium text-primary" data-testid={`event-meet-time-${event.id}`}>
                      <Clock className="h-3.5 w-3.5" />
                      Meet: {formatEventTime(getEventMeetTime(event.startTime, event.meetBeforeMinutes))}
                    </p>
                  )}
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground" data-testid={`event-time-${event.id}`}>
                    <Calendar className="h-3.5 w-3.5" />
                    {event.meetBeforeMinutes > 0 ? "Starts: " : ""}{formatEventTime(event.startTime)}
                  </p>
                  {event.location && (
                    <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span>{event.location}</span>
                    </p>
                  )}
                  {event.additionalInfo && (
                    <p className="border-t border-border pt-1.5 text-xs text-muted-foreground">
                      {event.additionalInfo}
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
