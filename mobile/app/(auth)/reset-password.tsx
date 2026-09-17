import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { API_BASE_URL } from '@/lib/config';

export default function ResetPassword() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);

  const handleSubmit = async () => {
    if (!token) {
      Alert.alert('Invalid link', 'Request a new password reset link.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Password too short', 'Use at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Passwords do not match', 'Enter the same password in both fields.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to reset password');
      setComplete(true);
    } catch (error) {
      Alert.alert('Unable to reset password', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.content}>
        <Text style={styles.title}>{complete ? 'Password reset' : 'Choose a new password'}</Text>
        <Text style={styles.subtitle}>
          {complete ? 'Your password has been updated. You can now sign in.' : 'Use at least 8 characters.'}
        </Text>

        {!complete && (
          <>
            <Text style={styles.label}>New password</Text>
            <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" />
            <Text style={styles.label}>Confirm new password</Text>
            <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry autoComplete="new-password" />
            <Button title={loading ? 'Resetting…' : 'Reset password'} onPress={handleSubmit} disabled={loading || !token} />
          </>
        )}

        <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
          <Text style={styles.link}>{complete ? 'Sign in' : 'Back to sign in'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, padding: 20, paddingTop: 80, gap: 18 },
  title: { fontSize: 28, fontWeight: 'bold' },
  subtitle: { color: '#666', fontSize: 16, lineHeight: 23, marginBottom: 10 },
  label: { fontSize: 14, fontWeight: '500' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16 },
  link: { textAlign: 'center', color: '#007AFF', fontSize: 14, marginTop: 8 },
});