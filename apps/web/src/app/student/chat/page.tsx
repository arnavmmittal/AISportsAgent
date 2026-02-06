import { redirect } from 'next/navigation';

/**
 * Chat History redirect (v2.1 Navigation Consolidation)
 *
 * Chat History has been integrated into the AI Coach page
 * as a slide-out drawer. This redirect ensures old bookmarks
 * and links continue to work.
 *
 * Users can access chat history via the History icon in
 * the AI Coach header.
 */
export default function ChatHistoryRedirect() {
  redirect('/student/ai-coach');
}
