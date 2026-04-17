import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { Colors, Spacing, Typography, BorderRadius } from '../../../constants/theme';

interface MetricOption {
  value: number;
  label: string;
}

interface MetricSelectorProps {
  label: string;
  icon: string;
  options: MetricOption[];
  value: number | null;
  onChange: (value: number) => void;
  colorScale: 'positive' | 'negative';
}

// Muted readiness traffic-light palette (softer on dark backgrounds)
const POSITIVE_COLORS = ['#DC5454', '#D4732E', '#E5A828', '#6DA544', '#34B87A'];
const NEGATIVE_COLORS = ['#34B87A', '#6DA544', '#E5A828', '#D4732E', '#DC5454'];

export default function MetricSelector({
  label,
  icon,
  options,
  value,
  onChange,
  colorScale,
}: MetricSelectorProps) {
  const { colors } = useTheme();
  const palette = colorScale === 'positive' ? POSITIVE_COLORS : NEGATIVE_COLORS;

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Ionicons name={icon as any} size={18} color={colors.accent} />
        <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>
      </View>
      <View style={styles.optionsRow}>
        {options.map((opt, idx) => {
          const isSelected = value === opt.value;
          const color = palette[idx % palette.length];
          return (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.option,
                {
                  backgroundColor: colors.backgroundSecondary,
                  borderColor: isSelected ? color : colors.border,
                  borderWidth: isSelected ? 2 : 1,
                  opacity: isSelected ? 1 : 0.6,
                },
              ]}
              onPress={() => onChange(opt.value)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.optionValue,
                  { color: isSelected ? color : colors.textSecondary },
                ]}
              >
                {opt.value}
              </Text>
              <Text
                style={[
                  styles.optionLabel,
                  { color: isSelected ? colors.textPrimary : colors.textTertiary },
                ]}
                numberOfLines={1}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: Typography.base,
    fontWeight: '600',
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.xs,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.md,
    minHeight: 56,
  },
  optionValue: {
    fontSize: Typography.lg,
    fontWeight: '700',
  },
  optionLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
});
