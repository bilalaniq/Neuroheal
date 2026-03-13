import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Pressable, Share, TextInput, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ModernHeader } from '@/components/ModernHeader';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useUser } from '@/contexts/UserContext';
import { API_BASE_URL } from '@/config/api';

const { width } = Dimensions.get('window');
const chartWidth = width - 40;
const chartHeight = 220;

interface LineChartProps {
  title: string;
  data: { date: string; value: number; severity?: string; note?: string }[];
  color: string;
  unit: string;
  darkMode?: boolean;
  yAxisLabels: string[];
  maxValue?: number;
}

interface MigraineDayData {
  date: string;
  hasMigraine: boolean;
  severity: number; // 0-4 scale (0: none, 1: mild, 2: moderate, 3: severe, 4: extreme)
  duration: number; // hours
  triggers: string[];
  note: string;
  symptoms: string[];
  medication: string[];
}

interface HealthMetricForDay {
  date: string;
  sleep: number;
  stress: number;
  hydration: number;
  screenTime: number;
  weather: string;
  note: string;
}

function generateMockMigraineDays(days: number = 30): MigraineDayData[] {
  const data: MigraineDayData[] = [];
  const today = new Date();

  const possibleTriggers = [
    'stress', 'lack of sleep', 'bright lights', 'loud noises', 'certain foods',
    'weather changes', 'hormonal changes', 'skipped meals', 'dehydration', 'screen time'
  ];

  const possibleSymptoms = [
    'throbbing pain', 'nausea', 'light sensitivity', 'sound sensitivity',
    'visual disturbances', 'dizziness', 'fatigue', 'concentration issues'
  ];

  const mockNotes = [
    'Woke up with mild headache, got worse during work meeting',
    'Stressful day at work, headache started around lunch',
    'Weather was changing, felt pressure building behind eyes',
    'Skipped breakfast, headache started mid-morning',
    'Long screen time session, eyes felt strained',
    'Good day, stayed hydrated and got enough sleep',
    'Exercise helped prevent headache today',
    'Meditation session in the morning felt helpful'
  ];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // 30% chance of having a migraine day
    const hasMigraine = Math.random() < 0.3;

    let severity = 0;
    let duration = 0;
    let triggers: string[] = [];
    let symptoms: string[] = [];
    let medication: string[] = [];

    if (hasMigraine) {
      severity = Math.floor(Math.random() * 4) + 1; // 1-4
      duration = Math.floor(Math.random() * 12) + 1; // 1-12 hours
      triggers = possibleTriggers.slice(0, Math.floor(Math.random() * 3) + 1);
      symptoms = possibleSymptoms.slice(0, Math.floor(Math.random() * 4) + 2);
      if (severity > 2) {
        medication = ['ibuprofen', 'prescription medication'][Math.floor(Math.random() * 2)]
          ? [['ibuprofen', 'prescription medication'][Math.floor(Math.random() * 2)]] : [];
      }
    }

    data.push({
      date: date.toISOString().split('T')[0],
      hasMigraine,
      severity,
      duration,
      triggers,
      note: mockNotes[Math.floor(Math.random() * mockNotes.length)],
      symptoms,
      medication
    });
  }

  return data;
}

function generateMockHealthMetrics(days: number = 30): HealthMetricForDay[] {
  const data: HealthMetricForDay[] = [];
  const today = new Date();

  const weatherTypes = ['sunny', 'cloudy', 'rainy', 'stormy', 'clear'];
  const healthNotes = [
    'Felt energetic and well-rested',
    'Stressed from work deadlines',
    'Good exercise session today',
    'Ate healthy meals, stayed hydrated',
    'Poor sleep due to noise',
    'Relaxing weekend day'
  ];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    data.push({
      date: date.toISOString().split('T')[0],
      sleep: Math.random() * 10, // 0-10 scale
      stress: Math.random() * 10, // 0-10 scale
      hydration: Math.random() * 10, // 0-10 scale
      screenTime: Math.random() * 12 + 2, // 2-14 hours
      weather: weatherTypes[Math.floor(Math.random() * weatherTypes.length)],
      note: healthNotes[Math.floor(Math.random() * healthNotes.length)]
    });
  }

  return data;
}

