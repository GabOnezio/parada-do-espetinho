import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma.js';
import { requireAdmin } from '../middlewares/auth.js';

const router = Router();

router.get('/', requireAdmin, async (_req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true
    }
  });
  return res.json(users);
});

router.post('/', requireAdmin, async (req, res) => {
  const { email, password, phone, name } = req.body as {
    email?: string;
    password?: string;
    phone?: string;
    name?: string;
  };

  if (!email || !password) {
    return res.status(400).json({ message: 'Email e senha são obrigatórios' });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ message: 'Email já cadastrado' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: 'EMPLOYEE',
      name: name || email,
      phone,
      isActive: true
    },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      isActive: true,
      createdAt: true
    }
  });

  return res.status(201).json(user);
});

export default router;
