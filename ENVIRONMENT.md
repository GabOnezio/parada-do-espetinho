# Parada do Espetinho – Variáveis de Ambiente (copy/paste)

Use estes valores como referência direta. Ajuste apenas os domínios/hosts conforme o que a Railway e a Vercel mostrarem no painel.

## Backend (Railway)
Coloque estas variáveis no serviço da API:

```
# Banco (use o host/domínio exato exibido no painel Railway)
DATABASE_URL="mysql://root:LlRDCuDPCqplNemagQUefUaMJsnYxcsp@${RAILWAY_TCP_PROXY_DOMAIN}:${RAILWAY_TCP_PROXY_PORT}/railway"
# Se o backend e o MySQL estiverem na mesma rede Railway, pode usar:
# DATABASE_URL="mysql://root:LlRDCuDPCqplNemagQUefUaMJsnYxcsp@${RAILWAY_PRIVATE_DOMAIN}:3306/railway"

JWT_SECRET="troque-esta-chave-secreta-muito-grande"   # coloque uma chave aleatória longa
NODE_ENV="production"

PIX_SERVER_CORS="https://paradadoespetinho.com,https://www.paradadoespetinho.com,https://parada-do-espetinho.vercel.app"
FRONTEND_URL="https://paradadoespetinho.com"
VITE_APP_URL="https://paradadoespetinho.com"

# Deixe vazio no backend (Vercel preenche no front)
VERCEL_URL=""
VERCEL_PROJECT_PRODUCTION_URL=""

# Seed opcional
SEED_ADMIN_EMAIL="admin@paradadoespetinho.com"
SEED_ADMIN_PASSWORD="parada123"
```

### Serviço MySQL (Railway) – Raw Editor
Cole os valores completos (sem placeholders). Ajuste o host/porta do TCP Proxy conforme o painel:

```
MYSQL_DATABASE=railway
MYSQL_ROOT_PASSWORD=LlRDCuDPCqplNemagQUefUaMJsnYxcsp
MYSQLUSER=root
MYSQLPASSWORD=LlRDCuDPCqplNemagQUefUaMJsnYxcsp
MYSQLHOST=mysql.railway.internal
MYSQLPORT=3306
MYSQL_URL=mysql://root:LlRDCuDPCqplNemagQUefUaMJsnYxcsp@mysql.railway.internal:3306/railway

# Preencha com os valores exatos do TCP Proxy mostrados no painel (Networking):
RAILWAY_TCP_PROXY_DOMAIN=<tcp-host>
RAILWAY_TCP_PROXY_PORT=<tcp-port>
MYSQL_PUBLIC_URL=mysql://root:LlRDCuDPCqplNemagQUefUaMJsnYxcsp@<tcp-host>:<tcp-port>/railway
```

## Frontend (Vercel)
Defina em Project Settings → Environment Variables (Production/Preview):

```
VITE_API_URL="https://<subdominio-backend>.up.railway.app/api"   # substitua pelo hostname público da sua API Railway
VITE_APP_URL="https://paradadoespetinho.com"
```

## Desenvolvimento local
Crie/atualize `.env` na raiz para testar com MySQL local ou com o host da Railway:

```
# Backend
DATABASE_URL="mysql://root:LlRDCuDPCqplNemagQUefUaMJsnYxcsp@localhost:3306/railway"  # ou o host Railway
JWT_SECRET="dev-secret-alterar"
NODE_ENV="development"
PORT=3333
PIX_SERVER_CORS="http://localhost:5173,https://paradadoespetinho.com,https://www.paradadoespetinho.com,https://parada-do-espetinho.vercel.app"
FRONTEND_URL="http://localhost:5173"
VITE_APP_URL="http://localhost:5173"

# Frontend
VITE_API_URL="http://localhost:3333/api"
VITE_APP_URL="http://localhost:5173"
```

> Dica: após definir `DATABASE_URL` real, rode `npm run prisma:migrate --workspace backend` e (se quiser o admin padrão) `npm run seed --workspace backend`.

## Como iniciar serviços

- **MySQL (Railway – via TCP Proxy)**  
  Não precisa “subir” manualmente, mas você pode conectar para testar:
  ```sh
  mysql -h <tcp-host> -P <tcp-port> -u root -p LlRDCuDPCqplNemagQUefUaMJsnYxcsp railway
  ```
  (Use o host/porta exibidos no painel do serviço MySQL > Networking > TCP Proxy.)

- **Backend (porta 3333)**  
  ```sh
  cd backend
  npm install
  npm run dev   # roda em http://localhost:3333
  ```

- **Frontend (usando a API em 3333)**  
  ```sh
  cd frontend
  npm install
  VITE_API_URL=http://localhost:3333/api npm run dev -- --host
  ```
