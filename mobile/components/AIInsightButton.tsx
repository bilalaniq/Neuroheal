// components/AIInsightButton.tsx
// Reusable "Get AI Insight" button + modal for Classify, Daily Risk, and Sleep Log screens

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Modal,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { getAIResponse } from '@/services/aiService';

export type InsightType = 'sleep' | 'daily_risk' | 'classify';

interface AIInsightButtonProps {
    type: InsightType;
    data: Record<string, any>;
}

// ── Prompt builders ──────────────────────────────────────────────────────────

function buildSleepPrompt(data: Record<string, any>): string {
    return `A migraine patient just completed a sleep quality assessment. Here are the results:

Classification: ${data.classification}
Risk Score: ${(data.risk_score * 100).toFixed(0)}/100

Sleep Metrics Comparison:
- REM Sleep: ${data.metrics_comparison?.rem_percent?.yours?.toFixed(1)}% (Migraine avg: ${data.metrics_comparison?.rem_percent?.migraine_avg?.toFixed(1)}%, Healthy avg: ${data.metrics_comparison?.rem_percent?.healthy_avg?.toFixed(1)}%)
- Deep Sleep: ${data.metrics_comparison?.deep_sleep_percent?.yours?.toFixed(1)}% (Migraine avg: ${data.metrics_comparison?.deep_sleep_percent?.migraine_avg?.toFixed(1)}%, Healthy avg: ${data.metrics_comparison?.deep_sleep_percent?.healthy_avg?.toFixed(1)}%)
- Sleep Onset: ${data.metrics_comparison?.sleep_onset_minutes?.yours?.toFixed(0)} min (Migraine avg: ${data.metrics_comparison?.sleep_onset_minutes?.migraine_avg?.toFixed(0)} min, Healthy avg: ${data.metrics_comparison?.sleep_onset_minutes?.healthy_avg?.toFixed(0)} min)
- Total Sleep: ${(data.metrics_comparison?.total_sleep_minutes?.yours / 60).toFixed(1)}h (Migraine avg: ${(data.metrics_comparison?.total_sleep_minutes?.migraine_avg / 60).toFixed(1)}h, Healthy avg: ${(data.metrics_comparison?.total_sleep_minutes?.healthy_avg / 60).toFixed(1)}h)

Warnings: ${data.warnings?.join(', ') || 'None'}
System Recommendation: ${data.recommendation}

Please provide a detailed, empathetic analysis of these sleep results in the context of migraine management. Cover:
1. What these specific sleep metrics mean for migraine risk
2. Which metrics are most concerning and why
3. Practical, actionable steps to improve their sleep for migraine prevention
4. What sleep hygiene habits are most important for migraine sufferers
Keep your response warm, clear, and structured with short sections.`;
}

function buildDailyRiskPrompt(data: Record<string, any>): string {
    return `A migraine patient completed their daily risk check-in this morning. Here are the results:

Risk Level: ${data.risk_level}
Migraine Predicted: ${data.migraine_predicted ? 'Yes' : 'No'}
Probability: ${(data.probability * 100).toFixed(1)}%

Top Triggers Identified Today:
${data.top_triggers?.map((t: string) => `- ${t}`).join('\n') || 'None identified'}

System Recommendation: ${data.recommendation}

Please provide a detailed, personalised analysis of their risk today. Cover:
1. Why each of their identified triggers increases migraine risk
2. Hour-by-hour or general strategies to get through the day safely
3. Warning signs to watch for during the day
4. What to do immediately if a migraine starts
5. Long-term pattern advice if these triggers are recurring
Keep your tone supportive, practical, and easy to act on.`;
}

function buildClassifyPrompt(data: Record<string, any>): string {
    return `A migraine patient just classified a headache episode. Here is the data:

Migraine Type: ${data.migraine_type || data.classification || 'Unknown'}
Confidence: ${data.confidence ? (data.confidence * 100).toFixed(0) + '%' : 'N/A'}
${data.ihs_classification ? `IHS Classification: ${data.ihs_classification}` : ''}

Symptoms reported: ${Array.isArray(data.symptoms) ? data.symptoms.join(', ') : data.symptoms || 'Not specified'}
${data.pain_location ? `Pain location: ${data.pain_location}` : ''}
${data.duration ? `Duration: ${data.duration}` : ''}
${data.intensity !== undefined ? `Intensity: ${data.intensity}/10` : ''}

${data.key_indicators?.length ? `Key indicators: ${data.key_indicators.join(', ')}` : ''}
${data.differentials?.length ? `Differential diagnoses considered: ${data.differentials.join(', ')}` : ''}
${data.recommendation ? `System recommendation: ${data.recommendation}` : ''}

Please provide a detailed, empathetic explanation of this classification. Cover:
1. What this type of migraine/headache typically involves and what it means for them
2. Why their specific symptoms point to this classification
3. Typical treatment approaches and what tends to work for this type
4. Red flags or symptoms that would mean they should seek urgent care
5. Lifestyle and prevention strategies specific to this migraine type
Keep your response educational, reassuring, and clearly structured.`;
}

