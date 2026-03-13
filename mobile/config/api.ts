/**
 * API Configuration
 * Central configuration for backend API endpoints
 */

// ⚠️  IMPORTANT: Change this to your machine's local IP when running on a
//     physical device or Android emulator (localhost won't work there).
//
//     Find your IP:  Windows → ipconfig   |   Mac/Linux → ifconfig
//
//     Examples:
//       Android emulator  → 'http://10.0.2.2:8080'
//       Physical device   → 'http://192.168.1.XXX:8080'
//       Web browser / iOS simulator → 'http://localhost:8080'  ✅
export const API_BASE_URL = 'http://localhost:8080';

// API endpoints - Updated to match your FastAPI backend exactly
export const API_ENDPOINTS = {
  // Health check
  health: '/health',
  models: '/models/status',

  // Model 1: Symptom Classification (Detailed Classify)
  symptomType: '/predict/symptom-type',

  // Model 2: Daily Migraine Prediction (Morning Check)
  migraineToday: '/predict/migraine-today',

  // Model 3: Sleep Assessment (Sleep Log)
  sleep: '/predict/sleep',

  // Combined assessment (all models)
  fullAssessment: '/predict/full',

  // Episode logging (Quick Log)
  migraineEpisodes: '/migraine-episodes',

  // Google Fit endpoints
  steps: '/health/steps',
  fitSleep: '/health/sleep',   // ← renamed: was 'sleep' — conflicted with /predict/sleep below
  heartRate: '/health/heart-rate',
  bloodPressure: '/health/blood-pressure',
  weight: '/health/weight',
  allHealth: '/health/all',
  calories: '/health/calories',
  distance: '/health/distance',
  activeMinutes: '/health/active-minutes',
  moveMinutes: '/health/move-minutes',
  speed: '/health/speed',
  hydration: '/health/hydration',
  nutrition: '/health/nutrition',
  oxygenSaturation: '/health/oxygen-saturation',
  bodyTemperature: '/health/body-temperature',
  height: '/health/height',
  power: '/health/power',
  fullHealth: '/health/full',
  debug: '/health/debug',
  today: '/health/today',
  sleepFromFit: '/predict/sleep-from-fit',

  // Data management (from your original config)
  saveData: '/save_data',
  accumulate: '/accumulate',
  update: '/update',
  updateSingle: '/update_single',
  clearSession: '/clear_session',
  sessionInfo: '/session_info',

  // Analytics
  analytics: (userId: string) => `/analytics/${userId}`,

  // Metrics
  metrics: '/metrics',

  // Chat
  chat: '/chat',
} as const;

// API timeout in milliseconds
export const API_TIMEOUT = 30000; // 30 seconds

// Request headers
export const API_HEADERS = {
  'Content-Type': 'application/json',
} as const;

// Helper function to log API calls
export const logAPI = (type: 'request' | 'response' | 'error', endpoint: string, data?: any) => {
  console.log(`[API ${type}]`, {
    url: `${API_BASE_URL}${endpoint}`,
    timestamp: new Date().toISOString(),
    ...(data && { data })
  });
};