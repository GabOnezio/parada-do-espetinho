import { Router } from 'express';
import { Prisma, PaymentType } from '@prisma/client';
import { prisma } from '../utils/prisma.js';
import { requireAuth } from '../middlewares/auth.js';
import { prismaTransactionWithRetry } from '../utils/prismaTransaction.js';

const router = Router();

router.post('/', requireAuth, async (req, res) => {
  try {
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

    const saleStatus = paymentType === 'PIX' ? 'PENDING' : 'COMPLETED';

    const itemsOrdered = [...items].sort((a, b) => a.productId.localeCompare(b.productId));

    const sale = await prismaTransactionWithRetry(prisma, async (tx: Prisma.TransactionClient) => {
      const createdSale = await tx.sale.create({
        data: {
          userId: req.user!.id,
          clientId,
          appliedTicketId: ticket?.id,
          total,
          paymentType,
          totalDiscount: discount,
          status: saleStatus,
          saleItems: {
            create: itemsOrdered.map((i) => {
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

      // Atualiza estoque e contadores APENAS se venda for COMPLETED
      if (saleStatus === 'COMPLETED') {
        for (const item of itemsOrdered) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } }
          });
        }
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
  } catch (err: any) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2034') {
      return res.status(409).json({
        message: 'Conflito ao registrar venda (estoque concorrente). Tente novamente.'
      });
    }
    console.error(err);
    return res.status(500).json({ message: 'Erro ao registrar venda' });
  }
});

router.patch('/:id/status', requireAuth, async (req, res) => {
  const { status } = req.body as { status: 'PENDING' | 'COMPLETED' | 'CANCELLED' };

  try {
    const result = await prismaTransactionWithRetry(prisma, async (tx) => {
      const existingSale = await tx.sale.findUnique({
        where: { id: req.params.id },
        include: { saleItems: true }
      });

      if (!existingSale) throw new Error('Venda não encontrada');

      const oldStatus = existingSale.status;

      // Se não houve mudança de status, retorna a venda atual
      if (oldStatus === status) return existingSale;

      // Lógica de estoque
      // 1. Se mudou PARA COMPLETED (de qualquer outro status) -> Deduz estoque
      if (status === 'COMPLETED' && oldStatus !== 'COMPLETED') {
        const ordered = [...existingSale.saleItems].sort((a, b) => a.productId.localeCompare(b.productId));
        for (const item of ordered) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } }
          });
        }
      }
      // 2. Se mudou DE COMPLETED (para qualquer outro status) -> Restaura estoque
      else if (oldStatus === 'COMPLETED' && status !== 'COMPLETED') {
        const ordered = [...existingSale.saleItems].sort((a, b) => a.productId.localeCompare(b.productId));
        for (const item of ordered) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } }
          });
        }
      }

      const updatedSale = await tx.sale.update({
        where: { id: req.params.id },
        data: { status }
      });

      return updatedSale;
    });

    return res.json(result);
  } catch (err: any) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2034') {
      return res.status(409).json({
        message: 'Conflito ao atualizar status (estoque concorrente). Tente novamente.'
      });
    }
    const statusCode = err?.message === 'Venda não encontrada' ? 404 : 400;
    return res.status(statusCode).json({ message: err.message || 'Erro ao atualizar venda' });
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
