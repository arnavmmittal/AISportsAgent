import * as SecureStore from 'expo-secure-store';
import { createAPIClient } from '@sports-agent/api-client';

const API_URL = __DEV__
  ? 'http://10.0.0.34:3000'  // Local dev - use your computer's IP for physical devices
  : 'https://your-production-url.vercel.app';  // Production

export const apiClient = createAPIClient(API_URL);

export async function login(email: string, password: string) {
  const { user, token } = await apiClient.login(email, password);

  // Store token securely
  await SecureStore.setItemAsync('auth_token', token);
  await SecureStore.setItemAsync('user_id', user.id);
  await SecureStore.setItemAsync('user_role', user.role);

  apiClient.setToken(token);

  return user;
}

export async function logout() {
  await SecureStore.deleteItemAsync('auth_token');
  await SecureStore.deleteItemAsync('user_id');
  await SecureStore.deleteItemAsync('user_role');
  apiClient.clearToken();
}

export async function getStoredToken() {
  return await SecureStore.getItemAsync('auth_token');
}

export async function getStoredUserId() {
  return await SecureStore.getItemAsync('user_id');
}

export async function getStoredUserRole() {
  return await SecureStore.getItemAsync('user_role');
}

export async function initializeAuth() {
  const token = await getStoredToken();
  if (token) {
    apiClient.setToken(token);
    return true;
  }
  return false;
}
