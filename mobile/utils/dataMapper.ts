/**
 * Data Mapper Utility
 * Maps frontend UserContext data to backend API format
 */

import { MigraineFeatures, IntegrationData, SaveDataRequest } from '@/services/migraineApi';

interface DashboardMetric {
  value: number;
  status: string;
  unit: string;
}

interface DashboardData {
  date: string;
  meals: DashboardMetric;
  hydration: DashboardMetric;
  alcohol: DashboardMetric;
  steps: DashboardMetric;
  outdoorBrightness: DashboardMetric;
  sleep: DashboardMetric;
  usageAccuracy: DashboardMetric;
  screenBrightness: DashboardMetric;
  screenTime: DashboardMetric;
  heartRate: DashboardMetric;
  calendar: DashboardMetric;
  weather: DashboardMetric;
  hasManualData: boolean;
}

interface UserData {
  name: string;
  ageBracket: string;
  integrations: string[];
  dashboardData: DashboardData | null;
}

/**
 * Map frontend symptoms to backend medical features
 */
export function mapSymptomsToFeatures(
  intensity: number,
  selectedSymptoms: string[],
  duration: string,
  age: number = 30 // Default if not provided
): MigraineFeatures {
  // Helper to check if symptom is selected
  const hasSymptom = (symptom: string) => selectedSymptoms.includes(symptom);

  // Map duration to numeric value (0-3 scale)
  const durationValue = mapDurationToValue(duration);

  // Map intensity (1-5 from UI to 0-3 for backend)
  const intensityValue = Math.min(3, Math.max(0, Math.ceil((intensity / 5) * 3)));

  // Estimate frequency based on typical patterns (could be enhanced with historical data)
  const frequency = 5; // Default moderate frequency

  return {
    age,
    duration: durationValue,
    frequency,
    location: hasSymptom('Neck pain') ? 0 : 1, // 0 = unilateral, 1 = bilateral
    character: 1, // Assuming pulsating (most common)
    intensity: intensityValue,
    nausea: hasSymptom('Nausea') ? 1 : 0,
    vomit: hasSymptom('Vomiting') ? 1 : 0,
    phonophobia: hasSymptom('Sound sensitivity') ? 1 : 0,
    photophobia: hasSymptom('Light sensitivity') ? 1 : 0,
    visual: hasSymptom('Visual disturbances') || hasSymptom('Aura') ? 1 : 0,
    sensory: hasSymptom('Aura') ? 1 : 0,
    dysphasia: 0, // Not collected in UI
    dysarthria: 0, // Not collected in UI
    vertigo: hasSymptom('Dizziness') ? 1 : 0,
    tinnitus: 0, // Not collected in UI
    hypoacusis: 0, // Not collected in UI
    diplopia: 0, // Not collected in UI
    defect: 0, // Not collected in UI
    ataxia: 0, // Not collected in UI
    conscience: 0, // Not collected in UI
    paresthesia: 0, // Not collected in UI
    dpf: 0, // Default, could be enhanced with family history
  };
}

/**
 * Map duration string to numeric value (0-3 scale)
 */
function mapDurationToValue(duration: string): number {
  if (duration.includes('< 1')) return 0;
  if (duration.includes('1-2') || duration.includes('2-4')) return 1;
  if (duration.includes('4-8') || duration.includes('8-24')) return 2;
  if (duration.includes('> 24')) return 3;
  return 1; // Default
}

/**
 * Extract sleep hours from dashboard data
 */
function extractSleepHours(dashboardData: DashboardData | null): number | undefined {
  if (!dashboardData?.sleep) return undefined;

  // Parse "7.5 hours" from unit
  const match = dashboardData.sleep.unit.match(/(\d+\.?\d*)\s*hours?/i);
  return match ? parseFloat(match[1]) : undefined;
}

/**
 * Extract alcohol units from dashboard data
 */
