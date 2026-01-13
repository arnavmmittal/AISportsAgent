import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/shared/ui/card';
import { BarChart3, TrendingUp, Users, MessageCircle, Target, AlertTriangle, ChevronLeft, Rocket } from 'lucide-react';
import { Button } from '@/components/shared/ui/button';

/**
 * Coach Analytics Page - Updated with Design System v2.0
 *
 * Features:
 * - Performance Trends
 * - Sport Breakdown
 * - Mental Health Metrics
 * - Engagement Stats
 * - Goal Progress
 * - Risk Patterns
 */

// Force dynamic rendering to avoid database connection issues during build
export const dynamic = 'force-dynamic';

export default async function CoachAnalyticsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-foreground flex items-center gap-2">
                <BarChart3 className="w-7 h-7 text-primary" />
                Team Analytics
              </h1>
              <p className="mt-1 text-muted-foreground">
                Deep dive into performance metrics and trends
              </p>
            </div>
            <Link href="/coach/dashboard">
              <Button variant="outline" size="sm">
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Performance Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5 text-primary" />
                Performance Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Track athlete performance over time with detailed metrics and visualizations.
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Weekly Average:</span>
                  <span className="font-semibold text-risk-green">+12%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Monthly Trend:</span>
                  <span className="font-semibold text-risk-green">Improving</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sport-Specific Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5 text-info" />
                Sport Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Analytics segmented by sport category.
              </p>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Basketball</span>
                    <span className="font-semibold">12 athletes</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Soccer</span>
                    <span className="font-semibold">8 athletes</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-risk-green h-2 rounded-full" style={{ width: '40%' }}></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mental Health Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="w-5 h-5 text-risk-green" />
                Mental Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Team-wide mental wellness indicators.
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Avg Mood Score:</span>
                  <span className="font-semibold">7.2/10</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Avg Confidence:</span>
                  <span className="font-semibold">7.8/10</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Avg Stress:</span>
                  <span className="font-semibold text-risk-yellow">4.3/10</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Engagement Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageCircle className="w-5 h-5 text-primary" />
                Engagement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Chat and interaction statistics.
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Active Today:</span>
                  <span className="font-semibold">18 athletes</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">This Week:</span>
                  <span className="font-semibold">24 athletes</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Engagement Rate:</span>
                  <span className="font-semibold text-risk-green">92%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Goal Completion */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="w-5 h-5 text-warning" />
                Goal Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Team goal completion metrics.
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Active Goals:</span>
                  <span className="font-semibold">45</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Completed:</span>
                  <span className="font-semibold text-risk-green">37</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Success Rate:</span>
                  <span className="font-semibold text-risk-green">82%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Crisis Patterns */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="w-5 h-5 text-risk-red" />
                Risk Patterns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Identified patterns requiring attention.
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">At-Risk Athletes:</span>
                  <span className="font-semibold text-risk-yellow">3</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Crisis Alerts:</span>
                  <span className="font-semibold text-risk-red">2</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Resolved This Week:</span>
                  <span className="font-semibold text-risk-green">5</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coming Soon Section */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="w-5 h-5 text-primary" />
                Coming Soon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                  <h3 className="font-semibold text-foreground mb-2">Custom Reports</h3>
                  <p className="text-sm text-muted-foreground">Generate custom analytics reports for specific time periods and metrics.</p>
                </div>
                <div className="p-4 bg-risk-green/5 rounded-lg border border-risk-green/10">
                  <h3 className="font-semibold text-foreground mb-2">AI Predictions</h3>
                  <p className="text-sm text-muted-foreground">ML-powered predictions for athlete performance and risk levels.</p>
                </div>
                <div className="p-4 bg-info/5 rounded-lg border border-info/10">
                  <h3 className="font-semibold text-foreground mb-2">Comparative Analysis</h3>
                  <p className="text-sm text-muted-foreground">Compare individual athletes or teams against benchmarks.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
