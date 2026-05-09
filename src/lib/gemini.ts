import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || "" });

export const generateStyleAdvice = async (userPrompt: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: "You are a luxury fashion consultant for Navanika Boutique. We specialize in heritage sarees, formal wear, and contemporary ethnic fashion. Provide personalized, elegant, and poetic style advice.",
        tools: [{ googleSearch: {} }],
      },
    });
    return response.text;
  } catch (error) {
    console.error("Style advice error:", error);
    throw error;
  }
};

export const generateProductImage = async (prompt: string, size: "512px" | "1K" | "2K" | "4K" = "1K") => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: size
        },
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image generation error:", error);
    throw error;
  }
};

export const startChat = (systemInstruction: string) => {
  return ai.chats.create({
    model: "gemini-1.5-flash",
    config: {
      systemInstruction,
    },
  });
};
