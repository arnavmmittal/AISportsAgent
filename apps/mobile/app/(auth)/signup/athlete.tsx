/**
 * Athlete Signup Flow - 3 Steps
 * Step 1: Basic Info (name, email, password)
 * Step 2: Sport Info (sport, position, year, team)
 * Step 3: Privacy & Consent
 */

import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AthleteSignupData } from '../../../types/auth';
import { signupAthlete, getRoleBasedRoute } from '../../../lib/auth';

export default function AthleteSignup() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<AthleteSignupData>>({
    name: '',
    email: '',
    password: '',
    sport: '',
    position: '',
    year: '',
    team: '',
    age: undefined,
    consentCoachView: false,
    consentMoodShare: false,
    consentGoalsShare: false,
    agreedToTerms: false,
    understoodDisclaimer: false,
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (field: keyof AthleteSignupData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep1 = (): boolean => {
    console.log('🔍 [STEP 1 VALIDATION] Starting validation...');
    console.log('📝 Form Data:', {
      name: formData.name,
      email: formData.email,
      passwordLength: formData.password?.length,
      confirmPasswordLength: confirmPassword?.length
    });

    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter';
    } else if (!/[a-z]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one lowercase letter';
    } else if (!/[0-9]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one number';
    }
    if (formData.password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    console.log('❌ Validation Errors:', newErrors);
    console.log('✅ Validation Result:', Object.keys(newErrors).length === 0 ? 'PASSED' : 'FAILED');

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    console.log('🔍 [STEP 2 VALIDATION] Starting validation...');
    console.log('📝 Form Data:', {
      sport: formData.sport,
      position: formData.position,
      year: formData.year,
      team: formData.team,
      age: formData.age
    });

    const newErrors: Record<string, string> = {};

    if (!formData.sport?.trim()) {
      newErrors.sport = 'Sport is required';
    }
    if (!formData.position?.trim()) {
      newErrors.position = 'Position is required';
    }
    if (!formData.year) {
      newErrors.year = 'Year is required';
    }

    console.log('❌ Validation Errors:', newErrors);
    console.log('✅ Validation Result:', Object.keys(newErrors).length === 0 ? 'PASSED' : 'FAILED');

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = (): boolean => {
    console.log('🔍 [STEP 3 VALIDATION] Starting validation...');
    console.log('📝 Consent Data:', {
      consentCoachView: formData.consentCoachView,
      consentMoodShare: formData.consentMoodShare,
      consentGoalsShare: formData.consentGoalsShare,
      agreedToTerms: formData.agreedToTerms,
      understoodDisclaimer: formData.understoodDisclaimer
    });

    if (!formData.agreedToTerms) {
      console.log('❌ Terms not agreed to');
      Alert.alert('Terms Required', 'You must agree to the Terms of Service to continue.');
      return false;
    }
    if (!formData.understoodDisclaimer) {
      console.log('❌ Disclaimer not acknowledged');
      Alert.alert('Disclaimer Required', 'You must acknowledge the disclaimer to continue.');
      return false;
    }

    console.log('✅ Step 3 validation PASSED');
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.push('/(auth)/welcome');
    }
  };

  const handleSignup = async () => {
    console.log('🚀 [SIGNUP] Starting signup process...');

    if (!validateStep3()) {
      console.log('❌ [SIGNUP] Step 3 validation failed, aborting');
      return;
    }

    console.log('📤 [SIGNUP] Sending to signupAthlete with data:', {
      ...formData,
      password: '***hidden***'
    });

    try {
      const user = await signupAthlete(formData as AthleteSignupData);

      console.log('✅ [SIGNUP] Success! User created:', user);

      Alert.alert('Success', 'Account created successfully!', [
        {
          text: 'Get Started',
          onPress: () => router.replace(getRoleBasedRoute(user.role)),
        },
      ]);
    } catch (error: any) {
      console.error('❌ [SIGNUP] Error during signup:', error);
      console.error('❌ [SIGNUP] Error message:', error.message);
      console.error('❌ [SIGNUP] Full error:', JSON.stringify(error, null, 2));

      // Check if account already exists
      if (error.message?.includes('already exists')) {
        Alert.alert(
          'Account Already Exists',
          'An account with this email is already registered. Would you like to log in instead?',
          [
            {
              text: 'Cancel',
              style: 'cancel'
            },
            {
              text: 'Log In',
              onPress: () => router.push('/(auth)/login')
            }
          ]
        );
      } else {
        Alert.alert('Error', error.message || 'Failed to create account. Please try again.');
      }
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
          <Text style={styles.headerTitle}>Create Athlete Account</Text>
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
          {currentStep === 3 && <Step3 formData={formData} updateField={updateField} />}

          {/* Navigation Buttons */}
          <View style={styles.buttonContainer}>
            {currentStep < 3 ? (
              <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                <Text style={styles.nextButtonText}>
                  {currentStep === 1 ? 'Next: Sport Info' : 'Next: Privacy Settings'}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.nextButton} onPress={handleSignup}>
                <Text style={styles.nextButtonText}>Create Account</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

// Step 1: Basic Info
function Step1({
  formData,
  confirmPassword,
  errors,
  updateField,
  setConfirmPassword,
}: any) {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Basic Information</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Full Name *</Text>
        <TextInput
          style={[styles.input, errors.name && styles.inputError]}
          value={formData.name}
          onChangeText={(text) => updateField('name', text)}
          placeholder="Sarah Johnson"
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
          placeholder="sarah.j@university.edu"
          placeholderTextColor="#9ca3af"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Password *</Text>
        <TextInput
          style={[styles.input, errors.password && styles.inputError]}
          value={formData.password}
          onChangeText={(text) => updateField('password', text)}
          placeholder="Enter your password"
          placeholderTextColor="#9ca3af"
          secureTextEntry
          autoComplete="off"
          textContentType="oneTimeCode"
          autoCorrect={false}
          keyboardType="default"
          spellCheck={false}
        />
        {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
        {!errors.password && (
          <Text style={styles.helpText}>Must be 8+ characters with uppercase, lowercase, and number</Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Confirm Password *</Text>
        <TextInput
          style={[styles.input, errors.confirmPassword && styles.inputError]}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm your password"
          placeholderTextColor="#9ca3af"
          secureTextEntry
          autoComplete="off"
          textContentType="oneTimeCode"
          autoCorrect={false}
          keyboardType="default"
          spellCheck={false}
        />
        {errors.confirmPassword && (
          <Text style={styles.errorText}>{errors.confirmPassword}</Text>
        )}
      </View>
    </View>
  );
}

// Step 2: Sport Info
function Step2({ formData, errors, updateField }: any) {
  const sports = ['Basketball', 'Football', 'Soccer', 'Volleyball', 'Track & Field', 'Baseball', 'Softball', 'Other'];
  const years = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate'];

  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Sport Information</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Primary Sport *</Text>
        <View style={styles.pillContainer}>
          {sports.map((sport) => (
            <TouchableOpacity
              key={sport}
              style={[styles.pill, formData.sport === sport && styles.pillSelected]}
              onPress={() => updateField('sport', sport)}
            >
              <Text
                style={[styles.pillText, formData.sport === sport && styles.pillTextSelected]}
              >
                {sport}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.sport && <Text style={styles.errorText}>{errors.sport}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Position *</Text>
        <TextInput
          style={[styles.input, errors.position && styles.inputError]}
          value={formData.position}
          onChangeText={(text) => updateField('position', text)}
          placeholder="Point Guard, Linebacker, Forward, etc."
          placeholderTextColor="#9ca3af"
        />
        {errors.position && <Text style={styles.errorText}>{errors.position}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Year *</Text>
        <View style={styles.pillContainer}>
          {years.map((year) => (
            <TouchableOpacity
              key={year}
              style={[styles.pill, formData.year === year && styles.pillSelected]}
              onPress={() => updateField('year', year)}
            >
              <Text
                style={[styles.pillText, formData.year === year && styles.pillTextSelected]}
              >
                {year}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.year && <Text style={styles.errorText}>{errors.year}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Team/Organization (optional)</Text>
        <TextInput
          style={styles.input}
          value={formData.team}
          onChangeText={(text) => updateField('team', text)}
          placeholder="University Basketball Team"
          placeholderTextColor="#9ca3af"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Age (optional)</Text>
        <TextInput
          style={styles.input}
          value={formData.age?.toString() || ''}
          onChangeText={(text) => updateField('age', text ? parseInt(text) : undefined)}
          placeholder="20"
          placeholderTextColor="#9ca3af"
          keyboardType="number-pad"
        />
      </View>
    </View>
  );
}

// Step 3: Privacy & Consent
function Step3({ formData, updateField }: any) {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Privacy Settings</Text>

      <Text style={styles.sectionHeading}>Coach Access</Text>

      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={() => updateField('consentCoachView', !formData.consentCoachView)}
      >
        <View style={[styles.checkbox, formData.consentCoachView && styles.checkboxChecked]}>
          {formData.consentCoachView && <Ionicons name="checkmark" size={20} color="#fff" />}
        </View>
        <Text style={styles.checkboxLabel}>
          Allow my coach to view anonymized chat summaries
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={() => updateField('consentMoodShare', !formData.consentMoodShare)}
      >
        <View style={[styles.checkbox, formData.consentMoodShare && styles.checkboxChecked]}>
          {formData.consentMoodShare && <Ionicons name="checkmark" size={20} color="#fff" />}
        </View>
        <Text style={styles.checkboxLabel}>
          Allow my coach to view my mood logs and trends
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={() => updateField('consentGoalsShare', !formData.consentGoalsShare)}
      >
        <View style={[styles.checkbox, formData.consentGoalsShare && styles.checkboxChecked]}>
          {formData.consentGoalsShare && <Ionicons name="checkmark" size={20} color="#fff" />}
        </View>
        <Text style={styles.checkboxLabel}>Allow my coach to view my goal progress</Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      <Text style={styles.sectionHeading}>Terms & Conditions</Text>

      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={() => updateField('agreedToTerms', !formData.agreedToTerms)}
      >
        <View style={[styles.checkbox, formData.agreedToTerms && styles.checkboxChecked]}>
          {formData.agreedToTerms && <Ionicons name="checkmark" size={20} color="#fff" />}
        </View>
        <Text style={styles.checkboxLabel}>
          I agree to the Terms of Service and Privacy Policy
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.checkboxRow}
        onPress={() => updateField('understoodDisclaimer', !formData.understoodDisclaimer)}
      >
        <View
          style={[styles.checkbox, formData.understoodDisclaimer && styles.checkboxChecked]}
        >
          {formData.understoodDisclaimer && <Ionicons name="checkmark" size={20} color="#fff" />}
        </View>
        <Text style={styles.checkboxLabel}>
          I understand that this is NOT a replacement for professional mental health care
        </Text>
      </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
    marginRight: 40,
  },
  stepIndicator: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e0f2fe',
  },
  formContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    flex: 1,
  },
  stepContent: {
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e3a8a',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
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
  inputError: {
    borderColor: '#dc2626',
  },
  errorText: {
    fontSize: 12,
    color: '#dc2626',
    marginTop: 4,
  },
  helpText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  pillSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  pillText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  pillTextSelected: {
    color: '#fff',
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
    marginTop: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
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
  checkboxChecked: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 24,
  },
  buttonContainer: {
    marginTop: 8,
  },
  nextButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
