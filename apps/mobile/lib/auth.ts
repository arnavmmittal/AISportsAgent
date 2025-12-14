import * as SecureStore from 'expo-secure-store';
import { createAPIClient } from '@sports-agent/api-client';
import config from '../config';
import type { AuthResponse, User, AthleteSignupData, CoachSignupData } from '../types/auth';

// Use centralized configuration - no more hardcoded IPs!
// Update your IP in .env.local file instead
const API_URL = config.apiUrl;

export const apiClient = createAPIClient(API_URL);

export async function login(email: string, password: string): Promise<User> {
  const { user, token } = await apiClient.login(email, password);

  // Store token and user info securely
  await SecureStore.setItemAsync('auth_token', token);
  await SecureStore.setItemAsync('user_id', user.id);
  await SecureStore.setItemAsync('user_role', user.role);
  await SecureStore.setItemAsync('user_data', JSON.stringify(user));

  apiClient.setToken(token);

  return user;
}

export async function signupAthlete(data: AthleteSignupData): Promise<User> {
  console.log('🌐 [API] signupAthlete called');
  console.log('🔗 [API] Target URL:', `${API_URL}/api/auth/signup`);

  const payload = {
    name: data.name,
    email: data.email,
    password: data.password,
    role: 'ATHLETE',
    sport: data.sport,
    year: data.year?.toUpperCase(), // Backend expects UPPERCASE enum values
  };

  console.log('📦 [API] Request Payload:', {
    ...payload,
    password: '***hidden***'
  });

  const response = await fetch(`${API_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  console.log('📡 [API] Response Status:', response.status, response.statusText);

  if (!response.ok) {
    const error = await response.json();
    console.error('❌ [API] Signup failed with error:', error);
    console.error('❌ [API] Error message:', error.error);
    console.error('❌ [API] Validation details:', error.details);
    console.error('❌ [API] Full error object:', JSON.stringify(error, null, 2));
    throw new Error(error.error || 'Signup failed');
  }

  const responseData = await response.json();
  console.log('✅ [API] Signup successful! Response:', responseData);
  const { user: createdUser } = responseData;

  console.log('🔐 [API] Now attempting login with credentials...');
  // Now login to get the token
  const { user, token } = await apiClient.login(data.email, data.password);

  console.log('✅ [API] Login successful! User:', user);

  // Store auth data
  await SecureStore.setItemAsync('auth_token', token);
  await SecureStore.setItemAsync('user_id', user.id);
  await SecureStore.setItemAsync('user_role', user.role);
  await SecureStore.setItemAsync('user_data', JSON.stringify(user));

  apiClient.setToken(token);

  console.log('💾 [API] Auth data stored in SecureStore');
  return user;
}

export async function signupCoach(data: CoachSignupData): Promise<User> {
  // Note: Email verification should be handled before signup
  // For now, we'll proceed with signup directly
  const response = await fetch(`${API_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: data.name,
      email: data.email,
      password: data.password,
      role: 'COACH',
      sport: data.sportsCoached[0] || 'Multiple', // Backend expects single sport currently
      title: data.title,
      // Additional coach-specific fields can be updated via profile API later
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Signup failed');
  }

  const { user: createdUser } = await response.json();

  // Now login to get the token
  const { user, token } = await apiClient.login(data.email, data.password);

  // Store auth data
  await SecureStore.setItemAsync('auth_token', token);
  await SecureStore.setItemAsync('user_id', user.id);
  await SecureStore.setItemAsync('user_role', user.role);
  await SecureStore.setItemAsync('user_data', JSON.stringify(user));

  apiClient.setToken(token);

  return user;
}

export async function logout() {
  await SecureStore.deleteItemAsync('auth_token');
  await SecureStore.deleteItemAsync('user_id');
  await SecureStore.deleteItemAsync('user_role');
  await SecureStore.deleteItemAsync('user_data');
  apiClient.clearToken();
}

export async function getStoredToken() {
  return await SecureStore.getItemAsync('auth_token');
}

export async function getStoredUserId() {
  return await SecureStore.getItemAsync('user_id');
}

export async function getStoredUserRole(): Promise<'ATHLETE' | 'COACH' | 'ADMIN' | null> {
  const role = await SecureStore.getItemAsync('user_role');
  return role as 'ATHLETE' | 'COACH' | 'ADMIN' | null;
}

export async function getStoredUser(): Promise<User | null> {
  const userData = await SecureStore.getItemAsync('user_data');
  if (userData) {
    try {
      return JSON.parse(userData) as User;
    } catch {
      return null;
    }
  }
  return null;
}

export async function initializeAuth() {
  const token = await getStoredToken();
  if (token) {
    apiClient.setToken(token);
    return true;
  }
  return false;
}

/**
 * Get the appropriate route based on user role
 */
export function getRoleBasedRoute(role: 'ATHLETE' | 'COACH' | 'ADMIN'): string {
  switch (role) {
    case 'ATHLETE':
      return '/(tabs)/dashboard';
    case 'COACH':
      return '/(coach)/dashboard';  // TODO: Create coach dashboard
    case 'ADMIN':
      return '/(admin)/dashboard';  // TODO: Create admin dashboard
    default:
      return '/(tabs)/dashboard';
  }
}
