'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen gradient-dark">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
          <div className="text-center">
            {/* Main Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-foreground mb-6 tracking-tight">
              <span className="block">Mental Performance</span>
              <span className="block gradient-primary bg-clip-text text-transparent">
                Made Accessible
              </span>
            </h1>

            {/* Subheadline */}
            <p className="mt-6 max-w-2xl mx-auto text-xl sm:text-2xl text-muted-foreground leading-relaxed">
              Evidence-based mental performance support for collegiate athletes. Available 24/7.
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/auth/signup"
                className="w-full sm:w-auto px-8 py-4 gradient-primary text-white text-lg font-semibold rounded-lg hover:opacity-90 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 blue-glow-sm"
              >
                Get Started Free
              </Link>
              <Link
                href="/auth/signin"
                className="w-full sm:w-auto px-8 py-4 bg-card text-foreground text-lg font-semibold rounded-lg hover:bg-card transition-all shadow-lg hover:shadow-xl chrome-border"
              >
                Sign In
              </Link>
            </div>

            {/* Trust Indicator */}
            <p className="mt-8 text-sm text-muted-foreground">
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
            icon="🛡️"
            title="Crisis Detection"
            description="AI-powered mental health monitoring with automatic escalation for at-risk situations."
          />
        </div>
      </div>

      {/* Research-Backed Section */}
      <div className="bg-card py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Evidence-Based Approach</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
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
          <h2 className="text-3xl font-bold text-foreground mb-12">Trusted by Athletes & Coaches</h2>

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

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-card p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow hover:blue-glow-sm">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

function ResearchCard({ framework, description, citation }: { framework: string; description: string; citation: string }) {
  return (
    <div className="glass p-6 rounded-lg border-l-4 border-primary">
      <h4 className="text-lg font-bold text-foreground mb-2">{framework}</h4>
      <p className="text-muted-foreground mb-3">{description}</p>
      <p className="text-sm text-primary font-medium">{citation}</p>
    </div>
  );
}

function TestimonialCard({ quote, author, role }: { quote: string; author: string; role: string }) {
  return (
    <div className="bg-card p-8 rounded-xl chrome-border">
      <p className="text-lg text-foreground italic mb-4">"{quote}"</p>
      <div className="flex items-center">
        <div>
          <p className="font-semibold text-foreground">{author}</p>
          <p className="text-sm text-muted-foreground">{role}</p>
        </div>
      </div>
    </div>
  );
}
