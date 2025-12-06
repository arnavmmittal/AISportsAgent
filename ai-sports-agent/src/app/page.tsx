'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      // Redirect based on role
      if (session.user?.role === 'COACH') {
        router.push('/coach/dashboard');
      } else {
        router.push('/dashboard');
      }
    }
  }, [status, session, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
          <div className="text-center">
            {/* Main Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 mb-6 tracking-tight">
              <span className="block">Mental Performance</span>
              <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Made Accessible
              </span>
            </h1>

            {/* Subheadline */}
            <p className="mt-6 max-w-2xl mx-auto text-xl sm:text-2xl text-gray-600 leading-relaxed">
              Evidence-based mental performance support for collegiate athletes. Available 24/7.
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/auth/signup"
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Get Started Free
              </Link>
              <Link
                href="/auth/signin"
                className="w-full sm:w-auto px-8 py-4 bg-white text-blue-600 text-lg font-semibold rounded-lg hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl border-2 border-blue-600"
              >
                Sign In
              </Link>
            </div>

            {/* Trust Indicator */}
            <p className="mt-8 text-sm text-gray-500">
              Trusted by student-athletes across Division I programs
            </p>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon="🎯"
            title="Pre-Game Readiness"
            description="Get mental performance scores before competition. Know who's ready to perform at their best."
          />
          <FeatureCard
            icon="💬"
            title="AI Mental Skills Coach"
            description="24/7 access to evidence-based sports psychology guidance through intelligent conversations."
          />
          <FeatureCard
            icon="📊"
            title="Performance Analytics"
            description="Track correlations between mental state and game performance to optimize your competitive edge."
          />
          <FeatureCard
            icon="🔮"
            title="Slump Prediction"
            description="Early warning system detects performance decline 7-14 days before it shows in stats."
          />
          <FeatureCard
            icon="👥"
            title="Team Insights"
            description="Coaches get anonymized team-wide mental performance trends and at-risk athlete alerts."
          />
          <FeatureCard
            icon="🔒"
            title="Private & Secure"
            description="FERPA compliant with role-based access control. Your mental health data stays confidential."
          />
        </div>
      </div>

      {/* For Athletes Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8 text-center">
              Built for Athletes
            </h2>
            <div className="space-y-4">
              <UseCaseItem
                title="Pre-Competition Anxiety"
                description="Learn techniques to manage nerves and perform under pressure"
              />
              <UseCaseItem
                title="Building Confidence"
                description="Develop mental strategies to boost self-belief and overcome setbacks"
              />
              <UseCaseItem
                title="Focus & Concentration"
                description="Improve your ability to stay present and focused during competition"
              />
              <UseCaseItem
                title="Stress Management"
                description="Balance academics, athletics, and personal life effectively"
              />
              <UseCaseItem
                title="Recovery & Burnout Prevention"
                description="Maintain mental freshness throughout your season and career"
              />
            </div>
          </div>
        </div>
      </div>

      {/* For Coaches Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 text-center">
              Coaching Tools
            </h2>
            <p className="text-gray-600 text-center mb-8">
              Extend your sports psychology resources beyond traditional capacity
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="text-3xl mb-3">📈</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Readiness Dashboard
                </h3>
                <p className="text-gray-600 text-sm">
                  View team mental readiness 24-48hrs before games with traffic light scoring (GREEN/YELLOW/RED)
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="text-3xl mb-3">🎯</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Performance Correlation
                </h3>
                <p className="text-gray-600 text-sm">
                  See how mental state (mood, stress, sleep) impacts game stats to prove ROI
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="text-3xl mb-3">⚠️</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Crisis Detection
                </h3>
                <p className="text-gray-600 text-sm">
                  Automatic alerts for self-harm, depression, or abuse disclosures with 1-hour SLA
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="text-3xl mb-3">📊</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Team Analytics
                </h3>
                <p className="text-gray-600 text-sm">
                  Track trends across 150+ athletes without compromising individual privacy
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to optimize mental performance?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join coaches and athletes using AI to gain a competitive edge
          </p>
          <Link
            href="/auth/signup"
            className="inline-block px-8 py-4 bg-white text-blue-600 text-lg font-semibold rounded-lg hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl"
          >
            Get Started Free
          </Link>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function UseCaseItem({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mt-1">
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </div>
  );
}
