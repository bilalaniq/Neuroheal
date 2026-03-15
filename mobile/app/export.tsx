import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Pressable,
    ActivityIndicator, Platform, Animated, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ModernHeader } from '@/components/ModernHeader';
import { useRouter } from 'expo-router';
import { useUser } from '@/contexts/UserContext';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { getAIResponse } from '@/services/aiService';

const BACKEND_URL = 'http://192.168.37.37:8080';

interface MigraineLog {
    date: string; hasMigraine: boolean; severity: number; intensity: number;
    duration_category: string; triggers: string[]; symptoms: string[];
    medication: string[]; medication_effectiveness: number | null;
    relief_methods: string[]; pain_location: string; notes: string; timestamp: string;
}
interface HealthData {
    steps: number | null; sleep_hours: number | null; sleep_schedule: string | null;
    blood_pressure: string | null; bp_status: string | null; weight: number | null;
}
interface MigraineSummary {
    totalEpisodes: number; avgIntensity: number;
    mostCommonTriggers: { name: string; count: number }[];
    mostCommonSymptoms: { name: string; count: number }[];
    mostUsedMedications: { name: string; count: number; effectiveness: number }[];
    severityBreakdown: { label: string; count: number; color: string }[];
    episodesLast30Days: number; episodesLast7Days: number;
    migraineDays: MigraineLog[]; migraineFreeStreak: number;
    worstDay: string | null; mostEffectiveMed: string | null;
}

function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function topItems(arr: string[], limit = 5): { name: string; count: number }[] {
    const c: Record<string, number> = {};
    arr.forEach((i) => { if (i) c[i] = (c[i] || 0) + 1; });
    return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([name, count]) => ({ name, count }));
}
function sevColor(s: number) {
    if (s <= 1) return '#fbbf24'; if (s === 2) return '#f97316';
    if (s === 3) return '#ef4444'; return '#991b1b';
}
function sevLabel(s: number) { return ['None', 'Mild', 'Moderate', 'Severe', 'Extreme'][s] ?? 'Unknown'; }

function computeSummary(logs: MigraineLog[]): MigraineSummary {
    const now = new Date();
    const last30 = new Date(now); last30.setDate(now.getDate() - 30);
    const last7  = new Date(now); last7.setDate(now.getDate() - 7);
    const allT = logs.flatMap((l) => l.triggers);
    const allS = logs.flatMap((l) => l.symptoms);
    const allM = logs.flatMap((l) => l.medication);
    const avg  = logs.length ? logs.reduce((s, l) => s + (l.intensity ?? 0), 0) / logs.length : 0;
    const sc   = [0, 0, 0, 0, 0];
    logs.forEach((l) => { if (l.severity >= 0 && l.severity <= 4) sc[l.severity]++; });
    const sorted = [...logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const streak = sorted.length > 0
        ? Math.floor((now.getTime() - new Date(sorted[0].timestamp).getTime()) / 86400000) : 0;
    const worst  = logs.reduce((max, l) => (l.intensity > (max?.intensity ?? 0) ? l : max), null as MigraineLog | null);
    const meff: Record<string, number[]> = {};
    logs.forEach((l) => {
        if (l.medication_effectiveness != null)
            l.medication.forEach((m) => { if (!meff[m]) meff[m] = []; meff[m].push(l.medication_effectiveness!); });
    });
    let bestMed: string | null = null, bestEff = -1;
    Object.entries(meff).forEach(([m, e]) => {
        const a = e.reduce((s, v) => s + v, 0) / e.length;
        if (a > bestEff) { bestEff = a; bestMed = m; }
    });
    const meds = topItems(allM, 6).map((m) => ({
        ...m,
        effectiveness: meff[m.name]
            ? Math.round(meff[m.name].reduce((s, v) => s + v, 0) / meff[m.name].length * 100) : 0,
    }));
    return {
        totalEpisodes: logs.length, avgIntensity: avg,
        mostCommonTriggers: topItems(allT), mostCommonSymptoms: topItems(allS),
        mostUsedMedications: meds,
        severityBreakdown: [
            { label: 'Mild',     count: sc[1], color: '#fbbf24' },
            { label: 'Moderate', count: sc[2], color: '#f97316' },
            { label: 'Severe',   count: sc[3], color: '#ef4444' },
            { label: 'Extreme',  count: sc[4], color: '#991b1b' },
        ],
        episodesLast30Days: logs.filter((l) => new Date(l.timestamp) >= last30).length,
        episodesLast7Days:  logs.filter((l) => new Date(l.timestamp) >= last7).length,
        migraineDays: logs.slice(0, 12), migraineFreeStreak: streak,
        worstDay: worst ? formatDate(worst.date) : null, mostEffectiveMed: bestMed,
    };
}

function AnimatedBar({ pct, color, delay = 0 }: { pct: number; color: string; delay?: number }) {
    const anim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.timing(anim, { toValue: pct, duration: 700, delay, useNativeDriver: false }).start();
    }, [pct]);
    const width = anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });
    return (
        <View style={{ flex: 1, height: 6, borderRadius: 3, overflow: 'hidden', backgroundColor: '#2b0f4d' }}>
            <Animated.View style={{ height: 6, width, backgroundColor: color, borderRadius: 3 }} />
        </View>
    );
}

