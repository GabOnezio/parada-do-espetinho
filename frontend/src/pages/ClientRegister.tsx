import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { SalesLayout } from '../components/SalesLayout';

const ClientRegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', cpf: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    if (!form.name.trim()) {
      setMessage('Nome é obrigatório');
      return;
    }
    if (!form.email.trim() && !form.phone.trim()) {
      setMessage('Informe email ou telefone');
      return;
    }
    setLoading(true);
    try {
      await api.post('/clients', {
        name: form.name,
        email: form.email || undefined,
        phone: form.phone || undefined,
        cpf: form.cpf || undefined
      });
      setMessage('Cliente cadastrado com sucesso');
      setForm({ name: '', email: '', phone: '', cpf: '' });
      navigate('/vendas');
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Erro ao salvar cliente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SalesLayout>
      <div className="space-y-4">
        <div>
          <p className="text-sm text-slate-500">Cadastro rápido</p>
          <h1 className="text-2xl font-bold text-charcoal">Cliente</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3 max-w-lg">
          <div>
            <label className="text-sm text-slate-600">Nome</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              required
            />
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="text-sm text-slate-600">Email (opcional)</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                type="email"
              />
            </div>
            <div>
              <label className="text-sm text-slate-600">Telefone (opcional)</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="(99) 99999-9999"
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-slate-600">CPF (opcional)</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
              value={form.cpf}
              onChange={(e) => setForm((p) => ({ ...p, cpf: e.target.value }))}
              placeholder="Só se precisar"
            />
          </div>
          {message && <p className="text-sm text-primary">{message}</p>}
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </form>
      </div>
    </SalesLayout>
  );
};

export default ClientRegisterPage;
