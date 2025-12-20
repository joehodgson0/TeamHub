import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { useUser } from '@/context/UserContext';
import { API_BASE_URL } from '@/lib/config';
import { queryClient } from '@/lib/queryClient';

// Prefetch critical data after login to warm cache for instant tab loading
const prefetchTabData = async (user: any) => {
  if (!user) return;
  
  const prefetchPromises = [
    queryClient.prefetchQuery({
      queryKey: ['/api/events/upcoming-session'],
      queryFn: async () => {
        const response = await fetch(`${API_BASE_URL}/api/events/upcoming-session`, { credentials: 'include' });
        return response.json();
      },
      staleTime: 1000 * 60 * 5,
    }),
    queryClient.prefetchQuery({
      queryKey: ['/api/posts-session'],
      queryFn: async () => {
        const response = await fetch(`${API_BASE_URL}/api/posts-session`, { credentials: 'include' });
        return response.json();
      },
      staleTime: 1000 * 60 * 5,
    }),
    queryClient.prefetchQuery({
      queryKey: ['/api/match-results-session'],
      queryFn: async () => {
        const response = await fetch(`${API_BASE_URL}/api/match-results-session`, { credentials: 'include' });
        return response.json();
      },
      staleTime: 1000 * 60 * 5,
    }),
  ];
  
  if (user.clubId) {
    prefetchPromises.push(
      queryClient.prefetchQuery({
        queryKey: ['/api/teams/club', user.clubId],
        queryFn: async () => {
          const response = await fetch(`${API_BASE_URL}/api/teams/club/${user.clubId}`, { credentials: 'include' });
          return response.json();
        },
        staleTime: 1000 * 60 * 5,
      })
    );
  }
  
  // Use Promise.allSettled to handle partial failures gracefully
  await Promise.allSettled(prefetchPromises);
};

export default function Login() {
  const { refreshUser } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      // Check if response is actually JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // Server returned HTML or other non-JSON response (likely offline or error page)
        Alert.alert(
          'Server Unavailable',
          'The TeamHub server is not responding. It may be starting up. Please wait a moment and try again.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Retry', onPress: handleLogin }
          ]
        );
        setIsLoading(false);
        return;
      }

      const result = await response.json();

      console.log('Login response:', result);
      console.log('Response status:', response.status);

      if (result.success) {
        // Refresh user data in context after successful login
        await refreshUser();
        
        // Prefetch tab data after refreshUser resolves to ensure user context is populated
        // This warms the cache for instant tab loading
        await prefetchTabData(result.user);
        // Navigation is handled by the root layout's useEffect
      } else {
        Alert.alert('Error', result.error || 'Failed to login');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Better error message for JSON parse errors
      if (error instanceof SyntaxError && error.message.includes('JSON')) {
        Alert.alert(
          'Connection Error',
          'Cannot connect to the TeamHub server. The server may be sleeping or starting up. Please wait a moment and try again.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Retry', onPress: handleLogin }
          ]
        );
      } else if (error instanceof TypeError && error.message.includes('Network')) {
        Alert.alert(
          'Network Error',
          'Cannot reach the server. Please check your internet connection and try again.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Retry', onPress: handleLogin }
          ]
        );
      } else {
        Alert.alert('Error', `An error occurred: ${error instanceof Error ? error.message : 'Please try again'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
        <Text style={styles.title}>Sign In</Text>
        <Text style={styles.subtitle}>Welcome back to TeamHub</Text>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="your@email.com"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
            />
          </View>

          <Button
            title={isLoading ? 'Signing in...' : 'Sign In'}
            onPress={handleLogin}
            disabled={isLoading}
          />

          <Text
            style={styles.link}
            onPress={() => router.push('/(auth)/register')}
          >
            Don't have an account? Create one
          </Text>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push('/(auth)/landing')}
          >
            <Text style={styles.backButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  link: {
    textAlign: 'center',
    color: '#007AFF',
    fontSize: 14,
  },
  backButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  backButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
});
