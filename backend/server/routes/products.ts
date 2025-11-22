import { Router } from 'express';
import { prisma } from '../utils/prisma.js';
import { requireAdmin, requireAuth } from '../middlewares/auth.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const { q, brand, tag, promotion } = req.query as Record<string, string>;
  const isOnPromotion = promotion === 'true' ? true : promotion === 'false' ? false : undefined;

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      ...(q
        ? {
            OR: [
              { name: { contains: q } },
              { gtin: { contains: q } },
              { brand: { contains: q } }
            ]
          }
        : {}),
      ...(brand ? { brand: { contains: brand } } : {}),
      ...(tag ? { tags: { contains: tag } } : {}),
      ...(isOnPromotion === undefined ? {} : { isOnPromotion })
    },
    orderBy: { createdAt: 'desc' }
  });

  return res.json(products);
});

router.get('/:id', requireAuth, async (req, res) => {
  const product = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!product) return res.status(404).json({ message: 'Produto não encontrado' });
  return res.json(product);
});

router.post('/', requireAdmin, async (req, res) => {
  const data = req.body;
  const product = await prisma.product.create({ data });
  return res.status(201).json(product);
});

router.put('/:id', requireAdmin, async (req, res) => {
  const data = req.body;
  try {
    const product = await prisma.product.update({ where: { id: req.params.id }, data });
    return res.json(product);
  } catch (err) {
    return res.status(404).json({ message: 'Produto não encontrado' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await prisma.product.update({ where: { id: req.params.id }, data: { isActive: false } });
    return res.json({ message: 'Produto desativado' });
  } catch (err) {
    return res.status(404).json({ message: 'Produto não encontrado' });
  }
});

export default router;
