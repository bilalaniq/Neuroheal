/**
 * Gemini AI Service
 * Helper functions for generating AI-powered insights using Gemini
 */

import { chat } from './migraineApi';

/**
 * Generate personalized migraine insights after logging
 */
export async function generateMigraineInsights(
  symptoms: string[],
  intensity: number,
  duration: string,
  prediction: string,
  confidence: number,
  dashboardData: any
): Promise<string> {
  const systemPrompt = `You are a helpful migraine assistant. Provide brief, actionable insights based on the user's migraine log. Keep response under 100 words and be empathetic. Focus on immediate relief and prevention strategies. Only respond with the insights and nothing else.
  
  `;

  const userMessage = `I just logged a migraine:
- Symptoms: ${symptoms.join(', ')}
- Pain intensity: ${intensity}/5
- Duration: ${duration}
- AI predicted: ${prediction} (${Math.round(confidence * 100)}% confident)

Today's complete health profile:

Manual Tracking:
- Meals: ${dashboardData?.meals?.unit || 'Unknown'} (${dashboardData?.meals?.status || 'Unknown'})
- Hydration: ${dashboardData?.hydration?.unit || 'Unknown'} (${dashboardData?.hydration?.status || 'Unknown'})
- Alcohol: ${dashboardData?.alcohol?.unit || 'Unknown'} (${dashboardData?.alcohol?.status || 'Unknown'})

Device Metrics:
- Steps: ${dashboardData?.steps?.unit || 'Unknown'} (${dashboardData?.steps?.status || 'Unknown'})
- Sleep Quality: ${dashboardData?.sleep?.unit || 'Unknown'} (${dashboardData?.sleep?.status || 'Unknown'})
- Screen Time: ${dashboardData?.screenTime?.unit || 'Unknown'} (${dashboardData?.screenTime?.status || 'Unknown'})
- Screen Brightness: ${dashboardData?.screenBrightness?.unit || 'Unknown'} (${dashboardData?.screenBrightness?.status || 'Unknown'})
- Outdoor Brightness: ${dashboardData?.outdoorBrightness?.unit || 'Unknown'} (${dashboardData?.outdoorBrightness?.status || 'Unknown'})
- Usage Accuracy: ${dashboardData?.usageAccuracy?.unit || 'Unknown'} (${dashboardData?.usageAccuracy?.status || 'Unknown'})
- Heart Rate: ${dashboardData?.heartRate?.unit || 'Unknown'} (${dashboardData?.heartRate?.status || 'Unknown'})

External Sources:
- Calendar Stress: ${dashboardData?.calendar?.unit || 'Unknown'} (${dashboardData?.calendar?.status || 'Unknown'})
- Weather Conditions: ${dashboardData?.weather?.unit || 'Unknown'} (${dashboardData?.weather?.status || 'Unknown'})

Analyze these comprehensive metrics and give me 2-3 brief, personalized tips based on what might have contributed to this migraine and how to prevent the next one. Do not add bolding to the text. Return the tips in a list format with a line break between each item.`;

  const response = await chat({ message: userMessage, system_prompt: systemPrompt });
  return response.response;
}

/**
 * Generate dashboard health insights
 */
export async function generateDashboardInsights(dashboardData: any): Promise<string> {
  const systemPrompt = `You are a health insights assistant. Analyze the user's daily health metrics and provide 2-3 key insights or recommendations. Keep response under 120 words. Focus on migraine prevention. Only show the ingsihts and nothing else. Do not add bolding. Give the insights in a list format with a line break between each item. `;

  const userMessage = `Here are my health metrics for today:
- Sleep: ${dashboardData?.sleep?.unit || 'Unknown'} (${dashboardData?.sleep?.status || 'Unknown'})
- Hydration: ${dashboardData?.hydration?.unit || 'Unknown'} (${dashboardData?.hydration?.status || 'Unknown'})
- Meals: ${dashboardData?.meals?.unit || 'Unknown'} (${dashboardData?.meals?.status || 'Unknown'})
- Alcohol: ${dashboardData?.alcohol?.unit || 'Unknown'} (${dashboardData?.alcohol?.status || 'Unknown'})
- Steps: ${dashboardData?.steps?.unit || 'Unknown'} (${dashboardData?.steps?.status || 'Unknown'})
- Screen time: ${dashboardData?.screenTime?.unit || 'Unknown'} (${dashboardData?.screenTime?.status || 'Unknown'})
- Heart rate: ${dashboardData?.heartRate?.unit || 'Unknown'} (${dashboardData?.heartRate?.status || 'Unknown'})
- Meetings: ${dashboardData?.calendar?.unit || 'Unknown'}

What patterns do you see? What should I focus on to prevent migraines?`;

  const response = await chat({ message: userMessage, system_prompt: systemPrompt });
  return response.response;
}

/**
 * Generate personalized emergency tips based on current symptoms
 */
