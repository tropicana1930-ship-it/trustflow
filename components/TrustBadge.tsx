import React from 'react';
import { ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';
import { RiskLevel } from '../types';

interface TrustBadgeProps {
  score: number;
  risk: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
}

const TrustBadge: React.FC<TrustBadgeProps> = ({ score, risk, size = 'md' }) => {
  let colorClass = 'text-gray-500 bg-gray-100 border-gray-200';
  let Icon = ShieldCheck;

  if (score >= 80) {
    colorClass = 'text-green-700 bg-green-50 border-green-200';
    Icon = ShieldCheck;
  } else if (score >= 50) {
    colorClass = 'text-yellow-700 bg-yellow-50 border-yellow-200';
    Icon = ShieldAlert;
  } else {
    colorClass = 'text-red-700 bg-red-50 border-red-200';
    Icon = ShieldX;
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-3 py-1 text-sm gap-1.5',
    lg: 'px-4 py-2 text-base gap-2',
  };

  const iconSizes = {
    sm: 14,
    md: 18,
    lg: 24,
  };

  return (
    <div className={`inline-flex items-center rounded-full border font-medium ${colorClass} ${sizeClasses[size]}`} title={`Risk Level: ${risk}`}>
      <Icon size={iconSizes[size]} />
      <span>{score}/100 Trust</span>
    </div>
  );
};

export default TrustBadge;