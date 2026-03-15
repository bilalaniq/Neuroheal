import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useUser } from '@/contexts/UserContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { MigraineCalendar } from '@/components/MigraineCalendar';
import { MigraineReportChart } from '@/components/MigraineReportChart';
import { ModernHeader } from '@/components/ModernHeader';

const BACKEND_URL = 'http://192.168.37.37:8080';

export default function NeuroRecordScreen() {
    const router = useRouter();
    const { userData } = useUser();
    const [migraineDays, setMigraineDays] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMigraineLogs = useCallback(async (userId: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(
                `${BACKEND_URL}/migraine-episodes/history?user_id=${encodeURIComponent(userId)}`
            );
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
                severity: log.severity ?? (
                    log.intensity <= 3 ? 1 :
                    log.intensity <= 6 ? 2 :
                    log.intensity <= 8 ? 3 : 4
                ),
                intensity: log.intensity ?? null,
                duration:
                    log.duration_category === '1-2h' ? 2 :
                    log.duration_category === '2-4h' ? 4 :
                    log.duration_category === '4-8h' ? 6 :
                    log.duration_category === '8h+' ? 9 : 1,
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
        if (userData?.name) fetchMigraineLogs(userData.name);
    }, [userData?.name, fetchMigraineLogs]);

    // ── Summary stats ─────────────────────────────────────────────────────
    const totalMigraines = migraineDays.length;
    const avgIntensity = migraineDays.length
        ? (migraineDays.reduce((s, d) => s + (d.intensity ?? 0), 0) / migraineDays.length).toFixed(1)
        : '--';
    const mostCommonTrigger = (() => {
        const counts: Record<string, number> = {};
        migraineDays.forEach(d => d.triggers?.forEach((t: string) => {
            counts[t] = (counts[t] || 0) + 1;
        }));
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        return sorted[0]?.[0] ?? '--';
    })();

    return (
        <View style={styles.container}>
            <ModernHeader title="Neuro Record" onBack={() => router.back()} />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                {loading ? (
                    <View style={styles.loadingWrap}>
                        <ActivityIndicator size="large" color="#a78bfa" />
                        <Text style={styles.loadingText}>Loading your records...</Text>
                    </View>
                ) : (
                    <>
                        {/* ── Error banner ── */}
                        {error && (
                            <View style={styles.errorBanner}>
                                <Ionicons name="warning" size={14} color="#f87171" />
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        )}

                        {/* ── Summary cards ── */}
                        <View style={styles.statsRow}>
                            <View style={styles.statCard}>
                                <View style={styles.statIconWrap}>
                                    <Ionicons name="pulse" size={18} color="#c084fc" />
                                </View>
                                <Text style={styles.statValue}>{totalMigraines}</Text>
                                <Text style={styles.statLabel}>Total{'\n'}Episodes</Text>
                            </View>

                            <View style={styles.statCard}>
                                <View style={[styles.statIconWrap, { borderColor: '#f8717144' }]}>
                                    <Ionicons name="flame" size={18} color="#f87171" />
                                </View>
                                <Text style={styles.statValue}>{avgIntensity}</Text>
                                <Text style={styles.statLabel}>Avg{'\n'}Intensity</Text>
                            </View>

                            <View style={styles.statCard}>
                                <View style={[styles.statIconWrap, { borderColor: '#fbbf2444' }]}>
                                    <Ionicons name="alert-circle" size={18} color="#fbbf24" />
                                </View>
                                <Text style={styles.statValue} numberOfLines={1}>
                                    {mostCommonTrigger === '--' ? '--' : mostCommonTrigger.slice(0, 6)}
                                </Text>
                                <Text style={styles.statLabel}>Top{'\n'}Trigger</Text>
                            </View>
                        </View>

                        {/* ── Section heading: Calendar ── */}
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionDot} />
                            <Text style={styles.sectionTitle}>Migraine Calendar</Text>
                        </View>

                        <View style={styles.cardWrap}>
                            <MigraineCalendar migraineDays={migraineDays} darkMode={true} />
                        </View>

                        {/* ── Section heading: Chart ── */}
                        <View style={styles.sectionHeader}>
                            <View style={[styles.sectionDot, { backgroundColor: '#60a5fa' }]} />
                            <Text style={styles.sectionTitle}>Report Chart</Text>
                        </View>

                        <View style={styles.cardWrap}>
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
        backgroundColor: '#000',
    },
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        padding: 16,
        paddingBottom: 48,
    },

    // ── Loading ──
    loadingWrap: {
        alignItems: 'center',
        paddingVertical: 80,
        gap: 16,
    },
    loadingText: {
        color: '#c4b5fd',
        fontSize: 15,
        fontWeight: '500',
    },

    // ── Error ──
    errorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2b0f0f',
        borderWidth: 1,
        borderColor: '#f8717133',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        gap: 8,
    },
    errorText: {
        color: '#f87171',
        fontSize: 13,
        fontWeight: '500',
        flex: 1,
    },

    // ── Stats row ──
    statsRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 24,
        marginTop: 8,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#231344',
        borderRadius: 16,
        padding: 14,
        alignItems: 'center',
        gap: 6,
        borderWidth: 1,
        borderColor: '#2b0f4d',
    },
    statIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(192,132,252,0.1)',
        borderWidth: 1,
        borderColor: '#c084fc44',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 2,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: -0.5,
    },
    statLabel: {
        fontSize: 10,
        color: '#c4b5fd',
        textAlign: 'center',
        fontWeight: '500',
        lineHeight: 14,
    },

    // ── Section headers ──
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
        marginTop: 8,
    },
    sectionDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#c084fc',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: 0.2,
    },

    // ── Card wrapper ──
    cardWrap: {
        backgroundColor: '#160a2e',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#2b0f4d',
        overflow: 'hidden',
        marginBottom: 24,
        padding: 4,
    },
});