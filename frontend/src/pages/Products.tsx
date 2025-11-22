import React, { useEffect, useState } from 'react';
import api from '../api/client';

type Product = {
  id: string;
  name: string;
  brand: string;
  gtin: string;
  price: number;
  stock: number;
  isActive: boolean;
};

const ProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', brand: '', gtin: '', price: 0, stock: 0 });
  const [loading, setLoading] = useState(false);

  const load = async (query?: string) => {
    setLoading(true);
    try {
      const res = await api.get('/products', { params: { q: query } });
      setProducts(res.data);
    } catch (err) {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/products', form);
      setForm({ name: '', brand: '', gtin: '', price: 0, stock: 0 });
      load(search);
    } catch (err) {
      // ignore
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-slate-500">Catálogo</p>
          <h1 className="text-xl font-bold text-charcoal">Produtos</h1>
        </div>
        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load(search)}
            placeholder="Nome, GTIN, marca..."
            className="w-64 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
          <button className="btn-secondary" onClick={() => load(search)}>
            Buscar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="glass-card p-4 lg:col-span-1">
          <h2 className="text-lg font-semibold text-charcoal">Novo produto</h2>
          <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
            {['name', 'brand', 'gtin'].map((field) => (
              <input
                key={field}
                placeholder={field.toUpperCase()}
                value={(form as any)[field]}
                onChange={(e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                required
              />
            ))}
            <div className="flex gap-2">
              <input
                type="number"
                step="0.01"
                placeholder="Preço"
                value={form.price}
                onChange={(e) => setForm((prev) => ({ ...prev, price: Number(e.target.value) }))}
                className="w-1/2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
              <input
                type="number"
                placeholder="Estoque"
                value={form.stock}
                onChange={(e) => setForm((prev) => ({ ...prev, stock: Number(e.target.value) }))}
                className="w-1/2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <button type="submit" className="btn-primary w-full">
              Salvar
            </button>
          </form>
        </div>

        <div className="glass-card p-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-charcoal">Lista</h2>
            <span className="text-xs text-slate-500">{products.length} itens</span>
          </div>
          <div className="mt-3 space-y-2">
            {loading && <p className="text-sm text-slate-500">Carregando...</p>}
            {products.map((p) => (
              <div
                key={p.id}
                className="flex flex-col gap-1 rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="text-sm font-semibold text-charcoal">{p.name}</div>
                  <div className="text-xs text-slate-500">
                    GTIN {p.gtin} • {p.brand}
                  </div>
                </div>
                <div className="text-right text-sm font-semibold text-primary">
                  R$ {Number(p.price).toFixed(2)}
                  <div className="text-xs text-slate-500">Estoque {p.stock}</div>
                </div>
              </div>
            ))}
            {!loading && products.length === 0 && <p className="text-sm text-slate-500">Nenhum produto encontrado.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
