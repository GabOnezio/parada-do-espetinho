import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import express from 'express';
import cors, { CorsOptions } from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import clientRoutes from './routes/clients.js';
import salesRoutes from './routes/sales.js';
import ticketRoutes from './routes/tickets.js';
import pixRoutes from './routes/pix.js';
import analyticsRoutes from './routes/analytics.js';
import usersRoutes from './routes/users.js';

// Carrega .env a partir da raiz do monorepo ou do workspace backend
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../.env')
];
for (const envPath of envPaths) {
  const result = dotenv.config({ path: envPath, override: true });
  if (!result.error) break;
}
if (!process.env.DATABASE_URL) {
  console.warn('[env] DATABASE_URL não encontrada; defina uma URL mysql:// válida.');
}

const app = express();
app.set('trust proxy', 1);

const defaultOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  'https://api.paradadoespetinho.com',
  'https://parada-do-espetinho.vercel.app',
  'https://paradadoespetinho.com',
  'https://www.paradadoespetinho.com'
];

const envOrigins = [
  process.env.PIX_SERVER_CORS,
  process.env.FRONTEND_URL,
  process.env.VITE_APP_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined
]
  .filter(Boolean)
  .flatMap((value) => value!.split(',').map((o) => o.trim()));

const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins])).filter(Boolean);
console.log('[cors] allowed origins =>', allowedOrigins);

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app') || origin.endsWith('.paradadoespetinho.com')) {
      return callback(null, true);
    }
    console.warn('[cors] origin blocked:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  morgan((tokens, req, res) => {
    return `[api] ${tokens.method(req, res)} ${tokens.url(req, res)} ${tokens.status(req, res)} ${
      tokens['response-time'](req, res) || 0
    }ms`;
  })
);

app.get('/api/health', (_req, res) => {
  return res.json({ status: 'ok', uptime: process.uptime(), version: process.env.npm_package_version || '0.1.0' });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/pix', pixRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', usersRoutes);

app.use((_req, res) => {
  return res.status(404).json({ message: 'Not found' });
});

const port = Number(process.env.PORT) || 3333;
app.listen(port, '0.0.0.0', () => {
  console.log(`[api] running on port ${port}`);
});
