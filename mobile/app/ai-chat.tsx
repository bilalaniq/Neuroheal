import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    Pressable,
    Dimensions,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Animated,
    Alert,
    Clipboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { ModernHeader } from '@/components/ModernHeader';
import { Ionicons } from '@expo/vector-icons';
import { getAIResponse, ChatMessage } from '@/services/aiService';

const { width } = Dimensions.get('window');

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
    isError?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const QUICK_TOPICS = [
    { id: '1', label: 'What triggers my migraines?',    icon: 'flash-outline' },
    { id: '2', label: 'Best migraine prevention tips',  icon: 'shield-checkmark-outline' },
    { id: '3', label: 'Pain management techniques',     icon: 'hand-left-outline' },
    { id: '4', label: 'Foods to avoid with migraines',  icon: 'nutrition-outline' },
    { id: '5', label: 'How sleep affects migraines',    icon: 'moon-outline' },
    { id: '6', label: 'Stress & migraine connection',   icon: 'leaf-outline' },
    { id: '7', label: 'Common medication side effects', icon: 'medical-outline' },
    { id: '8', label: 'Weather impact on migraines',    icon: 'cloud-outline' },
    { id: '9', label: 'When to see a neurologist',      icon: 'heart-outline' },
];

// ─── Inline Text Renderer ─────────────────────────────────────────────────────

const InlineText = ({ text, style }: { text: string; style?: any }) => {
    const tokens = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    if (tokens.length === 1) return <Text style={style}>{text}</Text>;
    return (
        <Text style={style}>
            {tokens.map((token, i) => {
                const bold = token.match(/^\*\*(.+)\*\*$/);
                if (bold) return <Text key={i} style={[style, mdStyles.bold]}>{bold[1]}</Text>;
                const italic = token.match(/^\*([^*]+)\*$/);
                if (italic) return <Text key={i} style={[style, mdStyles.italic]}>{italic[1]}</Text>;
                return <Text key={i} style={style}>{token}</Text>;
            })}
        </Text>
    );
};

// ─── Markdown Block Renderer ──────────────────────────────────────────────────

const MarkdownRenderer = ({ text }: { text: string }) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let key = 0;

    for (const raw of lines) {
        const trimmed = raw.trim();

        if (trimmed === '') {
            elements.push(<View key={key++} style={{ height: 8 }} />);
            continue;
        }

        // H2 heading
        const h2 = trimmed.match(/^##\s+(.*)/);
        if (h2) {
            elements.push(<InlineText key={key++} text={h2[1]} style={mdStyles.h2} />);
            continue;
        }

        // H3 heading with accent bar
        const h3 = trimmed.match(/^###\s+(.*)/);
        if (h3) {
            elements.push(
                <View key={key++} style={mdStyles.headingRow}>
                    <View style={mdStyles.headingAccent} />
                    <InlineText text={h3[1]} style={mdStyles.h3} />
                </View>
            );
            continue;
        }

        // Divider
        if (trimmed === '---' || trimmed === '***') {
            elements.push(<View key={key++} style={mdStyles.divider} />);
            continue;
        }

        // Sub-bullet (2+ spaces indent)
        const subBullet = raw.match(/^(\s{2,})[\+\-\*•]\s+(.*)/);
        if (subBullet) {
            elements.push(
                <View key={key++} style={mdStyles.subBulletRow}>
                    <View style={mdStyles.subBulletDot} />
                    <InlineText text={subBullet[2]} style={mdStyles.subBulletText} />
                </View>
            );
            continue;
        }

        // Main bullet
        const bullet = trimmed.match(/^[\*\-\+•]\s+(.*)/);
        if (bullet) {
            elements.push(
                <View key={key++} style={mdStyles.bulletRow}>
                    <View style={mdStyles.bulletDot} />
                    <InlineText text={bullet[1]} style={mdStyles.bulletText} />
                </View>
            );
            continue;
        }

        // Numbered list
        const numbered = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numbered) {
            elements.push(
                <View key={key++} style={mdStyles.numberedRow}>
                    <View style={mdStyles.numberBadge}>
                        <Text style={mdStyles.numberBadgeText}>{numbered[1]}</Text>
                    </View>
                    <InlineText text={numbered[2]} style={mdStyles.bulletText} />
                </View>
            );
            continue;
        }

        // Blockquote
        const quote = trimmed.match(/^>\s+(.*)/);
        if (quote) {
            elements.push(
                <View key={key++} style={mdStyles.blockquote}>
                    <InlineText text={quote[1]} style={mdStyles.blockquoteText} />
                </View>
            );
            continue;
        }

        // Paragraph
        elements.push(<InlineText key={key++} text={trimmed} style={mdStyles.paragraph} />);
    }

    return <View style={mdStyles.container}>{elements}</View>;
};

