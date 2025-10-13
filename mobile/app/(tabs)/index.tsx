import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '@/lib/config';

export default function Dashboard() {
  const { user } = useAuth();
  
  const { data: events } = useQuery({
    queryKey: ['/api/events'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/events`, {
        credentials: 'include',
      });
      return response.json();
    },
  });

  const { data: teams } = useQuery({
    queryKey: ['/api/teams'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/teams`, {
        credentials: 'include',
      });
      return response.json();
    },
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.greeting}>Welcome, {user?.firstName}!</Text>
        
        <View style={styles.widgets}>
          <View style={styles.widget}>
            <Text style={styles.widgetTitle}>Upcoming Events</Text>
            <Text style={styles.widgetValue}>{events?.length || 0}</Text>
          </View>

          <View style={styles.widget}>
            <Text style={styles.widgetTitle}>Your Teams</Text>
            <Text style={styles.widgetValue}>{teams?.length || 0}</Text>
          </View>

          <View style={styles.widget}>
            <Text style={styles.widgetTitle}>Role</Text>
            <Text style={styles.widgetText}>{user?.roles?.join(', ') || 'None'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <Text style={styles.helpText}>
            Use the tabs below to navigate to Teams, Events, Posts, or Settings
          </Text>
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
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  widgets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginBottom: 30,
  },
  widget: {
    flex: 1,
    minWidth: 150,
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  widgetTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  widgetValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  widgetText: {
    fontSize: 18,
    fontWeight: '600',
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
