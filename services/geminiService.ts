
import { GoogleGenAI, Type } from "@google/genai";

// Fix: Use process.env.API_KEY directly as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getAITicketSuggestions = async (subject: string, description: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Suggest a helpful response for an IT support ticket with the subject: "${subject}" and description: "${description}". Keep it professional and empathetic.`,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating suggestion.";
  }
};

export const getPersonalizedGreeting = async (name: string, role: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a short, professional, and motivating morning greeting (max 15 words) for an employee named ${name} who is a ${role} at JS Bank.`,
    });
    return response.text;
  } catch (error) {
    return `Welcome back, ${name}!`;
  }
};
