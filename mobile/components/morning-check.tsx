import React, { useState } from 'react';
import {
    View, Text, StyleSheet, Pressable, ScrollView,
    ActivityIndicator, Alert, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@/contexts/UserContext';
import { API_BASE_URL, API_ENDPOINTS, logAPI } from '@/config/api';
import { AIInsightButton } from '@/components/AIInsightButton';

interface MorningCheckProps { onSuccess?: () => void; }

interface TriggerFormData {
    stress_level: string; sleep_hours: string; sleep_quality: string;
    hydration: string; caffeine: string; alcohol_last_night: boolean;
    weather_change: boolean; hormonal_changes: boolean; skipped_meals: boolean;
    irregular_schedule: boolean; bright_lights: boolean; loud_noises: boolean;
    strong_smells: boolean; physical_activity: boolean; eye_strain: boolean;
    neck_tension: boolean; workload: string; medication_taken: boolean;
    missed_medication: boolean; screen_time: string; posture_issues: boolean;
    anxiety_level: string; recent_illness: boolean; dehydration: boolean;
    sugar_consumption: string; magnesium_deficiency: boolean;
}

interface PredictionResult {
    migraine_predicted: boolean; risk_level: string;
    probability: number; top_triggers: string[];
    recommendation: string; timestamp: string;
}

const T = {
    bg: '#000', card: '#231344', cardDeep: '#160a2e', border: '#2b0f4d',
    text: '#fff', sub: '#c4b5fd', muted: '#6b21a8',
    accent: '#6107c9', green: '#34d399', amber: '#fbbf24',
    red: '#f87171', indigo: '#a78bfa', blue: '#60a5fa',
};

export const MorningCheck: React.FC<MorningCheckProps> = ({ onSuccess }) => {
    const { userData } = useUser();
    const [loading, setLoading] = useState(false);
    const [result,  setResult]  = useState<PredictionResult | null>(null);
    const [formData, setFormData] = useState<TriggerFormData>({
        stress_level: '5', sleep_hours: '7', sleep_quality: 'Good',
        hydration: 'Adequate', caffeine: 'Moderate', alcohol_last_night: false,
        weather_change: false, hormonal_changes: false, skipped_meals: false,
        irregular_schedule: false, bright_lights: false, loud_noises: false,
        strong_smells: false, physical_activity: false, eye_strain: false,
        neck_tension: false, workload: 'Normal', medication_taken: false,
        missed_medication: false, screen_time: 'Moderate', posture_issues: false,
        anxiety_level: '5', recent_illness: false, dehydration: false,
        sugar_consumption: 'Normal', magnesium_deficiency: false,
    });

    const setF = (key: keyof TriggerFormData, val: any) =>
        setFormData(prev => ({ ...prev, [key]: val }));
    const toggle = (key: keyof TriggerFormData) =>
        setFormData(prev => ({ ...prev, [key]: !prev[key] }));

    const handlePredict = async () => {
        setLoading(true);
        const endpoint = API_ENDPOINTS.migraineToday;
        const url      = `${API_BASE_URL}${endpoint}`;

        const sleepHoursNum = parseFloat(formData.sleep_hours) || 7;
        const stressRaw     = parseInt(formData.stress_level)  || 5;
        const stress04      = Math.round((stressRaw - 1) / 9 * 4);
        const lackOfSleep   = Math.max(0, 8 - sleepHoursNum);

        const payload: any = {
            cold_air_exposure:         0,
            perfume_or_strong_odors:   formData.strong_smells   ? 2 : 0,
            bright_or_flashing_lights: formData.bright_lights   ? 2 : 0,
            loud_sounds:               formData.loud_noises      ? 2 : 0,
            changing_weather:          formData.weather_change   ? 3 : 0,
            hot_and_humid_weather:     0,
            physical_exertion:         formData.physical_activity ? 2 : 0,
            overslept:                 0,
            lack_of_sleep:             Math.min(4, Math.round(lackOfSleep)),
            stress:                    stress04,
            post_stress_letdown:       0,
            missed_a_meal:             formData.skipped_meals  ? 2 : 0,
            dehydration:               formData.dehydration    ? 2 : 0,
            nightshade_vegetables:     0, smoked_or_cured_meat: 0, bananas: 0,
            caffeine:                  formData.caffeine === 'High' ? 3 : formData.caffeine === 'Moderate' ? 2 : 1,
            citrus_fruit_or_juice:     0,
            beer:                      formData.alcohol_last_night ? 2 : 0,
            aged_or_blue_cheese:       0, chocolate: 0,
            red_wine:                  formData.alcohol_last_night ? 2 : 0,
            liquor_or_spirits:         formData.alcohol_last_night ? 2 : 0,
            sugar_and_sweets:          formData.sugar_consumption === 'High' ? 3 : formData.sugar_consumption === 'Normal' ? 2 : 1,
            prev_day_migraine:         0,
            is_weekend:                new Date().getDay() === 0 || new Date().getDay() === 6 ? 1 : 0,
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

            const sleepHours  = parseFloat(formData.sleep_hours)  || 7;
            const stressLevel = parseInt(formData.stress_level)    || 5;
            const anxietyLevel = parseInt(formData.anxiety_level)  || 5;
            let riskPoints = 0;
            if (sleepHours <= 4)       riskPoints += 3;
            else if (sleepHours <= 6)  riskPoints += 2;
            else if (sleepHours <= 6.5) riskPoints += 1;
            if (stressLevel >= 8)      riskPoints += 2;
            else if (stressLevel >= 6) riskPoints += 1;
            if (anxietyLevel >= 8)     riskPoints += 1;
            if (formData.alcohol_last_night) riskPoints += 2;
            if (formData.skipped_meals)      riskPoints += 1;
            if (formData.dehydration)        riskPoints += 1;
            if (formData.weather_change)     riskPoints += 1;

            const ruleWarnings: string[] = [];
            if (sleepHours <= 4)  ruleWarnings.push(`Only ${sleepHours}h sleep — severe deprivation`);
            else if (sleepHours <= 6) ruleWarnings.push(`Only ${sleepHours}h sleep — below recommended`);
            if (stressLevel >= 6)  ruleWarnings.push(`High stress level (${stressLevel}/10)`);
            if (anxietyLevel >= 6) ruleWarnings.push(`High anxiety level (${anxietyLevel}/10)`);
            if (formData.alcohol_last_night) ruleWarnings.push('Alcohol consumption last night');
            if (formData.dehydration)        ruleWarnings.push('Dehydration reported');
            if (formData.skipped_meals)      ruleWarnings.push('Skipped meals');

            let adjusted = { ...data };
            if (riskPoints >= 4) {
                adjusted.risk_level = 'HIGH'; adjusted.migraine_predicted = true;
                adjusted.probability = Math.max(data.probability, 0.70);
                adjusted.recommendation = 'High risk based on your reported conditions. Rest, stay hydrated, avoid screens and loud environments today.';
            } else if (riskPoints >= 2) {
                adjusted.risk_level = 'MEDIUM';
                adjusted.probability = Math.max(data.probability, 0.40);
                adjusted.recommendation = 'Moderate risk today. Take it easy, stay hydrated and monitor your symptoms.';
            }
            if (ruleWarnings.length > 0)
                adjusted.top_triggers = [...new Set([...ruleWarnings, ...(adjusted.top_triggers || [])])];

            setResult(adjusted);
            onSuccess?.();
        } catch (error: any) {
            logAPI('error', endpoint, error);
            Alert.alert('Error', `Failed to predict migraine risk: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // ── Results ───────────────────────────────────────────────────────────────
    if (result) {
        const riskColor = result.risk_level === 'HIGH' ? T.red : result.risk_level === 'MEDIUM' ? T.amber : T.green;
        const riskIcon  = result.risk_level === 'HIGH' ? 'alert-circle' : result.risk_level === 'MEDIUM' ? 'warning' : 'checkmark-circle';

        return (
            <ScrollView style={s.root} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

                {/* Hero result card */}
                <View style={[s.heroCard, { borderLeftColor: riskColor }]}>
                    <View style={[s.heroIconWrap, { backgroundColor: riskColor + '22', borderColor: riskColor + '55' }]}>
                        <Ionicons name={riskIcon as any} size={36} color={riskColor} />
                    </View>
                    <View style={s.heroRight}>
                        <Text style={[s.heroRisk, { color: riskColor }]}>{result.risk_level} Risk</Text>
                        <Text style={s.heroPct}>{(result.probability * 100).toFixed(1)}% likelihood today</Text>
                        <View style={[s.predictedPill, {
                            backgroundColor: result.migraine_predicted ? T.red + '22' : T.green + '22',
                            borderColor:     result.migraine_predicted ? T.red + '55' : T.green + '55',
                        }]}>
                            <Text style={{ fontSize: 12, fontWeight: '700', color: result.migraine_predicted ? T.red : T.green }}>
                                {result.migraine_predicted ? 'Migraine predicted' : 'No migraine predicted'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Top triggers */}
                {result.top_triggers?.length > 0 && (
                    <>
                        <View style={s.secHeader}>
                            <View style={[s.secDot, { backgroundColor: T.red }]} />
                            <Text style={s.secTitle}>Top Triggers Today</Text>
                        </View>
                        <View style={s.card}>
                            {result.top_triggers.map((t, i) => (
                                <View key={i} style={[s.triggerRow, i > 0 && { borderTopWidth: 1, borderTopColor: T.border }]}>
                                    <View style={s.triggerIconWrap}>
                                        <Ionicons name="alert" size={13} color={T.red} />
                                    </View>
                                    <Text style={s.triggerText}>{t}</Text>
                                </View>
                            ))}
                        </View>
                    </>
                )}

                {/* Recommendation */}
                {result.recommendation && (
                    <>
                        <View style={s.secHeader}>
                            <View style={[s.secDot, { backgroundColor: T.amber }]} />
                            <Text style={s.secTitle}>Recommendation</Text>
                        </View>
                        <View style={s.recommendCard}>
                            <View style={s.recommendIconWrap}>
                                <Ionicons name="bulb" size={20} color={T.amber} />
                            </View>
                            <Text style={s.recommendText}>{result.recommendation}</Text>
                        </View>
                    </>
                )}

                <AIInsightButton type="daily_risk" data={result} />

                <Pressable
                    onPress={() => setResult(null)}
                    style={({ pressed }) => [s.submitBtn, pressed && s.pressed]}
                >
                    <Ionicons name="refresh" size={18} color="#fff" />
                    <Text style={s.submitBtnText}>Check Again</Text>
                </Pressable>
            </ScrollView>
        );
    }

    // ── Form ─────────────────────────────────────────────────────────────────

    // Reusable option row selector
    const OptionRow = ({ field, options }: { field: keyof TriggerFormData; options: string[] }) => (
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

    // Reusable number scale
    const Scale = ({ field, count = 10 }: { field: keyof TriggerFormData; count?: number }) => (
        <View style={s.scaleRow}>
            {Array.from({ length: count }, (_, i) => {
                const val = i + 1;
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

    const TOGGLES = [
        { key: 'bright_lights',      label: 'Bright Lights',        icon: 'sunny',         color: T.amber },
        { key: 'loud_noises',        label: 'Loud Noises',          icon: 'volume-high',   color: T.amber },
        { key: 'strong_smells',      label: 'Strong Smells',        icon: 'flower',        color: T.indigo },
        { key: 'eye_strain',         label: 'Eye Strain',           icon: 'eye',           color: T.blue },
        { key: 'neck_tension',       label: 'Neck Tension',         icon: 'body',          color: T.red },
        { key: 'posture_issues',     label: 'Poor Posture',         icon: 'accessibility', color: T.sub },
        { key: 'skipped_meals',      label: 'Skipped Meals',        icon: 'restaurant',    color: T.amber },
        { key: 'irregular_schedule', label: 'Irregular Schedule',   icon: 'time',          color: T.blue },
        { key: 'weather_change',     label: 'Weather Change',       icon: 'cloud',         color: T.blue },
        { key: 'hormonal_changes',   label: 'Hormonal Changes',     icon: 'fitness',       color: T.indigo },
        { key: 'alcohol_last_night', label: 'Alcohol Last Night',   icon: 'wine',          color: T.red },
        { key: 'recent_illness',     label: 'Recent Illness',       icon: 'medkit',        color: T.red },
        { key: 'magnesium_deficiency',label:'Magnesium Deficiency', icon: 'flask',         color: T.green },
        { key: 'dehydration',        label: 'Dehydration',          icon: 'water',         color: T.blue },
        { key: 'physical_activity',  label: 'Strenuous Activity',   icon: 'barbell',       color: T.green },
    ];

    return (
        <ScrollView style={s.root} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

            <Text style={s.pageTitle}>Morning Risk Check</Text>
            <Text style={s.pageSub}>Check your migraine risk for today</Text>

            {/* Sleep & Rest */}
            <View style={s.secHeader}>
                <View style={[s.secDot, { backgroundColor: T.indigo }]} />
                <Text style={s.secTitle}>Sleep & Rest</Text>
            </View>
            <View style={s.card}>
                <View style={s.fieldWrap}>
                    <Text style={s.fieldLabel}>Hours of Sleep Last Night</Text>
                    <TextInput
                        style={s.input}
                        placeholder="7"
                        placeholderTextColor={T.muted}
                        keyboardType="numeric"
                        value={formData.sleep_hours}
                        onChangeText={v => setF('sleep_hours', v)}
                    />
                    <Text style={s.helper}>Recommended: 7–9 hours</Text>
                </View>
                <View style={s.divider} />
                <View style={s.fieldWrap}>
                    <Text style={s.fieldLabel}>Sleep Quality</Text>
                    <OptionRow field="sleep_quality" options={['Poor','Fair','Good']} />
                </View>
            </View>

            {/* Stress & Mental Health */}
            <View style={s.secHeader}>
                <View style={[s.secDot, { backgroundColor: T.red }]} />
                <Text style={s.secTitle}>Stress & Mental Health</Text>
            </View>
            <View style={s.card}>
                <View style={s.fieldWrap}>
                    <View style={s.fieldLabelRow}>
                        <Text style={s.fieldLabel}>Stress Level</Text>
                        <View style={[s.valuePill, {
                            backgroundColor: parseInt(formData.stress_level) >= 7 ? T.red + '33' : parseInt(formData.stress_level) >= 4 ? T.amber + '33' : T.green + '33',
                            borderColor:     parseInt(formData.stress_level) >= 7 ? T.red + '66' : parseInt(formData.stress_level) >= 4 ? T.amber + '66' : T.green + '66',
                        }]}>
                            <Text style={{ fontSize: 12, fontWeight: '800', color: parseInt(formData.stress_level) >= 7 ? T.red : parseInt(formData.stress_level) >= 4 ? T.amber : T.green }}>
                                {formData.stress_level}/10
                            </Text>
                        </View>
                    </View>
                    <Scale field="stress_level" />
                </View>
                <View style={s.divider} />
                <View style={s.fieldWrap}>
                    <View style={s.fieldLabelRow}>
                        <Text style={s.fieldLabel}>Anxiety Level</Text>
                        <View style={[s.valuePill, {
                            backgroundColor: parseInt(formData.anxiety_level) >= 7 ? T.red + '33' : parseInt(formData.anxiety_level) >= 4 ? T.amber + '33' : T.green + '33',
                            borderColor:     parseInt(formData.anxiety_level) >= 7 ? T.red + '66' : parseInt(formData.anxiety_level) >= 4 ? T.amber + '66' : T.green + '66',
                        }]}>
                            <Text style={{ fontSize: 12, fontWeight: '800', color: parseInt(formData.anxiety_level) >= 7 ? T.red : parseInt(formData.anxiety_level) >= 4 ? T.amber : T.green }}>
                                {formData.anxiety_level}/10
                            </Text>
                        </View>
                    </View>
                    <Scale field="anxiety_level" />
                </View>
            </View>

            {/* Hydration & Nutrition */}
            <View style={s.secHeader}>
                <View style={[s.secDot, { backgroundColor: T.blue }]} />
                <Text style={s.secTitle}>Hydration & Nutrition</Text>
            </View>
            <View style={s.card}>
                <View style={s.fieldWrap}>
                    <Text style={s.fieldLabel}>Hydration Level</Text>
                    <OptionRow field="hydration" options={['Low','Adequate','Excellent']} />
                </View>
                <View style={s.divider} />
                <View style={s.fieldWrap}>
                    <Text style={s.fieldLabel}>Caffeine Intake</Text>
                    <OptionRow field="caffeine" options={['Low','Moderate','High']} />
                </View>
                <View style={s.divider} />
                <View style={s.fieldWrap}>
                    <Text style={s.fieldLabel}>Sugar Consumption</Text>
                    <OptionRow field="sugar_consumption" options={['Low','Normal','High']} />
                </View>
            </View>

            {/* Environment & Habits */}
            <View style={s.secHeader}>
                <View style={[s.secDot, { backgroundColor: T.amber }]} />
                <Text style={s.secTitle}>Environment & Habits</Text>
            </View>
            <View style={s.card}>
                {TOGGLES.map((item, i) => {
                    const active = !!formData[item.key as keyof TriggerFormData];
                    return (
                        <React.Fragment key={item.key}>
                            {i > 0 && <View style={s.divider} />}
                            <Pressable
                                onPress={() => toggle(item.key as keyof TriggerFormData)}
                                style={s.toggleRow}
                            >
                                <View style={[s.toggleIcon, {
                                    backgroundColor: active ? item.color + '22' : T.cardDeep,
                                    borderColor:     active ? item.color + '55' : T.border,
                                }]}>
                                    <Ionicons name={item.icon as any} size={16} color={active ? item.color : T.muted} />
                                </View>
                                <Text style={[s.toggleLabel, active && { color: item.color, fontWeight: '700' }]}>
                                    {item.label}
                                </Text>
                                <View style={[s.checkbox, active && { backgroundColor: T.accent, borderColor: T.accent }]}>
                                    {active && <Ionicons name="checkmark" size={14} color="#fff" />}
                                </View>
                            </Pressable>
                        </React.Fragment>
                    );
                })}
            </View>

            <Pressable
                onPress={handlePredict}
                disabled={loading}
                style={({ pressed }) => [s.submitBtn, loading && { opacity: 0.6 }, pressed && s.pressed]}
            >
                {loading
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <>
                        <Ionicons name="shield-checkmark" size={18} color="#fff" />
                        <Text style={s.submitBtnText}>Check My Risk Today</Text>
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

    card: { backgroundColor: T.card, borderRadius: 18, borderWidth: 1, borderColor: T.border, padding: 16 },
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

    optionRow:       { flexDirection: 'row', gap: 8 },
    optionBtn:       { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: T.cardDeep, borderWidth: 1, borderColor: T.border },
    optionBtnActive: { backgroundColor: T.accent, borderColor: T.accent },
    optionText:      { fontSize: 13, fontWeight: '600', color: T.sub },
    optionTextActive:{ color: '#fff' },

    scaleRow:    { flexDirection: 'row', gap: 4 },
    scaleBtn:    { flex: 1, paddingVertical: 9, borderRadius: 8, alignItems: 'center', backgroundColor: T.cardDeep, borderWidth: 1, borderColor: T.border },
    scaleBtnText:{ fontSize: 12, fontWeight: '700', color: T.muted },

    toggleRow:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
    toggleIcon: { width: 32, height: 32, borderRadius: 9, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    toggleLabel:{ flex: 1, fontSize: 14, fontWeight: '500', color: T.sub },
    checkbox:   { width: 24, height: 24, borderRadius: 7, borderWidth: 1.5, borderColor: T.border, backgroundColor: T.cardDeep, alignItems: 'center', justifyContent: 'center' },

    // ── Results ──
    heroCard: {
        backgroundColor: T.card, borderRadius: 20, borderWidth: 1,
        borderColor: T.border, borderLeftWidth: 4,
        padding: 18, flexDirection: 'row', alignItems: 'center', gap: 16,
    },
    heroIconWrap:  { width: 64, height: 64, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    heroRight:     { flex: 1, gap: 6 },
    heroRisk:      { fontSize: 20, fontWeight: '800' },
    heroPct:       { fontSize: 13, color: T.sub },
    predictedPill: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },

    triggerRow:      { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 10 },
    triggerIconWrap: { width: 24, height: 24, borderRadius: 7, backgroundColor: T.red + '22', borderWidth: 1, borderColor: T.red + '44', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    triggerText:     { fontSize: 13, color: T.sub, flex: 1, lineHeight: 19 },

    recommendCard:    { backgroundColor: T.card, borderRadius: 16, borderWidth: 1, borderColor: T.border, flexDirection: 'row', alignItems: 'flex-start', padding: 16, gap: 12 },
    recommendIconWrap:{ width: 36, height: 36, borderRadius: 10, backgroundColor: T.amber + '22', borderWidth: 1, borderColor: T.amber + '44', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    recommendText:    { fontSize: 14, color: T.sub, flex: 1, lineHeight: 21 },

    submitBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: T.accent, paddingVertical: 15, borderRadius: 14, marginTop: 4 },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    pressed:       { opacity: 0.8, transform: [{ scale: 0.97 }] },
});