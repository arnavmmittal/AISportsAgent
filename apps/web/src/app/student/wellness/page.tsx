'use client';
/**
 * Wellness Page v3.0 - Readiness + Check-In
 * Removed: energy field, emojis, demoMode, getMoodEmoji, MoodSlider/MoodQuickSelect
 * Added: sleepQuality, soreness, rpe, contextTags, gradient sliders, context tag chips
 */
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar, Target, Sparkles, Moon, Activity, Brain, Wind, Eye, PenLine,
  ChevronRight, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2,
  Play, Pause, Heart, Zap, Flame, Check, MessageSquare, Tag,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/shared/ui/button';
import { Textarea } from '@/components/shared/ui/textarea';
import { ReadinessGauge, type ReadinessLevel } from '@/components/shared/athlete';
import { toast } from 'sonner';

// ── Types ──
interface ReadinessData {
  score: number;
  dimensions: { mood: number; sleep: number; stress: number; confidence: number };
  trend: 'up' | 'down' | 'stable';
  change: number;
}
interface UpcomingGame { id: string; opponent: string; date: Date; location: string; isHome: boolean }
interface DayHistory { date: Date; score: number; checkedIn: boolean }
interface MoodLogData { id: string; date: Date; mood: number; confidence: number; stress: number; sleep: number; notes?: string }
type WellnessTab = 'readiness' | 'checkin';
type CheckInMode = 'quick' | 'detailed';

