import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { API_BASE_URL } from '@/lib/config';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      Alert.alert('Email required', 'Enter the email address used for your TeamHub account.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to send reset link');
      setSent(true);
    } catch (error) {
      Alert.alert('Unable to send email', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.content}>
        <Text style={styles.title}>Reset your password</Text>
        <Text style={styles.subtitle}>
          {sent
            ? 'If an account exists for that email, a reset link has been sent. Check your spam folder too.'
            : 'Enter your account email and we’ll send you a secure reset link.'}
        </Text>

        {!sent && (
          <>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              placeholder="your@email.com"
            />
            <Button title={loading ? 'Sending…' : 'Send reset link'} onPress={handleSubmit} disabled={loading} />
          </>
        )}

        <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
          <Text style={styles.link}>Back to sign in</Text>
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