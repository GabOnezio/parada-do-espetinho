import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeClosed } from 'lucide-react';

const LoginPage = () => {
  const { login, verify2fa } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorUserId, setTwoFactorUserId] = useState<string | null>(null);
  const [twoFactorUri, setTwoFactorUri] = useState<string | null>(null);
  const [hideQr, setHideQr] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const nextPath = searchParams.get('next') || '/admin';
  const [showPassword, setShowPassword] = useState(false);
  const panelContext = nextPath.startsWith('/vendas') ? 'VENDAS' : 'ADMIN';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await login({ email, password, context: panelContext });
      if (result?.require2fa && result.userId) {
        setTwoFactorUserId(result.userId);
        setTwoFactorUri(result.otpauthUrl || null);
        setHideQr(false);
      } else {
        navigate(nextPath);
      }
    } catch (err) {
      setError('Credenciais inválidas');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2fa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFactorUserId) return;
    setLoading(true);
    setError('');
    try {
      await verify2fa(twoFactorUserId, twoFactorCode);
      navigate(nextPath);
    } catch (err) {
      setError('Código 2FA incorreto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sand via-white to-secondary/10 flex items-center justify-center px-4">
      <div className="glass-card w-full max-w-5xl p-10 shadow-2xl">
        <h1 className="mb-6 text-center text-2xl font-bold text-charcoal">Parada do Espetinho</h1>
        <p className="mb-6 text-center text-sm text-slate-600">
          {nextPath.startsWith('/vendas') ? 'Acesse o painel de vendas' : 'Acesse o painel admin'}
        </p>

        {!twoFactorUserId ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm text-slate-600">Email</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 focus:border-primary focus:outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
              />
            </div>
            <div>
              <label className="text-sm text-slate-600">Senha</label>
              <div className="mt-1 flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 focus-within:border-primary">
                <input
                  className="w-full focus:outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? 'text' : 'password'}
                  required
                />
                <button
                  type="button"
                  className="ml-2 text-slate-500"
                  onClick={() => setShowPassword((v) => !v)}
                  title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <Eye size={16} /> : <EyeClosed size={16} />}
                </button>
              </div>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify2fa} className="space-y-4">
            <p className="text-sm text-slate-600">Escaneie o QR Code no Authenticator e informe o código 2FA.</p>
            {twoFactorUri && !hideQr && (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white/70 p-4">
                <img
                  alt="QR Code 2FA"
                  src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(twoFactorUri)}&size=320x320`}
                  className="h-80 w-80"
                />
                <button
                  type="button"
                  className="text-xs text-primary underline"
                  onClick={() => setHideQr(true)}
                >
                  Já escaneei, ocultar QR
                </button>
              </div>
            )}
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 focus:border-primary focus:outline-none"
              value={twoFactorCode}
              onChange={(e) => {
                setTwoFactorCode(e.target.value);
                if (e.target.value.trim().length > 0) setHideQr(true);
              }}
              placeholder="000000"
              required
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Validando...' : 'Validar código'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
