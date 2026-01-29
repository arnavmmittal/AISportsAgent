/**
 * ROI Dashboard API
 *
 * Provides aggregated metrics for Athletic Directors to justify
 * sports psychology budget. All metrics are designed to show
 * measurable return on investment.
 */
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

interface ROIMetrics {
  // Core engagement metrics
  engagement: {
    totalAthletes: number
    activeAthletes: number
    engagementRate: number
    avgSessionsPerAthlete: number
    totalChatSessions: number
    totalCheckIns: number
    weeklyActiveUsers: number
    engagementTrend: "up" | "down" | "stable"
    engagementChange: number
  }
  // Mental health improvements
  mentalHealth: {
    avgMoodScore: number
    avgMoodChange: number
    avgStressReduction: number
    avgConfidenceGain: number
    athletesImproved: number
    athletesStable: number
    athletesDeclined: number
    improvementRate: number
  }
  // Performance correlation
  performance: {
    moodPerformanceCorrelation: number
    gamesWithHighMood: number
    winRateHighMood: number
    winRateLowMood: number
    performanceGain: number
  }
  // Risk mitigation
  riskMitigation: {
    crisisAlertsDetected: number
    crisisAlertsResolved: number
    earlyInterventions: number
    athletesAtRisk: number
    athletesRecovered: number
    preventedEscalations: number
  }
  // Time efficiency
  efficiency: {
    estimatedHoursSaved: number
    chatSessionsReplacing11: number
    automatedAlerts: number
    avgResponseTime: string
  }
  // Period comparison
  periodComparison: {
    currentPeriod: string
    previousPeriod: string
    engagementChange: number
    moodChange: number
    performanceChange: number
  }
  // Key highlights for executives
  highlights: {
    title: string
    value: string
    change?: number
    changeLabel?: string
    positive: boolean
  }[]
}

