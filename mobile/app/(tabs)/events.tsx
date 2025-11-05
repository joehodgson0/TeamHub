import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { API_BASE_URL } from '@/lib/config';
import { AddEventModal } from '@/components/modals/AddEventModal';
import { MatchResultModal } from '@/components/modals/MatchResultModal';

export default function Events() {
  const { user, hasRole } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedFixture, setSelectedFixture] = useState<any>(null);

  const { data: eventsResponse, isLoading } = useQuery({
    queryKey: ['/api/events/upcoming-session'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/events/upcoming-session`, {
        credentials: 'include',
      });
      return response.json();
    },
    enabled: !!user,
  });

  const events = eventsResponse?.events || [];

  const formatEventTime = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const startTimeStr = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const endTimeStr = end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${startTimeStr} - ${endTimeStr}`;
  };

  const formatEventDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const getEventTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'match':
        return '#DC2626';
      case 'training':
        return '#059669';
      case 'tournament':
        return '#7C3AED';
      default:
        return '#6B7280';
    }
  };

  const canCreateEvent = hasRole('coach');
  
  const canUpdateResult = (event: any) => {
    return hasRole('coach') && 
           event.type === 'match' && 
           user?.teamIds?.includes(event.teamId);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Events & Fixtures</Text>
          {canCreateEvent && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={styles.addButtonText}>+ Add Event</Text>
            </TouchableOpacity>
          )}
        </View>
        {isLoading ? (
          <Text style={styles.loadingText}>Loading events...</Text>
        ) : events.length > 0 ? (
          <View style={styles.eventsContainer}>
            {events.map((event: any) => (
              <View key={event.id} style={styles.eventCard}>
                <View style={styles.eventHeader}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <View style={[styles.typeBadge, { backgroundColor: getEventTypeBadgeColor(event.type) }]}>
                    <Text style={styles.typeBadgeText}>{event.type}</Text>
                  </View>
                </View>
                
                <Text style={styles.eventDate}>{formatEventDate(event.startTime)}</Text>
                <Text style={styles.eventTime}>{formatEventTime(event.startTime, event.endTime)}</Text>
                
                {event.location && (
                  <Text style={styles.eventLocation}>📍 {event.location}</Text>
                )}
                
                {event.opponent && (
                  <Text style={styles.eventOpponent}>vs {event.opponent}</Text>
                )}
                
                {canUpdateResult(event) && (
                  <TouchableOpacity
                    style={styles.updateResultButton}
                    onPress={() => setSelectedFixture(event)}
                  >
                    <Text style={styles.updateResultButtonText}>Update Result</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No upcoming events</Text>
            <Text style={styles.emptySubtext}>
              Events and fixtures will appear here when scheduled
            </Text>
          </View>
        )}
      </View>

      <AddEventModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
      
      <MatchResultModal
        visible={!!selectedFixture}
        fixture={selectedFixture}
        onClose={() => setSelectedFixture(null)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  },
  eventsContainer: {
    gap: 15,
  },
  eventCard: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  typeBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  eventDate: {
    fontSize: 15,
    color: '#333',
    marginBottom: 4,
    fontWeight: '500',
  },
  eventTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  eventLocation: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  eventOpponent: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginTop: 4,
  },
  updateResultButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#10B981',
    borderRadius: 6,
    alignItems: 'center',
  },
  updateResultButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
