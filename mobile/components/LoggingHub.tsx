import React, { useState } from 'react';
import {
    View, Text, StyleSheet, Pressable, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ModernHeader } from '@/components/ModernHeader';
import { QuickLog } from './quick-log';
import { DetailedClassify } from './detailed-classify';
import { MorningCheck } from './morning-check';
import { SleepLog } from './sleep-log';

type LogType = 'quick' | 'detailed' | 'morning' | 'sleep';

interface LoggingHubProps {
    navigation?: { goBack: () => void; navigate: (route: string) => void; };
}

const TABS = [
    { id: 'quick'    as LogType, label: 'Quick Log',  icon: 'flash',    },
    { id: 'detailed' as LogType, label: 'Classify',   icon: 'analytics' },
    { id: 'morning'  as LogType, label: 'Daily Risk', icon: 'sunny'     },
    { id: 'sleep'    as LogType, label: 'Sleep',      icon: 'moon'      },
] as const;

export const LoggingHub: React.FC<LoggingHubProps> = ({ navigation }) => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<LogType>('quick');

    const renderContent = () => {
        switch (activeTab) {
            case 'quick':    return <QuickLog />;
            case 'detailed': return <DetailedClassify />;
            case 'morning':  return <MorningCheck />;
            case 'sleep':    return <SleepLog />;
            default:         return <QuickLog />;
        }
    };

    return (
        <View style={s.container}>
            <ModernHeader
                title="Logging"
                onBack={() => { if (navigation) navigation.goBack(); else router.back(); }}
            />

            {/* ── Tab bar ── */}
            <View style={s.tabBarWrap}>
                <View style={s.tabTrack}>
                    {TABS.map(tab => {
                        const active = activeTab === tab.id;
                        return (
                            <Pressable
                                key={tab.id}
                                onPress={() => setActiveTab(tab.id)}
                                style={({ pressed }) => [
                                    s.tab,
                                    active && s.tabActive,
                                    pressed && !active && s.tabPressed,
                                ]}
                            >
                                <Ionicons
                                    name={tab.icon as any}
                                    size={16}
                                    color={active ? '#fff' : '#6b21a8'}
                                />
                                <Text style={[s.tabLabel, active && s.tabLabelActive]}>
                                    {tab.label}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>
            </View>

            <View style={s.content}>
                {renderContent()}
            </View>
        </View>
    );
};

const s = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },

    tabBarWrap: {
        backgroundColor: '#0d0618',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#1a0b2e',
    },

    // The pill track background
    tabTrack: {
        flexDirection: 'row',
        backgroundColor: '#1a0b2e',
        borderRadius: 14,
        padding: 4,
        gap: 2,
    },

    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        paddingVertical: 10,
        borderRadius: 11,
    },
    tabActive: {
        backgroundColor: '#6107c9',
        shadowColor: '#6107c9',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
    },
    tabPressed: {
        backgroundColor: 'rgba(97,7,201,0.15)',
    },
    tabLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6b21a8',
    },
    tabLabelActive: {
        color: '#fff',
        fontWeight: '700',
    },

    content: {
        flex: 1,
    },
});