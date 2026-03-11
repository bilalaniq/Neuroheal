import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useDashboardStatus } from '@/hooks/useDashboardStatus';
import { useUser } from '@/contexts/UserContext';

interface DashboardWarningsProps {
  onPress?: () => void;
  maxItems?: number;
  style?: any;
}

export function DashboardWarnings({ onPress, maxItems = 3, style }: DashboardWarningsProps) {
  const { darkMode } = useTheme();
  const dashboardStatus = useDashboardStatus();

  // Check if there's any data at all
  const hasAnyData = dashboardStatus.hasAnyData;

  // Collect ALL metrics (manual, device, external)
  const allMetrics = [];

  // Manual metrics (if available)
  if (dashboardStatus.meals) {
    allMetrics.push({
      iconName: 'restaurant' as keyof typeof Ionicons.glyphMap,
      title: 'Meals',
      status: dashboardStatus.meals.status,
      unit: dashboardStatus.meals.unit
    });
  }

  if (dashboardStatus.hydration) {
    allMetrics.push({
      iconName: 'water' as keyof typeof Ionicons.glyphMap,
      title: 'Hydration',
      status: dashboardStatus.hydration.status,
      unit: dashboardStatus.hydration.unit
    });
  }

  if (dashboardStatus.alcohol) {
    allMetrics.push({
      iconName: 'wine' as keyof typeof Ionicons.glyphMap,
      title: 'Alcohol',
      status: dashboardStatus.alcohol.status,
      unit: dashboardStatus.alcohol.unit
    });
  }

  // Device metrics (based on user's selected integrations)
  dashboardStatus.deviceMetrics.forEach(metric => {
    allMetrics.push({
      iconName: metric.iconName as keyof typeof Ionicons.glyphMap,
      title: metric.label,
      status: metric.status,
      unit: metric.unit
    });
  });

  // External metrics (based on user's selected integrations)
  dashboardStatus.externalMetrics.forEach(metric => {
    allMetrics.push({
      iconName: metric.iconName as keyof typeof Ionicons.glyphMap,
      title: metric.label,
      status: metric.status,
      unit: metric.unit
    });
  });

  // If no data exists, show a getting started message
  if (!hasAnyData) {
    const content = (
      <View style={[styles.container, darkMode && styles.containerDark, style]}>
        <View style={styles.header}>
          <Ionicons
            name="analytics-outline"
            size={20}
            color={darkMode ? '#94a3b8' : '#64748b'}
            style={styles.headerIcon}
          />
          <Text style={[styles.title, darkMode && styles.titleDark]}>
            Track your health metrics
          </Text>
        </View>
        <Text style={[styles.getStartedText, darkMode && styles.getStartedTextDark]}>
          Start logging your daily data in the Dashboard to see personalized health insights and warnings here.
        </Text>
      </View>
    );

    if (onPress) {
      return (
        <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
          {content}
        </Pressable>
      );
    }

    return content;
  }

  // Don't render if no metrics exist
  if (allMetrics.length === 0) {
    return null;
  }

  // Sort metrics by priority: Critical, Poor, Fair, Good, Excellent
  const sortedMetrics = allMetrics.sort((a, b) => {
    const statusOrder = { 'Critical': 0, 'Poor': 1, 'Fair': 2, 'Good': 3, 'Excellent': 4 };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  // Limit to maxItems
  const displayMetrics = sortedMetrics.slice(0, maxItems);
  const hasMoreMetrics = sortedMetrics.length > maxItems;

  // Determine if we should show warning styling (if any Critical/Poor exist)
  const hasWarnings = sortedMetrics.some(metric => metric.status === 'Critical' || metric.status === 'Poor');
  const headerTitle = hasWarnings ? "Keep an eye on these" : "Your health metrics";
  const headerIcon = hasWarnings ? "alert-circle" : "analytics-outline";
  const headerColor = hasWarnings
    ? (darkMode ? '#f97316' : '#ef4444')
    : (darkMode ? '#94a3b8' : '#64748b');

  const content = (
    <View style={[styles.container, darkMode && styles.containerDark, style]}>
      <View style={styles.header}>
        <Ionicons
          name={headerIcon}
          size={20}
          color={headerColor}
          style={styles.headerIcon}
        />
        <Text style={[styles.title, darkMode && styles.titleDark]}>
          {headerTitle}
        </Text>
      </View>

      {displayMetrics.map((metric, index) => {
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

        const statusColor = getStatusColor(metric.status);

        return (
          <View key={index} style={styles.warningItem}>
            <View style={styles.warningHeader}>
              <View style={[styles.warningIconContainer, darkMode && styles.warningIconContainerDark]}>
                <Ionicons name={metric.iconName} size={16} color={statusColor} />
              </View>
              <View style={styles.warningContent}>
                <Text style={[styles.warningTitle, darkMode && styles.warningTitleDark]}>
                  {metric.title}
                </Text>
                <Text style={[styles.warningUnit, darkMode && styles.warningUnitDark]}>
                  {metric.unit}
                </Text>
              </View>
            </View>
            <Text style={[styles.warningStatus, { color: statusColor }]}>
              {metric.status}
            </Text>
          </View>
        );
      })}

      {hasMoreMetrics && (
        <Text style={[styles.moreText, darkMode && styles.moreTextDark]}>
          +{sortedMetrics.length - maxItems} more metric{sortedMetrics.length - maxItems > 1 ? 's' : ''}
        </Text>
      )}

      {onPress && (
        <View style={styles.viewAllContainer}>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={darkMode ? '#34d399' : '#10b981'}
          />
          <Text style={[styles.viewAllText, darkMode && styles.viewAllTextDark]}>
            View all metrics
          </Text>
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f0f5f3',
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: '#d4e8e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  containerDark: {
    backgroundColor: '#253029',
    borderColor: '#5a8f7f',
  },
  pressed: {
    opacity: 0.95,
    transform: [{ scale: 0.98 }],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerIcon: {
    marginRight: 6,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    color: '#2d4a42',
  },
  titleDark: {
    color: '#d4e8e0',
  },
  getStartedText: {
    fontSize: 14,
    color: '#7a9f94',
    lineHeight: 20,
  },
  getStartedTextDark: {
    color: '#7a9f94',
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  warningIconContainer: {
    width: 28,
    height: 28,
    backgroundColor: '#d4e8e0',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  warningIconContainerDark: {
    backgroundColor: '#5a8f7f',
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2d4a42',
    marginBottom: 2,
  },
  warningTitleDark: {
    color: '#d4e8e0',
  },
  warningUnit: {
    fontSize: 12,
    color: '#7a9f94',
  },
  warningUnitDark: {
    color: '#7a9f94',
  },
  warningStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  moreText: {
    fontSize: 12,
    color: '#7a9f94',
    fontStyle: 'italic',
    marginTop: 4,
  },
  moreTextDark: {
    color: '#7a9f94',
  },
  viewAllContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#d4e8e0',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#a8d5c4',
    marginLeft: 4,
  },
  viewAllTextDark: {
    color: '#a8d5c4',
  },
});
