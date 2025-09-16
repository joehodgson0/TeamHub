import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Trophy, MapPin, Clock, Users } from "lucide-react";
import { format } from "date-fns";

export default function UpcomingFixturesWidget() {
  const { user } = useAuth();

  // Fetch upcoming events
  const { data: eventsResponse } = useQuery<{ success: boolean; events: any[] }>({
    queryKey: ['/api/events/upcoming-session'],
    enabled: !!user,
  });
  
  // Fetch user's teams for filtering and team name resolution
  const { data: teamsResponse } = useQuery<{ success: boolean; teams: any[] }>({
    queryKey: ['/api/teams/club', user?.clubId],
    enabled: !!user?.clubId,
  });
  
  // Fetch user's players for filtering
  const { data: playersResponse } = useQuery<{ success: boolean; players: any[] }>({
    queryKey: ['/api/players/parent', user?.id],
    enabled: !!user && user?.roles.includes('parent'),
  });

  // Fetch match results to exclude fixtures with results
  const { data: matchResultsResponse } = useQuery<{ success: boolean; matchResults: any[] }>({
    queryKey: ['/api/match-results-session'],
    enabled: !!user,
  });
  
  const getUpcomingFixtures = () => {
    if (!user || !eventsResponse?.events) return [];

    let events = eventsResponse.events.map(event => ({
      ...event,
      startTime: new Date(event.startTime),
      endTime: new Date(event.endTime)
    }));
    
    // Filter to only show fixtures (matches and tournaments only)
    events = events.filter(event => event.type === "match" || event.type === "tournament");
    
    // Filter out fixtures that already have match results
    if (matchResultsResponse?.matchResults) {
      const fixturesWithResults = new Set(
        matchResultsResponse.matchResults.map((result: any) => result.fixtureId)
      );
      events = events.filter(event => !fixturesWithResults.has(event.id));
    }
    
    // NOTE: The backend /api/events/upcoming-session already filters events appropriately
    // for coaches (all club teams) and parents (player teams), so we don't need to
    // filter again on the frontend. Only filter if user has neither coach nor parent roles.
    if (!user.roles.includes("coach") && !user.roles.includes("parent")) {
      // For other users, filter to their direct team associations
      events = events.filter(event => user.teamIds?.includes(event.teamId));
    }

    return events.slice(0, 2); // Show only next 2 fixtures
  };

  const upcomingFixtures = getUpcomingFixtures();

  const getAvailabilityCount = (fixture: any) => {
    const availabilityEntries = Object.values(fixture.availability || {});
    const confirmed = availabilityEntries.filter(status => status === "available").length;
    const total = availabilityEntries.length;
    return { confirmed, total };
  };

  const getTeamName = (teamId: string) => {
    if (!teamsResponse?.teams) return "Unknown Team";
    const team = teamsResponse.teams.find((team: any) => team.id === teamId);
    return team ? team.name : "Unknown Team";
  };

  const formatFixtureTime = (date: Date) => {
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

  const getFixtureTypeColor = (type: string, friendly: boolean = false) => {
    if (type === "match") {
      return friendly 
        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" 
        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    }
    if (type === "tournament") {
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    }
    return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  };

  const getFixtureDisplayType = (fixture: any) => {
    if (fixture.type === "match") {
      return fixture.friendly ? "Friendly" : "Match";
    }
    return fixture.type.charAt(0).toUpperCase() + fixture.type.slice(1);
  };

  return (
    <Card data-testid="widget-upcoming-fixtures">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Trophy className="w-5 h-5 text-primary" />
          <span>Upcoming Fixtures</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {upcomingFixtures.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No upcoming fixtures</p>
            </div>
          ) : (
            upcomingFixtures.map((fixture) => {
              const availability = getAvailabilityCount(fixture);
              
              return (
                <div
                  key={fixture.id}
                  className="border border-border rounded-lg p-4 space-y-3"
                  data-testid={`fixture-${fixture.id}`}
                >
                  {/* Header with type and name */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge className={getFixtureTypeColor(fixture.type, fixture.friendly)} data-testid={`fixture-type-${fixture.id}`}>
                        {getFixtureDisplayType(fixture)}
                      </Badge>
                      <h4 className="font-medium text-sm" data-testid={`fixture-name-${fixture.id}`}>
                        {fixture.name}
                      </h4>
                    </div>
                  </div>

                  {/* Team */}
                  {fixture.teamId && (
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="text-muted-foreground">Team:</span>
                      <span className="font-medium text-primary" data-testid={`fixture-team-${fixture.id}`}>
                        {getTeamName(fixture.teamId)}
                      </span>
                    </div>
                  )}

                  {/* Opponent */}
                  {fixture.opponent && (
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="text-muted-foreground">vs</span>
                      <span className="font-medium" data-testid={`fixture-opponent-${fixture.id}`}>
                        {fixture.opponent}
                      </span>
                    </div>
                  )}

                  {/* Date, Time and Location */}
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-3 h-3" />
                      <span data-testid={`fixture-datetime-${fixture.id}`}>
                        {formatFixtureTime(fixture.startTime)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-3 h-3" />
                      <span data-testid={`fixture-location-${fixture.id}`}>
                        {fixture.location}
                      </span>
                    </div>
                  </div>

                  {/* Player Availability */}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <Users className="w-3 h-3" />
                      <span data-testid={`fixture-availability-${fixture.id}`}>
                        {availability.confirmed}/{availability.total} available
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}