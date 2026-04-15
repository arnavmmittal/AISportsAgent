import { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Spacing, Typography, BorderRadius } from '../../constants/theme';
import config from '../../config';
import { getStoredToken } from '../../lib/auth';

interface WellnessData {
  readinessScore: number;
  mood: string;
  lastCheckInAt: string | null;
}

function getReadinessColor(score: number): string {
  if (score >= 70) return '#22C55E'; // green
  if (score >= 40) return '#EAB308'; // yellow
  return '#EF4444'; // red
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'Checked in just now';
  if (hours === 1) return 'Checked in 1h ago';
  return `Checked in ${hours}h ago`;
}

export function WellnessContextBanner() {
  const { colors } = useTheme();
  const [data, setData] = useState<WellnessData | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchDashboard() {
      try {
        const token = await getStoredToken();
        if (!token) return;

        const response = await fetch(`${config.apiUrl}/api/athlete/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) return;

        const json = await response.json();
        if (!cancelled && json.readinessScore != null) {
          setData({
            readinessScore: json.readinessScore,
            mood: json.mood || json.currentMood || '',
            lastCheckInAt: json.lastCheckInAt || json.lastCheckinAt || null,
          });
        }
      } catch {
        // Silently fail — banner just won't show
      }
    }

    fetchDashboard();
    return () => { cancelled = true; };
  }, []);

  if (!data) return null;

  const checkInText = data.lastCheckInAt
    ? getTimeAgo(data.lastCheckInAt)
    : 'Not checked in today';

  return (
    <View style={[styles.banner, { backgroundColor: colors.backgroundSecondary }]}>
      <Text style={[styles.readiness, { color: getReadinessColor(data.readinessScore) }]}>
        {data.readinessScore}
      </Text>
      {data.mood ? (
        <Text style={[styles.mood, { color: colors.textPrimary }]}>{data.mood}</Text>
      ) : null}
      <Text style={[styles.separator, { color: colors.textTertiary }]}>&middot;</Text>
      <Text style={[styles.checkIn, { color: colors.textSecondary }]}>{checkInText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  readiness: {
    fontSize: Typography.base,
    fontWeight: '700',
  },
  mood: {
    fontSize: Typography.sm,
    fontWeight: '500',
  },
  separator: {
    fontSize: Typography.sm,
  },
  checkIn: {
    fontSize: Typography.sm,
  },
});
