/**
 * Coach Readiness Command - Mobile (Enhanced)
 * Game-day optimization and readiness forecasting with 4 sub-views
 */

import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';

type TabView = 'overview' | 'at-risk' | 'roster' | 'recovery';

export default function ReadinessScreen() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedGame, setSelectedGame] = useState('next');
  const [activeTab, setActiveTab] = useState<TabView>('overview');

  const handleRefresh = () => {
    setIsRefreshing(true);
    // TODO: Fetch readiness data
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleTabChange = (tab: TabView) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
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

  const atRiskAthletes = [
    {
      id: '1',
      name: 'Mike Chen',
      position: 'SF',
      readiness: 63,
      daysLow: 7,
      daysSinceRest: 12,
      priority: 'CRITICAL',
      topFactors: ['Low sleep', 'High stress', 'Declining mood'],
      trend: 'declining',
    },
    {
      id: '2',
      name: 'Alex Martinez',
      position: 'PG',
      readiness: 69,
      daysLow: 4,
      daysSinceRest: 8,
      priority: 'MODERATE',
      topFactors: ['Fatigue', 'Low confidence', 'Academic stress'],
      trend: 'stable',
    },
  ];

  const fullRoster = [
    { id: '1', name: 'Sarah Johnson', position: 'PG', readiness: 95, level: 'GREEN', trend: 'improving' },
    { id: '2', name: 'Jordan Smith', position: 'SG', readiness: 94, level: 'GREEN', trend: 'stable' },
    { id: '3', name: 'Taylor Brown', position: 'SF', readiness: 89, level: 'GREEN', trend: 'stable' },
    { id: '4', name: 'Chris Lee', position: 'PF', readiness: 82, level: 'YELLOW', trend: 'improving' },
    { id: '5', name: 'Jamie Davis', position: 'C', readiness: 78, level: 'YELLOW', trend: 'stable' },
    { id: '6', name: 'Alex Martinez', position: 'PG', readiness: 69, level: 'YELLOW', trend: 'declining' },
    { id: '7', name: 'Mike Chen', position: 'SF', readiness: 63, level: 'RED', trend: 'declining' },
    { id: '8', name: 'Sam Williams', position: 'SG', readiness: 85, level: 'GREEN', trend: 'improving' },
  ];

  const recoveryPlan = [
    { day: 'Monday', focus: 'Light practice + Mental skills workshop', athletes: ['Mike Chen', 'Alex Martinez'] },
    { day: 'Tuesday', focus: 'Full team practice', athletes: [] },
    { day: 'Wednesday', focus: 'Rest day for at-risk athletes', athletes: ['Mike Chen'] },
    { day: 'Thursday', focus: 'Game prep + visualization', athletes: [] },
    { day: 'Friday', focus: 'Championship Game', athletes: [] },
  ];

  const tabs = [
    { id: 'overview' as TabView, label: 'Overview', icon: 'speedometer' },
    { id: 'at-risk' as TabView, label: 'At-Risk', icon: 'warning' },
    { id: 'roster' as TabView, label: 'Roster', icon: 'people' },
    { id: 'recovery' as TabView, label: 'Recovery', icon: 'calendar' },
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

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScroll}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => handleTabChange(tab.id)}
            >
              <LinearGradient
                colors={activeTab === tab.id ? ['#3b82f6', '#2563eb'] : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
                style={styles.tabGradient}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={18}
                  color={activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.6)'}
                />
                <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content Views */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#3b82f6" />
        }
      >
        {activeTab === 'overview' && (
          <OverviewView
            upcomingGames={upcomingGames}
            selectedGame={selectedGame}
            setSelectedGame={setSelectedGame}
            startingLineup={startingLineup}
          />
        )}

        {activeTab === 'at-risk' && (
          <AtRiskView athletes={atRiskAthletes} />
        )}

        {activeTab === 'roster' && (
          <RosterView roster={fullRoster} />
        )}

        {activeTab === 'recovery' && (
          <RecoveryView plan={recoveryPlan} />
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

// SUB-VIEW 1: Overview
function OverviewView({ upcomingGames, selectedGame, setSelectedGame, startingLineup }: any) {
  return (
    <>
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
            <Text style={styles.statLabel}>{"Low (<70)"}</Text>
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
        {upcomingGames.map((game: any) => (
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

        {startingLineup.map((player: any, idx: number) => (
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
    </>
  );
}

// SUB-VIEW 2: At-Risk Athletes
function AtRiskView({ athletes }: { athletes: any[] }) {
  return (
    <View style={styles.section}>
      <View style={styles.alertBanner}>
        <LinearGradient colors={['rgba(239, 68, 68, 0.3)', 'rgba(220, 38, 38, 0.2)']} style={styles.alertGradient}>
          <Ionicons name="warning" size={28} color="#ef4444" />
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>{athletes.length} Athletes Need Attention</Text>
            <Text style={styles.alertText}>Immediate intervention recommended before game day</Text>
          </View>
        </LinearGradient>
      </View>

      {athletes.map((athlete) => (
        <View key={athlete.id} style={styles.atRiskCard}>
          <LinearGradient
            colors={athlete.priority === 'CRITICAL' ? ['rgba(239, 68, 68, 0.2)', 'rgba(220, 38, 38, 0.1)'] : ['rgba(245, 158, 11, 0.2)', 'rgba(217, 119, 6, 0.1)']}
            style={styles.atRiskGradient}
          >
            <View style={styles.atRiskHeader}>
              <View style={styles.atRiskInfo}>
                <Text style={styles.atRiskName}>{athlete.name}</Text>
                <Text style={styles.atRiskPosition}>{athlete.position}</Text>
                <View style={styles.priorityBadge}>
                  <Text style={[styles.priorityText, athlete.priority === 'CRITICAL' && styles.priorityCritical]}>
                    {athlete.priority} PRIORITY
                  </Text>
                </View>
              </View>
              <View style={styles.atRiskScore}>
                <Text style={styles.atRiskReadiness}>{athlete.readiness}</Text>
                <View style={styles.trendBadge}>
                  <Ionicons
                    name={athlete.trend === 'declining' ? 'trending-down' : 'remove'}
                    size={14}
                    color={athlete.trend === 'declining' ? '#ef4444' : '#6b7280'}
                  />
                  <Text style={[styles.trendText, athlete.trend === 'declining' && styles.trendDeclining]}>
                    {athlete.trend}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.factorsContainer}>
              <Text style={styles.factorsLabel}>Top Factors:</Text>
              {athlete.topFactors.map((factor: string, idx: number) => (
                <View key={idx} style={styles.factorChip}>
                  <Text style={styles.factorText}>• {factor}</Text>
                </View>
              ))}
            </View>

            <View style={styles.metricsRow}>
              <View style={styles.metricBox}>
                <Text style={styles.metricValue}>{athlete.daysLow}</Text>
                <Text style={styles.metricLabel}>Days Low</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricValue}>{athlete.daysSinceRest}</Text>
                <Text style={styles.metricLabel}>Days Since Rest</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.actionButton}>
              <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.actionGradient}>
                <Ionicons name="calendar" size={16} color="#fff" />
                <Text style={styles.actionText}>Schedule 1-on-1 Meeting</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      ))}

      <View style={styles.recommendationBox}>
        <LinearGradient colors={['rgba(59, 130, 246, 0.1)', 'rgba(37, 99, 235, 0.05)']} style={styles.recommendationGradient}>
          <Ionicons name="bulb" size={20} color="#3b82f6" />
          <Text style={styles.recommendationText}>
            <Text style={styles.recommendationBold}>Recommended Action:</Text> Schedule 1-on-1 conversations before game day. Focus on stress management and sleep optimization.
          </Text>
        </LinearGradient>
      </View>
    </View>
  );
}

// SUB-VIEW 3: Full Roster Breakdown
function RosterView({ roster }: { roster: any[] }) {
  const greenCount = roster.filter(a => a.level === 'GREEN').length;
  const yellowCount = roster.filter(a => a.level === 'YELLOW').length;
  const redCount = roster.filter(a => a.level === 'RED').length;

  return (
    <View style={styles.section}>
      <View style={styles.rosterStats}>
        <View style={styles.rosterStatCard}>
          <LinearGradient colors={['rgba(16, 185, 129, 0.2)', 'rgba(5, 150, 105, 0.1)']} style={styles.rosterStatGradient}>
            <Text style={styles.rosterStatValue}>{greenCount}</Text>
            <Text style={styles.rosterStatLabel}>Ready</Text>
            <Text style={styles.rosterStatPercent}>{Math.round((greenCount / roster.length) * 100)}%</Text>
          </LinearGradient>
        </View>
        <View style={styles.rosterStatCard}>
          <LinearGradient colors={['rgba(245, 158, 11, 0.2)', 'rgba(217, 119, 6, 0.1)']} style={styles.rosterStatGradient}>
            <Text style={styles.rosterStatValue}>{yellowCount}</Text>
            <Text style={styles.rosterStatLabel}>Monitor</Text>
            <Text style={styles.rosterStatPercent}>{Math.round((yellowCount / roster.length) * 100)}%</Text>
          </LinearGradient>
        </View>
        <View style={styles.rosterStatCard}>
          <LinearGradient colors={['rgba(239, 68, 68, 0.2)', 'rgba(220, 38, 38, 0.1)']} style={styles.rosterStatGradient}>
            <Text style={styles.rosterStatValue}>{redCount}</Text>
            <Text style={styles.rosterStatLabel}>At-Risk</Text>
            <Text style={styles.rosterStatPercent}>{Math.round((redCount / roster.length) * 100)}%</Text>
          </LinearGradient>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Full Team Roster</Text>
      {roster.map((athlete) => (
        <View key={athlete.id} style={styles.rosterCard}>
          <LinearGradient colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']} style={styles.rosterGradient}>
            <View style={styles.rosterRow}>
              <View style={styles.rosterLeft}>
                <View style={[
                  styles.levelIndicator,
                  athlete.level === 'GREEN' && styles.levelGreen,
                  athlete.level === 'YELLOW' && styles.levelYellow,
                  athlete.level === 'RED' && styles.levelRed,
                ]} />
                <View style={styles.rosterInfo}>
                  <Text style={styles.rosterName}>{athlete.name}</Text>
                  <Text style={styles.rosterPosition}>{athlete.position}</Text>
                </View>
              </View>
              <View style={styles.rosterRight}>
                <Text style={styles.rosterReadiness}>{athlete.readiness}</Text>
                <View style={styles.rosterTrend}>
                  <Ionicons
                    name={
                      athlete.trend === 'improving' ? 'trending-up' :
                      athlete.trend === 'declining' ? 'trending-down' : 'remove'
                    }
                    size={12}
                    color={
                      athlete.trend === 'improving' ? '#10b981' :
                      athlete.trend === 'declining' ? '#ef4444' : '#6b7280'
                    }
                  />
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>
      ))}
    </View>
  );
}

// SUB-VIEW 4: Recovery Plan
function RecoveryView({ plan }: { plan: any[] }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>5-Day Recovery Schedule</Text>
      <Text style={styles.sectionSubtitle}>Optimized plan to maximize readiness for game day</Text>

      {plan.map((day, idx) => (
        <View key={idx} style={styles.dayCard}>
          <LinearGradient colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']} style={styles.dayGradient}>
            <View style={styles.dayHeader}>
              <View style={styles.dayBadge}>
                <Text style={styles.dayBadgeText}>{day.day}</Text>
              </View>
              {day.day === 'Friday' && (
                <View style={styles.gameDayBadge}>
                  <Ionicons name="trophy" size={12} color="#fbbf24" />
                  <Text style={styles.gameDayText}>GAME DAY</Text>
                </View>
              )}
            </View>
            <Text style={styles.dayFocus}>{day.focus}</Text>
            {day.athletes.length > 0 && (
              <View style={styles.athletesContainer}>
                <Text style={styles.athletesLabel}>Special attention:</Text>
                {day.athletes.map((athlete: string, i: number) => (
                  <Text key={i} style={styles.athleteName}>• {athlete}</Text>
                ))}
              </View>
            )}
          </LinearGradient>
        </View>
      ))}

      <View style={styles.tipsBox}>
        <LinearGradient colors={['rgba(139, 92, 246, 0.2)', 'rgba(124, 58, 237, 0.1)']} style={styles.tipsGradient}>
          <Ionicons name="information-circle" size={20} color="#8b5cf6" />
          <View style={styles.tipsContent}>
            <Text style={styles.tipsTitle}>Recovery Best Practices</Text>
            <Text style={styles.tipText}>• Rest days improve mental readiness by 12-18%</Text>
            <Text style={styles.tipText}>• Light practice maintains rhythm without fatigue</Text>
            <Text style={styles.tipText}>• Mental skills workshops build confidence pre-game</Text>
          </View>
        </LinearGradient>
      </View>
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

  // Tab Navigation
  tabContainer: { backgroundColor: 'rgba(15, 23, 42, 0.5)', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  tabScroll: { paddingHorizontal: Spacing.md, gap: Spacing.sm, paddingVertical: Spacing.sm },
  tab: { borderRadius: BorderRadius.md, overflow: 'hidden' },
  tabActive: { shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.5, shadowRadius: 4, elevation: 4 },
  tabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.md,
  },
  tabText: { fontSize: Typography.sm, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
  tabTextActive: { color: '#fff', fontWeight: '800' },

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
  sectionSubtitle: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.6)', marginBottom: Spacing.lg, lineHeight: 20 },
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
  forecastCard: { borderRadius: BorderRadius.lg, overflow: 'hidden' },
  forecastGradient: { padding: Spacing.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: BorderRadius.lg },
  forecastHeader: { alignItems: 'center', marginBottom: Spacing.lg },
  forecastTitle: { fontSize: Typography.base, color: 'rgba(255,255,255,0.8)', marginBottom: Spacing.sm },
  forecastValue: { fontSize: 48, fontWeight: '900', color: '#fff' },
  forecastMetrics: { flexDirection: 'row', justifyContent: 'space-around' },
  forecastMetric: { alignItems: 'center' },
  forecastLabel: { fontSize: Typography.xs, color: 'rgba(255,255,255,0.6)', marginBottom: Spacing.xs },
  forecastStat: { fontSize: 20, fontWeight: '800', color: '#fff' },

  // At-Risk View
  alertBanner: { borderRadius: BorderRadius.lg, overflow: 'hidden', marginBottom: Spacing.lg },
  alertGradient: { padding: Spacing.lg, flexDirection: 'row', gap: Spacing.md, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)', borderRadius: BorderRadius.lg },
  alertContent: { flex: 1 },
  alertTitle: { fontSize: Typography.base, fontWeight: '800', color: '#ef4444', marginBottom: Spacing.xs },
  alertText: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.8)' },
  atRiskCard: { borderRadius: BorderRadius.lg, overflow: 'hidden', marginBottom: Spacing.lg },
  atRiskGradient: { padding: Spacing.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: BorderRadius.lg },
  atRiskHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md },
  atRiskInfo: { flex: 1 },
  atRiskName: { fontSize: Typography.lg, fontWeight: '800', color: '#fff' },
  atRiskPosition: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  priorityBadge: { marginTop: Spacing.sm },
  priorityText: { fontSize: Typography.xs, fontWeight: '700', color: '#f59e0b' },
  priorityCritical: { color: '#ef4444' },
  atRiskScore: { alignItems: 'flex-end' },
  atRiskReadiness: { fontSize: 36, fontWeight: '900', color: '#ef4444' },
  trendBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing.xs },
  trendText: { fontSize: Typography.xs, fontWeight: '600', color: '#6b7280' },
  trendDeclining: { color: '#ef4444' },
  factorsContainer: { marginBottom: Spacing.md },
  factorsLabel: { fontSize: Typography.sm, fontWeight: '700', color: 'rgba(255,255,255,0.8)', marginBottom: Spacing.xs },
  factorChip: { marginBottom: 4 },
  factorText: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.7)' },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: Spacing.md, paddingVertical: Spacing.md, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: BorderRadius.md },
  metricBox: { alignItems: 'center' },
  metricValue: { fontSize: 24, fontWeight: '800', color: '#fff' },
  metricLabel: { fontSize: Typography.xs, color: 'rgba(255,255,255,0.6)', marginTop: Spacing.xs },
  actionButton: { borderRadius: BorderRadius.md, overflow: 'hidden' },
  actionGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: Spacing.md },
  actionText: { fontSize: Typography.sm, fontWeight: '700', color: '#fff' },
  recommendationBox: { borderRadius: BorderRadius.lg, overflow: 'hidden', marginTop: Spacing.lg },
  recommendationGradient: { padding: Spacing.lg, flexDirection: 'row', gap: Spacing.md, borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.3)', borderRadius: BorderRadius.lg },
  recommendationText: { flex: 1, fontSize: Typography.sm, color: 'rgba(255,255,255,0.8)', lineHeight: 20 },
  recommendationBold: { fontWeight: '700', color: '#fff' },

  // Roster View
  rosterStats: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  rosterStatCard: { flex: 1, borderRadius: BorderRadius.md, overflow: 'hidden' },
  rosterStatGradient: { padding: Spacing.md, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: BorderRadius.md },
  rosterStatValue: { fontSize: 28, fontWeight: '900', color: '#fff' },
  rosterStatLabel: { fontSize: Typography.xs, color: 'rgba(255,255,255,0.7)', marginTop: Spacing.xs },
  rosterStatPercent: { fontSize: Typography.sm, fontWeight: '600', color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  rosterCard: { borderRadius: BorderRadius.md, overflow: 'hidden', marginBottom: Spacing.sm },
  rosterGradient: { padding: Spacing.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: BorderRadius.md },
  rosterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rosterLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1 },
  levelIndicator: { width: 4, height: 40, borderRadius: 2 },
  levelGreen: { backgroundColor: '#10b981' },
  levelYellow: { backgroundColor: '#f59e0b' },
  levelRed: { backgroundColor: '#ef4444' },
  rosterInfo: { flex: 1 },
  rosterName: { fontSize: Typography.base, fontWeight: '700', color: '#fff' },
  rosterPosition: { fontSize: Typography.xs, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  rosterRight: { alignItems: 'flex-end' },
  rosterReadiness: { fontSize: 24, fontWeight: '900', color: '#fff' },
  rosterTrend: { marginTop: Spacing.xs },

  // Recovery View
  dayCard: { borderRadius: BorderRadius.lg, overflow: 'hidden', marginBottom: Spacing.md },
  dayGradient: { padding: Spacing.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: BorderRadius.lg },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  dayBadge: { backgroundColor: '#3b82f6', paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.md },
  dayBadgeText: { fontSize: Typography.sm, fontWeight: '800', color: '#fff' },
  gameDayBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(251, 191, 36, 0.2)', paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.sm },
  gameDayText: { fontSize: Typography.xs, fontWeight: '700', color: '#fbbf24' },
  dayFocus: { fontSize: Typography.base, fontWeight: '600', color: '#fff', marginBottom: Spacing.sm },
  athletesContainer: { marginTop: Spacing.md, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  athletesLabel: { fontSize: Typography.sm, fontWeight: '700', color: 'rgba(255,255,255,0.8)', marginBottom: Spacing.xs },
  athleteName: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  tipsBox: { borderRadius: BorderRadius.lg, overflow: 'hidden', marginTop: Spacing.lg },
  tipsGradient: { padding: Spacing.lg, flexDirection: 'row', gap: Spacing.md, borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.3)', borderRadius: BorderRadius.lg },
  tipsContent: { flex: 1 },
  tipsTitle: { fontSize: Typography.base, fontWeight: '800', color: '#8b5cf6', marginBottom: Spacing.sm },
  tipText: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.8)', marginTop: 4 },

  bottomPadding: { height: 40 },
});
