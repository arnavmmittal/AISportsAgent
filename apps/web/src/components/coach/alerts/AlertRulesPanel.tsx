/**
 * Alert Rules Panel
 *
 * Allows coaches to create, edit, and manage custom alert rules.
 * Rules automatically evaluate conditions and generate alerts.
 */

'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Bell,
  Plus,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  TrendingDown,
  UserX,
  MessageSquare,
  Users,
  Calendar,
  X,
  Check,
  Mail,
  Smartphone,
  ChevronDown
} from 'lucide-react';
import { DashboardSection } from '../layouts/DashboardGrid';
import {
  generateDemoAlertRules,
  type DemoAlertRule,
} from '@/lib/demo-data';

interface AlertRule {
  id: string;
  name: string;
  description: string | null;
  triggerType: string;
  threshold: number | null;
  thresholdString: string | null;
  comparisonOp: string | null;
  timeWindowDays: number | null;
  minOccurrences: number | null;
  channels: string[];
  isEnabled: boolean;
  createdAt: string;
  lastTriggeredAt: string | null;
  triggerCount: number;
}

const TRIGGER_TYPES = [
  {
    value: 'READINESS_DROP',
    label: 'Low Readiness',
    description: 'Alert when readiness drops below threshold',
    icon: TrendingDown,
    requiresThreshold: true,
  },
  {
    value: 'READINESS_DECLINE',
    label: 'Readiness Trend',
    description: 'Alert when readiness is trending downward',
    icon: TrendingDown,
    requiresTimeWindow: true,
  },
  {
    value: 'INACTIVITY',
    label: 'Check-in Inactivity',
    description: 'Alert when no check-in for X days',
    icon: UserX,
    requiresThreshold: true,
  },
  {
    value: 'CHAT_INACTIVITY',
    label: 'Chat Inactivity',
    description: 'Alert when no chat sessions for X days',
    icon: MessageSquare,
    requiresThreshold: true,
  },
  {
    value: 'SENTIMENT_DECLINE',
    label: 'Negative Sentiment',
    description: 'Alert when chat sentiment is consistently negative',
    icon: AlertTriangle,
    requiresThreshold: true,
    requiresTimeWindow: true,
  },
  {
    value: 'THEME_MENTION',
    label: 'Topic Mentioned',
    description: 'Alert when specific topic appears in chats',
    icon: MessageSquare,
    requiresThresholdString: true,
  },
  {
    value: 'MULTIPLE_ATHLETES',
    label: 'Team-wide Condition',
    description: 'Alert when multiple athletes meet a condition',
    icon: Users,
    requiresThreshold: true,
    requiresMinOccurrences: true,
  },
  {
    value: 'MISSED_CHECKINS',
    label: 'Missed Check-ins',
    description: 'Alert when X check-ins missed in time window',
    icon: Calendar,
    requiresMinOccurrences: true,
    requiresTimeWindow: true,
  },
];

const THEME_OPTIONS = [
  'injury-concern',
  'performance-anxiety',
  'academic-stress',
  'team-conflict',
  'coach-pressure',
  'burnout',
  'sleep-issues',
  'recovery',
];

interface CreateRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rule: Partial<AlertRule>) => void;
  editingRule?: AlertRule | null;
}

