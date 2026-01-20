import os
import json
import google.generativeai as genai
from typing import Dict, Any

# Configure API Key from Environment
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)

def calculate_trust_score(title: str, description: str, seller_reputation: float, price: float) -> Dict[str, Any]:
    """
    Real AI analysis using Gemini Pro to detect fraud and scoring.
    """
    if not GOOGLE_API_KEY:
        print("WARNING: No GOOGLE_API_KEY found. Using Mock Fallback.")
        return _mock_fallback(seller_reputation)

    try:
        model = genai.GenerativeModel('gemini-pro')
        
        prompt = f"""
        Act as a Fraud Detection Expert for an online marketplace. Analyze this listing:
        
        Product: {title}
        Description: {description}
        Price: ${price}
        Seller Reputation: {seller_reputation}/100
        
        Output ONLY a JSON object with this structure (no markdown):
        {{
            "trust_score": (integer 0-100),
            "risk_level": ("Low", "Medium", "High", "Critical"),
            "red_flags": [list of strings],
            "reasoning": "brief explanation",
            "recommended_escrow": (boolean)
        }}
        """
        
        response = model.generate_content(prompt)
        # Clean response to ensure valid JSON (remove markdown code blocks if any)
        text = response.text.replace('```json', '').replace('```', '').strip()
        return json.loads(text)
        
    except Exception as e:
        print(f"AI Error: {e}")
        return _mock_fallback(seller_reputation)

def detect_fraud_probability(amount: float, ip_address: str) -> float:
    """
    Simple heuristic rule engine for transaction risk (Gemini is overkill for simple IP checks usually).
    """
    probability = 0.05
    if amount > 5000: probability += 0.3
    if amount > 10000: probability += 0.2
    # Mock high risk IP check
    if ip_address.startswith("192.168.") or ip_address.startswith("10."):
        pass # Localhost/Private is safe for dev
    else:
        # In production, check against IP blocklists here
        pass
        
    return min(0.99, probability)

def _mock_fallback(seller_reputation):
    return {
        "trust_score": int(seller_reputation),
        "risk_level": "Medium",
        "red_flags": ["AI Service Unavailable (Check API Key)"],
        "reasoning": "System running in fallback mode.",
        "recommended_escrow": True
    }
