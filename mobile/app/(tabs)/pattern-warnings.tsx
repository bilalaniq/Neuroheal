import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NavigationBar } from '@/components/NavigationBar';
import { useTheme } from '@/contexts/ThemeContext';
import { useDashboardStatus } from '@/hooks/useDashboardStatus';

interface WarningItemProps {
  iconName: keyof typeof Ionicons.glyphMap;
  title: string;
  status: 'Critical' | 'Poor' | 'Fair' | 'Good' | 'Excellent';
  unit: string;
  darkMode?: boolean;
}

function WarningItem({ iconName, title, status, unit, darkMode }: WarningItemProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Critical': return '#ef4444';
      case 'Poor': return '#f97316';
      case 'Fair': return '#eab308';
      case 'Good': return '#84cc16';
      case 'Excellent': return '#10b981';
      default: return '#64748b';
    }
  };

  const statusColor = getStatusColor(status);

  return (
    <View style={[styles.warningItem, darkMode && styles.warningItemDark]}>
      <View style={styles.warningHeader}>
        <View style={[styles.warningIconContainer, darkMode && styles.warningIconContainerDark]}>
          <Ionicons name={iconName} size={20} color={statusColor} />
        </View>
        <View style={styles.warningTextContainer}>
          <Text style={[styles.warningTitle, darkMode && styles.warningTitleDark]}>{title}</Text>
          <Text style={[styles.warningUnit, darkMode && styles.warningUnitDark]}>{unit}</Text>
        </View>
      </View>
      <View style={styles.statusContainer}>
        <Text style={[styles.statusLabel, { color: statusColor }]}>{status}</Text>
      </View>
    </View>
  );
}

