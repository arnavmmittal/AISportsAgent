'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Brain,
  Mail,
  Lock,
  User,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trophy,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/shared/ui/button';

/**
 * Sign Up Page - Enhanced with new design system
 *
 * Features:
 * - Role selection (Athlete/Coach) with visual cards
 * - Clean, modern design
 * - Field validation with inline errors
 * - Success redirect to sign in
 */

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'ATHLETE' as 'ATHLETE' | 'COACH',
    sport: '',
    year: '',
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Check for role query param
  useEffect(() => {
    const role = searchParams.get('role');
    if (role === 'coach') {
      setFormData((prev) => ({ ...prev, role: 'COACH' }));
    } else if (role === 'athlete') {
      setFormData((prev) => ({ ...prev, role: 'ATHLETE' }));
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.details) {
          setFieldErrors(data.details);
          setError(data.error || 'Please fix the errors below');
        } else {
          setError(data.error || 'Failed to create account');
        }
        setIsLoading(false);
        return;
      }

      // Success - redirect to signin page
      router.push('/auth/signin?message=Account created successfully! Please sign in.');
    } catch (err) {
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary/5 items-center justify-center p-12">
        <div className="max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <Brain className="w-7 h-7 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">AI Sports Agent</span>
          </div>

          <h1 className="text-3xl font-bold text-foreground mb-4">
            Start your mental performance journey
          </h1>
          <p className="text-muted-foreground mb-8">
            Join thousands of athletes and coaches using AI-powered sports psychology to gain a competitive edge.
          </p>

          <div className="space-y-4">
            {[
              '24/7 access to AI mental skills coaching',
              'Daily readiness tracking and insights',
              'Evidence-based sports psychology frameworks',
              'Private, encrypted, and confidential',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                <span className="text-sm text-muted-foreground">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Brain className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">AI Sports Agent</span>
          </div>

          <div className="text-center lg:text-left mb-8">
            <h2 className="text-2xl font-bold text-foreground">Create your account</h2>
            <p className="text-muted-foreground mt-2">
              Get started with AI-powered mental performance
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                I am a...
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'ATHLETE' })}
                  className={cn(
                    'p-4 rounded-xl border-2 text-left transition-all',
                    formData.role === 'ATHLETE'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <Trophy className={cn(
                    'w-6 h-6 mb-2',
                    formData.role === 'ATHLETE' ? 'text-primary' : 'text-muted-foreground'
                  )} />
                  <div className="font-medium text-foreground">Athlete</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Get mental coaching
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'COACH' })}
                  className={cn(
                    'p-4 rounded-xl border-2 text-left transition-all',
                    formData.role === 'COACH'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <Users className={cn(
                    'w-6 h-6 mb-2',
                    formData.role === 'COACH' ? 'text-primary' : 'text-muted-foreground'
                  )} />
                  <div className="font-medium text-foreground">Coach</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Manage your team
                  </p>
                </button>
              </div>
            </div>

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className={cn(
                    'w-full pl-10 pr-4 py-3 bg-background border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:border-transparent transition-shadow',
                    fieldErrors.name ? 'border-destructive focus:ring-destructive' : 'border-border focus:ring-primary'
                  )}
                  placeholder="John Doe"
                />
              </div>
              {fieldErrors.name && (
                <div className="mt-1 space-y-1">
                  {fieldErrors.name.map((err, idx) => (
                    <p key={idx} className="text-xs text-destructive">{err}</p>
                  ))}
                </div>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className={cn(
                    'w-full pl-10 pr-4 py-3 bg-background border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:border-transparent transition-shadow',
                    fieldErrors.email ? 'border-destructive focus:ring-destructive' : 'border-border focus:ring-primary'
                  )}
                  placeholder="athlete@university.edu"
                />
              </div>
              {fieldErrors.email && (
                <div className="mt-1 space-y-1">
                  {fieldErrors.email.map((err, idx) => (
                    <p key={idx} className="text-xs text-destructive">{err}</p>
                  ))}
                </div>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={8}
                  className={cn(
                    'w-full pl-10 pr-4 py-3 bg-background border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:border-transparent transition-shadow',
                    fieldErrors.password ? 'border-destructive focus:ring-destructive' : 'border-border focus:ring-primary'
                  )}
                  placeholder="Create a strong password"
                />
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Must be 8+ characters with uppercase, lowercase, and number
              </p>
              {fieldErrors.password && (
                <div className="mt-1 space-y-1">
                  {fieldErrors.password.map((err, idx) => (
                    <p key={idx} className="text-xs text-destructive">{err}</p>
                  ))}
                </div>
              )}
            </div>

            {/* Sport */}
            <div>
              <label htmlFor="sport" className="block text-sm font-medium text-foreground mb-2">
                Sport
              </label>
              <input
                id="sport"
                type="text"
                value={formData.sport}
                onChange={(e) => setFormData({ ...formData, sport: e.target.value })}
                required
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
                placeholder="Basketball, Football, Soccer, etc."
              />
            </div>

            {/* Year (only for athletes) */}
            {formData.role === 'ATHLETE' && (
              <div>
                <label htmlFor="year" className="block text-sm font-medium text-foreground mb-2">
                  Year
                </label>
                <select
                  id="year"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
                >
                  <option value="">Select Year</option>
                  <option value="FRESHMAN">Freshman</option>
                  <option value="SOPHOMORE">Sophomore</option>
                  <option value="JUNIOR">Junior</option>
                  <option value="SENIOR">Senior</option>
                  <option value="GRADUATE">Graduate</option>
                </select>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-background text-muted-foreground">Already have an account?</span>
            </div>
          </div>

          {/* Sign In Link */}
          <Link href="/auth/signin">
            <Button variant="outline" className="w-full" size="lg">
              Sign In
            </Button>
          </Link>

          {/* Back to home */}
          <div className="mt-8 text-center">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              &larr; Back to home
            </Link>
          </div>

          {/* Terms */}
          <p className="mt-6 text-xs text-center text-muted-foreground">
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-muted-foreground">Loading...</span>
        </div>
      </div>
    }>
      <SignUpForm />
    </Suspense>
  );
}
