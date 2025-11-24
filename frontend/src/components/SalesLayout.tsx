import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const SalesLayout = ({ children }: { children: React.ReactNode }) => {
  const { logout, user } = useAuth();
  const location = useLocation();
  const isVendas = location.pathname.startsWith('/vendas') || location.pathname.startsWith('/cliente');

  return (
    <div className="min-h-screen bg-gradient-to-br from-sand via-white to-secondary/10">
      <header className="sticky top-0 z-50 border-b border-white/50 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-bold text-charcoal">
            <img
              src="/logo/Parada%20do%20Espetinho%20sem%20o%20bra%C3%A7o%20com%20moldura.png"
              alt="Parada do Espetinho"
              className="h-12 w-12 object-contain"
              loading="lazy"
            />
            <div>
              <div className="text-xs uppercase tracking-widest text-slate-500">Parada do</div>
              <div className="text-lg -mt-1 font-extrabold text-primary">Espetinho</div>
            </div>
          </Link>
          <div className="flex items-center gap-4 text-sm text-slate-700">
            {isVendas && (
              <Link to="/cliente" className="rounded-lg px-3 py-2 text-primary hover:bg-primary/10">
                Cliente
              </Link>
            )}
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
