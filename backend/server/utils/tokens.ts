import { SignJWT, jwtVerify } from 'jose';
import type { TokenPayload } from '../middlewares/auth.js';
import type { UserRole } from '@prisma/client';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-change-me');

export async function signAccessToken(userId: string, role: UserRole, tokenVersion: number) {
  return new SignJWT({ role, tokenVersion, type: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setExpirationTime('15m')
    .setIssuedAt()
    .sign(JWT_SECRET);
}

export async function signRefreshToken(userId: string, role: UserRole, tokenVersion: number) {
  return new SignJWT({ role, tokenVersion, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(JWT_SECRET);
}

export async function verifyRefreshToken(token: string) {
  return jwtVerify<TokenPayload>(token, JWT_SECRET);
}
