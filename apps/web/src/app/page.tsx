'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Brain, Heart, Target, MessageSquare, BarChart3, Shield } from 'lucide-react';
import { Button } from '@/design-system/components/Button';
import { Card } from '@/design-system/components';
import { fadeInUp, staggerContainer } from '@/design-system/motion';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Main Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold text-gray-900 dark:text-gray-100 mb-6 tracking-tight">
              <span className="block">Mental Performance</span>
              <span className="block text-primary-600 dark:text-primary-500">
                Made Accessible
              </span>
            </h1>

            {/* Subheadline */}
            <p className="mt-6 max-w-2xl mx-auto text-xl sm:text-2xl text-gray-600 dark:text-gray-400 leading-relaxed font-body">
              Evidence-based mental performance support for collegiate athletes. Available 24/7.
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/auth/signup">
                <Button variant="primary" size="lg" className="w-full sm:w-auto">
                  Get Started Free
                </Button>
              </Link>
              <Link href="/auth/signin">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Sign In
                </Button>
              </Link>
            </div>

            {/* Trust Indicator */}
            <p className="mt-8 text-sm text-gray-500 dark:text-gray-500 font-body">
              Trusted by student-athletes across Division I programs
            </p>
          </motion.div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid md:grid-cols-3 gap-8"
        >
          <motion.div variants={fadeInUp}>
            <FeatureCard
              icon={<Target className="w-10 h-10" />}
              title="Pre-Game Readiness"
              description="Get mental performance scores before competition. Know who's ready to perform at their best."
            />
          </motion.div>
          <motion.div variants={fadeInUp}>
            <FeatureCard
              icon={<MessageSquare className="w-10 h-10" />}
              title="AI Mental Skills Coach"
              description="24/7 access to evidence-based sports psychology guidance through intelligent conversations."
            />
          </motion.div>
          <motion.div variants={fadeInUp}>
            <FeatureCard
              icon={<BarChart3 className="w-10 h-10" />}
              title="Performance Analytics"
              description="Track correlations between mental state and game performance to optimize your competitive edge."
            />
          </motion.div>
          <motion.div variants={fadeInUp}>
            <FeatureCard
              icon={<Brain className="w-10 h-10" />}
              title="Slump Prediction"
              description="Early warning system detects performance decline 7-14 days before it shows in stats."
            />
          </motion.div>
          <motion.div variants={fadeInUp}>
            <FeatureCard
              icon={<Heart className="w-10 h-10" />}
              title="Team Insights"
              description="Coaches get anonymized team-wide mental performance trends and at-risk athlete alerts."
            />
          </motion.div>
          <motion.div variants={fadeInUp}>
            <FeatureCard
              icon={<Shield className="w-10 h-10" />}
              title="Crisis Detection"
              description="AI-powered mental health monitoring with automatic escalation for at-risk situations."
            />
          </motion.div>
        </motion.div>
      </div>

      {/* Research-Backed Section */}
      <div className="bg-white dark:bg-gray-900 border-y border-gray-200 dark:border-gray-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold text-gray-900 dark:text-gray-100 mb-4">Evidence-Based Approach</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto font-body">
              Built on proven sports psychology frameworks with citations to peer-reviewed research
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <ResearchCard
              framework="Cognitive Behavioral Therapy (CBT)"
              description="Challenge negative thought patterns and develop performance-enhancing beliefs"
              citation="Beck et al., 2011"
            />
            <ResearchCard
              framework="Mindfulness-Based Interventions"
              description="Enhance focus, reduce anxiety, and improve emotional regulation during competition"
              citation="Kabat-Zinn, 2015"
            />
            <ResearchCard
              framework="Flow State Training"
              description="Optimize the balance between challenge and skill for peak performance states"
              citation="Csikszentmihalyi, 1990"
            />
            <ResearchCard
              framework="Goal-Setting Theory"
              description="Use SMART goals to maximize motivation and performance outcomes"
              citation="Locke & Latham, 2002"
            />
          </div>
        </div>
      </div>

      {/* Social Proof Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h2 className="text-3xl font-display font-bold text-gray-900 dark:text-gray-100 mb-12">Trusted by Athletes & Coaches</h2>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <TestimonialCard
              quote="Having 24/7 access to mental skills support has been a game-changer. It's like having a sports psychologist in my pocket."
              author="Sarah J."
              role="D1 Basketball Player"
            />
            <TestimonialCard
              quote="The readiness scores help me make better lineup decisions. I know which athletes are mentally prepared before each game."
              author="Coach Martinez"
              role="Women's Soccer Head Coach"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <Card variant="elevated" padding="lg" hover className="h-full">
      <div className="text-primary-600 dark:text-primary-500 mb-4">{icon}</div>
      <h3 className="text-xl font-display font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 font-body">{description}</p>
    </Card>
  );
}

function ResearchCard({ framework, description, citation }: { framework: string; description: string; citation: string }) {
  return (
    <Card variant="flat" padding="lg" className="border-l-4 border-primary-600 dark:border-primary-500">
      <h4 className="text-lg font-display font-semibold text-gray-900 dark:text-gray-100 mb-2">{framework}</h4>
      <p className="text-gray-600 dark:text-gray-400 mb-3 font-body">{description}</p>
      <p className="text-sm text-primary-600 dark:text-primary-400 font-medium font-body">{citation}</p>
    </Card>
  );
}

function TestimonialCard({ quote, author, role }: { quote: string; author: string; role: string }) {
  return (
    <Card variant="elevated" padding="lg">
      <p className="text-lg text-gray-900 dark:text-gray-100 italic mb-4 font-body">"{quote}"</p>
      <div className="flex items-center">
        <div>
          <p className="font-semibold text-gray-900 dark:text-gray-100 font-display">{author}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-body">{role}</p>
        </div>
      </div>
    </Card>
  );
}
