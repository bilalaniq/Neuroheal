import { NavigationBar } from '@/components/NavigationBar';
import { OnboardingScreen } from '@/components/OnboardingScreen';
import { PatternWarnings } from '@/components/PatternWarnings';
import { MigraineCalendar } from '@/components/MigraineCalendar';
import { QuickLog } from '@/components/quick-log';
import { MigraineReportChart } from '@/components/MigraineReportChart';
import { useTheme } from '@/contexts/ThemeContext';
import { useUser } from '@/contexts/UserContext';
import { useRealtimeMonitoring } from '@/hooks/useRealtimeMonitoring';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import { Dimensions, Modal, Pressable, ScrollView, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import FloatingMenu from './menu';

const { width } = Dimensions.get('window');
const maxWidth = Math.min(width - 48, 448);

// ── Change this to your PC's local IP when testing on a real device ──────────
// const BACKEND_URL = 'http://10.0.2.2:8080'; // Android emulator
const BACKEND_URL = 'http://192.168.37.37:8080';
// const BACKEND_URL = 'http://localhost:8080';  // iOS simulator
// const BACKEND_URL = 'http://192.168.1.X:8080'; // Real device

export default function HomeScreen() {
  const { darkMode } = useTheme();
  const { userData } = useUser();
  const router = useRouter();
  const realtime = useRealtimeMonitoring(0, { trackSteps: false });

  const [showOnboarding, setShowOnboarding] = useState(false);

  // ── Migraine days state — must be ABOVE early return ──────────────────────
  const [migraineDays, setMigraineDays] = useState([]);

  // ── Real health data from backend ─────────────────────────────────────────
  const [healthData, setHealthData] = useState<{
    steps: number | null;
    sleep_hours: number | null;
    sleep_schedule: string | null;
    blood_pressure: string | null;
    bp_status: string | null;
    weight: number | null;
    loading: boolean;
    error: string | null;
  }>({
    steps: null,
    sleep_hours: null,
    sleep_schedule: null,
    blood_pressure: null,
    bp_status: null,
    weight: null,
    loading: true,
    error: null,
  });

  // ── fetchHealthData — defined before useEffect ────────────────────────────
  const fetchHealthData = useCallback(async () => {
    try {
      setHealthData(prev => ({ ...prev, loading: true, error: null }));

      const res = await fetch(`${BACKEND_URL}/health/full?days=7`);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();

      // Steps
      const steps = data.steps?.total_steps ?? null;

      // Sleep hours
      const sleepHours = data.sleep?.average_sleep_hours
        ? parseFloat(data.sleep.average_sleep_hours.toFixed(1))
        : null;

      // Sleep schedule
      const schedule = data.sleep?.sleep_schedule;
      const sleepSchedule =
        schedule?.avg_bedtime && schedule?.avg_wake_time
          ? `${schedule.avg_bedtime} - ${schedule.avg_wake_time}`
          : null;

      // Blood pressure — most recent reading
      const bpReadings = data.blood_pressure?.readings ?? [];
      const latestBP = bpReadings.length > 0 ? bpReadings[bpReadings.length - 1] : null;
      const bloodPressure = latestBP ? `${latestBP.systolic}/${latestBP.diastolic}` : null;
      const bpStatus = latestBP?.status ?? null;

      // Weight
      const weight = data.weight?.latest_weight_kg ?? null;

      setHealthData({
        steps,
        sleep_hours: sleepHours,
        sleep_schedule: sleepSchedule,
        blood_pressure: bloodPressure,
        bp_status: bpStatus,
        weight,
        loading: false,
        error: null,
      });
    } catch (err: any) {
      setHealthData(prev => ({ ...prev, loading: false, error: 'Could not reach backend' }));
    }
  }, []);

  // ── fetchMigraineLogs — defined before useEffect ──────────────────────────
  const fetchMigraineLogs = useCallback(async (userId: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/migraine-episodes/history?user_id=${encodeURIComponent(userId)}`);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      const formatLocalDate = (timestamp: string) => {
        const d = new Date(timestamp);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      };
      const logs = (data.logs || []).map((log: any) => ({
        date: formatLocalDate(log.timestamp),
        hasMigraine: true,
        severity: log.severity ?? (log.intensity <= 3 ? 1 : log.intensity <= 6 ? 2 : log.intensity <= 8 ? 3 : 4),
        intensity: log.intensity ?? null,
        duration: log.duration_category === '1-2h' ? 2 : log.duration_category === '2-4h' ? 4 : log.duration_category === '4-8h' ? 6 : log.duration_category === '8h+' ? 9 : 1,
        duration_category: log.duration_category || '',
        triggers: log.triggers || [],
        note: log.notes || '',
        symptoms: log.symptoms || [],
        medication: log.medication || [],
        medication_effectiveness: log.medication_effectiveness ?? null,
        relief_methods: log.relief_methods || [],
        pain_location: log.pain_location || '',
        disability_level: log.disability_level ?? null,
        warning_signs_before: log.warning_signs_before ?? false,
        warning_description: log.warning_description || '',
        timestamp: log.timestamp || '',
      }));
      setMigraineDays(logs);
    } catch (err) {
      setMigraineDays([]);
    }
  }, []);

  // ── All useEffects — must be ABOVE early return ───────────────────────────
  useEffect(() => {
    fetchHealthData();
  }, [fetchHealthData]);

  useEffect(() => {
    if (userData?.name) {
      fetchMigraineLogs(userData.name);
    }
  }, [userData?.name, fetchMigraineLogs]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleOnboardingComplete = () => setShowOnboarding(false);
  const handleViewPatterns = () => router.push('/patterns');

  // ── Early return AFTER all hooks ──────────────────────────────────────────
  if (!userData?.integrations) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  return (
    <View style={[styles.container, darkMode && styles.containerDark]}>
      <NavigationBar showBackButton={false} userButtonPosition="left" />
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
            style={({ pressed }) => [styles.emergencyButton, darkMode && styles.emergencyButtonDark, pressed && styles.emergencyButtonPressed]}
          >
            <Ionicons name="medical" size={40} color="#dc2626" style={styles.emergencyIcon} />
            <Text style={[styles.emergencyText, darkMode && styles.emergencyTextDark]}>Migraine Help</Text>
            <Text style={[styles.emergencySubtext, darkMode && styles.emergencySubtextDark]}>Press for immediate migraine relief tips</Text>
          </Pressable>

          {/* AI Chat Card */}
          <Pressable
            onPress={() => router.push('/ai-chat')}
            style={({ pressed }) => [styles.aiChatCard, darkMode && styles.aiChatCardDark, pressed && styles.aiChatCardPressed]}
          >
            <View style={styles.aiChatHeader}>
              <View style={[styles.aiChatIcon, darkMode && styles.aiChatIconDark]}>
                <Ionicons name="sparkles" size={24} color="#10b981" />
              </View>
              <View style={styles.aiChatInfo}>
                <Text style={[styles.aiChatTitle, darkMode && styles.aiChatTitleDark]}>NeuroRecord AI</Text>
                <Text style={[styles.aiChatSubtitle, darkMode && styles.aiChatSubtitleDark]}>Your health assistant</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={darkMode ? '#a8d5c4' : '#7a9f94'} />
            </View>
            <Text style={[styles.aiChatDescription, darkMode && styles.aiChatDescriptionDark]}>
              Ask about your migraines, get insights, and track your health journey
            </Text>
          </Pressable>

          {/* Pattern Warnings */}
          <PatternWarnings onPress={handleViewPatterns} maxItems={2} style={styles.warningsContainer} />

          {/* Dashboard Heading + Refresh */}
          <View style={styles.dashboardHeadingRow}>
            <Text style={[styles.dashboardHeading, darkMode && styles.dashboardHeadingDark]}>Dashboard</Text>
            <Pressable onPress={fetchHealthData} style={styles.refreshButton}>
              <Ionicons name="refresh" size={18} color={darkMode ? '#a8d5c4' : '#5a8f7f'} />
            </Pressable>
            {healthData.loading && (
              <ActivityIndicator size="small" color="#5a8f7f" style={{ marginLeft: 6 }} />
            )}
          </View>

          {/* Error banner */}
          {healthData.error && (
            <View style={[styles.errorBanner, darkMode && styles.errorBannerDark]}>
              <Ionicons name="warning-outline" size={14} color="#d97706" />
              <Text style={styles.errorText}> {healthData.error}</Text>
            </View>
          )}

          {/* Dashboard Cards */}
          <View style={styles.dashboardGrid}>

            {/* Sleep */}
            <View style={[styles.dashboardCard, darkMode && styles.dashboardCardDark]}>
              <View style={styles.cardHeader}>
                <Ionicons name="moon" size={20} color={darkMode ? '#a8d5c4' : '#2d4a42'} />
                <Text style={[styles.cardTitle, darkMode && styles.cardTitleDark]}>Sleep</Text>
              </View>
              <Text style={[styles.cardValue, darkMode && styles.cardValueDark]}>
                {healthData.sleep_hours !== null ? `${healthData.sleep_hours} hrs` : '-- hrs'}
              </Text>
              <Text style={[styles.cardLabel, darkMode && styles.cardLabelDark]}>
                {healthData.sleep_hours !== null ? 'Avg last 7 days' : 'No sleep data yet'}
              </Text>
            </View>

            {/* Stress — no API source yet */}
            <View style={[styles.dashboardCard, darkMode && styles.dashboardCardDark]}>
              <View style={styles.cardHeader}>
                <Ionicons name="warning" size={20} color={darkMode ? '#f59e0b' : '#d97706'} />
                <Text style={[styles.cardTitle, darkMode && styles.cardTitleDark]}>Stress Level</Text>
              </View>
              <Text style={[styles.cardValue, darkMode && styles.cardValueDark]}>--/10</Text>
              <Text style={[styles.cardLabel, darkMode && styles.cardLabelDark]}>Log manually</Text>
            </View>

            {/* Blood Pressure */}
            <View style={[styles.dashboardCard, darkMode && styles.dashboardCardDark]}>
              <View style={styles.cardHeader}>
                <Ionicons name="heart" size={20} color={darkMode ? '#ef4444' : '#dc2626'} />
                <Text style={[styles.cardTitle, darkMode && styles.cardTitleDark]}>Blood Pressure</Text>
              </View>
              <Text style={[styles.cardValue, darkMode && styles.cardValueDark]}>
                {healthData.blood_pressure ?? '--'}
              </Text>
              <Text style={[styles.cardLabel, darkMode && styles.cardLabelDark]}>
                {healthData.bp_status ?? 'No BP monitor connected'}
              </Text>
            </View>

            {/* Steps */}
            <View style={[styles.dashboardCard, darkMode && styles.dashboardCardDark]}>
              <View style={styles.cardHeader}>
                <Ionicons name="walk" size={20} color={darkMode ? '#10b981' : '#059669'} />
                <Text style={[styles.cardTitle, darkMode && styles.cardTitleDark]}>Steps</Text>
              </View>
              <Text style={[styles.cardValue, darkMode && styles.cardValueDark]}>
                {healthData.steps !== null ? healthData.steps.toLocaleString() : '--'}
              </Text>
              <Text style={[styles.cardLabel, darkMode && styles.cardLabelDark]}>
                {healthData.steps !== null ? 'Last 7 days' : 'No step data yet'}
              </Text>
            </View>

            {/* Sleep Schedule */}
            <View style={[styles.dashboardCard, darkMode && styles.dashboardCardDark]}>
              <View style={styles.cardHeader}>
                <Ionicons name="time" size={20} color={darkMode ? '#a8d5c4' : '#2d4a42'} />
                <Text style={[styles.cardTitle, darkMode && styles.cardTitleDark]}>Sleep Schedule</Text>
              </View>
              <Text style={[styles.cardValue, darkMode && styles.cardValueDark]}>
                {healthData.sleep_schedule ?? '--'}
              </Text>
              <Text style={[styles.cardLabel, darkMode && styles.cardLabelDark]}>
                {healthData.sleep_schedule ? 'Avg pattern' : 'No sleep data yet'}
              </Text>
            </View>

            {/* Weight */}
            <View style={[styles.dashboardCard, darkMode && styles.dashboardCardDark]}>
              <View style={styles.cardHeader}>
                <Ionicons name="barbell" size={20} color={darkMode ? '#a8d5c4' : '#2d4a42'} />
                <Text style={[styles.cardTitle, darkMode && styles.cardTitleDark]}>Weight</Text>
              </View>
              <Text style={[styles.cardValue, darkMode && styles.cardValueDark]}>
                {healthData.weight !== null ? `${healthData.weight} kg` : '--'}
              </Text>
              <Text style={[styles.cardLabel, darkMode && styles.cardLabelDark]}>
                {healthData.weight !== null ? 'Latest reading' : 'No scale connected'}
              </Text>
            </View>

            {/* Weather */}
            <Pressable
              onPress={() => router.push('/weather-forecast')}
              style={({ pressed }) => [styles.dashboardCard, darkMode && styles.dashboardCardDark, pressed && styles.weatherCardPressed]}
            >
              <View style={styles.cardHeader}>
                <Ionicons name="partly-sunny" size={20} color={darkMode ? '#f59e0b' : '#d97706'} />
                <Text style={[styles.cardTitle, darkMode && styles.cardTitleDark]}>Weather</Text>
              </View>
              {realtime.weather.temperatureC !== null ? (
                <>
                  <Text style={[styles.cardValue, darkMode && styles.cardValueDark]}>{Math.round(realtime.weather.temperatureC)}°C</Text>
                  <Text style={[styles.cardLabel, darkMode && styles.cardLabelDark]}>{realtime.weather.weatherLabel || 'No data'}</Text>
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

          {/* Migraine Report Chart */}
          <MigraineReportChart migraineDays={migraineDays} />

        </View>
      </ScrollView>

      <FloatingMenu />

      <Modal visible={showOnboarding} animationType="slide" onRequestClose={() => setShowOnboarding(false)}>
        <OnboardingScreen onComplete={() => setShowOnboarding(false)} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f8f7' },
  containerDark: { backgroundColor: '#1a2622' },
  scrollView: { flex: 1 },
  contentContainer: { padding: 24, paddingTop: 12 },
  content: { width: '100%', alignSelf: 'center' },
  header: { alignItems: 'center', marginBottom: 20, marginTop: 0 },
  title: { fontSize: 28, fontWeight: '700', color: '#2d4a42', marginBottom: 4 },
  titleDark: { color: '#d4e8e0' },
  subtitle: { fontSize: 16, color: '#7a9f94' },
  subtitleDark: { color: '#7a9f94' },
  emergencyButton: { width: '100%', backgroundColor: '#f0f5f3', borderWidth: 1, borderColor: '#d4e8e0', borderRadius: 20, padding: 16, alignItems: 'center', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 },
  emergencyButtonDark: { backgroundColor: '#253029', borderColor: '#5a8f7f' },
  emergencyButtonPressed: { transform: [{ scale: 0.98 }], opacity: 0.85 },
  emergencyIcon: { marginBottom: 4 },
  emergencyText: { fontSize: 20, fontWeight: '600', color: '#d4a0a0', marginBottom: 4 },
  emergencyTextDark: { color: '#d4a0a0' },
  emergencySubtext: { fontSize: 14, color: '#7a6363', textAlign: 'center', paddingHorizontal: 16 },
  emergencySubtextDark: { color: '#d4a0a0' },
  aiChatCard: { width: '100%', backgroundColor: '#f0f5f3', borderWidth: 1, borderColor: '#d4e8e0', borderRadius: 20, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  aiChatCardDark: { backgroundColor: '#253029', borderColor: '#5a8f7f' },
  aiChatCardPressed: { opacity: 0.7, transform: [{ scale: 0.98 }] },
  aiChatHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  aiChatIcon: { width: 48, height: 48, backgroundColor: '#d4e8e0', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  aiChatIconDark: { backgroundColor: '#3f5451' },
  aiChatInfo: { flex: 1 },
  aiChatTitle: { fontSize: 16, fontWeight: '600', color: '#2d4a42', marginBottom: 2 },
  aiChatTitleDark: { color: '#d4e8e0' },
  aiChatSubtitle: { fontSize: 12, color: '#7a9f94' },
  aiChatSubtitleDark: { color: '#7a9f94' },
  aiChatDescription: { fontSize: 13, color: '#5a8f7f', lineHeight: 18 },
  aiChatDescriptionDark: { color: '#5a8f7f' },
  warningsContainer: { marginBottom: 16 },
  dashboardHeadingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 24, marginBottom: 16 },
  dashboardHeading: { fontSize: 20, fontWeight: '700', color: '#2d4a42', flex: 1 },
  dashboardHeadingDark: { color: '#d4e8e0' },
  refreshButton: { padding: 4 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef3c7', borderRadius: 8, padding: 8, marginBottom: 12 },
  errorBannerDark: { backgroundColor: '#3a2e1a' },
  errorText: { fontSize: 12, color: '#d97706' },
  dashboardGrid: { gap: 12, marginBottom: 24 },
  dashboardCard: { backgroundColor: '#f0f5f3', borderWidth: 1, borderColor: '#d4e8e0', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  dashboardCardDark: { backgroundColor: '#253029', borderColor: '#5a8f7f' },
  weatherCardPressed: { opacity: 0.7, transform: [{ scale: 0.98 }] },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  cardTitle: { fontSize: 12, fontWeight: '600', color: '#2d4a42', textTransform: 'uppercase', letterSpacing: 0.5 },
  cardTitleDark: { color: '#95d5b2' },
  cardValue: { fontSize: 24, fontWeight: '700', color: '#2d4a42', marginBottom: 4 },
  cardValueDark: { color: '#d4e8e0' },
  cardLabel: { fontSize: 12, color: '#7a9f94' },
  cardLabelDark: { color: '#95d5b2' },
});