function buildPrompt(type: InsightType, data: Record<string, any>): string {
    switch (type) {
        case 'sleep':      return buildSleepPrompt(data);
        case 'daily_risk': return buildDailyRiskPrompt(data);
        case 'classify':   return buildClassifyPrompt(data);
    }
}

const TITLES: Record<InsightType, string> = {
    sleep:      'Sleep Insight',
    daily_risk: 'Daily Risk Insight',
    classify:   'Migraine Classification Insight',
};

const ICONS: Record<InsightType, string> = {
    sleep:      'moon',
    daily_risk: 'sunny',
    classify:   'list',
};

// ── Simple markdown-ish renderer ─────────────────────────────────────────────
function renderInsightText(text: string, darkMode: boolean) {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
        const trimmed = line.trim();

        // Numbered headings: "1. What this means"
        const numberedMatch = trimmed.match(/^(\d+)\.\s+\*?\*?(.+?)\*?\*?$/);
        if (numberedMatch && trimmed.length < 80) {
            return (
                <Text
                    key={idx}
                    style={[
                        insightStyles.heading,
                        darkMode ? { color: '#10b981' } : { color: '#059669' },
                    ]}
                >
                    {numberedMatch[1]}. {numberedMatch[2]}
                </Text>
            );
        }

        // Bold headings: **text** or ## text
        if ((trimmed.startsWith('**') && trimmed.endsWith('**')) || trimmed.startsWith('## ')) {
            const clean = trimmed.replace(/^\*\*|\*\*$|^## /g, '');
            return (
                <Text
                    key={idx}
                    style={[
                        insightStyles.subheading,
                        darkMode ? { color: '#d4e8e0' } : { color: '#2d4a42' },
                    ]}
                >
                    {clean}
                </Text>
            );
        }

        // Bullet points
        if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
            const content = trimmed.slice(2);
            // inline bold within bullet: **word**
            const parts = content.split(/(\*\*[^*]+\*\*)/g);
            return (
                <View key={idx} style={insightStyles.bulletRow}>
                    <Text style={[insightStyles.bullet, darkMode ? { color: '#10b981' } : { color: '#059669' }]}>•</Text>
                    <Text style={[insightStyles.bulletText, darkMode ? { color: '#a8d5c4' } : { color: '#4a7a6e' }]}>
                        {parts.map((part, pi) =>
                            part.startsWith('**') && part.endsWith('**')
                                ? <Text key={pi} style={{ fontWeight: '700', color: darkMode ? '#d4e8e0' : '#2d4a42' }}>{part.slice(2, -2)}</Text>
                                : part
                        )}
                    </Text>
                </View>
            );
        }

        // Empty line → spacer
        if (trimmed === '') {
            return <View key={idx} style={{ height: 6 }} />;
        }

        // Normal paragraph — handle inline bold
        const parts = trimmed.split(/(\*\*[^*]+\*\*)/g);
        return (
            <Text key={idx} style={[insightStyles.paragraph, darkMode ? { color: '#a8d5c4' } : { color: '#4a7a6e' }]}>
                {parts.map((part, pi) =>
                    part.startsWith('**') && part.endsWith('**')
                        ? <Text key={pi} style={{ fontWeight: '700', color: darkMode ? '#d4e8e0' : '#2d4a42' }}>{part.slice(2, -2)}</Text>
                        : part
                )}
            </Text>
        );
    });
}

// ── Main component ────────────────────────────────────────────────────────────

