import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Animated,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useUser } from '@/contexts/UserContext';
import { getAIResponse } from '@/services/aiService';

const BACKEND_URL = 'http://192.168.37.37:8080';
const { width } = Dimensions.get('window');
const maxWidth = Math.min(width, 448);

// ─── Types ────────────────────────────────────────────────────────────────────

interface MigraineLog {
  date: string;
  intensity: number;
  severity: number;
  duration_category: string;
  triggers: string[];
  symptoms: string[];
  medication: string[];
  medication_effectiveness: number | null;
  pain_location: string;
  notes: string;
  timestamp: string;
}

interface HealthData {
  steps: number | null;
  sleep_hours: number | null;
  sleep_schedule: string | null;
  blood_pressure: string | null;
  bp_status: string | null;
  weight: number | null;
}

interface Pattern {
  type: 'positive' | 'negative' | 'warning' | 'insight';
  title: string;
  description: string;
  confidence: number;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

interface PatternDetectionScreenProps {
  navigation: { goBack: () => void };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function topItems(arr: string[], limit = 5) {
  const c: Record<string, number> = {};
  arr.forEach((i) => { if (i) c[i] = (c[i] || 0) + 1; });
  return Object.entries(c)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}

function buildPatternPrompt(logs: MigraineLog[], health: HealthData, userName: string): string {
  const triggers = topItems(logs.flatMap((l) => l.triggers));
  const symptoms = topItems(logs.flatMap((l) => l.symptoms));
  const meds = topItems(logs.flatMap((l) => l.medication));
  const now = new Date();
  const last30 = logs.filter(
    (l) => now.getTime() - new Date(l.timestamp).getTime() < 30 * 86400000,
  );
  const avgIntensity = logs.length
    ? (logs.reduce((s, l) => s + l.intensity, 0) / logs.length).toFixed(1)
    : 'N/A';

  return `You are a migraine pattern detection AI for patient: ${userName}.

REAL DATA (last ${logs.length} episodes):
- Episodes last 30 days: ${last30.length}
- Average intensity: ${avgIntensity}/10
- Top triggers: ${triggers.map((t) => `${t.name}(${t.count}x)`).join(', ') || 'none logged'}
- Top symptoms: ${symptoms.map((s) => `${s.name}(${s.count}x)`).join(', ') || 'none logged'}
- Medications used: ${meds.map((m) => `${m.name}(${m.count}x)`).join(', ') || 'none logged'}
- Sleep: ${health.sleep_hours != null ? health.sleep_hours + 'h/night avg' : 'no data'}
- Steps: ${health.steps != null ? health.steps.toLocaleString() + '/day avg' : 'no data'}
- Blood pressure: ${health.blood_pressure ?? 'no data'} ${health.bp_status ? `(${health.bp_status})` : ''}
- Weight: ${health.weight != null ? health.weight + ' kg' : 'no data'}

Analyse this data and return ONLY a valid JSON array of pattern objects. No explanation, no markdown, just raw JSON.
Each object must have:
- "type": one of "positive", "negative", "warning", "insight"
- "title": short title (max 6 words)
- "description": 1-2 sentence actionable insight based on the actual numbers above
- "confidence": integer 0-100 based on how much data supports this pattern

Rules:
- Use "positive" for protective factors found in data
- Use "negative" for harmful correlations in data
- Use "warning" for risk factors needing attention
- Use "insight" for neutral observations
- Generate 6-8 patterns based ONLY on the real data above
- If data is sparse, lower confidence scores accordingly
- Be specific — reference actual numbers from the data, not generic advice

Return only the JSON array, nothing else.`;
}

function buildChatSystemPrompt(
  logs: MigraineLog[],
  health: HealthData,
  patterns: Pattern[],
): string {
  const triggers = topItems(logs.flatMap((l) => l.triggers));
  const avgIntensity = logs.length
    ? (logs.reduce((s, l) => s + l.intensity, 0) / logs.length).toFixed(1)
    : 'N/A';

  return `You are a compassionate migraine health assistant with access to this patient's real data.

PATIENT DATA SUMMARY:
- Total episodes: ${logs.length} | Avg intensity: ${avgIntensity}/10
- Top triggers: ${triggers.map((t) => `${t.name}(${t.count}x)`).join(', ') || 'none'}
- Sleep: ${health.sleep_hours != null ? health.sleep_hours + 'h/night' : 'no data'}
- BP: ${health.blood_pressure ?? 'no data'} ${health.bp_status ? `(${health.bp_status})` : ''}
- Steps: ${health.steps?.toLocaleString() ?? 'no data'}/day
- Weight: ${health.weight != null ? health.weight + ' kg' : 'no data'}

DETECTED PATTERNS:
${patterns.map((p) => `- [${p.type.toUpperCase()}] ${p.title}: ${p.description} (${p.confidence}% confidence)`).join('\n')}

Answer the patient's questions about their migraine patterns using their real data above. Be warm, specific, and practical. Keep answers concise (2-4 sentences). Always base answers on the actual data. If something is not in the data, say so honestly.`;
}

// ─── Pattern Card ─────────────────────────────────────────────────────────────

function PatternCard({
  type, title, description, confidence, darkMode, isHighConfidence,
}: Pattern & { darkMode: boolean; isHighConfidence: boolean }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: confidence,
      duration: 800,
      delay: 200,
      useNativeDriver: false,
    }).start();
  }, [confidence]);

  const barWidth = anim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const iconMap = {
    positive: 'checkmark-circle',
    negative: 'trending-down',
    warning: 'warning',
    insight: 'flash',
  };
  const colorMap = {
    positive: '#10b981',
    negative: '#e11d48',
    warning: '#f59e0b',
    insight: '#a855f7',
  };

  const icon = iconMap[type] as any;
  const color = colorMap[type];

  return (
    <View style={[
      cs.patternCard,
      darkMode ? cs.patternCardDark : cs.patternCardLight,
      isHighConfidence && cs.highConfidenceCard,
      isHighConfidence && darkMode && cs.highConfidenceCardDark,
    ]}>
      {isHighConfidence && (
        <View style={cs.hcBadge}>
          <Ionicons name="star" size={10} color="#fff" />
          <Text style={cs.hcBadgeText}>High confidence</Text>
        </View>
      )}
      <View style={cs.patternContent}>
        <View style={cs.patternIconWrap}>
          <Ionicons name={icon} size={22} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[cs.patternTitle, darkMode && cs.patternTitleDark]}>{title}</Text>
          <Text style={[cs.patternDesc, darkMode && cs.patternDescDark]}>{description}</Text>
          <View style={cs.confidenceRow}>
            <View style={[cs.barBg, darkMode && cs.barBgDark]}>
              <Animated.View
                style={[cs.barFill, { width: barWidth, backgroundColor: color }]}
              />
            </View>
            <Text style={[cs.confText, { color }]}>{confidence}%</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Chat Bubble ──────────────────────────────────────────────────────────────

