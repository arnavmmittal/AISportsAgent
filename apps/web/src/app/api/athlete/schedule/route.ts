/**
 * Game Schedule API
 *
 * Manages upcoming games/competitions for athletes.
 * Supports manual entry and ESPN integration.
 */
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth-helpers"
import { z } from "zod"
import { StakesLevel, HomeAway, Prisma } from "@prisma/client"

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Validation schemas
const createScheduleSchema = z.object({
  gameDate: z.string().transform((str) => new Date(str)),
  opponent: z.string().min(1, "Opponent is required"),
  location: z.string().optional(),
  homeAway: z.enum(["HOME", "AWAY", "NEUTRAL"]).default("HOME"),
  sport: z.string().min(1, "Sport is required"),
  stakes: z.enum(["LOW", "MEDIUM", "HIGH", "CHAMPIONSHIP"]).default("MEDIUM"),
  competitionName: z.string().optional(),
  notes: z.string().optional(),
})

const updateScheduleSchema = createScheduleSchema.partial().extend({
  id: z.string(),
})

/**
 * GET /api/athlete/schedule
 * Get upcoming games for the authenticated athlete
 */
export async function GET(request: NextRequest) {
  try {
    const { authorized, user, response } = await requireAuth(request)

    if (!authorized || !user) {
      return response || NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "10")
    const includesPast = searchParams.get("includePast") === "true"

    // Build query filters
    const whereClause: Record<string, unknown> = {
      athleteId: user.id,
    }

    // By default, only show upcoming games
    if (!includesPast) {
      whereClause.gameDate = {
        gte: new Date(),
      }
    }

    const schedules = await prisma.gameSchedule.findMany({
      where: whereClause,
      orderBy: {
        gameDate: "asc",
      },
      take: limit,
      include: {
        PreGameSession: {
          select: {
            id: true,
            completedAt: true,
            moodScore: true,
            confidenceScore: true,
            anxietyScore: true,
            sessionType: true,
          },
        },
      },
    })

    // Get the next upcoming game
    const nextGame = schedules.find(
      (s: { gameDate: Date; PreGameSession: { completedAt: Date | null } | null }) =>
        new Date(s.gameDate) > new Date() && !s.PreGameSession?.completedAt
    )

    return NextResponse.json({
      schedules,
      nextGame,
      total: schedules.length,
    })
  } catch (error) {
    console.error("Error fetching schedule:", error)
    return NextResponse.json(
      { error: "Failed to fetch schedule" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/athlete/schedule
 * Add a new game to the schedule
 */
export async function POST(request: NextRequest) {
  try {
    const { authorized, user, response } = await requireAuth(request)

    if (!authorized || !user) {
      return response || NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createScheduleSchema.parse(body)

    const schedule = await prisma.gameSchedule.create({
      data: {
        athleteId: user.id,
        gameDate: validatedData.gameDate,
        opponent: validatedData.opponent,
        location: validatedData.location,
        homeAway: validatedData.homeAway as HomeAway,
        sport: validatedData.sport,
        stakes: validatedData.stakes as StakesLevel,
        competitionName: validatedData.competitionName,
        notes: validatedData.notes,
      },
    })

    return NextResponse.json({
      success: true,
      schedule,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Error creating schedule:", error)
    return NextResponse.json(
      { error: "Failed to create schedule" },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/athlete/schedule
 * Update an existing game schedule
 */
export async function PUT(request: NextRequest) {
  try {
    const { authorized, user, response } = await requireAuth(request)

    if (!authorized || !user) {
      return response || NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...validatedData } = updateScheduleSchema.parse(body)

    // Verify ownership
    const existing = await prisma.gameSchedule.findFirst({
      where: {
        id,
        athleteId: user.id,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      )
    }

    const updateData: Prisma.GameScheduleUpdateInput = {}
    if (validatedData.gameDate) updateData.gameDate = validatedData.gameDate
    if (validatedData.opponent) updateData.opponent = validatedData.opponent
    if (validatedData.location !== undefined) updateData.location = validatedData.location
    if (validatedData.homeAway) updateData.homeAway = validatedData.homeAway as HomeAway
    if (validatedData.sport) updateData.sport = validatedData.sport
    if (validatedData.stakes) updateData.stakes = validatedData.stakes as StakesLevel
    if (validatedData.competitionName !== undefined) updateData.competitionName = validatedData.competitionName
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes

    const schedule = await prisma.gameSchedule.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      schedule,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }
    console.error("Error updating schedule:", error)
    return NextResponse.json(
      { error: "Failed to update schedule" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/athlete/schedule
 * Delete a game from the schedule
 */
export async function DELETE(request: NextRequest) {
  try {
    const { authorized, user, response } = await requireAuth(request)

    if (!authorized || !user) {
      return response || NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Schedule ID is required" },
        { status: 400 }
      )
    }

    // Verify ownership
    const existing = await prisma.gameSchedule.findFirst({
      where: {
        id,
        athleteId: user.id,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      )
    }

    await prisma.gameSchedule.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error("Error deleting schedule:", error)
    return NextResponse.json(
      { error: "Failed to delete schedule" },
      { status: 500 }
    )
  }
}
