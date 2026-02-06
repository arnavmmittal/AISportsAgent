/**
 * Welcome/Landing screen for mobile app
 * Shows hero section with login/signup options
 */

import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/theme';

export default function Welcome() {
  const router = useRouter();

  return (
    <LinearGradient
      colors={[Colors.primary, Colors.secondary, Colors.accent]}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.mainHeading}>Flow Sports Coach</Text>
          <Text style={styles.subHeading}>Mental Performance Made Accessible</Text>

          <Text style={styles.description}>
            Evidence-based mental performance support for collegiate athletes. Available 24/7.
          </Text>

          {/* Role Selection */}
          <Text style={styles.rolePrompt}>I am a...</Text>

          <View style={styles.roleCardsContainer}>
            <TouchableOpacity
              style={styles.roleCard}
              onPress={() => router.push('/(auth)/signup/athlete')}
            >
              <Text style={styles.roleIcon}>🏀</Text>
              <Text style={styles.roleTitle}>ATHLETE</Text>
              <Text style={styles.roleDescription}>
                Get 24/7 mental performance support from AI coach
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.roleCard}
              onPress={() => router.push('/(auth)/signup/coach')}
            >
              <Text style={styles.roleIcon}>🎓</Text>
              <Text style={styles.roleTitle}>COACH</Text>
              <Text style={styles.roleDescription}>
                Monitor your athletes' mental health and team insights
              </Text>
            </TouchableOpacity>
          </View>

          {/* Sign In Option */}
          <View style={styles.signInContainer}>
            <Text style={styles.signInText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.signInLink}>Sign In</Text>
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
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  rolePrompt: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
  },
  roleCardsContainer: {
    width: '100%',
    gap: 16,
    marginBottom: 32,
  },
  roleCard: {
    backgroundColor: Colors.card,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: Colors.chrome + '40',
  },
  roleIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.secondary,
    marginBottom: 8,
    letterSpacing: 1,
  },
  roleDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  signInContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
  },
  signInText: {
    fontSize: 16,
    color: '#e0f2fe',
  },
  signInLink: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '700',
    textDecorationLine: 'underline',
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
