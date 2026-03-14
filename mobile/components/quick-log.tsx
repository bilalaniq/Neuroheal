import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    ActivityIndicator,
    TextInput,
    Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useUser } from '@/contexts/UserContext';
import { API_BASE_URL, API_ENDPOINTS, logAPI } from '@/config/api';

interface QuickLogProps {
    onSuccess?: () => void;
    // Pass existing log data + its backend ID when editing
    editingLog?: ExistingLog | null;
    onCancelEdit?: () => void;
}

interface ExistingLog {
    id: string;           // backend record ID for PUT
    intensity: number;
    symptoms: string[];
    triggers: string[];
    medication: string[];
    medication_effectiveness: number | null;
    relief_methods: string[];
    pain_location: string;
    duration_category: string;
    warning_signs_before: boolean;
    warning_description: string;
    notes: string;
}

const SYMPTOMS = [
    { id: 'Throbbing', icon: 'pulse' },
    { id: 'Nausea', icon: 'medical' },
    { id: 'Photophobia', icon: 'sunny' },
    { id: 'Phonophobia', icon: 'volume-high' },
    { id: 'Visual Aura', icon: 'eye' },
    { id: 'Dizziness', icon: 'refresh-circle' },
    { id: 'Neck Pain', icon: 'body' },
    { id: 'Vomiting', icon: 'warning' },
    { id: 'Fatigue', icon: 'bed' },
    { id: 'Brain Fog', icon: 'cloudy' },
    { id: 'Facial Pain', icon: 'sad' },
    { id: 'Tingling', icon: 'flash' },
];

const TRIGGERS = [
    { id: 'Stress', icon: 'alert-circle' },
    { id: 'Poor Sleep', icon: 'moon' },
    { id: 'Bright Light', icon: 'sunny' },
    { id: 'Loud Noise', icon: 'volume-high' },
    { id: 'Alcohol', icon: 'wine' },
    { id: 'Caffeine', icon: 'cafe' },
    { id: 'Dehydration', icon: 'water' },
    { id: 'Skipped Meal', icon: 'restaurant' },
    { id: 'Weather Change', icon: 'cloud' },
    { id: 'Strong Smell', icon: 'flower' },
    { id: 'Screen Time', icon: 'phone-portrait' },
    { id: 'Hormonal', icon: 'fitness' },
];

const MEDICATIONS = [
    'Ibuprofen', 'Paracetamol', 'Aspirin', 'Sumatriptan',
    'Rizatriptan', 'Naproxen', 'Caffeine+Paracetamol', 'None',
];

const PAIN_LOCATIONS = ['Left side', 'Right side', 'Both sides', 'Forehead', 'Back of head', 'Behind eyes'];
const RELIEF_METHODS = ['Dark room', 'Sleep', 'Cold compress', 'Hot compress', 'Meditation', 'Fresh air'];

