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
  const [startDateTime, setStartDateTime] = useState<Date>(new Date());
  const [endDateTime, setEndDateTime] = useState<Date>(new Date(Date.now() + 2 * 60 * 60 * 1000)); // 2 hours from now
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [homeAway, setHomeAway] = useState<string>('home');
  const [friendly, setFriendly] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

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
    setStartDateTime(new Date());
    setEndDateTime(new Date(Date.now() + 2 * 60 * 60 * 1000));
    setAdditionalInfo('');
    setHomeAway('home');
    setFriendly(false);
    setSelectedTeamId(teams[0]?.id || '');
    setShowStartDatePicker(false);
    setShowEndDatePicker(false);
  };

  const formatDateTime = (date: Date) => {
    return date.toISOString();
  };

  const formatDisplayDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDisplayTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
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
    if (endDateTime <= startDateTime) {
      Alert.alert('Error', 'End time must be after start time');
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

    const eventData: any = {
      type: eventType,
      teamId: selectedTeamId,
      location: location.trim(),
      startTime: formatDateTime(startDateTime),
      endTime: formatDateTime(endDateTime),
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
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowStartDatePicker(true)}
            >
              <View style={styles.dateTimeDisplay}>
                <Text style={styles.dateText}>📅 {formatDisplayDate(startDateTime)}</Text>
                <Text style={styles.timeText}>🕐 {formatDisplayTime(startDateTime)}</Text>
              </View>
              <Text style={styles.changeText}>Change</Text>
            </TouchableOpacity>
          </View>

          {/* End Date and Time */}
          <View style={styles.section}>
            <Text style={styles.label}>End Date & Time</Text>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowEndDatePicker(true)}
            >
              <View style={styles.dateTimeDisplay}>
                <Text style={styles.dateText}>📅 {formatDisplayDate(endDateTime)}</Text>
                <Text style={styles.timeText}>🕐 {formatDisplayTime(endDateTime)}</Text>
              </View>
              <Text style={styles.changeText}>Change</Text>
            </TouchableOpacity>
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

      {/* Start DateTime Picker Modal */}
      <Modal
        visible={showStartDatePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStartDatePicker(false)}
      >
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerTitle}>Select Start Date & Time</Text>
            
            <View style={styles.pickerInputs}>
              <TextInput
                style={styles.pickerInput}
                value={startDateTime.toISOString().split('T')[0]}
                onChangeText={(text) => {
                  const [year, month, day] = text.split('-').map(Number);
                  if (year && month && day) {
                    const newDate = new Date(startDateTime);
                    newDate.setFullYear(year, month - 1, day);
                    setStartDateTime(newDate);
                  }
                }}
                placeholder="YYYY-MM-DD"
              />
              <TextInput
                style={styles.pickerInput}
                value={startDateTime.toTimeString().slice(0, 5)}
                onChangeText={(text) => {
                  const [hours, minutes] = text.split(':').map(Number);
                  if (hours !== undefined && minutes !== undefined) {
                    const newDate = new Date(startDateTime);
                    newDate.setHours(hours, minutes);
                    setStartDateTime(newDate);
                    // Auto-update end time to be 2 hours later
                    setEndDateTime(new Date(newDate.getTime() + 2 * 60 * 60 * 1000));
                  }
                }}
                placeholder="HH:MM"
              />
            </View>

            <View style={styles.pickerButtons}>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowStartDatePicker(false)}
              >
                <Text style={styles.pickerButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* End DateTime Picker Modal */}
      <Modal
        visible={showEndDatePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEndDatePicker(false)}
      >
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerTitle}>Select End Date & Time</Text>
            
            <View style={styles.pickerInputs}>
              <TextInput
                style={styles.pickerInput}
                value={endDateTime.toISOString().split('T')[0]}
                onChangeText={(text) => {
                  const [year, month, day] = text.split('-').map(Number);
                  if (year && month && day) {
                    const newDate = new Date(endDateTime);
                    newDate.setFullYear(year, month - 1, day);
                    setEndDateTime(newDate);
                  }
                }}
                placeholder="YYYY-MM-DD"
              />
              <TextInput
                style={styles.pickerInput}
                value={endDateTime.toTimeString().slice(0, 5)}
                onChangeText={(text) => {
                  const [hours, minutes] = text.split(':').map(Number);
                  if (hours !== undefined && minutes !== undefined) {
                    const newDate = new Date(endDateTime);
                    newDate.setHours(hours, minutes);
                    setEndDateTime(newDate);
                  }
                }}
                placeholder="HH:MM"
              />
            </View>

            <View style={styles.pickerButtons}>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowEndDatePicker(false)}
              >
                <Text style={styles.pickerButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  dateTimeButton: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#f9f9f9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateTimeDisplay: {
    flex: 1,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 14,
    color: '#666',
  },
  changeText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  pickerInputs: {
    gap: 12,
    marginBottom: 20,
  },
  pickerInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  pickerButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  pickerButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  pickerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
