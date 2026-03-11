import React from 'react';
import { DashboardScreen } from '@/components/DashboardScreen';
import { useRouter } from 'expo-router';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Dashboard: undefined;
};

type DashboardScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;

// Create a navigation adapter for expo-router
export default function Dashboard() {
  const router = useRouter();

  // Create a navigation object that matches what DashboardScreen expects
  const navigation: DashboardScreenNavigationProp = {
    goBack: () => router.back(),
  } as DashboardScreenNavigationProp;

  return <DashboardScreen navigation={navigation} />;
}

