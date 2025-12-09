import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export interface SummaryResult {
  summary: string;
  keyThemes: string[];
  emotionalState: string;
  actionItems: string[];
}

export async function generateChatSummary(
  messages: Array<{ role: string; content: string }>
): Promise<SummaryResult> {
  // Prepare conversation for GPT-4
  const conversationText = messages
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => `${m.role === 'user' ? 'Athlete' : 'AI Coach'}: ${m.content}`)
    .join('\n\n');

  const systemPrompt = `You are an assistant helping to summarize mental performance coaching conversations between athletes and an AI sports psychology coach.

Your task is to create a concise, professional summary that:
1. Captures the main topics discussed
2. Identifies key themes and concerns
3. Assesses the athlete's emotional state
4. Suggests actionable follow-ups for the human coach

Important:
- Be respectful of athlete privacy and mental health
- Use professional, clinical language
- Focus on patterns and insights, not verbatim quotes
- Highlight any concerning mental health indicators

Respond in JSON format with these fields:
{
  "summary": "A 2-3 sentence overview of the conversation",
  "keyThemes": ["theme1", "theme2", "theme3"],
  "emotionalState": "positive" | "neutral" | "negative" | "mixed",
  "actionItems": ["action1", "action2"]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Please summarize this conversation:\n\n${conversationText}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3, // Low temperature for consistent, factual summaries
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    return {
      summary: result.summary || 'No summary available',
      keyThemes: result.keyThemes || [],
      emotionalState: result.emotionalState || 'neutral',
      actionItems: result.actionItems || [],
    };
  } catch (error) {
    console.error('Error generating chat summary:', error);
    throw new Error('Failed to generate summary');
  }
}
