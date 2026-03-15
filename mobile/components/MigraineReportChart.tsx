import React, { useState, useMemo } from 'react';
import {
    View, Text, StyleSheet, Dimensions,
    TouchableOpacity, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;

interface MigraineDayData {
    date: string;
    hasMigraine: boolean;
    severity: number;
}

interface MigraineReportChartProps {
    migraineDays: MigraineDayData[];
}

export const MigraineReportChart: React.FC<MigraineReportChartProps> = ({ migraineDays }) => {
    const [selectedPeriod, setSelectedPeriod] = useState<'7' | '30'>('30');

    const formatLocalDate = (d: Date) => {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    const periodData = useMemo(() => {
        const days = parseInt(selectedPeriod);
        const today = new Date();
        const data: MigraineDayData[] = [];
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(today.getDate() - i);
            const dateStr = formatLocalDate(date);
            const migraineDay = migraineDays.find(d => d.date === dateStr);
            data.push({
                date: dateStr,
                hasMigraine: migraineDay?.hasMigraine || false,
                severity: migraineDay?.severity || 0,
            });
        }
        return data;
    }, [migraineDays, selectedPeriod]);

    const stats = useMemo(() => {
        const total = periodData.filter(d => d.hasMigraine).length;
        const list  = periodData.filter(d => d.hasMigraine);
        const avg   = list.length
            ? (list.reduce((a, d) => a + d.severity, 0) / list.length).toFixed(1)
            : '0.0';
        const severe = periodData.filter(d => d.severity >= 7).length;
        const free   = periodData.filter(d => !d.hasMigraine).length;
        return { total, avg, severe, free };
    }, [periodData]);

    const getSeverityColor = (severity: number) => {
        if (severity >= 7) return '#f87171';
        if (severity >= 4) return '#fbbf24';
        if (severity > 0)  return '#34d399';
        return '#3f3f6a';
    };

    const getSeverityLabel = (severity: number) => {
        if (severity >= 7) return 'Severe';
        if (severity >= 4) return 'Moderate';
        if (severity > 0)  return 'Mild';
        return 'No Pain';
    };

    const formatDisplayDate = (dateStr: string) => {
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('default', { month: 'short', day: 'numeric' });
    };

    const previewData = periodData.slice(-7);

    return (
        <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contentContainer}
            style={styles.root}
        >
            {/* ── Header ── */}
            <View style={styles.headerCard}>
                <View style={styles.headerIconWrap}>
                    <Ionicons name="analytics" size={24} color="#c084fc" />
                </View>
                <View>
                    <Text style={styles.headerTitle}>Migraine Report</Text>
                    <Text style={styles.headerSub}>Track your migraine patterns</Text>
                </View>
            </View>

            {/* ── Period selector ── */}
            <View style={styles.periodWrap}>
                {(['7', '30'] as const).map(p => (
                    <TouchableOpacity
                        key={p}
                        style={[styles.periodBtn, selectedPeriod === p && styles.periodBtnActive]}
                        onPress={() => setSelectedPeriod(p)}
                    >
                        <Text style={[
                            styles.periodBtnText,
                            selectedPeriod === p && styles.periodBtnTextActive,
                        ]}>
                            {p} Days
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* ── Stats grid ── */}
            <View style={styles.statsGrid}>
                {[
                    { value: stats.total,  label: 'Migraine\nDays',   icon: 'calendar',    color: '#c084fc' },
                    { value: stats.avg,    label: 'Avg\nSeverity',    icon: 'thermometer', color: '#f87171' },
                    { value: stats.severe, label: 'Severe\nDays',     icon: 'warning',     color: '#fbbf24' },
                    { value: stats.free,   label: 'Pain-Free\nDays',  icon: 'happy',       color: '#34d399' },
                ].map((s, i) => (
                    <View key={i} style={styles.statCard}>
                        <View style={[styles.statIconWrap, { borderColor: s.color + '44' }]}>
                            <Ionicons name={s.icon as any} size={16} color={s.color} />
                        </View>
                        <Text style={styles.statValue}>{s.value}</Text>
                        <Text style={styles.statLabel}>{s.label}</Text>
                    </View>
                ))}
            </View>

            {/* ── Bar chart ── */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Last 7 Days Overview</Text>

                <View style={styles.chartContainer}>
                    {previewData.map((day, index) => {
                        const color  = getSeverityColor(day.severity);
                        const height = Math.max(4, day.severity * 12);
                        return (
                            <View key={index} style={styles.barWrapper}>
                                <View style={styles.barBg}>
                                    <View style={[
                                        styles.bar,
                                        { height, backgroundColor: color, opacity: day.hasMigraine ? 1 : 0.2 }
                                    ]} />
                                    {day.hasMigraine && (
                                        <View style={[styles.barDot, { backgroundColor: color }]} />
                                    )}
                                </View>
                                <Text style={styles.barLabel}>
                                    {formatDisplayDate(day.date)}
                                </Text>
                            </View>
                        );
                    })}
                </View>

                {/* Legend */}
                <View style={styles.legendRow}>
                    {[
                        { color: '#f87171', label: 'Severe (7-10)' },
                        { color: '#fbbf24', label: 'Moderate (4-6)' },
                        { color: '#34d399', label: 'Mild (1-3)' },
                        { color: '#3f3f6a', label: 'No Pain' },
                    ].map((l, i) => (
                        <View key={i} style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: l.color }]} />
                            <Text style={styles.legendText}>{l.label}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* ── Daily breakdown ── */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Daily Breakdown</Text>
                {periodData.slice().reverse().map((day, index) => (
                    <View
                        key={index}
                        style={[
                            styles.listItem,
                            index === periodData.length - 1 && { borderBottomWidth: 0 }
                        ]}
                    >
                        <View style={styles.listLeft}>
                            <Text style={styles.listDate}>
                                {new Date(day.date + 'T00:00:00').toLocaleDateString('default', {
                                    weekday: 'short', month: 'short', day: 'numeric',
                                })}
                            </Text>
                            <View style={[
                                styles.badge,
                                { backgroundColor: getSeverityColor(day.severity) + '33',
                                  borderColor:      getSeverityColor(day.severity) + '66' }
                            ]}>
                                <Text style={[styles.badgeText, { color: getSeverityColor(day.severity) }]}>
                                    {getSeverityLabel(day.severity)}
                                </Text>
                            </View>
                        </View>
                        <Text style={styles.listSeverity}>
                            {day.severity > 0 ? `${day.severity}/10` : '—'}
                        </Text>
                    </View>
                ))}
            </View>

            {/* ── Summary banner ── */}
            <LinearGradient
                colors={['#2b0f4d', '#160a2e']}
                style={styles.summaryCard}
            >
                <View style={styles.summaryIconWrap}>
                    <Ionicons name="document-text" size={24} color="#c084fc" />
                </View>
                <View style={styles.summaryText}>
                    <Text style={styles.summaryTitle}>Summary</Text>
                    <Text style={styles.summarySub}>
                        {stats.total} migraine days · Avg {stats.avg}/10 · {stats.severe} severe
                    </Text>
                </View>
            </LinearGradient>

            {/* ── Tip ── */}
            <View style={styles.tipCard}>
                <View style={styles.tipHeader}>
                    <Ionicons name="bulb-outline" size={18} color="#fbbf24" />
                    <Text style={styles.tipTitle}>Tip</Text>
                </View>
                <Text style={styles.tipText}>
                    {stats.severe > 2
                        ? 'Consider tracking your triggers. Stress and sleep are common factors.'
                        : stats.total > 10
                        ? 'Regular sleep and hydration might help reduce frequency.'
                        : 'Keep up the good work! Continue tracking to identify patterns.'}
                </Text>
            </View>

        </ScrollView>
    );
};

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    contentContainer: {
        paddingBottom: 32,
        gap: 12,
        padding: 4,
    },

    // ── Header ──
    headerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: '#231344',
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: '#2b0f4d',
    },
    headerIconWrap: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: 'rgba(192,132,252,0.12)',
        borderWidth: 1,
        borderColor: '#c084fc44',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 2,
    },
    headerSub: {
        fontSize: 12,
        color: '#c4b5fd',
    },

    // ── Period selector ──
    periodWrap: {
        flexDirection: 'row',
        backgroundColor: '#160a2e',
        borderRadius: 12,
        padding: 4,
        borderWidth: 1,
        borderColor: '#2b0f4d',
    },
    periodBtn: {
        flex: 1,
        paddingVertical: 9,
        borderRadius: 9,
        alignItems: 'center',
    },
    periodBtnActive: {
        backgroundColor: '#6107c9',
    },
    periodBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6b21a8',
    },
    periodBtnTextActive: {
        color: '#fff',
    },

    // ── Stats ──
    statsGrid: {
        flexDirection: 'row',
        gap: 8,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#231344',
        borderRadius: 16,
        padding: 12,
        alignItems: 'center',
        gap: 5,
        borderWidth: 1,
        borderColor: '#2b0f4d',
    },
    statIconWrap: {
        width: 32,
        height: 32,
        borderRadius: 9,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 2,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '800',
        color: '#fff',
    },
    statLabel: {
        fontSize: 9,
        color: '#c4b5fd',
        textAlign: 'center',
        fontWeight: '500',
        lineHeight: 13,
    },

    // ── Card (chart + list) ──
    card: {
        backgroundColor: '#231344',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: '#2b0f4d',
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 16,
    },

    // Bar chart
    chartContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        height: 140,
        marginBottom: 16,
    },
    barWrapper: {
        alignItems: 'center',
        flex: 1,
    },
    barBg: {
        height: 120,
        width: 22,
        backgroundColor: '#160a2e',
        borderRadius: 10,
        marginBottom: 6,
        position: 'relative',
        overflow: 'hidden',
    },
    bar: {
        width: '100%',
        borderRadius: 10,
        position: 'absolute',
        bottom: 0,
    },
    barDot: {
        position: 'absolute',
        top: -4,
        left: 7,
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    barLabel: {
        fontSize: 9,
        color: '#6b21a8',
        textAlign: 'center',
    },

    // Legend
    legendRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: '#2b0f4d',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        minWidth: '45%',
        gap: 6,
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    legendText: {
        fontSize: 11,
        color: '#c4b5fd',
    },

    // List
    listItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#2b0f4d',
    },
    listLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    listDate: {
        fontSize: 13,
        fontWeight: '500',
        color: '#e9d5ff',
        width: 105,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        borderWidth: 1,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '700',
    },
    listSeverity: {
        fontSize: 14,
        fontWeight: '700',
        color: '#fff',
    },

    // Summary
    summaryCard: {
        borderRadius: 18,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        borderWidth: 1,
        borderColor: '#4c1d95',
    },
    summaryIconWrap: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: 'rgba(192,132,252,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    summaryText: { flex: 1 },
    summaryTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 3,
    },
    summarySub: {
        fontSize: 12,
        color: '#c4b5fd',
    },

    // Tip
    tipCard: {
        backgroundColor: '#1a0f00',
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: '#fbbf2433',
    },
    tipHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    tipTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#fbbf24',
    },
    tipText: {
        fontSize: 13,
        color: '#fde68a',
        lineHeight: 19,
    },
});