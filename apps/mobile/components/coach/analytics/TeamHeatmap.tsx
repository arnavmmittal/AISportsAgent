/**
 * Team Readiness Heatmap Component (React Native)
 *
 * Displays 14-day × athletes heatmap of readiness scores:
 * - Color coding: GREEN (85+), BLUE (70-84), AMBER (60-69), ORANGE (45-59), RED (<45)
 * - Scrollable horizontally and vertically
 * - Touch cells to navigate to athlete detail
 * - Team insights and legend
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface HeatmapCell {
  athleteId: string;
  athleteName: string;
  date: string; // YYYY-MM-DD
  score: number | null; // 0-100 readiness score
  level: 'OPTIMAL' | 'GOOD' | 'MODERATE' | 'LOW' | 'POOR' | 'NO_DATA';
}

interface TeamHeatmapProps {
  coachId: string;
  days?: number; // Default 14
}

export function TeamHeatmap({ coachId, days = 14 }: TeamHeatmapProps) {
  const [heatmapData, setHeatmapData] = useState<HeatmapCell[][]>([]);
  const [athletes, setAthletes] = useState<{ id: string; name: string }[]>([]);
  const [dates, setDates] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchTeamReadiness();
  }, [coachId, days]);

  async function fetchTeamReadiness() {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/coach/analytics/team-heatmap?coachId=${coachId}&days=${days}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch team readiness data');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to load heatmap');
      }

      const { athletes: athleteList, dates: dateList, data } = result.data;

      setAthletes(athleteList);
      setDates(dateList);
      setHeatmapData(data);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching team heatmap:', err);
      setError(err instanceof Error ? err.message : 'Failed to load team heatmap');
      setIsLoading(false);
    }
  }

  const getCellColor = (level: string) => {
    switch (level) {
      case 'OPTIMAL':
        return '#10b981'; // green-500
      case 'GOOD':
        return '#3b82f6'; // blue-500
      case 'MODERATE':
        return '#f59e0b'; // amber-500
      case 'LOW':
        return '#fb923c'; // orange-400
      case 'POOR':
        return '#ef4444'; // red-500
      default:
        return '#e5e7eb'; // gray-200
    }
  };

  const getCellTextColor = (level: string) => {
    return level === 'NO_DATA' ? '#9ca3af' : '#ffffff';
  };

  const handleCellPress = (athleteId: string, date: string) => {
    // Navigate to athlete detail page
    router.push(`/(coach)/athletes/${athleteId}?date=${date}` as any);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Team Readiness Heatmap</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading team data...</Text>
        </View>
      </View>
    );
  }

  if (error || heatmapData.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Team Readiness Heatmap</Text>
        </View>
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#9ca3af" />
          <Text style={styles.errorText}>{error || 'No team data available'}</Text>
        </View>
      </View>
    );
  }

  // Calculate team stats
  const totalCells = heatmapData.reduce((sum, row) => sum + row.length, 0);
  const cellsWithData = heatmapData.reduce(
    (sum, row) => sum + row.filter((cell) => cell.score !== null).length,
    0
  );
  const avgScore =
    heatmapData.reduce((sum, row) => {
      const rowScores = row.filter((c) => c.score !== null);
      const rowAvg = rowScores.reduce((rowSum, cell) => rowSum + (cell.score || 0), 0) / (rowScores.length || 1);
      return sum + rowAvg;
    }, 0) / (heatmapData.length || 1);

  const lowReadinessCells = heatmapData.reduce(
    (sum, row) => sum + row.filter((cell) => cell.score !== null && cell.score < 60).length,
    0
  );

  const cellSize = 44;
  const nameColumnWidth = 120;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Team Readiness Heatmap</Text>
        <Text style={styles.subtitle}>Past {days} Days</Text>
        <View style={styles.statsRow}>
          <Text style={styles.statText}>Team avg: {avgScore.toFixed(1)}/100</Text>
          {lowReadinessCells > 0 && (
            <View style={styles.warningRow}>
              <MaterialCommunityIcons name="trending-down" size={16} color="#ef4444" />
              <Text style={styles.warningText}>{lowReadinessCells} cells below 60</Text>
            </View>
          )}
        </View>
      </View>

      {/* Heatmap Grid */}
      <ScrollView horizontal={true} showsHorizontalScrollIndicator={true} style={styles.scrollContainer}>
        <View>
          {/* Date Header Row */}
          <View style={styles.headerRow}>
            <View style={[styles.headerCell, { width: nameColumnWidth }]}>
              <Text style={styles.headerCellText}>Athlete</Text>
            </View>
            {dates.map((date) => (
              <View key={date} style={[styles.headerCell, { width: cellSize }]}>
                <Text style={styles.headerCellText}>
                  {new Date(date).toLocaleDateString('en-US', {
                    month: 'numeric',
                    day: 'numeric',
                  })}
                </Text>
              </View>
            ))}
          </View>

          {/* Data Rows */}
          <ScrollView showsVerticalScrollIndicator={true} style={{ maxHeight: 400 }}>
            {heatmapData.map((row, rowIdx) => (
              <View key={athletes[rowIdx]?.id || rowIdx} style={styles.dataRow}>
                <View style={[styles.nameCell, { width: nameColumnWidth }]}>
                  <Text style={styles.nameCellText} numberOfLines={1}>
                    {athletes[rowIdx]?.name || 'Unknown'}
                  </Text>
                </View>
                {row.map((cell, cellIdx) => (
                  <TouchableOpacity
                    key={`${rowIdx}-${cellIdx}`}
                    style={[
                      styles.cell,
                      { width: cellSize, backgroundColor: getCellColor(cell.level) },
                    ]}
                    onPress={() => handleCellPress(cell.athleteId, cell.date)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.cellText, { color: getCellTextColor(cell.level) }]}>
                      {cell.score !== null ? cell.score : '-'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: '#10b981' }]} />
            <Text style={styles.legendText}>Optimal (85-100)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: '#3b82f6' }]} />
            <Text style={styles.legendText}>Good (70-84)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: '#f59e0b' }]} />
            <Text style={styles.legendText}>Moderate (60-69)</Text>
          </View>
        </View>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: '#fb923c' }]} />
            <Text style={styles.legendText}>Low (45-59)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: '#ef4444' }]} />
            <Text style={styles.legendText}>Poor (&lt;45)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: '#e5e7eb' }]} />
            <Text style={styles.legendText}>No data</Text>
          </View>
        </View>
      </View>

      {/* Team Insights */}
      <View style={styles.insights}>
        <Text style={styles.insightsTitle}>Team Insights</Text>
        <Text style={styles.insightText}>
          • Data coverage: {cellsWithData}/{totalCells} ({Math.round((cellsWithData / totalCells) * 100)}%)
        </Text>
        <Text style={styles.insightText}>• Team average: {avgScore.toFixed(1)}/100</Text>
        {lowReadinessCells > 0 && (
          <Text style={[styles.insightText, { color: '#ef4444' }]}>
            • {lowReadinessCells} instances of low readiness (&lt;60) - Consider adjusting training load
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statText: {
    fontSize: 14,
    color: '#6b7280',
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  warningText: {
    fontSize: 12,
    color: '#ef4444',
  },
  scrollContainer: {
    maxHeight: 500,
  },
  headerRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 8,
    marginBottom: 4,
  },
  headerCell: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  headerCellText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'center',
  },
  dataRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  nameCell: {
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  nameCellText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1f2937',
  },
  cell: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
    borderRadius: 4,
  },
  cellText: {
    fontSize: 11,
    fontWeight: '600',
  },
  legend: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendBox: {
    width: 14,
    height: 14,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 11,
    color: '#6b7280',
  },
  insights: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  insightsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  insightText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  errorContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});
