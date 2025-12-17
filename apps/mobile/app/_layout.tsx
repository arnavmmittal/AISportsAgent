import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, useRef } from 'react';
import { useColorScheme } from 'react-native';
import 'react-native-reanimated';
import * as Notifications from 'expo-notifications';

import { initializeAuth } from '../lib/auth';
import { registerForPushNotifications, setupNotificationListeners } from '../lib/notifications';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const segments = useSegments();
  const router = useRouter();
  const notificationListener = useRef<(() => void) | null>(null);

  // Check authentication status
  const checkAuth = async () => {
    const authenticated = await initializeAuth();
    setIsAuthenticated(authenticated);
    return authenticated;
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // Set up push notifications after authentication
  useEffect(() => {
    if (isAuthenticated) {
      // Register for push notifications
      registerForPushNotifications().then((token) => {
        console.log('Push notification token:', token);
      });

      // Set up notification listeners
      const cleanup = setupNotificationListeners(
        (notification) => {
          console.log('Notification received in app:', notification);
        },
        (response) => {
          console.log('User tapped notification:', response);

          // Handle navigation based on notification type
          const data = response.notification.request.content.data;
          if (data.type === 'crisis_alert') {
            router.push('/(tabs)/chat');
          } else if (data.type === 'assignment_reminder') {
            router.push('/(tabs)/assignments');
          } else if (data.type === 'goal_milestone') {
            router.push('/(tabs)/goals');
          }
        }
      );

      notificationListener.current = cleanup;

      return () => {
        if (notificationListener.current) {
          notificationListener.current();
        }
      };
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated === null) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/welcome');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)/dashboard');
    }
  }, [isAuthenticated]);

  if (isAuthenticated === null) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </ThemeProvider>
  );
}
