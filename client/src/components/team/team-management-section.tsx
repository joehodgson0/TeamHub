import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { clubAssociationSchema, type ClubAssociation, type Team } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Users, Edit, Plus, Building, Info, CheckCircle, XCircle, UserIcon } from "lucide-react";
import CreateTeamModal from "@/components/modals/create-team-modal";
import EditTeamModal from "@/components/modals/edit-team-modal";
import TeamJoinSection from "@/components/team/team-join-section";
import AddPlayerModal from "@/components/modals/add-player-modal";

export default function TeamManagementSection() {
  const { user, hasRole, associateWithClub } = useAuth();
  const { toast } = useToast();
  const isCoach = hasRole("coach");
  const isParent = hasRole("parent");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [showAddPlayerModal, setShowAddPlayerModal] = useState(false);
  
  const canCreateTeam = isCoach && user?.clubId;

  // Fetch club data from database
  const { data: clubData, isLoading: clubLoading } = useQuery<{ club: any }>({
    queryKey: ["/api/clubs", user?.clubId],
    enabled: !!user?.clubId,
  });
  
  const club = clubData?.club;

  const clubForm = useForm<ClubAssociation>({
    resolver: zodResolver(clubAssociationSchema),
    defaultValues: {
      clubCode: "",
    },
  });

  const onJoinClub = async (data: ClubAssociation) => {
    if (!user) return;

    setIsJoining(true);
    setFeedback(null);

    try {
      const result = await associateWithClub(user.id, data.clubCode);
      
      if (result.success) {
        setFeedback({
          type: "success",
          message: `Successfully joined ${result.clubName}!`
        });
        clubForm.reset();
        toast({
          title: "Club Association Successful",
          description: `You have joined ${result.clubName}`,
        });
      } else {
        setFeedback({
          type: "error",
          message: result.error || "Failed to join club"
        });
      }
    } catch (error) {
      setFeedback({
        type: "error",
        message: "An unexpected error occurred"
      });
    } finally {
      setIsJoining(false);
    }
  };

  // For coaches: fetch teams from their club
  const { data: teamsData, isLoading } = useQuery<{ success: boolean; teams: Team[] }>({
    queryKey: ['/api/teams/club', user?.clubId],
    enabled: Boolean(user && isCoach && user.clubId),
  });

  const teams = teamsData?.teams || [];

  // For parents: fetch players/dependents
  const { data: playersData, isLoading: playersLoading } = useQuery<{ success: boolean; players: any[] }>({
    queryKey: ['/api/players/parent', user?.id],
    enabled: Boolean(user && isParent),
  });

  const players = playersData?.players || [];

  // Fetch teams data for resolving team names for players - use user-based API for parents
  const { data: allTeamsData, isLoading: teamsLoading, error: teamsError } = useQuery<{ success: boolean; teams: any[] }>({
    queryKey: ['/api/teams/user', user?.id],
    enabled: Boolean(user?.id && isParent && players.length > 0),
  });

  const allTeams = allTeamsData?.teams || [];
  
  // Debug logging
  console.log('Teams query enabled:', Boolean(user?.id && isParent && players.length > 0));
  console.log('User ID:', user?.id);
  console.log('Is parent:', isParent);
  console.log('Players count:', players.length);
  console.log('Teams loading:', teamsLoading);
  console.log('Teams error:', teamsError);
  console.log('Teams data:', allTeamsData);
  console.log('All teams:', allTeams);

  // If user has no club AND has no roles (not coach or parent), show join club form
  if (!user?.clubId && !isCoach && !isParent) {
    return (
      <Card data-testid="card-join-club">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="w-5 h-5 text-primary" />
            <span>Join Club to Manage Teams</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You need to join a club before you can create or manage teams.
          </p>
          
          <Form {...clubForm}>
            <form onSubmit={clubForm.handleSubmit(onJoinClub)} className="space-y-4" data-testid="form-join-club">
              <FormField
                control={clubForm.control}
                name="clubCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Club Code</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter 8-character club code"
                        data-testid="input-club-code"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={isJoining}
                data-testid="button-join-club"
              >
                {isJoining ? "Joining..." : "Join Club"}
              </Button>
            </form>
          </Form>

          {feedback && (
            <Alert className={feedback.type === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"} data-testid="club-feedback">
              <div className="flex items-center space-x-2">
                {feedback.type === "success" ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                <AlertDescription className={feedback.type === "success" ? "text-green-800" : "text-red-800"}>
                  {feedback.message}
                </AlertDescription>
              </div>
            </Alert>
          )}

          <Alert data-testid="demo-info">
            <Info className="w-4 h-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Demo Information</p>
                <ul className="text-sm space-y-1">
                  <li>• Club: <strong>Hilly Fielders FC</strong></li>
                  <li>• Valid codes start with "1" (e.g., "1ABC2345")</li>
                  <li>• Invalid codes show error message</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Helper functions for dependents
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

  const getPlayerTeam = (teamId: string) => {
    return allTeams.find((team: any) => team.id === teamId);
  };

  // Show nothing if user has no roles
  if (!isCoach && !isParent) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Current Club Info - only show if user has a club */}
      {club && user?.clubId && (
        <Card data-testid="card-current-club">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building className="w-5 h-5 text-primary" />
              <span>Current Club</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 p-3 bg-primary/10 rounded-lg">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Building className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h4 className="font-semibold" data-testid="text-club-name">{club.name}</h4>
                <p className="text-sm text-muted-foreground" data-testid="text-club-established">
                  Established {club.established}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Teams Management - Only for Coaches */}
      {isCoach && (
        <Card data-testid="card-current-teams">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-primary" />
              <span>{isCoach ? "Your Teams" : "Associated Teams"}</span>
            </div>
            {canCreateTeam && (
              <Button
                onClick={() => setShowCreateModal(true)}
                size="sm"
                data-testid="button-create-team"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Team
              </Button>
            )}
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
              teams.map((team: Team) => {
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
                          onClick={() => {
                            setEditingTeam(team);
                            setShowEditModal(true);
                          }}
                          data-testid={`button-edit-team-${team.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              }).filter(Boolean)
            )}
          </div>
        </CardContent>
        
        <CreateTeamModal 
          open={showCreateModal} 
          onOpenChange={setShowCreateModal} 
        />
        <EditTeamModal 
          open={showEditModal} 
          onOpenChange={setShowEditModal}
          team={editingTeam}
        />
      </Card>
      )}

      {/* Dependents Management - Only for Parents */}
      {isParent && (
        <Card data-testid="card-dependents">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <UserIcon className="w-5 h-5 text-primary" />
                <span>Dependents</span>
              </div>
              <Button
                onClick={() => setShowAddPlayerModal(true)}
                size="sm"
                data-testid="button-add-dependent"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Dependent
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {playersLoading ? (
                <div className="text-center py-6 text-muted-foreground">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-sm">Loading dependents...</p>
                </div>
              ) : players.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <UserIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No dependents added yet</p>
                  <p className="text-xs mt-1">Add your first dependent to get started</p>
                </div>
              ) : (
                players.map((player: any) => {
                  const age = getPlayerAge(player.dateOfBirth);
                  const team = getPlayerTeam(player.teamId);
                  const attendanceRate = player.totalEvents > 0 
                    ? Math.round((player.attendance / player.totalEvents) * 100) 
                    : 0;

                  return (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                      data-testid={`player-card-${player.id}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium" data-testid={`player-name-${player.id}`}>
                            {player.name}
                          </h4>
                          {team && (
                            <Badge variant="outline" className="text-xs">
                              {team.ageGroup}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span data-testid={`player-team-${player.id}`}>
                            {team?.name || "Unknown Team"}
                          </span>
                          <span>•</span>
                          <span data-testid={`player-age-${player.id}`}>
                            Age {age}
                          </span>
                          <span>•</span>
                          <span data-testid={`player-attendance-${player.id}`}>
                            {attendanceRate}% attendance
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
      )}

      {/* Team Join Section for Parents */}
      {isParent && user?.clubId && (
        <TeamJoinSection />
      )}

      {/* Modals */}
      <CreateTeamModal 
        open={showCreateModal} 
        onOpenChange={setShowCreateModal} 
      />
      <EditTeamModal 
        open={showEditModal} 
        onOpenChange={setShowEditModal}
        team={editingTeam}
      />
      <AddPlayerModal 
        open={showAddPlayerModal} 
        onOpenChange={setShowAddPlayerModal} 
      />
    </div>
  );
}