function LineChart({ title, data, color, unit, darkMode, yAxisLabels, maxValue = 10 }: LineChartProps) {
  if (data.length === 0) return null;

  const chartPadding = 40;
  const chartInnerWidth = chartWidth - chartPadding * 2;
  const chartInnerHeight = chartHeight - 80;

  return (
    <View style={[styles.chartContainer, darkMode && styles.chartContainerDark]}>
      <Text style={[styles.chartTitle, darkMode && styles.chartTitleDark]}>{title}</Text>

      <View style={styles.chartArea}>
        {/* Y-axis labels */}
        <View style={styles.yAxisContainer}>
          {yAxisLabels.map((label, index) => (
            <Text
              key={index}
              style={[
                styles.yAxisLabel,
                { top: (index * chartInnerHeight) / (yAxisLabels.length - 1) },
                darkMode && styles.yAxisLabelDark
              ]}
            >
              {label}
            </Text>
          ))}
        </View>

        {/* Grid lines */}
        <View style={[styles.gridContainer, { left: chartPadding }]}>
          {yAxisLabels.map((_, index) => (
            <View
              key={index}
              style={[
                styles.gridLine,
                { top: (index * chartInnerHeight) / (yAxisLabels.length - 1) },
                darkMode && styles.gridLineDark
              ]}
            />
          ))}
        </View>

        {/* Line chart */}
        <View style={[styles.lineContainer, { left: chartPadding, width: chartInnerWidth, height: chartInnerHeight }]}>
          {data.map((point, index) => {
            if (index === 0) return null;

            const prevPoint = data[index - 1];
            const x1 = ((index - 1) / (data.length - 1)) * chartInnerWidth;
            const y1 = chartInnerHeight - (prevPoint.value / maxValue) * chartInnerHeight;
            const x2 = (index / (data.length - 1)) * chartInnerWidth;
            const y2 = chartInnerHeight - (point.value / maxValue) * chartInnerHeight;

            const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
            const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);

            return (
              <View
                key={index}
                style={[
                  styles.lineSeg,
                  {
                    left: x1,
                    top: y1,
                    width: length,
                    height: 3,
                    backgroundColor: color,
                    transform: [{ rotate: `${angle}deg` }],
                    transformOrigin: 'left center',
                  }
                ]}
              />
            );
          })}

          {/* Data points */}
          {data.map((point, index) => {
            const x = (index / (data.length - 1)) * chartInnerWidth;
            const y = chartInnerHeight - (point.value / maxValue) * chartInnerHeight;

            return (
              <View
                key={`point-${index}`}
                style={[
                  styles.dataPoint,
                  {
                    left: x - 4,
                    top: y - 4,
                    backgroundColor: point.severity ?
                      (point.severity === 'none' ? '#a8d5c4' :
                        point.severity === 'mild' ? '#eab308' :
                          point.severity === 'moderate' ? '#f97316' :
                            point.severity === 'severe' ? '#ef4444' : '#dc2626') : color,
                    borderColor: darkMode ? '#253029' : '#f0f5f3',
                  }
                ]}
              />
            );
          })}
        </View>

        {/* X-axis */}
        <View style={styles.xAxisContainer}>
          <Text style={[styles.axisLabel, darkMode && styles.axisLabelDark]}>
            {data.length > 0 ? new Date(data[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
          </Text>
          <Text style={[styles.axisLabel, darkMode && styles.axisLabelDark]}>Today</Text>
        </View>
      </View>
    </View>
  );
}

function AIInsightsPanel({ migraineDays, healthMetrics, darkMode }: {
  migraineDays: MigraineDayData[],
  healthMetrics: HealthMetricForDay[],
  darkMode?: boolean
}) {
  // AI Analysis based on patterns
  const migraineDaysCount = migraineDays.filter(d => d.hasMigraine).length;
  const migraineFreeStreak = migraineDays.reverse().findIndex(d => d.hasMigraine);
  const commonTriggers = migraineDays
    .filter(d => d.hasMigraine)
    .flatMap(d => d.triggers)
    .reduce((acc, trigger) => {
      acc[trigger] = (acc[trigger] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const topTriggers = Object.entries(commonTriggers)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([trigger]) => trigger);

  const averageSeverity = migraineDays
    .filter(d => d.hasMigraine)
    .reduce((sum, d) => sum + d.severity, 0) / migraineDaysCount || 0;

  // Correlation analysis
  const stressfulDays = healthMetrics.filter(d => d.stress > 7).length;
  const lowSleepDays = healthMetrics.filter(d => d.sleep < 6).length;
  const highScreenDays = healthMetrics.filter(d => d.screenTime > 10).length;

  const generateInsight = () => {
    let insights = [];

    if (migraineDaysCount === 0) {
      insights.push("🎉 Excellent! No migraines recorded in the past 30 days. Your current routine seems to be working well.");
    } else {
      insights.push(`📊 You experienced ${migraineDaysCount} migraine days out of 30 (${Math.round(migraineDaysCount / 30 * 100)}% of days).`);

      if (migraineFreeStreak > 0) {
        insights.push(`✅ Current migraine-free streak: ${migraineFreeStreak} days.`);
      }

      if (averageSeverity < 2) {
        insights.push("💚 Most migraines were mild, which is encouraging.");
      } else if (averageSeverity > 3) {
        insights.push("🔴 Average migraine severity is high - consider discussing treatment options with your doctor.");
      }
    }

    if (topTriggers.length > 0) {
      insights.push(`⚠️ Most common triggers: ${topTriggers.join(', ')}.`);
    }

    // Pattern analysis
    if (stressfulDays > 10) {
      insights.push("😰 High stress levels detected frequently. Consider stress management techniques.");
    }

    if (lowSleepDays > 7) {
      insights.push("😴 Poor sleep patterns observed. Sleep quality may be affecting migraine frequency.");
    }

    if (highScreenDays > 15) {
      insights.push("📱 High screen time detected regularly. Consider taking breaks to reduce eye strain.");
    }

    return insights.join('\n\n');
  };

  return (
    <View style={[styles.aiPanel, darkMode && styles.aiPanelDark]}>
      <View style={styles.aiHeader}>
        <Ionicons name="sparkles" size={24} color={darkMode ? '#34d399' : '#10b981'} />
        <Text style={[styles.aiTitle, darkMode && styles.aiTitleDark]}>AI Insights</Text>
      </View>
      <Text style={[styles.aiText, darkMode && styles.aiTextDark]}>
        {generateInsight()}
      </Text>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, darkMode && styles.statNumberDark]}>{migraineDaysCount}</Text>
          <Text style={[styles.statLabel, darkMode && styles.statLabelDark]}>Migraine Days</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, darkMode && styles.statNumberDark]}>
            {averageSeverity.toFixed(1)}/4
          </Text>
          <Text style={[styles.statLabel, darkMode && styles.statLabelDark]}>Avg Severity</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, darkMode && styles.statNumberDark]}>
            {migraineFreeStreak >= 0 ? migraineFreeStreak : 0}
          </Text>
          <Text style={[styles.statLabel, darkMode && styles.statLabelDark]}>Days Migraine-Free</Text>
        </View>
      </View>
    </View>
  );
}

