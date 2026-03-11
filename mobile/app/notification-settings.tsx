import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useUser } from '@/contexts/UserContext';
import { ModernHeader } from '@/components/ModernHeader';
import {
    scheduleDailyReminder,
    scheduleWeeklyReport,
    cancelAllNotifications,
} from '@/services/notificationService';
import { DEFAULT_NOTIFICATION_SETTINGS } from '@/hooks/useNotifications';

const { width } = Dimensions.get('window');
const maxWidth = Math.min(width - 48, 448);

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

function NotificationSettingsContent() {
    const router = useRouter();
    const { darkMode } = useTheme();
    const { userData, updateNotificationSettings } = useUser();
    const [settings, setSettings] = useState(
        userData?.notificationSettings || DEFAULT_NOTIFICATION_SETTINGS
    );
    const [isSaving, setIsSaving] = useState(false);

    const toggleDailyReminder = async (enabled: boolean) => {
        setSettings(prev => ({ ...prev, dailyReminder: enabled }));
        if (enabled) {
            await scheduleDailyReminder(
                settings.dailyReminderTime.hour,
                settings.dailyReminderTime.minute
            );
        } else {
            await cancelAllNotifications();
        }
    };

    const updateDailyReminderTime = (hour: number, minute: number) => {
        setSettings(prev => ({
            ...prev,
            dailyReminderTime: { hour, minute },
        }));
    };

    const toggleWeeklyReport = async (enabled: boolean) => {
        setSettings(prev => ({ ...prev, weeklyReport: enabled }));
        if (enabled) {
            await scheduleWeeklyReport(
                settings.weeklyReportDay,
                settings.weeklyReportTime.hour,
                settings.weeklyReportTime.minute
            );
        } else {
            await cancelAllNotifications();
        }
    };

    const updateWeeklyReportSettings = (day: number, hour: number, minute: number) => {
        setSettings(prev => ({
            ...prev,
            weeklyReportDay: day,
            weeklyReportTime: { hour, minute },
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            updateNotificationSettings(settings);

            // Re-schedule notifications with new settings
            await cancelAllNotifications();

            if (settings.dailyReminder) {
                await scheduleDailyReminder(
                    settings.dailyReminderTime.hour,
                    settings.dailyReminderTime.minute
                );
            }

            if (settings.weeklyReport) {
                await scheduleWeeklyReport(
                    settings.weeklyReportDay,
                    settings.weeklyReportTime.hour,
                    settings.weeklyReportTime.minute
                );
            }
        } catch (error) {
            console.error('Failed to save notification settings:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <View style={[styles.container, darkMode && styles.containerDark]}>
            <ModernHeader title="Notification Settings" onBack={() => router.back()} />
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
                <View style={[styles.card, darkMode && styles.cardDark]}>
                    {/* Daily Reminder Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="notifications" size={24} color={darkMode ? '#a8d5c4' : '#2d4a42'} />
                            <Text style={[styles.sectionTitle, darkMode && styles.textLight]}>Daily Reminder</Text>
                            <Switch
                                value={settings.dailyReminder}
                                onValueChange={toggleDailyReminder}
                                trackColor={{ false: '#ccc', true: '#a8d5c4' }}
                                thumbColor={settings.dailyReminder ? '#2d4a42' : '#999'}
                            />
                        </View>

                        {settings.dailyReminder && (
                            <View style={styles.timeSelector}>
                                <Text style={[styles.label, darkMode && styles.textLight]}>Time:</Text>
                                <View style={styles.timeInputs}>
                                    <View style={styles.timeInput}>
                                        <Text style={[styles.timeInputLabel, darkMode && styles.textLight]}>Hour</Text>
                                        <Pressable
                                            style={[styles.timeButton, darkMode && styles.timeButtonDark]}
                                            onPress={() => {
                                                const newHour = (settings.dailyReminderTime.hour + 1) % 24;
                                                updateDailyReminderTime(newHour, settings.dailyReminderTime.minute);
                                            }}
                                        >
                                            <Text style={[styles.timeButtonText, darkMode && styles.textLight]}>
                                                {String(settings.dailyReminderTime.hour).padStart(2, '0')}
                                            </Text>
                                        </Pressable>
                                    </View>

                                    <Text style={[styles.timeSeparator, darkMode && styles.textLight]}>:</Text>

                                    <View style={styles.timeInput}>
                                        <Text style={[styles.timeInputLabel, darkMode && styles.textLight]}>Minute</Text>
                                        <Pressable
                                            style={[styles.timeButton, darkMode && styles.timeButtonDark]}
                                            onPress={() => {
                                                const newMinute = (settings.dailyReminderTime.minute + 15) % 60;
                                                updateDailyReminderTime(settings.dailyReminderTime.hour, newMinute);
                                            }}
                                        >
                                            <Text style={[styles.timeButtonText, darkMode && styles.textLight]}>
                                                {String(settings.dailyReminderTime.minute).padStart(2, '0')}
                                            </Text>
                                        </Pressable>
                                    </View>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Weekly Report Section */}
                    <View style={[styles.section, styles.sectionBorder]}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="calendar" size={24} color={darkMode ? '#a8d5c4' : '#2d4a42'} />
                            <Text style={[styles.sectionTitle, darkMode && styles.textLight]}>Weekly Report</Text>
                            <Switch
                                value={settings.weeklyReport}
                                onValueChange={toggleWeeklyReport}
                                trackColor={{ false: '#ccc', true: '#a8d5c4' }}
                                thumbColor={settings.weeklyReport ? '#2d4a42' : '#999'}
                            />
                        </View>

                        {settings.weeklyReport && (
                            <View style={styles.timeSelector}>
                                <Text style={[styles.label, darkMode && styles.textLight]}>Day:</Text>
                                <View style={styles.daySelector}>
                                    {DAYS_OF_WEEK.map((day, index) => (
                                        <Pressable
                                            key={index}
                                            style={[
                                                styles.dayButton,
                                                settings.weeklyReportDay === index && styles.dayButtonActive,
                                                darkMode && styles.dayButtonDark,
                                                settings.weeklyReportDay === index && darkMode && styles.dayButtonActiveDark,
                                            ]}
                                            onPress={() =>
                                                updateWeeklyReportSettings(
                                                    index,
                                                    settings.weeklyReportTime.hour,
                                                    settings.weeklyReportTime.minute
                                                )
                                            }
                                        >
                                            <Text
                                                style={[
                                                    styles.dayButtonText,
                                                    settings.weeklyReportDay === index && styles.dayButtonTextActive,
                                                ]}
                                            >
                                                {day.slice(0, 1)}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>

                                <Text style={[styles.label, darkMode && styles.textLight]}>Time:</Text>
                                <View style={styles.timeInputs}>
                                    <View style={styles.timeInput}>
                                        <Text style={[styles.timeInputLabel, darkMode && styles.textLight]}>Hour</Text>
                                        <Pressable
                                            style={[styles.timeButton, darkMode && styles.timeButtonDark]}
                                            onPress={() => {
                                                const newHour = (settings.weeklyReportTime.hour + 1) % 24;
                                                updateWeeklyReportSettings(
                                                    settings.weeklyReportDay,
                                                    newHour,
                                                    settings.weeklyReportTime.minute
                                                );
                                            }}
                                        >
                                            <Text style={[styles.timeButtonText, darkMode && styles.textLight]}>
                                                {String(settings.weeklyReportTime.hour).padStart(2, '0')}
                                            </Text>
                                        </Pressable>
                                    </View>

                                    <Text style={[styles.timeSeparator, darkMode && styles.textLight]}>:</Text>

                                    <View style={styles.timeInput}>
                                        <Text style={[styles.timeInputLabel, darkMode && styles.textLight]}>Minute</Text>
                                        <Pressable
                                            style={[styles.timeButton, darkMode && styles.timeButtonDark]}
                                            onPress={() => {
                                                const newMinute = (settings.weeklyReportTime.minute + 15) % 60;
                                                updateWeeklyReportSettings(
                                                    settings.weeklyReportDay,
                                                    settings.weeklyReportTime.hour,
                                                    newMinute
                                                );
                                            }}
                                        >
                                            <Text style={[styles.timeButtonText, darkMode && styles.textLight]}>
                                                {String(settings.weeklyReportTime.minute).padStart(2, '0')}
                                            </Text>
                                        </Pressable>
                                    </View>
                                </View>
                            </View>
                        )}
                    </View>
                </View>

                {/* Save Button */}
                <Pressable
                    style={({ pressed }) => [
                        styles.saveButton,
                        pressed && styles.saveButtonPressed,
                        isSaving && styles.saveButtonDisabled,
                    ]}
                    onPress={handleSave}
                    disabled={isSaving}
                >
                    <Ionicons name="checkmark" size={20} color="#fff" />
                    <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save Settings'}</Text>
                </Pressable>
            </ScrollView>
        </View>
    );
}

export default NotificationSettingsContent;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f8f7',
    },
    containerDark: {
        backgroundColor: '#1a2622',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 24,
        alignItems: 'center',
    },
    card: {
        width: '100%',
        maxWidth: maxWidth,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    cardDark: {
        backgroundColor: '#253029',
    },
    section: {
        paddingVertical: 12,
    },
    sectionBorder: {
        borderTopWidth: 1,
        borderTopColor: '#d4e8e0',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    sectionTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#2d4a42',
        marginLeft: 12,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#2d4a42',
        marginBottom: 8,
        marginTop: 12,
    },
    textLight: {
        color: '#d4e8e0',
    },
    timeSelector: {
        marginLeft: 36,
    },
    timeInputs: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    timeInput: {
        alignItems: 'center',
    },
    timeInputLabel: {
        fontSize: 11,
        color: '#7a9f94',
        marginBottom: 4,
    },
    timeButton: {
        backgroundColor: '#d4e8e0',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: '#a8d5c4',
    },
    timeButtonDark: {
        backgroundColor: '#5a8f7f',
        borderColor: '#7a9f94',
    },
    timeButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2d4a42',
        width: 40,
        textAlign: 'center',
    },
    timeSeparator: {
        fontSize: 18,
        fontWeight: '600',
        color: '#2d4a42',
    },
    daySelector: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    dayButton: {
        flex: 1,
        marginHorizontal: 4,
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 12,
        backgroundColor: '#f0f5f3',
        borderWidth: 1,
        borderColor: '#d4e8e0',
        alignItems: 'center',
    },
    dayButtonDark: {
        backgroundColor: '#2d4a42',
        borderColor: '#5a8f7f',
    },
    dayButtonActive: {
        backgroundColor: '#a8d5c4',
        borderColor: '#5a8f7f',
    },
    dayButtonActiveDark: {
        backgroundColor: '#7a9f94',
        borderColor: '#a8d5c4',
    },
    dayButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#2d4a42',
    },
    dayButtonTextActive: {
        color: '#fff',
    },
    saveButton: {
        backgroundColor: '#a8d5c4',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 20,
        marginTop: 24,
        width: '100%',
        maxWidth: maxWidth,
        shadowColor: '#a8d5c4',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
    },
    saveButtonPressed: {
        opacity: 0.8,
        transform: [{ scale: 0.96 }],
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
