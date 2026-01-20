import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Marketplace from './views/Marketplace';
import SellerDashboard from './views/SellerDashboard';
import Logistics from './views/Logistics';
import Subscription from './views/Subscription';
import Auth from './views/Auth';
import { User, Product, Order, EscrowStatus } from './types';
import { api } from './services/api';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState('marketplace');
  const [carriers, setCarriers] = useState<any[]>([]);

  // On mount check local storage for token
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
        setToken(savedToken);
        api.auth.me(savedToken).then(setUser).catch(() => {
            localStorage.removeItem('token');
            setToken(null);
        });
    }
    // Fetch carriers
    api.orders.getCarriers().then(setCarriers).catch(console.error);
  }, []);

  const handleLogin = (userData: User, accessToken: string) => {
    setUser(userData);
    setToken(accessToken);
    localStorage.setItem('token', accessToken);
    setCurrentView('marketplace');
  };

  const handleAddProduct = (product: Product) => {
    // Product is added via API in SellerDashboard, we just switch view or refresh
    setCurrentView('marketplace');
  };

  const handleBuyProduct = async (product: Product) => {
    if (!user || !token) {
      alert("Por favor inicia sesión para comprar.");
      return;
    }

    if (carriers.length === 0) {
        alert("No hay transportistas disponibles.");
        return;
    }

    try {
        const orderData = {
            product_id: product.id,
            carrier_id: carriers[0].id // Simplification: pick first carrier
        };
        const order = await api.orders.create(token, orderData);
        alert(`¡Orden ${order.id} creada! Fondos retenidos en Escrow. Comisión aplicada: $${order.platform_fee}`);
    } catch (e) {
        alert("Error al crear la orden.");
    }
  };

  if (!user || !token) {
    return <Auth onLogin={handleLogin} />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'marketplace':
        return <Marketplace products={[]} onBuy={handleBuyProduct} />;
      case 'dashboard':
      case 'sell':
        return <SellerDashboard user={user} token={token} onAddProduct={handleAddProduct} />;
      case 'logistics':
        return <Logistics />; 
      case 'subscription':
        return <Subscription user={user} token={token} />;
      default:
        return <Marketplace products={[]} onBuy={handleBuyProduct} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Navbar activeView={currentView} setView={setCurrentView} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderView()}
      </main>
    </div>
  );
};

export default App;
