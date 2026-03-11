# Gemini AI Integration Guide

## Overview

Gemini AI is integrated into 5 key areas of the app to provide personalized, intelligent insights.

## 1. Migraine Logging - AI Insights

**Location:** `MigraineTrackingScreen.tsx`
**When:** After successfully logging a migraine
**Function:** `generateMigraineInsights()`

### Integration Example:

```typescript
import { generateMigraineInsights } from '@/services/geminiService';

const handleSubmit = async () => {
  // ... existing code ...

  if (enableAIAnalysis && predictionResult) {
    try {
      // Get AI insights
      const insights = await generateMigraineInsights(
        selectedSymptoms,
        intensity,
        duration,
        predictionResult.prediction,
        predictionResult.confidence,
        userData?.dashboardData
      );

      // Show insights to user (add state to display)
      setAiInsights(insights);

    } catch (error) {
      console.error('Failed to generate insights:', error);
    }
  }
};
```

### Example Output:
```
"Based on your symptoms and recent data, here are some tips:

1. Your screen time (8.5 hours) is elevated today. Consider taking a break and resting your eyes.

2. Sleep was good at 7.5 hours, which is positive. Try to maintain this pattern.

3. With Light sensitivity and Aura, finding a dark, quiet room for 30-60 minutes often helps.

Stay hydrated and avoid screens for the next hour if possible."
```

---

## 2. Dashboard - Daily Health Insights

**Location:** `DashboardScreen.tsx`
**When:** When user views their dashboard
**Function:** `generateDashboardInsights()` or `getQuickHealthTip()`

### Integration Example:

```typescript
import { generateDashboardInsights, getQuickHealthTip } from '@/services/geminiService';

export function DashboardScreen() {
  const [aiInsight, setAiInsight] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Load AI insight when dashboard loads
  useEffect(() => {
    loadDailyInsight();
  }, [userData?.dashboardData]);

  const loadDailyInsight = async () => {
    if (!userData?.dashboardData) return;

    setLoading(true);
    try {
      // Option 1: Detailed insights
      const insights = await generateDashboardInsights(userData.dashboardData);
      setAiInsight(insights);

      // Option 2: Quick tip (faster, less detailed)
      // const tip = await getQuickHealthTip(userData.dashboardData);
      // setAiInsight(tip);

    } catch (error) {
      console.error('Failed to load insight:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView>
      {/* Add insight card at top of dashboard */}
      {aiInsight && (
        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <Ionicons name="sparkles" size={20} color="#9333ea" />
            <Text style={styles.insightTitle}>AI Insight</Text>
          </View>
          <Text style={styles.insightText}>{aiInsight}</Text>
        </View>
      )}

      {/* Rest of dashboard... */}
    </ScrollView>
  );
}
```

### Example Outputs:

**Detailed Insight:**
```
"Looking at your metrics:

1. Excellent sleep (7.5 hours) - this is protective against migraines. Maintain this!

2. Screen time is concerning at 8.5 hours. High screen time correlates with migraines. Try to reduce by 2 hours.

3. Hydration is good, but with 8 meetings today, stress may be elevated. Consider short breaks between calls.

Focus: Reduce screen time in the evening hours."
```

**Quick Tip:**
```
"Your screen time is high today. Take a 15-minute walk outside to reset."
```

---

## 3. Emergency Tips - Personalized Real-Time Help

**Location:** `EmergencyTipsScreen.tsx`
**When:** User views emergency tips during a migraine
**Function:** `generateEmergencyTips()`

### Integration Example:

```typescript
import { generateEmergencyTips } from '@/services/geminiService';

export function EmergencyTipsScreen() {
  const [aiTips, setAiTips] = useState<Array<{title: string, description: string}>>([]);
  const [loading, setLoading] = useState(false);

  // Add button to generate AI tips
  const generatePersonalizedTips = async () => {
    setLoading(true);
    try {
      // Get current symptoms from latest migraine log or ask user
      const currentSymptoms = ['Light sensitivity', 'Nausea', 'Aura'];

      const tips = await generateEmergencyTips(
        currentSymptoms,
        {
          ageBracket: userData?.ageBracket,
          commonTriggers: ['Screen time', 'Lack of sleep'],
          effectiveRemedies: ['Cold compress', 'Dark room']
        }
      );

      setAiTips(tips);

    } catch (error) {
      console.error('Failed to generate tips:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView>
      {/* Add AI tips section */}
      <Pressable onPress={generatePersonalizedTips} style={styles.generateButton}>
        <Ionicons name="sparkles" size={20} color="#fff" />
        <Text style={styles.generateButtonText}>
          Generate AI Tips for Current Symptoms
        </Text>
      </Pressable>

      {loading && <ActivityIndicator />}

      {aiTips.length > 0 && (
        <View style={styles.aiTipsSection}>
          <Text style={styles.sectionTitle}>🤖 AI-Generated Tips</Text>
          {aiTips.map((tip, index) => (
            <TipCard
              key={index}
              iconName="flash"
              iconColor="#9333ea"
              title={tip.title}
              description={tip.description}
              bgColor="#faf5ff"
              darkMode={darkMode}
            />
          ))}
        </View>
      )}

      {/* Rest of static tips... */}
    </ScrollView>
  );
}
```

