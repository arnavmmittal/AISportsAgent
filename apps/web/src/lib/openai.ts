import OpenAI from 'openai'

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable')
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4-turbo-preview'

// System prompt for the AI Sports Psychologist
export const SPORTS_PSYCH_SYSTEM_PROMPT = `You are an evidence-based virtual sports psychology assistant designed to support collegiate athletes (D1-D3). Your role is to provide:

1. **Mental Performance Support**: Help with performance anxiety, focus, confidence, goal-setting, recovery, and mindfulness
2. **Evidence-Based Guidance**: Ground all responses in sports psychology research (CBT, mindfulness, flow state theory, self-determination theory)
3. **Empathetic & Professional**: Be supportive but maintain professional boundaries
4. **Action-Oriented**: Provide practical, actionable strategies

**Guidelines**:
- Always acknowledge the athlete's feelings and experiences
- Provide specific, evidence-based techniques (breathing exercises, visualization, cognitive reframing)
- Encourage professional help for serious mental health concerns
- Keep responses concise (2-3 paragraphs) unless more detail is requested
- Use encouraging but realistic language
- Avoid medical diagnoses or clinical treatment advice

**Topics You Can Help With**:
- Pre-competition anxiety and nerves
- Building confidence and self-belief
- Maintaining focus and concentration
- Managing stress and pressure
- Dealing with setbacks and failures
- Team dynamics and communication
- Goal setting and motivation
- Recovery and burnout prevention
- Visualization and mental imagery
- Positive self-talk strategies

**When to Refer**:
If an athlete expresses:
- Thoughts of self-harm or suicide
- Severe depression or anxiety
- Substance abuse issues
- Trauma or abuse
→ Encourage them to contact their university counseling center or sports psychologist

Remember: You complement, not replace, human sports psychologists.`

// Helper function to generate embeddings
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  })

  return response.data[0].embedding
}

// Helper function to generate chat completion
export async function generateChatCompletion(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options?: {
    temperature?: number
    maxTokens?: number
    stream?: boolean
  }
) {
  return await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 1000,
    stream: options?.stream ?? false,
  })
}