// ── Markdown helpers (unchanged) ──────────────────────────────────────────────
function markdownToHtml(raw: string): string {
    if (!raw) return '';
    const lines = raw.split('\n');
    let html = ''; let inUl = false; let inOl = false;
    const closeUl = () => { if (inUl) { html += '</ul>'; inUl = false; } };
    const closeOl = () => { if (inOl) { html += '</ol>'; inOl = false; } };
    const closeLists = () => { closeUl(); closeOl(); };
    const inline = (s: string) =>
        s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
         .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
         .replace(/__(.+?)__/g, '<strong>$1</strong>')
         .replace(/\*(.+?)\*/g, '<em>$1</em>')
         .replace(/_(.+?)_/g, '<em>$1</em>');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]; const trimmed = line.trim();
        if (!trimmed) { closeLists(); continue; }
        const h3 = trimmed.match(/^###\s+(.+)$/);
        if (h3) { closeLists(); const title = h3[1].replace(/\*\*/g, '').replace(/^\d+\.\s+/, '').trim(); const num = h3[1].match(/^(\d+)\./); html += `<div class="ai-section-header">${num ? `<span class="ai-section-num">${num[1]}.</span>` : ''}<span class="ai-section-title">${inline(title)}</span></div>`; continue; }
        const h2 = trimmed.match(/^##\s+(.+)$/);
        if (h2) { closeLists(); html += `<div class="ai-section-header"><span class="ai-section-title">${inline(h2[1].replace(/\*\*/g, ''))}</span></div>`; continue; }
        const numHeader = trimmed.match(/^(\d+)\.\s+\*\*(.+?)\*\*\s*[—–-]?\s*(.*)$/) || trimmed.match(/^(\d+)\.\s+([^*\n]{1,60})$/);
        if (numHeader) { closeLists(); const num = numHeader[1]; const title = (numHeader[2] ?? '').replace(/\*\*/g, '').trim(); const rest = (numHeader[3] ?? '').trim(); html += `<div class="ai-section-header"><span class="ai-section-num">${num}.</span><span class="ai-section-title">${inline(title)}${rest ? ` <span style="font-weight:400">${inline(rest)}</span>` : ''}</span></div>`; continue; }
        const boldHeader = trimmed.match(/^\*\*(.+?)\*\*\s*:?\s*$/);
        if (boldHeader) { closeLists(); html += `<div class="ai-section-header"><span class="ai-section-title">${inline(boldHeader[1])}</span></div>`; continue; }
        const bullet = trimmed.match(/^[*\-•]\s+(.+)$/);
        if (bullet) { closeOl(); if (!inUl) { html += '<ul class="ai-list">'; inUl = true; } html += `<li>${inline(bullet[1])}</li>`; continue; }
        const numItem = trimmed.match(/^(\d+)\.\s+(.{61,})$/);
        if (numItem) { closeUl(); if (!inOl) { html += '<ol class="ai-list">'; inOl = true; } html += `<li>${inline(numItem[2])}</li>`; continue; }
        closeLists(); html += `<p class="ai-para">${inline(trimmed)}</p>`;
    }
    closeLists(); return html;
}

function renderInline(text: string): React.ReactNode[] {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**')
            ? <Text key={i} style={{ fontWeight: '600', color: '#e9d5ff' }}>{part.slice(2, -2)}</Text>
            : <React.Fragment key={i}>{part}</React.Fragment>
    );
}

