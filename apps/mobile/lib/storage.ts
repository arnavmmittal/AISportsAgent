import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Message, MoodLog, Goal } from '@sports-agent/types';

const KEYS = {
  CHAT_MESSAGES: 'chat_messages',
  MOOD_LOGS_PENDING: 'mood_logs_pending',
  GOALS_PENDING: 'goals_pending',
  USER_PREFERENCES: 'user_preferences',
};

// Chat Messages Storage
export async function saveChatMessages(sessionId: string, messages: Message[]) {
  try {
    const key = `${KEYS.CHAT_MESSAGES}_${sessionId}`;
    await AsyncStorage.setItem(key, JSON.stringify(messages));
  } catch (error) {
    console.error('Error saving chat messages:', error);
  }
}

export async function getChatMessages(sessionId: string): Promise<Message[]> {
  try {
    const key = `${KEYS.CHAT_MESSAGES}_${sessionId}`;
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading chat messages:', error);
    return [];
  }
}

// Mood Logs Storage (for offline sync)
export async function savePendingMoodLog(moodLog: Omit<MoodLog, 'id' | 'createdAt'>) {
  try {
    const pending = await getPendingMoodLogs();
    pending.push({ ...moodLog, tempId: Date.now().toString() });
    await AsyncStorage.setItem(KEYS.MOOD_LOGS_PENDING, JSON.stringify(pending));
  } catch (error) {
    console.error('Error saving pending mood log:', error);
  }
}

export async function getPendingMoodLogs(): Promise<any[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.MOOD_LOGS_PENDING);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading pending mood logs:', error);
    return [];
  }
}

export async function clearPendingMoodLog(tempId: string) {
  try {
    const pending = await getPendingMoodLogs();
    const filtered = pending.filter((log) => log.tempId !== tempId);
    await AsyncStorage.setItem(KEYS.MOOD_LOGS_PENDING, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error clearing pending mood log:', error);
  }
}

// Goals Storage (for offline sync)
export async function savePendingGoal(goal: Partial<Goal>) {
  try {
    const pending = await getPendingGoals();
    pending.push({ ...goal, tempId: Date.now().toString() });
    await AsyncStorage.setItem(KEYS.GOALS_PENDING, JSON.stringify(pending));
  } catch (error) {
    console.error('Error saving pending goal:', error);
  }
}

export async function getPendingGoals(): Promise<any[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.GOALS_PENDING);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading pending goals:', error);
    return [];
  }
}

export async function clearPendingGoal(tempId: string) {
  try {
    const pending = await getPendingGoals();
    const filtered = pending.filter((goal) => goal.tempId !== tempId);
    await AsyncStorage.setItem(KEYS.GOALS_PENDING, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error clearing pending goal:', error);
  }
}

// User Preferences
export interface UserPreferences {
  notificationsEnabled: boolean;
  dailyReminderTime: number;
  theme: 'light' | 'dark' | 'system';
}

export async function saveUserPreferences(preferences: UserPreferences) {
  try {
    await AsyncStorage.setItem(KEYS.USER_PREFERENCES, JSON.stringify(preferences));
  } catch (error) {
    console.error('Error saving user preferences:', error);
  }
}

export async function getUserPreferences(): Promise<UserPreferences> {
  try {
    const data = await AsyncStorage.getItem(KEYS.USER_PREFERENCES);
    return data
      ? JSON.parse(data)
      : { notificationsEnabled: true, dailyReminderTime: 20, theme: 'system' };
  } catch (error) {
    console.error('Error loading user preferences:', error);
    return { notificationsEnabled: true, dailyReminderTime: 20, theme: 'system' };
  }
}

// Clear all data (for logout)
export async function clearAllData() {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.error('Error clearing data:', error);
  }
}
