/**
 * Wearable Sync Service
 *
 * Handles syncing data from wearable devices (WHOOP, etc.)
 * to the WearableDataPoint table
 */

import { prisma } from '@/lib/prisma';
import whoopClient, {
  type WHOOPSleepData,
  type WHOOPRecoveryData,
  type WHOOPWorkoutData,
} from './whoop-client';
import type { WearableProvider } from '@prisma/client';

interface SyncResult {
  success: boolean;
  athleteId: string;
  provider: WearableProvider;
  dataPointsCreated: number;
  dataPointsSkipped: number;
  errors: string[];
  lastSyncAt: Date;
}

/**
 * Sync wearable data for a single athlete
 */
export async function syncWearableData(
  athleteId: string,
  daysBack: number = 7
): Promise<SyncResult> {
  const result: SyncResult = {
    success: false,
    athleteId,
    provider: 'WHOOP',
    dataPointsCreated: 0,
    dataPointsSkipped: 0,
    errors: [],
    lastSyncAt: new Date(),
  };

  try {
    // Get connection
    const connection = await prisma.wearableConnection.findUnique({
      where: { athleteId },
    });

    if (!connection) {
      result.errors.push('No wearable connection found');
      return result;
    }

    if (!connection.syncEnabled) {
      result.errors.push('Sync is disabled for this connection');
      return result;
    }

    result.provider = connection.provider;

    // Update sync status
    await prisma.wearableConnection.update({
      where: { athleteId },
      data: { syncStatus: 'SYNCING', syncError: null },
    });

    // Check if token needs refresh
    let accessToken = connection.accessToken;

    if (connection.tokenExpiry && connection.tokenExpiry < new Date()) {
      if (!connection.refreshToken) {
        throw new Error('Token expired and no refresh token available');
      }

      // Refresh token based on provider
      if (connection.provider === 'WHOOP') {
        const newTokens = await whoopClient.refreshTokens(connection.refreshToken);

        accessToken = newTokens.access_token;

        await prisma.wearableConnection.update({
          where: { athleteId },
          data: {
            accessToken: newTokens.access_token,
            refreshToken: newTokens.refresh_token,
            tokenExpiry: new Date(Date.now() + newTokens.expires_in * 1000),
          },
        });
      }
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const startStr = startDate.toISOString();
    const endStr = endDate.toISOString();

    // Fetch and process data based on provider
    if (connection.provider === 'WHOOP') {
      await syncWHOOPData(athleteId, accessToken, startStr, endStr, result);
    } else {
      result.errors.push(`Sync not implemented for provider: ${connection.provider}`);
    }

    // Update connection status
    await prisma.wearableConnection.update({
      where: { athleteId },
      data: {
        syncStatus: result.errors.length > 0 ? 'ERROR' : 'SYNCED',
        syncError: result.errors.length > 0 ? result.errors.join('; ') : null,
        lastSyncAt: new Date(),
      },
    });

    result.success = result.errors.length === 0;
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(errorMessage);

    // Update connection with error
    await prisma.wearableConnection.update({
      where: { athleteId },
      data: {
        syncStatus: 'ERROR',
        syncError: errorMessage,
      },
    });

    return result;
  }
}

/**
 * Sync data from WHOOP
 */
async function syncWHOOPData(
  athleteId: string,
  accessToken: string,
  startDate: string,
  endDate: string,
  result: SyncResult
): Promise<void> {
  try {
    // Fetch all data types in parallel
    const [sleepData, recoveryData, workoutData] = await Promise.all([
      whoopClient.getSleep(accessToken, startDate, endDate).catch((e) => {
        result.errors.push(`Sleep fetch error: ${e.message}`);
        return [];
      }),
      whoopClient.getRecovery(accessToken, startDate, endDate).catch((e) => {
        result.errors.push(`Recovery fetch error: ${e.message}`);
        return [];
      }),
      whoopClient.getWorkouts(accessToken, startDate, endDate).catch((e) => {
        result.errors.push(`Workout fetch error: ${e.message}`);
        return [];
      }),
    ]);

    // Process sleep data
    for (const sleep of sleepData) {
      if (!sleep.score || sleep.nap) continue; // Skip naps and unscored

      const recordedAt = new Date(sleep.end); // Use end time as the recorded date

      // Check if we already have this data point
      const existing = await prisma.wearableDataPoint.findUnique({
        where: {
          athleteId_source_recordedAt: {
            athleteId,
            source: 'WHOOP',
            recordedAt,
          },
        },
      });

      if (existing) {
        result.dataPointsSkipped++;
        continue;
      }

      const stageSummary = sleep.score.stage_summary;
      const msToHours = (ms: number) => ms / (1000 * 60 * 60);

      await prisma.wearableDataPoint.create({
        data: {
          athleteId,
          source: 'WHOOP',
          recordedAt,
          sleepDuration: msToHours(
            stageSummary.total_in_bed_time_milli - stageSummary.total_awake_time_milli
          ),
          sleepQuality: sleep.score.sleep_performance_percentage,
          sleepEfficiency: sleep.score.sleep_efficiency_percentage,
          deepSleep: msToHours(stageSummary.total_slow_wave_sleep_time_milli),
          remSleep: msToHours(stageSummary.total_rem_sleep_time_milli),
          lightSleep: msToHours(stageSummary.total_light_sleep_time_milli),
          awakeTime: msToHours(stageSummary.total_awake_time_milli),
          respiratoryRate: sleep.score.respiratory_rate,
          rawData: sleep as any,
        },
      });

      result.dataPointsCreated++;
    }

    // Process recovery data - update existing data points with recovery info
    for (const recovery of recoveryData) {
      if (!recovery.score || recovery.score.user_calibrating) continue;

      const recordedAt = new Date(recovery.created_at);

      // Find the closest sleep data point for this day
      const dayStart = new Date(recordedAt);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(recordedAt);
      dayEnd.setHours(23, 59, 59, 999);

      const existingDataPoint = await prisma.wearableDataPoint.findFirst({
        where: {
          athleteId,
          source: 'WHOOP',
          recordedAt: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
        orderBy: { recordedAt: 'desc' },
      });

      if (existingDataPoint) {
        // Update with recovery data
        await prisma.wearableDataPoint.update({
          where: { id: existingDataPoint.id },
          data: {
            hrv: recovery.score.hrv_rmssd_milli,
            restingHR: recovery.score.resting_heart_rate,
            recoveryScore: recovery.score.recovery_score,
            spo2: recovery.score.spo2_percentage,
          },
        });
      } else {
        // Create new data point with just recovery data
        const existing = await prisma.wearableDataPoint.findUnique({
          where: {
            athleteId_source_recordedAt: {
              athleteId,
              source: 'WHOOP',
              recordedAt,
            },
          },
        });

        if (!existing) {
          await prisma.wearableDataPoint.create({
            data: {
              athleteId,
              source: 'WHOOP',
              recordedAt,
              hrv: recovery.score.hrv_rmssd_milli,
              restingHR: recovery.score.resting_heart_rate,
              recoveryScore: recovery.score.recovery_score,
              spo2: recovery.score.spo2_percentage,
              rawData: recovery as any,
            },
          });
          result.dataPointsCreated++;
        }
      }
    }

    // Process workout data - add strain to existing data points
    for (const workout of workoutData) {
      if (!workout.score) continue;

      const recordedAt = new Date(workout.end);

      // Find existing data point for this day
      const dayStart = new Date(recordedAt);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(recordedAt);
      dayEnd.setHours(23, 59, 59, 999);

      const existingDataPoint = await prisma.wearableDataPoint.findFirst({
        where: {
          athleteId,
          source: 'WHOOP',
          recordedAt: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
        orderBy: { recordedAt: 'desc' },
      });

      if (existingDataPoint) {
        // Aggregate strain if there are multiple workouts
        const currentStrain = existingDataPoint.strain || 0;
        const newStrain = Math.min(21, currentStrain + workout.score.strain);

        await prisma.wearableDataPoint.update({
          where: { id: existingDataPoint.id },
          data: {
            strain: newStrain,
            calories: (existingDataPoint.calories || 0) + (workout.score.kilojoule / 4.184),
            activeMinutes: (existingDataPoint.activeMinutes || 0) +
              (new Date(workout.end).getTime() - new Date(workout.start).getTime()) / (1000 * 60),
          },
        });
      }
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'WHOOP_TOKEN_EXPIRED') {
      result.errors.push('WHOOP token expired - needs reconnection');
    } else {
      throw error;
    }
  }
}

/**
 * Sync all athletes with wearable connections
 */
export async function syncAllWearables(): Promise<SyncResult[]> {
  const connections = await prisma.wearableConnection.findMany({
    where: { syncEnabled: true },
    select: { athleteId: true },
  });

  const results: SyncResult[] = [];

  for (const connection of connections) {
    try {
      const result = await syncWearableData(connection.athleteId);
      results.push(result);

      // Add small delay to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Sync failed for athlete ${connection.athleteId}:`, error);
    }
  }

  return results;
}

export type { SyncResult };
