import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ModernHeaderProps {
    title?: string;
    onBack: () => void;
    onUserPress?: () => void;
}

export function ModernHeader({ title, onBack, onUserPress }: ModernHeaderProps) {
    return (
        <View style={styles.header}>
            <Pressable
                onPress={onBack}
                style={({ pressed }) => [
                    styles.backButton,
                    pressed && styles.backButtonPressed,
                ]}
            >
                <Ionicons name="chevron-back" size={28} color="#a78bfa" />
            </Pressable>
            {title && <Text style={styles.title}>{title}</Text>}
            {onUserPress && (
                <Pressable
                    onPress={onUserPress}
                    style={({ pressed }) => [
                        styles.userButton,
                        pressed && styles.userButtonPressed,
                    ]}
                >
                    <Ionicons name="person-circle" size={28} color="#a78bfa" />
                </Pressable>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 4,
        paddingVertical: 12,
        backgroundColor: '#0f172a',
        borderBottomWidth: 1,
        borderBottomColor: '#1e293b',
    },
    backButton: {
        padding: 12,
        marginLeft: 0,
    },
    backButtonPressed: {
        opacity: 0.6,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#f8fafc',
        flex: 1,
        textAlign: 'center',
    },
    userButton: {
        padding: 12,
        marginRight: 0,
    },
    userButtonPressed: {
        opacity: 0.6,
    },
});