// ─── Animated Typing Indicator ────────────────────────────────────────────────

const TypingIndicator = () => {
    const dots = [
        useRef(new Animated.Value(0)).current,
        useRef(new Animated.Value(0)).current,
        useRef(new Animated.Value(0)).current,
    ];

    useEffect(() => {
        const animations = dots.map((dot, i) =>
            Animated.loop(
                Animated.sequence([
                    Animated.delay(i * 180),
                    Animated.timing(dot, { toValue: 1, duration: 280, useNativeDriver: true }),
                    Animated.timing(dot, { toValue: 0, duration: 280, useNativeDriver: true }),
                    Animated.delay(560),
                ])
            )
        );
        animations.forEach(a => a.start());
        return () => animations.forEach(a => a.stop());
    }, []);

    return (
        <View style={typingStyles.wrapper}>
            {dots.map((dot, i) => (
                <Animated.View
                    key={i}
                    style={[
                        typingStyles.dot,
                        {
                            transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) }],
                            opacity: dot.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
                        },
                    ]}
                />
            ))}
        </View>
    );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AIChatScreen() {
    const { darkMode } = useTheme();
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([]);
    const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);
    const [chatStarted, setChatStarted] = useState(false);
    const inputRef = useRef<TextInput>(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    }, []);

    useEffect(() => {
        const t = setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 120);
        return () => clearTimeout(t);
    }, [messages, loading]);

    const sendMessage = useCallback(async (text: string) => {
        const trimmed = text.trim();
        if (!trimmed) return;

        setMessages(prev => [...prev, {
            id: `u_${Date.now()}`,
            text: trimmed,
            sender: 'user',
            timestamp: new Date(),
        }]);
        setChatStarted(true);
        setLoading(true);

        try {
            const aiText = await getAIResponse(trimmed, conversationHistory);

            setConversationHistory(prev => [
                ...prev,
                { role: 'user', content: trimmed },
                { role: 'assistant', content: aiText },
            ]);

            setMessages(prev => [...prev, {
                id: `a_${Date.now()}`,
                text: aiText,
                sender: 'ai',
                timestamp: new Date(),
            }]);
        } catch (error: any) {
            const isKeyError = error?.message?.toLowerCase().includes('api key') ||
                               error?.message?.toLowerCase().includes('groq');
            setMessages(prev => [...prev, {
                id: `e_${Date.now()}`,
                text: isKeyError
                    ? '⚠️ API key not configured. Add EXPO_PUBLIC_GROQ_API_KEY to your mobile/.env and restart Expo with --clear.'
                    : '⚠️ Connection issue. Please check your internet and try again.',
                sender: 'ai',
                timestamp: new Date(),
                isError: true,
            }]);
        } finally {
            setLoading(false);
        }
    }, [conversationHistory]);

    const handleSend = useCallback(() => {
        if (!inputText.trim() || loading) return;
        const t = inputText.trim();
        setInputText('');
        sendMessage(t);
    }, [inputText, loading, sendMessage]);

    const handleClearChat = useCallback(() => {
        Alert.alert('Clear Chat', 'Start a fresh conversation?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Clear', style: 'destructive',
                onPress: () => {
                    setMessages([]);
                    setConversationHistory([]);
                    setChatStarted(false);
                },
            },
        ]);
    }, []);

    const handleCopy = useCallback((text: string) => {
        Clipboard.setString(text);
        Alert.alert('Copied', 'Response copied to clipboard.');
    }, []);

    const formatTime = (d: Date) =>
        d.toLocaleTimeString('default', { hour: 'numeric', minute: '2-digit', hour12: true });

    return (
        <View style={S.container}>
            <ModernHeader
                title="NeuroHeal AI"
                onBack={() => router.back()}
                rightAction={chatStarted ? { icon: 'trash-outline', onPress: handleClearChat } : undefined}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={S.flex}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView
                    ref={scrollViewRef}
                    style={S.flex}
                    contentContainerStyle={S.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {!chatStarted ? (
                        // ══════════════════════════════════════════
                        //  Welcome Screen
                        // ══════════════════════════════════════════
                        <Animated.View style={{ opacity: fadeAnim }}>

                            {/* Hero */}
                            <View style={S.hero}>
                                <View style={S.heroBadge}>
                                    <Ionicons name="sparkles" size={36} color="#a78bfa" />
                                </View>
                                <Text style={S.heroTitle}>NeuroHeal AI</Text>
                                <Text style={S.heroSub}>Your intelligent migraine health assistant</Text>
                                <View style={S.badgeRow}>
                                    <View style={S.groqBadge}>
                                        <Ionicons name="flash" size={11} color="#a78bfa" />
                                        <Text style={S.groqBadgeText}>Groq · Llama 3.3 70B</Text>
                                    </View>
                                    <View style={S.freeBadge}>
                                        <Text style={S.freeBadgeText}>FREE</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Feature chips */}
                            <View style={S.chips}>
                                {[
                                    { icon: 'shield-checkmark', label: 'Migraine Focused', color: '#a78bfa' },
                                    { icon: 'lock-closed',      label: 'Private & Safe',  color: '#34d399' },
                                    { icon: 'flash',            label: 'Instant',          color: '#f59e0b' },
                                ].map((c, i) => (
                                    <View key={i} style={S.chip}>
                                        <Ionicons name={c.icon as any} size={16} color={c.color} />
                                        <Text style={S.chipText}>{c.label}</Text>
                                    </View>
                                ))}
                            </View>

                            {/* Quick topics */}
                            <Text style={S.sectionLabel}>COMMON QUESTIONS</Text>
                            {QUICK_TOPICS.map(topic => (
                                <Pressable
                                    key={topic.id}
                                    style={({ pressed }) => [S.topicCard, pressed && S.topicCardPressed]}
                                    onPress={() => sendMessage(topic.label)}
                                >
                                    <View style={S.topicIcon}>
                                        <Ionicons name={topic.icon as any} size={17} color="#a78bfa" />
                                    </View>
                                    <Text style={S.topicLabel}>{topic.label}</Text>
                                    <Ionicons name="chevron-forward" size={15} color="#334155" />
                                </Pressable>
                            ))}

                            <View style={S.welcomeNote}>
                                <Ionicons name="information-circle-outline" size={13} color="#334155" />
                                <Text style={S.welcomeNoteText}>
                                    Not a substitute for professional medical advice. Always consult your doctor.
                                </Text>
                            </View>
                        </Animated.View>

                    ) : (
                        // ══════════════════════════════════════════
                        //  Chat Messages
                        // ══════════════════════════════════════════
                        <>
                            {/* Date separator */}
                            <View style={S.dateSep}>
                                <View style={S.dateLine} />
                                <Text style={S.dateText}>
                                    {new Date().toLocaleDateString('default', {
                                        weekday: 'long', month: 'short', day: 'numeric',
                                    })}
                                </Text>
                                <View style={S.dateLine} />
                            </View>

                            {messages.map(msg => (
                                <View
                                    key={msg.id}
                                    style={[S.msgRow, msg.sender === 'user' && S.msgRowUser]}
                                >
                                    {msg.sender === 'ai' && (
                                        <View style={S.aiAvatar}>
                                            <Ionicons name="sparkles" size={15} color="#a78bfa" />
                                        </View>
                                    )}

                                    <View style={[
                                        S.bubble,
                                        msg.sender === 'user' ? S.bubbleUser : S.bubbleAI,
                                        msg.isError && S.bubbleError,
                                    ]}>
                                        {msg.sender === 'ai' && !msg.isError
                                            ? <MarkdownRenderer text={msg.text} />
                                            : <Text style={[
                                                S.msgText,
                                                msg.sender === 'user' && S.msgTextUser,
                                                msg.isError && S.msgTextError,
                                              ]}>
                                                {msg.text}
                                              </Text>
                                        }

                                        <View style={S.bubbleFooter}>
                                            <Text style={[S.ts, msg.sender === 'user' && S.tsUser]}>
                                                {formatTime(msg.timestamp)}
                                            </Text>
                                            {msg.sender === 'ai' && !msg.isError && (
                                                <Pressable onPress={() => handleCopy(msg.text)} hitSlop={8} style={S.copyBtn}>
                                                    <Ionicons name="copy-outline" size={12} color="#334155" />
                                                </Pressable>
                                            )}
                                        </View>
                                    </View>

                                    {msg.sender === 'user' && (
                                        <View style={S.userAvatar}>
                                            <Ionicons name="person" size={15} color="#fff" />
                                        </View>
                                    )}
                                </View>
                            ))}

                            {/* Typing indicator */}
                            {loading && (
                                <View style={S.msgRow}>
                                    <View style={S.aiAvatar}>
                                        <Ionicons name="sparkles" size={15} color="#a78bfa" />
                                    </View>
                                    <View style={[S.bubbleAI, S.typingBubble]}>
                                        <TypingIndicator />
                                    </View>
                                </View>
                            )}
                        </>
                    )}
                </ScrollView>

                {/* Medical disclaimer strip */}
                {chatStarted && (
                    <View style={S.disclaimerStrip}>
                        <Ionicons name="shield-checkmark-outline" size={10} color="#1e293b" />
                        <Text style={S.disclaimerText}>
                            Informational only · Always consult a healthcare professional
                        </Text>
                    </View>
                )}

                {/* ── Input Bar ─────────────────────────────────── */}
                <View style={S.inputArea}>
                    <View style={[S.inputRow, loading && S.inputRowDisabled]}>
                        <Ionicons
                            name="sparkles"
                            size={17}
                            color={loading ? '#1e293b' : '#7c3aed'}
                            style={S.inputIcon}
                        />
                        <TextInput
                            ref={inputRef}
                            style={S.input}
                            placeholder="Ask about migraines..."
                            placeholderTextColor="#334155"
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                            maxLength={500}
                            editable={!loading}
                            blurOnSubmit={false}
                            onSubmitEditing={handleSend}
                        />
                        {inputText.length > 400 && (
                            <Text style={S.charCount}>{500 - inputText.length}</Text>
                        )}
                        <Pressable
                            onPress={handleSend}
                            disabled={!inputText.trim() || loading}
                            style={({ pressed }) => [
                                S.sendBtn,
                                inputText.trim() && !loading && S.sendBtnActive,
                                pressed && S.sendBtnPressed,
                            ]}
                        >
                            {loading
                                ? <ActivityIndicator size="small" color="#a78bfa" />
                                : <Ionicons name="send" size={17} color={inputText.trim() ? '#fff' : '#1e293b'} />
                            }
                        </Pressable>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

// ─── Main Styles ──────────────────────────────────────────────────────────────

const S = StyleSheet.create({
    container:       { flex: 1, backgroundColor: '#060d1a' },
    flex:            { flex: 1 },
    scrollContent:   { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 28 },

    // Hero
    hero:            { alignItems: 'center', paddingVertical: 36 },
    heroBadge: {
        width: 82, height: 82, borderRadius: 41,
        backgroundColor: '#0d1526', justifyContent: 'center', alignItems: 'center',
        marginBottom: 20, borderWidth: 1, borderColor: '#1a2540',
        shadowColor: '#7c3aed', shadowOpacity: 0.4, shadowRadius: 24, elevation: 10,
    },
    heroTitle:       { fontSize: 30, fontWeight: '800', color: '#f1f5f9', letterSpacing: -0.5, marginBottom: 10 },
    heroSub:         { fontSize: 15, color: '#475569', textAlign: 'center', fontWeight: '400', marginBottom: 16, lineHeight: 22 },
    badgeRow:        { flexDirection: 'row', gap: 8 },
    groqBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: '#0d1526', paddingHorizontal: 11, paddingVertical: 6,
        borderRadius: 20, borderWidth: 1, borderColor: '#1a2540',
    },
    groqBadgeText:   { fontSize: 11, color: '#94a3b8', fontWeight: '600' },
    freeBadge: {
        backgroundColor: '#052e16', paddingHorizontal: 10, paddingVertical: 6,
        borderRadius: 20, borderWidth: 1, borderColor: '#166534',
    },
    freeBadgeText:   { fontSize: 10, color: '#4ade80', fontWeight: '800', letterSpacing: 1 },

    // Feature chips
    chips:           { flexDirection: 'row', gap: 8, marginBottom: 30 },
    chip: {
        flex: 1, backgroundColor: '#0a1020', borderRadius: 12,
        paddingVertical: 11, alignItems: 'center', gap: 6,
        borderWidth: 1, borderColor: '#131d35',
    },
    chipText:        { fontSize: 11, color: '#475569', fontWeight: '600', textAlign: 'center' },

    // Topics
    sectionLabel:    { fontSize: 11, fontWeight: '700', color: '#334155', letterSpacing: 1.2, marginBottom: 10 },
    topicCard: {
        backgroundColor: '#0a1020', borderRadius: 14,
        paddingHorizontal: 14, paddingVertical: 13,
        marginBottom: 8, flexDirection: 'row', alignItems: 'center',
        borderWidth: 1, borderColor: '#131d35',
    },
    topicCardPressed: { backgroundColor: '#0d1526', transform: [{ scale: 0.983 }] },
    topicIcon: {
        width: 34, height: 34, borderRadius: 10,
        backgroundColor: '#0d1526', justifyContent: 'center', alignItems: 'center',
        marginRight: 12, borderWidth: 1, borderColor: '#1a2540',
    },
    topicLabel:      { fontSize: 14, fontWeight: '500', color: '#94a3b8', flex: 1 },
    welcomeNote: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 6,
        marginTop: 24, paddingHorizontal: 2,
    },
    welcomeNoteText: { fontSize: 12, color: '#1e293b', lineHeight: 18, flex: 1 },

    // Date separator
    dateSep:         { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 10 },
    dateLine:        { flex: 1, height: 1, backgroundColor: '#0a1020' },
    dateText:        { fontSize: 11, color: '#1e293b', fontWeight: '600' },

    // Messages
    msgRow:          { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 14 },
    msgRowUser:      { justifyContent: 'flex-end' },
    aiAvatar: {
        width: 30, height: 30, borderRadius: 15,
        backgroundColor: '#0a1020', justifyContent: 'center', alignItems: 'center',
        marginRight: 8, flexShrink: 0,
        borderWidth: 1, borderColor: '#131d35',
    },
    userAvatar: {
        width: 30, height: 30, borderRadius: 15,
        backgroundColor: '#6d28d9', justifyContent: 'center', alignItems: 'center',
        marginLeft: 8, flexShrink: 0,
    },
    bubble: {
        maxWidth: '82%', borderRadius: 18,
        paddingHorizontal: 14, paddingTop: 12, paddingBottom: 8,
    },
    bubbleAI: {
        backgroundColor: '#0a1020',
        borderBottomLeftRadius: 4,
        borderWidth: 1, borderColor: '#131d35',
    },
    bubbleUser: {
        backgroundColor: '#5b21b6',
        borderBottomRightRadius: 4,
    },
    bubbleError: {
        backgroundColor: '#1a0a0a',
        borderColor: '#7f1d1d',
    },
    typingBubble:    { paddingVertical: 14 },
    msgText:         { fontSize: 14, lineHeight: 21, color: '#64748b' },
    msgTextUser:     { color: '#ddd6fe' },
    msgTextError:    { color: '#fca5a5' },
    bubbleFooter: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'space-between', marginTop: 7,
    },
    ts:              { fontSize: 11, color: '#1e293b' },
    tsUser:          { color: '#7c3aed' },
    copyBtn:         { padding: 3 },

    // Disclaimer
    disclaimerStrip: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 5, paddingVertical: 5, backgroundColor: '#060d1a',
    },
    disclaimerText:  { fontSize: 11, color: '#1e293b', fontWeight: '500' },

    // Input
    inputArea: {
        paddingHorizontal: 14, paddingTop: 10,
        paddingBottom: Platform.OS === 'ios' ? 30 : 16,
        backgroundColor: '#060d1a',
        borderTopWidth: 1, borderTopColor: '#0a1020',
    },
    inputRow: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#0a1020', borderRadius: 16,
        paddingHorizontal: 12, paddingVertical: 6,
        borderWidth: 1, borderColor: '#131d35', minHeight: 52,
    },
    inputRowDisabled: { opacity: 0.6 },
    inputIcon:       { marginRight: 8 },
    input: {
        flex: 1, fontSize: 14, color: '#cbd5e1',
        maxHeight: 110, lineHeight: 20, paddingVertical: 6,
    },
    charCount:       { fontSize: 11, color: '#334155', marginRight: 6 },
    sendBtn: {
        width: 38, height: 38, borderRadius: 11,
        backgroundColor: '#0d1526', justifyContent: 'center', alignItems: 'center',
    },
    sendBtnActive:   { backgroundColor: '#6d28d9' },
    sendBtnPressed:  { transform: [{ scale: 0.92 }], opacity: 0.85 },
});