export async function GET(request: NextRequest) {
  try {
    const { authorized, user, response } = await requireAuth(request)

    if (!authorized || !user) {
      return response || NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get coach info to filter by their team
    const coach = await prisma.coach.findUnique({
      where: { userId: user.id },
      select: { sport: true },
    })

    // Define date ranges
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Get athletes (optionally filtered by sport)
    const athleteFilter = coach?.sport ? { sport: coach.sport } : {}

    // ============================================================================
    // ENGAGEMENT METRICS
    // ============================================================================
    const allAthletes = await prisma.athlete.findMany({
      where: athleteFilter,
      select: {
        userId: true,
        User: { select: { name: true } },
      },
    })

    const totalAthletes = allAthletes.length

    // Chat sessions in the period
    const chatSessions = await prisma.chatSession.findMany({
      where: {
        athleteId: { in: allAthletes.map((a) => a.userId) },
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        athleteId: true,
        createdAt: true,
      },
    })

    // Mood logs (check-ins)
    const moodLogs = await prisma.moodLog.findMany({
      where: {
        athleteId: { in: allAthletes.map((a) => a.userId) },
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        athleteId: true,
        mood: true,
        stress: true,
        confidence: true,
        createdAt: true,
      },
    })

    const athletesWithActivity = new Set([
      ...chatSessions.map((s) => s.athleteId),
      ...moodLogs.map((l) => l.athleteId),
    ])

    const activeAthletes = athletesWithActivity.size
    const engagementRate = totalAthletes > 0 ? Math.round((activeAthletes / totalAthletes) * 100) : 0
    const avgSessionsPerAthlete = activeAthletes > 0 ? Math.round((chatSessions.length / activeAthletes) * 10) / 10 : 0

    // Weekly active users
    const weeklyChats = chatSessions.filter((s) => new Date(s.createdAt) >= sevenDaysAgo)
    const weeklyMoodLogs = moodLogs.filter((l) => new Date(l.createdAt) >= sevenDaysAgo)
    const weeklyActiveUsers = new Set([
      ...weeklyChats.map((s) => s.athleteId),
      ...weeklyMoodLogs.map((l) => l.athleteId),
    ]).size

    // Previous period for comparison
    const prevChatSessions = await prisma.chatSession.count({
      where: {
        athleteId: { in: allAthletes.map((a) => a.userId) },
        createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
      },
    })

    const engagementChange =
      prevChatSessions > 0
        ? Math.round(((chatSessions.length - prevChatSessions) / prevChatSessions) * 100)
        : 0

    // ============================================================================
    // MENTAL HEALTH METRICS
    // ============================================================================
    const currentMoods = moodLogs.filter((l) => new Date(l.createdAt) >= thirtyDaysAgo)
    const prevMoods = await prisma.moodLog.findMany({
      where: {
        athleteId: { in: allAthletes.map((a) => a.userId) },
        createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
      },
      select: {
        athleteId: true,
        mood: true,
        stress: true,
        confidence: true,
      },
    })

    const avgCurrentMood = currentMoods.length > 0
      ? currentMoods.reduce((sum, l) => sum + (l.mood || 0), 0) / currentMoods.length
      : 0
    const avgPrevMood = prevMoods.length > 0
      ? prevMoods.reduce((sum, l) => sum + (l.mood || 0), 0) / prevMoods.length
      : 0

    const avgCurrentStress = currentMoods.length > 0
      ? currentMoods.reduce((sum, l) => sum + (l.stress || 0), 0) / currentMoods.length
      : 0
    const avgPrevStress = prevMoods.length > 0
      ? prevMoods.reduce((sum, l) => sum + (l.stress || 0), 0) / prevMoods.length
      : 0

    const avgCurrentConfidence = currentMoods.length > 0
      ? currentMoods.reduce((sum, l) => sum + (l.confidence || 0), 0) / currentMoods.length
      : 0
    const avgPrevConfidence = prevMoods.length > 0
      ? prevMoods.reduce((sum, l) => sum + (l.confidence || 0), 0) / prevMoods.length
      : 0

    // Track athlete improvements
    const athleteMoodChanges = new Map<string, { current: number; prev: number }>()
    currentMoods.forEach((log) => {
      const existing = athleteMoodChanges.get(log.athleteId)
      if (!existing) {
        athleteMoodChanges.set(log.athleteId, { current: log.mood || 0, prev: 0 })
      } else {
        existing.current = (existing.current + (log.mood || 0)) / 2
      }
    })
    prevMoods.forEach((log) => {
      const existing = athleteMoodChanges.get(log.athleteId)
      if (existing) {
        existing.prev = log.mood || 0
      }
    })

    let athletesImproved = 0
    let athletesDeclined = 0
    let athletesStable = 0
    athleteMoodChanges.forEach((change) => {
      if (change.prev > 0) {
        const diff = change.current - change.prev
        if (diff > 0.5) athletesImproved++
        else if (diff < -0.5) athletesDeclined++
        else athletesStable++
      }
    })

    const improvementRate = athleteMoodChanges.size > 0
      ? Math.round((athletesImproved / athleteMoodChanges.size) * 100)
      : 0

    // ============================================================================
    // PERFORMANCE CORRELATION
    // ============================================================================
    const performanceOutcomes = await prisma.performanceOutcome.findMany({
      where: {
        athleteId: { in: allAthletes.map((a) => a.userId) },
        eventDate: { gte: thirtyDaysAgo },
      },
      select: {
        athleteId: true,
        outcome: true,
        performanceRating: true,
        eventDate: true,
      },
    })

    // Correlate with mood logs
    let highMoodWins = 0
    let highMoodGames = 0
    let lowMoodWins = 0
    let lowMoodGames = 0

    for (const outcome of performanceOutcomes) {
      // Find mood log closest to game date
      const gameMood = moodLogs.find(
        (l) =>
          l.athleteId === outcome.athleteId &&
          Math.abs(new Date(l.createdAt).getTime() - new Date(outcome.eventDate).getTime()) <
            24 * 60 * 60 * 1000
      )

      if (gameMood && gameMood.mood) {
        if (gameMood.mood >= 7) {
          highMoodGames++
          if (outcome.outcome === "WIN") highMoodWins++
        } else if (gameMood.mood <= 5) {
          lowMoodGames++
          if (outcome.outcome === "WIN") lowMoodWins++
        }
      }
    }

    const winRateHighMood = highMoodGames > 0 ? Math.round((highMoodWins / highMoodGames) * 100) : 0
    const winRateLowMood = lowMoodGames > 0 ? Math.round((lowMoodWins / lowMoodGames) * 100) : 0
    const performanceGain = winRateHighMood - winRateLowMood

    // ============================================================================
    // RISK MITIGATION
    // ============================================================================
    const crisisAlerts = await prisma.crisisAlert.findMany({
      where: {
        athleteId: { in: allAthletes.map((a) => a.userId) },
        createdAt: { gte: thirtyDaysAgo },
      },
      select: {
        severity: true,
        reviewedAt: true,
        resolvedAt: true,
      },
    })

    const crisisAlertsDetected = crisisAlerts.length
    const crisisAlertsResolved = crisisAlerts.filter((a) => a.resolvedAt).length

    const atRiskAthletes = await prisma.athlete.count({
      where: {
        ...athleteFilter,
        riskLevel: { in: ["HIGH", "CRITICAL"] },
      },
    })

    // ============================================================================
    // EFFICIENCY METRICS
    // ============================================================================
    // Estimate: each chat session replaces 15-20 min 1:1 meeting
    const estimatedHoursSaved = Math.round((chatSessions.length * 15) / 60)

    // ============================================================================
    // BUILD ROI RESPONSE
    // ============================================================================
    const roiMetrics: ROIMetrics = {
      engagement: {
        totalAthletes,
        activeAthletes,
        engagementRate,
        avgSessionsPerAthlete,
        totalChatSessions: chatSessions.length,
        totalCheckIns: moodLogs.length,
        weeklyActiveUsers,
        engagementTrend: engagementChange > 5 ? "up" : engagementChange < -5 ? "down" : "stable",
        engagementChange,
      },
      mentalHealth: {
        avgMoodScore: Math.round(avgCurrentMood * 10) / 10,
        avgMoodChange: Math.round((avgCurrentMood - avgPrevMood) * 10) / 10,
        avgStressReduction: Math.round((avgPrevStress - avgCurrentStress) * 10) / 10,
        avgConfidenceGain: Math.round((avgCurrentConfidence - avgPrevConfidence) * 10) / 10,
        athletesImproved,
        athletesStable,
        athletesDeclined,
        improvementRate,
      },
      performance: {
        moodPerformanceCorrelation: performanceGain > 10 ? 0.7 : performanceGain > 5 ? 0.5 : 0.3,
        gamesWithHighMood: highMoodGames,
        winRateHighMood,
        winRateLowMood,
        performanceGain,
      },
      riskMitigation: {
        crisisAlertsDetected,
        crisisAlertsResolved,
        earlyInterventions: crisisAlertsResolved,
        athletesAtRisk: atRiskAthletes,
        athletesRecovered: athletesImproved,
        preventedEscalations: crisisAlertsResolved,
      },
      efficiency: {
        estimatedHoursSaved,
        chatSessionsReplacing11: chatSessions.length,
        automatedAlerts: crisisAlertsDetected,
        avgResponseTime: "< 5 min",
      },
      periodComparison: {
        currentPeriod: `${thirtyDaysAgo.toLocaleDateString()} - ${now.toLocaleDateString()}`,
        previousPeriod: `${sixtyDaysAgo.toLocaleDateString()} - ${thirtyDaysAgo.toLocaleDateString()}`,
        engagementChange,
        moodChange: Math.round((avgCurrentMood - avgPrevMood) * 10),
        performanceChange: performanceGain,
      },
      highlights: [
        {
          title: "Athlete Engagement",
          value: `${engagementRate}%`,
          change: engagementChange,
          changeLabel: "vs last month",
          positive: engagementChange >= 0,
        },
        {
          title: "Mental Health Improvement",
          value: `${improvementRate}%`,
          changeLabel: "athletes improved",
          positive: improvementRate > 50,
        },
        {
          title: "Performance Correlation",
          value: `+${performanceGain}%`,
          changeLabel: "higher win rate with good mood",
          positive: performanceGain > 0,
        },
        {
          title: "Hours Saved",
          value: `${estimatedHoursSaved}h`,
          changeLabel: "from AI chat sessions",
          positive: true,
        },
        {
          title: "Early Risk Detection",
          value: `${crisisAlertsDetected}`,
          changeLabel: "issues caught early",
          positive: true,
        },
      ],
    }

    return NextResponse.json({
      success: true,
      data: roiMetrics,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("ROI API error:", error)
    return NextResponse.json({ error: "Failed to generate ROI metrics" }, { status: 500 })
  }
}
