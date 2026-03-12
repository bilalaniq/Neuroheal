// services/aiService.ts
// Groq API - Llama 3.3 70B - Migraine Health Assistant
// Get your FREE API key at: https://console.groq.com (no credit card required)

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const MIGRAINE_SYSTEM_PROMPT = `You are NeuroHeal AI, a specialized migraine and headache health assistant.

YOUR ROLE:
- You ONLY answer questions related to migraines, headaches, and directly related topics.
- Related topics include: migraine triggers, symptoms, treatments, medications, prevention, diet as it relates to migraines, sleep and migraines, stress management for migraines, weather effects on migraines, and when to see a neurologist.

STRICT RULES:
1. If a user asks ANYTHING unrelated to migraines or headaches, respond ONLY with:
   "I'm specialized in migraine and headache health only. I can't help with that, but I'm happy to answer any migraine-related questions!"
2. NEVER provide emergency medical diagnoses. If symptoms sound severe (worst headache of life, sudden onset, neurological symptoms), always advise seeking emergency care immediately.
3. Always recommend consulting a healthcare professional for personalized medical advice.
4. Be empathetic — migraine sufferers deal with real pain and disruption to daily life.
5. Keep responses clear, structured, and easy to read. Use bullet points where helpful.
6. Never recommend specific dosages of medications. Refer to a doctor or pharmacist.
7. Do NOT answer questions about other diseases, coding, weather, news, math, or any non-migraine topic.

TONE:
- Warm, caring, and supportive
- Clear and easy to understand (avoid heavy medical jargon)
- Concise but thorough

You are not a replacement for a doctor. Always remind users to consult healthcare professionals for diagnosis and treatment plans.`;

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

/**
 * Get AI response from Groq (Llama 3.3 70B) - 100% Free, no billing required
 * @param userMessage - The user's message
 * @param conversationHistory - Previous messages for multi-turn memory
 * @returns AI response text
 */
export async function getAIResponse(
    userMessage: string,
    conversationHistory: ChatMessage[] = []
): Promise<string> {
    if (!GROQ_API_KEY) {
        throw new Error(
            'Groq API key not found. Please add EXPO_PUBLIC_GROQ_API_KEY to your .env file.\nGet your free key at: https://console.groq.com'
        );
    }

    const messages = [
        { role: 'system', content: MIGRAINE_SYSTEM_PROMPT },
        ...conversationHistory,
        { role: 'user', content: userMessage },
    ];

    const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages,
            temperature: 0.7,
            max_tokens: 1024,
            top_p: 0.95,
            stream: false,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
            `Groq API error: ${errorData?.error?.message || response.statusText}`
        );
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;

    if (!text) {
        throw new Error('No response received from Groq.');
    }

    return text.trim();
}