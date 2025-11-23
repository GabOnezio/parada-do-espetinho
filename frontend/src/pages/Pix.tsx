import React, { useEffect, useState } from 'react';
import api from '../api/client';

type PixKey = { id: string; type: string; key: string; isDefault: boolean };

const keyOptions = [
  { value: 'CNPJ', label: 'CNPJ' },
  { value: 'CPF', label: 'CPF' },
  { value: 'PHONE', label: 'NUMERO DE CELULAR' },
  { value: 'ALEATORIA', label: 'CHAVE ALEATÓRIA' },
  { value: 'EMAIL', label: 'EMAIL' }
];

const PixPage = () => {
  const [keys, setKeys] = useState<PixKey[]>([]);
  const [form, setForm] = useState({ type: 'CPF', key: '', isDefault: true });
  const [message, setMessage] = useState('');

  const load = async () => {
    const keysRes = await api.get('/pix/keys');
    setKeys(keysRes.data);
  };

  useEffect(() => {
    load();
  }, []);

  const addKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    try {
      await api.post('/pix/keys', form);
      setForm({ type: 'CPF', key: '', isDefault: false });
      setMessage('Chave salva com sucesso');
      load();
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Erro ao salvar chave');
    }
  };

  const setDefault = async (id: string) => {
    await api.post(`/pix/keys/${id}/default`);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-slate-500">Cobranças</p>
          <h1 className="text-xl font-bold text-charcoal">Pix</h1>
          <p className="text-sm text-slate-600">Cadastre as chaves que ficarão disponíveis no PDV.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="glass-card p-4">
          <h2 className="text-lg font-semibold text-charcoal">Adicionar chave</h2>
          <form className="mt-3 space-y-3" onSubmit={addKey}>
            <div>
              <label className="text-sm text-slate-600">Tipo</label>
              <select
                value={form.type}
                onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
              >
                {keyOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-600">Chave</label>
              <input
                value={form.key}
                onChange={(e) => setForm((p) => ({ ...p, key: e.target.value }))}
                placeholder="Digite a chave"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                required
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => setForm((p) => ({ ...p, isDefault: e.target.checked }))}
              />
              Definir como padrão
            </label>
            {message && <p className="text-xs text-primary">{message}</p>}
            <button className="btn-primary w-full" type="submit">
              Salvar chave
            </button>
          </form>
        </div>

        <div className="glass-card p-4 lg:col-span-2">
          <h2 className="text-lg font-semibold text-charcoal">Chaves cadastradas</h2>
          <div className="mt-3 space-y-2 text-sm">
            {keys.map((k) => (
              <div key={k.id} className="rounded-xl border border-slate-100 bg-white px-3 py-2">
                <div className="flex items-center justify-between font-semibold text-charcoal">
                  <div>
                    <div className="text-xs text-slate-500">{k.type}</div>
                    <div>{k.key}</div>
                  </div>
                  {k.isDefault ? (
                    <span className="rounded-full bg-secondary/10 px-3 py-1 text-xs text-secondary">padrão</span>
                  ) : (
                    <button className="text-xs text-primary" onClick={() => setDefault(k.id)}>
                      tornar padrão
                    </button>
                  )}
                </div>
              </div>
            ))}
            {keys.length === 0 && <p className="text-sm text-slate-500">Nenhuma chave cadastrada ainda.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PixPage;
