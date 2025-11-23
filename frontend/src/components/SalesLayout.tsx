import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const SalesLayout = ({ children }: { children: React.ReactNode }) => {
  const { logout, user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-sand via-white to-secondary/10">
      <header className="sticky top-0 z-20 border-b border-white/50 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-bold text-charcoal">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-white shadow-lg">
              🍢
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-slate-500">Parada do</div>
              <div className="text-lg -mt-1 font-extrabold text-primary">Espetinho</div>
            </div>
          </Link>
          <div className="flex items-center gap-3 text-sm text-slate-700">
            <span className="hidden sm:block">{user?.name || 'Equipe de Vendas'}</span>
            <button onClick={logout} className="btn-ghost">
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 lg:py-10">
        <div className="rounded-3xl bg-white/80 p-6 shadow-2xl ring-1 ring-white/60 backdrop-blur">
          {children}
        </div>
      </main>
    </div>
  );
};
