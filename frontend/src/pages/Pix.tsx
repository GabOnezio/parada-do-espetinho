import React, { useEffect, useState } from 'react';
import api from '../api/client';

type PixKey = { id: string; type: string; key: string; isDefault: boolean };
type Charge = { id: string; txId: string; amount: number; status: string; createdAt: string; description?: string };

const PixPage = () => {
  const [keys, setKeys] = useState<PixKey[]>([]);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [form, setForm] = useState({ type: 'aleatoria', key: '', isDefault: true });
  const [chargeForm, setChargeForm] = useState({ amount: 25, description: 'Espetinho' });
  const [payload, setPayload] = useState('');

  const load = async () => {
    const [keysRes, chargesRes] = await Promise.all([api.get('/pix/keys'), api.get('/pix/charges')]);
    setKeys(keysRes.data);
    setCharges(chargesRes.data);
  };

  useEffect(() => {
    load();
  }, []);

  const addKey = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/pix/keys', form);
    setForm({ type: 'aleatoria', key: '', isDefault: false });
    load();
  };

  const setDefault = async (id: string) => {
    await api.post(`/pix/keys/${id}/default`);
    load();
  };

  const createCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await api.post('/pix/charges', chargeForm);
    setPayload(res.data.qrCodePayload);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-slate-500">Cobranças</p>
          <h1 className="text-xl font-bold text-charcoal">Pix</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="glass-card p-4">
          <h2 className="text-lg font-semibold text-charcoal">Chaves Pix</h2>
          <form className="mt-3 space-y-3" onSubmit={addKey}>
            <input
              value={form.type}
              onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
              placeholder="Tipo (cpf, email, aleatória)"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
            <input
              value={form.key}
              onChange={(e) => setForm((p) => ({ ...p, key: e.target.value }))}
              placeholder="Chave"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => setForm((p) => ({ ...p, isDefault: e.target.checked }))}
              />
              Definir como padrão
            </label>
            <button className="btn-primary w-full" type="submit">
              Registrar chave
            </button>
          </form>

          <div className="mt-4 space-y-2 text-sm">
            {keys.map((k) => (
              <div key={k.id} className="rounded-xl border border-slate-100 bg-white px-3 py-2">
                <div className="flex items-center justify-between font-semibold text-charcoal">
                  {k.key}
                  {k.isDefault ? (
                    <span className="rounded-full bg-secondary/10 px-3 py-1 text-xs text-secondary">padrão</span>
                  ) : (
                    <button className="text-xs text-primary" onClick={() => setDefault(k.id)}>
                      tornar padrão
                    </button>
                  )}
                </div>
                <div className="text-xs text-slate-500">{k.type}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-4 lg:col-span-2">
          <h2 className="text-lg font-semibold text-charcoal">Nova cobrança</h2>
          <form className="mt-3 flex flex-col gap-3 md:flex-row" onSubmit={createCharge}>
            <input
              type="number"
              step="0.01"
              value={chargeForm.amount}
              onChange={(e) => setChargeForm((p) => ({ ...p, amount: Number(e.target.value) }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none md:w-32"
            />
            <input
              value={chargeForm.description}
              onChange={(e) => setChargeForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Descrição"
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
            <button type="submit" className="btn-primary">
              Gerar QR Code
            </button>
          </form>
          {payload && (
            <div className="mt-3 rounded-xl bg-white p-3 text-xs text-slate-700">
              <p className="font-semibold text-charcoal">Payload para QR Code</p>
              <code className="block break-words text-[10px] text-slate-600">{payload}</code>
            </div>
          )}

          <div className="mt-6">
            <h3 className="text-sm font-semibold text-charcoal">Últimas cobranças</h3>
            <div className="mt-2 space-y-2">
              {charges.map((c) => (
                <div key={c.id} className="rounded-xl border border-slate-100 bg-white px-3 py-2 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-charcoal">R$ {Number(c.amount).toFixed(2)}</div>
                    <span
                      className={`rounded-full px-2 py-1 text-[11px] ${
                        c.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    txId {c.txId} • {new Date(c.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PixPage;
