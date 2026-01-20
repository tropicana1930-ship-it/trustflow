export enum UserTier {
  BRONZE = 'Bronze',
  SILVER = 'Silver',
  GOLD = 'Gold',
  PLATINUM = 'Platinum'
}

export type UserRole = 'buyer' | 'seller' | 'carrier';

export enum RiskLevel {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical'
}

export enum EscrowStatus {
  HELD = 'HELD',
  RELEASED = 'RELEASED',
  DISPUTED = 'DISPUTED'
}

export interface AIAnalysisResult {
  trust_score: number; // 0-100
  risk_level: RiskLevel;
  red_flags: string[];
  reasoning: string;
  recommended_escrow: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  reputation_score: number;
  tier: UserTier;
  kyc_verified: boolean;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string;
  seller_id: string;
  trust_score: number;
  risk_level: RiskLevel;
  analysis?: AIAnalysisResult;
  created_at: string;
}

export interface Order {
  id: string;
  product_id: string;
  buyer_id: string;
  seller_id?: string;
  total_amount?: number;
  status: EscrowStatus;
  tracking_number?: string;
  carrier?: string;
  created_at?: string;
}