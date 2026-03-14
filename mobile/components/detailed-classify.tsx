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
import { AIInsightButton } from '@/components/AIInsightButton';

interface DetailedClassifyProps {
    onSuccess?: () => void;
}

interface FormData {
    age: string;
    duration: string;
    frequency: string;
    location: string;
    character: string;
    intensity: string;
    visual: string;
    nausea: boolean;
    vomit: boolean;
    phonophobia: boolean;
    photophobia: boolean;
    sensory: boolean;
    dysphasia: boolean;
    dysarthria: boolean;
    vertigo: boolean;
    tinnitus: boolean;
    hypoacusis: boolean;
    diplopia: boolean;
    defect: boolean;
    conscience: boolean;
    paresthesia: boolean;
    dpf: boolean;
}

interface PredictionResult {
    prediction: string;
    confidence: number;
    all_probabilities: Record<string, number>;
    timestamp: string;
}

export const DetailedClassify: React.FC<DetailedClassifyProps> = ({ onSuccess }) => {
    const { darkMode } = useTheme();
    const { userData } = useUser();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<PredictionResult | null>(null);
    const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
    const [formData, setFormData] = useState<FormData>({
        age: '30',
        duration: '1',
        frequency: '2',
        location: 'Unilateral',
        character: 'Throbbing',
        intensity: '5',
        visual: 'No aura',
        nausea: false,
        vomit: false,
        phonophobia: false,
        photophobia: false,
        sensory: false,
        dysphasia: false,
        dysarthria: false,
        vertigo: false,
        tinnitus: false,
        hypoacusis: false,
        diplopia: false,
        defect: false,
        conscience: false,
        paresthesia: false,
        dpf: false,
    });

    const toggleSymptom = (symptom: keyof FormData) => {
        setFormData({
            ...formData,
            [symptom]: !formData[symptom],
        });
    };

    const handleClassify = async () => {
        const newErrors: Partial<Record<keyof FormData, string>> = {};

        const ageNum = parseInt(formData.age);
        const durationNum = parseInt(formData.duration);
        const frequencyNum = parseInt(formData.frequency);
        const intensityNum = parseInt(formData.intensity);

        if (!formData.age || isNaN(ageNum) || ageNum < 0 || ageNum > 120)
            newErrors.age = 'Enter a valid age (0–120)';
        if (!formData.duration || isNaN(durationNum) || durationNum < 0 || durationNum > 3)
            newErrors.duration = 'Enter 0, 1, 2, or 3';
        if (!formData.frequency || isNaN(frequencyNum) || frequencyNum < 0 || frequencyNum > 7)
            newErrors.frequency = 'Enter a number from 0 to 7';
        if (isNaN(intensityNum) || intensityNum < 1 || intensityNum > 10)
            newErrors.intensity = 'Select an intensity (1–10)';

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        setLoading(true);
        const endpoint = API_ENDPOINTS.symptomType;
        const url = `${API_BASE_URL}${endpoint}`;

        const intensityMapped = intensityNum <= 3 ? 1 : intensityNum <= 6 ? 2 : 3;

        const payload = {
            age: ageNum,
            duration: durationNum,
            frequency: frequencyNum,
            location: formData.location === 'Unilateral' ? 1 : 0,
            character: formData.character === 'Throbbing' ? 1 : 0,
            intensity: intensityMapped,
            visual: formData.visual === 'No aura' ? 0 : formData.visual === 'With aura' ? 2 : 1,
            nausea: formData.nausea ? 1 : 0,
            vomit: formData.vomit ? 1 : 0,
            phonophobia: formData.phonophobia ? 1 : 0,
            photophobia: formData.photophobia ? 1 : 0,
            sensory: formData.sensory ? 1 : 0,
            dysphasia: formData.dysphasia ? 1 : 0,
            dysarthria: formData.dysarthria ? 1 : 0,
            vertigo: formData.vertigo ? 1 : 0,
            tinnitus: formData.tinnitus ? 1 : 0,
            hypoacusis: formData.hypoacusis ? 1 : 0,
            diplopia: formData.diplopia ? 1 : 0,
            defect: formData.defect ? 1 : 0,
            ataxia: 0,
            conscience: formData.conscience ? 1 : 0,
            paresthesia: formData.paresthesia ? 1 : 0,
            dpf: formData.dpf ? 1 : 0,
            ext_1: 0, ext_2: 0, ext_3: 0, ext_4: 0, ext_5: 0,
            ext_6: 0, ext_7: 0, ext_8: 0, ext_9: 0, ext_10: 0,
            ext_11: 0, ext_12: 0, ext_13: 0, ext_14: 0, ext_15: 0,
            ext_16: 0, ext_17: 0, ext_18: 0, ext_19: 0, ext_20: 0,
            ext_21: 0, ext_22: 0, ext_23: 0, ext_24: 0, ext_25: 0,
            ext_26: 0, ext_27: 0,
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
            console.log('[DetailedClassify] Success:', data);

            setResult(data);
            if (onSuccess) onSuccess();
        } catch (error) {
            logAPI('error', endpoint, error);
            Alert.alert('Error', `Failed to classify: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // ── Build enriched data object for AI insight ────────────────────────────
    const buildInsightData = (res: PredictionResult) => ({
        prediction: res.prediction,
        confidence: res.confidence,
        all_probabilities: res.all_probabilities,
        // Pass through the form inputs so the AI has full context
        symptoms: [
            formData.nausea && 'Nausea',
            formData.vomit && 'Vomiting',
            formData.phonophobia && 'Sound Sensitivity',
            formData.photophobia && 'Light Sensitivity',
            formData.sensory && 'Sensory Disturbance',
            formData.dysphasia && 'Speech Difficulty',
            formData.dysarthria && 'Slurred Speech',
            formData.vertigo && 'Vertigo',
            formData.tinnitus && 'Ringing in Ears',
            formData.hypoacusis && 'Hearing Loss',
            formData.diplopia && 'Double Vision',
            formData.defect && 'Visual Field Defect',
            formData.conscience && 'Loss of Consciousness',
            formData.paresthesia && 'Tingling/Numbness',
            formData.dpf && 'Family History',
        ].filter(Boolean).join(', '),
        pain_location: formData.location,
        character: formData.character,
        visual_aura: formData.visual,
        intensity: `${formData.intensity}/10`,
        duration_scale: formData.duration,
        frequency: `${formData.frequency} episodes/month`,
        age: formData.age,
    });

    // Results screen
    if (result) {
        return (
            <View
                style={[
                    styles.container,
                    darkMode ? styles.containerDark : styles.containerLight,
                ]}
            >
                <ScrollView contentContainerStyle={styles.content}>
                    {/* Result Card */}
                    <View
                        style={[
                            styles.resultCard,
                            darkMode ? styles.resultCardDark : styles.resultCardLight,
                        ]}
                    >
                        <Ionicons
                            name="checkmark-circle"
                            size={60}
                            color="#10b981"
                            style={{ marginBottom: 16 }}
                        />
                        <Text
                            style={[
                                styles.resultType,
                                darkMode ? { color: '#10b981' } : { color: '#059669' },
                            ]}
                        >
                            {result.prediction}
                        </Text>
                        <Text
                            style={[
                                styles.resultConfidence,
                                darkMode ? { color: '#a8d5c4' } : { color: '#7a9f94' },
                            ]}
                        >
                            Confidence: {(result.confidence * 100).toFixed(1)}%
                        </Text>
                    </View>

                    {/* All Probabilities */}
                    <View style={styles.section}>
                        <Text
                            style={[
                                styles.label,
                                darkMode ? { color: '#d4e8e0' } : { color: '#2d4a42' },
                            ]}
                        >
                            All Probabilities
                        </Text>
                        {Object.entries(result.all_probabilities).map(([type, prob]) => (
                            prob > 0.01 && (
                                <View key={type} style={styles.probabilityRow}>
                                    <Text
                                        style={[
                                            styles.probabilityLabel,
                                            darkMode ? { color: '#d4e8e0' } : { color: '#2d4a42' },
                                        ]}
                                    >
                                        {type}:
                                    </Text>
                                    <Text
                                        style={[
                                            styles.probabilityValue,
                                            darkMode ? { color: '#a8d5c4' } : { color: '#7a9f94' },
                                        ]}
                                    >
                                        {(prob * 100).toFixed(1)}%
                                    </Text>
                                </View>
                            )
                        ))}
                    </View>

                    {/* ── AI Insight Button ── */}
                    <AIInsightButton type="classify" data={buildInsightData(result)} />

                    <Pressable onPress={() => setResult(null)} style={styles.submitButton}>
                        <Text style={styles.submitButtonText}>Classify Again</Text>
                    </Pressable>
                </ScrollView>
            </View>
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
                Migraine Classification
            </Text>
            <Text
                style={[
                    styles.sectionSubtitle,
                    darkMode ? { color: '#a8d5c4' } : { color: '#7a9f94' },
                ]}
            >
                Provide detailed information for accurate classification
            </Text>

            {/* Basic Information */}
            <Text
                style={[
                    styles.sectionSubheading,
                    darkMode ? { color: '#d4e8e0' } : { color: '#2d4a42' },
                ]}
            >
                Basic Information
            </Text>

            <View style={styles.section}>
                <Text style={[styles.label, darkMode ? { color: '#d4e8e0' } : { color: '#2d4a42' }]}>
                    Age
                </Text>
                <TextInput
                    style={[
                        styles.input,
                        darkMode ? styles.inputDark : styles.inputLight,
                        errors.age ? styles.inputError : {},
                    ]}
                    placeholder="Enter age in years"
                    placeholderTextColor={darkMode ? '#5a8f7f' : '#a8d5c4'}
                    keyboardType="numeric"
                    value={formData.age}
                    onChangeText={(text) => { setFormData({ ...formData, age: text }); setErrors({ ...errors, age: undefined }); }}
                />
                {errors.age && <Text style={styles.errorText}>{errors.age}</Text>}
            </View>

            <View style={styles.section}>
                <Text style={[styles.label, darkMode ? { color: '#d4e8e0' } : { color: '#2d4a42' }]}>
                    Duration (0-3 scale)
                </Text>
                <TextInput
                    style={[
                        styles.input,
                        darkMode ? styles.inputDark : styles.inputLight,
                        errors.duration ? styles.inputError : {},
                    ]}
                    placeholder="0=short, 3=prolonged"
                    placeholderTextColor={darkMode ? '#5a8f7f' : '#a8d5c4'}
                    keyboardType="numeric"
                    value={formData.duration}
                    onChangeText={(text) => { setFormData({ ...formData, duration: text }); setErrors({ ...errors, duration: undefined }); }}
                />
                {errors.duration
                    ? <Text style={styles.errorText}>{errors.duration}</Text>
                    : <Text style={[styles.helperText, darkMode ? { color: '#5a8f7f' } : { color: '#a8d5c4' }]}>0=very short, 1=short, 2=moderate, 3=prolonged</Text>
                }
            </View>

            <View style={styles.section}>
                <Text style={[styles.label, darkMode ? { color: '#d4e8e0' } : { color: '#2d4a42' }]}>
                    Frequency (episodes/month)
                </Text>
                <TextInput
                    style={[
                        styles.input,
                        darkMode ? styles.inputDark : styles.inputLight,
                        errors.frequency ? styles.inputError : {},
                    ]}
                    placeholder="0-7"
                    placeholderTextColor={darkMode ? '#5a8f7f' : '#a8d5c4'}
                    keyboardType="numeric"
                    value={formData.frequency}
                    onChangeText={(text) => { setFormData({ ...formData, frequency: text }); setErrors({ ...errors, frequency: undefined }); }}
                />
                {errors.frequency && <Text style={styles.errorText}>{errors.frequency}</Text>}
            </View>

            {/* Pain Characteristics */}
            <Text
                style={[
                    styles.sectionSubheading,
                    darkMode ? { color: '#d4e8e0' } : { color: '#2d4a42' },
                ]}
            >
                Pain Characteristics
            </Text>

            <View style={styles.section}>
                <Text style={[styles.label, darkMode ? { color: '#d4e8e0' } : { color: '#2d4a42' }]}>
                    Location
                </Text>
                <View style={styles.optionRow}>
                    {['Unilateral', 'Bilateral'].map((option) => (
                        <Pressable
                            key={option}
                            onPress={() => setFormData({ ...formData, location: option })}
                            style={[
                                styles.optionButton,
                                darkMode ? styles.optionButtonDark : styles.optionButtonLight,
                                formData.location === option &&
                                (darkMode ? styles.optionButtonSelectedDark : styles.optionButtonSelected),
                            ]}
                        >
                            <Text style={[styles.optionText, formData.location === option && styles.optionTextSelected]}>
                                {option}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={[styles.label, darkMode ? { color: '#d4e8e0' } : { color: '#2d4a42' }]}>
                    Character
                </Text>
                <View style={styles.optionRow}>
                    {['Throbbing', 'Non-throbbing'].map((option) => (
                        <Pressable
                            key={option}
                            onPress={() => setFormData({ ...formData, character: option })}
                            style={[
                                styles.optionButton,
                                darkMode ? styles.optionButtonDark : styles.optionButtonLight,
                                formData.character === option &&
                                (darkMode ? styles.optionButtonSelectedDark : styles.optionButtonSelected),
                            ]}
                        >
                            <Text style={[styles.optionText, formData.character === option && styles.optionTextSelected]}>
                                {option}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={[styles.label, darkMode ? { color: '#d4e8e0' } : { color: '#2d4a42' }]}>
                    Intensity (1-10)
                </Text>
                <View style={styles.sliderContainer}>
                    {[...Array(10)].map((_, i) => (
                        <Pressable
                            key={i}
                            onPress={() => setFormData({ ...formData, intensity: String(i + 1) })}
                            style={[
                                styles.sliderButton,
                                darkMode ? styles.sliderButtonDark : styles.sliderButtonLight,
                                parseInt(formData.intensity) === i + 1 &&
                                (darkMode ? styles.sliderButtonActiveDark : styles.sliderButtonActive),
                            ]}
                        >
                            <Text
                                style={[
                                    styles.sliderButtonText,
                                    darkMode ? styles.sliderButtonTextDark : styles.sliderButtonTextLight,
                                    parseInt(formData.intensity) === i + 1 && styles.sliderButtonTextSelected,
                                ]}
                            >
                                {i + 1}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </View>

            {/* Aura & Visual Symptoms */}
            <Text
                style={[
                    styles.sectionSubheading,
                    darkMode ? { color: '#d4e8e0' } : { color: '#2d4a42' },
                ]}
            >
                Aura & Visual Symptoms
            </Text>

            <View style={styles.section}>
                <Text style={[styles.label, darkMode ? { color: '#d4e8e0' } : { color: '#2d4a42' }]}>
                    Visual Symptoms
                </Text>
                <View style={styles.optionRow}>
                    {['No aura', 'With aura', 'Other'].map((option) => (
                        <Pressable
                            key={option}
                            onPress={() => setFormData({ ...formData, visual: option })}
                            style={[
                                styles.optionButton,
                                darkMode ? styles.optionButtonDark : styles.optionButtonLight,
                                formData.visual === option &&
                                (darkMode ? styles.optionButtonSelectedDark : styles.optionButtonSelected),
                            ]}
                        >
                            <Text style={[styles.optionText, formData.visual === option && styles.optionTextSelected]}>
                                {option}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </View>

            {/* Associated Symptoms */}
            <Text
                style={[
                    styles.sectionSubheading,
                    darkMode ? { color: '#d4e8e0' } : { color: '#2d4a42' },
                ]}
            >
                Associated Symptoms
            </Text>

            <View style={styles.symptomsGrid}>
                {[
                    { key: 'nausea', label: 'Nausea' },
                    { key: 'vomit', label: 'Vomiting' },
                    { key: 'phonophobia', label: 'Sound Sensitivity' },
                    { key: 'photophobia', label: 'Light Sensitivity' },
                    { key: 'sensory', label: 'Sensory Disturbance' },
                    { key: 'dysphasia', label: 'Speech Difficulty' },
                    { key: 'dysarthria', label: 'Slurred Speech' },
                    { key: 'vertigo', label: 'Vertigo' },
                    { key: 'tinnitus', label: 'Ringing in Ears' },
                    { key: 'hypoacusis', label: 'Hearing Loss' },
                    { key: 'diplopia', label: 'Double Vision' },
                    { key: 'defect', label: 'Visual Field Defect' },
                    { key: 'conscience', label: 'Loss of Consciousness' },
                    { key: 'paresthesia', label: 'Tingling/Numbness' },
                    { key: 'dpf', label: 'Family History' },
                ].map((item) => (
                    <Pressable
                        key={item.key}
                        onPress={() => toggleSymptom(item.key as keyof FormData)}
                        style={[
                            styles.symptomButton,
                            darkMode ? styles.symptomButtonDark : styles.symptomButtonLight,
                            formData[item.key as keyof FormData] &&
                            (darkMode ? styles.symptomSelectedDark : styles.symptomSelected),
                        ]}
                    >
                        <Text
                            style={[
                                styles.symptomText,
                                formData[item.key as keyof FormData] && styles.symptomTextSelected,
                            ]}
                        >
                            {item.label}
                        </Text>
                    </Pressable>
                ))}
            </View>

            <Pressable
                onPress={handleClassify}
                disabled={loading}
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.submitButtonText}>Classify Migraine Type</Text>
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
    inputError: {
        borderColor: '#ef4444',
        borderWidth: 2,
    },
    errorText: {
        color: '#ef4444',
        fontSize: 12,
        marginTop: 4,
        fontWeight: '500',
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
        backgroundColor: '#e8f5f2',
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
    },
    optionText: {
        color: '#2d4a42',
        fontSize: 12,
        fontWeight: '500',
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
        backgroundColor: '#e8f5f2',
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
    symptomsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 20,
    },
    symptomButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    symptomButtonLight: {
        backgroundColor: '#e8f5f2',
        borderColor: '#d4e8e0',
    },
    symptomButtonDark: {
        backgroundColor: '#253029',
        borderColor: '#5a8f7f',
    },
    symptomSelected: {
        backgroundColor: '#10b981',
        borderColor: '#059669',
    },
    symptomSelectedDark: {
        backgroundColor: '#059669',
    },
    symptomText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#2d4a42',
    },
    symptomTextSelected: {
        color: '#fff',
    },
    resultCard: {
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginBottom: 24,
        borderWidth: 2,
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
        textAlign: 'center',
    },
    resultConfidence: {
        fontSize: 14,
    },
    probabilityRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(168, 213, 196, 0.2)',
    },
    probabilityLabel: {
        fontSize: 14,
        flex: 1,
    },
    probabilityValue: {
        fontSize: 14,
        fontWeight: '600',
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