function CreateRuleModal({ isOpen, onClose, onSave, editingRule }: CreateRuleModalProps) {
  const [name, setName] = useState(editingRule?.name || '');
  const [description, setDescription] = useState(editingRule?.description || '');
  const [triggerType, setTriggerType] = useState(editingRule?.triggerType || 'READINESS_DROP');
  const [threshold, setThreshold] = useState<number | string>(editingRule?.threshold || '');
  const [thresholdString, setThresholdString] = useState(editingRule?.thresholdString || '');
  const [timeWindowDays, setTimeWindowDays] = useState<number | string>(editingRule?.timeWindowDays || 7);
  const [minOccurrences, setMinOccurrences] = useState<number | string>(editingRule?.minOccurrences || 3);
  const [channels, setChannels] = useState<string[]>(editingRule?.channels || ['IN_APP']);

  const selectedTrigger = TRIGGER_TYPES.find(t => t.value === triggerType);

  const toggleChannel = (channel: string) => {
    setChannels(prev =>
      prev.includes(channel)
        ? prev.filter(c => c !== channel)
        : [...prev, channel]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      description: description || null,
      triggerType,
      threshold: threshold ? Number(threshold) : null,
      thresholdString: thresholdString || null,
      timeWindowDays: timeWindowDays ? Number(timeWindowDays) : null,
      minOccurrences: minOccurrences ? Number(minOccurrences) : null,
      channels,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white">
            {editingRule ? 'Edit Alert Rule' : 'Create Alert Rule'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Rule Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Rule Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Low Readiness Alert"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Trigger Type */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Trigger Type *
            </label>
            <div className="relative">
              <select
                value={triggerType}
                onChange={(e) => setTriggerType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 appearance-none"
              >
                {TRIGGER_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            {selectedTrigger && (
              <p className="text-xs text-slate-500 mt-1">{selectedTrigger.description}</p>
            )}
          </div>

          {/* Threshold (numeric) */}
          {selectedTrigger?.requiresThreshold && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Threshold Value *
              </label>
              <input
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                placeholder={
                  triggerType === 'READINESS_DROP' ? 'e.g., 50 (readiness score)' :
                  triggerType === 'INACTIVITY' ? 'e.g., 5 (days)' :
                  triggerType === 'SENTIMENT_DECLINE' ? 'e.g., -0.3 (sentiment)' :
                  'Enter value'
                }
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                step={triggerType === 'SENTIMENT_DECLINE' ? '0.1' : '1'}
                required
              />
            </div>
          )}

          {/* Threshold String (topic) */}
          {selectedTrigger?.requiresThresholdString && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Topic to Monitor *
              </label>
              <div className="relative">
                <select
                  value={thresholdString}
                  onChange={(e) => setThresholdString(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500 appearance-none"
                  required
                >
                  <option value="">Select a topic...</option>
                  {THEME_OPTIONS.map(theme => (
                    <option key={theme} value={theme}>
                      {theme.replace(/-/g, ' ')}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Time Window */}
          {selectedTrigger?.requiresTimeWindow && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Time Window (days)
              </label>
              <input
                type="number"
                value={timeWindowDays}
                onChange={(e) => setTimeWindowDays(e.target.value)}
                placeholder="e.g., 7"
                min="1"
                max="90"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          {/* Min Occurrences */}
          {selectedTrigger?.requiresMinOccurrences && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Minimum Count
              </label>
              <input
                type="number"
                value={minOccurrences}
                onChange={(e) => setMinOccurrences(e.target.value)}
                placeholder="e.g., 3"
                min="1"
                max="100"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          {/* Notification Channels */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Notification Channels *
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => toggleChannel('IN_APP')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                  channels.includes('IN_APP')
                    ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                    : 'border-slate-700 bg-slate-800 text-slate-400'
                }`}
              >
                <Bell className="w-4 h-4" />
                <span className="text-sm">In-App</span>
              </button>
              <button
                type="button"
                onClick={() => toggleChannel('EMAIL')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                  channels.includes('EMAIL')
                    ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                    : 'border-slate-700 bg-slate-800 text-slate-400'
                }`}
              >
                <Mail className="w-4 h-4" />
                <span className="text-sm">Email</span>
              </button>
              <button
                type="button"
                onClick={() => toggleChannel('SMS')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                  channels.includes('SMS')
                    ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                    : 'border-slate-700 bg-slate-800 text-slate-400'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span className="text-sm">SMS</span>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-300 hover:bg-slate-800 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name || channels.length === 0}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              {editingRule ? 'Save Changes' : 'Create Rule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface AlertRulesPanelProps {
  className?: string;
}

export default function AlertRulesPanel({ className = '' }: AlertRulesPanelProps) {
  const searchParams = useSearchParams();
  const isDemo = searchParams.get('demo') === 'true';

  const [rules, setRules] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);

  useEffect(() => {
    const fetchRules = async () => {
      setLoading(true);

      if (isDemo) {
        const demoData = generateDemoAlertRules();
        setRules(demoData.rules as AlertRule[]);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/coach/alert-rules');
        if (response.ok) {
          const data = await response.json();
          setRules(data.rules);
        }
      } catch (error) {
        console.error('Failed to fetch alert rules:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRules();
  }, [isDemo]);

  const handleToggleRule = async (ruleId: string, currentEnabled: boolean) => {
    if (isDemo) {
      setRules(prev => prev.map(r =>
        r.id === ruleId ? { ...r, isEnabled: !currentEnabled } : r
      ));
      return;
    }

    try {
      const response = await fetch(`/api/coach/alert-rules/${ruleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled: !currentEnabled }),
      });

      if (response.ok) {
        setRules(prev => prev.map(r =>
          r.id === ruleId ? { ...r, isEnabled: !currentEnabled } : r
        ));
      }
    } catch (error) {
      console.error('Failed to toggle rule:', error);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;

    if (isDemo) {
      setRules(prev => prev.filter(r => r.id !== ruleId));
      return;
    }

    try {
      const response = await fetch(`/api/coach/alert-rules/${ruleId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setRules(prev => prev.filter(r => r.id !== ruleId));
      }
    } catch (error) {
      console.error('Failed to delete rule:', error);
    }
  };

  const handleSaveRule = async (ruleData: Partial<AlertRule>) => {
    if (isDemo) {
      if (editingRule) {
        setRules(prev => prev.map(r =>
          r.id === editingRule.id ? { ...r, ...ruleData } : r
        ));
      } else {
        const newRule: AlertRule = {
          id: `rule-${Date.now()}`,
          name: ruleData.name || '',
          description: ruleData.description || null,
          triggerType: ruleData.triggerType || 'READINESS_DROP',
          threshold: ruleData.threshold || null,
          thresholdString: ruleData.thresholdString || null,
          comparisonOp: ruleData.comparisonOp || null,
          timeWindowDays: ruleData.timeWindowDays || null,
          minOccurrences: ruleData.minOccurrences || null,
          channels: ruleData.channels || ['IN_APP'],
          isEnabled: true,
          createdAt: new Date().toISOString(),
          lastTriggeredAt: null,
          triggerCount: 0,
        };
        setRules(prev => [newRule, ...prev]);
      }
      setShowCreateModal(false);
      setEditingRule(null);
      return;
    }

    try {
      const method = editingRule ? 'PATCH' : 'POST';
      const url = editingRule
        ? `/api/coach/alert-rules/${editingRule.id}`
        : '/api/coach/alert-rules';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleData),
      });

      if (response.ok) {
        const data = await response.json();
        if (editingRule) {
          setRules(prev => prev.map(r =>
            r.id === editingRule.id ? data.rule : r
          ));
        } else {
          setRules(prev => [data.rule, ...prev]);
        }
        setShowCreateModal(false);
        setEditingRule(null);
      }
    } catch (error) {
      console.error('Failed to save rule:', error);
    }
  };

  const getTriggerIcon = (triggerType: string) => {
    const trigger = TRIGGER_TYPES.find(t => t.value === triggerType);
    const Icon = trigger?.icon || Bell;
    return <Icon className="w-5 h-5" />;
  };

  const formatTriggerLabel = (rule: AlertRule) => {
    const trigger = TRIGGER_TYPES.find(t => t.value === rule.triggerType);
    let details = trigger?.label || rule.triggerType;

    if (rule.threshold !== null) {
      if (rule.triggerType === 'READINESS_DROP') {
        details += ` < ${rule.threshold}`;
      } else if (rule.triggerType === 'INACTIVITY' || rule.triggerType === 'CHAT_INACTIVITY') {
        details += ` (${rule.threshold}+ days)`;
      } else if (rule.triggerType === 'SENTIMENT_DECLINE') {
        details += ` < ${rule.threshold}`;
      }
    }

    if (rule.thresholdString) {
      details += `: "${rule.thresholdString.replace(/-/g, ' ')}"`;
    }

    if (rule.minOccurrences) {
      details += ` (${rule.minOccurrences}+ athletes)`;
    }

    return details;
  };

  if (loading) {
    return (
      <DashboardSection title="Alert Rules">
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-slate-800 rounded-lg animate-pulse" />
          ))}
        </div>
      </DashboardSection>
    );
  }

  return (
    <div className={className}>
      <DashboardSection
        title="Alert Rules"
        action={
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg"
          >
            <Plus className="w-4 h-4" />
            Create Rule
          </button>
        }
      >
        {rules.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 mb-4">No alert rules configured</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              Create your first rule
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {rules.map(rule => (
              <div
                key={rule.id}
                className={`p-4 rounded-lg border ${
                  rule.isEnabled
                    ? 'bg-slate-800/50 border-slate-700'
                    : 'bg-slate-800/30 border-slate-700/50 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${
                      rule.isEnabled ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-500'
                    }`}>
                      {getTriggerIcon(rule.triggerType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-white">
                        {rule.name}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {formatTriggerLabel(rule)}
                      </p>
                      {rule.description && (
                        <p className="text-xs text-slate-500 mt-1">{rule.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1">
                          {rule.channels.includes('IN_APP') && (
                            <Bell className="w-3 h-3 text-slate-500" />
                          )}
                          {rule.channels.includes('EMAIL') && (
                            <Mail className="w-3 h-3 text-slate-500" />
                          )}
                          {rule.channels.includes('SMS') && (
                            <Smartphone className="w-3 h-3 text-slate-500" />
                          )}
                        </div>
                        {rule.triggerCount > 0 && (
                          <span className="text-xs text-slate-500">
                            Triggered {rule.triggerCount} times
                          </span>
                        )}
                        {rule.lastTriggeredAt && (
                          <span className="text-xs text-slate-500">
                            Last: {new Date(rule.lastTriggeredAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleRule(rule.id, rule.isEnabled)}
                      className="p-1.5 hover:bg-slate-700 rounded"
                      title={rule.isEnabled ? 'Disable rule' : 'Enable rule'}
                    >
                      {rule.isEnabled ? (
                        <ToggleRight className="w-5 h-5 text-green-400" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-slate-500" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setEditingRule(rule);
                        setShowCreateModal(true);
                      }}
                      className="p-1.5 hover:bg-slate-700 rounded"
                      title="Edit rule"
                    >
                      <Edit className="w-4 h-4 text-slate-400" />
                    </button>
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="p-1.5 hover:bg-slate-700 rounded"
                      title="Delete rule"
                    >
                      <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DashboardSection>

      <CreateRuleModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingRule(null);
        }}
        onSave={handleSaveRule}
        editingRule={editingRule}
      />
    </div>
  );
}
