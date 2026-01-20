import React, { useState } from 'react';
import { Shield, Mail, Lock, User as UserIcon, ArrowRight, Loader2 } from 'lucide-react';
import { UserRole } from '../types';
import { api } from '../services/api';

interface AuthProps {
  onLogin: (user: any, token: string) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); 
  const [role, setRole] = useState<UserRole>('buyer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (isLogin) {
        const data = await api.auth.login(email, password);
        const userData = await api.auth.me(data.access_token);
        onLogin(userData, data.access_token);
      } else {
        await api.auth.register(email, password, role);
        // Auto login after register
        const data = await api.auth.login(email, password);
        const userData = await api.auth.me(data.access_token);
        onLogin(userData, data.access_token);
      }
    } catch (err: any) {
      setError('Error de autenticación. Verifica tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="p-8 bg-indigo-900 text-white text-center">
          <div className="flex justify-center mb-4">
             <div className="p-3 bg-white/10 rounded-full">
               <Shield size={32} className="text-white" />
             </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">TrustFlow</h1>
          <p className="text-indigo-200 text-sm">Marketplace Seguro con IA</p>
        </div>

        <div className="p-8">
          <div className="flex mb-8 border-b border-slate-100">
            <button 
              className={`flex-1 pb-4 text-sm font-medium transition-colors ${isLogin ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}
              onClick={() => setIsLogin(true)}
            >
              Iniciar Sesión
            </button>
            <button 
              className={`flex-1 pb-4 text-sm font-medium transition-colors ${!isLogin ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}
              onClick={() => setIsLogin(false)}
            >
              Crear Cuenta
            </button>
          </div>

          {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Nombre Completo</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    placeholder="Juan Pérez"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  placeholder="usuario@ejemplo.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Quiero</label>
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    type="button"
                    onClick={() => setRole('buyer')}
                    className={`text-sm py-2 rounded-lg border ${role === 'buyer' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    Comprar
                  </button>
                  <button 
                    type="button"
                    onClick={() => setRole('seller')}
                    className={`text-sm py-2 rounded-lg border ${role === 'seller' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    Vender
                  </button>
                  <button 
                    type="button"
                    onClick={() => setRole('carrier')}
                    className={`text-sm py-2 rounded-lg border ${role === 'carrier' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    Transportar
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg mt-6 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  {isLogin ? 'Ingresar' : 'Registrarse'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>
        
        <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
           <p className="text-xs text-slate-400">
             Al continuar, aceptas los Términos de Servicio de TrustFlow.
           </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;