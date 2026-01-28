
import { GoogleGenAI } from "@google/genai";

// Always use process.env.API_KEY directly for initialization.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getProductInsight = async (productName: string) => {
  try {
    // Using gemini-3-flash-preview for basic text tasks as per guidelines.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a savvy tech shopping assistant for Viralyn. Provide a 2-sentence highly persuasive sales blurb about why someone should buy a ${productName} subscription today. Focus on the value of saving money and convenience.`,
    });
    // .text is a property getter, not a method.
    return response.text || "This premium subscription offers unbeatable value for your digital lifestyle.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "The ultimate premium experience at a fraction of the cost.";
  }
};

export const getSmartRecommendations = async (userInterest: string) => {
  try {
    // Using gemini-3-flash-preview for basic text tasks.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `User is interested in: ${userInterest}. Suggest 3 types of digital subscriptions they might like (e.g., Netflix, ChatGPT, Spotify). Format as a comma separated list.`,
    });
    // .text is a property getter.
    return response.text?.split(',').map(s => s.trim()) || [];
  } catch (error) {
    console.error("Gemini API Error:", error);
    return ["Netflix", "Spotify", "ChatGPT"];
  }
};
