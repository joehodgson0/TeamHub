import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, RefreshControl, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useUser } from '@/context/UserContext';
import { API_BASE_URL } from '@/lib/config';
import { refreshAllVisibleData } from '@/lib/queryKeys';
import CreateTeamModal from '@/components/modals/CreateTeamModal';
import { apiRequest } from '@/lib/queryClient';

export default function Teams() {
  const { user, refreshUser } = useUser();
  const isCoach = user?.roles?.includes('coach');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [clubCode, setClubCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [guardianPlayer, setGuardianPlayer] = useState<any>(null);
  const [guardianRoster, setGuardianRoster] = useState<any[]>([]);
  const [guardianEmail, setGuardianEmail] = useState('');

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshAllVisibleData();
    setRefreshing(false);
  };

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

  const { data: clubData } = useQuery({
    queryKey: ['/api/clubs', user?.clubId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/clubs/${user?.clubId}`, {
        credentials: 'include',
      });
      return response.json();
    },
    enabled: Boolean(user?.clubId),
  });

  const allTeams = teamsData?.teams || [];
  const teams = isCoach && user?.teamIds 
    ? allTeams.filter((team: any) => user.teamIds.includes(team.id))
    : allTeams;

  const { data: guardiansData, isLoading: guardiansLoading } = useQuery({
    queryKey: ['/api/players', guardianPlayer?.id, 'guardians'],
    queryFn: () => apiRequest(`/api/players/${guardianPlayer.id}/guardians`),
    enabled: Boolean(guardianPlayer?.id),
  });

  const linkGuardianMutation = useMutation({
    mutationFn: () => apiRequest(`/api/players/${guardianPlayer.id}/guardians`, {
      method: 'POST',
      body: JSON.stringify({ email: guardianEmail.trim() }),
    }),
    onSuccess: async () => {
      setGuardianEmail('');
      await refreshAllVisibleData();
      Alert.alert('Parent linked', 'The parent can now access this dependant.');
    },
    onError: (error: Error) => Alert.alert('Unable to link parent', error.message),
  });

  const mergeMutation = useMutation({
    mutationFn: (duplicatePlayerId: string) => apiRequest(`/api/players/${guardianPlayer.id}/merge-duplicate`, {
      method: 'POST',
      body: JSON.stringify({ duplicatePlayerId }),
    }),
    onSuccess: async () => {
      await refreshAllVisibleData();
      setGuardianPlayer(null);
      Alert.alert('Duplicate merged', 'Parents and activity now use one dependant record.');
    },
    onError: (error: Error) => Alert.alert('Unable to merge duplicate', error.message),
  });

  const duplicateCandidates = guardianPlayer ? guardianRoster.filter((candidate) =>
    candidate.id !== guardianPlayer.id &&
    candidate.name.trim().replace(/\s+/g, ' ').toLocaleLowerCase('en-GB') === guardianPlayer.name.trim().replace(/\s+/g, ' ').toLocaleLowerCase('en-GB') &&
    new Date(candidate.dateOfBirth).toISOString().slice(0, 10) === new Date(guardianPlayer.dateOfBirth).toISOString().slice(0, 10)
  ) : [];

  const handleJoinClub = async () => {
    if (!clubCode.trim() || clubCode.trim().length !== 8) {
      Alert.alert('Error', 'Please enter an 8-character club code');
      return;
    }

    setIsJoining(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/associate-club-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clubCode: clubCode.toUpperCase() }),
        credentials: 'include',
      });

      const result = await response.json();

      if (result.success && result.user) {
        // Update UserContext cache so the UI immediately reflects the new clubId
        await refreshUser();
        
        Alert.alert('Success', `Successfully joined ${result.clubName || 'the club'}!`);
        setClubCode('');
      } else {
        Alert.alert('Error', result.error || 'No club found with that code');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred. Please try again.');
    } finally {
      setIsJoining(false);
    }
  };

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
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
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
                <TouchableOpacity
                  style={styles.manageParentsButton}
                  onPress={() => {
                    setGuardianRoster(teamPlayers);
                    setGuardianPlayer(player);
                  }}
                >
                  <Text style={styles.manageParentsText}>Manage parents</Text>
                </TouchableOpacity>
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
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.content}>
          <Text style={styles.title}>Join Club to Manage Teams</Text>
          
          <View style={styles.joinClubCard}>
            <Text style={styles.joinClubDescription}>
              You need to join a club before you can create or manage teams.
            </Text>

            <View style={styles.section}>
              <Text style={styles.label}>Club Code</Text>
              <TextInput
                style={styles.input}
                value={clubCode}
                onChangeText={setClubCode}
                placeholder="Enter 8-character club code"
                autoCapitalize="characters"
                maxLength={8}
              />
            </View>

            <TouchableOpacity
              style={[styles.joinButton, (clubCode.trim().length !== 8 || isJoining) && styles.joinButtonDisabled]}
              onPress={handleJoinClub}
              disabled={clubCode.trim().length !== 8 || isJoining}
            >
              <Text style={styles.joinButtonText}>
                {isJoining ? 'Joining...' : 'Join Club'}
              </Text>
            </TouchableOpacity>

            <View style={styles.demoInfo}>
              <Text style={styles.demoTitle}>Demo Information</Text>
              <Text style={styles.demoText}>• Club: Hilly Fielders FC</Text>
              <Text style={styles.demoText}>• Valid codes start with "1" (e.g., "1ABC2345")</Text>
              <Text style={styles.demoText}>• Invalid codes show error message</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <>
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.content}>
          {clubData?.club && (
            <View style={styles.clubInfo}>
              <Text style={styles.clubLabel}>Club</Text>
              <Text style={styles.clubName}>{clubData.club.name}</Text>
            </View>
          )}
          
          <View style={styles.header}>
            <Text style={styles.title}>Your Teams</Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => setShowCreateModal(true)}
            >
              <Text style={styles.createButtonText}>+ Create Team</Text>
            </TouchableOpacity>
          </View>
          
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

      <CreateTeamModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
      <Modal visible={Boolean(guardianPlayer)} animationType="slide" transparent onRequestClose={() => setGuardianPlayer(null)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.guardianModal}>
            <Text style={styles.modalTitle}>Parents for {guardianPlayer?.name}</Text>
            <Text style={styles.modalHelp}>Link a registered parent to the existing record, or merge an exact duplicate.</Text>
            {guardiansLoading ? <Text style={styles.loadingText}>Loading parents...</Text> : guardiansData?.guardians?.map((guardian: any) => (
              <View key={guardian.id} style={styles.guardianRow}>
                <Text style={styles.guardianName}>{[guardian.firstName, guardian.lastName].filter(Boolean).join(' ') || guardian.email}</Text>
                {guardian.primary && <Text style={styles.primaryLabel}>Primary</Text>}
              </View>
            ))}
            <Text style={styles.label}>Registered parent email</Text>
            <TextInput
              style={styles.input}
              value={guardianEmail}
              onChangeText={setGuardianEmail}
              placeholder="parent@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TouchableOpacity
              style={[styles.actionButton, (!guardianEmail.trim() || linkGuardianMutation.isPending) && styles.joinButtonDisabled]}
              disabled={!guardianEmail.trim() || linkGuardianMutation.isPending}
              onPress={() => linkGuardianMutation.mutate()}
            >
              <Text style={styles.actionButtonText}>{linkGuardianMutation.isPending ? 'Linking...' : 'Link Parent'}</Text>
            </TouchableOpacity>

            {duplicateCandidates.map((duplicate) => (
              <View key={duplicate.id} style={styles.duplicateRow}>
                <Text style={styles.guardianName}>Duplicate: {duplicate.name}</Text>
                <TouchableOpacity
                  style={styles.mergeButton}
                  disabled={mergeMutation.isPending}
                  onPress={() => Alert.alert(
                    'Merge duplicate?',
                    `Keep this ${guardianPlayer.name} record and remove the duplicate?`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Merge', style: 'destructive', onPress: () => mergeMutation.mutate(duplicate.id) },
                    ],
                  )}
                >
                  <Text style={styles.mergeButtonText}>Merge</Text>
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity style={styles.closeButton} onPress={() => setGuardianPlayer(null)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
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
  clubInfo: {
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  clubLabel: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 4,
  },
  clubName: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
  joinClubCard: {
    backgroundColor: '#f9f9f9',
    padding: 20,
    borderRadius: 12,
    marginTop: 20,
  },
  joinClubDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  joinButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  joinButtonDisabled: {
    backgroundColor: '#ccc',
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  demoInfo: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 8,
  },
  demoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 8,
  },
  demoText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
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
  manageParentsButton: {
    backgroundColor: '#E3F2FD',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  manageParentsText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  guardianModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalHelp: {
    color: '#666',
    fontSize: 14,
    marginBottom: 16,
  },
  guardianRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderRadius: 8,
    marginBottom: 8,
  },
  guardianName: {
    flex: 1,
    fontSize: 14,
  },
  primaryLabel: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '600',
  },
  actionButton: {
    backgroundColor: '#007AFF',
    padding: 14,
    alignItems: 'center',
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 16,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  duplicateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  mergeButton: {
    backgroundColor: '#dc2626',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  mergeButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  closeButton: {
    padding: 14,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#333',
    fontWeight: '600',
  },
});
