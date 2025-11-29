import React, { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import api from '../api/client';

type Ticket = {
  id: string;
  code: string;
  discountPercent: number;
  description?: string;
  usageLimit: number;
  usageCount: number;
  isActive: boolean;
};

const CouponsPage = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [form, setForm] = useState({
    code: '',
    discountPercent: 10,
    description: '',
    usageLimit: 100
  });

  const load = async () => {
    try {
      const res = await api.get('/tickets');
      setTickets(res.data);
    } catch (err) {
      setTickets([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/tickets', { ...form, isActive: true, usageCount: 0 });
      setForm({ code: '', discountPercent: 10, description: '', usageLimit: 100 });
      alert('Cupom criado com sucesso!');
      load();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Erro ao criar cupom. Verifique se você tem permissão de administrador.');
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm('Tem certeza que deseja desativar este cupom?')) return;
    try {
      await api.delete(`/tickets/${id}`);
      setTickets((prev) => prev.map((ticket) => (ticket.id === id ? { ...ticket, isActive: false } : ticket)));
    } catch (err) {
      alert('Erro ao desativar cupom');
    }
  };

  const handleActivate = async (id: string) => {
    try {
      const res = await api.put(`/tickets/${id}`, { isActive: true });
      setTickets((prev) => prev.map((ticket) => (ticket.id === id ? { ...ticket, ...res.data } : ticket)));
    } catch (err) {
      alert('Erro ao ativar cupom');
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm('Remover este cupom permanentemente?')) return;
    try {
      await api.delete(`/tickets/${id}?hard=true`);
      setTickets((prev) => prev.filter((ticket) => ticket.id !== id));
    } catch (err) {
      alert('Erro ao remover cupom');
    }
  };

  const activeTickets = tickets.filter((ticket) => ticket.isActive);
  const inactiveTickets = tickets.filter((ticket) => !ticket.isActive);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-slate-500">Campanhas</p>
          <h1 className="text-xl font-bold text-charcoal">Cupons/Tickets</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="glass-card p-4 lg:col-span-1">
          <h2 className="text-lg font-semibold text-charcoal">Criar cupom</h2>
          <form className="mt-4 space-y-3" onSubmit={submit}>
            <input
              placeholder="Código"
              value={form.code}
              onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
              required
            />
            <input
              placeholder="Descrição"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
            <div className="flex gap-2">
              <input
                type="number"
                step="0.01"
                placeholder="% Desconto"
                value={form.discountPercent}
                onChange={(e) => setForm((p) => ({ ...p, discountPercent: Number(e.target.value) }))}
                className="w-1/2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
              <input
                type="number"
                placeholder="Limite uso"
                value={form.usageLimit}
                onChange={(e) => setForm((p) => ({ ...p, usageLimit: Number(e.target.value) }))}
                className="w-1/2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <button type="submit" className="btn-primary w-full">
              Criar
            </button>
          </form>
        </div>

        <div className="glass-card p-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-charcoal">Cupons Ativos e Disponíveis</h2>
              <p className="text-xs text-slate-500">Gerencie as campanhas promocionais ativas no sistema.</p>
            </div>
            <span className="text-xs text-slate-500">{tickets.length} cupons</span>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            {activeTickets.map((t) => (
              <div key={t.id} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-charcoal">{t.code}</div>
                    <div className="text-xs text-slate-500">{t.description}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      -{t.discountPercent}%
                    </span>
                    <button
                      onClick={() => handleDeactivate(t.id)}
                      className="rounded-lg bg-red-50 p-2 text-red-500 transition hover:bg-red-100"
                      title="Desativar cupom"
                      aria-label={`Desativar cupom ${t.code}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Uso: {t.usageCount}/{t.usageLimit}
                  </span>
                </div>
                <button
                  onClick={() => handleDeactivate(t.id)}
                  className="mt-3 w-full rounded-lg border border-red-100 bg-red-50 py-2 text-xs font-semibold uppercase tracking-wide text-red-600 transition hover:bg-red-100"
                >
                  Desativar
                </button>
              </div>
            ))}
            {activeTickets.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                Nenhum cupom ativo no momento.
              </div>
            )}
          </div>
        </div>
      </div>

      {inactiveTickets.length > 0 && (
        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-charcoal">Cupons Inativos</h2>
              <p className="text-xs text-slate-500">Reative ou remova cupons que não estão mais disponíveis.</p>
            </div>
            <span className="text-xs text-slate-500">{inactiveTickets.length} cupons</span>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            {inactiveTickets.map((t) => (
              <div key={t.id} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-charcoal">{t.code}</div>
                    <div className="text-xs text-slate-500">{t.description}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      -{t.discountPercent}%
                    </span>
                    <button
                      onClick={() => handleRemove(t.id)}
                      className="rounded-lg bg-red-50 p-2 text-red-500 transition hover:bg-red-100"
                      title="Excluir cupom"
                      aria-label={`Excluir cupom ${t.code}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="mt-2 text-xs text-slate-500">Uso: {t.usageCount}/{t.usageLimit}</div>
                <button
                  onClick={() => handleActivate(t.id)}
                  className="mt-3 w-full rounded-lg border border-primary/20 bg-primary/10 py-2 text-xs font-semibold uppercase tracking-wide text-primary transition hover:bg-primary/20"
                >
                  Ativar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CouponsPage;
