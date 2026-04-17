import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Modal } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiClient, login } from '../../lib/auth';
import { Colors } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';

const SPORTS = [
  'Basketball', 'Football', 'Soccer', 'Baseball', 'Softball',
  'Volleyball', 'Track & Field', 'Cross Country', 'Swimming',
  'Tennis', 'Golf', 'Wrestling', 'Lacrosse', 'Hockey',
  'Rowing', 'Gymnastics', 'Other'
];

const YEARS = ['FRESHMAN', 'SOPHOMORE', 'JUNIOR', 'SENIOR', 'GRADUATE'];

export default function SignupScreen() {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sport, setSport] = useState('');
  const [year, setYear] = useState('');
  const [role, setRole] = useState<'ATHLETE' | 'COACH'>('ATHLETE');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSportPicker, setShowSportPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const router = useRouter();

  const handleSignup = async () => {
    if (!name || !email || !password) {
      setError('Please fill in all required fields');
      return;
    }

    if (role === 'ATHLETE' && (!sport || !year)) {
      setError('Please select your sport and year');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await apiClient.signup({
        name,
        email,
        password,
        role,
        sport: sport || undefined,
        year: year ? parseInt(year) : undefined,
      });

      // Auto-login after signup
      await login(email, password);

      // Force navigation
      setTimeout(() => {
        router.replace('/(tabs)/dashboard');
      }, 100);
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.card }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Create Account</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Join Flow Sports Coach</Text>

          <View style={styles.roleContainer}>
            <TouchableOpacity
              style={[styles.roleButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }, role === 'ATHLETE' && styles.roleButtonActive]}
              onPress={() => setRole('ATHLETE')}
            >
              <Text style={[styles.roleText, { color: colors.textSecondary }, role === 'ATHLETE' && styles.roleTextActive]}>
                Athlete
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }, role === 'COACH' && styles.roleButtonActive]}
              onPress={() => setRole('COACH')}
            >
              <Text style={[styles.roleText, { color: colors.textSecondary }, role === 'COACH' && styles.roleTextActive]}>
                Coach
              </Text>
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TextInput
            style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.textPrimary, borderColor: colors.border }]}
            placeholder="Full Name"
            placeholderTextColor={colors.gray400}
            value={name}
            onChangeText={(text) => {
              setName(text);
              setError('');
            }}
            editable={!isLoading}
          />

          <TextInput
            style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.textPrimary, borderColor: colors.border }]}
            placeholder="Email"
            placeholderTextColor={colors.gray400}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setError('');
            }}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!isLoading}
          />

          <TextInput
            style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.textPrimary, borderColor: colors.border }]}
            placeholder="Password"
            placeholderTextColor={colors.gray400}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setError('');
            }}
            secureTextEntry
            editable={!isLoading}
          />

          {role === 'ATHLETE' && (
            <>
              <TouchableOpacity
                style={[styles.pickerButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                onPress={() => setShowSportPicker(true)}
                disabled={isLoading}
              >
                <Text style={sport ? [styles.pickerButtonTextSelected, { color: colors.textPrimary }] : [styles.pickerButtonText, { color: colors.gray400 }]}>
                  {sport || 'Select Sport'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={colors.gray400} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.pickerButton, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                onPress={() => setShowYearPicker(true)}
                disabled={isLoading}
              >
                <Text style={year ? [styles.pickerButtonTextSelected, { color: colors.textPrimary }] : [styles.pickerButtonText, { color: colors.gray400 }]}>
                  {year ? year.charAt(0) + year.slice(1).toLowerCase() : 'Select Year'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={colors.gray400} />
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>{isLoading ? 'Creating account...' : 'Sign Up'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => router.push('/(auth)/login')}
            disabled={isLoading}
          >
            <Text style={styles.linkText}>Already have an account? Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Sport Picker Modal */}
      <Modal
        visible={showSportPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSportPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Select Sport</Text>
              <TouchableOpacity onPress={() => setShowSportPicker(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {SPORTS.map((sportOption) => (
                <TouchableOpacity
                  key={sportOption}
                  style={[
                    styles.modalOption,
                    { backgroundColor: colors.backgroundSecondary },
                    sport === sportOption && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    setSport(sportOption);
                    setShowSportPicker(false);
                    setError('');
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      { color: colors.textPrimary },
                      sport === sportOption && styles.modalOptionTextSelected,
                    ]}
                  >
                    {sportOption}
                  </Text>
                  {sport === sportOption && (
                    <Ionicons name="checkmark" size={20} color="#2563eb" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Year Picker Modal */}
      <Modal
        visible={showYearPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowYearPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Select Class Year</Text>
              <TouchableOpacity onPress={() => setShowYearPicker(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {YEARS.map((yearOption) => (
                <TouchableOpacity
                  key={yearOption}
                  style={[
                    styles.modalOption,
                    { backgroundColor: colors.backgroundSecondary },
                    year === yearOption && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    setYear(yearOption);
                    setShowYearPicker(false);
                    setError('');
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      { color: colors.textPrimary },
                      year === yearOption && styles.modalOptionTextSelected,
                    ]}
                  >
                    {yearOption.charAt(0) + yearOption.slice(1).toLowerCase()}
                  </Text>
                  {year === yearOption && (
                    <Ionicons name="checkmark" size={20} color="#2563eb" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.card,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  roleContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  roleButton: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
  },
  roleButtonActive: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  roleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  roleTextActive: {
    color: '#2563eb',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: Colors.backgroundSecondary,
  },
  button: {
    height: 50,
    backgroundColor: '#2563eb',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 16,
    padding: 8,
  },
  linkText: {
    color: '#2563eb',
    fontSize: 14,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    textAlign: 'center',
  },
  pickerButton: {
    height: 50,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: Colors.backgroundSecondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  pickerButtonTextSelected: {
    fontSize: 16,
    color: '#1f2937',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  modalScroll: {
    padding: 16,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: Colors.backgroundSecondary,
  },
  modalOptionSelected: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#1f2937',
  },
  modalOptionTextSelected: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '600',
  },
});
