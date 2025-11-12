import { View, Text, StyleSheet } from 'react-native';
import { WidgetCard } from './WidgetCard';
import { formatDate, formatTime, getEventTypeBadgeColor, getEventDisplayType, getTeamName } from '@/utils/dashboard';

interface UpcomingEventsWidgetProps {
  events: any[];
  teams: any[];
}

export function UpcomingEventsWidget({ events, teams }: UpcomingEventsWidgetProps) {
  return (
    <WidgetCard 
      title="📅 Upcoming Events" 
      isEmpty={events.length === 0}
      emptyMessage="No upcoming events"
    >
      {events.map((event: any) => (
        <View key={event.id} style={styles.eventCard}>
          <View style={styles.eventCardHeader}>
            <View
              style={[
                styles.typeBadge,
                {
                  backgroundColor: getEventTypeBadgeColor(
                    event.type,
                    event.friendly,
                  ),
                },
              ]}
            >
              <Text style={styles.typeBadgeText}>
                {getEventDisplayType(event)}
              </Text>
            </View>
            <Text style={styles.eventCardTitle} numberOfLines={1}>
              {event.name || "Event"}
            </Text>
          </View>

          {event.teamId && (
            <Text style={styles.detailText}>
              <Text style={styles.detailLabel}>Team: </Text>
              <Text style={styles.detailValue}>
                {getTeamName(event.teamId, teams)}
              </Text>
            </Text>
          )}

          <Text style={styles.detailText}>
            🕐 {formatDate(event.startTime)}, {formatTime(event.startTime)}
          </Text>

          {event.location && (
            <Text style={styles.detailText}>📍 {event.location}</Text>
          )}
        </View>
      ))}
    </WidgetCard>
  );
}

const styles = StyleSheet.create({
  eventCard: {
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
});
