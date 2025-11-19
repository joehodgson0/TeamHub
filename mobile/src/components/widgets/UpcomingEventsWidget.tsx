import { View, Text, StyleSheet } from 'react-native';
import { Calendar, Clock, MapPin, Users } from 'lucide-react-native';
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
          </View>

          <Text style={styles.eventTitle} numberOfLines={2}>
            {event.name || "Event"}
          </Text>

          {event.teamId && (
            <View style={styles.infoRow}>
              <Users size={16} color="#6B7280" />
              <Text style={styles.infoText}>
                {getTeamName(event.teamId, teams)}
              </Text>
            </View>
          )}

          <View style={styles.dateTimeContainer}>
            <View style={styles.infoRow}>
              <Calendar size={16} color="#6B7280" />
              <Text style={styles.infoText}>{formatDate(event.startTime)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Clock size={16} color="#6B7280" />
              <Text style={styles.infoText}>{formatTime(event.startTime)}</Text>
            </View>
          </View>

          {event.location && (
            <View style={styles.infoRow}>
              <MapPin size={16} color="#6B7280" />
              <Text style={styles.infoText} numberOfLines={1}>
                {event.location}
              </Text>
            </View>
          )}
        </View>
      ))}
    </WidgetCard>
  );
}

const styles = StyleSheet.create({
  eventCard: {
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  eventCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
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
  eventTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
    lineHeight: 24,
  },
  dateTimeContainer: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 8,
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
    flex: 1,
  },
});