export const QuickLog: React.FC<QuickLogProps> = ({ onSuccess, editingLog, onCancelEdit }) => {
    const { darkMode } = useTheme();
    const { userData } = useUser();

    const isEditMode = !!editingLog;

    // ── Form state — pre-filled when editing ────────────────────────────────
    const [step, setStep] = useState(1);
    const [intensity,               setIntensity]               = useState(editingLog?.intensity ?? 5);
    const [selectedSymptoms,        setSelectedSymptoms]        = useState<string[]>(editingLog?.symptoms ?? []);
    const [selectedTriggers,        setSelectedTriggers]        = useState<string[]>(editingLog?.triggers ?? []);
    const [selectedMedications,     setSelectedMedications]     = useState<string[]>(editingLog?.medication ?? []);
    const [selectedReliefMethods,   setSelectedReliefMethods]   = useState<string[]>(editingLog?.relief_methods ?? []);
    const [painLocation,            setPainLocation]            = useState(editingLog?.pain_location ?? '');
    const [duration,                setDuration]                = useState(editingLog?.duration_category ?? '1-2h');
    const [medicationEffectiveness, setMedicationEffectiveness] = useState<number | null>(editingLog?.medication_effectiveness ?? null);
    const [warningSignsBefore,      setWarningSignsBefore]      = useState(editingLog?.warning_signs_before ?? false);
    const [warningDescription,      setWarningDescription]      = useState(editingLog?.warning_description ?? '');
    const [notes,                   setNotes]                   = useState(editingLog?.notes ?? '');

    const [loading,      setLoading]      = useState(false);
    const [showSuccess,  setShowSuccess]  = useState(false);

    // ── Duplicate detection state ────────────────────────────────────────────
    const [dupModalVisible, setDupModalVisible] = useState(false);
    const [dupExistingLog,  setDupExistingLog]  = useState<ExistingLog | null>(null);

    const toggle = (item: string, list: string[], setList: (v: string[]) => void) => {
        setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
    };

    const intensityColor = intensity <= 3 ? '#10b981' : intensity <= 6 ? '#f59e0b' : '#ef4444';
    const intensityLabel = intensity <= 3 ? 'Mild' : intensity <= 6 ? 'Moderate' : intensity <= 8 ? 'Severe' : 'Extreme';

    const buildPayload = () => ({
        user_id:                userData!.name,
        intensity,
        severity:               intensity <= 3 ? 1 : intensity <= 6 ? 2 : intensity <= 8 ? 3 : 4,
        symptoms:               selectedSymptoms,
        triggers:               selectedTriggers,
        medication:             selectedMedications,
        medication_effectiveness: medicationEffectiveness,
        relief_methods:         selectedReliefMethods,
        pain_location:          painLocation,
        duration_category:      duration,
        warning_signs_before:   warningSignsBefore,
        warning_description:    warningDescription,
        notes,
        timestamp:              new Date().toISOString(),
    });

    const resetAndClose = (callSuccess = true) => {
        setStep(1);
        setIntensity(5);
        setSelectedSymptoms([]);
        setSelectedTriggers([]);
        setSelectedMedications([]);
        setSelectedReliefMethods([]);
        setPainLocation('');
        setDuration('1-2h');
        setMedicationEffectiveness(null);
        setWarningSignsBefore(false);
        setWarningDescription('');
        setNotes('');
        if (callSuccess) onSuccess?.();
    };

    // ── Submit (POST for new, PUT for edit) ──────────────────────────────────
    const handleSubmit = async () => {
        if (!userData?.name) return;
        setLoading(true);

        try {
            if (isEditMode && editingLog?.id) {
                // ── EDIT path: PUT to update existing record ─────────────────
                const endpoint = `${API_ENDPOINTS.migraineEpisodes}/${editingLog.id}`;
                const url = `${API_BASE_URL}${endpoint}`;
                const payload = buildPayload();
                logAPI('request', endpoint, payload);

                const response = await fetch(url, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                logAPI('response', endpoint, { status: response.status });

                setShowSuccess(true);
                setTimeout(() => {
                    setShowSuccess(false);
                    onCancelEdit?.();
                    onSuccess?.();
                }, 2000);

            } else {
                // ── NEW path: POST, check for 409 duplicate ──────────────────
                const endpoint = API_ENDPOINTS.migraineEpisodes;
                const url = `${API_BASE_URL}${endpoint}`;
                const payload = buildPayload();
                logAPI('request', endpoint, payload);

                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });

                if (response.status === 409) {
                    // Backend says: already logged today — get the existing log
                    const dupData = await response.json();
                    // dupData should contain the existing log with its id
                    // Shape: { message: string, existing_log: ExistingLog }
                    setDupExistingLog(dupData.existing_log ?? null);
                    setDupModalVisible(true);
                    return;
                }

                logAPI('response', endpoint, { status: response.status });
                setShowSuccess(true);
                setTimeout(() => { setShowSuccess(false); resetAndClose(); }, 2500);
            }
        } catch (error) {
            logAPI('error', API_ENDPOINTS.migraineEpisodes, error);
        } finally {
            setLoading(false);
        }
    };

    // User chose "Edit existing" from the duplicate modal
    const handleEditExisting = () => {
        setDupModalVisible(false);
        if (!dupExistingLog) return;

        // Pre-fill all fields with the existing log
        setIntensity(dupExistingLog.intensity);
        setSelectedSymptoms(dupExistingLog.symptoms);
        setSelectedTriggers(dupExistingLog.triggers);
        setSelectedMedications(dupExistingLog.medication);
        setMedicationEffectiveness(dupExistingLog.medication_effectiveness);
        setSelectedReliefMethods(dupExistingLog.relief_methods);
        setPainLocation(dupExistingLog.pain_location);
        setDuration(dupExistingLog.duration_category);
        setWarningSignsBefore(dupExistingLog.warning_signs_before);
        setWarningDescription(dupExistingLog.warning_description);
        setNotes(dupExistingLog.notes);
        setStep(1);
        // The next submit will use the dup's ID to do a PUT
        // We store dupExistingLog so handleSubmit can use it
    };

    // ── Success screen ───────────────────────────────────────────────────────
    if (showSuccess) {
        return (
            <View style={[styles.container, darkMode ? styles.containerDark : styles.containerLight]}>
                <View style={styles.successScreen}>
                    <View style={[styles.successIconRing, { borderColor: '#10b981' }]}>
                        <Ionicons name="checkmark" size={48} color="#10b981" />
                    </View>
                    <Text style={[styles.successTitle, darkMode ? { color: '#d4e8e0' } : { color: '#1a3a32' }]}>
                        {isEditMode || dupExistingLog ? 'Episode Updated' : 'Episode Logged'}
                    </Text>
                    <Text style={[styles.successSubtitle, { color: '#10b981' }]}>
                        Intensity {intensity}/10 · {duration}
                    </Text>
                    <Text style={[styles.successBody, darkMode ? { color: '#a8d5c4' } : { color: '#7a9f94' }]}>
                        Your migraine data has been saved and your calendar will update shortly.
                    </Text>
                </View>
            </View>
        );
    }

    const c = {
        bg:          darkMode ? '#1a2522' : '#f5f8f7',
        card:        darkMode ? '#253029' : '#ffffff',
        border:      darkMode ? '#3a5a50' : '#d4e8e0',
        text:        darkMode ? '#d4e8e0' : '#1a3a32',
        sub:         darkMode ? '#a8d5c4' : '#7a9f94',
        chip:        darkMode ? '#1e2e2a' : '#eaf5f1',
        chipBorder:  darkMode ? '#3a5a50' : '#c5e0d8',
    };

    const stepIndicator = (
        <View style={styles.stepRow}>
            {[1, 2, 3, 4].map(s => (
                <View key={s} style={styles.stepItem}>
                    <View style={[styles.stepDot, { backgroundColor: s <= step ? '#10b981' : c.border }]}>
                        {s < step
                            ? <Ionicons name="checkmark" size={12} color="#fff" />
                            : <Text style={{ color: s === step ? '#fff' : c.sub, fontSize: 11, fontWeight: '600' }}>{s}</Text>
                        }
                    </View>
                    {s < 4 && <View style={[styles.stepLine, { backgroundColor: s < step ? '#10b981' : c.border }]} />}
                </View>
            ))}
        </View>
    );

    const stepLabels = ['Intensity', 'Symptoms', 'Triggers & Meds', 'Details'];

    // ── Step 1 ───────────────────────────────────────────────────────────────
    const step1 = (
        <ScrollView contentContainerStyle={styles.stepContent}>
            <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
                <View style={styles.cardHeaderRow}>
                    <Ionicons name="pulse" size={18} color={intensityColor} />
                    <Text style={[styles.cardTitle, { color: c.text }]}>Pain Intensity</Text>
                </View>
                <View style={[styles.intensityDisplay, { borderColor: intensityColor + '40' }]}>
                    <Text style={[styles.intensityNumber, { color: intensityColor }]}>{intensity}</Text>
                    <Text style={[styles.intensityLabel, { color: intensityColor }]}>{intensityLabel}</Text>
                    <Text style={[styles.intensityScale, { color: c.sub }]}>/10</Text>
                </View>
                <View style={styles.intensityRow}>
                    {[1,2,3,4,5,6,7,8,9,10].map(i => (
                        <Pressable
                            key={i}
                            onPress={() => setIntensity(i)}
                            style={[
                                styles.intensityBtn,
                                {
                                    backgroundColor: intensity === i
                                        ? (i <= 3 ? '#10b981' : i <= 6 ? '#f59e0b' : '#ef4444')
                                        : c.chip,
                                    borderColor: intensity === i
                                        ? (i <= 3 ? '#059669' : i <= 6 ? '#d97706' : '#dc2626')
                                        : c.chipBorder,
                                }
                            ]}
                        >
                            <Text style={[styles.intensityBtnText, { color: intensity === i ? '#fff' : c.sub }]}>{i}</Text>
                        </Pressable>
                    ))}
                </View>
                <View style={styles.intensityLegend}>
                    <Text style={[styles.legendText, { color: '#10b981' }]}>1–3 Mild</Text>
                    <Text style={[styles.legendText, { color: '#f59e0b' }]}>4–6 Moderate</Text>
                    <Text style={[styles.legendText, { color: '#ef4444' }]}>7–10 Severe</Text>
                </View>
            </View>

            <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
                <View style={styles.cardHeaderRow}>
                    <Ionicons name="time" size={18} color="#10b981" />
                    <Text style={[styles.cardTitle, { color: c.text }]}>Duration</Text>
                </View>
                <View style={styles.durationRow}>
                    {['< 1h', '1-2h', '2-4h', '4-8h', '8h+'].map(opt => (
                        <Pressable
                            key={opt}
                            onPress={() => setDuration(opt)}
                            style={[
                                styles.durationBtn,
                                { backgroundColor: duration === opt ? '#10b981' : c.chip, borderColor: duration === opt ? '#059669' : c.chipBorder }
                            ]}
                        >
                            <Text style={[styles.durationText, { color: duration === opt ? '#fff' : c.sub }]}>{opt}</Text>
                        </Pressable>
                    ))}
                </View>
            </View>

            <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
                <View style={styles.cardHeaderRow}>
                    <Ionicons name="location" size={18} color="#10b981" />
                    <Text style={[styles.cardTitle, { color: c.text }]}>Pain Location</Text>
                </View>
                <View style={styles.chipWrap}>
                    {PAIN_LOCATIONS.map(loc => (
                        <Pressable
                            key={loc}
                            onPress={() => setPainLocation(painLocation === loc ? '' : loc)}
                            style={[
                                styles.chip,
                                { backgroundColor: painLocation === loc ? '#10b981' : c.chip, borderColor: painLocation === loc ? '#059669' : c.chipBorder }
                            ]}
                        >
                            <Text style={[styles.chipText, { color: painLocation === loc ? '#fff' : c.sub }]}>{loc}</Text>
                        </Pressable>
                    ))}
                </View>
            </View>

            <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
                <View style={styles.cardHeaderRow}>
                    <Ionicons name="warning" size={18} color="#f59e0b" />
                    <Text style={[styles.cardTitle, { color: c.text }]}>Warning Signs Before</Text>
                    <Pressable
                        onPress={() => setWarningSignsBefore(!warningSignsBefore)}
                        style={[styles.toggle, { backgroundColor: warningSignsBefore ? '#10b981' : c.border }]}
                    >
                        <View style={[styles.toggleThumb, { transform: [{ translateX: warningSignsBefore ? 18 : 2 }] }]} />
                    </Pressable>
                </View>
                {warningSignsBefore && (
                    <TextInput
                        style={[styles.textArea, { backgroundColor: c.chip, borderColor: c.border, color: c.text }]}
                        placeholder="e.g. visual aura, neck stiffness, mood change..."
                        placeholderTextColor={c.sub}
                        multiline
                        numberOfLines={3}
                        value={warningDescription}
                        onChangeText={setWarningDescription}
                    />
                )}
            </View>
        </ScrollView>
    );

    // ── Step 2 ───────────────────────────────────────────────────────────────
    const step2 = (
        <ScrollView contentContainerStyle={styles.stepContent}>
            <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
                <View style={styles.cardHeaderRow}>
                    <Ionicons name="medical" size={18} color="#10b981" />
                    <Text style={[styles.cardTitle, { color: c.text }]}>Symptoms</Text>
                    <Text style={[styles.cardBadge, { backgroundColor: '#10b98120', color: '#10b981' }]}>
                        {selectedSymptoms.length} selected
                    </Text>
                </View>
                <View style={styles.chipGrid}>
                    {SYMPTOMS.map(s => {
                        const active = selectedSymptoms.includes(s.id);
                        return (
                            <Pressable
                                key={s.id}
                                onPress={() => toggle(s.id, selectedSymptoms, setSelectedSymptoms)}
                                style={[
                                    styles.symptomChip,
                                    { backgroundColor: active ? '#10b981' : c.chip, borderColor: active ? '#059669' : c.chipBorder }
                                ]}
                            >
                                <Ionicons name={s.icon as any} size={14} color={active ? '#fff' : c.sub} style={{ marginRight: 5 }} />
                                <Text style={[styles.chipText, { color: active ? '#fff' : c.text }]}>{s.id}</Text>
                            </Pressable>
                        );
                    })}
                </View>
            </View>
        </ScrollView>
    );

    // ── Step 3 ───────────────────────────────────────────────────────────────
    const step3 = (
        <ScrollView contentContainerStyle={styles.stepContent}>
            <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
                <View style={styles.cardHeaderRow}>
                    <Ionicons name="alert-circle" size={18} color="#f59e0b" />
                    <Text style={[styles.cardTitle, { color: c.text }]}>Possible Triggers</Text>
                    <Text style={[styles.cardBadge, { backgroundColor: '#f59e0b20', color: '#f59e0b' }]}>
                        {selectedTriggers.length} selected
                    </Text>
                </View>
                <View style={styles.chipGrid}>
                    {TRIGGERS.map(t => {
                        const active = selectedTriggers.includes(t.id);
                        return (
                            <Pressable
                                key={t.id}
                                onPress={() => toggle(t.id, selectedTriggers, setSelectedTriggers)}
                                style={[
                                    styles.symptomChip,
                                    { backgroundColor: active ? '#f59e0b' : c.chip, borderColor: active ? '#d97706' : c.chipBorder }
                                ]}
                            >
                                <Ionicons name={t.icon as any} size={14} color={active ? '#fff' : c.sub} style={{ marginRight: 5 }} />
                                <Text style={[styles.chipText, { color: active ? '#fff' : c.text }]}>{t.id}</Text>
                            </Pressable>
                        );
                    })}
                </View>
            </View>

            <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
                <View style={styles.cardHeaderRow}>
                    <Ionicons name="medkit" size={18} color="#6366f1" />
                    <Text style={[styles.cardTitle, { color: c.text }]}>Medication Taken</Text>
                    <Text style={[styles.cardBadge, { backgroundColor: '#6366f120', color: '#6366f1' }]}>
                        {selectedMedications.length} selected
                    </Text>
                </View>
                <View style={styles.chipWrap}>
                    {MEDICATIONS.map(m => {
                        const active = selectedMedications.includes(m);
                        return (
                            <Pressable
                                key={m}
                                onPress={() => toggle(m, selectedMedications, setSelectedMedications)}
                                style={[
                                    styles.chip,
                                    { backgroundColor: active ? '#6366f1' : c.chip, borderColor: active ? '#4f46e5' : c.chipBorder }
                                ]}
                            >
                                <Text style={[styles.chipText, { color: active ? '#fff' : c.text }]}>{m}</Text>
                            </Pressable>
                        );
                    })}
                </View>
            </View>

            {selectedMedications.length > 0 && !selectedMedications.includes('None') && (
                <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
                    <View style={styles.cardHeaderRow}>
                        <Ionicons name="stats-chart" size={18} color="#6366f1" />
                        <Text style={[styles.cardTitle, { color: c.text }]}>Medication Effectiveness</Text>
                    </View>
                    <View style={styles.durationRow}>
                        {[
                            { label: 'None',     val: 0 },
                            { label: 'Slight',   val: 1 },
                            { label: 'Moderate', val: 2 },
                            { label: 'Good',     val: 3 },
                            { label: 'Full',     val: 4 },
                        ].map(e => (
                            <Pressable
                                key={e.val}
                                onPress={() => setMedicationEffectiveness(e.val)}
                                style={[
                                    styles.durationBtn,
                                    { backgroundColor: medicationEffectiveness === e.val ? '#6366f1' : c.chip, borderColor: medicationEffectiveness === e.val ? '#4f46e5' : c.chipBorder }
                                ]}
                            >
                                <Text style={[styles.durationText, { color: medicationEffectiveness === e.val ? '#fff' : c.sub }]}>{e.label}</Text>
                            </Pressable>
                        ))}
                    </View>
                </View>
            )}

            <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
                <View style={styles.cardHeaderRow}>
                    <Ionicons name="leaf" size={18} color="#10b981" />
                    <Text style={[styles.cardTitle, { color: c.text }]}>Relief Methods Used</Text>
                </View>
                <View style={styles.chipWrap}>
                    {RELIEF_METHODS.map(r => {
                        const active = selectedReliefMethods.includes(r);
                        return (
                            <Pressable
                                key={r}
                                onPress={() => toggle(r, selectedReliefMethods, setSelectedReliefMethods)}
                                style={[
                                    styles.chip,
                                    { backgroundColor: active ? '#10b981' : c.chip, borderColor: active ? '#059669' : c.chipBorder }
                                ]}
                            >
                                <Text style={[styles.chipText, { color: active ? '#fff' : c.text }]}>{r}</Text>
                            </Pressable>
                        );
                    })}
                </View>
            </View>
        </ScrollView>
    );

    // ── Step 4 ───────────────────────────────────────────────────────────────
    const step4 = (
        <ScrollView contentContainerStyle={styles.stepContent}>
            <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
                <View style={styles.cardHeaderRow}>
                    <Ionicons name="create" size={18} color="#10b981" />
                    <Text style={[styles.cardTitle, { color: c.text }]}>Additional Notes</Text>
                </View>
                <TextInput
                    style={[styles.textArea, { backgroundColor: c.chip, borderColor: c.border, color: c.text }]}
                    placeholder="Any additional observations..."
                    placeholderTextColor={c.sub}
                    multiline
                    numberOfLines={4}
                    value={notes}
                    onChangeText={setNotes}
                />
            </View>

            <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
                <View style={styles.cardHeaderRow}>
                    <Ionicons name="list" size={18} color="#10b981" />
                    <Text style={[styles.cardTitle, { color: c.text }]}>Episode Summary</Text>
                </View>
                {[
                    { label: 'Intensity',  value: `${intensity}/10 — ${intensityLabel}`, color: intensityColor },
                    { label: 'Duration',   value: duration },
                    painLocation ? { label: 'Location', value: painLocation } : null,
                    selectedSymptoms.length  ? { label: 'Symptoms',  value: selectedSymptoms.join(', ')  } : null,
                    selectedTriggers.length  ? { label: 'Triggers',  value: selectedTriggers.join(', ')  } : null,
                    selectedMedications.length ? { label: 'Medication', value: selectedMedications.join(', ') } : null,
                    warningSignsBefore ? { label: 'Warning Signs', value: warningDescription || 'Yes' } : null,
                    { label: 'Time', value: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
                ].filter(Boolean).map((row: any, i, arr) => (
                    <View key={i} style={[styles.summaryRow, { borderBottomColor: i < arr.length - 1 ? c.border : 'transparent' }]}>
                        <Text style={[styles.summaryLabel, { color: c.sub }]}>{row.label}</Text>
                        <Text style={[styles.summaryValue, { color: row.color ?? c.text }]}>{row.value}</Text>
                    </View>
                ))}
            </View>
        </ScrollView>
    );

    return (
        <View style={[styles.container, { backgroundColor: c.bg }]}>

            {/* ── Duplicate already-logged modal ────────────────────────────── */}
            <Modal
                visible={dupModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setDupModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalCard, { backgroundColor: c.card, borderColor: c.border }]}>
                        {/* Icon */}
                        <View style={styles.modalIconWrap}>
                            <Ionicons name="alert-circle" size={44} color="#f59e0b" />
                        </View>

                        <Text style={[styles.modalTitle, { color: c.text }]}>
                            Already logged today
                        </Text>
                        <Text style={[styles.modalBody, { color: c.sub }]}>
                            You've already recorded a migraine episode for today. Would you like to edit your existing entry instead?
                        </Text>

                        {/* Existing log preview */}
                        {dupExistingLog && (
                            <View style={[styles.modalPreview, { backgroundColor: c.chip, borderColor: c.chipBorder }]}>
                                <View style={styles.modalPreviewRow}>
                                    <Ionicons name="pulse" size={14} color="#f59e0b" />
                                    <Text style={[styles.modalPreviewText, { color: c.sub }]}>
                                        Intensity {dupExistingLog.intensity}/10  ·  {dupExistingLog.duration_category}
                                    </Text>
                                </View>
                                {dupExistingLog.symptoms.length > 0 && (
                                    <View style={styles.modalPreviewRow}>
                                        <Ionicons name="medical" size={14} color="#f59e0b" />
                                        <Text style={[styles.modalPreviewText, { color: c.sub }]} numberOfLines={1}>
                                            {dupExistingLog.symptoms.join(', ')}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Actions */}
                        <Pressable
                            onPress={handleEditExisting}
                            style={styles.modalBtnPrimary}
                        >
                            <Ionicons name="create-outline" size={18} color="#fff" />
                            <Text style={styles.modalBtnPrimaryText}>Edit Existing Entry</Text>
                        </Pressable>

                        <Pressable
                            onPress={() => setDupModalVisible(false)}
                            style={[styles.modalBtnSecondary, { borderColor: c.border }]}
                        >
                            <Text style={[styles.modalBtnSecondaryText, { color: c.sub }]}>Cancel</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>

            {/* ── Header ──────────────────────────────────────────────────── */}
            <View style={[styles.header, { backgroundColor: c.card, borderBottomColor: c.border }]}>
                <View>
                    <Text style={[styles.headerTitle, { color: c.text }]}>
                        {isEditMode || dupExistingLog ? 'Edit Episode' : 'Log Episode'}
                    </Text>
                    <Text style={[styles.headerSub, { color: c.sub }]}>{stepLabels[step - 1]}</Text>
                </View>
                {/* Edit mode banner */}
                {(isEditMode || dupExistingLog) && (
                    <View style={styles.editBadge}>
                        <Ionicons name="create" size={12} color="#f59e0b" />
                        <Text style={styles.editBadgeText}>Editing</Text>
                    </View>
                )}
            </View>

            {/* ── Step indicator ───────────────────────────────────────────── */}
            <View style={[styles.stepContainer, { backgroundColor: c.card, borderBottomColor: c.border }]}>
                {stepIndicator}
            </View>

            {/* ── Step content ─────────────────────────────────────────────── */}
            <View style={{ flex: 1 }}>
                {step === 1 && step1}
                {step === 2 && step2}
                {step === 3 && step3}
                {step === 4 && step4}
            </View>

            {/* ── Nav buttons ──────────────────────────────────────────────── */}
            <View style={[styles.navBar, { backgroundColor: c.card, borderTopColor: c.border }]}>
                {step > 1 ? (
                    <Pressable onPress={() => setStep(s => s - 1)} style={[styles.navBtnSecondary, { borderColor: c.border }]}>
                        <Ionicons name="arrow-back" size={18} color={c.sub} />
                        <Text style={[styles.navBtnSecondaryText, { color: c.sub }]}>Back</Text>
                    </Pressable>
                ) : (isEditMode || dupExistingLog) ? (
                    // Show Cancel in edit mode instead of empty space
                    <Pressable
                        onPress={() => { onCancelEdit?.(); setDupExistingLog(null); }}
                        style={[styles.navBtnSecondary, { borderColor: c.border }]}
                    >
                        <Ionicons name="close" size={18} color={c.sub} />
                        <Text style={[styles.navBtnSecondaryText, { color: c.sub }]}>Cancel</Text>
                    </Pressable>
                ) : <View style={{ flex: 1 }} />}

                {step < 4 ? (
                    <Pressable onPress={() => setStep(s => s + 1)} style={styles.navBtnPrimary}>
                        <Text style={styles.navBtnPrimaryText}>Next</Text>
                        <Ionicons name="arrow-forward" size={18} color="#fff" />
                    </Pressable>
                ) : (
                    <Pressable onPress={handleSubmit} disabled={loading} style={[styles.navBtnPrimary, loading && { opacity: 0.6 }]}>
                        {loading
                            ? <ActivityIndicator color="#fff" size="small" />
                            : <>
                                <Ionicons name="checkmark-circle" size={18} color="#fff" />
                                <Text style={styles.navBtnPrimaryText}>
                                    {isEditMode || dupExistingLog ? 'Save Changes' : 'Save Episode'}
                                </Text>
                              </>
                        }
                    </Pressable>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container:      { flex: 1 },
    containerLight: { backgroundColor: '#f5f8f7' },
    containerDark:  { backgroundColor: '#1a2522' },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.55)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalCard: {
        width: '100%',
        maxWidth: 380,
        borderRadius: 24,
        borderWidth: 1,
        padding: 24,
        alignItems: 'center',
        gap: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },
    modalIconWrap:  { marginBottom: 4 },
    modalTitle:     { fontSize: 20, fontWeight: '800', textAlign: 'center' },
    modalBody:      { fontSize: 14, textAlign: 'center', lineHeight: 22 },
    modalPreview: {
        width: '100%',
        borderRadius: 12,
        borderWidth: 1,
        padding: 12,
        gap: 6,
    },
    modalPreviewRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
    modalPreviewText: { fontSize: 13, flex: 1 },
    modalBtnPrimary: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#f59e0b',
        paddingVertical: 14,
        borderRadius: 14,
    },
    modalBtnPrimaryText:   { color: '#fff', fontSize: 15, fontWeight: '700' },
    modalBtnSecondary: {
        width: '100%',
        alignItems: 'center',
        paddingVertical: 12,
        borderRadius: 14,
        borderWidth: 1,
    },
    modalBtnSecondaryText: { fontSize: 14, fontWeight: '600' },

    // Edit badge
    editBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#f59e0b20',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    editBadgeText: { fontSize: 12, fontWeight: '700', color: '#f59e0b' },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
    },
    headerTitle: { fontSize: 20, fontWeight: '700', marginBottom: 2 },
    headerSub:   { fontSize: 13 },

    stepContainer: { paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1 },
    stepRow:       { flexDirection: 'row', alignItems: 'center' },
    stepItem:      { flexDirection: 'row', alignItems: 'center', flex: 1 },
    stepDot: {
        width: 26, height: 26, borderRadius: 13,
        alignItems: 'center', justifyContent: 'center',
    },
    stepLine: { flex: 1, height: 2, marginHorizontal: 4 },

    stepContent: { padding: 16, gap: 14, paddingBottom: 24 },
    card:        { borderRadius: 16, borderWidth: 1, padding: 16, gap: 14 },
    cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    cardTitle:     { fontSize: 15, fontWeight: '600', flex: 1 },
    cardBadge: {
        fontSize: 11, fontWeight: '600',
        paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
    },

    intensityDisplay: {
        flexDirection: 'row', alignItems: 'baseline',
        justifyContent: 'center', gap: 6,
        paddingVertical: 12, borderRadius: 12, borderWidth: 1,
    },
    intensityNumber: { fontSize: 52, fontWeight: '800', lineHeight: 60 },
    intensityLabel:  { fontSize: 18, fontWeight: '600' },
    intensityScale:  { fontSize: 16 },
    intensityRow:    { flexDirection: 'row', gap: 5 },
    intensityBtn: {
        flex: 1, paddingVertical: 10, borderRadius: 8,
        alignItems: 'center', borderWidth: 1,
    },
    intensityBtnText: { fontSize: 13, fontWeight: '700' },
    intensityLegend:  { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
    legendText:       { fontSize: 11, fontWeight: '500' },

    durationRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    durationBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
    durationText:{ fontSize: 13, fontWeight: '600' },

    chipWrap:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chipGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip:        { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
    symptomChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
    chipText:    { fontSize: 13, fontWeight: '500' },

    toggle: { width: 42, height: 24, borderRadius: 12, justifyContent: 'center', position: 'relative' },
    toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', position: 'absolute' },

    textArea: { borderRadius: 12, borderWidth: 1, padding: 12, fontSize: 14, minHeight: 90, textAlignVertical: 'top' },

    summaryRow:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, gap: 12 },
    summaryLabel: { fontSize: 13, fontWeight: '500', minWidth: 90 },
    summaryValue: { fontSize: 13, fontWeight: '600', flex: 1, textAlign: 'right' },

    navBar: { flexDirection: 'row', padding: 16, gap: 12, borderTopWidth: 1 },
    navBtnSecondary: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', gap: 6, paddingVertical: 14,
        borderRadius: 12, borderWidth: 1,
    },
    navBtnSecondaryText: { fontSize: 15, fontWeight: '600' },
    navBtnPrimary: {
        flex: 2, flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', gap: 8, paddingVertical: 14,
        borderRadius: 12, backgroundColor: '#10b981',
    },
    navBtnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '700' },

    successScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 16 },
    successIconRing: {
        width: 96, height: 96, borderRadius: 48, borderWidth: 3,
        alignItems: 'center', justifyContent: 'center', marginBottom: 8,
    },
    successTitle:    { fontSize: 26, fontWeight: '800', textAlign: 'center' },
    successSubtitle: { fontSize: 16, fontWeight: '600', textAlign: 'center' },
    successBody:     { fontSize: 14, textAlign: 'center', lineHeight: 22 },
});