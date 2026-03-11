import React from 'react';
import { MigraineTrackingScreen } from '@/components/MigraineTrackingScreen';
import { ModernHeader } from '@/components/ModernHeader';
import { useRouter } from 'expo-router';
import { StackNavigationProp } from '@react-navigation/native-stack';
import { View } from 'react-native';

type RootStackParamList = {
  Tracking: undefined;
  Main: undefined;
};

type MigraineTrackingScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Tracking'>;

// Create a navigation adapter for expo-router
export default function Migraine() {
  const router = useRouter();

  // Create a navigation object that matches what MigraineTrackingScreen expects
  const navigation = {
    goBack: () => router.back(),
    navigate: (route: keyof RootStackParamList) => {
      if (route === 'Main') {
        router.push('/(tabs)');
      }
    },
  } as MigraineTrackingScreenNavigationProp;

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <ModernHeader title="Log Migraine" onBack={() => router.back()} />
      <MigraineTrackingScreen navigation={navigation} />
    </View>
  );
}

