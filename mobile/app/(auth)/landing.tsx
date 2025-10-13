import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { Button } from '@/components/ui/Button';

export default function Landing() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to TeamHub</Text>
        <Text style={styles.subtitle}>
          The complete sports team management platform for coaches and parents
        </Text>

        <View style={styles.features}>
          <View style={styles.featureCard}>
            <Text style={styles.featureTitle}>Team Management</Text>
            <Text style={styles.featureText}>
              Organize players, track attendance, and manage team rosters
            </Text>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.featureTitle}>Event Scheduling</Text>
            <Text style={styles.featureText}>
              Schedule matches, training sessions, and track results
            </Text>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.featureTitle}>Match Results</Text>
            <Text style={styles.featureText}>
              Record scores, player statistics, and team performance
            </Text>
          </View>

          <View style={styles.featureCard}>
            <Text style={styles.featureTitle}>Communication</Text>
            <Text style={styles.featureText}>
              Stay connected with team announcements and updates
            </Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Link href="/(auth)/login" asChild>
            <Button title="Sign In" />
          </Link>
          
          <Link href="/(auth)/register" asChild>
            <Button title="Create Account" variant="outline" />
          </Link>
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
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    color: '#666',
    marginBottom: 40,
  },
  features: {
    marginBottom: 40,
  },
  featureCard: {
    backgroundColor: '#f5f5f5',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1a1a1a',
  },
  featureText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  buttonContainer: {
    gap: 15,
  },
});
