import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Modal,
  Dimensions,
  ActivityIndicator,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useUser } from '@/contexts/UserContext';

interface MigraineTrackingScreenProps {
  navigation: {
    goBack: () => void;
    navigate: (route: string) => void;
  };
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
}

const API_BASE_URL = 'http://localhost:8080';
const { width } = Dimensions.get('window');
const maxWidth = Math.min(width, 448);

const durationOptions = [
  { label: 'Select duration', value: '' },
  { label: 'Less than 1 hour', value: '< 1 hour' },
  { label: '1-2 hours', value: '1-2 hours' },
  { label: '2-4 hours', value: '2-4 hours' },
  { label: '4-8 hours', value: '4-8 hours' },
  { label: '8-24 hours', value: '8-24 hours' },
  { label: 'More than 24 hours', value: '> 24 hours' },
];

export function MigraineTrackingScreen({ navigation }: MigraineTrackingScreenProps) {
  const [intensity, setIntensity] = useState(3);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showDurationModal, setShowDurationModal] = useState(false);
  const [showNotes, setShowNotes] = useState(true);
  const [enableAIAnalysis, setEnableAIAnalysis] = useState(false);
  const [aiInsights, setAiInsights] = useState<string>('');
  const [predictionResult, setPredictionResult] = useState<{ prediction: string; confidence: number } | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  // Model 1 - Symptom Classification
  const [showDetailedForm, setShowDetailedForm] = useState(false);
  const [classificationResult, setClassificationResult] = useState<PredictionResult | null>(null);
  const [classifyLoading, setClassifyLoading] = useState(false);
  const [formData, setFormData] = useState<SymptomFormData>({
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

  const { darkMode } = useTheme();
  const { userData, updateIntegrations } = useUser();

  React.useEffect(() => {
    if (userData?.dashboardData) {
      const hasNullValues =
        userData.dashboardData.meals === null ||
        userData.dashboardData.hydration === null ||
        userData.dashboardData.alcohol === null;

      if (hasNullValues && userData.integrations) {
        updateIntegrations(userData.integrations);
      }
    }
  }, [userData?.dashboardData, userData?.integrations, updateIntegrations]);

  const sliderRef = useRef<View>(null);
  const sliderLayout = useRef({ x: 0, width: 0 });

  const updateIntensityFromPosition = useCallback((position: number) => {
    if (sliderLayout.current.width === 0) return;

    const percentage = Math.max(0, Math.min(1, position / sliderLayout.current.width));
    const value = Math.round(percentage * 4 + 1);
    setIntensity(Math.max(1, Math.min(5, value)));
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt, gestureState) => {
        const position = gestureState.x0 - sliderLayout.current.x;
        updateIntensityFromPosition(position);
      },
      onPanResponderMove: (evt, gestureState) => {
        const position = gestureState.moveX - sliderLayout.current.x;
        updateIntensityFromPosition(position);
      },
      onPanResponderRelease: (evt, gestureState) => {
        const position = gestureState.moveX - sliderLayout.current.x;
        updateIntensityFromPosition(position);
      },
    })
  ).current;

  const handleClassifySymptoms = async () => {
    if (!formData.age || !formData.duration || !formData.frequency || !formData.location || !formData.character || !formData.intensity || formData.visual === '') {
      alert('Please fill in all required fields');
      return;
    }

    setClassifyLoading(true);
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
        setClassificationResult(data);
      } else {
        alert('Error: Could not classify symptoms');
      }
    } catch (error) {
      alert('Network error: ' + error);
    } finally {
      setClassifyLoading(false);
    }
  };

  const symptoms = [
    'Aura',
    'Nausea',
    'Vomiting',
    'Light sensitivity',
    'Sound sensitivity',
    'Dizziness',
    'Visual disturbances',
    'Neck pain',
  ];

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms(prev =>
      prev.includes(symptom)
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const handleSubmit = async () => {
    if (!userData) {
      console.error('No user data available');
      return;
    }

    setShowSuccess(true);

    console.log('=== UserContext Data ===');
    console.log('Full userData object:', JSON.stringify(userData, null, 2));
    console.log('User name:', userData?.name);
    console.log('Age bracket:', userData?.ageBracket);
    console.log('Integrations:', userData?.integrations);
    console.log('Dashboard data:', userData?.dashboardData);

    if (enableAIAnalysis) {
      try {
        setLoadingInsights(true);

        // Import the API functions and mapper
        const { predict, saveData } = await import('@/services/migraineApi');
        const { getFeaturesForPrediction, createSaveDataRequest } = await import('@/utils/dataMapper');
        const { generateMigraineInsights } = await import('@/services/geminiService');

        // Prepare migraine data
        const migraineData = {
          intensity,
          selectedSymptoms,
          duration,
        };

        // Step 1: Get features and make prediction
        const features = getFeaturesForPrediction(userData, migraineData);
        console.log('Sending prediction request with features:', features);

        const prediction = await predict(features);
        console.log('Prediction result:', prediction);

        // Store prediction result for display
        setPredictionResult({
          prediction: prediction.prediction,
          confidence: prediction.confidence,
        });

        // Step 2: Generate AI insights using Gemini
        const insights = await generateMigraineInsights(
          selectedSymptoms,
          intensity,
          duration,
          prediction.prediction,
          prediction.confidence,
          userData?.dashboardData
        );
        console.log('AI Insights:', insights);
        setAiInsights(insights);

        // Step 3: Save data to BigQuery with prediction
        //const saveRequest = createSaveDataRequest(userData, migraineData, prediction);
        //console.log('Saving data to backend:', saveRequest);

        //const saveResult = await saveData(saveRequest);
        //console.log('Save result:', saveResult);

      } catch (error) {
        console.error('Error during AI analysis:', error);
        setAiInsights('Unable to generate insights at this time. Please try again later.');
        // Continue with success screen even if API fails
      } finally {
        setLoadingInsights(false);
      }
    }
    console.log('========================');
  };

  const handleDismiss = () => {
    navigation.navigate('Main');
  };

  // Show classification result
  if (classificationResult) {
    return (
      <View style={[styles.container, darkMode && styles.containerDark]}>
        <View style={styles.header}>
          <Pressable onPress={() => setClassificationResult(null)}>
            <Ionicons name="chevron-back" size={24} color={darkMode ? '#d4e8e0' : '#2d4a42'} />
          </Pressable>
          <Text style={[styles.headerTitle, darkMode && styles.textDark]}>Classification Result</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={[styles.resultCard, darkMode && styles.resultCardDark]}>
            <Ionicons name="checkmark-circle" size={60} color="#10b981" style={{ marginBottom: 16 }} />
            <Text style={[styles.resultType, darkMode && styles.textDark]}>{classificationResult.predicted_class}</Text>
            <Text style={[styles.resultConfidence, darkMode && styles.successSubtitleDark]}>
              Confidence: {(classificationResult.confidence * 100).toFixed(1)}%
            </Text>
            <Pressable
              onPress={() => {
                setClassificationResult(null);
                setFormData({
                  age: '', duration: '', frequency: '', location: '', character: '', intensity: '',
                  nausea: false, vomit: false, phonophobia: false, photophobia: false, visual: '',
                  sensory: false, dysphasia: false, dysarthria: false, vertigo: false, tinnitus: false,
                  hypoacusis: false, diplopia: false, defect: false, conscience: false, paresthesia: false, dpf: false,
                });
              }}
              style={[styles.submitButton, { marginTop: 24 }]}
            >
              <Ionicons name="add" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.submitText}>Log Another</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Show detailed classification form
  if (showDetailedForm) {
    return (
      <View style={[styles.container, darkMode && styles.containerDark]}>
        <View style={styles.header}>
          <Pressable onPress={() => setShowDetailedForm(false)}>
            <Ionicons name="chevron-back" size={24} color={darkMode ? '#d4e8e0' : '#2d4a42'} />
          </Pressable>
          <Text style={[styles.headerTitle, darkMode && styles.textDark]}>Detailed Classification</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={[styles.sectionLabel, darkMode && styles.textDark]}>Age</Text>
          <TextInput style={[styles.textInput, darkMode && styles.textInputDark]} placeholder="Years" placeholderTextColor={darkMode ? '#7a9f94' : '#999'} keyboardType="number-pad" value={formData.age} onChangeText={(text) => setFormData({ ...formData, age: text })} />

          <Text style={[styles.sectionLabel, darkMode && styles.textDark]}>Duration (days)</Text>
          <TextInput style={[styles.textInput, darkMode && styles.textInputDark]} placeholder="Days" placeholderTextColor={darkMode ? '#7a9f94' : '#999'} keyboardType="number-pad" value={formData.duration} onChangeText={(text) => setFormData({ ...formData, duration: text })} />

          <Text style={[styles.sectionLabel, darkMode && styles.textDark]}>Frequency (per month)</Text>
          <TextInput style={[styles.textInput, darkMode && styles.textInputDark]} placeholder="Per month" placeholderTextColor={darkMode ? '#7a9f94' : '#999'} keyboardType="number-pad" value={formData.frequency} onChangeText={(text) => setFormData({ ...formData, frequency: text })} />

          <Text style={[styles.sectionLabel, darkMode && styles.textDark]}>Location</Text>
          <View style={styles.optionRow}>
            {['1', '2'].map(val => (
              <Pressable key={val} onPress={() => setFormData({ ...formData, location: val })} style={[styles.optionButton, formData.location === val && styles.optionButtonSelected, darkMode && styles.optionButtonDark, formData.location === val && darkMode && styles.optionButtonSelectedDark]}>
                <Text style={[styles.optionText, formData.location === val && styles.optionTextSelected]}>{val === '1' ? 'One Side' : 'Both Sides'}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.sectionLabel, darkMode && styles.textDark]}>Pain Type</Text>
          <View style={styles.optionRow}>
            {['1', '2'].map(val => (
              <Pressable key={val} onPress={() => setFormData({ ...formData, character: val })} style={[styles.optionButton, formData.character === val && styles.optionButtonSelected, darkMode && styles.optionButtonDark, formData.character === val && darkMode && styles.optionButtonSelectedDark]}>
                <Text style={[styles.optionText, formData.character === val && styles.optionTextSelected]}>{val === '1' ? 'Throbbing' : 'Pressing'}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.sectionLabel, darkMode && styles.textDark]}>Intensity</Text>
          <View style={styles.optionRow}>
            {['1', '2', '3'].map(val => (
              <Pressable key={val} onPress={() => setFormData({ ...formData, intensity: val })} style={[styles.optionButton, formData.intensity === val && styles.optionButtonSelected, darkMode && styles.optionButtonDark, formData.intensity === val && darkMode && styles.optionButtonSelectedDark]}>
                <Text style={[styles.optionText, formData.intensity === val && styles.optionTextSelected]}>{val === '1' ? 'Mild' : val === '2' ? 'Moderate' : 'Severe'}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.sectionLabel, darkMode && styles.textDark]}>Visual Disturbances</Text>
          <View style={styles.optionRow}>
            {['0', '1', '2'].map(val => (
              <Pressable key={val} onPress={() => setFormData({ ...formData, visual: val })} style={[styles.optionButton, formData.visual === val && styles.optionButtonSelected, darkMode && styles.optionButtonDark, formData.visual === val && darkMode && styles.optionButtonSelectedDark]}>
                <Text style={[styles.optionText, formData.visual === val && styles.optionTextSelected]}>{val === '0' ? 'None' : val === '1' ? 'Mild' : 'Severe'}</Text>
              </Pressable>
            ))}
          </View>

          {/* Toggle buttons for yes/no questions */}
          {[
            { key: 'nausea', label: 'Nausea?' },
            { key: 'vomit', label: 'Vomited?' },
            { key: 'phonophobia', label: 'Sound sensitive?' },
            { key: 'photophobia', label: 'Light sensitive?' },
            { key: 'sensory', label: 'Sensory aura?' },
            { key: 'dysphasia', label: 'Difficulty finding words?' },
            { key: 'dysarthria', label: 'Slurred speech?' },
            { key: 'vertigo', label: 'Dizziness?' },
            { key: 'tinnitus', label: 'Ringing ears?' },
            { key: 'hypoacusis', label: 'Reduced hearing?' },
            { key: 'diplopia', label: 'Double vision?' },
            { key: 'defect', label: 'Visual field defect?' },
            { key: 'conscience', label: 'Lost consciousness?' },
            { key: 'paresthesia', label: 'Numbness/tingling?' },
            { key: 'dpf', label: 'Family history?' },
          ].map(({ key, label }) => (
            <View key={key} style={styles.toggleRow}>
              <Text style={[styles.sectionLabel, darkMode && styles.textDark, { marginBottom: 0 }]}>{label}</Text>
              <Pressable onPress={() => setFormData({ ...formData, [key as keyof SymptomFormData]: !(formData[key as keyof SymptomFormData]) })} style={[styles.toggleButton, (formData[key as keyof SymptomFormData]) && styles.toggleButtonActive, darkMode && styles.toggleButtonDark, (formData[key as keyof SymptomFormData]) && darkMode && styles.toggleButtonActiveDark]}>
                <Text style={styles.toggleText}>{(formData[key as keyof SymptomFormData]) ? '✓' : '○'}</Text>
              </Pressable>
            </View>
          ))}

          <Pressable
            onPress={handleClassifySymptoms}
            disabled={classifyLoading}
            style={[styles.submitButton, classifyLoading && styles.submitButtonDisabled]}
          >
            {classifyLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="analytics" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.submitText}>Classify Symptoms</Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  if (showSuccess) {
    return (
      <View style={[styles.successContainer, darkMode && styles.successContainerDark]}>
        <ScrollView
          style={styles.successScrollView}
          contentContainerStyle={styles.successScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.successContent}>


            {/* Loading AI Insights */}
            {loadingInsights && (
              <View style={[styles.insightsLoadingContainer, darkMode && styles.insightsLoadingContainerDark]}>
                <View style={styles.loadingIconWrapper}>
                  <ActivityIndicator
                    size="large"
                    color="#a8d5c4"
                    style={styles.loadingSpinner}
                  />

                </View>
                <Text style={[styles.insightsLoadingTitle, darkMode && styles.textDark]}>
                  Analyzing Your Data
                </Text>
                <Text style={[styles.insightsLoadingText, darkMode && styles.successSubtitleDark]}>
                  Our AI is generating personalized insights based on your migraine patterns...
                </Text>
              </View>
            )}

            {/* Prediction Result */}
            {predictionResult && !loadingInsights && (
              <View style={[styles.predictionCard, darkMode && styles.predictionCardDark]}>
                <View style={styles.predictionHeader}>
                  <Ionicons name="analytics" size={20} color="#a8d5c4" />
                  <Text style={[styles.predictionHeaderText, darkMode && styles.textDark]}>
                    AI Prediction
                  </Text>
                </View>
                <Text style={[styles.predictionType, darkMode && styles.textDark]}>
                  {predictionResult.prediction}
                </Text>
                <Text style={[styles.predictionConfidence, darkMode && styles.successSubtitleDark]}>
                  Confidence: {Math.round(predictionResult.confidence * 100)}%
                </Text>
              </View>
            )}

            {/* AI Insights */}
            {aiInsights && !loadingInsights && (
              <View style={[styles.insightsCard, darkMode && styles.insightsCardDark]}>
                <View style={styles.insightsHeader}>
                  <Ionicons name="sparkles" size={20} color="#a8d5c4" />
                  <Text style={[styles.insightsHeaderText, darkMode && styles.textDark]}>
                    Personalized Insights
                  </Text>
                </View>
                <Text style={[styles.insightsText, darkMode && styles.successSubtitleDark]}>
                  {aiInsights}
                </Text>
              </View>
            )}

            {/* Dismiss Button - Show when not loading or when AI is disabled */}
            {(!enableAIAnalysis || !loadingInsights) && (
              <Pressable
                onPress={handleDismiss}
                style={[styles.dismissButton, darkMode && styles.dismissButtonDark]}
              >
                <Text style={styles.dismissButtonText}>Back to Dashboard</Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  const selectedDurationLabel = durationOptions.find(opt => opt.value === duration)?.label || 'Select duration';

  return (
    <View style={[styles.container, darkMode && styles.containerDark]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.content, { maxWidth }]}>
          {/* Quick Intensity */}
          <View style={[styles.section, darkMode && styles.sectionDark]}>
            <View style={styles.sliderHeader}>
              <Text style={[styles.label, darkMode && styles.textDark]}>Pain Level</Text>
              <Text style={[styles.intensityValue, darkMode && styles.textDark]}>{intensity}</Text>
            </View>
            <View
              ref={sliderRef}
              style={styles.customSliderContainer}
              onLayout={(e) => {
                sliderLayout.current.width = e.nativeEvent.layout.width;
                sliderRef.current?.measureInWindow((x, y, width, height) => {
                  sliderLayout.current.x = x;
                });
              }}
              {...panResponder.panHandlers}
            >
              <View style={[styles.sliderTrackLine, darkMode && styles.sliderTrackLineDark]}>
                <View style={[
                  styles.sliderFillLine,
                  darkMode && styles.sliderFillLineDark,
                  { width: `${((intensity - 1) / 4) * 100}%` }
                ]} />
              </View>
              <View style={styles.sliderDots}>
                {[1, 2, 3, 4, 5].map((level) => (
                  <View
                    key={level}
                    style={[
                      styles.sliderDot,
                      intensity >= level && styles.sliderDotActive,
                      darkMode && styles.sliderDotDark,
                      intensity >= level && darkMode && styles.sliderDotActiveDark,
                    ]}
                  />
                ))}
              </View>
              <View
                style={[
                  styles.sliderThumb,
                  darkMode && styles.sliderThumbDark,
                  { left: `${((intensity - 1) / 4) * 100}%` }
                ]}
              />
            </View>
            <View style={styles.sliderLabels}>
              {[1, 2, 3, 4, 5].map((level) => (
                <Text key={level} style={[styles.sliderLabelText, darkMode && styles.textDark]}>
                  {level}
                </Text>
              ))}
            </View>
          </View>

          {/* Symptoms */}
          <View style={[styles.section, darkMode && styles.sectionDark]}>
            <Text style={[styles.label, darkMode && styles.textDark]}>Symptoms (optional)</Text>
            <View style={styles.symptomsGrid}>
              {symptoms.map((symptom) => {
                const isSelected = selectedSymptoms.includes(symptom);
                return (
                  <Pressable
                    key={symptom}
                    onPress={() => toggleSymptom(symptom)}
                    style={[
                      styles.symptomButton,
                      isSelected && styles.symptomButtonSelected,
                      darkMode && styles.symptomButtonDark,
                      isSelected && darkMode && styles.symptomButtonSelectedDark,
                    ]}
                  >
                    <Text
                      style={[
                        styles.symptomText,
                        isSelected && styles.symptomTextSelected,
                        darkMode && styles.textDark,
                      ]}
                    >
                      {symptom}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Duration */}
          <View style={[styles.section, darkMode && styles.sectionDark]}>
            <Text style={[styles.label, darkMode && styles.textDark]}>Duration (optional)</Text>
            <Pressable
              onPress={() => setShowDurationModal(true)}
              style={[styles.durationButton, darkMode && styles.durationButtonDark]}
            >
              <Text style={[styles.durationText, !duration && styles.durationPlaceholder, darkMode && styles.textDark]}>
                {selectedDurationLabel}
              </Text>
              <Ionicons name="chevron-down" size={24} color={darkMode ? '#94a3b8' : '#64748b'} />
            </Pressable>
          </View>

          {/* Notes */}
          <View style={[styles.section, darkMode && styles.sectionDark]}>
            <Pressable
              onPress={() => setShowNotes(!showNotes)}
              style={styles.notesHeader}
            >
              <Text style={[styles.label, darkMode && styles.textDark]}>Notes (optional)</Text>

            </Pressable>
            <TextInput
              style={[styles.notesInput, darkMode && styles.notesInputDark]}
              placeholder="Any other details..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={4}
              value={notes}
              onChangeText={setNotes}
              textAlignVertical="top"
            />
          </View>

          {/* AI Analysis Checkbox */}
          <Pressable
            onPress={() => setEnableAIAnalysis(!enableAIAnalysis)}
            style={[
              styles.checkboxContainer,
              darkMode && styles.sectionDark,
            ]}
          >
            <View style={[
              styles.checkbox,
              enableAIAnalysis && styles.checkboxChecked,
              darkMode && styles.checkboxDark,
              enableAIAnalysis && darkMode && styles.checkboxCheckedDark,
            ]}>
              {enableAIAnalysis && (
                <Ionicons name="checkmark" size={20} color="#fff" />
              )}
            </View>
            <Text style={[styles.checkboxLabel, darkMode && styles.textDark]}>
              Enable AI pattern analysis
            </Text>
          </Pressable>

          {/* Detailed Classification Button */}
          <Pressable
            onPress={() => setShowDetailedForm(true)}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.submitButtonPressed,
            ]}
          >
            <View style={styles.submitButtonContent}>
              <Ionicons name="flask" size={28} color="#a8d5c4" />
              <Text style={styles.secondaryButtonText}>Detailed Type Classification</Text>
            </View>
          </Pressable>

          {/* Submit Button */}
          <Pressable
            onPress={handleSubmit}
            style={({ pressed }) => [
              styles.submitButton,
              pressed && styles.submitButtonPressed,
            ]}
          >
            <View style={styles.submitButtonContent}>
              <Ionicons name="checkmark-circle" size={28} color="#fff" />
              <Text style={styles.submitText}>Save Log</Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>

      {/* Duration Modal */}
      <Modal
        visible={showDurationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDurationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Duration</Text>
              <Pressable onPress={() => setShowDurationModal(false)}>
                <Ionicons name="close" size={24} color="#475569" />
              </Pressable>
            </View>
            <ScrollView>
              {durationOptions.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    setDuration(option.value);
                    setShowDurationModal(false);
                  }}
                  style={[
                    styles.modalOption,
                    duration === option.value && styles.modalOptionSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      duration === option.value && styles.modalOptionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                  {duration === option.value && (
                    <Ionicons name="checkmark" size={20} color="#a8d5c4" />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
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
    gap: 24,
  },
  section: {
    backgroundColor: '#f0f5f3',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#d4e8e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionDark: {
    backgroundColor: '#253029',
    borderColor: '#5a8f7f',
  },
  label: {
    fontSize: 24,
    fontWeight: '500',
    color: '#2d4a42',
    marginBottom: 16,
  },
  textDark: {
    color: '#d4e8e0',
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  intensityValue: {
    fontSize: 32,
    fontWeight: '600',
    color: '#a8d5c4',
  },
  customSliderContainer: {
    height: 44,
    justifyContent: 'center',
    marginVertical: 8,
  },
  sliderTrackLine: {
    position: 'absolute',
    width: '100%',
    height: 6,
    backgroundColor: '#d4e8e0',
    borderRadius: 3,
  },
  sliderTrackLineDark: {
    backgroundColor: '#5a8f7f',
  },
  sliderFillLine: {
    height: '100%',
    backgroundColor: '#a8d5c4',
    borderRadius: 3,
  },
  sliderFillLineDark: {
    backgroundColor: '#7a9f94',
  },
  sliderDots: {
    position: 'absolute',
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  sliderDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#d4e8e0',
    borderWidth: 2,
    borderColor: '#f0f5f3',
  },
  sliderDotDark: {
    backgroundColor: '#5a8f7f',
    borderColor: '#253029',
  },
  sliderDotActive: {
    backgroundColor: '#a8d5c4',
    borderColor: '#a8d5c4',
  },
  sliderDotActiveDark: {
    backgroundColor: '#7a9f94',
    borderColor: '#7a9f94',
  },
  sliderThumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#a8d5c4',
    marginLeft: -12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  sliderThumbDark: {
    backgroundColor: '#7a9f94',
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
    marginTop: 8,
  },
  sliderLabelText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#7a9f94',
    width: 18,
    textAlign: 'center',
  },
  symptomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  symptomButton: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#d4e8e0',
    backgroundColor: '#f0f5f3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  symptomButtonDark: {
    backgroundColor: '#253029',
    borderColor: '#5a8f7f',
  },
  symptomButtonSelected: {
    borderColor: '#a8d5c4',
    backgroundColor: '#d4e8e0',
    fontWeight: '700',
  },
  symptomButtonSelectedDark: {
    borderColor: '#7a9f94',
    backgroundColor: '#7a9f94',
  },
  symptomText: {
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '500',
    color: '#2d4a42',
  },
  symptomTextSelected: {
    color: '#2d4a42',
    fontWeight: '500',
  },
  durationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#d4e8e0',
    backgroundColor: '#f0f5f3',
  },
  durationButtonDark: {
    backgroundColor: '#253029',
    borderColor: '#5a8f7f',
  },
  durationText: {
    fontSize: 18,
    color: '#2d4a42',
  },
  durationPlaceholder: {
    color: '#7a9f94',
  },
  notesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  notesInput: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#d4e8e0',
    backgroundColor: '#f0f5f3',
    fontSize: 18,
    color: '#2d4a42',
    minHeight: 120,
  },
  notesInputDark: {
    backgroundColor: '#253029',
    borderColor: '#5a8f7f',
    color: '#d4e8e0',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#f0f5f3',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d4e8e0',
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#a8d5c4',
    backgroundColor: '#f0f5f3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDark: {
    backgroundColor: '#253029',
    borderColor: '#5a8f7f',
  },
  checkboxChecked: {
    backgroundColor: '#a8d5c4',
    borderColor: '#a8d5c4',
  },
  checkboxCheckedDark: {
    backgroundColor: '#7a9f94',
    borderColor: '#7a9f94',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 16,
    color: '#2d4a42',
    fontWeight: '500',
  },
  submitButton: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#a8d5c4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  submitButtonPressed: {
    transform: [{ scale: 0.98 }],
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 20,
    minHeight: 64,
  },
  submitGradient: {
    padding: 16,
    alignItems: 'center',
  },
  submitText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0.5,
  },
  successContainer: {
    flex: 1,
    backgroundColor: '#f5f8f7',
  },
  successContainerDark: {
    backgroundColor: '#1a2622',
  },
  successScrollView: {
    flex: 1,
  },
  successScrollContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    minHeight: '100%',
  },
  successContent: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 448,
  },
  successIconContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#d4e8e0',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '500',
    color: '#2d4a42',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: '#7a9f94',
    marginBottom: 24,
  },
  successSubtitleDark: {
    color: '#c4dbd2',
  },
  insightsLoadingContainer: {
    width: '100%',
    backgroundColor: '#d4e8e0',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#a8d5c4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  insightsLoadingContainerDark: {
    backgroundColor: '#253029',
    borderColor: '#5a8f7f',
  },
  loadingIconWrapper: {
    position: 'relative',
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  loadingIconBackground: {
    width: 80,
    height: 80,
    backgroundColor: '#f0f5f3',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  loadingIconBackgroundDark: {
    backgroundColor: '#1a2622',
  },
  loadingSpinner: {
    position: 'absolute',
    width: 80,
    height: 80,
  },
  insightsLoadingTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2d4a42',
    marginBottom: 4,
  },
  insightsLoadingText: {
    fontSize: 14,
    color: '#2d4a42',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  loadingDotsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#a8d5c4',
  },
  loadingDot1: {
    opacity: 0.4,
  },
  loadingDot2: {
    opacity: 0.7,
  },
  loadingDot3: {
    opacity: 1,
  },
  predictionCard: {
    width: '100%',
    backgroundColor: '#f0f5f3',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#d4e8e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  predictionCardDark: {
    backgroundColor: '#253029',
    borderColor: '#5a8f7f',
  },
  predictionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  predictionHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d4a42',
  },
  predictionType: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2d4a42',
    marginBottom: 4,
  },
  predictionConfidence: {
    fontSize: 14,
    color: '#7a9f94',
  },
  insightsCard: {
    width: '100%',
    backgroundColor: '#d4e8e0',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#a8d5c4',
  },
  insightsCardDark: {
    backgroundColor: '#253029',
    borderColor: '#5a8f7f',
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  insightsHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d4a42',
  },
  insightsText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#2d4a42',
  },
  dismissButton: {
    width: '100%',
    backgroundColor: '#a8d5c4',
    borderRadius: 20,
    padding: 18,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  dismissButtonDark: {
    backgroundColor: '#7a9f94',
  },
  dismissButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#f0f5f3',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#d4e8e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '500',
    color: '#2d4a42',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#d4e8e0',
  },
  modalOptionSelected: {
    backgroundColor: '#d4e8e0',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#2d4a42',
  },
  modalOptionTextSelected: {
    color: '#a8d5c4',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#d4e8e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2d4a42',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2d4a42',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#f0f5f3',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    color: '#2d4a42',
    borderWidth: 1,
    borderColor: '#d4e8e0',
  },
  textInputDark: {
    backgroundColor: '#253029',
    borderColor: '#5a8f7f',
    color: '#d4e8e0',
  },
  optionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  optionButton: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d4e8e0',
    backgroundColor: '#f0f5f3',
    alignItems: 'center',
  },
  optionButtonDark: {
    backgroundColor: '#253029',
    borderColor: '#5a8f7f',
  },
  optionButtonSelected: {
    backgroundColor: '#a8d5c4',
    borderColor: '#059669',
  },
  optionButtonSelectedDark: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  optionText: {
    fontSize: 13,
    color: '#2d4a42',
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#fff',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d4e8e0',
    backgroundColor: '#f0f5f3',
  },
  toggleButtonDark: {
    backgroundColor: '#253029',
    borderColor: '#5a8f7f',
  },
  toggleButtonActive: {
    backgroundColor: '#10b981',
    borderColor: '#059669',
  },
  toggleButtonActiveDark: {
    backgroundColor: '#059669',
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d4a42',
  },
  resultCard: {
    backgroundColor: '#f0f5f3',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d4e8e0',
  },
  resultCardDark: {
    backgroundColor: '#253029',
    borderColor: '#5a8f7f',
  },
  resultType: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10b981',
    marginBottom: 8,
    textAlign: 'center',
  },
  resultConfidence: {
    fontSize: 14,
    color: '#7a9f94',
  },
  secondaryButton: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#f0f5f3',
    borderWidth: 2,
    borderColor: '#a8d5c4',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#a8d5c4',
    letterSpacing: 0.5,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
});
