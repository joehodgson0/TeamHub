import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart } from "lucide-react";

export default function TeamStatsWidget() {
  const { user } = useAuth();

  // Fetch user's players for filtering (for parents)
  const { data: playersResponse } = useQuery<{ success: boolean; players: any[] }>({
    queryKey: [`/api/players/parent/${user?.id}`],
    enabled: !!user?.id && user?.roles.includes('parent'),
  });

  // Fetch user's teams for filtering
  const { data: teamsResponse } = useQuery<{ success: boolean; teams: any[] }>({
    queryKey: [`/api/teams/club/${user?.clubId}`],
    enabled: !!user?.clubId && (
      user?.roles.includes('coach') || 
      (user?.roles.includes('parent') && !!playersResponse?.players)
    ),
  });

  const getTeamStats = () => {
    if (!user) return null;
    
    // Get teams based on user role
    let teams: any[] = [];
    if (user.roles.includes("coach") && teamsResponse?.teams) {
      teams = teamsResponse.teams;
    } else if (user.roles.includes("parent") && playersResponse?.players) {
      // Get unique teams from player's team IDs
      const teamIds = Array.from(new Set(playersResponse.players.map((player: any) => player.teamId)));
      teams = teamsResponse?.teams?.filter((team: any) => teamIds.includes(team.id)) || [];
    }

    if (teams.length === 0) return null;

    // Aggregate stats from all teams
    const totalStats = teams.reduce((acc, team) => ({
      wins: acc.wins + (team.wins || 0),
      draws: acc.draws + (team.draws || 0),
      losses: acc.losses + (team.losses || 0)
    }), { wins: 0, draws: 0, losses: 0 });

    const totalGames = totalStats.wins + totalStats.draws + totalStats.losses;
    const winRate = totalGames > 0 ? ((totalStats.wins / totalGames) * 100).toFixed(1) : "0.0";

    return {
      ...totalStats,
      winRate
    };
  };

  const stats = getTeamStats();

  if (!stats) {
    return (
      <Card data-testid="widget-team-stats">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart className="w-5 h-5 text-primary" />
            <span>Team Stats</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <BarChart className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No team data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="widget-team-stats">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BarChart className="w-5 h-5 text-primary" />
          <span>Team Stats</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary" data-testid="stat-wins">
              {stats.wins}
            </div>
            <div className="text-xs text-muted-foreground">Wins</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600" data-testid="stat-draws">
              {stats.draws}
            </div>
            <div className="text-xs text-muted-foreground">Draws</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-destructive" data-testid="stat-losses">
              {stats.losses}
            </div>
            <div className="text-xs text-muted-foreground">Losses</div>
          </div>
        </div>
        <div className="pt-3 border-t border-border mt-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Win Rate</span>
            <span className="font-medium" data-testid="stat-win-rate">{stats.winRate}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
