/**
 * AI Chat Service
 * Easily swap between different AI providers
 * 
 * Currently: Mock responses (simulated)
 * To use: Replace the mock logic below with your chosen API
 */

interface AIMessage {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
}

// ============================================
// OPTION 1: Google Gemini API (Recommended)
// ============================================
// Install: npm install @google/generative-ai
// Get API key: https://aistudio.google.com/app/apikey
/*
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GOOGLE_API_KEY);

export async function getAIResponse(userMessage: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  const chat = model.startChat({
    history: [],
    generationConfig: {
      maxOutputTokens: 1024,
      temperature: 0.7,
    },
  });
  
  const result = await chat.sendMessage(userMessage);
  const response = await result.response;
  return response.text();
}
*/

// ============================================
// OPTION 2: OpenAI GPT-4
// ============================================
// Install: npm install openai
// Get API key: https://platform.openai.com/api-keys
/*
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
});

export async function getAIResponse(userMessage: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "You are a helpful health assistant specializing in migraine tracking and management. Provide supportive, non-medical advice."
      },
      {
        role: "user",
        content: userMessage
      }
    ],
    temperature: 0.7,
    max_tokens: 500,
  });
  
  return response.choices[0].message.content || "I couldn't generate a response.";
}
*/

// ============================================
// OPTION 3: Claude API (Anthropic)
// ============================================
// Install: npm install @anthropic-ai/sdk
// Get API key: https://console.anthropic.com/
/*
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.EXPO_PUBLIC_CLAUDE_API_KEY,
});

export async function getAIResponse(userMessage: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-3-sonnet-20240229",
    max_tokens: 1024,
    system: "You are a helpful health assistant specializing in migraine tracking and management. Provide supportive, non-medical advice.",
    messages: [
      {
        role: "user",
        content: userMessage
      }
    ]
  });
  
  return response.content[0].type === 'text' ? response.content[0].text : "I couldn't generate a response.";
}
*/

// ============================================
// CURRENT: Mock Responses (Default)
// ============================================
// This is what's currently running
// To enable an API above, uncomment it and comment this out

const mockResponses = [
    'That\'s interesting! Can you tell me more about when this started?',
    'I understand. Have you noticed any patterns with your migraines? For example, do they happen at certain times of day?',
    'Keep tracking these details - they\'ll help us identify your migraine triggers.',
    'Great insight! Recording these observations helps build your personal migraine profile.',
    'Based on what you\'ve shared, have you considered tracking your sleep patterns more closely?',
    'Your observations are very helpful for building your migraine history. Keep up the detailed logging!',
    'That sounds challenging. Let\'s focus on identifying patterns. What do you think might have triggered it?',
    'Excellent tracking! These details are valuable for understanding your migraine patterns.',
];

export async function getAIResponse(userMessage: string): Promise<string> {
    // Simulate API delay
    return new Promise((resolve) => {
        setTimeout(() => {
            const response = mockResponses[Math.floor(Math.random() * mockResponses.length)];
            resolve(response);
        }, 800);
    });
}
