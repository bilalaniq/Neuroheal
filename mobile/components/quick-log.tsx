import React, { useState } from 'react';
import {
    View, Text, StyleSheet, Pressable, ScrollView,
    ActivityIndicator, TextInput, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@/contexts/UserContext';
import { API_BASE_URL, API_ENDPOINTS, logAPI } from '@/config/api';

interface QuickLogProps {
    onSuccess?: () => void;
    editingLog?: ExistingLog | null;
    onCancelEdit?: () => void;
}

interface ExistingLog {
    id: string;
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
    { id: 'Throbbing',    icon: 'pulse' },
    { id: 'Nausea',       icon: 'medical' },
    { id: 'Photophobia',  icon: 'sunny' },
    { id: 'Phonophobia',  icon: 'volume-high' },
    { id: 'Visual Aura',  icon: 'eye' },
    { id: 'Dizziness',    icon: 'refresh-circle' },
    { id: 'Neck Pain',    icon: 'body' },
    { id: 'Vomiting',     icon: 'warning' },
    { id: 'Fatigue',      icon: 'bed' },
    { id: 'Brain Fog',    icon: 'cloudy' },
    { id: 'Facial Pain',  icon: 'sad' },
    { id: 'Tingling',     icon: 'flash' },
];

const TRIGGERS = [
    { id: 'Stress',          icon: 'alert-circle' },
    { id: 'Poor Sleep',      icon: 'moon' },
    { id: 'Bright Light',    icon: 'sunny' },
    { id: 'Loud Noise',      icon: 'volume-high' },
    { id: 'Alcohol',         icon: 'wine' },
    { id: 'Caffeine',        icon: 'cafe' },
    { id: 'Dehydration',     icon: 'water' },
    { id: 'Skipped Meal',    icon: 'restaurant' },
    { id: 'Weather Change',  icon: 'cloud' },
    { id: 'Strong Smell',    icon: 'flower' },
    { id: 'Screen Time',     icon: 'phone-portrait' },
    { id: 'Hormonal',        icon: 'fitness' },
];

const MEDICATIONS     = ['Ibuprofen','Paracetamol','Aspirin','Sumatriptan','Rizatriptan','Naproxen','Caffeine+Paracetamol','None'];
const PAIN_LOCATIONS  = ['Left side','Right side','Both sides','Forehead','Back of head','Behind eyes'];
const RELIEF_METHODS  = ['Dark room','Sleep','Cold compress','Hot compress','Meditation','Fresh air'];

// ── Theme tokens ──────────────────────────────────────────────────────────────
const T = {
    bg:          '#000',
    card:        '#231344',
    cardDeep:    '#160a2e',
    border:      '#2b0f4d',
    text:        '#fff',
    sub:         '#c4b5fd',
    muted:       '#6b21a8',
    chip:        '#160a2e',
    chipBorder:  '#2b0f4d',
    accent:      '#6107c9',
    green:       '#34d399',
    amber:       '#fbbf24',
    red:         '#f87171',
    indigo:      '#a78bfa',
};

export const QuickLog: React.FC<QuickLogProps> = ({ onSuccess, editingLog, onCancelEdit }) => {
    const { userData } = useUser();
    const isEditMode = !!editingLog;

    const [step,                    setStep]                    = useState(1);
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
    const [loading,                 setLoading]                 = useState(false);
    const [showSuccess,             setShowSuccess]             = useState(false);
    const [dupModalVisible,         setDupModalVisible]         = useState(false);
    const [dupExistingLog,          setDupExistingLog]          = useState<ExistingLog | null>(null);

    const toggle = (item: string, list: string[], setList: (v: string[]) => void) =>
        setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);

    const intensityColor = intensity <= 3 ? T.green : intensity <= 6 ? T.amber : T.red;
    const intensityLabel = intensity <= 3 ? 'Mild' : intensity <= 6 ? 'Moderate' : intensity <= 8 ? 'Severe' : 'Extreme';

    const buildPayload = () => ({
        user_id: userData!.name, intensity,
        severity: intensity <= 3 ? 1 : intensity <= 6 ? 2 : intensity <= 8 ? 3 : 4,
        symptoms: selectedSymptoms, triggers: selectedTriggers,
        medication: selectedMedications, medication_effectiveness: medicationEffectiveness,
        relief_methods: selectedReliefMethods, pain_location: painLocation,
        duration_category: duration, warning_signs_before: warningSignsBefore,
        warning_description: warningDescription, notes,
        timestamp: new Date().toISOString(),
    });

    const resetAndClose = (callSuccess = true) => {
        setStep(1); setIntensity(5); setSelectedSymptoms([]); setSelectedTriggers([]);
        setSelectedMedications([]); setSelectedReliefMethods([]); setPainLocation('');
        setDuration('1-2h'); setMedicationEffectiveness(null); setWarningSignsBefore(false);
        setWarningDescription(''); setNotes('');
        if (callSuccess) onSuccess?.();
    };

    const handleSubmit = async () => {
        if (!userData?.name) return;
        setLoading(true);
        try {
            if (isEditMode && editingLog?.id) {
                const endpoint = `${API_ENDPOINTS.migraineEpisodes}/${editingLog.id}`;
                const url = `${API_BASE_URL}${endpoint}`;
                logAPI('request', endpoint, buildPayload());
                await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(buildPayload()) });
                setShowSuccess(true);
                setTimeout(() => { setShowSuccess(false); onCancelEdit?.(); onSuccess?.(); }, 2000);
            } else {
                const endpoint = API_ENDPOINTS.migraineEpisodes;
                const url = `${API_BASE_URL}${endpoint}`;
                logAPI('request', endpoint, buildPayload());
                const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(buildPayload()) });
                if (response.status === 409) {
                    const dupData = await response.json();
                    setDupExistingLog(dupData.existing_log ?? null);
                    setDupModalVisible(true);
                    return;
                }
                setShowSuccess(true);
                setTimeout(() => { setShowSuccess(false); resetAndClose(); }, 2500);
            }
        } catch (error) {
            logAPI('error', API_ENDPOINTS.migraineEpisodes, error);
        } finally {
            setLoading(false);
        }
    };

    const handleEditExisting = () => {
        setDupModalVisible(false);
        if (!dupExistingLog) return;
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
    };

    // ── Success ───────────────────────────────────────────────────────────────
    if (showSuccess) {
        return (
            <View style={s.container}>
                <View style={s.successScreen}>
                    <View style={[s.successRing, { borderColor: T.green }]}>
                        <Ionicons name="checkmark" size={48} color={T.green} />
                    </View>
                    <Text style={s.successTitle}>
                        {isEditMode || dupExistingLog ? 'Episode Updated' : 'Episode Logged'}
                    </Text>
                    <Text style={[s.successSub, { color: T.green }]}>
                        Intensity {intensity}/10 · {duration}
                    </Text>
                    <Text style={s.successBody}>
                        Your migraine data has been saved and your calendar will update shortly.
                    </Text>
                </View>
            </View>
        );
    }

    const stepLabels = ['Intensity', 'Symptoms', 'Triggers & Meds', 'Details'];

    // ── Step indicator ────────────────────────────────────────────────────────
    const StepIndicator = () => (
        <View style={s.stepRow}>
            {[1,2,3,4].map(n => (
                <View key={n} style={s.stepItem}>
                    <View style={[s.stepDot, {
                        backgroundColor: n < step ? T.accent : n === step ? T.accent : T.cardDeep,
                        borderColor: n <= step ? T.accent : T.border,
                    }]}>
                        {n < step
                            ? <Ionicons name="checkmark" size={12} color="#fff" />
                            : <Text style={{ color: n === step ? '#fff' : T.muted, fontSize: 11, fontWeight: '700' }}>{n}</Text>}
                    </View>
                    {n < 4 && <View style={[s.stepLine, { backgroundColor: n < step ? T.accent : T.border }]} />}
                </View>
            ))}
        </View>
    );

    // ── Reusable card ─────────────────────────────────────────────────────────
    const Card = ({ children }: { children: React.ReactNode }) => (
        <View style={s.card}>{children}</View>
    );
    const CardHeader = ({ icon, color, title, badge }: { icon: string; color: string; title: string; badge?: string }) => (
        <View style={s.cardHeaderRow}>
            <View style={[s.cardIconWrap, { borderColor: color + '44', backgroundColor: color + '18' }]}>
                <Ionicons name={icon as any} size={16} color={color} />
            </View>
            <Text style={s.cardTitle}>{title}</Text>
            {badge && (
                <View style={[s.badge, { backgroundColor: T.accent + '33', borderColor: T.accent + '55' }]}>
                    <Text style={[s.badgeText, { color: T.indigo }]}>{badge}</Text>
                </View>
            )}
        </View>
    );

    // ── Step 1 ────────────────────────────────────────────────────────────────
    const step1 = (
        <ScrollView contentContainerStyle={s.stepContent} showsVerticalScrollIndicator={false}>
            <Card>
                <CardHeader icon="pulse" color={intensityColor} title="Pain Intensity" />
                <View style={[s.intensityDisplay, { borderColor: intensityColor + '55' }]}>
                    <Text style={[s.intensityNum, { color: intensityColor }]}>{intensity}</Text>
                    <Text style={[s.intensityLbl, { color: intensityColor }]}>{intensityLabel}</Text>
                    <Text style={s.intensityScale}>/10</Text>
                </View>
                <View style={s.intensityRow}>
                    {[1,2,3,4,5,6,7,8,9,10].map(i => {
                        const col = i <= 3 ? T.green : i <= 6 ? T.amber : T.red;
                        const active = intensity === i;
                        return (
                            <Pressable key={i} onPress={() => setIntensity(i)}
                                style={[s.intensityBtn, {
                                    backgroundColor: active ? col : T.chipBorder + '44',
                                    borderColor: active ? col : T.border,
                                }]}>
                                <Text style={[s.intensityBtnText, { color: active ? '#fff' : T.muted }]}>{i}</Text>
                            </Pressable>
                        );
                    })}
                </View>
                <View style={s.intensityLegend}>
                    <Text style={[s.legendText, { color: T.green }]}>1–3 Mild</Text>
                    <Text style={[s.legendText, { color: T.amber }]}>4–6 Moderate</Text>
                    <Text style={[s.legendText, { color: T.red }]}>7–10 Severe</Text>
                </View>
            </Card>

            <Card>
                <CardHeader icon="time" color={T.green} title="Duration" />
                <View style={s.chipRow}>
                    {['< 1h','1-2h','2-4h','4-8h','8h+'].map(opt => (
                        <Pressable key={opt} onPress={() => setDuration(opt)}
                            style={[s.pill, duration === opt && s.pillActive]}>
                            <Text style={[s.pillText, duration === opt && s.pillTextActive]}>{opt}</Text>
                        </Pressable>
                    ))}
                </View>
            </Card>

            <Card>
                <CardHeader icon="location" color={T.indigo} title="Pain Location" />
                <View style={s.chipWrap}>
                    {PAIN_LOCATIONS.map(loc => (
                        <Pressable key={loc} onPress={() => setPainLocation(painLocation === loc ? '' : loc)}
                            style={[s.pill, painLocation === loc && s.pillActive]}>
                            <Text style={[s.pillText, painLocation === loc && s.pillTextActive]}>{loc}</Text>
                        </Pressable>
                    ))}
                </View>
            </Card>

            <Card>
                <View style={s.cardHeaderRow}>
                    <View style={[s.cardIconWrap, { borderColor: T.amber + '44', backgroundColor: T.amber + '18' }]}>
                        <Ionicons name="warning" size={16} color={T.amber} />
                    </View>
                    <Text style={s.cardTitle}>Warning Signs Before</Text>
                    <Pressable onPress={() => setWarningSignsBefore(!warningSignsBefore)}
                        style={[s.toggle, { backgroundColor: warningSignsBefore ? T.accent : T.border }]}>
                        <View style={[s.toggleThumb, { transform: [{ translateX: warningSignsBefore ? 18 : 2 }] }]} />
                    </Pressable>
                </View>
                {warningSignsBefore && (
                    <TextInput
                        style={s.textArea}
                        placeholder="e.g. visual aura, neck stiffness, mood change..."
                        placeholderTextColor={T.muted}
                        multiline numberOfLines={3}
                        value={warningDescription}
                        onChangeText={setWarningDescription}
                    />
                )}
            </Card>
        </ScrollView>
    );

    // ── Step 2 ────────────────────────────────────────────────────────────────
    const step2 = (
        <ScrollView contentContainerStyle={s.stepContent} showsVerticalScrollIndicator={false}>
            <Card>
                <CardHeader icon="medical" color={T.green} title="Symptoms" badge={`${selectedSymptoms.length} selected`} />
                <View style={s.chipWrap}>
                    {SYMPTOMS.map(sym => {
                        const active = selectedSymptoms.includes(sym.id);
                        return (
                            <Pressable key={sym.id}
                                onPress={() => toggle(sym.id, selectedSymptoms, setSelectedSymptoms)}
                                style={[s.iconChip, active && s.iconChipActive]}>
                                <Ionicons name={sym.icon as any} size={13} color={active ? '#fff' : T.muted} />
                                <Text style={[s.iconChipText, active && s.iconChipTextActive]}>{sym.id}</Text>
                            </Pressable>
                        );
                    })}
                </View>
            </Card>
        </ScrollView>
    );

    // ── Step 3 ────────────────────────────────────────────────────────────────
    const step3 = (
        <ScrollView contentContainerStyle={s.stepContent} showsVerticalScrollIndicator={false}>
            <Card>
                <CardHeader icon="alert-circle" color={T.amber} title="Possible Triggers" badge={`${selectedTriggers.length} selected`} />
                <View style={s.chipWrap}>
                    {TRIGGERS.map(t => {
                        const active = selectedTriggers.includes(t.id);
                        return (
                            <Pressable key={t.id}
                                onPress={() => toggle(t.id, selectedTriggers, setSelectedTriggers)}
                                style={[s.iconChip, active && { backgroundColor: T.amber, borderColor: T.amber }]}>
                                <Ionicons name={t.icon as any} size={13} color={active ? '#fff' : T.muted} />
                                <Text style={[s.iconChipText, active && s.iconChipTextActive]}>{t.id}</Text>
                            </Pressable>
                        );
                    })}
                </View>
            </Card>

            <Card>
                <CardHeader icon="medkit" color={T.indigo} title="Medication Taken" badge={`${selectedMedications.length} selected`} />
                <View style={s.chipWrap}>
                    {MEDICATIONS.map(m => {
                        const active = selectedMedications.includes(m);
                        return (
                            <Pressable key={m}
                                onPress={() => toggle(m, selectedMedications, setSelectedMedications)}
                                style={[s.pill, active && { backgroundColor: T.indigo, borderColor: T.indigo }]}>
                                <Text style={[s.pillText, active && s.pillTextActive]}>{m}</Text>
                            </Pressable>
                        );
                    })}
                </View>
            </Card>

            {selectedMedications.length > 0 && !selectedMedications.includes('None') && (
                <Card>
                    <CardHeader icon="stats-chart" color={T.indigo} title="Medication Effectiveness" />
                    <View style={s.chipRow}>
                        {[{ label: 'None', val: 0 },{ label: 'Slight', val: 1 },{ label: 'Moderate', val: 2 },{ label: 'Good', val: 3 },{ label: 'Full', val: 4 }].map(e => {
                            const active = medicationEffectiveness === e.val;
                            return (
                                <Pressable key={e.val} onPress={() => setMedicationEffectiveness(e.val)}
                                    style={[s.pill, active && { backgroundColor: T.indigo, borderColor: T.indigo }]}>
                                    <Text style={[s.pillText, active && s.pillTextActive]}>{e.label}</Text>
                                </Pressable>
                            );
                        })}
                    </View>
                </Card>
            )}

            <Card>
                <CardHeader icon="leaf" color={T.green} title="Relief Methods Used" />
                <View style={s.chipWrap}>
                    {RELIEF_METHODS.map(r => {
                        const active = selectedReliefMethods.includes(r);
                        return (
                            <Pressable key={r}
                                onPress={() => toggle(r, selectedReliefMethods, setSelectedReliefMethods)}
                                style={[s.pill, active && s.pillActive]}>
                                <Text style={[s.pillText, active && s.pillTextActive]}>{r}</Text>
                            </Pressable>
                        );
                    })}
                </View>
            </Card>
        </ScrollView>
    );

    // ── Step 4 ────────────────────────────────────────────────────────────────
    const step4 = (
        <ScrollView contentContainerStyle={s.stepContent} showsVerticalScrollIndicator={false}>
            <Card>
                <CardHeader icon="create" color={T.green} title="Additional Notes" />
                <TextInput
                    style={s.textArea}
                    placeholder="Any additional observations..."
                    placeholderTextColor={T.muted}
                    multiline numberOfLines={4}
                    value={notes}
                    onChangeText={setNotes}
                />
            </Card>

            <Card>
                <CardHeader icon="list" color={T.indigo} title="Episode Summary" />
                {[
                    { label: 'Intensity', value: `${intensity}/10 — ${intensityLabel}`, color: intensityColor },
                    { label: 'Duration',  value: duration },
                    painLocation         ? { label: 'Location',     value: painLocation }                   : null,
                    selectedSymptoms.length  ? { label: 'Symptoms',    value: selectedSymptoms.join(', ')  } : null,
                    selectedTriggers.length  ? { label: 'Triggers',    value: selectedTriggers.join(', ')  } : null,
                    selectedMedications.length ? { label: 'Medication', value: selectedMedications.join(', ') } : null,
                    warningSignsBefore   ? { label: 'Warning Signs', value: warningDescription || 'Yes' }   : null,
                    { label: 'Time', value: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
                ].filter(Boolean).map((row: any, i, arr) => (
                    <View key={i} style={[s.summaryRow, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: T.border }]}>
                        <Text style={s.summaryLabel}>{row.label}</Text>
                        <Text style={[s.summaryValue, row.color && { color: row.color }]}>{row.value}</Text>
                    </View>
                ))}
            </Card>
        </ScrollView>
    );

    return (
        <View style={s.container}>

            {/* ── Duplicate modal ── */}
            <Modal visible={dupModalVisible} transparent animationType="fade" onRequestClose={() => setDupModalVisible(false)}>
                <View style={s.modalOverlay}>
                    <View style={s.modalCard}>
                        <View style={s.modalIconWrap}>
                            <Ionicons name="alert-circle" size={44} color={T.amber} />
                        </View>
                        <Text style={s.modalTitle}>Already logged today</Text>
                        <Text style={s.modalBody}>
                            You've already recorded a migraine episode for today. Would you like to edit your existing entry?
                        </Text>
                        {dupExistingLog && (
                            <View style={s.modalPreview}>
                                <View style={s.modalPreviewRow}>
                                    <Ionicons name="pulse" size={14} color={T.amber} />
                                    <Text style={s.modalPreviewText}>
                                        Intensity {dupExistingLog.intensity}/10 · {dupExistingLog.duration_category}
                                    </Text>
                                </View>
                                {dupExistingLog.symptoms.length > 0 && (
                                    <View style={s.modalPreviewRow}>
                                        <Ionicons name="medical" size={14} color={T.amber} />
                                        <Text style={s.modalPreviewText} numberOfLines={1}>
                                            {dupExistingLog.symptoms.join(', ')}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}
                        <Pressable onPress={handleEditExisting} style={s.modalBtnPrimary}>
                            <Ionicons name="create-outline" size={18} color="#fff" />
                            <Text style={s.modalBtnPrimaryText}>Edit Existing Entry</Text>
                        </Pressable>
                        <Pressable onPress={() => setDupModalVisible(false)} style={s.modalBtnSecondary}>
                            <Text style={s.modalBtnSecondaryText}>Cancel</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>

            {/* ── Header ── */}
            <View style={s.header}>
                <View>
                    <Text style={s.headerTitle}>
                        {isEditMode || dupExistingLog ? 'Edit Episode' : 'Log Episode'}
                    </Text>
                    <Text style={s.headerSub}>{stepLabels[step - 1]}</Text>
                </View>
                {(isEditMode || dupExistingLog) && (
                    <View style={s.editBadge}>
                        <Ionicons name="create" size={12} color={T.amber} />
                        <Text style={s.editBadgeText}>Editing</Text>
                    </View>
                )}
            </View>

            {/* ── Step indicator ── */}
            <View style={s.stepContainer}>
                <StepIndicator />
            </View>

            {/* ── Content ── */}
            <View style={{ flex: 1 }}>
                {step === 1 && step1}
                {step === 2 && step2}
                {step === 3 && step3}
                {step === 4 && step4}
            </View>

            {/* ── Nav bar ── */}
            <View style={s.navBar}>
                {step > 1 ? (
                    <Pressable onPress={() => setStep(n => n - 1)} style={s.navBack}>
                        <Ionicons name="arrow-back" size={18} color={T.sub} />
                        <Text style={s.navBackText}>Back</Text>
                    </Pressable>
                ) : (isEditMode || dupExistingLog) ? (
                    <Pressable onPress={() => { onCancelEdit?.(); setDupExistingLog(null); }} style={s.navBack}>
                        <Ionicons name="close" size={18} color={T.sub} />
                        <Text style={s.navBackText}>Cancel</Text>
                    </Pressable>
                ) : <View style={{ flex: 1 }} />}

                {step < 4 ? (
                    <Pressable onPress={() => setStep(n => n + 1)} style={s.navNext}>
                        <Text style={s.navNextText}>Next</Text>
                        <Ionicons name="arrow-forward" size={18} color="#fff" />
                    </Pressable>
                ) : (
                    <Pressable onPress={handleSubmit} disabled={loading}
                        style={[s.navNext, loading && { opacity: 0.6 }]}>
                        {loading
                            ? <ActivityIndicator color="#fff" size="small" />
                            : <>
                                <Ionicons name="checkmark-circle" size={18} color="#fff" />
                                <Text style={s.navNextText}>
                                    {isEditMode || dupExistingLog ? 'Save Changes' : 'Save Episode'}
                                </Text>
                              </>}
                    </Pressable>
                )}
            </View>
        </View>
    );
};

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: T.bg },

    // ── Success ──
    successScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 16 },
    successRing:   { width: 96, height: 96, borderRadius: 48, borderWidth: 3, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    successTitle:  { fontSize: 26, fontWeight: '800', color: T.text, textAlign: 'center' },
    successSub:    { fontSize: 16, fontWeight: '600', textAlign: 'center' },
    successBody:   { fontSize: 14, color: T.sub, textAlign: 'center', lineHeight: 22 },

    // ── Header ──
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
        backgroundColor: T.card,
        borderBottomWidth: 1, borderBottomColor: T.border,
    },
    headerTitle: { fontSize: 20, fontWeight: '800', color: T.text, marginBottom: 2 },
    headerSub:   { fontSize: 13, color: T.sub },
    editBadge:   { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: T.amber + '22', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
    editBadgeText: { fontSize: 12, fontWeight: '700', color: T.amber },

    // ── Step indicator ──
    stepContainer: { paddingVertical: 14, paddingHorizontal: 20, backgroundColor: T.card, borderBottomWidth: 1, borderBottomColor: T.border },
    stepRow:       { flexDirection: 'row', alignItems: 'center' },
    stepItem:      { flexDirection: 'row', alignItems: 'center', flex: 1 },
    stepDot:       { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
    stepLine:      { flex: 1, height: 2, marginHorizontal: 4 },

    // ── Cards ──
    stepContent:  { padding: 16, gap: 12, paddingBottom: 24 },
    card:         { backgroundColor: T.card, borderRadius: 18, borderWidth: 1, borderColor: T.border, padding: 16, gap: 14 },
    cardHeaderRow:{ flexDirection: 'row', alignItems: 'center', gap: 10 },
    cardIconWrap: { width: 30, height: 30, borderRadius: 9, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    cardTitle:    { fontSize: 15, fontWeight: '700', color: T.text, flex: 1 },
    badge:        { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
    badgeText:    { fontSize: 11, fontWeight: '600' },

    // ── Intensity ──
    intensityDisplay: {
        flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center',
        gap: 6, paddingVertical: 12, borderRadius: 14, borderWidth: 1,
        backgroundColor: T.cardDeep,
    },
    intensityNum:   { fontSize: 52, fontWeight: '800', lineHeight: 60 },
    intensityLbl:   { fontSize: 18, fontWeight: '700' },
    intensityScale: { fontSize: 16, color: T.muted },
    intensityRow:   { flexDirection: 'row', gap: 4 },
    intensityBtn:   { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1 },
    intensityBtnText: { fontSize: 12, fontWeight: '700' },
    intensityLegend: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 2 },
    legendText:      { fontSize: 11, fontWeight: '500' },

    // ── Pills / chips ──
    chipRow:  { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    pill: {
        paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20,
        backgroundColor: T.chip, borderWidth: 1, borderColor: T.chipBorder,
    },
    pillActive:    { backgroundColor: T.accent, borderColor: T.accent },
    pillText:      { fontSize: 13, fontWeight: '600', color: T.sub },
    pillTextActive:{ color: '#fff' },
    iconChip: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
        backgroundColor: T.chip, borderWidth: 1, borderColor: T.chipBorder,
    },
    iconChipActive:    { backgroundColor: T.accent, borderColor: T.accent },
    iconChipText:      { fontSize: 13, fontWeight: '500', color: T.sub },
    iconChipTextActive:{ color: '#fff' },

    // ── Toggle ──
    toggle:      { width: 42, height: 24, borderRadius: 12, justifyContent: 'center' },
    toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', position: 'absolute' },

    // ── Text area ──
    textArea: {
        backgroundColor: T.cardDeep, borderRadius: 12, borderWidth: 1,
        borderColor: T.border, padding: 12, fontSize: 14,
        color: T.text, minHeight: 90, textAlignVertical: 'top',
    },

    // ── Summary ──
    summaryRow:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, gap: 12 },
    summaryLabel: { fontSize: 13, fontWeight: '500', color: T.sub, minWidth: 90 },
    summaryValue: { fontSize: 13, fontWeight: '600', color: T.text, flex: 1, textAlign: 'right' },

    // ── Nav bar ──
    navBar: {
        flexDirection: 'row', padding: 16, gap: 12,
        backgroundColor: T.card, borderTopWidth: 1, borderTopColor: T.border,
    },
    navBack: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 6, paddingVertical: 14, borderRadius: 12,
        backgroundColor: T.cardDeep, borderWidth: 1, borderColor: T.border,
    },
    navBackText: { fontSize: 15, fontWeight: '600', color: T.sub },
    navNext: {
        flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, paddingVertical: 14, borderRadius: 12, backgroundColor: T.accent,
    },
    navNextText: { color: '#fff', fontSize: 15, fontWeight: '700' },

    // ── Duplicate modal ──
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 },
    modalCard: {
        width: '100%', maxWidth: 380, backgroundColor: T.card,
        borderRadius: 24, borderWidth: 1, borderColor: T.border,
        padding: 24, alignItems: 'center', gap: 14,
        shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 10,
    },
    modalIconWrap:     { marginBottom: 4 },
    modalTitle:        { fontSize: 20, fontWeight: '800', color: T.text, textAlign: 'center' },
    modalBody:         { fontSize: 14, color: T.sub, textAlign: 'center', lineHeight: 22 },
    modalPreview: {
        width: '100%', backgroundColor: T.cardDeep, borderRadius: 12,
        borderWidth: 1, borderColor: T.border, padding: 12, gap: 6,
    },
    modalPreviewRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
    modalPreviewText:  { fontSize: 13, color: T.sub, flex: 1 },
    modalBtnPrimary: {
        width: '100%', flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', gap: 8,
        backgroundColor: T.amber, paddingVertical: 14, borderRadius: 14,
    },
    modalBtnPrimaryText:   { color: '#fff', fontSize: 15, fontWeight: '700' },
    modalBtnSecondary: {
        width: '100%', alignItems: 'center', paddingVertical: 12,
        borderRadius: 14, backgroundColor: T.cardDeep,
        borderWidth: 1, borderColor: T.border,
    },
    modalBtnSecondaryText: { fontSize: 14, fontWeight: '600', color: T.sub },
});