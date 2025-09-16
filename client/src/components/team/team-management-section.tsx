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
import { Users, Edit, Plus, Building, Info, CheckCircle, XCircle } from "lucide-react";
import CreateTeamModal from "@/components/modals/create-team-modal";
import EditTeamModal from "@/components/modals/edit-team-modal";

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
        const clubName = (result as any).clubName || 'the club';
        setFeedback({
          type: "success",
          message: `Successfully joined ${clubName}!`
        });
        clubForm.reset();
        toast({
          title: "Club Association Successful",
          description: `You have joined ${clubName}`,
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
  const canCreateTeam = isCoach && user?.clubId && teams.length === 0;

  // Helper component for individual team with players
  const TeamWithPlayers = ({ team, isCoach, setEditingTeam, setShowEditModal }: { 
    team: Team, 
    isCoach: boolean, 
    setEditingTeam: (team: Team) => void, 
    setShowEditModal: (show: boolean) => void 
  }) => {
    const { data: playersData, isLoading: playersLoading } = useQuery<{ success: boolean; players: any[] }>({
      queryKey: ['/api/players/team', team.id],
      enabled: Boolean(team?.id),
    });

    const teamPlayers = playersData?.players || [];
    const playerCount = teamPlayers.length;
    const totalGames = (team.wins || 0) + (team.draws || 0) + (team.losses || 0);

    return (
      <div
        className="p-4 bg-muted/50 rounded-lg space-y-3"
        data-testid={`team-card-${team.id}`}
      >
        {/* Team Header */}
        <div className="flex items-center justify-between">
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

        {/* Players List */}
        {playersLoading ? (
          <div className="text-center py-2 text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-1"></div>
            <p className="text-xs">Loading players...</p>
          </div>
        ) : teamPlayers.length === 0 ? (
          <div className="text-center py-2 text-muted-foreground">
            <p className="text-xs">No players in this team yet</p>
          </div>
        ) : (
          <div className="space-y-1" data-testid={`players-list-${team.id}`}>
            <p className="text-xs font-medium text-muted-foreground mb-2">Players:</p>
            <div className="grid grid-cols-1 gap-1">
              {teamPlayers.map((player: any) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between text-xs p-2 bg-background/50 rounded"
                  data-testid={`player-item-${team.id}-${player.id}`}
                >
                  <span className="font-medium">{player.name}</span>
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    {player.position && (
                      <span>{player.position}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };


  // If user has no club AND (has no roles OR is a coach), show join club form
  if (!user?.clubId && (!isCoach && !isParent || isCoach)) {
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
                return (
                  <TeamWithPlayers
                    key={team.id}
                    team={team}
                    isCoach={isCoach}
                    setEditingTeam={setEditingTeam}
                    setShowEditModal={setShowEditModal}
                  />
                );
              })
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
    </div>
  );
}
