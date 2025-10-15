import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { API_BASE_URL } from '@/lib/config';

export default function Teams() {
  const { user } = useAuth();
  const isCoach = user?.roles?.includes('coach');

  const { data: teamsData, isLoading } = useQuery({
    queryKey: ['/api/teams/club', user?.clubId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/teams/club/${user?.clubId}`, {
        credentials: 'include',
      });
      return response.json();
    },
    enabled: Boolean(user && isCoach && user.clubId),
  });

  const allTeams = teamsData?.teams || [];
  const teams = isCoach && user?.teamIds 
    ? allTeams.filter((team: any) => user.teamIds.includes(team.id))
    : allTeams;

  const TeamCard = ({ team }: { team: any }) => {
    const { data: playersData } = useQuery({
      queryKey: ['/api/players/team', team.id],
      queryFn: async () => {
        const response = await fetch(`${API_BASE_URL}/api/players/team/${team.id}`, {
          credentials: 'include',
        });
        return response.json();
      },
      enabled: Boolean(team?.id),
    });

    const teamPlayers = playersData?.players || [];
    const totalGames = (team.wins || 0) + (team.draws || 0) + (team.losses || 0);

    return (
      <View style={styles.teamCard}>
        <View style={styles.teamHeader}>
          <Text style={styles.teamName}>{team.name || 'Unknown Team'}</Text>
          <View style={styles.ageGroupBadge}>
            <Text style={styles.ageGroupText}>{team.ageGroup || 'Unknown'}</Text>
          </View>
        </View>
        
        <View style={styles.teamStats}>
          <Text style={styles.statText}>{teamPlayers.length} players</Text>
          {totalGames > 0 && (
            <>
              <Text style={styles.separator}>•</Text>
              <Text style={styles.statText}>
                {team.wins || 0}W {team.draws || 0}D {team.losses || 0}L
              </Text>
            </>
          )}
        </View>
        
        <Text style={styles.teamCode}>Code: {team.code || 'Unknown'}</Text>

        {teamPlayers.length > 0 && (
          <View style={styles.playersSection}>
            <Text style={styles.playersTitle}>Players:</Text>
            {teamPlayers.map((player: any) => (
              <View key={player.id} style={styles.playerItem}>
                <Text style={styles.playerName}>{player.name}</Text>
                {player.position && (
                  <Text style={styles.playerPosition}>{player.position}</Text>
                )}
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  if (!isCoach) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Teams</Text>
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Team management is only available for coaches.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  if (!user?.clubId) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Teams</Text>
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              You need to join a club before you can manage teams.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Your Teams</Text>
        
        {isLoading ? (
          <Text style={styles.loadingText}>Loading teams...</Text>
        ) : teams.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No teams created yet</Text>
            <Text style={styles.emptySubtext}>
              Create your first team to get started
            </Text>
          </View>
        ) : (
          <View style={styles.teamsContainer}>
            {teams.map((team: any) => (
              <TeamCard key={team.id} team={team} />
            ))}
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
  loadingText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  teamsContainer: {
    gap: 15,
  },
  teamCard: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
  },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  teamName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  ageGroupBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  ageGroupText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  teamStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statText: {
    fontSize: 14,
    color: '#666',
  },
  separator: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 8,
  },
  teamCode: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  playersSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  playersTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  playerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#fff',
    borderRadius: 6,
    marginBottom: 4,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '500',
  },
  playerPosition: {
    fontSize: 12,
    color: '#666',
  },
});
