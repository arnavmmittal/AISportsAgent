/**
 * AI Goal Suggestions API
 * Uses OpenAI to generate personalized goal recommendations
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const { authorized, user, response } = await requireAuth(req);
    if (!authorized) return response;

    const { searchParams } = new URL(req.url);
    const athleteId = searchParams.get('athleteId');

    if (!athleteId) {
      return NextResponse.json(
        { error: 'Missing athleteId parameter' },
        { status: 400 }
      );
    }

    // Verify user can access this athlete's data
    if (user!.id !== athleteId && user!.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Cannot access other users\' data' },
        { status: 403 }
      );
    }

    // Get athlete data
    const athlete = await prisma.user.findUnique({
      where: { id: athleteId },
      include: {
        Athlete: true,
        Goal: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        MoodLog: {
          orderBy: { createdAt: 'desc' },
          take: 7,
        },
      },
    });

    if (!athlete || !athlete.Athlete) {
      return NextResponse.json(
        { error: 'Athlete not found' },
        { status: 404 }
      );
    }

    // Build context for AI
    const athleteProfile = {
      name: athlete.name,
      sport: athlete.Athlete.sport,
      year: athlete.Athlete.year,
      position: athlete.Athlete.teamPosition,
    };

    const recentGoals = athlete.Goal.map(g => ({
      title: g.title,
      category: g.category,
      status: g.status,
      progress: g.progress,
    }));

    const moodTrends = athlete.MoodLog.length > 0 ? {
      avgMood: athlete.MoodLog.reduce((sum, m) => sum + m.mood, 0) / athlete.MoodLog.length,
      avgConfidence: athlete.MoodLog.reduce((sum, m) => sum + m.confidence, 0) / athlete.MoodLog.length,
      avgStress: athlete.MoodLog.reduce((sum, m) => sum + m.stress, 0) / athlete.MoodLog.length,
    } : null;

    // Use OpenAI only if API key is available
    if (process.env.OPENAI_API_KEY) {
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a sports psychology expert helping collegiate athletes set effective goals. Suggest 4 specific, actionable goals based on the athlete's profile and recent data.

Each goal should be:
- Specific and measurable
- Aligned with sports psychology best practices (CBT, mindfulness, flow state, etc.)
- Personalized to the athlete's sport, level, and current state
- Categorized as PERFORMANCE, MENTAL, ACADEMIC, or PERSONAL

Return ONLY a JSON array of goals in this exact format:
[
  {
    "title": "Goal title (max 60 chars)",
    "description": "Detailed description (max 200 chars)",
    "category": "PERFORMANCE|MENTAL|ACADEMIC|PERSONAL",
    "reason": "Why this goal is recommended (max 80 chars)",
    "icon": "ionicons icon name"
  }
]`,
            },
            {
              role: 'user',
              content: `Athlete Profile:
- Name: ${athleteProfile.name}
- Sport: ${athleteProfile.sport}
- Year: ${athleteProfile.year}
- Position: ${athleteProfile.position || 'Not specified'}

Recent Goals (last 5):
${recentGoals.length > 0 ? recentGoals.map(g => `- ${g.title} (${g.category}, ${g.status}, ${g.progress}% complete)`).join('\n') : 'No goals yet'}

Recent Mood Trends (last 7 days):
${moodTrends ? `- Avg Mood: ${moodTrends.avgMood.toFixed(1)}/10
- Avg Confidence: ${moodTrends.avgConfidence.toFixed(1)}/10
- Avg Stress: ${moodTrends.avgStress.toFixed(1)}/10` : 'No mood logs yet'}

Suggest 4 personalized goals.`,
            },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        });

        const content = completion.choices[0].message.content;
        if (!content) throw new Error('No content from OpenAI');

        const suggestions = JSON.parse(content);

        return NextResponse.json({
          success: true,
          data: suggestions.map((s: any, i: number) => ({
            id: `ai_suggestion_${Date.now()}_${i}`,
            ...s,
          })),
        });
      } catch (aiError) {
        console.error('OpenAI error:', aiError);
        // Fall through to mock suggestions
      }
    }

    // Fallback: Mock suggestions if OpenAI fails or no API key
    const mockSuggestions = generateMockSuggestions(athleteProfile, moodTrends);

    return NextResponse.json({
      success: true,
      data: mockSuggestions,
      source: 'fallback',
    });
  } catch (error) {
    console.error('Error generating goal suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate goal suggestions' },
      { status: 500 }
    );
  }
}

function generateMockSuggestions(profile: any, moodTrends: any) {
  const suggestions = [
    {
      id: 'mock_1',
      title: 'Develop Pre-Game Routine',
      description: 'Create a consistent 15-minute mental preparation routine before games',
      category: 'MENTAL',
      reason: moodTrends && moodTrends.avgStress > 6
        ? 'Your stress levels are elevated before games'
        : 'Build consistency for peak performance',
      icon: 'leaf-outline',
    },
    {
      id: 'mock_2',
      title: `Improve ${profile.sport} Technique`,
      description: `Focus on one specific skill in ${profile.sport} for the next month`,
      category: 'PERFORMANCE',
      reason: 'Targeted skill improvement yields best results',
      icon: 'trophy-outline',
    },
    {
      id: 'mock_3',
      title: 'Sleep 8+ Hours',
      description: 'Get 8 hours of sleep on practice/game nights for optimal recovery',
      category: 'PERSONAL',
      reason: moodTrends && moodTrends.avgMood < 7
        ? 'Better sleep improves mood and performance'
        : 'Recovery is key to consistent performance',
      icon: 'moon-outline',
    },
    {
      id: 'mock_4',
      title: 'Maintain 3.5 GPA',
      description: 'Keep academic performance above 3.5 GPA this semester',
      category: 'ACADEMIC',
      reason: profile.year === 'SENIOR' || profile.year === 'JUNIOR'
        ? 'Stay on track for honors and career goals'
        : 'Build strong academic foundation early',
      icon: 'school-outline',
    },
  ];

  return suggestions;
}
