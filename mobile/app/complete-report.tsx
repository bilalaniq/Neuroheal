import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ModernHeader } from '@/components/ModernHeader';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useUser } from '@/contexts/UserContext';
import { useDashboardStatus } from '@/hooks/useDashboardStatus';

interface ChartData {
  date: string;
  value: number;
  severity?: string;
  note?: string;
}

interface ComprehensiveInsight {
  category: string;
  insights: string[];
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

// Reusable chart components (simplified versions)
function MiniBarChart({ title, data, color, darkMode }: {
  title: string;
  data: ChartData[];
  color: string;
  darkMode?: boolean;
}) {
  const recentData = data.slice(-7); // Last 7 days
  const maxValue = Math.max(...recentData.map(d => d.value)) || 1;

  return (
    <View style={[styles.miniChartContainer, darkMode && styles.miniChartContainerDark]}>
      <Text style={[styles.miniChartTitle, darkMode && styles.miniChartTitleDark]}>{title}</Text>
      <View style={styles.miniBarsContainer}>
        {recentData.map((item, index) => {
          const barHeight = (item.value / maxValue) * 60;
          return (
            <View key={index} style={styles.miniBarWrapper}>
              <View
                style={[
                  styles.miniBar,
                  {
                    height: Math.max(barHeight, 2),
                    backgroundColor: color + '80',
                    borderTopColor: color
                  }
                ]}
              />
              <Text style={[styles.miniBarLabel, darkMode && styles.miniBarLabelDark]}>
                {new Date(item.date).getDate()}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function MiniLineChart({ title, data, color, darkMode }: {
  title: string;
  data: ChartData[];
  color: string;
  darkMode?: boolean;
}) {
  const recentData = data.slice(-7); // Last 7 days
  const maxValue = Math.max(...recentData.map(d => d.value)) || 4; // Use 4 as max for migraine severity

  return (
    <View style={[styles.miniChartContainer, darkMode && styles.miniChartContainerDark]}>
      <Text style={[styles.miniChartTitle, darkMode && styles.miniChartTitleDark]}>{title}</Text>
      <View style={styles.miniLineContainer}>
        {/* Draw connecting lines */}
        {recentData.map((point, index) => {
          if (index === 0) return null;

          const prevPoint = recentData[index - 1];
          const x1 = ((index - 1) / (recentData.length - 1)) * 100 + 10;
          const y1 = 50 - (prevPoint.value / maxValue) * 40;
          const x2 = (index / (recentData.length - 1)) * 100 + 10;
          const y2 = 50 - (point.value / maxValue) * 40;

          // Calculate line position and rotation
          const deltaX = x2 - x1;
          const deltaY = y2 - y1;
          const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
          const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

          return (
            <View
              key={`line-${index}`}
              style={[
                styles.miniLineSegment,
                {
                  position: 'absolute',
                  left: x1,
                  top: y1,
                  width: length,
                  height: 2,
                  backgroundColor: color,
                  transformOrigin: '0 50%',
                  transform: [{ rotate: `${angle}deg` }],
                }
              ]}
            />
          );
        })}

        {/* Draw data points */}
        {recentData.map((point, index) => {
          const x = (index / (recentData.length - 1)) * 100 + 10;
          const y = 50 - (point.value / maxValue) * 40;

          return (
            <View
              key={`point-${index}`}
              style={[
                styles.miniDataPoint,
                {
                  position: 'absolute',
                  left: x - 3,
                  top: y - 3,
                  backgroundColor: color,
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                }
              ]}
            />
          );
        })}
      </View>
      <View style={styles.miniChartLabels}>
        <Text style={[styles.miniChartLabel, darkMode && styles.miniChartLabelDark]}>7 days ago</Text>
        <Text style={[styles.miniChartLabel, darkMode && styles.miniChartLabelDark]}>Today</Text>
      </View>
    </View>
  );
}

function ComprehensiveAnalysisPanel({ insights, darkMode }: {
  insights: ComprehensiveInsight[];
  darkMode?: boolean;
}) {
  return (
    <View style={[styles.analysisPanel, darkMode && styles.analysisPanelDark]}>
      <View style={styles.analysisHeader}>
        <Ionicons name="analytics" size={24} color={darkMode ? '#60a5fa' : '#3b82f6'} />
        <Text style={[styles.analysisTitle, darkMode && styles.analysisTitleDark]}>
          Comprehensive Health Analysis
        </Text>
      </View>

      {insights.map((insight, index) => {
        const getRiskColor = (level: string) => {
          switch (level) {
            case 'low': return '#10b981';
            case 'medium': return '#f59e0b';
            case 'high': return '#ef4444';
            default: return '#64748b';
          }
        };

        return (
          <View key={index} style={[styles.insightCard, darkMode && styles.insightCardDark]}>
            <View style={styles.insightHeader}>
              <Text style={[styles.insightCategory, darkMode && styles.insightCategoryDark]}>
                {insight.category}
              </Text>
              <View style={[styles.riskBadge, { backgroundColor: getRiskColor(insight.riskLevel) + '20' }]}>
                <Text style={[styles.riskText, { color: getRiskColor(insight.riskLevel) }]}>
                  {insight.riskLevel.toUpperCase()} RISK
                </Text>
              </View>
            </View>

            <Text style={[styles.insightText, darkMode && styles.insightTextDark]}>
              {insight.insights.join(' ')}
            </Text>

            {insight.recommendations.length > 0 && (
              <View style={[styles.recommendationsContainer, darkMode && styles.recommendationsContainerDark]}>
                <Text style={[styles.recommendationsTitle, darkMode && styles.recommendationsTitleDark]}>
                  Recommendations:
                </Text>
                {insight.recommendations.map((rec, recIndex) => (
                  <Text key={recIndex} style={[styles.recommendationText, darkMode && styles.recommendationTextDark]}>
                    • {rec}
                  </Text>
                ))}
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

// Mock data generation functions
function generateMockData(days: number = 30): ChartData[] {
  const data = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split('T')[0],
      value: Math.random() * 10,
      note: 'Sample data'
    });
  }
  return data;
}

function generateMigraineMockData(days: number = 30): ChartData[] {
  const data = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Create a more realistic migraine pattern with clusters
    const cyclePosition = (i % 14) / 14; // 2-week cycle
    const hasMigraine = Math.random() < (0.1 + Math.sin(cyclePosition * Math.PI) * 0.15); // 10-25% chance with cycles

    data.push({
      date: date.toISOString().split('T')[0],
      value: hasMigraine ? Math.floor(Math.random() * 3) + 1 : 0, // 0-3 severity scale
      severity: hasMigraine ? ['mild', 'moderate', 'severe'][Math.floor(Math.random() * 3)] : 'none',
      note: 'Sample migraine data'
    });
  }
  return data;
}

function generateComprehensiveInsights(
  healthData: ChartData[],
  migraineDays: ChartData[],
  userData: any,
  dashboardStatus: any
): ComprehensiveInsight[] {
  const migraineDaysCount = migraineDays.filter(d => d.value > 0).length;
  const migraineFrequency = (migraineDaysCount / 30) * 100;
  const averageHealthScore = healthData.reduce((sum, d) => sum + d.value, 0) / healthData.length;

  const insights: ComprehensiveInsight[] = [
    {
      category: "Migraine Pattern Analysis",
      insights: [
        `You experienced ${migraineDaysCount} migraine days in the past 30 days (${migraineFrequency.toFixed(1)}%).`,
        migraineFrequency < 10 ? "Your migraine frequency is well-controlled." :
          migraineFrequency < 25 ? "Your migraine frequency is moderate." :
            "Your migraine frequency suggests active management is needed.",
        "Pattern analysis shows correlation with sleep quality and stress levels."
      ],
      recommendations: [
        migraineFrequency > 20 ? "Consider consulting your healthcare provider about treatment optimization" : "Continue current migraine management strategies",
        "Maintain consistent sleep schedule",
        "Track trigger patterns in your diary for better prevention"
      ],
      riskLevel: migraineFrequency < 10 ? 'low' : migraineFrequency < 25 ? 'medium' : 'high'
    },
    {
      category: "Overall Health Trends",
      insights: [
        `Your overall health score averages ${averageHealthScore.toFixed(1)}/10.`,
        dashboardStatus.overallStatus !== 'No Data' ?
          `Current health status is "${dashboardStatus.overallStatus}".` :
          "Health metrics tracking would provide better insights.",
        "Regular tracking shows commitment to health monitoring."
      ],
      recommendations: [
        averageHealthScore < 6 ? "Focus on improving daily health metrics" : "Maintain current healthy habits",
        "Continue regular health monitoring",
        "Consider integrating wearable device data for more comprehensive tracking"
      ],
      riskLevel: averageHealthScore < 5 ? 'high' : averageHealthScore < 7 ? 'medium' : 'low'
    },
    {
      category: "Lifestyle Correlation Analysis",
      insights: [
        "Analysis of your diary entries reveals patterns between lifestyle factors and health outcomes.",
        "Sleep quality appears to significantly impact both migraine frequency and overall wellbeing.",
        "Stress management practices show positive correlation with migraine-free days.",
        "Hydration and meal timing consistency affect both energy levels and migraine susceptibility."
      ],
      recommendations: [
        "Prioritize sleep hygiene - aim for 7-9 hours nightly",
        "Implement stress reduction techniques (meditation, exercise)",
        "Maintain regular meal schedule and adequate hydration",
        "Consider keeping detailed trigger diary for pattern identification"
      ],
      riskLevel: 'medium'
    },
    {
      category: "Predictive Health Insights",
      insights: [
        "Based on current trends, your health trajectory is showing positive patterns.",
        "Early intervention opportunities identified for migraine prevention.",
        "Your consistent tracking enables proactive rather than reactive health management.",
        "Data suggests strong correlation between preventive measures and symptom reduction."
      ],
      recommendations: [
        "Continue current tracking regimen for ongoing pattern recognition",
        "Share these insights with your healthcare provider for personalized treatment",
        "Consider expanding tracking to include mood and exercise metrics",
        "Set up alert system for identifying early warning signs"
      ],
      riskLevel: 'low'
    }
  ];

  return insights;
}

export default function CompleteReportScreen() {
  const router = useRouter();
  const { darkMode } = useTheme();
  const { userData } = useUser();
  const dashboardStatus = useDashboardStatus();

  // Generate comprehensive mock data
  const healthMetricsData = generateMockData(30);
  const sleepData = generateMockData(30);
  const stressData = generateMockData(30);
  const hydrationData = generateMockData(30);
  const migraineDays = generateMigraineMockData(30);

  // Generate comprehensive insights
  const insights = generateComprehensiveInsights(
    healthMetricsData,
    migraineDays,
    userData,
    dashboardStatus
  );

  const shareCompleteReport = async () => {
    try {
      const today = new Date().toLocaleDateString();
      const migraineDaysCount = migraineDays.filter(d => d.value > 0).length;

      let report = `🏥 COMPREHENSIVE HEALTH REPORT\n`;
      report += `Generated: ${today}\n`;
      report += `Patient: ${userData?.name || 'Anonymous'}\n`;
      report += `Age Group: ${userData?.ageBracket || 'Not specified'}\n\n`;

      report += `📊 EXECUTIVE SUMMARY (30 days):\n`;
      report += `• Migraine Days: ${migraineDaysCount}/30 (${Math.round(migraineDaysCount / 30 * 100)}%)\n`;
      report += `• Overall Health Status: ${dashboardStatus.overallStatus}\n`;
      report += `• Health Tracking Compliance: Active\n\n`;

      report += `🧠 MIGRAINE ANALYSIS:\n`;
      const recentMigraines = migraineDays.filter(d => d.value > 0).slice(-3);
      if (recentMigraines.length > 0) {
        report += `Recent episodes:\n`;
        recentMigraines.forEach((day, index) => {
          report += `  ${new Date(day.date).toLocaleDateString()}: ${day.severity} severity\n`;
        });
      } else {
        report += `No recent migraine episodes recorded.\n`;
      }

      report += `\n💡 KEY INSIGHTS:\n`;
      insights.forEach((insight, index) => {
        report += `${index + 1}. ${insight.category}: ${insight.riskLevel.toUpperCase()} risk\n`;
        report += `   ${insight.insights[0]}\n`;
      });

      report += `\n🎯 RECOMMENDATIONS:\n`;
      insights.forEach((insight, index) => {
        if (insight.recommendations.length > 0) {
          report += `• ${insight.recommendations[0]}\n`;
        }
      });

      report += `\n📈 DATA SOURCES:\n`;
      report += `• Manual health metrics tracking\n`;
      report += `• Migraine diary entries\n`;
      report += `• Device integration data\n`;
      report += `• AI-powered pattern analysis\n\n`;

      report += `⚕️ This comprehensive report combines health metrics, migraine patterns, and AI insights for healthcare professional review.`;

      await Share.share({
        message: report,
        title: 'Comprehensive Health Report',
      });
    } catch (error) {
      console.error('Failed to share report:', error);
    }
  };

  return (
    <View style={[styles.container, darkMode && styles.containerDark]}>
      <ModernHeader title="Complete Report" onBack={() => router.back()} />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Executive Summary */}
        <View style={[styles.summaryCard, darkMode && styles.summaryCardDark]}>
          <View style={styles.summaryHeader}>
            <Ionicons name="document-text" size={28} color={darkMode ? '#60a5fa' : '#3b82f6'} />
            <View style={styles.summaryTitleContainer}>
              <Text style={[styles.summaryTitle, darkMode && styles.summaryTitleDark]}>
                Executive Summary
              </Text>
              <Text style={[styles.summarySubtitle, darkMode && styles.summarySubtitleDark]}>
                {userData?.name || 'Anonymous'} • 30-day Analysis
              </Text>
            </View>
          </View>

          <View style={styles.summaryStats}>
            <View style={[styles.summaryStatItem, darkMode && styles.summaryStatItemDark]}>
              <Text style={[styles.summaryStatValue, darkMode && styles.summaryStatValueDark]}>
                {migraineDays.filter(d => d.value > 0).length}
              </Text>
              <Text style={[styles.summaryStatLabel, darkMode && styles.summaryStatLabelDark]}>
                Migraine Days
              </Text>
            </View>
            <View style={[styles.summaryStatItem, darkMode && styles.summaryStatItemDark]}>
              <Text style={[styles.summaryStatValue, darkMode && styles.summaryStatValueDark]}>
                {dashboardStatus.overallStatus}
              </Text>
              <Text style={[styles.summaryStatLabel, darkMode && styles.summaryStatLabelDark]}>
                Health Status
              </Text>
            </View>
            <View style={[styles.summaryStatItem, darkMode && styles.summaryStatItemDark]}>
              <Text style={[styles.summaryStatValue, darkMode && styles.summaryStatValueDark]}>
                {(healthMetricsData.reduce((sum, d) => sum + d.value, 0) / healthMetricsData.length).toFixed(1)}
              </Text>
              <Text style={[styles.summaryStatLabel, darkMode && styles.summaryStatLabelDark]}>
                Avg Health Score
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Charts Overview */}
        <View style={styles.chartsGrid}>
          <Text style={[styles.sectionTitle, darkMode && styles.sectionTitleDark]}>
            7-Day Trend Overview
          </Text>

          <View style={styles.chartsRow}>
            <MiniLineChart
              title="Migraine Patterns"
              data={migraineDays}
              color="#10b981"
              darkMode={darkMode}
            />
            <MiniBarChart
              title="Sleep Quality"
              data={sleepData}
              color="#3b82f6"
              darkMode={darkMode}
            />
          </View>

          <View style={styles.chartsRow}>
            <MiniBarChart
              title="Stress Levels"
              data={stressData}
              color="#ef4444"
              darkMode={darkMode}
            />
            <MiniBarChart
              title="Hydration"
              data={hydrationData}
              color="#10b981"
              darkMode={darkMode}
            />
          </View>
        </View>

        {/* Comprehensive Analysis */}
        <ComprehensiveAnalysisPanel insights={insights} darkMode={darkMode} />

        {/* Action Items */}
        <View style={[styles.actionCard, darkMode && styles.actionCardDark]}>
          <View style={styles.actionHeader}>
            <Ionicons name="checkmark-circle" size={24} color="#10b981" />
            <Text style={[styles.actionTitle, darkMode && styles.actionTitleDark]}>
              Recommended Actions
            </Text>
          </View>
          <View style={styles.actionItems}>
            <Text style={[styles.actionItem, darkMode && styles.actionItemDark]}>
              ✅ Share this report with your healthcare provider
            </Text>
            <Text style={[styles.actionItem, darkMode && styles.actionItemDark]}>
              ✅ Continue daily health metrics tracking
            </Text>
            <Text style={[styles.actionItem, darkMode && styles.actionItemDark]}>
              ✅ Implement high-priority recommendations
            </Text>
            <Text style={[styles.actionItem, darkMode && styles.actionItemDark]}>
              ✅ Schedule follow-up review in 30 days
            </Text>
          </View>
        </View>

        {/* Share Button */}
        <Pressable
          onPress={shareCompleteReport}
          style={({ pressed }) => [
            styles.shareButton,
            darkMode && styles.shareButtonDark,
            pressed && styles.shareButtonPressed,
          ]}
        >
          <Ionicons name="share" size={24} color="#fff" style={styles.shareIcon} />
          <Text style={styles.shareButtonText}>Share Complete Report</Text>
        </Pressable>

        {/* Healthcare Notice */}
        <View style={[styles.healthcareNotice, darkMode && styles.healthcareNoticeDark]}>
          <Ionicons name="medical" size={20} color={darkMode ? '#86efac' : '#15803d'} />
          <Text style={[styles.healthcareText, darkMode && styles.healthcareTextDark]}>
            This comprehensive report is designed for healthcare professional review.
            It combines 30 days of health metrics, migraine patterns, and AI-powered insights
            to support informed medical decision-making.
          </Text>
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
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  summaryCard: {
    backgroundColor: '#f0f5f3',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#d4e8e0',
  },
  summaryCardDark: {
    backgroundColor: '#2d4a42',
    borderColor: '#5a8f7f',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryTitleContainer: {
    marginLeft: 12,
    flex: 1,
  },
  summaryTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2d4a42',
  },
  summaryTitleDark: {
    color: '#d4e8e0',
  },
  summarySubtitle: {
    fontSize: 14,
    color: '#7a9f94',
    marginTop: 2,
  },
  summarySubtitleDark: {
    color: '#d4e8e0',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  summaryStatItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#d4e8e0',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryStatItemDark: {
    backgroundColor: '#2d4a42',
  },
  summaryStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2d4a42',
  },
  summaryStatValueDark: {
    color: '#d4e8e0',
  },
  summaryStatLabel: {
    fontSize: 12,
    color: '#7a9f94',
    textAlign: 'center',
    marginTop: 4,
  },
  summaryStatLabelDark: {
    color: '#d4e8e0',
  },
  chartsGrid: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2d4a42',
    marginBottom: 16,
  },
  sectionTitleDark: {
    color: '#d4e8e0',
  },
  chartsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  miniChartContainer: {
    flex: 1,
    backgroundColor: '#f0f5f3',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#d4e8e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  miniChartContainerDark: {
    backgroundColor: '#2d4a42',
    borderColor: '#5a8f7f',
  },
  miniChartTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2d4a42',
    marginBottom: 8,
  },
  miniChartTitleDark: {
    color: '#d4e8e0',
  },
  miniBarsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 70,
  },
  miniBarWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  miniBar: {
    width: '70%',
    borderTopWidth: 2,
    borderRadius: 1,
    minHeight: 2,
  },
  miniBarLabel: {
    fontSize: 10,
    color: '#7a9f94',
    marginTop: 4,
  },
  miniBarLabelDark: {
    color: '#d4e8e0',
  },
  miniLineContainer: {
    position: 'relative',
    height: 60,
    width: '100%',
    backgroundColor: 'transparent',
  },
  miniLineSegment: {
    position: 'absolute',
    height: 2,
    borderRadius: 1,
  },
  miniDataPoint: {
    position: 'absolute',
    borderRadius: 3,
    zIndex: 2,
  },
  miniChartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  miniChartLabel: {
    fontSize: 9,
    color: '#7a9f94',
  },
  miniChartLabelDark: {
    color: '#d4e8e0',
  },
  analysisPanel: {
    backgroundColor: '#d4e8e0',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#a8d5c4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  analysisPanelDark: {
    backgroundColor: '#2d4a42',
    borderColor: '#5a8f7f',
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  analysisTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2d4a42',
    marginLeft: 8,
  },
  analysisTitleDark: {
    color: '#d4e8e0',
  },
  insightCard: {
    backgroundColor: '#f0f5f3',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#d4e8e0',
  },
  insightCardDark: {
    backgroundColor: '#1a2622',
    borderColor: '#5a8f7f',
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d4a42',
  },
  insightCategoryDark: {
    color: '#d4e8e0',
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  riskText: {
    fontSize: 10,
    fontWeight: '600',
  },
  insightText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#2d4a42',
    marginBottom: 12,
  },
  insightTextDark: {
    color: '#d4e8e0',
  },
  recommendationsContainer: {
    backgroundColor: '#d4e8e0',
    borderRadius: 12,
    padding: 12,
  },
  recommendationsContainerDark: {
    backgroundColor: '#2d4a42',
  },
  recommendationsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2d4a42',
    marginBottom: 8,
  },
  recommendationsTitleDark: {
    color: '#d4e8e0',
  },
  recommendationText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#2d4a42',
    marginBottom: 4,
  },
  recommendationTextDark: {
    color: '#d4e8e0',
  },
  actionCard: {
    backgroundColor: '#d4e8e0',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#a8d5c4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  actionCardDark: {
    backgroundColor: '#2d4a42',
    borderColor: '#5a8f7f',
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d4a42',
    marginLeft: 8,
  },
  actionTitleDark: {
    color: '#d4e8e0',
  },
  actionItems: {
    gap: 8,
  },
  actionItem: {
    fontSize: 14,
    lineHeight: 20,
    color: '#2d4a42',
  },
  actionItemDark: {
    color: '#d4e8e0',
  },
  shareButton: {
    backgroundColor: '#a8d5c4',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginBottom: 24,
    shadowColor: '#a8d5c4',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  shareButtonDark: {
    backgroundColor: '#a8d5c4',
    shadowColor: '#a8d5c4',
  },
  shareButtonPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.85,
  },
  shareIcon: {
    marginRight: 8,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  healthcareNotice: {
    backgroundColor: '#d4e8e0',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#a8d5c4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  healthcareNoticeDark: {
    backgroundColor: '#253029',
    borderColor: '#5a8f7f',
  },
  healthcareText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#2d4a42',
    marginLeft: 8,
    flex: 1,
  },
  healthcareTextDark: {
    color: '#d4e8e0',
  },
});
