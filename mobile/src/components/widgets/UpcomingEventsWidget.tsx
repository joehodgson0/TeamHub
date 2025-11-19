import { View, Text, StyleSheet } from 'react-native';
import { Calendar, Clock, MapPin, Users } from 'lucide-react-native';
import { WidgetCard } from './WidgetCard';
import { formatDate, formatTime, getEventTypeBadgeColor, getEventDisplayType, getTeamName } from '@/utils/dashboard';

interface UpcomingEventsWidgetProps {
  events: any[];
  teams: any[];
}

export function UpcomingEventsWidget({ events, teams }: UpcomingEventsWidgetProps) {
  const getEventTitle = (event: any) => {
    let eventTitle = event.name || event.title;
    if (!eventTitle) {
      if (event.type === 'training') {
        eventTitle = 'Training Session';
      } else if (event.type === 'tournament') {
        eventTitle = 'Tournament';
      } else if (event.type === 'social') {
        eventTitle = 'Social Event';
      } else {
        eventTitle = 'Event';
      }
    }
    return eventTitle;
  };

  return (
    <WidgetCard 
      title="📅 Upcoming Events" 
      isEmpty={events.length === 0}
      emptyMessage="No upcoming events"
    >
      {events.map((event: any) => (
        <View key={event.id} style={styles.eventCard}>
          <View style={styles.eventCardHeader}>
            <View style={styles.titleContainer}>
              <Text style={styles.eventTitle} numberOfLines={2}>
                {getEventTitle(event)}
              </Text>
              {event.type === 'match' && event.friendly && (
                <Text style={styles.friendlyLabel}>⚽ Friendly Match</Text>
              )}
            </View>
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

          {event.teamId && (
            <View style={styles.infoRow}>
              <Users size={16} color="#6B7280" />
              <Text style={styles.infoText}>
                {getTeamName(event.teamId, teams)}
              </Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Calendar size={16} color="#6B7280" />
            <Text style={styles.infoText}>{formatDate(event.startTime)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Clock size={16} color="#6B7280" />
            <Text style={styles.infoText}>{formatTime(event.startTime)}</Text>
          </View>

          {event.location && (
            <View style={styles.infoRow}>
              <MapPin size={16} color="#6B7280" />
              <Text style={styles.infoText} numberOfLines={1}>
                {event.location}
              </Text>
            </View>
          )}

          {event.additionalInfo && (
            <View style={styles.additionalInfoContainer}>
              <Text style={styles.additionalInfoText} numberOfLines={2}>
                ℹ️ {event.additionalInfo}
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
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 8,
  },
  titleContainer: {
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
  eventTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 24,
  },
  friendlyLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#3B82F6",
    marginTop: 4,
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
  additionalInfoContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  additionalInfoText: {
    fontSize: 13,
    color: "#6B7280",
    fontStyle: "italic",
    lineHeight: 18,
  },
});
