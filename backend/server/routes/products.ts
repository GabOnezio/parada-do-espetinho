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

router.post('/', requireAuth, requireAdmin, async (req, res) => {
  const { name, brand, gtin, price, cost, weight, stock, stockMin } = req.body as {
    name?: string;
    brand?: string;
    gtin?: string;
    price?: number;
    cost?: number;
    weight?: number;
    stock?: number;
    stockMin?: number;
  };

  if (!name || !brand || !gtin || price === undefined || cost === undefined || weight === undefined) {
    return res.status(400).json({ message: 'Nome, marca, GTIN, preço, custo e peso são obrigatórios' });
  }

  try {
    const product = await prisma.product.create({
      data: {
        name,
        brand,
        gtin,
        price,
        cost,
        weight,
        stock: stock ?? 0,
        stockMin: stockMin ?? 0
      }
    });
    return res.status(201).json(product);
  } catch (err: any) {
    if (err.code === 'P2002') {
      return res.status(409).json({ message: 'GTIN já cadastrado' });
    }
    return res.status(400).json({ message: 'Erro ao salvar produto' });
  }
});

router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  const data = req.body;
  try {
    const product = await prisma.product.update({ where: { id: req.params.id }, data });
    return res.json(product);
  } catch (err) {
    return res.status(404).json({ message: 'Produto não encontrado' });
  }
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await prisma.product.update({ where: { id: req.params.id }, data: { isActive: false } });
    return res.json({ message: 'Produto desativado' });
  } catch (err) {
    return res.status(404).json({ message: 'Produto não encontrado' });
  }
});

export default router;
