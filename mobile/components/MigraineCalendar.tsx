import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';

interface MigraineDayData {
    date: string;
    hasMigraine: boolean;
    severity: number; // 0-4 scale
    duration: number; // hours
    triggers: string[];
    note: string;
    symptoms: string[];
    medication: string[];
}

interface MigraineCalendarProps {
    migraineDays: MigraineDayData[];
    darkMode?: boolean;
}

export function MigraineCalendar({ migraineDays, darkMode }: MigraineCalendarProps) {
    const router = useRouter();
    const [currentDate, setCurrentDate] = useState(new Date());
    const { darkMode: themeDarkMode } = useTheme();
    const isDarkMode = darkMode ?? themeDarkMode;

    // Get calendar days for current month
    const calendarDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days = [];

        // Add empty cells for days before month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

        // Add days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            const dateStr = date.toISOString().split('T')[0];
            const migraineData = migraineDays.find(d => d.date === dateStr);
            days.push({
                date: i,
                dateStr,
                hasMigraine: migraineData?.hasMigraine ?? false,
                data: migraineData || null,
            });
        }

        return days;
    }, [currentDate, migraineDays]);

    const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    const handlePreviousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    };

    const handleDayPress = (day: any) => {
        if (day && day.date) {
            const dayData = day.data || {
                date: day.dateStr,
                hasMigraine: false,
                severity: 0,
                duration: 0,
                triggers: [],
                note: 'No data recorded',
                symptoms: [],
                medication: [],
            };
            router.push({
                pathname: '/migraine-detail',
                params: { data: JSON.stringify(dayData) }
            });
        }
    };

    const getSeverityColor = (severity: number) => {
        switch (severity) {
            case 0:
                return isDarkMode ? '#10b981' : '#10b981';
            case 1:
                return '#fbbf24'; // Mild - yellow
            case 2:
                return '#f97316'; // Moderate - orange
            case 3:
                return '#ef4444'; // Severe - red
            case 4:
                return '#7c2d12'; // Extreme - dark red
            default:
                return isDarkMode ? '#64748b' : '#cbd5e1';
        }
    };

    const getSeverityLabel = (severity: number) => {
        const labels = ['None', 'Mild', 'Moderate', 'Severe', 'Extreme'];
        return labels[severity] || 'Unknown';
    };

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <>
            <View style={[styles.container, isDarkMode && styles.containerDark]}>
                {/* Header with month navigation */}
                <View style={[styles.header, isDarkMode && styles.headerDark]}>
                    <Pressable onPress={handlePreviousMonth} style={styles.navButton}>
                        <Ionicons name="chevron-back" size={24} color={isDarkMode ? '#94a3b8' : '#475569'} />
                    </Pressable>
                    <Text style={[styles.monthTitle, isDarkMode && styles.monthTitleDark]}>
                        {monthName}
                    </Text>
                    <Pressable onPress={handleNextMonth} style={styles.navButton}>
                        <Ionicons name="chevron-forward" size={24} color={isDarkMode ? '#94a3b8' : '#475569'} />
                    </Pressable>
                </View>

                {/* Week day headers */}
                <View style={styles.weekDaysContainer}>
                    {weekDays.map((day) => (
                        <View key={day} style={styles.weekDayCell}>
                            <Text style={[styles.weekDayText, isDarkMode && styles.weekDayTextDark]}>
                                {day}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Calendar grid */}
                <View style={styles.calendarGrid}>
                    {calendarDays.map((day, index) => (
                        <Pressable
                            key={index}
                            onPress={() => handleDayPress(day)}
                            style={[
                                styles.dayCell,
                                isDarkMode && styles.dayCellDark,
                                !day && styles.emptyCell,
                            ]}
                        >
                            {day ? (
                                <View style={styles.dayContent}>
                                    <View
                                        style={[
                                            styles.dayCircle,
                                            day.hasMigraine ? {
                                                backgroundColor: getSeverityColor(day.data?.severity ?? 0),
                                                borderColor: getSeverityColor(day.data?.severity ?? 0),
                                            } : {
                                                backgroundColor: isDarkMode ? '#334155' : '#f1f5f9',
                                                borderColor: isDarkMode ? '#475569' : '#e2e8f0',
                                            }
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.dayNumber,
                                                day.hasMigraine && styles.dayNumberMigraine,
                                                !day.hasMigraine && isDarkMode && styles.dayNumberDark,
                                            ]}
                                        >
                                            {day.date}
                                        </Text>
                                    </View>
                                    {day.hasMigraine && (
                                        <View style={styles.migraineIndicator}>
                                            <Ionicons name="alert-circle" size={8} color={isDarkMode ? '#fef2f2' : '#fff'} />
                                        </View>
                                    )}
                                </View>
                            ) : null}
                        </Pressable>
                    ))}
                </View>

                {/* Legend */}
                <View style={[styles.legend, isDarkMode && styles.legendDark]}>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendColor, { backgroundColor: isDarkMode ? '#334155' : '#f1f5f9' }]} />
                        <Text style={[styles.legendText, isDarkMode && styles.legendTextDark]}>No migraine</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendColor, { backgroundColor: '#fbbf24' }]} />
                        <Text style={[styles.legendText, isDarkMode && styles.legendTextDark]}>Mild</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendColor, { backgroundColor: '#f97316' }]} />
                        <Text style={[styles.legendText, isDarkMode && styles.legendTextDark]}>Moderate</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendColor, { backgroundColor: '#ef4444' }]} />
                        <Text style={[styles.legendText, isDarkMode && styles.legendTextDark]}>Severe</Text>
                    </View>
                </View>
            </View>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
    },
    containerDark: {
        backgroundColor: '#1f2937',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    headerDark: {
        borderBottomColor: '#374151',
    },
    monthTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
    },
    monthTitleDark: {
        color: '#f3f4f6',
    },
    navButton: {
        padding: 8,
    },
    weekDaysContainer: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    weekDayCell: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 8,
    },
    weekDayText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6b7280',
    },
    weekDayTextDark: {
        color: '#9ca3af',
    },
    calendarGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    dayCell: {
        width: '14.28%',
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 4,
    },
    dayCellDark: {},
    emptyCell: {
        backgroundColor: 'transparent',
    },
    dayContent: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
    },
    dayCircle: {
        width: '90%',
        height: '90%',
        borderRadius: 999,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
    },
    dayNumber: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    dayNumberMigraine: {
        color: '#ffffff',
        fontWeight: '700',
    },
    dayNumberDark: {
        color: '#9ca3af',
    },
    migraineIndicator: {
        position: 'absolute',
        top: 2,
        right: 2,
    },
    legend: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    legendDark: {
        borderTopColor: '#374151',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '50%',
        marginVertical: 6,
    },
    legendColor: {
        width: 12,
        height: 12,
        borderRadius: 2,
        marginRight: 8,
    },
    legendText: {
        fontSize: 12,
        color: '#6b7280',
    },
    legendTextDark: {
        color: '#9ca3af',
    },
});
