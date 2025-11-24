import React, { useEffect, useState } from 'react';
import {
  Trash,
  SquarePen,
  Wheat,
  Apple,
  Milk,
  Drumstick,
  Croissant,
  Snowflake,
  CupSoda,
  GlassWater,
  Can,
  ChefHat,
  Candy,
  Sparkles,
  ShowerHead,
  Battery
} from 'lucide-react';
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
  categoryKey?: string;
};

type Category = {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
};

const categories: Category[] = [
  { key: 'basicos', label: 'Alimentos Básicos', description: 'Arroz, feijão, farinhas, macarrão, óleo, sal, açúcar', icon: <Wheat size={16} /> },
  { key: 'hortifruti', label: 'Hortifrúti', description: 'Frutas, legumes, verduras, temperos frescos', icon: <Apple size={16} /> },
  { key: 'laticinios', label: 'Laticínios & Frios', description: 'Leite, queijos, iogurtes, frios', icon: <Milk size={16} /> },
  { key: 'carnes', label: 'Carnes & Peixes', description: 'Bovina, frango, peixes, suína', icon: <Drumstick size={16} /> },
  { key: 'paes', label: 'Pães & Panificação', description: 'Pães, biscoitos, panificados', icon: <Croissant size={16} /> },
  { key: 'congelados', label: 'Alimentos Congelados', description: 'Pizza, lasanha, hambúrguer, vegetais', icon: <Snowflake size={16} /> },
  { key: 'bebidas', label: 'Bebidas', description: 'Água, sucos, refrigerantes, cervejas, vinhos', icon: <CupSoda size={16} /> },
  { key: 'processados', label: 'Alimentos Processados', description: 'Enlatados, extratos, geleias', icon: <Can size={16} /> },
  { key: 'ingredientes', label: 'Ingredientes Culinários', description: 'Azeite, óleos, sal, açúcar, vinagre', icon: <ChefHat size={16} /> },
  { key: 'ultraprocessados', label: 'Ultraprocessados', description: 'Biscoitos recheados, salgadinhos, instantâneos', icon: <Candy size={16} /> },
  { key: 'limpeza', label: 'Produtos de Limpeza', description: 'Sabão, detergente, desinfetante', icon: <Sparkles size={16} /> },
  { key: 'higiene', label: 'Higiene Pessoal', description: 'Shampoo, sabonete, pasta de dente', icon: <ShowerHead size={16} /> },
  { key: 'eletronicos', label: 'Eletrônicos', description: 'Cabos, pilhas, lâmpadas', icon: <Battery size={16} /> },
  { key: 'cafe', label: 'Bebidas Quentes', description: 'Café, chá, achocolatado', icon: <GlassWater size={16} /> }
];

const ProductsPage = () => {
  const CATEGORY_STORE_KEY = 'productCategories';
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    name: '',
    brand: '',
    gtin: '',
    price: 0,
    cost: 0,
    weight: 0,
    stock: 0,
    categoryKey: categories[0].key
  });
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    brand: '',
    gtin: '',
    price: 0,
    cost: 0,
    weight: 0,
    stock: 0,
    categoryKey: categories[0].key
  });
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});

  const getCategory = (p: Product) => {
    const key = categoryMap[p.id] || categoryMap[p.gtin] || p.categoryKey;
    return categories.find((c) => c.key === key);
  };
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
    const storedCats = localStorage.getItem(CATEGORY_STORE_KEY);
    if (storedCats) {
      try {
        setCategoryMap(JSON.parse(storedCats));
      } catch {
        /* ignore */
      }
    }
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { categoryKey, ...payload } = form;
      const chosenCategory = categoryKey;
      await api.post('/products', payload);
      setForm({ name: '', brand: '', gtin: '', price: 0, cost: 0, weight: 0, stock: 0, categoryKey: categories[0].key });
      const updated = await api.get('/products', { params: { q: search } });
      setProducts(updated.data);
      localStorage.setItem('productsCache', JSON.stringify(updated.data));
      // associa categoria ao produto criado
      const created = updated.data.find((p: Product) => p.gtin === form.gtin || p.name === form.name);
      if (created) {
        const newMap = { ...categoryMap, [created.id]: chosenCategory, [created.gtin]: chosenCategory };
        setCategoryMap(newMap);
        localStorage.setItem(CATEGORY_STORE_KEY, JSON.stringify(newMap));
      }
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
    const cat = categoryMap[p.id] || categoryMap[p.gtin] || categories[0].key;
    setEditForm({
      name: p.name,
      brand: p.brand,
      gtin: p.gtin,
      price: p.price,
      cost: p.cost || 0,
      weight: p.weight || 0,
      stock: p.stock,
      categoryKey: cat
    });
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      const { categoryKey, ...payload } = editForm;
      await api.put(`/products/${editing.id}`, payload);
      const updated = await api.get('/products', { params: { q: search } });
      setProducts(updated.data);
      localStorage.setItem('productsCache', JSON.stringify(updated.data));
      // salva categoria editada
      const newMap = { ...categoryMap };
      newMap[editing.id] = editForm.categoryKey;
      newMap[editing.gtin] = editForm.categoryKey;
      setCategoryMap(newMap);
      localStorage.setItem(CATEGORY_STORE_KEY, JSON.stringify(newMap));
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
            <div>
              <label className="text-xs uppercase tracking-wide text-slate-500">Categoria</label>
              <select
                value={form.categoryKey}
                onChange={(e) => setForm((prev) => ({ ...prev, categoryKey: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
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
          <div className="mt-3 space-y-2 max-h-[1000px] overflow-y-auto pr-1">
            {loading && <p className="text-sm text-slate-500">Carregando...</p>}
            {products.map((p) => (
              <div
                key={p.id}
                className="flex flex-col gap-1 rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm md:flex-row md:items-center md:justify-between"
              >
                <div className="flex flex-1 items-start gap-2">
                  {getCategory(p) && (
                    <span
                      className="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700"
                      title={`${getCategory(p)!.label} – ${getCategory(p)!.description}`}
                    >
                      {getCategory(p)!.icon}
                    </span>
                  )}
                  <div>
                    <div className="text-sm font-semibold text-charcoal">{p.name}</div>
                    <div className="text-xs text-slate-500">
                      GTIN {p.gtin} • {p.brand}
                    </div>
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
                    <SquarePen size={20} />
                  </button>
                  <button
                    className="rounded-lg bg-red-100 p-2 text-black hover:bg-red-200"
                    title="Remover produto"
                    onClick={() => handleDelete(p.id)}
                  >
                    <Trash size={20} />
                  </button>
                </div>
              </div>
            ))}
            {!loading && products.length === 0 && <p className="text-sm text-slate-500">Nenhum produto encontrado.</p>}
          </div>
        </div>
      </div>
      {editing && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
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
              <div>
                <label className="text-xs uppercase tracking-wide text-slate-500">Categoria</label>
                <select
                  value={editForm.categoryKey}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, categoryKey: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </select>
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
