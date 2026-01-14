
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getAITicketSuggestions = async (subject: string, description: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Suggest a short, helpful IT support response for a ticket with subject: "${subject}" and issue: "${description}".`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The AI assistant is currently calibrating. Please respond manually.";
  }
};

export const getPersonalizedGreeting = async (name: string, role: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a 1-sentence professional greeting for ${name}, a ${role} at JS Bank.`,
    });
    return response.text;
  } catch (error) {
    return `Welcome to your corporate workspace, ${name}.`;
  }
};

export const getLatestBankNews = async () => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Search for the 3 most recent news articles or press releases from jsbl.com (JS Bank Pakistan). Return them as a JSON array with properties: title, summary, link, date, image (use a relevant banking placeholder if none found).",
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json"
      }
    });
    
    // Attempt to parse the text output as JSON
    const text = response.text || "[]";
    const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("News Fetch Error:", error);
    return null; // Fallback to mock data handled in component
  }
};

export const getCurrentWeather = async (lat: number, lon: number) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `What is the current weather at coordinates ${lat}, ${lon}? Provide temperature in Celsius, a short description (e.g. Sunny), and an emoji. Return JSON with temp, desc, emoji.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json"
      }
    });
    const text = response.text || "{}";
    const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    return { temp: "--", desc: "Weather Unavailable", emoji: "☁️" };
  }
};
