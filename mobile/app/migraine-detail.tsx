import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ModernHeader } from '@/components/ModernHeader';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const maxWidth = Math.min(width - 48, 448);

interface MigraineDayDetail {
    date: string;
    hasMigraine: boolean;
    severity: number;
    duration: number;
    triggers: string[];
    note: string;
    symptoms: string[];
    medication: string[];
}

export default function MigraineDetailScreen() {
    const router = useRouter();
    const { darkMode } = useTheme();
    const params = useLocalSearchParams();
    const [dayDetail, setDayDetail] = useState<MigraineDayDetail | null>(null);

    useEffect(() => {
        if (params.data) {
            try {
                const parsedData = JSON.parse(params.data as string);
                setDayDetail(parsedData);
            } catch (error) {
                console.error('Failed to parse migraine data:', error);
            }
        }
    }, [params.data]);

    const getSeverityColor = (severity: number) => {
        switch (severity) {
            case 0:
                return '#10b981';
            case 1:
                return '#fbbf24';
            case 2:
                return '#f97316';
            case 3:
                return '#ef4444';
            case 4:
                return '#7c2d12';
            default:
                return '#cbd5e1';
        }
    };

    const getSeverityLabel = (severity: number) => {
        const labels = ['None', 'Mild', 'Moderate', 'Severe', 'Extreme'];
        return labels[severity] || 'Unknown';
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString + 'T00:00:00');
        return date.toLocaleDateString('default', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });
    };

    if (!dayDetail) {
        return (
            <View style={[styles.container, darkMode && styles.containerDark]}>
                <ModernHeader title="Migraine Details" onBack={() => router.back()} />
                <View style={styles.centerContent}>
                    <Text style={[styles.loadingText, darkMode && styles.loadingTextDark]}>
                        Loading details...
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, darkMode && styles.containerDark]}>
            <ModernHeader title="Migraine Details" onBack={() => router.back()} />

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                <View style={[styles.content, { maxWidth }]}>
                    {/* Date Header */}
                    <View style={[styles.headerCard, darkMode && styles.headerCardDark]}>
                        <View style={[
                            styles.dateCircle,
                            dayDetail.hasMigraine ? {
                                backgroundColor: getSeverityColor(dayDetail.severity),
                            } : {
                                backgroundColor: darkMode ? '#334155' : '#f1f5f9',
                            }
                        ]}>
                            <Ionicons
                                name={dayDetail.hasMigraine ? 'alert-circle' : 'checkmark-circle'}
                                size={48}
                                color={dayDetail.hasMigraine ? '#fff' : '#10b981'}
                            />
                        </View>
                        <View style={styles.headerInfo}>
                            <Text style={[styles.dateText, darkMode && styles.dateTextDark]}>
                                {formatDate(dayDetail.date)}
                            </Text>
                            {dayDetail.hasMigraine ? (
                                <Text style={styles.severityBadge}>
                                    {getSeverityLabel(dayDetail.severity)} Migraine
                                </Text>
                            ) : (
                                <Text style={styles.noBadge}>No Migraine</Text>
                            )}
                        </View>
                    </View>

                    {dayDetail.hasMigraine ? (
                        <>
                            {/* Severity */}
                            <View style={[styles.card, darkMode && styles.cardDark]}>
                                <View style={styles.cardHeader}>
                                    <Ionicons
                                        name="alert-circle"
                                        size={24}
                                        color={getSeverityColor(dayDetail.severity)}
                                    />
                                    <Text style={[styles.cardTitle, darkMode && styles.cardTitleDark]}>
                                        Severity
                                    </Text>
                                </View>
                                <View style={styles.severityBar}>
                                    <View style={[
                                        styles.severityFill,
                                        {
                                            width: `${(dayDetail.severity / 4) * 100}%`,
                                            backgroundColor: getSeverityColor(dayDetail.severity),
                                        }
                                    ]} />
                                </View>
                                <Text style={[styles.cardValue, darkMode && styles.cardValueDark]}>
                                    {getSeverityLabel(dayDetail.severity)} ({dayDetail.severity}/4)
                                </Text>
                            </View>

                            {/* Duration */}
                            <View style={[styles.card, darkMode && styles.cardDark]}>
                                <View style={styles.cardHeader}>
                                    <Ionicons name="timer" size={24} color="#f97316" />
                                    <Text style={[styles.cardTitle, darkMode && styles.cardTitleDark]}>
                                        Duration
                                    </Text>
                                </View>
                                <Text style={[styles.cardValue, darkMode && styles.cardValueDark]}>
                                    {dayDetail.duration} {dayDetail.duration === 1 ? 'hour' : 'hours'}
                                </Text>
                            </View>

                            {/* Triggers */}
                            {dayDetail.triggers && dayDetail.triggers.length > 0 && (
                                <View style={[styles.card, darkMode && styles.cardDark]}>
                                    <View style={styles.cardHeader}>
                                        <Ionicons name="flashlight" size={24} color="#f97316" />
                                        <Text style={[styles.cardTitle, darkMode && styles.cardTitleDark]}>
                                            Triggers
                                        </Text>
                                    </View>
                                    <View style={styles.tagContainer}>
                                        {dayDetail.triggers.map((trigger, index) => (
                                            <View key={index} style={[styles.tag, darkMode && styles.tagDark]}>
                                                <Text style={[styles.tagText, darkMode && styles.tagTextDark]}>
                                                    {trigger}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {/* Symptoms */}
                            {dayDetail.symptoms && dayDetail.symptoms.length > 0 && (
                                <View style={[styles.card, darkMode && styles.cardDark]}>
                                    <View style={styles.cardHeader}>
                                        <Ionicons name="body" size={24} color="#f97316" />
                                        <Text style={[styles.cardTitle, darkMode && styles.cardTitleDark]}>
                                            Symptoms
                                        </Text>
                                    </View>
                                    <View style={styles.tagContainer}>
                                        {dayDetail.symptoms.map((symptom, index) => (
                                            <View key={index} style={[styles.tag, darkMode && styles.tagDark]}>
                                                <Text style={[styles.tagText, darkMode && styles.tagTextDark]}>
                                                    {symptom}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {/* Medication */}
                            {dayDetail.medication && dayDetail.medication.length > 0 && (
                                <View style={[styles.card, darkMode && styles.cardDark]}>
                                    <View style={styles.cardHeader}>
                                        <Ionicons name="medkit" size={24} color="#10b981" />
                                        <Text style={[styles.cardTitle, darkMode && styles.cardTitleDark]}>
                                            Medication
                                        </Text>
                                    </View>
                                    <View style={styles.tagContainer}>
                                        {dayDetail.medication.map((med, index) => (
                                            <View
                                                key={index}
                                                style={[
                                                    styles.tag,
                                                    { backgroundColor: '#d1fae5' },
                                                    darkMode && styles.tagDark
                                                ]}
                                            >
                                                <Text style={[styles.tagText, darkMode && styles.tagTextDark]}>
                                                    {med}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {/* Notes */}
                            {dayDetail.note && (
                                <View style={[styles.card, darkMode && styles.cardDark]}>
                                    <View style={styles.cardHeader}>
                                        <Ionicons name="document-text" size={24} color="#8b5cf6" />
                                        <Text style={[styles.cardTitle, darkMode && styles.cardTitleDark]}>
                                            Notes
                                        </Text>
                                    </View>
                                    <Text style={[styles.noteText, darkMode && styles.noteTextDark]}>
                                        {dayDetail.note}
                                    </Text>
                                </View>
                            )}
                        </>
                    ) : (
                        <View style={[styles.noMigraineCard, darkMode && styles.noMigraineCardDark]}>
                            <Ionicons name="checkmark-circle" size={64} color="#10b981" />
                            <Text style={[styles.noMigraineTitle, darkMode && styles.noMigraineTitleDark]}>
                                No Migraine
                            </Text>
                            <Text style={[styles.noMigraineText, darkMode && styles.noMigraineTextDark]}>
                                Great day! No migraine activity recorded for this date.
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

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
    scrollContent: {
        padding: 24,
        paddingTop: 12,
        paddingBottom: 40,
    },
    content: {
        width: '100%',
        alignSelf: 'center',
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: '#2d4a42',
    },
    loadingTextDark: {
        color: '#d4e8e0',
    },
    headerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    headerCardDark: {
        backgroundColor: '#1f2937',
        borderColor: '#374151',
    },
    dateCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    headerInfo: {
        flex: 1,
    },
    dateText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 8,
    },
    dateTextDark: {
        color: '#f3f4f6',
    },
    severityBadge: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
        backgroundColor: '#ef4444',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        overflow: 'hidden',
        alignSelf: 'flex-start',
    },
    noBadge: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
        backgroundColor: '#10b981',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        overflow: 'hidden',
        alignSelf: 'flex-start',
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    cardDark: {
        backgroundColor: '#1f2937',
        borderColor: '#374151',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginLeft: 12,
    },
    cardTitleDark: {
        color: '#f3f4f6',
    },
    cardValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    cardValueDark: {
        color: '#f3f4f6',
    },
    severityBar: {
        width: '100%',
        height: 8,
        backgroundColor: '#e5e7eb',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 10,
    },
    severityFill: {
        height: '100%',
        borderRadius: 4,
    },
    tagContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tag: {
        backgroundColor: '#fee2e2',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
    },
    tagDark: {
        backgroundColor: '#7f1d1d',
    },
    tagText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#991b1b',
    },
    tagTextDark: {
        color: '#fca5a5',
    },
    noteText: {
        fontSize: 14,
        lineHeight: 22,
        color: '#374151',
    },
    noteTextDark: {
        color: '#d1d5db',
    },
    noMigraineCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 40,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    noMigraineCardDark: {
        backgroundColor: '#1f2937',
        borderColor: '#374151',
    },
    noMigraineTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#111827',
        marginTop: 16,
        marginBottom: 8,
    },
    noMigraineTitleDark: {
        color: '#f3f4f6',
    },
    noMigraineText: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 20,
    },
    noMigraineTextDark: {
        color: '#9ca3af',
    },
});
