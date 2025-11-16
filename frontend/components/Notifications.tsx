// NotificationsManager.ts
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true
  }),
});

  export const createNotificationChannel = async () => {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default', // Ensure the channel is configured to play sound
      });
    }
  };

export const requestNotificationPermission = async () => {
  const { status } = await Notifications.getPermissionsAsync();

  if (status !== 'granted') {
    const { status: newStatus } = await Notifications.requestPermissionsAsync();
    return newStatus === 'granted';
  }

  return true;
};

export const scheduleDailyNotification = async (time: string) => {
  const [hour, minute] = time.split(':').map(Number);

  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'OnePlace',
      body: 'Do not forget to complete all habits today and celebrate your journey!',
      sound: 'default'
    },
    trigger: {
      type: SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
};

// Cancel all scheduled notifications on disabling Receiving notification
export const cancelAllNotifications = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};
