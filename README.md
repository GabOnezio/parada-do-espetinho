# Parada do Espetinho

Base full-stack (Node.js + Express + Prisma + MySQL no backend, React + TypeScript + Vite + Tailwind no frontend) pronta para rodar como PWA em produção.

## Estrutura

- `frontend/` – Vite + React + TS + Tailwind + React Router + PWA (manifest + service worker custom). Deploy alvo: **Vercel**.
- `backend/` – Express + Prisma + jose JWT + otplib (TOTP 2FA) + MySQL. Deploy alvo: **Railway**.
- `railway.toml` – indica raiz do serviço backend e healthcheck.
- `.env.example` – variáveis de ambiente de backend e frontend.

## Scripts (root via npm workspaces)

- `npm install` – instala dependências dos workspaces.
- `npm run dev` – front + back em paralelo.
- `npm run build` – build backend + frontend.
- `npm run lint` – lint em ambos.

### Backend (`npm run <script> --workspace backend`)

- `dev` – `ts-node-dev server/index.ts`
- `build` / `start` – transpila e executa `dist/server/index.js`
- `prisma:migrate` – `prisma migrate deploy`
- `prisma:generate` – gera client
- `seed` – cria admin inicial

### Frontend (`npm run <script> --workspace frontend`)

- `dev` – Vite
- `build` – Vite build
- `preview` – Vite preview

## Variáveis (.env)

Veja `.env.example` e copie para `.env` (backend) e `.env` (frontend) ou defina no provedor:

- Backend: `DATABASE_URL`, `JWT_SECRET`, `PORT`, `PIX_SERVER_CORS`, `FRONTEND_URL`, `VITE_APP_URL`, `VERCEL_URL`, `VERCEL_PROJECT_PRODUCTION_URL`.
- Frontend: `VITE_API_URL`, `VITE_APP_URL`.
- Seed opcional: `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`.

## Backend

1. `cd backend && npm install`
2. Configure `.env`.
3. `npx prisma generate && npx prisma migrate dev` (ou `npm run prisma:migrate` em produção).
4. `npm run seed` para criar admin (`admin@paradadoespetinho.com` / `parada123` por padrão).
5. `npm run dev` ou `npm start` após `npm run build`.

Endpoints principais montados em `/api/*`:

- `/auth` – login + refresh + logout + 2FA setup/confirm/verify + forgot/reset password.
- `/products` – CRUD com busca/soft delete.
- `/clients` – CRUD + ranking + busca por telefone.
- `/sales` – cria venda com itens, cupom, pagamento e lucro; atualiza status; lista por período.
- `/tickets` – CRUD de cupons + validação.
- `/pix` – chaves Pix, geração de payload QR e webhook.
- `/analytics` – KPIs e gráfico torre.
- `/health` – healthcheck.

CORS configurado com origens de env + defaults (`localhost:5173`, domínio Vercel/produção), `trust proxy` ativado, logs `[api]` e `[cors]`.

## Frontend

1. `cd frontend && npm install`
2. Configure `.env` com `VITE_API_URL` apontando para o backend na Railway.
3. `npm run dev` e abra `http://localhost:5173`.

Páginas: Login (com 2FA), Dashboard (KPIs + gráfico torre), Produtos, Clientes, Cupons, Vendas (PDV com carrinho, cupom e pagamento), Pix (chaves + cobranças), Analytics. Layout com topbar, sidebar desktop e bottom-nav mobile.

### PWA

- `public/manifest.webmanifest` com maskable icons, screenshots e cores da marca.
- `public/sw.js` cacheia shell (cache first/stale-while-revalidate para assets, network-first para API GET, ignora POST/PUT/DELETE).
- Registro do SW em `src/main.tsx` apenas em produção.
- Ícones e screenshots placeholder já gerados em `public/icons` e `public/screenshots`.

## Deploy

- **Railway (API/MySQL)**: raiz `backend`, comando sugerido `npm install && npm run prisma:migrate && npm start`, healthcheck `/api/health`, conecte o MySQL e defina `DATABASE_URL` e JWT.
- **Vercel (frontend)**: root `frontend`, build `npm run build`, output `dist`, defina `VITE_API_URL` para o domínio público da Railway. `vercel.json` inclui rewrite SPA.

## Notas

- Prisma schema em `backend/prisma/schema.prisma` cobre usuários, verificação, estoque, clientes, vendas, lucros, Pix (cobranças + chaves) e auditoria.
- Service worker e manifest estão prontos para instalação em `https://paradadoespetinho.com/`.
