import { redirect } from 'next/navigation';

/**
 * Visualization Script Page
 * Redirects to AI Coach with visualization topic for guided mental rehearsal
 */
export default function VisualizationPage() {
  redirect('/student/ai-coach?topic=visualization');
}
