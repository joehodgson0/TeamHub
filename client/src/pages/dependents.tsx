import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useStorage } from "@/hooks/use-storage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, CheckCircle, Trophy } from "lucide-react";
import { format } from "date-fns";
import AddPlayerModal from "@/components/modals/add-player-modal";

export default function Dependents() {
  const { user, hasRole } = useAuth();
  const { storage } = useStorage();
  const [showAddModal, setShowAddModal] = useState(false);

  const canAddPlayer = hasRole("parent");
  const players = user ? storage.getPlayersByParentId(user.id) : [];

  const getPlayerTeam = (teamId: string) => {
    return storage.getTeamById(teamId);
  };

  const getPlayerAge = (dateOfBirth: Date) => {
    const today = new Date();
    const age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      return age - 1;
    }
    return age;
  };

  const getRecentActivity = (playerId: string) => {
    const playerFixtures = storage.getFixtures()
      .filter(fixture => {
        const team = getPlayerTeam(fixture.teamId);
        return team && team.playerIds.includes(playerId);
      })
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, 3);

    return playerFixtures.map(fixture => ({
      ...fixture,
      isAttended: fixture.availability[playerId] === "available" && fixture.startTime < new Date(),
    }));
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

      {players.length === 0 ? (
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
                {players.map((player) => {
                  const team = getPlayerTeam(player.teamId);
                  const age = getPlayerAge(player.dateOfBirth);
                  const attendanceRate = player.totalEvents > 0 
                    ? Math.round((player.attendance / player.totalEvents) * 100)
                    : 0;

                  return (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                      data-testid={`player-card-${player.id}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-primary font-semibold">
                            {player.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </span>
                        </div>
                        <div>
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
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {attendanceRate}% Attendance
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        data-testid={`button-view-player-${player.id}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity for First Player */}
          {players.length > 0 && (
            <Card data-testid="card-recent-activity">
              <CardHeader>
                <CardTitle>{players[0].name}'s Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {getRecentActivity(players[0].id).map((activity) => (
                    <div
                      key={activity.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg border ${
                        activity.isAttended 
                          ? "bg-green-50 border-green-200" 
                          : activity.type === "match"
                          ? "bg-blue-50 border-blue-200"
                          : "bg-muted/50 border-border"
                      }`}
                      data-testid={`activity-${activity.id}`}
                    >
                      {activity.isAttended ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : activity.type === "match" ? (
                        <Trophy className="w-5 h-5 text-blue-600" />
                      ) : (
                        <div className="w-5 h-5 bg-muted rounded-full" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-sm" data-testid={`activity-name-${activity.id}`}>
                          {activity.isAttended ? `${activity.name} (Attended)` : activity.name}
                        </p>
                        <p className="text-xs text-muted-foreground" data-testid={`activity-date-${activity.id}`}>
                          {format(activity.startTime, "EEEE, MMM d 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {getRecentActivity(players[0].id).length === 0 && (
                    <div className="text-center py-6 text-muted-foreground">
                      <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No recent activity</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <AddPlayerModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
      />
    </div>
  );
}
