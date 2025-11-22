import { Router } from 'express';
import { prisma } from '../utils/prisma.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.get('/', requireAuth, async (_req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [todaySales, avgTicket, topProducts, vipClients, topCoupons] = await Promise.all([
    prisma.sale.aggregate({
      _sum: { total: true },
      where: { createdAt: { gte: today }, status: 'COMPLETED' }
    }),
    prisma.sale.aggregate({
      _avg: { total: true },
      where: { status: 'COMPLETED' }
    }),
    prisma.saleItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5
    }),
    prisma.client.findMany({
      where: { isPremium: true },
      orderBy: { totalSpent: 'desc' },
      take: 5
    }),
    prisma.sale.groupBy({
      by: ['appliedTicketId'],
      _count: { _all: true },
      where: { appliedTicketId: { not: null } },
      orderBy: { _count: { appliedTicketId: 'desc' } },
      take: 5
    })
  ]);

  const productIds = topProducts.map((p: { productId: string }) => p.productId);
  const productMap = productIds.length
    ? await prisma.product.findMany({ where: { id: { in: productIds } } })
    : [];

  return res.json({
    todayVolume: todaySales._sum.total || 0,
    averageTicket: avgTicket._avg.total || 0,
    topProducts: topProducts.map((p: { productId: string; _sum: { quantity: number | null } }) => ({
      productId: p.productId,
      quantity: p._sum.quantity || 0,
      product: productMap.find((m) => m.id === p.productId)
    })),
    vipClients,
    topCoupons: topCoupons
  });
});

router.get('/tower', requireAuth, async (req, res) => {
  const { start, end } = req.query as Record<string, string>;
  const startDate = start ? new Date(start) : new Date(Date.now() - 1000 * 60 * 60 * 24 * 7);
  const endDate = end ? new Date(end) : new Date();

  const sales = await prisma.sale.findMany({
    where: { createdAt: { gte: startDate, lte: endDate }, status: 'COMPLETED' },
    select: { createdAt: true, total: true }
  });

  const buckets = new Map<string, number>();
  for (const sale of sales) {
    const hour = sale.createdAt.getHours().toString().padStart(2, '0');
    const key = `${hour}:00`;
    buckets.set(key, (buckets.get(key) || 0) + Number(sale.total));
  }

  const entries = Array.from(buckets.entries()).sort(([a], [b]) => (a > b ? 1 : -1));
  return res.json(entries.map(([label, total]) => ({ label, total })));
});

export default router;
