import React, { useEffect, useState } from 'react';
import { Trash, SquarePen } from 'lucide-react';
import api from '../api/client';

type Product = {
  id: string;
  name: string;
  brand: string;
  gtin: string;
  price: number;
  cost?: number;
  weight?: number;
  stock: number;
  isActive: boolean;
};

const ProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', brand: '', gtin: '', price: 0, cost: 0, weight: 0, stock: 0 });
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({ name: '', brand: '', gtin: '', price: 0, cost: 0, weight: 0, stock: 0 });
  const notifySW = () => {
    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'REFRESH_PRODUCTS' });
    }
  };

  const load = async (query?: string) => {
    setLoading(true);
    try {
      const res = await api.get('/products', { params: { q: query } });
      setProducts(res.data);
      localStorage.setItem('productsCache', JSON.stringify(res.data));
    } catch (err) {
      const cached = localStorage.getItem('productsCache');
      if (cached) {
        setProducts(JSON.parse(cached));
      } else {
        setProducts([]);
      }
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
      setForm({ name: '', brand: '', gtin: '', price: 0, cost: 0, weight: 0, stock: 0 });
      const updated = await api.get('/products', { params: { q: search } });
      setProducts(updated.data);
      localStorage.setItem('productsCache', JSON.stringify(updated.data));
      notifySW();
    } catch (err) {
      // ignore
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/products/${id}`);
      const updated = products.filter((p) => p.id !== id);
      setProducts(updated);
      localStorage.setItem('productsCache', JSON.stringify(updated));
      notifySW();
    } catch (err) {
      // ignore
    }
  };

  const startEdit = (p: Product) => {
    setEditing(p);
    setEditForm({
      name: p.name,
      brand: p.brand,
      gtin: p.gtin,
      price: p.price,
      cost: p.cost || 0,
      weight: p.weight || 0,
      stock: p.stock
    });
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      await api.put(`/products/${editing.id}`, editForm);
      const updated = await api.get('/products', { params: { q: search } });
      setProducts(updated.data);
      localStorage.setItem('productsCache', JSON.stringify(updated.data));
      notifySW();
      setEditing(null);
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

      <div className="grid grid-cols-1 gap-4">
        <div className="glass-card p-4">
          <h2 className="text-lg font-semibold text-charcoal">Novo produto</h2>
          <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
            <input
              placeholder="GTIN"
              value={form.gtin}
              onChange={(e) => setForm((prev) => ({ ...prev, gtin: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
              required
            />
            <input
              placeholder="NOME"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
              required
            />
            <input
              placeholder="MARCA"
              value={form.brand}
              onChange={(e) => setForm((prev) => ({ ...prev, brand: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
              required
            />
            <div className="flex gap-2">
              <div className="w-1/2">
                <label className="text-xs uppercase tracking-wide text-slate-500">Valor do produto</label>
                <div className="relative mt-1">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={form.price}
                    onChange={(e) => setForm((prev) => ({ ...prev, price: Number(e.target.value) }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pr-10 text-sm focus:border-primary focus:outline-none"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-slate-500">R$</span>
                </div>
              </div>
              <div className="w-1/2">
                <label className="text-xs uppercase tracking-wide text-slate-500">Taxa individual</label>
                <div className="relative mt-1">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={form.cost}
                    onChange={(e) => setForm((prev) => ({ ...prev, cost: Number(e.target.value) }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pr-10 text-sm focus:border-primary focus:outline-none"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-slate-500">R$</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="w-1/2">
                <label className="text-xs uppercase tracking-wide text-slate-500">Peso (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={form.weight}
                  onChange={(e) => setForm((prev) => ({ ...prev, weight: Number(e.target.value) }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <div className="w-1/2">
                <label className="text-xs uppercase tracking-wide text-slate-500">Estoque</label>
                <input
                  type="number"
                  placeholder="0"
                  value={form.stock}
                  onChange={(e) => setForm((prev) => ({ ...prev, stock: Number(e.target.value) }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
            </div>
            <button type="submit" className="btn-primary w-full">
              Salvar
            </button>
          </form>
        </div>

        <div className="glass-card p-4">
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
                <div className="flex-1">
                  <div className="text-sm font-semibold text-charcoal">{p.name}</div>
                  <div className="text-xs text-slate-500">
                    GTIN {p.gtin} • {p.brand}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right text-sm font-semibold text-primary">
                    R$ {Number(p.price).toFixed(2)}
                    <div className="text-xs text-slate-500">Estoque {p.stock}</div>
                  </div>
                  <button
                    className="rounded-lg bg-green-100 p-2 text-black hover:bg-green-200"
                    title="Edite o produto!"
                    onClick={() => startEdit(p)}
                  >
                    <SquarePen size={16} />
                  </button>
                  <button
                    className="rounded-lg bg-red-100 p-2 text-black hover:bg-red-200"
                    title="Remover produto"
                    onClick={() => handleDelete(p.id)}
                  >
                    <Trash size={16} />
                  </button>
                </div>
              </div>
            ))}
            {!loading && products.length === 0 && <p className="text-sm text-slate-500">Nenhum produto encontrado.</p>}
          </div>
        </div>
      </div>
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-charcoal">Editar produto</h3>
              <button onClick={() => setEditing(null)} className="text-slate-500 hover:text-slate-700">
                ✕
              </button>
            </div>
            <form className="mt-4 space-y-3" onSubmit={submitEdit}>
              <input
                placeholder="GTIN"
                value={editForm.gtin}
                onChange={(e) => setEditForm((prev) => ({ ...prev, gtin: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                required
              />
              <input
                placeholder="NOME"
                value={editForm.name}
                onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                required
              />
              <input
                placeholder="MARCA"
                value={editForm.brand}
                onChange={(e) => setEditForm((prev) => ({ ...prev, brand: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                required
              />
              <div className="flex gap-2">
                <div className="w-1/2">
                  <label className="text-xs uppercase tracking-wide text-slate-500">Valor do produto</label>
                  <div className="relative mt-1">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={editForm.price}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, price: Number(e.target.value) }))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pr-10 text-sm focus:border-primary focus:outline-none"
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-slate-500">R$</span>
                  </div>
                </div>
                <div className="w-1/2">
                  <label className="text-xs uppercase tracking-wide text-slate-500">Taxa individual</label>
                  <div className="relative mt-1">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={editForm.cost}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, cost: Number(e.target.value) }))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pr-10 text-sm focus:border-primary focus:outline-none"
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-slate-500">R$</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="w-1/2">
                  <label className="text-xs uppercase tracking-wide text-slate-500">Peso (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={editForm.weight}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, weight: Number(e.target.value) }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="w-1/2">
                  <label className="text-xs uppercase tracking-wide text-slate-500">Estoque</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={editForm.stock}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, stock: Number(e.target.value) }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
              <div className="mt-4 flex items-center justify-end gap-2">
                <button type="button" onClick={() => setEditing(null)} className="btn-ghost">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Salvar alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
