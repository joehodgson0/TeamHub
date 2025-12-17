import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Modal, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useUser } from '@/context/UserContext';
import { API_BASE_URL } from '@/lib/config';
import { queryClient } from '@/lib/queryClient';

interface CreateTeamModalProps {
  visible: boolean;
  onClose: () => void;
}

const ageGroups = [
  "U7", "U8", "U9", "U10", "U11", "U12", "U13", "U14", "U15", "U16", "U17", "U18", "U19", "U20", "U21"
];

export default function CreateTeamModal({ visible, onClose }: CreateTeamModalProps) {
  const { user, refreshUser } = useUser();
  const [teamName, setTeamName] = useState('');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('U12');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    if (!teamName.trim()) {
      Alert.alert('Error', 'Please enter a team name');
      return;
    }

    if (!user?.clubId) {
      Alert.alert('Error', 'You must be associated with a club to create a team');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: teamName,
          ageGroup: selectedAgeGroup,
        }),
        credentials: 'include',
      });

      const result = await response.json();

      if (result.success && result.team) {
        // Refresh user data in context to include new team
        await refreshUser();
        
        // Refresh the teams list
        queryClient.invalidateQueries({ queryKey: ['/api/teams/club', user.clubId] });
        
        Alert.alert(
          'Team Created Successfully',
          `${teamName} has been created with code: ${result.teamCode}`,
          [{ text: 'OK', onPress: () => {
            setTeamName('');
            setSelectedAgeGroup('U12');
            onClose();
          }}]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to create team');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create team. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setTeamName('');
    setSelectedAgeGroup('U12');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create New Team</Text>
          <TouchableOpacity onPress={handleCreate} disabled={isLoading || !teamName.trim()}>
            <Text style={[styles.saveButton, (!teamName.trim() || isLoading) && styles.saveButtonDisabled]}>
              {isLoading ? 'Creating...' : 'Create'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView 
          style={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Team Name */}
          <View style={styles.section}>
            <Text style={styles.label}>Team Name</Text>
            <TextInput
              style={styles.input}
              value={teamName}
              onChangeText={setTeamName}
              placeholder="Enter team name"
              autoCapitalize="words"
            />
          </View>

          {/* Age Group */}
          <View style={styles.section}>
            <Text style={styles.label}>Age Group</Text>
            <View style={styles.ageGroupsContainer}>
              {ageGroups.map((ageGroup) => (
                <TouchableOpacity
                  key={ageGroup}
                  style={[
                    styles.ageGroupButton,
                    selectedAgeGroup === ageGroup && styles.ageGroupButtonActive,
                  ]}
                  onPress={() => setSelectedAgeGroup(ageGroup)}
                >
                  <Text
                    style={[
                      styles.ageGroupButtonText,
                      selectedAgeGroup === ageGroup && styles.ageGroupButtonTextActive,
                    ]}
                  >
                    {ageGroup}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    marginBottom: 24,
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
  ageGroupsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ageGroupButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  ageGroupButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  ageGroupButtonText: {
    fontSize: 14,
    color: '#333',
  },
  ageGroupButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
});
