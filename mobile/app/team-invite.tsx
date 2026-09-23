import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { API_BASE_URL } from '@/lib/config';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useUser } from '@/context/UserContext';

export default function TeamInvite() {
  const { token: tokenParam } = useLocalSearchParams<{ token?: string }>();
  const token = typeof tokenParam === 'string' ? tokenParam : '';
  const { isAuthenticated, user, refreshUser } = useUser();
  const [invitation, setInvitation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState('');
  const [dependentName, setDependentName] = useState('');
  const [dependentDateOfBirth, setDependentDateOfBirth] = useState('');

  useEffect(() => {
    if (!token) {
      setError('This invitation link is incomplete.');
      setIsLoading(false);
      return;
    }
    fetch(`${API_BASE_URL}/api/team-invitations/details?token=${encodeURIComponent(token)}`, { credentials: 'include' })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Unable to load invitation');
        setInvitation(result.invitation);
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Unable to load invitation'))
      .finally(() => setIsLoading(false));
  }, [token]);

  const accept = async () => {
    setIsAccepting(true);
    try {
      const result = await apiRequest('/api/team-invitations/accept', {
        method: 'POST',
        body: JSON.stringify(invitation.role === 'parent' ? { token, dependentName, dependentDateOfBirth } : { token }),
      });
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ['/api/teams/club'] });
      queryClient.invalidateQueries({ queryKey: ['/api/players/parent'] });
      Alert.alert('Invitation accepted', `You have joined ${result.team.name}.`);
      router.replace(result.role === 'parent' ? '/(tabs)/dependents' : '/(tabs)/teams');
    } catch (acceptError) {
      Alert.alert('Unable to accept invitation', acceptError instanceof Error ? acceptError.message : 'Please try again');
    } finally {
      setIsAccepting(false);
    }
  };

  const inviteParams = { invite: token };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <Text style={styles.title}>Team invitation</Text>
        {isLoading && <ActivityIndicator />}
        {!!error && <Text style={styles.error}>{error}</Text>}
        {invitation && (
          <>
            <Text style={styles.description}>
              Join {invitation.team.name} ({invitation.team.ageGroup}) as a {invitation.role}.
            </Text>
            {!isAuthenticated ? (
              <>
                <Text style={styles.help}>Sign in or register using {invitation.email} to continue.</Text>
                <TouchableOpacity style={styles.primaryButton} onPress={() => router.push({ pathname: '/(auth)/login', params: inviteParams })}>
                  <Text style={styles.primaryButtonText}>Sign in</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push({ pathname: '/(auth)/register', params: inviteParams })}>
                  <Text style={styles.secondaryButtonText}>Create account</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.help}>Signed in as {user?.email}. This invite was sent to {invitation.email}.</Text>
                {invitation.role === 'parent' && (
                  <>
                    <Text style={styles.label}>Dependent name</Text>
                    <TextInput style={styles.input} value={dependentName} onChangeText={setDependentName} />
                    <Text style={styles.label}>Date of birth</Text>
                    <TextInput
                      style={styles.input}
                      value={dependentDateOfBirth}
                      onChangeText={setDependentDateOfBirth}
                      placeholder="YYYY-MM-DD"
                      keyboardType="numbers-and-punctuation"
                    />
                    <Text style={styles.help}>A matching dependent will be linked instead of duplicated.</Text>
                  </>
                )}
                <TouchableOpacity
                  style={[styles.primaryButton, (isAccepting || (invitation.role === 'parent' && (!dependentName.trim() || !dependentDateOfBirth))) && styles.disabled]}
                  disabled={isAccepting || (invitation.role === 'parent' && (!dependentName.trim() || !dependentDateOfBirth))}
                  onPress={accept}
                >
                  <Text style={styles.primaryButtonText}>{isAccepting ? 'Accepting...' : `Join ${invitation.team.name}`}</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fb' },
  content: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 22, gap: 14 },
  title: { fontSize: 26, fontWeight: '700', color: '#111827' },
  description: { fontSize: 17, color: '#374151' },
  help: { fontSize: 14, color: '#6B7280', lineHeight: 20 },
  error: { color: '#DC2626', fontSize: 15 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151' },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, fontSize: 16 },
  primaryButton: { backgroundColor: '#007AFF', borderRadius: 8, padding: 14, alignItems: 'center' },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondaryButton: { borderWidth: 1, borderColor: '#007AFF', borderRadius: 8, padding: 14, alignItems: 'center' },
  secondaryButtonText: { color: '#007AFF', fontWeight: '700', fontSize: 16 },
  disabled: { opacity: 0.5 },
});
