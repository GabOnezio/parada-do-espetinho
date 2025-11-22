import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const { login, verify2fa } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@paradadoespetinho.com');
  const [password, setPassword] = useState('parada123');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorUserId, setTwoFactorUserId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await login({ email, password });
      if (result?.require2fa && result.userId) {
        setTwoFactorUserId(result.userId);
      } else {
        navigate('/admin');
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
      navigate('/admin');
    } catch (err) {
      setError('Código 2FA incorreto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sand via-white to-secondary/10 flex items-center justify-center px-4">
      <div className="glass-card w-full max-w-md p-8 shadow-2xl">
        <h1 className="mb-6 text-center text-2xl font-bold text-charcoal">Parada do Espetinho</h1>
        <p className="mb-6 text-center text-sm text-slate-600">Acesse o painel admin</p>

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
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 focus:border-primary focus:outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify2fa} className="space-y-4">
            <p className="text-sm text-slate-600">Informe o código 2FA do aplicativo autenticador.</p>
            <input
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 focus:border-primary focus:outline-none"
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value)}
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
