import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { API_BASE_URL } from '@/lib/config';
import { queryClient } from '@/lib/queryClient';

export default function RoleSelection() {
  const { user } = useAuth();
  const [selectedRoles, setSelectedRoles] = useState<('coach' | 'parent')[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const toggleRole = (role: 'coach' | 'parent') => {
    setSelectedRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const handleSubmit = async () => {
    if (selectedRoles.length === 0) {
      Alert.alert('Error', 'Please select at least one role');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${user?.id}/roles`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roles: selectedRoles }),
        credentials: 'include',
      });

      const result = await response.json();

      if (result.success) {
        await queryClient.invalidateQueries({ queryKey: ['/api/auth/user-session'] });
        router.replace('/(tabs)');
      } else {
        Alert.alert('Error', result.error || 'Failed to update roles');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Choose Your Role</Text>
        <Text style={styles.subtitle}>Select how you'll be using TeamHub</Text>

        <View style={styles.roleContainer}>
          <TouchableOpacity
            style={[styles.roleCard, selectedRoles.includes('coach') && styles.roleCardSelected]}
            onPress={() => toggleRole('coach')}
          >
            <Text style={styles.roleTitle}>Coach</Text>
            <Text style={styles.roleDescription}>
              Manage teams, schedule events, and track player performance
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.roleCard, selectedRoles.includes('parent') && styles.roleCardSelected]}
            onPress={() => toggleRole('parent')}
          >
            <Text style={styles.roleTitle}>Parent</Text>
            <Text style={styles.roleDescription}>
              Track your child's team activities and stay updated
            </Text>
          </TouchableOpacity>
        </View>

        <Button
          title={isLoading ? 'Saving...' : 'Continue'}
          onPress={handleSubmit}
          disabled={isLoading || selectedRoles.length === 0}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
    gap: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  roleContainer: {
    flex: 1,
    gap: 15,
  },
  roleCard: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  roleCardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  roleDescription: {
    fontSize: 14,
    color: '#666',
  },
});