function extractAlcoholUnits(dashboardData: DashboardData | null): number | undefined {
  if (!dashboardData?.alcohol) return undefined;

  // If it says "None today", return 0
  if (dashboardData.alcohol.unit.toLowerCase().includes('none')) {
    return 0;
  }

  // Otherwise parse the number from the unit
  const match = dashboardData.alcohol.unit.match(/(\d+\.?\d*)/);
  return match ? parseFloat(match[1]) : undefined;
}

/**
 * Map dashboard data to integration data for backend
 */
export function mapDashboardToIntegrations(dashboardData: DashboardData | null): IntegrationData {
  if (!dashboardData) return {};

  const integrations: IntegrationData = {};

  // Sleep hours
  const sleepHours = extractSleepHours(dashboardData);
  if (sleepHours !== undefined) {
    integrations.sleep_hours = sleepHours;
  }

  // Alcohol
  const alcoholUnits = extractAlcoholUnits(dashboardData);
  if (alcoholUnits !== undefined) {
    integrations.alcohol_units = alcoholUnits;
    // Estimate hours ago (assuming evening consumption)
    integrations.alcohol_hours_ago = alcoholUnits > 0 ? 8 : undefined;
  }

  // Stress level (derived from screen time, meetings, etc.)
  if (dashboardData.calendar && dashboardData.screenTime) {
    // Higher meetings + higher screen time = higher stress
    const meetingStress = 1 - dashboardData.calendar.value; // More meetings = higher stress
    const screenStress = 1 - dashboardData.screenTime.value; // More screen time = higher stress
    integrations.stress_level = Math.round((meetingStress + screenStress) / 2 * 10); // 0-10 scale
  }

  // Weather (if available)
  if (dashboardData.weather) {
    // Parse pressure if available in unit
    const pressureMatch = dashboardData.weather.unit.match(/(\d+\.?\d*)\s*mbar/i);
    if (pressureMatch) {
      integrations.weather_pressure = parseFloat(pressureMatch[1]);
    }
  }

  return integrations;
}

/**
 * Map age bracket to numeric age (use midpoint of range)
 */
export function mapAgeBracketToAge(ageBracket: string): number {
  const ageMap: Record<string, number> = {
    '18-24': 21,
    '25-34': 30,
    '35-44': 40,
    '45-54': 50,
    '55-64': 60,
    '65+': 70,
  };

  return ageMap[ageBracket] || 30; // Default to 30 if unknown
}

/**
 * Create a complete SaveDataRequest from user context and migraine log data
 */
export function createSaveDataRequest(
  userData: UserData,
  migraineData: {
    intensity: number;
    selectedSymptoms: string[];
    duration: string;
  },
  prediction?: {
    prediction: string;
    confidence: number;
    all_probabilities: Record<string, number>;
  }
): SaveDataRequest {
  const age = mapAgeBracketToAge(userData.ageBracket);
  const features = mapSymptomsToFeatures(
    migraineData.intensity,
    migraineData.selectedSymptoms,
    migraineData.duration,
    age
  );

  const integrations = mapDashboardToIntegrations(userData.dashboardData);

  // Generate a session ID (could be enhanced with actual session tracking)
  const sessionId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

  return {
    user_id: userData.name.toLowerCase().replace(/\s+/g, '_'), // Convert name to user_id
    name: userData.name,
    age_bracket: userData.ageBracket,
    session_id: sessionId,
    prediction: prediction?.prediction,
    confidence: prediction?.confidence,
    all_probabilities: prediction?.all_probabilities,
    features,
    integrations,
    integrations_enabled: userData.integrations,
  };
}

/**
 * Quick helper to get just the features for prediction
 */
export function getFeaturesForPrediction(
  userData: UserData,
  migraineData: {
    intensity: number;
    selectedSymptoms: string[];
    duration: string;
  }
): MigraineFeatures {
  const age = mapAgeBracketToAge(userData.ageBracket);
  return mapSymptomsToFeatures(
    migraineData.intensity,
    migraineData.selectedSymptoms,
    migraineData.duration,
    age
  );
}
