import React, { useEffect, useMemo, useRef, useState } from 'react';
import { QrCode, HandCoins, Banknote, BanknoteArrowUp } from 'lucide-react';
import api from '../api/client';

type Product = {
  id: string;
  name: string;
  price: number;
  gtin: string;
  brand: string;
  discountPercent?: number;
  isOnPromotion?: boolean;
};
type CartItem = { product: Product; quantity: number };
type PixKey = { id: string; type: string; key: string; isDefault: boolean };

const SalesPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [coupon, setCoupon] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountPercent: number } | null>(null);
  const [paymentType, setPaymentType] = useState('PIX');
  const [pixKeys, setPixKeys] = useState<PixKey[]>([]);
  const [selectedPixKey, setSelectedPixKey] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [pixPayload, setPixPayload] = useState('');
  const [pixQr, setPixQr] = useState('');
  const [showPixModal, setShowPixModal] = useState(false);
  const searchRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const load = async () => {
      const res = await api.get('/products', { params: { q: search } });
      setProducts(res.data);
    };
    load();
  }, [search]);

  useEffect(() => {
    const loadKeys = async () => {
      try {
        const res = await api.get('/pix/keys');
        setPixKeys(res.data);
        if (res.data.length) {
          const def = res.data.find((k: PixKey) => k.isDefault) || res.data[0];
          setSelectedPixKey(def.id);
        }
      } catch (err) {
        // ignore
      }
    };
    loadKeys();
  }, []);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.product.id === product.id);
      if (existing) {
        return prev.map((c) => (c.product.id === product.id ? { ...c, quantity: c.quantity + 1 } : c));
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const total = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const discount = appliedCoupon ? subtotal * (appliedCoupon.discountPercent / 100) : 0;
    return { subtotal, discount, total: subtotal - discount };
  }, [cart, appliedCoupon]);

  const applyCoupon = async () => {
    try {
      const res = await api.get('/tickets/validate', { params: { code: coupon } });
      setAppliedCoupon({ code: res.data.code, discountPercent: Number(res.data.discountPercent) });
      setMessage('Cupom aplicado!');
    } catch (err) {
      setMessage('Cupom inválido');
      setAppliedCoupon(null);
    }
  };

  const finalize = async () => {
    try {
      setPixPayload('');
      setPixQr('');
      setShowPixModal(false);
      if (paymentType === 'PIX') {
        if (!selectedPixKey) {
          setMessage('Selecione uma forma de pagamento Pix');
          return;
        }
        const saleRes = await api.post('/sales', {
          items: cart.map((c) => ({ productId: c.product.id, quantity: c.quantity })),
          couponCode: appliedCoupon?.code,
          paymentType
        });
        const chargeRes = await api.post('/pix/charges', {
          amount: total.total,
          saleId: saleRes.data.id,
          pixKeyId: selectedPixKey,
          description: 'Venda PDV'
        });
        setPixPayload(chargeRes.data.qrCodePayload);
        setPixQr(
          `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(chargeRes.data.qrCodePayload)}&size=320x320`
        );
        setMessage('PIX gerado. Escaneie o QR Code para pagar.');
        setShowPixModal(true);
      } else {
        await api.post('/sales', {
          items: cart.map((c) => ({ productId: c.product.id, quantity: c.quantity })),
          couponCode: appliedCoupon?.code,
          paymentType
        });
        setMessage('Venda registrada com sucesso');
      }
      setCart([]);
      setAppliedCoupon(null);
      setCoupon('');
    } catch (err) {
      setMessage('Erro ao registrar venda');
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[2.5fr_0.8fr]">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-charcoal">PDV (Ponto de Venda)</h1>
            </div>
            <div className="w-full md:w-[clamp(20rem,35vw,34rem)]">
              <label className="text-xs uppercase tracking-wide text-slate-500">Buscar item / GTIN</label>
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Escaneie o código ou digite nome/GTIN"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="glass-card p-4">
            <h2 className="text-lg font-semibold text-charcoal">Carrinho</h2>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              {products.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="rounded-xl border border-slate-100 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="text-sm font-semibold text-charcoal">{p.name}</div>
                  <div className="text-xs text-slate-500">{p.brand}</div>
                  {p.isOnPromotion && (
                    <div className="text-xs font-semibold text-secondary">
                      Desconto {Number(p.discountPercent || 0).toFixed(0)}%
                    </div>
                  )}
                  <div className="mt-1 text-lg font-bold text-primary">R$ {Number(p.price).toFixed(2)}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full lg:max-w-sm lg:justify-self-end">
          <div className="glass-card p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-charcoal">Carrinho de compra</h2>
              <span className="text-xs text-slate-500">{cart.length} itens</span>
            </div>
            <div className="mt-3 space-y-2">
              {cart.map((item) => (
                <div key={item.product.id} className="rounded-xl border border-slate-100 bg-white px-3 py-2">
                  <div className="flex items-center justify-between text-sm font-semibold text-charcoal">
                    {item.product.name}
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) =>
                        setCart((prev) =>
                          prev.map((c) =>
                            c.product.id === item.product.id ? { ...c, quantity: Number(e.target.value) } : c
                          )
                        )
                      }
                      className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-right text-xs"
                    />
                  </div>
                  <div className="text-xs text-slate-500">R$ {Number(item.product.price).toFixed(2)} un.</div>
                </div>
              ))}
              {cart.length === 0 && <p className="text-sm text-slate-500">Adicione itens clicando nos produtos.</p>}
            </div>

            <div className="mt-4 space-y-2 rounded-xl bg-white/80 p-3 text-sm text-slate-700">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span>R$ {total.subtotal.toFixed(2)}</span>
              </div>
              {appliedCoupon && (
                <div className="flex items-center justify-between text-green-600">
                  <span>Desconto ({appliedCoupon.discountPercent}%)</span>
                  <span>- R$ {total.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-base font-semibold text-charcoal">
                <span>Total</span>
                <span>R$ {total.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex gap-2">
                <input
                  value={coupon}
                  onChange={(e) => setCoupon(e.target.value)}
                  placeholder="Cupom"
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
                <button className="btn-secondary" onClick={applyCoupon}>
                  Aplicar
                </button>
              </div>

              <div className="flex gap-2">
                {[
                  { key: 'PIX', icon: <QrCode size={18} /> },
                  { key: 'MONEY', icon: <HandCoins size={18} /> },
                  { key: 'CARD_DEBIT', icon: <Banknote size={18} /> },
                  { key: 'CARD_CREDIT', icon: <BanknoteArrowUp size={18} /> }
                ].map((method) => (
                  <button
                    key={method.key}
                    onClick={() => setPaymentType(method.key)}
                    className={`btn flex-1 text-xs md:text-sm ${
                      paymentType === method.key ? 'bg-primary text-white' : 'bg-white text-slate-700 border border-slate-200'
                    }`}
                    style={{ minWidth: 0 }}
                    title={
                      method.key === 'PIX'
                        ? 'PIX'
                        : method.key === 'MONEY'
                        ? 'DINHEIRO'
                        : method.key === 'CARD_DEBIT'
                        ? 'CARTÃO DE DÉBITO'
                        : 'CARTÃO DE CRÉDITO'
                    }
                  >
                    {method.icon}
                  </button>
                ))}
              </div>

              {paymentType === 'PIX' && (
                <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Formas de pagamento pix</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {pixKeys.length === 0 && <span className="text-xs text-slate-500">Nenhuma chave cadastrada</span>}
                    {pixKeys.map((k) => (
                      <button
                        key={k.id}
                        onClick={() => setSelectedPixKey(k.id)}
                        className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
                          selectedPixKey === k.id ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200 bg-white'
                        }`}
                      >
                        {k.type.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button className="btn-primary w-full" onClick={finalize} disabled={!cart.length}>
                {paymentType === 'PIX' ? 'Gerar PIX' : 'Finalizar venda'}
              </button>
              {message && <p className="text-xs text-slate-500">{message}</p>}
              {pixPayload && (
              <div className="mt-2 rounded-xl bg-white p-3 text-xs text-slate-700">
                <p className="font-semibold text-charcoal">QR Code do PIX</p>
                {pixQr ? (
                  <div className="flex flex-col items-center gap-2">
                    <img src={pixQr} alt="QR Pix" className="h-40 w-40" />
                    <code className="block break-words text-[11px] text-slate-600">{pixPayload}</code>
                  </div>
                ) : (
                  <code className="block break-words text-[11px] text-slate-600">{pixPayload}</code>
                )}
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
      {showPixModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-charcoal">Pagamento PIX</h3>
              <button className="text-slate-500" onClick={() => setShowPixModal(false)}>
                ✕
              </button>
            </div>
            <div className="mt-4 flex flex-col items-center gap-3">
              {pixQr ? (
                <img src={pixQr} alt="QR Pix" className="h-64 w-64" />
              ) : (
                <p className="text-sm text-slate-600">Gerando QR...</p>
              )}
              {pixPayload && (
                <code className="block break-words rounded-lg bg-slate-100 p-2 text-center text-[11px] text-slate-600">
                  {pixPayload}
                </code>
              )}
            </div>
            <div className="mt-4 text-right">
              <button className="btn-primary" onClick={() => setShowPixModal(false)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesPage;
