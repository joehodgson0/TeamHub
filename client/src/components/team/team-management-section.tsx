import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Edit, Eye } from "lucide-react";

export default function TeamManagementSection() {
  const { user, hasRole } = useAuth();
  const isCoach = hasRole("coach");

  // Fetch teams from database API
  const { data: teamsData = { teams: [] }, isLoading } = useQuery({
    queryKey: ['/api/teams/manager', user?.id],
    enabled: Boolean(user && isCoach), // Only fetch for coaches for now
  });

  const teams = teamsData.teams || [];

  return (
    <Card data-testid="card-current-teams">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-primary" />
          <span>{isCoach ? "Your Teams" : "Associated Teams"}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-6 text-muted-foreground">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm">Loading teams...</p>
            </div>
          ) : teams.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {isCoach ? "No teams created yet" : "No teams associated"}
              </p>
              <p className="text-xs mt-1">
                {isCoach 
                  ? "Create your first team to get started" 
                  : "Join a team using a team code"
                }
              </p>
            </div>
          ) : (
            teams.map((team) => {
              if (!team) return null;
              
              const playerCount = team.playerIds?.length || 0;
              const totalGames = (team.wins || 0) + (team.draws || 0) + (team.losses || 0);

              return (
                <div
                  key={team.id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                  data-testid={`team-card-${team.id}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium" data-testid={`team-name-${team.id}`}>
                        {team.name || 'Unknown Team'}
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        {team.ageGroup || 'Unknown'}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span data-testid={`team-players-${team.id}`}>
                        {playerCount} players
                      </span>
                      {totalGames > 0 && (
                        <>
                          <span>•</span>
                          <span data-testid={`team-record-${team.id}`}>
                            {team.wins || 0}W {team.draws || 0}D {team.losses || 0}L
                          </span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1" data-testid={`team-code-${team.id}`}>
                      Code: {team.code || 'Unknown'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {isCoach && (
                      <Button
                        variant="ghost"
                        size="sm"
                        data-testid={`button-edit-team-${team.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      data-testid={`button-view-team-${team.id}`}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            }).filter(Boolean)
          )}
        </div>
      </CardContent>
    </Card>
  );
}
