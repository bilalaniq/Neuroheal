import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    ActivityIndicator,
    Alert,
    TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useUser } from '@/contexts/UserContext';
import { API_BASE_URL, API_ENDPOINTS, logAPI } from '@/config/api';

interface SleepLogProps {
    onSuccess?: () => void;
}

interface SleepMetrics {
    rem_percentage: string;
    deep_sleep_percentage: string;
    sleep_onset_minutes: string;
    total_sleep_hours: string;
    wake_percentage?: string;
    sleep_efficiency?: string;
    psqi_score?: string;
}

interface SleepAssessment {
    classification: string;
    risk_score: number;
    metrics_comparison: {
        rem_percent: { yours: number; migraine_avg: number; healthy_avg: number };
        deep_sleep_percent: { yours: number; migraine_avg: number; healthy_avg: number };
        sleep_onset_minutes: { yours: number; migraine_avg: number; healthy_avg: number };
        total_sleep_minutes: { yours: number; migraine_avg: number; healthy_avg: number };
    };
    warnings: string[];
    recommendation: string;
    timestamp: string;
}

export const SleepLog: React.FC<SleepLogProps> = ({ onSuccess }) => {
    const { darkMode } = useTheme();
    const { userData } = useUser();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<SleepAssessment | null>(null);
    const [metrics, setMetrics] = useState<SleepMetrics>({
        rem_percentage: '20',
        deep_sleep_percentage: '15',
        sleep_onset_minutes: '15',
        total_sleep_hours: '7',
        wake_percentage: '5',
        sleep_efficiency: '85',
        psqi_score: '',
    });

    const handleAssess = async () => {
        // Validate required fields
        if (!metrics.rem_percentage || !metrics.deep_sleep_percentage || !metrics.total_sleep_hours) {
            Alert.alert('Validation', 'Please fill in REM sleep, Deep sleep, and Total sleep hours');
            return;
        }

        const remValue = parseFloat(metrics.rem_percentage);
        const deepValue = parseFloat(metrics.deep_sleep_percentage);
        const totalHours = parseFloat(metrics.total_sleep_hours);
        const onsetMinutes = parseFloat(metrics.sleep_onset_minutes) || 0;
        const wakeValue = parseFloat(metrics.wake_percentage || '0');
        const efficiencyValue = parseFloat(metrics.sleep_efficiency || '0');
        const psqiValue = metrics.psqi_score ? parseFloat(metrics.psqi_score) : undefined;

        // Validate ranges
        if (isNaN(remValue) || remValue < 0 || remValue > 100) {
            Alert.alert('Validation', 'REM percentage must be between 0 and 100');
            return;
        }

        if (isNaN(deepValue) || deepValue < 0 || deepValue > 100) {
            Alert.alert('Validation', 'Deep sleep percentage must be between 0 and 100');
            return;
        }

        if (remValue + deepValue > 100) {
            Alert.alert('Validation', 'REM + Deep sleep cannot exceed 100%');
            return;
        }

        if (isNaN(totalHours) || totalHours < 0 || totalHours > 24) {
            Alert.alert('Validation', 'Total sleep hours must be between 0 and 24');
            return;
        }

        if (onsetMinutes < 0 || onsetMinutes > 180) {
            Alert.alert('Validation', 'Sleep onset time should be between 0 and 180 minutes');
            return;
        }

        setLoading(true);
        const endpoint = API_ENDPOINTS.sleep;
        const url = `${API_BASE_URL}${endpoint}`;

        // Convert hours to minutes for backend
        const totalSleepMinutes = totalHours * 60;

        // Build payload with all available metrics
        const payload: any = {
            total_sleep_minutes: totalSleepMinutes,
            sleep_onset_minutes: onsetMinutes,
            rem_percent: remValue,
            deep_sleep_percent: deepValue,
        };

        // Add optional fields if provided
        if (wakeValue > 0) {
            payload.wake_percent = wakeValue;
        }
        if (efficiencyValue > 0) {
            payload.sleep_efficiency = efficiencyValue;
        }
        if (psqiValue !== undefined && !isNaN(psqiValue)) {
            payload.psqi_score = psqiValue;
        }

        logAPI('request', endpoint, payload);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const responseText = await response.text();
            logAPI('response', endpoint, { status: response.status, body: responseText });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${responseText}`);
            }

            const data = JSON.parse(responseText);
            console.log('[SleepLog] Success:', data);
            
            setResult(data);
            if (onSuccess) onSuccess();
        } catch (error) {
            logAPI('error', endpoint, error);
            Alert.alert('Error', `Failed to assess sleep: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Results screen
    if (result) {
        const scoreColor = result.risk_score >= 0.7 ? '#ef4444' : result.risk_score >= 0.4 ? '#f59e0b' : '#10b981';
        const classificationColor = result.classification === 'Migraine-like' ? '#ef4444' : '#10b981';

        return (
            <ScrollView
                style={[
                    styles.container,
                    darkMode ? styles.containerDark : styles.containerLight,
                ]}
                contentContainerStyle={styles.content}
            >
                {/* Risk Score Card */}
                <View
                    style={[
                        styles.scoreCard,
                        darkMode ? styles.scoreCardDark : styles.scoreCardLight,
                    ]}
                >
                    <View style={styles.scoreCircle}>
                        <Text
                            style={[
                                styles.scoreValue,
                                { color: scoreColor },
                            ]}
                        >
                            {(result.risk_score * 100).toFixed(0)}
                        </Text>
                        <Text
                            style={[
                                styles.scoreLabel,
                                darkMode ? { color: '#a8d5c4' } : { color: '#7a9f94' },
                            ]}
                        >
                            /100
                        </Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 16 }}>
                        <Text
                            style={[
                                styles.classificationText,
                                { color: classificationColor },
                            ]}
                        >
                            {result.classification}
                        </Text>
                        <Text
                            style={[
                                styles.scoreSubtext,
                                darkMode ? { color: '#a8d5c4' } : { color: '#7a9f94' },
                            ]}
                        >
                            Sleep Pattern Analysis
                        </Text>
                    </View>
                </View>

                {/* Metrics Comparison */}
                <View style={styles.section}>
                    <Text
                        style={[
                            styles.analysisTitle,
                            darkMode ? { color: '#d4e8e0' } : { color: '#2d4a42' },
                        ]}
                    >
                        Sleep Metrics Comparison
                    </Text>
                    
                    <View style={styles.comparisonTable}>
                        <View style={styles.comparisonRow}>
                            <Text style={[styles.comparisonHeader, darkMode ? { color: '#d4e8e0' } : { color: '#2d4a42' }]}>Metric</Text>
                            <Text style={[styles.comparisonHeader, darkMode ? { color: '#d4e8e0' } : { color: '#2d4a42' }]}>You</Text>
                            <Text style={[styles.comparisonHeader, darkMode ? { color: '#d4e8e0' } : { color: '#2d4a42' }]}>Migraine</Text>
                            <Text style={[styles.comparisonHeader, darkMode ? { color: '#d4e8e0' } : { color: '#2d4a42' }]}>Healthy</Text>
                        </View>

                        <View style={styles.comparisonRow}>
                            <Text style={[styles.comparisonMetric, darkMode ? { color: '#a8d5c4' } : { color: '#7a9f94' }]}>REM %</Text>
                            <Text style={[styles.comparisonValue, darkMode ? { color: '#d4e8e0' } : { color: '#2d4a42' }]}>
                                {result.metrics_comparison.rem_percent.yours.toFixed(1)}%
                            </Text>
                            <Text style={[styles.comparisonValue, darkMode ? { color: '#a8d5c4' } : { color: '#7a9f94' }]}>
                                {result.metrics_comparison.rem_percent.migraine_avg.toFixed(1)}%
                            </Text>
                            <Text style={[styles.comparisonValue, darkMode ? { color: '#a8d5c4' } : { color: '#7a9f94' }]}>
                                {result.metrics_comparison.rem_percent.healthy_avg.toFixed(1)}%
                            </Text>
                        </View>

                        <View style={styles.comparisonRow}>
                            <Text style={[styles.comparisonMetric, darkMode ? { color: '#a8d5c4' } : { color: '#7a9f94' }]}>Deep %</Text>
                            <Text style={[styles.comparisonValue, darkMode ? { color: '#d4e8e0' } : { color: '#2d4a42' }]}>
                                {result.metrics_comparison.deep_sleep_percent.yours.toFixed(1)}%
                            </Text>
                            <Text style={[styles.comparisonValue, darkMode ? { color: '#a8d5c4' } : { color: '#7a9f94' }]}>
                                {result.metrics_comparison.deep_sleep_percent.migraine_avg.toFixed(1)}%
                            </Text>
                            <Text style={[styles.comparisonValue, darkMode ? { color: '#a8d5c4' } : { color: '#7a9f94' }]}>
                                {result.metrics_comparison.deep_sleep_percent.healthy_avg.toFixed(1)}%
                            </Text>
                        </View>

                        <View style={styles.comparisonRow}>
                            <Text style={[styles.comparisonMetric, darkMode ? { color: '#a8d5c4' } : { color: '#7a9f94' }]}>Onset (min)</Text>
                            <Text style={[styles.comparisonValue, darkMode ? { color: '#d4e8e0' } : { color: '#2d4a42' }]}>
                                {result.metrics_comparison.sleep_onset_minutes.yours.toFixed(0)}
                            </Text>
                            <Text style={[styles.comparisonValue, darkMode ? { color: '#a8d5c4' } : { color: '#7a9f94' }]}>
                                {result.metrics_comparison.sleep_onset_minutes.migraine_avg.toFixed(0)}
                            </Text>
                            <Text style={[styles.comparisonValue, darkMode ? { color: '#a8d5c4' } : { color: '#7a9f94' }]}>
                                {result.metrics_comparison.sleep_onset_minutes.healthy_avg.toFixed(0)}
                            </Text>
                        </View>

                        <View style={styles.comparisonRow}>
                            <Text style={[styles.comparisonMetric, darkMode ? { color: '#a8d5c4' } : { color: '#7a9f94' }]}>Total (min)</Text>
                            <Text style={[styles.comparisonValue, darkMode ? { color: '#d4e8e0' } : { color: '#2d4a42' }]}>
                                {result.metrics_comparison.total_sleep_minutes.yours.toFixed(0)}
                            </Text>
                            <Text style={[styles.comparisonValue, darkMode ? { color: '#a8d5c4' } : { color: '#7a9f94' }]}>
                                {result.metrics_comparison.total_sleep_minutes.migraine_avg.toFixed(0)}
                            </Text>
                            <Text style={[styles.comparisonValue, darkMode ? { color: '#a8d5c4' } : { color: '#7a9f94' }]}>
                                {result.metrics_comparison.total_sleep_minutes.healthy_avg.toFixed(0)}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Warnings */}
                {result.warnings && result.warnings.length > 0 && (
                    <View style={styles.section}>
                        <Text
                            style={[
                                styles.analysisTitle,
                                darkMode ? { color: '#d4e8e0' } : { color: '#2d4a42' },
                            ]}
                        >
                            Issues Found
                        </Text>
                        {result.warnings.map((warning, idx) => (
                            <View key={idx} style={styles.warningItem}>
                                <Ionicons name="warning" size={16} color="#ef4444" />
                                <Text
                                    style={[
                                        styles.warningText,
                                        darkMode ? { color: '#a8d5c4' } : { color: '#7a9f94' },
                                    ]}
                                >
                                    {warning}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Recommendation */}
                <View style={styles.section}>
                    <Text
                        style={[
                            styles.analysisTitle,
                            darkMode ? { color: '#d4e8e0' } : { color: '#2d4a42' },
                        ]}
                    >
                        Recommendation
                    </Text>
                    <View
                        style={[
                            styles.recommendationBox,
                            darkMode ? styles.recommendationBoxDark : styles.recommendationBoxLight,
                        ]}
                    >
                        <Ionicons name="bulb" size={20} color="#10b981" style={{ marginRight: 8 }} />
                        <Text
                            style={[
                                styles.recommendationText,
                                darkMode ? { color: '#a8d5c4' } : { color: '#7a9f94' },
                            ]}
                        >
                            {result.recommendation}
                        </Text>
                    </View>
                </View>

                <Pressable onPress={() => setResult(null)} style={styles.submitButton}>
                    <Text style={styles.submitButtonText}>Assess Again</Text>
                </Pressable>
            </ScrollView>
        );
    }

    // Form screen
    return (
        <ScrollView
            style={[
                styles.container,
                darkMode ? styles.containerDark : styles.containerLight,
            ]}
            contentContainerStyle={styles.content}
        >
            <Text
                style={[
                    styles.sectionTitle,
                    darkMode ? { color: '#d4e8e0' } : { color: '#2d4a42' },
                ]}
            >
                Sleep Assessment
            </Text>
            <Text
                style={[
                    styles.sectionSubtitle,
                    darkMode ? { color: '#a8d5c4' } : { color: '#7a9f94' },
                ]}
            >
                Log your sleep metrics for analysis
            </Text>

            {/* Info Card */}
            <View
                style={[
                    styles.infoCard,
                    darkMode ? styles.infoCardDark : styles.infoCardLight,
                ]}
            >
                <Ionicons name="information-circle" size={20} color="#10b981" />
                <Text
                    style={[
                        styles.infoText,
                        darkMode ? { color: '#a8d5c4' } : { color: '#7a9f94' },
                    ]}
                >
                    Sleep quality significantly impacts migraine frequency. Poor sleep is a major trigger for many patients.
                </Text>
            </View>

            {/* REM Sleep */}
            <View style={styles.section}>
                <View style={styles.inputHeader}>
                    <Text
                        style={[
                            styles.label,
                            darkMode ? { color: '#d4e8e0' } : { color: '#2d4a42' },
                        ]}
                    >
                        REM Sleep
                    </Text>
                    <Text
                        style={[
                            styles.requiredText,
                            darkMode ? { color: '#10b981' } : { color: '#059669' },
                        ]}
                    >
                        required
                    </Text>
                </View>
                <View style={styles.inputWithIcon}>
                    <TextInput
                        style={[styles.input, darkMode ? styles.inputDark : styles.inputLight]}
                        placeholder="20"
                        placeholderTextColor={darkMode ? '#5a8f7f' : '#a8d5c4'}
                        keyboardType="numeric"
                        value={metrics.rem_percentage}
                        onChangeText={(text) => setMetrics({ ...metrics, rem_percentage: text })}
                    />
                    <Text
                        style={[
                            styles.inputUnit,
                            darkMode ? { color: '#a8d5c4' } : { color: '#7a9f94' },
                        ]}
                    >
                        %
                    </Text>
                </View>
                <Text
                    style={[
                        styles.helperText,
                        darkMode ? { color: '#5a8f7f' } : { color: '#a8d5c4' },
                    ]}
                >
                    Healthy: 20-25% | Migraine patients: 15-18%
                </Text>
            </View>

            {/* Deep Sleep */}
            <View style={styles.section}>
                <View style={styles.inputHeader}>
                    <Text
                        style={[
                            styles.label,
                            darkMode ? { color: '#d4e8e0' } : { color: '#2d4a42' },
                        ]}
                    >
                        Deep Sleep
                    </Text>
                    <Text
                        style={[
                            styles.requiredText,
                            darkMode ? { color: '#10b981' } : { color: '#059669' },
                        ]}
                    >
                        required
                    </Text>
                </View>
                <View style={styles.inputWithIcon}>
                    <TextInput
                        style={[styles.input, darkMode ? styles.inputDark : styles.inputLight]}
                        placeholder="15"
                        placeholderTextColor={darkMode ? '#5a8f7f' : '#a8d5c4'}
                        keyboardType="numeric"
                        value={metrics.deep_sleep_percentage}
                        onChangeText={(text) => setMetrics({ ...metrics, deep_sleep_percentage: text })}
                    />
                    <Text
                        style={[
                            styles.inputUnit,
                            darkMode ? { color: '#a8d5c4' } : { color: '#7a9f94' },
                        ]}
                    >
                        %
                    </Text>
                </View>
                <Text
                    style={[
                        styles.helperText,
                        darkMode ? { color: '#5a8f7f' } : { color: '#a8d5c4' },
                    ]}
                >
                    Healthy: 15-30% | Migraine patients: 10-15%
                </Text>
            </View>

            {/* Sleep Onset Time */}
            <View style={styles.section}>
                <View style={styles.inputHeader}>
                    <Text
                        style={[
                            styles.label,
                            darkMode ? { color: '#d4e8e0' } : { color: '#2d4a42' },
                        ]}
                    >
                        Sleep Onset Time
                    </Text>
                    <Text
                        style={[
                            styles.optionalText,
                            darkMode ? { color: '#5a8f7f' } : { color: '#a8d5c4' },
                        ]}
                    >
                        optional
                    </Text>
                </View>
                <View style={styles.inputWithIcon}>
                    <TextInput
                        style={[styles.input, darkMode ? styles.inputDark : styles.inputLight]}
                        placeholder="15"
                        placeholderTextColor={darkMode ? '#5a8f7f' : '#a8d5c4'}
                        keyboardType="numeric"
                        value={metrics.sleep_onset_minutes}
                        onChangeText={(text) => setMetrics({ ...metrics, sleep_onset_minutes: text })}
                    />
                    <Text
                        style={[
                            styles.inputUnit,
                            darkMode ? { color: '#a8d5c4' } : { color: '#7a9f94' },
                        ]}
                    >
                        min
                    </Text>
                </View>
                <Text
                    style={[
                        styles.helperText,
                        darkMode ? { color: '#5a8f7f' } : { color: '#a8d5c4' },
                    ]}
                >
                    Time to fall asleep (10-20 min is normal)
                </Text>
            </View>

            {/* Total Sleep Hours */}
            <View style={styles.section}>
                <View style={styles.inputHeader}>
                    <Text
                        style={[
                            styles.label,
                            darkMode ? { color: '#d4e8e0' } : { color: '#2d4a42' },
                        ]}
                    >
                        Total Sleep Hours
                    </Text>
                    <Text
                        style={[
                            styles.requiredText,
                            darkMode ? { color: '#10b981' } : { color: '#059669' },
                        ]}
                    >
                        required
                    </Text>
                </View>
                <View style={styles.inputWithIcon}>
                    <TextInput
                        style={[styles.input, darkMode ? styles.inputDark : styles.inputLight]}
                        placeholder="7"
                        placeholderTextColor={darkMode ? '#5a8f7f' : '#a8d5c4'}
                        keyboardType="numeric"
                        value={metrics.total_sleep_hours}
                        onChangeText={(text) => setMetrics({ ...metrics, total_sleep_hours: text })}
                    />
                    <Text
                        style={[
                            styles.inputUnit,
                            darkMode ? { color: '#a8d5c4' } : { color: '#7a9f94' },
                        ]}
                    >
                        hrs
                    </Text>
                </View>
                <Text
                    style={[
                        styles.helperText,
                        darkMode ? { color: '#5a8f7f' } : { color: '#a8d5c4' },
                    ]}
                >
                    Target: 7-9 hours for optimal health
                </Text>
            </View>

            {/* Additional Metrics (Optional) */}
            <Text
                style={[
                    styles.sectionSubheading,
                    darkMode ? { color: '#d4e8e0' } : { color: '#2d4a42' },
                ]}
            >
                Additional Metrics (Optional)
            </Text>

            {/* Wake Percentage */}
            <View style={styles.section}>
                <View style={styles.inputHeader}>
                    <Text
                        style={[
                            styles.label,
                            darkMode ? { color: '#d4e8e0' } : { color: '#2d4a42' },
                        ]}
                    >
                        Wake Time
                    </Text>
                    <Text
                        style={[
                            styles.optionalText,
                            darkMode ? { color: '#5a8f7f' } : { color: '#a8d5c4' },
                        ]}
                    >
                        optional
                    </Text>
                </View>
                <View style={styles.inputWithIcon}>
                    <TextInput
                        style={[styles.input, darkMode ? styles.inputDark : styles.inputLight]}
                        placeholder="5"
                        placeholderTextColor={darkMode ? '#5a8f7f' : '#a8d5c4'}
                        keyboardType="numeric"
                        value={metrics.wake_percentage}
                        onChangeText={(text) => setMetrics({ ...metrics, wake_percentage: text })}
                    />
                    <Text
                        style={[
                            styles.inputUnit,
                            darkMode ? { color: '#a8d5c4' } : { color: '#7a9f94' },
                        ]}
                    >
                        %
                    </Text>
                </View>
                <Text
                    style={[
                        styles.helperText,
                        darkMode ? { color: '#5a8f7f' } : { color: '#a8d5c4' },
                    ]}
                >
                    Percentage of time awake during night
                </Text>
            </View>

            {/* Sleep Efficiency */}
            <View style={styles.section}>
                <View style={styles.inputHeader}>
                    <Text
                        style={[
                            styles.label,
                            darkMode ? { color: '#d4e8e0' } : { color: '#2d4a42' },
                        ]}
                    >
                        Sleep Efficiency
                    </Text>
                    <Text
                        style={[
                            styles.optionalText,
                            darkMode ? { color: '#5a8f7f' } : { color: '#a8d5c4' },
                        ]}
                    >
                        optional
                    </Text>
                </View>
                <View style={styles.inputWithIcon}>
                    <TextInput
                        style={[styles.input, darkMode ? styles.inputDark : styles.inputLight]}
                        placeholder="85"
                        placeholderTextColor={darkMode ? '#5a8f7f' : '#a8d5c4'}
                        keyboardType="numeric"
                        value={metrics.sleep_efficiency}
                        onChangeText={(text) => setMetrics({ ...metrics, sleep_efficiency: text })}
                    />
                    <Text
                        style={[
                            styles.inputUnit,
                            darkMode ? { color: '#a8d5c4' } : { color: '#7a9f94' },
                        ]}
                    >
                        %
                    </Text>
                </View>
                <Text
                    style={[
                        styles.helperText,
                        darkMode ? { color: '#5a8f7f' } : { color: '#a8d5c4' },
                    ]}
                >
                    Time asleep / time in bed × 100 (85%+ is good)
                </Text>
            </View>

            {/* PSQI Score */}
            <View style={styles.section}>
                <View style={styles.inputHeader}>
                    <Text
                        style={[
                            styles.label,
                            darkMode ? { color: '#d4e8e0' } : { color: '#2d4a42' },
                        ]}
                    >
                        PSQI Score
                    </Text>
                    <Text
                        style={[
                            styles.optionalText,
                            darkMode ? { color: '#5a8f7f' } : { color: '#a8d5c4' },
                        ]}
                    >
                        optional
                    </Text>
                </View>
                <TextInput
                    style={[styles.input, darkMode ? styles.inputDark : styles.inputLight]}
                    placeholder="0-21"
                    placeholderTextColor={darkMode ? '#5a8f7f' : '#a8d5c4'}
                    keyboardType="numeric"
                    value={metrics.psqi_score}
                    onChangeText={(text) => setMetrics({ ...metrics, psqi_score: text })}
                />
                <Text
                    style={[
                        styles.helperText,
                        darkMode ? { color: '#5a8f7f' } : { color: '#a8d5c4' },
                    ]}
                >
                    Pittsburgh Sleep Quality Index (0-21, lower is better)
                </Text>
            </View>

            <Pressable
                onPress={handleAssess}
                disabled={loading}
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.submitButtonText}>Assess Sleep Quality</Text>
                )}
            </Pressable>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    containerLight: {
        backgroundColor: '#f5f8f7',
    },
    containerDark: {
        backgroundColor: '#1a2522',
    },
    content: {
        padding: 20,
        paddingBottom: 30,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 14,
        marginBottom: 24,
    },
    sectionSubheading: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 20,
        marginBottom: 12,
    },
    section: {
        marginBottom: 20,
    },
    inputHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
    },
    requiredText: {
        fontSize: 12,
        fontWeight: '600',
    },
    optionalText: {
        fontSize: 12,
        fontStyle: 'italic',
    },
    helperText: {
        fontSize: 11,
        marginTop: 4,
        fontStyle: 'italic',
    },
    input: {
        flex: 1,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 10,
        fontSize: 14,
        borderWidth: 1,
    },
    inputLight: {
        backgroundColor: '#fff',
        borderColor: '#d4e8e0',
        color: '#2d4a42',
    },
    inputDark: {
        backgroundColor: '#253029',
        borderColor: '#5a8f7f',
        color: '#d4e8e0',
    },
    inputWithIcon: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    inputUnit: {
        fontSize: 14,
        fontWeight: '500',
        minWidth: 40,
        textAlign: 'center',
    },
    infoCard: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        borderWidth: 1,
        gap: 12,
    },
    infoCardLight: {
        backgroundColor: '#e8f5f2',
        borderColor: '#d4e8e0',
    },
    infoCardDark: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderColor: '#5a8f7f',
    },
    infoText: {
        fontSize: 13,
        lineHeight: 18,
        flex: 1,
    },
    scoreCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
    },
    scoreCardLight: {
        backgroundColor: '#fff',
        borderColor: '#d4e8e0',
    },
    scoreCardDark: {
        backgroundColor: '#253029',
        borderColor: '#5a8f7f',
    },
    scoreCircle: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    scoreValue: {
        fontSize: 36,
        fontWeight: '700',
    },
    scoreLabel: {
        fontSize: 12,
    },
    classificationText: {
        fontSize: 18,
        fontWeight: '600',
    },
    scoreSubtext: {
        fontSize: 12,
        marginTop: 2,
    },
    analysisTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    comparisonTable: {
        borderWidth: 1,
        borderRadius: 10,
        overflow: 'hidden',
    },
    comparisonRow: {
        flexDirection: 'row',
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(168, 213, 196, 0.2)',
    },
    comparisonHeader: {
        flex: 1,
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    },
    comparisonMetric: {
        flex: 1,
        fontSize: 12,
        textAlign: 'left',
        paddingLeft: 4,
    },
    comparisonValue: {
        flex: 1,
        fontSize: 12,
        textAlign: 'center',
    },
    warningItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        marginBottom: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
    },
    warningText: {
        fontSize: 13,
        flex: 1,
        lineHeight: 18,
    },
    recommendationBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    recommendationBoxLight: {
        backgroundColor: '#e8f5f2',
        borderColor: '#d4e8e0',
    },
    recommendationBoxDark: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderColor: '#5a8f7f',
    },
    recommendationText: {
        fontSize: 14,
        flex: 1,
        lineHeight: 20,
    },
    submitButton: {
        backgroundColor: '#10b981',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
});