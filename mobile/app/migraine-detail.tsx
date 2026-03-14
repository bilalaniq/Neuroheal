import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Dimensions,
    Pressable,
    ActivityIndicator,
    Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ModernHeader } from '@/components/ModernHeader';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { getAIResponse } from '@/services/aiService';
import { QuickLog } from '@/components/quick-log';

const { width } = Dimensions.get('window');
const maxWidth = Math.min(width - 48, 448);

interface MigraineDayDetail {
    date: string;
    hasMigraine: boolean;
    severity: number;
    intensity: number;
    duration: number;
    duration_category: string;
    triggers: string[];
    note: string;
    symptoms: string[];
    medication: string[];
    medication_effectiveness: number | null;
    relief_methods: string[];
    pain_location: string;
    disability_level: number | null;
    warning_signs_before: boolean;
    warning_description: string;
    timestamp: string;
    // backend ID — present when log came from the server
    id?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const SECTION_META: Record<number, { icon: string; color: string; lightBg: string; darkBg: string }> = {
    1: { icon: 'flash',        color: '#f97316', lightBg: '#fff7ed', darkBg: '#1f1208' },
    2: { icon: 'medkit',       color: '#10b981', lightBg: '#f0fdf4', darkBg: '#071a0f' },
    3: { icon: 'bulb-outline', color: '#8b5cf6', lightBg: '#faf5ff', darkBg: '#130a20' },
    4: { icon: 'eye-outline',  color: '#f59e0b', lightBg: '#fffbeb', darkBg: '#1a1400' },
    5: { icon: 'alert-circle', color: '#ef4444', lightBg: '#fef2f2', darkBg: '#1a0707' },
};

// ─────────────────────────────────────────────────────────────────────────────
// INLINE RICH TEXT
// ─────────────────────────────────────────────────────────────────────────────
function RichInline({ text, style, darkMode }: { text: string; style?: object | object[]; darkMode: boolean }) {
    const parts: { raw: string; type: 'plain' | 'bold' | 'italic' | 'code' }[] = [];
    const re = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`)/g;
    let last = 0, m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
        if (m.index > last) parts.push({ raw: text.slice(last, m.index), type: 'plain' });
        const v = m[0];
        if (v.startsWith('**'))     parts.push({ raw: v.slice(2, -2), type: 'bold' });
        else if (v.startsWith('*')) parts.push({ raw: v.slice(1, -1), type: 'italic' });
        else                         parts.push({ raw: v.slice(1, -1), type: 'code' });
        last = m.index + v.length;
    }
    if (last < text.length) parts.push({ raw: text.slice(last), type: 'plain' });

    return (
        <Text style={style}>
            {parts.map((p, i) => {
                if (p.type === 'bold')   return <Text key={i} style={{ fontWeight: '700', color: darkMode ? '#f1f5f9' : '#111827' }}>{p.raw}</Text>;
                if (p.type === 'italic') return <Text key={i} style={{ fontStyle: 'italic' }}>{p.raw}</Text>;
                if (p.type === 'code')   return <Text key={i} style={{ fontFamily: 'monospace', fontSize: 12, color: darkMode ? '#a78bfa' : '#7c3aed', backgroundColor: darkMode ? '#2d2040' : '#ede9fe' }}>{` ${p.raw} `}</Text>;
                return <Text key={i}>{p.raw}</Text>;
            })}
        </Text>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// MARKDOWN RENDERER
// ─────────────────────────────────────────────────────────────────────────────
type BlockType = 'h1'|'h2'|'h3'|'section_head'|'bullet'|'sub_bullet'|'num_item'|'blockquote'|'divider'|'paragraph'|'spacer';
interface Block { type: BlockType; text: string; secNum?: number; listNum?: number }
interface Section { head: Block | null; children: Block[] }

function parseBlocks(raw: string): Block[] {
    const out: Block[] = [];
    for (const line of raw.split('\n')) {
        const t = line.trimEnd();
        if (!t.trim())                    { out.push({ type: 'spacer',    text: '' }); continue; }
        if (/^[-*_]{3,}$/.test(t.trim())) { out.push({ type: 'divider',   text: '' }); continue; }
        if (t.startsWith('# '))           { out.push({ type: 'h1',        text: t.slice(2).replace(/\*\*/g,'').trim() }); continue; }
        if (t.startsWith('## '))          { out.push({ type: 'h2',        text: t.slice(3).replace(/\*\*/g,'').trim() }); continue; }
        if (t.startsWith('### '))         { out.push({ type: 'h3',        text: t.slice(4).replace(/\*\*/g,'').trim() }); continue; }
        const secM = t.match(/^(\d+)\.\s+\*\*(.+?)\*\*\s*(.*)$/);
        if (secM) { out.push({ type: 'section_head', text: (secM[2] + (secM[3] ? ' '+secM[3] : '')).trim(), secNum: +secM[1] }); continue; }
        if (t.startsWith('> '))           { out.push({ type: 'blockquote', text: t.slice(2) }); continue; }
        const subB = t.match(/^[ \t]{2,}[-*+]\s+(.+)$/);
        if (subB)                         { out.push({ type: 'sub_bullet', text: subB[1] }); continue; }
        const topB = t.match(/^[-*+]\s+(.+)$/);
        if (topB)                         { out.push({ type: 'bullet',     text: topB[1] }); continue; }
        const numI = t.match(/^(\d+)\.\s+(.+)$/);
        if (numI && !t.match(/^(\d+)\.\s+\*\*/)) { out.push({ type: 'num_item', text: numI[2], listNum: +numI[1] }); continue; }
        if (/^\*\*[^*]+\*\*[:.!]?$/.test(t.trim())) { out.push({ type: 'h3', text: t.trim().replace(/\*\*/g,'') }); continue; }
        out.push({ type: 'paragraph', text: t });
    }
    return out;
}

function groupSections(blocks: Block[]): Section[] {
    const sections: Section[] = [];
    let cur: Section = { head: null, children: [] };
    for (const b of blocks) {
        if (b.type === 'section_head') { if (cur.head || cur.children.length) sections.push(cur); cur = { head: b, children: [] }; }
        else cur.children.push(b);
    }
    if (cur.head || cur.children.length) sections.push(cur);
    return sections;
}

function AiMarkdown({ text, darkMode }: { text: string; darkMode: boolean }) {
    const sections = groupSections(parseBlocks(text));
    const tc   = darkMode ? '#f1f5f9' : '#0f172a';
    const sub  = darkMode ? '#94a3b8' : '#64748b';
    const bord = darkMode ? '#334155' : '#e2e8f0';

    const renderChildren = (children: Block[], accentColor: string) =>
        children.map((b, i) => {
            if (b.type === 'spacer')      return <View key={i} style={{ height: 4 }} />;
            if (b.type === 'divider')     return <View key={i} style={[mdStyles.divider, { backgroundColor: bord }]} />;
            if (b.type === 'h1')          return <Text key={i} style={[mdStyles.h1, { color: tc }]}>{b.text}</Text>;
            if (b.type === 'h2')          return <Text key={i} style={[mdStyles.h2, { color: tc }]}>{b.text}</Text>;
            if (b.type === 'h3')          return <Text key={i} style={[mdStyles.h3, { color: accentColor }]}>{b.text}</Text>;
            if (b.type === 'blockquote')  return (
                <View key={i} style={[mdStyles.blockquote, { backgroundColor: darkMode ? '#1e293b' : '#f8fafc', borderLeftColor: accentColor }]}>
                    <RichInline text={b.text} style={[mdStyles.blockquoteText, { color: darkMode ? '#93c5fd' : '#1d4ed8' }]} darkMode={darkMode} />
                </View>
            );
            if (b.type === 'bullet')      return (
                <View key={i} style={mdStyles.bulletRow}>
                    <View style={[mdStyles.bulletDot, { backgroundColor: accentColor }]} />
                    <RichInline text={b.text} style={[mdStyles.bulletText, { color: sub }]} darkMode={darkMode} />
                </View>
            );
            if (b.type === 'sub_bullet')  return (
                <View key={i} style={[mdStyles.bulletRow, { paddingLeft: 22 }]}>
                    <View style={[mdStyles.subBulletDot, { borderColor: accentColor }]} />
                    <RichInline text={b.text} style={[mdStyles.bulletText, { color: sub, fontSize: 12 }]} darkMode={darkMode} />
                </View>
            );
            if (b.type === 'num_item')    return (
                <View key={i} style={mdStyles.numRow}>
                    <View style={[mdStyles.numBadge, { backgroundColor: accentColor }]}>
                        <Text style={mdStyles.numBadgeText}>{b.listNum}</Text>
                    </View>
                    <RichInline text={b.text} style={[mdStyles.bulletText, { color: sub }]} darkMode={darkMode} />
                </View>
            );
            return <RichInline key={i} text={b.text} style={[mdStyles.paragraph, { color: sub }]} darkMode={darkMode} />;
        });

    return (
        <View style={{ gap: 6 }}>
            {sections.map((sec, si) => {
                const meta   = sec.head?.secNum ? (SECTION_META[sec.head.secNum] ?? null) : null;
                const accent = meta?.color ?? '#10b981';
                const inner  = renderChildren(sec.children, accent);
                if (meta && sec.head) {
                    return (
                        <View key={si} style={[mdStyles.sectionCard, { backgroundColor: darkMode ? meta.darkBg : meta.lightBg, borderColor: accent + '50' }]}>
                            <View style={mdStyles.sectionTitleRow}>
                                <View style={[mdStyles.sectionIconWrap, { backgroundColor: accent + '22' }]}>
                                    <Ionicons name={meta.icon as any} size={15} color={accent} />
                                </View>
                                <Text style={[mdStyles.sectionTitle, { color: accent }]}>{sec.head.secNum}. {sec.head.text}</Text>
                            </View>
                            <View style={[mdStyles.sectionDivider, { backgroundColor: accent + '30' }]} />
                            <View style={{ gap: 4 }}>{inner}</View>
                        </View>
                    );
                }
                return <View key={si} style={{ gap: 4 }}>{inner}</View>;
            })}
        </View>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROMPT BUILDER
// ─────────────────────────────────────────────────────────────────────────────
function buildAnalysisPrompt(d: MigraineDayDetail): string {
    const sevLabels = ['None','Mild','Moderate','Severe','Extreme'];
    const effLabels = ['No relief','Slight relief','Moderate relief','Good relief','Full relief'];
    const disLabels = ['No impact','Mild impact','Moderate impact','Severe impact','Required bed rest'];
    const lines = [
        `Migraine episode logged on ${d.date}.`,
        `Severity: ${sevLabels[d.severity] ?? 'Unknown'} (${d.severity}/4)`,
        d.intensity   != null ? `Pain intensity: ${d.intensity}/10` : null,
        `Duration: ${d.duration_category || `${d.duration} hours`}`,
        d.pain_location            ? `Pain location: ${d.pain_location}` : null,
        d.disability_level != null ? `Daily impact: ${disLabels[d.disability_level]}` : null,
        d.triggers?.length         ? `Triggers identified: ${d.triggers.join(', ')}` : 'No triggers identified.',
        d.symptoms?.length         ? `Symptoms: ${d.symptoms.join(', ')}` : 'No symptoms recorded.',
        d.warning_signs_before     ? `Aura/warning signs: ${d.warning_description || 'Present (no description)'}` : 'No aura or warning signs.',
        d.medication?.length
            ? `Medications: ${d.medication.join(', ')}` + (d.medication_effectiveness != null ? ` — Effectiveness: ${effLabels[d.medication_effectiveness]}` : '')
            : 'No medication taken.',
        d.relief_methods?.length   ? `Relief methods: ${d.relief_methods.join(', ')}` : null,
        d.note                     ? `Patient notes: "${d.note}"` : null,
    ].filter(Boolean);
    return (
        `Here is a migraine episode log:\n\n${lines.join('\n')}\n\n` +
        `Provide a structured analysis using EXACTLY this format:\n\n` +
        `1. **What Likely Triggered This Episode**\n- finding\n- finding\n\n` +
        `2. **Treatment Effectiveness**\n- finding\n- finding\n\n` +
        `3. **Recommendations for Next Time**\n- recommendation\n- recommendation\n\n` +
        `4. **Warning Sign Awareness**\n- guidance\n\n` +
        `5. **When to Seek Medical Advice**\n- flag\n\n` +
        `Keep each bullet to 1–2 sentences. Be empathetic and specific to the data.`
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────────────────────────────
export default function MigraineDetailScreen() {
    const router    = useRouter();
    const { darkMode } = useTheme();
    const params    = useLocalSearchParams();

    const [dayDetail,    setDayDetail]    = useState<MigraineDayDetail | null>(null);
    const [aiAnalysis,   setAiAnalysis]   = useState<string | null>(null);
    const [aiLoading,    setAiLoading]    = useState(false);
    const [aiError,      setAiError]      = useState<string | null>(null);
    const [aiExpanded,   setAiExpanded]   = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);

    useEffect(() => {
        if (params.data) {
            try { setDayDetail(JSON.parse(params.data as string)); }
            catch (e) { console.error('Failed to parse migraine data:', e); }
        }
    }, [params.data]);

    const fetchAiAnalysis = async () => {
        if (!dayDetail?.hasMigraine) return;
        setAiLoading(true); setAiError(null); setAiExpanded(true);
        try {
            const res = await getAIResponse(buildAnalysisPrompt(dayDetail), []);
            setAiAnalysis(res);
        } catch (err: any) {
            setAiError(err?.message ?? 'Could not get AI analysis. Please try again.');
        } finally { setAiLoading(false); }
    };

    const getSeverityColor = (s: number) => (['#10b981','#fbbf24','#f97316','#ef4444','#7c2d12'] as const)[s] ?? '#cbd5e1';
    const getSeverityLabel = (s: number) => (['None','Mild','Moderate','Severe','Extreme'] as const)[s] ?? 'Unknown';
    const getEffectivenessLabel = (v: number) => (['No relief','Slight','Moderate','Good','Full relief'] as const)[v] ?? 'Unknown';
    const getDisabilityLabel = (v: number) => (['No impact','Mild impact','Moderate impact','Severe impact','Bed rest'] as const)[v] ?? 'Unknown';

    const formatDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const formatTime = (ts: string) => { if (!ts) return null; try { return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); } catch { return null; } };

    const c = {
        text:       darkMode ? '#f3f4f6' : '#111827',
        sub:        darkMode ? '#9ca3af' : '#6b7280',
        card:       darkMode ? '#1f2937' : '#ffffff',
        cardBorder: darkMode ? '#374151' : '#e5e7eb',
        tagBg:      darkMode ? '#374151' : '#f1f5f9',
        tagText:    darkMode ? '#d1d5db' : '#374151',
    };

    if (!dayDetail) {
        return (
            <View style={[styles.container, darkMode && styles.containerDark]}>
                <ModernHeader title="Migraine Details" onBack={() => router.back()} />
                <View style={styles.centerContent}><Text style={{ color: c.text }}>Loading details...</Text></View>
            </View>
        );
    }

    const severityColor = getSeverityColor(dayDetail.severity);
    const loggedTime    = formatTime(dayDetail.timestamp);

    // Build the editingLog object for QuickLog
    const editingLogPayload = dayDetail.id ? {
        id:                      dayDetail.id,
        intensity:               dayDetail.intensity ?? dayDetail.severity * 2,
        symptoms:                dayDetail.symptoms ?? [],
        triggers:                dayDetail.triggers ?? [],
        medication:              dayDetail.medication ?? [],
        medication_effectiveness: dayDetail.medication_effectiveness ?? null,
        relief_methods:          dayDetail.relief_methods ?? [],
        pain_location:           dayDetail.pain_location ?? '',
        duration_category:       dayDetail.duration_category ?? '',
        warning_signs_before:    dayDetail.warning_signs_before ?? false,
        warning_description:     dayDetail.warning_description ?? '',
        notes:                   dayDetail.note ?? '',
    } : null;

    const Card = ({ children }: { children: React.ReactNode }) => (
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.cardBorder }]}>{children}</View>
    );
    const CardHeader = ({ icon, iconColor, title }: { icon: string; iconColor: string; title: string }) => (
        <View style={styles.cardHeader}>
            <Ionicons name={icon as any} size={22} color={iconColor} />
            <Text style={[styles.cardTitle, { color: c.text }]}>{title}</Text>
        </View>
    );
    const TagList = ({ items, color }: { items: string[]; color?: string }) => (
        <View style={styles.tagContainer}>
            {items.map((item, i) => (
                <View key={i} style={[styles.tag, { backgroundColor: color ?? c.tagBg }]}>
                    <Text style={[styles.tagText, { color: color ? '#fff' : c.tagText }]}>{item}</Text>
                </View>
            ))}
        </View>
    );
    const InfoRow = ({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) => (
        <View style={[styles.infoRow, { borderBottomColor: c.cardBorder }]}>
            <Text style={[styles.infoLabel, { color: c.sub }]}>{label}</Text>
            <Text style={[styles.infoValue, { color: valueColor ?? c.text }]}>{value}</Text>
        </View>
    );

    return (
        <View style={[styles.container, darkMode && styles.containerDark]}>

            {/* ── Edit modal ────────────────────────────────────────────────── */}
            <Modal
                visible={editModalOpen}
                animationType="slide"
                onRequestClose={() => setEditModalOpen(false)}
            >
                <QuickLog
                    editingLog={editingLogPayload}
                    onCancelEdit={() => setEditModalOpen(false)}
                    onSuccess={() => {
                        setEditModalOpen(false);
                        // Optionally navigate back so calendar refreshes
                        router.back();
                    }}
                />
            </Modal>

            {/* ── Header with Edit button ───────────────────────────────────── */}
            <ModernHeader
                title="Migraine Details"
                onBack={() => router.back()}
                rightElement={
                    dayDetail.hasMigraine ? (
                        <Pressable
                            onPress={() => setEditModalOpen(true)}
                            style={[styles.editBtn, { backgroundColor: darkMode ? '#253029' : '#f0fdf4', borderColor: darkMode ? '#3a5a50' : '#86efac' }]}
                        >
                            <Ionicons name="create-outline" size={16} color="#10b981" />
                            <Text style={styles.editBtnText}>Edit</Text>
                        </Pressable>
                    ) : undefined
                }
            />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={[styles.content, { maxWidth }]}>

                    {/* ── DATE HEADER ──────────────────────────────────────── */}
                    <View style={[styles.headerCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
                        <View style={[styles.dateCircle, { backgroundColor: dayDetail.hasMigraine ? severityColor : '#10b981' }]}>
                            <Ionicons name={dayDetail.hasMigraine ? 'alert-circle' : 'checkmark-circle'} size={44} color="#fff" />
                        </View>
                        <View style={styles.headerInfo}>
                            <Text style={[styles.dateText, { color: c.text }]}>{formatDate(dayDetail.date)}</Text>
                            {loggedTime && <Text style={[styles.timeText, { color: c.sub }]}>Logged at {loggedTime}</Text>}
                            <Text style={[styles.severityBadge, { backgroundColor: dayDetail.hasMigraine ? severityColor : '#10b981' }]}>
                                {dayDetail.hasMigraine ? `${getSeverityLabel(dayDetail.severity)} Migraine` : 'No Migraine'}
                            </Text>
                        </View>
                    </View>

                    {dayDetail.hasMigraine ? (
                        <>
                            {/* ── QUICK STATS ──────────────────────────────── */}
                            <View style={styles.statsRow}>
                                <View style={[styles.statBox, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
                                    <Text style={[styles.statValue, { color: severityColor }]}>{dayDetail.intensity ?? dayDetail.severity ?? '—'}/10</Text>
                                    <Text style={[styles.statLabel, { color: c.sub }]}>Intensity</Text>
                                </View>
                                <View style={[styles.statBox, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
                                    <Text style={[styles.statValue, { color: '#f97316' }]}>{dayDetail.duration_category || (dayDetail.duration ? `${dayDetail.duration}h` : '—')}</Text>
                                    <Text style={[styles.statLabel, { color: c.sub }]}>Duration</Text>
                                </View>
                                <View style={[styles.statBox, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
                                    <Text style={[styles.statValue, { color: '#8b5cf6' }]}>
                                        {dayDetail.disability_level != null ? getDisabilityLabel(dayDetail.disability_level).split(' ')[0] : '—'}
                                    </Text>
                                    <Text style={[styles.statLabel, { color: c.sub }]}>Impact</Text>
                                </View>
                            </View>

                            {/* ── AI ANALYSIS CARD ─────────────────────────── */}
                            <View style={[styles.aiCard, { backgroundColor: darkMode ? '#071a0f' : '#f0fdf4', borderColor: darkMode ? '#14532d' : '#86efac' }]}>
                                <Pressable
                                    onPress={() => { if (!aiAnalysis && !aiLoading) fetchAiAnalysis(); else setAiExpanded(p => !p); }}
                                    style={styles.aiHeaderRow}
                                >
                                    <View style={[styles.aiIconWrap, { backgroundColor: darkMode ? '#14532d' : '#dcfce7' }]}>
                                        <Ionicons name="sparkles" size={20} color="#10b981" />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.aiTitle, { color: c.text }]}>NeuroHeal AI Analysis</Text>
                                        <Text style={[styles.aiSubtitle, { color: c.sub }]}>
                                            {aiLoading ? 'Analysing your episode…' : aiAnalysis ? (aiExpanded ? 'Tap to collapse' : 'Tap to expand') : 'Tap for personalised AI insights'}
                                        </Text>
                                    </View>
                                    {aiLoading
                                        ? <ActivityIndicator size="small" color="#10b981" />
                                        : <View style={[styles.aiChevron, { backgroundColor: darkMode ? '#14532d' : '#dcfce7' }]}>
                                            <Ionicons name={aiExpanded && aiAnalysis ? 'chevron-up' : 'chevron-down'} size={16} color="#10b981" />
                                          </View>
                                    }
                                </Pressable>

                                {aiLoading && (
                                    <View style={[styles.aiSkeletonBox, { borderTopColor: darkMode ? '#14532d' : '#86efac' }]}>
                                        {[75,55,85,45,65,80,40].map((w, i) => (
                                            <View key={i} style={[styles.aiSkeletonLine, { width: `${w}%`, backgroundColor: darkMode ? '#14532d' : '#bbf7d0' }, i % 3 === 0 && { marginTop: 8 }]} />
                                        ))}
                                    </View>
                                )}

                                {aiError && !aiLoading && (
                                    <View style={[styles.aiErrorBox, { borderTopColor: darkMode ? '#14532d' : '#86efac' }]}>
                                        <Ionicons name="warning-outline" size={18} color="#f97316" />
                                        <Text style={[styles.aiErrorText, { color: c.sub }]}>{aiError}</Text>
                                        <Pressable onPress={fetchAiAnalysis} style={styles.retryBtn}>
                                            <Ionicons name="refresh" size={13} color="#fff" />
                                            <Text style={styles.retryBtnText}>Retry</Text>
                                        </Pressable>
                                    </View>
                                )}

                                {aiAnalysis && aiExpanded && !aiLoading && (
                                    <View style={[styles.aiBody, { borderTopColor: darkMode ? '#14532d' : '#86efac' }]}>
                                        <AiMarkdown text={aiAnalysis} darkMode={darkMode} />
                                        <View style={[styles.aiFooter, { borderTopColor: darkMode ? '#14532d' : '#86efac' }]}>
                                            <Text style={[styles.aiDisclaimer, { color: c.sub }]}>⚠️ For informational purposes only. Always consult your doctor.</Text>
                                            <Pressable onPress={fetchAiAnalysis} style={styles.reRunBtn}>
                                                <Ionicons name="refresh" size={12} color="#10b981" />
                                                <Text style={styles.reRunText}>Re-analyse</Text>
                                            </Pressable>
                                        </View>
                                    </View>
                                )}
                            </View>

                            {/* ── EPISODE DETAILS ──────────────────────────── */}
                            <Card>
                                <CardHeader icon="pulse" iconColor={severityColor} title="Episode Details" />
                                <View style={[styles.severityBar, { backgroundColor: darkMode ? '#374151' : '#e5e7eb' }]}>
                                    <View style={[styles.severityFill, { width: `${((dayDetail.intensity ?? dayDetail.severity ?? 0) / 10) * 100}%`, backgroundColor: severityColor }]} />
                                </View>
                                <InfoRow label="Severity" value={`${getSeverityLabel(dayDetail.severity)} (${dayDetail.severity}/4)`} valueColor={severityColor} />
                                {dayDetail.intensity != null && <InfoRow label="Intensity" value={`${dayDetail.intensity}/10`} valueColor={severityColor} />}
                                <InfoRow label="Duration" value={dayDetail.duration_category || `${dayDetail.duration} hours`} />
                                {dayDetail.pain_location ? <InfoRow label="Location" value={dayDetail.pain_location} /> : null}
                                {dayDetail.disability_level != null && <InfoRow label="Daily Impact" value={getDisabilityLabel(dayDetail.disability_level)} />}
                            </Card>

                            {dayDetail.warning_signs_before && (
                                <Card>
                                    <CardHeader icon="warning" iconColor="#f59e0b" title="Warning Signs / Aura" />
                                    <Text style={[styles.noteText, { color: c.sub }]}>{dayDetail.warning_description || 'Warning signs were present before this episode.'}</Text>
                                </Card>
                            )}

                            {dayDetail.symptoms?.length > 0 && (
                                <Card><CardHeader icon="body" iconColor="#f97316" title="Symptoms" /><TagList items={dayDetail.symptoms} /></Card>
                            )}
                            {dayDetail.triggers?.length > 0 && (
                                <Card><CardHeader icon="flash" iconColor="#f97316" title="Possible Triggers" /><TagList items={dayDetail.triggers} color="#f97316" /></Card>
                            )}
                            {dayDetail.medication?.length > 0 && (
                                <Card>
                                    <CardHeader icon="medkit" iconColor="#10b981" title="Medication" />
                                    <TagList items={dayDetail.medication} color="#10b981" />
                                    {dayDetail.medication_effectiveness != null && (
                                        <View style={styles.effectivenessRow}>
                                            <Text style={[styles.infoLabel, { color: c.sub }]}>Effectiveness</Text>
                                            <View style={styles.effectivenessStars}>
                                                {[0,1,2,3,4].map(i => (
                                                    <Ionicons key={i} name="ellipse" size={12}
                                                        color={i <= (dayDetail.medication_effectiveness ?? -1) ? '#10b981' : (darkMode ? '#374151' : '#e5e7eb')}
                                                        style={{ marginRight: 3 }}
                                                    />
                                                ))}
                                                <Text style={[styles.effectivenessLabel, { color: '#10b981' }]}>{getEffectivenessLabel(dayDetail.medication_effectiveness!)}</Text>
                                            </View>
                                        </View>
                                    )}
                                </Card>
                            )}
                            {dayDetail.relief_methods?.length > 0 && (
                                <Card><CardHeader icon="leaf" iconColor="#10b981" title="Relief Methods" /><TagList items={dayDetail.relief_methods} /></Card>
                            )}
                            {dayDetail.note ? (
                                <Card><CardHeader icon="document-text" iconColor="#8b5cf6" title="Notes" /><Text style={[styles.noteText, { color: c.sub }]}>{dayDetail.note}</Text></Card>
                            ) : null}
                        </>
                    ) : (
                        <View style={[styles.noMigraineCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
                            <Ionicons name="checkmark-circle" size={64} color="#10b981" />
                            <Text style={[styles.noMigraineTitle, { color: c.text }]}>No Migraine</Text>
                            <Text style={[styles.noMigraineText, { color: c.sub }]}>Great day! No migraine activity recorded for this date.</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
const mdStyles = StyleSheet.create({
    h1: { fontSize: 19, fontWeight: '800', marginTop: 10, marginBottom: 6, letterSpacing: -0.4 },
    h2: { fontSize: 16, fontWeight: '700', marginTop: 8,  marginBottom: 4 },
    h3: { fontSize: 13, fontWeight: '700', marginTop: 6,  marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.4 },
    sectionCard:     { borderRadius: 14, borderWidth: 1.5, padding: 14, marginVertical: 4, gap: 6 },
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    sectionIconWrap: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    sectionTitle:    { flex: 1, fontSize: 13, fontWeight: '700', letterSpacing: 0.1 },
    sectionDivider:  { height: 1, marginVertical: 2 },
    bulletRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginVertical: 2 },
    bulletDot:       { width: 7, height: 7, borderRadius: 4, marginTop: 7, flexShrink: 0 },
    subBulletDot:    { width: 6, height: 6, borderRadius: 3, borderWidth: 1.5, marginTop: 7, flexShrink: 0, backgroundColor: 'transparent' },
    bulletText:      { flex: 1, fontSize: 13, lineHeight: 21 },
    numRow:          { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginVertical: 2 },
    numBadge:        { width: 21, height: 21, borderRadius: 11, justifyContent: 'center', alignItems: 'center', flexShrink: 0, marginTop: 1 },
    numBadgeText:    { fontSize: 11, fontWeight: '800', color: '#fff' },
    blockquote:      { borderLeftWidth: 3, paddingLeft: 12, paddingVertical: 8, borderRadius: 4, marginVertical: 4 },
    blockquoteText:  { fontSize: 13, lineHeight: 20, fontStyle: 'italic' },
    divider:         { height: 1, marginVertical: 10 },
    paragraph:       { fontSize: 13, lineHeight: 21, marginVertical: 2 },
});

const styles = StyleSheet.create({
    container:     { flex: 1, backgroundColor: '#f5f8f7' },
    containerDark: { backgroundColor: '#1a2622' },
    scrollContent: { padding: 24, paddingTop: 12, paddingBottom: 40 },
    content:       { width: '100%', alignSelf: 'center' },
    centerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    // Edit button in header
    editBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 12, paddingVertical: 7,
        borderRadius: 10, borderWidth: 1,
    },
    editBtnText: { fontSize: 13, fontWeight: '700', color: '#10b981' },

    headerCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
    dateCircle:  { width: 76, height: 76, borderRadius: 38, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    headerInfo:  { flex: 1, gap: 6 },
    dateText:    { fontSize: 16, fontWeight: '700' },
    timeText:    { fontSize: 12 },
    severityBadge: { fontSize: 13, fontWeight: '600', color: '#fff', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12, overflow: 'hidden', alignSelf: 'flex-start' },

    statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    statBox:  { flex: 1, borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1 },
    statValue:{ fontSize: 18, fontWeight: '800', marginBottom: 4 },
    statLabel:{ fontSize: 11, fontWeight: '500' },

    aiCard:      { borderRadius: 20, borderWidth: 1.5, marginBottom: 16, overflow: 'hidden' },
    aiHeaderRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
    aiIconWrap:  { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    aiChevron:   { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    aiTitle:     { fontSize: 15, fontWeight: '700', marginBottom: 2 },
    aiSubtitle:  { fontSize: 12 },
    aiSkeletonBox:  { padding: 16, borderTopWidth: 1, gap: 8 },
    aiSkeletonLine: { height: 9, borderRadius: 5 },
    aiErrorBox:  { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 16, borderTopWidth: 1 },
    aiErrorText: { flex: 1, fontSize: 13, lineHeight: 19 },
    retryBtn:    { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#f97316', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 9 },
    retryBtnText:{ fontSize: 12, color: '#fff', fontWeight: '600' },
    aiBody:      { padding: 16, borderTopWidth: 1, gap: 6 },
    aiFooter:    { marginTop: 14, paddingTop: 12, borderTopWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
    aiDisclaimer:{ flex: 1, fontSize: 11, lineHeight: 16, fontStyle: 'italic' },
    reRunBtn:    { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: '#10b981', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
    reRunText:   { fontSize: 11, color: '#10b981', fontWeight: '600' },

    card: { borderRadius: 12, padding: 16, marginBottom: 14, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2, gap: 10 },
    cardHeader:   { flexDirection: 'row', alignItems: 'center', gap: 10 },
    cardTitle:    { fontSize: 15, fontWeight: '600' },
    severityBar:  { width: '100%', height: 6, borderRadius: 3, overflow: 'hidden' },
    severityFill: { height: '100%', borderRadius: 3 },
    infoRow:      { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1 },
    infoLabel:    { fontSize: 13, fontWeight: '500' },
    infoValue:    { fontSize: 13, fontWeight: '600' },
    tagContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    tag:          { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16 },
    tagText:      { fontSize: 13, fontWeight: '500' },
    effectivenessRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
    effectivenessStars: { flexDirection: 'row', alignItems: 'center' },
    effectivenessLabel: { fontSize: 12, fontWeight: '600', marginLeft: 6 },
    noteText:           { fontSize: 14, lineHeight: 22 },
    noMigraineCard:  { borderRadius: 16, padding: 40, alignItems: 'center', borderWidth: 1, gap: 12 },
    noMigraineTitle: { fontSize: 22, fontWeight: '700' },
    noMigraineText:  { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});