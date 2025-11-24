import React, { useEffect, useState } from 'react';
import api from '../api/client';

type Client = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  totalSpent: number;
  purchaseCount: number;
};

const ClientsPage = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [listLimit, setListLimit] = useState(50);
  const [selected, setSelected] = useState<Client | null>(null);

  const load = async (query?: string, limit?: number) => {
    try {
      const res = await api.get('/clients', { params: { q: query, limit: limit || listLimit } });
      setClients(res.data);
    } catch (err) {
      setClients([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-slate-500">Relacionamento</p>
          <h1 className="text-xl font-bold text-charcoal">Clientes</h1>
        </div>
        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load(search)}
            placeholder="Nome, telefone, CPF..."
            className="w-64 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
          <button className="btn-secondary" onClick={() => load(search)}>
            Buscar
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-charcoal">Filtro de lista</span>
          <span className="text-xs text-slate-600">limite {listLimit}</span>
        </div>
        <input
          type="range"
          min={5}
          max={500}
          value={listLimit}
          onChange={(e) => {
            const v = Number(e.target.value);
            setListLimit(v);
            load(search, v);
          }}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="glass-card p-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-charcoal">Lista</h2>
            <span className="text-xs text-slate-500">{clients.length} clientes</span>
          </div>
          <div className="mt-3 space-y-2">
            {clients.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(c)}
                className="w-full rounded-xl border border-slate-100 bg-white px-4 py-3 text-left shadow-sm transition hover:border-primary/30"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-charcoal">{c.name}</div>
                    <div className="text-xs text-slate-500">{c.email || 'sem email'}</div>
                  </div>
                  <div className="text-right text-sm font-semibold text-primary">
                    R$ {Number(c.totalSpent).toFixed(2)}
                    <div className="text-xs text-slate-500">{c.purchaseCount} compras</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card p-4">
          <h2 className="text-lg font-semibold text-charcoal">Detalhes</h2>
          {selected ? (
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              <div className="font-semibold text-charcoal">{selected.name}</div>
              <div>Email: {selected.email || '—'}</div>
              <div>Telefone: {selected.phone || '—'}</div>
              <div>Total gasto: R$ {Number(selected.totalSpent).toFixed(2)}</div>
              <div>Compras: {selected.purchaseCount}</div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-500">Selecione um cliente para ver detalhes.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientsPage;
