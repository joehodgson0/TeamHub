import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Users } from "lucide-react";
import { format } from "date-fns";
import EditFixtureModal from "@/components/modals/edit-fixture-modal";
import MatchResultModal from "@/components/modals/match-result-modal";
import type { Fixture } from "@shared/schema";
import { getEventParticipationPhase } from "@shared/event-participation";

type EventRosterPlayer = { id: string; name: string };

function PlayerAvailabilityBreakdown({ fixture, canManage }: { fixture: any; canManage: boolean }) {
  const { toast } = useToast();
  const { data: playersResponse, isLoading, isError } = useQuery<{ success: boolean; players: EventRosterPlayer[] }>({
    queryKey: ['/api/events', fixture.id, 'roster'],
    enabled: !!fixture.id,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const updateStatus = useMutation({
    mutationFn: async ({ playerId, status, kind }: { playerId: string; status: string; kind: "availability" | "attendance" }) => {
      const response = await apiRequest("PUT", `/api/events/${fixture.id}/${kind}`, {
        playerId,
        [kind]: status,
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events/all-session'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events/upcoming-session'] });
    },
    onError: (error: Error) => toast({ variant: "destructive", title: "Update failed", description: error.message }),
  });

  if (isLoading) {
    return <p className="text-xs text-muted-foreground mt-2">Loading player availability...</p>;
  }
  if (isError) {
    return <p className="mt-2 text-xs text-destructive">The event player list could not be loaded.</p>;
  }

  const players = playersResponse?.players || [];
  if (players.length === 0) return null;
  const phase = getEventParticipationPhase(fixture.startTime, fixture.endTime);

  const groups = {
    available: players.filter((player) => fixture.availability?.[player.id] === "available"),
    unavailable: players.filter((player) => fixture.availability?.[player.id] === "unavailable"),
    pending: players.filter((player) => !fixture.availability?.[player.id] || fixture.availability[player.id] === "pending"),
  };
  const attendanceGroups = {
    attended: players.filter((player) => fixture.attendance?.[player.id] === "attended"),
    absent: players.filter((player) => fixture.attendance?.[player.id] === "absent"),
    pending: players.filter((player) => !fixture.attendance?.[player.id]),
  };

  const renderNames = (group: EventRosterPlayer[]) => group.length > 0
    ? group.map((player) => player.name).join(", ")
    : "None";

  return (
    <div className="grid gap-2 mt-3 sm:grid-cols-3" data-testid={`availability-breakdown-${fixture.id}`}>
      <p className="text-sm font-semibold sm:col-span-3">Player availability</p>
      <div className="rounded-md border border-green-200 bg-green-50 p-2">
        <p className="text-xs font-semibold text-green-800">Available ({groups.available.length})</p>
        <p className="mt-1 text-xs text-green-700">{renderNames(groups.available)}</p>
      </div>
      <div className="rounded-md border border-red-200 bg-red-50 p-2">
        <p className="text-xs font-semibold text-red-800">Not available ({groups.unavailable.length})</p>
        <p className="mt-1 text-xs text-red-700">{renderNames(groups.unavailable)}</p>
      </div>
      <div className="rounded-md border border-amber-200 bg-amber-50 p-2">
        <p className="text-xs font-semibold text-amber-800">Awaiting response ({groups.pending.length})</p>
        <p className="mt-1 text-xs text-amber-700">{renderNames(groups.pending)}</p>
      </div>
      {phase === "completed" && (
        <>
          <p className="mt-1 text-sm font-semibold sm:col-span-3">Recorded attendance</p>
          <div className="rounded-md border border-green-200 bg-green-50 p-2">
            <p className="text-xs font-semibold text-green-800">Attended ({attendanceGroups.attended.length})</p>
            <p className="mt-1 text-xs text-green-700">{renderNames(attendanceGroups.attended)}</p>
          </div>
          <div className="rounded-md border border-red-200 bg-red-50 p-2">
            <p className="text-xs font-semibold text-red-800">Absent ({attendanceGroups.absent.length})</p>
            <p className="mt-1 text-xs text-red-700">{renderNames(attendanceGroups.absent)}</p>
          </div>
          <div className="rounded-md border border-amber-200 bg-amber-50 p-2">
            <p className="text-xs font-semibold text-amber-800">Not recorded ({attendanceGroups.pending.length})</p>
            <p className="mt-1 text-xs text-amber-700">{renderNames(attendanceGroups.pending)}</p>
          </div>
        </>
      )}
      {canManage && (
        <div className="sm:col-span-3 mt-1 space-y-2">
          <p className="text-sm font-semibold">
            {phase === "upcoming"
              ? "Set player availability"
              : phase === "completed"
                ? "Record actual attendance"
                : "Event in progress - attendance can be recorded after it ends"}
          </p>
          {phase !== "in_progress" && players.map((player) => {
            const isCompleted = phase === "completed";
            const status = isCompleted
              ? fixture.attendance?.[player.id]
              : fixture.availability?.[player.id] || "pending";
            return (
              <div key={player.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted/40 p-2">
                <span className="text-sm font-medium">{player.name}</span>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant={status === (isCompleted ? "attended" : "available") ? "default" : "outline"}
                    className="h-7 px-2 text-xs"
                    disabled={updateStatus.isPending}
                    onClick={() => updateStatus.mutate({
                      playerId: player.id,
                      status: isCompleted ? "attended" : "available",
                      kind: isCompleted ? "attendance" : "availability",
                    })}
                  >
                    {isCompleted ? "Attended" : "Available"}
                  </Button>
                  <Button
                    size="sm"
                    variant={status === (isCompleted ? "absent" : "unavailable") ? "destructive" : "outline"}
                    className="h-7 px-2 text-xs"
                    disabled={updateStatus.isPending}
                    onClick={() => updateStatus.mutate({
                      playerId: player.id,
                      status: isCompleted ? "absent" : "unavailable",
                      kind: isCompleted ? "attendance" : "availability",
                    })}
                  >
                    {isCompleted ? "Absent" : "Not available"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function FixtureList() {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const [eventView, setEventView] = useState<"upcoming" | "past">("upcoming");
  const [editingFixture, setEditingFixture] = useState<any | null>(null);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [matchResultFixture, setMatchResultFixture] = useState<any | null>(null);

  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const response = await apiRequest("DELETE", `/api/events/${eventId}`);
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
      const response = await apiRequest("PUT", `/api/events/${eventId}/availability`, {
        playerId,
        availability,
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events/all-session'] });
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
    queryKey: ['/api/events/all-session'],
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

  const getFixtures = () => {
    if (!user || !eventsResponse?.events) return [];

    let events = eventsResponse.events.map(event => ({
      ...event,
      startTime: new Date(event.startTime),
      endTime: new Date(event.endTime),
      createdAt: new Date(event.createdAt)
    }));

    // Filter by user's teams - show fixtures for both coached teams and dependent teams
    let allowedTeamIds: string[] = [];
    
    if (hasRole("coach") && user?.teamIds) {
      // Add teams the user coaches
      allowedTeamIds.push(...user.teamIds);
    }
    
    if (hasRole("parent") && playersResponse?.players) {
      // Add teams where user has dependents
      const parentTeamIds = playersResponse.players.map(player => player.teamId);
      allowedTeamIds.push(...parentTeamIds);
    }
    
    // Remove duplicates and filter events
    allowedTeamIds = [...new Set(allowedTeamIds)];
    if (allowedTeamIds.length > 0) {
      events = events.filter(event => allowedTeamIds.includes(event.teamId));
    }

    // Show all event types (match, tournament, training, social)
    // No filtering by type - show everything

    const now = new Date();
    return events
      .filter((event) => eventView === "upcoming" ? event.endTime >= now : event.endTime < now)
      .sort((a, b) => eventView === "upcoming"
        ? a.startTime.getTime() - b.startTime.getTime()
        : b.startTime.getTime() - a.startTime.getTime());
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
    if (fixture.type === "tournament") return "Tournament";
    if (fixture.type === "training") return "Training";
    if (fixture.type === "social") return "Social Event";
    return fixture.type.charAt(0).toUpperCase() + fixture.type.slice(1);
  };

  const getAvailabilityCount = (fixture: any) => {
    const availabilityEntries = Object.values(fixture.availability || {});
    const confirmed = availabilityEntries.filter(status => status === "available").length;
    const unavailable = availabilityEntries.filter(status => status === "unavailable").length;
    return { confirmed, unavailable };
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

  const getEventName = (fixture: any) => {
    if (fixture.name) return fixture.name;
    if (fixture.type === "match" && fixture.opponent) {
      return `vs ${fixture.opponent}`;
    }
    if (fixture.type === "training") return "Training Session";
    if (fixture.type === "social") return "Social Event";
    if (fixture.type === "tournament") return "Tournament";
    return "Event";
  };

  return (
    <>
      <Card data-testid="card-fixtures">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Events & Fixtures</CardTitle>
          <div className="flex rounded-md border border-border p-1" aria-label="Filter events">
            <Button
              type="button"
              size="sm"
              variant={eventView === "upcoming" ? "default" : "ghost"}
              className="h-8"
              onClick={() => setEventView("upcoming")}
            >
              Upcoming
            </Button>
            <Button
              type="button"
              size="sm"
              variant={eventView === "past" ? "default" : "ghost"}
              className="h-8"
              onClick={() => setEventView("past")}
            >
              Past
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {fixtures.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                 <p className="text-lg font-medium mb-2">
                   {eventView === "upcoming" ? "No Upcoming Events" : "No Past Events"}
                 </p>
                <p className="text-sm">
                   {eventView === "upcoming"
                     ? (isCoach ? "Create your first event to get started" : "No events scheduled")
                     : "Completed events will appear here"}
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
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-1">
                          <Badge className={getFixtureTypeColor(fixture.type, fixture.friendly)} data-testid={`fixture-type-${fixture.id}`}>
                            {getFixtureDisplayType(fixture)}
                          </Badge>
                          {fixture.teamId && (
                            <span className="text-sm text-primary font-medium" data-testid={`fixture-team-${fixture.id}`}>
                              {getTeamName(fixture.teamId)}
                            </span>
                          )}
                        </div>
                        <h4 className="font-medium" data-testid={`fixture-name-${fixture.id}`}>
                          {getEventName(fixture)}
                        </h4>
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
                            onClick={() => handleDeleteEvent(fixture.id, getEventName(fixture))}
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

                    {fixture.type === "match" && fixture.opponent && (
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
                          Responses: {availability.confirmed} available, {availability.unavailable} not available
                        </span>
                        {canManageFixture(fixture) && fixture.type === "match" && new Date() > fixture.endTime && (
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

                      <PlayerAvailabilityBreakdown fixture={fixture} canManage={canManageFixture(fixture)} />
                      
                      {/* Parent availability controls */}
                      {isParent && !canManageFixture(fixture) && new Date() < fixture.startTime && playersResponse?.players && (
                        <div className="space-y-2 mt-3">
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
