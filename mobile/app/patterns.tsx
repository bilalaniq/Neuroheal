import React from 'react';
import { PatternDetectionScreen } from '@/components/PatternDetectionScreen';
import { ModernHeader } from '@/components/ModernHeader';
import { useRouter } from 'expo-router';
import { StackNavigationProp } from '@react-navigation/native-stack';
import { View } from 'react-native';

type RootStackParamList = {
  Patterns: undefined;
};

type PatternDetectionScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Patterns'>;

// Create a navigation adapter for expo-router
export default function Patterns() {
  const router = useRouter();

  // Create a navigation object that matches what PatternDetectionScreen expects
  const navigation: PatternDetectionScreenNavigationProp = {
    goBack: () => router.back(),
  } as PatternDetectionScreenNavigationProp;

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <ModernHeader title="Pattern Detection" onBack={() => router.back()} />
      <PatternDetectionScreen navigation={navigation} />
    </View>
  );
}

