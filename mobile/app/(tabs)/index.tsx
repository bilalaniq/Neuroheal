import { NavigationBar } from '@/components/NavigationBar';
import { OnboardingScreen } from '@/components/OnboardingScreen';
import { PatternWarnings } from '@/components/PatternWarnings';
import { MigraineCalendar } from '@/components/MigraineCalendar';
import { useTheme } from '@/contexts/ThemeContext';
import { useUser } from '@/contexts/UserContext';
import { useRealtimeMonitoring } from '@/hooks/useRealtimeMonitoring';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import FloatingMenu from './menu';

const { width } = Dimensions.get('window');
const maxWidth = Math.min(width - 48, 448);

export default function HomeScreen() {
  const { darkMode } = useTheme();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const router = useRouter();

  const { userData } = useUser();
  const realtime = useRealtimeMonitoring(0, { trackSteps: false });
  console.log("User Data in HomeScreen:", userData);

  const handleViewWarnings = () => {
    router.push('/pattern-warnings');
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
  };

  // Show onboarding screen if user hasn't completed setup
  if (!userData?.integrations) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  const handleViewPatterns = () => {
    router.push('/patterns');
  };

  // Generate mock migraine data for the calendar
  const generateMigraineDays = (days: number = 90) => {
    const data: any[] = [];
    const today = new Date();

    const possibleTriggers = [
      'stress', 'lack of sleep', 'bright lights', 'loud noises', 'certain foods',
      'weather changes', 'hormonal changes', 'skipped meals', 'dehydration', 'screen time'
    ];

    const possibleSymptoms = [
      'throbbing pain', 'nausea', 'light sensitivity', 'sound sensitivity',
      'visual disturbances', 'dizziness', 'fatigue', 'concentration issues'
    ];

    const mockNotes = [
      'Woke up with mild headache, got worse during work meeting',
      'Stressful day at work, headache started around lunch',
      'Weather was changing, felt pressure building behind eyes',
      'Skipped breakfast, headache started mid-morning',
      'Long screen time session, eyes felt strained',
      'Good day, stayed hydrated and got enough sleep',
      'Exercise helped prevent headache today',
    ];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      const hasMigraine = Math.random() < 0.25; // 25% chance

      let severity = 0;
      let duration = 0;
      let triggers: string[] = [];
      let symptoms: string[] = [];
      let medication: string[] = [];

      if (hasMigraine) {
        severity = Math.floor(Math.random() * 4) + 1;
        duration = Math.floor(Math.random() * 12) + 1;
        triggers = possibleTriggers.slice(0, Math.floor(Math.random() * 3) + 1);
        symptoms = possibleSymptoms.slice(0, Math.floor(Math.random() * 4) + 2);
        if (severity > 2) {
          medication = [['ibuprofen', 'aspirin', 'prescription'], [Math.floor(Math.random() * 3)]];
        }
      }

      data.push({
        date: date.toISOString().split('T')[0],
        hasMigraine,
        severity,
        duration,
        triggers,
        note: mockNotes[Math.floor(Math.random() * mockNotes.length)],
        symptoms,
        medication,
      });
    }

    return data;
  };

  const migraineDays = generateMigraineDays();

  return (
    <View style={[styles.container, darkMode && styles.containerDark]}>
      <NavigationBar
        showBackButton={false}
        userButtonPosition="left"
      />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={[styles.content, { maxWidth }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, darkMode && styles.titleDark]}>Hello {userData?.name ?? ""}!</Text>
            <Text style={[styles.subtitle, darkMode && styles.subtitleDark]}>How are we feeling today?</Text>
          </View>

          {/* Emergency Button */}
          <Pressable
            onPress={() => router.push('/emergency')}
            style={({ pressed }) => [
              styles.emergencyButton,
              darkMode && styles.emergencyButtonDark,
              pressed && styles.emergencyButtonPressed,
            ]}
          >
            <Ionicons name="medical" size={40} color="#dc2626" style={styles.emergencyIcon} />
            <Text style={[styles.emergencyText, darkMode && styles.emergencyTextDark]}>Migraine Help</Text>
            <Text style={[styles.emergencySubtext, darkMode && styles.emergencySubtextDark]}>Press for immediate migraine relief tips</Text>
          </Pressable>

          {/* AI Chat Card */}
          <Pressable
            onPress={() => router.push('/ai-chat')}
            style={({ pressed }) => [
              styles.aiChatCard,
              darkMode && styles.aiChatCardDark,
              pressed && styles.aiChatCardPressed,
            ]}
          >
            <View style={styles.aiChatHeader}>
              <View style={[styles.aiChatIcon, darkMode && styles.aiChatIconDark]}>
                <Ionicons name="sparkles" size={24} color="#10b981" />
              </View>
              <View style={styles.aiChatInfo}>
                <Text style={[styles.aiChatTitle, darkMode && styles.aiChatTitleDark]}>
                  NeuroRecord AI
                </Text>
                <Text style={[styles.aiChatSubtitle, darkMode && styles.aiChatSubtitleDark]}>
                  Your health assistant
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={darkMode ? '#a8d5c4' : '#7a9f94'}
              />
            </View>
            <Text style={[styles.aiChatDescription, darkMode && styles.aiChatDescriptionDark]}>
              Ask about your migraines, get insights, and track your health journey
            </Text>
          </Pressable>



          {/* Pattern Warnings */}
          <PatternWarnings
            onPress={handleViewPatterns}
            maxItems={2}
            style={styles.warningsContainer}
          />


          {/* Dashboard Heading */}
          <Text style={[styles.dashboardHeading, darkMode && styles.dashboardHeadingDark]}>Dashboard</Text>

          {/* Dashboard Cards Grid */}
          <View style={styles.dashboardGrid}>
            {/* Sleep Card */}
            <View style={[styles.dashboardCard, darkMode && styles.dashboardCardDark]}>
              <View style={styles.cardHeader}>
                <Ionicons name="moon" size={20} color={darkMode ? '#a8d5c4' : '#2d4a42'} />
                <Text style={[styles.cardTitle, darkMode && styles.cardTitleDark]}>Sleep</Text>
              </View>
              <Text style={[styles.cardValue, darkMode && styles.cardValueDark]}>7.5 hrs</Text>
              <Text style={[styles.cardLabel, darkMode && styles.cardLabelDark]}>Average last night</Text>
            </View>

            {/* Stress Level Card */}
            <View style={[styles.dashboardCard, darkMode && styles.dashboardCardDark]}>
              <View style={styles.cardHeader}>
                <Ionicons name="warning" size={20} color={darkMode ? '#f59e0b' : '#d97706'} />
                <Text style={[styles.cardTitle, darkMode && styles.cardTitleDark]}>Stress Level</Text>
              </View>
              <Text style={[styles.cardValue, darkMode && styles.cardValueDark]}>4/10</Text>
              <Text style={[styles.cardLabel, darkMode && styles.cardLabelDark]}>Moderate</Text>
            </View>

            {/* Blood Pressure Card */}
            <View style={[styles.dashboardCard, darkMode && styles.dashboardCardDark]}>
              <View style={styles.cardHeader}>
                <Ionicons name="heart" size={20} color={darkMode ? '#ef4444' : '#dc2626'} />
                <Text style={[styles.cardTitle, darkMode && styles.cardTitleDark]}>Blood Pressure</Text>
              </View>
              <Text style={[styles.cardValue, darkMode && styles.cardValueDark]}>120/80</Text>
              <Text style={[styles.cardLabel, darkMode && styles.cardLabelDark]}>Normal</Text>
            </View>

            {/* Steps Card */}
            <View style={[styles.dashboardCard, darkMode && styles.dashboardCardDark]}>
              <View style={styles.cardHeader}>
                <Ionicons name="walk" size={20} color={darkMode ? '#10b981' : '#059669'} />
                <Text style={[styles.cardTitle, darkMode && styles.cardTitleDark]}>Steps</Text>
              </View>
              <Text style={[styles.cardValue, darkMode && styles.cardValueDark]}>8,234</Text>
              <Text style={[styles.cardLabel, darkMode && styles.cardLabelDark]}>Today</Text>
            </View>

            {/* Sleep Schedule Card */}
            <View style={[styles.dashboardCard, darkMode && styles.dashboardCardDark]}>
              <View style={styles.cardHeader}>
                <Ionicons name="time" size={20} color={darkMode ? '#a8d5c4' : '#2d4a42'} />
                <Text style={[styles.cardTitle, darkMode && styles.cardTitleDark]}>Sleep Schedule</Text>
              </View>
              <Text style={[styles.cardValue, darkMode && styles.cardValueDark]}>11 PM - 7 AM</Text>
              <Text style={[styles.cardLabel, darkMode && styles.cardLabelDark]}>Regular pattern</Text>
            </View>

            {/* Live Weather Card */}
            <Pressable
              onPress={() => router.push('/weather-forecast')}
              style={({ pressed }) => [
                styles.dashboardCard,
                darkMode && styles.dashboardCardDark,
                pressed && styles.weatherCardPressed,
              ]}
            >
              <View style={styles.cardHeader}>
                <Ionicons name="partly-sunny" size={20} color={darkMode ? '#f59e0b' : '#d97706'} />
                <Text style={[styles.cardTitle, darkMode && styles.cardTitleDark]}>Weather</Text>
              </View>
              {realtime.weather.temperatureC !== null ? (
                <>
                  <Text style={[styles.cardValue, darkMode && styles.cardValueDark]}>
                    {Math.round(realtime.weather.temperatureC)}°C
                  </Text>
                  <Text style={[styles.cardLabel, darkMode && styles.cardLabelDark]}>
                    {realtime.weather.weatherLabel || 'No data'}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={[styles.cardValue, darkMode && styles.cardValueDark]}>--°C</Text>
                  <Text style={[styles.cardLabel, darkMode && styles.cardLabelDark]}>Loading...</Text>
                </>
              )}
            </Pressable>
          </View>

          {/* Migraine Calendar */}
          <MigraineCalendar migraineDays={migraineDays} darkMode={darkMode} />

          

        </View>
      </ScrollView>

      <FloatingMenu />

      {/* Onboarding Modal for re-running setup */}
      <Modal
        visible={showOnboarding}
        animationType="slide"
        onRequestClose={() => setShowOnboarding(false)}
      >
        <OnboardingScreen onComplete={() => setShowOnboarding(false)} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f8f7',
  },
  containerDark: {
    backgroundColor: '#1a2622',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingTop: 12,
  },
  content: {
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2d4a42',
    marginBottom: 4,
  },
  titleDark: {
    color: '#d4e8e0',
  },
  subtitle: {
    fontSize: 16,
    color: '#7a9f94',
  },
  subtitleDark: {
    color: '#7a9f94',
  },
  emergencyButton: {
    width: '100%',
    backgroundColor: '#f0f5f3',
    borderWidth: 1,
    borderColor: '#d4e8e0',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  emergencyButtonDark: {
    backgroundColor: '#253029',
    borderColor: '#5a8f7f',
  },
  emergencyButtonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.85,
  },
  emergencyIcon: {
    marginBottom: 4,
  },
  emergencyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#d4a0a0',
    marginBottom: 4,
  },
  emergencyTextDark: {
    color: '#d4a0a0',
  },
  emergencySubtext: {
    fontSize: 14,
    color: '#7a6363',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  emergencySubtextDark: {
    color: '#d4a0a0',
  },
  aiChatCard: {
    width: '100%',
    backgroundColor: '#f0f5f3',
    borderWidth: 1,
    borderColor: '#d4e8e0',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  aiChatCardDark: {
    backgroundColor: '#253029',
    borderColor: '#5a8f7f',
  },
  aiChatCardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  aiChatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  aiChatIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#d4e8e0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  aiChatIconDark: {
    backgroundColor: '#3f5451',
  },
  aiChatInfo: {
    flex: 1,
  },
  aiChatTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d4a42',
    marginBottom: 2,
  },
  aiChatTitleDark: {
    color: '#d4e8e0',
  },
  aiChatSubtitle: {
    fontSize: 12,
    color: '#7a9f94',
  },
  aiChatSubtitleDark: {
    color: '#7a9f94',
  },
  aiChatDescription: {
    fontSize: 13,
    color: '#5a8f7f',
    lineHeight: 18,
  },
  aiChatDescriptionDark: {
    color: '#5a8f7f',
  },
  warningsContainer: {
    marginBottom: 16,
  },
  highConfidenceCard: {
    backgroundColor: '#f0f5f3',
    borderWidth: 1,
    borderColor: '#d4e8e0',
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  highConfidenceCardDark: {
    backgroundColor: '#253029',
    borderColor: '#5a8f7f',
  },
  highConfidenceHeader: {
    marginBottom: 12,
  },
  highConfidenceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2d4a42',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  highConfidenceLabelDark: {
    color: '#95d5b2',
  },
  highConfidenceContent: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  highConfidenceTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2d4a42',
    marginBottom: 4,
  },
  highConfidenceTitleDark: {
    color: '#d4e8e0',
  },
  highConfidenceDescription: {
    fontSize: 13,
    color: '#7a9f94',
    lineHeight: 18,
  },
  highConfidenceDescriptionDark: {
    color: '#95d5b2',
  },
  confidenceBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  confidenceBarFill: {
    height: '100%',
    backgroundColor: '#a78bfa',
    borderRadius: 3,
  },
  confidencePercent: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2d4a42',
    marginBottom: 12,
  },
  confidencePercentDark: {
    color: '#d4e8e0',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f3e8ff',
    borderRadius: 12,
    paddingVertical: 10,
  },
  viewAllButtonDark: {
    backgroundColor: '#3f2a5e',
  },
  viewAllButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  viewAllButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7c3aed',
  },
  viewAllButtonTextDark: {
    color: '#a78bfa',
  },
  dashboardHeading: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2d4a42',
    marginTop: 24,
    marginBottom: 16,
  },
  dashboardHeadingDark: {
    color: '#d4e8e0',
  },
  dashboardGrid: {
    gap: 12,
    marginBottom: 24,
  },
  dashboardCard: {
    backgroundColor: '#f0f5f3',
    borderWidth: 1,
    borderColor: '#d4e8e0',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  dashboardCardDark: {
    backgroundColor: '#253029',
    borderColor: '#5a8f7f',
  },
  weatherCardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2d4a42',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardTitleDark: {
    color: '#95d5b2',
  },
  cardValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2d4a42',
    marginBottom: 4,
  },
  cardValueDark: {
    color: '#d4e8e0',
  },
  cardLabel: {
    fontSize: 12,
    color: '#7a9f94',
  },
  cardLabelDark: {
    color: '#95d5b2',
  },
  onboardingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#d4e8e0',
    borderWidth: 1,
    borderColor: '#a8d5c4',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  onboardingButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  onboardingButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d4a42',
  },
  onboardingButtonTextDark: {
    color: '#2d4a42',
  },
  testNotificationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#d4e8e0',
    borderWidth: 1,
    borderColor: '#a8d5c4',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  testNotificationButtonDark: {
    backgroundColor: '#253029',
    borderColor: '#5a8f7f',
  },
  testNotificationButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d4a42',
  },
  testNotificationButtonTextDark: {
    color: '#d4e8e0',
  },
});
