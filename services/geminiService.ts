// This file is deprecated. 
// All AI logic has been moved to backend/ai_utils.py for security and centralization.
// The frontend now calls api.products.analyze() defined in services/api.ts

export const analyzeProductTrust = async () => {
    throw new Error("Deprecated: Use api.products.analyze from backend instead.");
};
