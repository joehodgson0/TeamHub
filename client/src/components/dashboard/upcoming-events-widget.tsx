import { useAuth } from "@/hooks/use-auth";
import { useStorage } from "@/hooks/use-storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ExternalLink, Trophy, Clock } from "lucide-react";
import { format } from "date-fns";

export default function UpcomingEventsWidget() {
  const { user } = useAuth();
  const { storage } = useStorage();

  const getUpcomingEvents = () => {
    if (!user) return [];

    let fixtures = storage.getUpcomingFixtures();
    
    // Filter fixtures based on user's teams
    if (user.roles.includes("coach")) {
      const userTeams = storage.getTeamsByManagerId(user.id);
      const teamIds = userTeams.map(team => team.id);
      fixtures = fixtures.filter(fixture => teamIds.includes(fixture.teamId));
    } else if (user.roles.includes("parent")) {
      const userPlayers = storage.getPlayersByParentId(user.id);
      const teamIds = userPlayers.map(player => player.teamId);
      fixtures = fixtures.filter(fixture => teamIds.includes(fixture.teamId));
    }

    return fixtures.slice(0, 3); // Show only next 3 events
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

  return (
    <Card data-testid="widget-upcoming-events">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-primary" />
            <span>Upcoming Events</span>
          </CardTitle>
          <Button variant="ghost" size="sm" data-testid="button-view-all-events">
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
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
                className="flex items-center space-x-3 p-3 bg-muted/50 rounded-md"
                data-testid={`event-${event.id}`}
              >
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  {getEventIcon(event.type)}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm" data-testid={`event-name-${event.id}`}>
                    {event.name}
                  </p>
                  <p className="text-xs text-muted-foreground" data-testid={`event-time-${event.id}`}>
                    {formatEventTime(event.startTime)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
