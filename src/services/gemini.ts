import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function parseDietPlan(planText: string, fileData?: { data: string, mimeType: string }) {
  try {
    const parts: any[] = [
      { text: `Parse this diet plan into a structured JSON list of meal items. 
      For each item include: 
      - time (HH:mm format, 24h)
      - mealType (one of: Breakfast, Morning Snack, Lunch, Afternoon Snack, Dinner, Before Bed)
      - description (what to eat)
      - prepTimeMinutes (estimated minutes for preparation if applicable, otherwise 0)
      - calories (estimated kcal number)
      - protein (estimated grams)
      - carbs (estimated grams)
      - fats (estimated grams)
      
      Additional context: ${planText || "Analyze the provided document."}` }
    ];

    if (fileData) {
      parts.push({
        inlineData: {
          data: fileData.data.split(',')[1], // Remove potential "data:image/png;base64," prefix
          mimeType: fileData.mimeType
        }
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            planName: { type: Type.STRING },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  time: { type: Type.STRING },
                  mealType: { type: Type.STRING },
                  description: { type: Type.STRING },
                  prepTimeMinutes: { type: Type.NUMBER },
                  calories: { type: Type.NUMBER },
                  protein: { type: Type.NUMBER },
                  carbs: { type: Type.NUMBER },
                  fats: { type: Type.NUMBER }
                },
                required: ["time", "mealType", "description"]
              }
            }
          }
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini parse error:", error);
    throw error;
  }
}

export async function analyzeQuickMeal(mealDescription: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this quick meal description and estimate its nutritional content. 
      Return a JSON object with:
      - name (short name of the meal)
      - calories (number)
      - protein (number in grams)
      - carbs (number in grams)
      - fats (number in grams)
      
      Description: "${mealDescription}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            calories: { type: Type.NUMBER },
            protein: { type: Type.NUMBER },
            carbs: { type: Type.NUMBER },
            fats: { type: Type.NUMBER }
          },
          required: ["name", "calories", "protein", "carbs", "fats"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini quick meal analysis error:", error);
    throw error;
  }
}
