/**
 * MCP Server Client
 *
 * Handles communication between Next.js and the Python MCP Server.
 * The MCP server runs separately and provides AI agent orchestration.
 */

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
