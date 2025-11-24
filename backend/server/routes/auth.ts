import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { authenticator } from 'otplib';
import { randomBytes } from 'crypto';
import { prisma } from '../utils/prisma.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/tokens.js';
import { requireAuth } from '../middlewares/auth.js';

authenticator.options = { window: 1 };

const router = Router();

router.post('/login', async (req, res) => {
  const { email, password, totp, context } = req.body as {
    email: string;
    password: string;
    totp?: string;
    context?: 'ADMIN' | 'VENDAS';
  };
  const issuerLabel = context === 'VENDAS' ? 'Parada do Espetinho Vendas' : 'Parada do Espetinho Adm';

  if (!email || !password) {
    return res.status(400).json({ message: 'Email e senha são obrigatórios' });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    return res.status(401).json({ message: 'Credenciais inválidas' });
  }

  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) {
    return res.status(401).json({ message: 'Credenciais inválidas' });
  }

  // Enforce 2FA: separa secret por contexto (admin vs vendas)
  const secretField = context === 'VENDAS' ? 'twoFactorSecretSales' : 'twoFactorSecret';
  const currentSecret = (user as any)[secretField] as string | null;

  if (!currentSecret) {
    if (!totp) {
      const secret = authenticator.generateSecret();
      await prisma.user.update({ where: { id: user.id }, data: { [secretField]: secret } });
      const otpauthUrl = authenticator.keyuri(user.email, issuerLabel, secret);
      return res
        .status(200)
        .json({ require2fa: true, userId: user.id, otpauthUrl, message: 'Escaneie o QR Code e informe o código 2FA' });
    }
  } else {
    if (!totp) {
      const otpauthUrl = authenticator.keyuri(user.email, issuerLabel, currentSecret);
      return res
        .status(200)
        .json({ require2fa: true, userId: user.id, otpauthUrl, message: 'Informe o código 2FA do autenticador' });
    }
  }

  // Validar o código com a secret do contexto
  const secretToUse = currentSecret || (await prisma.user.findUnique({ where: { id: user.id } }))?.[secretField];
  if (!secretToUse || !totp || !authenticator.verify({ token: totp, secret: secretToUse })) {
    return res.status(401).json({ message: 'Código 2FA incorreto' });
  }

  const accessToken = await signAccessToken(user.id, user.role, user.refreshTokenVersion);
  const refreshToken = await signRefreshToken(user.id, user.role, user.refreshTokenVersion);

  return res.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    accessToken,
    refreshToken
  });
});

router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body as { refreshToken: string };

  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token é obrigatório' });
  }

  try {
    const { payload } = await verifyRefreshToken(refreshToken);
    if (payload.type !== 'refresh' || !payload.sub) {
      return res.status(401).json({ message: 'Token inválido' });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub.toString() } });
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Usuário não encontrado' });
    }

    if (user.refreshTokenVersion !== payload.tokenVersion) {
      return res.status(401).json({ message: 'Token expirado' });
    }

    const newAccessToken = await signAccessToken(user.id, user.role, user.refreshTokenVersion);
    const newRefreshToken = await signRefreshToken(user.id, user.role, user.refreshTokenVersion);

    return res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido' });
  }
});

router.post('/logout', requireAuth, async (req, res) => {
  await prisma.user.update({
    where: { id: req.user!.id },
    data: { refreshTokenVersion: { increment: 1 } }
  });
  return res.json({ message: 'Sessão encerrada' });
});

router.post('/2fa/setup', requireAuth, async (req, res) => {
  const secret = authenticator.generateSecret();
  const otpauthUrl = authenticator.keyuri(req.user!.id, 'Parada do Espetinho', secret);
  return res.json({ secret, otpauthUrl });
});

router.post('/2fa/confirm', requireAuth, async (req, res) => {
  const { secret, code } = req.body as { secret: string; code: string };
  if (!secret || !code) {
    return res.status(400).json({ message: 'Secret e código são obrigatórios' });
  }

  const isValid = authenticator.verify({ token: code, secret });
  if (!isValid) {
    return res.status(400).json({ message: 'Código 2FA inválido' });
  }

  await prisma.user.update({
    where: { id: req.user!.id },
    data: { twoFactorSecret: secret }
  });

  return res.json({ message: '2FA ativado com sucesso' });
});

router.post('/2fa/verify', async (req, res) => {
  const { userId, code } = req.body as { userId: string; code: string };
  if (!userId || !code) {
    return res.status(400).json({ message: 'userId e código são obrigatórios' });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.twoFactorSecret) {
    return res.status(400).json({ message: 'Usuário sem 2FA configurado' });
  }

  const isValid = authenticator.verify({ token: code, secret: user.twoFactorSecret });
  if (!isValid) {
    return res.status(401).json({ message: 'Código 2FA inválido' });
  }

  const accessToken = await signAccessToken(user.id, user.role, user.refreshTokenVersion);
  const refreshToken = await signRefreshToken(user.id, user.role, user.refreshTokenVersion);

  return res.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    accessToken,
    refreshToken
  });
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body as { email: string };
  if (!email) {
    return res.status(400).json({ message: 'Email é obrigatório' });
  }

  const code = randomBytes(3).toString('hex');
  const expiresAt = new Date(Date.now() + 1000 * 60 * 15);

  await prisma.verificationCode.create({
    data: {
      email,
      code,
      type: 'PASSWORD_RESET',
      expiresAt
    }
  });

  // Em produção integre com serviço de email. Aqui apenas simulamos.
  console.log(`[forgot-password] Código gerado para ${email}: ${code}`);
  return res.json({ message: 'Se o email existir, o código foi enviado', code });
});

router.post('/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body as { email: string; code: string; newPassword: string };
  if (!email || !code || !newPassword) {
    return res.status(400).json({ message: 'Email, código e nova senha são obrigatórios' });
  }

  const record = await prisma.verificationCode.findFirst({
    where: {
      email,
      code,
      type: 'PASSWORD_RESET',
      expiresAt: { gt: new Date() }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (!record) {
    return res.status(400).json({ message: 'Código inválido ou expirado' });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { email }, data: { passwordHash } });

  return res.json({ message: 'Senha alterada com sucesso' });
});

export default router;
