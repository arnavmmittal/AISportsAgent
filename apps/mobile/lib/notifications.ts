import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { apiClient } from './auth';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request notification permissions and register for push notifications
 */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    // Check if running on physical device
    if (!Device.isDevice) {
      console.log('Push notifications only work on physical devices');
      return null;
    }

    // Request permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push notification permissions');
      return null;
    }

    // Get push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: '7f37c27e-87fb-4c22-9fc1-08cd8e8e39a8', // Your Expo project ID
    });
    const token = tokenData.data;

    console.log('Push notification token:', token);

    // Platform-specific setup for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#8b5cf6',
      });

      // Crisis alerts channel (high priority)
      await Notifications.setNotificationChannelAsync('crisis', {
        name: 'Crisis Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 500, 250, 500],
        lightColor: '#ef4444',
        sound: 'default',
      });

      // Assignment reminders channel
      await Notifications.setNotificationChannelAsync('assignments', {
        name: 'Assignment Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#10b981',
      });

      // Goal milestones channel
      await Notifications.setNotificationChannelAsync('goals', {
        name: 'Goal Milestones',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250],
        lightColor: '#f59e0b',
      });
    }

    // Register token with backend (will be implemented)
    try {
      // await apiClient.registerPushToken(token, Platform.OS);
      console.log('Push token registered with backend (TODO: implement endpoint)');
    } catch (error) {
      console.error('Failed to register push token with backend:', error);
    }

    return token;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
}

/**
 * Schedule a local notification for assignment reminder
 */
export async function scheduleAssignmentReminder(
  assignmentId: string,
  title: string,
  dueDate: Date
): Promise<string | null> {
  try {
    // Schedule notification 1 day before due date
    const reminderDate = new Date(dueDate);
    reminderDate.setDate(reminderDate.getDate() - 1);
    reminderDate.setHours(9, 0, 0, 0); // 9 AM

    // Don't schedule if reminder is in the past
    if (reminderDate < new Date()) {
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '📝 Assignment Due Tomorrow',
        body: title,
        data: {
          type: 'assignment_reminder',
          assignmentId,
        },
        sound: 'default',
      },
      trigger: {
        date: reminderDate,
        channelId: 'assignments',
      },
    });

    console.log(`Scheduled assignment reminder: ${notificationId}`);
    return notificationId;
  } catch (error) {
    console.error('Error scheduling assignment reminder:', error);
    return null;
  }
}

/**
 * Schedule a local notification for goal milestone
 */
export async function scheduleGoalMilestone(
  goalId: string,
  title: string,
  progress: number
): Promise<void> {
  try {
    // Trigger immediate notification for milestone achievements
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎯 Goal Milestone Reached!',
        body: `${title} - ${progress}% complete`,
        data: {
          type: 'goal_milestone',
          goalId,
          progress,
        },
        sound: 'default',
      },
      trigger: null, // Immediate
    });

    console.log(`Scheduled goal milestone notification for ${goalId}`);
  } catch (error) {
    console.error('Error scheduling goal milestone:', error);
  }
}

/**
 * Send immediate crisis alert notification (local)
 */
export async function sendCrisisAlert(message: string): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⚠️ Support Available 24/7',
        body: message,
        data: {
          type: 'crisis_alert',
        },
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.MAX,
      },
      trigger: null, // Immediate
    });

    console.log('Crisis alert notification sent');
  } catch (error) {
    console.error('Error sending crisis alert:', error);
  }
}

/**
 * Set up notification listeners
 */
export function setupNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationResponse?: (response: Notifications.NotificationResponse) => void
) {
  // Notification received while app is foregrounded
  const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
    console.log('Notification received:', notification);
    if (onNotificationReceived) {
      onNotificationReceived(notification);
    }
  });

  // User interacted with notification (tapped)
  const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    console.log('Notification response:', response);
    if (onNotificationResponse) {
      onNotificationResponse(response);
    }
  });

  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
}
