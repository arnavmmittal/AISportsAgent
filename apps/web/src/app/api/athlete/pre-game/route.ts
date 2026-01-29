/**
 * Pre-Game Session API
 *
 * Manages quick mental preparation sessions before games.
 * Athletes complete 2-minute check-ins to track and optimize mental state.
 */
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"
import { z } from "zod"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Validation schemas
const startSessionSchema = z.object({
  gameScheduleId: z.string().optional(),
  sessionType: z
    .enum([
      "QUICK_CHECKIN",
      "MENTAL_PREP",
      "VISUALIZATION",
      "ANXIETY_MANAGEMENT",
      "FOCUS_ROUTINE",
    ])
    .default("QUICK_CHECKIN"),
})

const completeSessionSchema = z.object({
  sessionId: z.string(),
  moodScore: z.number().min(1).max(10).optional(),
  confidenceScore: z.number().min(1).max(10).optional(),
  anxietyScore: z.number().min(1).max(10).optional(),
  focusScore: z.number().min(1).max(10).optional(),
  energyLevel: z.number().min(1).max(10).optional(),
  sleepQuality: z.number().min(1).max(10).optional(),
  athleteGoal: z.string().optional(),
  focusCue: z.string().optional(),
  interventionsUsed: z.array(z.string()).optional(),
  keyInsights: z.string().optional(),
  chatSessionId: z.string().optional(),
})

const postGameFeedbackSchema = z.object({
  sessionId: z.string(),
  postGameMood: z.number().min(1).max(10).optional(),
  postGameNotes: z.string().optional(),
  goalAchieved: z.boolean().optional(),
})

/**
 * GET /api/athlete/pre-game
 * Get pre-game session history and upcoming context
 */
