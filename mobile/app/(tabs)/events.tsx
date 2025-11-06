import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { API_BASE_URL } from '@/lib/config';
import { queryClient } from '@/lib/queryClient';
import { AddEventModal } from '@/components/modals/AddEventModal';
import { MatchResultModal } from '@/components/modals/MatchResultModal';
import { MaterialIcons } from '@expo/vector-icons';

export default function Events() {
  const { user, hasRole } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
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

  // Fetch teams for displaying team names
  const { data: teamsResponse } = useQuery({
    queryKey: ['/api/teams/club', user?.clubId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/teams/club/${user?.clubId}`, {
        credentials: 'include',
      });
      return response.json();
    },
    enabled: !!user?.clubId,
  });

  // Fetch parent's players/dependents for availability filtering
  const { data: playersResponse } = useQuery({
    queryKey: ['/api/players/parent', user?.id],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/players/parent/${user?.id}`, {
        credentials: 'include',
      });
      return response.json();
    },
    enabled: !!user?.id && hasRole('parent'),
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const response = await fetch(`${API_BASE_URL}/api/events/${eventId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const result = await response.json();
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events/upcoming-session'] });
      Alert.alert('Success', 'Event deleted successfully');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to delete event');
    },
  });

  const updateAvailabilityMutation = useMutation({
    mutationFn: async ({ eventId, playerId, availability }: { eventId: string; playerId: string; availability: string }) => {
      const response = await fetch(`${API_BASE_URL}/api/events/${eventId}/availability`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ playerId, availability }),
      });
      if (!response.ok) throw new Error('Failed to update availability');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events/upcoming-session'] });
    },
    onError: (error: any) => {
      Alert.alert('Error', error?.message || 'Failed to update availability');
    },
  });

  const events = eventsResponse?.events || [];
  const teams = teamsResponse?.teams || [];

  const getTeamName = (teamId: string) => {
    const team = teams.find((t: any) => t.id === teamId);
    return team ? team.name : 'Unknown Team';
  };

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
  
  const canManageEvent = (event: any) => {
    return hasRole('coach') && user?.teamIds?.includes(event.teamId);
  };

  const getParentPlayersForEvent = (event: any) => {
    if (!hasRole('parent')) return [];
    
    // Only show availability for fixtures (not social events)
    if (event.type === 'social') return [];
    
    const players = playersResponse?.players || [];
    if (players.length === 0) return [];

    // Get players on this event's team
    const team = teams.find((t: any) => t.id === event.teamId);
    if (!team) return [];

    return players.filter((player: any) => team.playerIds?.includes(player.id));
  };

  const handleAvailabilityUpdate = (eventId: string, playerId: string, availability: string) => {
    updateAvailabilityMutation.mutate({ eventId, playerId, availability });
  };

  const getPlayerAvailability = (event: any, playerId: string) => {
    return event?.availability?.[playerId] || 'pending';
  };
  
  const canUpdateResult = (event: any) => {
    const eventEndTime = new Date(event.endTime);
    const now = new Date();
    return hasRole('coach') && 
           event.type === 'match' && 
           user?.teamIds?.includes(event.teamId) &&
           now > eventEndTime;
  };

  const handleDeleteEvent = (eventId: string, eventName: string) => {
    Alert.alert(
      'Delete Event',
      `Are you sure you want to delete "${eventName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteEventMutation.mutate(eventId),
        },
      ]
    );
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
                  <View style={styles.eventTitleContainer}>
                    <Text style={styles.eventTitle}>{event.name || event.title || 'Event'}</Text>
                    {event.teamId && (
                      <Text style={styles.teamName}>{getTeamName(event.teamId)}</Text>
                    )}
                  </View>
                  <View style={[styles.typeBadge, { backgroundColor: getEventTypeBadgeColor(event.type) }]}>
                    <Text style={styles.typeBadgeText}>{event.type}</Text>
                  </View>
                </View>
                
                <Text style={styles.eventDate}>{formatEventDate(event.startTime)}</Text>
                <Text style={styles.eventTime}>{formatEventTime(event.startTime, event.endTime)}</Text>
                
                {event.location && (
                  <Text style={styles.eventLocation}>📍 {event.location}</Text>
                )}
                
                {event.type === 'match' && event.opponent && (
                  <Text style={styles.eventOpponent}>vs {event.opponent}</Text>
                )}
                
                {canManageEvent(event) && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => setEditingEvent(event)}
                    >
                      <MaterialIcons name="edit" size={20} color="#007AFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => handleDeleteEvent(event.id, event.name || event.title || 'event')}
                    >
                      <MaterialIcons name="delete" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                )}
                
                {canUpdateResult(event) && (
                  <TouchableOpacity
                    style={styles.updateResultButton}
                    onPress={() => setSelectedFixture(event)}
                  >
                    <Text style={styles.updateResultButtonText}>Update Result</Text>
                  </TouchableOpacity>
                )}

                {getParentPlayersForEvent(event).length > 0 && (
                  <View style={styles.availabilitySection}>
                    <Text style={styles.availabilitySectionTitle}>Player Availability:</Text>
                    {getParentPlayersForEvent(event).map((player: any) => {
                      const availability = getPlayerAvailability(event, player.id);
                      return (
                        <View key={player.id} style={styles.playerAvailability}>
                          <Text style={styles.playerName}>
                            {player.firstName} {player.lastName}
                          </Text>
                          <View style={styles.availabilityButtons}>
                            <TouchableOpacity
                              style={[
                                styles.availabilityBtn,
                                availability === 'available' && styles.availableBtnActive,
                              ]}
                              onPress={() => handleAvailabilityUpdate(event.id, player.id, 'available')}
                              disabled={updateAvailabilityMutation.isPending}
                            >
                              <Text
                                style={[
                                  styles.availabilityBtnText,
                                  availability === 'available' && styles.availableBtnTextActive,
                                ]}
                              >
                                ✓
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[
                                styles.availabilityBtn,
                                availability === 'unavailable' && styles.unavailableBtnActive,
                              ]}
                              onPress={() => handleAvailabilityUpdate(event.id, player.id, 'unavailable')}
                              disabled={updateAvailabilityMutation.isPending}
                            >
                              <Text
                                style={[
                                  styles.availabilityBtnText,
                                  availability === 'unavailable' && styles.unavailableBtnTextActive,
                                ]}
                              >
                                ✗
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                  </View>
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
        visible={showAddModal || !!editingEvent}
        onClose={() => {
          setShowAddModal(false);
          setEditingEvent(null);
        }}
        eventToEdit={editingEvent}
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
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  eventTitleContainer: {
    flex: 1,
    marginRight: 8,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  teamName: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
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
  actionButtons: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    padding: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e5e5e5',
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
  availabilitySection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  availabilitySectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  playerAvailability: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  playerName: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  availabilityButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  availabilityBtn: {
    width: 36,
    height: 36,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  availabilityBtnText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  availableBtnActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  availableBtnTextActive: {
    color: '#FFFFFF',
  },
  unavailableBtnActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  unavailableBtnTextActive: {
    color: '#FFFFFF',
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
