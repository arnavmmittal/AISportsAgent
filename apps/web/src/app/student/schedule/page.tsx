'use client';

import { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Trophy,
  Plus,
  Trash2,
  ChevronRight,
  Loader2,
  Home,
  Plane,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/shared/ui/button';
import Link from 'next/link';

interface GameSchedule {
  id: string;
  gameDate: string;
  opponent: string;
  location?: string;
  homeAway: 'HOME' | 'AWAY' | 'NEUTRAL';
  sport: string;
  stakes: 'LOW' | 'MEDIUM' | 'HIGH' | 'CHAMPIONSHIP';
  competitionName?: string;
  PreGameSession?: {
    id: string;
    completedAt: string | null;
  } | null;
}

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<GameSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    opponent: '',
    gameDate: '',
    gameTime: '',
    location: '',
    homeAway: 'HOME' as const,
    sport: '',
    stakes: 'MEDIUM' as const,
    competitionName: '',
  });

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const response = await fetch('/api/athlete/schedule?limit=20&includePast=true');
      const data = await response.json();
      setSchedules(data.schedules || []);
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const gameDate = new Date(`${formData.gameDate}T${formData.gameTime || '12:00'}`);

      const response = await fetch('/api/athlete/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          gameDate: gameDate.toISOString(),
        }),
      });

      if (response.ok) {
        setShowAddForm(false);
        setFormData({
          opponent: '',
          gameDate: '',
          gameTime: '',
          location: '',
          homeAway: 'HOME',
          sport: '',
          stakes: 'MEDIUM',
          competitionName: '',
        });
        fetchSchedules();
      }
    } catch (error) {
      console.error('Failed to add game:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this game from your schedule?')) return;

    try {
      await fetch(`/api/athlete/schedule?id=${id}`, { method: 'DELETE' });
      fetchSchedules();
    } catch (error) {
      console.error('Failed to delete game:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const isPast = (dateStr: string) => new Date(dateStr) < new Date();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Game Schedule</h1>
            <p className="text-muted-foreground">Manage your upcoming competitions</p>
          </div>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Game
          </Button>
        </div>

        {/* Add Game Form */}
        {showAddForm && (
          <div className="card-elevated p-6 animate-fade-in">
            <h2 className="text-lg font-semibold mb-4">Add Upcoming Game</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Opponent *</label>
                  <input
                    type="text"
                    required
                    value={formData.opponent}
                    onChange={(e) => setFormData({ ...formData, opponent: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                    placeholder="e.g., UCLA"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Sport *</label>
                  <input
                    type="text"
                    required
                    value={formData.sport}
                    onChange={(e) => setFormData({ ...formData, sport: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                    placeholder="e.g., Basketball"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.gameDate}
                    onChange={(e) => setFormData({ ...formData, gameDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Time</label>
                  <input
                    type="time"
                    value={formData.gameTime}
                    onChange={(e) => setFormData({ ...formData, gameTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                    placeholder="e.g., Husky Stadium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Home/Away</label>
                  <select
                    value={formData.homeAway}
                    onChange={(e) => setFormData({ ...formData, homeAway: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                  >
                    <option value="HOME">Home</option>
                    <option value="AWAY">Away</option>
                    <option value="NEUTRAL">Neutral</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Stakes</label>
                  <select
                    value={formData.stakes}
                    onChange={(e) => setFormData({ ...formData, stakes: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                  >
                    <option value="LOW">Regular Season</option>
                    <option value="MEDIUM">Conference Game</option>
                    <option value="HIGH">Rivalry/Playoff</option>
                    <option value="CHAMPIONSHIP">Championship</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Competition Name</label>
                  <input
                    type="text"
                    value={formData.competitionName}
                    onChange={(e) => setFormData({ ...formData, competitionName: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background"
                    placeholder="e.g., Pac-12 Tournament"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Add Game
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Schedule List */}
        {schedules.length === 0 ? (
          <div className="card-elevated p-12 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">No games scheduled</h2>
            <p className="text-muted-foreground mb-4">
              Add your upcoming games to get pre-game mental preparation support.
            </p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Game
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {schedules.map((game) => (
              <div
                key={game.id}
                className={cn(
                  'card-elevated p-4 flex items-center gap-4',
                  isPast(game.gameDate) && 'opacity-60'
                )}
              >
                {/* Date */}
                <div className="text-center min-w-[60px]">
                  <div className="text-2xl font-bold text-foreground">
                    {new Date(game.gameDate).getDate()}
                  </div>
                  <div className="text-xs text-muted-foreground uppercase">
                    {new Date(game.gameDate).toLocaleDateString('en-US', { month: 'short' })}
                  </div>
                </div>

                {/* Divider */}
                <div className="w-px h-12 bg-border" />

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-foreground">vs {game.opponent}</span>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded text-xs font-medium',
                        game.homeAway === 'HOME' && 'bg-green-500/10 text-green-600',
                        game.homeAway === 'AWAY' && 'bg-blue-500/10 text-blue-600',
                        game.homeAway === 'NEUTRAL' && 'bg-gray-500/10 text-gray-600'
                      )}
                    >
                      {game.homeAway === 'HOME' && <Home className="w-3 h-3 inline mr-1" />}
                      {game.homeAway === 'AWAY' && <Plane className="w-3 h-3 inline mr-1" />}
                      {game.homeAway}
                    </span>
                    {game.stakes !== 'LOW' && (
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded text-xs font-medium',
                          game.stakes === 'CHAMPIONSHIP' && 'bg-yellow-500/10 text-yellow-600',
                          game.stakes === 'HIGH' && 'bg-red-500/10 text-red-600',
                          game.stakes === 'MEDIUM' && 'bg-purple-500/10 text-purple-600'
                        )}
                      >
                        {game.stakes === 'CHAMPIONSHIP' ? 'Championship' : game.stakes === 'HIGH' ? 'Big Game' : 'Conference'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatTime(game.gameDate)}
                    </span>
                    {game.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {game.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Trophy className="w-3.5 h-3.5" />
                      {game.sport}
                    </span>
                  </div>
                </div>

                {/* Status/Actions */}
                <div className="flex items-center gap-2">
                  {game.PreGameSession?.completedAt ? (
                    <span className="flex items-center gap-1 text-sm text-green-600">
                      <CheckCircle2 className="w-4 h-4" />
                      Prepped
                    </span>
                  ) : !isPast(game.gameDate) ? (
                    <Link
                      href="/student/home"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      Mental Prep
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  ) : null}
                  <button
                    onClick={() => handleDelete(game.id)}
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
