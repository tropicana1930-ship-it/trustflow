import { UserTier } from '../types';

const API_URL = 'http://localhost:8000';

// --- Mock Data for Fallback ---
const MOCK_USER = {
  id: 1,
  email: 'demo@trustflow.com',
  role: 'buyer',
  kyc_status: 'verified',
  reputation_score: 85.5,
  tier: UserTier.BRONZE
};

const MOCK_PRODUCTS = [
  {
    id: 101,
    seller_id: 2,
    title: 'MacBook Pro M2 2023',
    description: 'Barely used, original packaging included. Receipt available.',
    price: 1200.0,
    trust_score: 95.0,
    status: 'active',
    images: JSON.stringify(['https://images.unsplash.com/photo-1517336714731-489689fd1ca4?auto=format&fit=crop&q=80&w=1000'])
  },
  {
    id: 102,
    seller_id: 3,
    title: 'Vintage Rolex Submariner',
    description: 'No box, no papers. Urgent sale needed cash fast.',
    price: 4500.0,
    trust_score: 35.0,
    status: 'active',
    images: JSON.stringify(['https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&q=80&w=1000'])
  },
  {
    id: 103,
    seller_id: 2,
    title: 'Sony A7IV Camera Body',
    description: 'Professional camera body, shutter count < 5000.',
    price: 1900.0,
    trust_score: 88.0,
    status: 'active',
    images: JSON.stringify(['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=1000'])
  }
];

const MOCK_CARRIERS = [
  { id: 99, email: 'logistics@trustflow.com', role: 'carrier', kyc_status: 'verified', reputation_score: 92.0 }
];

// Helper to handle fetch failures gracefully by returning mock data
async function fetchWithFallback<T>(
  url: string,
  options: RequestInit = {},
  mockResponse: T,
  delay: number = 600
): Promise<T> {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
        throw new Error(`API Error: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.warn(`Backend unreachable at ${url}. Serving mock data.`, error);
    await new Promise(resolve => setTimeout(resolve, delay)); // Simulate network latency
    return mockResponse;
  }
}

export const api = {
  auth: {
    login: async (email, password) => {
      // Always try to hit backend first
      return fetchWithFallback(
        `${API_URL}/token`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ username: email, password }),
        },
        { access_token: "mock-jwt-token-xyz", token_type: "bearer" }
      );
    },
    register: async (email, password, role) => {
      return fetchWithFallback(
        `${API_URL}/register`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, role }),
        },
        { ...MOCK_USER, email, role }
      );
    },
    me: async (token) => {
      return fetchWithFallback(
        `${API_URL}/users/me`,
        { headers: { Authorization: `Bearer ${token}` } },
        MOCK_USER
      );
    },
    upgrade: async (token, tier) => {
        return fetchWithFallback(
            `${API_URL}/users/upgrade`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ tier }),
            },
            { ...MOCK_USER, tier }
        );
    }
  },
  products: {
    list: async () => {
      return fetchWithFallback(
        `${API_URL}/products`,
        {},
        MOCK_PRODUCTS
      );
    },
    analyze: async (token, data: {title: string, description: string, price: number}) => {
       return fetchWithFallback(
         `${API_URL}/analyze`,
         {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(data)
         },
         {
            trust_score: 88,
            risk_level: "Low",
            red_flags: [],
            reasoning: "Mock Analysis: Product looks safe.",
            recommended_escrow: false
         }
       );
    },
    create: async (token, productData) => {
      return fetchWithFallback(
        `${API_URL}/products`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(productData),
        },
        {
           id: Math.floor(Math.random() * 1000) + 200,
           seller_id: MOCK_USER.id,
           trust_score: 85,
           status: 'active',
           ...productData,
           // Ensure images is stringified if passed as string in payload or array
           images: typeof productData.images === 'string' ? productData.images : JSON.stringify(productData.images || [])
        }
      );
    },
  },
  orders: {
    create: async (token, orderData) => {
      return fetchWithFallback(
        `${API_URL}/orders`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(orderData),
        },
        {
            id: Math.floor(Math.random() * 10000),
            buyer_id: MOCK_USER.id,
            product_id: orderData.product_id,
            total_amount: 1200.00,
            platform_fee: 60.0, // 5% mock
            net_amount: 1140.0,
            escrow_status: 'held',
            order_status: 'pending'
        }
      );
    },
    getCarriers: async () => {
      return fetchWithFallback(
        `${API_URL}/users/carriers`,
        {},
        MOCK_CARRIERS
      );
    }
  },
};