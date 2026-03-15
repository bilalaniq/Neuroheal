import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useUser } from '@/contexts/UserContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { MigraineCalendar } from '@/components/MigraineCalendar';
import { MigraineReportChart } from '@/components/MigraineReportChart';
import { ModernHeader } from '@/components/ModernHeader';

const BACKEND_URL = 'http://192.168.37.37:8080';

export default function NeuroRecordScreen() {
    const router = useRouter();
    const { darkMode } = useTheme();
    const { userData } = useUser();
    const [migraineDays, setMigraineDays] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMigraineLogs = useCallback(async (userId: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${BACKEND_URL}/migraine-episodes/history?user_id=${encodeURIComponent(userId)}`);
            if (!res.ok) throw new Error(`Server ${res.status}`);
            const data = await res.json();
            const formatLocalDate = (timestamp: string) => {
                const d = new Date(timestamp);
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                return `${yyyy}-${mm}-${dd}`;
            };
            const logs = (data.logs || []).map((log: any) => ({
                date: formatLocalDate(log.timestamp),
                hasMigraine: true,
                severity: log.severity ?? (log.intensity <= 3 ? 1 : log.intensity <= 6 ? 2 : log.intensity <= 8 ? 3 : 4),
                intensity: log.intensity ?? null,
                duration: log.duration_category === '1-2h' ? 2 : log.duration_category === '2-4h' ? 4 : log.duration_category === '4-8h' ? 6 : log.duration_category === '8h+' ? 9 : 1,
                duration_category: log.duration_category || '',
                triggers: log.triggers || [],
                note: log.notes || '',
                symptoms: log.symptoms || [],
                medication: log.medication || [],
                medication_effectiveness: log.medication_effectiveness ?? null,
                relief_methods: log.relief_methods || [],
                pain_location: log.pain_location || '',
                disability_level: log.disability_level ?? null,
                warning_signs_before: log.warning_signs_before ?? false,
                warning_description: log.warning_description || '',
                timestamp: log.timestamp || '',
            }));
            setMigraineDays(logs);
        } catch (err) {
            setError('Could not fetch migraine logs');
            setMigraineDays([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (userData?.name) {
            fetchMigraineLogs(userData.name);
        }
    }, [userData?.name, fetchMigraineLogs]);

    return (
        <View style={[styles.container, darkMode && styles.containerDark]}>
            <ModernHeader title="Neuro Record" onBack={() => router.back()} />
            <ScrollView contentContainerStyle={styles.contentContainer} style={styles.scrollView}>
                <View style={[styles.reportHeader, darkMode && styles.reportHeaderDark]}>
                    <Text style={[styles.reportTitle, darkMode && styles.reportTitleDark]}>Migraine Tracker</Text>
                    <Text style={[styles.reportSubtitle, darkMode && styles.reportSubtitleDark]}>
                        {migraineDays.length} episodes recorded
                    </Text>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color="#5a8f7f" style={{ marginTop: 20 }} />
                ) : (
                    <>
                        {error ? (
                            <View style={styles.errorBanner}>
                                <Ionicons name="warning" size={14} color="#b45309" />
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        ) : null}

                        <View style={styles.calendarWrapper}>
                            <MigraineCalendar migraineDays={migraineDays} darkMode={darkMode} />
                        </View>
                        
                        <View style={styles.chartWrapper}>
                            <MigraineReportChart migraineDays={migraineDays} />
                        </View>
                    </>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#f5f8f7' 
    },
    containerDark: { 
        backgroundColor: '#0f172a' 
    },
    scrollView: { 
        flex: 1 
    },
    contentContainer: { 
        padding: 16, 
        paddingBottom: 40,
        alignItems: 'center',
    },
    reportHeader: { 
        marginBottom: 16,
        width: '100%',
        paddingHorizontal: 4,
    },
    reportHeaderDark: {},
    reportTitle: { 
        fontSize: 24, 
        fontWeight: '700', 
        color: '#1f2937',
        marginBottom: 4,
    },
    reportTitleDark: { 
        color: '#e2e8f0' 
    },
    reportSubtitle: { 
        fontSize: 14, 
        color: '#4b5563',
    },
    reportSubtitleDark: { 
        color: '#9ca3af' 
    },
    errorBanner: {
        flexDirection: 'row',
        backgroundColor: '#fef3c7',
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 16,
        width: '100%',
    },
    errorText: { 
        marginLeft: 8, 
        color: '#b45309',
        fontSize: 14,
    },
    calendarWrapper: {
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
        marginBottom: 20,
    },
    chartWrapper: {
        width: '100%',
        maxWidth: 500,
        alignSelf: 'center',
    },
});