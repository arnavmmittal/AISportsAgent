import { redirect } from 'next/navigation';

/**
 * Predictions Redirect (v3.0 Navigation Consolidation)
 *
 * ML predictions are now showcased in AI Insights.
 * "AI Insights" = "What should I KNOW and DO?" (THE SHOWCASE)
 *
 * This redirect ensures old bookmarks continue to work.
 */
export default function PredictionsRedirect() {
  redirect('/coach/ai-insights');
}
