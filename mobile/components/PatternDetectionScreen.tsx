import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  ActivityIndicator, Animated, Dimensions, TextInput,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '@/contexts/UserContext';
import { getAIResponse } from '@/services/aiService';
import { LinearGradient } from 'expo-linear-gradient';
import { API_BASE_URL as BACKEND_URL } from '@/config/api';


const { width } = Dimensions.get('window');
const maxWidth = Math.min(width, 448);

// ─── Types ────────────────────────────────────────────────────────────────────
interface MigraineLog {
  date: string; intensity: number; severity: number;
  duration_category: string; triggers: string[]; symptoms: string[];
  medication: string[]; medication_effectiveness: number | null;
  pain_location: string; notes: string; timestamp: string;
}
interface HealthData {
  steps: number | null; sleep_hours: number | null; sleep_schedule: string | null;
  blood_pressure: string | null; bp_status: string | null; weight: number | null;
}
interface Pattern {
  type: 'positive' | 'negative' | 'warning' | 'insight';
  title: string; description: string; confidence: number;
}
interface ChatMessage { role: 'user' | 'assistant'; text: string; timestamp: Date; }

// ─── Helpers ──────────────────────────────────────────────────────────────────
function topItems(arr: string[], limit = 5) {
  const c: Record<string, number> = {};
  arr.forEach(i => { if (i) c[i] = (c[i] || 0) + 1; });
  return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}

function buildPatternPrompt(logs: MigraineLog[], health: HealthData, userName: string) {
  const triggers = topItems(logs.flatMap(l => l.triggers));
  const symptoms = topItems(logs.flatMap(l => l.symptoms));
  const meds     = topItems(logs.flatMap(l => l.medication));
  const now      = new Date();
  const last30   = logs.filter(l => now.getTime() - new Date(l.timestamp).getTime() < 30 * 86400000);
  const avgInt   = logs.length ? (logs.reduce((s, l) => s + l.intensity, 0) / logs.length).toFixed(1) : 'N/A';
  return `You are a migraine pattern detection AI for patient: ${userName}.
REAL DATA (last ${logs.length} episodes):
- Episodes last 30 days: ${last30.length}
- Average intensity: ${avgInt}/10
- Top triggers: ${triggers.map(t => `${t.name}(${t.count}x)`).join(', ') || 'none logged'}
- Top symptoms: ${symptoms.map(s => `${s.name}(${s.count}x)`).join(', ') || 'none logged'}
- Medications used: ${meds.map(m => `${m.name}(${m.count}x)`).join(', ') || 'none logged'}
- Sleep: ${health.sleep_hours != null ? health.sleep_hours + 'h/night avg' : 'no data'}
- Steps: ${health.steps != null ? health.steps.toLocaleString() + '/day avg' : 'no data'}
- Blood pressure: ${health.blood_pressure ?? 'no data'} ${health.bp_status ? `(${health.bp_status})` : ''}
- Weight: ${health.weight != null ? health.weight + ' kg' : 'no data'}
Return ONLY a valid JSON array. Each object: "type"(positive/negative/warning/insight), "title"(max 6 words), "description"(1-2 sentences with real numbers), "confidence"(0-100). Generate 6-8 patterns. No markdown, no explanation.`;
}

function buildChatSystemPrompt(logs: MigraineLog[], health: HealthData, patterns: Pattern[]) {
  const triggers = topItems(logs.flatMap(l => l.triggers));
  const avgInt   = logs.length ? (logs.reduce((s, l) => s + l.intensity, 0) / logs.length).toFixed(1) : 'N/A';
  return `You are a compassionate migraine health assistant.
PATIENT DATA: ${logs.length} episodes | Avg intensity: ${avgInt}/10 | Top triggers: ${triggers.map(t => `${t.name}(${t.count}x)`).join(', ') || 'none'} | Sleep: ${health.sleep_hours ?? 'no data'}h | BP: ${health.blood_pressure ?? 'no data'} | Steps: ${health.steps?.toLocaleString() ?? 'no data'}/day
PATTERNS: ${patterns.map(p => `[${p.type.toUpperCase()}] ${p.title}: ${p.description} (${p.confidence}%)`).join(' | ')}
Answer concisely (2-4 sentences). Be warm and specific. Base everything on real data.`;
}