// ── Constants ──
const CONTEXT_TAGS = ['Travel','Exam Week','Pre-Game','Post-Game','Injury Recovery','Personal Issue','Great Practice','Team Conflict','Rest Day','Competition Week'] as const;
const QUICK_OPTIONS = [
  { value: 2, label: 'Low', grad: 'from-red-500/20 to-red-500/5 border-red-500/30', dot: 'bg-red-500', txt: 'text-red-400' },
  { value: 4, label: 'Below Avg', grad: 'from-orange-500/20 to-orange-500/5 border-orange-500/30', dot: 'bg-orange-500', txt: 'text-orange-400' },
  { value: 6, label: 'OK', grad: 'from-yellow-500/20 to-yellow-500/5 border-yellow-500/30', dot: 'bg-yellow-500', txt: 'text-yellow-400' },
  { value: 8, label: 'Good', grad: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30', dot: 'bg-emerald-500', txt: 'text-emerald-400' },
  { value: 10, label: 'Great', grad: 'from-green-500/20 to-green-500/5 border-green-500/30', dot: 'bg-green-500', txt: 'text-green-400' },
] as const;

// ── Helpers ──
function getReadinessLevel(s: number): ReadinessLevel { return s >= 75 ? 'green' : s >= 55 ? 'yellow' : 'red' }
function getReadinessMessage(l: ReadinessLevel) {
  const m = { green: { title: "You're Ready", description: 'Your mental state is optimal for peak performance. Trust your preparation.' },
    yellow: { title: 'Room for Improvement', description: 'Some factors could use attention. Try a quick preparation exercise.' },
    red: { title: 'Take Care of Yourself', description: 'Your wellbeing comes first. Consider talking to your coach or support staff.' } };
  return m[l];
}
function formatTimeUntil(d: Date) {
  const diff = Math.max(0, d.getTime() - Date.now());
  return { days: Math.floor(diff / 864e5), hours: Math.floor((diff % 864e5) / 36e5), minutes: Math.floor((diff % 36e5) / 6e4) };
}
function getMoodLabel(v: number) { return v <= 2 ? 'Low' : v <= 4 ? 'Below Avg' : v <= 6 ? 'OK' : v <= 8 ? 'Good' : 'Great' }
function scoreColor(v: number, max = 10) { const p = v / max; return p <= 0.3 ? 'bg-red-500' : p <= 0.5 ? 'bg-orange-500' : p <= 0.7 ? 'bg-yellow-500' : 'bg-emerald-500' }
function scoreTxtColor(v: number, max = 10) { const p = v / max; return p <= 0.3 ? 'text-red-400' : p <= 0.5 ? 'text-orange-400' : p <= 0.7 ? 'text-yellow-400' : 'text-emerald-400' }

// ── GradientSlider ──
function GradientSlider({ label, icon: Icon, value, onChange, min = 1, max = 10, lowLabel = 'Low', highLabel = 'High', invert = false }: {
  label: string; icon: React.ElementType; value: number; onChange: (v: number) => void;
  min?: number; max?: number; lowLabel?: string; highLabel?: string; invert?: boolean;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  const dc = invert ? (value <= 3 ? 'text-emerald-400' : value <= 6 ? 'text-yellow-400' : 'text-red-400')
    : (value <= 3 ? 'text-red-400' : value <= 6 ? 'text-yellow-400' : 'text-emerald-400');
  const gc = invert ? 'from-emerald-500 via-yellow-500 to-red-500' : 'from-red-500 via-yellow-500 to-emerald-500';
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">{label}</span>
        </div>
        <span className={cn('text-sm font-semibold tabular-nums', dc)}>{value}</span>
      </div>
      <div className="relative">
        <div className={cn('h-2 rounded-full bg-gradient-to-r opacity-30', gc)} />
        <div className={cn('absolute top-0 left-0 h-2 rounded-full bg-gradient-to-r', gc)} style={{ width: `${pct}%` }} />
        <input type="range" min={min} max={max} value={value} onChange={e => onChange(Number(e.target.value))}
          className="absolute top-0 left-0 w-full h-2 opacity-0 cursor-pointer" />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground"><span>{lowLabel}</span><span>{highLabel}</span></div>
    </div>
  );
}

// ── SegmentedControl ──
function SegmentedControl<T extends string>({ value, options, onChange }: {
  value: T; options: { key: T; label: string; icon: React.ElementType; badge?: React.ReactNode }[]; onChange: (v: T) => void;
}) {
  const idx = options.findIndex(o => o.key === value);
  return (
    <div className="relative flex p-1 bg-muted/60 rounded-xl border border-border/50">
      <div className={cn('absolute top-1 bottom-1 rounded-lg bg-background shadow-sm border border-border/80 transition-transform duration-300 ease-out')}
        style={{ width: `calc(${100 / options.length}% - 4px)`, transform: `translateX(calc(${idx * 100}% + ${idx * 4}px))` }} />
      {options.map(o => (
        <button key={o.key} onClick={() => onChange(o.key)}
          className={cn('relative z-10 flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center gap-2',
            value === o.key ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/70')}>
          <o.icon className="w-4 h-4" />{o.label}{o.badge}
        </button>
      ))}
    </div>
  );
}

// ── DimensionCard ──
function DimensionCard({ icon: Icon, label, value, inverted }: { icon: React.ElementType; label: string; value: number; inverted?: boolean }) {
  const l = getReadinessLevel(value);
  return (
    <div className="p-4 rounded-lg bg-muted/50">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className="text-muted-foreground" />
        <span className="text-sm text-muted-foreground">{label}</span>
        {inverted && <span className="text-xs text-muted-foreground">(inverted)</span>}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden mr-3">
          <div className={cn('h-full rounded-full transition-all duration-500',
            l === 'green' && 'bg-readiness-green', l === 'yellow' && 'bg-readiness-yellow', l === 'red' && 'bg-readiness-red')}
            style={{ width: `${value}%` }} />
        </div>
        <span className="text-sm font-medium tabular-nums text-foreground w-10 text-right">{value}%</span>
      </div>
    </div>
  );
}

// ── Main Component ──
function WellnessPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<WellnessTab>((searchParams.get('tab') as WellnessTab) || 'readiness');
  const handleTabChange = (tab: WellnessTab) => {
    setActiveTab(tab);
    const p = new URLSearchParams(searchParams.toString());
    tab === 'readiness' ? p.delete('tab') : p.set('tab', tab);
    router.replace(`/student/wellness${p.toString() ? `?${p.toString()}` : ''}`);
  };

  // Readiness state
  const [readiness, setReadiness] = useState<ReadinessData>({ score: 50, dimensions: { mood: 50, sleep: 50, stress: 50, confidence: 50 }, trend: 'stable', change: 0 });
  const [isLoadingReadiness, setIsLoadingReadiness] = useState(true);
  const [upcomingGame, setUpcomingGame] = useState<UpcomingGame | null>(null);
  const [history, setHistory] = useState<DayHistory[]>([]);
  const [countdown, setCountdown] = useState<{ days: number; hours: number; minutes: number } | null>(null);
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [breathCount, setBreathCount] = useState(0);

  // Check-in state
  const [checkInMode, setCheckInMode] = useState<CheckInMode>('quick');
  const [mood, setMood] = useState(5);
  const [confidence, setConfidence] = useState(5);
  const [stress, setStress] = useState(5);
  const [sleep, setSleep] = useState(7);
  const [sleepQuality, setSleepQuality] = useState(5);
  const [soreness, setSoreness] = useState(3);
  const [rpe, setRpe] = useState(5);
  const [contextTags, setContextTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pastWeekLogs, setPastWeekLogs] = useState<MoodLogData[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Fetch readiness
  useEffect(() => {
    (async () => {
      try {
        setIsLoadingReadiness(true);
        const res = await fetch('/api/athlete/dashboard');
        const data = await res.json();
        if (data.success && data.data) {
          if (data.data.readiness) {
            setReadiness({ score: data.data.readiness.score,
              dimensions: { mood: data.data.readiness.dimensions?.mood || 50, sleep: data.data.readiness.dimensions?.sleep || 50,
                stress: data.data.readiness.dimensions?.stress || 50, confidence: data.data.readiness.dimensions?.engagement || 50 },
              trend: data.data.readiness.trend || 'stable', change: data.data.readiness.change || 0 });
          }
          if (data.data.hasGameTomorrow) {
            const gi = data.data.upcomingGame || {};
            const gd = gi.date ? new Date(gi.date) : (() => { const t = new Date(); t.setDate(t.getDate() + 1); t.setHours(14, 0, 0, 0); return t })();
            setUpcomingGame({ id: gi.id || 'upcoming', opponent: gi.opponent || 'Upcoming Game', date: gd, location: gi.location || '', isHome: gi.isHome ?? true });
            setCountdown(formatTimeUntil(gd));
          }
        }
      } catch (e) { console.error('Error fetching readiness:', e); }
      finally { setIsLoadingReadiness(false); }
    })();
  }, []);

  // Build history
  useEffect(() => {
    if (!pastWeekLogs.length) return;
    const h: DayHistory[] = pastWeekLogs.map(log => {
      const s = Math.round((log.mood * 10 * 0.3) + (log.confidence * 10 * 0.25) + ((10 - log.stress) * 10 * 0.25) + ((log.sleep || 7) / 10 * 100 * 0.2));
      return { date: new Date(log.date), score: Math.min(100, Math.max(0, s)), checkedIn: true };
    });
    h.sort((a, b) => a.date.getTime() - b.date.getTime());
    setHistory(h);
  }, [pastWeekLogs]);

  // Countdown
  useEffect(() => {
    if (!upcomingGame) return;
    setCountdown(formatTimeUntil(upcomingGame.date));
    const i = setInterval(() => setCountdown(formatTimeUntil(upcomingGame.date)), 60000);
    return () => clearInterval(i);
  }, [upcomingGame]);

  // Breathing
  useEffect(() => {
    if (!breathingActive) return;
    const phases = [{ name: 'inhale' as const, duration: 4000 }, { name: 'hold' as const, duration: 4000 }, { name: 'exhale' as const, duration: 4000 }];
    let pi = 0, cy = 0;
    const run = () => {
      setBreathPhase(phases[pi].name);
      setTimeout(() => { pi = (pi + 1) % 3; if (pi === 0) { cy++; setBreathCount(cy); if (cy >= 4) { setBreathingActive(false); return; } } run(); }, phases[pi].duration);
    };
    run();
  }, [breathingActive]);

  useEffect(() => { loadLogs() }, []);

  const loadLogs = async () => {
    try {
      setIsLoadingHistory(true);
      const pr = await fetch('/api/athlete/profile');
      const pd = await pr.json();
      if (!pr.ok || !pd.profile?.id) { setIsLoadingHistory(false); return; }
      const r = await fetch(`/api/mood-logs?athleteId=${pd.profile.id}&limit=7`);
      const d = await r.json();
      if (d.success) {
        setPastWeekLogs(d.data.map((l: any) => ({ id: l.id, date: new Date(l.createdAt), mood: l.mood, confidence: l.confidence, stress: l.stress, sleep: l.sleep || 7, notes: l.notes })));
      }
    } catch (e) { console.error('Error loading mood logs:', e); }
    finally { setIsLoadingHistory(false); }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const pr = await fetch('/api/athlete/profile');
      const pd = await pr.json();
      if (!pr.ok || !pd.profile?.id) { toast.error('Please log in to save mood logs'); setIsSubmitting(false); return; }
      const r = await fetch('/api/mood-logs', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ athleteId: pd.profile.id, mood, confidence: checkInMode === 'detailed' ? confidence : undefined,
          stress, sleep, sleepQuality: checkInMode === 'detailed' ? sleepQuality : undefined,
          soreness: checkInMode === 'detailed' ? soreness : undefined, rpe: checkInMode === 'detailed' ? rpe : undefined,
          contextTags: contextTags.length ? contextTags : undefined, notes: notes.trim() || undefined }) });
      const d = await r.json();
      if (d.success) {
        toast.success('Check-in saved!');
        setMood(5); setConfidence(5); setStress(5); setSleep(7); setSleepQuality(5); setSoreness(3); setRpe(5); setContextTags([]); setNotes('');
        await loadLogs();
      } else { toast.error(d.error || 'Failed to save check-in'); }
    } catch (e) { console.error('Error saving mood log:', e); toast.error('Failed to save check-in'); }
    finally { setIsSubmitting(false); }
  };

  const toggleTag = (t: string) => setContextTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  // Computed
  const level = getReadinessLevel(readiness.score);
  const message = getReadinessMessage(level);
  const isGameDay = countdown ? countdown.days === 0 && countdown.hours < 24 : false;
  const moodTrend = (() => {
    if (pastWeekLogs.length < 2) return null;
    const recent = pastWeekLogs.slice(0, 3), older = pastWeekLogs.slice(3);
    if (!older.length) return null;
    const ra = recent.reduce((s, l) => s + l.mood, 0) / recent.length;
    const oa = older.reduce((s, l) => s + l.mood, 0) / older.length;
    const d = ra - oa;
    return d > 0.5 ? { direction: 'up' as const, value: d.toFixed(1) } : d < -0.5 ? { direction: 'down' as const, value: Math.abs(d).toFixed(1) } : { direction: 'stable' as const, value: '0' };
  })();
  const checkInDays = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d });
  const hasCompletedToday = pastWeekLogs.some(l => l.date.toDateString() === new Date().toDateString());
  const checkinBadge = !hasCompletedToday ? <span className="w-2 h-2 rounded-full bg-primary animate-pulse" /> : undefined;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6">
        <header className="animate-fade-in">
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">Wellness Center</h1>
          <p className="text-muted-foreground mt-1">Track your readiness and daily check-ins</p>
        </header>

        <SegmentedControl value={activeTab} onChange={handleTabChange} options={[
          { key: 'readiness', label: 'Readiness', icon: Activity },
          { key: 'checkin', label: 'Check-In', icon: Heart, badge: checkinBadge },
        ]} />

        {/* ── READINESS TAB ── */}
        {activeTab === 'readiness' && (
          <div className="space-y-6 animate-fade-in">
            {/* Game Countdown */}
            {upcomingGame && countdown && (
              <section className={cn('rounded-xl border bg-card p-6', isGameDay && 'border-2 border-primary ring-4 ring-primary/10')}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Calendar size={14} />
                      {upcomingGame.date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </div>
                    <h2 className="text-xl font-semibold text-foreground">vs {upcomingGame.opponent}</h2>
                    <p className="text-sm text-muted-foreground">{upcomingGame.isHome ? 'Home' : 'Away'}{upcomingGame.location && ` \u2022 ${upcomingGame.location}`}</p>
                  </div>
                  {isGameDay && <span className="px-3 py-1 bg-primary text-primary-foreground text-sm font-medium rounded-full animate-pulse">GAME DAY</span>}
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  {[{ v: countdown.days, u: 'Days' }, { v: countdown.hours, u: 'Hours' }, { v: countdown.minutes, u: 'Minutes' }].map(x => (
                    <div key={x.u} className="p-4 bg-muted rounded-lg">
                      <div className="text-3xl font-semibold tabular-nums text-foreground">{x.v}</div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider">{x.u}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Readiness Gauge */}
            <section className="rounded-xl border bg-card p-8" aria-labelledby="readiness-heading">
              <h2 id="readiness-heading" className="sr-only">Current Readiness Score</h2>
              <div className="flex flex-col items-center">
                <div className="transform scale-75 md:scale-100 origin-center">
                  <ReadinessGauge score={readiness.score} size="xl" showLabel animated />
                </div>
                <div className="mt-6 text-center">
                  <h3 className={cn('text-xl font-semibold', level === 'green' && 'text-readiness-green', level === 'yellow' && 'text-readiness-yellow', level === 'red' && 'text-readiness-red')}>
                    {message.title}
                  </h3>
                  <p className="text-muted-foreground mt-1 max-w-sm">{message.description}</p>
                </div>
                <div className="flex items-center gap-2 mt-4 text-sm">
                  {readiness.trend === 'up' ? <><TrendingUp size={16} className="text-success" /><span className="text-success">+{readiness.change}% from yesterday</span></>
                   : readiness.trend === 'down' ? <><TrendingDown size={16} className="text-destructive" /><span className="text-destructive">-{readiness.change}% from yesterday</span></>
                   : <><Minus size={16} className="text-muted-foreground" /><span className="text-muted-foreground">Stable from yesterday</span></>}
                </div>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-4">
                <DimensionCard icon={Sparkles} label="Mood" value={readiness.dimensions.mood} />
                <DimensionCard icon={Moon} label="Sleep Quality" value={readiness.dimensions.sleep} />
                <DimensionCard icon={Activity} label="Stress" value={100 - readiness.dimensions.stress} inverted />
                <DimensionCard icon={Brain} label="Confidence" value={readiness.dimensions.confidence} />
              </div>
            </section>

            {/* Pre-Game Preparation */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Target size={20} className="text-primary" />Pre-Game Preparation
              </h2>
              {/* Breathing */}
              <div className={cn('rounded-xl border bg-card p-5', breathingActive && 'border-2 border-primary')}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-info/10 flex items-center justify-center"><Wind size={20} className="text-info" /></div>
                    <div><h3 className="font-medium text-foreground">Box Breathing</h3><p className="text-sm text-muted-foreground">4-4-4 calming technique</p></div>
                  </div>
                  <Button size="sm" variant={breathingActive ? 'outline' : 'default'} onClick={() => { setBreathingActive(!breathingActive); setBreathCount(0); }}>
                    {breathingActive ? <><Pause size={14} className="mr-1" />Stop</> : <><Play size={14} className="mr-1" />Start</>}
                  </Button>
                </div>
                {breathingActive && (
                  <div className="text-center py-8 bg-muted rounded-lg">
                    <div className={cn('text-4xl font-semibold mb-2 transition-all duration-500',
                      breathPhase === 'inhale' && 'text-info scale-110', breathPhase === 'hold' && 'text-primary', breathPhase === 'exhale' && 'text-success scale-90')}>
                      {breathPhase === 'inhale' ? 'Breathe In' : breathPhase === 'hold' ? 'Hold' : 'Breathe Out'}
                    </div>
                    <p className="text-sm text-muted-foreground">Cycle {breathCount + 1} of 4</p>
                  </div>
                )}
              </div>
              {/* Visualization & Journal Links */}
              {[{ href: '/student/visualization', icon: Eye, color: 'primary', title: 'Visualization Script', desc: 'Mental rehearsal for optimal performance' },
                { href: '/student/ai-coach?topic=pregame', icon: PenLine, color: 'success', title: 'Pre-Game Journal', desc: 'Process thoughts and set intentions' },
              ].map(item => (
                <Link key={item.href} href={item.href} className="block group">
                  <div className="rounded-xl border bg-card hover:bg-muted/50 transition-colors p-5 flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full bg-${item.color}/10 flex items-center justify-center group-hover:bg-${item.color}/20 transition-colors`}>
                      <item.icon size={20} className={`text-${item.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                    <ChevronRight size={20} className={`text-muted-foreground group-hover:text-${item.color} transition-colors`} />
                  </div>
                </Link>
              ))}
            </section>

            {/* 7-Day History */}
            <section className="rounded-xl border bg-card p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">7-Day History</h2>
              {history.length > 0 ? (
                <>
                  <div className="flex justify-between gap-2">
                    {history.map((day, i) => {
                      const dl = getReadinessLevel(day.score), isToday = i === history.length - 1;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center">
                          <div className={cn('w-full aspect-square rounded-lg flex items-center justify-center text-sm font-medium text-white transition-transform hover:scale-105',
                            dl === 'green' && 'bg-readiness-green', dl === 'yellow' && 'bg-readiness-yellow', dl === 'red' && 'bg-readiness-red',
                            isToday && 'ring-2 ring-foreground ring-offset-2 ring-offset-background')}>{day.score}</div>
                          <span className="text-xs text-muted-foreground mt-2">{day.date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                          {isToday && <span className="text-xs text-primary font-medium">Today</span>}
                        </div>);
                    })}
                  </div>
                  {history.length >= 2 && (
                    <div className="mt-6 p-4 bg-info/5 border border-info/20 rounded-lg">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 size={18} className="text-info mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {history[history.length - 1].score >= history[0].score ? 'Consistent improvement this week' : 'Room for improvement'}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Your readiness has {history[history.length - 1].score >= history[0].score ? 'increased' : 'decreased'} by {Math.abs(history[history.length - 1].score - history[0].score)} points over the past {history.length} days.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No check-in data yet this week.</p>
                  <p className="text-sm">Complete your first check-in to see your history.</p>
                </div>
              )}
            </section>

            {/* Low Readiness Warning */}
            {level === 'red' && (
              <section className="p-5 rounded-lg bg-destructive/5 border border-destructive/20">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle size={20} className="text-destructive" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">Your wellbeing matters most</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      It looks like you might be going through a tough time. Consider reaching out to your coach or a trusted support person. Your mental health is more important than any game.
                    </p>
                    <div className="flex gap-3 mt-4">
                      <Button size="sm" variant="outline">Talk to Coach</Button>
                      <Link href="/student/ai-coach?topic=support"><Button size="sm">Chat with Coach</Button></Link>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>
        )}

        {/* ── CHECK-IN TAB ── */}
        {activeTab === 'checkin' && (
          <div className="space-y-6 animate-fade-in">
            {/* Week Overview */}
            <section className="rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-medium text-foreground">This Week</h2>
                {moodTrend && (
                  <div className={cn('flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
                    moodTrend.direction === 'up' && 'bg-success/10 text-success',
                    moodTrend.direction === 'down' && 'bg-destructive/10 text-destructive',
                    moodTrend.direction === 'stable' && 'bg-muted text-muted-foreground')}>
                    {moodTrend.direction === 'up' ? <TrendingUp className="w-3 h-3" /> : moodTrend.direction === 'down' ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                    {moodTrend.direction === 'stable' ? 'Stable' : `${moodTrend.value} pts`}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {checkInDays.map((date, i) => {
                  const log = pastWeekLogs.find(l => l.date.toDateString() === date.toDateString());
                  const isToday = date.toDateString() === new Date().toDateString();
                  return (
                    <div key={i} className={cn('flex flex-col items-center py-3 rounded-lg transition-all border',
                      isToday ? 'border-primary bg-primary/5' : 'border-transparent', !log && !isToday && 'bg-muted/50')}>
                      <span className="text-xs font-medium uppercase text-muted-foreground mb-1.5">
                        {date.toLocaleDateString('en-US', { weekday: 'narrow' })}
                      </span>
                      {log ? (<>
                        <div className={cn('w-3 h-3 rounded-full mb-1', scoreColor(log.mood))} />
                        <span className={cn('text-sm font-semibold tabular-nums', scoreTxtColor(log.mood))}>{log.mood}</span>
                        <span className="text-[10px] text-muted-foreground mt-0.5">{getMoodLabel(log.mood)}</span>
                      </>) : (<>
                        <div className="w-3 h-3 rounded-full bg-muted-foreground/20 mb-1" />
                        <span className="text-sm text-muted-foreground/40 font-medium">&mdash;</span>
                      </>)}
                    </div>
                  );
                })}
              </div>
              {pastWeekLogs.length > 0 && (
                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-foreground">{(pastWeekLogs.reduce((s, l) => s + l.mood, 0) / pastWeekLogs.length).toFixed(1)}</div>
                    <div className="text-xs text-muted-foreground">Avg Mood</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-foreground">{pastWeekLogs.length}/7</div>
                    <div className="text-xs text-muted-foreground">Check-ins</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-foreground">{(pastWeekLogs.reduce((s, l) => s + l.sleep, 0) / pastWeekLogs.length).toFixed(1)}h</div>
                    <div className="text-xs text-muted-foreground">Avg Sleep</div>
                  </div>
                </div>
              )}
            </section>

            {/* Mode Toggle */}
            <SegmentedControl value={checkInMode} onChange={setCheckInMode} options={[
              { key: 'quick', label: 'Quick', icon: Zap },
              { key: 'detailed', label: 'Detailed', icon: Activity },
            ]} />

            {/* Check-In Form */}
            <section className="rounded-xl border bg-card p-5 space-y-6">
              {checkInMode === 'quick' ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="text-lg font-medium text-foreground mb-1">How are you feeling right now?</h3>
                    <p className="text-sm text-muted-foreground">Select the option that best describes your state</p>
                  </div>
                  <div className="grid grid-cols-5 gap-2 sm:gap-3">
                    {QUICK_OPTIONS.map(o => (
                      <button key={o.value} onClick={() => setMood(o.value)}
                        className={cn('flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border-2 transition-all duration-200',
                          `bg-gradient-to-b ${o.grad}`,
                          mood === o.value ? 'scale-105 shadow-md ring-1 ring-foreground/20' : 'opacity-70 hover:opacity-100 hover:scale-[1.02]')}>
                        <div className={cn('w-3 h-3 rounded-full', o.dot)} />
                        <span className={cn('text-xs sm:text-sm font-semibold', mood === o.value ? o.txt : 'text-muted-foreground')}>{o.label}</span>
                        <span className={cn('text-xs tabular-nums', mood === o.value ? 'text-foreground' : 'text-muted-foreground/60')}>{o.value}/10</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <GradientSlider label="Overall Mood" icon={Heart} value={mood} onChange={setMood} lowLabel="Low" highLabel="Great" />
                  <GradientSlider label="Confidence" icon={Zap} value={confidence} onChange={setConfidence} lowLabel="Low" highLabel="High" />
                  <GradientSlider label="Stress Level" icon={Flame} value={stress} onChange={setStress} lowLabel="Calm" highLabel="Very Stressed" invert />
                  <GradientSlider label="Hours of Sleep" icon={Moon} value={sleep} onChange={setSleep} min={0} max={12} lowLabel="0h" highLabel="12h" />
                  <GradientSlider label="Sleep Quality" icon={Moon} value={sleepQuality} onChange={setSleepQuality} lowLabel="Poor" highLabel="Excellent" />
                  <GradientSlider label="Soreness" icon={Activity} value={soreness} onChange={setSoreness} lowLabel="None" highLabel="Severe" invert />
                  <GradientSlider label="RPE (Exertion)" icon={Flame} value={rpe} onChange={setRpe} lowLabel="Easy" highLabel="Maximal" />
                </div>
              )}

              {/* Context Tags */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">Context (optional)</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {CONTEXT_TAGS.map(tag => (
                    <button key={tag} onClick={() => toggleTag(tag)}
                      className={cn('px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150',
                        contextTags.includes(tag) ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-muted/50 border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground')}>
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center justify-between">
                  <span>Notes (optional)</span>
                  <span className="text-xs text-muted-foreground font-normal">{notes.length}/200</span>
                </label>
                <Textarea value={notes} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value.slice(0, 200))}
                  placeholder="Anything on your mind?" className="min-h-[80px] resize-none" maxLength={200} />
              </div>

              <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full" size="lg">
                {isSubmitting ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Saving...</>)
                  : (<><Check className="w-4 h-4 mr-2" />Save Check-In</>)}
              </Button>
            </section>

            {/* Talk to Coach */}
            <button onClick={() => router.push('/student/ai-coach')}
              className="w-full rounded-xl border bg-card hover:bg-muted/50 transition-colors p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium text-foreground">Want to talk about it?</div>
                <p className="text-sm text-muted-foreground">Chat with your coach</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>

            <section className="p-4 rounded-lg bg-info/5 border border-info/10">
              <h3 className="font-medium text-foreground mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-info" />Why track your mood?
              </h3>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li>Build self-awareness of emotional patterns</li>
                <li>Spot trends before they become problems</li>
                <li>Share insights with your coach when needed</li>
              </ul>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page Export ──
export default function WellnessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Activity className="w-8 h-8 animate-pulse text-primary" />
          <p className="text-muted-foreground">Loading wellness...</p>
        </div>
      </div>
    }>
      <WellnessPageContent />
    </Suspense>
  );
}
