import React from 'react';
import { DiaryEntriesScreen } from '@/components/DiaryEntriesScreen';
import { useRouter } from 'expo-router';
import { StackNavigationProp } from '@react-navigation/stack';

type RootStackParamList = {
  Diary: undefined;
};

type DiaryEntriesScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Diary'>;

// Create a navigation adapter for expo-router
export default function Diary() {
  const router = useRouter();

  // Create a navigation object that matches what DiaryEntriesScreen expects
  const navigation: DiaryEntriesScreenNavigationProp = {
    goBack: () => router.back(),
  } as DiaryEntriesScreenNavigationProp;

  return <DiaryEntriesScreen navigation={navigation} />;
}

