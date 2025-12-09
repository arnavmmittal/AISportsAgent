'use client';

/**
 * GameStatsForm - Form for entering post-game performance data
 *
 * Features:
 * - Sport-specific stat fields (basketball, football, etc.)
 * - Game date, opponent, outcome selection
 * - Links to nearest MoodLog for mental state correlation
 * - Individual athlete stats input
 * - React Hook Form + Zod validation
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

// Sport-specific stat configurations
const sportStatConfigs = {
  Basketball: [
    { key: 'points', label: 'Points', type: 'number', min: 0, max: 100 },
    { key: 'shooting_pct', label: 'Shooting %', type: 'number', min: 0, max: 100, step: 0.1 },
    { key: 'three_point_pct', label: '3PT %', type: 'number', min: 0, max: 100, step: 0.1 },
    { key: 'free_throw_pct', label: 'FT %', type: 'number', min: 0, max: 100, step: 0.1 },
    { key: 'assists', label: 'Assists', type: 'number', min: 0, max: 50 },
    { key: 'rebounds', label: 'Rebounds', type: 'number', min: 0, max: 50 },
    { key: 'steals', label: 'Steals', type: 'number', min: 0, max: 20 },
    { key: 'blocks', label: 'Blocks', type: 'number', min: 0, max: 20 },
    { key: 'turnovers', label: 'Turnovers', type: 'number', min: 0, max: 20 },
    { key: 'minutes_played', label: 'Minutes', type: 'number', min: 0, max: 48 },
  ],
  Football: [
    { key: 'completions', label: 'Completions', type: 'number', min: 0, max: 100 },
    { key: 'passing_yards', label: 'Passing Yards', type: 'number', min: 0, max: 1000 },
    { key: 'touchdowns', label: 'Touchdowns', type: 'number', min: 0, max: 10 },
    { key: 'interceptions', label: 'Interceptions', type: 'number', min: 0, max: 10 },
    { key: 'rushing_yards', label: 'Rushing Yards', type: 'number', min: -50, max: 500 },
    { key: 'receptions', label: 'Receptions', type: 'number', min: 0, max: 30 },
    { key: 'receiving_yards', label: 'Receiving Yards', type: 'number', min: 0, max: 500 },
    { key: 'tackles', label: 'Tackles', type: 'number', min: 0, max: 30 },
    { key: 'sacks', label: 'Sacks', type: 'number', min: 0, max: 10 },
  ],
  Soccer: [
    { key: 'goals', label: 'Goals', type: 'number', min: 0, max: 10 },
    { key: 'assists', label: 'Assists', type: 'number', min: 0, max: 10 },
    { key: 'shots', label: 'Shots', type: 'number', min: 0, max: 30 },
    { key: 'shots_on_target', label: 'Shots on Target', type: 'number', min: 0, max: 30 },
    { key: 'passes_completed', label: 'Passes Completed', type: 'number', min: 0, max: 200 },
    { key: 'pass_accuracy', label: 'Pass Accuracy %', type: 'number', min: 0, max: 100, step: 0.1 },
    { key: 'tackles', label: 'Tackles', type: 'number', min: 0, max: 30 },
    { key: 'saves', label: 'Saves (GK)', type: 'number', min: 0, max: 20 },
    { key: 'minutes_played', label: 'Minutes', type: 'number', min: 0, max: 120 },
  ],
  Volleyball: [
    { key: 'kills', label: 'Kills', type: 'number', min: 0, max: 50 },
    { key: 'hitting_pct', label: 'Hitting %', type: 'number', min: -100, max: 100, step: 0.1 },
    { key: 'aces', label: 'Aces', type: 'number', min: 0, max: 20 },
    { key: 'blocks', label: 'Blocks', type: 'number', min: 0, max: 20 },
    { key: 'digs', label: 'Digs', type: 'number', min: 0, max: 50 },
    { key: 'assists', label: 'Assists', type: 'number', min: 0, max: 60 },
    { key: 'errors', label: 'Errors', type: 'number', min: 0, max: 30 },
  ],
};

// Validation schema
const gameStatsSchema = z.object({
  athleteId: z.string().min(1, 'Please select an athlete'),
  gameDate: z.string().min(1, 'Game date is required'),
  opponentName: z.string().min(1, 'Opponent name is required'),
  outcome: z.enum(['win', 'loss', 'draw']),
  stats: z.record(z.number()),
});

type GameStatsFormData = z.infer<typeof gameStatsSchema>;

interface Athlete {
  id: string;
  name: string;
  position?: string;
}

interface GameStatsFormProps {
  sport: string;
  athletes: Athlete[];
  onSubmit: (data: GameStatsFormData) => Promise<void>;
  onCancel?: () => void;
}

export function GameStatsForm({
  sport,
  athletes,
  onSubmit,
  onCancel
}: GameStatsFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);

  const statFields = sportStatConfigs[sport as keyof typeof sportStatConfigs] || sportStatConfigs.Basketball;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<GameStatsFormData>({
    resolver: zodResolver(gameStatsSchema),
    defaultValues: {
      outcome: 'win',
      stats: {},
    },
  });

  const watchedOutcome = watch('outcome');

  const handleFormSubmit = async (data: GameStatsFormData) => {
    setSubmitting(true);
    try {
      await onSubmit(data);
      toast.success('Game stats saved successfully!', {
        description: `Stats recorded for ${selectedAthlete?.name}`,
        icon: <CheckCircle className="w-4 h-4" />,
      });
    } catch (error) {
      toast.error('Failed to save game stats', {
        description: error instanceof Error ? error.message : 'Please try again',
        icon: <AlertCircle className="w-4 h-4" />,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAthleteSelect = (athleteId: string) => {
    const athlete = athletes.find(a => a.id === athleteId);
    setSelectedAthlete(athlete || null);
    setValue('athleteId', athleteId);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <div className="space-y-6">
        {/* Game Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Game Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Athlete Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Athlete *
              </label>
              <select
                {...register('athleteId')}
                onChange={(e) => handleAthleteSelect(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select athlete...</option>
                {athletes.map((athlete) => (
                  <option key={athlete.id} value={athlete.id}>
                    {athlete.name} {athlete.position ? `(${athlete.position})` : ''}
                  </option>
                ))}
              </select>
              {errors.athleteId && (
                <p className="text-red-600 text-sm mt-1">{errors.athleteId.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Game Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Game Date *
                </label>
                <Input
                  type="date"
                  {...register('gameDate')}
                  className={errors.gameDate ? 'border-red-500' : ''}
                />
                {errors.gameDate && (
                  <p className="text-red-600 text-sm mt-1">{errors.gameDate.message}</p>
                )}
              </div>

              {/* Opponent */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Opponent *
                </label>
                <Input
                  type="text"
                  placeholder="e.g., Oregon State"
                  {...register('opponentName')}
                  className={errors.opponentName ? 'border-red-500' : ''}
                />
                {errors.opponentName && (
                  <p className="text-red-600 text-sm mt-1">{errors.opponentName.message}</p>
                )}
              </div>
            </div>

            {/* Outcome */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Game Outcome *
              </label>
              <div className="flex gap-3">
                <label className="flex-1">
                  <input
                    type="radio"
                    value="win"
                    {...register('outcome')}
                    className="sr-only peer"
                  />
                  <div className="px-4 py-3 text-center border-2 rounded-lg cursor-pointer transition-all peer-checked:border-green-500 peer-checked:bg-green-50 peer-checked:text-green-700 hover:border-gray-400">
                    <span className="font-semibold">Win</span>
                  </div>
                </label>
                <label className="flex-1">
                  <input
                    type="radio"
                    value="loss"
                    {...register('outcome')}
                    className="sr-only peer"
                  />
                  <div className="px-4 py-3 text-center border-2 rounded-lg cursor-pointer transition-all peer-checked:border-red-500 peer-checked:bg-red-50 peer-checked:text-red-700 hover:border-gray-400">
                    <span className="font-semibold">Loss</span>
                  </div>
                </label>
                <label className="flex-1">
                  <input
                    type="radio"
                    value="draw"
                    {...register('outcome')}
                    className="sr-only peer"
                  />
                  <div className="px-4 py-3 text-center border-2 rounded-lg cursor-pointer transition-all peer-checked:border-gray-500 peer-checked:bg-gray-50 peer-checked:text-gray-700 hover:border-gray-400">
                    <span className="font-semibold">Draw</span>
                  </div>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Statistics ({sport})</CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Enter athlete's performance stats for this game
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {statFields.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {field.label}
                  </label>
                  <Input
                    type="number"
                    step={field.step || 1}
                    min={field.min}
                    max={field.max}
                    placeholder={`0-${field.max}`}
                    {...register(`stats.${field.key}`, {
                      valueAsNumber: true,
                      setValueAs: (v) => (v === '' ? undefined : Number(v)),
                    })}
                  />
                </div>
              ))}
            </div>

            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">Auto-linked to Mental State Data</p>
                  <p className="text-blue-700 mt-1">
                    The system will automatically link this performance to the athlete's nearest mood log
                    to enable mental state → performance correlation analysis.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={submitting}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={submitting || !selectedAthlete}
            className="flex items-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Game Stats
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
