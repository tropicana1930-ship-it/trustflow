import React, { useState } from 'react';
import { User, AIAnalysisResult, RiskLevel, Product, UserTier } from '../types';
import TrustBadge from '../components/TrustBadge';
import { AlertTriangle, CheckCircle, Loader2, Info } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { api } from '../services/api';

interface SellerDashboardProps {
  user: User;
  token: string;
  onAddProduct: (product: Product) => void;
}

const SellerDashboard: React.FC<SellerDashboardProps> = ({ user, token, onAddProduct }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);

  const handleAnalyze = async () => {
    if (!title || !description || !price) return;
    
    setIsAnalyzing(true);
    try {
        const result = await api.products.analyze(token, {
            title,
            description,
            price: parseFloat(price)
        });
        
        // Map string risk to Enum if needed
        let riskEnum = RiskLevel.MEDIUM;
        if (result.risk_level === "Low") riskEnum = RiskLevel.LOW;
        if (result.risk_level === "High") riskEnum = RiskLevel.HIGH;
        if (result.risk_level === "Critical") riskEnum = RiskLevel.CRITICAL;

        setAnalysis({
            ...result,
            risk_level: riskEnum
        });
    } catch (e) {
        console.error("Analysis failed", e);
        // Fallback local visual si falla todo (aunque el backend ya tiene fallback)
        alert("El servicio de análisis está tardando. Verifica tu conexión.");
    } finally {
        setIsAnalyzing(false);
    }
  };

  const handlePublish = async () => {
    if (!analysis) return;
    setIsPublishing(true);
    
    try {
        const productData = {
            title,
            description,
            price: parseFloat(price),
            category: "General",
            images: JSON.stringify([`https://picsum.photos/400/300?random=${Math.floor(Math.random() * 1000)}`]) 
        };

        const newProduct = await api.products.create(token, productData);
        
        onAddProduct({
            ...newProduct,
            risk_level: analysis.risk_level,
            trust_score: analysis.trust_score,
            image_url: JSON.parse(productData.images)[0]
        });
        
        setTitle('');
        setDescription('');
        setPrice('');
        setAnalysis(null);
        alert('Producto publicado exitosamente!');
    } catch (e) {
        alert('Error al publicar el producto');
    } finally {
        setIsPublishing(false);
    }
  };

  const mockChartData = [
      { name: 'Reputación', value: user.reputation_score, max: 100 },
      { name: 'Completados', value: 95, max: 100 },
      { name: 'Disputas', value: 2, max: 10 }, 
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column: Input Form */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center">
            <span className="bg-indigo-100 text-indigo-700 p-2 rounded-lg mr-3">
              <Info size={20} />
            </span>
            Publicar Nuevo Producto
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Título del Producto</label>
              <input 
                type="text" 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ej. MacBook Pro M1 2021"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
              <textarea 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 h-32"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe la condición, origen y detalles..."
              />
              <p className="text-xs text-slate-500 mt-1">Nuestra IA escaneará este texto en busca de indicadores de fraude.</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Precio ($)</label>
              <input 
                type="number" 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="pt-4 flex gap-3">
              <button 
                onClick={handleAnalyze}
                disabled={isAnalyzing || !title || !description}
                className="flex-1 bg-slate-900 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
              >
                {isAnalyzing ? <Loader2 className="animate-spin" /> : 'Ejecutar Pre-Check IA'}
              </button>
              {analysis && (
                <button 
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="flex-1 bg-green-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-green-700 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isPublishing ? <Loader2 className="animate-spin" /> : <><CheckCircle size={18} /> Publicar</>}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* AI Analysis Result Block */}
        {analysis && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-fade-in">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-slate-900">Análisis de Confianza IA</h3>
              <TrustBadge score={analysis.trust_score} risk={analysis.risk_level} size="lg" />
            </div>
            
            <div className="space-y-4">
               <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">Razonamiento IA</span>
                <p className="text-slate-700 mt-1 text-sm leading-relaxed">{analysis.reasoning}</p>
              </div>

              {analysis.red_flags.length > 0 ? (
                <div>
                  <h4 className="text-sm font-bold text-red-700 mb-2 flex items-center gap-2">
                    <AlertTriangle size={16} /> Alertas Identificadas
                  </h4>
                  <ul className="list-disc list-inside space-y-1">
                    {analysis.red_flags.map((flag, idx) => (
                      <li key={idx} className="text-sm text-red-600 bg-red-50 p-2 rounded">{flag}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                 <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-lg">
                    <CheckCircle size={18} /> No se detectaron alertas rojas en la descripción.
                 </div>
              )}
              
              <div className="flex items-center justify-between pt-2">
                <span className="text-sm text-slate-600">Recomendación de Escrow:</span>
                <span className={`text-sm font-bold px-3 py-1 rounded-full ${analysis.recommended_escrow ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'}`}>
                  {analysis.recommended_escrow ? 'Requerido' : 'Opcional'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Column: User Stats */}
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Perfil de Vendedor</h2>
          <div className="flex items-center gap-4 mb-6">
            <div className="h-16 w-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
               {user.name ? user.name.charAt(0) : 'U'}
            </div>
            <div>
              <h3 className="font-bold text-slate-900">{user.name || user.email}</h3>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs font-bold border border-yellow-200">
                   {user.tier}
                </span>
                <span>{user.kyc_verified ? '✓ Verificado KYC' : 'No Verificado'}</span>
              </div>
            </div>
          </div>
          
          <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockChartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 12}} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                    {mockChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#4f46e5' : index === 1 ? '#10b981' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
          </div>
           <div className="mt-4 text-xs text-gray-500 text-center">
            Tus métricas influyen directamente en el TrustScore inicial de tus productos.
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;