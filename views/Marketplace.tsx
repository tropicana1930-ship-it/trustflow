import React, { useState, useMemo, useEffect } from 'react';
import { Product, RiskLevel } from '../types';
import TrustBadge from '../components/TrustBadge';
import { Filter, Search, ShoppingCart, Loader2 } from 'lucide-react';
import { api } from '../services/api';

interface MarketplaceProps {
  products: Product[]; 
  onBuy: (product: Product) => void;
}

const Marketplace: React.FC<MarketplaceProps> = ({ onBuy }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRisk, setFilterRisk] = useState<RiskLevel | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await api.products.list();
        const mapped = data.map((p: any) => ({
            ...p,
            risk_level: p.trust_score > 80 ? RiskLevel.LOW : p.trust_score > 50 ? RiskLevel.MEDIUM : RiskLevel.CRITICAL,
            image_url: p.images && p.images !== '[]' ? JSON.parse(p.images)[0] : `https://picsum.photos/400/300?random=${p.id}`
        }));
        setProducts(mapped);
      } catch (error) {
        console.error("Error al obtener productos", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesRisk = filterRisk === 'All' || p.risk_level === filterRisk;
      const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            p.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesRisk && matchesSearch;
    });
  }, [products, filterRisk, searchTerm]);

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="relative flex-1 max-w-lg">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Buscar productos verificados..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-slate-500" />
          <span className="text-sm text-slate-700 font-medium">Filtro de Confianza:</span>
          <select 
            className="block w-40 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value as RiskLevel | 'All')}
          >
            <option value="All">Todos</option>
            <option value={RiskLevel.LOW}>Alta Confianza (Riesgo Bajo)</option>
            <option value={RiskLevel.MEDIUM}>Riesgo Medio</option>
            <option value={RiskLevel.HIGH}>Alto Riesgo</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <div key={product.id} className="group bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
            <div className="aspect-w-16 aspect-h-9 bg-gray-200 relative h-48">
              <img 
                src={product.image_url} 
                alt={product.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-2 right-2">
                <TrustBadge score={product.trust_score} risk={product.risk_level} size="sm" />
              </div>
            </div>
            <div className="p-4 space-y-3 flex-1 flex flex-col">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900 truncate">{product.title}</h3>
                <p className="text-sm text-slate-500 line-clamp-2 h-10">{product.description}</p>
              </div>
              
              {product.risk_level === RiskLevel.HIGH && (
                <div className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded border border-red-100 flex items-center justify-center">
                  Escrow Requerido - Alto Riesgo
                </div>
              )}

              <div className="pt-2 border-t border-slate-50 mt-auto">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-xl font-bold text-slate-900">${product.price.toLocaleString()}</span>
                </div>
                <button 
                  onClick={() => onBuy(product)}
                  className="w-full px-3 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                >
                  <ShoppingCart size={16} />
                  Comprar con Escrow
                </button>
              </div>
            </div>
          </div>
        ))}
        {filteredProducts.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <p className="text-slate-500 text-lg">No se encontraron productos con esos criterios.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;