### Example Output:
```json
[
  {
    "title": "Immediate light reduction",
    "description": "Given your light sensitivity and aura, move to the darkest room available. Close blinds/curtains and turn off all lights. Even dim light can worsen symptoms."
  },
  {
    "title": "Cold compress + nausea relief",
    "description": "Place a cold, damp cloth on your forehead and back of neck. For nausea, try slow, deep breaths through your nose and sip room-temperature ginger tea if available."
  },
  {
    "title": "Pressure point technique",
    "description": "Apply firm pressure to the webbing between your thumb and index finger for 5 minutes. This pressure point (LI-4) can help reduce headache intensity."
  },
  {
    "title": "Minimize screen exposure",
    "description": "Your history shows screen time as a trigger. Avoid all screens for the next 2 hours. Set devices to grayscale mode if you must use them."
  }
]
```

---

## 4. Pattern Detection - AI Pattern Analysis

**Location:** `PatternDetectionScreen.tsx`
**When:** When viewing detected patterns
**Function:** `analyzePatterns()`

### Integration Example:

```typescript
import { analyzePatterns } from '@/services/geminiService';

export function PatternDetectionScreen() {
  const [aiPatterns, setAiPatterns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAIPatterns = async () => {
    setLoading(true);
    try {
      // Get migraine history (from local storage or backend)
      const migraineHistory = [
        {
          date: '2025-11-15',
          symptoms: ['Light sensitivity', 'Nausea'],
          intensity: 4,
          triggers: ['Screen time', 'Poor sleep']
        },
        // ... more history
      ];

      const dashboardHistory = []; // Historical dashboard data

      const patterns = await analyzePatterns(migraineHistory, dashboardHistory);
      setAiPatterns(patterns);

    } catch (error) {
      console.error('Failed to analyze patterns:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAIPatterns();
  }, []);

  return (
    <ScrollView>
      {/* AI-detected patterns */}
      {aiPatterns.map((pattern, index) => (
        <PatternCard
          key={index}
          type={pattern.type}
          title={pattern.title}
          description={pattern.description}
          confidence={pattern.confidence}
          isHighConfidence={pattern.confidence > 75}
          darkMode={darkMode}
        />
      ))}

      {/* Manual/static patterns... */}
    </ScrollView>
  );
}
```

### Example Output:
```json
[
  {
    "type": "warning",
    "title": "Screen time strongly correlated",
    "description": "80% of your migraines occur on days with >7 hours screen time. Consider setting a 6-hour daily limit.",
    "confidence": 85
  },
  {
    "type": "positive",
    "title": "Sleep optimization working",
    "description": "Your migraine frequency dropped 40% since improving sleep to 7-8 hours. Keep this routine!",
    "confidence": 78
  },
  {
    "type": "insight",
    "title": "Weekend pattern detected",
    "description": "60% of migraines happen on Sundays, possibly related to sleep schedule changes. Try consistent wake times.",
    "confidence": 72
  }
]
```

---

## 5. Analytics Dashboard - Recommendations

**Location:** `DashboardScreen.tsx` or separate Analytics view
**When:** After fetching analytics from backend
**Function:** `generateRecommendations()`

### Integration Example:

```typescript
import { getAnalytics } from '@/services/migraineApi';
import { generateRecommendations } from '@/services/geminiService';

const loadAnalyticsWithRecommendations = async () => {
  try {
    // Get analytics from backend
    const analytics = await getAnalytics(userId, 30);

    // Generate AI recommendations
    const recommendations = await generateRecommendations(analytics, userId);

    setAnalytics(analytics);
    setAiRecommendations(recommendations);

  } catch (error) {
    console.error('Failed to load analytics:', error);
  }
};
```

