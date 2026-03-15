import { useUser } from '@/contexts/UserContext';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Dimensions, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';

interface OnboardingScreenProps {
  onComplete: () => void;
}

interface Integration {
  id: string;
  name: string;
  description: string;
  iconName: keyof typeof Ionicons.glyphMap;
  enabled: boolean;
  category: 'health' | 'device' | 'external';
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [ageBracket, setAgeBracket] = useState('');
  const { setUserData } = useUser();

  const submitData = () => {
    const selectedBracket = ageBrackets.find(b => b.id === ageBracket);
    const selectedIntegrations = integrations.filter(i => i.enabled).map(i => i.id);

    // Create userData with realistic mock initial values for dashboard
    const today = new Date().toISOString().split('T')[0];
    const userData = {
      name,
      gender,
      ageBracket,
      integrations: selectedIntegrations,
      dashboardData: selectedIntegrations.length > 0 ? {
        date: today,
        // Manual metrics - initialized with realistic values
        meals: { value: 0.6, status: 'Good' as const, unit: '3 meals today' },
        hydration: { value: 0.6, status: 'Good' as const, unit: '6 glasses' },
        alcohol: { value: 1.0, status: 'Excellent' as const, unit: 'None today' },
        // Device metrics - initialized with realistic values
        steps: { value: 0.52, status: 'Fair' as const, unit: '5,240 steps' },
        outdoorBrightness: { value: 0.6, status: 'Good' as const, unit: 'Moderate' },
        sleep: { value: 0.75, status: 'Good' as const, unit: '7.5 hours' },
        usageAccuracy: { value: 0.85, status: 'Excellent' as const, unit: 'Low typos' },
        screenBrightness: { value: 0.5, status: 'Fair' as const, unit: '75% avg' },
        screenTime: { value: 0.3, status: 'Poor' as const, unit: '8.5 hours' },
        heartRate: { value: 0.8, status: 'Excellent' as const, unit: '68 bpm avg' },
        // External metrics - initialized with realistic values
        calendar: { value: 0.4, status: 'Fair' as const, unit: '8 meetings' },
        weather: { value: 0.6, status: 'Good' as const, unit: 'Stable pressure' },
        hasManualData: false
      } : null
    };

    const backendData = {
      name,
      ageBracket: selectedBracket?.value || 0,
      integrations: selectedIntegrations,
    };

    console.log("Context data (ID):", userData);
    console.log("Backend data (value):", backendData);

    setUserData(userData);
    // TODO: Send backendData  API endpoint
    onComplete();
  }

  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: 'steps',
      name: 'Steps & Exercise',
      description: 'Track daily movement and physical activity',
      iconName: 'walk',
      enabled: true,
      category: 'health',
    },
    {
      id: 'sleep',
      name: 'Sleep Quality',
      description: 'Monitor sleep duration and quality',
      iconName: 'moon',
      enabled: true,
      category: 'health',
    },
    {
      id: 'heart-rate',
      name: 'Heart Rate',
      description: 'Track heart rate from wearable devices',
      iconName: 'heart',
      enabled: true,
      category: 'health',
    },
    {
      id: 'screen-time',
      name: 'Screen Time',
      description: 'Monitor daily device usage',
      iconName: 'time',
      enabled: true,
      category: 'device',
    },
    {
      id: 'screen-brightness',
      name: 'Screen Brightness',
      description: 'Track screen brightness levels',
      iconName: 'eye',
      enabled: true,
      category: 'device',
    },
    {
      id: 'outdoor-brightness',
      name: 'Outdoor Brightness',
      description: 'Detect ambient light exposure',
      iconName: 'sunny',
      enabled: true,
      category: 'device',
    },
    {
      id: 'usage-accuracy',
      name: 'Usage Accuracy',
      description: 'Track device interaction patterns',
      iconName: 'analytics',
      enabled: true,
      category: 'device',
    },
    {
      id: 'calendar',
      name: 'Calendar Integration',
      description: 'Connect Google Calendar, Outlook, etc.',
      iconName: 'calendar',
      enabled: false,
      category: 'external',
    },
    {
      id: 'weather',
      name: 'Weather Data',
      description: 'Track weather and barometric pressure',
      iconName: 'cloud',
      enabled: true,
      category: 'external',
    },
  ]);

  const toggleIntegration = (id: string) => {
    setIntegrations(prev =>
      prev.map(integration =>
        integration.id === id
          ? { ...integration, enabled: !integration.enabled }
          : integration
      )
    );
  };

  const ageBrackets = [
    {
      id: '18-24',
      value: 21
    }, {
      id: '25-34',
      value: 29
    }, {
      id: '35-44',
      value: 39
    }, {
      id: '45-54',
      value: 49
    }, {
      id: '55-64',
      value: 59
    }, {
      id: '65+',
      value: 70
    }
  ];

  const canProceedStep1 = name.trim() && gender && ageBracket;
  const canProceedStep2 = integrations.some(i => i.enabled);

  const { width } = Dimensions.get('window');
  const maxWidth = Math.min(width, 448);

  // Welcome Step
  if (step === 1) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={styles.bgCircle1} />
        <View style={styles.bgCircle2} />
        <View style={styles.bgCircle3} />
        <ScrollView style={styles.step1ScrollView} contentContainerStyle={styles.step1Container} scrollEnabled={false}>
          <View style={[styles.step1Content, { maxWidth }]}>
            {/* Logo/Header */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Ionicons name="pulse" size={40} color="#fff" />
              </View>
              <Text style={styles.title}>Welcome to MyGraine</Text>
              <Text style={styles.subtitle}>
                Your personal companion for migraine prevention and management
              </Text>
            </View>

            {/* Personal Info Form */}
            <View style={styles.formSection}>
              <View style={styles.formCard}>
                <Text style={styles.label}>What should I call you?</Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your name"
                  placeholderTextColor="#94a3b8"
                  style={styles.input}
                />
              </View>

              <View style={styles.formCard}>
                <Text style={styles.label}>Gender</Text>
                <View style={styles.genderContainer}>
                  {['Female', 'Male', 'Other'].map((genderOption) => (
                    <Pressable
                      key={genderOption}
                      onPress={() => setGender(genderOption)}
                      style={[
                        styles.genderButton,
                        gender === genderOption && styles.genderButtonSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.genderText,
                          gender === genderOption && styles.genderTextSelected,
                        ]}
                      >
                        {genderOption}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.formCard}>
                <Text style={styles.label}>Age bracket</Text>
                <View style={styles.ageBracketGrid}>
                  {ageBrackets.map((bracket) => (
                    <Pressable
                      key={bracket.id}
                      onPress={() => setAgeBracket(bracket.id)}
                      style={[
                        styles.ageBracketButton,
                        ageBracket === bracket.value.toString() && styles.ageBracketButtonSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.ageBracketText,
                          ageBracket === bracket.id && styles.ageBracketTextSelected,
                        ]}
                      >
                        {bracket.id}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>

            {/* Progress indicator */}
            <View style={styles.progressContainer}>
              <View style={styles.progressDots}>
                <View style={[styles.progressDot, styles.progressDotActive]} />
                <View style={styles.progressDot} />
                <View style={styles.progressDot} />
              </View>
              <Text style={styles.progressText}>Step 1 of 3</Text>
            </View>

            {/* Continue Button */}
            <Pressable
              onPress={() => setStep(2)}
              disabled={!canProceedStep1}
              style={({ pressed }) => [
                styles.continueButton,
                !canProceedStep1 && styles.continueButtonDisabled,
                pressed && styles.continueButtonPressed,
              ]}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Integrations Step
  if (step === 2) {
    const healthIntegrations = integrations.filter(i => i.category === 'health');
    const deviceIntegrations = integrations.filter(i => i.category === 'device');
    const externalIntegrations = integrations.filter(i => i.category === 'external');

    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={styles.bgCircle1} />
        <View style={styles.bgCircle2} />
        <View style={styles.bgCircle3} />
        {/* Header */}
        <View style={[styles.step2HeaderContent, { maxWidth }]}>
          <Text style={styles.step2Title}>Connect Your Data</Text>
          <Text style={styles.step2Subtitle}>Select integrations to track migraine triggers</Text>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.step2Content}>
          <View style={[styles.step2InnerContent, { maxWidth }]}>
            {/* Health Data */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Health Data</Text>
              <View style={styles.integrationList}>
                {healthIntegrations.map((integration) => (
                  <Pressable
                    key={integration.id}
                    onPress={() => toggleIntegration(integration.id)}
                    style={({ pressed }) => [
                      styles.integrationCard,
                      integration.enabled && styles.integrationCardEnabledHealth,
                      pressed && styles.integrationCardPressed,
                    ]}
                  >
                    <View
                      style={[
                        styles.integrationIconContainer,
                        integration.enabled
                          ? styles.integrationIconContainerEnabledHealth
                          : styles.integrationIconContainerDisabled,
                      ]}
                    >
                      <Ionicons
                        name={integration.iconName}
                        size={20}
                        color={integration.enabled ? '#10b981' : '#64748b'}
                      />
                    </View>
                    <View style={styles.integrationTextContainer}>
                      <Text style={styles.integrationName}>{integration.name}</Text>
                      <Text style={styles.integrationDescription}>{integration.description}</Text>
                    </View>

                  </Pressable>
                ))}
              </View>
            </View>

            {/* Device Sensors */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Device Sensors</Text>
              <View style={styles.integrationList}>
                {deviceIntegrations.map((integration) => (
                  <Pressable
                    key={integration.id}
                    onPress={() => toggleIntegration(integration.id)}
                    style={({ pressed }) => [
                      styles.integrationCard,
                      integration.enabled && styles.integrationCardEnabledDevice,
                      pressed && styles.integrationCardPressed,
                    ]}
                  >
                    <View
                      style={[
                        styles.integrationIconContainer,
                        integration.enabled
                          ? styles.integrationIconContainerEnabledDevice
                          : styles.integrationIconContainerDisabled,
                      ]}
                    >
                      <Ionicons
                        name={integration.iconName}
                        size={20}
                        color={integration.enabled ? '#2563eb' : '#64748b'}
                      />
                    </View>
                    <View style={styles.integrationTextContainer}>
                      <Text style={styles.integrationName}>{integration.name}</Text>
                      <Text style={styles.integrationDescription}>{integration.description}</Text>
                    </View>

                  </Pressable>
                ))}
              </View>
            </View>

            {/* External Sources */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>External Sources</Text>
              <View style={styles.integrationList}>
                {externalIntegrations.map((integration) => (
                  <Pressable
                    key={integration.id}
                    onPress={() => toggleIntegration(integration.id)}
                    style={({ pressed }) => [
                      styles.integrationCard,
                      integration.enabled && styles.integrationCardEnabledExternal,
                      pressed && styles.integrationCardPressed,
                    ]}
                  >
                    <View
                      style={[
                        styles.integrationIconContainer,
                        integration.enabled
                          ? styles.integrationIconContainerEnabledExternal
                          : styles.integrationIconContainerDisabled,
                      ]}
                    >
                      <Ionicons
                        name={integration.iconName}
                        size={20}
                        color={integration.enabled ? '#9333ea' : '#64748b'}
                      />
                    </View>
                    <View style={styles.integrationTextContainer}>
                      <Text style={styles.integrationName}>{integration.name}</Text>
                      <Text style={styles.integrationDescription}>{integration.description}</Text>
                    </View>

                  </Pressable>
                ))}
              </View>
            </View>

            {/* Info box */}
            <View style={styles.infoBox}>
              <Text style={styles.infoBoxText}>
                You can change these settings anytime in the app. More integrations mean better pattern detection.
              </Text>
            </View>

            {/* Progress indicator */}
            <View style={styles.progressContainer}>
              <View style={styles.progressDots}>
                <View style={styles.progressDot} />
                <View style={[styles.progressDot, styles.progressDotActive]} />
                <View style={styles.progressDot} />
              </View>
              <Text style={styles.progressText}>Step 2 of 3</Text>
            </View>

            {/* Continue Button */}
            <Pressable
              onPress={() => setStep(3)}
              disabled={!canProceedStep2}
              style={({ pressed }) => [
                styles.continueButton,
                !canProceedStep2 && styles.continueButtonDisabled,
                pressed && styles.continueButtonPressed,
              ]}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Completion Step
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />
      <View style={styles.bgCircle3} />
      <ScrollView style={styles.step3ScrollView} contentContainerStyle={styles.step3Container}>
        <View style={[styles.step3Content, { maxWidth }]}>        {/* Success Icon */}
          <View style={styles.successIconContainer}>
            <Ionicons name="checkmark" size={48} color="#fff" />
          </View>

          {/* Message */}
          <Text style={styles.step3Title}>You're All Set, {name}!</Text>
          <Text style={styles.step3Subtitle}>
            MyGraine is now configured and ready to help you track and prevent migraines.
          </Text>

          {/* Summary */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Age</Text>
                <Text style={styles.summaryValue}>{ageBracket}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Data sources</Text>
                <Text style={styles.summaryValue}>
                  {integrations.filter(i => i.enabled).length} active
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Status</Text>
                <Text style={[styles.summaryValue, styles.summaryValueReady]}>Ready</Text>
              </View>
            </View>
          </View>

          {/* Progress indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressDots}>
              <View style={styles.progressDot} />
              <View style={styles.progressDot} />
              <View style={[styles.progressDot, styles.progressDotActive, styles.progressDotActiveEmerald]} />
            </View>
            <Text style={styles.progressText}>Step 3 of 3</Text>
          </View>

          {/* Get Started Button */}
          <Pressable
            onPress={submitData}
            style={({ pressed }) => [
              styles.getStartedButton,
              pressed && styles.getStartedButtonPressed,
            ]}
          >
            <Text style={styles.getStartedButtonText}>Get Started</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a0b2e',
    overflow: 'hidden',
  },
  bgCircle1: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(159, 122, 234, 0.2)',
    top: -80,
    right: -100,
  },
  bgCircle2: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(128, 90, 213, 0.15)',
    bottom: -40,
    left: -70,
  },
  bgCircle3: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(107, 70, 193, 0.1)',
    top: '35%',
    left: '22%',
  },
  step1ScrollView: {
    flex: 1,
    width: '100%',
  },
  step3ScrollView: {
    flex: 1,
    width: '100%',
  },
  // Step 1 styles
  step1Container: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  step1Content: {
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 22,
  },
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#7c3aed',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 24,
  },
  formSection: {
    gap: 16,

  },
  formCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  label: {
    fontSize: 20,
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    fontSize: 16,
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  ageBracketGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,

  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#c4b5fd',
    backgroundColor: 'rgba(167,139,250,0.2)',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  genderButtonSelected: {
    borderColor: '#8b5cf6',
    backgroundColor: '#d8b4fe',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  genderText: {
    fontSize: 16,
    color: '#f3e8ff',
    textAlign: 'center',
  },
  genderTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  ageBracketButton: {
    flex: 1,
    minWidth: '30%',
    paddingVertical: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#c4b5fd',
    backgroundColor: 'rgba(167,139,250,0.2)',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,

  },
  ageBracketButtonSelected: {
    borderColor: '#8b5cf6',
    backgroundColor: '#d8b4fe',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  ageBracketText: {
    fontSize: 20,
    color: '#f5f3ff',
    textAlign: 'center',

  },
  ageBracketTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  progressContainer: {
    marginTop: 32,
    marginBottom: 16,
  },
  progressDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#c4dbd2',
  },
  progressDotActive: {
    backgroundColor: '#8b5cf6',
  },
  progressDotActiveEmerald: {
    backgroundColor: '#8b5cf6',
  },
  progressText: {
    textAlign: 'center',
    color: '#f5f3ff',
    fontSize: 12,
    marginTop: 8,
  },
  continueButton: {
    width: '100%',
    backgroundColor: '#8b5cf6',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonPressed: {
    opacity: 0.9,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Step 2 styles
  step2HeaderContent: {
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  step2Title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  step2Subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
  },
  scrollView: {
    flex: 1,
  },
  step2Content: {
    paddingBottom: 24,
  },
  step2InnerContent: {
    width: '100%',
    alignSelf: 'center',
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  integrationList: {
    gap: 8,
  },
  integrationCard: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  integrationCardEnabledHealth: {
    borderColor: '#8b5cf6',
    backgroundColor: '#7c3aed',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  integrationCardEnabledDevice: {
    borderColor: '#8b5cf6',
    backgroundColor: '#c4b5fd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  integrationCardEnabledExternal: {
    borderColor: '#8b5cf6',
    backgroundColor: '#c4b5fd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  integrationCardPressed: {
    opacity: 0.85,
  },
  integrationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  integrationIconContainerEnabledHealth: {
    backgroundColor: '#7c3aed',
  },
  integrationIconContainerEnabledDevice: {
    backgroundColor: '#7c3aed',
  },
  integrationIconContainerEnabledExternal: {
    backgroundColor: '#8b5cf6',
  },
  integrationIconContainerDisabled: {
    backgroundColor: '#7c3aed',
  },
  integrationTextContainer: {
    flex: 1,
  },
  integrationName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 4,
  },
  integrationDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
  },
  checkmarkContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkContainerBlue: {
    backgroundColor: '#8b5cf6',
  },
  checkmarkContainerPurple: {
    backgroundColor: '#8b5cf6',
  },
  infoBox: {
    backgroundColor: 'rgba(128, 90, 213, 0.1)',
    borderWidth: 1,
    borderColor: '#8b5cf6',
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
  },
  infoBoxText: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
  },
  // Step 3 styles
  step3Container: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#1a0b2e',
  },
  step3Content: {
    width: '100%',
    alignSelf: 'center',
    alignItems: 'center',
  },
  successIconContainer: {
    width: 96,
    height: 96,
    backgroundColor: '#8b5cf6',
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 5,
  },
  step3Title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  step3Subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  summaryCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
    padding: 24,
    marginBottom: 32,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  summaryValueReady: {
    color: '#d8b4fe',
  },
  getStartedButton: {
    width: '100%',
    backgroundColor: '#8b5cf6',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  getStartedButtonPressed: {
    opacity: 0.9,
  },
  getStartedButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
