import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import { format } from "date-fns";

export default function MatchResultsWidget() {
  const { user } = useAuth();

  // Fetch recent match results from API
  const { data: matchResultsResponse, isLoading } = useQuery<{ matchResults: any[] }>({
    queryKey: ['/api/match-results'],
    enabled: !!user
  });

  const recentResults = matchResultsResponse?.matchResults || [];

  const getOutcomeColor = (result: string) => {
    switch (result) {
      case "win": return "bg-primary text-primary-foreground";
      case "lose": return "bg-destructive text-destructive-foreground";
      case "draw": return "bg-yellow-500 text-white";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getOutcomeDisplay = (result: string) => {
    switch (result) {
      case "win": return "W";
      case "lose": return "L";
      case "draw": return "D";
      default: return "?";
    }
  };

  const formatMatchDate = (dateString: string) => {
    const date = new Date(dateString);
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
            recentResults.map((result: any) => (
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
                    {result.startTime ? formatMatchDate(result.startTime) : "Unknown date"}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span 
                    className={`px-2 py-1 rounded text-xs font-medium ${getOutcomeColor(result.result || "")}`}
                    data-testid={`result-outcome-${result.id}`}
                  >
                    {getOutcomeDisplay(result.result || "")}
                  </span>
                  <span className="font-bold text-sm" data-testid={`result-score-${result.id}`}>
                    {result.homeTeamGoals !== undefined && result.awayTeamGoals !== undefined 
                      ? `${result.homeTeamGoals}-${result.awayTeamGoals}` 
                      : "-"}
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
