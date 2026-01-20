import os
import json
import random
import requests
from typing import Dict, Any

# Configuración de Hugging Face
HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")
HF_API_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2"

def calculate_trust_score(title: str, description: str, seller_reputation: float, price: float) -> Dict[str, Any]:
    """
    Intenta usar Hugging Face para análisis. Si falla o no hay key, usa un sistema experto heurístico.
    """
    if HUGGINGFACE_API_KEY:
        try:
            return _call_huggingface_ai(title, description, seller_reputation, price)
        except Exception as e:
            print(f"⚠️ Error con Hugging Face: {e}. Usando sistema heurístico de respaldo.")
            return _heuristic_analysis(title, description, seller_reputation, price)
    else:
        print("ℹ️ No HUGGINGFACE_API_KEY found. Usando sistema heurístico (Modo Offline).")
        return _heuristic_analysis(title, description, seller_reputation, price)

def _call_huggingface_ai(title: str, description: str, seller_reputation: float, price: float) -> Dict[str, Any]:
    headers = {"Authorization": f"Bearer {HUGGINGFACE_API_KEY}"}
    
    prompt = f"""[INST] You are a Fraud Detection Expert. Analyze this product listing and output ONLY valid JSON.
    
    Product: {title}
    Description: {description}
    Price: ${price}
    Seller Reputation: {seller_reputation}/100

    Output format:
    {{
        "trust_score": (int 0-100),
        "risk_level": "Low" | "Medium" | "High" | "Critical",
        "red_flags": ["flag1", "flag2"],
        "reasoning": "Brief explanation",
        "recommended_escrow": true/false
    }}
    [/INST]"""

    payload = {
        "inputs": prompt,
        "parameters": {"max_new_tokens": 300, "temperature": 0.1, "return_full_text": False}
    }

    response = requests.post(HF_API_URL, headers=headers, json=payload)
    response.raise_for_status()
    
    result_text = response.json()[0]['generated_text']
    
    # Limpieza básica para encontrar el JSON dentro del texto generado
    try:
        start_idx = result_text.find('{')
        end_idx = result_text.rfind('}') + 1
        json_str = result_text[start_idx:end_idx]
        return json.loads(json_str)
    except:
        # Si la IA responde texto plano y no JSON
        return _heuristic_analysis(title, description, seller_reputation, price)

def _heuristic_analysis(title: str, description: str, seller_reputation: float, price: float) -> Dict[str, Any]:
    """
    Sistema lógico basado en reglas matemáticas. 
    Funciona 100% offline y es muy efectivo para demos.
    """
    score = seller_reputation
    red_flags = []
    
    # Regla 1: Descripción muy corta
    if len(description) < 20:
        score -= 15
        red_flags.append("Descripción sospechosamente breve")
        
    # Regla 2: Palabras clave de estafa
    suspicious_words = ["urgente", "western union", "transferencia", "cash only", "sin factura", "clon", "replica"]
    found_suspicious = [word for word in suspicious_words if word in description.lower() or word in title.lower()]
    
    if found_suspicious:
        score -= (len(found_suspicious) * 20)
        red_flags.append(f"Palabras de riesgo detectadas: {', '.join(found_suspicious)}")
        
    # Regla 3: Precio demasiado bajo (simulado)
    # En producción real esto compararía con el promedio de la categoría
    if price < 50 and ("macbook" in title.lower() or "iphone" in title.lower() or "rolex" in title.lower()):
        score -= 40
        red_flags.append("Precio irrealmente bajo para el producto")

    # Normalizar score
    score = max(0, min(100, score))
    
    # Determinar nivel de riesgo
    if score >= 80:
        risk_level = "Low"
        escrow = False
    elif score >= 50:
        risk_level = "Medium"
        escrow = True
    elif score >= 30:
        risk_level = "High"
        escrow = True
    else:
        risk_level = "Critical"
        escrow = True
        
    return {
        "trust_score": int(score),
        "risk_level": risk_level,
        "red_flags": red_flags,
        "reasoning": f"Análisis basado en heurística: Reputación del vendedor {seller_reputation} y análisis de contenido detectó {len(red_flags)} alertas.",
        "recommended_escrow": escrow
    }

def detect_fraud_probability(amount: float, ip_address: str) -> float:
    probability = 0.05
    if amount > 5000: probability += 0.3
    if amount > 10000: probability += 0.2
    return min(0.99, probability)
