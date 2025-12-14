/**
 * Coach Readiness Command - Mobile
 * Game-day optimization and readiness forecasting
 */

import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';

export default function ReadinessScreen() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedGame, setSelectedGame] = useState('next');

  const handleRefresh = () => {
    setIsRefreshing(true);
    // TODO: Fetch readiness data
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const upcomingGames = [
    { id: 'next', opponent: 'State University', date: 'Dec 15', time: '7:00 PM', importance: 'Championship' },
    { id: 'game2', opponent: 'City College', date: 'Dec 18', time: '6:30 PM', importance: 'Regular' },
  ];

  const startingLineup = [
    { name: 'Sarah Johnson', position: 'PG', readiness: 95, risk: 'LOW' },
    { name: 'Jordan Smith', position: 'SG', readiness: 94, risk: 'LOW' },
    { name: 'Taylor Brown', position: 'SF', readiness: 89, risk: 'LOW' },
    { name: 'Chris Lee', position: 'PF', readiness: 82, risk: 'MODERATE' },
    { name: 'Jamie Davis', position: 'C', readiness: 78, risk: 'MODERATE' },
  ];

  const recoveryNeeds = [
    { name: 'Mike Chen', readiness: 63, daysLow: 7, daysSinceRest: 12, priority: 'CRITICAL' },
    { name: 'Alex Martinez', readiness: 69, daysLow: 4, daysSinceRest: 8, priority: 'MODERATE' },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#334155']}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={['#3b82f6', '#2563eb', '#1e40af']}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Readiness Command</Text>
            <Text style={styles.headerSubtitle}>Game-day optimization</Text>
          </View>
        </LinearGradient>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#3b82f6" />
        }
      >
        {/* Today's Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <LinearGradient colors={['rgba(59, 130, 246, 0.2)', 'rgba(37, 99, 235, 0.1)']} style={styles.statGradient}>
              <Text style={styles.statValue}>82.4</Text>
              <Text style={styles.statLabel}>Team Avg</Text>
              <Text style={styles.statChange}>-1.2</Text>
            </LinearGradient>
          </View>

          <View style={styles.statCard}>
            <LinearGradient colors={['rgba(16, 185, 129, 0.2)', 'rgba(5, 150, 105, 0.1)']} style={styles.statGradient}>
              <Text style={styles.statValue}>3</Text>
              <Text style={styles.statLabel}>Optimal (90+)</Text>
            </LinearGradient>
          </View>

          <View style={styles.statCard}>
            <LinearGradient colors={['rgba(245, 158, 11, 0.2)', 'rgba(217, 119, 6, 0.1)']} style={styles.statGradient}>
              <Text style={styles.statValue}>2</Text>
              <Text style={styles.statLabel}>Low (<70)</Text>
            </LinearGradient>
          </View>

          <View style={styles.statCard}>
            <LinearGradient colors={['rgba(239, 68, 68, 0.2)', 'rgba(220, 38, 38, 0.1)']} style={styles.statGradient}>
              <Text style={styles.statValue}>1</Text>
              <Text style={styles.statLabel}>Critical</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Game Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Games</Text>
          {upcomingGames.map((game) => (
            <TouchableOpacity
              key={game.id}
              style={[styles.gameCard, selectedGame === game.id && styles.gameCardActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedGame(game.id);
              }}
            >
              <LinearGradient
                colors={selectedGame === game.id ? ['#3b82f6', '#2563eb'] : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                style={styles.gameGradient}
              >
                <View style={styles.gameHeader}>
                  <Text style={styles.gameOpponent}>{game.opponent}</Text>
                  {game.importance === 'Championship' && (
                    <Text style={styles.gameImportance}>🏆 Championship</Text>
                  )}
                </View>
                <Text style={styles.gameDate}>{game.date} • {game.time}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recommended Starting Lineup */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommended Starting Lineup</Text>
          <View style={styles.lineupStats}>
            <Text style={styles.lineupStat}>Avg Readiness: 87.6</Text>
            <Text style={styles.lineupStat}>Injury Risk: Low</Text>
          </View>

          {startingLineup.map((player, idx) => (
            <View key={idx} style={styles.playerCard}>
              <LinearGradient colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']} style={styles.playerGradient}>
                <View style={styles.playerInfo}>
                  <View style={styles.playerPosition}>
                    <Text style={styles.positionBadge}>{idx + 1}</Text>
                  </View>
                  <View style={styles.playerDetails}>
                    <Text style={styles.playerName}>{player.name}</Text>
                    <Text style={styles.playerPos}>{player.position}</Text>
                  </View>
                </View>
                <View style={styles.playerStats}>
                  <Text style={styles.readinessScore}>{player.readiness}</Text>
                  <Text
                    style={[
                      styles.riskBadge,
                      player.risk === 'LOW' ? styles.riskLow : styles.riskModerate,
                    ]}
                  >
                    {player.risk}
                  </Text>
                </View>
              </LinearGradient>
            </View>
          ))}
        </View>

        {/* Athletes Needing Recovery */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recovery Attention Needed</Text>
          {recoveryNeeds.map((athlete, idx) => (
            <View key={idx} style={styles.recoveryCard}>
              <LinearGradient
                colors={athlete.priority === 'CRITICAL' ? ['rgba(239, 68, 68, 0.2)', 'rgba(220, 38, 38, 0.1)'] : ['rgba(245, 158, 11, 0.2)', 'rgba(217, 119, 6, 0.1)']}
                style={styles.recoveryGradient}
              >
                <View style={styles.recoveryHeader}>
                  <View>
                    <Text style={styles.recoveryName}>{athlete.name}</Text>
                    <Text style={styles.recoveryPriority}>{athlete.priority} PRIORITY</Text>
                  </View>
                  <Text style={styles.recoveryReadiness}>{athlete.readiness}</Text>
                </View>
                <View style={styles.recoveryMetrics}>
                  <View style={styles.recoveryMetric}>
                    <Text style={styles.metricValue}>{athlete.daysLow}</Text>
                    <Text style={styles.metricLabel}>Days Low</Text>
                  </View>
                  <View style={styles.recoveryMetric}>
                    <Text style={styles.metricValue}>{athlete.daysSinceRest}</Text>
                    <Text style={styles.metricLabel}>Days Since Rest</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.actionButton}>
                  <Text style={styles.actionText}>Schedule Rest Day</Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          ))}
        </View>

        {/* 7-Day Forecast */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7-Day Team Forecast</Text>
          <View style={styles.forecastCard}>
            <LinearGradient colors={['rgba(59, 130, 246, 0.2)', 'rgba(37, 99, 235, 0.1)']} style={styles.forecastGradient}>
              <View style={styles.forecastHeader}>
                <Text style={styles.forecastTitle}>Predicted Avg Readiness</Text>
                <Text style={styles.forecastValue}>81.5</Text>
              </View>
              <View style={styles.forecastMetrics}>
                <View style={styles.forecastMetric}>
                  <Text style={styles.forecastLabel}>Confidence</Text>
                  <Text style={styles.forecastStat}>87%</Text>
                </View>
                <View style={styles.forecastMetric}>
                  <Text style={styles.forecastLabel}>Peak Days</Text>
                  <Text style={styles.forecastStat}>3</Text>
                </View>
                <View style={styles.forecastMetric}>
                  <Text style={styles.forecastLabel}>Recovery Needed</Text>
                  <Text style={styles.forecastStat}>2</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 60,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  headerGradient: { paddingBottom: Spacing.lg },
  headerContent: { paddingHorizontal: Spacing.lg },
  headerTitle: { fontSize: Typography.xl, fontWeight: '800', color: '#fff' },
  headerSubtitle: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.9)', fontWeight: '500' },
  scrollView: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: 100 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.xl },
  statCard: { width: '48%', borderRadius: BorderRadius.lg, overflow: 'hidden' },
  statGradient: { padding: Spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: BorderRadius.lg },
  statValue: { fontSize: 32, fontWeight: '900', color: '#fff' },
  statLabel: { fontSize: Typography.xs, color: 'rgba(255,255,255,0.7)', marginTop: Spacing.xs },
  statChange: { fontSize: Typography.xs, color: '#ef4444', marginTop: Spacing.xs, fontWeight: '600' },
  section: { marginBottom: Spacing.xl },
  sectionTitle: { fontSize: Typography.lg, fontWeight: '800', color: '#fff', marginBottom: Spacing.md },
  gameCard: { borderRadius: BorderRadius.md, overflow: 'hidden', marginBottom: Spacing.sm },
  gameCardActive: { borderWidth: 2, borderColor: '#60a5fa' },
  gameGradient: { padding: Spacing.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: BorderRadius.md },
  gameHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
  gameOpponent: { fontSize: Typography.base, fontWeight: '700', color: '#fff' },
  gameImportance: { fontSize: Typography.xs, color: '#fbbf24', fontWeight: '600' },
  gameDate: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.7)' },
  lineupStats: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: Spacing.md, padding: Spacing.md, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: BorderRadius.md },
  lineupStat: { fontSize: Typography.sm, color: '#fff', fontWeight: '600' },
  playerCard: { borderRadius: BorderRadius.md, overflow: 'hidden', marginBottom: Spacing.sm },
  playerGradient: { padding: Spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: BorderRadius.md },
  playerInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  playerPosition: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  positionBadge: { fontSize: Typography.sm, fontWeight: '800', color: '#fff' },
  playerDetails: { flex: 1 },
  playerName: { fontSize: Typography.base, fontWeight: '700', color: '#fff' },
  playerPos: { fontSize: Typography.xs, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  playerStats: { alignItems: 'flex-end' },
  readinessScore: { fontSize: 24, fontWeight: '900', color: '#fff' },
  riskBadge: { fontSize: Typography.xs, fontWeight: '600', paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: 4, marginTop: Spacing.xs },
  riskLow: { backgroundColor: 'rgba(16, 185, 129, 0.3)', color: '#10b981' },
  riskModerate: { backgroundColor: 'rgba(245, 158, 11, 0.3)', color: '#f59e0b' },
  recoveryCard: { borderRadius: BorderRadius.md, overflow: 'hidden', marginBottom: Spacing.md },
  recoveryGradient: { padding: Spacing.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: BorderRadius.md },
  recoveryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  recoveryName: { fontSize: Typography.base, fontWeight: '700', color: '#fff' },
  recoveryPriority: { fontSize: Typography.xs, color: '#ef4444', fontWeight: '600', marginTop: 2 },
  recoveryReadiness: { fontSize: 28, fontWeight: '900', color: '#ef4444' },
  recoveryMetrics: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: Spacing.md },
  recoveryMetric: { alignItems: 'center' },
  metricValue: { fontSize: 20, fontWeight: '800', color: '#fff' },
  metricLabel: { fontSize: Typography.xs, color: 'rgba(255,255,255,0.6)', marginTop: Spacing.xs },
  actionButton: { backgroundColor: '#3b82f6', padding: Spacing.sm, borderRadius: BorderRadius.md, alignItems: 'center' },
  actionText: { fontSize: Typography.sm, fontWeight: '700', color: '#fff' },
  forecastCard: { borderRadius: BorderRadius.lg, overflow: 'hidden' },
  forecastGradient: { padding: Spacing.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: BorderRadius.lg },
  forecastHeader: { alignItems: 'center', marginBottom: Spacing.lg },
  forecastTitle: { fontSize: Typography.base, color: 'rgba(255,255,255,0.8)', marginBottom: Spacing.sm },
  forecastValue: { fontSize: 48, fontWeight: '900', color: '#fff' },
  forecastMetrics: { flexDirection: 'row', justifyContent: 'space-around' },
  forecastMetric: { alignItems: 'center' },
  forecastLabel: { fontSize: Typography.xs, color: 'rgba(255,255,255,0.6)', marginBottom: Spacing.xs },
  forecastStat: { fontSize: 20, fontWeight: '800', color: '#fff' },
  bottomPadding: { height: 40 },
});
