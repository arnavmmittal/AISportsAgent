/**
 * Admin Schools Management API
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';

export async function GET(req: NextRequest) {
  try {
    const { authorized, user, response } = await requireAuth(req);
    if (!authorized) return response;

    if (user!.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const schools = await prisma.school.findMany({
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, data: schools });
  } catch (error) {
    console.error('Error fetching schools:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schools' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { authorized, user, response } = await requireAuth(req);
    if (!authorized) return response;

    if (user!.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, division } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'School name is required' },
        { status: 400 }
      );
    }

    const school = await prisma.school.create({
      data: {
        name,
        division: division || 'D1',
      },
    });

    return NextResponse.json({ success: true, data: school }, { status: 201 });
  } catch (error) {
    console.error('Error creating school:', error);
    return NextResponse.json(
      { error: 'Failed to create school' },
      { status: 500 }
    );
  }
}
