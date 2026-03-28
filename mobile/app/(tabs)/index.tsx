import { NavigationBar } from '@/components/NavigationBar';
import { OnboardingScreen } from '@/components/OnboardingScreen';
import { PatternWarnings } from '@/components/PatternWarnings';
import { MigraineCalendar } from '@/components/MigraineCalendar';
import { QuickLog } from '@/components/quick-log';
import { useUser } from '@/contexts/UserContext';
import { useRealtimeMonitoring } from '@/hooks/useRealtimeMonitoring';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useEffect, useCallback } from 'react';
import { Dimensions, Modal, Pressable, ScrollView, StyleSheet, Text, View, ActivityIndicator, Image } from 'react-native';
import { API_BASE_URL as BACKEND_URL } from '@/config/api';



const { width } = Dimensions.get('window');
const maxWidth = Math.min(width - 48, 700);




export default function HomeScreen() {
  const darkMode = false;
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
      <NavigationBar showBackButton={false} userButtonPosition="left" menuRoute="/menu" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={[styles.content, { maxWidth }]}>

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, darkMode && styles.titleDark]}>Hello {userData?.name ?? ""}!</Text>
            <Text style={[styles.subtitle, darkMode && styles.subtitleDark]}>How are we feeling today?</Text>
          </View>



          {/* AI Chat Card */}


          {/* Horizontal quick tools: AI + Log Migraine */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickToolsRow} contentContainerStyle={styles.quickToolsRowContent}>
            <Pressable
              onPress={() => router.push('/ai-chat')}
              style={({ pressed }) => [styles.quickToolCard, pressed && styles.quickToolCardPressed]}
            >
              <Image source={require('../../assets/images/ai-technology.png')} style={styles.quickToolImage} />
              <Text style={styles.quickToolTitle}>AI Chat</Text>
              <Text style={styles.quickToolSubtitle}>Ask questions and get insights</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/logging')}
              style={({ pressed }) => [styles.quickToolCard, pressed && styles.quickToolCardPressed]}
            >
              <Image source={require('../../assets/images/paralyzed.png')} style={styles.quickToolImage} />
              <Text style={styles.quickToolTitle}>Log Migraine</Text>
              <Text style={styles.quickToolSubtitle}>Record your headache details</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push('/neuro-record')}
              style={({ pressed }) => [styles.quickToolCard, pressed && styles.quickToolCardPressed]}
            >
              <Image source={require('../../assets/images/pie-chart.png')} style={styles.quickToolImage} />
              <Text style={styles.quickToolTitle}>Neuro Record</Text>
              <Text style={styles.quickToolSubtitle}>Open migraine report & calendar</Text>
            </Pressable>


            <Pressable onPress={() => router.push('/emergency')} style={[styles.emergencyVerticalCard, darkMode && styles.emergencyVerticalCardDark]}>
              <Ionicons name="medical" size={28} color="#f87171" />
              <Text style={[styles.emergencyVerticalTitle, darkMode && styles.emergencyVerticalTitleDark]}>SOS Emergency</Text>
              <Text style={[styles.emergencyVerticalHint, darkMode && styles.emergencyVerticalHintDark]}>Rapid access for serious symptoms</Text>
            </Pressable>

          </ScrollView>

          {/* High confidence patterns + SOS slider */}
          <View style={styles.patternSliderSection}>
            <View style={styles.patternSliderHeader}>
              <Text style={[styles.patternsHeading, darkMode && styles.patternsHeadingDark]}>High confidence patterns</Text>
              <Pressable onPress={handleViewPatterns}>
                <Text style={[styles.viewAllPatterns, darkMode && styles.viewAllPatternsDark]}>View all patterns</Text>
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.patternSliderScroll}>
              <View style={[styles.patternCard, darkMode && styles.patternCardDark]}>
                <Text style={[styles.patternTitle, darkMode && styles.patternTitleDark]}>Poor Sleep</Text>
                <Text style={[styles.patternSubtitle, darkMode && styles.patternSubtitleDark]}>Poor sleep is a frequent trigger</Text>
                <Text style={styles.patternConfidence}>93%</Text>
              </View>
              <View style={[styles.patternCard, darkMode && styles.patternCardDark]}>
                <Text style={[styles.patternTitle, darkMode && styles.patternTitleDark]}>Stress</Text>
                <Text style={[styles.patternSubtitle, darkMode && styles.patternSubtitleDark]}>Stress is a common migraine trigger</Text>
                <Text style={styles.patternConfidence}>93%</Text>
              </View>
              <View style={[styles.patternCard, darkMode && styles.patternCardDark]}>
                <Text style={[styles.patternTitle, darkMode && styles.patternTitleDark]}>+1 more pattern</Text>
                <Text style={[styles.patternSubtitle, darkMode && styles.patternSubtitleDark]}>More triggers detected</Text>
                <Text style={styles.patternConfidence}>High</Text>
              </View>

            </ScrollView>
          </View>

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

          {/* Community Card */}
          <Pressable
            onPress={() => router.push('/community')}
            style={({ pressed }) => [styles.communityCard, darkMode && styles.communityCardDark, pressed && styles.communityCardPressed]}
          >
            <View style={styles.communityHeader}>
              <Ionicons name="people" size={24} color="#2E8B57" />
              <Text style={[styles.communityTitle, darkMode && styles.communityTitleDark]}>Community</Text>
            </View>
            <Text style={[styles.communitySubtitle, darkMode && styles.communitySubtitleDark]}>
              Connect with others, share experiences, and find support in our migraine community.
            </Text>
          </Pressable>

          {/* Migraine Calendar */}
          <MigraineCalendar migraineDays={migraineDays} darkMode={true} />

        </View>
      </ScrollView>

      <Modal visible={showOnboarding} animationType="slide" onRequestClose={() => setShowOnboarding(false)}>
        <OnboardingScreen onComplete={() => setShowOnboarding(false)} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  containerDark: { backgroundColor: '#000' },
  scrollView: { flex: 1 },
  contentContainer: { padding: 24, paddingTop: 12 },
  content: { width: '100%', alignSelf: 'center' },
  header: { alignItems: 'center', marginBottom: 20, marginTop: 0 },
  title: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 4 },
  titleDark: { color: '#fff' },
  subtitle: { fontSize: 16, color: '#d4d4d4' },
  subtitleDark: { color: '#d4d4d4' },
  emergencyButton: { width: '100%', backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#444', borderRadius: 20, padding: 16, alignItems: 'center', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 3 },
  emergencyButtonDark: { backgroundColor: '#1a1a1a', borderColor: '#444' },
  emergencyButtonPressed: { transform: [{ scale: 0.98 }], opacity: 0.85 },
  emergencyIcon: { marginBottom: 4 },
  emergencyText: { fontSize: 20, fontWeight: '600', color: '#ffb3e6', marginBottom: 4 },
  emergencyTextDark: { color: '#ffb3e6' },
  emergencySubtext: { fontSize: 14, color: '#7a6363', textAlign: 'center', paddingHorizontal: 16 },
  emergencySubtextDark: { color: '#d4a0a0' },
  aiChatCard: { width: '100%', backgroundColor: '#4c1d95', borderWidth: 1, borderColor: '#7c3aed', borderRadius: 20, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 2 },
  aiChatCardDark: { backgroundColor: '#4c1d95', borderColor: '#7c3aed' },
  aiChatCardPressed: { opacity: 0.95, transform: [{ scale: 0.99 }] },
  aiChatHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  aiChatIcon: { width: 48, height: 48, backgroundColor: '#8b5cf6', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  aiChatIconDark: { backgroundColor: '#8b5cf6' },
  aiChatInfo: { flex: 1 },
  aiChatTitle: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 2 },
  aiChatTitleDark: { color: '#fff' },
  aiChatSubtitle: { fontSize: 12, color: '#c4b5fd' },
  aiChatSubtitleDark: { color: '#7a9f94' },
  aiChatDescription: { fontSize: 13, color: '#f3e8ff', lineHeight: 18 },
  aiChatDescriptionDark: { color: '#f3e8ff' },
  warningsContainer: { marginBottom: 16 },
  dashboardHeadingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 24, marginBottom: 16 },
  dashboardHeading: { fontSize: 20, fontWeight: '700', color: '#2d4a42', flex: 1 },
  dashboardHeadingDark: { color: '#d4e8e0' },
  refreshButton: { padding: 4 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3f1b6f', borderRadius: 8, padding: 8, marginBottom: 12 },
  errorBannerDark: { backgroundColor: '#3f1b6f' },
  errorText: { fontSize: 12, color: '#d97706' },
  dashboardGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, marginBottom: 24 },
  dashboardCard: { width: '48%', backgroundColor: '#231344', borderRadius: 16, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3, elevation: 2 },
  dashboardCardDark: { backgroundColor: '#231344' },
  weatherCardPressed: { opacity: 0.7, transform: [{ scale: 0.98 }] },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  dashboardCardSmall: { width: '48%' },
  cardTitle: { fontSize: 12, fontWeight: '600', color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5 },
  cardTitleDark: { color: '#fff' },
  cardValue: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 4 },
  cardValueDark: { color: '#fff' },
  cardLabel: { fontSize: 12, color: '#c4b5fd' },
  cardLabelDark: { color: '#c4b5fd' },
  neuroRecordCard: { width: '100%', backgroundColor: '#111', borderWidth: 1, borderColor: '#444', borderRadius: 16, padding: 14, marginTop: 14, marginBottom: 20 },
  neuroRecordCardDark: { backgroundColor: '#111', borderColor: '#444' },
  neuroRecordCardPressed: { opacity: 0.8, transform: [{ scale: 0.99 }] },
  neuroRecordRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  neuroRecordIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#7c3aed', justifyContent: 'center', alignItems: 'center' },
  neuroRecordIconDark: { backgroundColor: '#7c3aed' },
  neuroRecordTextWrap: { flex: 1 },
  neuroRecordTitle: { fontSize: 14, fontWeight: '700', color: '#fff' },
  neuroRecordTitleDark: { color: '#fff' },
  neuroRecordSubtitle: { fontSize: 12, color: '#c4b5fd' },
  neuroRecordSubtitleDark: { color: '#c4b5fd' },
  quickToolsRow: { marginTop: 12, marginBottom: 14, width: '100%' },
  quickToolsRowContent: { paddingBottom: 4, gap: 12, alignItems: 'stretch' },
  quickToolCard: { width: 210, minHeight: 150, backgroundColor: '#6107c9', borderRadius: 18, padding: 12, marginRight: 8, justifyContent: 'flex-start', alignItems: 'flex-start', gap: 4, shadowColor: '#000', shadowOpacity: 0.28, shadowRadius: 8, elevation: 4 },
  quickToolCardLog: { width: 210, minHeight: 150, backgroundColor: '#6107c9', borderRadius: 18, padding: 12, marginRight: 8, justifyContent: 'flex-start', alignItems: 'flex-start', gap: 4, shadowColor: '#000', shadowOpacity: 0.28, shadowRadius: 8, elevation: 4 },
  quickToolCardPressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  quickToolImage: { width: 38, height: 38, marginBottom: 10, borderRadius: 10, overflow: 'hidden', alignSelf: 'center' },
  quickToolTitle: { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 3 },
  quickToolSubtitle: { color: '#f2e8ff', fontSize: 12, lineHeight: 16 },
  patternSliderSection: { marginTop: 16, marginBottom: 16 },
  patternSliderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  patternsHeading: { fontSize: 16, fontWeight: '700', color: '#fff' },
  patternsHeadingDark: { color: '#fff' },
  viewAllPatterns: { fontSize: 12, color: '#9f7aea', fontWeight: '600' },
  viewAllPatternsDark: { color: '#d8b4fe' },
  patternSliderScroll: { flexDirection: 'row' },
  patternCard: { width: 180, backgroundColor: '#2b0f4d', borderRadius: 16, padding: 12, marginRight: 12, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, elevation: 2 },
  patternCardDark: { backgroundColor: '#2b0f4d' },
  patternTitle: { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 4 },
  patternTitleDark: { color: '#fff' },
  patternSubtitle: { color: '#f3e8ff', fontSize: 12, marginBottom: 8 },
  patternSubtitleDark: { color: '#f3e8ff' },
  patternConfidence: { color: '#f3e8ff', fontWeight: '700', fontSize: 16 },
  emergencyVerticalCard: { width: 160, backgroundColor: '#b91c1c', borderRadius: 16, padding: 12, marginRight: 12, justifyContent: 'flex-start', alignItems: 'flex-start', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, elevation: 2 },
  emergencyVerticalCardDark: { backgroundColor: '#b91c1c' },
  emergencyVerticalTitle: { color: '#fff', fontSize: 14, fontWeight: '700', marginTop: 8 },
  emergencyVerticalTitleDark: { color: '#fff' },
  emergencyVerticalHint: { color: '#c4b5fd', fontSize: 12, marginTop: 4 },
  emergencyVerticalHintDark: { color: '#c4b5fd' },
  communityCard: { width: '100%', backgroundColor: '#1a2e2a', borderRadius: 16, padding: 16, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 2 },
  communityCardDark: { backgroundColor: '#1a2e2a' },
  communityCardPressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  communityHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  communityTitle: { fontSize: 18, fontWeight: '700', color: '#2E8B57', marginLeft: 8 },
  communityTitleDark: { color: '#2E8B57' },
  communitySubtitle: { fontSize: 14, color: '#c4b5fd', lineHeight: 20 },
  communitySubtitleDark: { color: '#c4b5fd' },
});