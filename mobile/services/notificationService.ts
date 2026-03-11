import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure notification behavior only on devices
if (Device.isDevice && Platform.OS !== 'web') {
    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
        }),
    });
}

export interface NotificationSchedule {
    id: string;
    trigger: Notifications.NotificationTriggerInput;
    content: Notifications.NotificationContentInput;
}

export async function requestNotificationPermissions(): Promise<boolean> {
    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        return finalStatus === 'granted';
    } else {
        console.log('Push notifications work only on physical devices.');
        return false;
    }
}

export async function scheduleDailyReminder(
    hour: number = 9,
    minute: number = 0,
    title: string = "Daily Migraine Check-in",
    body: string = "How are you feeling today? Log your migraine status."
): Promise<string> {
    if (!Device.isDevice || Platform.OS === 'web') {
        console.log('Push notifications not available on web. Feature available on iOS/Android.');
        return '';
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body,
            sound: true,
            badge: 1,
            data: {
                type: 'daily-reminder',
            },
        },
        trigger: {
            type: 'daily',
            hour,
            minute,
        },
    });

    return notificationId;
}

export async function scheduleMedicationReminder(
    hour: number,
    minute: number,
    medicationName: string
): Promise<string> {
    if (!Device.isDevice || Platform.OS === 'web') {
        console.log('Push notifications not available on web. Feature available on iOS/Android.');
        return '';
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
            title: 'Medication Reminder',
            body: `Time to take your ${medicationName}`,
            sound: true,
            badge: 1,
            data: {
                type: 'medication-reminder',
                medication: medicationName,
            },
        },
        trigger: {
            type: 'daily',
            hour,
            minute,
        },
    });

    return notificationId;
}

export async function scheduleWeeklyReport(
    dayOfWeek: number = 1, // 0 = Sunday, 1 = Monday, etc.
    hour: number = 18,
    minute: number = 0
): Promise<string> {
    if (!Device.isDevice || Platform.OS === 'web') {
        console.log('Push notifications not available on web. Feature available on iOS/Android.');
        return '';
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
            title: 'Weekly Migraine Report',
            body: 'Tap to view your weekly analysis and patterns',
            sound: true,
            badge: 1,
            data: {
                type: 'weekly-report',
            },
        },
        trigger: {
            type: 'weekly',
            weekday: dayOfWeek,
            hour,
            minute,
        },
    });

    return notificationId;
}

export async function cancelNotification(notificationId: string): Promise<void> {
    if (!Device.isDevice || Platform.OS === 'web') return;
    await Notifications.cancelScheduledNotificationAsync(notificationId);
}

export async function cancelAllNotifications(): Promise<void> {
    if (!Device.isDevice || Platform.OS === 'web') return;
    await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function getAllScheduledNotifications(): Promise<Notifications.ScheduledNotificationResponse[]> {
    if (!Device.isDevice || Platform.OS === 'web') return [];
    return await Notifications.getAllScheduledNotificationsAsync();
}

export function addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
): Notifications.Subscription {
    if (!Device.isDevice || Platform.OS === 'web') {
        // Return a mock subscription for web
        return {
            remove: () => { },
        } as unknown as Notifications.Subscription;
    }
    return Notifications.addNotificationReceivedListener(callback);
}

export function addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
    if (!Device.isDevice || Platform.OS === 'web') {
        // Return a mock subscription for web
        return {
            remove: () => { },
        } as unknown as Notifications.Subscription;
    }
    return Notifications.addNotificationResponseListener(callback);
}

export async function sendLocalNotification(
    title: string,
    body: string,
    data?: Record<string, any>
): Promise<string> {
    if (!Device.isDevice || Platform.OS === 'web') {
        console.log('Push notifications not available on web. Feature available on iOS/Android.');
        return '';
    }

    return await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body,
            sound: true,
            badge: 1,
            data: data || {},
        },
        trigger: null,
    });
}
