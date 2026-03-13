import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { QuickLog } from './quick-log';
import { DetailedClassify } from './detailed-classify';
import { MorningCheck } from './morning-check';
import { SleepLog } from './sleep-log';

type LogType = 'quick' | 'detailed' | 'morning' | 'sleep';

interface LoggingHubProps {
    navigation?: {
        goBack: () => void;
        navigate: (route: string) => void;
    };
}

export const LoggingHub: React.FC<LoggingHubProps> = ({ navigation }) => {
    const { darkMode } = useTheme();
    const [activeTab, setActiveTab] = useState<LogType>('quick');

    const tabs = [
        {
            id: 'quick',
            label: 'Quick Log',
            icon: 'flash',
            description: 'Log migraine during episode',
        },
        {
            id: 'detailed',
            label: 'Classify',
            icon: 'list',
            description: 'Detailed symptom analysis',
        },
        {
            id: 'morning',
            label: 'Daily Risk',
            icon: 'sunny',
            description: 'Morning trigger check',
        },
        {
            id: 'sleep',
            label: 'Sleep',
            icon: 'moon',
            description: 'Sleep quality assessment',
        },
    ] as const;

    const renderContent = () => {
        switch (activeTab) {
            case 'quick':
                return <QuickLog />;
            case 'detailed':
                return <DetailedClassify />;
            case 'morning':
                return <MorningCheck />;
            case 'sleep':
                return <SleepLog />;
            default:
                return <QuickLog />;
        }
    };

    return (
        <View
            style={[
                styles.container,
                darkMode ? styles.containerDark : styles.containerLight,
            ]}
        >
            {/* Tab Bar */}
            <View
                style={[
                    styles.tabBar,
                    darkMode ? styles.tabBarDark : styles.tabBarLight,
                ]}
            >
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabContent}
                >
                    {tabs.map((tab) => (
                        <Pressable
                            key={tab.id}
                            onPress={() => setActiveTab(tab.id as LogType)}
                            style={[
                                styles.tab,
                                activeTab === tab.id &&
                                (darkMode ? styles.tabActiveDark : styles.tabActive),
                            ]}
                        >
                            <Ionicons
                                name={tab.icon as any}
                                size={24}
                                color={
                                    activeTab === tab.id
                                        ? '#10b981'
                                        : darkMode
                                            ? '#a8d5c4'
                                            : '#7a9f94'
                                }
                                style={{ marginBottom: 4 }}
                            />
                            <Text
                                style={[
                                    styles.tabLabel,
                                    activeTab === tab.id
                                        ? darkMode
                                            ? styles.tabLabelActiveDark
                                            : styles.tabLabelActive
                                        : darkMode
                                            ? { color: '#a8d5c4' }
                                            : { color: '#7a9f94' },
                                ]}
                                numberOfLines={1}
                            >
                                {tab.label}
                            </Text>
                        </Pressable>
                    ))}
                </ScrollView>
            </View>

            {/* Indicator Line */}
            <View
                style={[
                    styles.indicatorLine,
                    darkMode ? { backgroundColor: '#10b981', opacity: 0.8 } : { backgroundColor: '#10b981' },
                ]}
            />

            {/* Content */}
            <View style={styles.contentContainer}>{renderContent()}</View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    containerLight: {
        backgroundColor: '#f5f8f7',
    },
    containerDark: {
        backgroundColor: '#1a2522',
    },
    tabBar: {
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
    },
    tabBarLight: {
        backgroundColor: '#fff',
        borderBottomColor: '#d4e8e0',
    },
    tabBarDark: {
        backgroundColor: '#253029',
        borderBottomColor: '#5a8f7f',
    },
    tabContent: {
        paddingHorizontal: 8,
        gap: 8,
    },
    tab: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 12,
        alignItems: 'center',
        minWidth: 70,
    },
    tabActive: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
    },
    tabActiveDark: {
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
    },
    tabLabel: {
        fontSize: 11,
        fontWeight: '500',
        textAlign: 'center',
    },
    tabLabelActive: {
        color: '#10b981',
        fontWeight: '600',
    },
    tabLabelActiveDark: {
        color: '#10b981',
        fontWeight: '600',
    },
    indicatorLine: {
        height: 2,
        backgroundColor: '#10b981',
    },
    contentContainer: {
        flex: 1,
    },
});
