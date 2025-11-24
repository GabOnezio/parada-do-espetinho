import React from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import clsx from 'clsx';

const navItems = [
  { to: '/admin', label: 'Dashboard' },
  { to: '/admin/produtos', label: 'Produtos' },
  { to: '/admin/clientes', label: 'Clientes' },
  { to: '/admin/cupons', label: 'Cupons' },
  { to: '/admin/pix', label: 'Pix' },
  { to: '/admin/analytics', label: 'Analytics' },
  { to: '/admin/funcionarios', label: 'Funcionários' }
];

export const AppLayout = () => {
  const { logout, user } = useAuth();

  return (
    <div className="min-h-screen text-slate-800">
      <header className="fixed top-0 z-50 w-full border-b border-white/20 bg-white/70 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-bold text-charcoal">
            <img
              src="/logo/Parada%20do%20Espetinho%20sem%20o%20bra%C3%A7o%20com%20moldura.png"
              alt="Parada do Espetinho"
              className="h-12 w-12 object-contain"
              loading="lazy"
            />
            <div>
              <div className="text-sm uppercase tracking-widest text-slate-500">Parada do</div>
              <div className="text-lg -mt-1 font-extrabold text-primary">Espetinho</div>
            </div>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden sm:block text-slate-600">{user?.name || 'Time'}</span>
            <button onClick={logout} className="btn-ghost">
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-6 px-4 pb-16 pt-24 lg:pt-28">
        <aside className="sticky top-24 hidden h-[calc(100vh-6rem)] w-64 shrink-0 lg:block">
          <div className="glass-card h-full p-4">
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold transition-colors',
                      isActive ? 'bg-primary text-white shadow-lg' : 'hover:bg-white'
                    )
                  }
                >
                  <span>{item.label}</span>
                  <span className="text-xs text-white/80">{'›'}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        </aside>

        <main className="flex-1 space-y-6">
          <Outlet />
        </main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/50 bg-white/90 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-4xl justify-around px-2 py-2 text-xs font-semibold text-slate-700">
          {navItems.slice(0, 4).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  'flex flex-col items-center rounded-lg px-3 py-1',
                  isActive ? 'text-primary bg-primary/10' : 'hover:text-primary'
                )
              }
            >
              <span className="text-lg">•</span>
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};
