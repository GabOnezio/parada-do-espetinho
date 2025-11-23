import React, { useEffect, useState } from 'react';
import api from '../api/client';

type Employee = {
  id: string;
  email: string;
  phone?: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  name?: string | null;
};

const EmployeesPage = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const load = async () => {
    try {
      const res = await api.get('/users');
      setEmployees(res.data);
    } catch (err) {
      setMessage('Não foi possível carregar os funcionários');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      await api.post('/users', {
        name: form.name || form.email,
        email: form.email,
        phone: form.phone || undefined,
        password: form.password
      });
      setForm({ name: '', email: '', phone: '', password: '' });
      setMessage('Funcionário cadastrado com sucesso');
      load();
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Erro ao cadastrar funcionário');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">Equipe</p>
          <h1 className="text-2xl font-bold text-charcoal">Funcionários</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="glass-card p-5 lg:col-span-1">
          <h2 className="text-lg font-semibold text-charcoal">Adicionar funcionário</h2>
          <p className="text-sm text-slate-600">Informe email, telefone e senha de acesso.</p>
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <div>
              <label className="text-sm text-slate-600">Nome</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Nome do funcionário"
              />
            </div>
            <div>
              <label className="text-sm text-slate-600">Email</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                value={form.email}
                onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                type="email"
                required
              />
            </div>
            <div>
              <label className="text-sm text-slate-600">Telefone</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="(99) 99999-9999"
              />
            </div>
            <div>
              <label className="text-sm text-slate-600">Senha</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                type="password"
                required
              />
            </div>
            {message && <p className="text-sm text-primary">{message}</p>}
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Salvando...' : 'Cadastrar'}
            </button>
          </form>
        </div>

        <div className="glass-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-charcoal">Lista de funcionários</h2>
            <span className="text-xs text-slate-500">{employees.length} registros</span>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm text-slate-700">
              <thead>
                <tr className="text-left text-xs uppercase text-slate-500">
                  <th className="pb-2">Nome</th>
                  <th className="pb-2">Email</th>
                  <th className="pb-2">Telefone</th>
                  <th className="pb-2">Perfil</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Criado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp) => (
                  <tr key={emp.id}>
                    <td className="py-2 font-semibold text-charcoal">{emp.name || '-'}</td>
                    <td className="py-2">{emp.email}</td>
                    <td className="py-2">{emp.phone || '--'}</td>
                    <td className="py-2">{emp.role}</td>
                    <td className="py-2">{emp.isActive ? 'Ativo' : 'Inativo'}</td>
                    <td className="py-2">
                      {new Date(emp.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
                {employees.length === 0 && (
                  <tr>
                    <td className="py-3 text-sm text-slate-500" colSpan={6}>
                      Nenhum funcionário cadastrado.
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

export default EmployeesPage;
