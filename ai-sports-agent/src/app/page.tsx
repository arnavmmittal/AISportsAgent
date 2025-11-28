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
      router.push('/dashboard');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16 pt-16">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            AI Sports Coach
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto">
            Your 24/7 Mental Performance Partner
          </p>
          <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
            Evidence-based sports psychology support designed for collegiate athletes.
            Get instant access to mental skills training, stress management, and performance guidance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signin"
              className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="px-8 py-4 bg-white text-blue-600 text-lg font-semibold rounded-lg hover:bg-gray-50 transition-colors shadow-lg border-2 border-blue-600"
            >
              Get Started
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          <FeatureCard
            icon="💬"
            title="AI-Powered Chat"
            description="Get instant, personalized mental performance guidance through intelligent conversations"
          />
          <FeatureCard
            icon="📊"
            title="Mood Tracking"
            description="Monitor your mental state, confidence, and stress levels over time"
          />
          <FeatureCard
            icon="🎯"
            title="Goal Setting"
            description="Set and track your performance, mental, and personal development goals"
          />
          <FeatureCard
            icon="🔒"
            title="Private & Secure"
            description="Your conversations and data are encrypted and completely confidential"
          />
          <FeatureCard
            icon="📚"
            title="Evidence-Based"
            description="All guidance is grounded in sports psychology research and best practices"
          />
          <FeatureCard
            icon="⚡"
            title="Available 24/7"
            description="Get support whenever you need it, day or night, from anywhere"
          />
        </div>

        {/* Use Cases */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            How It Helps Athletes
          </h2>
          <div className="space-y-6">
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
              title="Team Communication"
              description="Enhance your leadership and communication skills with teammates"
            />
            <UseCaseItem
              title="Recovery & Burnout Prevention"
              description="Maintain mental freshness throughout your season and career"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function UseCaseItem({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
