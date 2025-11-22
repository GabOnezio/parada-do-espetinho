import React, { useEffect, useMemo, useState } from 'react';
import api from '../api/client';

type Product = { id: string; name: string; price: number; gtin: string; brand: string };
type CartItem = { product: Product; quantity: number };

const SalesPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [coupon, setCoupon] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountPercent: number } | null>(null);
  const [paymentType, setPaymentType] = useState('PIX');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      const res = await api.get('/products', { params: { q: search } });
      setProducts(res.data);
    };
    load();
  }, [search]);

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
      await api.post('/sales', {
        items: cart.map((c) => ({ productId: c.product.id, quantity: c.quantity })),
        couponCode: appliedCoupon?.code,
        paymentType
      });
      setMessage('Venda registrada com sucesso');
      setCart([]);
      setAppliedCoupon(null);
      setCoupon('');
    } catch (err) {
      setMessage('Erro ao registrar venda');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-slate-500">PDV</p>
          <h1 className="text-xl font-bold text-charcoal">Vendas</h1>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, GTIN, marca"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none md:w-80"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="glass-card p-4 lg:col-span-2">
          <h2 className="text-lg font-semibold text-charcoal">Produtos</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            {products.map((p) => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                className="rounded-xl border border-slate-100 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="text-sm font-semibold text-charcoal">{p.name}</div>
                <div className="text-xs text-slate-500">{p.brand}</div>
                <div className="mt-1 text-lg font-bold text-primary">R$ {Number(p.price).toFixed(2)}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-charcoal">Carrinho</h2>
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
              {['PIX', 'MONEY', 'CARD_DEBIT', 'CARD_CREDIT'].map((method) => (
                <button
                  key={method}
                  onClick={() => setPaymentType(method)}
                  className={`btn flex-1 ${paymentType === method ? 'bg-primary text-white' : 'bg-white text-slate-700 border border-slate-200'}`}
                >
                  {method}
                </button>
              ))}
            </div>

            <button className="btn-primary w-full" onClick={finalize} disabled={!cart.length}>
              Finalizar venda
            </button>
            {message && <p className="text-xs text-slate-500">{message}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesPage;
