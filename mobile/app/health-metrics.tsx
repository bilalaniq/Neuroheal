import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Pressable, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ModernHeader } from '@/components/ModernHeader';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useUser } from '@/contexts/UserContext';
import { useDashboardStatus } from '@/hooks/useDashboardStatus';

const { width } = Dimensions.get('window');
const chartWidth = width - 40;
const chartHeight = 200;

interface ChartProps {
  title: string;
  data: { date: string; value: number; status: string }[];
  color: string;
  unit: string;
  darkMode?: boolean;
}

function generateMockData(days: number = 30): { date: string; value: number; status: string }[] {
  const data = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Generate realistic mock data with some variation
    const baseValue = 0.3 + Math.random() * 0.6; // Random value between 0.3 and 0.9
    const value = Math.min(Math.max(baseValue, 0), 1); // Ensure it's between 0 and 1

    const getStatus = (val: number) => {
      if (val >= 0.8) return 'Excellent';
      if (val >= 0.6) return 'Good';
      if (val >= 0.4) return 'Fair';
      if (val >= 0.2) return 'Poor';
      return 'Critical';
    };

    data.push({
      date: date.toISOString().split('T')[0],
      value,
      status: getStatus(value)
    });
  }

  return data;
}

function SimpleLineChart({ title, data, color, unit, darkMode }: ChartProps) {
  if (data.length === 0) return null;

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;

  const currentValue = data[data.length - 1];
  const trend = data.length > 1 ?
    (data[data.length - 1].value - data[data.length - 7]?.value || 0) : 0;

  return (
    <View style={[styles.chartContainer, darkMode && styles.chartContainerDark]}>
      <View style={styles.chartHeader}>
        <Text style={[styles.chartTitle, darkMode && styles.chartTitleDark]}>{title}</Text>
        <View style={styles.currentValueContainer}>
          <Text style={[styles.currentValue, { color }]}>
            {currentValue.status}
          </Text>
          <View style={styles.trendContainer}>
            <Ionicons
              name={trend > 0 ? 'trending-up' : trend < 0 ? 'trending-down' : 'remove'}
              size={16}
              color={trend > 0 ? '#10b981' : trend < 0 ? '#ef4444' : '#64748b'}
            />
            <Text style={[styles.trendText, darkMode && styles.trendTextDark]}>
              {Math.abs(trend * 100).toFixed(0)}%
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.chartArea}>
        {/* Grid lines with status labels */}
        <View style={styles.gridContainer}>
          {[
            { level: 1, label: 'Excellent', color: '#10b981' },
            { level: 0.8, label: 'Good', color: '#84cc16' },
            { level: 0.6, label: 'Fair', color: '#eab308' },
            { level: 0.4, label: 'Poor', color: '#f97316' },
            { level: 0.2, label: 'Critical', color: '#ef4444' },
          ].map(({ level, label, color: levelColor }) => (
            <View key={level} style={styles.gridRow}>
              <Text style={[styles.statusLabel, { color: levelColor }, darkMode && styles.statusLabelDark]}>
                {label}
              </Text>
              <View
                style={[
                  styles.gridLine,
                  { backgroundColor: levelColor + '20' },
                ]}
              />
            </View>
          ))}
        </View>

        {/* Data visualization as bars */}
        <View style={styles.barsContainer}>
          {data.slice(-14).map((item, index) => {
            const barHeight = (item.value / 1) * (chartHeight - 120);
            const getBarColor = (value: number) => {
              if (value >= 0.8) return '#10b981';
              if (value >= 0.6) return '#84cc16';
              if (value >= 0.4) return '#eab308';
              if (value >= 0.2) return '#f97316';
              return '#ef4444';
            };

            return (
              <View key={index} style={styles.barWrapper}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight,
                      backgroundColor: getBarColor(item.value) + '80',
                      borderTopColor: getBarColor(item.value)
                    }
                  ]}
                />
                <Text style={[styles.dateLabel, darkMode && styles.dateLabelDark]}>
                  {new Date(item.date).getDate()}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Summary stats */}
      <View style={styles.statsContainer}>
        <View style={styles.stat}>
          <Text style={[styles.statValue, darkMode && styles.statValueDark]}>
            {(data.filter(d => d.status === 'Excellent' || d.status === 'Good').length / data.length * 100).toFixed(0)}%
          </Text>
          <Text style={[styles.statLabel, darkMode && styles.statLabelDark]}>Good Days</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, darkMode && styles.statValueDark]}>
            {(data.reduce((sum, d) => sum + d.value, 0) / data.length * 100).toFixed(0)}%
          </Text>
          <Text style={[styles.statLabel, darkMode && styles.statLabelDark]}>Avg Score</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, darkMode && styles.statValueDark]}>
            {trend > 0 ? '+' : ''}{(trend * 100).toFixed(0)}%
          </Text>
          <Text style={[styles.statLabel, darkMode && styles.statLabelDark]}>7-day Trend</Text>
        </View>
      </View>

      <Text style={[styles.dateRange, darkMode && styles.dateRangeDark]}>
        Showing last 14 days • {new Date(data[0].date).toLocaleDateString()} - Today
      </Text>
    </View>
  );
}

