import { View, Text, StyleSheet } from 'react-native';
import { WidgetCard } from './WidgetCard';
import { formatDate, getTeamName } from '@/utils/dashboard';

interface RecentResultsWidgetProps {
  results: any[];
  teams: any[];
}

export function RecentResultsWidget({ results, teams }: RecentResultsWidgetProps) {
  // Debug logging to see what data we're getting
  if (results.length > 0) {
    console.log('Recent Results Data:', JSON.stringify(results[0], null, 2));
    console.log('Score value:', results[0].score);
    console.log('Score type:', typeof results[0].score);
  }
  
  return (
    <WidgetCard 
      title="🏆 Recent Results" 
      isEmpty={results.length === 0}
      emptyMessage="No recent results"
    >
      {results.map((result: any) => {
        // Calculate score from goals if score field is missing or invalid
        let displayScore = result.score;
        if (!displayScore && result.homeTeamGoals !== undefined && result.awayTeamGoals !== undefined) {
          // Calculate from team's perspective
          if (result.isHomeFixture) {
            displayScore = `${result.homeTeamGoals}-${result.awayTeamGoals}`;
          } else {
            displayScore = `${result.awayTeamGoals}-${result.homeTeamGoals}`;
          }
        }
        
        const outcomeText = result.result === "win" ? "Win" : result.result === "lose" ? "Loss" : result.result === "draw" ? "Draw" : "";
        
        return (
          <View key={result.id} style={styles.resultItem}>
            <View style={styles.resultInfo}>
              <Text style={styles.resultTeam}>{getTeamName(result.teamId, teams)}</Text>
              <Text style={styles.resultOpponent}>vs. {result.opponent || "Unknown"}</Text>
              <Text style={styles.resultDate}>
                {result.startTime ? formatDate(result.startTime) : "Unknown date"}
              </Text>
            </View>
            <View style={styles.resultScoreContainer}>
              <View
                style={[
                  styles.resultBadge,
                  result.result === "win" && styles.resultWin,
                  result.result === "lose" && styles.resultLose,
                  result.result === "draw" && styles.resultDraw,
                ]}
              >
                <Text style={styles.resultOutcome}>{outcomeText}</Text>
              </View>
              <Text style={styles.resultScore}>{displayScore || "-"}</Text>
            </View>
          </View>
        );
      })}
    </WidgetCard>
  );
}

const styles = StyleSheet.create({
  resultItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  resultInfo: {
    flex: 1,
  },
  resultTeam: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 2,
  },
  resultOpponent: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
  },
  resultDate: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },
  resultScoreContainer: {
    alignItems: "center",
    gap: 4,
  },
  resultBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#e0e0e0",
    minWidth: 60,
    alignItems: "center",
  },
  resultWin: {
    backgroundColor: "#4caf50",
  },
  resultLose: {
    backgroundColor: "#f44336",
  },
  resultDraw: {
    backgroundColor: "#ff9800",
  },
  resultOutcome: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
    textTransform: "uppercase",
  },
  resultScore: {
    color: "#1a1a1a",
    fontWeight: "700",
    fontSize: 16,
    marginTop: 2,
  },
});
