import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma.js';
import { requireAdmin, requireAuth } from '../middlewares/auth.js';

const router = Router();

async function countAdmins(excludeId?: string) {
  return prisma.user.count({
    where: { role: 'ADMIN', isActive: true, ...(excludeId ? { id: { not: excludeId } } : {}) }
  });
}

router.get('/', requireAuth, requireAdmin, async (_req, res) => {
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

router.post('/', requireAuth, requireAdmin, async (req, res) => {
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

router.patch('/:id/role', requireAuth, requireAdmin, async (req, res) => {
  const { role } = req.body as { role?: 'ADMIN' | 'EMPLOYEE' };
  if (!role || !['ADMIN', 'EMPLOYEE'].includes(role)) {
    return res.status(400).json({ message: 'Perfil inválido' });
  }

  try {
    const target = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!target) return res.status(404).json({ message: 'Usuário não encontrado' });

    if (target.role === 'ADMIN' && role === 'EMPLOYEE') {
      const admins = await countAdmins(target.id);
      if (admins <= 0) {
        return res.status(400).json({ message: 'Não é possível remover o último admin' });
      }
    }

    const user = await prisma.user.update({ where: { id: req.params.id }, data: { role } });
    return res.json({ id: user.id, role: user.role });
  } catch (err) {
    return res.status(404).json({ message: 'Usuário não encontrado' });
  }
});

router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const target = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!target) return res.status(404).json({ message: 'Usuário não encontrado' });

    if (target.role === 'ADMIN') {
      const admins = await countAdmins(target.id);
      if (admins <= 0) {
        return res.status(400).json({ message: 'Não é possível remover o último admin' });
      }
    }

    await prisma.user.delete({ where: { id: req.params.id } });
    return res.json({ message: 'Usuário removido' });
  } catch (err) {
    return res.status(404).json({ message: 'Usuário não encontrado' });
  }
});

export default router;
