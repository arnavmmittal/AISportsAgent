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
import type { MoodLog, Goal, Message } from '@flow-sports-coach/types';

// Track if backend is available
let backendAvailable = true;
let lastCheck = 0;
const CHECK_INTERVAL = 30000; // Check every 30 seconds

async function isBackendAvailable(): Promise<boolean> {
  const now = Date.now();
  if (now - lastCheck < CHECK_INTERVAL) {
    console.log(`🔄 Using cached backend status: ${backendAvailable ? '✅ ONLINE' : '📴 OFFLINE'}`);
    return backendAvailable;
  }

  const checkUrl = `${apiClient['baseURL']}/api/auth/mobile/login`;
  console.log(`🔍 Checking backend availability at: ${checkUrl}`);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

    const response = await fetch(checkUrl, {
      method: 'OPTIONS', // Just check if endpoint exists
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    backendAvailable = response.ok || response.status === 405; // 405 = method not allowed but endpoint exists
    lastCheck = now;

    console.log(`✅ Backend check result: ${backendAvailable ? 'ONLINE' : 'OFFLINE'} (status: ${response.status})`);
    return backendAvailable;
  } catch (error: any) {
    console.log('📴 Backend unavailable:', error.message || error);
    backendAvailable = false;
    lastCheck = now;
    return false;
  }
}

// Mood Logs with Fallback
export async function getMoodLogs(userId: string, limit?: number): Promise<MoodLog[]> {
  console.log(`📊 Getting mood logs for user: ${userId}, limit: ${limit}`);

  try {
    if (!(await isBackendAvailable())) {
      console.log('⚠️ Backend offline - using demo mood logs');
      return DEMO_MOOD_LOGS.slice(0, limit || 7);
    }

    console.log(`🌐 Calling apiClient.getMoodLogs() at ${apiClient['baseURL']}`);
    const logs = await apiClient.getMoodLogs(userId, limit);
    console.log(`✅ Successfully fetched ${logs.length} mood logs from backend`);
    return logs;
  } catch (error: any) {
    console.error('❌ Mood logs API failed:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.status,
      name: error.name,
      stack: error.stack?.slice(0, 200)
    });
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
        notes: data.notes,
        createdAt: new Date(),
      };
      return demoLog;
    }

    const log = await apiClient.createMoodLog({
      athleteId,
      date: new Date(),
      ...data,
      energy: data.energy || 5,
      sleep: data.sleep || 7,
    });
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
      notes: data.notes,
      createdAt: new Date(),
    };
    return demoLog;
  }
}

// Goals with Fallback
export async function getGoals(userId: string): Promise<Goal[]> {
  console.log(`🎯 Getting goals for user: ${userId}`);

  try {
    if (!(await isBackendAvailable())) {
      console.log('⚠️ Backend offline - using demo goals');
      return DEMO_GOALS;
    }

    console.log(`🌐 Calling apiClient.getGoals() at ${apiClient['baseURL']}`);
    const goals = await apiClient.getGoals(userId);
    console.log(`✅ Successfully fetched ${goals.length} goals from backend`);
    return goals;
  } catch (error: any) {
    console.error('❌ Goals API failed:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.status,
      name: error.name,
      stack: error.stack?.slice(0, 200)
    });
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
  console.log(`💬 Sending chat message for athlete: ${params.athlete_id}`);

  try {
    if (!(await isBackendAvailable())) {
      console.log('⚠️ Backend offline - using demo chat mode');
      return await createDemoResponse(params.message);
    }

    console.log(`🌐 Calling apiClient.sendMessage() at ${apiClient['baseURL']}`);
    const response = await apiClient.sendMessage(params);
    if (!response.ok) {
      console.error(`❌ Chat API returned error status: ${response.status}`);
      throw new Error(`Chat API failed with status ${response.status}`);
    }
    console.log('✅ Successfully sent chat message to backend');
    return response;
  } catch (error: any) {
    console.error('❌ Chat API failed:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.status,
      name: error.name,
    });
    backendAvailable = false;
    return await createDemoResponse(params.message);
  }
}

// Create a fake SSE response for demo mode (React Native compatible)
async function createDemoResponse(userMessage: string): Promise<Response> {
  // Get AI response
  const aiResponse = await simulateAIResponse(userMessage);

  // Create SSE-formatted response body with all events
  // We'll send it all at once, and the client will process it
  const events: string[] = [];

  // Send session event (matches web backend format)
  events.push(
    `data: ${JSON.stringify({
      type: 'session',
      data: { sessionId: `demo_session_${Date.now()}` },
    })}\n\n`
  );

  // Send each character as a separate token event (matches OpenAI streaming format)
  for (const char of aiResponse) {
    events.push(`data: ${JSON.stringify({ type: 'token', data: { content: char } })}\n\n`);
  }

  // Send done event
  events.push(`data: ${JSON.stringify({ type: 'done' })}\n\n`);

  const fullBody = events.join('');

  // Create a Response with the full body
  // React Native's fetch will handle this better than ReadableStream
  return new Response(fullBody, {
    status: 200,
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
