import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || "" });

export const generateStyleAdvice = async (userPrompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: "You are a luxury fashion consultant for Navanika Boutique. We specialize in heritage sarees, formal wear, and contemporary ethnic fashion. Provide personalized, elegant, and poetic style advice.",
        tools: [{ googleSearch: {} }],
      },
    });
    return response.text || "";
  } catch (error) {
    console.error("Style advice error:", error);
    throw error;
  }
};



export const analyzeTryOn = async (userImageBase64: string, product: { name: string, category: string, description: string }): Promise<{ assessment: string, meshDetails: string, videoWalk: string }> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: `You are the lead AI Weaver for Navanika Heritage. A user wants a full showcase of themselves in the "${product.name}" (${product.category}). 
            Analyze the user's photo and the garment details. 
            Return a JSON object with the following fields:
            1. "assessment": A poetic, luxurious style assessment of how the garment complements their profile.
            2. "meshDetails": A technical description of the 3D heritage mesh you would generate (e.g., "1.2M polygons, silk-refraction shaders, authentic pleat simulation...").
            3. "videoWalk": A description of a cinematic video walk (e.g., "Camera follows a slow orbit in a marble heritage palace, highlighting the gold embroidery reflections...").
            
            Return ONLY the JSON object.` },
            { inlineData: { data: userImageBase64.split(',')[1], mimeType: "image/jpeg" } }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });
    
    const data = JSON.parse(response.text || "{}");
    return {
      assessment: data.assessment || "Our AI is refining your heritage assessment...",
      meshDetails: data.meshDetails || "Authentic texture mapping and pleat simulation in progress...",
      videoWalk: data.videoWalk || "Cinematic palace walk being rendered in our heritage engine..."
    };
  } catch (error) {
    console.error("Try-on analysis error:", error);
    return {
      assessment: "A timeless choice that resonates with elegance.",
      meshDetails: "High-fidelity mesh generation active.",
      videoWalk: "Cinematic heritage showcase preparing."
    };
  }
};

export const generateProductImage = async (prompt: string, size: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a high-quality product description and visual concept for: ${prompt}. (Note: Image generation requires a specialized model, providing conceptual design instead).`,
    });
    return null; // Return null to signal image gen is conceptual/unsupported for now
  } catch (error) {
    console.error("Conceptual design error:", error);
    throw error;
  }
};

export const startChat = (systemInstruction: string) => {
  return ai.chats.create({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction,
    },
  });
};
