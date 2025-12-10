/**
 * Demo Mode - Works without backend
 * For testing and development when backend is unavailable
 */

import type { User, MoodLog, Goal, Message } from '@sports-agent/types';

export const DEMO_USER: User = {
  id: 'demo-user-offline',
  email: 'demo@athlete.com',
  name: 'Demo Athlete',
  role: 'ATHLETE',
  schoolId: 'demo-school',
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const DEMO_MOOD_LOGS: MoodLog[] = [
  {
    id: '1',
    athleteId: 'demo-user-offline',
    date: new Date(Date.now() - 86400000 * 0),
    mood: 8,
    confidence: 7,
    stress: 3,
    energy: 8,
    sleep: 7.5,
    notes: 'Feeling great after yesterday\'s practice',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    athleteId: 'demo-user-offline',
    date: new Date(Date.now() - 86400000 * 1),
    mood: 6,
    confidence: 6,
    stress: 5,
    energy: 6,
    sleep: 6,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    athleteId: 'demo-user-offline',
    date: new Date(Date.now() - 86400000 * 2),
    mood: 7,
    confidence: 8,
    stress: 4,
    energy: 7,
    sleep: 8,
    notes: 'Good game performance',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const DEMO_GOALS: Goal[] = [
  {
    id: '1',
    athleteId: 'demo-user-offline',
    category: 'PERFORMANCE',
    title: 'Improve free throw percentage to 80%',
    description: 'Practice 100 free throws daily',
    targetDate: new Date(Date.now() + 86400000 * 30),
    status: 'IN_PROGRESS',
    progress: 65,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    athleteId: 'demo-user-offline',
    category: 'MENTAL',
    title: 'Master pre-game visualization routine',
    description: '10 minutes of visualization before each game',
    targetDate: new Date(Date.now() + 86400000 * 14),
    status: 'IN_PROGRESS',
    progress: 40,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '3',
    athleteId: 'demo-user-offline',
    category: 'ACADEMIC',
    title: 'Maintain 3.5 GPA this semester',
    description: 'Weekly study schedule and tutoring sessions',
    targetDate: new Date(Date.now() + 86400000 * 90),
    status: 'IN_PROGRESS',
    progress: 75,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const DEMO_MESSAGES: Message[] = [
  {
    id: '1',
    sessionId: 'demo-session',
    role: 'assistant',
    content: 'Hi! I\'m your AI sports psychology assistant. How are you feeling today?',
    createdAt: new Date(),
  },
];

// Simulate AI response with typing delay
export async function simulateAIResponse(userMessage: string): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const responses = [
    "I understand you're dealing with some challenges. Let's work through this together. Can you tell me more about what's on your mind?",
    "That's a great question! Performance anxiety is very common among athletes. Let's explore some strategies that can help.",
    "It sounds like you're making good progress! Keep up the great work. What specific areas would you like to focus on?",
    "I appreciate you sharing that with me. Mental preparation is just as important as physical training. Have you tried visualization techniques?",
    "That's an important observation. Let's break this down into smaller, manageable steps. What would be most helpful to focus on first?",
  ];

  return responses[Math.floor(Math.random() * responses.length)];
}
