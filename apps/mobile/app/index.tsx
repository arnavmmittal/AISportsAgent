/**
 * Entry point for the mobile app
 * Handles initial routing based on authentication state
 */

import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { initializeAuth } from '../lib/auth';

export default function Index() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkAuth() {
      const authenticated = await initializeAuth();
      setIsAuthenticated(authenticated);
    }
    checkAuth();
  }, []);

  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  // Redirect to appropriate screen
  // Unauthenticated users see welcome screen with login/signup options
  return <Redirect href={isAuthenticated ? '/(tabs)/dashboard' : '/(auth)/welcome'} />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
