import React from 'react';
import { LoggingHub } from '@/components/LoggingHub';
import { ModernHeader } from '@/components/ModernHeader';
import { useRouter } from 'expo-router';
import { View } from 'react-native';

export default function Migraine() {
  const router = useRouter();

  // Create a navigation object for LoggingHub
  const navigation = {
    goBack: () => router.back(),
    navigate: (route: string) => {
      if (route === 'Main') {
        router.push('/(tabs)');
      }
    },
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <ModernHeader title="Migraine Logging" onBack={() => router.back()} />
      <LoggingHub navigation={navigation} />
    </View>
  );
}

