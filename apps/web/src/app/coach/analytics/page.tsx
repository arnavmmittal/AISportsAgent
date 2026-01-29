import { redirect } from 'next/navigation';

/**
 * Analytics Redirect (v3.0 Navigation Consolidation)
 *
 * All analytics are now showcased in AI Insights.
 * "AI Insights" = "What should I KNOW and DO?" (THE SHOWCASE)
 *
 * This redirect ensures old bookmarks continue to work.
 */
export default function AnalyticsRedirect() {
  redirect('/coach/ai-insights');
}
