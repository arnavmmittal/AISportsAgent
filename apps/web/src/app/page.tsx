'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Brain,
  Target,
  TrendingUp,
  Shield,
  Users,
  MessageSquare,
  Activity,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Play,
  BarChart3,
  Clock,
  Award,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/shared/ui/button';

/**
 * Landing Page - Professional Marketing Site
 *
 * Features:
 * - Hero with animated readiness gauge preview
 * - Feature grid with icons
 * - Social proof (stats, testimonials)
 * - Research-backed methodology section
 * - CTA sections for athletes and coaches
 */

export default function LandingPage() {
  const [animatedScore, setAnimatedScore] = useState(0);

  // Animate the hero readiness score
  useEffect(() => {
    const target = 82;
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setAnimatedScore(target);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.round(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg text-foreground">Flow Sports Coach</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Features
              </a>
              <a href="#research" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Research
              </a>
              <a href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Testimonials
              </a>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/auth/signin">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Copy */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                Trusted by Division I Programs
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                Mental Performance,{' '}
                <span className="text-primary">Made Accessible</span>
              </h1>

              <p className="mt-6 text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0">
                Evidence-based mental performance support for collegiate athletes.
                24/7 AI coaching, readiness tracking, and team-wide insights.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/auth/signup">
                  <Button size="lg" className="w-full sm:w-auto gap-2">
                    Start Free Trial
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="#demo">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2">
                    <Play className="w-4 h-4" />
                    Watch Demo
                  </Button>
                </Link>
              </div>

              {/* Trust indicators */}
              <div className="mt-10 flex items-center gap-8 justify-center lg:justify-start text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  FERPA Compliant
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  End-to-End Encrypted
                </div>
              </div>
            </div>

            {/* Right: Animated Readiness Preview */}
            <div className="relative">
              <div className="card-elevated p-8 max-w-sm mx-auto">
                <div className="text-center mb-6">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Today's Readiness
                  </h3>
                </div>

                {/* Animated Gauge */}
                <div className="relative w-48 h-48 mx-auto mb-6">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="hsl(var(--muted))"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="hsl(var(--readiness-green))"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${(animatedScore / 100) * 264} 264`}
                      className="transition-all duration-100"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-bold text-foreground tabular-nums">
                      {animatedScore}
                    </span>
                    <span className="text-sm text-muted-foreground">/ 100</span>
                  </div>
                </div>

                <div className="text-center">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-readiness-green/10 text-readiness-green text-sm font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    Ready to Compete
                  </span>
                </div>

                {/* Dimension bars */}
                <div className="mt-6 space-y-3">
                  {[
                    { label: 'Mood', value: 78, color: 'bg-readiness-green' },
                    { label: 'Sleep', value: 85, color: 'bg-readiness-green' },
                    { label: 'Stress', value: 65, color: 'bg-readiness-yellow' },
                  ].map((dim) => (
                    <div key={dim.label} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-12">{dim.label}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all duration-1000', dim.color)}
                          style={{ width: `${dim.value}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums w-8">
                        {dim.value}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating badges */}
              <div className="absolute -top-4 -right-4 card-elevated px-3 py-2 text-sm font-medium shadow-lg animate-bounce">
                <TrendingUp className="w-4 h-4 text-success inline mr-1" />
                +12% this week
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-border bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '150+', label: 'Athletes Supported' },
              { value: '88%', label: 'Slump Prediction Accuracy' },
              { value: '24/7', label: 'AI Coach Availability' },
              { value: '4.8/5', label: 'Athlete Satisfaction' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl sm:text-4xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Everything Your Team Needs
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A complete mental performance platform for athletes and coaches
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={MessageSquare}
              title="AI Mental Skills Coach"
              description="24/7 access to evidence-based sports psychology guidance through intelligent, voice-enabled conversations."
              color="primary"
            />
            <FeatureCard
              icon={Activity}
              title="Readiness Tracking"
              description="Daily check-ins that measure mood, sleep, stress, and confidence to calculate game-day readiness scores."
              color="success"
            />
            <FeatureCard
              icon={TrendingUp}
              title="Slump Prediction"
              description="ML-powered early warning system detects performance decline 7-14 days before it shows in stats."
              color="warning"
            />
            <FeatureCard
              icon={Users}
              title="Team Insights"
              description="Coaches get anonymized team-wide mental performance trends and at-risk athlete alerts."
              color="info"
            />
            <FeatureCard
              icon={Target}
              title="Goal Setting"
              description="SMART goal framework with progress tracking and AI-powered accountability check-ins."
              color="primary"
            />
            <FeatureCard
              icon={Shield}
              title="Crisis Detection"
              description="AI-powered mental health monitoring with automatic escalation for at-risk situations."
              color="destructive"
            />
          </div>
        </div>
      </section>

      {/* Two-Portal Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              One Platform, Two Portals
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Tailored experiences for athletes and coaches, working together
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Athlete Portal */}
            <div className="card-elevated p-8 relative overflow-hidden group hover:shadow-xl transition-shadow">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16" />

              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                  <Brain className="w-7 h-7 text-primary" />
                </div>

                <h3 className="text-2xl font-bold text-foreground mb-3">Athlete Portal</h3>
                <p className="text-muted-foreground mb-6">
                  Your personal mental performance companion, available whenever you need support.
                </p>

                <ul className="space-y-3 mb-8">
                  {[
                    'Voice & text AI coaching',
                    'Daily mood check-ins',
                    'Pre-game visualization',
                    'Goal tracking & journaling',
                    'Private & confidential',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>

                <Link href="/auth/signup?role=athlete">
                  <Button className="w-full gap-2 group-hover:gap-3 transition-all">
                    Join as Athlete
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Coach Portal */}
            <div className="card-elevated p-8 relative overflow-hidden group hover:shadow-xl transition-shadow">
              <div className="absolute top-0 right-0 w-32 h-32 bg-info/5 rounded-full -mr-16 -mt-16" />

              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-info/10 flex items-center justify-center mb-6">
                  <BarChart3 className="w-7 h-7 text-info" />
                </div>

                <h3 className="text-2xl font-bold text-foreground mb-3">Coach Portal</h3>
                <p className="text-muted-foreground mb-6">
                  Team-wide mental performance insights to optimize your roster decisions.
                </p>

                <ul className="space-y-3 mb-8">
                  {[
                    'Team readiness heatmaps',
                    'At-risk athlete alerts',
                    'Anonymized trend reports',
                    'Intervention tracking',
                    'Performance correlations',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>

                <Link href="/auth/signup?role=coach">
                  <Button variant="outline" className="w-full gap-2 group-hover:gap-3 transition-all">
                    Join as Coach
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Research Section */}
      <section id="research" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-success/10 text-success text-sm font-medium mb-4">
              <Award className="w-4 h-4" />
              Evidence-Based Approach
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Built on Proven Research
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Every feature is grounded in peer-reviewed sports psychology research
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              {
                framework: 'Cognitive Behavioral Therapy',
                description: 'Challenge negative thought patterns and develop performance-enhancing beliefs',
                citation: 'Beck et al., 2011',
              },
              {
                framework: 'Mindfulness-Based Interventions',
                description: 'Enhance focus, reduce anxiety, and improve emotional regulation during competition',
                citation: 'Kabat-Zinn, 2015',
              },
              {
                framework: 'Flow State Training',
                description: 'Optimize the balance between challenge and skill for peak performance states',
                citation: 'Csikszentmihalyi, 1990',
              },
              {
                framework: 'Goal-Setting Theory',
                description: 'Use SMART goals to maximize motivation and performance outcomes',
                citation: 'Locke & Latham, 2002',
              },
            ].map((item) => (
              <div
                key={item.framework}
                className="p-6 rounded-xl border border-border bg-card hover:shadow-md transition-shadow"
              >
                <h4 className="text-lg font-semibold text-foreground mb-2">{item.framework}</h4>
                <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                <span className="text-xs text-primary font-medium">{item.citation}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Trusted by Athletes & Coaches
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <TestimonialCard
              quote="Having 24/7 access to mental skills support has been a game-changer. It's like having a sports psychologist in my pocket."
              author="Sarah J."
              role="D1 Basketball Player"
              avatar="S"
            />
            <TestimonialCard
              quote="The readiness scores help me make better lineup decisions. I know which athletes are mentally prepared before each game."
              author="Coach Martinez"
              role="Women's Soccer Head Coach"
              avatar="M"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card-elevated p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />

            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                Ready to Elevate Your Mental Game?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                Join the athletes and coaches who are gaining a mental edge with AI-powered sports psychology.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/auth/signup">
                  <Button size="lg" className="w-full sm:w-auto gap-2">
                    Get Started Free
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/auth/signin">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    Sign In
                  </Button>
                </Link>
              </div>

              <p className="mt-6 text-sm text-muted-foreground">
                No credit card required. Free for individual athletes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg text-foreground">Flow Sports Coach</span>
            </div>

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Support</a>
            </div>

            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Flow Sports Coach. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// HELPER COMPONENTS
// ─────────────────────────────────────────────────────────────────

interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
  color: 'primary' | 'success' | 'warning' | 'info' | 'destructive';
}

function FeatureCard({ icon: Icon, title, description, color }: FeatureCardProps) {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
    info: 'bg-info/10 text-info',
    destructive: 'bg-destructive/10 text-destructive',
  };

  return (
    <div className="card-elevated p-6 hover:shadow-lg transition-shadow group">
      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-4', colorClasses[color])}>
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

interface TestimonialCardProps {
  quote: string;
  author: string;
  role: string;
  avatar: string;
}

function TestimonialCard({ quote, author, role, avatar }: TestimonialCardProps) {
  return (
    <div className="card-elevated p-8">
      <p className="text-foreground italic mb-6">"{quote}"</p>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
          {avatar}
        </div>
        <div>
          <p className="font-semibold text-foreground">{author}</p>
          <p className="text-sm text-muted-foreground">{role}</p>
        </div>
      </div>
    </div>
  );
}
