import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { Spacing, Typography, BorderRadius } from '../../constants/theme';
import config from '../../config';
import { getStoredToken } from '../../lib/auth';

interface Starter {
  text: string;
  prompt: string;
}

interface SmartEmptyStateProps {
  onSelectPrompt: (prompt: string) => void;
}

const FALLBACK_STARTERS: Starter[] = [
  { text: 'Pre-game anxiety tips', prompt: "I get anxious before games..." },
  { text: 'Build confidence', prompt: "How do I believe in myself more?" },
  { text: 'Stress management', prompt: "I'm feeling overwhelmed..." },
  { text: 'Get in the zone', prompt: "Help me find my flow state..." },
];

export function SmartEmptyState({ onSelectPrompt }: SmartEmptyStateProps) {
  const { colors } = useTheme();
  const [starters, setStarters] = useState<Starter[]>(FALLBACK_STARTERS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchStarters() {
      try {
        const token = await getStoredToken();
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await fetch(`${config.apiUrl}/api/athlete/insights`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('Failed to fetch');

        const data = await response.json();
        if (!cancelled && Array.isArray(data.starters) && data.starters.length > 0) {
          setStarters(data.starters.slice(0, 4));
        }
      } catch {
        // Keep fallback starters
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchStarters();
    return () => { cancelled = true; };
  }, []);

  return (
    <View style={styles.container}>
      <Ionicons name="chatbubble-ellipses" size={48} color={colors.accent} />
      <Text style={[styles.title, { color: colors.textPrimary }]}>Ready to talk?</Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>
        Share what's on your mind — let's get to work.
      </Text>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: Spacing.lg }} />
      ) : (
        <View style={styles.grid}>
          {starters.map((starter, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => onSelectPrompt(starter.prompt)}
            >
              <Text style={[styles.cardText, { color: colors.textPrimary }]}>{starter.text}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: Typography.base,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xxxl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    width: '100%',
  },
  card: {
    width: '48%',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  cardText: {
    fontSize: Typography.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
});
