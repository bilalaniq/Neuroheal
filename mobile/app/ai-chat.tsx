import React, { useState, useRef, useEffect } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { ModernHeader } from '@/components/ModernHeader';
import { Ionicons } from '@expo/vector-icons';
import { getAIResponse } from '@/services/aiService';

const { width } = Dimensions.get('window');
const maxWidth = Math.min(width - 48, 448);

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
}

const QUICK_TOPICS = [
    { id: '1', label: 'What triggers my migraines?', icon: 'flash' },
    { id: '2', label: 'Best migraine prevention tips', icon: 'shield-checkmark' },
    { id: '3', label: 'Pain management techniques', icon: 'hand-left' },
    { id: '4', label: 'Foods to avoid', icon: 'nutrition' },
    { id: '5', label: 'Sleep and migraines', icon: 'moon' },
    { id: '6', label: 'Stress management', icon: 'leaf' },
    { id: '7', label: 'Medication side effects', icon: 'medical' },
    { id: '8', label: 'Weather impact on migraines', icon: 'cloud' },
    { id: '9', label: 'When to see a doctor', icon: 'heart' },
];

export default function AIChatScreen() {
    const { darkMode } = useTheme();
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);
    const [chatStarted, setChatStarted] = useState(false);

    useEffect(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
    }, [messages]);

    const handleQuickTopic = async (topic: string) => {
        // Add user message
        const userMessage: Message = {
            id: Date.now().toString(),
            text: topic,
            sender: 'user',
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setChatStarted(true);
        setLoading(true);

        try {
            // Call AI service
            const aiResponseText = await getAIResponse(topic);

            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: aiResponseText,
                sender: 'ai',
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, aiMessage]);
        } catch (error) {
            console.error('AI Error:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: 'Sorry, I had trouble responding. Please try again.',
                sender: 'ai',
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!inputText.trim()) return;

        // Add user message
        const userMessage: Message = {
            id: Date.now().toString(),
            text: inputText,
            sender: 'user',
            timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputText('');
        setChatStarted(true);
        setLoading(true);

        try {
            // Call AI service
            const aiResponseText = await getAIResponse(inputText);

            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: aiResponseText,
                sender: 'ai',
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, aiMessage]);
        } catch (error) {
            console.error('AI Error:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: 'Sorry, I had trouble responding. Please try again.',
                sender: 'ai',
                timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (date: Date): string => {
        return date.toLocaleTimeString('default', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
    };

    return (
        <View style={styles.container}>
            <ModernHeader title="Health AI" onBack={() => router.back()} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    ref={scrollViewRef}
                    style={styles.messagesContainer}
                    contentContainerStyle={styles.messagesContent}
                    scrollEventThrottle={16}
                >
                    {!chatStarted ? (
                        // Explore View
                        <View style={styles.exploreContainer}>
                            {/* Header */}
                            <View style={styles.headerSection}>
                                <View style={styles.iconBadge}>
                                    <Ionicons name="sparkles" size={32} color="#a78bfa" />
                                </View>
                                <Text style={styles.assistantTitle}>Health AI</Text>
                                <Text style={styles.subtitle}>Ask about your migraines & health</Text>
                            </View>

                            {/* Topics Section */}
                            <View style={styles.topicsSection}>
                                <Text style={styles.topicsHeader}>Common Questions</Text>
                                <View style={styles.topicsContainer}>
                                    {QUICK_TOPICS.map((topic) => (
                                        <Pressable
                                            key={topic.id}
                                            style={({ pressed }) => [
                                                styles.topicCard,
                                                pressed && styles.topicCardPressed,
                                            ]}
                                            onPress={() => handleQuickTopic(topic.label)}
                                        >
                                            <View style={styles.topicIconContainer}>
                                                <Ionicons name={topic.icon} size={20} color="#a78bfa" />
                                            </View>
                                            <Text style={styles.topicCardText}>{topic.label}</Text>
                                            <Ionicons name="arrow-forward" size={16} color="#9ca3af" />
                                        </Pressable>
                                    ))}
                                </View>
                            </View>
                        </View>
                    ) : (
                        // Chat View
                        <>
                            {messages.map((message) => (
                                <View
                                    key={message.id}
                                    style={[
                                        styles.messageWrapper,
                                        message.sender === 'user' && styles.userMessageWrapper,
                                    ]}
                                >
                                    {message.sender === 'ai' && (
                                        <View style={styles.aiAvatar}>
                                            <Ionicons name="sparkles" size={18} color="#a78bfa" />
                                        </View>
                                    )}

                                    <View
                                        style={[
                                            styles.messageBubble,
                                            message.sender === 'user'
                                                ? styles.userBubble
                                                : styles.aiBubble,
                                        ]}
                                    >
                                        <Text style={styles.messageText}>
                                            {message.text}
                                        </Text>
                                        <Text style={styles.timestamp}>
                                            {formatTime(message.timestamp)}
                                        </Text>
                                    </View>

                                    {message.sender === 'user' && (
                                        <View style={styles.userAvatar}>
                                            <Ionicons name="person" size={18} color="#1f2937" />
                                        </View>
                                    )}
                                </View>
                            ))}

                            {loading && (
                                <View style={styles.loadingContainer}>
                                    <View style={styles.aiBubble}>
                                        <ActivityIndicator size="small" color="#a78bfa" />
                                    </View>
                                </View>
                            )}
                        </>
                    )}
                </ScrollView>

                {/* Input Area - Always visible */}
                <View style={styles.inputArea}>
                    <View style={styles.inputWrapper}>
                        <Ionicons name="sparkles" size={20} color="#a78bfa" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Ask me anything"
                            placeholderTextColor="#6b7280"
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                            maxLength={500}
                            editable={!loading}
                        />
                        <Pressable
                            onPress={handleSendMessage}
                            disabled={!inputText.trim() || loading}
                            style={({ pressed }) => [
                                styles.sendButton,
                                (!inputText.trim() || loading) && styles.sendButtonDisabled,
                                pressed && styles.sendButtonPressed,
                            ]}
                        >
                            <Ionicons
                                name="send"
                                size={20}
                                color={!inputText.trim() || loading ? '#6b7280' : '#a78bfa'}
                            />
                        </Pressable>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    keyboardView: {
        flex: 1,
    },
    messagesContainer: {
        flex: 1,
    },
    messagesContent: {
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 20,
    },
    exploreContainer: {
        flex: 1,
        paddingHorizontal: 0,
    },
    headerSection: {
        alignItems: 'center',
        marginBottom: 40,
        marginTop: 20,
    },
    iconBadge: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#1e293b',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#334155',
    },
    assistantTitle: {
        fontSize: 36,
        fontWeight: '800',
        color: '#f8fafc',
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: -0.8,
    },
    subtitle: {
        fontSize: 15,
        color: '#94a3b8',
        textAlign: 'center',
        fontWeight: '500',
    },
    topicsSection: {
        flex: 1,
        paddingHorizontal: 16,
    },
    topicsHeader: {
        fontSize: 16,
        fontWeight: '700',
        color: '#f8fafc',
        marginBottom: 14,
    },
    topicsContainer: {
        flex: 1,
    },
    topicCard: {
        backgroundColor: '#1e293b',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#334155',
    },
    topicCardPressed: {
        backgroundColor: '#293548',
        transform: [{ scale: 0.98 }],
    },
    topicIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 8,
        backgroundColor: '#0f172a',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    topicCardText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#e2e8f0',
        flex: 1,
    },
    messageWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 16,
    },
    userMessageWrapper: {
        justifyContent: 'flex-end',
    },
    aiAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#1e293b',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        marginBottom: 4,
        borderWidth: 1,
        borderColor: '#334155',
    },
    userAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#a78bfa',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
        marginBottom: 4,
    },
    messageBubble: {
        maxWidth: '80%',
        paddingHorizontal: 14,
        paddingVertical: 11,
        borderRadius: 14,
    },
    aiBubble: {
        backgroundColor: '#1e293b',
        borderBottomLeftRadius: 4,
        borderWidth: 1,
        borderColor: '#334155',
    },
    userBubble: {
        backgroundColor: '#a78bfa',
        borderBottomRightRadius: 4,
    },
    messageText: {
        fontSize: 14,
        lineHeight: 20,
        color: '#e2e8f0',
        fontWeight: '500',
    },
    timestamp: {
        fontSize: 11,
        color: '#64748b',
        marginTop: 6,
    },
    loadingContainer: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    inputArea: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingBottom: 20,
        backgroundColor: '#0f172a',
        borderTopWidth: 1,
        borderTopColor: '#1e293b',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1e293b',
        borderRadius: 12,
        paddingHorizontal: 14,
        borderWidth: 1,
        borderColor: '#334155',
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        paddingVertical: 12,
        fontSize: 14,
        color: '#f8fafc',
        maxHeight: 100,
        fontWeight: '500',
    },
    sendButton: {
        padding: 8,
    },
    sendButtonDisabled: {
        opacity: 0.4,
    },
    sendButtonPressed: {
        opacity: 0.7,
    },
});
