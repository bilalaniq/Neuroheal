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

interface MorningCheckProps {
    onSuccess?: () => void;
}

interface TriggerFormData {
    stress_level: string;
    sleep_hours: string;
    sleep_quality: string;
    hydration: string;
    caffeine: string;
    alcohol_last_night: boolean;
    weather_change: boolean;
    hormonal_changes: boolean;
    skipped_meals: boolean;
    irregular_schedule: boolean;
    bright_lights: boolean;
    loud_noises: boolean;
    strong_smells: boolean;
    physical_activity: boolean;
    eye_strain: boolean;
    neck_tension: boolean;
    workload: string;
    medication_taken: boolean;
    missed_medication: boolean;
    screen_time: string;
    posture_issues: boolean;
    anxiety_level: string;
    recent_illness: boolean;
    dehydration: boolean;
    sugar_consumption: string;
    magnesium_deficiency: boolean;
}

interface PredictionResult {
    migraine_predicted: boolean;
    risk_level: string;
    probability: number;
    top_triggers: string[];
    recommendation: string;
    timestamp: string;
}

export const MorningCheck: React.FC<MorningCheckProps> = ({ onSuccess }) => {
    const { darkMode } = useTheme();
    const { userData } = useUser();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<PredictionResult | null>(null);
    const [formData, setFormData] = useState<TriggerFormData>({
        stress_level: '5',
        sleep_hours: '7',
        sleep_quality: 'Good',
        hydration: 'Adequate',
        caffeine: 'Moderate',
        alcohol_last_night: false,
        weather_change: false,
        hormonal_changes: false,
        skipped_meals: false,
        irregular_schedule: false,
        bright_lights: false,
        loud_noises: false,
        strong_smells: false,
        physical_activity: false,
        eye_strain: false,
        neck_tension: false,
        workload: 'Normal',
        medication_taken: false,
        missed_medication: false,
        screen_time: 'Moderate',
        posture_issues: false,
        anxiety_level: '5',
        recent_illness: false,
        dehydration: false,
        sugar_consumption: 'Normal',
        magnesium_deficiency: false,
    });

    const toggleTrigger = (trigger: keyof TriggerFormData) => {
        setFormData({
            ...formData,
            [trigger]: !formData[trigger],
        });
    };

    const handlePredict = async () => {
        setLoading(true);
        const endpoint = API_ENDPOINTS.migraineToday;
        const url = `${API_BASE_URL}${endpoint}`;

        // Calculate lack of sleep (8 hours is optimal)
        const sleepHoursNum = parseFloat(formData.sleep_hours) || 7;
        const lackOfSleep = Math.max(0, 8 - sleepHoursNum);

        // Convert stress from 1-10 (UI slider) to 0-4 (backend scale)
        const stressRaw = parseInt(formData.stress_level) || 5;
        const stress04 = Math.round((stressRaw - 1) / 9 * 4); // 1->0, 5->2, 10->4

        // Map form values to backend expected values (0-4 scale)
        const payload = {
            // Environmental triggers - present = moderate intensity (2), independent of stress
            cold_air_exposure: 0,
            perfume_or_strong_odors: formData.strong_smells ? 2 : 0,
            bright_or_flashing_lights: formData.bright_lights ? 2 : 0,
            loud_sounds: formData.loud_noises ? 2 : 0,
            changing_weather: formData.weather_change ? 3 : 0,
            hot_and_humid_weather: 0,

            // Lifestyle triggers
            physical_exertion: formData.physical_activity ? 2 : 0,
            overslept: 0,
            lack_of_sleep: Math.min(4, Math.round(lackOfSleep)), // Scale 0-4
            stress: stress04,  // correctly mapped 1-10 to 0-4
            post_stress_letdown: 0,
            missed_a_meal: formData.skipped_meals ? 2 : 0,
            dehydration: formData.dehydration ? 2 : 0,

            // Food triggers
            nightshade_vegetables: 0,
            smoked_or_cured_meat: 0,
            bananas: 0,
            caffeine: formData.caffeine === 'High' ? 3 : formData.caffeine === 'Moderate' ? 2 : 1,
            citrus_fruit_or_juice: 0,
            beer: formData.alcohol_last_night ? 2 : 0,
            aged_or_blue_cheese: 0,
            chocolate: 0,
            red_wine: formData.alcohol_last_night ? 2 : 0,
            liquor_or_spirits: formData.alcohol_last_night ? 2 : 0,
            sugar_and_sweets: formData.sugar_consumption === 'High' ? 3 : formData.sugar_consumption === 'Normal' ? 2 : 1,

            // Previous day context
            prev_day_migraine: 0,
            is_weekend: new Date().getDay() === 0 || new Date().getDay() === 6 ? 1 : 0
        };

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
            console.log('[MorningCheck] Success:', data);

            // --- Rule-based override ---
            // The ML model under-weights sleep and stress alone.
            // Apply clinical rules on top to correct obvious cases.
            const sleepHours = parseFloat(formData.sleep_hours) || 7;
            const stressLevel = parseInt(formData.stress_level) || 5;
            const anxietyLevel = parseInt(formData.anxiety_level) || 5;

            let adjustedData = { ...data };

            // Count how many severe risk factors are present
            let riskPoints = 0;
            if (sleepHours <= 4)  riskPoints += 3;       // severely sleep deprived
            else if (sleepHours <= 6) riskPoints += 2;   // under-slept
            else if (sleepHours <= 6.5) riskPoints += 1;
            if (stressLevel >= 8)  riskPoints += 2;
            else if (stressLevel >= 6) riskPoints += 1;
            if (anxietyLevel >= 8) riskPoints += 1;
            if (formData.alcohol_last_night) riskPoints += 2;
            if (formData.skipped_meals) riskPoints += 1;
            if (formData.dehydration) riskPoints += 1;
            if (formData.weather_change) riskPoints += 1;

            // Build override warning list for display
            const ruleWarnings: string[] = [];
            if (sleepHours <= 4)  ruleWarnings.push(`Only ${sleepHours}h sleep — severe deprivation (major migraine trigger)`);
            else if (sleepHours <= 6) ruleWarnings.push(`Only ${sleepHours}h sleep — below recommended 7-9h`);
            if (stressLevel >= 6) ruleWarnings.push(`High stress level (${stressLevel}/10)`);
            if (anxietyLevel >= 6) ruleWarnings.push(`High anxiety level (${anxietyLevel}/10)`);
            if (formData.alcohol_last_night) ruleWarnings.push('Alcohol consumption last night');
            if (formData.dehydration) ruleWarnings.push('Dehydration reported');
            if (formData.skipped_meals) ruleWarnings.push('Skipped meals');

            // Override risk level based on points
            if (riskPoints >= 4) {
                adjustedData.risk_level = 'HIGH';
                adjustedData.migraine_predicted = true;
                adjustedData.probability = Math.max(data.probability, 0.70);
                adjustedData.recommendation = 'High risk based on your reported conditions. Rest, stay hydrated, avoid screens and loud environments today.';
            } else if (riskPoints >= 2) {
                adjustedData.risk_level = 'MEDIUM';
                adjustedData.probability = Math.max(data.probability, 0.40);
                adjustedData.recommendation = 'Moderate risk today. Take it easy, stay hydrated and monitor your symptoms.';
            }

            // Merge rule-based warnings into top_triggers
            if (ruleWarnings.length > 0) {
                const existing = adjustedData.top_triggers || [];
                adjustedData.top_triggers = [...new Set([...ruleWarnings, ...existing])];
            }

            setResult(adjustedData);
            if (onSuccess) onSuccess();
        } catch (error) {
            logAPI('error', endpoint, error);
            Alert.alert('Error', `Failed to predict migraine risk: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Results screen
    if (result) {
        const riskColor = result.risk_level === 'HIGH' ? '#ef4444' : result.risk_level === 'MEDIUM' ? '#f59e0b' : '#10b981';
        const riskIcon = result.risk_level === 'HIGH' ? 'alert-circle' : result.risk_level === 'MEDIUM' ? 'warning' : 'checkmark-circle';

        return (
            <ScrollView
                style={[
                    styles.container,
                    darkMode ? styles.containerDark : styles.containerLight,
                ]}
                contentContainerStyle={styles.content}
            >
                <View
                    style={[
                        styles.resultCard,
                        darkMode ? styles.resultCardDark : styles.resultCardLight,
                        { borderLeftWidth: 6, borderLeftColor: riskColor },
                    ]}
                >
                    <Ionicons
                        name={riskIcon}
                        size={60}
                        color={riskColor}
                        style={{ marginBottom: 16 }}
                    />
                    <Text
                        style={[
                            styles.resultType,
                            { color: riskColor },
                        ]}
                    >
                        {result.risk_level} Risk
                    </Text>
                    <Text
                        style={[
                            styles.resultPercentage,
                            darkMode ? { color: '#a8d5c4' } : { color: '#7a9f94' },
                        ]}
                    >
                        {(result.probability * 100).toFixed(1)}% likelihood of migraine today
                    </Text>
                    <Text
                        style={[
                            styles.resultPrediction,
                            darkMode ? { color: '#d4e8e0' } : { color: '#2d4a42' },
                        ]}
                    >
                        {result.migraine_predicted ? 'Migraine predicted today' : 'No migraine predicted today'}
                    </Text>
                </View>

                {result.top_triggers && result.top_triggers.length > 0 && (
                    <View style={styles.section}>
                        <Text
                            style={[
                                styles.label,
                                darkMode ? { color: '#d4e8e0' } : { color: '#2d4a42' },
                            ]}
                        >
                            Top Triggers Today
                        </Text>
                        {result.top_triggers.map((trigger: string, idx: number) => (
                            <View key={idx} style={styles.triggerItem}>
                                <Ionicons name="alert" size={16} color="#ef4444" />
                                <Text
                                    style={[
                                        styles.triggerText,
                                        darkMode ? { color: '#a8d5c4' } : { color: '#7a9f94' },
                                    ]}
                                >
                                    {trigger}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}

                {result.recommendation && (
                    <View style={styles.section}>
                        <Text
                            style={[
                                styles.label,
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
                )}

                <Pressable onPress={() => setResult(null)} style={styles.submitButton}>
                    <Text style={styles.submitButtonText}>Check Again</Text>
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
                Morning Risk Check
            </Text>
            <Text
                style={[
                    styles.sectionSubtitle,
                    darkMode ? { color: '#a8d5c4' } : { color: '#7a9f94' },
                ]}
            >
                Check your migraine risk for today
            </Text>

            {/* Sleep & Rest */}
            <Text
                style={[
                    styles.sectionSubheading,
                    darkMode ? { color: '#d4e8e0' } : { color: '#2d4a42' },
                ]}
            >
                Sleep & Rest
            </Text>

            <View style={styles.section}>
                <Text
                    style={[
                        styles.label,
                        darkMode ? { color: '#d4e8e0' } : { color: '#2d4a42' },
                    ]}
                >
                    Hours of Sleep Last Night
                </Text>
                <TextInput
                    style={[styles.input, darkMode ? styles.inputDark : styles.inputLight]}
                    placeholder="7"
                    placeholderTextColor={darkMode ? '#5a8f7f' : '#a8d5c4'}
                    keyboardType="numeric"
                    value={formData.sleep_hours}
                    onChangeText={(text) => setFormData({ ...formData, sleep_hours: text })}
                />
                <Text
                    style={[
                        styles.helperText,
                        darkMode ? { color: '#5a8f7f' } : { color: '#a8d5c4' },
                    ]}
                >
                    Recommended: 7-9 hours
                </Text>
            </View>

            <View style={styles.section}>
                <Text
                    style={[
                        styles.label,
                        darkMode ? { color: '#d4e8e0' } : { color: '#2d4a42' },
                    ]}
                >
                    Sleep Quality
                </Text>
                <View style={styles.optionRow}>
                    {['Poor', 'Fair', 'Good'].map((option) => (
                        <Pressable
                            key={option}
                            onPress={() => setFormData({ ...formData, sleep_quality: option })}
                            style={[
                                styles.optionButton,
                                darkMode ? styles.optionButtonDark : styles.optionButtonLight,
                                formData.sleep_quality === option &&
                                (darkMode ? styles.optionButtonSelectedDark : styles.optionButtonSelected),
                            ]}
                        >
                            <Text
                                style={[
                                    styles.optionText,
                                    formData.sleep_quality === option && styles.optionTextSelected,
                                ]}
                            >
                                {option}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </View>

            {/* Stress & Mental Health */}
            <Text
                style={[
                    styles.sectionSubheading,
                    darkMode ? { color: '#d4e8e0' } : { color: '#2d4a42' },
                ]}
            >
                Stress & Mental Health
            </Text>

            <View style={styles.section}>
                <Text
                    style={[
                        styles.label,
                        darkMode ? { color: '#d4e8e0' } : { color: '#2d4a42' },
                    ]}
                >
                    Current Stress Level: {formData.stress_level}/10
                </Text>
                <View style={styles.sliderContainer}>
                    {[...Array(10)].map((_, i) => (
                        <Pressable
                            key={i}
                            onPress={() => setFormData({ ...formData, stress_level: String(i + 1) })}
                            style={[
                                styles.sliderButton,
                                darkMode ? styles.sliderButtonDark : styles.sliderButtonLight,
                                parseInt(formData.stress_level) === i + 1 &&
                                (darkMode ? styles.sliderButtonActiveDark : styles.sliderButtonActive),
                            ]}
                        >
                            <Text
                                style={[
                                    styles.sliderButtonText,
                                    darkMode ? styles.sliderButtonTextDark : styles.sliderButtonTextLight,
                                    parseInt(formData.stress_level) === i + 1 && styles.sliderButtonTextSelected,
                                ]}
                            >
                                {i + 1}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </View>

            <View style={styles.section}>
                <Text
                    style={[
                        styles.label,
                        darkMode ? { color: '#d4e8e0' } : { color: '#2d4a42' },
                    ]}
                >
                    Current Anxiety Level: {formData.anxiety_level}/10
                </Text>
                <View style={styles.sliderContainer}>
                    {[...Array(10)].map((_, i) => (
                        <Pressable
                            key={i}
                            onPress={() => setFormData({ ...formData, anxiety_level: String(i + 1) })}
                            style={[
                                styles.sliderButton,
                                darkMode ? styles.sliderButtonDark : styles.sliderButtonLight,
                                parseInt(formData.anxiety_level) === i + 1 &&
                                (darkMode ? styles.sliderButtonActiveDark : styles.sliderButtonActive),
                            ]}
                        >
                            <Text
                                style={[
                                    styles.sliderButtonText,
                                    darkMode ? styles.sliderButtonTextDark : styles.sliderButtonTextLight,
                                    parseInt(formData.anxiety_level) === i + 1 && styles.sliderButtonTextSelected,
                                ]}
                            >
                                {i + 1}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </View>

            {/* Hydration & Nutrition */}
            <Text
                style={[
                    styles.sectionSubheading,
                    darkMode ? { color: '#d4e8e0' } : { color: '#2d4a42' },
                ]}
            >
                Hydration & Nutrition
            </Text>

            <View style={styles.section}>
                <Text
                    style={[
                        styles.label,
                        darkMode ? { color: '#d4e8e0' } : { color: '#2d4a42' },
                    ]}
                >
                    Hydration Level
                </Text>
                <View style={styles.optionRow}>
                    {['Low', 'Adequate', 'Excellent'].map((option) => (
                        <Pressable
                            key={option}
                            onPress={() => setFormData({ ...formData, hydration: option })}
                            style={[
                                styles.optionButton,
                                darkMode ? styles.optionButtonDark : styles.optionButtonLight,
                                formData.hydration === option &&
                                (darkMode ? styles.optionButtonSelectedDark : styles.optionButtonSelected),
                            ]}
                        >
                            <Text
                                style={[
                                    styles.optionText,
                                    formData.hydration === option && styles.optionTextSelected,
                                ]}
                            >
                                {option}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </View>

            <View style={styles.section}>
                <Text
                    style={[
                        styles.label,
                        darkMode ? { color: '#d4e8e0' } : { color: '#2d4a42' },
                    ]}
                >
                    Caffeine Intake
                </Text>
                <View style={styles.optionRow}>
                    {['Low', 'Moderate', 'High'].map((option) => (
                        <Pressable
                            key={option}
                            onPress={() => setFormData({ ...formData, caffeine: option })}
                            style={[
                                styles.optionButton,
                                darkMode ? styles.optionButtonDark : styles.optionButtonLight,
                                formData.caffeine === option &&
                                (darkMode ? styles.optionButtonSelectedDark : styles.optionButtonSelected),
                            ]}
                        >
                            <Text
                                style={[
                                    styles.optionText,
                                    formData.caffeine === option && styles.optionTextSelected,
                                ]}
                            >
                                {option}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </View>

            <View style={styles.section}>
                <Text
                    style={[
                        styles.label,
                        darkMode ? { color: '#d4e8e0' } : { color: '#2d4a42' },
                    ]}
                >
                    Sugar Consumption
                </Text>
                <View style={styles.optionRow}>
                    {['Low', 'Normal', 'High'].map((option) => (
                        <Pressable
                            key={option}
                            onPress={() => setFormData({ ...formData, sugar_consumption: option })}
                            style={[
                                styles.optionButton,
                                darkMode ? styles.optionButtonDark : styles.optionButtonLight,
                                formData.sugar_consumption === option &&
                                (darkMode ? styles.optionButtonSelectedDark : styles.optionButtonSelected),
                            ]}
                        >
                            <Text
                                style={[
                                    styles.optionText,
                                    formData.sugar_consumption === option && styles.optionTextSelected,
                                ]}
                            >
                                {option}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </View>

            {/* Environment & Habits */}
            <Text
                style={[
                    styles.sectionSubheading,
                    darkMode ? { color: '#d4e8e0' } : { color: '#2d4a42' },
                ]}
            >
                Environment & Habits
            </Text>

            <View style={styles.togglesContainer}>
                {[
                    { key: 'bright_lights', label: 'Bright Lights', icon: 'sunny' },
                    { key: 'loud_noises', label: 'Loud Noises', icon: 'volume-high' },
                    { key: 'strong_smells', label: 'Strong Smells', icon: 'flower' },
                    { key: 'eye_strain', label: 'Eye Strain', icon: 'eye' },
                    { key: 'neck_tension', label: 'Neck Tension', icon: 'body' },
                    { key: 'posture_issues', label: 'Poor Posture', icon: 'accessibility' },
                    { key: 'skipped_meals', label: 'Skipped Meals', icon: 'restaurant' },
                    { key: 'irregular_schedule', label: 'Irregular Schedule', icon: 'time' },
                    { key: 'weather_change', label: 'Weather Change', icon: 'cloud' },
                    { key: 'hormonal_changes', label: 'Hormonal Changes', icon: 'fitness' },
                    { key: 'alcohol_last_night', label: 'Alcohol Last Night', icon: 'wine' },
                    { key: 'recent_illness', label: 'Recent Illness', icon: 'medkit' },
                    { key: 'magnesium_deficiency', label: 'Magnesium Deficiency', icon: 'flask' },
                    { key: 'dehydration', label: 'Dehydration', icon: 'water' },
                    { key: 'physical_activity', label: 'Strenuous Activity', icon: 'barbell' },
                ].map((item) => (
                    <Pressable
                        key={item.key}
                        onPress={() => toggleTrigger(item.key as keyof TriggerFormData)}
                        style={[
                            styles.toggleItem,
                            darkMode ? styles.toggleItemDark : styles.toggleItemLight,
                            formData[item.key as keyof TriggerFormData] && styles.toggleItemActive,
                        ]}
                    >
                        <View style={styles.toggleItemLeft}>
                            <Ionicons
                                name={item.icon as any}
                                size={20}
                                color={formData[item.key as keyof TriggerFormData] 
                                    ? '#10b981' 
                                    : darkMode ? '#a8d5c4' : '#7a9f94'}
                                style={{ marginRight: 12 }}
                            />
                            <Text
                                style={[
                                    styles.toggleLabel,
                                    darkMode ? { color: '#d4e8e0' } : { color: '#2d4a42' },
                                    formData[item.key as keyof TriggerFormData] && styles.toggleLabelActive,
                                ]}
                            >
                                {item.label}
                            </Text>
                        </View>
                        <Ionicons
                            name={formData[item.key as keyof TriggerFormData] ? 'checkbox' : 'square-outline'}
                            size={24}
                            color={formData[item.key as keyof TriggerFormData] ? '#10b981' : darkMode ? '#5a8f7f' : '#a8d5c4'}
                        />
                    </Pressable>
                ))}
            </View>

            <Pressable
                onPress={handlePredict}
                disabled={loading}
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.submitButtonText}>Check My Risk Today</Text>
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
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    helperText: {
        fontSize: 11,
        marginTop: 4,
        fontStyle: 'italic',
    },
    input: {
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
    optionRow: {
        flexDirection: 'row',
        gap: 10,
    },
    optionButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 1,
    },
    optionButtonLight: {
        backgroundColor: '#fff',
        borderColor: '#d4e8e0',
    },
    optionButtonDark: {
        backgroundColor: '#253029',
        borderColor: '#5a8f7f',
    },
    optionButtonSelected: {
        backgroundColor: '#10b981',
        borderColor: '#059669',
    },
    optionButtonSelectedDark: {
        backgroundColor: '#059669',
        borderColor: '#059669',
    },
    optionText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#2d4a42',
    },
    optionTextSelected: {
        color: '#fff',
    },
    sliderContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 4,
    },
    sliderButton: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
    },
    sliderButtonLight: {
        backgroundColor: '#fff',
        borderColor: '#d4e8e0',
    },
    sliderButtonDark: {
        backgroundColor: '#253029',
        borderColor: '#5a8f7f',
    },
    sliderButtonActive: {
        backgroundColor: '#10b981',
        borderColor: '#059669',
    },
    sliderButtonActiveDark: {
        backgroundColor: '#059669',
        borderColor: '#059669',
    },
    sliderButtonText: {
        fontWeight: '600',
        fontSize: 12,
    },
    sliderButtonTextLight: {
        color: '#2d4a42',
    },
    sliderButtonTextDark: {
        color: '#a8d5c4',
    },
    sliderButtonTextSelected: {
        color: '#fff',
    },
    togglesContainer: {
        marginBottom: 20,
    },
    toggleItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
    },
    toggleItemLight: {
        backgroundColor: '#fff',
        borderColor: '#d4e8e0',
    },
    toggleItemDark: {
        backgroundColor: '#253029',
        borderColor: '#5a8f7f',
    },
    toggleItemActive: {
        borderColor: '#10b981',
        borderWidth: 2,
    },
    toggleItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    toggleLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    toggleLabelActive: {
        color: '#10b981',
        fontWeight: '600',
    },
    resultCard: {
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 1,
    },
    resultCardLight: {
        backgroundColor: '#fff',
        borderColor: '#d4e8e0',
    },
    resultCardDark: {
        backgroundColor: '#253029',
        borderColor: '#5a8f7f',
    },
    resultType: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 8,
    },
    resultPercentage: {
        fontSize: 14,
        marginBottom: 4,
    },
    resultPrediction: {
        fontSize: 14,
        fontWeight: '500',
    },
    triggerItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        marginBottom: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
    },
    triggerText: {
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
        marginTop: 20,
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