function renderMarkdown(text: string): React.ReactNode[] {
    const lines = text.split('\n');
    const result: React.ReactNode[] = [];
    let i = 0;
    const sectionHeader = (key: string, num: string | null, title: string) => (
        <View key={key} style={{
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: 'rgba(192,132,252,0.1)',
            borderRadius: 8, borderLeftWidth: 3, borderLeftColor: '#c084fc',
            paddingHorizontal: 12, paddingVertical: 10,
            marginTop: 16, marginBottom: 6,
        }}>
            {num && <Text style={{ fontSize: 13, fontWeight: '700', color: '#c084fc', marginRight: 7 }}>{num}.</Text>}
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#e9d5ff', flex: 1 }}>{title}</Text>
        </View>
    );
    while (i < lines.length) {
        const line = lines[i].trim();
        if (!line) { i++; continue; }
        const h3 = line.match(/^###\s+(?:(\d+)\.\s+)?(?:\*\*)?(.+?)(?:\*\*)?$/);
        if (h3) { result.push(sectionHeader(`h3-${i}`, h3[1] ?? null, h3[2].replace(/\*\*/g, '').trim())); i++; continue; }
        const h2 = line.match(/^##\s+(?:\*\*)?(.+?)(?:\*\*)?$/);
        if (h2) { result.push(sectionHeader(`h2-${i}`, null, h2[1].replace(/\*\*/g, '').trim())); i++; continue; }
        const numHeader = line.match(/^(\d+)\.\s+\*\*(.+?)\*\*[:\s—–-]*(.*)$/) ||
            (line.match(/^(\d+)\.\s+(.{1,60})$/) && !line.match(/^(\d+)\.\s+.{61,}$/)
                ? line.match(/^(\d+)\.\s+(.+)$/) : null);
        if (numHeader && (numHeader[2] ?? '').length < 60) {
            const title = (numHeader[2] ?? '').replace(/\*\*/g, '').trim();
            const rest  = (numHeader[3] ?? '').replace(/\*\*/g, '').trim();
            result.push(sectionHeader(`num-${i}`, numHeader[1], title + (rest ? ` — ${rest}` : '')));
            i++; continue;
        }
        const boldHeader = line.match(/^\*\*(.+?)\*\*\s*:?\s*$/);
        if (boldHeader) { result.push(sectionHeader(`bh-${i}`, null, boldHeader[1])); i++; continue; }
        if (line.startsWith('* ') || line.startsWith('- ') || line.startsWith('• ')) {
            const bullets: string[] = [];
            while (i < lines.length && (lines[i].trim().startsWith('* ') || lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('• '))) {
                bullets.push(lines[i].trim().slice(2)); i++;
            }
            result.push(
                <View key={`bullets-${i}`} style={{ marginBottom: 8, gap: 6 }}>
                    {bullets.map((b, bi) => (
                        <View key={bi} style={{ flexDirection: 'row', alignItems: 'flex-start', paddingLeft: 4 }}>
                            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#c084fc', marginTop: 7, marginRight: 10, flexShrink: 0 }} />
                            <Text style={{ fontSize: 13, lineHeight: 20, flex: 1, color: '#c4b5fd' }}>{renderInline(b)}</Text>
                        </View>
                    ))}
                </View>
            );
            continue;
        }
        result.push(
            <Text key={`p-${i}`} style={{ fontSize: 13, lineHeight: 21, marginBottom: 6, color: '#c4b5fd' }}>
                {renderInline(line)}
            </Text>
        );
        i++;
    }
    return result;
}

// ── AI Modal ──────────────────────────────────────────────────────────────────
function AIModal({ visible, onClose, loading, insight }: {
    visible: boolean; onClose: () => void; loading: boolean; insight: string | null;
}) {
    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <View style={{ flex: 1, backgroundColor: '#0d0618' }}>
                {/* Header */}
                <View style={ai.header}>
                    <View style={ai.headerLeft}>
                        <View style={ai.iconWrap}>
                            <Ionicons name="sparkles" size={18} color="#c084fc" />
                        </View>
                        <View>
                            <Text style={ai.title}>AI Health Analysis</Text>
                            <Text style={ai.sub}>Powered by NeuroHeal AI</Text>
                        </View>
                    </View>
                    <Pressable onPress={onClose} style={ai.closeBtn}>
                        <Ionicons name="close" size={20} color="rgba(233,213,255,0.5)" />
                    </Pressable>
                </View>

                {/* Body */}
                <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
                    {loading ? (
                        <View style={{ alignItems: 'center', paddingVertical: 60, gap: 14 }}>
                            <ActivityIndicator size="large" color="#c084fc" />
                            <Text style={{ fontSize: 16, fontWeight: '600', color: '#c4b5fd' }}>Analysing your health data…</Text>
                            <Text style={{ fontSize: 13, color: '#6b21a8' }}>NeuroHeal AI is reviewing your patterns</Text>
                        </View>
                    ) : insight ? (
                        <>
                            <View style={ai.card}>
                                <View style={ai.badge}>
                                    <Ionicons name="sparkles" size={12} color="#c084fc" />
                                    <Text style={ai.badgeTxt}>AI ANALYSIS</Text>
                                </View>
                                {renderMarkdown(insight)}
                            </View>
                            <View style={ai.disclaimer}>
                                <Ionicons name="information-circle-outline" size={14} color="#6b21a8" style={{ marginTop: 1 }} />
                                <Text style={{ fontSize: 11, lineHeight: 17, flex: 1, color: '#6b21a8' }}>
                                    AI insights are informational only. Always consult a healthcare professional.
                                </Text>
                            </View>
                        </>
                    ) : null}
                </ScrollView>

                {/* Footer */}
                {!loading && insight && (
                    <View style={ai.footer}>
                        <Pressable
                            onPress={onClose}
                            style={({ pressed }) => [ai.doneBtn, pressed && { opacity: 0.8 }]}
                        >
                            <Text style={ai.doneTxt}>Done</Text>
                        </Pressable>
                    </View>
                )}
            </View>
        </Modal>
    );
}

const ai = StyleSheet.create({
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: 20, borderBottomWidth: 1, borderBottomColor: '#2b0f4d',
        backgroundColor: '#160a2e',
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconWrap: {
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: 'rgba(192,132,252,0.12)',
        borderWidth: 1, borderColor: '#c084fc44',
        justifyContent: 'center', alignItems: 'center',
    },
    title: { fontSize: 16, fontWeight: '700', color: '#fff' },
    sub:   { fontSize: 12, color: '#6b21a8' },
    closeBtn: {
        width: 32, height: 32, borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.07)',
        alignItems: 'center', justifyContent: 'center',
    },
    card: {
        backgroundColor: '#160a2e', borderRadius: 16, padding: 18,
        borderWidth: 1, borderColor: '#2b0f4d', marginBottom: 16,
    },
    badge: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        marginBottom: 16, paddingBottom: 12,
        borderBottomWidth: 1, borderBottomColor: '#2b0f4d',
    },
    badgeTxt: { fontSize: 11, fontWeight: '700', color: '#c084fc', letterSpacing: 0.5 },
    disclaimer: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 8,
        padding: 12, borderRadius: 10, borderWidth: 1,
        backgroundColor: 'rgba(107,33,168,0.08)', borderColor: '#2b0f4d',
    },
    footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#2b0f4d', backgroundColor: '#160a2e' },
    doneBtn: { backgroundColor: '#6107c9', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
    doneTxt: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

// ── PDF builder (unchanged HTML content) ──────────────────────────────────────
function buildPdfHtml(userName: string, health: HealthData, summary: MigraineSummary, logs: MigraineLog[], aiInsight: string | null): string {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const recentRows = logs.slice(0, 15).map((l) =>
        `<tr><td>${formatDate(l.date)}</td><td style="color:${sevColor(l.severity)};font-weight:600">${sevLabel(l.severity)}</td><td>${l.intensity ?? '—'}/10</td><td>${l.duration_category || '—'}</td><td>${(l.triggers || []).slice(0, 3).join(', ') || '—'}</td><td>${(l.medication || []).slice(0, 2).join(', ') || '—'}</td></tr>`
    ).join('');
    const aiSection = aiInsight
        ? `<h2>AI Health Analysis</h2><div class="ai-card"><div class="ai-badge"><span>✦</span> AI ANALYSIS</div>${markdownToHtml(aiInsight)}</div><p style="font-size:11px;color:#9ca3af;margin-top:8px;font-style:italic">AI insights are informational only. Always consult a healthcare professional.</p>`
        : '';
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#1f2937;background:#fff;padding:40px;font-size:13px;line-height:1.5}.hdr{background:linear-gradient(135deg,#7c3aed,#4c1d95);color:#fff;border-radius:14px;padding:28px 32px;margin-bottom:32px}.hdr h1{font-size:26px;font-weight:700;margin-bottom:4px}.hdr p{font-size:13px;opacity:.85}.meta{display:flex;gap:24px;margin-top:16px;font-size:12px;opacity:.9;flex-wrap:wrap}h2{font-size:17px;font-weight:700;color:#4c1d95;border-bottom:2px solid #e9d5ff;padding-bottom:6px;margin:28px 0 14px}h3{font-size:14px;font-weight:600;color:#374151;margin-bottom:10px}.g4{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:8px}.g2{display:grid;grid-template-columns:1fr 1fr;gap:20px}.card{background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:16px}.card .val{font-size:22px;font-weight:700;color:#111827;margin-bottom:2px}.card .lbl{font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.5px}.card .sub{font-size:11px;color:#9ca3af;margin-top:2px}.g{border-left:4px solid #7c3aed}.r{border-left:4px solid #ef4444}.b{border-left:4px solid #3b82f6}.a{border-left:4px solid #f59e0b}table{width:100%;border-collapse:collapse;font-size:12px}th{background:#f5f3ff;color:#4c1d95;font-weight:600;text-align:left;padding:10px 12px;border-bottom:2px solid #e9d5ff}td{padding:9px 12px;border-bottom:1px solid #f3f4f6;color:#374151}tr:last-child td{border-bottom:none}tr:nth-child(even) td{background:#fafafa}.sw{margin-bottom:10px}.sl{display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px}.st{height:10px;background:#e5e7eb;border-radius:5px;overflow:hidden}.sf{height:10px;border-radius:5px}.hl{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:8px}.hc{background:#f5f3ff;border:1px solid #e9d5ff;border-radius:10px;padding:14px;text-align:center}.hc .hv{font-size:18px;font-weight:700;color:#4c1d95}.hc .hlb{font-size:11px;color:#6b7280;margin-top:3px}.ai-card{background:#f5f3ff;border:1px solid #e9d5ff;border-radius:12px;padding:20px;margin-top:12px}.ai-badge{display:flex;align-items:center;gap:6px;font-size:11px;font-weight:700;color:#4c1d95;letter-spacing:.5px;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid #e9d5ff}.ai-section-header{display:flex;align-items:center;gap:8px;background:rgba(124,58,237,0.08);border-left:3px solid #7c3aed;border-radius:6px;padding:10px 12px;margin:16px 0 8px}.ai-section-num{font-size:13px;font-weight:700;color:#4c1d95;flex-shrink:0}.ai-section-title{font-size:14px;font-weight:600;color:#1e1b4b}.ai-list{margin:6px 0 12px 20px;padding:0}.ai-list li{font-size:13px;line-height:1.7;color:#374151;margin-bottom:5px}.ai-para{font-size:13px;line-height:1.7;color:#374151;margin:0 0 10px}.disc{background:#fdf4ff;border:1px solid #e9d5ff;border-radius:8px;padding:14px;margin-top:32px;font-size:11px;color:#6b21a8;line-height:1.6}.foot{text-align:center;margin-top:28px;font-size:11px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:16px}</style></head><body>
<div class="hdr"><h1>Migraine Health Report</h1><p>Prepared for healthcare professionals — NeuroHeal App</p><div class="meta"><span>Patient: <strong>${userName}</strong></span><span>Generated: <strong>${today}</strong></span><span>Total Episodes: <strong>${summary.totalEpisodes}</strong></span></div></div>
<h2>Overview</h2><div class="g4"><div class="card g"><div class="val">${summary.totalEpisodes}</div><div class="lbl">Total Episodes</div></div><div class="card r"><div class="val">${summary.episodesLast30Days}</div><div class="lbl">Last 30 Days</div></div><div class="card a"><div class="val">${summary.episodesLast7Days}</div><div class="lbl">Last 7 Days</div></div><div class="card b"><div class="val">${summary.avgIntensity.toFixed(1)}/10</div><div class="lbl">Avg Intensity</div></div></div>
<div class="hl"><div class="hc"><div class="hv">${summary.migraineFreeStreak}d</div><div class="hlb">Migraine-Free Streak</div></div><div class="hc"><div class="hv">${summary.worstDay ?? '—'}</div><div class="hlb">Worst Day</div></div><div class="hc"><div class="hv">${summary.mostEffectiveMed ?? '—'}</div><div class="hlb">Best Medication</div></div></div>
<h2>Health Vitals</h2><div class="g4"><div class="card b"><div class="val">${health.sleep_hours != null ? health.sleep_hours + 'h' : '—'}</div><div class="lbl">Avg Sleep</div><div class="sub">Last 7 days</div></div><div class="card r"><div class="val">${health.blood_pressure ?? '—'}</div><div class="lbl">Blood Pressure</div><div class="sub">${health.bp_status ?? 'No data'}</div></div><div class="card g"><div class="val">${health.steps != null ? health.steps.toLocaleString() : '—'}</div><div class="lbl">Steps</div><div class="sub">Last 7 days</div></div><div class="card a"><div class="val">${health.weight != null ? health.weight + ' kg' : '—'}</div><div class="lbl">Weight</div></div></div>
${health.sleep_schedule ? `<p style="margin-top:10px;font-size:12px;color:#6b7280">Sleep schedule: <strong>${health.sleep_schedule}</strong></p>` : ''}
<h2>Severity Breakdown</h2><div style="max-width:440px">${summary.severityBreakdown.map((s) => { const p = summary.totalEpisodes > 0 ? ((s.count / summary.totalEpisodes) * 100).toFixed(0) : 0; return `<div class="sw"><div class="sl"><span style="font-weight:600;color:${s.color}">${s.label}</span><span style="color:#6b7280">${s.count} (${p}%)</span></div><div class="st"><div class="sf" style="width:${p}%;background:${s.color}"></div></div></div>`; }).join('')}</div>
<h2>Triggers &amp; Symptoms</h2><div class="g2"><div><h3>Top Triggers</h3><table><tr><th>Trigger</th><th>Episodes</th></tr>${summary.mostCommonTriggers.map((t) => `<tr><td>${t.name}</td><td>${t.count}</td></tr>`).join('') || '<tr><td colspan="2">No data</td></tr>'}</table></div><div><h3>Top Symptoms</h3><table><tr><th>Symptom</th><th>Episodes</th></tr>${summary.mostCommonSymptoms.map((s) => `<tr><td>${s.name}</td><td>${s.count}</td></tr>`).join('') || '<tr><td colspan="2">No data</td></tr>'}</table></div></div>
<h2>Medications</h2><table style="max-width:440px"><tr><th>Medication</th><th>Times Used</th><th>Effectiveness</th></tr>${summary.mostUsedMedications.map((m) => `<tr><td>${m.name}</td><td>${m.count}</td><td>${m.effectiveness > 0 ? m.effectiveness + '%' : '—'}</td></tr>`).join('') || '<tr><td colspan="3">No data</td></tr>'}</table>
<h2>Recent Episodes (Last 15)</h2><table><tr><th>Date</th><th>Severity</th><th>Intensity</th><th>Duration</th><th>Triggers</th><th>Medication</th></tr>${recentRows || '<tr><td colspan="6">No episodes logged</td></tr>'}</table>
${aiSection}
<div class="disc"><strong>Medical Disclaimer:</strong> This report is generated from patient self-reported data logged in the NeuroHeal migraine tracking application. It is intended as a supplementary tool to assist healthcare professionals and does not constitute a medical diagnosis.</div>
<div class="foot">NeuroHeal — Migraine Tracker | ${today} | ${userName}</div>
</body></html>`;
}

function buildAIPrompt(userName: string, health: HealthData, s: MigraineSummary): string {
    return `You are analysing migraine health data for patient: ${userName}.
MIGRAINE DATA:
- Total episodes: ${s.totalEpisodes} | Last 30d: ${s.episodesLast30Days} | Last 7d: ${s.episodesLast7Days}
- Avg intensity: ${s.avgIntensity.toFixed(1)}/10 | Free streak: ${s.migraineFreeStreak} days
- Worst day: ${s.worstDay ?? 'N/A'} | Best medication: ${s.mostEffectiveMed ?? 'Not determined'}
- Severity: ${s.severityBreakdown.map((x) => `${x.label}: ${x.count}`).join(', ')}
- Top triggers: ${s.mostCommonTriggers.map((t) => `${t.name}(${t.count})`).join(', ') || 'None'}
- Top symptoms: ${s.mostCommonSymptoms.map((x) => `${x.name}(${x.count})`).join(', ') || 'None'}
- Medications: ${s.mostUsedMedications.map((m) => `${m.name}×${m.count}${m.effectiveness > 0 ? ` eff:${m.effectiveness}%` : ''}`).join(', ') || 'None'}
HEALTH VITALS:
- Sleep: ${health.sleep_hours != null ? health.sleep_hours + 'h/night' : 'No data'} | Schedule: ${health.sleep_schedule ?? 'No data'}
- BP: ${health.blood_pressure ?? 'No data'} ${health.bp_status ? `(${health.bp_status})` : ''}
- Steps: ${health.steps != null ? health.steps.toLocaleString() : 'No data'} | Weight: ${health.weight != null ? health.weight + ' kg' : 'No data'}
Provide a structured analysis:
1. **Overall Pattern Assessment** — What do these numbers reveal?
2. **Key Risk Factors** — Most concerning triggers and health factors?
3. **Sleep & Lifestyle Connection** — How do vitals relate to migraine frequency?
4. **Medication Insights** — What does the usage pattern suggest?
5. **Actionable Recommendations** — 4-5 specific practical steps right now
6. **When to See a Doctor** — Warning signs that need urgent attention
Be warm, clear, and clinically useful. Use bullet points within each section.`;
}

// ── Section header ─────────────────────────────────────────────────────────────
function Sec({ title, icon, color }: { title: string; icon: string; color: string }) {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <View style={{
                width: 30, height: 30, borderRadius: 9,
                backgroundColor: color + '22',
                borderWidth: 1, borderColor: color + '44',
                justifyContent: 'center', alignItems: 'center',
            }}>
                <Ionicons name={icon as any} size={16} color={color} />
            </View>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#fff' }}>{title}</Text>
        </View>
    );
}

// ── Main screen ────────────────────────────────────────────────────────────────
export default function HealthMetricsScreen() {
    const router   = useRouter();
    const { userData } = useUser();
    const userName = userData?.name ?? 'Patient';

    const [healthData,   setHealthData]   = useState<HealthData | null>(null);
    const [migraineLogs, setMigraineLogs] = useState<MigraineLog[]>([]);
    const [loading,  setLoading]  = useState(true);
    const [error,    setError]    = useState<string | null>(null);
    const [exporting,setExporting]= useState(false);
    const [aiVisible,setAIVisible]= useState(false);
    const [aiLoading,setAILoading]= useState(false);
    const [aiInsight,setAIInsight]= useState<string | null>(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const fetchAll = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const [hr, lr] = await Promise.all([
                fetch(`${BACKEND_URL}/health/full?days=7`),
                fetch(`${BACKEND_URL}/migraine-episodes/history?user_id=${encodeURIComponent(userName)}`),
            ]);
            if (hr.ok) {
                const hd = await hr.json();
                const bp = hd.blood_pressure?.readings ?? [];
                const latestBP = bp[bp.length - 1] ?? null;
                const sc = hd.sleep?.sleep_schedule;
                setHealthData({
                    steps: hd.steps?.total_steps ?? null,
                    sleep_hours: hd.sleep?.average_sleep_hours ? parseFloat(hd.sleep.average_sleep_hours.toFixed(1)) : null,
                    sleep_schedule: sc?.avg_bedtime && sc?.avg_wake_time ? `${sc.avg_bedtime} – ${sc.avg_wake_time}` : null,
                    blood_pressure: latestBP ? `${latestBP.systolic}/${latestBP.diastolic}` : null,
                    bp_status: latestBP?.status ?? null,
                    weight: hd.weight?.latest_weight_kg ?? null,
                });
            }
            if (lr.ok) {
                const ld = await lr.json();
                const fd = (ts: string) => {
                    const d = new Date(ts);
                    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                };
                setMigraineLogs((ld.logs || []).map((l: any) => ({
                    date: fd(l.timestamp), hasMigraine: true,
                    severity: l.severity ?? (l.intensity <= 3 ? 1 : l.intensity <= 6 ? 2 : l.intensity <= 8 ? 3 : 4),
                    intensity: l.intensity ?? 0,
                    duration_category: l.duration_category ?? '',
                    triggers: l.triggers ?? [], symptoms: l.symptoms ?? [],
                    medication: l.medication ?? [],
                    medication_effectiveness: l.medication_effectiveness ?? null,
                    relief_methods: l.relief_methods ?? [],
                    pain_location: l.pain_location ?? '',
                    notes: l.notes ?? '', timestamp: l.timestamp ?? '',
                })));
            }
            Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
        } catch {
            setError('Could not reach the backend. Make sure the server is running.');
        } finally {
            setLoading(false);
        }
    }, [userName]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const summary  = computeSummary(migraineLogs);
    const hd       = healthData;
    const emptyHD: HealthData = { steps: null, sleep_hours: null, sleep_schedule: null, blood_pressure: null, bp_status: null, weight: null };

    const handleAI = async () => {
        setAIVisible(true);
        if (aiInsight) return;
        setAILoading(true);
        try {
            const r = await getAIResponse(buildAIPrompt(userName, hd ?? emptyHD, summary));
            setAIInsight(r);
        } catch {
            setAIInsight('Could not fetch AI analysis. Please check your API key and try again.');
        } finally {
            setAILoading(false);
        }
    };

    const handlePDF = async () => {
        setExporting(true);
        try {
            const html = buildPdfHtml(userName, hd ?? emptyHD, summary, migraineLogs, aiInsight);
            if (Platform.OS === 'web') {
                const w = window.open('', '_blank');
                if (w) { w.document.write(html); w.document.close(); w.print(); }
            } else {
                const { uri } = await Print.printToFileAsync({ html, base64: false });
                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share Migraine Report', UTI: 'com.adobe.pdf' });
                } else {
                    await Print.printAsync({ html });
                }
            }
        } catch (e) { console.error(e); }
        finally { setExporting(false); }
    };

    return (
        <View style={s.container}>
            <ModernHeader title="Health Metrics" onBack={() => router.back()} />

            {loading ? (
                <View style={s.centered}>
                    <ActivityIndicator size="large" color="#c084fc" />
                    <Text style={s.loadingTxt}>Loading your health data…</Text>
                </View>
            ) : error ? (
                <View style={s.centered}>
                    <View style={s.errorIconWrap}>
                        <Ionicons name="cloud-offline-outline" size={32} color="#f87171" />
                    </View>
                    <Text style={s.errorTxt}>{error}</Text>
                    <Pressable onPress={fetchAll} style={s.retryBtn}>
                        <Ionicons name="refresh" size={16} color="#fff" />
                        <Text style={s.retryTxt}>Retry</Text>
                    </Pressable>
                </View>
            ) : (
                <Animated.ScrollView
                    style={{ opacity: fadeAnim }}
                    contentContainerStyle={s.scroll}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Action buttons */}
                    <View style={s.actionRow}>
                        <Pressable onPress={handleAI} style={({ pressed }) => [s.aiBtn, pressed && s.pressed]}>
                            <Ionicons name="sparkles" size={18} color="#fff" />
                            <Text style={s.aiBtnTxt}>AI Analysis</Text>
                        </Pressable>
                        <Pressable onPress={handlePDF} disabled={exporting}
                            style={({ pressed }) => [s.pdfBtn, pressed && s.pressed]}>
                            {exporting
                                ? <ActivityIndicator size="small" color="#c084fc" />
                                : <Ionicons name="document-text-outline" size={18} color="#c084fc" />}
                            <Text style={s.pdfBtnTxt}>{exporting ? 'Generating…' : 'Export PDF'}</Text>
                        </Pressable>
                    </View>

                    {/* Hero stats */}
                    <View style={s.heroRow}>
                        <View style={[s.heroMain, { backgroundColor: '#ef4444' }]}>
                            <Text style={s.heroNum}>{summary.totalEpisodes}</Text>
                            <Text style={s.heroLbl}>Total{'\n'}Episodes</Text>
                            <View style={s.heroBadge}>
                                <Ionicons name="pulse" size={13} color="#fff" />
                                <Text style={s.heroBadgeTxt}>{summary.episodesLast30Days} this month</Text>
                            </View>
                        </View>
                        <View style={s.heroCol}>
                            <View style={[s.heroSmall, { backgroundColor: '#f97316' }]}>
                                <Text style={s.heroSmallNum}>{summary.avgIntensity.toFixed(1)}</Text>
                                <Text style={s.heroSmallLbl}>Avg Pain /10</Text>
                            </View>
                            <View style={[s.heroSmall, { backgroundColor: '#6107c9' }]}>
                                <Text style={s.heroSmallNum}>{summary.migraineFreeStreak}d</Text>
                                <Text style={s.heroSmallLbl}>Free Streak</Text>
                            </View>
                        </View>
                    </View>

                    {/* Vitals */}
                    <Sec title="Health Vitals" icon="heart-outline" color="#ef4444" />
                    <View style={s.vitalsGrid}>
                        {[
                            { icon: 'moon',    color: '#a78bfa', label: 'Sleep',          value: hd?.sleep_hours != null ? `${hd.sleep_hours}h` : '—',  sub: 'Avg / night' },
                            { icon: 'heart',   color: '#ef4444', label: 'Blood Pressure',  value: hd?.blood_pressure ?? '—',                              sub: hd?.bp_status ?? 'No data' },
                            { icon: 'walk',    color: '#34d399', label: 'Steps',           value: hd?.steps != null ? (hd.steps >= 1000 ? `${(hd.steps / 1000).toFixed(1)}k` : String(hd.steps)) : '—', sub: 'Last 7 days' },
                            { icon: 'barbell', color: '#60a5fa', label: 'Weight',          value: hd?.weight != null ? `${hd.weight}kg` : '—',            sub: 'Latest' },
                        ].map((v) => (
                            <View key={v.label} style={s.vitalCard}>
                                <View style={[s.vitalIcon, { backgroundColor: v.color + '22' }]}>
                                    <Ionicons name={v.icon as any} size={20} color={v.color} />
                                </View>
                                <Text style={s.vitalVal}>{v.value}</Text>
                                <Text style={s.vitalLbl}>{v.label}</Text>
                                <Text style={s.vitalSub}>{v.sub}</Text>
                            </View>
                        ))}
                    </View>
                    {hd?.sleep_schedule && (
                        <View style={s.schedRow}>
                            <Ionicons name="time-outline" size={16} color="#a78bfa" />
                            <Text style={{ fontSize: 13, color: '#c4b5fd' }}>
                                Schedule: <Text style={{ fontWeight: '700', color: '#fff' }}>{hd.sleep_schedule}</Text>
                            </Text>
                        </View>
                    )}

                    {/* Severity */}
                    <Sec title="Severity Breakdown" icon="bar-chart-outline" color="#f97316" />
                    <View style={s.card}>
                        {summary.severityBreakdown.map((sv, i) => {
                            const p = summary.totalEpisodes > 0 ? (sv.count / summary.totalEpisodes) * 100 : 0;
                            return (
                                <View key={sv.label} style={s.sevRow}>
                                    <View style={[s.sevDot, { backgroundColor: sv.color }]} />
                                    <Text style={s.sevLbl}>{sv.label}</Text>
                                    <AnimatedBar pct={p} color={sv.color} delay={i * 100} />
                                    <Text style={s.sevCnt}>{sv.count}</Text>
                                </View>
                            );
                        })}
                    </View>

                    {/* Highlights */}
                    <View style={s.hlRow}>
                        {[
                            { icon: 'trophy',  color: '#fbbf24', label: 'Best Medication', value: summary.mostEffectiveMed ?? '—' },
                            { icon: 'warning', color: '#ef4444', label: 'Worst Day',        value: summary.worstDay ?? '—' },
                            { icon: 'today',   color: '#60a5fa', label: 'Last 7 Days',      value: `${summary.episodesLast7Days} ep.` },
                        ].map((h) => (
                            <View key={h.label} style={s.hlCard}>
                                <Ionicons name={h.icon as any} size={18} color={h.color} />
                                <Text style={s.hlVal} numberOfLines={1}>{h.value}</Text>
                                <Text style={s.hlLbl}>{h.label}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Triggers */}
                    <Sec title="Top Triggers" icon="flash-outline" color="#ef4444" />
                    <View style={s.card}>
                        {summary.mostCommonTriggers.length === 0
                            ? <Text style={s.empty}>No trigger data logged yet</Text>
                            : summary.mostCommonTriggers.map((t, i) => (
                                <View key={t.name} style={s.itemRow}>
                                    <View style={[s.rank, { backgroundColor: '#ef444422' }]}>
                                        <Text style={[s.rankTxt, { color: '#ef4444' }]}>{i + 1}</Text>
                                    </View>
                                    <Text style={s.itemName} numberOfLines={1}>{t.name}</Text>
                                    <AnimatedBar pct={(t.count / summary.mostCommonTriggers[0].count) * 100} color="#ef4444" delay={i * 80} />
                                    <Text style={s.itemCnt}>{t.count}×</Text>
                                </View>
                            ))}
                    </View>

                    {/* Symptoms */}
                    <Sec title="Top Symptoms" icon="medical-outline" color="#a78bfa" />
                    <View style={s.card}>
                        {summary.mostCommonSymptoms.length === 0
                            ? <Text style={s.empty}>No symptom data logged yet</Text>
                            : summary.mostCommonSymptoms.map((sym, i) => (
                                <View key={sym.name} style={s.itemRow}>
                                    <View style={[s.rank, { backgroundColor: '#a78bfa22' }]}>
                                        <Text style={[s.rankTxt, { color: '#a78bfa' }]}>{i + 1}</Text>
                                    </View>
                                    <Text style={s.itemName} numberOfLines={1}>{sym.name}</Text>
                                    <AnimatedBar pct={(sym.count / summary.mostCommonSymptoms[0].count) * 100} color="#a78bfa" delay={i * 80} />
                                    <Text style={s.itemCnt}>{sym.count}×</Text>
                                </View>
                            ))}
                    </View>

                    {/* Medications */}
                    <Sec title="Medications" icon="medkit-outline" color="#34d399" />
                    <View style={s.card}>
                        {summary.mostUsedMedications.length === 0
                            ? <Text style={s.empty}>No medication data logged yet</Text>
                            : summary.mostUsedMedications.map((m, i) => (
                                <View key={m.name} style={[s.medRow, { borderBottomColor: '#2b0f4d' }]}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: m.effectiveness > 0 ? 6 : 0 }}>
                                        <Text style={s.medName}>{m.name}</Text>
                                        <Text style={s.medCnt}>{m.count}× used</Text>
                                    </View>
                                    {m.effectiveness > 0 && (
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            <Text style={{ fontSize: 11, color: '#6b21a8', width: 80 }}>Effectiveness</Text>
                                            <AnimatedBar pct={m.effectiveness} color="#34d399" delay={i * 80} />
                                            <Text style={{ width: 36, fontSize: 12, fontWeight: '700', textAlign: 'right', color: '#34d399' }}>
                                                {m.effectiveness}%
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            ))}
                    </View>

                    {/* Recent episodes */}
                    <Sec title="Recent Episodes" icon="list-outline" color="#60a5fa" />
                    {summary.migraineDays.length === 0
                        ? <View style={s.card}><Text style={s.empty}>No episodes logged yet</Text></View>
                        : summary.migraineDays.map((log, i) => (
                            <View key={i} style={[s.epCard, { borderLeftColor: sevColor(log.severity) }]}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>{formatDate(log.date)}</Text>
                                    <View style={[s.sevPill, { backgroundColor: sevColor(log.severity) + '22' }]}>
                                        <Text style={{ fontSize: 11, fontWeight: '700', color: sevColor(log.severity) }}>
                                            {sevLabel(log.severity)}
                                        </Text>
                                    </View>
                                </View>
                                <Text style={{ fontSize: 12, color: '#c4b5fd', marginBottom: (log.triggers || []).length > 0 ? 6 : 0 }}>
                                    Intensity {log.intensity}/10
                                    {log.duration_category ? ` • ${log.duration_category}` : ''}
                                    {log.pain_location     ? ` • ${log.pain_location}`     : ''}
                                </Text>
                                {(log.triggers || []).length > 0 && (
                                    <View style={s.tagRow}>
                                        {log.triggers.slice(0, 4).map((t) => (
                                            <View key={t} style={[s.tag, { backgroundColor: '#ef444415', borderColor: '#ef444430' }]}>
                                                <Text style={{ fontSize: 11, fontWeight: '500', color: '#f87171' }}>{t}</Text>
                                            </View>
                                        ))}
                                    </View>
                                )}
                                {(log.medication || []).length > 0 && (
                                    <View style={s.tagRow}>
                                        {log.medication.slice(0, 3).map((m) => (
                                            <View key={m} style={[s.tag, { backgroundColor: '#34d39915', borderColor: '#34d39930' }]}>
                                                <Text style={{ fontSize: 11, fontWeight: '500', color: '#34d399' }}>{m}</Text>
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </View>
                        ))}

                    <View style={{ height: 32 }} />
                </Animated.ScrollView>
            )}

            <AIModal visible={aiVisible} onClose={() => setAIVisible(false)} loading={aiLoading} insight={aiInsight} />
        </View>
    );
}

const s = StyleSheet.create({
    container:    { flex: 1, backgroundColor: '#000' },
    centered:     { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14, padding: 24 },
    loadingTxt:   { fontSize: 14, color: '#c4b5fd', fontWeight: '500' },
    errorIconWrap:{ width: 64, height: 64, borderRadius: 20, backgroundColor: '#2b0f0f', alignItems: 'center', justifyContent: 'center' },
    errorTxt:     { fontSize: 14, color: '#f87171', textAlign: 'center', fontWeight: '500' },
    retryBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#6107c9', paddingHorizontal: 20, paddingVertical: 11, borderRadius: 12, marginTop: 4 },
    retryTxt:     { color: '#fff', fontWeight: '600', fontSize: 14 },
    scroll:       { padding: 16, paddingBottom: 40, gap: 12 },

    // Actions
    actionRow:    { flexDirection: 'row', gap: 10, marginBottom: 4 },
    aiBtn:        { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#6107c9', borderRadius: 12, paddingVertical: 13 },
    aiBtnTxt:     { color: '#fff', fontSize: 15, fontWeight: '700' },
    pdfBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#160a2e', borderRadius: 12, paddingVertical: 13, borderWidth: 1, borderColor: '#c084fc44' },
    pdfBtnTxt:    { color: '#c084fc', fontSize: 15, fontWeight: '700' },
    pressed:      { opacity: 0.8, transform: [{ scale: 0.97 }] },

    // Hero
    heroRow:      { flexDirection: 'row', gap: 10, height: 140 },
    heroMain:     { flex: 1.2, borderRadius: 18, padding: 16, justifyContent: 'space-between' },
    heroNum:      { fontSize: 44, fontWeight: '800', color: '#fff', lineHeight: 48 },
    heroLbl:      { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '500' },
    heroBadge:    { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.2)' },
    heroBadgeTxt: { fontSize: 11, color: '#fff', fontWeight: '600' },
    heroCol:      { flex: 1, gap: 10 },
    heroSmall:    { flex: 1, borderRadius: 14, padding: 12, justifyContent: 'center' },
    heroSmallNum: { fontSize: 22, fontWeight: '800', color: '#fff' },
    heroSmallLbl: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

    // Vitals
    vitalsGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    vitalCard:    { width: '47%', backgroundColor: '#231344', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#2b0f4d', gap: 2 },
    vitalIcon:    { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
    vitalVal:     { fontSize: 22, fontWeight: '800', color: '#fff' },
    vitalLbl:     { fontSize: 12, fontWeight: '600', color: '#c4b5fd' },
    vitalSub:     { fontSize: 11, marginTop: 1, color: '#6b21a8' },
    schedRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#231344', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#2b0f4d' },

    // Cards
    card:         { backgroundColor: '#231344', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#2b0f4d', gap: 10 },
    sevRow:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
    sevDot:       { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
    sevLbl:       { fontSize: 13, fontWeight: '500', color: '#c4b5fd', width: 72 },
    sevCnt:       { width: 22, fontSize: 12, textAlign: 'right', fontWeight: '600', color: '#6b21a8' },

    hlRow:        { flexDirection: 'row', gap: 10 },
    hlCard:       { flex: 1, backgroundColor: '#231344', borderRadius: 14, borderWidth: 1, borderColor: '#2b0f4d', padding: 12, alignItems: 'center', gap: 4 },
    hlVal:        { fontSize: 13, fontWeight: '700', textAlign: 'center', color: '#fff' },
    hlLbl:        { fontSize: 10, textAlign: 'center', color: '#6b21a8' },

    itemRow:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
    rank:         { width: 22, height: 22, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
    rankTxt:      { fontSize: 11, fontWeight: '700' },
    itemName:     { width: 100, fontSize: 13, fontWeight: '500', color: '#e9d5ff' },
    itemCnt:      { width: 30, fontSize: 12, textAlign: 'right', fontWeight: '600', color: '#6b21a8' },

    medRow:       { paddingBottom: 10, borderBottomWidth: 1 },
    medName:      { fontSize: 14, fontWeight: '600', color: '#fff' },
    medCnt:       { fontSize: 12, color: '#6b21a8' },

    epCard:       { backgroundColor: '#231344', borderRadius: 14, borderWidth: 1, borderColor: '#2b0f4d', borderLeftWidth: 4, padding: 14, gap: 4 },
    sevPill:      { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
    tagRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
    tag:          { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
    empty:        { fontSize: 13, textAlign: 'center', paddingVertical: 8, color: '#6b21a8' },
});