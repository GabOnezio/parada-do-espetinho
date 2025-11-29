import { Router } from 'express';
import { prisma } from '../utils/prisma.js';
import { requireAdmin, requireAuth } from '../middlewares/auth.js';

const router = Router();

router.get('/', requireAuth, async (_req, res) => {
  const tickets = await prisma.promotionalTicket.findMany({ orderBy: { createdAt: 'desc' } });
  return res.json(tickets);
});

router.get('/validate', requireAuth, async (req, res) => {
  const { code } = req.query as { code?: string };
  if (!code) return res.status(400).json({ message: 'Código é obrigatório' });

  const ticket = await prisma.promotionalTicket.findUnique({ where: { code } });
  if (!ticket || !ticket.isActive) return res.status(404).json({ message: 'Cupom inválido' });

  const now = new Date();
  if (ticket.validFrom && ticket.validFrom > now) return res.status(400).json({ message: 'Cupom ainda não disponível' });
  if (ticket.validUntil && ticket.validUntil < now) return res.status(400).json({ message: 'Cupom expirado' });
  if (ticket.usageLimit > 0 && ticket.usageCount >= ticket.usageLimit) {
    return res.status(400).json({ message: 'Limite de uso atingido' });
  }

  return res.json(ticket);
});

router.post('/', requireAuth, requireAdmin, async (req, res) => {
  const data = req.body;
  const ticket = await prisma.promotionalTicket.create({ data });
  return res.status(201).json(ticket);
});

router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const ticket = await prisma.promotionalTicket.update({ where: { id: req.params.id }, data: req.body });
    return res.json(ticket);
  } catch (err) {
    return res.status(404).json({ message: 'Cupom não encontrado' });
  }
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  const { hard } = req.query as { hard?: string };

  try {
    if (hard === 'true') {
      await prisma.$transaction([
        prisma.clientTicket.deleteMany({ where: { ticketId: req.params.id } }),
        prisma.sale.updateMany({ where: { appliedTicketId: req.params.id }, data: { appliedTicketId: null } }),
        prisma.promotionalTicket.delete({ where: { id: req.params.id } })
      ]);
      return res.json({ message: 'Cupom removido' });
    }

    await prisma.promotionalTicket.update({
      where: { id: req.params.id },
      data: { isActive: false }
    });
    return res.json({ message: 'Cupom desativado' });
  } catch (err) {
    return res.status(404).json({ message: 'Cupom não encontrado' });
  }
});

export default router;
