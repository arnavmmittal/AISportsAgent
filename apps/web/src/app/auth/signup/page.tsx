'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignUpPage() {
  const router = useRouter();
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
        // Display specific field errors if available
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
    <div className="min-h-screen gradient-dark flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-card rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-6 gradient-primary">
            <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
            <p className="text-white/80">Join the AI Sports Agent platform</p>
          </div>

          <div className="px-8 py-6">
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-destructive/10 border-l-4 border-destructive rounded-r">
                <p className="text-sm text-destructive flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {error}
                </p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-shadow ${
                    fieldErrors.name
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-border focus:ring-primary'
                  }`}
                  placeholder="John Doe"
                />
                {fieldErrors.name && (
                  <div className="mt-1 space-y-1">
                    {fieldErrors.name.map((error, idx) => (
                      <p key={idx} className="text-xs text-red-600">• {error}</p>
                    ))}
                  </div>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-shadow ${
                    fieldErrors.email
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-border focus:ring-primary'
                  }`}
                  placeholder="athlete@university.edu"
                />
                {fieldErrors.email && (
                  <div className="mt-1 space-y-1">
                    {fieldErrors.email.map((error, idx) => (
                      <p key={idx} className="text-xs text-red-600">• {error}</p>
                    ))}
                  </div>
                )}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={8}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-shadow ${
                    fieldErrors.password
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-border focus:ring-primary'
                  }`}
                  placeholder="Create a strong password"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Must be 8+ characters with uppercase, lowercase, and number
                </p>
                {fieldErrors.password && (
                  <div className="mt-1 space-y-1">
                    {fieldErrors.password.map((error, idx) => (
                      <p key={idx} className="text-xs text-red-600">• {error}</p>
                    ))}
                  </div>
                )}
              </div>

              {/* Role */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-foreground mb-2">
                  I am a...
                </label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'ATHLETE' | 'COACH' })}
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
                >
                  <option value="ATHLETE">Student Athlete</option>
                  <option value="COACH">Coach</option>
                </select>
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
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
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
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full gradient-primary text-white py-3 px-4 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl mt-6"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </span>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-card text-muted-foreground">Already have an account?</span>
              </div>
            </div>

            {/* Sign In Link */}
            <Link
              href="/auth/signin"
              className="block w-full text-center py-3 px-4 chrome-border text-foreground rounded-lg font-semibold hover:bg-muted transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
