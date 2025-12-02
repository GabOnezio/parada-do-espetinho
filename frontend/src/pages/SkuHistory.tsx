import React, { useEffect, useState } from 'react';
import api from '../api/client';

type SkuEntry = {
  sku: string;
  gtin?: string;
  name: string;
  brand: string;
  price?: string;
  tax?: string;
  measureUnit?: string;
};

const SkuHistoryPage = () => {
  const [items, setItems] = useState<SkuEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/skus');
      setItems(res.data || []);
    } catch (err) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">Admin</p>
          <h1 className="text-2xl font-bold text-charcoal">Histórico de SKU</h1>
        </div>
      </div>

      <div className="glass-card p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-charcoal">Registros</h2>
          <span className="text-xs text-slate-500">{items.length} itens</span>
        </div>
        <div className="mt-4">
          {loading && <p>Carregando...</p>}
          {!loading && items.length === 0 && <p className="text-sm text-slate-500">Nenhum SKU registrado.</p>}
          <div className="mt-2 grid grid-cols-1 gap-2">
            {items.map((it) => (
              <div key={it.sku} className="flex items-center justify-between rounded-lg border border-slate-100 bg-white p-3">
                <div>
                  <div className="font-semibold">{it.sku}</div>
                  <div className="text-xs text-slate-500">{it.name} • {it.brand} {it.measureUnit ? `• ${it.measureUnit}` : ''}</div>
                </div>
                <div className="text-sm text-slate-600">{it.price ? `R$ ${it.price}` : ''}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkuHistoryPage;
