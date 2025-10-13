import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '@/lib/config';

export default function Events() {
  const { data: events, isLoading } = useQuery({
    queryKey: ['/api/events'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/events`, {
        credentials: 'include',
      });
      return response.json();
    },
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Events & Fixtures</Text>
        {isLoading ? (
          <Text>Loading events...</Text>
        ) : (
          <View style={styles.eventsContainer}>
            {events?.length > 0 ? (
              events.map((event: any) => (
                <View key={event.id} style={styles.eventCard}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventDate}>{new Date(event.date).toLocaleDateString()}</Text>
                  <Text style={styles.eventType}>{event.type}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No events scheduled</Text>
            )}
          </View>
        )}
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  eventsContainer: {
    gap: 15,
  },
  eventCard: {
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  eventDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  eventType: {
    fontSize: 12,
    color: '#999',
    marginTop: 3,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  },
});
