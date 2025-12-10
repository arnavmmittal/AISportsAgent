/**
 * API Client with Demo Mode Fallback
 * Automatically uses demo data when backend is unavailable
 */

import { apiClient } from './auth';
import {
  DEMO_MOOD_LOGS,
  DEMO_GOALS,
  DEMO_MESSAGES,
  simulateAIResponse,
} from './demo';
import type { MoodLog, Goal, Message } from '@sports-agent/types';

// Track if backend is available
let backendAvailable = true;
let lastCheck = 0;
const CHECK_INTERVAL = 30000; // Check every 30 seconds

async function isBackendAvailable(): Promise<boolean> {
  const now = Date.now();
  if (now - lastCheck < CHECK_INTERVAL) {
    return backendAvailable;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

    const response = await fetch(
      `${apiClient['baseURL']}/api/auth/mobile/login`,
      {
        method: 'OPTIONS', // Just check if endpoint exists
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);
    backendAvailable = response.ok || response.status === 405; // 405 = method not allowed but endpoint exists
    lastCheck = now;
    return backendAvailable;
  } catch (error) {
    console.log('📴 Backend unavailable, using demo mode');
    backendAvailable = false;
    lastCheck = now;
    return false;
  }
}

// Mood Logs with Fallback
export async function getMoodLogs(userId: string, limit?: number): Promise<MoodLog[]> {
  try {
    if (!(await isBackendAvailable())) {
      console.log('Using demo mood logs');
      return DEMO_MOOD_LOGS.slice(0, limit || 7);
    }

    const logs = await apiClient.getMoodLogs(userId, limit);
    return logs;
  } catch (error) {
    console.log('Mood logs API failed, using demo data');
    backendAvailable = false;
    return DEMO_MOOD_LOGS.slice(0, limit || 7);
  }
}

export async function createMoodLog(
  athleteId: string,
  data: {
    mood: number;
    confidence: number;
    stress: number;
    energy?: number;
    sleep?: number;
    notes?: string;
  }
): Promise<MoodLog> {
  try {
    if (!(await isBackendAvailable())) {
      console.log('Creating demo mood log');
      const demoLog: MoodLog = {
        id: `demo-${Date.now()}`,
        athleteId,
        date: new Date(),
        ...data,
        energy: data.energy || 5,
        sleep: data.sleep || 7,
        notes: data.notes || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return demoLog;
    }

    const log = await apiClient.createMoodLog(athleteId, data);
    return log;
  } catch (error) {
    console.log('Create mood log failed, using demo mode');
    backendAvailable = false;
    const demoLog: MoodLog = {
      id: `demo-${Date.now()}`,
      athleteId,
      date: new Date(),
      ...data,
      energy: data.energy || 5,
      sleep: data.sleep || 7,
      notes: data.notes || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return demoLog;
  }
}

// Goals with Fallback
export async function getGoals(userId: string): Promise<Goal[]> {
  try {
    if (!(await isBackendAvailable())) {
      console.log('Using demo goals');
      return DEMO_GOALS;
    }

    const goals = await apiClient.getGoals(userId);
    return goals;
  } catch (error) {
    console.log('Goals API failed, using demo data');
    backendAvailable = false;
    return DEMO_GOALS;
  }
}

// Chat with Fallback
export async function sendChatMessage(params: {
  session_id: string;
  message: string;
  athlete_id: string;
}): Promise<Response> {
  try {
    if (!(await isBackendAvailable())) {
      console.log('Using demo chat mode');
      return createDemoResponse(params.message);
    }

    const response = await apiClient.sendMessage(params);
    if (!response.ok) {
      throw new Error('Chat API failed');
    }
    return response;
  } catch (error) {
    console.log('Chat API failed, using demo mode');
    backendAvailable = false;
    return createDemoResponse(params.message);
  }
}

// Create a fake SSE response for demo mode
function createDemoResponse(userMessage: string): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Simulate typing delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Get AI response
      const response = await simulateAIResponse(userMessage);

      // Stream it character by character for realistic effect
      for (let i = 0; i < response.length; i++) {
        const char = response[i];
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: 'content', data: char })}\n\n`
          )
        );

        // Add slight delay for typing effect
        await new Promise((resolve) => setTimeout(resolve, 20));
      }

      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// Get backend status
export function getBackendStatus(): { available: boolean; mode: string } {
  return {
    available: backendAvailable,
    mode: backendAvailable ? 'online' : 'demo',
  };
}

// Force check backend
export async function checkBackend(): Promise<boolean> {
  lastCheck = 0; // Force recheck
  return await isBackendAvailable();
}