interface SymptomFormData {
  age: string;
  duration: string;
  frequency: string;
  location: string;
  character: string;
  intensity: string;
  nausea: boolean;
  vomit: boolean;
  phonophobia: boolean;
  photophobia: boolean;
  visual: string;
  sensory: boolean;
  dysphasia: boolean;
  dysarthria: boolean;
  vertigo: boolean;
  tinnitus: boolean;
  hypoacusis: boolean;
  diplopia: boolean;
  defect: boolean;
  conscience: boolean;
  paresthesia: boolean;
  dpf: boolean;
}

interface PredictionResult {
  predicted_class: string;
  confidence: number;
  all_predictions?: Record<string, number>;
}

function ToggleButton({ value, onChange, label, darkMode }: { value: boolean; onChange: (v: boolean) => void; label: string; darkMode?: boolean }) {
  return (
    <View style={styles.toggleContainer}>
      <Text style={[styles.toggleLabel, darkMode && styles.toggleLabelDark]}>{label}</Text>
      <Pressable
        onPress={() => onChange(!value)}
        style={[
          styles.toggleButton,
          value && styles.toggleButtonActive,
          darkMode && styles.toggleButtonDark,
          value && darkMode && styles.toggleButtonActiveDark
        ]}
      >
        <Text style={styles.toggleText}>{value ? '✓ Yes' : '○ No'}</Text>
      </Pressable>
    </View>
  );
}

