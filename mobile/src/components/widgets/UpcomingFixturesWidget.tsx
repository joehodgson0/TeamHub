import { View, Text, StyleSheet } from 'react-native';
import { Calendar, Clock, MapPin, Users, Shield } from 'lucide-react-native';
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
        const teamName = fixture.teamId ? getTeamName(fixture.teamId, teams) : '';
        const opponent = fixture.opponent || 'TBD';
        
        return (
          <View key={fixture.id} style={styles.fixtureCard}>
            <View style={styles.fixtureHeader}>
              <Text style={styles.fixtureTitle} numberOfLines={2}>
                {teamName} vs {opponent}
              </Text>
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
            </View>

            <View style={styles.infoRow}>
              <Calendar size={16} color="#6B7280" />
              <Text style={styles.infoText}>{formatDate(fixture.startTime)}</Text>
            </View>

            <View style={styles.infoRow}>
              <Clock size={16} color="#6B7280" />
              <Text style={styles.infoText}>{formatTime(fixture.startTime)}</Text>
            </View>

            {fixture.location && (
              <View style={styles.infoRow}>
                <MapPin size={16} color="#6B7280" />
                <Text style={styles.infoText} numberOfLines={1}>
                  {fixture.location}
                </Text>
              </View>
            )}

            {availability.total > 0 && (
              <View style={styles.availabilityContainer}>
                <View style={styles.availabilityBar}>
                  <View 
                    style={[
                      styles.availabilityFill, 
                      { width: `${(availability.confirmed / availability.total) * 100}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.availabilityText}>
                  {availability.confirmed}/{availability.total} players available
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
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  fixtureHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 8,
  },
  fixtureTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 24,
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  typeBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  availabilityContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  availabilityBar: {
    height: 6,
    backgroundColor: "#E5E7EB",
    borderRadius: 3,
    marginBottom: 8,
    overflow: "hidden",
  },
  availabilityFill: {
    height: "100%",
    backgroundColor: "#10B981",
    borderRadius: 3,
  },
  availabilityText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "600",
  },
});
