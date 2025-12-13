/**
 * Coach Signup Flow - 3 Steps
 * Step 1: Basic Info (name, email, password)
 * Step 2: Coaching Info (sports, organization, title, experience)
 * Step 3: Email Verification & Consent
 */

import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { CoachSignupData } from '../../../types/auth';
import { signupCoach, getRoleBasedRoute } from '../../../lib/auth';

export default function CoachSignup() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<CoachSignupData>>({
    name: '',
    email: '',
    password: '',
    sportsCoached: [],
    organization: '',
    title: '',
    yearsExperience: undefined,
    certifications: '',
    verificationCode: '',
    agreedToCodeOfConduct: false,
    understoodPrivacy: false,
    understoodCompliance: false,
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [verificationSent, setVerificationSent] = useState(false);

  const updateField = (field: keyof CoachSignupData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    } else if (!formData.email.includes('.edu') && !formData.email.includes('.org')) {
      Alert.alert(
        'Note',
        'Please use your official organization email (e.g., .edu or .org domain).'
      );
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (formData.password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.sportsCoached?.length === 0) {
      newErrors.sportsCoached = 'Select at least one sport';
    }
    if (!formData.organization?.trim()) {
      newErrors.organization = 'Organization is required';
    }
    if (!formData.title?.trim()) {
      newErrors.title = 'Title is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = (): boolean => {
    if (!formData.verificationCode?.trim()) {
      Alert.alert('Verification Required', 'Please enter your verification code.');
      return false;
    }
    if (!formData.agreedToCodeOfConduct) {
      Alert.alert('Code of Conduct Required', 'You must agree to the Coach Code of Conduct.');
      return false;
    }
    if (!formData.understoodPrivacy) {
      Alert.alert('Privacy Acknowledgment Required', 'You must acknowledge privacy requirements.');
      return false;
    }
    if (!formData.understoodCompliance) {
      Alert.alert('Compliance Acknowledgment Required', 'You must acknowledge FERPA/HIPAA compliance.');
      return false;
    }
    return true;
  };

  const sendVerificationCode = async () => {
    try {
      // TODO: Call API to send verification code
      // await fetch(`${API_URL}/api/auth/verify-email`, {
      //   method: 'POST',
      //   body: JSON.stringify({ email: formData.email })
      // });

      setVerificationSent(true);
      Alert.alert('Code Sent', `Verification code sent to ${formData.email}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to send verification code. Please try again.');
    }
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      sendVerificationCode();
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  const handleSignup = async () => {
    if (!validateStep3()) return;

    try {
      const user = await signupCoach(formData as CoachSignupData);

      Alert.alert('Success', 'Coach account created successfully!', [
        {
          text: 'Get Started',
          onPress: () => router.replace(getRoleBasedRoute(user.role)),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create account. Please try again.');
    }
  };

  return (
    <LinearGradient colors={['#1e3a8a', '#3b82f6']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Coach Account</Text>
          <Text style={styles.stepIndicator}>[{currentStep}/3]</Text>
        </View>

        {/* Form Content */}
        <View style={styles.formContainer}>
          {currentStep === 1 && (
            <Step1
              formData={formData}
              confirmPassword={confirmPassword}
              errors={errors}
              updateField={updateField}
              setConfirmPassword={setConfirmPassword}
            />
          )}
          {currentStep === 2 && (
            <Step2 formData={formData} errors={errors} updateField={updateField} />
          )}
          {currentStep === 3 && (
            <Step3
              formData={formData}
              errors={errors}
              updateField={updateField}
              verificationSent={verificationSent}
              sendVerificationCode={sendVerificationCode}
            />
          )}

          {/* Navigation Buttons */}
          <View style={styles.buttonContainer}>
            {currentStep < 3 ? (
              <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                <Text style={styles.nextButtonText}>
                  {currentStep === 1 ? 'Next: Coaching Info' : 'Next: Verification'}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.nextButton} onPress={handleSignup}>
                <Text style={styles.nextButtonText}>Create Coach Account</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

// Step 1: Basic Info (same as athlete)
function Step1({ formData, confirmPassword, errors, updateField, setConfirmPassword }: any) {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Basic Information</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Full Name *</Text>
        <TextInput
          style={[styles.input, errors.name && styles.inputError]}
          value={formData.name}
          onChangeText={(text) => updateField('name', text)}
          placeholder="Dr. Michael Chen"
          placeholderTextColor="#9ca3af"
        />
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email Address *</Text>
        <TextInput
          style={[styles.input, errors.email && styles.inputError]}
          value={formData.email}
          onChangeText={(text) => updateField('email', text)}
          placeholder="mchen@university.edu"
          placeholderTextColor="#9ca3af"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
        {!errors.email && (
          <Text style={styles.helpText}>Use your official organization email</Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Password *</Text>
        <TextInput
          style={[styles.input, errors.password && styles.inputError]}
          value={formData.password}
          onChangeText={(text) => updateField('password', text)}
          placeholder="••••••••"
          placeholderTextColor="#9ca3af"
          secureTextEntry
        />
        {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
        {!errors.password && (
          <Text style={styles.helpText}>Must be at least 8 characters</Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Confirm Password *</Text>
        <TextInput
          style={[styles.input, errors.confirmPassword && styles.inputError]}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="••••••••"
          placeholderTextColor="#9ca3af"
          secureTextEntry
        />
        {errors.confirmPassword && (
          <Text style={styles.errorText}>{errors.confirmPassword}</Text>
        )}
      </View>
    </View>
  );
}

// Step 2: Coaching Info
function Step2({ formData, errors, updateField }: any) {
  const sports = ['Basketball', 'Football', 'Soccer', 'Volleyball', 'Track & Field', 'Baseball', 'Softball', 'Wrestling', 'Tennis', 'Golf'];
  const titles = ['Sports Psychologist', 'Head Coach', 'Assistant Coach', 'Athletic Trainer', 'Performance Coach', 'Mental Skills Coach'];

  const toggleSport = (sport: string) => {
    const current = formData.sportsCoached || [];
    if (current.includes(sport)) {
      updateField('sportsCoached', current.filter((s: string) => s !== sport));
    } else {
      updateField('sportsCoached', [...current, sport]);
    }
  };

  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Coaching Information</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Sports You Coach * (select all that apply)</Text>
        <View style={styles.pillContainer}>
          {sports.map((sport) => (
            <TouchableOpacity
              key={sport}
              style={[
                styles.pill,
                formData.sportsCoached?.includes(sport) && styles.pillSelected,
              ]}
              onPress={() => toggleSport(sport)}
            >
              <Text
                style={[
                  styles.pillText,
                  formData.sportsCoached?.includes(sport) && styles.pillTextSelected,
                ]}
              >
                {sport}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.sportsCoached && <Text style={styles.errorText}>{errors.sportsCoached}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Organization/School *</Text>
        <TextInput
          style={[styles.input, errors.organization && styles.inputError]}
          value={formData.organization}
          onChangeText={(text) => updateField('organization', text)}
          placeholder="University of Washington"
          placeholderTextColor="#9ca3af"
        />
        {errors.organization && <Text style={styles.errorText}>{errors.organization}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Title/Role *</Text>
        <View style={styles.pillContainer}>
          {titles.map((title) => (
            <TouchableOpacity
              key={title}
              style={[styles.pill, formData.title === title && styles.pillSelected]}
              onPress={() => updateField('title', title)}
            >
              <Text
                style={[styles.pillText, formData.title === title && styles.pillTextSelected]}
              >
                {title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Years of Experience (optional)</Text>
        <TextInput
          style={styles.input}
          value={formData.yearsExperience?.toString() || ''}
          onChangeText={(text) => updateField('yearsExperience', text ? parseInt(text) : undefined)}
          placeholder="8"
          placeholderTextColor="#9ca3af"
          keyboardType="number-pad"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Certifications (optional)</Text>
        <TextInput
          style={styles.input}
          value={formData.certifications}
          onChangeText={(text) => updateField('certifications', text)}
          placeholder="CMPC, PhD Sport Psychology"
          placeholderTextColor="#9ca3af"
        />
      </View>
    </View>
  );
}

// Step 3: Verification & Consent
function Step3({ formData, errors, updateField, verificationSent, sendVerificationCode }: any) {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Verification</Text>

      <View style={styles.verificationBox}>
        <Text style={styles.verificationText}>
          We've sent a verification code to:
        </Text>
        <Text style={styles.verificationEmail}>{formData.email}</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Enter Code *</Text>
          <TextInput
            style={[styles.input, styles.codeInput, errors.verificationCode && styles.inputError]}
            value={formData.verificationCode}
            onChangeText={(text) => updateField('verificationCode', text.replace(/\s/g, ''))}
            placeholder="XXXXXX"
            placeholderTextColor="#9ca3af"
            maxLength={6}
            autoCapitalize="characters"
          />
        </View>

        <TouchableOpacity
          style={styles.resendButton}
          onPress={sendVerificationCode}
          disabled={!verificationSent}
        >
          <Text style={styles.resendText}>
            {verificationSent ? 'Resend Code' : 'Send Code'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      <Text style={styles.sectionHeading}>Privacy & Ethics</Text>

      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={() => updateField('agreedToCodeOfConduct', !formData.agreedToCodeOfConduct)}
      >
        <View
          style={[styles.checkbox, formData.agreedToCodeOfConduct && styles.checkboxChecked]}
        >
          {formData.agreedToCodeOfConduct && <Ionicons name="checkmark" size={20} color="#fff" />}
        </View>
        <Text style={styles.checkboxLabel}>
          I agree to the Coach Code of Conduct
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={() => updateField('understoodPrivacy', !formData.understoodPrivacy)}
      >
        <View style={[styles.checkbox, formData.understoodPrivacy && styles.checkboxChecked]}>
          {formData.understoodPrivacy && <Ionicons name="checkmark" size={20} color="#fff" />}
        </View>
        <Text style={styles.checkboxLabel}>
          I will only view athlete data with explicit consent
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={() => updateField('understoodCompliance', !formData.understoodCompliance)}
      >
        <View style={[styles.checkbox, formData.understoodCompliance && styles.checkboxChecked]}>
          {formData.understoodCompliance && <Ionicons name="checkmark" size={20} color="#fff" />}
        </View>
        <Text style={styles.checkboxLabel}>
          I understand FERPA/HIPAA compliance requirements
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  // ... (same styles as athlete.tsx, plus these additions)
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: { padding: 8 },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
    marginRight: 40,
  },
  stepIndicator: { fontSize: 16, fontWeight: '600', color: '#e0f2fe' },
  formContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    flex: 1,
  },
  stepContent: { marginBottom: 24 },
  stepTitle: { fontSize: 24, fontWeight: '700', color: '#1e3a8a', marginBottom: 24 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  inputError: { borderColor: '#dc2626' },
  errorText: { fontSize: 12, color: '#dc2626', marginTop: 4 },
  helpText: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  pillContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  pillSelected: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  pillText: { fontSize: 14, color: '#374151', fontWeight: '500' },
  pillTextSelected: { color: '#fff' },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
    marginTop: 8,
  },
  checkboxRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  checkboxLabel: { flex: 1, fontSize: 14, color: '#374151', lineHeight: 20 },
  divider: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 24 },
  buttonContainer: { marginTop: 8 },
  nextButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  verificationBox: {
    backgroundColor: '#f0f9ff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginBottom: 16,
  },
  verificationText: { fontSize: 14, color: '#1e3a8a', marginBottom: 8 },
  verificationEmail: { fontSize: 16, fontWeight: '700', color: '#1e3a8a', marginBottom: 16 },
  codeInput: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 4,
  },
  resendButton: { marginTop: 8 },
  resendText: { fontSize: 14, color: '#3b82f6', fontWeight: '600', textAlign: 'center' },
});
