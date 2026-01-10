/**
 * Athlete Interventions Page
 *
 * Track mental performance techniques and their effectiveness
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/shared/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/shared/ui/card';
import { Button } from '@/components/shared/ui/button';
import { Badge } from '@/components/shared/ui/badge';
import { EffectivenessRadar } from '@/components/visualizations/EffectivenessRadar';
import {
  Brain,
  Wind,
  Eye,
  Target,
  Sparkles,
  Activity,
  CheckCircle,
  Clock,
  Star,
  Plus,
  TrendingUp,
  X,
  ChevronDown,
  ChevronUp,
  MessageSquare,
} from 'lucide-react';

interface Intervention {
  id: string;
  type: string;
  protocol: string;
  description: string | null;
  performedAt: string;
  context: string;
  situation: string | null;
  source: string;
  completed: boolean;
  athleteRating: number | null;
  athleteNotes: string | null;
  effectivenessScore: number | null;
  Outcomes: Array<{
    id: string;
    moodChange: number | null;
    confidenceChange: number | null;
    stressChange: number | null;
    focusChange: number | null;
    performanceChange: number | null;
    measuredAt: string;
    notes: string | null;
  }>;
}

interface EffectivenessStats {
  type: string;
  context: string;
  count: number;
  completedCount: number;
  avgEffectiveness: number | null;
  avgMoodChange: number | null;
  avgRating: number | null;
}

interface Summary {
  totalInterventions: number;
  completedInterventions: number;
  withOutcomeData: number;
  topPerforming: Array<{ type: string; context: string; effectiveness: number | null }>;
}

const typeIcons: Record<string, any> = {
  BREATHING: Wind,
  VISUALIZATION: Eye,
  SELF_TALK: MessageSquare,
  ROUTINE: Activity,
  FOCUS_CUE: Target,
  AROUSAL_REGULATION: Activity,
  GOAL_SETTING: Target,
  COGNITIVE_REFRAME: Brain,
  MINDFULNESS: Sparkles,
  JOURNALING: MessageSquare,
  PHYSICAL_WARMUP: Activity,
  OTHER: Sparkles,
};

const typeLabels: Record<string, string> = {
  BREATHING: 'Breathing',
  VISUALIZATION: 'Visualization',
  SELF_TALK: 'Self-Talk',
  ROUTINE: 'Pre-Performance Routine',
  FOCUS_CUE: 'Focus Cue',
  AROUSAL_REGULATION: 'Arousal Regulation',
  GOAL_SETTING: 'Goal Setting',
  COGNITIVE_REFRAME: 'Cognitive Reframe',
  MINDFULNESS: 'Mindfulness',
  JOURNALING: 'Journaling',
  PHYSICAL_WARMUP: 'Physical Warmup',
  OTHER: 'Other',
};

const contextLabels: Record<string, string> = {
  PRE_GAME: 'Pre-Game',
  PRE_PRACTICE: 'Pre-Practice',
  DURING_COMPETITION: 'During Competition',
  HALFTIME: 'Halftime',
  POST_ERROR: 'After Error',
  POST_GAME: 'Post-Game',
  POST_LOSS: 'After Loss',
  RECOVERY: 'Recovery',
  SLUMP: 'Performance Slump',
  INJURY_RETURN: 'Injury Return',
  DAILY_ROUTINE: 'Daily Routine',
  ON_DEMAND: 'On Demand',
};

const sourceLabels: Record<string, string> = {
  AI_SUGGESTED: 'AI Suggested',
  COACH_ASSIGNED: 'Coach Assigned',
  SELF_INITIATED: 'Self-Initiated',
  PROTOCOL_SCHEDULED: 'Scheduled',
};

export default function InterventionsPage() {
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [stats, setStats] = useState<EffectivenessStats[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showOutcomeModal, setShowOutcomeModal] = useState<string | null>(null);
  const [expandedIntervention, setExpandedIntervention] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  const fetchInterventions = useCallback(async () => {
    try {
      const [interventionsRes, effectivenessRes] = await Promise.all([
        fetch('/api/interventions?limit=50'),
        fetch('/api/interventions/effectiveness?groupBy=type'),
      ]);

      if (interventionsRes.ok) {
        const data = await interventionsRes.json();
        setInterventions(data.interventions || []);
      }

      if (effectivenessRes.ok) {
        const data = await effectivenessRes.json();
        setStats(data.stats || []);
        setSummary(data.summary || null);
      }
    } catch (error) {
      console.error('Failed to fetch interventions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInterventions();
  }, [fetchInterventions]);

  const handleAddIntervention = async (data: any) => {
    try {
      const res = await fetch('/api/interventions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setShowAddModal(false);
        fetchInterventions();
      }
    } catch (error) {
      console.error('Failed to add intervention:', error);
    }
  };

  const handleRecordOutcome = async (interventionId: string, data: any) => {
    try {
      const res = await fetch(`/api/interventions/${interventionId}/outcome`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          measuredAt: new Date().toISOString(),
        }),
      });

      if (res.ok) {
        setShowOutcomeModal(null);
        fetchInterventions();
      }
    } catch (error) {
      console.error('Failed to record outcome:', error);
    }
  };

  const radarData = stats.slice(0, 8).map((s) => ({
    label: typeLabels[s.type] || s.type,
    value: s.avgEffectiveness !== null ? Math.max(0, Math.min(100, (s.avgEffectiveness + 5) * 10)) : 50,
    baseline: 50,
  }));

  const filteredInterventions = interventions.filter((i) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return !i.completed;
    if (filter === 'completed') return i.completed;
    return i.type === filter;
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-muted-foreground">Loading interventions...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Mental Techniques
            </h1>
            <p className="text-muted-foreground mt-1">
              Track and optimize your mental performance interventions
            </p>
          </div>
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Log Technique
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-blue-600">{summary?.totalInterventions || 0}</div>
              <div className="text-sm text-blue-600/70">Total Logged</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-green-600">
                {summary?.completedInterventions || 0}
              </div>
              <div className="text-sm text-green-600/70">Completed</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-purple-600">{summary?.withOutcomeData || 0}</div>
              <div className="text-sm text-purple-600/70">With Outcomes</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-orange-600">
                {summary?.topPerforming?.[0]?.type
                  ? typeLabels[summary.topPerforming[0].type]?.split(' ')[0] || '-'
                  : '-'}
              </div>
              <div className="text-sm text-orange-600/70">Top Technique</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Effectiveness Radar */}
          <div className="lg:col-span-1">
            {radarData.length > 2 ? (
              <EffectivenessRadar data={radarData} title="Technique Effectiveness" showBaseline />
            ) : (
              <Card className="h-full">
                <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[300px] text-center">
                  <Brain className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Log more techniques with outcomes to see your effectiveness radar
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Interventions List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Techniques</CardTitle>
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="text-sm border rounded-md px-2 py-1 bg-background"
                  >
                    <option value="all">All</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <optgroup label="By Type">
                      {Object.entries(typeLabels).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </CardHeader>
              <CardContent>
                {filteredInterventions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No interventions found</p>
                    <Button variant="outline" className="mt-4" onClick={() => setShowAddModal(true)}>
                      Log your first technique
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredInterventions.map((intervention) => {
                      const Icon = typeIcons[intervention.type] || Sparkles;
                      const isExpanded = expandedIntervention === intervention.id;

                      return (
                        <div
                          key={intervention.id}
                          className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-primary/10 rounded-lg">
                                <Icon className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <h4 className="font-medium">{intervention.protocol}</h4>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  <Badge variant="secondary">
                                    {typeLabels[intervention.type] || intervention.type}
                                  </Badge>
                                  <Badge variant="outline">
                                    {contextLabels[intervention.context] || intervention.context}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(intervention.performedAt)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {intervention.completed ? (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                              ) : (
                                <Clock className="w-5 h-5 text-yellow-500" />
                              )}
                              <button
                                onClick={() =>
                                  setExpandedIntervention(isExpanded ? null : intervention.id)
                                }
                                className="p-1 hover:bg-muted rounded"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Expanded details */}
                          {isExpanded && (
                            <div className="mt-4 pt-4 border-t space-y-4">
                              {intervention.description && (
                                <p className="text-sm text-muted-foreground">
                                  {intervention.description}
                                </p>
                              )}

                              {intervention.situation && (
                                <div>
                                  <span className="text-xs font-medium text-muted-foreground">
                                    Situation:
                                  </span>
                                  <p className="text-sm mt-1">{intervention.situation}</p>
                                </div>
                              )}

                              <div className="flex items-center gap-4 text-sm">
                                <span className="text-muted-foreground">
                                  Source: {sourceLabels[intervention.source] || intervention.source}
                                </span>
                                {intervention.athleteRating && (
                                  <span className="flex items-center gap-1">
                                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                    {intervention.athleteRating}/5
                                  </span>
                                )}
                                {intervention.effectivenessScore !== null && (
                                  <span className="flex items-center gap-1">
                                    <TrendingUp className="w-4 h-4 text-green-500" />
                                    {(intervention.effectivenessScore * 10 + 50).toFixed(0)}% effective
                                  </span>
                                )}
                              </div>

                              {/* Outcomes */}
                              {intervention.Outcomes.length > 0 && (
                                <div className="bg-muted/50 rounded-lg p-3">
                                  <h5 className="text-sm font-medium mb-2">Recorded Outcomes</h5>
                                  {intervention.Outcomes.map((outcome) => (
                                    <div key={outcome.id} className="text-sm space-y-1">
                                      <div className="flex flex-wrap gap-3">
                                        {outcome.moodChange !== null && (
                                          <span>
                                            Mood: {outcome.moodChange > 0 ? '+' : ''}
                                            {outcome.moodChange}
                                          </span>
                                        )}
                                        {outcome.confidenceChange !== null && (
                                          <span>
                                            Confidence: {outcome.confidenceChange > 0 ? '+' : ''}
                                            {outcome.confidenceChange}
                                          </span>
                                        )}
                                        {outcome.stressChange !== null && (
                                          <span>
                                            Stress: {outcome.stressChange > 0 ? '+' : ''}
                                            {outcome.stressChange}
                                          </span>
                                        )}
                                        {outcome.focusChange !== null && (
                                          <span>
                                            Focus: {outcome.focusChange > 0 ? '+' : ''}
                                            {outcome.focusChange}
                                          </span>
                                        )}
                                      </div>
                                      {outcome.notes && (
                                        <p className="text-muted-foreground">{outcome.notes}</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Actions */}
                              <div className="flex gap-2">
                                {!intervention.completed && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setShowOutcomeModal(intervention.id)}
                                  >
                                    Record Outcome
                                  </Button>
                                )}
                                {intervention.Outcomes.length === 0 && intervention.completed && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setShowOutcomeModal(intervention.id)}
                                  >
                                    Add Feedback
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Add Intervention Modal */}
        {showAddModal && (
          <AddInterventionModal
            onClose={() => setShowAddModal(false)}
            onSubmit={handleAddIntervention}
          />
        )}

        {/* Record Outcome Modal */}
        {showOutcomeModal && (
          <RecordOutcomeModal
            interventionId={showOutcomeModal}
            onClose={() => setShowOutcomeModal(null)}
            onSubmit={(data) => handleRecordOutcome(showOutcomeModal, data)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

// Add Intervention Modal Component
function AddInterventionModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (data: any) => void;
}) {
  const [formData, setFormData] = useState({
    type: 'BREATHING',
    protocol: '',
    description: '',
    context: 'PRE_GAME',
    situation: '',
    source: 'SELF_INITIATED',
    athleteRating: 0,
    athleteNotes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      performedAt: new Date().toISOString(),
      completed: false,
      athleteRating: formData.athleteRating || null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">Log Mental Technique</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Technique Type *</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 bg-background"
              required
            >
              {Object.entries(typeLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Protocol/Name *</label>
            <input
              type="text"
              value={formData.protocol}
              onChange={(e) => setFormData({ ...formData, protocol: e.target.value })}
              placeholder="e.g., 4-7-8 Breathing, Power Pose, Victory Visualization"
              className="w-full border rounded-lg px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Context</label>
            <select
              value={formData.context}
              onChange={(e) => setFormData({ ...formData, context: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 bg-background"
            >
              {Object.entries(contextLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Situation (Optional)</label>
            <textarea
              value={formData.situation}
              onChange={(e) => setFormData({ ...formData, situation: e.target.value })}
              placeholder="What was happening when you used this technique?"
              className="w-full border rounded-lg px-3 py-2 h-20 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description (Optional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="How did you perform this technique?"
              className="w-full border rounded-lg px-3 py-2 h-20 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Initial Rating (Optional)</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      athleteRating: formData.athleteRating === rating ? 0 : rating,
                    })
                  }
                  className={`p-2 rounded-lg border ${
                    formData.athleteRating >= rating
                      ? 'bg-yellow-100 border-yellow-400'
                      : 'bg-muted/50 border-transparent'
                  }`}
                >
                  <Star
                    className={`w-5 h-5 ${
                      formData.athleteRating >= rating
                        ? 'text-yellow-500 fill-yellow-500'
                        : 'text-gray-400'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600">
              Log Technique
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Record Outcome Modal Component
function RecordOutcomeModal({
  interventionId,
  onClose,
  onSubmit,
}: {
  interventionId: string;
  onClose: () => void;
  onSubmit: (data: any) => void;
}) {
  const [formData, setFormData] = useState({
    moodChange: 0,
    confidenceChange: 0,
    stressChange: 0,
    focusChange: 0,
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      moodChange: formData.moodChange || null,
      confidenceChange: formData.confidenceChange || null,
      stressChange: formData.stressChange || null,
      focusChange: formData.focusChange || null,
      notes: formData.notes || null,
    });
  };

  const renderSlider = (
    label: string,
    value: number,
    onChange: (val: number) => void,
    description: string
  ) => (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm font-medium">{label}</label>
        <span
          className={`text-sm font-semibold ${
            value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-500'
          }`}
        >
          {value > 0 ? '+' : ''}
          {value}
        </span>
      </div>
      <input
        type="range"
        min="-5"
        max="5"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full accent-blue-600"
      />
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        <span>Much Worse</span>
        <span>No Change</span>
        <span>Much Better</span>
      </div>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">Record Outcome</h2>
          <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <p className="text-sm text-muted-foreground">
            How did this technique affect you? Use the sliders to indicate changes.
          </p>

          {renderSlider('Mood', formData.moodChange, (val) => setFormData({ ...formData, moodChange: val }), 'Your overall emotional state')}

          {renderSlider(
            'Confidence',
            formData.confidenceChange,
            (val) => setFormData({ ...formData, confidenceChange: val }),
            'Belief in your abilities'
          )}

          {renderSlider(
            'Stress',
            formData.stressChange,
            (val) => setFormData({ ...formData, stressChange: val }),
            'Negative = stress decreased (good), Positive = stress increased (bad)'
          )}

          {renderSlider(
            'Focus',
            formData.focusChange,
            (val) => setFormData({ ...formData, focusChange: val }),
            'Your ability to concentrate'
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Additional Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any other observations about how this technique worked for you..."
              className="w-full border rounded-lg px-3 py-2 h-20 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600">
              Save Outcome
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
