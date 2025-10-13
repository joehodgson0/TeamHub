import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '@/lib/config';

export default function Teams() {
  const { data: teams, isLoading } = useQuery({
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
        <Text style={styles.title}>Teams</Text>
        {isLoading ? (
          <Text>Loading teams...</Text>
        ) : (
          <View style={styles.teamsContainer}>
            {teams?.length > 0 ? (
              teams.map((team: any) => (
                <View key={team.id} style={styles.teamCard}>
                  <Text style={styles.teamName}>{team.name}</Text>
                  <Text style={styles.teamInfo}>{team.ageGroup}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No teams yet</Text>
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
  teamsContainer: {
    gap: 15,
  },
  teamCard: {
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
  },
  teamName: {
    fontSize: 18,
    fontWeight: '600',
  },
  teamInfo: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  },
});
