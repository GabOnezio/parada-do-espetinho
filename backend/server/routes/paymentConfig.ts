import { Router } from 'express';
import { prisma } from '../utils/prisma.js';
import { requireAdmin, requireAuth } from '../middlewares/auth.js';

const router = Router();

// Obtém a configuração (assume loja única, pega o primeiro registro)
router.get('/', requireAuth, requireAdmin, async (_req, res) => {
  const config = await prisma.paymentConfig.findFirst({
    orderBy: { createdAt: 'asc' }
  });
  return res.json(config || null);
});

// Salva/atualiza a configuração (upsert do primeiro registro)
router.put('/', requireAuth, requireAdmin, async (req, res) => {
  const { mpAccessToken, mpPublicKey, mpWebhookSecret, mpNotificationUrl, terminalLabel } = req.body as {
    mpAccessToken?: string;
    mpPublicKey?: string;
    mpWebhookSecret?: string;
    mpNotificationUrl?: string;
    terminalLabel?: string;
  };

  const existing = await prisma.paymentConfig.findFirst({ orderBy: { createdAt: 'asc' } });

  const data = {
    mpAccessToken: mpAccessToken || null,
    mpPublicKey: mpPublicKey || null,
    mpWebhookSecret: mpWebhookSecret || null,
    mpNotificationUrl: mpNotificationUrl || null,
    terminalLabel: terminalLabel || null
  };

  const saved = existing
    ? await prisma.paymentConfig.update({ where: { id: existing.id }, data })
    : await prisma.paymentConfig.create({ data });

  return res.json(saved);
});

export default router;
