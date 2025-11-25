import { Router } from 'express';
import axios from 'axios';

const router = Router();

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || '';
const MP_NOTIFICATION_URL =
  process.env.MP_NOTIFICATION_URL || 'https://api.paradadoespetinho.com/api/pix/webhook';

router.post('/mp/pix', async (req, res) => {
  try {
    if (!MP_ACCESS_TOKEN) {
      return res.status(500).json({ message: 'MP_ACCESS_TOKEN não configurado' });
    }

    const { amount, description, payer } = req.body as {
      amount: number;
      description?: string;
      payer?: { email?: string; firstName?: string; lastName?: string; document?: string };
    };

    if (!amount) {
      return res.status(400).json({ message: 'amount é obrigatório' });
    }

    const mpRes = await axios.post(
      'https://api.mercadopago.com/v1/payments',
      {
        transaction_amount: Number(amount),
        description: description || 'Venda PDV – Parada do Espetinho',
        payment_method_id: 'pix',
        notification_url: MP_NOTIFICATION_URL,
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
          Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
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
    console.error('Erro ao criar pagamento PIX (MP)', err.response?.data || err.message || err);
    return res.status(500).json({ message: 'Erro ao criar pagamento PIX' });
  }
});

router.get('/mp/payments/:id/status', async (req, res) => {
  try {
    if (!MP_ACCESS_TOKEN) {
      return res.status(500).json({ message: 'MP_ACCESS_TOKEN não configurado' });
    }
    const paymentId = req.params.id;
    const mpRes = await axios.get(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` }
    });
    const payment = mpRes.data;
    return res.json({ status: payment.status, payment });
  } catch (err: any) {
    console.error('Erro ao consultar pagamento PIX (MP)', err.response?.data || err.message || err);
    return res.status(500).json({ message: 'Erro ao consultar pagamento PIX' });
  }
});

export default router;
