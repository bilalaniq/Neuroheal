import React, { useState } from 'react';
import {
    View, Text, StyleSheet, Pressable, ScrollView,
    ActivityIndicator, Alert, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@/contexts/UserContext';
import { API_BASE_URL, API_ENDPOINTS, logAPI } from '@/config/api';
import { AIInsightButton } from '@/components/AIInsightButton';

interface DetailedClassifyProps { onSuccess?: () => void; }

interface FormData {
    age: string; duration: string; frequency: string;
    location: string; character: string; intensity: string; visual: string;
    nausea: boolean; vomit: boolean; phonophobia: boolean; photophobia: boolean;
    sensory: boolean; dysphasia: boolean; dysarthria: boolean; vertigo: boolean;
    tinnitus: boolean; hypoacusis: boolean; diplopia: boolean; defect: boolean;
    conscience: boolean; paresthesia: boolean; dpf: boolean;
}

interface PredictionResult {
    prediction: string; confidence: number;
    all_probabilities: Record<string, number>; timestamp: string;
}

const T = {
    bg: '#000', card: '#231344', cardDeep: '#160a2e', border: '#2b0f4d',
    text: '#fff', sub: '#c4b5fd', muted: '#6b21a8',
    accent: '#6107c9', green: '#34d399', amber: '#fbbf24',
    red: '#f87171', indigo: '#a78bfa', blue: '#60a5fa',
};

export const DetailedClassify: React.FC<DetailedClassifyProps> = ({ onSuccess }) => {
    const { userData } = useUser();
    const [loading, setLoading] = useState(false);
    const [result,  setResult]  = useState<PredictionResult | null>(null);
    const [errors,  setErrors]  = useState<Partial<Record<keyof FormData, string>>>({});
    const [formData, setFormData] = useState<FormData>({
        age: '30', duration: '1', frequency: '2',
        location: 'Unilateral', character: 'Throbbing',
        intensity: '5', visual: 'No aura',
        nausea: false, vomit: false, phonophobia: false, photophobia: false,
        sensory: false, dysphasia: false, dysarthria: false, vertigo: false,
        tinnitus: false, hypoacusis: false, diplopia: false, defect: false,
        conscience: false, paresthesia: false, dpf: false,
    });

    const setF = (key: keyof FormData, val: any) =>
        setFormData(prev => ({ ...prev, [key]: val }));
    const toggle = (key: keyof FormData) =>
        setFormData(prev => ({ ...prev, [key]: !prev[key] }));

    const handleClassify = async () => {
        const newErrors: Partial<Record<keyof FormData, string>> = {};
        const ageNum       = parseInt(formData.age);
        const durationNum  = parseInt(formData.duration);
        const frequencyNum = parseInt(formData.frequency);
        const intensityNum = parseInt(formData.intensity);

        if (!formData.age      || isNaN(ageNum)       || ageNum < 0       || ageNum > 120)  newErrors.age       = 'Enter a valid age (0–120)';
        if (!formData.duration || isNaN(durationNum)  || durationNum < 0  || durationNum > 3) newErrors.duration  = 'Enter 0, 1, 2, or 3';
        if (!formData.frequency|| isNaN(frequencyNum) || frequencyNum < 0 || frequencyNum > 7) newErrors.frequency = 'Enter a number from 0 to 7';
        if (isNaN(intensityNum)|| intensityNum < 1    || intensityNum > 10) newErrors.intensity = 'Select an intensity (1–10)';

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        setLoading(true);
        const endpoint = API_ENDPOINTS.symptomType;
        const url      = `${API_BASE_URL}${endpoint}`;
        const intensityMapped = intensityNum <= 3 ? 1 : intensityNum <= 6 ? 2 : 3;

        const payload = {
            age: ageNum, duration: durationNum, frequency: frequencyNum,
            location:  formData.location  === 'Unilateral' ? 1 : 0,
            character: formData.character === 'Throbbing'  ? 1 : 0,
            intensity: intensityMapped,
            visual: formData.visual === 'No aura' ? 0 : formData.visual === 'With aura' ? 2 : 1,
            nausea:       formData.nausea       ? 1 : 0,
            vomit:        formData.vomit        ? 1 : 0,
            phonophobia:  formData.phonophobia  ? 1 : 0,
            photophobia:  formData.photophobia  ? 1 : 0,
            sensory:      formData.sensory      ? 1 : 0,
            dysphasia:    formData.dysphasia    ? 1 : 0,
            dysarthria:   formData.dysarthria   ? 1 : 0,
            vertigo:      formData.vertigo      ? 1 : 0,
            tinnitus:     formData.tinnitus     ? 1 : 0,
            hypoacusis:   formData.hypoacusis   ? 1 : 0,
            diplopia:     formData.diplopia     ? 1 : 0,
            defect:       formData.defect       ? 1 : 0,
            ataxia: 0,
            conscience:   formData.conscience   ? 1 : 0,
            paresthesia:  formData.paresthesia  ? 1 : 0,
            dpf:          formData.dpf          ? 1 : 0,
            ext_1:0,ext_2:0,ext_3:0,ext_4:0,ext_5:0,ext_6:0,ext_7:0,
            ext_8:0,ext_9:0,ext_10:0,ext_11:0,ext_12:0,ext_13:0,ext_14:0,
            ext_15:0,ext_16:0,ext_17:0,ext_18:0,ext_19:0,ext_20:0,
            ext_21:0,ext_22:0,ext_23:0,ext_24:0,ext_25:0,ext_26:0,ext_27:0,
        };

        logAPI('request', endpoint, payload);
        try {
            const response = await fetch(url, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const text = await response.text();
            logAPI('response', endpoint, { status: response.status, body: text });
            if (!response.ok) throw new Error(`HTTP ${response.status}: ${text}`);
            const data = JSON.parse(text);
            setResult(data);
            onSuccess?.();
        } catch (error: any) {
            logAPI('error', endpoint, error);
            Alert.alert('Error', `Failed to classify: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const buildInsightData = (res: PredictionResult) => ({
        prediction: res.prediction, confidence: res.confidence,
        all_probabilities: res.all_probabilities,
        symptoms: [
            formData.nausea       && 'Nausea',
            formData.vomit        && 'Vomiting',
            formData.phonophobia  && 'Sound Sensitivity',
            formData.photophobia  && 'Light Sensitivity',
            formData.sensory      && 'Sensory Disturbance',
            formData.dysphasia    && 'Speech Difficulty',
            formData.dysarthria   && 'Slurred Speech',
            formData.vertigo      && 'Vertigo',
            formData.tinnitus     && 'Ringing in Ears',
            formData.hypoacusis   && 'Hearing Loss',
            formData.diplopia     && 'Double Vision',
            formData.defect       && 'Visual Field Defect',
            formData.conscience   && 'Loss of Consciousness',
            formData.paresthesia  && 'Tingling/Numbness',
            formData.dpf          && 'Family History',
        ].filter(Boolean).join(', '),
        pain_location: formData.location, character: formData.character,
        visual_aura: formData.visual, intensity: `${formData.intensity}/10`,
        duration_scale: formData.duration, frequency: `${formData.frequency} episodes/month`,
        age: formData.age,
    });

    // ── Results ───────────────────────────────────────────────────────────────
    if (result) {
        const confidence = result.confidence * 100;
        const confColor  = confidence >= 70 ? T.green : confidence >= 40 ? T.amber : T.red;

        // Sort probabilities descending
        const probs = Object.entries(result.all_probabilities)
            .filter(([, v]) => v > 0.01)
            .sort(([, a], [, b]) => b - a);
        const maxProb = probs[0]?.[1] ?? 1;

        return (
            <ScrollView style={s.root} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

                {/* Result hero */}
                <View style={s.heroCard}>
                    <View style={[s.heroIconWrap, { backgroundColor: T.green + '22', borderColor: T.green + '55' }]}>
                        <Ionicons name="checkmark-circle" size={36} color={T.green} />
                    </View>
                    <View style={s.heroRight}>
                        <Text style={s.heroPrediction}>{result.prediction}</Text>
                        <View style={[s.confPill, { backgroundColor: confColor + '22', borderColor: confColor + '55' }]}>
                            <Text style={[s.confPillText, { color: confColor }]}>
                                {confidence.toFixed(1)}% confidence
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Probabilities */}
                <View style={s.secHeader}>
                    <View style={[s.secDot, { backgroundColor: T.indigo }]} />
                    <Text style={s.secTitle}>All Probabilities</Text>
                </View>
                <View style={s.card}>
                    {probs.map(([type, prob], i) => {
                        const pct   = prob * 100;
                        const barW  = (prob / maxProb) * 100;
                        const color = i === 0 ? T.green : i === 1 ? T.indigo : T.muted;
                        return (
                            <View key={type} style={[s.probRow, i > 0 && { borderTopWidth: 1, borderTopColor: T.border }]}>
                                <Text style={s.probLabel} numberOfLines={1}>{type}</Text>
                                <View style={s.probBarWrap}>
                                    <View style={[s.probBar, { width: `${barW}%`, backgroundColor: color }]} />
                                </View>
                                <Text style={[s.probValue, { color }]}>{pct.toFixed(1)}%</Text>
                            </View>
                        );
                    })}
                </View>

                <AIInsightButton type="classify" data={buildInsightData(result)} />

                <Pressable
                    onPress={() => setResult(null)}
                    style={({ pressed }) => [s.submitBtn, pressed && s.pressed]}
                >
                    <Ionicons name="refresh" size={18} color="#fff" />
                    <Text style={s.submitBtnText}>Classify Again</Text>
                </Pressable>
            </ScrollView>
        );
    }

    // ── Form ─────────────────────────────────────────────────────────────────
    const OptionRow = ({ field, options }: { field: keyof FormData; options: string[] }) => (
        <View style={s.optionRow}>
            {options.map(opt => {
                const active = formData[field] === opt;
                return (
                    <Pressable key={opt} onPress={() => setF(field, opt)}
                        style={[s.optionBtn, active && s.optionBtnActive]}>
                        <Text style={[s.optionText, active && s.optionTextActive]}>{opt}</Text>
                    </Pressable>
                );
            })}
        </View>
    );

    const Scale = ({ field }: { field: keyof FormData }) => (
        <View style={s.scaleRow}>
            {Array.from({ length: 10 }, (_, i) => {
                const val    = i + 1;
                const active = parseInt(formData[field] as string) === val;
                const color  = val <= 3 ? T.green : val <= 6 ? T.amber : T.red;
                return (
                    <Pressable key={val} onPress={() => setF(field, String(val))}
                        style={[s.scaleBtn, active && { backgroundColor: color, borderColor: color }]}>
                        <Text style={[s.scaleBtnText, active && { color: '#fff' }]}>{val}</Text>
                    </Pressable>
                );
            })}
        </View>
    );

    const SYMPTOMS = [
        { key: 'nausea',      label: 'Nausea',               color: T.amber  },
        { key: 'vomit',       label: 'Vomiting',             color: T.red    },
        { key: 'phonophobia', label: 'Sound Sensitivity',    color: T.amber  },
        { key: 'photophobia', label: 'Light Sensitivity',    color: T.amber  },
        { key: 'sensory',     label: 'Sensory Disturbance',  color: T.indigo },
        { key: 'dysphasia',   label: 'Speech Difficulty',    color: T.red    },
        { key: 'dysarthria',  label: 'Slurred Speech',       color: T.red    },
        { key: 'vertigo',     label: 'Vertigo',              color: T.blue   },
        { key: 'tinnitus',    label: 'Ringing in Ears',      color: T.blue   },
        { key: 'hypoacusis',  label: 'Hearing Loss',         color: T.blue   },
        { key: 'diplopia',    label: 'Double Vision',        color: T.indigo },
        { key: 'defect',      label: 'Visual Field Defect',  color: T.indigo },
        { key: 'conscience',  label: 'Loss of Consciousness',color: T.red    },
        { key: 'paresthesia', label: 'Tingling/Numbness',    color: T.sub    },
        { key: 'dpf',         label: 'Family History',       color: T.green  },
    ];

    return (
        <ScrollView style={s.root} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

            <Text style={s.pageTitle}>Migraine Classification</Text>
            <Text style={s.pageSub}>Provide detailed information for accurate classification</Text>

            {/* Basic Information */}
            <View style={s.secHeader}>
                <View style={[s.secDot, { backgroundColor: T.blue }]} />
                <Text style={s.secTitle}>Basic Information</Text>
            </View>
            <View style={s.card}>
                {/* Age */}
                <View style={s.fieldWrap}>
                    <Text style={s.fieldLabel}>Age</Text>
                    <TextInput
                        style={[s.input, errors.age && s.inputError]}
                        placeholder="Enter age in years"
                        placeholderTextColor={T.muted}
                        keyboardType="numeric"
                        value={formData.age}
                        onChangeText={v => { setF('age', v); setErrors(e => ({ ...e, age: undefined })); }}
                    />
                    {errors.age
                        ? <Text style={s.errorText}>{errors.age}</Text>
                        : null}
                </View>
                <View style={s.divider} />

                {/* Duration */}
                <View style={s.fieldWrap}>
                    <Text style={s.fieldLabel}>Duration (0–3 scale)</Text>
                    <TextInput
                        style={[s.input, errors.duration && s.inputError]}
                        placeholder="0=short, 3=prolonged"
                        placeholderTextColor={T.muted}
                        keyboardType="numeric"
                        value={formData.duration}
                        onChangeText={v => { setF('duration', v); setErrors(e => ({ ...e, duration: undefined })); }}
                    />
                    {errors.duration
                        ? <Text style={s.errorText}>{errors.duration}</Text>
                        : <Text style={s.helper}>0=very short · 1=short · 2=moderate · 3=prolonged</Text>}
                </View>
                <View style={s.divider} />

                {/* Frequency */}
                <View style={s.fieldWrap}>
                    <Text style={s.fieldLabel}>Frequency (episodes/month)</Text>
                    <TextInput
                        style={[s.input, errors.frequency && s.inputError]}
                        placeholder="0–7"
                        placeholderTextColor={T.muted}
                        keyboardType="numeric"
                        value={formData.frequency}
                        onChangeText={v => { setF('frequency', v); setErrors(e => ({ ...e, frequency: undefined })); }}
                    />
                    {errors.frequency && <Text style={s.errorText}>{errors.frequency}</Text>}
                </View>
            </View>

            {/* Pain Characteristics */}
            <View style={s.secHeader}>
                <View style={[s.secDot, { backgroundColor: T.red }]} />
                <Text style={s.secTitle}>Pain Characteristics</Text>
            </View>
            <View style={s.card}>
                <View style={s.fieldWrap}>
                    <Text style={s.fieldLabel}>Location</Text>
                    <OptionRow field="location" options={['Unilateral','Bilateral']} />
                </View>
                <View style={s.divider} />

                <View style={s.fieldWrap}>
                    <Text style={s.fieldLabel}>Character</Text>
                    <OptionRow field="character" options={['Throbbing','Non-throbbing']} />
                </View>
                <View style={s.divider} />

                <View style={s.fieldWrap}>
                    <View style={s.fieldLabelRow}>
                        <Text style={s.fieldLabel}>Intensity</Text>
                        <View style={[s.valuePill, {
                            backgroundColor: parseInt(formData.intensity) >= 7 ? T.red + '33' : parseInt(formData.intensity) >= 4 ? T.amber + '33' : T.green + '33',
                            borderColor:     parseInt(formData.intensity) >= 7 ? T.red + '66' : parseInt(formData.intensity) >= 4 ? T.amber + '66' : T.green + '66',
                        }]}>
                            <Text style={{ fontSize: 12, fontWeight: '800', color: parseInt(formData.intensity) >= 7 ? T.red : parseInt(formData.intensity) >= 4 ? T.amber : T.green }}>
                                {formData.intensity}/10
                            </Text>
                        </View>
                    </View>
                    <Scale field="intensity" />
                    {errors.intensity && <Text style={s.errorText}>{errors.intensity}</Text>}
                </View>
            </View>

            {/* Aura */}
            <View style={s.secHeader}>
                <View style={[s.secDot, { backgroundColor: T.indigo }]} />
                <Text style={s.secTitle}>Aura & Visual Symptoms</Text>
            </View>
            <View style={s.card}>
                <View style={s.fieldWrap}>
                    <Text style={s.fieldLabel}>Visual Symptoms</Text>
                    <OptionRow field="visual" options={['No aura','With aura','Other']} />
                </View>
            </View>

            {/* Associated Symptoms */}
            <View style={s.secHeader}>
                <View style={[s.secDot, { backgroundColor: T.amber }]} />
                <Text style={s.secTitle}>Associated Symptoms</Text>
            </View>
            <View style={s.chipWrap}>
                {SYMPTOMS.map(item => {
                    const active = !!formData[item.key as keyof FormData];
                    return (
                        <Pressable
                            key={item.key}
                            onPress={() => toggle(item.key as keyof FormData)}
                            style={[
                                s.symptomChip,
                                active && { backgroundColor: item.color, borderColor: item.color },
                            ]}
                        >
                            <Text style={[s.symptomChipText, active && { color: '#fff', fontWeight: '700' }]}>
                                {item.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>

            <Pressable
                onPress={handleClassify}
                disabled={loading}
                style={({ pressed }) => [s.submitBtn, loading && { opacity: 0.6 }, pressed && s.pressed]}
            >
                {loading
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <>
                        <Ionicons name="analytics" size={18} color="#fff" />
                        <Text style={s.submitBtnText}>Classify Migraine Type</Text>
                      </>}
            </Pressable>

        </ScrollView>
    );
};

const s = StyleSheet.create({
    root:    { flex: 1, backgroundColor: T.bg },
    content: { padding: 16, paddingBottom: 40, gap: 12 },

    pageTitle: { fontSize: 22, fontWeight: '800', color: T.text, marginBottom: 2 },
    pageSub:   { fontSize: 14, color: T.sub },

    secHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
    secDot:    { width: 8, height: 8, borderRadius: 4 },
    secTitle:  { fontSize: 15, fontWeight: '700', color: T.text },

    card:    { backgroundColor: T.card, borderRadius: 18, borderWidth: 1, borderColor: T.border, padding: 16 },
    divider: { height: 1, backgroundColor: T.border, marginVertical: 14 },

    fieldWrap:     { gap: 8 },
    fieldLabel:    { fontSize: 14, fontWeight: '600', color: T.text },
    fieldLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    valuePill:     { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
    helper:        { fontSize: 11, color: T.muted, fontStyle: 'italic' },

    input: {
        backgroundColor: T.cardDeep, borderRadius: 12, borderWidth: 1,
        borderColor: T.border, paddingHorizontal: 14, paddingVertical: 11,
        fontSize: 15, color: T.text, fontWeight: '600',
    },
    inputError: { borderColor: T.red, borderWidth: 2 },
    errorText:  { color: T.red, fontSize: 12, fontWeight: '600' },

    optionRow:       { flexDirection: 'row', gap: 8 },
    optionBtn:       { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: T.cardDeep, borderWidth: 1, borderColor: T.border },
    optionBtnActive: { backgroundColor: T.accent, borderColor: T.accent },
    optionText:      { fontSize: 13, fontWeight: '600', color: T.sub },
    optionTextActive:{ color: '#fff' },

    scaleRow:    { flexDirection: 'row', gap: 4 },
    scaleBtn:    { flex: 1, paddingVertical: 9, borderRadius: 8, alignItems: 'center', backgroundColor: T.cardDeep, borderWidth: 1, borderColor: T.border },
    scaleBtnText:{ fontSize: 12, fontWeight: '700', color: T.muted },

    chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    symptomChip: {
        paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20,
        backgroundColor: T.card, borderWidth: 1, borderColor: T.border,
    },
    symptomChipText: { fontSize: 13, fontWeight: '500', color: T.sub },

    // ── Results ──
    heroCard: {
        backgroundColor: T.card, borderRadius: 20, borderWidth: 1,
        borderColor: T.border, padding: 18,
        flexDirection: 'row', alignItems: 'center', gap: 16,
    },
    heroIconWrap:   { width: 64, height: 64, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    heroRight:      { flex: 1, gap: 8 },
    heroPrediction: { fontSize: 18, fontWeight: '800', color: T.text },
    confPill:       { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
    confPillText:   { fontSize: 12, fontWeight: '700' },

    probRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
    probLabel:   { fontSize: 13, color: T.sub, width: 130, fontWeight: '500' },
    probBarWrap: { flex: 1, height: 6, backgroundColor: T.cardDeep, borderRadius: 3, overflow: 'hidden' },
    probBar:     { height: 6, borderRadius: 3 },
    probValue:   { fontSize: 13, fontWeight: '700', width: 48, textAlign: 'right' },

    submitBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: T.accent, paddingVertical: 15, borderRadius: 14, marginTop: 4 },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    pressed:       { opacity: 0.8, transform: [{ scale: 0.97 }] },
});