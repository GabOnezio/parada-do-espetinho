import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadeOut(true), 1400);
    const hideTimer = setTimeout(() => setShowSplash(false), 2000);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-sand via-white to-secondary/10">
      {showSplash && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-white transition-opacity duration-700 ${
            fadeOut ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <img
            src="/icons/Parada%20do%20Espetinho%20com%20p%20bra%C3%A7o.png"
            alt="Parada do Espetinho"
            className="h-full w-full max-h-screen max-w-screen object-contain"
          />
        </div>
      )}
      <header className="mx-auto flex w-full max-w-screen-xl items-center justify-between px-3 py-4 sm:px-4 sm:py-6 min-[1920px]:max-w-[1500px] min-[1920px]:px-10 min-[1920px]:py-8 min-[3840px]:max-w-[2600px] min-[3840px]:px-16 min-[3840px]:py-12">
        <div className="flex items-center gap-2">
          <img
            src="/logo/Parada%20do%20Espetinho%20sem%20o%20bra%C3%A7o%20com%20moldura.png"
            alt="Parada do Espetinho"
            className="h-12 w-12 object-contain sm:h-14 sm:w-14 min-[1920px]:h-24 min-[1920px]:w-24 min-[3840px]:h-40 min-[3840px]:w-40"
          />
          <div>
            <div className="text-xs uppercase tracking-widest text-slate-500 sm:text-sm min-[1920px]:text-2xl min-[3840px]:text-4xl">Parada do</div>
            <div className="text-xl font-extrabold text-primary sm:text-2xl min-[1920px]:text-5xl min-[3840px]:text-7xl">Espetinho</div>
          </div>
        </div>
        <div className="hidden text-sm font-semibold text-slate-600 sm:block sm:text-base min-[1920px]:text-2xl min-[3840px]:text-4xl">
          Escolha como deseja acessar
        </div>
      </header>

      <main className="mx-auto mt-10 flex w-full max-w-screen-xl flex-col gap-8 px-3 pb-12 sm:mt-16 sm:px-4 sm:pb-16 min-[1920px]:mt-28 min-[1920px]:max-w-[1500px] min-[1920px]:gap-12 min-[1920px]:px-10 min-[1920px]:pb-24 min-[3840px]:mt-44 min-[3840px]:max-w-[2600px] min-[3840px]:gap-20 min-[3840px]:px-16 min-[3840px]:pb-32">
        <section className="rounded-3xl bg-white/80 p-8 shadow-2xl ring-1 ring-white/60 backdrop-blur sm:p-10 min-[1920px]:p-16 min-[3840px]:p-28">
          <h1 className="text-4xl font-bold text-charcoal sm:text-5xl min-[1920px]:text-7xl min-[3840px]:text-9xl">Bem-vindo</h1>
          <p className="mt-4 max-w-3xl text-lg text-slate-600 sm:text-xl min-[1920px]:mt-6 min-[1920px]:text-3xl min-[1920px]:max-w-4xl min-[3840px]:text-5xl min-[3840px]:max-w-6xl">
            Selecione a interface que deseja abrir. A Administração leva ao painel completo e Vendas abre o PDV após
            autenticação.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 min-[1920px]:mt-12 min-[1920px]:gap-10 min-[3840px]:mt-20 min-[3840px]:gap-16">
            <Link
              to="/login?next=/admin"
              className="group rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-primary/5 p-8 shadow-xl transition hover:-translate-y-1 hover:shadow-2xl sm:p-10 min-[1920px]:rounded-[28px] min-[1920px]:p-14 min-[1920px]:shadow-2xl min-[3840px]:rounded-[40px] min-[3840px]:p-22"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-charcoal sm:text-3xl min-[1920px]:text-5xl min-[3840px]:text-7xl">
                  Administração
                </h2>
                <span className="text-primary text-2xl sm:text-3xl min-[1920px]:text-5xl min-[3840px]:text-7xl">→</span>
              </div>
              <p className="mt-4 text-base text-slate-600 sm:text-lg min-[1920px]:text-3xl min-[3840px]:text-5xl">
                Acesse o painel completo para gerenciar produtos, clientes, cupons e relatórios.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary sm:text-base min-[1920px]:mt-8 min-[1920px]:px-6 min-[1920px]:py-3 min-[1920px]:text-2xl min-[3840px]:mt-10 min-[3840px]:px-8 min-[3840px]:py-4 min-[3840px]:text-4xl">
                Requer login
              </div>
            </Link>

            <Link
              to="/login?next=/vendas"
              className="group rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-secondary/10 p-8 shadow-xl transition hover:-translate-y-1 hover:shadow-2xl sm:p-10 min-[1920px]:rounded-[28px] min-[1920px]:p-14 min-[1920px]:shadow-2xl min-[3840px]:rounded-[40px] min-[3840px]:p-22"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-charcoal sm:text-3xl min-[1920px]:text-5xl min-[3840px]:text-7xl">
                  Vendas
                </h2>
                <span className="text-secondary text-2xl sm:text-3xl min-[1920px]:text-5xl min-[3840px]:text-7xl">→</span>
              </div>
              <p className="mt-4 text-base text-slate-600 sm:text-lg min-[1920px]:text-3xl min-[3840px]:text-5xl">
                Abra o PDV focado em registrar vendas, aplicar cupons e escolher forma de pagamento.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-secondary/10 px-4 py-2 text-sm font-semibold text-secondary sm:text-base min-[1920px]:mt-8 min-[1920px]:px-6 min-[1920px]:py-3 min-[1920px]:text-2xl min-[3840px]:mt-10 min-[3840px]:px-8 min-[3840px]:py-4 min-[3840px]:text-4xl">
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
