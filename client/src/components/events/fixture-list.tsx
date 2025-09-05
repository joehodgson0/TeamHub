import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Users } from "lucide-react";
import { format } from "date-fns";
import EditFixtureModal from "@/components/modals/edit-fixture-modal";
import type { Fixture } from "@shared/schema";

export default function FixtureList() {
  const { user, hasRole } = useAuth();
  const [editingFixture, setEditingFixture] = useState<any | null>(null);

  // Fetch upcoming events
  const { data: eventsResponse } = useQuery<{ success: boolean; events: any[] }>({
    queryKey: ['/api/events/upcoming'],
    enabled: !!user,
  });
  
  // Fetch user's teams for filtering
  const { data: teamsResponse } = useQuery<{ success: boolean; teams: any[] }>({
    queryKey: ['/api/teams/club', user?.clubId],
    enabled: !!user?.clubId && hasRole('coach'),
  });
  
  // Fetch user's players for filtering
  const { data: playersResponse } = useQuery<{ success: boolean; players: any[] }>({
    queryKey: ['/api/players/parent', user?.id],
    enabled: !!user && hasRole('parent'),
  });

  const getFixtures = () => {
    if (!user || !eventsResponse?.events) return [];

    let events = eventsResponse.events.map(event => ({
      ...event,
      startTime: new Date(event.startTime),
      endTime: new Date(event.endTime),
      createdAt: new Date(event.createdAt)
    }));

    // Filter by user's teams
    if (hasRole("coach") && teamsResponse?.teams) {
      const teamIds = teamsResponse.teams.map(team => team.id);
      events = events.filter(event => teamIds.includes(event.teamId));
    } else if (hasRole("parent") && playersResponse?.players) {
      const teamIds = playersResponse.players.map(player => player.teamId);
      events = events.filter(event => teamIds.includes(event.teamId));
    }

    return events;
  };

  const fixtures = getFixtures();
  const isCoach = hasRole("coach");

  const getFixtureTypeColor = (type: string) => {
    switch (type) {
      case "match": return "bg-primary/10 text-primary";
      case "friendly": return "bg-secondary/10 text-secondary";
      case "training": return "bg-accent/10 text-accent";
      case "tournament": return "bg-purple-100 text-purple-700";
      case "social": return "bg-green-100 text-green-700";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getAvailabilityCount = (fixture: any) => {
    const availabilityEntries = Object.values(fixture.availability || {});
    const confirmed = availabilityEntries.filter(status => status === "available").length;
    const total = availabilityEntries.length;
    return { confirmed, total };
  };

  const formatFixtureTime = (startTime: Date, endTime: Date) => {
    if (startTime.toDateString() === endTime.toDateString()) {
      return `${format(startTime, "MMM d, h:mm a")} - ${format(endTime, "h:mm a")}`;
    }
    return `${format(startTime, "MMM d, h:mm a")} - ${format(endTime, "MMM d, h:mm a")}`;
  };

  return (
    <>
      <Card data-testid="card-fixtures">
        <CardHeader>
          <CardTitle>Upcoming Fixtures</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {fixtures.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No Upcoming Fixtures</p>
                <p className="text-sm">
                  {isCoach ? "Create your first fixture to get started" : "No events scheduled"}
                </p>
              </div>
            ) : (
              fixtures.map((fixture) => {
                // Team info would be fetched if needed
                const availability = getAvailabilityCount(fixture);

                return (
                  <div
                    key={fixture.id}
                    className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    data-testid={`fixture-${fixture.id}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Badge className={getFixtureTypeColor(fixture.type)} data-testid={`fixture-type-${fixture.id}`}>
                          {fixture.type.charAt(0).toUpperCase() + fixture.type.slice(1)}
                        </Badge>
                        <h4 className="font-medium" data-testid={`fixture-name-${fixture.id}`}>
                          {fixture.name}
                        </h4>
                      </div>
                      {isCoach && (
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingFixture(fixture)}
                            data-testid={`button-edit-fixture-${fixture.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10"
                            data-testid={`button-delete-fixture-${fixture.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                      <div>
                        <p className="text-muted-foreground">Date & Time</p>
                        <p className="font-medium" data-testid={`fixture-datetime-${fixture.id}`}>
                          {formatFixtureTime(fixture.startTime, fixture.endTime)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Location</p>
                        <p className="font-medium" data-testid={`fixture-location-${fixture.id}`}>
                          {fixture.location}
                        </p>
                      </div>
                    </div>

                    {fixture.opponent && (
                      <div className="mb-3">
                        <p className="text-muted-foreground text-sm">Opponent</p>
                        <p className="font-medium" data-testid={`fixture-opponent-${fixture.id}`}>
                          {fixture.opponent}
                        </p>
                      </div>
                    )}

                    {fixture.additionalInfo && (
                      <div className="mb-3">
                        <p className="text-muted-foreground text-sm">Additional Information</p>
                        <p className="text-sm" data-testid={`fixture-info-${fixture.id}`}>
                          {fixture.additionalInfo}
                        </p>
                      </div>
                    )}

                    <div className="pt-3 border-t border-border">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground" data-testid={`fixture-availability-${fixture.id}`}>
                          Availability: {availability.confirmed}/{availability.total} confirmed
                        </span>
                        {isCoach && fixture.type === "match" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-accent hover:bg-accent/10"
                            data-testid={`button-update-result-${fixture.id}`}
                          >
                            Update Result
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {editingFixture && (
        <EditFixtureModal
          fixture={editingFixture}
          open={!!editingFixture}
          onOpenChange={(open: boolean) => !open && setEditingFixture(null)}
        />
      )}
    </>
  );
}
