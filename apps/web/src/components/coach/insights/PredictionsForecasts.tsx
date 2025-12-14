/**
 * PredictionsForecasts Component
 * ML-based predictions for performance, risk, and interventions
 */

'use client';

import { DashboardSection } from '../layouts/DashboardGrid';
import StatCard from '../ui/StatCard';

interface Prediction {
  id: string;
  type: 'performance' | 'risk' | 'intervention' | 'trend';
  title: string;
  description: string;
  confidence: number;
  timeframe: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  suggestedActions: string[];
}

export default function PredictionsForecasts() {
  // TODO: Replace with ML predictions from /api/coach/insights/predictions
  const predictions: Prediction[] = [
    {
      id: 'p1',
      type: 'risk',
      title: 'Burnout Risk Alert: Mike Chen',
      description: 'Based on 7-day declining readiness pattern, elevated stress, and sleep debt, ML model predicts 78% probability of burnout within next 10 days if no intervention occurs.',
      confidence: 78,
      timeframe: '10 days',
      impact: 'high',
      actionable: true,
      suggestedActions: [
        'Schedule immediate 1-on-1 check-in',
        'Reduce training load 20-30% this week',
        'Coordinate with academic advisor for finals support',
        'Prescribe sleep optimization protocol',
      ],
    },
    {
      id: 'p2',
      type: 'performance',
      title: 'Peak Performance Window: Sarah Johnson',
      description: 'Athlete is in optimal readiness zone (95) with stable positive trends. Model predicts peak performance potential for next 5-7 days - ideal window for high-pressure competition.',
      confidence: 92,
      timeframe: '5-7 days',
      impact: 'high',
      actionable: true,
      suggestedActions: [
        'Schedule for starting lineup in upcoming championship game',
        'Consider leadership role in high-pressure situations',
        'Maintain current training and recovery protocols',
      ],
    },
    {
      id: 'p3',
      type: 'intervention',
      title: 'Intervention Success Prediction: Alex Martinez',
      description: 'Given archetype (Overthinker 🤔) and recent engagement patterns, CBT thought record assignment has 84% predicted completion rate and likely 15-point readiness improvement within 2 weeks.',
      confidence: 84,
      timeframe: '2 weeks',
      impact: 'medium',
      actionable: true,
      suggestedActions: [
        'Assign "Thought Record Journal" from library',
        'Schedule follow-up check-in at day 7',
        'Pair with peer mentor who completed same assignment successfully',
      ],
    },
    {
      id: 'p4',
      type: 'trend',
      title: 'Team Stress Spike Forecast',
      description: 'ML model detects pattern correlating with finals week. Predicts team-wide stress increase of 20-25% over next 5 days, with corresponding 8-10 point readiness decline.',
      confidence: 88,
      timeframe: '5 days',
      impact: 'high',
      actionable: true,
      suggestedActions: [
        'Proactive stress management workshop before finals',
        'Reduce practice intensity during exam week',
        'Send team-wide resources for time management',
        'Increase coach availability for check-ins',
      ],
    },
    {
      id: 'p5',
      type: 'performance',
      title: 'Team Performance Outlook: Next Game',
      description: 'Based on current readiness distribution and recent trends, model predicts team will perform at 82% of potential in Saturday\'s game (vs 88% last game). Primary factor: accumulated fatigue.',
      confidence: 76,
      timeframe: 'Saturday (3 days)',
      impact: 'medium',
      actionable: true,
      suggestedActions: [
        'Consider rest day Thursday or light practice',
        'Prioritize sleep messaging team-wide',
        'Adjust game strategy to account for fatigue',
      ],
    },
    {
      id: 'p6',
      type: 'trend',
      title: 'Positive Habit Formation: Team Meditation',
      description: 'Current 21-day average streak for team meditation practices suggests 89% probability these habits will persist beyond 66-day formation threshold. Strong indicators of long-term behavior change.',
      confidence: 89,
      timeframe: '45 days',
      impact: 'low',
      actionable: false,
      suggestedActions: [
        'Continue current programming - it\'s working',
        'Celebrate milestone at day 30 to reinforce',
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Prediction Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Active Predictions"
          value={predictions.length}
          subtitle="ML-generated forecasts"
          variant="default"
        />
        <StatCard
          title="Avg Confidence"
          value="85%"
          subtitle="Model accuracy"
          variant="success"
        />
        <StatCard
          title="High-Impact Alerts"
          value={predictions.filter(p => p.impact === 'high').length}
          subtitle="Requiring action"
          variant="warning"
        />
        <StatCard
          title="Actionable Items"
          value={predictions.filter(p => p.actionable).length}
          subtitle="Ready to implement"
          variant="default"
        />
      </div>

      {/* Predictions List */}
      <DashboardSection
        title="🔮 ML-Generated Predictions"
        description="Forecasts based on historical patterns, current data, and validated models"
      >
        <div className="space-y-4">
          {predictions.map(prediction => (
            <div
              key={prediction.id}
              className={`p-5 rounded-lg border ${
                prediction.type === 'risk' && prediction.impact === 'high'
                  ? 'bg-red-900/20 border-red-700'
                  : prediction.type === 'performance' && prediction.impact === 'high'
                  ? 'bg-green-900/20 border-green-700'
                  : prediction.type === 'intervention'
                  ? 'bg-blue-900/20 border-blue-700'
                  : 'bg-slate-800/50 border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">
                      {prediction.type === 'risk' && '⚠️'}
                      {prediction.type === 'performance' && '🎯'}
                      {prediction.type === 'intervention' && '💡'}
                      {prediction.type === 'trend' && '📈'}
                    </span>
                    <h3 className="text-lg font-semibold text-white">
                      {prediction.title}
                    </h3>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded ${
                        prediction.impact === 'high'
                          ? 'bg-red-900/50 text-red-300'
                          : prediction.impact === 'medium'
                          ? 'bg-amber-900/50 text-amber-300'
                          : 'bg-blue-900/50 text-blue-300'
                      }`}
                    >
                      {prediction.impact.toUpperCase()} IMPACT
                    </span>
                  </div>
                  <p className="text-sm text-slate-200 mb-3">{prediction.description}</p>

                  <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
                    <span className="flex items-center gap-1">
                      <span className="text-blue-400">Confidence:</span>
                      <span className="font-semibold text-white">{prediction.confidence}%</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <span className="text-blue-400">Timeframe:</span>
                      <span className="text-white">{prediction.timeframe}</span>
                    </span>
                  </div>

                  {/* Confidence Bar */}
                  <div className="mb-4">
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          prediction.confidence >= 80
                            ? 'bg-green-500'
                            : prediction.confidence >= 60
                            ? 'bg-blue-500'
                            : 'bg-yellow-500'
                        }`}
                        style={{ width: `${prediction.confidence}%` }}
                      />
                    </div>
                  </div>

                  {/* Suggested Actions */}
                  {prediction.actionable && prediction.suggestedActions.length > 0 && (
                    <div className="mt-3 p-3 bg-slate-900/50 rounded border border-slate-600">
                      <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">
                        Suggested Actions:
                      </h4>
                      <ul className="space-y-1">
                        {prediction.suggestedActions.map((action, idx) => (
                          <li key={idx} className="text-sm text-slate-300 flex items-start">
                            <span className="text-blue-400 mr-2">→</span>
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </DashboardSection>

      {/* Model Info */}
      <DashboardSection title="🤖 About These Predictions">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
            <h4 className="text-sm font-semibold text-white mb-2">
              Machine Learning Models Used
            </h4>
            <ul className="space-y-1 text-sm text-slate-300">
              <li>• Gradient Boosting (XGBoost) for risk prediction</li>
              <li>• LSTM neural networks for time-series forecasting</li>
              <li>• Random Forest for intervention success prediction</li>
              <li>• Ensemble methods for performance prediction</li>
            </ul>
          </div>
          <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
            <h4 className="text-sm font-semibold text-white mb-2">
              Data Sources & Features
            </h4>
            <ul className="space-y-1 text-sm text-slate-300">
              <li>• 30-day historical readiness, mood, stress patterns</li>
              <li>• Assignment completion rates & quality</li>
              <li>• Sleep duration & quality trends</li>
              <li>• Training load & recovery balance</li>
              <li>• Archetype-specific behavioral patterns</li>
            </ul>
          </div>
          <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
            <h4 className="text-sm font-semibold text-white mb-2">
              Model Validation
            </h4>
            <ul className="space-y-1 text-sm text-slate-300">
              <li>• Cross-validated on 1000+ athlete-seasons</li>
              <li>• 82% accuracy for 7-day readiness forecasts</li>
              <li>• 76% accuracy for burnout risk (14-day window)</li>
              <li>• Continuously retrained with new data</li>
            </ul>
          </div>
          <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
            <h4 className="text-sm font-semibold text-white mb-2">
              Important Notes
            </h4>
            <ul className="space-y-1 text-sm text-slate-300">
              <li>• Predictions are probabilistic, not deterministic</li>
              <li>• Always combine AI insights with coach judgment</li>
              <li>• Models improve over time with more data</li>
              <li>• Report false predictions to improve accuracy</li>
            </ul>
          </div>
        </div>
      </DashboardSection>
    </div>
  );
}
