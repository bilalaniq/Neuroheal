import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useUser } from '@/contexts/UserContext';
import { getAIResponse } from '@/services/aiService';

const BACKEND_URL = 'http://192.168.37.37:8080';
const HIGH_CONFIDENCE_THRESHOLD = 80;

interface PatternWarningsProps {
  onPress?: () => void;
  maxItems?: number;
  style?: any;
}

interface Pattern {
  type: 'positive' | 'negative' | 'warning' | 'insight';
  title: string;
  description: string;
  confidence: number;
}

function topItems(arr: string[], limit = 5) {
  const c: Record<string, number> = {};
  arr.forEach((i) => { if (i) c[i] = (c[i] || 0) + 1; });
  return Object.entries(c)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}

export function PatternWarnings({ onPress, maxItems = 2, style }: PatternWarningsProps) {
  const { darkMode } = useTheme();
  const { userData } = useUser();
  const userName = userData?.name ?? 'Patient';

  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAndAnalyse = useCallback(async () => {
    setLoading(true);
    try {
      const [hr, lr] = await Promise.all([
        fetch(`${BACKEND_URL}/health/full?days=7`),
        fetch(`${BACKEND_URL}/migraine-episodes/history?user_id=${encodeURIComponent(userName)}`),
      ]);

      let healthSummary = 'No health data';
      let logSummary = 'No episodes logged';

      if (hr.ok) {
        const hd = await hr.json();
        const bp = hd.blood_pressure?.readings ?? [];
        const latestBP = bp[bp.length - 1];
        healthSummary = [
          hd.sleep?.average_sleep_hours
            ? `Sleep: ${hd.sleep.average_sleep_hours.toFixed(1)}h/night`
            : null,
          latestBP
            ? `BP: ${latestBP.systolic}/${latestBP.diastolic} (${latestBP.status})`
            : null,
          hd.steps?.total_steps
            ? `Steps: ${hd.steps.total_steps.toLocaleString()}/day`
            : null,
        ]
          .filter(Boolean)
          .join(', ') || 'No health data';
      }

      if (lr.ok) {
        const ld = await lr.json();
        const logs = ld.logs || [];
        if (logs.length > 0) {
          const triggers = topItems(logs.flatMap((l: any) => l.triggers ?? []));
          const avg = (
            logs.reduce((s: number, l: any) => s + (l.intensity ?? 0), 0) / logs.length
          ).toFixed(1);
          logSummary = `${logs.length} episodes, avg intensity ${avg}/10, top triggers: ${
            triggers.map((t) => `${t.name}(${t.count}x)`).join(', ') || 'none'
          }`;
        }
      }

      const prompt = `Analyse this migraine patient's data and return ONLY a valid JSON array of the top 4 patterns.
Data: ${logSummary}. Health: ${healthSummary}.
Each object: {"type":"positive|negative|warning|insight","title":"max 6 words","description":"1 sentence","confidence":0-100}
Return ONLY the raw JSON array, no markdown, no explanation.`;

      const raw = await getAIResponse(prompt);
      const cleaned = raw.replace(/```json|```/g, '').trim();
      const parsed: Pattern[] = JSON.parse(cleaned);
      setPatterns(parsed.sort((a, b) => b.confidence - a.confidence));
    } catch {
      setPatterns([]);
    } finally {
      setLoading(false);
    }
  }, [userName]);

  useEffect(() => { fetchAndAnalyse(); }, [fetchAndAnalyse]);

  const highConfidence = patterns.filter((p) => p.confidence >= HIGH_CONFIDENCE_THRESHOLD);
  const display = highConfidence.slice(0, maxItems);

  // Don't render if no high-confidence patterns and not loading
  if (!loading && display.length === 0) return null;

  const getIcon = (type: Pattern['type']) => {
    const map = {
      positive: 'checkmark-circle',
      negative: 'trending-down',
      warning: 'warning',
      insight: 'flash',
    };
    return map[type] as any;
  };

  const getColor = (type: Pattern['type']) => {
    const map = {
      positive: '#10b981',
      negative: '#e11d48',
      warning: '#f59e0b',
      insight: '#9333ea',
    };
    return map[type];
  };

  const content = (
    <View style={[styles.container, darkMode && styles.containerDark, style]}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons
          name="analytics"
          size={20}
          color={darkMode ? '#a855f7' : '#9333ea'}
          style={styles.headerIcon}
        />
        <Text style={[styles.title, darkMode && styles.titleDark]}>
          High confidence patterns
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color="#10b981" />
          <Text style={[styles.loadingText, darkMode && styles.loadingTextDark]}>
            Analysing your data…
          </Text>
        </View>
      ) : (
        <>
          {display.map((pattern, index) => (
            <View key={index} style={styles.patternItem}>
              <View style={styles.patternHeader}>
                <View style={[
                  styles.patternIconContainer,
                  darkMode && styles.patternIconContainerDark,
                ]}>
                  <Ionicons
                    name={getIcon(pattern.type)}
                    size={16}
                    color={getColor(pattern.type)}
                  />
                </View>
                <View style={styles.patternContent}>
                  <Text style={[styles.patternTitle, darkMode && styles.patternTitleDark]}>
                    {pattern.title}
                  </Text>
                  <Text style={[styles.patternDescription, darkMode && styles.patternDescriptionDark]}>
                    {pattern.description}
                  </Text>
                </View>
              </View>
              <Text style={[styles.patternConfidence, { color: getColor(pattern.type) }]}>
                {pattern.confidence}%
              </Text>
            </View>
          ))}

          {highConfidence.length > maxItems && (
            <Text style={[styles.moreText, darkMode && styles.moreTextDark]}>
              +{highConfidence.length - maxItems} more pattern
              {highConfidence.length - maxItems > 1 ? 's' : ''}
            </Text>
          )}

          {onPress && (
            <View style={[
              styles.viewAllContainer,
              darkMode && styles.viewAllContainerDark,
            ]}>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={darkMode ? '#a855f7' : '#9333ea'}
              />
              <Text style={[styles.viewAllText, darkMode && styles.viewAllTextDark]}>
                View all patterns
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => pressed && styles.pressed}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#f0f5f3', borderRadius: 20, padding: 12, borderWidth: 1, borderColor: '#d4e8e0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  containerDark: { backgroundColor: '#253029', borderColor: '#5a8f7f' },
  pressed: { opacity: 0.95, transform: [{ scale: 0.98 }] },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  headerIcon: { marginRight: 6 },
  title: { fontSize: 15, fontWeight: '500', color: '#2d4a42' },
  titleDark: { color: '#d4e8e0' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  loadingText: { fontSize: 13, color: '#7a9f94' },
  loadingTextDark: { color: '#a8d5c4' },
  patternItem: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 },
  patternHeader: { flexDirection: 'row', alignItems: 'flex-start', flex: 1 },
  patternIconContainer: { width: 28, height: 28, backgroundColor: '#d4e8e0', borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginRight: 10, flexShrink: 0 },
  patternIconContainerDark: { backgroundColor: '#5a8f7f' },
  patternContent: { flex: 1 },
  patternTitle: { fontSize: 14, fontWeight: '500', color: '#2d4a42', marginBottom: 2 },
  patternTitleDark: { color: '#d4e8e0' },
  patternDescription: { fontSize: 12, color: '#7a9f94', lineHeight: 16 },
  patternDescriptionDark: { color: '#c4dbd2' },
  patternConfidence: { fontSize: 12, fontWeight: '600', marginLeft: 8, flexShrink: 0 },
  moreText: { fontSize: 12, color: '#7a9f94', fontStyle: 'italic', marginTop: 4 },
  moreTextDark: { color: '#c4dbd2' },
  viewAllContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#d4e8e0' },
  viewAllContainerDark: { borderTopColor: '#3a5a4e' },
  viewAllText: { fontSize: 13, fontWeight: '500', color: '#a8d5c4', marginLeft: 4 },
  viewAllTextDark: { color: '#c4dbd2' },
});