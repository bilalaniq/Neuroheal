/**
 * Migraine API Service
 * Handles all API requests to the backend
 */

import { API_BASE_URL, API_ENDPOINTS, API_HEADERS, API_TIMEOUT } from '@/config/api';

// Types for API requests and responses
export interface MigraineFeatures {
  age: number;
  duration: number;
  frequency: number;
  location: number;
  character: number;
  intensity: number;
  nausea: number;
  vomit: number;
  phonophobia: number;
  photophobia: number;
  visual: number;
  sensory: number;
  dysphasia: number;
  dysarthria: number;
  vertigo: number;
  tinnitus: number;
  hypoacusis: number;
  diplopia: number;
  defect: number;
  ataxia: number;
  conscience: number;
  paresthesia: number;
  dpf: number;
}

export interface PredictionResponse {
  prediction: string;
  confidence: number;
  all_probabilities: Record<string, number>;
  timestamp: string;
}

export interface IntegrationData {
  sleep_hours?: number;
  alcohol_units?: number;
  alcohol_hours_ago?: number;
  stress_level?: number;
  weather_pressure?: number;
  weather_temp?: number;
}

export interface SaveDataRequest {
  user_id: string;
  name: string;
  age_bracket: string;
  session_id: string;
  prediction?: string;
  confidence?: number;
  all_probabilities?: Record<string, number>;
  features: MigraineFeatures;
  integrations?: IntegrationData;
  integrations_enabled?: string[];
}

export interface AnalyticsResponse {
  user_id: string;
  days_analyzed: number;
  summary: {
    total_migraines: number;
    total_records: number;
    migraine_rate: number;
  };
  sleep_chart: any;
  alcohol_chart: any;
  time_patterns_chart: any;
  timeline_chart: any;
  raw_data: any;
}

export interface ChatRequest {
  message: string;
  system_prompt?: string;
}

export interface ChatResponse {
  response: string;
  timestamp: string;
}

/**
 * Make a prediction based on migraine features
 */
export async function predict(features: MigraineFeatures): Promise<PredictionResponse> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.predict}`, {
      method: 'POST',
      headers: API_HEADERS,
      body: JSON.stringify(features),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data: PredictionResponse = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - please try again');
      }
      throw new Error(`Prediction failed: ${error.message}`);
    }
    throw new Error('Prediction failed: Unknown error');
  }
}

/**
 * Save prediction data to BigQuery
 */
export async function saveData(data: SaveDataRequest): Promise<{ status: string; message: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.saveData}`, {
      method: 'POST',
      headers: API_HEADERS,
      body: JSON.stringify(data),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - please try again');
      }
      throw new Error(`Save failed: ${error.message}`);
    }
    throw new Error('Save failed: Unknown error');
  }
}

/**
 * Get analytics data for a user
 */
export async function getAnalytics(userId: string, days: number = 30): Promise<AnalyticsResponse> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    const response = await fetch(
      `${API_BASE_URL}${API_ENDPOINTS.analytics(userId)}?days=${days}`,
      {
        method: 'GET',
        headers: API_HEADERS,
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - please try again');
      }
      throw new Error(`Analytics fetch failed: ${error.message}`);
    }
    throw new Error('Analytics fetch failed: Unknown error');
  }
}

/**
 * Chat with Gemini AI
 */
export async function chat(request: ChatRequest): Promise<ChatResponse> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.chat}`, {
      method: 'POST',
      headers: API_HEADERS,
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - please try again');
      }
      throw new Error(`Chat failed: ${error.message}`);
    }
    throw new Error('Chat failed: Unknown error');
  }
}

/**
 * Check backend health
 */
export async function healthCheck(): Promise<{ status: string; model_loaded: boolean; version: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // Shorter timeout for health check

    const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.health}`, {
      method: 'GET',
      headers: API_HEADERS,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Health check failed: ${error.message}`);
    }
    throw new Error('Health check failed: Unknown error');
  }
}
