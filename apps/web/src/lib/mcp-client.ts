/**
 * MCP Server Client
 *
 * DEPRECATION NOTICE:
 * The Python MCP server has been deprecated in favor of Vercel-only deployment.
 * - Voice functions now use local Next.js API routes (/api/voice/*)
 * - Chat uses LangGraph agents directly in Next.js
 * - Analytics use TypeScript algorithms in /lib/analytics
 *
 * MCP server code is archived in services/_deprecated/mcp-server
 *
 * Functions that still require MCP_SERVER_URL:
 * - orchestratorChat, classifyIntent, getSessionContext (use LangGraph instead)
 * - queryKnowledge, getFrameworks (use KnowledgeAgent instead)
 * - predictRisk, detectSlump, computeCorrelations (use /lib/analytics instead)
 *
 * Functions that work without MCP server:
 * - synthesizeSpeech, transcribeAudio, getVoices, getVoiceStatus (use local routes)
 */

// ===== Chat Types =====
interface MCPChatRequest {
  session_id: string;
  message: string;
  athlete_id: string;
  stream?: boolean;
}

interface MCPChatResponse {
  session_id: string;
  message: string;
  timestamp: string;
  crisis_check?: {
    final_risk_level: string;
    severity?: string;
    indicators?: string[];
  };
}

// ===== Orchestrator Types =====
export interface OrchestratorChatRequest {
  message: string;
  session_id: string;
  athlete_id: string;
  user_role?: 'ATHLETE' | 'COACH' | 'ADMIN';
  sport?: string;
}

export interface OrchestratorChatResponse {
  content: string;
  agent: string;
  intent: string;
  phase: string;
  crisis_detected: boolean;
  knowledge_sources: Array<{ title?: string; content?: string }>;
  metadata: Record<string, unknown>;
}

export interface IntentClassificationRequest {
  message: string;
  conversation_history?: Array<{ role: string; content: string }>;
  user_role?: string;
}

export interface SessionContext {
  session_id: string;
  athlete_id: string;
  current_phase: string;
  topics: string[];
  emotional_state: {
    primary_emotion: string;
    intensity: number;
    trend: string;
  };
  active_agent: string;
  active_framework?: string;
  sport?: string;
  message_count: number;
}

// ===== Knowledge Types =====
export interface KnowledgeQueryRequest {
  query: string;
  top_k?: number;
  filter_sport?: string;
  filter_framework?: string;
  rerank?: boolean;
}

export interface KnowledgeQueryResponse {
  query: string;
  context: string;
  sources: Array<{
    id: string;
    title: string;
    content: string;
    score: number;
    metadata: Record<string, unknown>;
  }>;
  reranked: boolean;
}

// ===== Predictions Types =====
export interface PredictionRiskRequest {
  athlete_id: string;
  features?: Record<string, number>;
}

export interface PredictionRiskResponse {
  athlete_id: string;
  risk_score: number;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  factors: Array<{
    feature: string;
    contribution: number;
    direction: string;
  }>;
  recommendations: string[];
  timestamp: string;
}

export interface SlumpPattern {
  type: string;
  description: string;
  severity: string;
  metrics_affected: string[];
  started_at?: string;
}

export interface SlumpDetectionResponse {
  athlete_id: string;
  in_slump: boolean;
  patterns: SlumpPattern[];
  recommendations: string[];
}

export interface CorrelationResult {
  metric_pair: string;
  correlation: number;
  p_value: number;
  significance: string;
  interpretation: string;
}

export interface InterventionRecommendation {
  intervention_id: string;
  name: string;
  description: string;
  evidence_level: string;
  priority: number;
  estimated_duration: string;
  protocol?: Record<string, unknown>;
}

// ===== Voice Types =====
export interface VoiceSynthesizeRequest {
  text: string;
  voice_id?: string;
  emotional_context?: 'supportive' | 'calm' | 'encouraging' | 'professional';
}

export interface VoiceTranscribeRequest {
  audio: Blob;
  language?: string;
  detect_emotion?: boolean;
}

/**
 * Get MCP server URL from environment
 */
function getMCPServerURL(): string {
  const url = process.env.MCP_SERVER_URL || process.env.NEXT_PUBLIC_MCP_SERVER_URL;

  if (!url) {
    throw new Error('MCP_SERVER_URL not configured');
  }

  return url;
}

/**
 * Verify MCP server is healthy
 */
