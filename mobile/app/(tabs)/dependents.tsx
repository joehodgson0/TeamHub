import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { API_BASE_URL } from '@/lib/config';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

export default function Dependents() {
  const { user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: new Date(new Date().getFullYear() - 10, 0, 1), // Default to 10 years ago
    teamCode: '',
  });

  const canAddPlayer = user?.roles?.includes('parent');

  // Fetch players
  const { data: playersData, isLoading: playersLoading } = useQuery({
    queryKey: ['/api/players/parent', user?.id],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/players/parent/${user?.id}`, {
        credentials: 'include',
      });
      return response.json();
    },
    enabled: Boolean(user && canAddPlayer),
  });

  // Fetch teams
  const { data: teamsData } = useQuery({
    queryKey: ['/api/teams/club', user?.clubId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/teams/club/${user?.clubId}`, {
        credentials: 'include',
      });
      return response.json();
    },
    enabled: Boolean(user?.clubId),
  });

  const players = playersData?.players || [];
  const teams = teamsData?.teams || [];

  const getPlayerTeam = (teamId: string) => {
    return teams.find((team: any) => team.id === teamId);
  };

  const getPlayerAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const addPlayerMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`${API_BASE_URL}/api/players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      const result = await response.json();
      
      // Check if the request failed or if the response indicates failure
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to add dependent');
      }
      
      return result;
    },
    onSuccess: (result) => {
      // Manually update user cache if clubId was set (first dependent)
      if (result.clubId && user) {
        const currentUser = queryClient.getQueryData(['/api/auth/user-session']);
        if (currentUser) {
          queryClient.setQueryData(['/api/auth/user-session'], {
            ...currentUser,
            user: {
              ...(currentUser as any).user,
              clubId: result.clubId,
            }
          });
        }
      }
      
      // Invalidate all relevant queries to reflect the new team association
      queryClient.invalidateQueries({ queryKey: ['/api/players/parent', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/teams/club', user?.clubId] });
      queryClient.invalidateQueries({ queryKey: ['/api/events/all-session'] });
      queryClient.invalidateQueries({ queryKey: ['/api/events/upcoming-session'] });
      queryClient.invalidateQueries({ queryKey: ['/api/posts-session'] });
      queryClient.invalidateQueries({ queryKey: ['/api/match-results-session'] });
      
      setShowAddModal(false);
      // Reset form with Date object, not empty string
      setFormData({ 
        name: '', 
        dateOfBirth: new Date(new Date().getFullYear() - 10, 0, 1), 
        teamCode: '' 
      });
      Alert.alert('Success', `${result.player?.name || 'Dependent'} added to ${result.team || 'team'}!`);
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to add dependent');
    },
  });

  const handleAddPlayer = () => {
    if (!formData.name || !formData.teamCode) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Format date as YYYY-MM-DD for the API (timezone-safe)
    const year = formData.dateOfBirth.getFullYear();
    const month = String(formData.dateOfBirth.getMonth() + 1).padStart(2, '0');
    const day = String(formData.dateOfBirth.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

    addPlayerMutation.mutate({
      name: formData.name,
      dateOfBirth: formattedDate,
      teamCode: formData.teamCode,
      parentId: user?.id,
    });
  };

  const formatDisplayDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Dependents</Text>
          {canAddPlayer && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={styles.addButtonText}>+ Add</Text>
            </TouchableOpacity>
          )}
        </View>

        {playersLoading ? (
          <Text style={styles.loadingText}>Loading dependents...</Text>
        ) : players.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Dependents Added</Text>
            <Text style={styles.emptyText}>
              Add your children to teams to start tracking their activities and events.
            </Text>
            {canAddPlayer && (
              <Button
                title="Add Your First Dependent"
                onPress={() => setShowAddModal(true)}
              />
            )}
          </View>
        ) : (
          <View style={styles.playersList}>
            {players.map((player: any) => {
              const team = getPlayerTeam(player.teamId);
              const age = getPlayerAge(player.dateOfBirth);

              return (
                <View key={player.id} style={styles.playerCard}>
                  <View style={styles.playerAvatar}>
                    <Text style={styles.playerInitials}>
                      {player.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                    </Text>
                  </View>
                  <View style={styles.playerInfo}>
                    <Text style={styles.playerName}>{player.name}</Text>
                    <Text style={styles.playerDetails}>
                      {team?.name || 'Unknown Team'} • Age {age}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Add Dependent Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalContent}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.modalTitle}>Add Dependent</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Child's name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date of Birth</Text>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateText}>
                  📅 {formatDisplayDate(formData.dateOfBirth)}
                </Text>
                <Text style={styles.changeText}>Change</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Team Code</Text>
              <TextInput
                style={styles.input}
                value={formData.teamCode}
                onChangeText={(text) => setFormData({ ...formData, teamCode: text })}
                placeholder="Enter 8-character team code"
                autoCapitalize="characters"
                maxLength={8}
              />
            </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowAddModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.submitButton]}
                  onPress={handleAddPlayer}
                  disabled={addPlayerMutation.isPending}
                >
                  <Text style={styles.submitButtonText}>
                    {addPlayerMutation.isPending ? 'Adding...' : 'Add Dependent'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>

          {/* Date Picker */}
          <DateTimePickerModal
            isVisible={showDatePicker}
            mode="date"
            date={formData.dateOfBirth}
            maximumDate={new Date()} // Can't be born in the future
            onConfirm={(selectedDate: Date) => {
              setFormData({ ...formData, dateOfBirth: selectedDate });
              setShowDatePicker(false);
            }}
            onCancel={() => setShowDatePicker(false)}
          />
        </KeyboardAvoidingView>
      </Modal>
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
    fontWeight: '600',
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  playersList: {
    gap: 12,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
  },
  playerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playerInitials: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  playerDetails: {
    fontSize: 14,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#007AFF',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  datePickerButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#f9f9f9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  changeText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
