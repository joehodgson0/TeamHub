import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { API_BASE_URL } from '@/lib/config';
import { queryClient } from '@/lib/queryClient';

interface AvailabilityModalProps {
  visible: boolean;
  onClose: () => void;
  event: any;
}

export function AvailabilityModal({ visible, onClose, event }: AvailabilityModalProps) {
  const { user } = useAuth();
  
  // Local state for availability to handle real-time updates
  const [localAvailability, setLocalAvailability] = useState<Record<string, string>>({});

  // Initialize local availability when event changes or modal opens
  useEffect(() => {
    if (event && visible) {
      setLocalAvailability(event.availability || {});
    }
  }, [event, visible]);

  // Fetch parent's dependents (players)
  const { data: playersResponse } = useQuery({
    queryKey: ['/api/players/parent', user?.id],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/players/parent/${user?.id}`, {
        credentials: 'include',
      });
      return response.json();
    },
    enabled: !!user?.id && visible,
  });

  const players = playersResponse?.players || [];

  const updateAvailabilityMutation = useMutation({
    mutationFn: async ({ playerId, availability }: { playerId: string; availability: string }) => {
      const response = await fetch(`${API_BASE_URL}/api/events/${event.id}/availability`, {
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
    onSuccess: (data, { playerId, availability }) => {
      // Update local state immediately for instant UI feedback
      setLocalAvailability(prev => ({
        ...prev,
        [playerId]: availability,
      }));
      queryClient.invalidateQueries({ queryKey: ['/api/events/upcoming-session'] });
      Alert.alert('Success', 'Availability updated successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error?.message || 'Failed to update availability');
    },
  });

  const handleAvailabilityUpdate = (playerId: string, availability: string) => {
    updateAvailabilityMutation.mutate({ playerId, availability });
  };

  const getPlayerAvailability = (playerId: string) => {
    return localAvailability[playerId] || 'pending';
  };

  if (!event) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelButton}>Close</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mark Availability</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView style={styles.content}>
          {/* Event Info */}
          <View style={styles.eventInfo}>
            <Text style={styles.eventTitle}>
              {event.name || (event.type === 'match' && event.opponent ? `vs ${event.opponent}` : 'Event')}
            </Text>
            <Text style={styles.eventDate}>
              {new Date(event.startTime).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </View>

          {/* Players List */}
          {players.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No dependents found</Text>
              <Text style={styles.emptySubtext}>
                Add players to your account to mark their availability
              </Text>
            </View>
          ) : (
            <View style={styles.playersContainer}>
              {players.map((player: any) => {
                const currentAvailability = getPlayerAvailability(player.id);
                return (
                  <View key={player.id} style={styles.playerCard}>
                    <Text style={styles.playerName}>
                      {player.firstName} {player.lastName}
                    </Text>
                    
                    <View style={styles.availabilityButtons}>
                      <TouchableOpacity
                        style={[
                          styles.availabilityButton,
                          currentAvailability === 'available' && styles.availableButtonActive,
                        ]}
                        onPress={() => handleAvailabilityUpdate(player.id, 'available')}
                        disabled={updateAvailabilityMutation.isPending}
                      >
                        <Text
                          style={[
                            styles.availabilityButtonText,
                            currentAvailability === 'available' && styles.availableButtonTextActive,
                          ]}
                        >
                          ✓ Available
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.availabilityButton,
                          currentAvailability === 'unavailable' && styles.unavailableButtonActive,
                        ]}
                        onPress={() => handleAvailabilityUpdate(player.id, 'unavailable')}
                        disabled={updateAvailabilityMutation.isPending}
                      >
                        <Text
                          style={[
                            styles.availabilityButtonText,
                            currentAvailability === 'unavailable' && styles.unavailableButtonTextActive,
                          ]}
                        >
                          ✗ Unavailable
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  cancelButton: {
    fontSize: 16,
    color: '#6B7280',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  eventInfo: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  playersContainer: {
    gap: 12,
  },
  playerCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  availabilityButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  availabilityButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  availabilityButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  availableButtonActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  availableButtonTextActive: {
    color: '#FFFFFF',
  },
  unavailableButtonActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  unavailableButtonTextActive: {
    color: '#FFFFFF',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
