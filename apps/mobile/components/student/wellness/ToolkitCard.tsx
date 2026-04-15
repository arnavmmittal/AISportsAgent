import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';
import { Spacing, Typography, BorderRadius } from '../../../constants/theme';
import { getStoredToken } from '../../../lib/auth';
import config from '../../../config';

interface Technique {
  name: string;
  reason: string;
  icon: string;
}

interface ToolkitCardProps {
  refreshKey?: number;
}

export default function ToolkitCard({ refreshKey }: ToolkitCardProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const [techniques, setTechniques] = useState<Technique[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadToolkit = useCallback(async () => {
    try {
      const token = await getStoredToken();
      if (!token) return;

      const response = await fetch(`${config.apiUrl}/api/athlete/toolkit`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const items = data.techniques ?? data.data?.techniques ?? data.data ?? [];
        setTechniques(items.slice(0, 2));
      } else {
        setTechniques(defaultTechniques);
      }
    } catch (error) {
      console.error('ToolkitCard load error:', error);
      setTechniques(defaultTechniques);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadToolkit();
  }, [loadToolkit, refreshKey]);

  const handleTap = () => {
    router.push('/(tabs)/chat');
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <ActivityIndicator size="small" color={colors.accent} />
      </View>
    );
  }

  if (techniques.length === 0) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Your Toolkit</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Recommended techniques for today
      </Text>

      {techniques.map((tech, idx) => (
        <TouchableOpacity
          key={idx}
          style={[styles.techniqueRow, { borderColor: colors.border }]}
          onPress={handleTap}
          activeOpacity={0.7}
        >
          <Ionicons
            name={(tech.icon || 'sparkles-outline') as any}
            size={22}
            color={colors.accent}
          />
          <View style={styles.techniqueInfo}>
            <Text style={[styles.techniqueName, { color: colors.textPrimary }]}>{tech.name}</Text>
            <Text style={[styles.techniqueReason, { color: colors.textSecondary }]} numberOfLines={2}>
              {tech.reason}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const defaultTechniques: Technique[] = [
  {
    name: 'Box Breathing',
    reason: 'Great for centering focus before competition',
    icon: 'sparkles-outline',
  },
  {
    name: 'Positive Self-Talk',
    reason: 'Build confidence with affirmations',
    icon: 'chatbubble-outline',
  },
];

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  title: {
    fontSize: Typography.lg,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.xs,
    marginBottom: Spacing.md,
  },
  techniqueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
  },
  techniqueInfo: {
    flex: 1,
  },
  techniqueName: {
    fontSize: Typography.sm,
    fontWeight: '600',
    marginBottom: 2,
  },
  techniqueReason: {
    fontSize: Typography.xs,
    lineHeight: 16,
  },
});
