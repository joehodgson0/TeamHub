import { View, Text, StyleSheet } from 'react-native';
import { WidgetCard } from './WidgetCard';
import { formatDate, formatTime, getEventTypeBadgeColor, getEventDisplayType, getAvailabilityCount, getTeamName } from '@/utils/dashboard';

interface UpcomingFixturesWidgetProps {
  fixtures: any[];
  teams: any[];
}

export function UpcomingFixturesWidget({ fixtures, teams }: UpcomingFixturesWidgetProps) {
  return (
    <WidgetCard 
      title="⚽ Upcoming Fixtures" 
      isEmpty={fixtures.length === 0}
      emptyMessage="No upcoming fixtures"
    >
      {fixtures.map((fixture: any) => {
        const availability = getAvailabilityCount(fixture, teams);
        return (
          <View key={fixture.id} style={styles.fixtureCard}>
            <View style={styles.eventCardHeader}>
              <View
                style={[
                  styles.typeBadge,
                  {
                    backgroundColor: getEventTypeBadgeColor(
                      fixture.type,
                      fixture.friendly,
                    ),
                  },
                ]}
              >
                <Text style={styles.typeBadgeText}>
                  {getEventDisplayType(fixture)}
                </Text>
              </View>
              <Text style={styles.eventCardTitle} numberOfLines={1}>
                {fixture.name || "Fixture"}
              </Text>
            </View>

            {fixture.teamId && (
              <Text style={styles.detailText}>
                <Text style={styles.detailLabel}>Team: </Text>
                <Text style={styles.detailValue}>
                  {getTeamName(fixture.teamId, teams)}
                </Text>
              </Text>
            )}

            {fixture.opponent && (
              <Text style={styles.detailText}>
                <Text style={styles.detailLabel}>vs </Text>
                <Text style={styles.detailValue}>{fixture.opponent}</Text>
              </Text>
            )}

            <Text style={styles.detailText}>
              🕐 {formatDate(fixture.startTime)}, {formatTime(fixture.startTime)}
            </Text>

            {fixture.location && (
              <Text style={styles.detailText}>📍 {fixture.location}</Text>
            )}

            {availability.total > 0 && (
              <View style={styles.availabilityRow}>
                <Text style={styles.availabilityText}>
                  👥 {availability.confirmed}/{availability.total} available
                </Text>
              </View>
            )}
          </View>
        );
      })}
    </WidgetCard>
  );
}

const styles = StyleSheet.create({
  fixtureCard: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  eventCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  typeBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  eventCardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    flex: 1,
  },
  detailText: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 4,
  },
  detailLabel: {
    color: "#9CA3AF",
  },
  detailValue: {
    fontWeight: "500",
    color: "#111827",
  },
  availabilityRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  availabilityText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
});
