import { useAuth } from "@/hooks/use-auth";
import { useStorage } from "@/hooks/use-storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import { format } from "date-fns";

export default function MatchResultsWidget() {
  const { user } = useAuth();
  const { storage } = useStorage();

  const getRecentResults = () => {
    if (!user) return [];

    let fixtures = storage.getFixtures()
      .filter(fixture => fixture.result && fixture.startTime < new Date())
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

    // Filter by user's teams
    if (user.roles.includes("coach")) {
      const userTeams = storage.getTeamsByManagerId(user.id);
      const teamIds = userTeams.map(team => team.id);
      fixtures = fixtures.filter(fixture => teamIds.includes(fixture.teamId));
    } else if (user.roles.includes("parent")) {
      const userPlayers = storage.getPlayersByParentId(user.id);
      const teamIds = userPlayers.map(player => player.teamId);
      fixtures = fixtures.filter(fixture => teamIds.includes(fixture.teamId));
    }

    return fixtures.slice(0, 3);
  };

  const recentResults = getRecentResults();

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case "W": return "bg-primary text-primary-foreground";
      case "L": return "bg-destructive text-destructive-foreground";
      case "D": return "bg-yellow-500 text-white";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const formatMatchDate = (date: Date) => {
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 14) return "Last week";
    return format(date, "MMM d");
  };

  return (
    <Card data-testid="widget-match-results">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Trophy className="w-5 h-5 text-primary" />
          <span>Recent Results</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentResults.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No recent results</p>
            </div>
          ) : (
            recentResults.map((result) => (
              <div
                key={result.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-md"
                data-testid={`result-${result.id}`}
              >
                <div className="flex-1">
                  <p className="font-medium text-sm" data-testid={`result-opponent-${result.id}`}>
                    vs. {result.opponent || "Unknown"}
                  </p>
                  <p className="text-xs text-muted-foreground" data-testid={`result-date-${result.id}`}>
                    {formatMatchDate(result.startTime)}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span 
                    className={`px-2 py-1 rounded text-xs font-medium ${getOutcomeColor(result.result?.outcome || "")}`}
                    data-testid={`result-outcome-${result.id}`}
                  >
                    {result.result?.outcome || "?"}
                  </span>
                  <span className="font-bold text-sm" data-testid={`result-score-${result.id}`}>
                    {result.result ? `${result.result.homeScore}-${result.result.awayScore}` : "-"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