export async function checkMCPHealth(): Promise<boolean> {
  try {
    const url = getMCPServerURL();
    const response = await fetch(`${url}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      console.error('[MCP Client] Health check failed:', response.status);
      return false;
    }

    const data = await response.json();
    console.log('[MCP Client] Health check passed:', data);
    return data.status === 'healthy';
  } catch (error) {
    console.error('[MCP Client] Health check error:', error);
    return false;
  }
}

/**
 * Send chat message to MCP server (non-streaming)
 */
export async function sendChatMessage(
  request: MCPChatRequest
): Promise<MCPChatResponse> {
  const url = getMCPServerURL();

  const response = await fetch(`${url}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Add service authentication token if configured
      ...(process.env.MCP_SERVICE_TOKEN && {
        'X-Service-Token': process.env.MCP_SERVICE_TOKEN,
      }),
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`MCP server error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Stream chat message from MCP server
 * Returns a ReadableStream for server-sent events
 */
export async function streamChatMessage(
  request: MCPChatRequest
): Promise<Response> {
  const url = getMCPServerURL();

  const response = await fetch(`${url}/api/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Add service authentication token if configured
      ...(process.env.MCP_SERVICE_TOKEN && {
        'X-Service-Token': process.env.MCP_SERVICE_TOKEN,
      }),
    },
    body: JSON.stringify({
      ...request,
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`MCP server error: ${response.status} - ${error}`);
  }

  return response;
}

/**
 * Parse SSE (Server-Sent Events) stream from MCP server
 * Converts the stream into a format compatible with Next.js streaming
 */
export async function* parseSSEStream(
  response: Response
): AsyncGenerator<{ type: string; data: any }> {
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    throw new Error('Response body is not readable');
  }

  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process complete SSE messages
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || ''; // Keep incomplete message in buffer

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.substring(6); // Remove 'data: ' prefix

          if (data === '[DONE]') {
            return;
          }

          try {
            const parsed = JSON.parse(data);
            yield parsed;
          } catch (e) {
            console.error('[MCP Client] Failed to parse SSE data:', e, data);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// ==========================================
// ORCHESTRATOR API
// ==========================================

/**
 * Send message through the orchestrator (auto-routes to appropriate agent)
 */
export async function orchestratorChat(
  request: OrchestratorChatRequest
): Promise<OrchestratorChatResponse> {
  const url = getMCPServerURL();

  const response = await fetch(`${url}/api/orchestrator/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.MCP_SERVICE_TOKEN && {
        'X-Service-Token': process.env.MCP_SERVICE_TOKEN,
      }),
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Orchestrator error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Classify intent without generating a response
 */
export async function classifyIntent(
  request: IntentClassificationRequest
): Promise<{
  primary_intent: string;
  confidence: number;
  secondary_intents: Array<{ intent: string; confidence: number }>;
  requires_crisis_check: boolean;
  context_hints: Record<string, string>;
}> {
  const url = getMCPServerURL();

  const response = await fetch(`${url}/api/orchestrator/classify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Intent classification error: ${response.status}`);
  }

  return response.json();
}

/**
 * Get conversation context for a session
 */
export async function getSessionContext(
  sessionId: string
): Promise<SessionContext> {
  const url = getMCPServerURL();

  const response = await fetch(`${url}/api/orchestrator/context/${sessionId}`);

  if (!response.ok) {
    throw new Error(`Get context error: ${response.status}`);
  }

  return response.json();
}

/**
 * Get orchestrator status
 */
export async function getOrchestratorStatus(): Promise<{
  status: string;
  active_sessions: number;
  available_intents: string[];
  features: Record<string, boolean>;
}> {
  const url = getMCPServerURL();

  const response = await fetch(`${url}/api/orchestrator/status`);

  if (!response.ok) {
    throw new Error(`Orchestrator status error: ${response.status}`);
  }

  return response.json();
}

// ==========================================
// KNOWLEDGE BASE API
// ==========================================

/**
 * Query the knowledge base with RAG
 */
export async function queryKnowledge(
  request: KnowledgeQueryRequest
): Promise<KnowledgeQueryResponse> {
  const url = getMCPServerURL();

  const response = await fetch(`${url}/api/knowledge/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Knowledge query error: ${response.status}`);
  }

  return response.json();
}

/**
 * Get available sports psychology frameworks
 */
export async function getFrameworks(): Promise<{
  frameworks: Array<{
    id: string;
    name: string;
    description: string;
    applications: string[];
  }>;
}> {
  const url = getMCPServerURL();

  const response = await fetch(`${url}/api/knowledge/frameworks`);

  if (!response.ok) {
    throw new Error(`Get frameworks error: ${response.status}`);
  }

  return response.json();
}

/**
 * Get knowledge base status
 */
export async function getKnowledgeStatus(): Promise<{
  status: string;
  document_count: number;
  collection_name: string;
}> {
  const url = getMCPServerURL();

  const response = await fetch(`${url}/api/knowledge/status`);

  if (!response.ok) {
    throw new Error(`Knowledge status error: ${response.status}`);
  }

  return response.json();
}

// ==========================================
// ML PREDICTIONS API
// ==========================================

/**
 * Get performance risk prediction for an athlete
 */
export async function predictRisk(
  request: PredictionRiskRequest
): Promise<PredictionRiskResponse> {
  const url = getMCPServerURL();

  const response = await fetch(`${url}/api/predictions/risk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Risk prediction error: ${response.status}`);
  }

  return response.json();
}

/**
 * Detect slump patterns for an athlete
 */
export async function detectSlump(
  athleteId: string,
  metrics: Record<string, number[]>
): Promise<SlumpDetectionResponse> {
  const url = getMCPServerURL();

  const response = await fetch(`${url}/api/predictions/slump`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ athlete_id: athleteId, metrics }),
  });

  if (!response.ok) {
    throw new Error(`Slump detection error: ${response.status}`);
  }

  return response.json();
}

/**
 * Compute correlations between metrics
 */
export async function computeCorrelations(
  athleteId: string,
  metrics: Record<string, number[]>
): Promise<{
  athlete_id: string;
  correlations: CorrelationResult[];
  insights: string[];
}> {
  const url = getMCPServerURL();

  const response = await fetch(`${url}/api/predictions/correlations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ athlete_id: athleteId, metrics }),
  });

  if (!response.ok) {
    throw new Error(`Correlation error: ${response.status}`);
  }

  return response.json();
}

