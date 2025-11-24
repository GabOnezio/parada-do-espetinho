import { Router } from 'express';
import { randomBytes } from 'crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma.js';
import { requireAdmin, requireAuth } from '../middlewares/auth.js';

const router = Router();

// Utilitários para gerar payload BR Code válido (Pix)
const tlv = (id: string, value: string) => `${id}${value.length.toString().padStart(2, '0')}${value}`;

const sanitize = (text: string, max: number) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9 \-\.]/g, '')
    .toUpperCase()
    .slice(0, max);

function crc16(payload: string) {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc <<= 1;
      }
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function buildPixPayload({
  key,
  txId,
  amount,
  description,
  merchantName = 'Parada do Espetinho',
  merchantCity = 'BRASILIA'
}: {
  key: string;
  txId: string;
  amount: number;
  description?: string;
  merchantName?: string;
  merchantCity?: string;
}) {
  const gui = tlv('00', 'BR.GOV.BCB.PIX');
  const keyField = tlv('01', key);
  const descField = description ? tlv('02', sanitize(description, 50)) : '';
  const merchantAccountInfo = tlv('26', `${gui}${keyField}${descField}`);

  const payloadFormatIndicator = tlv('00', '01');
  const pointOfInitiation = tlv('01', '12'); // dinâmica
  const merchantCategoryCode = tlv('52', '0000');
  const transactionCurrency = tlv('53', '986');
  const transactionAmount = tlv('54', Number(amount).toFixed(2));
  const countryCode = tlv('58', 'BR');
  const nameField = tlv('59', sanitize(merchantName, 25) || 'PARADA DO ESPETINHO');
  const cityField = tlv('60', sanitize(merchantCity, 15) || 'BRASILIA');
  const addDataField = tlv('62', tlv('05', sanitize(txId, 25)));

  const withoutCrc =
    payloadFormatIndicator +
    pointOfInitiation +
    merchantAccountInfo +
    merchantCategoryCode +
    transactionCurrency +
    transactionAmount +
    countryCode +
    nameField +
    cityField +
    addDataField +
    '6304';

  const crc = crc16(withoutCrc);
  return withoutCrc + crc;
}

router.get('/keys', requireAuth, async (_req, res) => {
  const keys = await prisma.pixKey.findMany({ orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }] });
  return res.json(keys);
});

const allowedTypes = ['CNPJ', 'CPF', 'PHONE', 'ALEATORIA', 'EMAIL'];

router.post('/keys', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { type, key, isDefault } = req.body as { type: string; key: string; isDefault?: boolean };
    const normalizedType = type?.toUpperCase();

    if (!normalizedType || !key) return res.status(400).json({ message: 'Tipo e chave são obrigatórios' });
    if (!allowedTypes.includes(normalizedType)) return res.status(400).json({ message: 'Tipo de chave inválido' });

    const existingByType = await prisma.pixKey.findFirst({ where: { type: normalizedType } });
    const keyPayload = { type: normalizedType, key, isDefault: !!isDefault };

    if (isDefault) {
      await prisma.pixKey.updateMany({ data: { isDefault: false }, where: {} });
    }

    let result;
    if (existingByType) {
      result = await prisma.pixKey.update({ where: { id: existingByType.id }, data: keyPayload });
    } else {
      result = await prisma.pixKey.create({ data: keyPayload });
    }

    await prisma.auditLog.create({
      data: { type: 'UPDATE_PIX_KEY', userId: req.user?.id, payload: { type: normalizedType, key } }
    });

    return res.status(existingByType ? 200 : 201).json(result);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return res.status(409).json({ message: 'Chave já cadastrada' });
    }
    return res.status(500).json({ message: 'Erro ao salvar chave' });
  }
});

router.post('/keys/:id/default', requireAuth, requireAdmin, async (req, res) => {
  try {
    await prisma.$transaction([
      prisma.pixKey.updateMany({ data: { isDefault: false }, where: {} }),
      prisma.pixKey.update({ where: { id: req.params.id }, data: { isDefault: true } })
    ]);

    await prisma.auditLog.create({
      data: { type: 'SET_DEFAULT_PIX_KEY', userId: req.user?.id, payload: { keyId: req.params.id } }
    });

    return res.json({ message: 'Chave padrão atualizada' });
  } catch (err) {
    return res.status(500).json({ message: 'Erro ao definir padrão' });
  }
});

router.delete('/keys/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await prisma.pixKey.delete({ where: { id: req.params.id } });
    return res.json({ message: 'Chave removida' });
  } catch (err) {
    return res.status(404).json({ message: 'Chave não encontrada' });
  }
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

  const payload = buildPixPayload({
    key: pixKey.key,
    txId,
    amount,
    description: description || 'Parada do Espetinho',
    merchantName: 'Parada do Espetinho',
    merchantCity: 'BRASILIA'
  });

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

  const charge = await prisma.pixCharge.findUnique({ where: { txId }, include: { sale: true } });
  if (!charge) return res.status(404).json({ message: 'Cobrança não encontrada' });

  await prisma.pixCharge.update({ where: { txId }, data: { status } });

  if (charge.saleId && status === 'PAID') {
    await prisma.sale.update({ where: { id: charge.saleId }, data: { status: 'COMPLETED' } });

    // Credita pontos/total para o cliente, se existir na venda
    if (charge.sale?.clientId) {
      await prisma.client.update({
        where: { id: charge.sale.clientId },
        data: {
          totalSpent: { increment: charge.amount },
          purchaseCount: { increment: 1 }
        }
      });
    }
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

router.get('/charges/:txId/status', requireAuth, async (req, res) => {
  const charge = await prisma.pixCharge.findUnique({ where: { txId: req.params.txId } });
  if (!charge) return res.status(404).json({ message: 'Cobrança não encontrada' });
  return res.json({ status: charge.status, amount: charge.amount, saleId: charge.saleId });
});

export default router;
