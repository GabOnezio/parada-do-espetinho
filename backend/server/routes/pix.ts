import { Router } from 'express';
import { randomBytes } from 'crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma.js';
import { requireAdmin, requireAuth } from '../middlewares/auth.js';

const router = Router();

router.get('/keys', requireAuth, async (_req, res) => {
  const keys = await prisma.pixKey.findMany({ orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }] });
  return res.json(keys);
});

router.post('/keys', requireAdmin, async (req, res) => {
  const { type, key, isDefault } = req.body as { type: string; key: string; isDefault?: boolean };
  if (!type || !key) return res.status(400).json({ message: 'Tipo e chave são obrigatórios' });

  const keyPayload = { type, key, isDefault: !!isDefault };

  if (isDefault) {
    await prisma.pixKey.updateMany({ data: { isDefault: false }, where: {} });
  }

  const created = await prisma.pixKey.create({ data: keyPayload });
  await prisma.auditLog.create({
    data: { type: 'UPDATE_PIX_KEY', userId: req.user?.id, payload: { type, key } }
  });

  return res.status(201).json(created);
});

router.post('/keys/:id/default', requireAdmin, async (req, res) => {
  await prisma.$transaction([
    prisma.pixKey.updateMany({ data: { isDefault: false }, where: {} }),
    prisma.pixKey.update({ where: { id: req.params.id }, data: { isDefault: true } })
  ]);

  await prisma.auditLog.create({
    data: { type: 'SET_DEFAULT_PIX_KEY', userId: req.user?.id, payload: { keyId: req.params.id } }
  });

  return res.json({ message: 'Chave padrão atualizada' });
});

router.post('/charges', requireAuth, async (req, res) => {
  const { amount, saleId, description, payerName, payerDocument, pixKeyId } = req.body as {
    amount: number;
    saleId?: string;
    description?: string;
    payerName?: string;
    payerDocument?: string;
    pixKeyId?: string;
  };

  if (!amount) return res.status(400).json({ message: 'Valor é obrigatório' });

  const pixKey = pixKeyId
    ? await prisma.pixKey.findUnique({ where: { id: pixKeyId } })
    : (await prisma.pixKey.findFirst({ where: { isDefault: true } })) ||
      (await prisma.pixKey.findFirst({ orderBy: { createdAt: 'asc' } }));

  if (!pixKey) {
    return res.status(400).json({ message: 'Nenhuma chave Pix cadastrada' });
  }

  const txId = `tx_${randomBytes(6).toString('hex')}`;
  const charge = await prisma.pixCharge.create({
    data: {
      saleId,
      txId,
      amount,
      description,
      payerName,
      payerDocument,
      pixKeyId: pixKey.id,
      status: 'PENDING'
    }
  });

  const payload = `pix://pay?txid=${txId}&amount=${amount}&key=${encodeURIComponent(pixKey.key)}&descr=${encodeURIComponent(
    description || 'Parada do Espetinho'
  )}`;

  return res.status(201).json({
    charge,
    pixKey,
    qrCodePayload: payload,
    message: 'Use este payload para gerar o QR Code dinâmico'
  });
});

router.post('/webhook', async (req, res) => {
  const { txId, status } = req.body as { txId: string; status: 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED' };
  if (!txId || !status) return res.status(400).json({ message: 'txId e status são obrigatórios' });

  const charge = await prisma.pixCharge.findUnique({ where: { txId } });
  if (!charge) return res.status(404).json({ message: 'Cobrança não encontrada' });

  await prisma.pixCharge.update({ where: { txId }, data: { status } });

  if (charge.saleId && status === 'PAID') {
    await prisma.sale.update({ where: { id: charge.saleId }, data: { status: 'COMPLETED' } });
  }

  return res.json({ message: 'Webhook processado' });
});

router.get('/charges', requireAuth, async (_req, res) => {
  const charges = await prisma.pixCharge.findMany({
    include: { sale: true, pixKey: true },
    orderBy: { createdAt: 'desc' },
    take: 50
  });
  return res.json(charges);
});

export default router;
