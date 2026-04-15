import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { Colors, Spacing, Typography, BorderRadius } from '../../../constants/theme';
import CheckInZone from './CheckInZone';
import ReadinessSummary from './ReadinessSummary';
import ToolkitCard from './ToolkitCard';

export default function WellnessScreen() {
  const { colors } = useTheme();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    setRefreshKey((k) => k + 1);
    // Give child components time to re-fetch
    setTimeout(() => setIsRefreshing(false), 1000);
  }, []);

  const handleCheckInSuccess = useCallback(() => {
    // Refresh readiness + toolkit after a successful check-in
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <View style={styles.headerContent}>
          <Ionicons name="heart-outline" size={24} color={colors.accent} />
          <View>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Daily Check-in</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              How are you feeling today?
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
      >
        {/* Zone 1: Check-In */}
        <CheckInZone onSubmitSuccess={handleCheckInSuccess} />

        {/* Zone 2: Readiness Summary */}
        <ReadinessSummary refreshKey={refreshKey} />

        {/* Zone 3: Personalized Toolkit */}
        <ToolkitCard refreshKey={refreshKey} />

        {/* Bottom padding for tab bar */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerTitle: {
    fontSize: Typography.xl,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: Typography.sm,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingTop: 0,
    paddingBottom: Platform.OS === 'ios' ? 120 : 100,
  },
  bottomPadding: {
    height: 40,
  },
});
