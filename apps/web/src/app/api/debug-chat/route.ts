/**
 * Debug endpoint to test LLM configuration
 * TEMPORARY - Remove after debugging
 */

import { NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';

export const dynamic = 'force-dynamic';

export async function GET() {
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    environment: {},
    openai: { status: 'not_tested' },
    anthropic: { status: 'not_tested' },
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

  // Test Anthropic
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
  } else {
    results.anthropic = { status: 'no_key' };
  }

  return NextResponse.json(results);
}
