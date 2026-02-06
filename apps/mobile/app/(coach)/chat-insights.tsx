/**
 * Chat Insights Screen
 *
 * Aggregated conversation analysis for coaches to understand
 * team-wide psychological patterns without reading individual chats.
 *
 * Features:
 * - Team sentiment overview with trend
 * - Top conversation themes
 * - Athletes needing attention
 * - Disengaged athletes
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';
import {
  getChatInsights,
  formatThemeName,
  getSentimentColor,
  ChatInsightsData,
} from '../../lib/services/chat-insights';

export default function ChatInsightsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<ChatInsightsData | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    }
    try {
      const insights = await getChatInsights();
      setData(insights);
    } catch (error) {
      console.error('Failed to load chat insights:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    loadData(true);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={[Colors.background, Colors.card]} style={StyleSheet.absoluteFill} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Analyzing conversations...</Text>
        </View>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={[Colors.background, Colors.card]} style={StyleSheet.absoluteFill} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#ef4444" />
          <Text style={styles.errorText}>Unable to load insights</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadData()}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const trendIcon =
    data.teamSentiment.trend === 'improving'
      ? 'trending-up'
      : data.teamSentiment.trend === 'declining'
        ? 'trending-down'
        : 'remove';

  const trendColor =
    data.teamSentiment.trend === 'improving'
      ? '#22c55e'
      : data.teamSentiment.trend === 'declining'
        ? '#ef4444'
        : '#6b7280';

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.background, Colors.card, Colors.cardElevated]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <LinearGradient colors={['#6366f1', '#8b5cf6', '#a855f7']} style={styles.headerGradient}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              style={styles.backButton}
            >
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Chat Insights</Text>
              <Text style={styles.headerSubtitle}>Conversation Analysis</Text>
            </View>
            <View style={styles.headerIcon}>
              <Ionicons name="chatbubbles" size={24} color="#fff" />
            </View>
          </View>
        </LinearGradient>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#6366f1" />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Team Sentiment Card */}
        <View style={styles.sentimentCard}>
          <LinearGradient
            colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
            style={styles.cardGradient}
          >
            <View style={styles.sentimentHeader}>
              <Text style={styles.cardLabel}>Team Conversation Sentiment</Text>
              <View
                style={[
                  styles.trendBadge,
                  {
                    backgroundColor:
                      data.teamSentiment.trend === 'improving'
                        ? 'rgba(34, 197, 94, 0.2)'
                        : data.teamSentiment.trend === 'declining'
                          ? 'rgba(239, 68, 68, 0.2)'
                          : 'rgba(107, 114, 128, 0.2)',
                  },
                ]}
              >
                <Ionicons name={trendIcon as any} size={16} color={trendColor} />
                <Text style={[styles.trendText, { color: trendColor }]}>
                  {data.teamSentiment.trend.charAt(0).toUpperCase() +
                    data.teamSentiment.trend.slice(1)}
                </Text>
              </View>
            </View>

            <View style={styles.sentimentValue}>
              <Text
                style={[styles.sentimentNumber, { color: getSentimentColor(data.teamSentiment.current) }]}
              >
                {data.teamSentiment.current > 0 ? '+' : ''}
                {Math.round(data.teamSentiment.current * 100)}
              </Text>
              <Text style={styles.sentimentMax}> / 100</Text>
            </View>

            {/* Mini Sparkline */}
            <View style={styles.sparkline}>
              {data.sentimentHistory.slice(-14).map((day, idx) => {
                const height = ((day.avgSentiment + 1) / 2) * 32;
                const isPositive = day.avgSentiment >= 0;
                return (
                  <View
                    key={idx}
                    style={[
                      styles.sparklineBar,
                      {
                        height: Math.max(4, height),
                        backgroundColor: isPositive
                          ? 'rgba(34, 197, 94, 0.6)'
                          : 'rgba(239, 68, 68, 0.6)',
                      },
                    ]}
                  />
                );
              })}
            </View>
            <View style={styles.sparklineLabels}>
              <Text style={styles.sparklineLabel}>14 days ago</Text>
              <Text style={styles.sparklineLabel}>Today</Text>
            </View>

            {/* Quick Stats */}
            <View style={styles.quickStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{data.stats.totalSessions}</Text>
                <Text style={styles.statLabel}>Sessions</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{data.stats.athletesWithChats}</Text>
                <Text style={styles.statLabel}>Active</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{data.stats.chatEngagementRate}%</Text>
                <Text style={styles.statLabel}>Engaged</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Top Themes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="pricetag" size={20} color="#6366f1" />
            <Text style={styles.sectionTitle}>What Athletes Are Discussing</Text>
          </View>

          <View style={styles.themesCard}>
            {data.topThemes.slice(0, 6).map((theme, idx) => (
              <View key={theme.theme} style={styles.themeRow}>
                <Text style={styles.themeRank}>{idx + 1}.</Text>
                <View style={styles.themeInfo}>
                  <View style={styles.themeNameRow}>
                    <Text style={styles.themeName}>{formatThemeName(theme.theme)}</Text>
                    {theme.trend === 'increasing' && (
                      <Ionicons name="arrow-up" size={12} color="#f59e0b" />
                    )}
                    {theme.trend === 'decreasing' && (
                      <Ionicons name="arrow-down" size={12} color="#22c55e" />
                    )}
                  </View>
                  <Text style={styles.themeMeta}>
                    {theme.count} mentions • {theme.athletes.length} athlete
                    {theme.athletes.length > 1 ? 's' : ''}
                  </Text>
                </View>
                <View style={styles.themeBar}>
                  <View
                    style={[
                      styles.themeBarFill,
                      {
                        width: `${(theme.count / data.topThemes[0].count) * 100}%`,
                        backgroundColor:
                          theme.theme.includes('anxiety') ||
                          theme.theme.includes('stress') ||
                          theme.theme.includes('conflict')
                            ? '#f59e0b'
                            : '#6366f1',
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Concerning Athletes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="warning" size={20} color="#f59e0b" />
            <Text style={styles.sectionTitle}>Athletes Needing Attention</Text>
            {data.concerningAthletes.length > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{data.concerningAthletes.length}</Text>
              </View>
            )}
          </View>

          {data.concerningAthletes.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="checkmark-circle" size={32} color="#22c55e" />
              <Text style={styles.emptyTitle}>No Concerning Patterns</Text>
              <Text style={styles.emptySubtitle}>Team conversations look healthy</Text>
            </View>
          ) : (
            <View style={styles.athletesList}>
              {data.concerningAthletes.map((athlete) => (
                <TouchableOpacity
                  key={athlete.id}
                  style={styles.athleteCard}
                  activeOpacity={0.7}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <View style={styles.athleteInfo}>
                    <Text style={styles.athleteName}>{athlete.name}</Text>
                    {athlete.sport && <Text style={styles.athleteSport}>{athlete.sport}</Text>}
                    <View style={styles.topicTags}>
                      {athlete.concerningTopics.slice(0, 2).map((topic) => (
                        <View key={topic} style={styles.topicTag}>
                          <Text style={styles.topicTagText}>{formatThemeName(topic)}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  <View style={styles.athleteScore}>
                    <Text
                      style={[
                        styles.athleteScoreValue,
                        { color: getSentimentColor(athlete.avgSentiment) },
                      ]}
                    >
                      {athlete.avgSentiment > 0 ? '+' : ''}
                      {Math.round(athlete.avgSentiment * 100)}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color="#6b7280" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Disengaged Athletes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-remove" size={20} color="#6b7280" />
            <Text style={styles.sectionTitle}>Disengaged Athletes</Text>
            {data.disengagedAthletes.length > 0 && (
              <View style={[styles.countBadge, { backgroundColor: 'rgba(107, 114, 128, 0.2)' }]}>
                <Text style={[styles.countBadgeText, { color: '#9ca3af' }]}>
                  {data.disengagedAthletes.length}
                </Text>
              </View>
            )}
          </View>

          {data.disengagedAthletes.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="people" size={32} color="#22c55e" />
              <Text style={styles.emptyTitle}>All Athletes Engaged</Text>
              <Text style={styles.emptySubtitle}>Everyone has chatted within 7 days</Text>
            </View>
          ) : (
            <View style={styles.athletesList}>
              {data.disengagedAthletes.map((athlete) => (
                <TouchableOpacity
                  key={athlete.id}
                  style={styles.disengagedCard}
                  activeOpacity={0.7}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>
                      {athlete.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </Text>
                  </View>
                  <View style={styles.disengagedInfo}>
                    <Text style={styles.disengagedName}>{athlete.name}</Text>
                    {athlete.sport && (
                      <Text style={styles.disengagedSport}>{athlete.sport}</Text>
                    )}
                  </View>
                  <View
                    style={[
                      styles.daysBadge,
                      {
                        backgroundColor:
                          athlete.daysSinceChat >= 14
                            ? 'rgba(239, 68, 68, 0.2)'
                            : athlete.daysSinceChat >= 10
                              ? 'rgba(245, 158, 11, 0.2)'
                              : 'rgba(107, 114, 128, 0.2)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.daysBadgeText,
                        {
                          color:
                            athlete.daysSinceChat >= 14
                              ? '#ef4444'
                              : athlete.daysSinceChat >= 10
                                ? '#f59e0b'
                                : '#9ca3af',
                        },
                      ]}
                    >
                      {athlete.daysSinceChat}d ago
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {data.disengagedAthletes.length > 0 && (
            <Text style={styles.reengageHint}>
              Consider reaching out to re-engage these athletes
            </Text>
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    marginTop: Spacing.md,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  retryButton: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: '#6366f1',
    borderRadius: BorderRadius.lg,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: Typography.base,
  },
  header: {
    paddingTop: 60,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  headerGradient: {
    paddingBottom: Spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
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
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 120,
  },
  sentimentCard: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  cardGradient: {
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.xl,
  },
  sentimentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  cardLabel: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  trendText: {
    fontSize: Typography.xs,
    fontWeight: '600',
  },
  sentimentValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  sentimentNumber: {
    fontSize: 40,
    fontWeight: '900',
  },
  sentimentMax: {
    fontSize: Typography.base,
    color: Colors.textSecondary,
  },
  sparkline: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 32,
    gap: 2,
    marginTop: Spacing.md,
  },
  sparklineBar: {
    flex: 1,
    borderRadius: 2,
  },
  sparklineLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sparklineLabel: {
    fontSize: Typography.xs,
    color: Colors.textTertiary,
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: Typography.lg,
    fontWeight: '800',
    color: '#fff',
  },
  statLabel: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    flex: 1,
    fontSize: Typography.base,
    fontWeight: '700',
    color: '#fff',
  },
  countBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  countBadgeText: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: '#f59e0b',
  },
  themesCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  themeRank: {
    width: 20,
    fontSize: Typography.sm,
    color: Colors.textTertiary,
  },
  themeInfo: {
    flex: 1,
  },
  themeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  themeName: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: '#fff',
  },
  themeMeta: {
    fontSize: Typography.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  themeBar: {
    width: 60,
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  themeBarFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  emptyCard: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  emptyTitle: {
    fontSize: Typography.base,
    fontWeight: '600',
    color: '#22c55e',
    marginTop: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  athletesList: {
    gap: Spacing.sm,
  },
  athleteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  athleteInfo: {
    flex: 1,
  },
  athleteName: {
    fontSize: Typography.base,
    fontWeight: '600',
    color: '#fff',
  },
  athleteSport: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  topicTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: Spacing.xs,
  },
  topicTag: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  topicTagText: {
    fontSize: 10,
    color: '#fbbf24',
  },
  athleteScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  athleteScoreValue: {
    fontSize: Typography.base,
    fontWeight: '700',
  },
  disengagedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: Spacing.md,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(107, 114, 128, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  disengagedInfo: {
    flex: 1,
  },
  disengagedName: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: '#fff',
  },
  disengagedSport: {
    fontSize: Typography.xs,
    color: Colors.textTertiary,
  },
  daysBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  daysBadgeText: {
    fontSize: Typography.xs,
    fontWeight: '600',
  },
  reengageHint: {
    fontSize: Typography.xs,
    color: Colors.textTertiary,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  bottomPadding: {
    height: 40,
  },
});
