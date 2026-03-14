import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    ScrollView,
    TouchableOpacity,
    FlatList
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
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
    const { darkMode } = useTheme();
    const [selectedPeriod, setSelectedPeriod] = useState<'7' | '30'>('30');

    // Format date to YYYY-MM-DD
    const formatLocalDate = (d: Date) => {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    // Get data for selected period
    const periodData = useMemo(() => {
        const days = parseInt(selectedPeriod);
        const today = new Date();
        const data: MigraineDayData[] = [];
        
        // Create array of last 'days' days
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(today.getDate() - i);
            const dateStr = formatLocalDate(date);
            
            // Find if there's a migraine on this day
            const migraineDay = migraineDays.find(d => d.date === dateStr);
            
            data.push({
                date: dateStr,
                hasMigraine: migraineDay?.hasMigraine || false,
                severity: migraineDay?.severity || 0
            });
        }
        
        return data;
    }, [migraineDays, selectedPeriod]);

    // Calculate stats
    const stats = useMemo(() => {
        const total = periodData.filter(d => d.hasMigraine).length;
        const migraineDaysList = periodData.filter(d => d.hasMigraine);
        const avg = migraineDaysList.length > 0 
            ? (migraineDaysList.reduce((acc, d) => acc + d.severity, 0) / migraineDaysList.length).toFixed(1)
            : '0.0';
        const severe = periodData.filter(d => d.severity >= 7).length;
        const free = periodData.filter(d => !d.hasMigraine).length;
        
        return { total, avg, severe, free };
    }, [periodData]);

    // Get color based on severity
    const getSeverityColor = (severity: number) => {
        if (severity >= 7) return '#ef4444';
        if (severity >= 4) return '#f59e0b';
        if (severity > 0) return '#10b981';
        return '#9ca3af';
    };

    // Get severity label
    const getSeverityLabel = (severity: number) => {
        if (severity >= 7) return 'Severe';
        if (severity >= 4) return 'Moderate';
        if (severity > 0) return 'Mild';
        return 'No Pain';
    };

    // Format date for display
    const formatDisplayDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('default', { 
            month: 'short', 
            day: 'numeric' 
        });
    };

    // Get last 7 days for preview
    const previewData = periodData.slice(-7);

    return (
        <ScrollView
            style={styles.container}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contentContainer}
        >
            {/* Header */}
            <LinearGradient
                colors={darkMode ? ['#1f2937', '#111827'] : ['#f0f9f7', '#e6f3ef']}
                style={styles.headerGradient}
            >
                <View style={styles.headerContent}>
                    <View style={styles.headerIconContainer}>
                        <Ionicons name="analytics" size={28} color={darkMode ? '#a8d5c4' : '#2d4a42'} />
                    </View>
                    <View>
                        <Text style={[styles.headerTitle, darkMode && styles.headerTitleDark]}>
                            Migraine Report
                        </Text>
                        <Text style={[styles.headerSubtitle, darkMode && styles.headerSubtitleDark]}>
                            Track your migraine patterns
                        </Text>
                    </View>
                </View>
            </LinearGradient>

            {/* Period Selector */}
            <View style={styles.periodSelector}>
                {(['7', '30'] as const).map((period) => (
                    <TouchableOpacity
                        key={period}
                        style={[
                            styles.periodButton,
                            selectedPeriod === period && styles.periodButtonActive,
                            { backgroundColor: darkMode ? '#1f2937' : '#ffffff' }
                        ]}
                        onPress={() => setSelectedPeriod(period)}
                    >
                        <Text style={[
                            styles.periodButtonText,
                            selectedPeriod === period && styles.periodButtonTextActive,
                            { color: darkMode ? '#9ca3af' : '#4b5563' }
                        ]}>
                            {period} Days
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Stats Cards */}
            <View style={styles.statsGrid}>
                <View style={[styles.statCard, darkMode && styles.statCardDark]}>
                    <Text style={[styles.statValue, darkMode && styles.statValueDark]}>
                        {stats.total}
                    </Text>
                    <Text style={[styles.statLabel, darkMode && styles.statLabelDark]}>
                        Migraine Days
                    </Text>
                    <Ionicons name="calendar" size={24} color={darkMode ? '#a8d5c4' : '#2d4a42'} style={styles.statIcon} />
                </View>

                <View style={[styles.statCard, darkMode && styles.statCardDark]}>
                    <Text style={[styles.statValue, darkMode && styles.statValueDark]}>
                        {stats.avg}
                    </Text>
                    <Text style={[styles.statLabel, darkMode && styles.statLabelDark]}>
                        Avg Severity
                    </Text>
                    <Ionicons name="thermometer" size={24} color={darkMode ? '#a8d5c4' : '#2d4a42'} style={styles.statIcon} />
                </View>

                <View style={[styles.statCard, darkMode && styles.statCardDark]}>
                    <Text style={[styles.statValue, darkMode && styles.statValueDark]}>
                        {stats.severe}
                    </Text>
                    <Text style={[styles.statLabel, darkMode && styles.statLabelDark]}>
                        Severe Days
                    </Text>
                    <Ionicons name="warning" size={24} color={darkMode ? '#a8d5c4' : '#2d4a42'} style={styles.statIcon} />
                </View>

                <View style={[styles.statCard, darkMode && styles.statCardDark]}>
                    <Text style={[styles.statValue, darkMode && styles.statValueDark]}>
                        {stats.free}
                    </Text>
                    <Text style={[styles.statLabel, darkMode && styles.statLabelDark]}>
                        Pain-Free
                    </Text>
                    <Ionicons name="happy" size={24} color={darkMode ? '#a8d5c4' : '#2d4a42'} style={styles.statIcon} />
                </View>
            </View>

            {/* Simple Chart */}
            <View style={[styles.chartCard, darkMode && styles.chartCardDark]}>
                <Text style={[styles.chartTitle, darkMode && styles.chartTitleDark]}>
                    Last 7 Days Overview
                </Text>

                <View style={styles.chartContainer}>
                    {previewData.map((day, index) => {
                        const color = getSeverityColor(day.severity);
                        const height = day.severity * 12; // Max height 120 for severity 10
                        
                        return (
                            <View key={index} style={styles.barWrapper}>
                                <View style={styles.barContainer}>
                                    <View 
                                        style={[
                                            styles.bar,
                                            { 
                                                height: Math.max(4, height),
                                                backgroundColor: color,
                                                opacity: day.hasMigraine ? 1 : 0.3
                                            }
                                        ]} 
                                    />
                                    {day.hasMigraine && (
                                        <View style={[styles.barDot, { backgroundColor: color }]} />
                                    )}
                                </View>
                                <Text style={[styles.barLabel, darkMode && styles.barLabelDark]}>
                                    {formatDisplayDate(day.date)}
                                </Text>
                            </View>
                        );
                    })}
                </View>

                {/* Legend */}
                <View style={styles.legendContainer}>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
                        <Text style={[styles.legendText, darkMode && styles.legendTextDark]}>Severe (7-10)</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
                        <Text style={[styles.legendText, darkMode && styles.legendTextDark]}>Moderate (4-6)</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
                        <Text style={[styles.legendText, darkMode && styles.legendTextDark]}>Mild (1-3)</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#9ca3af' }]} />
                        <Text style={[styles.legendText, darkMode && styles.legendTextDark]}>No Pain</Text>
                    </View>
                </View>
            </View>

            {/* Daily List */}
            <View style={[styles.listCard, darkMode && styles.listCardDark]}>
                <Text style={[styles.listTitle, darkMode && styles.listTitleDark]}>
                    Daily Breakdown
                </Text>

                {periodData.slice().reverse().map((day, index) => (
                    <View key={index} style={styles.listItem}>
                        <View style={styles.listItemLeft}>
                            <Text style={[styles.listDate, darkMode && styles.listDateDark]}>
                                {new Date(day.date).toLocaleDateString('default', { 
                                    weekday: 'short', 
                                    month: 'short', 
                                    day: 'numeric' 
                                })}
                            </Text>
                            <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(day.severity) }]}>
                                <Text style={styles.severityBadgeText}>
                                    {getSeverityLabel(day.severity)}
                                </Text>
                            </View>
                        </View>
                        <Text style={[styles.listSeverity, darkMode && styles.listSeverityDark]}>
                            {day.severity > 0 ? `${day.severity}/10` : '-'}
                        </Text>
                    </View>
                ))}
            </View>

            {/* Summary */}
            <LinearGradient
                colors={darkMode ? ['#2d4a42', '#1a3630'] : ['#e6f3ef', '#d4e8e0']}
                style={styles.summaryCard}
            >
                <Ionicons name="document-text" size={32} color={darkMode ? '#a8d5c4' : '#2d4a42'} />
                <View style={styles.summaryText}>
                    <Text style={[styles.summaryTitle, darkMode && styles.summaryTitleDark]}>
                        Summary
                    </Text>
                    <Text style={[styles.summaryDescription, darkMode && styles.summaryDescriptionDark]}>
                        {stats.total} migraine days • Avg {stats.avg}/10 • {stats.severe} severe
                    </Text>
                </View>
            </LinearGradient>

            {/* Tips */}
            <BlurView intensity={darkMode ? 30 : 50} tint={darkMode ? 'dark' : 'light'} style={styles.tipsCard}>
                <View style={styles.tipsHeader}>
                    <Ionicons name="bulb-outline" size={22} color={darkMode ? '#a8d5c4' : '#2d4a42'} />
                    <Text style={[styles.tipsTitle, darkMode && styles.tipsTitleDark]}>Tip</Text>
                </View>
                <Text style={[styles.tipsText, darkMode && styles.tipsTextDark]}>
                    {stats.severe > 2 
                        ? "Consider tracking your triggers. Stress and sleep are common factors."
                        : stats.total > 10
                        ? "Regular sleep and hydration might help reduce frequency."
                        : "Keep up the good work! Continue tracking to identify patterns."}
                </Text>
            </BlurView>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f8f7',
    },
    contentContainer: {
        paddingBottom: 32,
    },
    headerGradient: {
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 12,
        borderRadius: 24,
        padding: 20,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerIconContainer: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#111827',
    },
    headerTitleDark: {
        color: '#ffffff',
    },
    headerSubtitle: {
        fontSize: 13,
        color: '#4b5563',
        marginTop: 2,
    },
    headerSubtitleDark: {
        color: '#9ca3af',
    },
    periodSelector: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginBottom: 16,
        backgroundColor: '#f1f5f9',
        borderRadius: 10,
        padding: 4,
    },
    periodButton: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: 'center',
    },
    periodButtonActive: {
        backgroundColor: '#2d4a42',
    },
    periodButtonText: {
        fontSize: 13,
        fontWeight: '600',
    },
    periodButtonTextActive: {
        color: '#ffffff',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: 12,
        gap: 8,
    },
    statCard: {
        width: (CARD_WIDTH - 24) / 2,
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 16,
        position: 'relative',
    },
    statCardDark: {
        backgroundColor: '#1f2937',
    },
    statValue: {
        fontSize: 28,
        fontWeight: '700',
        color: '#2d4a42',
        marginBottom: 4,
    },
    statValueDark: {
        color: '#ffffff',
    },
    statLabel: {
        fontSize: 12,
        color: '#4b5563',
        fontWeight: '500',
    },
    statLabelDark: {
        color: '#9ca3af',
    },
    statIcon: {
        position: 'absolute',
        top: 16,
        right: 16,
        opacity: 0.5,
    },
    chartCard: {
        marginHorizontal: 16,
        marginTop: 16,
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 20,
    },
    chartCardDark: {
        backgroundColor: '#1f2937',
    },
    chartTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 20,
    },
    chartTitleDark: {
        color: '#ffffff',
    },
    chartContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        height: 140,
        marginBottom: 20,
    },
    barWrapper: {
        alignItems: 'center',
        flex: 1,
    },
    barContainer: {
        height: 120,
        width: 24,
        backgroundColor: '#e5e7eb',
        borderRadius: 12,
        marginBottom: 8,
        position: 'relative',
    },
    bar: {
        width: '100%',
        borderRadius: 12,
        position: 'absolute',
        bottom: 0,
    },
    barDot: {
        position: 'absolute',
        top: -4,
        left: 8,
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    barLabel: {
        fontSize: 10,
        color: '#6b7280',
    },
    barLabelDark: {
        color: '#9ca3af',
    },
    legendContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        minWidth: '45%',
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 6,
    },
    legendText: {
        fontSize: 11,
        color: '#4b5563',
    },
    legendTextDark: {
        color: '#9ca3af',
    },
    listCard: {
        marginHorizontal: 16,
        marginTop: 16,
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 20,
    },
    listCardDark: {
        backgroundColor: '#1f2937',
    },
    listTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 16,
    },
    listTitleDark: {
        color: '#ffffff',
    },
    listItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    listItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    listDate: {
        fontSize: 13,
        fontWeight: '500',
        color: '#1f2937',
        width: 100,
    },
    listDateDark: {
        color: '#d1d5db',
    },
    severityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    severityBadgeText: {
        color: '#ffffff',
        fontSize: 10,
        fontWeight: '600',
    },
    listSeverity: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1f2937',
    },
    listSeverityDark: {
        color: '#d1d5db',
    },
    summaryCard: {
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 24,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    summaryText: {
        flex: 1,
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 2,
    },
    summaryTitleDark: {
        color: '#ffffff',
    },
    summaryDescription: {
        fontSize: 13,
        color: '#4b5563',
    },
    summaryDescriptionDark: {
        color: '#9ca3af',
    },
    tipsCard: {
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 24,
        padding: 20,
        overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.8)',
    },
    tipsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 6,
    },
    tipsTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
    },
    tipsTitleDark: {
        color: '#ffffff',
    },
    tipsText: {
        fontSize: 13,
        color: '#4b5563',
        lineHeight: 18,
    },
    tipsTextDark: {
        color: '#d1d5db',
    },
});