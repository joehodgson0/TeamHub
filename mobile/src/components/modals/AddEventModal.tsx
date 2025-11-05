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

// Date Picker Component
function DatePickerInputs({ date, onChange }: { date: Date; onChange: (date: Date) => void }) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear + i);
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <View style={styles.datePickerContent}>
      <Text style={styles.pickerLabel}>Month</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthPicker}>
        {months.map((month, index) => (
          <TouchableOpacity
            key={month}
            style={[
              styles.monthButton,
              date.getMonth() === index && styles.monthButtonActive
            ]}
            onPress={() => {
              const newDate = new Date(date);
              newDate.setMonth(index);
              onChange(newDate);
            }}
          >
            <Text style={[
              styles.monthButtonText,
              date.getMonth() === index && styles.monthButtonTextActive
            ]}>
              {month}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.dayYearRow}>
        <View style={styles.dayYearColumn}>
          <Text style={styles.pickerLabel}>Day</Text>
          <ScrollView style={styles.dayPicker} showsVerticalScrollIndicator={false}>
            {days.map((day) => (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayButton,
                  date.getDate() === day && styles.dayButtonActive
                ]}
                onPress={() => {
                  const newDate = new Date(date);
                  newDate.setDate(day);
                  onChange(newDate);
                }}
              >
                <Text style={[
                  styles.dayButtonText,
                  date.getDate() === day && styles.dayButtonTextActive
                ]}>
                  {day}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.dayYearColumn}>
          <Text style={styles.pickerLabel}>Year</Text>
          <ScrollView style={styles.yearPicker} showsVerticalScrollIndicator={false}>
            {years.map((year) => (
              <TouchableOpacity
                key={year}
                style={[
                  styles.yearButton,
                  date.getFullYear() === year && styles.yearButtonActive
                ]}
                onPress={() => {
                  const newDate = new Date(date);
                  newDate.setFullYear(year);
                  onChange(newDate);
                }}
              >
                <Text style={[
                  styles.yearButtonText,
                  date.getFullYear() === year && styles.yearButtonTextActive
                ]}>
                  {year}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

// Time Picker Component
function TimePickerInputs({ date, onChange }: { date: Date; onChange: (date: Date) => void }) {
  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);
  const currentHour = date.getHours() % 12 || 12;
  const currentMinute = date.getMinutes();
  const isPM = date.getHours() >= 12;

  return (
    <View style={styles.timePickerContent}>
      <View style={styles.timeRow}>
        <View style={styles.timeColumn}>
          <Text style={styles.pickerLabel}>Hour</Text>
          <ScrollView style={styles.timePicker} showsVerticalScrollIndicator={false}>
            {hours.map((hour) => (
              <TouchableOpacity
                key={hour}
                style={[
                  styles.timeButton,
                  currentHour === hour && styles.timeButtonActive
                ]}
                onPress={() => {
                  const newDate = new Date(date);
                  let newHour = hour;
                  if (isPM && hour !== 12) newHour += 12;
                  if (!isPM && hour === 12) newHour = 0;
                  newDate.setHours(newHour);
                  onChange(newDate);
                }}
              >
                <Text style={[
                  styles.timeButtonText,
                  currentHour === hour && styles.timeButtonTextActive
                ]}>
                  {hour}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.timeColumn}>
          <Text style={styles.pickerLabel}>Minute</Text>
          <ScrollView style={styles.timePicker} showsVerticalScrollIndicator={false}>
            {minutes.map((minute) => (
              <TouchableOpacity
                key={minute}
                style={[
                  styles.timeButton,
                  currentMinute === minute && styles.timeButtonActive
                ]}
                onPress={() => {
                  const newDate = new Date(date);
                  newDate.setMinutes(minute);
                  onChange(newDate);
                }}
              >
                <Text style={[
                  styles.timeButtonText,
                  currentMinute === minute && styles.timeButtonTextActive
                ]}>
                  {minute.toString().padStart(2, '0')}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.amPmColumn}>
          <Text style={styles.pickerLabel}>Period</Text>
          <View style={styles.amPmButtons}>
            <TouchableOpacity
              style={[
                styles.amPmButton,
                !isPM && styles.amPmButtonActive
              ]}
              onPress={() => {
                const newDate = new Date(date);
                let newHour = currentHour;
                if (isPM) {
                  newHour = currentHour === 12 ? 0 : currentHour;
                }
                newDate.setHours(newHour);
                onChange(newDate);
              }}
            >
              <Text style={[
                styles.amPmButtonText,
                !isPM && styles.amPmButtonTextActive
              ]}>
                AM
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.amPmButton,
                isPM && styles.amPmButtonActive
              ]}
              onPress={() => {
                const newDate = new Date(date);
                let newHour = currentHour === 12 ? 12 : currentHour + 12;
                newDate.setHours(newHour);
                onChange(newDate);
              }}
            >
              <Text style={[
                styles.amPmButtonText,
                isPM && styles.amPmButtonTextActive
              ]}>
                PM
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

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
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');

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
            <Text style={styles.pickerTitle}>Set Start Date & Time</Text>
            
            {/* Mode Toggle */}
            <View style={styles.modeToggle}>
              <TouchableOpacity
                style={[styles.modeButton, pickerMode === 'date' && styles.modeButtonActive]}
                onPress={() => setPickerMode('date')}
              >
                <Text style={[styles.modeButtonText, pickerMode === 'date' && styles.modeButtonTextActive]}>
                  📅 Date
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeButton, pickerMode === 'time' && styles.modeButtonActive]}
                onPress={() => setPickerMode('time')}
              >
                <Text style={[styles.modeButtonText, pickerMode === 'time' && styles.modeButtonTextActive]}>
                  🕐 Time
                </Text>
              </TouchableOpacity>
            </View>

            {pickerMode === 'date' ? (
              <DatePickerInputs
                date={startDateTime}
                onChange={(newDate) => {
                  setStartDateTime(newDate);
                }}
              />
            ) : (
              <TimePickerInputs
                date={startDateTime}
                onChange={(newDate) => {
                  setStartDateTime(newDate);
                  // Auto-update end time to be 2 hours later
                  setEndDateTime(new Date(newDate.getTime() + 2 * 60 * 60 * 1000));
                }}
              />
            )}

            <View style={styles.pickerButtons}>
              <TouchableOpacity
                style={[styles.pickerButton, styles.cancelPickerButton]}
                onPress={() => {
                  setShowStartDatePicker(false);
                  setPickerMode('date');
                }}
              >
                <Text style={styles.cancelPickerButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => {
                  setShowStartDatePicker(false);
                  setPickerMode('date');
                }}
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
            <Text style={styles.pickerTitle}>Set End Date & Time</Text>
            
            {/* Mode Toggle */}
            <View style={styles.modeToggle}>
              <TouchableOpacity
                style={[styles.modeButton, pickerMode === 'date' && styles.modeButtonActive]}
                onPress={() => setPickerMode('date')}
              >
                <Text style={[styles.modeButtonText, pickerMode === 'date' && styles.modeButtonTextActive]}>
                  📅 Date
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeButton, pickerMode === 'time' && styles.modeButtonActive]}
                onPress={() => setPickerMode('time')}
              >
                <Text style={[styles.modeButtonText, pickerMode === 'time' && styles.modeButtonTextActive]}>
                  🕐 Time
                </Text>
              </TouchableOpacity>
            </View>

            {pickerMode === 'date' ? (
              <DatePickerInputs
                date={endDateTime}
                onChange={setEndDateTime}
              />
            ) : (
              <TimePickerInputs
                date={endDateTime}
                onChange={setEndDateTime}
              />
            )}

            <View style={styles.pickerButtons}>
              <TouchableOpacity
                style={[styles.pickerButton, styles.cancelPickerButton]}
                onPress={() => {
                  setShowEndDatePicker(false);
                  setPickerMode('date');
                }}
              >
                <Text style={styles.cancelPickerButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => {
                  setShowEndDatePicker(false);
                  setPickerMode('date');
                }}
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
  cancelPickerButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  cancelPickerButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modeToggle: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  modeButtonText: {
    fontSize: 14,
    color: '#333',
  },
  modeButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  datePickerContent: {
    marginBottom: 20,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  monthPicker: {
    marginBottom: 16,
  },
  monthButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  monthButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  monthButtonText: {
    fontSize: 14,
    color: '#333',
  },
  monthButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  dayYearRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dayYearColumn: {
    flex: 1,
  },
  dayPicker: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 8,
    backgroundColor: '#f9f9f9',
  },
  yearPicker: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 8,
    backgroundColor: '#f9f9f9',
  },
  dayButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 4,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  dayButtonActive: {
    backgroundColor: '#007AFF',
  },
  dayButtonText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  dayButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  yearButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 4,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  yearButtonActive: {
    backgroundColor: '#007AFF',
  },
  yearButtonText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  yearButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  timePickerContent: {
    marginBottom: 20,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeColumn: {
    flex: 1,
  },
  amPmColumn: {
    width: 80,
  },
  timePicker: {
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 8,
    backgroundColor: '#f9f9f9',
  },
  timeButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 4,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  timeButtonActive: {
    backgroundColor: '#007AFF',
  },
  timeButtonText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  timeButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  amPmButtons: {
    gap: 8,
  },
  amPmButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  amPmButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  amPmButtonText: {
    fontSize: 14,
    color: '#333',
  },
  amPmButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
});
