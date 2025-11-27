import React, { useEffect, useState } from 'react';
import api from '../../api/client';

type PaymentConfig = {
  mpAccessToken?: string;
  mpPublicKey?: string;
  mpWebhookSecret?: string;
  mpNotificationUrl?: string;
  terminalLabel?: string;
};

const MachineSettingsPage = () => {
  const [config, setConfig] = useState<PaymentConfig>({
    mpAccessToken: '',
    mpPublicKey: '',
    mpWebhookSecret: '',
    mpNotificationUrl: '',
    terminalLabel: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [testFeedback, setTestFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get('/payment-config');
        if (res.data) setConfig(res.data);
      } catch {
        setStatus('Não foi possível carregar a configuração.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleChange = (field: keyof PaymentConfig, value: string) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      await api.put('/payment-config', config);
      setStatus('Configuração salva com sucesso.');
    } catch (err: any) {
      setStatus('Erro ao salvar configuração.');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!config.terminalLabel?.trim()) {
      setTestFeedback({ type: 'error', message: 'Para Testar coloque o ID do caixa / identificador' });
      return;
    }

    setTesting(true);
    setTestFeedback(null);
    try {
      const res = await api.post('/mp/test-payment');
      setTestFeedback({
        type: 'success',
        message: `Teste OK. Payment id: ${res.data.id}, status: ${res.data.status}`
      });
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Erro ao testar integração.';
      setTestFeedback({ type: 'error', message: msg });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-slate-500">Administração</p>
        <h1 className="text-xl font-bold text-charcoal">Maquininha / Mercado Pago</h1>
      </div>

      <div className="glass-card space-y-4 p-4">
        <h2 className="text-lg font-semibold text-charcoal">Credenciais</h2>
        {loading ? (
          <p className="text-sm text-slate-500">Carregando...</p>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs uppercase tracking-wide text-slate-500">MP_ACCESS_TOKEN</label>
              <input
                value={config.mpAccessToken || ''}
                onChange={(e) => handleChange('mpAccessToken', e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                placeholder="Access Token privado"
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs uppercase tracking-wide text-slate-500">MP_PUBLIC_KEY</label>
                <input
                  value={config.mpPublicKey || ''}
                  onChange={(e) => handleChange('mpPublicKey', e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  placeholder="Chave pública"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-slate-500">MP_WEBHOOK_SECRET</label>
                <input
                  value={config.mpWebhookSecret || ''}
                  onChange={(e) => handleChange('mpWebhookSecret', e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  placeholder="Segredo para validação (opcional)"
                />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs uppercase tracking-wide text-slate-500">Notification URL</label>
                <input
                  value={config.mpNotificationUrl || ''}
                  onChange={(e) => handleChange('mpNotificationUrl', e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  placeholder="https://api.seudominio.com/api/pix/webhook"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-slate-500">ID do caixa / identificador / ID da maquininha</label>
                <input
                  value={config.terminalLabel || ''}
                  onChange={(e) => handleChange('terminalLabel', e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  placeholder="Ex: Caixa1, POS-01..."
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
              {status && <span className="text-sm text-slate-600">{status}</span>}
            </div>
          </div>
        )}
      </div>

      <div className="glass-card space-y-3 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-charcoal">Teste de integração</h2>
          <button className="btn-secondary" onClick={handleTest} disabled={testing}>
            {testing ? 'Testando...' : 'Gerar pagamento de teste (R$ 1,00)'}
          </button>
        </div>
        {testFeedback && (
          <p className={`text-sm ${testFeedback.type === 'error' ? 'text-red-500' : 'text-slate-600'}`}>
            {testFeedback.message}
          </p>
        )}
        <p className="text-xs text-slate-500">
          O teste cria um pagamento PIX de R$ 1,00 via API do Mercado Pago. Use para validar se o Access Token está
          correto e se o webhook está acessível.
        </p>
      </div>
    </div>
  );
};

export default MachineSettingsPage;
