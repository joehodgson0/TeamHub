import { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { isUnplayedMatchOutcome } from '@shared/event-outcome';

type OutcomeStatus = 'scheduled' | 'cancelled' | 'forfeit';
type ForfeitedSide = 'team' | 'opponent';

interface MatchOutcomeModalProps {
  visible: boolean;
  fixture: any;
  saving: boolean;
  onClose: () => void;
  onSave: (status: OutcomeStatus, forfeitedSide: ForfeitedSide) => void;
}

export function MatchOutcomeModal({
  visible,
  fixture,
  saving,
  onClose,
  onSave,
}: MatchOutcomeModalProps) {
  const [status, setStatus] = useState<OutcomeStatus>('scheduled');
  const [forfeitedSide, setForfeitedSide] = useState<ForfeitedSide>('team');

  useEffect(() => {
    if (!visible || !fixture) return;
    setStatus(isUnplayedMatchOutcome(fixture.result) ? fixture.result.status : 'scheduled');
    setForfeitedSide(
      isUnplayedMatchOutcome(fixture.result) && fixture.result.status === 'forfeit'
        ? fixture.result.forfeitedSide
        : 'team',
    );
  }, [fixture, visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          <Text style={styles.title}>Match outcome</Text>
          <Text style={styles.description}>
            {fixture?.name || `Match${fixture?.opponent ? ` vs ${fixture.opponent}` : ''}`}
          </Text>

          <View style={styles.optionGroup}>
            {([
              ['scheduled', 'Scheduled'],
              ['cancelled', 'Cancelled'],
              ['forfeit', 'Forfeited'],
            ] as const).map(([value, label]) => (
              <TouchableOpacity
                key={value}
                accessibilityRole="radio"
                accessibilityState={{ selected: status === value }}
                style={[styles.option, status === value && styles.optionActive]}
                disabled={saving}
                onPress={() => setStatus(value)}
              >
                <Text style={[styles.optionText, status === value && styles.optionTextActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {status === 'forfeit' && (
            <View style={styles.forfeitGroup}>
              <Text style={styles.forfeitTitle}>Which side forfeited?</Text>
              <View style={styles.optionGroup}>
                {([
                  ['team', 'Our team'],
                  ['opponent', 'Opponent'],
                ] as const).map(([value, label]) => (
                  <TouchableOpacity
                    key={value}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: forfeitedSide === value }}
                    style={[styles.option, forfeitedSide === value && styles.optionActive]}
                    disabled={saving}
                    onPress={() => setForfeitedSide(value)}
                  >
                    <Text style={[styles.optionText, forfeitedSide === value && styles.optionTextActive]}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <Text style={styles.note}>
            Forfeits do not add a score or change team statistics. Cancelled and forfeited fixtures remain in event history.
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} disabled={saving} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              disabled={saving}
              onPress={() => onSave(status, forfeitedSide)}
            >
              <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save outcome'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  dialog: {
    borderRadius: 16,
    padding: 20,
    backgroundColor: '#FFFFFF',
    gap: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
  },
  optionGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  option: {
    flex: 1,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
  },
  optionActive: {
    borderColor: '#007AFF',
    backgroundColor: '#EFF6FF',
  },
  optionText: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  optionTextActive: {
    color: '#005FC7',
  },
  forfeitGroup: {
    gap: 8,
  },
  forfeitTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  note: {
    fontSize: 12,
    lineHeight: 17,
    color: '#6B7280',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelButton: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: '#007AFF',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
