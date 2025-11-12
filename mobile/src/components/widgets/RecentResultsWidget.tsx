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
  }
  
  return (
    <WidgetCard 
      title="🏆 Recent Results" 
      isEmpty={results.length === 0}
      emptyMessage="No recent results"
    >
      {results.map((result: any) => (
        <View key={result.id} style={styles.resultItem}>
          <View style={styles.resultInfo}>
            <Text style={styles.resultTeam}>{getTeamName(result.teamId, teams)}</Text>
            <Text style={styles.resultOpponent}>vs. {result.opponent || "Unknown"}</Text>
            <Text style={styles.resultDate}>
              {result.startTime ? formatDate(result.startTime) : "Unknown date"}
            </Text>
          </View>
          <View
            style={[
              styles.resultBadge,
              result.result === "win" && styles.resultWin,
              result.result === "lose" && styles.resultLose,
              result.result === "draw" && styles.resultDraw,
            ]}
          >
            <Text style={styles.resultScore}>{result.score || "-"}</Text>
          </View>
        </View>
      ))}
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
  resultBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#e0e0e0",
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
  resultScore: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
});