/**
 * Get intervention recommendations
 */
export async function getInterventions(
  athleteId: string,
  riskFactors: string[],
  emotionalState?: string
): Promise<{
  athlete_id: string;
  recommendations: InterventionRecommendation[];
}> {
  const url = getMCPServerURL();

  const response = await fetch(`${url}/api/predictions/interventions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      athlete_id: athleteId,
      risk_factors: riskFactors,
      emotional_state: emotionalState,
    }),
  });

  if (!response.ok) {
    throw new Error(`Interventions error: ${response.status}`);
  }

  return response.json();
}

/**
 * Get prediction status
 */
export async function getPredictionStatus(): Promise<{
  status: string;
  model_trained: boolean;
  features_available: string[];
}> {
  const url = getMCPServerURL();

  const response = await fetch(`${url}/api/predictions/status`);

  if (!response.ok) {
    throw new Error(`Prediction status error: ${response.status}`);
  }

  return response.json();
}

// ==========================================
// VOICE API
// ==========================================
// Voice functions now use local API routes instead of MCP server.
// Import from '@/lib/voice' for full voice functionality.

/**
 * Synthesize text to speech
 * Uses local /api/voice/synthesize route (ElevenLabs)
 */
export async function synthesizeSpeech(
  request: VoiceSynthesizeRequest
): Promise<Blob> {
  const response = await fetch('/api/voice/synthesize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Voice synthesis error: ${response.status}`);
  }

  return response.blob();
}

/**
 * Transcribe audio to text
 * Uses local /api/voice/transcribe route (OpenAI Whisper)
 */
export async function transcribeAudio(
  audio: Blob,
  detectEmotion: boolean = true
): Promise<{
  text: string;
  confidence: number;
  language?: string;
  emotion?: {
    detected: string;
    confidence: number;
  };
}> {
  const formData = new FormData();
  formData.append('file', audio, 'audio.webm');
  formData.append('detect_emotion', String(detectEmotion));

  const response = await fetch('/api/voice/transcribe', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Transcription error: ${response.status}`);
  }

  return response.json();
}

/**
 * Get available voices
 * Uses local /api/voice/voices route
 */
export async function getVoices(): Promise<{
  voices: Array<{
    voice_id: string;
    name: string;
    description: string;
    preview_url?: string;
  }>;
}> {
  const response = await fetch('/api/voice/voices');

  if (!response.ok) {
    throw new Error(`Get voices error: ${response.status}`);
  }

  return response.json();
}

/**
 * Get voice service status
 * Uses local /api/voice/status route
 */
export async function getVoiceStatus(): Promise<{
  status: string;
  tts_provider: string;
  stt_provider: string;
  elevenlabs_available: boolean;
  deepgram_available: boolean;
}> {
  const response = await fetch('/api/voice/status');

  if (!response.ok) {
    throw new Error(`Voice status error: ${response.status}`);
  }

  // Transform response to match expected interface
  const data = await response.json();
  return {
    status: data.status,
    tts_provider: data.tts?.provider || 'elevenlabs',
    stt_provider: data.stt?.provider || 'openai-whisper',
    elevenlabs_available: data.tts?.available || false,
    deepgram_available: false, // We use Whisper now, not Deepgram
  };
}
