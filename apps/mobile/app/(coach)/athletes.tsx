/**
 * Coach Athletes List
 * Shows all athletes with consent for detailed viewing
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { apiClient } from '../../lib/auth';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';

export default function CoachAthletesScreen() {
  const [athletes, setAthletes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAthletes();
  }, []);

  const loadAthletes = async () => {
    try {
      const data = await apiClient.getCoachAthletes();
      setAthletes(data);
    } catch (error) {
      console.error('Failed to load athletes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'HIGH':
        return '#ef4444';
      case 'MEDIUM':
        return '#f59e0b';
      case 'LOW':
      default:
        return '#10b981';
    }
  };

  const renderAthlete = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.athleteCard}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        // TODO: Navigate to athlete detail screen
      }}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
        style={styles.cardGradient}
      >
        <View style={styles.athleteHeader}>
          <View style={styles.athleteInfo}>
            <Text style={styles.athleteName}>{item.name}</Text>
            <Text style={styles.athleteDetails}>
              {item.sport} • {item.year} • {item.position || 'N/A'}
            </Text>
          </View>
          <View style={[styles.riskBadge, { backgroundColor: getRiskColor(item.riskLevel) }]}>
            <Text style={styles.riskText}>{item.riskLevel}</Text>
          </View>
        </View>

        {item.lastMoodLog && (
          <View style={styles.moodRow}>
            <View style={styles.moodChip}>
              <Ionicons name="happy-outline" size={16} color="#10b981" />
              <Text style={styles.moodText}>{item.lastMoodLog.mood}/10</Text>
            </View>
            <View style={styles.moodChip}>
              <Ionicons name="flash-outline" size={16} color="#f59e0b" />
              <Text style={styles.moodText}>{item.lastMoodLog.stress}/10</Text>
            </View>
            <View style={styles.moodChip}>
              <Ionicons name="trophy-outline" size={16} color="#3b82f6" />
              <Text style={styles.moodText}>{item.lastMoodLog.confidence}/10</Text>
            </View>
          </View>
        )}

        <View style={styles.goalsRow}>
          <Ionicons name="flag-outline" size={16} color="rgba(255,255,255,0.6)" />
          <Text style={styles.goalsText}>{item.activeGoalsCount} active goals</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#0f172a', '#1e293b']}
          style={StyleSheet.absoluteFill}
        />
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.background, Colors.card, Colors.cardElevated]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={['#3b82f6', '#2563eb', '#1e40af']}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>My Athletes</Text>
              <Text style={styles.headerSubtitle}>{athletes.length} athletes with consent</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      <FlatList
        data={athletes}
        renderItem={renderAthlete}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  headerGradient: {
    paddingBottom: Spacing.lg,
  },
  headerContent: {
    paddingHorizontal: Spacing.lg,
  },
  headerTitle: {
    fontSize: Typography.xl,
    fontWeight: '800',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  athleteCard: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  cardGradient: {
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.lg,
  },
  athleteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  athleteInfo: {
    flex: 1,
  },
  athleteName: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: '#fff',
    marginBottom: Spacing.xs,
  },
  athleteDetails: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.7)',
  },
  riskBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  riskText: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: '#fff',
  },
  moodRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  moodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.sm,
  },
  moodText: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  goalsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  goalsText: {
    fontSize: Typography.sm,
    color: 'rgba(255,255,255,0.6)',
  },
});
