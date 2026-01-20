import React from 'react';
import { Shield, ShoppingBag, Truck, LayoutDashboard, PlusCircle, Crown } from 'lucide-react';

interface NavbarProps {
  activeView: string;
  setView: (view: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ activeView, setView }) => {
  const navItems = [
    { id: 'marketplace', label: 'Tienda', icon: ShoppingBag },
    { id: 'dashboard', label: 'Panel AI', icon: LayoutDashboard },
    { id: 'sell', label: 'Vender', icon: PlusCircle },
    { id: 'logistics', label: 'Logística', icon: Truck },
    { id: 'subscription', label: 'Premium', icon: Crown },
  ];

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center cursor-pointer" onClick={() => setView('marketplace')}>
            <Shield className="h-8 w-8 text-indigo-600" />
            <span className="ml-2 text-xl font-bold text-slate-900 tracking-tight">TrustFlow</span>
          </div>
          <div className="flex space-x-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium h-full transition-colors ${
                  activeView === item.id
                    ? 'border-indigo-500 text-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                <item.icon className="w-4 h-4 mr-2" />
                {item.label}
              </button>
            ))}
          </div>
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
              JD
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
