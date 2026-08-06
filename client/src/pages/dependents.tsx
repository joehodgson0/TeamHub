import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil } from "lucide-react";
import AddPlayerModal from "@/components/modals/add-player-modal";
import DependentDetailsModal from "@/components/modals/dependent-details-modal";
import type { Player, Team } from "@shared/schema";

export default function Dependents() {
  const { user, hasRole } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editPlayer, setEditPlayer] = useState<Player | null>(null);

  const canAddPlayer = hasRole("parent");

  // Fetch players from database API
  const { data: playersData, isLoading: playersLoading, refetch: refetchPlayers } = useQuery<{ success: boolean; players: Player[] }>({
    queryKey: ['/api/players/parent', user?.id],
    enabled: Boolean(user && canAddPlayer),
  });

  const players = playersData?.players || [];

  // Fetch teams data for player teams
  const { data: teamsData } = useQuery<{ success: boolean; teams: Team[] }>({
    queryKey: ['/api/teams/club', user?.clubId],
    enabled: Boolean(user?.clubId),
  });

  const teams = teamsData?.teams || [];

  const getPlayerTeam = (teamId: string): Team | undefined => {
    return teams.find((team: Team) => team.id === teamId);
  };

  const getPlayerAge = (dateOfBirth: Date | string) => {
    const today = new Date();
    const birthDate = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1;
    }
    return age;
  };

  return (
    <div className="space-y-6" data-testid="dependents-page">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" data-testid="heading-dependents">Dependents</h1>
        {canAddPlayer && (
          <Button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2"
            data-testid="button-add-dependent"
          >
            <Plus className="w-4 h-4" />
            <span>Add Dependent</span>
          </Button>
        )}
      </div>

      {playersLoading ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading dependents...</p>
            </div>
          </CardContent>
        </Card>
      ) : players.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Plus className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Dependents Added</h3>
              <p className="text-muted-foreground mb-4">
                Add your children to teams to start tracking their activities and events.
              </p>
              {canAddPlayer && (
                <Button onClick={() => setShowAddModal(true)} data-testid="button-add-first-dependent">
                  Add Your First Dependent
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Players List */}
          <Card data-testid="card-my-dependents">
            <CardHeader>
              <CardTitle>My Dependents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {players.map((player: Player) => {
                  const team = getPlayerTeam(player.teamId);
                  const age = getPlayerAge(player.dateOfBirth);

                  return (
                    <div
                      key={player.id}
                      className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg"
                      data-testid={`player-card-${player.id}`}
                    >
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-primary font-semibold">
                          {player.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium" data-testid={`player-name-${player.id}`}>
                          {player.name}
                        </h4>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <span data-testid={`player-team-${player.id}`}>
                            {team?.name || "Unknown Team"}
                          </span>
                          <span>•</span>
                          <span data-testid={`player-age-${player.id}`}>Age {age}</span>
                        </div>
                        {/* Profile completion indicator */}
                        {!player.consentPhotograph && (
                          <Badge variant="outline" className="mt-1 text-xs text-amber-600 border-amber-300">
                            Details incomplete
                          </Badge>
                        )}
                      </div>
                      {canAddPlayer && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-shrink-0"
                          onClick={() => setEditPlayer(player)}
                          data-testid={`button-edit-player-${player.id}`}
                        >
                          <Pencil className="w-4 h-4" />
                          <span className="sr-only">Edit details</span>
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add dependent – uses full details form */}
      <DependentDetailsModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSuccess={() => refetchPlayers()}
      />

      {/* Edit dependent details */}
      {editPlayer && (
        <DependentDetailsModal
          open={Boolean(editPlayer)}
          onOpenChange={(open) => { if (!open) setEditPlayer(null); }}
          player={editPlayer}
          onSuccess={() => refetchPlayers()}
        />
      )}
    </div>
  );
}
