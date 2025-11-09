import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Request permissions
async function registerForPushNotificationsAsync() {
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      alert('Failed to get push token for notifications!');
      return;
    }
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }
}

// Schedule notification at a specific time
export async function scheduleDailyNotification(hour = 9, minute = 0) {
    const trigger: Notifications.CalendarTriggerInput = {
      type: 'calendar',
      hour,
      minute,
      repeats: true, // Repeat daily at the specified time
    };
  
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Reminder!',
        body: 'This is your daily notification.',
      },
      trigger, // Use the properly typed trigger
    });
}
