import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysisResult, RiskLevel } from "../types";

// In a real Python full-stack app, this logic would reside in backend/services/ai_service.py
// leveraging 'all-MiniLM-L6-v2' and XGBoost. Here, we use Gemini to simulate that intelligence.

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeProductTrust = async (
  title: string,
  description: string,
  price: number,
  sellerReputation: number
): Promise<AIAnalysisResult> => {
  try {
    const prompt = `
      Act as a Fraud Detection AI for a marketplace. Analyze the following product listing:
      Title: "${title}"
      Description: "${description}"
      Price: $${price}
      Seller Reputation Score (0-100): ${sellerReputation}

      Determine a 'trust_score' (0-100), identify any 'red_flags' (e.g., urgency, weird payment methods, unrealistic price), 
      assign a 'risk_level' (Low, Medium, High, Critical), and provide 'reasoning'.
      Decide if 'recommended_escrow' is needed based on risk.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            trust_score: { type: Type.NUMBER },
            risk_level: { type: Type.STRING, enum: ["Low", "Medium", "High", "Critical"] },
            red_flags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            reasoning: { type: Type.STRING },
            recommended_escrow: { type: Type.BOOLEAN },
          },
          required: ["trust_score", "risk_level", "red_flags", "reasoning", "recommended_escrow"],
        },
      },
    });

    const jsonText = response.text || "{}";
    const data = JSON.parse(jsonText);

    // Map string risk level to Enum
    let riskEnum = RiskLevel.MEDIUM;
    if (data.risk_level === "Low") riskEnum = RiskLevel.LOW;
    if (data.risk_level === "High") riskEnum = RiskLevel.HIGH;
    if (data.risk_level === "Critical") riskEnum = RiskLevel.CRITICAL;

    return {
      trust_score: data.trust_score,
      risk_level: riskEnum,
      red_flags: data.red_flags || [],
      reasoning: data.reasoning,
      recommended_escrow: data.recommended_escrow,
    };
  } catch (error) {
    console.error("AI Analysis Failed:", error);
    // Fallback mock response if API fails or key is missing
    return {
      trust_score: 50,
      risk_level: RiskLevel.MEDIUM,
      red_flags: ["AI Service Unavailable"],
      reasoning: "Could not connect to analysis engine.",
      recommended_escrow: true,
    };
  }
};