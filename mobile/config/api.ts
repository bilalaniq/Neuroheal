/**
 * API Configuration
 * Central configuration for backend API endpoints
 */

// Backend API base URL
export const API_BASE_URL = 'http://localhost:8080';

// API endpoints
export const API_ENDPOINTS = {
  // Health check
  health: '/health',

  // Prediction endpoints
  predict: '/predict',

  // Data management
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
