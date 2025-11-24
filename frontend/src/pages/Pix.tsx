import React, { useEffect, useMemo, useState } from 'react';
import { Delete } from 'lucide-react';
import api from '../api/client';

type PixKey = { id: string; type: string; key: string; isDefault: boolean };

const keyOptions = [
  { value: 'CNPJ', label: 'CNPJ' },
  { value: 'CPF', label: 'CPF' },
  { value: 'PHONE', label: 'NUMERO DE CELULAR' },
  { value: 'ALEATORIA', label: 'CHAVE ALEATÓRIA' },
  { value: 'EMAIL', label: 'EMAIL' }
];

type FormState = Record<string, string>;

const PixPage = () => {
  const [keys, setKeys] = useState<PixKey[]>([]);
  const [form, setForm] = useState<FormState>({ CNPJ: '', CPF: '', PHONE: '', ALEATORIA: '', EMAIL: '' });
  const [message, setMessage] = useState('');

  const existingTypes = useMemo(() => keys.map((k) => k.type), [keys]);
  const availableOptions = useMemo(
    () => keyOptions.filter((opt) => !existingTypes.includes(opt.value)),
    [existingTypes]
  );

  const load = async () => {
    const keysRes = await api.get('/pix/keys');
    setKeys(keysRes.data);
    const next: FormState = { CNPJ: '', CPF: '', PHONE: '', ALEATORIA: '', EMAIL: '' };
    keysRes.data.forEach((k: PixKey) => {
      next[k.type] = k.key;
    });
    setForm(next);
  };

  useEffect(() => {
    load();
  }, []);

  const saveAll = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    const entries = Object.entries(form).filter(([, val]) => val && val.trim().length > 0);
    if (!entries.length) {
      setMessage('Informe ao menos uma chave Pix');
      return;
    }

    try {
      for (const [type, key] of entries) {
        await api.post('/pix/keys', { type, key, isDefault: false });
      }
      const res = await api.get('/pix/keys');
      const hasDefault = res.data.some((k: PixKey) => k.isDefault);
      if (!hasDefault && res.data.length) {
        await api.post(`/pix/keys/${res.data[0].id}/default`);
      }
      setMessage('Chaves salvas');
      load();
    } catch (err: any) {
      setMessage(err?.response?.data?.message || 'Erro ao salvar');
    }
  };

  const removeKey = async (id: string) => {
    await api.delete(`/pix/keys/${id}`);
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

      <div className="glass-card p-4">
        <h2 className="text-lg font-semibold text-charcoal">Formas de pagamento Pix</h2>
        <form className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2" onSubmit={saveAll}>
          {availableOptions.map((opt) => (
            <div key={opt.value} className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-charcoal">{opt.label}</label>
              <input
                value={form[opt.value] || ''}
                onChange={(e) => setForm((p) => ({ ...p, [opt.value]: e.target.value }))}
                placeholder={`Informe ${opt.label.toLowerCase()}`}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
          ))}
          {message && <p className="text-sm text-primary md:col-span-2">{message}</p>}
          {availableOptions.length > 0 ? (
            <div className="md:col-span-2">
              <button className="btn-primary" type="submit">
                Salvar
              </button>
            </div>
          ) : (
            <p className="text-sm text-slate-500 md:col-span-2">Todas as chaves já foram cadastradas.</p>
          )}
        </form>

        <div className="mt-6 space-y-2 text-sm">
          {keys.map((k) => (
            <div key={k.id} className="rounded-xl border border-slate-100 bg-white px-3 py-2">
              <div className="flex items-center justify-between font-semibold text-charcoal">
                <div>
                  <div className="text-xs text-slate-500">{k.type}</div>
                  <div>{k.key}</div>
                </div>
                <div className="flex items-center gap-3">
                  {k.isDefault ? (
                    <span className="rounded-full bg-secondary/10 px-3 py-1 text-xs text-secondary">padrão</span>
                  ) : (
                    <button className="text-xs text-primary" onClick={() => api.post(`/pix/keys/${k.id}/default`).then(load)}>
                      tornar padrão
                    </button>
                  )}
                  <button className="text-red-500" title="Remover" onClick={() => removeKey(k.id)}>
                    <Delete size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {keys.length === 0 && <p className="text-sm text-slate-500">Nenhuma chave cadastrada ainda.</p>}
        </div>
      </div>
    </div>
  );
};

export default PixPage;
