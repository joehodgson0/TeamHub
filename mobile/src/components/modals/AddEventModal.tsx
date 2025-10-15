import { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { API_BASE_URL } from '@/lib/config';
import { Checkbox } from '@/components/ui/Checkbox';

interface AddEventModalProps {
  visible: boolean;
  onClose: () => void;
}

const EVENT_TYPES = [
  { value: 'match', label: 'Match' },
  { value: 'tournament', label: 'Tournament' },
  { value: 'training', label: 'Training' },
  { value: 'social', label: 'Social Event' },
];

export function AddEventModal({ visible, onClose }: AddEventModalProps) {
  const { user } = useAuth();
  
  // Form state
  const [eventType, setEventType] = useState<string>('match');
  const [name, setName] = useState('');
  const [opponent, setOpponent] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [homeAway, setHomeAway] = useState<string>('home');
  const [friendly, setFriendly] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState('');

  // Fetch user's teams
  const { data: teamsResponse } = useQuery({
    queryKey: ['/api/teams/club', user?.clubId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/teams/club/${user?.clubId}`, {
        credentials: 'include',
      });
      return response.json();
    },
    enabled: !!user?.clubId && visible,
  });

  // Filter to only show teams the user manages (teams in user.teamIds)
  const allTeams = teamsResponse?.teams || [];
  const teams = allTeams.filter((team: any) => 
    user?.teamIds?.includes(team.id)
  );

  // Set default team when teams load
  useEffect(() => {
    if (teams.length > 0 && !selectedTeamId) {
      setSelectedTeamId(teams[0].id);
    }
  }, [teams, selectedTeamId]);

  const createEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      return apiRequest('/api/events', {
        method: 'POST',
        body: JSON.stringify(eventData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events/upcoming-session'] });
      Alert.alert('Success', 'Event created successfully');
      resetForm();
      onClose();
    },
    onError: (error: any) => {
      Alert.alert('Error', error?.message || 'Failed to create event');
    },
  });

  const resetForm = () => {
    setEventType('match');
    setName('');
    setOpponent('');
    setLocation('');
    setStartDate('');
    setStartTime('');
    setEndDate('');
    setEndTime('');
    setAdditionalInfo('');
    setHomeAway('home');
    setFriendly(false);
    setSelectedTeamId(teams[0]?.id || '');
  };

  const handleSubmit = () => {
    // Validation
    if (!selectedTeamId) {
      Alert.alert('Error', 'Please select a team');
      return;
    }
    if (!location.trim()) {
      Alert.alert('Error', 'Please enter a location');
      return;
    }
    if (!startDate || !startTime) {
      Alert.alert('Error', 'Please enter start date and time');
      return;
    }
    if (!endDate || !endTime) {
      Alert.alert('Error', 'Please enter end date and time');
      return;
    }
    if (eventType === 'match' && !opponent.trim()) {
      Alert.alert('Error', 'Please enter opponent name for match');
      return;
    }
    if ((eventType === 'tournament' || eventType === 'social') && !name.trim()) {
      Alert.alert('Error', `Please enter a name for the ${eventType}`);
      return;
    }

    // Construct datetime strings
    const startDateTime = `${startDate}T${startTime}:00`;
    const endDateTime = `${endDate}T${endTime}:00`;

    const eventData: any = {
      type: eventType,
      teamId: selectedTeamId,
      location: location.trim(),
      startTime: startDateTime,
      endTime: endDateTime,
      additionalInfo: additionalInfo.trim() || undefined,
    };

    if (eventType === 'match') {
      eventData.opponent = opponent.trim();
      eventData.homeAway = homeAway;
      eventData.friendly = friendly;
    } else if (eventType === 'tournament' || eventType === 'social') {
      eventData.name = name.trim();
    }

    createEventMutation.mutate(eventData);
  };

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
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Event</Text>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={createEventMutation.isPending}
          >
            <Text style={[styles.saveButton, createEventMutation.isPending && styles.saveButtonDisabled]}>
              {createEventMutation.isPending ? 'Creating...' : 'Create'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Event Type */}
          <View style={styles.section}>
            <Text style={styles.label}>Event Type</Text>
            <View style={styles.typeButtonsContainer}>
              {EVENT_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeButton,
                    eventType === type.value && styles.typeButtonActive,
                  ]}
                  onPress={() => setEventType(type.value)}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      eventType === type.value && styles.typeButtonTextActive,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Team Selection */}
          <View style={styles.section}>
            <Text style={styles.label}>Team</Text>
            <View style={styles.teamButtonsContainer}>
              {teams.map((team: any) => (
                <TouchableOpacity
                  key={team.id}
                  style={[
                    styles.teamButton,
                    selectedTeamId === team.id && styles.teamButtonActive,
                  ]}
                  onPress={() => setSelectedTeamId(team.id)}
                >
                  <Text
                    style={[
                      styles.teamButtonText,
                      selectedTeamId === team.id && styles.teamButtonTextActive,
                    ]}
                  >
                    {team.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Name (for tournament/social) */}
          {(eventType === 'tournament' || eventType === 'social') && (
            <View style={styles.section}>
              <Text style={styles.label}>Event Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder={`Enter ${eventType} name`}
              />
            </View>
          )}

          {/* Opponent (for match) */}
          {eventType === 'match' && (
            <View style={styles.section}>
              <Text style={styles.label}>Opponent</Text>
              <TextInput
                style={styles.input}
                value={opponent}
                onChangeText={setOpponent}
                placeholder="Enter opponent name"
              />
            </View>
          )}

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Enter location"
            />
          </View>

          {/* Start Date and Time */}
          <View style={styles.section}>
            <Text style={styles.label}>Start Date & Time</Text>
            <View style={styles.dateTimeRow}>
              <TextInput
                style={[styles.input, styles.dateInput]}
                value={startDate}
                onChangeText={setStartDate}
                placeholder="YYYY-MM-DD"
              />
              <TextInput
                style={[styles.input, styles.timeInput]}
                value={startTime}
                onChangeText={setStartTime}
                placeholder="HH:MM"
              />
            </View>
          </View>

          {/* End Date and Time */}
          <View style={styles.section}>
            <Text style={styles.label}>End Date & Time</Text>
            <View style={styles.dateTimeRow}>
              <TextInput
                style={[styles.input, styles.dateInput]}
                value={endDate}
                onChangeText={setEndDate}
                placeholder="YYYY-MM-DD"
              />
              <TextInput
                style={[styles.input, styles.timeInput]}
                value={endTime}
                onChangeText={setEndTime}
                placeholder="HH:MM"
              />
            </View>
          </View>

          {/* Home/Away (for match) */}
          {eventType === 'match' && (
            <View style={styles.section}>
              <Text style={styles.label}>Home or Away</Text>
              <View style={styles.homeAwayContainer}>
                <TouchableOpacity
                  style={[
                    styles.homeAwayButton,
                    homeAway === 'home' && styles.homeAwayButtonActive,
                  ]}
                  onPress={() => setHomeAway('home')}
                >
                  <Text
                    style={[
                      styles.homeAwayText,
                      homeAway === 'home' && styles.homeAwayTextActive,
                    ]}
                  >
                    Home
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.homeAwayButton,
                    homeAway === 'away' && styles.homeAwayButtonActive,
                  ]}
                  onPress={() => setHomeAway('away')}
                >
                  <Text
                    style={[
                      styles.homeAwayText,
                      homeAway === 'away' && styles.homeAwayTextActive,
                    ]}
                  >
                    Away
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Friendly (for match) */}
          {eventType === 'match' && (
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setFriendly(!friendly)}
              >
                <Checkbox checked={friendly} onCheckedChange={setFriendly} />
                <Text style={styles.checkboxLabel}>Friendly Match</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Additional Info */}
          <View style={styles.section}>
            <Text style={styles.label}>Additional Information (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={additionalInfo}
              onChangeText={setAdditionalInfo}
              placeholder="Enter any additional details"
              multiline
              numberOfLines={4}
            />
          </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  cancelButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  saveButtonDisabled: {
    color: '#ccc',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  typeButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  typeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#333',
  },
  typeButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  teamButtonsContainer: {
    gap: 8,
  },
  teamButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  teamButtonActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#007AFF',
  },
  teamButtonText: {
    fontSize: 14,
    color: '#333',
  },
  teamButtonTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dateInput: {
    flex: 2,
  },
  timeInput: {
    flex: 1,
  },
  homeAwayContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  homeAwayButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  homeAwayButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  homeAwayText: {
    fontSize: 14,
    color: '#333',
  },
  homeAwayTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxLabel: {
    fontSize: 16,
    marginLeft: 12,
    color: '#333',
  },
});
