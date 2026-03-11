import { EmergencyTipsScreen } from '@/components/EmergencyTipsScreen';
import { ModernHeader } from '@/components/ModernHeader';
import { useRouter } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

// Create a navigation adapter for expo-router
export default function Emergency() {
  const router = useRouter();

  // Create a navigation object that matches what EmergencyTipsScreen expects
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
      <ModernHeader title="Migraine Help" onBack={() => router.back()} />
      <EmergencyTipsScreen navigation={navigation} />
    </View>
  );
}

