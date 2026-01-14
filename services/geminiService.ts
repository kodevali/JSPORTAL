
import { GoogleGenAI, Type } from "@google/genai";

const getAIInstance = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    throw new Error("API_KEY_MISSING");
  }
  return new GoogleGenAI({ apiKey });
};

// High-reasoning thinking mode for complex banking/strategic queries
export const getDeepThinkingResponse = async (prompt: string) => {
  try {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 32768 }
      },
    });
    return response.text;
  } catch (error) {
    console.error("Thinking mode failure:", error);
    return "Technical error in deep-reasoning module. Falling back to standard response.";
  }
};

export const getAITicketSuggestions = async (subject: string, description: string) => {
  try {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Suggest a short, helpful IT support response for a ticket with subject: "${subject}" and issue: "${description}".`,
    });
    return response.text;
  } catch (error) {
    console.warn("AI Support Suggestion unavailable:", error);
    return "Our AI technician is currently busy. Please review and respond manually based on JSBL protocols.";
  }
};

export const getPersonalizedGreeting = async (name: string, role: string) => {
  try {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a 1-sentence professional greeting for ${name}, a ${role} at JS Bank.`,
    });
    return response.text;
  } catch (error) {
    return `Assalamu Alaikum ${name}, welcome to your secure workspace.`;
  }
};

export const getLatestBankNews = async () => {
  try {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Search for the 3 most recent news articles or press releases from jsbl.com (JS Bank Pakistan).",
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            articles: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  link: { type: Type.STRING },
                  date: { type: Type.STRING },
                  image: { type: Type.STRING }
                },
                required: ["title", "summary", "link"]
              }
            }
          },
          required: ["articles"]
        }
      }
    });
    
    let articles = [];
    const text = response.text || "";
    try {
      const parsed = JSON.parse(text.trim());
      articles = parsed.articles || [];
    } catch (e) {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          articles = parsed.articles || [];
        } catch (innerE) {}
      }
    }
    
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return { articles, sources };
  } catch (error) {
    console.warn("Real-time news feed restricted:", error);
    return null; 
  }
};

export const getCurrentWeather = async (lat: number, lon: number) => {
  try {
    const ai = getAIInstance();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `What is the current weather at coordinates ${lat}, ${lon}?`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            temp: { type: Type.STRING },
            desc: { type: Type.STRING },
            emoji: { type: Type.STRING }
          },
          required: ["temp", "desc", "emoji"]
        }
      }
    });
    
    let weatherData = { temp: "26°C", desc: "Sunny", emoji: "☀️" };
    const text = response.text || "";
    try {
      const parsed = JSON.parse(text.trim());
      weatherData = { ...weatherData, ...parsed };
    } catch (e) {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          weatherData = { ...weatherData, ...parsed };
        } catch (innerE) {}
      }
    }
    
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return { ...weatherData, sources };
  } catch (error) {
    return { temp: "26°C", desc: "Sunny", emoji: "☀️", sources: [] };
  }
};
