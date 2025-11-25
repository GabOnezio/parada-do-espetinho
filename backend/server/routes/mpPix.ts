import { Router } from 'express';
import axios from 'axios';
import { prisma } from '../utils/prisma.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

const fallbackNotification =
  process.env.MP_NOTIFICATION_URL || 'https://api.paradadoespetinho.com/api/pix/webhook';

async function getPaymentConfig() {
  return prisma.paymentConfig.findFirst({ orderBy: { createdAt: 'asc' } });
}

router.post('/mp/pix', requireAuth, async (req, res) => {
  try {
    const config = await getPaymentConfig();
    if (!config?.mpAccessToken) {
      console.error('[mpPix] Integração Mercado Pago não configurada');
      return res.status(500).json({ message: 'Integração Mercado Pago não configurada' });
    }

    const notificationUrl = config.mpNotificationUrl || fallbackNotification;

    const { amount, description, payer, saleId } = req.body as {
      amount: number;
      description?: string;
      payer?: { email?: string; firstName?: string; lastName?: string; document?: string };
      saleId?: string;
    };

    if (!amount) {
      return res.status(400).json({ message: 'amount é obrigatório' });
    }

    // chave de idempotência simples (só pra evitar erro 400 do MP)
    const idemKey = `pdv-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    const mpRes = await axios.post(
      'https://api.mercadopago.com/v1/payments',
      {
        transaction_amount: Number(amount),
        description: description || 'Venda PDV – Parada do Espetinho',
        payment_method_id: 'pix',
        notification_url: notificationUrl,
        external_reference: saleId || undefined,
        payer: {
          email: payer?.email || 'cliente@exemplo.com',
          first_name: payer?.firstName || 'Cliente',
          last_name: payer?.lastName || 'PDV',
          identification: payer?.document
            ? { type: 'CPF', number: payer.document.replace(/\D/g, '') }
            : undefined
        }
      },
      {
        headers: {
          Authorization: `Bearer ${config.mpAccessToken}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': idemKey
        }
      }
    );

    const payment = mpRes.data;

    return res.json({
      id: payment.id,
      status: payment.status,
      qr_code: payment.point_of_interaction?.transaction_data?.qr_code,
      qr_base64: payment.point_of_interaction?.transaction_data?.qr_code_base64,
      expires_at: payment.point_of_interaction?.transaction_data?.date_of_expiration
    });
  } catch (err: any) {
    const status = err?.response?.status;
    const data = err?.response?.data;

    console.error(
      '[mpPix] erro ao criar pagamento PIX',
      'status =',
      status,
      'data =',
      JSON.stringify(data || err.message || err, null, 2)
    );

    // manda detalhes pro front ver no DevTools
    return res.status(500).json({
      message: 'Erro ao criar pagamento PIX',
      status,
      details: data || err.message || 'erro desconhecido'
    });
  }
});

router.get('/mp/payments/:id/status', requireAuth, async (req, res) => {
  try {
    const config = await getPaymentConfig();
    if (!config?.mpAccessToken) {
      console.error('[mpPix] Integração Mercado Pago não configurada (status)');
      return res.status(500).json({ message: 'Integração Mercado Pago não configurada' });
    }

    const paymentId = req.params.id;
    const mpRes = await axios.get(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${config.mpAccessToken}` }
    });
    const payment = mpRes.data;
    return res.json({ status: payment.status, payment });
  } catch (err: any) {
    const status = err?.response?.status;
    const data = err?.response?.data;

    console.error(
      '[mpPix] erro ao consultar pagamento PIX',
      'status =',
      status,
      'data =',
      JSON.stringify(data || err.message || err, null, 2)
    );

    return res.status(500).json({
      message: 'Erro ao consultar pagamento PIX',
      status,
      details: data || err.message || 'erro desconhecido'
    });
  }
});

// Teste de integração: cria um pagamento de R$1,00 para validar o token
router.post('/mp/test-payment', requireAuth, async (_req, res) => {
  try {
    const config = await getPaymentConfig();
    if (!config?.mpAccessToken) {
      console.error('[mpPix] Integração Mercado Pago não configurada (teste)');
      return res.status(500).json({ message: 'Integração Mercado Pago não configurada' });
    }

    const notificationUrl = config.mpNotificationUrl || fallbackNotification;
    const mpRes = await axios.post(
      'https://api.mercadopago.com/v1/payments',
      {
        transaction_amount: 1,
        description: 'Teste de integração PDV – Parada do Espetinho',
        payment_method_id: 'pix',
        notification_url: notificationUrl,
        external_reference: 'test-pdv'
      },
      {
        headers: {
          Authorization: `Bearer ${config.mpAccessToken}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': `pdv-test-${Date.now()}`
        }
      }
    );

    return res.json({ ok: true, id: mpRes.data.id, status: mpRes.data.status });
  } catch (err: any) {
    const status = err?.response?.status;
    const data = err?.response?.data;
    console.error('[mpPix] teste de integração falhou', status, data || err.message || err);
    return res.status(500).json({ message: 'Falha no teste de integração', status, details: data || err.message || err });
  }
});

export default router;
