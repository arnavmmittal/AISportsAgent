/**
 * Coach AI Insights - Mobile
 * Automated intelligence, predictions, and pattern detection
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

export default function InsightsScreen() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'predictions' | 'patterns'>('summary');

  const handleRefresh = () => {
    setIsRefreshing(true);
    // TODO: Fetch AI insights data
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const weeklyInsights = [
    'Team readiness stabilized at 78 (±2 points) after previous decline',
    'Stress levels elevated - likely due to upcoming finals week',
    'Basketball team showing better cohesion (+12% vs last week)',
    'Sleep quality decreased 8% team-wide (6.2hrs vs 6.8hrs)',
  ];

  const recommendations = [
    { priority: 'HIGH', action: 'Schedule team recovery day Thursday or Friday', rationale: 'Sleep debt accumulating - prevent further readiness decline' },
    { priority: 'HIGH', action: 'Conduct stress management workshops', rationale: 'Stress 15% above baseline - athletes need exam anxiety techniques' },
    { priority: 'MEDIUM', action: 'Check in with Mike Chen and Alex Martinez', rationale: 'Both showing declining readiness for 7+ consecutive days' },
  ];

  const predictions = [
    { type: 'RISK', title: 'Burnout Risk: Mike Chen', confidence: 78, impact: 'HIGH', timeframe: '10 days', description: '7-day declining readiness + elevated stress + sleep debt = 78% burnout probability' },
    { type: 'PERFORMANCE', title: 'Peak Performance: Sarah Johnson', confidence: 92, impact: 'HIGH', timeframe: '5-7 days', description: 'Optimal readiness zone (95) with stable trends - ideal for high-pressure competition' },
    { type: 'TREND', title: 'Team Stress Spike Forecast', confidence: 88, impact: 'HIGH', timeframe: '5 days', description: 'Predicts 20-25% stress increase during finals week with 8-10 point readiness decline' },
  ];

  const patterns = [
    { category: 'ANOMALY', severity: 'CRITICAL', title: 'Unusual Stress Spike: Basketball Team', description: '35% stress increase across basketball team over 3 days', affectedAthletes: 8 },
    { category: 'CORRELATION', severity: 'WARNING', title: 'Sleep < 6hrs → Injury Risk', description: '73% of injuries preceded by 2+ nights of <6hr sleep (2.4x risk)', affectedAthletes: 15 },
    { category: 'TREND', severity: 'INFO', title: 'Meditation Adoption Spreading', description: '18 athletes now meditating without assignment (up from 5)', affectedAthletes: 18 },
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
            <View style={styles.headerTitleContainer}>
              <Ionicons name="bulb" size={28} color="#fff" />
              <View style={styles.headerText}>
                <Text style={styles.headerTitle}>AI Insights</Text>
                <Text style={styles.headerSubtitle}>Automated intelligence</Text>
              </View>
            </View>
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
        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'summary' && styles.tabActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab('summary');
            }}
          >
            <Text style={[styles.tabText, activeTab === 'summary' && styles.tabTextActive]}>
              📊 Summary
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'predictions' && styles.tabActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab('predictions');
            }}
          >
            <Text style={[styles.tabText, activeTab === 'predictions' && styles.tabTextActive]}>
              🔮 Predictions
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'patterns' && styles.tabActive]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab('patterns');
            }}
          >
            <Text style={[styles.tabText, activeTab === 'patterns' && styles.tabTextActive]}>
              🔍 Patterns
            </Text>
          </TouchableOpacity>
        </View>

        {/* Weekly Summary Tab */}
        {activeTab === 'summary' && (
          <View>
            {/* Summary Header */}
            <View style={styles.summaryHeader}>
              <LinearGradient colors={['rgba(59, 130, 246, 0.2)', 'rgba(37, 99, 235, 0.1)']} style={styles.summaryGradient}>
                <Text style={styles.summaryTitle}>Weekly Team Summary</Text>
                <Text style={styles.summaryDate}>Dec 7-13, 2025</Text>
                <View style={styles.trendBadge}>
                  <Text style={styles.trendText}>➡️ STABLE</Text>
                </View>
              </LinearGradient>
            </View>

            {/* Key Insights */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🔍 Key Insights</Text>
              {weeklyInsights.map((insight, idx) => (
                <View key={idx} style={styles.insightCard}>
                  <LinearGradient colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']} style={styles.insightGradient}>
                    <Text style={styles.insightText}>{insight}</Text>
                  </LinearGradient>
                </View>
              ))}
            </View>

            {/* AI Recommendations */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💡 AI Recommendations</Text>
              {recommendations.map((rec, idx) => (
                <View key={idx} style={styles.recCard}>
                  <LinearGradient
                    colors={rec.priority === 'HIGH' ? ['rgba(239, 68, 68, 0.2)', 'rgba(220, 38, 38, 0.1)'] : ['rgba(245, 158, 11, 0.2)', 'rgba(217, 119, 6, 0.1)']}
                    style={styles.recGradient}
                  >
                    <View style={styles.recHeader}>
                      <Text style={styles.recAction}>{rec.action}</Text>
                      <Text style={[styles.priorityBadge, rec.priority === 'HIGH' ? styles.priorityHigh : styles.priorityMedium]}>
                        {rec.priority}
                      </Text>
                    </View>
                    <Text style={styles.recRationale}>{rec.rationale}</Text>
                  </LinearGradient>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Predictions Tab */}
        {activeTab === 'predictions' && (
          <View>
            <View style={styles.statsRow}>
              <View style={styles.statSmall}>
                <Text style={styles.statValue}>6</Text>
                <Text style={styles.statLabel}>Active Predictions</Text>
              </View>
              <View style={styles.statSmall}>
                <Text style={styles.statValue}>85%</Text>
                <Text style={styles.statLabel}>Avg Confidence</Text>
              </View>
              <View style={styles.statSmall}>
                <Text style={styles.statValue}>3</Text>
                <Text style={styles.statLabel}>High Impact</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🔮 ML Predictions</Text>
              {predictions.map((pred, idx) => (
                <View key={idx} style={styles.predCard}>
                  <LinearGradient
                    colors={pred.type === 'RISK' ? ['rgba(239, 68, 68, 0.2)', 'rgba(220, 38, 38, 0.1)'] : pred.type === 'PERFORMANCE' ? ['rgba(16, 185, 129, 0.2)', 'rgba(5, 150, 105, 0.1)'] : ['rgba(59, 130, 246, 0.2)', 'rgba(37, 99, 235, 0.1)']}
                    style={styles.predGradient}
                  >
                    <View style={styles.predHeader}>
                      <Text style={styles.predIcon}>
                        {pred.type === 'RISK' && '⚠️'}
                        {pred.type === 'PERFORMANCE' && '🎯'}
                        {pred.type === 'TREND' && '📈'}
                      </Text>
                      <View style={styles.predInfo}>
                        <Text style={styles.predTitle}>{pred.title}</Text>
                        <View style={styles.predMeta}>
                          <Text style={styles.predMetaText}>{pred.confidence}% confidence</Text>
                          <Text style={styles.predMetaText}>•</Text>
                          <Text style={styles.predMetaText}>{pred.timeframe}</Text>
                          <Text style={styles.predMetaText}>•</Text>
                          <Text style={styles.predMetaText}>{pred.impact} impact</Text>
                        </View>
                      </View>
                    </View>
                    <Text style={styles.predDescription}>{pred.description}</Text>
                  </LinearGradient>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Patterns Tab */}
        {activeTab === 'patterns' && (
          <View>
            <View style={styles.statsRow}>
              <View style={styles.statSmall}>
                <Text style={styles.statValue}>6</Text>
                <Text style={styles.statLabel}>Patterns Detected</Text>
              </View>
              <View style={styles.statSmall}>
                <Text style={styles.statValue}>2</Text>
                <Text style={styles.statLabel}>Critical Alerts</Text>
              </View>
              <View style={styles.statSmall}>
                <Text style={styles.statValue}>90%</Text>
                <Text style={styles.statLabel}>Avg Confidence</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🔍 Detected Patterns</Text>
              {patterns.map((pattern, idx) => (
                <View key={idx} style={styles.patternCard}>
                  <LinearGradient
                    colors={pattern.severity === 'CRITICAL' ? ['rgba(239, 68, 68, 0.2)', 'rgba(220, 38, 38, 0.1)'] : pattern.severity === 'WARNING' ? ['rgba(245, 158, 11, 0.2)', 'rgba(217, 119, 6, 0.1)'] : ['rgba(59, 130, 246, 0.2)', 'rgba(37, 99, 235, 0.1)']}
                    style={styles.patternGradient}
                  >
                    <View style={styles.patternHeader}>
                      <Text style={styles.patternIcon}>
                        {pattern.category === 'ANOMALY' && '🚨'}
                        {pattern.category === 'CORRELATION' && '🔗'}
                        {pattern.category === 'TREND' && '📈'}
                      </Text>
                      <View style={styles.patternInfo}>
                        <Text style={styles.patternTitle}>{pattern.title}</Text>
                        <View style={styles.patternMeta}>
                          <Text style={[styles.severityBadge, pattern.severity === 'CRITICAL' ? styles.severityCritical : pattern.severity === 'WARNING' ? styles.severityWarning : styles.severityInfo]}>
                            {pattern.severity}
                          </Text>
                          <Text style={styles.affectedCount}>{pattern.affectedAthletes} athletes</Text>
                        </View>
                      </View>
                    </View>
                    <Text style={styles.patternDescription}>{pattern.description}</Text>
                  </LinearGradient>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.aiNote}>
          <Text style={styles.aiNoteText}>
            🤖 All insights generated by AI based on aggregated team data and validated psychology frameworks
          </Text>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 60, shadowColor: '#3b82f6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  headerGradient: { paddingBottom: Spacing.lg },
  headerContent: { paddingHorizontal: Spacing.lg },
  headerTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  headerText: { flex: 1 },
  headerTitle: { fontSize: Typography.xl, fontWeight: '800', color: '#fff' },
  headerSubtitle: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.9)', fontWeight: '500' },
  scrollView: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: 100 },
  tabContainer: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  tab: { flex: 1, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center' },
  tabActive: { backgroundColor: '#3b82f6', borderColor: '#60a5fa' },
  tabText: { fontSize: Typography.xs, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  tabTextActive: { color: '#fff', fontWeight: '800' },
  summaryHeader: { borderRadius: BorderRadius.lg, overflow: 'hidden', marginBottom: Spacing.lg },
  summaryGradient: { padding: Spacing.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: BorderRadius.lg, alignItems: 'center' },
  summaryTitle: { fontSize: Typography.xl, fontWeight: '800', color: '#fff', marginBottom: Spacing.xs },
  summaryDate: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.8)' },
  trendBadge: { marginTop: Spacing.md, backgroundColor: 'rgba(59, 130, 246, 0.3)', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full },
  trendText: { fontSize: Typography.sm, fontWeight: '700', color: '#60a5fa' },
  section: { marginBottom: Spacing.xl },
  sectionTitle: { fontSize: Typography.lg, fontWeight: '800', color: '#fff', marginBottom: Spacing.md },
  insightCard: { borderRadius: BorderRadius.md, overflow: 'hidden', marginBottom: Spacing.sm },
  insightGradient: { padding: Spacing.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: BorderRadius.md, borderLeftWidth: 4, borderLeftColor: '#3b82f6' },
  insightText: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.9)', lineHeight: 20 },
  recCard: { borderRadius: BorderRadius.md, overflow: 'hidden', marginBottom: Spacing.md },
  recGradient: { padding: Spacing.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: BorderRadius.md },
  recHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm },
  recAction: { fontSize: Typography.base, fontWeight: '700', color: '#fff', flex: 1, marginRight: Spacing.sm },
  priorityBadge: { fontSize: Typography.xs, fontWeight: '700', paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: 4 },
  priorityHigh: { backgroundColor: 'rgba(239, 68, 68, 0.5)', color: '#ef4444' },
  priorityMedium: { backgroundColor: 'rgba(245, 158, 11, 0.5)', color: '#f59e0b' },
  recRationale: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.8)', lineHeight: 18 },
  statsRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.lg },
  statSmall: { flex: 1, padding: Spacing.md, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: BorderRadius.md, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '900', color: '#fff' },
  statLabel: { fontSize: Typography.xs, color: 'rgba(255,255,255,0.7)', marginTop: Spacing.xs, textAlign: 'center' },
  predCard: { borderRadius: BorderRadius.md, overflow: 'hidden', marginBottom: Spacing.md },
  predGradient: { padding: Spacing.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: BorderRadius.md },
  predHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.sm },
  predIcon: { fontSize: 24, marginRight: Spacing.sm },
  predInfo: { flex: 1 },
  predTitle: { fontSize: Typography.base, fontWeight: '700', color: '#fff', marginBottom: Spacing.xs },
  predMeta: { flexDirection: 'row', gap: Spacing.xs, flexWrap: 'wrap' },
  predMetaText: { fontSize: Typography.xs, color: 'rgba(255,255,255,0.6)' },
  predDescription: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.8)', lineHeight: 18 },
  patternCard: { borderRadius: BorderRadius.md, overflow: 'hidden', marginBottom: Spacing.md },
  patternGradient: { padding: Spacing.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: BorderRadius.md },
  patternHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.sm },
  patternIcon: { fontSize: 24, marginRight: Spacing.sm },
  patternInfo: { flex: 1 },
  patternTitle: { fontSize: Typography.base, fontWeight: '700', color: '#fff', marginBottom: Spacing.sm },
  patternMeta: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  severityBadge: { fontSize: Typography.xs, fontWeight: '700', paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: 4 },
  severityCritical: { backgroundColor: 'rgba(239, 68, 68, 0.5)', color: '#ef4444' },
  severityWarning: { backgroundColor: 'rgba(245, 158, 11, 0.5)', color: '#f59e0b' },
  severityInfo: { backgroundColor: 'rgba(59, 130, 246, 0.5)', color: '#3b82f6' },
  affectedCount: { fontSize: Typography.xs, color: 'rgba(255,255,255,0.6)' },
  patternDescription: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.8)', lineHeight: 18 },
  aiNote: { padding: Spacing.md, backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: BorderRadius.md, borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.3)' },
  aiNoteText: { fontSize: Typography.xs, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 16 },
  bottomPadding: { height: 40 },
});
