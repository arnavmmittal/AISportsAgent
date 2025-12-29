/**
 * Intervention Queue Component
 *
 * Displays prioritized intervention recommendations for coaches:
 * - URGENT cards (red): Immediate action required
 * - HIGH cards (orange): Action within 2-3 days
 * - MEDIUM cards (yellow): Action within week
 * - LOW cards (blue): Optional/monitoring
 *
 * Features:
 * - Action buttons: "View Athlete", "Mark Complete", "Snooze"
 * - Due date badges for urgent/high priority
 * - Filter by priority level
 * - Track completion rate
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  ExternalLink,
  Clock,
  User,
} from 'lucide-react';
import type { InterventionQueue, InterventionRecommendation } from '@/lib/analytics/interventions';

interface InterventionQueueProps {
  coachId: string;
}

export function InterventionQueueComponent({ coachId }: InterventionQueueProps) {
  const [queue, setQueue] = useState<InterventionQueue | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<'all' | 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchInterventions() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/coach/interventions?coachId=${coachId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch intervention recommendations');
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to load interventions');
        }

        setQueue(result.data);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching interventions:', err);
        setError(err instanceof Error ? err.message : 'Failed to load intervention queue');
        setIsLoading(false);
      }
    }

    fetchInterventions();
  }, [coachId]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Intervention Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading interventions...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !queue) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Intervention Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">{error || 'No intervention data available'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <AlertTriangle className="h-4 w-4" />;
      case 'HIGH':
        return <AlertCircle className="h-4 w-4" />;
      case 'MEDIUM':
        return <Info className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'border-l-4 border-destructive bg-destructive/5';
      case 'HIGH':
        return 'border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-950/20';
      case 'MEDIUM':
        return 'border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20';
      default:
        return 'border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/20';
    }
  };

  const getPriorityBadgeVariant = (priority: string): 'default' | 'danger' | 'warning' | 'success' => {
    switch (priority) {
      case 'URGENT':
        return 'danger';
      case 'HIGH':
        return 'warning';
      case 'MEDIUM':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getCategoryIcon = (category: string) => {
    // Could be enhanced with specific icons per category
    return category.replace('_', ' ');
  };

  const handleViewAthlete = (athleteId: string) => {
    router.push(`/coach/athletes/${athleteId}`);
  };

  const handleMarkComplete = async (interventionId: string) => {
    // TODO: Implement intervention completion tracking
    console.log('Mark complete:', interventionId);
  };

  // Filter interventions
  const getFilteredInterventions = (): InterventionRecommendation[] => {
    if (selectedPriority === 'all') {
      return [...queue.urgent, ...queue.high, ...queue.medium, ...queue.low];
    } else {
      return queue[selectedPriority.toLowerCase() as 'urgent' | 'high' | 'medium' | 'low'];
    }
  };

  const filteredInterventions = getFilteredInterventions();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Intervention Queue ({queue.total})</CardTitle>
          <div className="flex gap-2 text-xs">
            <Badge variant="danger" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {queue.urgent.length} Urgent
            </Badge>
            <Badge variant="warning" className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {queue.high.length} High
            </Badge>
            <Badge variant="default">{queue.medium.length} Medium</Badge>
            <Badge variant="default">{queue.low.length} Low</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Priority Filter */}
        <div className="mb-4 flex gap-2">
          {(['all', 'URGENT', 'HIGH', 'MEDIUM', 'LOW'] as const).map((priority) => (
            <Button
              key={priority}
              variant={selectedPriority === priority ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPriority(priority)}
            >
              {priority === 'all' ? 'All' : priority}
            </Button>
          ))}
        </div>

        {/* Intervention Cards */}
        {filteredInterventions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-600" />
            <p>No interventions needed at this priority level</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredInterventions.map((intervention) => (
              <div
                key={intervention.id}
                className={`p-4 rounded-lg ${getPriorityColor(intervention.priority)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getPriorityIcon(intervention.priority)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={getPriorityBadgeVariant(intervention.priority)}>
                          {intervention.priority}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {getCategoryIcon(intervention.category)}
                        </Badge>
                        {intervention.dueBy && (
                          <Badge variant="outline" className="text-xs flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Due {new Date(intervention.dueBy).toLocaleDateString()}
                          </Badge>
                        )}
                      </div>
                      <h4 className="font-semibold text-sm">{intervention.title}</h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <User className="h-3 w-3" />
                        <span>{intervention.athleteName}</span>
                        <span>•</span>
                        <span>{intervention.estimatedDuration}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-sm mb-2">{intervention.description}</p>

                <div className="text-xs text-muted-foreground mb-3">
                  <strong>Rationale:</strong> {intervention.rationale}
                </div>

                {/* Metrics Display */}
                {Object.keys(intervention.relatedMetrics).length > 0 && (
                  <div className="flex gap-3 mb-3 text-xs">
                    {intervention.relatedMetrics.readiness !== undefined && (
                      <Badge variant="outline">
                        Readiness: {intervention.relatedMetrics.readiness}
                      </Badge>
                    )}
                    {intervention.relatedMetrics.mood !== undefined && (
                      <Badge variant="outline">
                        Mood: {intervention.relatedMetrics.mood.toFixed(1)}/10
                      </Badge>
                    )}
                    {intervention.relatedMetrics.stress !== undefined && (
                      <Badge variant="outline">
                        Stress: {intervention.relatedMetrics.stress.toFixed(1)}/10
                      </Badge>
                    )}
                    {intervention.relatedMetrics.engagement !== undefined && (
                      <Badge variant="outline">
                        Sessions: {intervention.relatedMetrics.engagement}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleViewAthlete(intervention.athleteId)}
                    className="flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View Athlete
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleMarkComplete(intervention.id)}
                  >
                    Mark Complete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
