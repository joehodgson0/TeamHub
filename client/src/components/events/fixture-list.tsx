import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Users } from "lucide-react";
import { format } from "date-fns";
import EditFixtureModal from "@/components/modals/edit-fixture-modal";
import MatchResultModal from "@/components/modals/match-result-modal";
import type { Fixture } from "@shared/schema";

export default function FixtureList() {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const [editingFixture, setEditingFixture] = useState<any | null>(null);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [matchResultFixture, setMatchResultFixture] = useState<any | null>(null);

  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events/upcoming-session'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events/team'] });
      toast({
        title: "Event Deleted",
        description: "The event has been deleted successfully.",
      });
      setDeletingEventId(null);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete event. Please try again.",
      });
      setDeletingEventId(null);
    },
  });

  const updateAvailabilityMutation = useMutation({
    mutationFn: async ({ eventId, playerId, availability }: { eventId: string; playerId: string; availability: string }) => {
      const response = await fetch(`/api/events/${eventId}/availability`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ playerId, availability }),
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events/upcoming-session'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({
        title: "Availability Updated",
        description: "Player availability has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update availability. Please try again.",
      });
    },
  });

  const handleDeleteEvent = (eventId: string, eventName: string) => {
    if (window.confirm(`Are you sure you want to delete "${eventName}"? This action cannot be undone.`)) {
      setDeletingEventId(eventId);
      deleteEventMutation.mutate(eventId);
    }
  };

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
    enabled: !!user && hasRole('parent'),
  });

  // Fetch match results to exclude fixtures with results
  const { data: matchResultsResponse } = useQuery<{ success: boolean; matchResults: any[] }>({
    queryKey: ['/api/match-results-session'],
    enabled: !!user,
  });

  const getFixtures = () => {
    if (!user || !eventsResponse?.events) return [];

    let events = eventsResponse.events.map(event => ({
      ...event,
      startTime: new Date(event.startTime),
      endTime: new Date(event.endTime),
      createdAt: new Date(event.createdAt)
    }));

    // Filter by user's teams - coaches only see their own teams
    if (hasRole("coach") && user?.teamIds) {
      events = events.filter(event => user.teamIds.includes(event.teamId));
    } else if (hasRole("parent") && playersResponse?.players) {
      const teamIds = playersResponse.players.map(player => player.teamId);
      events = events.filter(event => teamIds.includes(event.teamId));
    }

    // Filter to only show matches and tournaments (exclude all other event types)
    events = events.filter(event => event.type === "match" || event.type === "tournament");

    // Filter out fixtures that already have match results
    if (matchResultsResponse?.matchResults) {
      const fixturesWithResults = new Set(
        matchResultsResponse.matchResults.map((result: any) => result.fixtureId)
      );
      events = events.filter(event => !fixturesWithResults.has(event.id));
    }

    return events;
  };

  const fixtures = getFixtures();
  const isCoach = hasRole("coach");
  const isParent = hasRole("parent");

  // Check if coach can manage this specific fixture
  const canManageFixture = (fixture: any) => {
    return isCoach && user?.teamIds?.includes(fixture.teamId);
  };

  const handleAvailabilityUpdate = (eventId: string, playerId: string, availability: string) => {
    updateAvailabilityMutation.mutate({ eventId, playerId, availability });
  };

  const getFixtureTypeColor = (type: string, friendly: boolean = false) => {
    if (type === "match") {
      return friendly 
        ? "bg-green-100 text-green-700"
        : "bg-blue-100 text-blue-700";
    }
    switch (type) {
      case "training": return "bg-accent/10 text-accent";
      case "tournament": return "bg-purple-100 text-purple-700";
      case "social": return "bg-green-100 text-green-700";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getFixtureDisplayType = (fixture: any) => {
    if (fixture.type === "match") {
      const homeAway = fixture.homeAway?.charAt(0).toUpperCase() + fixture.homeAway?.slice(1) || "Home";
      const matchType = fixture.friendly ? "Friendly" : "Match";
      return `${homeAway} ${matchType}`;
    }
    return fixture.type.charAt(0).toUpperCase() + fixture.type.slice(1);
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

  const getTeamName = (teamId: string) => {
    if (!teamsResponse?.teams) return "Unknown Team";
    const team = teamsResponse.teams.find((team: any) => team.id === teamId);
    return team ? team.name : "Unknown Team";
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
                const availability = getAvailabilityCount(fixture);

                return (
                  <div
                    key={fixture.id}
                    className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    data-testid={`fixture-${fixture.id}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <Badge className={getFixtureTypeColor(fixture.type, fixture.friendly)} data-testid={`fixture-type-${fixture.id}`}>
                          {getFixtureDisplayType(fixture)}
                        </Badge>
                        <h4 className="font-medium" data-testid={`fixture-name-${fixture.id}`}>
                          {fixture.name}
                        </h4>
                        {fixture.teamId && (
                          <span className="text-sm text-primary font-medium" data-testid={`fixture-team-${fixture.id}`}>
                            ({getTeamName(fixture.teamId)})
                          </span>
                        )}
                      </div>
                      {canManageFixture(fixture) && (
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
                            onClick={() => handleDeleteEvent(fixture.id, fixture.name || 'event')}
                            disabled={deletingEventId === fixture.id}
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
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-muted-foreground" data-testid={`fixture-availability-${fixture.id}`}>
                          Availability: {availability.confirmed}/{availability.total} confirmed
                        </span>
                        {canManageFixture(fixture) && fixture.type === "match" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-accent hover:bg-accent/10"
                            onClick={() => setMatchResultFixture(fixture)}
                            data-testid={`button-update-result-${fixture.id}`}
                          >
                            Update Result
                          </Button>
                        )}
                      </div>
                      
                      {/* Parent availability controls */}
                      {isParent && playersResponse?.players && (
                        <div className="space-y-2">
                          {playersResponse.players
                            .filter(player => player.teamId === fixture.teamId)
                            .map(player => {
                              const playerAvailability = fixture.availability?.[player.id] || "pending";
                              return (
                                <div key={player.id} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                                  <span className="text-sm font-medium" data-testid={`player-name-${player.id}`}>
                                    {player.name}
                                  </span>
                                  <div className="flex items-center space-x-1">
                                    <Button
                                      variant={playerAvailability === "available" ? "default" : "outline"}
                                      size="sm"
                                      className="h-7 px-2 text-xs"
                                      onClick={() => handleAvailabilityUpdate(fixture.id, player.id, "available")}
                                      disabled={updateAvailabilityMutation.isPending}
                                      data-testid={`button-available-${player.id}-${fixture.id}`}
                                    >
                                      Available
                                    </Button>
                                    <Button
                                      variant={playerAvailability === "unavailable" ? "destructive" : "outline"}
                                      size="sm"
                                      className="h-7 px-2 text-xs"
                                      onClick={() => handleAvailabilityUpdate(fixture.id, player.id, "unavailable")}
                                      disabled={updateAvailabilityMutation.isPending}
                                      data-testid={`button-unavailable-${player.id}-${fixture.id}`}
                                    >
                                      Unavailable
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      )}
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

      {matchResultFixture && (
        <MatchResultModal
          fixture={matchResultFixture}
          open={!!matchResultFixture}
          onOpenChange={(open: boolean) => !open && setMatchResultFixture(null)}
        />
      )}
    </>
  );
}
