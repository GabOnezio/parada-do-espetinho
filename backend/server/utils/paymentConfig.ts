import { PaymentConfig } from '@prisma/client';
import { prisma } from './prisma.js';

function buildEnvConfig(): PaymentConfig | null {
  const envAccessToken = process.env.MP_ACCESS_TOKEN || null;
  const envPublicKey = process.env.MP_PUBLIC_KEY || null;
  const envWebhookSecret = process.env.MP_WEBHOOK_SECRET || null;
  const envNotificationUrl = process.env.MP_NOTIFICATION_URL || null;
  const envTerminalLabel = process.env.MP_TERMINAL_LABEL || null;

  const hasAny = envAccessToken || envPublicKey || envWebhookSecret || envNotificationUrl || envTerminalLabel;
  if (!hasAny) return null;

  return {
    id: 'env-default',
    storeId: null,
    mpAccessToken: envAccessToken,
    mpPublicKey: envPublicKey,
    mpWebhookSecret: envWebhookSecret,
    mpNotificationUrl: envNotificationUrl,
    terminalLabel: envTerminalLabel,
    createdAt: new Date(0),
    updatedAt: new Date(0)
  };
}

export async function getPaymentConfig(): Promise<PaymentConfig | null> {
  const config = await prisma.paymentConfig.findFirst({ orderBy: { createdAt: 'asc' } });
  if (config) return config;

  const envConfig = buildEnvConfig();
  if (envConfig) {
    console.log('[paymentConfig] usando credenciais do ambiente por ausência no banco');
  }
  return envConfig;
}
