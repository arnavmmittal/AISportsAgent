/**
 * TypeScript type definitions for Settings module
 */

export interface UserSettings {
  id: string;
  userId: string;

  // Notifications
  pushEnabled: boolean;
  taskReminders: boolean;
  taskReminderTimes: string[];  // ["15m", "1h", "1d"]
  goalMilestones: boolean;
  assignmentNotifs: boolean;
  chatMessages: boolean;
  weeklyEmail: boolean;
  weeklyEmailDay: string;
  weeklyEmailTime: string;

  // Privacy
  shareChatsWithCoach: boolean;
  shareMoodWithCoach: boolean;
  shareGoalsWithCoach: boolean;

  // AI Personalization
  conversationStyle: 'supportive' | 'direct' | 'balanced';
  languageFormality: 'casual' | 'professional';
  responseLength: 'concise' | 'detailed';
  autoSuggestions: boolean;
  patternDetection: boolean;

  // Sport config
  primarySport?: string;
  secondarySports: string[];
  competitionLevel?: 'high_school' | 'college' | 'professional';
  seasonStatus?: 'pre_season' | 'in_season' | 'off_season' | 'post_season';
  trainingFocusAreas: string[];

  // Theme
  theme: 'light' | 'dark' | 'auto';
  fontSize: 'small' | 'medium' | 'large';

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSettingsRequest {
  // Any UserSettings fields can be updated
  pushEnabled?: boolean;
  taskReminders?: boolean;
  taskReminderTimes?: string[];
  goalMilestones?: boolean;
  assignmentNotifs?: boolean;
  chatMessages?: boolean;
  weeklyEmail?: boolean;
  weeklyEmailDay?: string;
  weeklyEmailTime?: string;

  shareChatsWithCoach?: boolean;
  shareMoodWithCoach?: boolean;
  shareGoalsWithCoach?: boolean;

  conversationStyle?: 'supportive' | 'direct' | 'balanced';
  languageFormality?: 'casual' | 'professional';
  responseLength?: 'concise' | 'detailed';
  autoSuggestions?: boolean;
  patternDetection?: boolean;

  primarySport?: string;
  secondarySports?: string[];
  competitionLevel?: 'high_school' | 'college' | 'professional';
  seasonStatus?: 'pre_season' | 'in_season' | 'off_season' | 'post_season';
  trainingFocusAreas?: string[];

  theme?: 'light' | 'dark' | 'auto';
  fontSize?: 'small' | 'medium' | 'large';
}

export interface ExportDataResponse {
  downloadUrl: string;
  expiresAt: string;
}
