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
  // TODO: Replace with actual API call
  // const response = await fetch(`${API_URL}/api/auth/signup/athlete`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(data),
  // });
  // const { user, token }: AuthResponse = await response.json();

  // For now, mock response
  const user: User = {
    id: 'athlete-' + Date.now(),
    email: data.email,
    name: data.name,
    role: 'ATHLETE',
    athlete: {
      sport: data.sport,
      position: data.position,
      year: data.year,
      team: data.team,
      age: data.age,
      consentCoachView: data.consentCoachView,
    },
    onboardingCompleted: true,
    createdAt: new Date().toISOString(),
  };

  const token = 'mock-token-' + Date.now();

  // Store auth data
  await SecureStore.setItemAsync('auth_token', token);
  await SecureStore.setItemAsync('user_id', user.id);
  await SecureStore.setItemAsync('user_role', user.role);
  await SecureStore.setItemAsync('user_data', JSON.stringify(user));

  apiClient.setToken(token);

  return user;
}

export async function signupCoach(data: CoachSignupData): Promise<User> {
  // TODO: Replace with actual API call
  // const response = await fetch(`${API_URL}/api/auth/signup/coach`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(data),
  // });
  // const { user, token }: AuthResponse = await response.json();

  // For now, mock response
  const user: User = {
    id: 'coach-' + Date.now(),
    email: data.email,
    name: data.name,
    role: 'COACH',
    coach: {
      sportsCoached: data.sportsCoached,
      organization: data.organization,
      title: data.title,
      yearsExperience: data.yearsExperience,
      certifications: data.certifications,
    },
    onboardingCompleted: true,
    createdAt: new Date().toISOString(),
  };

  const token = 'mock-token-' + Date.now();

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
