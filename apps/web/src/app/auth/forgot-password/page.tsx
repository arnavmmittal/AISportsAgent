'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Brain, Mail, ArrowLeft, CheckCircle2, AlertCircle, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';

/**
 * Forgot Password Page
 * Allows users to request a password reset email
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to send reset email');
        setIsLoading(false);
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
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
            <span className="text-2xl font-bold text-foreground">Flow Sports Coach</span>
          </div>

          <h1 className="text-3xl font-bold text-foreground mb-4">
            Reset your password
          </h1>
          <p className="text-muted-foreground mb-8">
            Forgot your password? No problem. We'll send you a secure link to reset it.
          </p>

          <div className="p-6 rounded-xl bg-background/50 border border-border">
            <h3 className="font-semibold text-foreground mb-3">Security tips</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Use a unique password for your account</li>
              <li>• Never share your password with anyone</li>
              <li>• Password reset links expire after 1 hour</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Brain className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">Flow Sports Coach</span>
          </div>

          {success ? (
            // Success State
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-4">Check your email</h2>
              <p className="text-muted-foreground mb-8">
                If an account exists with <span className="font-medium text-foreground">{email}</span>,
                you'll receive a password reset link shortly.
              </p>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Didn't receive the email? Check your spam folder or try again.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSuccess(false);
                    setEmail('');
                  }}
                  className="w-full"
                >
                  Try another email
                </Button>
              </div>
              <div className="mt-8">
                <Link href="/auth/signin" className="text-sm text-primary hover:underline">
                  <ArrowLeft className="w-4 h-4 inline mr-1" />
                  Back to sign in
                </Link>
              </div>
            </div>
          ) : (
            // Form State
            <>
              <div className="text-center lg:text-left mb-8">
                <h2 className="text-2xl font-bold text-foreground">Forgot your password?</h2>
                <p className="text-muted-foreground mt-2">
                  Enter your email and we'll send you a reset link
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
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
                      placeholder="athlete@university.edu"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Reset Link
                    </>
                  )}
                </Button>
              </form>

              {/* Back to Sign In */}
              <div className="mt-8 text-center">
                <Link href="/auth/signin" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowLeft className="w-4 h-4 inline mr-1" />
                  Back to sign in
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
