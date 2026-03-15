import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

interface ModernHeaderProps {
    title?: string;
    onBack?: () => void;
    onUserPress?: () => void;
    rightAction?: {
        icon: keyof typeof Ionicons.glyphMap;
        onPress: () => void;
    };
}

export function ModernHeader({
    title,
    onBack,
    onUserPress,
    rightAction,
}: ModernHeaderProps) {
    const insets = useSafeAreaInsets();

    const renderRight = () => {
        if (rightAction) {
            return (
                <Pressable
                    onPress={rightAction.onPress}
                    style={({ pressed }) => [styles.iconBtn, pressed && styles.btnPressed]}
                >
                    <Ionicons name={rightAction.icon} size={20} color="#e9d5ff" />
                </Pressable>
            );
        }
        if (onUserPress) {
            return (
                <Pressable
                    onPress={onUserPress}
                    style={({ pressed }) => [styles.iconBtn, pressed && styles.btnPressed]}
                >
                    <Ionicons name="person-circle" size={20} color="#e9d5ff" />
                </Pressable>
            );
        }
        // Always render invisible spacer so title stays centered
        return <View style={[styles.iconBtn, styles.invisible]} />;
    };

    return (
        <LinearGradient
            colors={['#0d0618', '#160a2e']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.header, { paddingTop: insets.top + 8 }]}
        >
            {/* LEFT — back button or spacer */}
            {onBack ? (
                <Pressable
                    onPress={onBack}
                    style={({ pressed }) => [styles.iconBtn, pressed && styles.btnPressed]}
                >
                    <Ionicons name="chevron-back" size={20} color="#e9d5ff" />
                </Pressable>
            ) : (
                <View style={[styles.iconBtn, styles.invisible]} />
            )}

            {/* CENTER — title */}
            <Text style={styles.title} numberOfLines={1}>
                {title ?? ''}
            </Text>

            {/* RIGHT — optional action or spacer */}
            {renderRight()}

        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#2b0f4d',
        gap: 12,
    },
    iconBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#231344',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#4c1d95',
    },
    invisible: {
        backgroundColor: 'transparent',
        borderColor: 'transparent',
    },
    btnPressed: {
        opacity: 0.7,
        transform: [{ scale: 0.96 }],
    },
    title: {
        flex: 1,
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        textAlign: 'center',
        letterSpacing: 0.2,
    },
});