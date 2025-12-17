import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { API_BASE_URL } from '@/lib/config';

export default function Settings() {
  const { user, logout, updateUserRoles } = useAuth();
  const [selectedRoles, setSelectedRoles] = useState<Array<'coach' | 'parent'>>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (user?.roles) {
      setSelectedRoles(user.roles);
    }
  }, [user?.roles]);

  const toggleRole = (role: 'coach' | 'parent') => {
    setSelectedRoles(currentRoles =>
      currentRoles.includes(role)
        ? currentRoles.filter(r => r !== role)
        : [...currentRoles, role]
    );
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    setIsUpdating(true);
    try {
      await updateUserRoles(user.id, selectedRoles);
      Alert.alert('Success', 'Your profile has been updated successfully.');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/(auth)/landing');
            } catch (error) {
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account?',
      'This will permanently delete your account and all associated data including profile, dependents, and posts. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            setIsUpdating(true);
            try {
              console.log('Starting delete account. API URL:', API_BASE_URL);
              
              const response = await fetch(`${API_BASE_URL}/api/auth/delete-account`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                  'Content-Type': 'application/json',
                },
              });

              console.log('Delete account response status:', response.status);
              console.log('Delete account response headers:', response.headers.get('content-type'));
              
              // Try to parse as JSON, but handle HTML error responses
              let data: any;
              const contentType = response.headers.get('content-type');
              
              if (contentType?.includes('application/json')) {
                data = await response.json();
              } else {
                // If not JSON, get the raw text (likely an error page)
                const text = await response.text();
                console.log('Delete account response (non-JSON):', text.substring(0, 500));
                throw new Error(`Server returned non-JSON response (${response.status}): ${text.substring(0, 200)}`);
              }
              
              console.log('Delete account response data:', data);

              if (!response.ok || !data.success) {
                throw new Error(data.error || `Failed to delete account (${response.status})`);
              }

              Alert.alert('Success', 'Your account has been deleted.', [
                {
                  text: 'OK',
                  onPress: async () => {
                    // Logout and redirect
                    try {
                      await logout();
                    } catch (e) {
                      console.error('Logout error after account deletion:', e);
                    }
                    router.replace('/(auth)/landing');
                  },
                },
              ]);
            } catch (error) {
              console.error('Delete account error:', error);
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
              console.error('Delete account error details:', errorMessage);
              Alert.alert('Error', `Failed to delete account: ${errorMessage}`);
              setIsUpdating(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Settings</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <View style={styles.infoCard}>
            <Text style={styles.label}>Name</Text>
            <Text style={styles.value}>{user?.firstName} {user?.lastName}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user?.email}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Role</Text>
          <TouchableOpacity
            style={[
              styles.roleOption,
              selectedRoles.includes('coach') && styles.roleOptionSelected,
            ]}
            onPress={() => toggleRole('coach')}
          >
            <View style={styles.roleContent}>
              <Checkbox
                checked={selectedRoles.includes('coach')}
                onCheckedChange={() => toggleRole('coach')}
              />
              <Text style={styles.roleText}>Coach/Manager</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.roleOption,
              selectedRoles.includes('parent') && styles.roleOptionSelected,
            ]}
            onPress={() => toggleRole('parent')}
          >
            <View style={styles.roleContent}>
              <Checkbox
                checked={selectedRoles.includes('parent')}
                onCheckedChange={() => toggleRole('parent')}
              />
              <Text style={styles.roleText}>Parent/Guardian</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.updateButtonContainer}>
            <Button
              title={isUpdating ? 'Updating...' : 'Update Profile'}
              onPress={handleUpdateProfile}
              disabled={isUpdating}
            />
          </View>
        </View>

        <View style={styles.actions}>
          <Button title="Logout" onPress={handleLogout} variant="outline" />
        </View>

        <View style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>Danger Zone</Text>
          <Text style={styles.dangerDescription}>
            Permanently delete your account and all associated data. This action cannot be undone.
          </Text>
          <Button 
            title="Delete Account" 
            onPress={handleDeleteAccount} 
            variant="destructive"
            disabled={isUpdating}
          />
        </View>
      </View>
    </ScrollView>
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  infoCard: {
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginBottom: 10,
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
  },
  roleOption: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  roleOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  roleContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleText: {
    fontSize: 16,
    marginLeft: 12,
    color: '#333',
  },
  updateButtonContainer: {
    marginTop: 10,
  },
  actions: {
    marginTop: 20,
    paddingBottom: 20,
  },
  dangerZone: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#ffebee',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ff5252',
    paddingBottom: 20,
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff5252',
    marginBottom: 8,
  },
  dangerDescription: {
    fontSize: 14,
    color: '#d32f2f',
    marginBottom: 12,
    lineHeight: 20,
  },
});