export default function PatternWarningsScreen() {
  const { darkMode } = useTheme();
  const dashboardStatus = useDashboardStatus();

  // Collect all metrics from the hook
  const warnings = [];

  // Manual metrics (if available)
  if (dashboardStatus.meals) {
    warnings.push({
      iconName: 'restaurant' as keyof typeof Ionicons.glyphMap,
      title: 'Meals',
      status: dashboardStatus.meals.status,
      unit: dashboardStatus.meals.unit
    });
  }

  if (dashboardStatus.hydration) {
    warnings.push({
      iconName: 'water' as keyof typeof Ionicons.glyphMap,
      title: 'Hydration',
      status: dashboardStatus.hydration.status,
      unit: dashboardStatus.hydration.unit
    });
  }

  if (dashboardStatus.alcohol) {
    warnings.push({
      iconName: 'wine' as keyof typeof Ionicons.glyphMap,
      title: 'Alcohol',
      status: dashboardStatus.alcohol.status,
      unit: dashboardStatus.alcohol.unit
    });
  }

  // Device metrics (from selected integrations)
  dashboardStatus.deviceMetrics.forEach(metric => {
    warnings.push({
      iconName: metric.iconName as keyof typeof Ionicons.glyphMap,
      title: metric.label,
      status: metric.status,
      unit: metric.unit
    });
  });

  // External metrics (from selected integrations)
  dashboardStatus.externalMetrics.forEach(metric => {
    warnings.push({
      iconName: metric.iconName as keyof typeof Ionicons.glyphMap,
      title: metric.label,
      status: metric.status,
      unit: metric.unit
    });
  });

  // Sort warnings by priority: Critical, Poor, Fair, Good, Excellent
  const sortedWarnings = warnings.sort((a, b) => {
    const statusOrder = { 'Critical': 0, 'Poor': 1, 'Fair': 2, 'Good': 3, 'Excellent': 4 };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  const hasData = dashboardStatus.hasAnyData;

  return (
    <View style={[styles.container, darkMode && styles.containerDark]}>
      <NavigationBar
        title="Pattern Warnings"
        subtitle="Health metrics that need attention"
        showBackButton={true}
      />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {hasData && sortedWarnings.length > 0 ? (
            <>
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, darkMode && styles.sectionTitleDark]}>Your Health Metrics</Text>
                <Text style={[styles.sectionSubtitle, darkMode && styles.sectionSubtitleDark]}>
                  All tracked metrics, sorted by priority
                </Text>
                <View style={styles.warningsList}>
                  {sortedWarnings.map((warning, index) => (
                    <WarningItem
                      key={index}
                      iconName={warning.iconName}
                      title={warning.title}
                      status={warning.status}
                      unit={warning.unit}
                      darkMode={darkMode}
                    />
                  ))}
                </View>
              </View>
              {/* Only show recommendation if there are actual warnings */}
              {sortedWarnings.some(warning => warning.status === 'Critical' || warning.status === 'Poor') && (
                <View style={[styles.tipContainer, darkMode && styles.tipContainerDark]}>
                  <View style={styles.tipHeader}>
                    <Ionicons
                      name="bulb"
                      size={16}
                      color={darkMode ? '#fbbf24' : '#f59e0b'}
                      style={styles.tipIcon}
                    />
                    <Text style={[styles.tipTitle, darkMode && styles.tipTitleDark]}>
                      Recommendation
                    </Text>
                  </View>
                  <Text style={[styles.tipText, darkMode && styles.tipTextDark]}>
                    Consider adjusting habits with Critical or Poor status to help reduce migraine frequency and severity.
                  </Text>
                </View>
              )}
            </>
          ) : (
            <View style={styles.noWarningsContainer}>
              <Ionicons
                name="analytics"
                size={64}
                color={darkMode ? '#64748b' : '#94a3b8'}
                style={styles.noWarningsIcon}
              />
              <Text style={[styles.noWarningsTitle, darkMode && styles.noWarningsTitleDark]}>
                No Data Yet
              </Text>
              <Text style={[styles.noWarningsText, darkMode && styles.noWarningsTextDark]}>
                Start tracking your daily metrics in the Dashboard to see your health patterns and get personalized recommendations.
              </Text>
              <View style={[styles.instructionContainer, darkMode && styles.instructionContainerDark]}>
                <Text style={[styles.instructionTitle, darkMode && styles.instructionTitleDark]}>
                  How to get started:
                </Text>
                <Text style={[styles.instructionText, darkMode && styles.instructionTextDark]}>
                  • Navigate to Dashboard{'\n'}
                  • Log your meals, water intake, and alcohol consumption{'\n'}
                  • Return here to see your health metrics analysis
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
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
  contentContainer: {
    padding: 24,
  },
  section: {
    marginBottom: 24,
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
    color: '#c4dbd2',
  },
  description: {
    fontSize: 16,
    color: '#7a9f94',
    marginBottom: 20,
    lineHeight: 24,
  },
  descriptionDark: {
    color: '#c4dbd2',
  },
  warningsList: {
    gap: 6,
    marginBottom: 24,
  },
  warningItem: {
    backgroundColor: '#f0f5f3',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#d4e8e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  warningItemDark: {
    backgroundColor: '#253029',
    borderColor: '#5a8f7f',
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  warningIconContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#d4e8e0',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningIconContainerDark: {
    backgroundColor: '#5a8f7f',
  },
  warningTextContainer: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 20,
    fontWeight: '500',
    color: '#2d4a42',
    marginBottom: 4,
  },
  warningTitleDark: {
    color: '#d4e8e0',
  },
  warningUnit: {
    fontSize: 16,
    color: '#7a9f94',
  },
  warningUnitDark: {
    color: '#c4dbd2',
  },
  statusContainer: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 4,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'right',
  },
  tipContainer: {
    backgroundColor: '#f0f5f3',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#d4e8e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  tipContainerDark: {
    backgroundColor: '#253029',
    borderColor: '#5a8f7f',
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tipIcon: {
    marginRight: 8,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2d4a42',
  },
  tipTitleDark: {
    color: '#d4e8e0',
  },
  tipText: {
    fontSize: 14,
    color: '#7a9f94',
    lineHeight: 20,
  },
  tipTextDark: {
    color: '#c4dbd2',
  },
  noWarningsContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  noWarningsIcon: {
    marginBottom: 16,
  },
  noWarningsTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2d4a42',
    marginBottom: 12,
  },
  noWarningsTitleDark: {
    color: '#d4e8e0',
  },
  noWarningsText: {
    fontSize: 16,
    color: '#7a9f94',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 32,
    marginBottom: 24,
  },
  noWarningsTextDark: {
    color: '#c4dbd2',
  },
  instructionContainer: {
    backgroundColor: '#f0f5f3',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#d4e8e0',
    width: '100%',
  },
  instructionContainerDark: {
    backgroundColor: '#253029',
    borderColor: '#5a8f7f',
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d4a42',
    marginBottom: 8,
  },
  instructionTitleDark: {
    color: '#d4e8e0',
  },
  instructionText: {
    fontSize: 14,
    color: '#7a9f94',
    lineHeight: 20,
  },
  instructionTextDark: {
    color: '#c4dbd2',
  },
});
