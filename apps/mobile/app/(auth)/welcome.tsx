/**
 * Welcome/Landing screen for mobile app
 * Shows hero section with login/signup options
 */

import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function Welcome() {
  const router = useRouter();

  return (
    <LinearGradient
      colors={['#1e3a8a', '#3b82f6', '#60a5fa']}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.mainHeading}>Mental Performance</Text>
          <Text style={styles.subHeading}>Made Accessible</Text>

          <Text style={styles.description}>
            Evidence-based mental performance support for collegiate athletes. Available 24/7.
          </Text>

          {/* CTA Buttons */}
          <View style={styles.ctaContainer}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push('/(auth)/signup')}
            >
              <Text style={styles.primaryButtonText}>Get Started Free</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push('/(auth)/login')}
            >
              <Text style={styles.secondaryButtonText}>Sign In</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.trustIndicator}>
            Trusted by student-athletes across Division I programs
          </Text>
        </View>

        {/* Features Section */}
        <View style={styles.featuresSection}>
          <FeatureCard
            icon="🎯"
            title="Pre-Game Readiness"
            description="Get mental performance scores before competition. Know who's ready to perform."
          />
          <FeatureCard
            icon="💬"
            title="AI Mental Skills Coach"
            description="24/7 access to evidence-based sports psychology guidance."
          />
          <FeatureCard
            icon="📊"
            title="Performance Analytics"
            description="Track correlations between mental state and game performance."
          />
          <FeatureCard
            icon="🎙️"
            title="Voice Conversations"
            description="Talk naturally with AI just like you would with a real coach."
          />
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <View style={styles.featureCard}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  heroSection: {
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
    alignItems: 'center',
  },
  mainHeading: {
    fontSize: 48,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -1,
  },
  subHeading: {
    fontSize: 48,
    fontWeight: '900',
    color: '#fef3c7',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: -1,
  },
  description: {
    fontSize: 18,
    color: '#e0f2fe',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 40,
    paddingHorizontal: 16,
  },
  ctaContainer: {
    width: '100%',
    gap: 16,
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonText: {
    color: '#1e3a8a',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  trustIndicator: {
    fontSize: 14,
    color: '#bfdbfe',
    textAlign: 'center',
  },
  featuresSection: {
    paddingHorizontal: 24,
    gap: 16,
    marginTop: 20,
  },
  featureCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  featureIcon: {
    fontSize: 36,
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: '#e0f2fe',
    lineHeight: 20,
  },
});
