import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useUser } from '@/context/UserContext';
import { API_BASE_URL } from '@/lib/config';
import { apiRequest } from '@/lib/queryClient';
import { useState } from 'react';

interface ChildStatus {
  playerId: string;
  playerName: string;
  upToDate: boolean;
  nextPayment: {
    feeAssignmentId: string;
    feeName: string;
    amount: number;
    dueDate: string;
    isOverdue: boolean;
  } | null;
}

interface TeamPlayerStatus {
  playerId: string;
  playerName: string;
  upToDate: boolean;
  outstandingCount: number;
  overdueCount: number;
}

function formatPounds(pence: number) {
  return `£${(pence / 100).toFixed(2)}`;
}

function ParentFeeStatus({ userId }: { userId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['/api/fees/my-status'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/fees/my-status`, { credentials: 'include' });
      return response.json();
    },
  });

  const statuses: ChildStatus[] = data?.statuses || [];

  const pay = async (feeAssignmentId: string) => {
    const result = await apiRequest('/api/payments/checkout', {
      method: 'POST',
      body: JSON.stringify({ feeAssignmentId }),
    });
    if (result.checkoutUrl) {
      // Web checkout link - open in browser via Linking on a real device build
      console.log('Checkout URL:', result.checkoutUrl);
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>My Children — Fee Status</Text>
      {isLoading ? (
        <Text style={styles.loadingText}>Loading...</Text>
      ) : statuses.length === 0 ? (
        <Text style={styles.emptyText}>No children found.</Text>
      ) : (
        statuses.map((child) => (
          <View key={child.playerId} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{child.playerName}</Text>
              <View style={[styles.badge, child.upToDate ? styles.badgeGreen : styles.badgeRed]}>
                <Text style={styles.badgeText}>{child.upToDate ? 'Up to date' : (child.nextPayment?.isOverdue ? 'Overdue' : 'Due')}</Text>
              </View>
            </View>
            {child.nextPayment && (
              <>
                <Text style={styles.cardDetail}>
                  {child.nextPayment.feeName} • {formatPounds(child.nextPayment.amount)} due{' '}
                  {new Date(child.nextPayment.dueDate).toLocaleDateString()}
                </Text>
                <TouchableOpacity style={styles.payButton} onPress={() => pay(child.nextPayment!.feeAssignmentId)}>
                  <Text style={styles.payButtonText}>Make Payment</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        ))
      )}
    </View>
  );
}

function CoachTeamStatus({ clubId, teamIds }: { clubId?: string; teamIds?: string[] }) {
  const { data: teamsData } = useQuery({
    queryKey: ['/api/teams/club', clubId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/teams/club/${clubId}`, { credentials: 'include' });
      return response.json();
    },
    enabled: Boolean(clubId),
  });

  const myTeams = (teamsData?.teams || []).filter((t: any) => teamIds?.includes(t.id));
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(myTeams[0]?.id ?? null);
  const activeTeamId = selectedTeamId || myTeams[0]?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['/api/fees/team-status', activeTeamId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/fees/team-status/${activeTeamId}`, { credentials: 'include' });
      return response.json();
    },
    enabled: Boolean(activeTeamId),
  });

  const statuses: TeamPlayerStatus[] = data?.statuses || [];

  if (myTeams.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Team Payment Status</Text>
      <View style={styles.teamPicker}>
        {myTeams.map((t: any) => (
          <TouchableOpacity
            key={t.id}
            style={[styles.teamChip, activeTeamId === t.id && styles.teamChipActive]}
            onPress={() => setSelectedTeamId(t.id)}
          >
            <Text style={[styles.teamChipText, activeTeamId === t.id && styles.teamChipTextActive]}>{t.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {isLoading ? (
        <Text style={styles.loadingText}>Loading...</Text>
      ) : (
        statuses.map((s) => (
          <View key={s.playerId} style={styles.rowCard}>
            <Text style={styles.cardDetail}>{s.playerName}</Text>
            <View style={[styles.badge, s.upToDate ? styles.badgeGreen : styles.badgeRed]}>
              <Text style={styles.badgeText}>
                {s.upToDate ? 'Up to date' : s.overdueCount > 0 ? `${s.overdueCount} overdue` : `${s.outstandingCount} due`}
              </Text>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

function AdminScheduleSummary({ clubId }: { clubId?: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['/api/fee-schedules'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/fee-schedules`, { credentials: 'include' });
      return response.json();
    },
    enabled: Boolean(clubId),
  });

  const schedules = data?.schedules || [];

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Season Fee Schedules</Text>
      <Text style={styles.emptyText}>Full setup is available on the web app. Current seasons configured:</Text>
      {isLoading ? (
        <Text style={styles.loadingText}>Loading...</Text>
      ) : schedules.length === 0 ? (
        <Text style={styles.emptyText}>No fee schedules configured yet.</Text>
      ) : (
        schedules.map((s: any) => (
          <View key={s.id} style={styles.rowCard}>
            <Text style={styles.cardDetail}>{s.season}</Text>
            <Text style={styles.cardDetail}>
              Coach {formatPounds(s.coachFee)} • No mid-week {formatPounds(s.noMidweekFee)} • Mid-week {formatPounds(s.midweekFee)}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}

export default function Fees() {
  const { user, isAdmin, isCoach, isParent } = useUser();

  if (!isAdmin) {
    return (
      <View style={styles.comingSoonContainer}>
        <Text style={styles.comingSoonEmoji}>✨</Text>
        <Text style={styles.comingSoonTitle}>Coming soon!</Text>
        <Text style={styles.comingSoonText}>
          Fees and payments are being set up for your club. Check back soon.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Fees & Payments</Text>
        <AdminScheduleSummary clubId={user?.clubId} />
        {isParent && user && <ParentFeeStatus userId={user.id} />}
        {isCoach && <CoachTeamStatus clubId={user?.clubId} teamIds={user?.teamIds} />}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 16 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 8 },
  loadingText: { color: '#6B7280', fontSize: 13 },
  emptyText: { color: '#6B7280', fontSize: 13, marginBottom: 8 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  cardDetail: { fontSize: 12, color: '#4B5563', marginTop: 4 },
  rowCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  badgeGreen: { backgroundColor: '#DCFCE7' },
  badgeRed: { backgroundColor: '#FEE2E2' },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#111827' },
  payButton: { marginTop: 8, backgroundColor: '#2563EB', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  payButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 13 },
  teamPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  teamChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: '#F3F4F6' },
  teamChipActive: { backgroundColor: '#2563EB' },
  teamChipText: { fontSize: 12, color: '#374151' },
  teamChipTextActive: { color: '#FFFFFF' },
  comingSoonContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  comingSoonEmoji: { fontSize: 40, marginBottom: 12 },
  comingSoonTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8 },
  comingSoonText: { fontSize: 14, color: '#6B7280', textAlign: 'center' },
});
