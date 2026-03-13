import React from 'react';
import { SafeAreaView } from 'react-native';
import { LoggingHub } from '@/components/LoggingHub';

export default function LoggingScreen() {
    return (
        <SafeAreaView style={{ flex: 1 }}>
            <LoggingHub />
        </SafeAreaView>
    );
}
