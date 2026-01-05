import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuthFromRequest } from '@/lib/auth-helpers';
import { calculateReadiness as calculateAdvancedReadiness } from '@/lib/analytics/readiness';

/**
 * POST /api/performance/import
 *
 * Import game performance stats from CSV upload
 *
 * CSV Format:
 * Name,Date,Opponent,Points,Assists,Rebounds,Turnovers,Minutes,Outcome
 * Sarah Johnson,2024-12-15,UCLA,22,5,8,2,34,WIN
 * Sarah Johnson,2024-12-18,USC,18,4,6,3,32,WIN
 *
 * For other sports, use relevant stats in JSON column
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuthFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only coaches can import stats
    if (user.role !== 'COACH' && user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only coaches can import performance stats' },
        { status: 403 }
      );
    }

    // Get form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const sport = formData.get('sport') as string || 'Basketball';

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Read CSV file
    const csvText = await file.text();
    const rows = csvText.split('\n').filter(row => row.trim());

    if (rows.length < 2) {
      return NextResponse.json(
        { error: 'CSV file is empty or invalid' },
        { status: 400 }
      );
    }

    // Parse header row
    const headers = rows[0].split(',').map(h => h.trim().toLowerCase());

    // Validate required columns
    const requiredColumns = ['name', 'date'];
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));

    if (missingColumns.length > 0) {
      return NextResponse.json(
        { error: `Missing required columns: ${missingColumns.join(', ')}` },
        { status: 400 }
      );
    }

    // Process data rows
    const importedRecords = [];
    const errors = [];

    for (let i = 1; i < rows.length; i++) {
      try {
        const values = rows[i].split(',').map(v => v.trim());

        if (values.length < headers.length) {
          errors.push({ row: i + 1, error: 'Incomplete row' });
          continue;
        }

        // Create object from CSV row
        const rowData: Record<string, string> = {};
        headers.forEach((header, index) => {
          rowData[header] = values[index];
        });

        // Find athlete by name
        const athlete = await prisma.athlete.findFirst({
          where: {
            User: {
              name: {
                contains: rowData.name,
                mode: 'insensitive',
              },
            },
          },
          include: {
            User: true,
          },
        });

        if (!athlete) {
          errors.push({ row: i + 1, error: `Athlete not found: ${rowData.name}` });
          continue;
        }

        // Parse date
        const gameDate = new Date(rowData.date);
        if (isNaN(gameDate.getTime())) {
          errors.push({ row: i + 1, error: `Invalid date: ${rowData.date}` });
          continue;
        }

        // Get mood data for that date (if exists)
        const moodLog = await prisma.moodLog.findFirst({
          where: {
            athleteId: athlete.userId,
            createdAt: {
              gte: new Date(gameDate.setHours(0, 0, 0, 0)),
              lt: new Date(gameDate.setHours(23, 59, 59, 999)),
            },
          },
        });

        // Build stats JSON based on sport
        const stats: Record<string, number> = {};

        if (sport === 'Basketball') {
          stats.points = parseFloat(rowData.points || '0');
          stats.assists = parseFloat(rowData.assists || '0');
          stats.rebounds = parseFloat(rowData.rebounds || '0');
          stats.turnovers = parseFloat(rowData.turnovers || '0');
          stats.minutes = parseFloat(rowData.minutes || '0');
        } else if (sport === 'Soccer') {
          stats.goals = parseFloat(rowData.goals || '0');
          stats.assists = parseFloat(rowData.assists || '0');
          stats.shots = parseFloat(rowData.shots || '0');
          stats.minutes = parseFloat(rowData.minutes || '0');
        } else if (sport === 'Volleyball') {
          stats.kills = parseFloat(rowData.kills || '0');
          stats.blocks = parseFloat(rowData.blocks || '0');
          stats.digs = parseFloat(rowData.digs || '0');
          stats.aces = parseFloat(rowData.aces || '0');
        } else if (sport === 'Track & Field') {
          stats.time = parseFloat(rowData.time || '0');
          stats.distance = parseFloat(rowData.distance || '0');
          stats.place = parseFloat(rowData.place || '0');
        } else {
          // Generic stats - add all numeric columns
          headers.forEach((header) => {
            if (!['name', 'date', 'opponent', 'outcome'].includes(header)) {
              const value = parseFloat(rowData[header]);
              if (!isNaN(value)) {
                stats[header] = value;
              }
            }
          });
        }

        // Create performance record
        const performanceRecord = await prisma.performanceMetric.create({
          data: {
            athleteId: athlete.userId,
            gameDate: new Date(rowData.date),
            sport: sport,
            opponentName: rowData.opponent || null,
            stats: stats,
            outcome: rowData.outcome || 'UNKNOWN',
            // Link mood data if available
            mentalMoodScore: moodLog?.mood || null,
            mentalStressScore: moodLog?.stress || null,
            mentalSleepHours: moodLog?.sleep || null,
            readinessScore: moodLog ? calculateAdvancedReadiness({
              mood: moodLog.mood,
              confidence: moodLog.confidence,
              stress: moodLog.stress,
              energy: moodLog.energy || undefined,
              sleep: moodLog.sleep || undefined,
              createdAt: moodLog.createdAt,
            }, sport).overall : null,
          },
        });

        importedRecords.push(performanceRecord);
      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error);
        errors.push({
          row: i + 1,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      imported: importedRecords.length,
      errors: errors.length,
      errorDetails: errors.length > 0 ? errors : undefined,
      message: `Successfully imported ${importedRecords.length} records${errors.length > 0 ? `, ${errors.length} errors` : ''}`,
    });

  } catch (error) {
    console.error('Error importing performance stats:', error);
    return NextResponse.json(
      { error: 'Failed to import performance stats' },
      { status: 500 }
    );
  }
}

