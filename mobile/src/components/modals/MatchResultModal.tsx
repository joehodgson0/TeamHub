import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, ScrollView, Alert } from 'react-native';
import { useMutation, useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { API_BASE_URL } from '@/lib/config';

interface MatchResultModalProps {
  visible: boolean;
  fixture: any;
  onClose: () => void;
}

export function MatchResultModal({ visible, fixture, onClose }: MatchResultModalProps) {
  const [homeGoals, setHomeGoals] = useState('0');
  const [awayGoals, setAwayGoals] = useState('0');
  const [playerStats, setPlayerStats] = useState<Record<string, { goals: number; assists: number }>>({});

  const isHome = fixture?.homeAway === 'home';

  // Fetch team players
  const { data: playersResponse } = useQuery({
    queryKey: ['/api/players/team', fixture?.teamId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/players/team/${fixture?.teamId}`, {
        credentials: 'include',
      });
      return response.json();
    },
    enabled: !!fixture?.teamId,
  });

  const players = playersResponse?.players || [];

  // Fetch existing match result if it exists
  const { data: existingResultResponse } = useQuery({
    queryKey: ['/api/match-results/fixture', fixture?.id],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/match-results/fixture/${fixture?.id}`, {
        credentials: 'include',
      });
      return response.json();
    },
    enabled: !!fixture?.id,
  });

  const existingResult = existingResultResponse?.matchResult;

  // Reset form when fixture changes or existing result loads
  useEffect(() => {
    if (fixture && visible) {
      const defaultStats: Record<string, { goals: number; assists: number }> = {};
      players.forEach((player: any) => {
        defaultStats[player.id] = { goals: 0, assists: 0 };
      });

      // If there's an existing result, pre-fill the form
      if (existingResult) {
        setHomeGoals(String(existingResult.homeTeamGoals));
        setAwayGoals(String(existingResult.awayTeamGoals));
        // Merge existing stats with defaults to ensure all players have entries
        setPlayerStats({ ...defaultStats, ...existingResult.playerStats });
      } else {
        setHomeGoals('0');
        setAwayGoals('0');
        setPlayerStats(defaultStats);
      }
    }
  }, [fixture, visible, players.length, existingResult]);

  const saveResultMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`${API_BASE_URL}/api/match-results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      return response.json();
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ['/api/match-results/fixture', fixture.id] });
        queryClient.invalidateQueries({ queryKey: ['/api/events/upcoming-session'] });
        queryClient.invalidateQueries({ queryKey: ['/api/match-results-session'] });
        queryClient.invalidateQueries({ queryKey: ['/api/teams/club'] });
        Alert.alert('Success', 'Match result saved successfully!');
        onClose();
      } else {
        Alert.alert('Error', result.error || 'Failed to save match result');
      }
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to save match result');
    },
  });

  const handleSave = () => {
    const homeGoalsNum = parseInt(homeGoals) || 0;
    const awayGoalsNum = parseInt(awayGoals) || 0;

    if (isNaN(homeGoalsNum) || isNaN(awayGoalsNum)) {
      Alert.alert('Error', 'Please enter valid scores');
      return;
    }

    // Validate player stats don't exceed team goals
    const teamGoals = isHome ? homeGoalsNum : awayGoalsNum;
    const totalPlayerGoals = Object.values(playerStats).reduce((sum, stats) => sum + stats.goals, 0);
    
    if (totalPlayerGoals > teamGoals) {
      Alert.alert('Error', `Player goals (${totalPlayerGoals}) cannot exceed team goals (${teamGoals})`);
      return;
    }

    saveResultMutation.mutate({
      fixtureId: fixture.id,
      teamId: fixture.teamId,
      homeTeamGoals: homeGoalsNum,
      awayTeamGoals: awayGoalsNum,
      playerStats,
    });
  };

  const updatePlayerStat = (playerId: string, field: 'goals' | 'assists', value: number) => {
    setPlayerStats(prev => ({
      ...prev,
      [playerId]: {
        ...(prev[playerId] || { goals: 0, assists: 0 }),
        [field]: Math.max(0, value)
      }
    }));
  };

  if (!fixture) return null;

  const homeGoalsNum = parseInt(homeGoals) || 0;
  const awayGoalsNum = parseInt(awayGoals) || 0;
  const teamGoals = isHome ? homeGoalsNum : awayGoalsNum;
  const totalPlayerGoals = Object.values(playerStats).reduce((sum, stats) => sum + stats.goals, 0);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView>
            <Text style={styles.modalTitle}>Update Match Result</Text>

            {/* Match Info */}
            <View style={styles.matchInfo}>
              <Text style={styles.matchName}>{fixture.title}</Text>
              <Text style={styles.opponent}>vs {fixture.opponent}</Text>
              <Text style={styles.venue}>{isHome ? '🏠 Home' : '✈️ Away'}</Text>
            </View>

            {/* Score Entry */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Match Score</Text>
              <View style={styles.scoreRow}>
                <View style={styles.scoreInput}>
                  <Text style={styles.label}>
                    Home {isHome && '(Your Team)'}
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={homeGoals}
                    onChangeText={setHomeGoals}
                    keyboardType="number-pad"
                    placeholder="0"
                  />
                </View>
                <View style={styles.scoreInput}>
                  <Text style={styles.label}>
                    Away {!isHome && '(Your Team)'}
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={awayGoals}
                    onChangeText={setAwayGoals}
                    keyboardType="number-pad"
                    placeholder="0"
                  />
                </View>
              </View>
            </View>

            {/* Player Stats */}
            {players.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Player Statistics (Optional)
                </Text>
                <Text style={styles.sectionSubtitle}>
                  Total player goals: {totalPlayerGoals}/{teamGoals}
                </Text>
                {totalPlayerGoals > teamGoals && (
                  <Text style={styles.errorText}>
                    ⚠️ Player goals cannot exceed team goals
                  </Text>
                )}
                {players.map((player: any) => (
                  <View key={player.id} style={styles.playerRow}>
                    <Text style={styles.playerName}>{player.name}</Text>
                    <View style={styles.playerStats}>
                      <View style={styles.statInput}>
                        <Text style={styles.statLabel}>Goals</Text>
                        <TextInput
                          style={styles.smallInput}
                          value={String(playerStats[player.id]?.goals || 0)}
                          onChangeText={(text) => updatePlayerStat(player.id, 'goals', parseInt(text) || 0)}
                          keyboardType="number-pad"
                        />
                      </View>
                      <View style={styles.statInput}>
                        <Text style={styles.statLabel}>Assists</Text>
                        <TextInput
                          style={styles.smallInput}
                          value={String(playerStats[player.id]?.assists || 0)}
                          onChangeText={(text) => updatePlayerStat(player.id, 'assists', parseInt(text) || 0)}
                          keyboardType="number-pad"
                        />
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={onClose}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSave}
                disabled={saveResultMutation.isPending || totalPlayerGoals > teamGoals}
              >
                <Text style={styles.saveButtonText}>
                  {saveResultMutation.isPending ? 'Saving...' : 'Save Result'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  matchInfo: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  matchName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  opponent: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  venue: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    marginBottom: 8,
  },
  scoreRow: {
    flexDirection: 'row',
    gap: 12,
  },
  scoreInput: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  playerName: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  playerStats: {
    flexDirection: 'row',
    gap: 12,
  },
  statInput: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  smallInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    width: 50,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#10B981',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