export const AIInsightButton: React.FC<AIInsightButtonProps> = ({ type, data }) => {
    const { darkMode } = useTheme();
    const [visible, setVisible]   = useState(false);
    const [loading, setLoading]   = useState(false);
    const [insight, setInsight]   = useState<string | null>(null);

    const handleOpen = async () => {
        setVisible(true);
        if (insight) return; // already fetched
        setLoading(true);
        try {
            const prompt = buildPrompt(type, data);
            const response = await getAIResponse(prompt);
            setInsight(response);
        } catch (err: any) {
            setVisible(false);
            Alert.alert(
                'AI Insight Unavailable',
                err?.message?.includes('API key')
                    ? 'Please add your Groq API key to get AI insights.'
                    : 'Could not fetch AI insight. Please try again.',
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* ── Trigger Button ── */}
            <Pressable
                onPress={handleOpen}
                style={({ pressed }) => [
                    styles.button,
                    darkMode ? styles.buttonDark : styles.buttonLight,
                    pressed && styles.buttonPressed,
                ]}
            >
                <View style={styles.buttonInner}>
                    <View style={styles.buttonIconWrap}>
                        <Ionicons name="sparkles" size={18} color="#fff" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.buttonTitle}>Get AI Insight</Text>
                        <Text style={[styles.buttonSub, darkMode ? { color: '#a8d5c4' } : { color: '#7fc9b3' }]}>
                            Personalised analysis from NeuroHeal AI
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={darkMode ? '#a8d5c4' : '#7fc9b3'} />
                </View>
            </Pressable>

            {/* ── Modal ── */}
            <Modal
                visible={visible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setVisible(false)}
            >
                <View style={[styles.modal, darkMode ? styles.modalDark : styles.modalLight]}>
                    {/* Header */}
                    <View style={[styles.modalHeader, darkMode ? styles.modalHeaderDark : styles.modalHeaderLight]}>
                        <View style={styles.modalHeaderLeft}>
                            <View style={styles.modalIconWrap}>
                                <Ionicons name={ICONS[type] as any} size={18} color="#10b981" />
                            </View>
                            <View>
                                <Text style={[styles.modalTitle, darkMode ? { color: '#d4e8e0' } : { color: '#2d4a42' }]}>
                                    {TITLES[type]}
                                </Text>
                                <Text style={[styles.modalSub, darkMode ? { color: '#a8d5c4' } : { color: '#7a9f94' }]}>
                                    Powered by NeuroHeal AI
                                </Text>
                            </View>
                        </View>
                        <Pressable onPress={() => setVisible(false)} style={styles.closeBtn}>
                            <Ionicons name="close" size={22} color={darkMode ? '#a8d5c4' : '#7a9f94'} />
                        </Pressable>
                    </View>

                    {/* Body */}
                    <ScrollView
                        style={{ flex: 1 }}
                        contentContainerStyle={styles.modalBody}
                        showsVerticalScrollIndicator={false}
                    >
                        {loading ? (
                            <View style={styles.loadingWrap}>
                                <ActivityIndicator size="large" color="#10b981" />
                                <Text style={[styles.loadingText, darkMode ? { color: '#a8d5c4' } : { color: '#7a9f94' }]}>
                                    Analysing your results…
                                </Text>
                                <Text style={[styles.loadingSub, darkMode ? { color: '#5a8f7f' } : { color: '#b0d4c8' }]}>
                                    NeuroHeal AI is reviewing your data
                                </Text>
                            </View>
                        ) : insight ? (
                            <View style={[styles.insightCard, darkMode ? styles.insightCardDark : styles.insightCardLight]}>
                                <View style={styles.insightHeader}>
                                    <Ionicons name="sparkles" size={16} color="#10b981" />
                                    <Text style={[styles.insightHeaderText, darkMode ? { color: '#10b981' } : { color: '#059669' }]}>
                                        AI Analysis
                                    </Text>
                                </View>
                                {renderInsightText(insight, darkMode)}
                            </View>
                        ) : null}

                        {/* Disclaimer */}
                        {!loading && insight && (
                            <View style={[styles.disclaimer, darkMode ? styles.disclaimerDark : styles.disclaimerLight]}>
                                <Ionicons name="information-circle-outline" size={14} color={darkMode ? '#5a8f7f' : '#b0d4c8'} />
                                <Text style={[styles.disclaimerText, darkMode ? { color: '#5a8f7f' } : { color: '#b0d4c8' }]}>
                                    AI insights are informational only. Always consult a healthcare professional for medical advice.
                                </Text>
                            </View>
                        )}
                    </ScrollView>

                    {/* Footer close button */}
                    {!loading && insight && (
                        <View style={[styles.footer, darkMode ? styles.footerDark : styles.footerLight]}>
                            <Pressable
                                onPress={() => setVisible(false)}
                                style={styles.footerBtn}
                            >
                                <Text style={styles.footerBtnText}>Done</Text>
                            </Pressable>
                        </View>
                    )}
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    // ── Button ──
    button: {
        borderRadius: 14,
        marginBottom: 16,
        borderWidth: 1,
        overflow: 'hidden',
    },
    buttonLight: {
        backgroundColor: '#e8f5f0',
        borderColor: '#a8dcc8',
    },
    buttonDark: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderColor: '#3a7a6a',
    },
    buttonPressed: {
        opacity: 0.8,
    },
    buttonInner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        gap: 12,
    },
    buttonIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#10b981',
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#10b981',
    },
    buttonSub: {
        fontSize: 12,
        marginTop: 1,
    },

    // ── Modal ──
    modal: {
        flex: 1,
    },
    modalLight: { backgroundColor: '#f5f8f7' },
    modalDark:  { backgroundColor: '#1a2522' },

    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    modalHeaderLight: { backgroundColor: '#fff', borderBottomColor: '#d4e8e0' },
    modalHeaderDark:  { backgroundColor: '#253029', borderBottomColor: '#3a5a4e' },
    modalHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    modalIconWrap: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalTitle: { fontSize: 16, fontWeight: '700' },
    modalSub:   { fontSize: 12, marginTop: 1 },

    closeBtn: {
        padding: 6,
        borderRadius: 8,
    },

    modalBody: {
        padding: 20,
        paddingBottom: 32,
    },

    // ── Loading ──
    loadingWrap: {
        alignItems: 'center',
        paddingVertical: 60,
        gap: 14,
    },
    loadingText: { fontSize: 16, fontWeight: '600' },
    loadingSub:  { fontSize: 13 },

    // ── Insight Card ──
    insightCard: {
        borderRadius: 16,
        padding: 18,
        borderWidth: 1,
        marginBottom: 16,
    },
    insightCardLight: { backgroundColor: '#fff', borderColor: '#d4e8e0' },
    insightCardDark:  { backgroundColor: '#253029', borderColor: '#3a5a4e' },

    insightHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 14,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(16, 185, 129, 0.2)',
    },
    insightHeaderText: { fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },

    // ── Rendered text styles ──
    heading: {
        fontSize: 15,
        fontWeight: '700',
        marginTop: 14,
        marginBottom: 6,
    },
    subheading: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 10,
        marginBottom: 4,
    },
    paragraph: {
        fontSize: 14,
        lineHeight: 22,
        marginBottom: 4,
    },
    bulletRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 5,
        paddingLeft: 4,
    },
    bullet: {
        fontSize: 14,
        lineHeight: 22,
        fontWeight: '700',
    },
    bulletText: {
        fontSize: 14,
        lineHeight: 22,
        flex: 1,
    },

    // ── Disclaimer ──
    disclaimer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
    },
    disclaimerLight: { backgroundColor: '#f0faf6', borderColor: '#d4e8e0' },
    disclaimerDark:  { backgroundColor: 'rgba(16, 185, 129, 0.04)', borderColor: '#2a4a3e' },
    disclaimerText: { fontSize: 11, lineHeight: 16, flex: 1 },

    // ── Footer ──
    footer: {
        padding: 16,
        borderTopWidth: 1,
    },
    footerLight: { backgroundColor: '#fff', borderTopColor: '#d4e8e0' },
    footerDark:  { backgroundColor: '#253029', borderTopColor: '#3a5a4e' },
    footerBtn: {
        backgroundColor: '#10b981',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    footerBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

const insightStyles = StyleSheet.create({
    heading:    { fontSize: 15, fontWeight: '700', marginTop: 14, marginBottom: 6 },
    subheading: { fontSize: 14, fontWeight: '600', marginTop: 10, marginBottom: 4 },
    paragraph:  { fontSize: 14, lineHeight: 22, marginBottom: 4 },
    bulletRow:  { flexDirection: 'row', gap: 8, marginBottom: 5, paddingLeft: 4 },
    bullet:     { fontSize: 14, lineHeight: 22, fontWeight: '700' },
    bulletText: { fontSize: 14, lineHeight: 22, flex: 1 },
});