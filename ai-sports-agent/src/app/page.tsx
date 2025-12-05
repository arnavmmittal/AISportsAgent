'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  BarChart3,
  Target,
  Lock,
  BookOpen,
  Zap,
  Check,
  ArrowRight,
  Trophy,
  Brain,
  Heart,
} from 'lucide-react';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  // Show loading state while checking auth or redirecting
  if (status === 'loading' || status === 'authenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50/30 via-white to-indigo-50/30">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">
            {status === 'authenticated' ? 'Redirecting...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-indigo-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <motion.div
          className="text-center mb-16 pt-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Trophy className="w-4 h-4" />
            <span>Evidence-Based Mental Performance Support</span>
          </motion.div>

          <motion.h1
            className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            AI Sports Coach
          </motion.h1>

          <motion.p
            className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl mx-auto font-medium"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            Your 24/7 Mental Performance Partner
          </motion.p>

          <motion.p
            className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            Evidence-based sports psychology support designed for collegiate athletes.
            Get instant access to mental skills training, stress management, and performance guidance.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Link
              href="/auth/signin"
              className="group px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              Sign In
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/auth/signup"
              className="px-8 py-4 bg-white text-blue-600 text-lg font-semibold rounded-lg hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl border-2 border-blue-600"
            >
              Get Started
            </Link>
          </motion.div>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          <FeatureCard
            icon={<MessageSquare className="w-8 h-8" />}
            title="AI-Powered Chat"
            description="Get instant, personalized mental performance guidance through intelligent conversations"
            delay={0.1}
          />
          <FeatureCard
            icon={<BarChart3 className="w-8 h-8" />}
            title="Mood Tracking"
            description="Monitor your mental state, confidence, and stress levels over time"
            delay={0.2}
          />
          <FeatureCard
            icon={<Target className="w-8 h-8" />}
            title="Goal Setting"
            description="Set and track your performance, mental, and personal development goals"
            delay={0.3}
          />
          <FeatureCard
            icon={<Lock className="w-8 h-8" />}
            title="Private & Secure"
            description="Your conversations and data are encrypted and completely confidential"
            delay={0.4}
          />
          <FeatureCard
            icon={<BookOpen className="w-8 h-8" />}
            title="Evidence-Based"
            description="All guidance is grounded in sports psychology research and best practices"
            delay={0.5}
          />
          <FeatureCard
            icon={<Zap className="w-8 h-8" />}
            title="Available 24/7"
            description="Get support whenever you need it, day or night, from anywhere"
            delay={0.6}
          />
        </div>

        {/* Use Cases */}
        <motion.div
          className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 md:p-12 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <div className="flex items-center justify-center gap-2 mb-8">
            <Brain className="w-8 h-8 text-blue-600" />
            <h2 className="text-3xl font-bold text-gray-900 text-center">
              How It Helps Athletes
            </h2>
          </div>
          <div className="space-y-6">
            <UseCaseItem
              title="Pre-Competition Anxiety"
              description="Learn techniques to manage nerves and perform under pressure"
              delay={0.9}
            />
            <UseCaseItem
              title="Building Confidence"
              description="Develop mental strategies to boost self-belief and overcome setbacks"
              delay={1.0}
            />
            <UseCaseItem
              title="Focus & Concentration"
              description="Improve your ability to stay present and focused during competition"
              delay={1.1}
            />
            <UseCaseItem
              title="Stress Management"
              description="Balance academics, athletics, and personal life effectively"
              delay={1.2}
            />
            <UseCaseItem
              title="Team Communication"
              description="Enhance your leadership and communication skills with teammates"
              delay={1.3}
            />
            <UseCaseItem
              title="Recovery & Burnout Prevention"
              description="Maintain mental freshness throughout your season and career"
              delay={1.4}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay?: number;
}

function FeatureCard({ icon, title, description, delay = 0 }: FeatureCardProps) {
  return (
    <motion.div
      className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg hover:shadow-xl transition-all group border border-gray-100"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -5 }}
    >
      <div className="text-blue-600 mb-4 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </motion.div>
  );
}

interface UseCaseItemProps {
  title: string;
  description: string;
  delay?: number;
}

function UseCaseItem({ title, description, delay = 0 }: UseCaseItemProps) {
  return (
    <motion.div
      className="flex items-start gap-4"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
        <Check className="w-5 h-5 text-white" strokeWidth={3} />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </motion.div>
  );
}
