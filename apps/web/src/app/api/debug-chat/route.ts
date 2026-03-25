/**
 * Debug endpoint to test LLM configuration
 * TEMPORARY - Remove after debugging
 */

import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { allTools } from '@/agents/langgraph/tools';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    environment: {},
    openai: { status: 'not_tested' },
    anthropic: { status: 'not_tested' },
    anthropicWithTools: { status: 'not_tested' },
  };

  // Check environment variables
  results.environment = {
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    openAIKeyLength: process.env.OPENAI_API_KEY?.length || 0,
    openAIKeyPrefix: process.env.OPENAI_API_KEY?.substring(0, 7) || 'missing',
    hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
    anthropicKeyLength: process.env.ANTHROPIC_API_KEY?.length || 0,
    anthropicKeyPrefix: process.env.ANTHROPIC_API_KEY?.substring(0, 7) || 'missing',
    openAIModel: process.env.OPENAI_MODEL || 'not set',
    anthropicModel: process.env.ANTHROPIC_MODEL || 'not set',
    toolCount: allTools.length,
  };

  // Test OpenAI
  try {
    const openai = new ChatOpenAI({
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      maxTokens: 50,
    });
    const response = await openai.invoke([{ role: 'user', content: 'Say "hello" only.' }]);
    results.openai = {
      status: 'success',
      response: typeof response.content === 'string' ? response.content.substring(0, 100) : 'non-string response',
    };
  } catch (error) {
    results.openai = {
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
      errorType: error instanceof Error ? error.constructor.name : typeof error,
    };
  }

  // Test Anthropic (simple)
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const anthropic = new ChatAnthropic({
        anthropicApiKey: process.env.ANTHROPIC_API_KEY,
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
        maxTokens: 50,
      });
      const response = await anthropic.invoke([{ role: 'user', content: 'Say "hello" only.' }]);

      // Handle content that might be array (Anthropic format)
      const content = typeof response.content === 'string'
        ? response.content
        : Array.isArray(response.content)
          ? response.content.map((c: { text?: string }) => c.text || '').join('')
          : 'unknown format';

      results.anthropic = {
        status: 'success',
        response: content.substring(0, 100),
      };
    } catch (error) {
      results.anthropic = {
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
        errorType: error instanceof Error ? error.constructor.name : typeof error,
      };
    }

    // Test Anthropic WITH tools (like production)
    try {
      const anthropic = new ChatAnthropic({
        anthropicApiKey: process.env.ANTHROPIC_API_KEY,
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
        maxTokens: 100,
      });
      const modelWithTools = anthropic.bindTools(allTools);
      const response = await modelWithTools.invoke([
        { role: 'user', content: 'Say "hello" - do not use any tools.' }
      ]);

      // Handle content that might be array (Anthropic format)
      const content = typeof response.content === 'string'
        ? response.content
        : Array.isArray(response.content)
          ? response.content.map((c: { text?: string }) => c.text || '').join('')
          : 'unknown format';

      results.anthropicWithTools = {
        status: 'success',
        response: content.substring(0, 100),
        hasToolCalls: (response.tool_calls?.length || 0) > 0,
      };
    } catch (error) {
      results.anthropicWithTools = {
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        stack: error instanceof Error ? error.stack?.substring(0, 500) : undefined,
      };
    }
  } else {
    results.anthropic = { status: 'no_key' };
    results.anthropicWithTools = { status: 'no_key' };
  }

  // Test the actual LangGraph flow (if ?full=true)
  const url = req.nextUrl;
  if (url.searchParams.get('full') === 'true') {
    try {
      const { streamConversationGraph } = await import('@/agents/langgraph/graph');

      const testSessionId = `debug-${Date.now()}`;
      const testAthleteId = 'debug-athlete';
      const testUserId = 'debug-user';

      let responseContent = '';
      let eventCount = 0;
      const events: Array<{ type: string; preview?: string }> = [];

      const stream = streamConversationGraph(
        'Say hello briefly',
        testSessionId,
        testAthleteId,
        testUserId,
        null
      );

      for await (const event of stream) {
        eventCount++;
        const eventInfo: { type: string; preview?: string } = { type: event.type };

        if (event.type === 'token' && event.data?.content) {
          responseContent += event.data.content;
          eventInfo.preview = event.data.content.substring(0, 50);
        }

        events.push(eventInfo);

        // Limit events to prevent timeout
        if (eventCount > 100) break;
      }

      results.langgraphStream = {
        status: 'success',
        eventCount,
        responseLength: responseContent.length,
        responsePreview: responseContent.substring(0, 200),
        events: events.slice(0, 20),
      };
    } catch (error) {
      results.langgraphStream = {
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack?.substring(0, 500) : undefined,
      };
    }
  }

  return NextResponse.json(results);
}
