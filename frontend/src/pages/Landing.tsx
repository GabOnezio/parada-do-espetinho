import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sand via-white to-secondary/10">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-lg shadow-lg">
            🍢
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-slate-500">Parada do</div>
            <div className="text-xl font-extrabold text-primary">Espetinho</div>
          </div>
        </div>
        <div className="hidden text-sm font-semibold text-slate-600 sm:block">Escolha como deseja acessar</div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pb-16">
        <section className="rounded-3xl bg-white/80 p-8 shadow-2xl ring-1 ring-white/60 backdrop-blur">
          <h1 className="text-3xl font-bold text-charcoal">Bem-vindo</h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Selecione a interface que deseja abrir. A Administração leva ao painel completo e Vendas abre o PDV após
            autenticação.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            <Link
              to="/login?next=/admin"
              className="group rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-primary/5 p-6 shadow-lg transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-charcoal">Administração</h2>
                <span className="text-primary">→</span>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                Acesse o painel completo para gerenciar produtos, clientes, cupons e relatórios.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                Requer login
              </div>
            </Link>

            <Link
              to="/login?next=/vendas"
              className="group rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-secondary/10 p-6 shadow-lg transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-charcoal">Vendas</h2>
                <span className="text-secondary">→</span>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                Abra o PDV focado em registrar vendas, aplicar cupons e escolher forma de pagamento.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-secondary/10 px-3 py-1 text-xs font-semibold text-secondary">
                Requer login
              </div>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LandingPage;
