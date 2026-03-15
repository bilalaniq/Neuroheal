import React, { useState } from 'react';
import {
    View, Text, StyleSheet, Pressable, ScrollView,
    ActivityIndicator, Alert, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@/contexts/UserContext';
import { API_BASE_URL, API_ENDPOINTS, logAPI } from '@/config/api';
import { AIInsightButton } from '@/components/AIInsightButton';

interface SleepLogProps { onSuccess?: () => void; }

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
        rem_percent:          { yours: number; migraine_avg: number; healthy_avg: number };
        deep_sleep_percent:   { yours: number; migraine_avg: number; healthy_avg: number };
        sleep_onset_minutes:  { yours: number; migraine_avg: number; healthy_avg: number };
        total_sleep_minutes:  { yours: number; migraine_avg: number; healthy_avg: number };
    };
    warnings: string[];
    recommendation: string;
    timestamp: string;
}

// ── Theme tokens ──────────────────────────────────────────────────────────────
const T = {
    bg:         '#000',
    card:       '#231344',
    cardDeep:   '#160a2e',
    border:     '#2b0f4d',
    text:       '#fff',
    sub:        '#c4b5fd',
    muted:      '#6b21a8',
    accent:     '#6107c9',
    green:      '#34d399',
    amber:      '#fbbf24',
    red:        '#f87171',
    indigo:     '#a78bfa',
    blue:       '#60a5fa',
};

