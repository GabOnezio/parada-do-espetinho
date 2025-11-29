import type { NextFunction, Request, Response } from 'express';
import { jwtVerify } from 'jose';
import type { JWTPayload } from 'jose';
import { prisma } from '../utils/prisma.js';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-me');

export interface TokenPayload extends JWTPayload {
  sub: string;
  role: string;
  tokenVersion: number;
  type: 'access' | 'refresh';
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token ausente' });
    }

    const token = authHeader.split(' ')[1];
    const { payload } = await jwtVerify<TokenPayload>(token, JWT_SECRET);

    if (payload.type !== 'access') {
      return res.status(401).json({ message: 'Token inválido' });
    }

    let role = payload.role;
    if (!role && payload.sub) {
      const user = await prisma.user.findUnique({
        where: { id: payload.sub as string },
        select: { role: true, isActive: true }
      });

      if (!user || !user.isActive) {
        return res.status(401).json({ message: 'Usuário inválido' });
      }

      role = user.role;
    }

    if (!role) {
      return res.status(401).json({ message: 'Token sem perfil de acesso' });
    }

    req.user = { id: payload.sub as string, role: role as any };
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Não autorizado' });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: 'Não autorizado' });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Acesso restrito a administradores' });
  }

  return next();
}