// ─── Markdown Styles ──────────────────────────────────────────────────────────

const mdStyles = StyleSheet.create({
    container:        { paddingBottom: 2 },
    paragraph:        { fontSize: 14, lineHeight: 22, color: '#94a3b8', marginBottom: 6 },
    bold:             { fontWeight: '700', color: '#e2e8f0' },
    italic:           { fontStyle: 'italic', color: '#94a3b8' },

    h2: {
        fontSize: 15, fontWeight: '800', color: '#f1f5f9',
        marginBottom: 8, marginTop: 2,
    },
    headingRow:       { flexDirection: 'row', alignItems: 'center', marginBottom: 8, marginTop: 4 },
    headingAccent: {
        width: 3, height: 15, borderRadius: 2,
        backgroundColor: '#7c3aed', marginRight: 8,
    },
    h3:               { fontSize: 14, fontWeight: '700', color: '#c4b5fd' },

    divider:          { height: 1, backgroundColor: '#131d35', marginVertical: 10 },

    bulletRow:        { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
    bulletDot: {
        width: 7, height: 7, borderRadius: 3.5,
        backgroundColor: '#7c3aed',
        marginTop: 7, marginRight: 10, flexShrink: 0,
    },
    bulletText:       { flex: 1, fontSize: 14, lineHeight: 22, color: '#94a3b8' },

    subBulletRow:     { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 5, marginLeft: 18 },
    subBulletDot: {
        width: 5, height: 5, borderRadius: 2.5,
        backgroundColor: '#4c1d95',
        marginTop: 8, marginRight: 9, flexShrink: 0,
    },
    subBulletText:    { flex: 1, fontSize: 13, lineHeight: 20, color: '#64748b' },

    numberedRow:      { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
    numberBadge: {
        width: 20, height: 20, borderRadius: 10,
        backgroundColor: '#2e1065',
        justifyContent: 'center', alignItems: 'center',
        marginTop: 2, marginRight: 10, flexShrink: 0,
    },
    numberBadgeText:  { fontSize: 11, color: '#a78bfa', fontWeight: '800' },

    blockquote: {
        borderLeftWidth: 3, borderLeftColor: '#4c1d95',
        paddingLeft: 12, paddingVertical: 6,
        marginVertical: 6, backgroundColor: '#08111f',
        borderRadius: 4,
    },
    blockquoteText:   { fontSize: 13, lineHeight: 20, color: '#64748b', fontStyle: 'italic' },
});

// ─── Typing Indicator Styles ──────────────────────────────────────────────────

const typingStyles = StyleSheet.create({
    wrapper: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 2 },
    dot: {
        width: 8, height: 8, borderRadius: 4,
        backgroundColor: '#4c1d95',
    },
});