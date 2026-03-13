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

interface QuickLogProps {
    onSuccess?: () => void;
}

export const QuickLog: React.FC<QuickLogProps> = ({ onSuccess }) => {
    const { darkMode } = useTheme();
    const { userData } = useUser();
    const [intensity, setIntensity] = useState(3);
    const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
    const [duration, setDuration] = useState('1-2h');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const commonSymptoms = [
        'Throbbing',
        'Nausea',
        'Photophobia',
        'Phonophobia',
        'Visual',
        'Dizziness',
    ];

    const toggleSymptom = (symptom: string) => {
        setSelectedSymptoms((prev) =>
            prev.includes(symptom)
                ? prev.filter((s) => s !== symptom)
                : [...prev, symptom]
        );
    };

    const handleSubmit = async () => {
        if (!userData?.name) {
            console.log('[QuickLog] No user authenticated');
            Alert.alert('Error', 'User not authenticated');
            return;
        }

        setLoading(true);
        const endpoint = API_ENDPOINTS.migraineEpisodes;
        const url = `${API_BASE_URL}${endpoint}`;
        
        const payload = {
            user_id: userData.name,
            intensity,
            symptoms: selectedSymptoms,
            duration_category: duration,
            notes,
            timestamp: new Date().toISOString(),
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
                // 404 means /migraine-episodes endpoint is not yet implemented in main.py
                if (response.status === 404) {
                    throw new Error(
                        'The /migraine-episodes endpoint is not found on the server.\n\nMake sure your FastAPI backend has this route defined in main.py.'
                    );
                }
                throw new Error(`HTTP ${response.status}: ${responseText}`);
            }

            const data = responseText ? JSON.parse(responseText) : {};
            console.log('[QuickLog] Success:', data);

            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                setIntensity(3);
                setSelectedSymptoms([]);
                setDuration('1-2h');
                setNotes('');
                onSuccess?.();
            }, 2000);
        } catch (error) {
            logAPI('error', endpoint, error);
            Alert.alert('Error', `Failed to log migraine episode: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (showSuccess) {
        return (
            <View style={[styles.container, darkMode ? styles.containerDark : styles.containerLight]}>
                <View style={styles.successScreen}>
                    <Ionicons name="checkmark-circle" size={80} color="#10b981" style={{ marginBottom: 20 }} />
                    <Text style={[styles.successTitle, darkMode ? { color: '#d4e8e0' } : { color: '#2d4a42' }]}>
                        Logged Successfully
                    </Text>
                    <Text style={[styles.successText, darkMode ? { color: '#a8d5c4' } : { color: '#7a9f94' }]}>
                        Your migraine episode has been recorded
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <ScrollView style={[styles.container, darkMode ? styles.containerDark : styles.containerLight]} contentContainerStyle={styles.content}>
            <View style={styles.section}>
                <Text style={[styles.label, darkMode ? { color: '#d4e8e0' } : { color: '#2d4a42' }]}>
                    Pain Intensity: {intensity}/10
                </Text>
                <View style={styles.sliderContainer}>
                    {[...Array(10)].map((_, i) => (
                        <Pressable
                            key={i}
                            onPress={() => setIntensity(i + 1)}
                            style={[
                                styles.sliderButton,
                                intensity === i + 1 && (darkMode ? styles.sliderButtonActiveDark : styles.sliderButtonActive),
                            ]}
                        >
                            <Text style={[styles.sliderButtonText, intensity === i + 1 ? { color: '#fff' } : {}]}>
                                {i + 1}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={[styles.label, darkMode ? { color: '#d4e8e0' } : { color: '#2d4a42' }]}>
                    Symptoms
                </Text>
                <View style={styles.symptomsGrid}>
                    {commonSymptoms.map((symptom) => (
                        <Pressable
                            key={symptom}
                            onPress={() => toggleSymptom(symptom)}
                            style={[
                                styles.symptomButton,
                                darkMode ? styles.symptomButtonDark : styles.symptomButtonLight,
                                selectedSymptoms.includes(symptom) && (darkMode ? styles.symptomSelectedDark : styles.symptomSelected),
                            ]}
                        >
                            <Text style={[styles.symptomText, selectedSymptoms.includes(symptom) && styles.symptomTextSelected]}>
                                {symptom}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={[styles.label, darkMode ? { color: '#d4e8e0' } : { color: '#2d4a42' }]}>
                    Duration
                </Text>
                <View style={styles.durationRow}>
                    {['< 1h', '1-2h', '2-4h', '4h+'].map((option) => (
                        <Pressable
                            key={option}
                            onPress={() => setDuration(option)}
                            style={[
                                styles.durationButton,
                                darkMode ? styles.durationButtonDark : styles.durationButtonLight,
                                duration === option && (darkMode ? styles.durationSelectedDark : styles.durationSelected),
                            ]}
                        >
                            <Text style={[styles.durationText, duration === option && { color: '#fff' }]}>
                                {option}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={[styles.label, darkMode ? { color: '#d4e8e0' } : { color: '#2d4a42' }]}>
                    Notes (Optional)
                </Text>
                <TextInput
                    style={[styles.notesInput, darkMode ? styles.notesInputDark : styles.notesInputLight]}
                    placeholder="Add notes..."
                    placeholderTextColor={darkMode ? '#5a8f7f' : '#a8d5c4'}
                    multiline
                    numberOfLines={4}
                    value={notes}
                    onChangeText={setNotes}
                />
            </View>

            <Pressable onPress={handleSubmit} disabled={loading} style={[styles.submitButton, loading && styles.submitButtonDisabled]}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Log Migraine</Text>}
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
    section: {
        marginBottom: 24,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
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
        backgroundColor: '#e8f5f2',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#d4e8e0',
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
        color: '#2d4a42',
        fontWeight: '600',
        fontSize: 12,
    },
    symptomsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    symptomButton: {
        paddingHorizontal: 14,
        paddingVertical: 10,
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
        color: '#2d4a42',
        fontSize: 14,
        fontWeight: '500',
    },
    symptomTextSelected: {
        color: '#fff',
    },
    durationRow: {
        flexDirection: 'row',
        gap: 10,
    },
    durationButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        borderWidth: 1,
    },
    durationButtonLight: {
        backgroundColor: '#e8f5f2',
        borderColor: '#d4e8e0',
    },
    durationButtonDark: {
        backgroundColor: '#253029',
        borderColor: '#5a8f7f',
    },
    durationSelected: {
        backgroundColor: '#10b981',
        borderColor: '#059669',
    },
    durationSelectedDark: {
        backgroundColor: '#059669',
    },
    durationText: {
        fontSize: 13,
        fontWeight: '500',
    },
    notesInput: {
        padding: 12,
        borderRadius: 12,
        minHeight: 100,
        borderWidth: 1,
    },
    notesInputLight: {
        backgroundColor: '#fff',
        borderColor: '#d4e8e0',
    },
    notesInputDark: {
        backgroundColor: '#253029',
        borderColor: '#5a8f7f',
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
    successScreen: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    successTitle: {
        fontSize: 24,
        fontWeight: '600',
        marginBottom: 8,
    },
    successText: {
        fontSize: 16,
    },
});