import { Router } from 'express';
import { prisma } from '../utils/prisma.js';
import { requireAuth, requireAdmin } from '../middlewares/auth.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const { q } = req.query as Record<string, string>;
  const clients = await prisma.client.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q } },
            { email: { contains: q } },
            { phone: { contains: q } },
            { cpf: { contains: q } }
          ]
        }
      : {},
    orderBy: { createdAt: 'desc' }
  });
  return res.json(clients);
});

router.get('/ranking', requireAuth, async (req, res) => {
  const { limit } = req.query as Record<string, string>;
  const take = Math.min(Math.max(Number(limit) || 10, 1), 12000);
  const clients = await prisma.client.findMany({
    orderBy: { totalSpent: 'desc' },
    take
  });
  return res.json(clients);
});

router.get('/phone/:phone', requireAuth, async (req, res) => {
  const client = await prisma.client.findFirst({ where: { phone: { contains: req.params.phone } } });
  if (!client) return res.status(404).json({ message: 'Cliente não encontrado' });

  const history = await prisma.sale.findMany({
    where: { clientId: client.id },
    select: { id: true, total: true, createdAt: true, paymentType: true, status: true }
  });

  return res.json({ client, history });
});

router.get('/:id', requireAuth, async (req, res) => {
  const client = await prisma.client.findUnique({
    where: { id: req.params.id },
    include: {
      sales: {
        select: {
          id: true,
          total: true,
          status: true,
          createdAt: true,
          paymentType: true
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });
  if (!client) return res.status(404).json({ message: 'Cliente não encontrado' });
  return res.json(client);
});

router.post('/', requireAuth, async (req, res) => {
  const data = req.body;
  const client = await prisma.client.create({ data });
  return res.status(201).json(client);
});

router.put('/:id', requireAuth, async (req, res) => {
  const data = req.body;
  try {
    const client = await prisma.client.update({ where: { id: req.params.id }, data });
    return res.json(client);
  } catch (err) {
    return res.status(404).json({ message: 'Cliente não encontrado' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await prisma.client.delete({ where: { id: req.params.id } });
    return res.json({ message: 'Cliente removido' });
  } catch (err) {
    return res.status(404).json({ message: 'Cliente não encontrado' });
  }
});

export default router;
