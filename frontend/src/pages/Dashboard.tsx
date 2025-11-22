import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import api from '../api/client';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

type TowerPoint = { label: string; total: number };

const DashboardPage = () => {
  const [kpis, setKpis] = useState<any>(null);
  const [tower, setTower] = useState<TowerPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [kpiRes, towerRes] = await Promise.all([api.get('/analytics'), api.get('/analytics/tower')]);
        setKpis(kpiRes.data);
        setTower(towerRes.data);
      } catch (err) {
        setKpis({ todayVolume: 0, averageTicket: 0, topProducts: [], vipClients: [] });
        setTower([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const towerData = {
    labels: tower.map((t) => t.label),
    datasets: [
      {
        label: 'Vendas',
        data: tower.map((t) => t.total),
        backgroundColor: '#f97316'
      }
    ]
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">Visão geral</p>
          <h1 className="text-2xl font-bold text-charcoal">Dashboard</h1>
        </div>
        <div className="rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">Tempo real</div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="glass-card p-4">
          <p className="text-sm text-slate-500">Volume do dia</p>
          <div className="mt-2 text-2xl font-bold text-primary">
            {loading ? '...' : `R$ ${Number(kpis?.todayVolume || 0).toFixed(2)}`}
          </div>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-slate-500">Ticket médio</p>
          <div className="mt-2 text-2xl font-bold text-charcoal">
            {loading ? '...' : `R$ ${Number(kpis?.averageTicket || 0).toFixed(2)}`}
          </div>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-slate-500">Produtos mais vendidos</p>
          <div className="mt-2 text-lg font-semibold text-charcoal">{kpis?.topProducts?.[0]?.product?.name || '--'}</div>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-slate-500">VIPs</p>
          <div className="mt-2 text-2xl font-bold text-secondary">{kpis?.vipClients?.length || 0}</div>
        </div>
      </div>

      <div className="glass-card p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-charcoal">Gráfico torre (vendas por hora)</h2>
          <span className="text-xs text-slate-500">últimos dias</span>
        </div>
        <div className="mt-4">
          <Bar
            data={towerData}
            options={{
              responsive: true,
              plugins: { legend: { display: false } },
              scales: { y: { ticks: { callback: (v) => `R$ ${v}` } } }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
