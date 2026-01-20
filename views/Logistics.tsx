import React from 'react';
import { Truck, MapPin, Package, CheckCircle } from 'lucide-react';
import { Order, EscrowStatus } from '../types';

const Logistics: React.FC = () => {
  // Mock active shipments
  const shipments: Order[] = [
    {
        id: 'ORD-7829-XJ',
        product_id: 'prod-1',
        buyer_id: 'buyer-2',
        status: EscrowStatus.HELD,
        tracking_number: 'TRK-99283712',
        carrier: 'TrustLogistics'
    },
    {
        id: 'ORD-9921-MC',
        product_id: 'prod-3',
        buyer_id: 'buyer-5',
        status: EscrowStatus.RELEASED,
        tracking_number: 'TRK-11223344',
        carrier: 'FedEx'
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
         <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Truck className="text-indigo-600" /> Centro de Logística
         </h1>
         <span className="text-sm text-slate-500">Actualizaciones en Vivo</span>
      </div>

      <div className="grid gap-6">
        {shipments.map((shipment) => (
          <div key={shipment.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-slate-900">{shipment.tracking_number}</span>
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-bold rounded border border-blue-100">{shipment.carrier}</span>
                    </div>
                    <div className="text-sm text-slate-500">Orden ID: {shipment.id}</div>
                </div>

                <div className="flex items-center gap-8">
                    <div className="text-center">
                        <div className="text-xs text-slate-500 uppercase font-bold mb-1">Estado del Escrow</div>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            shipment.status === EscrowStatus.HELD ? 'bg-yellow-100 text-yellow-800' :
                            shipment.status === EscrowStatus.RELEASED ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                            {shipment.status}
                        </span>
                    </div>
                    <button className="text-indigo-600 font-medium hover:text-indigo-800 text-sm">Ver Prueba de Entrega</button>
                </div>
            </div>

            <div className="mt-8 relative">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 rounded-full"></div>
                <div className="relative flex justify-between z-10">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center border-4 border-white shadow-sm">
                            <Package size={14} />
                        </div>
                        <span className="text-xs font-medium text-slate-700">Recogido</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center border-4 border-white shadow-sm">
                            <Truck size={14} />
                        </div>
                        <span className="text-xs font-medium text-slate-700">En Tránsito</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center border-4 border-white shadow-sm animate-pulse">
                            <MapPin size={14} />
                        </div>
                        <span className="text-xs font-medium text-indigo-700 font-bold">En Reparto</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                         <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center border-4 border-white">
                            <CheckCircle size={14} />
                        </div>
                        <span className="text-xs font-medium text-gray-400">Entregado</span>
                    </div>
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Logistics;