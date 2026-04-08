import Anthropic from '@anthropic-ai/sdk';
import type { TeamCorrelationResult } from './performance-correlation';

const anthropic = new Anthropic();

/**
 * Generate plain-English performance insights from correlation data.
 */
export async function generatePerformanceInsights(
  teamData: TeamCorrelationResult
): Promise<string[]> {
  if (teamData.totalGames < 3) {
    return [
      'Not enough game data yet. Log at least 3 game outcomes to see insights.',
    ];
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: `You are a sports performance analyst. Generate 3-5 concise, actionable insights for a coach based on this correlation data between mental readiness and game performance. Use specific numbers. Be direct and practical.

Correlation Data (factor → performance rating):
${teamData.correlations.map((c) => `- ${c.factor}: r=${c.correlation} (${c.strength}, n=${c.sampleSize})`).join('\n')}

Win Rate by Readiness Level:
- High readiness (>=75): ${teamData.winRateByReadiness.high.rate}% (${teamData.winRateByReadiness.high.count} games)
- Medium readiness (60-74): ${teamData.winRateByReadiness.medium.rate}% (${teamData.winRateByReadiness.medium.count} games)
- Low readiness (<60): ${teamData.winRateByReadiness.low.rate}% (${teamData.winRateByReadiness.low.count} games)

Total games analyzed: ${teamData.totalGames}

Return a JSON array of insight strings. Each insight should be one actionable sentence.`,
        },
      ],
    });

    const text =
      response.content[0].type === 'text' ? response.content[0].text : '';
    // Extract JSON array from response
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      return JSON.parse(match[0]);
    }
    return [text.trim()];
  } catch (error) {
    console.error('[INSIGHTS] Failed to generate insights:', error);
    return ['Unable to generate insights at this time.'];
  }
}
