import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

interface PatternDetectionScreenProps {
  navigation: {
    goBack: () => void;
  };
}

const { width } = Dimensions.get('window');
const maxWidth = Math.min(width, 448);

interface PatternProps {
  type: 'positive' | 'negative' | 'warning' | 'insight';
  title: string;
  description: string;
  confidence: number;
  darkMode?: boolean;
  isHighConfidence?: boolean;
}

function PatternCard({ type, title, description, confidence, darkMode, isHighConfidence }: PatternProps) {
  const getIcon = () => {
    switch (type) {
      case 'positive':
        return <Ionicons name="checkmark-circle" size={24} color="#a8d5c4" />;
      case 'negative':
        return <Ionicons name="trending-down" size={24} color="#e11d48" />;
      case 'warning':
        return <Ionicons name="warning" size={24} color="#f59e0b" />;
      case 'insight':
        return <Ionicons name="flash" size={24} color="#a8d5c4" />;
    }
  };

  const getBgColor = () => {
    if (darkMode) {
      // Use consistent dark mode colors
      return { bg: '#253029', border: '#5a8f7f' };
    }
    switch (type) {
      case 'positive':
        return { bg: '#f0f5f3', border: '#d4e8e0' };
      case 'negative':
        return { bg: '#f0f5f3', border: '#d4e8e0' };
      case 'warning':
        return { bg: '#f0f5f3', border: '#d4e8e0' };
      case 'insight':
        return { bg: '#f0f5f3', border: '#d4e8e0' };
    }
  };

  const colors = getBgColor();

  return (
    <View style={[
      styles.patternCard,
      { backgroundColor: colors.bg, borderColor: colors.border },
      isHighConfidence && styles.highConfidenceCard
    ]}>

      <View style={styles.patternContent}>
        <View style={styles.patternIconContainer}>
          {getIcon()}
        </View>
        <View style={styles.patternTextContainer}>
          <Text style={[styles.patternTitle, darkMode && styles.patternTitleDark]}>{title}</Text>
          <Text style={[styles.patternDescription, darkMode && styles.patternDescriptionDark]}>{description}</Text>
          <View style={styles.confidenceContainer}>
            <View style={[styles.confidenceBarContainer, darkMode && styles.confidenceBarContainerDark]}>
              <View
                style={[
                  styles.confidenceBar,
                  { width: `${confidence}%` },
                  isHighConfidence && styles.highConfidenceBar
                ]}
              />
            </View>
            <Text style={[
              styles.confidenceText,
              darkMode && styles.confidenceTextDark,
              isHighConfidence && styles.highConfidenceText
            ]}>
              {confidence}% confidence
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export function PatternDetectionScreen({ navigation }: PatternDetectionScreenProps) {
  const { darkMode } = useTheme();

  const patterns: PatternProps[] = [
    {
      type: 'negative',
      title: 'High screen time correlation',
      description: '78% of your migraines occurred on days with >7 hours of screen time. Consider taking more frequent breaks.',
      confidence: 78,
    },
    {
      type: 'warning',
      title: 'Poor sleep pattern detected',
      description: 'You averaged 5.5 hours of sleep on nights before migraine days, compared to 7.5 hours on other nights.',
      confidence: 85,
    },
    {
      type: 'positive',
      title: 'Hydration helps',
      description: 'Days with 8+ glasses of water showed 65% fewer migraine episodes. Keep up the good work!',
      confidence: 65,
    },
    {
      type: 'insight',
      title: 'Weather sensitivity',
      description: 'Rapid barometric pressure changes (>3 hPa/hour) preceded 60% of your migraines in the past month.',
      confidence: 60,
    },
    {
      type: 'warning',
      title: 'Skipping meals trigger',
      description: 'Missing breakfast was associated with afternoon migraines in 70% of cases. Regular meals may help.',
      confidence: 70,
    },
    {
      type: 'insight',
      title: 'Weekly pattern',
      description: 'Migraines occur most frequently on Mondays and Tuesdays, possibly related to weekend schedule changes.',
      confidence: 55,
    },
    {
      type: 'negative',
      title: 'Calendar stress indicator',
      description: 'Days with 6+ scheduled meetings showed 3x higher migraine occurrence. Consider spacing out commitments.',
      confidence: 72,
    },
    {
      type: 'positive',
      title: 'Exercise benefit',
      description: 'Days with 8,000+ steps had 45% fewer migraines. Light to moderate activity appears protective.',
      confidence: 45,
    },
  ];

  return (
    <View style={[styles.container, darkMode && styles.containerDark]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}><View style={[styles.content, { maxWidth }]}>
        {/* Info Banner */}
        <View style={[styles.infoBanner, darkMode && styles.infoBannerDark]}>
          <Text style={[styles.infoText, darkMode && styles.infoTextDark]}>
            These patterns are based on your tracked data over the past 30 days. Confidence levels indicate the strength of the correlation.
          </Text>
        </View>

        {/* Patterns List */}
        <View style={styles.patternsList}>
          {patterns
            .sort((a, b) => b.confidence - a.confidence)
            .map((pattern, index) => (
              <PatternCard
                key={index}
                {...pattern}
                darkMode={darkMode}
                isHighConfidence={pattern.confidence >= 80}
              />
            ))}
        </View>

        {/* Footer Note */}
        <View style={[styles.footerNote, darkMode && styles.footerNoteDark]}>
          <Text style={[styles.footerText, darkMode && styles.footerTextDark]}>
            Patterns are for informational purposes only. Consult your healthcare provider for medical advice.
          </Text>
        </View>
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
  infoBanner: {
    backgroundColor: '#d4e8e0',
    borderWidth: 1,
    borderColor: '#a8d5c4',
    borderRadius: 24,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  infoBannerDark: {
    backgroundColor: '#253029',
    borderColor: '#5a8f7f',
  },
  infoText: {
    fontSize: 14,
    color: '#2d4a42',
    lineHeight: 20,
  },
  infoTextDark: {
    color: '#d4e8e0',
  },
  patternsList: {
    gap: 16,
    marginBottom: 24,
  },
  patternCard: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  patternContent: {
    flexDirection: 'row',
    gap: 16,
  },
  patternIconContainer: {
    flexShrink: 0,
  },
  patternTextContainer: {
    flex: 1,
  },
  patternTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#2d4a42',
    marginBottom: 8,
  },
  patternTitleDark: {
    color: '#d4e8e0',
  },
  patternDescription: {
    fontSize: 14,
    color: '#7a9f94',
    lineHeight: 20,
    marginBottom: 12,
  },
  patternDescriptionDark: {
    color: '#d4e8e0',
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  confidenceBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#c4dbd2',
    borderRadius: 4,
    overflow: 'hidden',
  },
  confidenceBarContainerDark: {
    backgroundColor: '#5a8f7f',
  },
  confidenceBar: {
    height: '100%',
    backgroundColor: '#a8d5c4',
    borderRadius: 4,
  },
  confidenceText: {
    fontSize: 12,
    color: '#7a9f94',
  },
  confidenceTextDark: {
    color: '#d4e8e0',
  },
  highConfidenceCard: {
    borderWidth: 2,
    borderColor: '#a8d5c4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  highConfidenceBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#a8d5c4',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    zIndex: 1,
  },
  highConfidenceBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  highConfidenceBar: {
    backgroundColor: '#a8d5c4',
  },
  highConfidenceText: {
    color: '#a8d5c4',
    fontWeight: '600',
  },
  footerNote: {
    backgroundColor: '#f0f5f3',
    borderWidth: 1,
    borderColor: '#d4e8e0',
    borderRadius: 24,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  footerNoteDark: {
    backgroundColor: '#253029',
    borderColor: '#5a8f7f',
  },
  footerText: {
    fontSize: 14,
    color: '#2d4a42',
    textAlign: 'center',
    lineHeight: 20,
  },
  footerTextDark: {
    color: '#d4e8e0',
  },
  textDark: {
    color: '#e2e8f0',
  },
});
