import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { getClients, saveClients } from '../utils/idb';
import { Trash2, ListRestart } from 'lucide-react';

type Client = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  cpf?: string;
  totalSpent: number;
  purchaseCount: number;
};

type FiadoEntry = { id: string; name: string; cpf: string; amount: number; createdAt: number };

const FIADO_CLIENTS_KEY = 'pdv-fiado-clients';
const FIADO_HISTORY_KEY = 'pdv-fiado-history';

const ClientsPage = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [listLimit, setListLimit] = useState(50);
  const [selected, setSelected] = useState<Client | null>(null);
  const [usingLocal, setUsingLocal] = useState(false);
  const [fiadoClients, setFiadoClients] = useState<FiadoEntry[]>([]);
  const [fiadoHistory, setFiadoHistory] = useState<FiadoEntry[]>([]);

  const loadFiado = () => {
    const read = (key: string): FiadoEntry[] => {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    };
    setFiadoClients(read(FIADO_CLIENTS_KEY));
    setFiadoHistory(read(FIADO_HISTORY_KEY));
  };

  const saveFiadoClients = (next: FiadoEntry[]) => {
    setFiadoClients(next);
    localStorage.setItem(FIADO_CLIENTS_KEY, JSON.stringify(next));
  };

  const saveFiadoHistory = (next: FiadoEntry[]) => {
    setFiadoHistory(next);
    localStorage.setItem(FIADO_HISTORY_KEY, JSON.stringify(next));
  };

  const load = async (query?: string, limit?: number) => {
    try {
      const res = await api.get('/clients', { params: { q: query, limit: limit || listLimit } });
      const data: Client[] = res.data;
      if (query && query.trim()) {
        const q = query.trim().toLowerCase();
        const score = (c: Client) => {
          const fields = [c.name, c.email, c.phone, c.cpf].filter(Boolean).map((f) => f!.toLowerCase());
          if (fields.some((f) => f === q)) return 0;
          if (fields.some((f) => f.includes(q))) return 1;
          return 2;
        };
        const sorted = [...data].sort((a, b) => score(a) - score(b));
        setClients(sorted);
      } else {
        setClients(data);
      }
      await saveClients(data);
      setUsingLocal(false);
    } catch (err) {
      // fallback local
      try {
        const local = await getClients();
        setClients(local);
        setUsingLocal(true);
      } catch {
        setClients([]);
        setUsingLocal(true);
      }
    }
  };

  useEffect(() => {
    // primeiro tenta local, depois remoto
    (async () => {
      try {
        const local = await getClients();
        if (local?.length) {
          setClients(local);
          setUsingLocal(true);
        }
      } catch {
        /* ignore */
      }
      load();
      loadFiado();
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-slate-500">Relacionamento</p>
          <h1 className="text-xl font-bold text-charcoal">Clientes</h1>
          {usingLocal && <span className="text-xs text-amber-600">Mostrando dados locais (offline)</span>}
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
        <div className="space-y-4 lg:col-span-2">
          <div className="glass-card p-4">
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

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="glass-card p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-charcoal">CLIENTES QUE DEVEM/FIADO</h2>
                <span className="text-xs text-slate-500">{fiadoClients.length}</span>
              </div>
              {fiadoClients.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">Nenhum cliente em fiado.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {fiadoClients.map((entry) => (
                    <div key={entry.id} className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-charcoal">{entry.name}</div>
                          <div className="text-xs text-slate-500">{entry.cpf}</div>
                        </div>
                        <button
                          className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:border-red-300 hover:text-red-600"
                          title="Remover"
                          onClick={() => {
                            saveFiadoClients(fiadoClients.filter((c) => c.id !== entry.id));
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <span className="text-xs uppercase tracking-wide text-slate-500">Valor devido</span>
                        <input
                          type="number"
                          step="0.01"
                          value={Number(entry.amount).toFixed(2)}
                          onChange={(e) => {
                            const val = Math.max(0, Number(e.target.value) || 0);
                            saveFiadoClients(
                              fiadoClients.map((c) => (c.id === entry.id ? { ...c, amount: val } : c))
                            );
                          }}
                          className="w-32 rounded-lg border border-slate-200 px-2 py-1 text-right font-semibold text-red-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="glass-card p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-charcoal">HISTÓRICO DE DEVIDOS</h2>
                <button
                  className="btn-ghost flex items-center gap-2"
                  onClick={() => saveFiadoHistory([])}
                  title="Limpar histórico"
                >
                  <ListRestart size={16} />
                  Limpar
                </button>
              </div>
              {fiadoHistory.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">Sem histórico.</p>
              ) : (
                <div className="mt-3 max-h-72 space-y-2 overflow-auto">
                  {fiadoHistory.map((entry) => (
                    <div key={entry.id} className="rounded-xl border border-slate-100 bg-white p-3 text-sm shadow-sm">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-semibold text-charcoal">{entry.name}</div>
                          <div className="text-xs text-slate-500">{entry.cpf}</div>
                        </div>
                        <div className="text-right font-semibold text-red-500">R$ {Number(entry.amount).toFixed(2)}</div>
                      </div>
                      <div className="mt-1 text-xs text-slate-400">
                        {new Date(entry.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