export const SleepLog: React.FC<SleepLogProps> = ({ onSuccess }) => {
    const { userData } = useUser();
    const [loading, setLoading] = useState(false);
    const [result,  setResult]  = useState<SleepAssessment | null>(null);
    const [metrics, setMetrics] = useState<SleepMetrics>({
        rem_percentage:        '20',
        deep_sleep_percentage: '15',
        sleep_onset_minutes:   '15',
        total_sleep_hours:     '7',
        wake_percentage:       '5',
        sleep_efficiency:      '85',
        psqi_score:            '',
    });

    const set = (key: keyof SleepMetrics, val: string) =>
        setMetrics(prev => ({ ...prev, [key]: val }));

    const handleAssess = async () => {
        const remValue        = parseFloat(metrics.rem_percentage)        || 20;
        const deepValue       = parseFloat(metrics.deep_sleep_percentage) || 15;
        const totalHours      = parseFloat(metrics.total_sleep_hours)     || 7;
        const onsetMinutes    = parseFloat(metrics.sleep_onset_minutes)   || 15;
        const wakeValue       = parseFloat(metrics.wake_percentage   || '0');
        const efficiencyValue = parseFloat(metrics.sleep_efficiency  || '0');
        const psqiValue       = metrics.psqi_score ? parseFloat(metrics.psqi_score) : undefined;

        setLoading(true);
        const endpoint = API_ENDPOINTS.sleep;
        const url      = `${API_BASE_URL}${endpoint}`;
        const totalSleepMinutes = Math.min(totalHours * 60, 900);

        const payload: any = {
            total_sleep_minutes:  totalSleepMinutes,
            sleep_onset_minutes:  onsetMinutes,
            rem_percent:          remValue,
            deep_sleep_percent:   deepValue,
        };
        if (wakeValue > 0)                              payload.wake_percent      = wakeValue;
        if (efficiencyValue > 0)                        payload.sleep_efficiency  = efficiencyValue;
        if (psqiValue !== undefined && !isNaN(psqiValue)) payload.psqi_score      = psqiValue;

        logAPI('request', endpoint, payload);
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const text = await response.text();
            logAPI('response', endpoint, { status: response.status, body: text });
            if (!response.ok) throw new Error(`HTTP ${response.status}: ${text}`);
            setResult(JSON.parse(text));
            onSuccess?.();
        } catch (error: any) {
            logAPI('error', endpoint, error);
            Alert.alert('Error', `Failed to assess sleep: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // ── Results ───────────────────────────────────────────────────────────────
    if (result) {
        const scoreColor = result.risk_score >= 0.7 ? T.red : result.risk_score >= 0.4 ? T.amber : T.green;
        const classColor = result.classification === 'Migraine-like' ? T.red : T.green;
        const pct        = (result.risk_score * 100).toFixed(0);

        return (
            <ScrollView style={s.root} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

                {/* Score hero */}
                <View style={s.heroCard}>
                    <View style={[s.scoreRing, { borderColor: scoreColor }]}>
                        <Text style={[s.scoreNum, { color: scoreColor }]}>{pct}</Text>
                        <Text style={s.scoreDenom}>/100</Text>
                    </View>
                    <View style={s.heroRight}>
                        <Text style={[s.classification, { color: classColor }]}>{result.classification}</Text>
                        <Text style={s.heroSub}>Sleep Pattern Analysis</Text>
                        <View style={[s.riskPill, { backgroundColor: scoreColor + '22', borderColor: scoreColor + '55' }]}>
                            <Text style={[s.riskPillText, { color: scoreColor }]}>
                                Risk: {result.risk_score >= 0.7 ? 'High' : result.risk_score >= 0.4 ? 'Medium' : 'Low'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Metrics comparison */}
                <View style={s.sectionHeader}>
                    <View style={[s.sectionDot, { backgroundColor: T.indigo }]} />
                    <Text style={s.sectionTitle}>Sleep Metrics Comparison</Text>
                </View>

                <View style={s.card}>
                    {/* Table header */}
                    <View style={[s.tableRow, s.tableHeader]}>
                        {['Metric','You','Migraine','Healthy'].map((h, i) => (
                            <Text key={i} style={[s.tableHeaderText, i === 0 && { textAlign: 'left' }]}>{h}</Text>
                        ))}
                    </View>
                    {[
                        { label: 'REM %',       m: result.metrics_comparison.rem_percent,          fmt: (v: number) => `${v.toFixed(1)}%` },
                        { label: 'Deep %',      m: result.metrics_comparison.deep_sleep_percent,   fmt: (v: number) => `${v.toFixed(1)}%` },
                        { label: 'Onset (min)', m: result.metrics_comparison.sleep_onset_minutes,  fmt: (v: number) => `${v.toFixed(0)}` },
                        { label: 'Total (min)', m: result.metrics_comparison.total_sleep_minutes,  fmt: (v: number) => `${v.toFixed(0)}` },
                    ].map((row, i, arr) => (
                        <View key={i} style={[s.tableRow, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: T.border }]}>
                            <Text style={[s.tableCell, { color: T.sub, textAlign: 'left' }]}>{row.label}</Text>
                            <Text style={[s.tableCell, { color: T.text, fontWeight: '700' }]}>{row.fmt(row.m.yours)}</Text>
                            <Text style={[s.tableCell, { color: T.muted }]}>{row.fmt(row.m.migraine_avg)}</Text>
                            <Text style={[s.tableCell, { color: T.muted }]}>{row.fmt(row.m.healthy_avg)}</Text>
                        </View>
                    ))}
                </View>

                {/* Warnings */}
                {result.warnings?.length > 0 && (
                    <>
                        <View style={s.sectionHeader}>
                            <View style={[s.sectionDot, { backgroundColor: T.red }]} />
                            <Text style={s.sectionTitle}>Issues Found</Text>
                        </View>
                        <View style={s.card}>
                            {result.warnings.map((w, i) => (
                                <View key={i} style={s.warningRow}>
                                    <View style={s.warningIconWrap}>
                                        <Ionicons name="warning" size={14} color={T.red} />
                                    </View>
                                    <Text style={s.warningText}>{w}</Text>
                                </View>
                            ))}
                        </View>
                    </>
                )}

                {/* Recommendation */}
                <View style={s.sectionHeader}>
                    <View style={[s.sectionDot, { backgroundColor: T.green }]} />
                    <Text style={s.sectionTitle}>Recommendation</Text>
                </View>
                <View style={s.recommendCard}>
                    <View style={s.recommendIconWrap}>
                        <Ionicons name="bulb" size={20} color={T.amber} />
                    </View>
                    <Text style={s.recommendText}>{result.recommendation}</Text>
                </View>

                {/* AI insight */}
                <AIInsightButton type="sleep" data={result} />

                <Pressable
                    onPress={() => setResult(null)}
                    style={({ pressed }) => [s.submitBtn, pressed && s.pressed]}
                >
                    <Ionicons name="refresh" size={18} color="#fff" />
                    <Text style={s.submitBtnText}>Assess Again</Text>
                </Pressable>

            </ScrollView>
        );
    }

    // ── Form ─────────────────────────────────────────────────────────────────
    const Field = ({
        label, required, placeholder, unit, helper, value, onChange,
    }: {
        label: string; required?: boolean; placeholder: string;
        unit?: string; helper: string; value: string;
        onChange: (v: string) => void;
    }) => (
        <View style={s.field}>
            <View style={s.fieldHeader}>
                <Text style={s.fieldLabel}>{label}</Text>
                <View style={[s.fieldBadge, required
                    ? { backgroundColor: T.green + '22', borderColor: T.green + '44' }
                    : { backgroundColor: T.muted + '22', borderColor: T.muted + '44' }
                ]}>
                    <Text style={[s.fieldBadgeText, { color: required ? T.green : T.muted }]}>
                        {required ? 'required' : 'optional'}
                    </Text>
                </View>
            </View>
            <View style={s.inputRow}>
                <TextInput
                    style={s.input}
                    placeholder={placeholder}
                    placeholderTextColor={T.muted}
                    keyboardType="numeric"
                    value={value}
                    onChangeText={onChange}
                />
                {unit && <Text style={s.inputUnit}>{unit}</Text>}
            </View>
            <Text style={s.helper}>{helper}</Text>
        </View>
    );

    return (
        <ScrollView style={s.root} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

            {/* Page heading */}
            <Text style={s.pageTitle}>Sleep Assessment</Text>
            <Text style={s.pageSub}>Log your sleep metrics for migraine risk analysis</Text>

            {/* Info banner */}
            <View style={s.infoBanner}>
                <View style={s.infoIconWrap}>
                    <Ionicons name="moon" size={18} color={T.indigo} />
                </View>
                <Text style={s.infoText}>
                    Sleep quality significantly impacts migraine frequency. Poor sleep is a major trigger for many patients.
                </Text>
            </View>

            {/* Required fields */}
            <View style={s.sectionHeader}>
                <View style={[s.sectionDot, { backgroundColor: T.accent }]} />
                <Text style={s.sectionTitle}>Required Metrics</Text>
            </View>

            <View style={s.card}>
                <Field label="REM Sleep"          required placeholder="20" unit="%" value={metrics.rem_percentage}        onChange={v => set('rem_percentage', v)}        helper="Healthy: 20–25%  ·  Migraine avg: 15–18%" />
                <View style={s.divider} />
                <Field label="Deep Sleep"          required placeholder="15" unit="%" value={metrics.deep_sleep_percentage}  onChange={v => set('deep_sleep_percentage', v)}  helper="Healthy: 15–30%  ·  Migraine avg: 10–15%" />
                <View style={s.divider} />
                <Field label="Total Sleep Hours"   required placeholder="7"  unit="hrs" value={metrics.total_sleep_hours}     onChange={v => set('total_sleep_hours', v)}      helper="Target: 7–9 hours for optimal health" />
                <View style={s.divider} />
                <Field label="Sleep Onset Time"             placeholder="15" unit="min" value={metrics.sleep_onset_minutes}   onChange={v => set('sleep_onset_minutes', v)}    helper="Time to fall asleep  ·  10–20 min is normal" />
            </View>

            {/* Optional fields */}
            <View style={s.sectionHeader}>
                <View style={[s.sectionDot, { backgroundColor: T.indigo }]} />
                <Text style={s.sectionTitle}>Additional Metrics</Text>
            </View>

            <View style={s.card}>
                <Field label="Wake Time"        placeholder="5"  unit="%" value={metrics.wake_percentage  ?? ''} onChange={v => set('wake_percentage', v)}   helper="Percentage of time awake during the night" />
                <View style={s.divider} />
                <Field label="Sleep Efficiency" placeholder="85" unit="%" value={metrics.sleep_efficiency  ?? ''} onChange={v => set('sleep_efficiency', v)}  helper="Time asleep ÷ time in bed × 100  ·  85%+ is good" />
                <View style={s.divider} />
                <View style={s.field}>
                    <View style={s.fieldHeader}>
                        <Text style={s.fieldLabel}>PSQI Score</Text>
                        <View style={[s.fieldBadge, { backgroundColor: T.muted + '22', borderColor: T.muted + '44' }]}>
                            <Text style={[s.fieldBadgeText, { color: T.muted }]}>optional</Text>
                        </View>
                    </View>
                    <TextInput
                        style={s.input}
                        placeholder="0–21"
                        placeholderTextColor={T.muted}
                        keyboardType="numeric"
                        value={metrics.psqi_score}
                        onChangeText={v => set('psqi_score', v)}
                    />
                    <Text style={s.helper}>Pittsburgh Sleep Quality Index  ·  lower is better</Text>
                </View>
            </View>

            <Pressable
                onPress={handleAssess}
                disabled={loading}
                style={({ pressed }) => [s.submitBtn, loading && { opacity: 0.6 }, pressed && s.pressed]}
            >
                {loading
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <>
                        <Ionicons name="analytics" size={18} color="#fff" />
                        <Text style={s.submitBtnText}>Assess Sleep Quality</Text>
                      </>}
            </Pressable>

        </ScrollView>
    );
};

const s = StyleSheet.create({
    root:    { flex: 1, backgroundColor: T.bg },
    content: { padding: 16, paddingBottom: 40, gap: 12 },

    // ── Page heading ──
    pageTitle: { fontSize: 22, fontWeight: '800', color: T.text, marginBottom: 2 },
    pageSub:   { fontSize: 14, color: T.sub, marginBottom: 4 },

    // ── Info banner ──
    infoBanner: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 12,
        backgroundColor: T.card, borderRadius: 16, borderWidth: 1,
        borderColor: T.border, padding: 14,
    },
    infoIconWrap: {
        width: 32, height: 32, borderRadius: 9,
        backgroundColor: T.indigo + '22', borderWidth: 1, borderColor: T.indigo + '44',
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    infoText: { fontSize: 13, color: T.sub, lineHeight: 19, flex: 1 },

    // ── Section header ──
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
    sectionDot:    { width: 8, height: 8, borderRadius: 4 },
    sectionTitle:  { fontSize: 15, fontWeight: '700', color: T.text },

    // ── Card ──
    card: {
        backgroundColor: T.card, borderRadius: 18,
        borderWidth: 1, borderColor: T.border, padding: 16, gap: 0,
    },
    divider: { height: 1, backgroundColor: T.border, marginVertical: 14 },

    // ── Field ──
    field:       { gap: 6 },
    fieldHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    fieldLabel:  { fontSize: 14, fontWeight: '600', color: T.text },
    fieldBadge:  { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, borderWidth: 1 },
    fieldBadgeText: { fontSize: 11, fontWeight: '600' },
    inputRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
    input: {
        flex: 1,
        backgroundColor: T.cardDeep, borderRadius: 12,
        borderWidth: 1, borderColor: T.border,
        paddingHorizontal: 14, paddingVertical: 11,
        fontSize: 15, color: T.text, fontWeight: '600',
    },
    inputUnit: { fontSize: 14, fontWeight: '600', color: T.sub, minWidth: 36, textAlign: 'center' },
    helper:    { fontSize: 11, color: T.muted, fontStyle: 'italic' },

    // ── Results: hero ──
    heroCard: {
        backgroundColor: T.card, borderRadius: 20,
        borderWidth: 1, borderColor: T.border,
        padding: 20, flexDirection: 'row', alignItems: 'center', gap: 18,
    },
    scoreRing: {
        width: 80, height: 80, borderRadius: 40, borderWidth: 3,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: T.cardDeep,
    },
    scoreNum:   { fontSize: 28, fontWeight: '800', color: T.text, lineHeight: 32 },
    scoreDenom: { fontSize: 12, color: T.muted },
    heroRight:  { flex: 1, gap: 6 },
    classification: { fontSize: 18, fontWeight: '800' },
    heroSub:        { fontSize: 12, color: T.muted },
    riskPill: {
        alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3,
        borderRadius: 8, borderWidth: 1,
    },
    riskPillText: { fontSize: 12, fontWeight: '700' },

    // ── Results: table ──
    tableRow: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 4 },
    tableHeader: {
        borderBottomWidth: 1, borderBottomColor: T.border,
        marginBottom: 2,
    },
    tableHeaderText: {
        flex: 1, fontSize: 11, fontWeight: '700',
        color: T.muted, textAlign: 'center',
        textTransform: 'uppercase', letterSpacing: 0.4,
    },
    tableCell: { flex: 1, fontSize: 13, textAlign: 'center' },

    // ── Results: warnings ──
    warningRow: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 10,
        paddingVertical: 8,
    },
    warningIconWrap: {
        width: 26, height: 26, borderRadius: 8,
        backgroundColor: T.red + '22', borderWidth: 1, borderColor: T.red + '44',
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    warningText: { fontSize: 13, color: T.sub, flex: 1, lineHeight: 19 },

    // ── Results: recommendation ──
    recommendCard: {
        backgroundColor: T.card, borderRadius: 16,
        borderWidth: 1, borderColor: T.border,
        flexDirection: 'row', alignItems: 'flex-start',
        padding: 16, gap: 12,
    },
    recommendIconWrap: {
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: T.amber + '22', borderWidth: 1, borderColor: T.amber + '44',
        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    recommendText: { fontSize: 14, color: T.sub, flex: 1, lineHeight: 21 },

    // ── Submit button ──
    submitBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, backgroundColor: T.accent,
        paddingVertical: 15, borderRadius: 14, marginTop: 4,
    },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    pressed:       { opacity: 0.8, transform: [{ scale: 0.97 }] },
});