export async function GET(request: NextRequest) {
  try {
    const { authorized, user, response } = await requireAuth(request)

    if (!authorized || !user) {
      return response || NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action") || "history"
    const limit = parseInt(searchParams.get("limit") || "10")

    if (action === "upcoming") {
      // Get the next upcoming game that needs a pre-game session
      const upcomingGame = await prisma.gameSchedule.findFirst({
        where: {
          athleteId: user.id,
          gameDate: {
            gte: new Date(),
          },
          PreGameSession: null, // No session started yet
        },
        orderBy: {
          gameDate: "asc",
        },
      })

      // Get recent pre-game sessions for context
      const recentSessions = await prisma.preGameSession.findMany({
        where: {
          athleteId: user.id,
          completedAt: { not: null },
        },
        orderBy: {
          completedAt: "desc",
        },
        take: 5,
        select: {
          moodScore: true,
          confidenceScore: true,
          anxietyScore: true,
          focusScore: true,
          interventionsUsed: true,
        },
      })

      // Calculate averages for context
      const avgScores = calculateAverageScores(recentSessions)

      // Get athlete's sport for personalized recommendations
      const athlete = await prisma.athlete.findUnique({
        where: { userId: user.id },
        select: { sport: true },
      })

      return NextResponse.json({
        upcomingGame,
        recentAverages: avgScores,
        sport: athlete?.sport,
        recommendedSessionType: getRecommendedSessionType(avgScores),
      })
    }

    // Default: Get session history
    const sessions = await prisma.preGameSession.findMany({
      where: {
        athleteId: user.id,
      },
      orderBy: {
        startedAt: "desc",
      },
      take: limit,
      include: {
        GameSchedule: {
          select: {
            opponent: true,
            gameDate: true,
            stakes: true,
            homeAway: true,
          },
        },
      },
    })

    // Calculate trends
    const trends = calculateTrends(sessions)

    return NextResponse.json({
      sessions,
      trends,
      total: sessions.length,
    })
  } catch (error) {
    console.error("Error in pre-game GET:", error)
    return NextResponse.json(
      { error: "Failed to fetch pre-game data" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/athlete/pre-game
 * Start a new pre-game session
 */
export async function POST(request: NextRequest) {
  try {
    const { authorized, user, response } = await requireAuth(request)

    if (!authorized || !user) {
      return response || NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = startSessionSchema.parse(body)

    // If game schedule provided, verify ownership
    if (validatedData.gameScheduleId) {
      const gameSchedule = await prisma.gameSchedule.findFirst({
        where: {
          id: validatedData.gameScheduleId,
          athleteId: user.id,
        },
      })

      if (!gameSchedule) {
        return NextResponse.json(
          { error: "Game schedule not found" },
          { status: 404 }
        )
      }

      // Check if session already exists
      const existingSession = await prisma.preGameSession.findFirst({
        where: {
          gameScheduleId: validatedData.gameScheduleId,
        },
      })

      if (existingSession) {
        return NextResponse.json({
          success: true,
          session: existingSession,
          resumed: true,
        })
      }
    }

    // Create new pre-game session
    const preGameSession = await prisma.preGameSession.create({
      data: {
        athleteId: user.id,
        gameScheduleId: validatedData.gameScheduleId,
        sessionType: validatedData.sessionType,
      },
    })

    return NextResponse.json({
      success: true,
      session: preGameSession,
      resumed: false,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Error starting pre-game session:", error)
    return NextResponse.json(
      { error: "Failed to start session" },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/athlete/pre-game
 * Complete a pre-game session with mental state data
 */
export async function PUT(request: NextRequest) {
  try {
    const { authorized, user, response } = await requireAuth(request)

    if (!authorized || !user) {
      return response || NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action") || "complete"

    if (action === "feedback") {
      // Post-game feedback
      const validatedData = postGameFeedbackSchema.parse(body)

      const existingSession = await prisma.preGameSession.findFirst({
        where: {
          id: validatedData.sessionId,
          athleteId: user.id,
        },
      })

      if (!existingSession) {
        return NextResponse.json(
          { error: "Session not found" },
          { status: 404 }
        )
      }

      const updatedSession = await prisma.preGameSession.update({
        where: { id: validatedData.sessionId },
        data: {
          postGameMood: validatedData.postGameMood,
          postGameNotes: validatedData.postGameNotes,
          goalAchieved: validatedData.goalAchieved,
        },
      })

      return NextResponse.json({
        success: true,
        session: updatedSession,
      })
    }

    // Default: Complete session
    const validatedData = completeSessionSchema.parse(body)

    // Verify ownership
    const existingSession = await prisma.preGameSession.findFirst({
      where: {
        id: validatedData.sessionId,
        athleteId: user.id,
      },
    })

    if (!existingSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    // Calculate duration
    const durationSeconds = Math.floor(
      (Date.now() - new Date(existingSession.startedAt).getTime()) / 1000
    )

    const updatedSession = await prisma.preGameSession.update({
      where: { id: validatedData.sessionId },
      data: {
        completedAt: new Date(),
        durationSeconds,
        moodScore: validatedData.moodScore,
        confidenceScore: validatedData.confidenceScore,
        anxietyScore: validatedData.anxietyScore,
        focusScore: validatedData.focusScore,
        energyLevel: validatedData.energyLevel,
        sleepQuality: validatedData.sleepQuality,
        athleteGoal: validatedData.athleteGoal,
        focusCue: validatedData.focusCue,
        interventionsUsed: validatedData.interventionsUsed || [],
        keyInsights: validatedData.keyInsights,
        chatSessionId: validatedData.chatSessionId,
      },
    })

    // Generate personalized recommendations based on scores
    const recommendations = generateRecommendations(validatedData)

    return NextResponse.json({
      success: true,
      session: updatedSession,
      recommendations,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Error completing pre-game session:", error)
    return NextResponse.json(
      { error: "Failed to complete session" },
      { status: 500 }
    )
  }
}

// Helper functions

function calculateAverageScores(sessions: any[]): any {
  if (sessions.length === 0) return null

  const scores = {
    mood: 0,
    confidence: 0,
    anxiety: 0,
    focus: 0,
    count: 0,
  }

  sessions.forEach((s) => {
    if (s.moodScore) {
      scores.mood += s.moodScore
      scores.count++
    }
    if (s.confidenceScore) scores.confidence += s.confidenceScore
    if (s.anxietyScore) scores.anxiety += s.anxietyScore
    if (s.focusScore) scores.focus += s.focusScore
  })

  const count = scores.count || 1
  return {
    avgMood: Math.round((scores.mood / count) * 10) / 10,
    avgConfidence: Math.round((scores.confidence / count) * 10) / 10,
    avgAnxiety: Math.round((scores.anxiety / count) * 10) / 10,
    avgFocus: Math.round((scores.focus / count) * 10) / 10,
    sessionCount: sessions.length,
  }
}

function getRecommendedSessionType(avgScores: any): string {
  if (!avgScores) return "QUICK_CHECKIN"

  // High anxiety - recommend anxiety management
  if (avgScores.avgAnxiety > 7) return "ANXIETY_MANAGEMENT"

  // Low confidence - recommend visualization
  if (avgScores.avgConfidence < 5) return "VISUALIZATION"

  // Low focus - recommend focus routine
  if (avgScores.avgFocus < 5) return "FOCUS_ROUTINE"

  // Generally good - mental prep
  if (avgScores.avgMood > 6 && avgScores.avgConfidence > 6) return "MENTAL_PREP"

  return "QUICK_CHECKIN"
}

function calculateTrends(sessions: any[]): any {
  if (sessions.length < 2) return null

  const completed = sessions.filter((s) => s.completedAt)
  if (completed.length < 2) return null

  // Compare recent 3 vs previous 3
  const recent = completed.slice(0, 3)
  const previous = completed.slice(3, 6)

  if (previous.length === 0) return null

  const recentAvg = calculateAverageScores(recent)
  const previousAvg = calculateAverageScores(previous)

  return {
    moodTrend: recentAvg.avgMood - previousAvg.avgMood,
    confidenceTrend: recentAvg.avgConfidence - previousAvg.avgConfidence,
    anxietyTrend: recentAvg.avgAnxiety - previousAvg.avgAnxiety,
    focusTrend: recentAvg.avgFocus - previousAvg.avgFocus,
    improving:
      recentAvg.avgMood > previousAvg.avgMood &&
      recentAvg.avgConfidence > previousAvg.avgConfidence,
  }
}

function generateRecommendations(data: any): string[] {
  const recommendations: string[] = []

  // Anxiety-based recommendations
  if (data.anxietyScore && data.anxietyScore > 7) {
    recommendations.push(
      "Try the 4-7-8 breathing technique: inhale for 4, hold for 7, exhale for 8"
    )
    recommendations.push(
      "Focus on what you can control - your effort, attitude, and preparation"
    )
  }

  // Confidence-based recommendations
  if (data.confidenceScore && data.confidenceScore < 5) {
    recommendations.push(
      "Recall a recent success - visualize how you felt in that moment"
    )
    recommendations.push(
      "Use your power phrase or cue word before the competition starts"
    )
  }

  // Energy-based recommendations
  if (data.energyLevel && data.energyLevel < 5) {
    recommendations.push(
      "Do some dynamic stretching to activate your body and mind"
    )
    recommendations.push(
      "Focus on your 'why' - remind yourself of your deeper motivation"
    )
  }

  // Sleep-based recommendations
  if (data.sleepQuality && data.sleepQuality < 5) {
    recommendations.push(
      "Accept that today isn't perfect - commit to competing with what you have"
    )
    recommendations.push(
      "Stay hydrated and consider a light caffeine boost if appropriate"
    )
  }

  // Focus-based recommendations
  if (data.focusScore && data.focusScore < 5) {
    recommendations.push(
      "Use a pre-performance routine to anchor your attention"
    )
    recommendations.push(
      "Set one clear intention for the first few minutes of competition"
    )
  }

  // Default if no specific issues
  if (recommendations.length === 0) {
    recommendations.push(
      "You're in a great mental state - trust your preparation"
    )
    recommendations.push("Stay present and compete one moment at a time")
  }

  return recommendations.slice(0, 3) // Return top 3 recommendations
}