function SelectButton({ value, onSelect, options, label, darkMode }: { value: string; onSelect: (v: string) => void; options: { label: string; value: string }[]; label: string; darkMode?: boolean }) {
  const [modalVisible, setModalVisible] = React.useState(false);

  return (
    <View style={styles.selectContainer}>
      <Text style={[styles.selectLabel, darkMode && styles.selectLabelDark]}>{label}</Text>
      <Pressable
        onPress={() => setModalVisible(true)}
        style={[styles.selectButton, darkMode && styles.selectButtonDark]}
      >
        <Text style={[styles.selectButtonText, darkMode && styles.selectButtonTextDark]}>
          {options.find(o => o.value === value)?.label || 'Select...'}
        </Text>
        <Ionicons name="chevron-down" size={20} color={darkMode ? '#d4e8e0' : '#2d4a42'} />
      </Pressable>

      <Modal visible={modalVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View style={[styles.modalContent, darkMode && styles.modalContentDark]}>
            {options.map(option => (
              <Pressable
                key={option.value}
                onPress={() => {
                  onSelect(option.value);
                  setModalVisible(false);
                }}
                style={[
                  styles.modalOption,
                  value === option.value && styles.modalOptionSelected,
                  darkMode && styles.modalOptionDark
                ]}
              >
                <Text style={[styles.modalOptionText, value === option.value && styles.modalOptionTextSelected, darkMode && styles.modalOptionTextDark]}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

export default function MigraneTrackingScreen() {
  const router = useRouter();
  const { darkMode } = useTheme();
  const { userData } = useUser();
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<PredictionResult | null>(null);

  const [formData, setFormData] = React.useState<SymptomFormData>({
    age: '',
    duration: '',
    frequency: '',
    location: '',
    character: '',
    intensity: '',
    nausea: false,
    vomit: false,
    phonophobia: false,
    photophobia: false,
    visual: '',
    sensory: false,
    dysphasia: false,
    dysarthria: false,
    vertigo: false,
    tinnitus: false,
    hypoacusis: false,
    diplopia: false,
    defect: false,
    conscience: false,
    paresthesia: false,
    dpf: false,
  });

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.age || !formData.duration || !formData.frequency || !formData.location || !formData.character || !formData.intensity || formData.visual === '') {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        age: parseInt(formData.age),
        duration: parseInt(formData.duration),
        frequency: parseInt(formData.frequency),
        location: parseInt(formData.location),
        character: parseInt(formData.character),
        intensity: parseInt(formData.intensity),
        nausea: formData.nausea ? 1 : 0,
        vomit: formData.vomit ? 1 : 0,
        phonophobia: formData.phonophobia ? 1 : 0,
        photophobia: formData.photophobia ? 1 : 0,
        visual: parseInt(formData.visual),
        sensory: formData.sensory ? 1 : 0,
        dysphasia: formData.dysphasia ? 1 : 0,
        dysarthria: formData.dysarthria ? 1 : 0,
        vertigo: formData.vertigo ? 1 : 0,
        tinnitus: formData.tinnitus ? 1 : 0,
        hypoacusis: formData.hypoacusis ? 1 : 0,
        diplopia: formData.diplopia ? 1 : 0,
        defect: formData.defect ? 1 : 0,
        conscience: formData.conscience ? 1 : 0,
        paresthesia: formData.paresthesia ? 1 : 0,
        dpf: formData.dpf ? 1 : 0,
      };

      const response = await fetch(`${API_BASE_URL}/predict/symptom-type`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
      } else {
        alert('Error: Could not classify symptoms');
      }
    } catch (error) {
      alert('Network error: ' + error);
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <View style={[styles.container, darkMode && styles.containerDark]}>
        <ModernHeader title="Symptom Classification" onBack={() => setResult(null)} />
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <View style={[styles.resultCard, darkMode && styles.resultCardDark]}>
            <View style={styles.resultIcon}>
              <Ionicons name="checkmark-circle" size={60} color="#10b981" />
            </View>
            <Text style={[styles.resultTitle, darkMode && styles.resultTitleDark]}>Classification Result</Text>
            <Text style={[styles.resultText, darkMode && styles.resultTextDark]}>{result.predicted_class}</Text>
            <Text style={[styles.confidenceText, darkMode && styles.confidenceTextDark]}>
              Confidence: {(result.confidence * 100).toFixed(1)}%
            </Text>

            <Pressable onPress={() => setResult(null)} style={[styles.button, styles.buttonPrimary]}>
              <Text style={styles.buttonText}>Log Another Assessment</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, darkMode && styles.containerDark]}>
      <ModernHeader title="Symptom Classification" onBack={() => router.back()} />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, darkMode && styles.sectionTitleDark]}>
            🧠 Migraine Type Classifier
          </Text>
          <Text style={[styles.sectionDescription, darkMode && styles.sectionDescriptionDark]}>
            Answer these questions about your current migraine to identify the type.
          </Text>
        </View>

        {/* Basic Info Section */}
        <View style={styles.formSection}>
          <Text style={[styles.formSectionTitle, darkMode && styles.formSectionTitleDark]}>Personal Information</Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, darkMode && styles.inputLabelDark]}>Age *</Text>
            <TextInput
              style={[styles.textInput, darkMode && styles.textInputDark]}
              placeholder="Years"
              placeholderTextColor={darkMode ? '#7a9f94' : '#999'}
              keyboardType="number-pad"
              value={formData.age}
              onChangeText={(text) => setFormData({ ...formData, age: text })}
            />
          </View>
        </View>

        {/* Migraine History Section */}
        <View style={styles.formSection}>
          <Text style={[styles.formSectionTitle, darkMode && styles.formSectionTitleDark]}>Migraine History</Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, darkMode && styles.inputLabelDark]}>Duration (days) *</Text>
            <TextInput
              style={[styles.textInput, darkMode && styles.textInputDark]}
              placeholder="How many days does migraine last?"
              placeholderTextColor={darkMode ? '#7a9f94' : '#999'}
              keyboardType="number-pad"
              value={formData.duration}
              onChangeText={(text) => setFormData({ ...formData, duration: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, darkMode && styles.inputLabelDark]}>Frequency (per month) *</Text>
            <TextInput
              style={[styles.textInput, darkMode && styles.textInputDark]}
              placeholder="How many migraines per month?"
              placeholderTextColor={darkMode ? '#7a9f94' : '#999'}
              keyboardType="number-pad"
              value={formData.frequency}
              onChangeText={(text) => setFormData({ ...formData, frequency: text })}
            />
          </View>
        </View>

        {/* Pain Characteristics Section */}
        <View style={styles.formSection}>
          <Text style={[styles.formSectionTitle, darkMode && styles.formSectionTitleDark]}>Pain Characteristics</Text>

          <SelectButton
            label="Location *"
            value={formData.location}
            onSelect={(v) => setFormData({ ...formData, location: v })}
            options={[
              { label: 'One side of head', value: '1' },
              { label: 'Both sides of head', value: '2' }
            ]}
            darkMode={darkMode}
          />

          <SelectButton
            label="Type of pain *"
            value={formData.character}
            onSelect={(v) => setFormData({ ...formData, character: v })}
            options={[
              { label: 'Throbbing/Pulsating', value: '1' },
              { label: 'Pressing/Tightening', value: '2' }
            ]}
            darkMode={darkMode}
          />

          <SelectButton
            label="Intensity *"
            value={formData.intensity}
            onSelect={(v) => setFormData({ ...formData, intensity: v })}
            options={[
              { label: 'Mild', value: '1' },
              { label: 'Moderate', value: '2' },
              { label: 'Severe', value: '3' }
            ]}
            darkMode={darkMode}
          />
        </View>

        {/* Associated Symptoms Section */}
        <View style={styles.formSection}>
          <Text style={[styles.formSectionTitle, darkMode && styles.formSectionTitleDark]}>Associated Symptoms</Text>

          <ToggleButton label="Nausea?" value={formData.nausea} onChange={(v) => setFormData({ ...formData, nausea: v })} darkMode={darkMode} />
          <ToggleButton label="Vomited?" value={formData.vomit} onChange={(v) => setFormData({ ...formData, vomit: v })} darkMode={darkMode} />
          <ToggleButton label="Sensitive to sound?" value={formData.phonophobia} onChange={(v) => setFormData({ ...formData, phonophobia: v })} darkMode={darkMode} />
          <ToggleButton label="Sensitive to light?" value={formData.photophobia} onChange={(v) => setFormData({ ...formData, photophobia: v })} darkMode={darkMode} />
        </View>

        {/* Aura Symptoms Section */}
        <View style={styles.formSection}>
          <Text style={[styles.formSectionTitle, darkMode && styles.formSectionTitleDark]}>Aura Symptoms</Text>

          <SelectButton
            label="Visual disturbances/aura *"
            value={formData.visual}
            onSelect={(v) => setFormData({ ...formData, visual: v })}
            options={[
              { label: 'None', value: '0' },
              { label: 'Mild visual changes', value: '1' },
              { label: 'Severe visual disturbances', value: '2' }
            ]}
            darkMode={darkMode}
          />

          <ToggleButton label="Sensory aura (tingling)?" value={formData.sensory} onChange={(v) => setFormData({ ...formData, sensory: v })} darkMode={darkMode} />
        </View>

        {/* Neurological Symptoms */}
        <View style={styles.formSection}>
          <Text style={[styles.formSectionTitle, darkMode && styles.formSectionTitleDark]}>Neurological Symptoms</Text>

          <ToggleButton label="Difficulty finding words?" value={formData.dysphasia} onChange={(v) => setFormData({ ...formData, dysphasia: v })} darkMode={darkMode} />
          <ToggleButton label="Slurred speech?" value={formData.dysarthria} onChange={(v) => setFormData({ ...formData, dysarthria: v })} darkMode={darkMode} />
          <ToggleButton label="Dizziness/Vertigo?" value={formData.vertigo} onChange={(v) => setFormData({ ...formData, vertigo: v })} darkMode={darkMode} />
          <ToggleButton label="Ringing in ears?" value={formData.tinnitus} onChange={(v) => setFormData({ ...formData, tinnitus: v })} darkMode={darkMode} />
          <ToggleButton label="Reduced hearing?" value={formData.hypoacusis} onChange={(v) => setFormData({ ...formData, hypoacusis: v })} darkMode={darkMode} />
          <ToggleButton label="Double vision?" value={formData.diplopia} onChange={(v) => setFormData({ ...formData, diplopia: v })} darkMode={darkMode} />
          <ToggleButton label="Visual field defect?" value={formData.defect} onChange={(v) => setFormData({ ...formData, defect: v })} darkMode={darkMode} />
          <ToggleButton label="Loss of consciousness?" value={formData.conscience} onChange={(v) => setFormData({ ...formData, conscience: v })} darkMode={darkMode} />
          <ToggleButton label="Numbness/Tingling in limbs?" value={formData.paresthesia} onChange={(v) => setFormData({ ...formData, paresthesia: v })} darkMode={darkMode} />
        </View>

        {/* Family History */}
        <View style={styles.formSection}>
          <Text style={[styles.formSectionTitle, darkMode && styles.formSectionTitleDark]}>Family History</Text>
          <ToggleButton label="Family history of migraine?" value={formData.dpf} onChange={(v) => setFormData({ ...formData, dpf: v })} darkMode={darkMode} />
        </View>

        {/* Submit Button */}
        <Pressable
          onPress={handleSubmit}
          disabled={loading}
          style={[styles.button, styles.buttonPrimary, loading && styles.buttonDisabled]}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.buttonText}>Classify Symptoms</Text>
          )}
        </Pressable>

        <View style={{ height: 40 }} />
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
    fontSize: 15,
    color: '#7a9f94',
    lineHeight: 22,
  },
  sectionDescriptionDark: {
    color: '#a8d5c4',
  },
  formSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  formSectionDark: {
    backgroundColor: '#253029',
  },
  formSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d4a42',
    marginBottom: 16,
  },
  formSectionTitleDark: {
    color: '#d4e8e0',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2d4a42',
    marginBottom: 8,
  },
  inputLabelDark: {
    color: '#d4e8e0',
  },
  textInput: {
    backgroundColor: '#f5f8f7',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#2d4a42',
    borderWidth: 1,
    borderColor: '#d4e8e0',
  },
  textInputDark: {
    backgroundColor: '#1a2622',
    color: '#d4e8e0',
    borderColor: '#5a8f7f',
  },
  selectContainer: {
    marginBottom: 16,
  },
  selectLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2d4a42',
    marginBottom: 8,
  },
  selectLabelDark: {
    color: '#d4e8e0',
  },
  selectButton: {
    backgroundColor: '#f5f8f7',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d4e8e0',
  },
  selectButtonDark: {
    backgroundColor: '#1a2622',
    borderColor: '#5a8f7f',
  },
  selectButtonText: {
    fontSize: 16,
    color: '#2d4a42',
    flex: 1,
  },
  selectButtonTextDark: {
    color: '#d4e8e0',
  },
  toggleContainer: {
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2d4a42',
  },
  toggleLabelDark: {
    color: '#d4e8e0',
  },
  toggleButton: {
    backgroundColor: '#f5f8f7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#d4e8e0',
  },
  toggleButtonActive: {
    backgroundColor: '#10b981',
    borderColor: '#059669',
  },
  toggleButtonDark: {
    backgroundColor: '#1a2622',
    borderColor: '#5a8f7f',
  },
  toggleButtonActiveDark: {
    backgroundColor: '#059669',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d4a42',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
  },
  modalContentDark: {
    backgroundColor: '#253029',
  },
  modalOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f5f3',
  },
  modalOptionDark: {
    borderBottomColor: '#5a8f7f',
  },
  modalOptionSelected: {
    backgroundColor: '#d4e8e0',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#2d4a42',
  },
  modalOptionTextDark: {
    color: '#d4e8e0',
  },
  modalOptionTextSelected: {
    color: '#059669',
    fontWeight: '600',
  },
  button: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonPrimary: {
    backgroundColor: '#10b981',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resultCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    marginTop: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  resultCardDark: {
    backgroundColor: '#253029',
  },
  resultIcon: {
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2d4a42',
    marginBottom: 12,
  },
  resultTitleDark: {
    color: '#d4e8e0',
  },
  resultText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10b981',
    marginBottom: 8,
    textAlign: 'center',
  },
  resultTextDark: {
    color: '#10b981',
  },
  confidenceText: {
    fontSize: 14,
    color: '#7a9f94',
    marginBottom: 20,
  },
  confidenceTextDark: {
    color: '#a8d5c4',
  },
  chartsSection: {
    marginBottom: 24,
  },
  chartContainer: {
    backgroundColor: '#f0f5f3',
    borderRadius: 24,
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
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d4a42',
    marginBottom: 16,
  },
  chartTitleDark: {
    color: '#d4e8e0',
  },
  chartArea: {
    position: 'relative',
    height: chartHeight,
  },
  yAxisContainer: {
    position: 'absolute',
    left: 0,
    top: 20,
    width: 35,
    height: chartHeight - 80,
  },
  yAxisLabel: {
    position: 'absolute',
    fontSize: 10,
    color: '#7a9f94',
    textAlign: 'right',
    width: 35,
    marginTop: -6,
  },
  yAxisLabelDark: {
    color: '#7a9f94',
  },
  gridContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    bottom: 40,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#c4dbd2',
  },
  gridLineDark: {
    backgroundColor: '#5a8f7f',
  },
  lineContainer: {
    position: 'absolute',
    top: 20,
  },
  lineSeg: {
    position: 'absolute',
    borderRadius: 1.5,
  },
  dataPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
  },
  xAxisContainer: {
    position: 'absolute',
    bottom: 10,
    left: 40,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  axisLabel: {
    fontSize: 12,
    color: '#7a9f94',
  },
  axisLabelDark: {
    color: '#7a9f94',
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
  instructionsContainer: {
    backgroundColor: '#d4e8e0',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#a8d5c4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
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
