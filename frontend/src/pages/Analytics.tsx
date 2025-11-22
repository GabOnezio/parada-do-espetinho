import React, { useEffect, useState } from 'react';
import api from '../api/client';

type AnalyticsData = {
  todayVolume: number;
  averageTicket: number;
  topProducts: { productId: string; quantity: number; product?: { name: string } }[];
  vipClients: any[];
  topCoupons: any[];
};

const AnalyticsPage = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    api
      .get('/analytics')
      .then((res) => setData(res.data))
      .catch(() => setData(null));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-slate-500">Insights</p>
          <h1 className="text-xl font-bold text-charcoal">Analytics</h1>
        </div>
        <button className="btn-secondary">Exportar CSV</button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="glass-card p-4">
          <p className="text-xs text-slate-500">Volume do dia</p>
          <div className="text-2xl font-bold text-primary">R$ {Number(data?.todayVolume || 0).toFixed(2)}</div>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-slate-500">Ticket médio</p>
          <div className="text-2xl font-bold text-charcoal">R$ {Number(data?.averageTicket || 0).toFixed(2)}</div>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-slate-500">Produtos quentes</p>
          <div className="text-sm font-semibold text-charcoal">
            {data?.topProducts?.slice(0, 2).map((p) => p.product?.name).join(', ') || '--'}
          </div>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-slate-500">VIPs</p>
          <div className="text-2xl font-bold text-secondary">{data?.vipClients?.length || 0}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="glass-card p-4">
          <h3 className="text-lg font-semibold text-charcoal">Produtos mais vendidos</h3>
          <div className="mt-2 space-y-2">
            {data?.topProducts?.map((p) => (
              <div key={p.productId} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-3 py-2 text-sm">
                <span>{p.product?.name || p.productId}</span>
                <span className="font-semibold text-primary">{p.quantity} un.</span>
              </div>
            )) || <p className="text-sm text-slate-500">Sem dados</p>}
          </div>
        </div>

        <div className="glass-card p-4">
          <h3 className="text-lg font-semibold text-charcoal">Cupons mais usados</h3>
          <div className="mt-2 space-y-2">
            {data?.topCoupons?.map((c: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-3 py-2 text-sm">
                <span>Ticket {c.appliedTicketId}</span>
                <span className="font-semibold text-primary">{c._count._all} usos</span>
              </div>
            )) || <p className="text-sm text-slate-500">Sem dados</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
