import React, { useState } from 'react';
import { User, UserTier } from '../types';
import { api } from '../services/api';
import { Check, Crown, Zap, Shield, Loader2 } from 'lucide-react';

interface SubscriptionProps {
  user: User;
  token: string;
}

const Subscription: React.FC<SubscriptionProps> = ({ user, token }) => {
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  const handleUpgrade = async (tier: UserTier) => {
    if (tier === user.tier) return;
    setLoadingTier(tier);
    try {
        await api.auth.upgrade(token, tier);
        alert(`¡Felicidades! Has actualizado tu plan a ${tier}.`);
        window.location.reload(); // Simple reload to refresh user state
    } catch (e) {
        alert("Error al actualizar la suscripción.");
    } finally {
        setLoadingTier(null);
    }
  };

  const tiers = [
    {
      id: UserTier.BRONZE,
      name: 'Bronze',
      price: 'Gratis',
      icon: Shield,
      features: ['Compra y Venta Básica', 'Comisión 5% por venta', 'Soporte Estándar'],
      color: 'bg-slate-100 text-slate-700',
      btnColor: 'bg-slate-200 text-slate-700 hover:bg-slate-300'
    },
    {
      id: UserTier.SILVER,
      name: 'Silver',
      price: '$9.99/mes',
      icon: Zap,
      features: ['Prioridad en Búsquedas', 'Comisión reducida 4%', 'Badge de Verificación', 'Soporte Prioritario'],
      color: 'bg-gray-100 text-gray-800 border-gray-300',
      btnColor: 'bg-gray-800 text-white hover:bg-gray-900'
    },
    {
      id: UserTier.GOLD,
      name: 'Gold',
      price: '$29.99/mes',
      icon: Crown,
      features: ['Comisión reducida 3%', 'Análisis IA Ilimitado', 'Protección de Fraude Premium', 'Gerente de Cuenta'],
      color: 'bg-yellow-50 text-yellow-800 border-yellow-200',
      btnColor: 'bg-yellow-600 text-white hover:bg-yellow-700'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-10 py-10">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-slate-900">Planes y Precios</h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto">
          Escala tu negocio en TrustFlow con herramientas avanzadas y comisiones reducidas.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {tiers.map((tier) => (
          <div key={tier.id} className={`relative rounded-2xl p-8 border ${tier.id === UserTier.GOLD ? 'border-yellow-400 shadow-xl scale-105' : 'border-slate-200 shadow-sm'} bg-white flex flex-col`}>
             {tier.id === UserTier.GOLD && (
                 <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase">
                     Recomendado
                 </div>
             )}
             
             <div className="mb-6">
                 <div className={`w-12 h-12 rounded-lg ${tier.color} flex items-center justify-center mb-4`}>
                     <tier.icon size={24} />
                 </div>
                 <h3 className="text-2xl font-bold text-slate-900">{tier.name}</h3>
                 <p className="text-3xl font-extrabold text-slate-900 mt-2">{tier.price}</p>
             </div>

             <ul className="space-y-4 mb-8 flex-1">
                 {tier.features.map((feat, i) => (
                     <li key={i} className="flex items-center gap-3 text-slate-600 text-sm">
                         <Check size={16} className="text-green-500 flex-shrink-0" />
                         {feat}
                     </li>
                 ))}
             </ul>

             <button 
                onClick={() => handleUpgrade(tier.id)}
                disabled={loadingTier !== null || user.tier === tier.id}
                className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${tier.btnColor} disabled:opacity-50 disabled:cursor-not-allowed`}
             >
                {loadingTier === tier.id ? <Loader2 className="animate-spin" /> : 
                 user.tier === tier.id ? 'Plan Actual' : 'Seleccionar Plan'}
             </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Subscription;
