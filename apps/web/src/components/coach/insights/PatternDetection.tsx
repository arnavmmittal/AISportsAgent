/**
 * PatternDetection Component
 * Automated detection of unusual patterns and emerging trends
 */

'use client';

import { DashboardSection } from '../layouts/DashboardGrid';
import StatCard from '../ui/StatCard';

interface DetectedPattern {
  id: string;
  category: 'anomaly' | 'correlation' | 'trend' | 'cluster';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  detectedAt: string;
  affectedAthletes: number;
  confidence: number;
  evidence: string[];
  implications: string;
  recommendedAction: string;
}

export default function PatternDetection() {
  // TODO: Replace with real pattern detection from /api/coach/insights/patterns
  const patterns: DetectedPattern[] = [
    {
      id: 'pat1',
      category: 'anomaly',
      severity: 'critical',
      title: 'Unusual Stress Spike: Basketball Team',
      description: 'Detected 35% stress increase across basketball team over 3 days - significantly above historical norms for this time period.',
      detectedAt: '2025-12-13T06:00:00Z',
      affectedAthletes: 8,
      confidence: 94,
      evidence: [
        '8 of 12 basketball athletes reporting stress >6.5/10 (vs team avg of 4.8)',
        'Pattern coincides with finals week + upcoming championship game',
        'Sleep quality declined 18% in same timeframe',
        'Similar pattern occurred last year during same period (validated)',
      ],
      implications: 'Combination of academic and athletic pressure creating compounding stress. Risk of performance decline and potential injuries if not addressed.',
      recommendedAction: 'Hold team meeting to acknowledge pressures, provide stress management resources, and consider practice adjustments during finals week.',
    },
    {
      id: 'pat2',
      category: 'correlation',
      severity: 'warning',
      title: 'Strong Negative Correlation: Sleep < 6hrs → Injury Risk',
      description: 'Detected significant correlation between consecutive nights of <6 hours sleep and minor injury reports within 3-5 days.',
      detectedAt: '2025-12-12T22:00:00Z',
      affectedAthletes: 15,
      confidence: 87,
      evidence: [
        '73% of minor injuries in past 60 days preceded by 2+ nights of <6hr sleep',
        'Effect size: 2.4x injury risk when sleep-deprived vs well-rested',
        'Correlation holds across all sports in dataset',
        'Aligns with research on sleep and injury prevention (Milewski et al., 2014)',
      ],
      implications: 'Sleep deprivation is a significant modifiable injury risk factor. Currently 15 athletes averaging <6 hours this week.',
      recommendedAction: 'Prioritize sleep messaging in team communications. Consider sleep education workshop. Monitor high-risk athletes closely during training.',
    },
    {
      id: 'pat3',
      category: 'trend',
      severity: 'info',
      title: 'Emerging Positive Trend: Meditation Adoption',
      description: 'Detected organic spread of meditation practice - 18 athletes now practicing without formal assignment (up from 5 three weeks ago).',
      detectedAt: '2025-12-11T10:00:00Z',
      affectedAthletes: 18,
      confidence: 91,
      evidence: [
        'Self-reported meditation check-ins increased 260% over 3 weeks',
        'Peer influence pattern detected - athletes mention teammates in journals',
        'Strongest adoption in basketball team (9/12 athletes)',
        'Athletes report avg 12-minute sessions, 4-5x per week',
      ],
      implications: 'Positive peer influence driving organic behavior change. This is ideal for habit formation (social proof effect).',
      recommendedAction: 'Celebrate and reinforce this trend. Consider highlighting success stories to encourage broader adoption.',
    },
    {
      id: 'pat4',
      category: 'cluster',
      severity: 'warning',
      title: 'Cluster of Low Engagement: 6 Athletes',
      description: 'Identified group of 6 athletes with consistently low AI chat engagement (<2 interactions/week) and declining check-in completion rates.',
      detectedAt: '2025-12-10T14:00:00Z',
      affectedAthletes: 6,
      confidence: 83,
      evidence: [
        '6 athletes averaging <2 AI chat sessions per week (team avg: 5.3)',
        'Check-in completion rate 42% vs team avg 84%',
        'No clear archetype or sport pattern - diverse group',
        '4 of 6 showed higher engagement in first 2 weeks (indicates drop-off)',
      ],
      implications: 'Disengagement may signal lack of perceived value, technical barriers, or competing priorities. Missing data limits coaching insights for these athletes.',
      recommendedAction: '1-on-1 check-ins to understand barriers. Explore if app UX, time constraints, or skepticism about AI is the issue.',
    },
    {
      id: 'pat5',
      category: 'anomaly',
      severity: 'critical',
      title: 'Sudden Mood Drop: Jordan Smith',
      description: 'Detected atypical 4-point mood drop in single day for athlete with historically stable mood (SD: 0.8).',
      detectedAt: '2025-12-13T08:30:00Z',
      affectedAthletes: 1,
      confidence: 96,
      evidence: [
        'Mood dropped from 8.2 to 4.1 in one day (unprecedented for this athlete)',
        'Athlete has 90-day mood history with very low variability (SD: 0.8)',
        'No corresponding stress or sleep changes reported',
        'AI chat logs show concerning language patterns (flagged by sentiment analysis)',
      ],
      implications: 'Sudden unexplained mood drop in stable athlete is potential crisis indicator. May signal acute stressor or mental health event.',
      recommendedAction: 'IMMEDIATE 1-on-1 check-in required. Review AI chat logs for crisis language. Consider mental health professional referral if needed.',
    },
    {
      id: 'pat6',
      category: 'correlation',
      severity: 'info',
      title: 'Assignment Type Effectiveness: Archetype-Specific',
      description: 'Detected strong correlation between athlete archetypes and assignment completion rates - specific frameworks work better for specific types.',
      detectedAt: '2025-12-09T16:00:00Z',
      affectedAthletes: 42,
      confidence: 89,
      evidence: [
        'Overthinkers: 92% completion on CBT exercises vs 64% on imagery',
        'Perfectionists: 88% completion on self-compassion vs 58% on goal-setting',
        'Resilient Warriors: 91% completion on leadership assignments',
        'Pattern holds across 120+ assignment instances',
      ],
      implications: 'Personalizing assignment types to archetype can increase completion rates by 20-30%.',
      recommendedAction: 'Update assignment recommendation algorithm to favor archetype-matched exercises. Document best matches for each type.',
    },
  ];

  const categoryCounts = {
    anomaly: patterns.filter(p => p.category === 'anomaly').length,
    correlation: patterns.filter(p => p.category === 'correlation').length,
    trend: patterns.filter(p => p.category === 'trend').length,
    cluster: patterns.filter(p => p.category === 'cluster').length,
  };

  const severityCounts = {
    critical: patterns.filter(p => p.severity === 'critical').length,
    warning: patterns.filter(p => p.severity === 'warning').length,
    info: patterns.filter(p => p.severity === 'info').length,
  };

  return (
    <div className="space-y-6">
      {/* Pattern Detection Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Patterns Detected"
          value={patterns.length}
          subtitle="Last 7 days"
          variant="default"
        />
        <StatCard
          title="Critical Alerts"
          value={severityCounts.critical}
          subtitle="Requiring immediate action"
          variant="danger"
        />
        <StatCard
          title="Warnings"
          value={severityCounts.warning}
          subtitle="Monitor closely"
          variant="warning"
        />
        <StatCard
          title="Avg Confidence"
          value="90%"
          subtitle="Detection accuracy"
          variant="success"
        />
      </div>

      {/* Pattern Categories */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { type: 'anomaly', label: 'Anomalies', icon: '🚨', count: categoryCounts.anomaly },
          { type: 'correlation', label: 'Correlations', icon: '🔗', count: categoryCounts.correlation },
          { type: 'trend', label: 'Trends', icon: '📈', count: categoryCounts.trend },
          { type: 'cluster', label: 'Clusters', icon: '👥', count: categoryCounts.cluster },
        ].map(cat => (
          <div
            key={cat.type}
            className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg text-center"
          >
            <div className="text-2xl mb-1">{cat.icon}</div>
            <div className="text-2xl font-bold text-white mb-1">{cat.count}</div>
            <div className="text-xs text-slate-400">{cat.label}</div>
          </div>
        ))}
      </div>

      {/* Detected Patterns */}
      <DashboardSection
        title="🔍 Detected Patterns"
        description="AI-powered anomaly detection and trend analysis"
      >
        <div className="space-y-4">
          {patterns.map(pattern => (
            <div
              key={pattern.id}
              className={`p-5 rounded-lg border ${
                pattern.severity === 'critical'
                  ? 'bg-muted-foreground/20 border-muted-foreground'
                  : pattern.severity === 'warning'
                  ? 'bg-muted-foreground/20/20 border-muted-foreground'
                  : 'bg-blue-900/20 border-blue-700'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">
                      {pattern.category === 'anomaly' && '🚨'}
                      {pattern.category === 'correlation' && '🔗'}
                      {pattern.category === 'trend' && '📈'}
                      {pattern.category === 'cluster' && '👥'}
                    </span>
                    <h3 className="text-lg font-semibold text-white">{pattern.title}</h3>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded ${
                        pattern.severity === 'critical'
                          ? 'bg-muted-foreground/20/50 text-chrome'
                          : pattern.severity === 'warning'
                          ? 'bg-muted-foreground/20/50 text-chrome'
                          : 'bg-blue-900/50 text-blue-300'
                      }`}
                    >
                      {pattern.severity.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-200 mb-3">{pattern.description}</p>

                  <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
                    <span>Detected: {new Date(pattern.detectedAt).toLocaleString()}</span>
                    <span>•</span>
                    <span>{pattern.affectedAthletes} athlete{pattern.affectedAthletes !== 1 ? 's' : ''}</span>
                    <span>•</span>
                    <span className="font-semibold text-white">{pattern.confidence}% confidence</span>
                  </div>

                  {/* Evidence */}
                  <div className="mb-3">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Evidence:</h4>
                    <ul className="space-y-1">
                      {pattern.evidence.map((item, idx) => (
                        <li key={idx} className="text-sm text-slate-300 flex items-start">
                          <span className="text-blue-400 mr-2">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Implications */}
                  <div className="p-3 bg-slate-900/50 rounded border border-slate-600 mb-3">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                      Implications:
                    </h4>
                    <p className="text-sm text-slate-200">{pattern.implications}</p>
                  </div>

                  {/* Recommended Action */}
                  <div className="p-3 bg-blue-900/30 rounded border border-blue-600">
                    <h4 className="text-xs font-semibold text-blue-400 uppercase mb-1">
                      Recommended Action:
                    </h4>
                    <p className="text-sm text-white">{pattern.recommendedAction}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </DashboardSection>

      {/* Detection Methods */}
      <DashboardSection title="🤖 Pattern Detection Methods">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
            <h4 className="text-sm font-semibold text-white mb-2">Anomaly Detection</h4>
            <p className="text-sm text-slate-300 mb-2">
              Identifies unusual data points that deviate from expected patterns
            </p>
            <ul className="space-y-1 text-xs text-slate-400">
              <li>• Isolation Forest algorithm for multivariate anomalies</li>
              <li>• Statistical outlier detection (z-score, IQR methods)</li>
              <li>• Time-series anomaly detection for trends</li>
            </ul>
          </div>
          <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
            <h4 className="text-sm font-semibold text-white mb-2">Correlation Analysis</h4>
            <p className="text-sm text-slate-300 mb-2">
              Discovers relationships between variables across athlete population
            </p>
            <ul className="space-y-1 text-xs text-slate-400">
              <li>• Pearson & Spearman correlation coefficients</li>
              <li>• Lagged correlation for delayed effects</li>
              <li>• Partial correlation controlling for confounds</li>
            </ul>
          </div>
          <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
            <h4 className="text-sm font-semibold text-white mb-2">Trend Detection</h4>
            <p className="text-sm text-slate-300 mb-2">
              Identifies emerging patterns and directional changes over time
            </p>
            <ul className="space-y-1 text-xs text-slate-400">
              <li>• Mann-Kendall test for monotonic trends</li>
              <li>• Moving average crossover signals</li>
              <li>• Exponential smoothing for forecasting</li>
            </ul>
          </div>
          <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
            <h4 className="text-sm font-semibold text-white mb-2">Cluster Analysis</h4>
            <p className="text-sm text-slate-300 mb-2">
              Groups athletes with similar patterns for targeted interventions
            </p>
            <ul className="space-y-1 text-xs text-slate-400">
              <li>• K-means clustering for behavior segmentation</li>
              <li>• DBSCAN for density-based grouping</li>
              <li>• Hierarchical clustering for archetype discovery</li>
            </ul>
          </div>
        </div>
      </DashboardSection>
    </div>
  );
}