### Example Output:
```
"Based on your 30-day analysis:

1. Sleep Impact: You average 5.8 hours on migraine days vs 7.2 hours on migraine-free days.
   → Prioritize 7+ hours sleep nightly. Set a consistent bedtime.

2. Alcohol Correlation: Higher alcohol intake (2+ units) precedes 65% of migraines.
   → Limit to 1 unit or avoid entirely, especially on busy work days.

3. Timing Pattern: Most migraines occur in morning (6-12am).
   → Try a small breakfast with protein immediately upon waking. Consider morning hydration routine.

4. Stress Factor: Days with 8+ meetings correlate with migraines.
   → Block 'no meeting' buffer time between calls. Practice 5-minute breathing exercises.

Focus on sleep quality first - it has the strongest correlation with your migraine prevention."
```

---

## UI Components for Insights

### Insight Card Component

```typescript
interface InsightCardProps {
  insight: string;
  loading?: boolean;
  onRefresh?: () => void;
  darkMode?: boolean;
}

function InsightCard({ insight, loading, onRefresh, darkMode }: InsightCardProps) {
  return (
    <View style={[styles.insightCard, darkMode && styles.insightCardDark]}>
      <View style={styles.insightHeader}>
        <View style={styles.insightHeaderLeft}>
          <View style={styles.aiIconContainer}>
            <Ionicons name="sparkles" size={18} color="#9333ea" />
          </View>
          <Text style={[styles.insightTitle, darkMode && styles.textDark]}>
            AI Insight
          </Text>
        </View>
        {onRefresh && (
          <Pressable onPress={onRefresh} disabled={loading}>
            <Ionicons
              name="refresh"
              size={20}
              color={darkMode ? '#94a3b8' : '#64748b'}
            />
          </Pressable>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="small" color="#9333ea" />
      ) : (
        <Text style={[styles.insightText, darkMode && styles.textDark]}>
          {insight}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  insightCard: {
    backgroundColor: '#faf5ff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9d5ff',
  },
  insightCardDark: {
    backgroundColor: '#1e1b4b',
    borderColor: '#4c1d95',
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
    backgroundColor: '#f3e8ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  insightText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#475569',
  },
  textDark: {
    color: '#e2e8f0',
  },
});
```

---

## Best Practices

### 1. Error Handling
Always wrap Gemini calls in try-catch and provide fallback content:
```typescript
try {
  const insight = await generateDashboardInsights(data);
  setInsight(insight);
} catch (error) {
  console.error('Gemini error:', error);
  setInsight('Unable to generate insights. Please try again later.');
}
```

### 2. Loading States
Show loading indicators while waiting for Gemini:
```typescript
const [loading, setLoading] = useState(false);

const loadInsight = async () => {
  setLoading(true);
  try {
    const insight = await generateMigraineInsights(...);
    setInsight(insight);
  } finally {
    setLoading(false);
  }
};
```

### 3. Caching
Cache insights to avoid repeated API calls:
```typescript
const [cachedInsight, setCachedInsight] = useState<{
  date: string;
  insight: string;
} | null>(null);

const loadInsight = async () => {
  const today = new Date().toDateString();

  // Use cached if same day
  if (cachedInsight && cachedInsight.date === today) {
    setInsight(cachedInsight.insight);
    return;
  }

  // Generate new insight
  const insight = await generateDashboardInsights(data);
  setCachedInsight({ date: today, insight });
  setInsight(insight);
};
```

### 4. User Control
Let users refresh insights manually:
```typescript
<Pressable onPress={loadInsight} style={styles.refreshButton}>
  <Ionicons name="refresh" size={20} />
  <Text>Get Fresh Insights</Text>
</Pressable>
```

---

## Testing Gemini Integration

### 1. Test with Mock Data:
```typescript
// Test insight generation
const testMigraineInsight = async () => {
  const insight = await generateMigraineInsights(
    ['Nausea', 'Light sensitivity'],
    4,
    '2-4 hours',
    'Migraine with aura',
    0.86,
    mockDashboardData
  );
  console.log('Insight:', insight);
};
```

### 2. Monitor Backend Logs:
```bash
gcloud run logs read migraine-classifier \
  --region europe-north1 \
  --project aava-pfizer-ml \
  | grep "Gemini"
```

### 3. Check Response Times:
```typescript
const start = Date.now();
const insight = await generateMigraineInsights(...);
console.log(`Gemini response time: ${Date.now() - start}ms`);
```

---

## Summary

Gemini AI is now integrated in **5 key touchpoints**:

1. ✓ **After migraine logging** - Immediate personalized insights
2. ✓ **Dashboard** - Daily health recommendations
3. ✓ **Emergency tips** - Real-time symptom-specific help
4. ✓ **Pattern detection** - AI-discovered correlations
5. ✓ **Analytics** - Long-term prevention strategies

All functions are in `mobile/services/geminiService.ts` and ready to use!
