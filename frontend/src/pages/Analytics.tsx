import React, { useEffect, useMemo, useRef, useState } from 'react';
import api from '../api/client';
import { getLocalSales, getProducts, Product } from '../utils/idb';
import { defaultProducts, mergeWithSeedProducts, readHiddenSeedGtins } from '../data/productSeeds';

type AnalyticsData = {
  todayVolume: number;
  averageTicket: number;
  topProducts: { productId: string; quantity: number; product?: { name: string } }[];
  vipClients: any[];
  topCoupons: any[];
};

const AnalyticsPage = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [usingLocal, setUsingLocal] = useState(false);
  const [inventory, setInventory] = useState<Product[]>([]);
  const [invUsingLocal, setInvUsingLocal] = useState(false);
  const skuSyncedRef = useRef(false);

  const computeFromLocal = async () => {
    try {
      const sales = await getLocalSales();
      const products = await getProducts();
      if (!sales.length) {
        setData(null);
        setUsingLocal(true);
        return;
      }
      const today = new Date();
      const isToday = (ts: number) => {
        const d = new Date(ts);
        return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
      };
      const todaySales = sales.filter((s) => isToday(s.createdAt));
      const todayVolume = todaySales.reduce((sum, s) => sum + s.total, 0);
      const totalVolume = sales.reduce((sum, s) => sum + s.total, 0);
      const averageTicket = sales.length ? totalVolume / sales.length : 0;

      const productMap = new Map<string, Product>();
      products.forEach((p) => productMap.set(p.id, p));
      const productCounts: Record<string, number> = {};
      sales.forEach((s) =>
        s.items.forEach((it) => {
          productCounts[it.productId] = (productCounts[it.productId] || 0) + it.quantity;
        })
      );
      const topProducts = Object.entries(productCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([productId, quantity]) => ({
          productId,
          quantity,
          product: productMap.get(productId) ? { name: productMap.get(productId)!.name } : undefined
        }));

      setData({
        todayVolume,
        averageTicket,
        topProducts,
        vipClients: [],
        topCoupons: []
      });
      setUsingLocal(true);
    } catch {
      setData(null);
      setUsingLocal(true);
    }
  };

  const loadInventory = async () => {
    const hidden = new Set(readHiddenSeedGtins());
    try {
      const res = await api.get('/products');
      const merged = mergeWithSeedProducts<Product>(res.data || [], hidden) as Product[];
      setInventory(merged);
      setInvUsingLocal(false);
    } catch {
      try {
        const local = await getProducts();
        const merged = mergeWithSeedProducts<Product>(local || [], hidden) as Product[];
        setInventory(merged);
        setInvUsingLocal(true);
      } catch {
        const merged = mergeWithSeedProducts<Product>([], hidden) as Product[];
        setInventory(merged);
        setInvUsingLocal(true);
      }
    }
  };

  const syncSkusFromInventory = async (list: Product[]) => {
    if (!list.length || skuSyncedRef.current) return;
    skuSyncedRef.current = true;
    try {
      await api.post('/skus/batch/generate', {
        products: list.map((p) => ({
          id: p.id,
          name: p.name,
          brand: p.brand,
          weight: p.weight || 0,
          measureUnit: p.measureUnit || 'kg',
          price: p.price,
          cost: (p as any).cost,
          gtin: p.gtin
        }))
      });
    } catch {
      // best effort; ignore falha
    }
  };

  useEffect(() => {
    api
      .get('/analytics')
      .then((res) => {
        setData(res.data);
        setUsingLocal(false);
      })
      .catch(() => {
        computeFromLocal();
      });
    loadInventory();
  }, []);

  useEffect(() => {
    if (inventory.length) {
      syncSkusFromInventory(inventory);
    }
  }, [inventory]);

  const invStats = useMemo(() => {
    if (!inventory.length) {
      return {
        totalSkus: 0,
        totalValue: 0,
        avgPrice: 0,
        critical: [] as Product[],
        priceBuckets: { 'Até R$2': 0, 'R$2 - R$5': 0, 'R$5 - R$10': 0, 'R$10 - R$20': 0, 'R$20+': 0 } as Record<string, number>,
        brandMix: [] as Array<{ brand: string; count: number }>
      };
    }
    const priceBuckets = { 'Até R$2': 0, 'R$2 - R$5': 0, 'R$5 - R$10': 0, 'R$10 - R$20': 0, 'R$20+': 0 } as Record<string, number>;
    const brandCounts: Record<string, number> = {};
    let totalValue = 0;
    let totalPrice = 0;

    inventory.forEach((p) => {
      const price = Number(p.price) || 0;
      const stock = Number(p.stock) || 0;
      totalValue += price * stock;
      totalPrice += price;

      if (price <= 2) priceBuckets['Até R$2'] += 1;
      else if (price <= 5) priceBuckets['R$2 - R$5'] += 1;
      else if (price <= 10) priceBuckets['R$5 - R$10'] += 1;
      else if (price <= 20) priceBuckets['R$10 - R$20'] += 1;
      else priceBuckets['R$20+'] += 1;

      const brand = p.brand || '—';
      brandCounts[brand] = (brandCounts[brand] || 0) + 1;
    });

    const critical = inventory
      .filter((p) => (p.stock ?? 0) < (p.stockMin ?? 0))
      .sort((a, b) => (a.stock ?? 0) - (a.stockMin ?? 0));

    const brandMixEntries = Object.entries(brandCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([brand, count]) => ({ brand, count }));
    const rest = Object.entries(brandCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(6)
      .reduce((acc, [, count]) => acc + count, 0);
    if (rest > 0) brandMixEntries.push({ brand: 'Outros', count: rest });

    return {
      totalSkus: inventory.length,
      totalValue,
      avgPrice: totalPrice / inventory.length,
      critical,
      priceBuckets,
      brandMix: brandMixEntries
    };
  }, [inventory]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-slate-500">Insights</p>
          <h1 className="text-xl font-bold text-charcoal">Analytics</h1>
          {usingLocal && <span className="text-xs text-amber-600">Mostrando dados locais (offline)</span>}
        </div>
        <button className="btn-secondary">Exportar CSV</button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="glass-card p-4">
          <p className="text-xs text-slate-500">Volume do dia</p>
          <div className="text-2xl font-bold text-primary">R$ {Number(data?.todayVolume || 0).toFixed(2)}</div>
          <span className="text-[11px] text-slate-500">{usingLocal ? 'Fonte: local' : 'Fonte: servidor'}</span>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-slate-500">Ticket médio</p>
          <div className="text-2xl font-bold text-charcoal">R$ {Number(data?.averageTicket || 0).toFixed(2)}</div>
          <span className="text-[11px] text-slate-500">{usingLocal ? 'Fonte: local' : 'Fonte: servidor'}</span>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-slate-500">Produtos quentes</p>
          <div className="text-sm font-semibold text-charcoal">
            {data?.topProducts?.slice(0, 2).map((p) => p.product?.name).join(', ') || '--'}
          </div>
          <span className="text-[11px] text-slate-500">{usingLocal ? 'Fonte: local' : 'Fonte: servidor'}</span>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-slate-500">VIPs</p>
          <div className="text-2xl font-bold text-secondary">{data?.vipClients?.length || 0}</div>
          <span className="text-[11px] text-slate-500">{usingLocal ? 'Fonte: local' : 'Fonte: servidor'}</span>
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

      <style>
        {`
        @keyframes pulseAlert {
          0% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 0.8; }
        }
        `}
      </style>

      <div className="glass-card p-5 space-y-6 border border-orange-100">
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-orange-500 uppercase">Relatório de Estoque & Precificação</p>
            <h2 className="text-xl font-bold text-charcoal">Auditoria rápida do catálogo</h2>
            <p className="text-xs text-slate-500">{invUsingLocal ? 'Fonte: cache local' : 'Fonte: servidor'} • {invStats.totalSkus} itens</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
            <span className="rounded-full bg-orange-50 px-3 py-1 text-orange-600 border border-orange-100">Visão laranja</span>
            <span className="rounded-full bg-slate-50 px-3 py-1 text-slate-600 border border-slate-100">Responsivo</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-orange-400 p-4 text-white shadow">
            <p className="text-xs uppercase">Total de SKUs</p>
            <div className="text-3xl font-bold">{invStats.totalSkus}</div>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow border border-orange-100">
            <p className="text-xs uppercase text-slate-500">Valor em estoque</p>
            <div className="text-2xl font-bold text-orange-600">R$ {invStats.totalValue.toFixed(2)}</div>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow border border-orange-100 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase text-slate-500">Nível crítico</p>
              <div className="text-2xl font-bold text-red-600">{invStats.critical.length}</div>
              <p className="text-[11px] text-red-500">Estoque &lt; mínimo</p>
            </div>
            <span className="text-3xl animate-[pulseAlert_1.4s_ease-in-out_infinite]">⚠️</span>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow border border-orange-100">
            <p className="text-xs uppercase text-slate-500">Preço médio</p>
            <div className="text-2xl font-bold text-purple-600">R$ {invStats.avgPrice.toFixed(2)}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-4 shadow border border-orange-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-charcoal">🚨 Monitoramento de ruptura</h3>
              <span className="text-xs text-slate-500">{invStats.critical.length} itens</span>
            </div>
            <p className="text-xs text-slate-500 mb-3">Produtos abaixo do estoque mínimo.</p>
            <div className="space-y-2">
              {invStats.critical.slice(0, 8).map((p) => {
                const gap = Math.max(0, (p.stockMin ?? 0) - (p.stock ?? 0));
                const perc = Math.min(100, ((p.stock ?? 0) / Math.max(1, p.stockMin ?? 1)) * 100);
                return (
                  <div key={p.id} className="rounded-xl border border-red-100 bg-red-50/60 p-3">
                    <div className="flex items-center justify-between text-sm font-semibold text-charcoal">
                      <span className="truncate pr-2">{p.name}</span>
                      <span className="text-red-600 flex items-center gap-1">
                        <span className="text-lg animate-[pulseAlert_1.4s_ease-in-out_infinite]">⚠️</span>
                        Faltam {gap} un.
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                      <span>Estoque {p.stock}</span>
                      <span>Min {p.stockMin}</span>
                    </div>
                    <div className="mt-2 h-2 w-full rounded-full bg-white shadow-inner overflow-hidden">
                      <div
                        className="h-full rounded-full bg-orange-500 transition-all"
                        style={{ width: `${perc}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {invStats.critical.length === 0 && <p className="text-sm text-slate-500">Nenhum item crítico.</p>}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow border border-orange-100 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-charcoal">📈 Distribuição de preços</h3>
              <p className="text-xs text-slate-500">Quantidade de produtos por faixa de preço.</p>
              <div className="mt-3 space-y-2">
                {Object.entries(invStats.priceBuckets).map(([label, value]) => {
                  const total = invStats.totalSkus || 1;
                  const perc = Math.min(100, (value / total) * 100);
                  return (
                    <div key={label}>
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>{label}</span>
                        <span>{value}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full bg-orange-500 transition-all" style={{ width: `${perc}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-charcoal">🏭 Mix por fabricante</h3>
              <div className="mt-3 space-y-2">
                {invStats.brandMix.map((b) => {
                  const total = invStats.totalSkus || 1;
                  const perc = Math.min(100, (b.count / total) * 100);
                  return (
                    <div key={b.brand}>
                      <div className="flex justify-between text-xs text-slate-500">
                        <span className="truncate pr-2">{b.brand}</span>
                        <span>{b.count}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-500" style={{ width: `${perc}%` }} />
                      </div>
                    </div>
                  );
                })}
                {invStats.brandMix.length === 0 && <p className="text-sm text-slate-500">Sem dados de marcas.</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow border border-orange-100">
          <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <h3 className="text-lg font-semibold text-charcoal">📋 Detalhamento do inventário</h3>
            <span className="text-xs text-slate-500">Ordenado por estoque crescente</span>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-orange-100 text-orange-800 text-xs uppercase">
                  <th className="px-3 py-2 text-left">GTIN</th>
                  <th className="px-3 py-2 text-left">Produto</th>
                  <th className="px-3 py-2 text-left">Marca</th>
                  <th className="px-3 py-2 text-right">Preço</th>
                  <th className="px-3 py-2 text-center">Estoque</th>
                  <th className="px-3 py-2 text-center">Mínimo</th>
                  <th className="px-3 py-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventory
                  .slice()
                  .sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0))
                  .slice(0, 30)
                  .map((p) => {
                    const isAlert = (p.stock ?? 0) < (p.stockMin ?? 0);
                    return (
                      <tr key={p.id} className={isAlert ? 'bg-red-50' : ''}>
                        <td className="px-3 py-2 font-mono text-xs text-slate-500">{p.gtin || '—'}</td>
                        <td className="px-3 py-2 text-charcoal">{p.name}</td>
                        <td className="px-3 py-2 text-slate-600">{p.brand}</td>
                        <td className="px-3 py-2 text-right text-slate-700">R$ {Number(p.price).toFixed(2)}</td>
                        <td className={`px-3 py-2 text-center ${isAlert ? 'text-red-600 font-semibold' : 'text-slate-700'}`}>{p.stock}</td>
                        <td className="px-3 py-2 text-center text-slate-500">{p.stockMin ?? 0}</td>
                        <td className="px-3 py-2 text-center">
                          {isAlert ? (
                            <span className="px-2 py-1 text-[11px] rounded-full bg-red-100 text-red-700">Repor</span>
                          ) : (
                            <span className="px-2 py-1 text-[11px] rounded-full bg-green-100 text-green-700">Ok</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                {!inventory.length && (
                  <tr>
                    <td colSpan={7} className="px-3 py-4 text-center text-sm text-slate-500">
                      Sem dados de estoque.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
