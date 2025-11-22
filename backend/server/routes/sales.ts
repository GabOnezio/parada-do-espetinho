import { Router } from 'express';
import { Prisma, PaymentType } from '@prisma/client';
import { prisma } from '../utils/prisma.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.post('/', requireAuth, async (req, res) => {
  const { items, clientId, couponCode, paymentType } = req.body as {
    items: { productId: string; quantity: number }[];
    clientId?: string;
    couponCode?: string;
    paymentType: PaymentType;
  };

  if (!items || !items.length) {
    return res.status(400).json({ message: 'Nenhum item informado' });
  }

  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });

  if (products.length !== productIds.length) {
    return res.status(400).json({ message: 'Produto inválido' });
  }

  const now = new Date();
  let ticket = null as null | { id: string; discountPercent: Prisma.Decimal };

  if (couponCode) {
    const promo = await prisma.promotionalTicket.findUnique({ where: { code: couponCode } });
    if (!promo || !promo.isActive) {
      return res.status(400).json({ message: 'Cupom inválido' });
    }
    if (promo.validFrom && promo.validFrom > now) {
      return res.status(400).json({ message: 'Cupom ainda não disponível' });
    }
    if (promo.validUntil && promo.validUntil < now) {
      return res.status(400).json({ message: 'Cupom expirado' });
    }
    if (promo.usageLimit > 0 && promo.usageCount >= promo.usageLimit) {
      return res.status(400).json({ message: 'Limite de uso do cupom atingido' });
    }
    ticket = { id: promo.id, discountPercent: promo.discountPercent };
  }

  let subtotal = new Prisma.Decimal(0);
  let totalCost = new Prisma.Decimal(0);

  items.forEach((item) => {
    const product = products.find((p) => p.id === item.productId)!;
    const price = new Prisma.Decimal(product.price);
    const lineTotal = price.mul(item.quantity);
    subtotal = subtotal.add(lineTotal);

    const cost = new Prisma.Decimal(product.cost);
    totalCost = totalCost.add(cost.mul(item.quantity));
  });

  const discount = ticket
    ? subtotal.mul(new Prisma.Decimal(ticket.discountPercent).div(new Prisma.Decimal(100)))
    : new Prisma.Decimal(0);
  const total = subtotal.sub(discount);

  const sale = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const createdSale = await tx.sale.create({
      data: {
        userId: req.user!.id,
        clientId,
        appliedTicketId: ticket?.id,
        total,
        paymentType,
        totalDiscount: discount,
        status: 'COMPLETED',
        saleItems: {
          create: items.map((i) => {
            const product = products.find((p) => p.id === i.productId)!;
            return {
              productId: product.id,
              quantity: i.quantity,
              price: product.price
            };
          })
        }
      },
      include: { saleItems: true }
    });

    // Atualiza estoque e contadores
    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } }
      });
    }

    if (clientId) {
      await tx.client.update({
        where: { id: clientId },
        data: {
          totalSpent: { increment: total },
          purchaseCount: { increment: 1 },
          isPremium: { set: true },
          premiumSince: { set: new Date() }
        }
      });
    }

    if (ticket) {
      await tx.promotionalTicket.update({
        where: { id: ticket.id },
        data: { usageCount: { increment: 1 } }
      });
    }

    // Lucro aproximado
    await tx.profit.create({
      data: {
        saleId: createdSale.id,
        userId: req.user!.id,
        amount: total.sub(totalCost)
      }
    });

    return createdSale;
  });

  return res.status(201).json(sale);
});

router.patch('/:id/status', requireAuth, async (req, res) => {
  const { status } = req.body as { status: 'PENDING' | 'COMPLETED' | 'CANCELLED' };
  try {
    const sale = await prisma.sale.update({
      where: { id: req.params.id },
      data: { status }
    });
    return res.json(sale);
  } catch (err) {
    return res.status(404).json({ message: 'Venda não encontrada' });
  }
});

router.get('/', requireAuth, async (req, res) => {
  const { start, end, status } = req.query as Record<string, string>;
  const where: Prisma.SaleWhereInput = {};

  if (start || end) {
    where.createdAt = {
      gte: start ? new Date(start) : undefined,
      lte: end ? new Date(end) : undefined
    };
  }

  if (status) where.status = status as any;

  const sales = await prisma.sale.findMany({
    where,
    include: {
      saleItems: { include: { product: true } },
      client: true,
      appliedTicket: true
    },
    orderBy: { createdAt: 'desc' }
  });

  return res.json(sales);
});

export default router;
