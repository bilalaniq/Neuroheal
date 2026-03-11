import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import {
    requestNotificationPermissions,
    addNotificationReceivedListener,
    addNotificationResponseListener,
} from '@/services/notificationService';

export interface NotificationSettings {
    dailyReminder: boolean;
    dailyReminderTime: { hour: number; minute: number };
    weeklyReport: boolean;
    weeklyReportDay: number; // 0 = Sunday, 1 = Monday, etc.
    weeklyReportTime: { hour: number; minute: number };
}

export function useNotifications() {
    const [permissionGranted, setPermissionGranted] = useState(false);
    const [notification, setNotification] = useState<Notifications.Notification | null>(null);

    useEffect(() => {
        // Request notification permissions on mount
        const setupNotifications = async () => {
            const granted = await requestNotificationPermissions();
            setPermissionGranted(granted);
        };

        setupNotifications();
    }, []);

    useEffect(() => {
        // Only set up listeners on actual devices, not web
        if (!Device.isDevice || Platform.OS === 'web') {
            return;
        }

        // Listen for notification received while app is in foreground
        const notificationReceivedListener = addNotificationReceivedListener((notification) => {
            setNotification(notification);
        });

        // Listen for notification tap/response
        const notificationResponseListener = addNotificationResponseListener((response) => {
            console.log('Notification tapped:', response.notification.request.content.data);

            // Handle different notification types
            const notificationType = response.notification.request.content.data?.type;

            switch (notificationType) {
                case 'daily-reminder':
                    // Navigate to diary or dashboard
                    break;
                case 'weekly-report':
                    // Navigate to complete-report
                    break;
                case 'medication-reminder':
                    // Navigate to health-metrics
                    break;
                default:
                    break;
            }
        });

        return () => {
            notificationReceivedListener.remove();
            notificationResponseListener.remove();
        };
    }, []);

    return {
        permissionGranted,
        notification,
    };
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
    dailyReminder: true,
    dailyReminderTime: { hour: 9, minute: 0 },
    weeklyReport: true,
    weeklyReportDay: 1, // Monday
    weeklyReportTime: { hour: 18, minute: 0 },
};