// ─── Pattern Card ─────────────────────────────────────────────────────────────
function PatternCard({ type, title, description, confidence, isHighConfidence }: Pattern & { isHighConfidence: boolean }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: confidence, duration: 900, delay: 200, useNativeDriver: false }).start();
  }, [confidence]);
  const barWidth = anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

  const iconMap = { positive: 'checkmark-circle', negative: 'trending-down', warning: 'warning', insight: 'flash' };
  const colorMap = { positive: '#34d399', negative: '#f87171', warning: '#fbbf24', insight: '#c084fc' };
  const bgMap    = { positive: '#0d2e1f', negative: '#2e0d0d', warning: '#2e1f0d', insight: '#1e0d38' };
  const icon  = iconMap[type] as any;
  const color = colorMap[type];
  const bg    = bgMap[type];

  return (
    <View style={[cs.patternCard, { backgroundColor: bg, borderColor: color + '33' }, isHighConfidence && { borderColor: color + '88', borderWidth: 1.5 }]}>
      {isHighConfidence && (
        <View style={[cs.hcBadge, { backgroundColor: color + '22', borderColor: color + '55' }]}>
          <Ionicons name="star" size={10} color={color} />
          <Text style={[cs.hcBadgeText, { color }]}>High confidence</Text>
        </View>
      )}
      <View style={cs.patternContent}>
        <View style={[cs.patternIconWrap, { backgroundColor: color + '18', borderColor: color + '44' }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={cs.patternTitle}>{title}</Text>
          <Text style={cs.patternDesc}>{description}</Text>
          <View style={cs.confidenceRow}>
            <View style={cs.barBg}>
              <Animated.View style={[cs.barFill, { width: barWidth, backgroundColor: color }]} />
            </View>
            <Text style={[cs.confText, { color }]}>{confidence}%</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Chat Bubble ──────────────────────────────────────────────────────────────
function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <View style={[cs.bubbleRow, isUser && cs.bubbleRowUser]}>
      {!isUser && (
        <LinearGradient colors={['#9333ea', '#6d28d9']} style={cs.aiAvatar}>
          <Ionicons name="sparkles" size={11} color="#fff" />
        </LinearGradient>
      )}
      <View style={[cs.bubble, isUser ? cs.bubbleUser : cs.bubbleAI]}>
        <Text style={[cs.bubbleText, isUser ? cs.bubbleTextUser : cs.bubbleTextAI]}>
          {message.text}
        </Text>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export function PatternDetectionScreen({ navigation }: { navigation: { goBack: () => void } }) {
  const { userData } = useUser();
  const userName = userData?.name ?? 'Patient';

  const [logs, setLogs]               = useState<MigraineLog[]>([]);
  const [health, setHealth]           = useState<HealthData>({ steps: null, sleep_hours: null, sleep_schedule: null, blood_pressure: null, bp_status: null, weight: null });
  const [patterns, setPatterns]       = useState<Pattern[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [patternsLoading, setPatternsLoading] = useState(false);
  const [dataError, setDataError]     = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput]     = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);
  const chatScrollRef = useRef<ScrollView>(null);

  const fetchData = useCallback(async () => {
    setDataLoading(true); setDataError(null);
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
        setHealth({
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
        const fd = (ts: string) => { const d = new Date(ts); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
        setLogs((ld.logs || []).map((l: any) => ({ date: fd(l.timestamp), intensity: l.intensity ?? 0, severity: l.severity ?? 0, duration_category: l.duration_category ?? '', triggers: l.triggers ?? [], symptoms: l.symptoms ?? [], medication: l.medication ?? [], medication_effectiveness: l.medication_effectiveness ?? null, pain_location: l.pain_location ?? '', notes: l.notes ?? '', timestamp: l.timestamp ?? '' })));
      }
    } catch { setDataError('Could not reach the backend. Make sure the server is running.'); }
    finally { setDataLoading(false); }
  }, [userName]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { if (!dataLoading && logs.length > 0) generatePatterns(); }, [dataLoading]);

  const generatePatterns = async () => {
    setPatternsLoading(true);
    try {
      const raw = await getAIResponse(buildPatternPrompt(logs, health, userName));
      const parsed: Pattern[] = JSON.parse(raw.replace(/```json|```/g, '').trim());
      setPatterns(parsed.sort((a, b) => b.confidence - a.confidence));
    } catch {
      setPatterns([{ type: 'warning', title: 'Analysis unavailable', description: 'Could not generate AI patterns. Check your API key or try again.', confidence: 0 }]);
    } finally { setPatternsLoading(false); }
  };

  const sendChat = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    setChatInput('');
    const userMsg: ChatMessage = { role: 'user', text, timestamp: new Date() };
    setChatMessages(prev => [...prev, userMsg]);
    setChatLoading(true);
    setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);
    try {
      const history = [...chatMessages, userMsg].map(m => `${m.role === 'user' ? 'Patient' : 'Assistant'}: ${m.text}`).join('\n');
      const reply = await getAIResponse(`${buildChatSystemPrompt(logs, health, patterns)}\n\nConversation:\n${history}\n\nAssistant:`);
      setChatMessages(prev => [...prev, { role: 'assistant', text: reply.trim(), timestamp: new Date() }]);
    } catch {
      setChatMessages(prev => [...prev, { role: 'assistant', text: 'Sorry, I could not process that. Please try again.', timestamp: new Date() }]);
    } finally {
      setChatLoading(false);
      setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <KeyboardAvoidingView style={cs.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

      <ScrollView style={cs.scroll} contentContainerStyle={cs.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[cs.content, { maxWidth }]}>

          {/* Info banner */}
          <View style={cs.infoBanner}>
            <Ionicons name="analytics-outline" size={15} color="#c084fc" style={{ marginRight: 8 }} />
            <Text style={cs.infoText}>
              Patterns are generated by AI using your real logged data. Confidence reflects data strength.
            </Text>
          </View>

          {/* Loading data */}
          {dataLoading && (
            <View style={cs.centered}>
              <ActivityIndicator size="large" color="#a78bfa" />
              <Text style={cs.loadingText}>Fetching your health data…</Text>
            </View>
          )}

          {/* Error */}
          {!dataLoading && dataError && (
            <View style={cs.centered}>
              <View style={cs.errorIconWrap}>
                <Ionicons name="cloud-offline-outline" size={32} color="#f87171" />
              </View>
              <Text style={cs.errorText}>{dataError}</Text>
              <Pressable onPress={fetchData} style={cs.retryBtn}>
                <Ionicons name="refresh" size={15} color="#fff" />
                <Text style={cs.retryTxt}>Retry</Text>
              </Pressable>
            </View>
          )}

          {/* No logs */}
          {!dataLoading && !dataError && logs.length === 0 && (
            <View style={cs.centered}>
              <View style={cs.emptyIconWrap}>
                <Ionicons name="bar-chart-outline" size={32} color="#c084fc" />
              </View>
              <Text style={cs.loadingText}>No migraine episodes logged yet.{'\n'}Start logging to see patterns.</Text>
            </View>
          )}

          {/* Generating */}
          {!dataLoading && !dataError && logs.length > 0 && patternsLoading && (
            <View style={cs.centered}>
              <ActivityIndicator size="large" color="#a78bfa" />
              <Text style={cs.loadingText}>AI is analysing your patterns…</Text>
              <Text style={cs.loadingSubText}>This takes a few seconds</Text>
            </View>
          )}

          {/* Patterns ready */}
          {!dataLoading && !dataError && !patternsLoading && patterns.length > 0 && (
            <>
              <View style={cs.refreshRow}>
                <Text style={cs.dataNote}>Based on {logs.length} episode{logs.length !== 1 ? 's' : ''}</Text>
                <Pressable onPress={generatePatterns} style={cs.refreshBtn}>
                  <Ionicons name="refresh-outline" size={13} color="#c084fc" />
                  <Text style={cs.refreshTxt}>Refresh</Text>
                </Pressable>
              </View>

              <View style={cs.patternsList}>
                {patterns.map((p, i) => (
                  <PatternCard key={i} {...p} isHighConfidence={p.confidence >= 80} />
                ))}
              </View>
            </>
          )}

          {/* Footer */}
          {!dataLoading && !patternsLoading && patterns.length > 0 && (
            <View style={cs.footerNote}>
              <Ionicons name="information-circle-outline" size={14} color="#6b21a8" />
              <Text style={cs.footerText}>
                Patterns are for informational purposes only. Consult your healthcare provider for medical advice.
              </Text>
            </View>
          )}

          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      {/* ── Chat panel ── */}
      {chatVisible && (
        <View style={cs.chatPanel}>
          <LinearGradient colors={['#160a2e', '#1e0d38']} style={cs.chatHeader}>
            <View style={cs.chatHeaderLeft}>
              <LinearGradient colors={['#9333ea', '#6d28d9']} style={cs.aiAvatarLarge}>
                <Ionicons name="sparkles" size={14} color="#fff" />
              </LinearGradient>
              <View>
                <Text style={cs.chatTitle}>Ask about your patterns</Text>
                <Text style={cs.chatSubtitle}>Powered by NeuroHeal AI</Text>
              </View>
            </View>
            <Pressable onPress={() => setChatVisible(false)} style={cs.chatClose}>
              <Ionicons name="chevron-down" size={20} color="#c084fc" />
            </Pressable>
          </LinearGradient>

          <ScrollView ref={chatScrollRef} style={cs.chatMessages} contentContainerStyle={{ padding: 12, gap: 10 }} showsVerticalScrollIndicator={false}>
            {chatMessages.length === 0 && (
              <View style={cs.chatEmpty}>
                <Text style={cs.chatEmptyText}>Ask me anything about your migraine patterns:</Text>
                {[
                  'Which trigger should I focus on first?',
                  'How does my sleep affect migraines?',
                  'What lifestyle changes would help most?',
                ].map((q, i) => (
                  <Pressable key={i} onPress={() => setChatInput(q)} style={cs.suggestionPill}>
                    <Text style={cs.suggestionText}>{q}</Text>
                  </Pressable>
                ))}
              </View>
            )}
            {chatMessages.map((m, i) => <ChatBubble key={i} message={m} />)}
            {chatLoading && (
              <View style={cs.bubbleRow}>
                <LinearGradient colors={['#9333ea', '#6d28d9']} style={cs.aiAvatar}>
                  <Ionicons name="sparkles" size={11} color="#fff" />
                </LinearGradient>
                <View style={cs.bubble}>
                  <ActivityIndicator size="small" color="#c084fc" />
                </View>
              </View>
            )}
          </ScrollView>

          <View style={cs.chatInputRow}>
            <TextInput
              style={cs.chatInput}
              placeholder="Ask about your patterns…"
              placeholderTextColor="#6b21a8"
              value={chatInput}
              onChangeText={setChatInput}
              onSubmitEditing={sendChat}
              returnKeyType="send"
            />
            <Pressable onPress={sendChat} disabled={!chatInput.trim() || chatLoading} style={[cs.sendBtn, (!chatInput.trim() || chatLoading) && cs.sendBtnDisabled]}>
              <Ionicons name="send" size={15} color="#fff" />
            </Pressable>
          </View>
        </View>
      )}

      {/* ── FAB ── */}
      {!chatVisible && !dataLoading && !patternsLoading && patterns.length > 0 && (
        <Pressable onPress={() => setChatVisible(true)} style={({ pressed }) => [cs.fab, pressed && cs.fabPressed]}>
          <LinearGradient colors={['#9333ea', '#6d28d9']} style={cs.fabGradient}>
            <Ionicons name="chatbubble-ellipses" size={18} color="#fff" />
            <Text style={cs.fabText}>Ask AI</Text>
          </LinearGradient>
        </Pressable>
      )}

    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const cs = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#000' },
  scroll:        { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  content:       { width: '100%', alignSelf: 'center', padding: 16 },

  // States
  centered:     { alignItems: 'center', paddingVertical: 56, gap: 14 },
  loadingText:  { fontSize: 14, color: '#c4b5fd', textAlign: 'center', paddingHorizontal: 24, lineHeight: 20 },
  loadingSubText: { fontSize: 12, color: '#6b21a8', textAlign: 'center' },
  errorIconWrap:  { width: 60, height: 60, borderRadius: 18, backgroundColor: '#2e0d0d', alignItems: 'center', justifyContent: 'center' },
  emptyIconWrap:  { width: 60, height: 60, borderRadius: 18, backgroundColor: '#1e0d38', alignItems: 'center', justifyContent: 'center' },
  errorText:    { fontSize: 14, color: '#f87171', textAlign: 'center', paddingHorizontal: 16 },
  retryBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#6107c9', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, marginTop: 4 },
  retryTxt:     { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Info banner
  infoBanner: { backgroundColor: '#160a2e', borderWidth: 1, borderColor: '#2b0f4d', borderRadius: 16, padding: 14, marginBottom: 16, flexDirection: 'row', alignItems: 'flex-start' },
  infoText:   { fontSize: 13, color: '#c4b5fd', lineHeight: 18, flex: 1 },

  // Refresh row
  refreshRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  dataNote:   { fontSize: 12, color: '#6b21a8' },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#2b0f4d', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  refreshTxt: { fontSize: 12, fontWeight: '600', color: '#c084fc' },

  // Pattern cards
  patternsList:   { gap: 10, marginBottom: 16 },
  patternCard:    { borderRadius: 18, padding: 16, borderWidth: 1 },
  hcBadge:        { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 10 },
  hcBadgeText:    { fontSize: 10, fontWeight: '700' },
  patternContent: { flexDirection: 'row', gap: 12 },
  patternIconWrap:{ width: 38, height: 38, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
  patternTitle:   { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 5 },
  patternDesc:    { fontSize: 13, color: '#c4b5fd', lineHeight: 18, marginBottom: 10 },
  confidenceRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barBg:          { flex: 1, height: 5, backgroundColor: '#2b0f4d', borderRadius: 3, overflow: 'hidden' },
  barFill:        { height: '100%', borderRadius: 3 },
  confText:       { fontSize: 11, fontWeight: '700', minWidth: 34 },

  // Footer
  footerNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#160a2e', borderWidth: 1, borderColor: '#2b0f4d', borderRadius: 14, padding: 14 },
  footerText: { fontSize: 12, color: '#6b21a8', lineHeight: 17, flex: 1 },

  // FAB
  fab:         { position: 'absolute', bottom: 24, right: 20, borderRadius: 28, overflow: 'hidden', shadowColor: '#9333ea', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 6 },
  fabGradient: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 14, paddingHorizontal: 20 },
  fabPressed:  { opacity: 0.85, transform: [{ scale: 0.96 }] },
  fabText:     { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Chat panel
  chatPanel:  { height: 440, backgroundColor: '#0d0618', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, borderColor: '#2b0f4d' },
  chatHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderBottomWidth: 1, borderBottomColor: '#2b0f4d' },
  chatHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  aiAvatarLarge:  { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  chatTitle:      { fontSize: 14, fontWeight: '700', color: '#fff' },
  chatSubtitle:   { fontSize: 11, color: '#6b21a8' },
  chatClose:      { padding: 6 },
  chatMessages:   { flex: 1, backgroundColor: '#0a0514' },

  chatEmpty:       { alignItems: 'flex-start', gap: 8, paddingVertical: 8 },
  chatEmptyText:   { fontSize: 13, color: '#6b21a8', marginBottom: 4 },
  suggestionPill:  { backgroundColor: '#160a2e', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#2b0f4d' },
  suggestionText:  { fontSize: 12, color: '#c4b5fd' },

  // Bubbles
  bubbleRow:     { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  bubbleRowUser: { justifyContent: 'flex-end' },
  aiAvatar:      { width: 26, height: 26, borderRadius: 8, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  bubble:        { maxWidth: '80%', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: '#231344', borderWidth: 1, borderColor: '#2b0f4d' },
  bubbleUser:    { backgroundColor: '#6107c9', borderColor: '#7c3aed' },
  bubbleAI:      { backgroundColor: '#231344', borderColor: '#2b0f4d' },
  bubbleText:    { fontSize: 13, lineHeight: 19, color: '#e9d5ff' },
  bubbleTextUser:{ color: '#fff' },
  bubbleTextAI:  { color: '#e9d5ff' },

  // Input
  chatInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: '#2b0f4d', backgroundColor: '#0d0618' },
  chatInput:    { flex: 1, height: 42, backgroundColor: '#160a2e', borderRadius: 21, paddingHorizontal: 16, fontSize: 13, color: '#e9d5ff', borderWidth: 1, borderColor: '#2b0f4d' },
  sendBtn:      { width: 42, height: 42, borderRadius: 21, backgroundColor: '#6107c9', justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { backgroundColor: '#2b0f4d' },
});