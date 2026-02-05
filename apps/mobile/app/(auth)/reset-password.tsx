import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Animated, ScrollView } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/theme';
import { config } from '../../config';

/**
 * Reset Password Screen
 * Allows users to set a new password using the token from their email
 * Accessed via deep link: flowsportscoach://reset-password?token=xxx&email=xxx
 */
export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string; email?: string }>();
  const token = params.token;
  const email = params.email;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Password validation
  const passwordChecks = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
  };

  const isPasswordValid = Object.values(passwordChecks).every(Boolean);
  const passwordsMatch = password === confirmPassword && password.length > 0;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const shakeError = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSubmit = async () => {
    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      shakeError();
      return;
    }

    if (!isPasswordValid) {
      setError('Please meet all password requirements');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      shakeError();
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      shakeError();
      return;
    }

    setIsLoading(true);
    setError('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const response = await fetch(`${config.apiUrl}/api/auth/password-reset`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      shakeError();
    } finally {
      setIsLoading(false);
    }
  };

  // Invalid token state
  if (!token) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[Colors.error, '#ef4444', Colors.warning]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientHeader}
        >
          <View style={styles.headerContent}>
            <View style={styles.logoContainer}>
              <Ionicons name="alert-circle-outline" size={48} color="#fff" />
            </View>
            <Text style={styles.title}>Invalid Link</Text>
            <Text style={styles.subtitle}>This reset link is invalid or expired</Text>
          </View>
        </LinearGradient>

        <View style={[styles.formContainer, styles.centeredContent]}>
          <Text style={styles.invalidText}>
            This password reset link is invalid or has expired. Please request a new one.
          </Text>

          <TouchableOpacity
            onPress={() => {
              router.push('/(auth)/forgot-password');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <LinearGradient
              colors={['#2563eb', '#3b82f6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              <View style={styles.buttonContent}>
                <Text style={styles.buttonText}>Request New Link</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => {
              router.push('/(auth)/login');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Ionicons name="arrow-back" size={16} color={Colors.textSecondary} />
            <Text style={styles.linkText}>Back to sign in</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={[Colors.primary, Colors.secondary, Colors.accent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientHeader}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/(auth)/login')}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <Animated.View
          style={[
            styles.headerContent,
            {
              opacity: fadeAnim,
              transform: [{ translateY: Animated.multiply(slideAnim, -1) }],
            },
          ]}
        >
          <View style={styles.logoContainer}>
            <Ionicons name="shield-checkmark-outline" size={48} color="#fff" />
          </View>
          <Text style={styles.title}>New Password</Text>
          <Text style={styles.subtitle}>Create a secure password</Text>
        </Animated.View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          style={[
            styles.formContainerInner,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { translateX: shakeAnim }],
            },
          ]}
        >
          {success ? (
            // Success State
            <View style={styles.successContainer}>
              <View style={styles.successIconContainer}>
                <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
              </View>
              <Text style={styles.successTitle}>Password Reset!</Text>
              <Text style={styles.successText}>
                Your password has been changed successfully. You can now sign in with your new password.
              </Text>

              <TouchableOpacity
                onPress={() => {
                  router.replace('/(auth)/login');
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <LinearGradient
                  colors={['#2563eb', '#3b82f6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.button}
                >
                  <View style={styles.buttonContent}>
                    <Text style={styles.buttonText}>Sign In</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            // Form State
            <>
              <Text style={styles.welcomeText}>Set your new password</Text>
              {email && (
                <Text style={styles.welcomeSubtext}>
                  for <Text style={styles.emailHighlight}>{email}</Text>
                </Text>
              )}

              {error ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={20} color={Colors.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {/* New Password Input */}
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={Colors.gray400} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="New password"
                  placeholderTextColor={Colors.gray400}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setError('');
                  }}
                  secureTextEntry={!showPassword}
                  editable={!isLoading}
                  autoComplete="off"
                  textContentType="oneTimeCode"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => {
                    setShowPassword(!showPassword);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={Colors.gray400}
                  />
                </TouchableOpacity>
              </View>

              {/* Password Requirements */}
              <View style={styles.requirements}>
                {[
                  { check: passwordChecks.minLength, label: 'At least 8 characters' },
                  { check: passwordChecks.hasUppercase, label: 'One uppercase letter' },
                  { check: passwordChecks.hasLowercase, label: 'One lowercase letter' },
                  { check: passwordChecks.hasNumber, label: 'One number' },
                ].map(({ check, label }) => (
                  <View key={label} style={styles.requirementRow}>
                    <View style={[styles.requirementDot, check && styles.requirementDotActive]}>
                      {check && <Ionicons name="checkmark" size={10} color="#fff" />}
                    </View>
                    <Text style={[styles.requirementText, check && styles.requirementTextActive]}>
                      {label}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={Colors.gray400} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm password"
                  placeholderTextColor={Colors.gray400}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    setError('');
                  }}
                  secureTextEntry={!showConfirmPassword}
                  editable={!isLoading}
                  autoComplete="off"
                  textContentType="oneTimeCode"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => {
                    setShowConfirmPassword(!showConfirmPassword);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={Colors.gray400}
                  />
                </TouchableOpacity>
              </View>

              {confirmPassword.length > 0 && (
                <View style={styles.matchIndicator}>
                  <Ionicons
                    name={passwordsMatch ? 'checkmark-circle' : 'close-circle'}
                    size={16}
                    color={passwordsMatch ? Colors.success : Colors.error}
                  />
                  <Text style={[styles.matchText, passwordsMatch ? styles.matchTextSuccess : styles.matchTextError]}>
                    {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isLoading || !isPasswordValid || !passwordsMatch}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={
                    isLoading || !isPasswordValid || !passwordsMatch
                      ? [Colors.gray400, Colors.gray500]
                      : ['#2563eb', '#3b82f6']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.button}
                >
                  {isLoading ? (
                    <View style={styles.buttonContent}>
                      <Text style={styles.buttonText}>Resetting...</Text>
                    </View>
                  ) : (
                    <View style={styles.buttonContent}>
                      <Ionicons name="shield-checkmark" size={20} color="#fff" />
                      <Text style={styles.buttonText}>Reset Password</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => {
                  router.push('/(auth)/login');
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                disabled={isLoading}
              >
                <Ionicons name="arrow-back" size={16} color={Colors.textSecondary} />
                <Text style={styles.linkText}>Back to sign in</Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
  },
  scrollView: {
    flex: 1,
    backgroundColor: Colors.card,
    borderTopLeftRadius: BorderRadius.xl * 1.5,
    borderTopRightRadius: BorderRadius.xl * 1.5,
    marginTop: -Spacing.xl,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.xl,
  },
  formContainerInner: {
    flex: 1,
  },
  gradientHeader: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: Spacing.xxxl,
    paddingHorizontal: Spacing.lg,
  },
  backButton: {
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  headerContent: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.xxxl,
    fontWeight: Typography.bold,
    color: '#fff',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.base,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: Typography.medium,
  },
  formContainer: {
    flex: 1,
    backgroundColor: Colors.card,
    borderTopLeftRadius: BorderRadius.xl * 1.5,
    borderTopRightRadius: BorderRadius.xl * 1.5,
    marginTop: -Spacing.xl,
    padding: Spacing.xl,
  },
  centeredContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: Typography.xxl,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  welcomeSubtext: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  emailHighlight: {
    color: Colors.textPrimary,
    fontWeight: Typography.semibold,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderWidth: 1.5,
    borderColor: Colors.gray200,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.gray50,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: Typography.base,
    color: Colors.textPrimary,
  },
  eyeIcon: {
    padding: Spacing.xs,
  },
  requirements: {
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.xs,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  requirementDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.gray200,
    marginRight: Spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  requirementDotActive: {
    backgroundColor: Colors.success,
  },
  requirementText: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
  },
  requirementTextActive: {
    color: Colors.success,
  },
  matchIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.xs,
    gap: Spacing.xs,
  },
  matchText: {
    fontSize: Typography.xs,
  },
  matchTextSuccess: {
    color: Colors.success,
  },
  matchTextError: {
    color: Colors.error,
  },
  button: {
    height: 56,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.md,
    ...Shadows.medium,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  buttonText: {
    color: '#fff',
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    marginTop: Spacing.lg,
    gap: Spacing.xs,
  },
  linkText: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.errorLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  errorText: {
    flex: 1,
    color: Colors.error,
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
  },
  invalidText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
    paddingHorizontal: Spacing.lg,
  },
  // Success state styles
  successContainer: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
  },
  successIconContainer: {
    marginBottom: Spacing.lg,
  },
  successTitle: {
    fontSize: Typography.xxl,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  successText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
});