export async function generateEmergencyTips(
  currentSymptoms: string[],
  userHistory?: {
    commonTriggers?: string[];
    effectiveRemedies?: string[];
    ageBracket?: string;
  }
): Promise<{ title: string; description: string }[]> {
  const systemPrompt = `You are a migraine emergency assistant. Generate 3-4 specific, actionable tips for immediate relief. Return ONLY a JSON array of objects with 'title' and 'description' fields. Each description should be 1-2 sentences. Be practical and evidence-based.`;

  const userMessage = `Current symptoms: ${currentSymptoms.join(', ')}
${userHistory?.commonTriggers ? `Known triggers: ${userHistory.commonTriggers.join(', ')}` : ''}
${userHistory?.effectiveRemedies ? `Previously effective: ${userHistory.effectiveRemedies.join(', ')}` : ''}
${userHistory?.ageBracket ? `Age group: ${userHistory.ageBracket}` : ''}

Generate 3-4 immediate relief tips as a JSON array.`;

  const response = await chat({ message: userMessage, system_prompt: systemPrompt });

  try {
    // Try to parse JSON response
    const jsonMatch = response.response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Failed to parse Gemini response as JSON:', e);
  }

  // Fallback: return default tips
  return [
    {
      title: 'Rest in darkness',
      description: 'Find a quiet, dark room and lie down. Minimize light and sound exposure.'
    },
    {
      title: 'Hydrate',
      description: 'Drink water slowly. Dehydration often worsens migraine symptoms.'
    },
    {
      title: 'Cold compress',
      description: 'Apply a cold compress to your forehead or neck for 15-minute intervals.'
    }
  ];
}

/**
 * Analyze patterns and generate insights
 */
export async function analyzePatterns(
  migraineHistory: {
    date: string;
    symptoms: string[];
    intensity: number;
    triggers?: string[];
  }[],
  dashboardHistory: any[]
): Promise<{
  type: 'positive' | 'negative' | 'warning' | 'insight';
  title: string;
  description: string;
  confidence: number;
}[]> {
  const systemPrompt = `You are a migraine pattern analysis assistant. Analyze the data and identify 2-3 key patterns or insights. Return ONLY a JSON array of objects with fields: type ('positive', 'negative', 'warning', or 'insight'), title (short), description (1-2 sentences), and confidence (0-100). Focus on actionable patterns.`;

  const userMessage = `Analyze my migraine patterns:

Recent migraines (last 30 days):
${migraineHistory.slice(0, 10).map(m => `- ${m.date}: ${m.symptoms.join(', ')}, intensity ${m.intensity}/5${m.triggers ? `, triggers: ${m.triggers.join(', ')}` : ''}`).join('\n')}

Health trends:
- Average sleep: ${dashboardHistory.length > 0 ? 'varies' : 'insufficient data'}
- Hydration patterns: ${dashboardHistory.length > 0 ? 'tracked' : 'insufficient data'}
- Screen time: ${dashboardHistory.length > 0 ? 'tracked' : 'insufficient data'}

Identify 2-3 key patterns as a JSON array.`;

  const response = await chat({ message: userMessage, system_prompt: systemPrompt });

  try {
    const jsonMatch = response.response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Failed to parse pattern analysis:', e);
  }

  // Fallback patterns
  return [
    {
      type: 'insight',
      title: 'Pattern analysis in progress',
      description: 'Continue logging your migraines to help AI detect meaningful patterns.',
      confidence: 50
    }
  ];
}

/**
 * Generate personalized recommendations based on analytics
 */
export async function generateRecommendations(
  analyticsData: any,
  userId: string
): Promise<string> {
  const systemPrompt = `You are a migraine prevention advisor. Based on the user's analytics, provide 3-4 specific, actionable recommendations. Keep under 150 words. Be encouraging and practical.`;

  const userMessage = `My migraine analytics (last 30 days):
- Total migraines: ${analyticsData?.summary?.total_migraines || 0}
- Migraine rate: ${analyticsData?.summary?.migraine_rate || 0}%

Sleep correlation:
- With migraine: ${analyticsData?.raw_data?.sleep_correlation?.with_migraine || 'N/A'} hours
- Without migraine: ${analyticsData?.raw_data?.sleep_correlation?.without_migraine || 'N/A'} hours

Alcohol correlation:
- With migraine: ${analyticsData?.raw_data?.alcohol_correlation?.with_migraine || 'N/A'} units
- Without migraine: ${analyticsData?.raw_data?.alcohol_correlation?.without_migraine || 'N/A'} units

Time patterns: ${JSON.stringify(analyticsData?.raw_data?.time_patterns || {})}

What specific changes should I make to reduce migraines?`;

  const response = await chat({ message: userMessage, system_prompt: systemPrompt });
  return response.response;
}

/**
 * Quick helper to get a brief health tip
 */
export async function getQuickHealthTip(dashboardData: any): Promise<string> {
  const systemPrompt = `You are a helpful health assistant. Give ONE brief, actionable health tip based on the user's current metrics. Keep it under 30 words and friendly.`;

  const metrics = [
    `Sleep: ${dashboardData?.sleep?.status || 'Unknown'}`,
    `Hydration: ${dashboardData?.hydration?.status || 'Unknown'}`,
    `Screen time: ${dashboardData?.screenTime?.status || 'Unknown'}`,
  ].join(', ');

  const response = await chat({
    message: `Current status: ${metrics}. Give me one quick tip for today.`,
    system_prompt: systemPrompt
  });

  return response.response;
}
