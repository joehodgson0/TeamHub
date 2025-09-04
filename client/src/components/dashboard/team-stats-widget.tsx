import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useStorage } from "@/hooks/use-storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart } from "lucide-react";

export default function TeamStatsWidget() {
  const { user } = useAuth();
  const { storage } = useStorage();
  const [selectedSeason, setSelectedSeason] = useState("current");

  const getTeamStats = () => {
    if (!user) return null;

    let teams: any[] = [];
    
    if (user.roles.includes("coach")) {
      teams = storage.getTeamsByManagerId(user.id);
    } else if (user.roles.includes("parent")) {
      const userPlayers = storage.getPlayersByParentId(user.id);
      const teamIds = Array.from(new Set(userPlayers.map(player => player.teamId)));
      teams = teamIds.map(id => storage.getTeamById(id)).filter(Boolean);
    }

    if (teams.length === 0) return null;

    // For simplicity, use the first team's stats
    const team = teams[0];
    const totalGames = team.wins + team.draws + team.losses;
    const winRate = totalGames > 0 ? ((team.wins / totalGames) * 100).toFixed(1) : "0.0";

    return {
      wins: team.wins,
      draws: team.draws,
      losses: team.losses,
      winRate,
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
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <BarChart className="w-5 h-5 text-primary" />
            <span>Team Stats</span>
          </CardTitle>
          <Select value={selectedSeason} onValueChange={setSelectedSeason} data-testid="select-season">
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Current Season</SelectItem>
              <SelectItem value="previous">Previous Season</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
