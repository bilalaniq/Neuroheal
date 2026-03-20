
export const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? 'http://localhost:8080';     // because i am using wsl so use hostname -l to get the ip address of wsl and use that ip address here 

export const API_ENDPOINTS = {
  health: '/health',
  models: '/models/status',
  symptomType: '/predict/symptom-type',
  migraineToday: '/predict/migraine-today',
  sleep: '/predict/sleep',
  fullAssessment: '/predict/full',
  migraineEpisodes: '/migraine-episodes',
  steps: '/health/steps',
  fitSleep: '/health/sleep',
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
  saveData: '/save_data',
  accumulate: '/accumulate',
  update: '/update',
  updateSingle: '/update_single',
  clearSession: '/clear_session',
  sessionInfo: '/session_info',
  analytics: (userId: string) => `/analytics/${userId}`,
  metrics: '/metrics',
  chat: '/chat',
} as const;

export const API_TIMEOUT = 30000;

export const API_HEADERS = {
  'Content-Type': 'application/json',
} as const;

export const logAPI = (type: 'request' | 'response' | 'error', endpoint: string, data?: any) => {
  console.log(`[API ${type}]`, {
    url: `${API_BASE_URL}${endpoint}`,
    timestamp: new Date().toISOString(),
    ...(data && { data })
  });
};