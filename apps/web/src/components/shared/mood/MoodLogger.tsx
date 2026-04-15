'use client';

/**
 * Basic Mood Logger — redirects to EnhancedMoodLogger
 * Kept for backward compatibility with imports
 */

import { EnhancedMoodLogger } from './EnhancedMoodLogger';

export function MoodLogger() {
  return <EnhancedMoodLogger />;
}
