import { redirect } from 'next/navigation';

/**
 * Insights Redirect (v3.0 Navigation Consolidation)
 *
 * All analytics and insights are now consolidated in AI Insights.
 * "AI Insights" = "What should I KNOW and DO?" (THE SHOWCASE)
 *
 * This redirect ensures old bookmarks continue to work.
 */
export default function InsightsRedirect() {
  redirect('/coach/ai-insights');
}
