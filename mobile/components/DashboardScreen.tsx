import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { NavigationBar } from './NavigationBar';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingScreen } from './OnboardingScreen';
import { useUser } from '../contexts/UserContext';
import { useRealtimeMonitoring } from '@/hooks/useRealtimeMonitoring';

const { width } = Dimensions.get('window');
const maxWidth = Math.min(width, 448);

interface MetricProps {
  iconName: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number; // value between 0 and 1
  unit?: string;
  editable?: boolean;
  darkMode?: boolean;
}

interface DashboardScreenProps {
  navigation: {
    goBack: () => void;
  };
}

function StatusIndicator({ value, darkMode }: { value: number; darkMode?: boolean }) {
  const getColor = () => {
    if (value >= 0.8) return '#10b981';
    if (value >= 0.6) return '#84cc16';
    if (value >= 0.4) return '#eab308';
    if (value >= 0.2) return '#f97316';
    return '#f43f5e';
  };

  const getLabel = () => {
    if (value >= 0.8) return 'Excellent';
    if (value >= 0.6) return 'Good';
    if (value >= 0.4) return 'Fair';
    if (value >= 0.2) return 'Poor';
    return 'Critical';
  };

  const color = getColor();

  return (
    <View style={styles.statusContainer}>
      <View style={styles.statusBars}>
        {[0.2, 0.4, 0.6, 0.8, 1.0].map((threshold) => (
          <View
            key={threshold}
            style={[
              styles.statusBar,
              {
                backgroundColor: value >= threshold ? color : (darkMode ? '#334155' : '#e2e8f0'),
              },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.statusLabel, darkMode && styles.statusLabelDark]}>{getLabel()}</Text>
    </View>
  );
}

function MetricCard({ iconName, label, value, unit, editable = false, darkMode }: MetricProps) {
  return (
    <View style={[styles.metricCard, darkMode && styles.metricCardDark]}>
      <View style={styles.metricHeader}>
        <View style={[styles.metricIconContainer, darkMode && styles.metricIconContainerDark]}>
          <Ionicons name={iconName} size={20} color={darkMode ? '#94a3b8' : '#475569'} />
        </View>
        <View style={styles.metricTextContainer}>
          <Text style={[styles.metricLabel, darkMode && styles.metricLabelDark]}>{label}</Text>
          {unit && <Text style={[styles.metricUnit, darkMode && styles.metricUnitDark]}>{unit}</Text>}
        </View>
      </View>
      <StatusIndicator value={value} darkMode={darkMode} />
    </View>
  );
}

export function DashboardScreen({ navigation }: DashboardScreenProps) {
  const { userData, updateDashboardData } = useUser();
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [trackingType, setTrackingType] = useState<'meals' | 'hydration' | 'alcohol'>('meals');
  const [aiInsight, setAiInsight] = useState<string>('');
  const [loadingInsight, setLoadingInsight] = useState(false);

  // Initialize from stored data or defaults
  const [mealsCount, setMealsCount] = useState(() => {
    if (userData?.dashboardData?.meals?.unit) {
      const match = userData.dashboardData.meals.unit.match(/(\d+)/);
      return match ? parseInt(match[1], 10) : 3;
    }
    return 0;
  });

  const [waterCount, setWaterCount] = useState(() => {
    if (userData?.dashboardData?.hydration?.unit) {
      const match = userData.dashboardData.hydration.unit.match(/(\d+)/);
      return match ? parseInt(match[1], 10) : 6;
    }
    return 0;
  });

  const [alcoholCount, setAlcoholCount] = useState(() => {
    if (userData?.dashboardData?.alcohol?.unit) {
      if (userData.dashboardData.alcohol.unit === 'None today') return 0;
      const match = userData.dashboardData.alcohol.unit.match(/(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    }
    return 0;
  });

  const { darkMode } = useTheme();
  const realtime = useRealtimeMonitoring(waterCount);

  // Load AI insights when dashboard loads
  useEffect(() => {
    loadDailyInsight();
  }, [userData?.dashboardData]);

  const loadDailyInsight = async () => {
    if (!userData?.dashboardData) return;

    setLoadingInsight(true);
    try {
      const { generateDashboardInsights } = await import('@/services/geminiService');
      const insights = await generateDashboardInsights(userData.dashboardData);
      setAiInsight(insights);
    } catch (error) {
      console.error('Failed to load AI insight:', error);
      setAiInsight('');
    } finally {
      setLoadingInsight(false);
    }
  };

  // Get user's selected integrations
  const selectedIntegrations = userData?.integrations || [];

  const handleEditMetric = (type: 'meals' | 'hydration' | 'alcohol') => {
    setTrackingType(type);
    setShowTrackingModal(true);
  };

  const handleIncrement = () => {
    if (trackingType === 'meals') setMealsCount(prev => prev + 1);
    else if (trackingType === 'hydration') setWaterCount(prev => prev + 1);
    else setAlcoholCount(prev => prev + 1);
  };

  const handleDecrement = () => {
    if (trackingType === 'meals') setMealsCount(prev => Math.max(0, prev - 1));
    else if (trackingType === 'hydration') setWaterCount(prev => Math.max(0, prev - 1));
    else setAlcoholCount(prev => Math.max(0, prev - 1));
  };

  const getCurrentCount = () => {
    if (trackingType === 'meals') return mealsCount;
    if (trackingType === 'hydration') return waterCount;
    return alcoholCount;
  };

  const getTrackingTitle = () => {
    if (trackingType === 'meals') return 'Log Meals';
    if (trackingType === 'hydration') return 'Log Water';
    return 'Log Alcohol';
  };

  const getTrackingUnit = () => {
    if (trackingType === 'meals') return 'meals';
    if (trackingType === 'hydration') return 'glasses';
    return 'units';
  };

  const handleSaveTracking = () => {
    // Update the dashboard data in UserContext
    updateDashboardData(mealsCount, waterCount, alcoholCount);
    setShowTrackingModal(false);
  };

  const fallbackSteps = (() => {
    const unit = userData?.dashboardData?.steps?.unit ?? '';
    const match = unit.match(/([\d,]+)/);
    if (!match) return 0;
    return Number.parseInt(match[1].replace(/,/g, ''), 10);
  })();

  const effectiveSteps = realtime.steps ?? fallbackSteps;
  const stepValue = Math.min(1, Math.max(0, effectiveSteps / 10000));

  const weatherValue = realtime.weather.temperatureC !== null
    ? Math.min(1, Math.max(0, 1 - (Math.abs(realtime.weather.temperatureC - 22) / 20)))
    : (userData?.dashboardData?.weather?.value ?? 0);

  const weatherUnit = realtime.weather.temperatureC !== null
    ? `${Math.round(realtime.weather.temperatureC)}C, ${realtime.weather.weatherLabel}${realtime.weather.pressureMbar !== null ? `, ${Math.round(realtime.weather.pressureMbar)} mbar` : ''
    }`
    : (realtime.weather.error ?? userData?.dashboardData?.weather?.unit ?? 'No data');


  // Mock data - use stored values or calculate from current counts
  const manualMetrics: MetricProps[] = [
    {
      iconName: 'restaurant',
      label: 'Meals',
      value: userData?.dashboardData?.meals?.value ?? 0,
      unit: userData?.dashboardData?.meals?.unit ?? '0 meals today'
    },
    {
      iconName: 'water',
      label: 'Hydration',
      value: userData?.dashboardData?.hydration?.value ?? 0,
      unit: userData?.dashboardData?.hydration?.unit ?? '0 glasses'
    },
    {
      iconName: 'wine',
      label: 'Alcohol',
      value: userData?.dashboardData?.alcohol?.value ?? 1.0,
      unit: userData?.dashboardData?.alcohol?.unit ?? 'None today'
    },
  ];

  const allDeviceMetrics = [
    {
      id: 'steps',
      iconName: 'walk' as keyof typeof Ionicons.glyphMap,
      label: 'Steps',
      value: stepValue,
      unit: realtime.stepsAvailable
        ? `${effectiveSteps.toLocaleString()} steps today`
        : (realtime.stepsError ?? userData?.dashboardData?.steps?.unit ?? '0 steps')
    },
    {
      id: 'outdoor-brightness',
      iconName: 'sunny' as keyof typeof Ionicons.glyphMap,
      label: 'Outdoor Brightness',
      value: userData?.dashboardData?.outdoorBrightness?.value ?? 0,
      unit: userData?.dashboardData?.outdoorBrightness?.unit ?? 'No data'
    },
    {
      id: 'sleep',
      iconName: 'moon' as keyof typeof Ionicons.glyphMap,
      label: 'Sleep Quality',
      value: userData?.dashboardData?.sleep?.value ?? 0,
      unit: userData?.dashboardData?.sleep?.unit ?? '0 hours'
    },
    {
      id: 'usage-accuracy',
      iconName: 'phone-portrait' as keyof typeof Ionicons.glyphMap,
      label: 'Usage Accuracy',
      value: userData?.dashboardData?.usageAccuracy?.value ?? 0,
      unit: userData?.dashboardData?.usageAccuracy?.unit ?? 'No data'
    },
    {
      id: 'screen-brightness',
      iconName: 'eye' as keyof typeof Ionicons.glyphMap,
      label: 'Screen Brightness',
      value: userData?.dashboardData?.screenBrightness?.value ?? 0,
      unit: userData?.dashboardData?.screenBrightness?.unit ?? 'No data'
    },
    {
      id: 'screen-time',
      iconName: 'time' as keyof typeof Ionicons.glyphMap,
      label: 'Screen Time',
      value: userData?.dashboardData?.screenTime?.value ?? 0,
      unit: userData?.dashboardData?.screenTime?.unit ?? '0 hours'
    },
    {
      id: 'heart-rate',
      iconName: 'heart' as keyof typeof Ionicons.glyphMap,
      label: 'Heart Rate',
      value: userData?.dashboardData?.heartRate?.value ?? 0,
      unit: userData?.dashboardData?.heartRate?.unit ?? '0 bpm avg'
    },
    {
      id: 'dehydration-monitor',
      iconName: 'water' as keyof typeof Ionicons.glyphMap,
      label: 'Dehydration Risk',
      value: realtime.dehydration.safetyScore,
      unit: `${realtime.dehydration.riskLevel} risk, ${realtime.dehydration.summary}`
    },
  ];

  const deviceMetrics = allDeviceMetrics.filter(metric =>
    selectedIntegrations.includes(metric.id) || metric.id === 'dehydration-monitor'
  );

  const allExternalMetrics = [
    {
      id: 'calendar',
      iconName: 'calendar' as keyof typeof Ionicons.glyphMap,
      label: 'Calendar Stress',
      value: userData?.dashboardData?.calendar?.value ?? 0,
      unit: userData?.dashboardData?.calendar?.unit ?? 'No data'
    },
    {
      id: 'weather',
      iconName: 'cloud' as keyof typeof Ionicons.glyphMap,
      label: 'Weather',
      value: weatherValue,
      unit: weatherUnit
    },
  ];

  const externalMetrics = allExternalMetrics.filter(metric =>
    selectedIntegrations.includes(metric.id)
  );

  return (
    <View style={[styles.container, darkMode && styles.containerDark]}>
      <NavigationBar
        title="Dashboard"
        subtitle="Your health metrics"
        showBackButton={true}
      />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>

        <View style={[styles.content, { maxWidth }]}>
          {/* AI Insight Card */}
          {(aiInsight || loadingInsight) && (
            <View style={[styles.insightCard, darkMode && styles.insightCardDark]}>
              <View style={styles.insightHeader}>
                <View style={styles.insightHeaderLeft}>
                  <View style={styles.aiIconContainer}>
                    <Ionicons name="sparkles" size={18} color="#10b981" />
                  </View>
                  <Text style={[styles.insightTitle, darkMode && styles.textDark]}>
                    AI Daily Insight
                  </Text>
                </View>
                {aiInsight && !loadingInsight && (
                  <Pressable onPress={loadDailyInsight}>
                    <Ionicons
                      name="refresh"
                      size={20}
                      color={darkMode ? '#94a3b8' : '#64748b'}
                    />
                  </Pressable>
                )}
              </View>

              {loadingInsight ? (
                <View style={styles.insightLoadingContainer}>
                  <ActivityIndicator size="small" color="#10b981" />
                  <Text style={[styles.insightLoadingText, darkMode && styles.textDark]}>
                    Analyzing your health data...
                  </Text>
                </View>
              ) : (
                <Text style={[styles.insightText, darkMode && styles.textDark]}>
                  {aiInsight}
                </Text>
              )}
            </View>
          )}

          {/* Manual Inputs */}
          <View style={[styles.section, darkMode && styles.sectionDark]}>
            <Text style={[styles.sectionTitle, darkMode && styles.sectionTitleDark]}>Manual Tracking</Text>
            <Text style={[styles.sectionSubtitle, darkMode && styles.sectionSubtitleDark]}>Tap a metric to log your data</Text>
            <View style={styles.metricsList}>
              {manualMetrics.map((metric, index) => (
                <Pressable
                  key={index}
                  onPress={() => handleEditMetric(
                    metric.label === 'Meals' ? 'meals' :
                      metric.label === 'Hydration' ? 'hydration' : 'alcohol'
                  )}
                >
                  <MetricCard {...metric} editable={true} darkMode={darkMode} />
                </Pressable>
              ))}
            </View>
          </View>

          {/* Device Collected */}
          {deviceMetrics.length > 0 && (
            <View style={[styles.section, darkMode && styles.sectionDark]}>
              <Text style={[styles.sectionTitle, darkMode && styles.sectionTitleDark]}>Device Data</Text>
              <Text style={[styles.sectionSubtitle, darkMode && styles.sectionSubtitleDark]}>Data gathered by your device(s)</Text>
              <View style={styles.metricsList}>
                {deviceMetrics.map((metric, index) => (
                  <MetricCard key={index} {...metric} darkMode={darkMode} />
                ))}
              </View>
            </View>
          )}

          {/* External Sources */}
          {externalMetrics.length > 0 && (
            <View style={[styles.section, darkMode && styles.sectionDark]}>
              <Text style={[styles.sectionTitle, darkMode && styles.sectionTitleDark]}>External Sources</Text>
              <Text style={[styles.sectionSubtitle, darkMode && styles.sectionSubtitleDark]}>Data from connected apps</Text>
              <View style={styles.metricsList}>
                {externalMetrics.map((metric, index) => (
                  <MetricCard key={index} {...metric} darkMode={darkMode} />
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Tracking Modal */}
      <Modal
        visible={showTrackingModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTrackingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, darkMode && styles.modalContentDark]}>
            <View style={[styles.modalHeader, darkMode && styles.modalHeaderDark]}>
              <Text style={[styles.modalTitle, darkMode && styles.modalTitleDark]}>{getTrackingTitle()}</Text>
              <Pressable onPress={() => setShowTrackingModal(false)}>
                <Ionicons name="close" size={36} color={darkMode ? '#94a3b8' : '#475569'} />
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.modalLabel, darkMode && styles.modalLabelDark]}>Today&apos;s count</Text>
              <View style={styles.counterContainer}>
                <Pressable
                  onPress={handleDecrement}
                  style={styles.counterButton}
                >
                  <Ionicons name="remove-circle" size={80} color="#f43f5e" />
                </Pressable>

                <View style={styles.counterDisplay}>
                  <Text style={[styles.counterValue, darkMode && styles.counterValueDark]}>{getCurrentCount()}</Text>
                  <Text style={[styles.counterUnit, darkMode && styles.counterUnitDark]}>{getTrackingUnit()}</Text>
                </View>

                <Pressable
                  onPress={handleIncrement}
                  style={styles.counterButton}
                >
                  <Ionicons name="add-circle" size={80} color="#10b981" />
                </Pressable>
              </View>
            </View>

            <Pressable
              onPress={handleSaveTracking}
              style={styles.modalSaveButton}
            >
              <Text style={styles.modalSaveText}>Save</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Onboarding Modal */}
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
  scrollContent: {
    paddingBottom: 24,
  },
  content: {
    width: '100%',
    alignSelf: 'center',
    padding: 24,
  },
  insightCard: {
    backgroundColor: '#d4e8e0',
    borderRadius: 24,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#a8d5c4',
    shadowColor: '#a8d5c4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  insightCardDark: {
    backgroundColor: '#253029',
    borderColor: '#5a8f7f',
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#a8d5c4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d4a42',
  },
  insightText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#5a8f7f',
  },
  insightLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  insightLoadingText: {
    fontSize: 14,
    color: '#7a9f94',
  },
  section: {
    marginBottom: 24,
  },
  sectionDark: {
    // Remove bright background/border in dark mode
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '500',
    color: '#2d4a42',
    marginBottom: 6,
  },
  sectionTitleDark: {
    color: '#d4e8e0',
  },
  sectionSubtitle: {
    fontSize: 18,
    color: '#7a9f94',
    marginBottom: 16,
  },
  sectionSubtitleDark: {
    color: '#7a9f94',
  },
  textDark: {
    color: '#d4e8e0',
  },
  metricsList: {
    gap: 6,
  },
  metricCard: {
    backgroundColor: '#f0f5f3',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#d4e8e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricCardDark: {
    backgroundColor: '#253029',
    borderColor: '#3f5451',
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  metricIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#d4e8e0',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricIconContainerDark: {
    backgroundColor: '#3f5451',
  },
  metricTextContainer: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 20,
    fontWeight: '500',
    color: '#2d4a42',
    marginBottom: 4,
  },
  metricLabelDark: {
    color: '#d4e8e0',
  },
  metricUnit: {
    fontSize: 16,
    color: '#7a9f94',
  },
  metricUnitDark: {
    color: '#5a8f7f',
  },
  statusContainer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 4,
  },
  statusBars: {
    flexDirection: 'row',
    gap: 4,
  },
  statusBar: {
    width: 8,
    height: 24,
    borderRadius: 4,
  },
  statusLabel: {
    fontSize: 12,
    color: '#5a8f7f',
    textAlign: 'right',
  },
  statusLabelDark: {
    color: '#7a9f94',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#f5f8f7',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
  },
  modalContentDark: {
    backgroundColor: '#253029',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#d4e8e0',
  },
  modalHeaderDark: {
    borderBottomColor: '#5a8f7f',
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: '500',
    color: '#2d4a42',
  },
  modalTitleDark: {
    color: '#d4e8e0',
  },
  modalBody: {
    padding: 32,
    alignItems: 'center',
  },
  modalLabel: {
    fontSize: 16,
    color: '#7a9f94',
    marginBottom: 24,
  },
  modalLabelDark: {
    color: '#7a9f94',
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
  },
  counterButton: {
    padding: 8,
  },
  counterDisplay: {
    alignItems: 'center',
    minWidth: 100,
  },
  counterValue: {
    fontSize: 64,
    fontWeight: '600',
    color: '#2d4a42',
  },
  counterValueDark: {
    color: '#d4e8e0',
  },
  counterUnit: {
    fontSize: 16,
    color: '#7a9f94',
    marginTop: 4,
  },
  counterUnitDark: {
    color: '#7a9f94',
  },
  modalSaveButton: {
    marginHorizontal: 20,
    backgroundColor: '#a8d5c4',
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  modalSaveText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#fff',
  },
});