export default function HealthMetricsScreen() {
  const router = useRouter();
  const { darkMode } = useTheme();
  const { userData } = useUser();
  const dashboardStatus = useDashboardStatus();

  // Generate mock data for the last 30 days
  const mealsData = generateMockData(30);
  const hydrationData = generateMockData(30);
  const alcoholData = generateMockData(30);
  const sleepData = generateMockData(30);
  const stepsData = generateMockData(30);
  const heartRateData = generateMockData(30);

  const shareReport = async () => {
    try {
      const today = new Date().toLocaleDateString();
      let report = `Health Metrics Report - ${today}\n`;
      report += `Generated by Migraine Tracker\n\n`;
      report += `User: ${userData?.name || 'Anonymous'}\n`;
      report += `30-Day Health Metrics Summary\n\n`;

      // Add current status for each metric
      if (dashboardStatus.meals) {
        report += `Current Meals Status: ${dashboardStatus.meals.status}\n`;
      }
      if (dashboardStatus.hydration) {
        report += `Current Hydration Status: ${dashboardStatus.hydration.status}\n`;
      }
      if (dashboardStatus.alcohol) {
        report += `Current Alcohol Status: ${dashboardStatus.alcohol.status}\n`;
      }

      // Add device metrics
      dashboardStatus.deviceMetrics.forEach(metric => {
        report += `Current ${metric.label}: ${metric.status}\n`;
      });

      report += `\nOverall Health Status: ${dashboardStatus.overallStatus}\n`;
      report += `\nThis report includes 30-day trend visualizations that can be shown to healthcare professionals.`;

      await Share.share({
        message: report,
        title: 'Health Metrics Report',
      });
    } catch (error) {
      console.error('Failed to share report:', error);
    }
  };

  return (
    <View style={[styles.container, darkMode && styles.containerDark]}>
      <ModernHeader title="Health Metrics" onBack={() => router.back()} />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, darkMode && styles.sectionTitleDark]}>
            Health Metrics Overview
          </Text>
          <Text style={[styles.sectionDescription, darkMode && styles.sectionDescriptionDark]}>
            Comprehensive 30-day trends for all your health metrics. Perfect for sharing with healthcare professionals.
          </Text>
        </View>

        {/* Manual Metrics */}
        <View style={styles.metricsSection}>
          <Text style={[styles.categoryTitle, darkMode && styles.categoryTitleDark]}>
            Daily Health Metrics
          </Text>

          <SimpleLineChart
            title="Meals"
            data={mealsData}
            color="#10b981"
            unit="meals"
            darkMode={darkMode}
          />

          <SimpleLineChart
            title="Hydration"
            data={hydrationData}
            color="#3b82f6"
            unit="glasses"
            darkMode={darkMode}
          />

          <SimpleLineChart
            title="Alcohol Intake"
            data={alcoholData}
            color="#f59e0b"
            unit="units"
            darkMode={darkMode}
          />
        </View>

        {/* Device Metrics */}
        {dashboardStatus.deviceMetrics.length > 0 && (
          <View style={styles.metricsSection}>
            <Text style={[styles.categoryTitle, darkMode && styles.categoryTitleDark]}>
              Device Metrics
            </Text>

            {dashboardStatus.deviceMetrics.some(metric => metric.id === 'sleep') && (
              <SimpleLineChart
                title="Sleep Quality"
                data={sleepData}
                color="#8b5cf6"
                unit="hours"
                darkMode={darkMode}
              />
            )}

            {dashboardStatus.deviceMetrics.some(metric => metric.id === 'steps') && (
              <SimpleLineChart
                title="Steps"
                data={stepsData}
                color="#06b6d4"
                unit="steps"
                darkMode={darkMode}
              />
            )}

            {dashboardStatus.deviceMetrics.some(metric => metric.id === 'heart-rate') && (
              <SimpleLineChart
                title="Heart Rate"
                data={heartRateData}
                color="#ef4444"
                unit="bpm"
                darkMode={darkMode}
              />
            )}
          </View>
        )}

        {/* Summary */}
        <View style={[styles.summaryContainer, darkMode && styles.summaryContainerDark]}>
          <View style={styles.summaryHeader}>
            <Ionicons
              name="analytics"
              size={24}
              color={darkMode ? '#60a5fa' : '#3b82f6'}
            />
            <Text style={[styles.summaryTitle, darkMode && styles.summaryTitleDark]}>
              30-Day Summary
            </Text>
          </View>
          <Text style={[styles.summaryText, darkMode && styles.summaryTextDark]}>
            Overall Health Status: <Text style={{ fontWeight: '600' }}>{dashboardStatus.overallStatus}</Text>
          </Text>
          <Text style={[styles.summaryText, darkMode && styles.summaryTextDark]}>
            This comprehensive report shows your health trends over the past 30 days.
            The data can help healthcare professionals understand your patterns and make informed recommendations.
          </Text>
        </View>

        <View style={[styles.instructionsContainer, darkMode && styles.instructionsContainerDark]}>
          <Text style={[styles.instructionsTitle, darkMode && styles.instructionsTitleDark]}>
            For Healthcare Professionals
          </Text>
          <Text style={[styles.instructionsText, darkMode && styles.instructionsTextDark]}>
            • Trends show daily health metric patterns over 30 days{'\n'}
            • Status indicators: Critical (red) → Poor → Fair → Good → Excellent (green){'\n'}
            • Data points represent daily averages{'\n'}
            • Use the share button below to export this report
          </Text>
        </View>

        {/* Share Button */}
        <Pressable
          onPress={shareReport}
          style={({ pressed }) => [
            styles.shareButton,
            darkMode && styles.shareButtonDark,
            pressed && styles.shareButtonPressed,
          ]}
        >
          <Ionicons name="share" size={24} color="#fff" style={styles.shareIcon} />
          <Text style={styles.shareButtonText}>Share Report</Text>
        </Pressable>
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
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2d4a42',
    marginBottom: 8,
  },
  sectionTitleDark: {
    color: '#d4e8e0',
  },
  sectionDescription: {
    fontSize: 16,
    color: '#7a9f94',
    lineHeight: 24,
  },
  sectionDescriptionDark: {
    color: '#c4dbd2',
  },
  shareButton: {
    backgroundColor: '#a8d5c4',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 4,
  },
  shareButtonDark: {
    backgroundColor: '#7a9f94',
    shadowColor: '#000',
  },
  shareButtonPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.8,
  },
  shareIcon: {
    marginRight: 8,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  metricsSection: {
    marginBottom: 32,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2d4a42',
    marginBottom: 16,
  },
  categoryTitleDark: {
    color: '#d4e8e0',
  },
  chartContainer: {
    backgroundColor: '#f0f5f3',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#d4e8e0',
  },
  chartContainerDark: {
    backgroundColor: '#253029',
    borderColor: '#5a8f7f',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d4a42',
  },
  chartTitleDark: {
    color: '#d4e8e0',
  },
  currentValueContainer: {
    alignItems: 'flex-end',
  },
  currentValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  trendText: {
    fontSize: 12,
    color: '#7a9f94',
    marginLeft: 4,
  },
  trendTextDark: {
    color: '#c4dbd2',
  },
  chartArea: {
    position: 'relative',
    height: chartHeight,
    marginBottom: 16,
  },
  gridContainer: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    bottom: 60,
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: (chartHeight - 120) / 5,
  },
  statusLabel: {
    width: 80,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'right',
    marginRight: 8,
  },
  statusLabelDark: {
    opacity: 0.8,
  },
  gridLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#c4dbd2',
    opacity: 0.3,
  },
  gridLineDark: {
    backgroundColor: '#5a8f7f',
  },
  barsContainer: {
    position: 'absolute',
    top: 20,
    left: 90,
    right: 20,
    bottom: 60,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  barWrapper: {
    alignItems: 'center',
    flex: 1,
    maxWidth: 20,
  },
  bar: {
    width: '80%',
    borderTopWidth: 3,
    borderTopColor: '#a8d5c4',
    borderRadius: 2,
    minHeight: 4,
  },
  dateLabel: {
    fontSize: 10,
    color: '#7a9f94',
    marginTop: 4,
    textAlign: 'center',
  },
  dateLabelDark: {
    color: '#c4dbd2',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#d4e8e0',
    marginBottom: 8,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d4a42',
  },
  statValueDark: {
    color: '#d4e8e0',
  },
  statLabel: {
    fontSize: 12,
    color: '#7a9f94',
    marginTop: 2,
  },
  statLabelDark: {
    color: '#c4dbd2',
  },
  dateRange: {
    fontSize: 11,
    color: '#7a9f94',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  dateRangeDark: {
    color: '#c4dbd2',
  },
  svgChart: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  yAxisLabels: {
    position: 'absolute',
    left: 0,
    top: 20,
    width: 50,
    height: chartHeight - 60,
  },
  axisLabel: {
    position: 'absolute',
    fontSize: 10,
    color: '#7a9f94',
    textAlign: 'right',
    width: 50,
  },
  axisLabelDark: {
    color: '#c4dbd2',
  },
  xAxisContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 60,
    marginTop: 8,
  },
  summaryContainer: {
    backgroundColor: '#d4e8e0',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#a8d5c4',
  },
  summaryContainerDark: {
    backgroundColor: '#253029',
    borderColor: '#5a8f7f',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d4a42',
    marginLeft: 8,
  },
  summaryTitleDark: {
    color: '#d4e8e0',
  },
  summaryText: {
    fontSize: 14,
    color: '#2d4a42',
    lineHeight: 20,
    marginBottom: 8,
  },
  summaryTextDark: {
    color: '#d4e8e0',
  },
  instructionsContainer: {
    backgroundColor: '#f0f5f3',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#d4e8e0',
  },
  instructionsContainerDark: {
    backgroundColor: '#253029',
    borderColor: '#5a8f7f',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d4a42',
    marginBottom: 8,
  },
  instructionsTitleDark: {
    color: '#d4e8e0',
  },
  instructionsText: {
    fontSize: 14,
    color: '#2d4a42',
    lineHeight: 20,
  },
  instructionsTextDark: {
    color: '#d4e8e0',
  },
});