function ChatBubble({ message, darkMode }: { message: ChatMessage; darkMode: boolean }) {
  const isUser = message.role === 'user';
  return (
    <View style={[cs.bubbleRow, isUser && cs.bubbleRowUser]}>
      {!isUser && (
        <View style={cs.aiAvatar}>
          <Ionicons name="sparkles" size={12} color="#fff" />
        </View>
      )}
      <View style={[
        cs.bubble,
        isUser
          ? cs.bubbleUser
          : darkMode ? cs.bubbleAIDark : cs.bubbleAILight,
      ]}>
        <Text style={[
          cs.bubbleText,
          isUser
            ? cs.bubbleTextUser
            : darkMode ? cs.bubbleTextAIDark : cs.bubbleTextAILight,
        ]}>
          {message.text}
        </Text>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function PatternDetectionScreen({ navigation }: PatternDetectionScreenProps) {
  const { darkMode } = useTheme();
  const { userData } = useUser();
  const userName = userData?.name ?? 'Patient';

  const [logs, setLogs] = useState<MigraineLog[]>([]);
  const [health, setHealth] = useState<HealthData>({
    steps: null, sleep_hours: null, sleep_schedule: null,
    blood_pressure: null, bp_status: null, weight: null,
  });
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [patternsLoading, setPatternsLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);

  const chatScrollRef = useRef<ScrollView>(null);

  // ── Fetch real data ──────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setDataLoading(true);
    setDataError(null);
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
          sleep_hours: hd.sleep?.average_sleep_hours
            ? parseFloat(hd.sleep.average_sleep_hours.toFixed(1))
            : null,
          sleep_schedule:
            sc?.avg_bedtime && sc?.avg_wake_time
              ? `${sc.avg_bedtime} – ${sc.avg_wake_time}`
              : null,
          blood_pressure: latestBP
            ? `${latestBP.systolic}/${latestBP.diastolic}`
            : null,
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
        setLogs(
          (ld.logs || []).map((l: any) => ({
            date: fd(l.timestamp),
            intensity: l.intensity ?? 0,
            severity: l.severity ?? 0,
            duration_category: l.duration_category ?? '',
            triggers: l.triggers ?? [],
            symptoms: l.symptoms ?? [],
            medication: l.medication ?? [],
            medication_effectiveness: l.medication_effectiveness ?? null,
            pain_location: l.pain_location ?? '',
            notes: l.notes ?? '',
            timestamp: l.timestamp ?? '',
          })),
        );
      }
    } catch {
      setDataError('Could not reach the backend. Make sure the server is running.');
    } finally {
      setDataLoading(false);
    }
  }, [userName]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Generate AI patterns once data is ready ──────────────────────────────────
  useEffect(() => {
    if (dataLoading || logs.length === 0) return;
    generatePatterns();
  }, [dataLoading]);

  const generatePatterns = async () => {
    setPatternsLoading(true);
    try {
      const prompt = buildPatternPrompt(logs, health, userName);
      const raw = await getAIResponse(prompt);
      const cleaned = raw.replace(/```json|```/g, '').trim();
      const parsed: Pattern[] = JSON.parse(cleaned);
      setPatterns(parsed.sort((a, b) => b.confidence - a.confidence));
    } catch {
      setPatterns([{
        type: 'warning',
        title: 'Pattern analysis unavailable',
        description: 'Could not generate AI patterns. Check your API key or try again.',
        confidence: 0,
      }]);
    } finally {
      setPatternsLoading(false);
    }
  };

  // ── Chat ─────────────────────────────────────────────────────────────────────
  const sendChat = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    setChatInput('');

    const userMsg: ChatMessage = { role: 'user', text, timestamp: new Date() };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatLoading(true);
    setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const systemPrompt = buildChatSystemPrompt(logs, health, patterns);
      const history = [...chatMessages, userMsg]
        .map((m) => `${m.role === 'user' ? 'Patient' : 'Assistant'}: ${m.text}`)
        .join('\n');
      const fullPrompt = `${systemPrompt}\n\nConversation:\n${history}\n\nAssistant:`;
      const reply = await getAIResponse(fullPrompt);
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', text: reply.trim(), timestamp: new Date() },
      ]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Sorry, I could not process that. Please check your connection and try again.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setChatLoading(false);
      setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const dm = darkMode;

  return (
    <KeyboardAvoidingView
      style={[cs.container, dm && cs.containerDark]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* ── Patterns scroll ── */}
      <ScrollView
        style={cs.scroll}
        contentContainerStyle={cs.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[cs.content, { maxWidth }]}>

          {/* Info banner */}
          <View style={[cs.infoBanner, dm && cs.infoBannerDark]}>
            <Ionicons
              name="analytics-outline"
              size={16}
              color={dm ? '#a8d5c4' : '#2d4a42'}
              style={{ marginRight: 8 }}
            />
            <Text style={[cs.infoText, dm && cs.infoTextDark]}>
              Patterns are generated by AI using your real logged data. Confidence reflects data strength.
            </Text>
          </View>

          {/* Loading data */}
          {dataLoading && (
            <View style={cs.centered}>
              <ActivityIndicator size="large" color="#10b981" />
              <Text style={[cs.loadingText, dm && cs.loadingTextDark]}>
                Fetching your health data…
              </Text>
            </View>
          )}

          {/* Error */}
          {!dataLoading && dataError && (
            <View style={cs.centered}>
              <Ionicons name="cloud-offline-outline" size={48} color="#ef4444" />
              <Text style={[cs.errorText, dm && cs.loadingTextDark]}>{dataError}</Text>
              <Pressable onPress={fetchData} style={cs.retryBtn}>
                <Ionicons name="refresh" size={16} color="#fff" />
                <Text style={cs.retryTxt}>Retry</Text>
              </Pressable>
            </View>
          )}

          {/* No logs */}
          {!dataLoading && !dataError && logs.length === 0 && (
            <View style={cs.centered}>
              <Ionicons
                name="bar-chart-outline"
                size={48}
                color={dm ? '#5a8f7f' : '#a8d5c4'}
              />
              <Text style={[cs.loadingText, dm && cs.loadingTextDark]}>
                No migraine episodes logged yet.{'\n'}Start logging to see patterns.
              </Text>
            </View>
          )}

          {/* Generating patterns */}
          {!dataLoading && !dataError && logs.length > 0 && patternsLoading && (
            <View style={cs.centered}>
              <ActivityIndicator size="large" color="#10b981" />
              <Text style={[cs.loadingText, dm && cs.loadingTextDark]}>
                AI is analysing your patterns…
              </Text>
              <Text style={[cs.loadingSubText, dm && cs.loadingSubTextDark]}>
                This takes a few seconds
              </Text>
            </View>
          )}

          {/* Patterns ready */}
          {!dataLoading && !dataError && !patternsLoading && patterns.length > 0 && (
            <>
              <View style={cs.refreshRow}>
                <Text style={[cs.dataNote, dm && cs.dataNoteLight]}>
                  Based on {logs.length} episode{logs.length !== 1 ? 's' : ''}
                </Text>
                <Pressable onPress={generatePatterns} style={cs.refreshBtn}>
                  <Ionicons
                    name="refresh-outline"
                    size={14}
                    color={dm ? '#a8d5c4' : '#2d4a42'}
                  />
                  <Text style={[cs.refreshTxt, dm && cs.refreshTxtDark]}>Refresh</Text>
                </Pressable>
              </View>

              <View style={cs.patternsList}>
                {patterns.map((p, i) => (
                  <PatternCard
                    key={i}
                    {...p}
                    darkMode={dm}
                    isHighConfidence={p.confidence >= 80}
                  />
                ))}
              </View>
            </>
          )}

          {/* Footer */}
          {!dataLoading && !patternsLoading && patterns.length > 0 && (
            <View style={[cs.footerNote, dm && cs.footerNoteDark]}>
              <Text style={[cs.footerText, dm && cs.footerTextDark]}>
                Patterns are for informational purposes only. Consult your healthcare provider for medical advice.
              </Text>
            </View>
          )}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* ── Chat panel ── */}
      {chatVisible && (
        <View style={[cs.chatPanel, dm && cs.chatPanelDark]}>

          {/* Chat header */}
          <View style={[cs.chatHeader, dm && cs.chatHeaderDark]}>
            <View style={cs.chatHeaderLeft}>
              <View style={cs.aiAvatarLarge}>
                <Ionicons name="sparkles" size={14} color="#fff" />
              </View>
              <View>
                <Text style={[cs.chatTitle, dm && cs.chatTitleDark]}>
                  Ask about your patterns
                </Text>
                <Text style={[cs.chatSubtitle, dm && cs.chatSubtitleDark]}>
                  Powered by NeuroHeal AI
                </Text>
              </View>
            </View>
            <Pressable onPress={() => setChatVisible(false)} style={cs.chatClose}>
              <Ionicons name="chevron-down" size={20} color={dm ? '#a8d5c4' : '#7a9f94'} />
            </Pressable>
          </View>

          {/* Messages */}
          <ScrollView
            ref={chatScrollRef}
            style={cs.chatMessages}
            contentContainerStyle={{ padding: 12, gap: 10 }}
            showsVerticalScrollIndicator={false}
          >
            {chatMessages.length === 0 && (
              <View style={cs.chatEmpty}>
                <Text style={[cs.chatEmptyText, dm && cs.chatEmptyTextDark]}>
                  Ask me anything about your migraine patterns:
                </Text>
                {[
                  'Which trigger should I focus on first?',
                  'How does my sleep affect migraines?',
                  'What lifestyle changes would help most?',
                ].map((q, i) => (
                  <Pressable
                    key={i}
                    onPress={() => setChatInput(q)}
                    style={[cs.suggestionPill, dm && cs.suggestionPillDark]}
                  >
                    <Text style={[cs.suggestionText, dm && cs.suggestionTextDark]}>{q}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {chatMessages.map((m, i) => (
              <ChatBubble key={i} message={m} darkMode={dm} />
            ))}

            {chatLoading && (
              <View style={cs.bubbleRow}>
                <View style={cs.aiAvatar}>
                  <Ionicons name="sparkles" size={12} color="#fff" />
                </View>
                <View style={[cs.bubble, dm ? cs.bubbleAIDark : cs.bubbleAILight]}>
                  <ActivityIndicator size="small" color="#10b981" />
                </View>
              </View>
            )}
          </ScrollView>

          {/* Input */}
          <View style={[cs.chatInputRow, dm && cs.chatInputRowDark]}>
            <TextInput
              style={[cs.chatInput, dm && cs.chatInputDark]}
              placeholder="Ask about your patterns…"
              placeholderTextColor={dm ? '#5a8f7f' : '#a8d5c4'}
              value={chatInput}
              onChangeText={setChatInput}
              onSubmitEditing={sendChat}
              returnKeyType="send"
              multiline={false}
            />
            <Pressable
              onPress={sendChat}
              disabled={!chatInput.trim() || chatLoading}
              style={[
                cs.sendBtn,
                (!chatInput.trim() || chatLoading) && cs.sendBtnDisabled,
              ]}
            >
              <Ionicons name="send" size={16} color="#fff" />
            </Pressable>
          </View>
        </View>
      )}

      {/* ── Floating Ask AI button ── */}
      {!chatVisible && !dataLoading && !patternsLoading && patterns.length > 0 && (
        <Pressable
          onPress={() => setChatVisible(true)}
          style={({ pressed }) => [cs.fab, pressed && cs.fabPressed]}
        >
          <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
          <Text style={cs.fabText}>Ask AI</Text>
        </Pressable>
      )}
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const cs = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f8f7' },
  containerDark: { backgroundColor: '#1a2622' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  content: { width: '100%', alignSelf: 'center', padding: 16 },

  centered: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  loadingText: { fontSize: 14, color: '#7a9f94', textAlign: 'center', paddingHorizontal: 24 },
  loadingTextDark: { color: '#a8d5c4' },
  loadingSubText: { fontSize: 12, color: '#a8d5c4', textAlign: 'center' },
  loadingSubTextDark: { color: '#5a8f7f' },
  errorText: { fontSize: 14, color: '#ef4444', textAlign: 'center', paddingHorizontal: 16 },
  retryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#10b981', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, marginTop: 4 },
  retryTxt: { color: '#fff', fontWeight: '600', fontSize: 14 },

  infoBanner: { backgroundColor: '#d4e8e0', borderWidth: 1, borderColor: '#a8d5c4', borderRadius: 16, padding: 14, marginBottom: 16, flexDirection: 'row', alignItems: 'flex-start' },
  infoBannerDark: { backgroundColor: '#253029', borderColor: '#5a8f7f' },
  infoText: { fontSize: 13, color: '#2d4a42', lineHeight: 18, flex: 1 },
  infoTextDark: { color: '#d4e8e0' },

  refreshRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  dataNote: { fontSize: 12, color: '#7a9f94' },
  dataNoteLight: { color: '#a8d5c4' },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: 'rgba(16,185,129,0.1)' },
  refreshTxt: { fontSize: 12, fontWeight: '500', color: '#2d4a42' },
  refreshTxtDark: { color: '#a8d5c4' },

  patternsList: { gap: 12, marginBottom: 16 },
  patternCard: { borderRadius: 20, padding: 18, borderWidth: 1, overflow: 'hidden' },
  patternCardLight: { backgroundColor: '#f0f5f3', borderColor: '#d4e8e0' },
  patternCardDark: { backgroundColor: '#253029', borderColor: '#5a8f7f' },
  highConfidenceCard: { borderWidth: 2, borderColor: '#a8d5c4' },
  highConfidenceCardDark: { borderColor: '#10b981' },

  hcBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', backgroundColor: '#10b981', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 10 },
  hcBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },

  patternContent: { flexDirection: 'row', gap: 12 },
  patternIconWrap: { flexShrink: 0, marginTop: 2 },
  patternTitle: { fontSize: 16, fontWeight: '600', color: '#2d4a42', marginBottom: 6 },
  patternTitleDark: { color: '#d4e8e0' },
  patternDesc: { fontSize: 13, color: '#7a9f94', lineHeight: 19, marginBottom: 10 },
  patternDescDark: { color: '#a8d5c4' },
  confidenceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barBg: { flex: 1, height: 6, backgroundColor: '#c4dbd2', borderRadius: 3, overflow: 'hidden' },
  barBgDark: { backgroundColor: '#3a5a4e' },
  barFill: { height: '100%', borderRadius: 3 },
  confText: { fontSize: 11, fontWeight: '600', minWidth: 34 },

  footerNote: { backgroundColor: '#f0f5f3', borderWidth: 1, borderColor: '#d4e8e0', borderRadius: 16, padding: 14 },
  footerNoteDark: { backgroundColor: '#253029', borderColor: '#5a8f7f' },
  footerText: { fontSize: 13, color: '#2d4a42', textAlign: 'center', lineHeight: 18 },
  footerTextDark: { color: '#a8d5c4' },

  // FAB
  fab: { position: 'absolute', bottom: 24, right: 20, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#10b981', borderRadius: 28, paddingVertical: 14, paddingHorizontal: 20, shadowColor: '#10b981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6 },
  fabPressed: { opacity: 0.85, transform: [{ scale: 0.96 }] },
  fabText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Chat panel
  chatPanel: { height: 420, backgroundColor: '#f9fafb', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, borderColor: '#e5e7eb', shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 10 },
  chatPanelDark: { backgroundColor: '#1a2522', borderColor: '#3a5a4e' },
  chatHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  chatHeaderDark: { backgroundColor: '#253029', borderBottomColor: '#3a5a4e' },
  chatHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  aiAvatarLarge: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center' },
  chatTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  chatTitleDark: { color: '#d4e8e0' },
  chatSubtitle: { fontSize: 11, color: '#9ca3af' },
  chatSubtitleDark: { color: '#5a8f7f' },
  chatClose: { padding: 6 },
  chatMessages: { flex: 1 },

  chatEmpty: { alignItems: 'flex-start', gap: 8, paddingVertical: 8 },
  chatEmptyText: { fontSize: 13, color: '#9ca3af', marginBottom: 4 },
  chatEmptyTextDark: { color: '#5a8f7f' },
  suggestionPill: { backgroundColor: '#f0f5f3', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#d4e8e0' },
  suggestionPillDark: { backgroundColor: '#253029', borderColor: '#3a5a4e' },
  suggestionText: { fontSize: 12, color: '#2d4a42' },
  suggestionTextDark: { color: '#a8d5c4' },

  // Bubbles
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  bubbleRowUser: { justifyContent: 'flex-end' },
  aiAvatar: { width: 24, height: 24, borderRadius: 8, backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  bubble: { maxWidth: '80%', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 9 },
  bubbleUser: { backgroundColor: '#10b981', borderBottomRightRadius: 4 },
  bubbleAILight: { backgroundColor: '#f0f5f3', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#d4e8e0' },
  bubbleAIDark: { backgroundColor: '#253029', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#3a5a4e' },
  bubbleText: { fontSize: 13, lineHeight: 19 },
  bubbleTextUser: { color: '#fff' },
  bubbleTextAILight: { color: '#1f2937' },
  bubbleTextAIDark: { color: '#d4e8e0' },

  // Input
  chatInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: '#e5e7eb', backgroundColor: '#fff' },
  chatInputRowDark: { backgroundColor: '#253029', borderTopColor: '#3a5a4e' },
  chatInput: { flex: 1, height: 40, backgroundColor: '#f0f5f3', borderRadius: 20, paddingHorizontal: 14, fontSize: 13, color: '#111827', borderWidth: 1, borderColor: '#d4e8e0' },
  chatInputDark: { backgroundColor: '#1a2522', color: '#d4e8e0', borderColor: '#3a5a4e' },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { backgroundColor: '#a8d5c4' },
});