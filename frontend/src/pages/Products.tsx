import React, { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { Trash, SquarePen, ListRestart } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import {
  FaGlassCheers,
  FaBreadSlice,
  FaIceCream,
  FaFish,
  FaAppleAlt,
  FaPumpSoap,
  FaSoap,
  FaWrench,
  FaMugHot,
  FaDrumstickBite,
  FaCheese,
  FaPepperHot,
  FaBasketballBall
} from 'react-icons/fa';
import { FaGlassWater } from 'react-icons/fa6';
import { GiCroissant } from 'react-icons/gi';
import api from '../api/client';
import {
  CategoryKey,
  defaultProducts,
  buildSeedCategoryMap,
  mergeWithSeedProducts,
  readHiddenSeedGtins,
  persistHiddenSeedGtins
} from '../data/productSeeds';
import { saveProducts } from '../utils/idb';

type Product = {
  id: string;
  name: string;
  brand: string;
  gtin: string;
  price: number;
  cost?: number;
  weight?: number;
  sku?: string;
  stock: number;
  isActive?: boolean;
  categoryKey?: CategoryKey;
  isSeed?: boolean;
  stockMin?: number;
  stockMax?: number;
  measureUnit?: string;
  createdAt?: string;
};

type Category = {
  key: CategoryKey;
  label: string;
  description: string;
  icon: React.ReactNode;
  iconName?: string;
  color?: string;
};

const baseCategories: Category[] = [
  { key: 'bebidas_alcoolicas', label: 'Bebidas Alcoólicas', description: 'Vinhos, cachaças e coquetéis', icon: <FaGlassCheers size={16} />, color: '#c084fc' },
  { key: 'bebidas_nao_alcoolicas', label: 'Bebidas Não Alcoólicas', description: 'Água, coco, sucos, refrescos', icon: <FaGlassWater size={16} />, color: '#22c55e' },
  { key: 'alimentos', label: 'Alimentos', description: 'Arroz, feijão, farinhas, massas e enlatados', icon: <FaBreadSlice size={16} />, color: '#f59e0b' },
  { key: 'doces_sobremesas', label: 'Doces e Sobremesas', description: 'Pudins, gelatinas, doces e biscoitos', icon: <FaIceCream size={16} />, color: '#f472b6' },
  { key: 'carnes_peixes', label: 'Carnes e Peixes', description: 'Peixes, sardinhas e cortes cárneos', icon: <FaFish size={16} />, color: '#f97316' },
  { key: 'hortifruti', label: 'Hortifruti', description: 'Frutas, verduras e legumes', icon: <FaAppleAlt size={16} />, color: '#22c55e' },
  { key: 'limpeza', label: 'Limpeza', description: 'Sabão, detergente, desinfetante', icon: <FaPumpSoap size={16} />, color: '#1e3a8a' },
  { key: 'padaria', label: 'Padaria', description: 'Pães e panificados', icon: <GiCroissant size={16} />, color: '#facc15' },
  { key: 'bolachas', label: 'Bolachas / Cookies', description: 'Biscoitos, cookies e recheados', icon: <LucideIcons.Cookie size={16} />, color: '#8b5a2b' },
  { key: 'higiene_pessoal', label: 'Higiene Pessoal', description: 'Sabonetes e cuidados pessoais', icon: <FaSoap size={16} />, color: '#6366f1' },
  { key: 'utilidades_domesticas', label: 'Utilidades Domésticas', description: 'Filtros, ferramentas, carvão', icon: <FaWrench size={16} />, color: '#334155' },
  { key: 'tabacos', label: 'Tabacos', description: 'Tabaco, fumos e acessórios', icon: <LucideIcons.Cigarette size={16} />, color: '#8b5cf6' },
  { key: 'chas', label: 'Chás', description: 'Erva-mate e chás quentes', icon: <FaMugHot size={16} />, color: '#0ea5e9' },
  { key: 'carnes', label: 'Carnes', description: 'Aves e cortes diversos', icon: <FaDrumstickBite size={16} />, color: '#ef4444' },
  { key: 'laticinios', label: 'Laticínios', description: 'Leite, queijos e derivados', icon: <FaCheese size={16} />, color: '#93c5fd' },
  { key: 'temperos', label: 'Temperos e Condimentos', description: 'Sal, vinagre, molhos, maioneses', icon: <FaPepperHot size={16} />, color: '#a855f7' },
  { key: 'esportes', label: 'Esportes', description: 'Bolas e itens esportivos', icon: <FaBasketballBall size={16} />, color: '#fb923c' },
  { key: 'brinquedos_criancas', label: 'Brinquedos de Crianças', description: 'Brinquedos infantis', icon: <LucideIcons.Gamepad2 size={16} />, color: '#8b5cf6' },
  { key: 'brinquedos_adultos', label: 'Brinquedos Adultos', description: 'Colecionáveis e jogos adultos', icon: <LucideIcons.Puzzle size={16} />, color: '#c084fc' }
];

const REQUIRED_RESET_PHRASE = 'Quero deletar estoque de Espetinho';

const ProductsPage = () => {
  const CATEGORY_STORE_KEY = 'productCategories';
  const CUSTOM_CATEGORY_STORE_KEY = 'customCategories';
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    name: '',
    brand: '',
    gtin: '',
    sku: '',
    generateSku: true,
    price: 0,
    cost: 0,
    weight: 0,
    stock: 0,
    stockMin: 0,
    stockMax: 0,
    measureUnit: 'kg',
    categoryKey: '' as CategoryKey
  });
  const [catOpen, setCatOpen] = useState(false);
  const [catFilter, setCatFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    brand: '',
    gtin: '',
    sku: '',
    price: 0,
    cost: 0,
    weight: 0,
    stock: 0,
    stockMin: 0,
    stockMax: 0,
    measureUnit: 'kg',
    categoryKey: '' as CategoryKey
  });
  const [editCatOpen, setEditCatOpen] = useState(false);
  const [editCatFilter, setEditCatFilter] = useState('');
  const [categoryMap, setCategoryMap] = useState<Record<string, CategoryKey>>({});
  const [hiddenSeedGtins, setHiddenSeedGtins] = useState<string[]>([]);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmation, setResetConfirmation] = useState('');
  const [resetError, setResetError] = useState('');
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [customCategories, setCustomCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState({
    label: '',
    key: '',
    description: '',
    iconName: '',
    color: '#6366f1'
  });
  const [, startCategoryColorTransition] = useTransition();
  const handleCategoryColorChange = useCallback(
    (value: string) => {
      startCategoryColorTransition(() => {
        setNewCategory((prev) => ({ ...prev, color: value }));
      });
    },
    [startCategoryColorTransition]
  );
  const [catError, setCatError] = useState('');
  const [showCategoryGrid, setShowCategoryGrid] = useState(false);
  const [isCreateCategoryCollapsed, setIsCreateCategoryCollapsed] = useState(false);
  const [isNewProductCollapsed, setIsNewProductCollapsed] = useState(false);
  const [tooltipInfo, setTooltipInfo] = useState<
    | {
      id: string;
      label: string;
      description?: string;
      x: number;
      y: number;
    }
    | null
  >(null);
  const productsRef = useRef<Product[]>([]);
  const hasSyncedAllSkusRef = useRef(false);
  const autoSeedRestoreRef = useRef(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const orderRef = useRef<Record<string, number>>({});
  const ORDER_KEY = 'productOrderMap';
  const lastAddedRef = useRef<string | null>(null);
  const LAST_ADDED_KEY = 'lastAddedProductId';
  const [sortMode, setSortMode] = useState<'recent' | 'alpha'>('recent');
  const sortModeRef = useRef<'recent' | 'alpha'>('recent');
  const [syncStatus, setSyncStatus] = useState<string>('');

  const hiddenSeedSet = useMemo(() => new Set(hiddenSeedGtins), [hiddenSeedGtins]);
  const seedCategoryMap = useMemo(() => buildSeedCategoryMap(hiddenSeedSet), [hiddenSeedSet]);
  const categories = useMemo(() => [...baseCategories, ...customCategories], [customCategories]);

  const getCategory = (p: Product) => {
    const key =
      categoryMap[p.id] ||
      categoryMap[p.gtin] ||
      seedCategoryMap[p.id] ||
      seedCategoryMap[p.gtin] ||
      p.categoryKey;
    return categories.find((c) => c.key === key);
  };

  const renderCategoryDropdown = (
    value: CategoryKey,
    onChange: (val: CategoryKey) => void,
    open: boolean,
    setOpen: (v: boolean) => void,
    dropUp = false,
    filterValue = '',
    setFilter?: (v: string) => void,
    hideSelectedLabel = false
  ) => {
    const normalizedFilter = filterValue.toLowerCase();
    const selected = value ? categories.find((c) => c.key === value) : null;
    const filtered = categories.filter((c) => `${c.label} ${c.description}`.toLowerCase().includes(normalizedFilter));
    const displayedValue = hideSelectedLabel ? filterValue : selected ? selected.label : filterValue;
    return (
      <div className="relative">
        <label className="text-xs uppercase tracking-wide text-slate-500">Categoria</label>
        <div
          className="mt-1 flex w-full items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus-within:border-primary"
          onClick={() => setOpen(true)}
          role="presentation"
        >
          <input
            value={displayedValue}
            onFocus={() => {
              setOpen(true);
              if (!selected) {
                setFilter?.(filterValue);
              }
            }}
            onChange={(e) => {
              const next = e.target.value;
              setFilter?.(next);
              setOpen(true);
            }}
            placeholder="Buscar categoria..."
            className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
          />
          <span className="ml-2 text-slate-400">▾</span>
        </div>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-label="Fechar categorias" />
            <div
              className={`absolute z-50 w-full max-h-64 overflow-y-auto border border-slate-200 bg-white shadow-lg ${dropUp ? 'bottom-[102%] rounded-t-xl' : 'mt-1 rounded-b-xl'
                }`}
              style={
                dropUp
                  ? { borderTopLeftRadius: '12px', borderTopRightRadius: '12px', borderBottomLeftRadius: '4px', borderBottomRightRadius: '4px' }
                  : undefined
              }
            >
              {filtered.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => {
                    onChange(c.key);
                    setFilter?.(c.label);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-primary/5"
                  title={`${c.label} – ${c.description}`}
                  style={{ borderRadius: '10px', opacity: 0.78 }}
                >
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-lg text-white"
                    style={{ backgroundColor: c.color || '#e2e8f0' }}
                    title={`${c.label} – ${c.description}`}
                  >
                    {c.icon}
                  </span>
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };
  const notifySW = () => {
    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'REFRESH_PRODUCTS' });
    }
  };

  const saveOrderMap = (map: Record<string, number>) => {
    orderRef.current = map;
    try {
      localStorage.setItem(ORDER_KEY, JSON.stringify(map));
    } catch {
      /* ignore */
    }
  };

  const persistProductCaches = (list: Product[]) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('productsCache', JSON.stringify(list));
      localStorage.setItem('pdv-products-cache', JSON.stringify(list));
      saveProducts(list as any).catch(() => {
        /* ignore */
      });
    } catch {
      /* ignore */
    }
  };

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const iconFromName = (iconName?: string, size = 16, color = 'white') => {
    if (!iconName) return <FaBreadSlice size={size} color={color} />;
    const IconComp = (LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; color?: string }>>)[iconName];
    if (IconComp) return <IconComp size={size} color={color} />;
    return <FaBreadSlice size={size} color={color} />;
  };

  const getCategoryIcon = (category: Category, size = 16, color = 'white') => {
    if (category.iconName) {
      return iconFromName(category.iconName, size, color);
    }
    if (category.icon && React.isValidElement(category.icon)) {
      return React.cloneElement(category.icon, {
        size,
        color
      });
    }
    return iconFromName(undefined, size, color);
  };

  const handleSeedMerge = async () => {
    const nextHidden: string[] = [];
    const nextHiddenSet = new Set<string>();
    setHiddenSeedGtins(nextHidden);
    persistHiddenSeedGtins(nextHidden);
    await load(search, nextHiddenSet);
    notifySW();
  };

  const applyProducts = (data: Product[], customHidden?: Set<string>, pinId?: string | null) => {
    const hiddenSetToUse = customHidden || hiddenSeedSet;
    let merged = mergeWithSeedProducts<Product>(data, hiddenSetToUse) as Product[];
    const effectivePin = pinId ?? lastAddedRef.current;
    if (effectivePin) {
      const pinned = merged.find((p) => p.id === effectivePin);
      if (pinned) {
        merged = [pinned, ...merged.filter((p) => p.id !== effectivePin)];
      }
    }
    const orderMap = { ...orderRef.current };
    let seedCounter = 0;
    merged.forEach((p, idx) => {
      if (orderMap[p.id] == null) {
        if (p.createdAt) {
          orderMap[p.id] = new Date(p.createdAt).getTime();
        } else if (p.isSeed) {
          orderMap[p.id] = -1000 - seedCounter;
          seedCounter += 1;
        } else {
          orderMap[p.id] = Date.now() - idx;
        }
      }
    });
    if (effectivePin) {
      orderMap[effectivePin] = orderMap[effectivePin] ?? Date.now();
      orderMap[effectivePin] = Math.max(...Object.values(orderMap), orderMap[effectivePin]) + 1;
    }
    if (sortModeRef.current === 'alpha') {
      const pinned = effectivePin ? merged.find((p) => p.id === effectivePin) : null;
      const list = merged.filter((p) => !pinned || p.id !== pinned.id).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
      merged = pinned ? [pinned, ...list] : list;
    } else {
      merged = merged.sort((a, b) => (orderMap[b.id] || 0) - (orderMap[a.id] || 0));
    }
    saveOrderMap(orderMap);
    setProducts(merged);
    productsRef.current = merged;
    try {
      saveProducts(merged as any).catch(() => {
        /* ignore */
      });
    } catch {
      /* ignore */
    }
    persistProductCaches(merged);
    setCategoryMap((prev) => {
      const sanitizedPrev = { ...prev };
      hiddenSetToUse.forEach((gtin) => {
        delete sanitizedPrev[`seed-${gtin}`];
        delete sanitizedPrev[gtin];
      });
      const next = { ...buildSeedCategoryMap(hiddenSetToUse), ...sanitizedPrev };
      localStorage.setItem(CATEGORY_STORE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const showTooltip = (cat: Category, target: HTMLElement) => {
    if (typeof window === 'undefined') return;
    const rect = target.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const clampedX = Math.min(window.innerWidth - 16, Math.max(16, centerX));
    const y = rect.bottom + 8;
    setTooltipInfo({
      id: cat.key,
      label: cat.label,
      description: cat.description,
      x: clampedX,
      y
    });
  };

  const formatCurrency = (value: number) => {
    if (!value) return '0,00';
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const parseCurrency = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    return Number(numericValue) / 100;
  };

  const lookupSku = async (code: string) => {
    if (!code) return null;
    try {
      const res = await api.get(`/skus/${encodeURIComponent(code)}`);
      return res.data;
    } catch (err) {
      return null;
    }
  };

  const generateSkuFrom = (data: { name: string; brand: string; weight: number; measureUnit: string }) => {
    const brandMap: Record<string, string> = {
      'doritos': 'DOR',
      'brahma': 'BRA',
      'coca cola': 'COC',
      'parada do espetinho': 'PDE'
    };
    const flavorMap: Record<string, string> = {
      'limao': 'LIM',
      'limão': 'LIM',
      'elma': 'ELM',
      'frango': 'FRG',
      'carne': 'CRN',
      'linguica': 'LIN',
      'linguiça': 'LIN'
    };
    const typeMap: Record<string, string> = {
      'chips': 'CHP',
      'espetinho': 'ESP',
      'refrigerante': 'REF',
      'cerveja': 'CERV',
      'molho de tomate': 'MT'
    };

    const normalize = (text: string) =>
      text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9 ]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const extractFlavor = (name: string) => {
      for (const key of Object.keys(flavorMap)) {
        if (normalize(name).includes(key)) return flavorMap[key];
      }
      return '';
    };

    const extractType = (name: string) => {
      const norm = normalize(name);
      for (const key of Object.keys(typeMap)) {
        if (norm.includes(key)) return typeMap[key];
      }
      const parts = norm.split(' ').filter((p) => p && !['de', 'do', 'da', 'para', 'com', 'sem'].includes(p));
      if (!parts.length) return '';
      return parts
        .slice(0, 3)
        .map((p) => p[0])
        .join('')
        .toUpperCase();
    };

    const normBrand = normalize(data.brand || '');
    const brandCode = brandMap[normBrand] || (data.brand ? data.brand.slice(0, 3).toUpperCase() : 'SKU');
    const flavorCode = extractFlavor(data.name || '');
    const typeCode = extractType(data.name || '');

    let peso = Number(data.weight ?? 0);
    let unidade = normalize(data.measureUnit || '');
    if (unidade === 'kg') peso = peso * 1000;
    if (unidade === 'g') peso = peso;
    if (unidade === 'ml') peso = peso;
    if (unidade === 'l') peso = peso * 1000;
    if (!unidade || unidade === 'un') unidade = 'un';
    const pesoStr = Number.isFinite(peso) ? String(Math.round(peso)) : '0';
    const unidadeCode = unidade === 'kg' || unidade === 'g' ? 'G' : unidade.toUpperCase();

    return `${brandCode}${flavorCode}${typeCode}${pesoStr}${unidadeCode}`;
  };

  const syncSkuHistoryFromProducts = async (list: Product[]) => {
    if (!list || !list.length) return;
    try {
      const existingRes = await api.get('/skus');
      const existingItems = Array.isArray(existingRes.data) ? existingRes.data : [];
      const gtinSet = new Set<string>();
      const skuSet = new Set<string>();
      existingItems.forEach((it: any) => {
        if (it.gtin) gtinSet.add(String(it.gtin));
        if (it.sku) skuSet.add(String(it.sku));
      });

      const customEntries = list.filter(
        (p) => p.sku && !skuSet.has(p.sku) && (!p.gtin || !gtinSet.has(String(p.gtin)))
      );

      for (const p of customEntries) {
        const sku = (p.sku || '').trim();
        if (!sku) continue;
        try {
          await api.post('/skus', {
            sku,
            gtin: p.gtin,
            name: p.name,
            brand: p.brand,
            price: p.price,
            tax: p.cost,
            measureUnit: p.measureUnit
          });
          skuSet.add(sku);
          if (p.gtin) gtinSet.add(String(p.gtin));
        } catch {
          /* ignore */
        }
      }

      const missing = list.filter((p) => {
        const candidateSku = generateSkuFrom({ name: p.name, brand: p.brand, weight: p.weight || 0, measureUnit: p.measureUnit || 'kg' });
        const gtinKey = p.gtin ? String(p.gtin) : null;
        return (!gtinKey || !gtinSet.has(gtinKey)) && !skuSet.has(candidateSku);
      });

      if (!missing.length) return;

      await api.post('/skus/batch/generate', {
        products: missing.map((p) => ({
          id: p.id,
          name: p.name,
          brand: p.brand,
          weight: p.weight || 0,
          measureUnit: p.measureUnit || 'kg',
          price: p.price,
          cost: p.cost,
          gtin: p.gtin
        }))
      });
    } catch (err) {
      // ignore sync errors
    }
  };

  const applySortMode = (mode: 'recent' | 'alpha') => {
    sortModeRef.current = mode;
    setSortMode(mode);
    applyProducts(productsRef.current);
  };

  const syncProductsToServer = async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setSyncStatus('Sem internet. Conecte-se para sincronizar com o banco de dados.');
      return;
    }
    setSyncStatus('Enviando produtos...');
    const list = productsRef.current;
    let created = 0;
    let updated = 0;
    let failed = 0;
    const updatedList = [...list];

    for (const p of list) {
      if (p.isSeed) continue;
      const payload = {
        name: p.name,
        brand: p.brand,
        gtin: p.gtin,
        price: p.price,
        cost: p.cost,
        weight: p.weight,
        stock: p.stock,
        stockMin: p.stockMin,
        stockMax: p.stockMax,
        measureUnit: p.measureUnit,
        sku: p.sku,
        categoryKey: p.categoryKey
      };
      try {
        if (p.id?.startsWith('temp-')) {
          const res = await api.post('/products', payload);
          created += 1;
          if (res?.data?.id) {
            const idx = updatedList.findIndex((it) => it.id === p.id);
            if (idx >= 0) {
              updatedList[idx] = { ...res.data, ...payload, id: res.data.id, isSeed: false };
            }
          }
        } else {
          await api.put(`/products/${p.id}`, payload);
          updated += 1;
        }
      } catch {
        failed += 1;
      }
    }
    applyProducts(updatedList);
    setSyncStatus(
      failed > 0
        ? `Sincronizado (novos: ${created}, atualizados: ${updated}). Falhas: ${failed}.`
        : `Sincronizado com sucesso (novos: ${created}, atualizados: ${updated}).`
    );
  };

  const mergeRemoteWithLocal = (remote: Product[]) => {
    const current = productsRef.current || [];
    const seen = new Set<string>();
    remote.forEach((p) => {
      if (p.id) seen.add(p.id);
      if (p.gtin) seen.add(p.gtin);
    });
    const localsToKeep = current.filter((p) => {
      if (!p.id && !p.gtin) return true;
      if (p.id && seen.has(p.id)) return false;
      if (p.gtin && seen.has(p.gtin)) return false;
      return true;
    });
    return [...remote, ...localsToKeep];
  };

  const load = async (query?: string, customHidden?: Set<string>) => {
    setLoading(true);
    try {
      const res = await api.get('/products', { params: { q: query } });
      const merged = mergeRemoteWithLocal(res.data || []);
      applyProducts(merged, customHidden, lastAddedRef.current);
    } catch (err) {
      const cached = localStorage.getItem('productsCache');
      if (cached) {
        const parsed = JSON.parse(cached);
        const merged = mergeRemoteWithLocal(parsed || []);
        applyProducts(merged, customHidden, lastAddedRef.current);
      } else {
        applyProducts(mergeRemoteWithLocal([]), customHidden, lastAddedRef.current);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedOrder = (() => {
      if (typeof localStorage === 'undefined') return {};
      try {
        return JSON.parse(localStorage.getItem(ORDER_KEY) || '{}') as Record<string, number>;
      } catch {
        return {};
      }
    })();
    orderRef.current = storedOrder;
    if (typeof localStorage !== 'undefined') {
      const storedLast = localStorage.getItem(LAST_ADDED_KEY);
      if (storedLast) {
        lastAddedRef.current = storedLast;
      }
    }

    const storedHidden = []; // força exibir todos os seeds para repor estoque completo
    persistHiddenSeedGtins(storedHidden);
    setHiddenSeedGtins(storedHidden);
    const storedCats = localStorage.getItem(CATEGORY_STORE_KEY);
    let parsedCats: Record<string, CategoryKey> = {};
    if (storedCats) {
      try {
        parsedCats = JSON.parse(storedCats);
      } catch {
        parsedCats = {};
      }
    }
    const hiddenSet = new Set(storedHidden);
    hiddenSet.forEach((gtin) => {
      delete parsedCats[gtin];
      delete parsedCats[`seed-${gtin}`];
    });
    const mergedCats = { ...buildSeedCategoryMap(hiddenSet), ...parsedCats };
    setCategoryMap(mergedCats);
    localStorage.setItem(CATEGORY_STORE_KEY, JSON.stringify(mergedCats));
    const storedCustom = localStorage.getItem(CUSTOM_CATEGORY_STORE_KEY);
    if (storedCustom) {
      try {
        const parsed: Category[] = JSON.parse(storedCustom);
        const rebuilt = parsed.map((c) => ({
          ...c,
          icon: c.iconName ? iconFromName(c.iconName) : c.icon || iconFromName(undefined),
          color: c.color || '#6b7280'
        }));
        setCustomCategories(rebuilt);
      } catch {
        /* ignore */
      }
    }
    load(undefined, hiddenSet);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    productsRef.current = products;
  }, [products]);

  useEffect(() => {
    if (hasSyncedAllSkusRef.current || !products.length) return;
    hasSyncedAllSkusRef.current = true;
    syncSkuHistoryFromProducts(products);
  }, [products]);

  const normalizeText = (txt: string) =>
    txt
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

  const keywordCategories: Array<{ key: CategoryKey; pattern: RegExp }> = [
    { key: 'bolachas', pattern: /(bolacha|biscoit|cookie|rechead)/i },
    { key: 'padaria', pattern: /(pao|pão|massa|farinha|mistura|pudim)/i },
    { key: 'doces_sobremesas', pattern: /(chocolate|doce|bala|gelatina|achocolat|wafer|barrinha)/i },
    { key: 'bebidas_alcoolicas', pattern: /(cerveja|vinho|whisky|vodka|cachaça|cachaca)/i },
    { key: 'bebidas_nao_alcoolicas', pattern: /(refrigerante|suco|agua|mineral|energ|achocolatado|refri)/i },
    { key: 'carnes_peixes', pattern: /(carne|frango|peixe|sardinh|lingui|bovino|ave)/i },
    { key: 'laticinios', pattern: /(queijo|leite|iogurt|manteig|requeij|mussarela)/i },
    { key: 'temperos', pattern: /(tempero|pimenta|maionese|ketchup|molho|vinagre|mostarda|condimento)/i },
    { key: 'limpeza', pattern: /(sabao|sabão|detergente|limp|desinfetante|omo)/i },
    { key: 'hortifruti', pattern: /(fruta|legume|verdura|maçã|maca|banana|tomate)/i },
    { key: 'esportes', pattern: /(bola|esporte)/i },
    { key: 'tabacos', pattern: /(tabaco|cigarro|cigarrete|fumo|charuto|palheiro)/i },
    { key: 'alimentos', pattern: /(arroz|feijao|milho|macarrao|parafuso|ervilha)/i },
    { key: 'chas', pattern: /(cha|mate|camomila)/i },
    { key: 'brinquedos_criancas', pattern: /(brinquedo|infantil|boneco|boneca|jogo infantil)/i },
    { key: 'brinquedos_adultos', pattern: /(board game|tabuleiro|colecionavel|colecionável|adulto)/i }
  ];

  const suggestCategoryFromName = (name: string): CategoryKey | null => {
    const normalized = normalizeText(name);
    const found = keywordCategories.find((k) => k.pattern.test(normalized));
    return found ? (found.key as CategoryKey) : null;
  };

  useEffect(() => {
    const hiddenCount = hiddenSeedGtins.length;
    if (autoSeedRestoreRef.current) return;
    if (hiddenCount > 0 && products.length < defaultProducts.length) {
      autoSeedRestoreRef.current = true;
      handleSeedMerge();
    }
  }, [products.length, hiddenSeedGtins.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { categoryKey, generateSku, ...payload } = form as any;
    let skuToUse = (payload.sku || '').trim();
    if (!skuToUse || generateSku) {
      skuToUse = generateSkuFrom({ name: payload.name, brand: payload.brand, weight: payload.weight, measureUnit: payload.measureUnit });
    }
    payload.sku = skuToUse;

    const chosenCategory = categoryKey;
    const tempProduct: Product = {
      id: `temp-${Date.now()}`,
      name: payload.name,
      brand: payload.brand,
      gtin: payload.gtin,
      price: payload.price,
      cost: payload.cost,
      weight: payload.weight,
      stock: payload.stock,
      stockMin: payload.stockMin,
      stockMax: payload.stockMax,
      measureUnit: payload.measureUnit,
      sku: skuToUse,
      isActive: true,
      categoryKey: chosenCategory,
      isSeed: false
    };

    const currentList = productsRef.current;
    const optimisticList = [tempProduct, ...currentList.filter((p) => p.id !== tempProduct.id)];
    const map = { ...orderRef.current, [tempProduct.id]: Date.now() };
    saveOrderMap(map);
    lastAddedRef.current = tempProduct.id;
    try {
      localStorage.setItem(LAST_ADDED_KEY, tempProduct.id);
    } catch {
      /* ignore */
    }
    setHighlightId(tempProduct.id);
    applyProducts(optimisticList, undefined, tempProduct.id);
    setCategoryMap((prev) => {
      const next: Record<string, CategoryKey> = {
        ...prev,
        [tempProduct.id]: chosenCategory
      };
      if (payload.gtin) next[payload.gtin] = chosenCategory;
      if (skuToUse) next[skuToUse] = chosenCategory;
      localStorage.setItem(CATEGORY_STORE_KEY, JSON.stringify(next));
      return next;
    });
    setForm({
      name: '',
      brand: '',
      gtin: '',
      price: 0,
      cost: 0,
      weight: 0,
      stock: 0,
      stockMin: 0,
      stockMax: 0,
      measureUnit: 'kg',
      categoryKey: '' as CategoryKey
    });
    setCatFilter('');

    syncSkuHistoryFromProducts([tempProduct]);

    try {
      const res = await api.post('/products', payload);
      const created = { ...(res.data as Product), sku: skuToUse, categoryKey: chosenCategory, isSeed: false } as Product;
      const latest = productsRef.current;
      const replaced = latest.map((p) => (p.id === tempProduct.id ? created : p));
      const hasTemp = latest.some((p) => p.id === tempProduct.id);
      const updated = hasTemp ? replaced : [created, ...latest.filter((p) => p.id !== created.id)];
      const map = { ...orderRef.current };
      const ts = map[tempProduct.id] || Date.now();
      delete map[tempProduct.id];
      map[created.id] = ts;
      saveOrderMap(map);
      lastAddedRef.current = created.id;
      try {
        localStorage.setItem(LAST_ADDED_KEY, created.id);
      } catch {
        /* ignore */
      }
      setHighlightId(created.id);
      applyProducts(updated, undefined, created.id);
      setCategoryMap((prev) => {
        const next = {
          ...prev,
          [created.id]: chosenCategory,
          [created.gtin]: chosenCategory,
          ...(skuToUse ? { [skuToUse]: chosenCategory } : {})
        };
        localStorage.setItem(CATEGORY_STORE_KEY, JSON.stringify(next));
        return next;
      });
      notifySW();
      syncSkuHistoryFromProducts([created]);
    } catch (err) {
      // keep optimistic item; no-op
    }
  };

  const relevanceScore = (p: Product, term: string) => {
    const normalizedTerm = normalizeText(term);
    const nName = normalizeText(p.name || '');
    const nBrand = normalizeText(p.brand || '');
    let score = 0;
    const nameWords = nName.split(' ');
    if (nameWords.some((w) => w === normalizedTerm)) score = 120;
    if (nName.startsWith(normalizedTerm)) score = Math.max(score, 110);
    if (nName.includes(normalizedTerm)) score = Math.max(score, 100);
    if (nBrand.includes(normalizedTerm)) score = Math.max(score, 60);
    if ((p.gtin || '').toLowerCase().includes(term.toLowerCase())) score = Math.max(score, 40);
    return score;
  };

  const focusBySearch = () => {
    const term = search.trim();
    if (!term) {
      setHighlightId(null);
      applyProducts(productsRef.current);
      return;
    }
    const list = productsRef.current;
    const matches = list
      .map((p) => ({ product: p, score: relevanceScore(p, term) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        const orderA = orderRef.current[a.product.id] || 0;
        const orderB = orderRef.current[b.product.id] || 0;
        return orderB - orderA;
      })
      .map((item) => item.product);
    const nonMatches = list
      .filter((p) => !matches.find((m) => m.id === p.id))
      .sort((a, b) => {
        const orderA = orderRef.current[a.id] || 0;
        const orderB = orderRef.current[b.id] || 0;
        return orderB - orderA;
      });
    const finalList = [...matches, ...nonMatches];
    if (matches.length) {
      setHighlightId(matches[0].id);
    } else {
      setHighlightId(null);
    }
    setProducts(finalList);
    productsRef.current = finalList;
  };

  const handleDelete = async (id: string) => {
    const target = products.find((p) => p.id === id);
    if (target?.isSeed) {
      const updatedHidden = Array.from(new Set([...hiddenSeedGtins, target.gtin]));
      setHiddenSeedGtins(updatedHidden);
      persistHiddenSeedGtins(updatedHidden);
      const updatedProducts = products.filter((p) => p.id !== id);
      applyProducts(updatedProducts, new Set(updatedHidden));
      const newMap = { ...categoryMap };
      delete newMap[target.id];
      delete newMap[target.gtin];
      setCategoryMap(newMap);
      localStorage.setItem(CATEGORY_STORE_KEY, JSON.stringify(newMap));
      notifySW();
      return;
    }
    try {
      await api.delete(`/products/${id}`);
      const updated = products.filter((p) => p.id !== id);
      applyProducts(updated);
      const cleanedMap = { ...categoryMap };
      const removed = products.find((p) => p.id === id);
      if (removed) {
        delete cleanedMap[removed.id];
        delete cleanedMap[removed.gtin];
      }
      setCategoryMap(cleanedMap);
      localStorage.setItem(CATEGORY_STORE_KEY, JSON.stringify(cleanedMap));
      notifySW();
    } catch (err) {
      // ignore
    }
  };

  const startEdit = (p: Product) => {
    setEditing(p);
    const cat =
      categoryMap[p.id] ||
      categoryMap[p.gtin] ||
      seedCategoryMap[p.id] ||
      seedCategoryMap[p.gtin] ||
      (categories[0]?.key as CategoryKey) ||
      '';
    setEditForm({
      name: p.name,
      brand: p.brand,
      gtin: p.gtin,
      price: p.price,
      cost: p.cost || 0,
      weight: p.weight || 0,
      stock: p.stock,
      stockMin: p.stockMin || 0,
      stockMax: p.stockMax || 0,
      measureUnit: p.measureUnit || 'kg',
      categoryKey: cat
    });
    setEditCatFilter('');
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    setCatError('');
    const label = newCategory.label.trim();
    const key = (newCategory.key || slugify(newCategory.label)).trim();
    if (!label || !key) {
      setCatError('Informe nome e chave.');
      return;
    }
    if (categories.some((c) => c.key === key)) {
      setCatError('Essa chave já existe. Escolha outra.');
      return;
    }
    const iconNode = iconFromName(newCategory.iconName, 16, 'white');
    const newCat: Category = {
      key,
      label,
      description: newCategory.description || 'Categoria personalizada',
      icon: iconNode,
      iconName: newCategory.iconName || undefined,
      color: newCategory.color || '#6b7280'
    };
    const next = [...customCategories, newCat];
    setCustomCategories(next);
    localStorage.setItem(
      CUSTOM_CATEGORY_STORE_KEY,
      JSON.stringify(
        next.map((c) => ({
          key: c.key,
          label: c.label,
          description: c.description,
          iconName: c.iconName,
          color: c.color
        }))
      )
    );
    setNewCategory({ label: '', key: '', description: '', iconName: '', color: '#6366f1' });
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const { categoryKey, ...payload } = editForm;
    // Atualização otimista local
    if (editing.isSeed) {
      const updatedHidden = Array.from(new Set([...hiddenSeedGtins, editing.gtin].filter(Boolean)));
      setHiddenSeedGtins(updatedHidden);
      persistHiddenSeedGtins(updatedHidden);
      const locallyUpdated = products.map((p) =>
        p.id === editing.id ? { ...p, ...payload, categoryKey, isSeed: false } : p
      );
      applyProducts(locallyUpdated, new Set(updatedHidden));
      const newMap = { ...categoryMap, [editing.id]: categoryKey, [editing.gtin]: categoryKey };
      setCategoryMap(newMap);
      localStorage.setItem(CATEGORY_STORE_KEY, JSON.stringify(newMap));
      notifySW();
      setEditing(null);
      return;
    }

    const locallyUpdated = products.map((p) =>
      p.id === editing.id ? { ...p, ...payload, categoryKey, isSeed: !!p.isSeed } : p
    );
    applyProducts(locallyUpdated);
    const newMap = { ...categoryMap, [editing.id]: categoryKey, [editing.gtin]: categoryKey };
    setCategoryMap(newMap);
    localStorage.setItem(CATEGORY_STORE_KEY, JSON.stringify(newMap));

    try {
      await api.put(`/products/${editing.id}`, payload);
      notifySW();
    } catch {
      // offline ou falha: mantemos atualização local
    } finally {
      setEditing(null);
    }
  };

  const openResetModal = () => {
    setShowResetModal(true);
    setResetConfirmation('');
    setResetError('');
    setShowFinalConfirm(false);
  };

  const closeResetModal = () => {
    if (resetting) return;
    setShowResetModal(false);
    setShowFinalConfirm(false);
    setResetConfirmation('');
    setResetError('');
  };

  const handleResetRequest = () => {
    if (resetConfirmation.trim() !== REQUIRED_RESET_PHRASE) {
      setResetError('Para prosseguir, digite a frase exatamente como indicado.');
      return;
    }
    setResetError('');
    setShowFinalConfirm(true);
  };

  const performReset = async () => {
    if (resetConfirmation.trim() !== REQUIRED_RESET_PHRASE) {
      setShowFinalConfirm(false);
      setResetError('O texto não confere. Verifique e tente novamente.');
      return;
    }

    setResetting(true);
    let resetMessage: string | null = null;
    try {
      await api.delete('/products');
    } catch (err: any) {
      resetMessage = err?.response?.data?.message || 'Erro ao limpar estoque na API. Catálogo local foi limpo mesmo assim.';
    }

    const hiddenAll = defaultProducts.map((p) => p.gtin);
    setHiddenSeedGtins(hiddenAll);
    persistHiddenSeedGtins(hiddenAll);
    applyProducts([], new Set(hiddenAll));
    setCategoryMap({});
    localStorage.setItem(CATEGORY_STORE_KEY, JSON.stringify({}));
    notifySW();

    if (resetMessage) {
      setResetError(resetMessage);
      setShowFinalConfirm(false);
    } else {
      closeResetModal();
    }
    setResetting(false);
  };

  useEffect(() => {
    if (!showCategoryGrid) {
      setTooltipInfo(null);
    }
  }, [showCategoryGrid]);

  return (
    <div className="space-y-6">
      <style>{`
        .custom-range-thumb::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: linear-gradient(90deg, #f97316 50%, #eab308 50%);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          margin-top: -6px; /* Adjust for track height */
        }
        .custom-range-thumb::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: linear-gradient(90deg, #f97316 50%, #eab308 50%);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .custom-range-thumb::-webkit-slider-runnable-track {
          width: 100%;
          height: 6px;
          background: #e2e8f0;
          border-radius: 9999px;
        }
        .custom-range-thumb::-moz-range-track {
          width: 100%;
          height: 6px;
          background: #e2e8f0;
          border-radius: 9999px;
        }
        .allow-text-select { user-select: none; }
        .allow-text-select input,
        .allow-text-select select,
        .allow-text-select textarea {
          user-select: text;
        }
      `}</style>
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-slate-500">Catálogo</p>
          <h1 className="text-xl font-bold text-charcoal">Produtos</h1>
        </div>
      </div>

      <div className="relative grid grid-cols-1 gap-4">
        <div className="glass-card p-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-charcoal">Criar Categoria</h2>
              <p className="text-xs text-slate-500">Personalize setores para organizar os produtos do PDV.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCategoryGrid(true)}
                className="btn-secondary"
                title="Ver grid de categorias"
              >
                GRID DE CATEGORIAS
              </button>
              <button
                type="button"
                onClick={() => setIsCreateCategoryCollapsed((prev) => !prev)}
                className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:text-slate-700"
                title={isCreateCategoryCollapsed ? 'Expandir' : 'Recolher'}
              >
                {isCreateCategoryCollapsed ? (
                  <LucideIcons.ArrowDownNarrowWide className="h-5 w-5" />
                ) : (
                  <LucideIcons.ArrowUpWideNarrow className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
          {!isCreateCategoryCollapsed && (
            <>

              <form className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2" onSubmit={handleCreateCategory}>
                <div>
                  <label className="text-xs uppercase tracking-wide text-slate-500">Nome</label>
                  <input
                    value={newCategory.label}
                    onChange={(e) =>
                      setNewCategory((prev) => ({
                        ...prev,
                        label: e.target.value,
                        key: prev.key ? prev.key : slugify(e.target.value)
                      }))
                    }
                    placeholder="Ex: Molhos Artesanais"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-slate-500">Chave (slug)</label>
                  <input
                    value={newCategory.key}
                    onChange={(e) => setNewCategory((prev) => ({ ...prev, key: slugify(e.target.value) }))}
                    placeholder="molhos-artesanais"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-slate-500">Ícone (lucide.dev)</label>
                  <input
                    value={newCategory.iconName}
                    onChange={(e) => setNewCategory((prev) => ({ ...prev, iconName: e.target.value.trim() }))}
                    placeholder="ShoppingCart, Wine, Flame..."
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="text-xs uppercase tracking-wide text-slate-500">Cor do ícone</label>
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="color"
                        value={newCategory.color}
                        onChange={(e) => handleCategoryColorChange(e.target.value)}
                        className="h-10 w-16 rounded border border-slate-200"
                      />
                      <input
                        value={newCategory.color}
                        onChange={(e) => handleCategoryColorChange(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs uppercase tracking-wide text-slate-500">Descrição</label>
                  <textarea
                    value={newCategory.description}
                    onChange={(e) => setNewCategory((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Breve descrição da categoria"
                    className="mt-1 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    rows={2}
                  />
                </div>
                {catError && <p className="md:col-span-2 text-sm text-red-600">{catError}</p>}
                <div className="md:col-span-2 flex justify-end">
                  <button type="submit" className="btn-primary">
                    Salvar categoria
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        <div className="relative z-20 glass-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-charcoal">Novo produto</h2>
            <button
              type="button"
              onClick={() => setIsNewProductCollapsed((prev) => !prev)}
              className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:text-slate-700"
              title={isNewProductCollapsed ? 'Expandir' : 'Recolher'}
            >
              {isNewProductCollapsed ? (
                <LucideIcons.ArrowDownNarrowWide className="h-5 w-5" />
              ) : (
                <LucideIcons.ArrowUpWideNarrow className="h-5 w-5" />
              )}
            </button>
          </div>
          {!isNewProductCollapsed && (
              <form className="relative z-20 mt-4 space-y-3 allow-text-select" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                  <div className="md:col-span-1">
                    <input
                      placeholder="GTIN (Opcional)"
                    value={form.gtin}
                    onBlur={async (e) => {
                      const val = e.currentTarget.value.trim();
                      if (!val) return;
                      const found = await lookupSku(val);
                      if (found) {
                        setForm((prev) => ({
                          ...prev,
                          name: found.name || prev.name,
                          brand: found.brand || prev.brand,
                          price: found.price ? Number(found.price) : prev.price,
                          cost: prev.cost,
                          weight: prev.measureUnit && prev.measureUnit === found.measureUnit ? prev.weight : prev.weight,
                          measureUnit: found.measureUnit || prev.measureUnit,
                          gtin: found.gtin || prev.gtin,
                          sku: found.sku || prev.sku
                        }));
                      }
                    }}
                    onChange={(e) => setForm((prev) => ({ ...prev, gtin: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="md:col-span-1">
                  <input
                    placeholder="SKU (Opcional)"
                    value={form.sku}
                    onBlur={async (e) => {
                      const val = e.currentTarget.value.trim();
                      if (!val) return;
                      const found = await lookupSku(val);
                      if (found) {
                        setForm((prev) => ({
                          ...prev,
                          name: found.name || prev.name,
                          brand: found.brand || prev.brand,
                          price: found.price ? Number(found.price) : prev.price,
                          cost: prev.cost,
                          weight: prev.measureUnit && prev.measureUnit === found.measureUnit ? prev.weight : prev.weight,
                          measureUnit: found.measureUnit || prev.measureUnit,
                          gtin: found.gtin || prev.gtin,
                          sku: found.sku || prev.sku
                        }));
                      }
                    }}
                    onChange={(e) => setForm((prev) => ({ ...prev, sku: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
                <div className="md:col-span-1 flex items-center gap-2">
                  <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                    <input
                      type="checkbox"
                      checked={form.generateSku}
                      onChange={(e) => setForm((prev) => ({ ...prev, generateSku: e.target.checked }))}
                      className="rounded"
                    />
                    <span>Gerar SKU</span>
                  </label>
                </div>
              </div>
              <input
                placeholder="NOME"
                value={form.name}
                onChange={(e) => {
                  const val = e.target.value;
                  const suggested = suggestCategoryFromName(val);
                  setForm((prev) => ({
                    ...prev,
                    name: val,
                    ...(suggested ? { categoryKey: suggested } : {})
                  }));
                  setCatFilter(val);
                  if (suggested) {
                    const catLabel = categories.find((c) => c.key === suggested)?.label;
                    if (catLabel) setCatFilter(catLabel);
                  }
                }}
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
                      type="text"
                      placeholder="0,00"
                      value={formatCurrency(form.price)}
                      onChange={(e) => setForm((prev) => ({ ...prev, price: parseCurrency(e.target.value) }))}
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
                  <label className="text-xs uppercase tracking-wide text-slate-500">Peso / Unidade</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={form.weight}
                      onChange={(e) => setForm((prev) => ({ ...prev, weight: Number(e.target.value) }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    />
                    <select
                      value={form.measureUnit}
                      onChange={(e) => setForm((prev) => ({ ...prev, measureUnit: e.target.value }))}
                      className="mt-1 w-24 rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm focus:border-primary focus:outline-none"
                    >
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="mg">mg</option>
                      <option value="l">l</option>
                      <option value="ml">ml</option>
                      <option value="un">un</option>
                    </select>
                  </div>
                </div>

                <div className="w-1/2">
                  <label className="text-xs uppercase tracking-wide text-slate-500">Estoque Inicial</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={form.stock}
                    onChange={(e) => setForm((prev) => ({ ...prev, stock: Number(e.target.value) }))}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="w-full">
                  <label className="text-xs uppercase tracking-wide text-slate-500">Estoque Mínimo (Alerta)</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="range"
                      min="1"
                      max="1000"
                      value={form.stockMin}
                      onChange={(e) => setForm((prev) => ({ ...prev, stockMin: Number(e.target.value) }))}
                      className="custom-range-thumb w-full h-2 bg-transparent rounded-lg appearance-none cursor-pointer"
                    />
                    <input
                      type="number"
                      value={form.stockMin}
                      onChange={(e) => setForm((prev) => ({ ...prev, stockMin: Number(e.target.value) }))}
                      className="w-16 rounded-xl border border-slate-200 bg-white px-2 py-1 text-sm text-center focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>
              {renderCategoryDropdown(
                form.categoryKey,
                (val) => setForm((prev) => ({ ...prev, categoryKey: val })),
                catOpen,
                setCatOpen,
                false,
                catFilter,
                setCatFilter,
                true
              )}
              <button type="submit" className="btn-primary w-full">
                Salvar
              </button>
            </form>
          )}
        </div>

        <div className="mb-3 flex items-center justify-center">
          <div className="flex gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  focusBySearch();
                }
              }}
              placeholder="Nome, GTIN, marca..."
              className="w-96 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
            <button className="btn-secondary" onClick={focusBySearch}>
              Buscar
            </button>
          </div>
        </div>

        <div className="glass-card p-4">
          <div className="relative flex items-center justify-center">
            <div className="absolute left-0 flex items-center gap-2">
              <span className="text-xs text-slate-500">{products.length} itens</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => applySortMode('alpha')}
                  className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs ${sortMode === 'alpha' ? 'border border-primary/50 bg-primary/10 text-primary' : 'border border-slate-200 bg-white text-slate-600'
                    }`}
                  title="Ordenar alfabeticamente (A→Z)"
                >
                  <LucideIcons.ArrowUpAZ size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => applySortMode('recent')}
                  className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs ${sortMode === 'recent' ? 'border border-primary/50 bg-primary/10 text-primary' : 'border border-slate-200 bg-white text-slate-600'
                    }`}
                  title="Ordenar por último adicionado no topo"
                >
                  <LucideIcons.ArrowUpWideNarrow size={16} />
                </button>
                <button
                  type="button"
                  onClick={syncProductsToServer}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 hover:border-primary/50 hover:text-primary"
                  title="Enviar produtos locais para o banco de dados online (requer internet)"
                >
                  Atualizar banco de dados
                </button>
              </div>
            </div>
            <h2 className="text-lg font-semibold text-charcoal">Lista</h2>
            <button
              type="button"
              onClick={openResetModal}
              className="absolute right-0 inline-flex items-center gap-2 rounded-lg border border-transparent bg-transparent px-3 py-2 text-red-500 transition hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-400/40"
              title="Resetar estoque"
              aria-label="Resetar estoque"
            >
              <ListRestart className="h-5 w-5" />
            </button>
          </div>
          {syncStatus && <p className="mt-1 text-xs text-slate-600">{syncStatus}</p>}
          <div className="mt-3 space-y-2 max-h-[1000px] overflow-y-auto pr-1">
            {loading && <p className="text-sm text-slate-500">Carregando...</p>}
            {products.map((p) => (
              <div
                key={p.id}
                className={`flex flex-col gap-1 rounded-xl bg-white px-4 py-3 shadow-sm md:flex-row md:items-center md:justify-between ${
                  highlightId === p.id ? 'border-[3px] border-black' : 'border border-slate-100'
                }`}
              >
                <div className="flex flex-1 items-start gap-2">
                  {getCategory(p) && (
                    <span
                      className="mt-1 inline-flex h-7 w-7 items-center justify-center rounded-lg text-white"
                      style={{ backgroundColor: getCategory(p)!.color || '#e2e8f0', opacity: 0.78, borderRadius: '10px' }}
                      aria-hidden="true"
                    >
                      {getCategoryIcon(getCategory(p)!, 12, 'white')}
                    </span>
                  )}
                  <div>
                    <div className="text-sm font-semibold text-charcoal">{p.name}</div>
                    <div className="text-xs text-slate-500">
                      GTIN {p.gtin || 'N/A'} • {p.brand} • {p.weight} {p.measureUnit || 'kg'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right text-sm font-semibold text-primary flex flex-col items-end gap-1">
                    <span>R$ {Number(p.price).toFixed(2)}</span>
                    <div className={`text-xs px-2 py-0.5 rounded ${(() => {
                      const min = p.stockMin || 0;
                      const max = p.stockMax || 0;
                      const stock = p.stock;
                      if (stock <= min) return 'bg-red-100 text-red-600 animate-pulse font-bold border border-red-200';
                      const geometricMean = Math.sqrt(min * max);
                      if (stock <= geometricMean) return 'bg-amber-100 text-amber-600 font-bold border border-amber-200';
                      return 'bg-green-100 text-green-600 font-bold border border-green-200';
                    })()}`}>
                      Estoque {p.stock}
                    </div>
                    <div className="flex items-center gap-2 mt-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="range"
                        min="1"
                        max="1000"
                        value={p.stockMin || 0}
                        onChange={async (e) => {
                          const val = Number(e.target.value);
                          // Optimistic update
                          const updated = products.map(prod => prod.id === p.id ? { ...prod, stockMin: val } : prod);
                          setProducts(updated);
                          try {
                            await api.put(`/products/${p.id}`, { stockMin: val });
                          } catch (err) {
                            // revert on error if needed, but keeping simple for now
                          }
                        }}
                        className="custom-range-thumb w-24 h-1 bg-transparent rounded-lg appearance-none cursor-pointer"
                        title={`Mínimo: ${p.stockMin || 0}`}
                      />
                      <input
                        type="number"
                        min="1"
                        max="1000"
                        value={p.stockMin || 0}
                        onChange={async (e) => {
                          const val = Number(e.target.value);
                          const updated = products.map(prod => prod.id === p.id ? { ...prod, stockMin: val } : prod);
                          setProducts(updated);
                          try {
                            await api.put(`/products/${p.id}`, { stockMin: val });
                          } catch (err) {
                            // ignore
                          }
                        }}
                        className="w-12 text-xs border border-slate-200 rounded px-1 py-0.5 text-center focus:border-primary focus:outline-none"
                        title="Definir estoque mínimo"
                      />
                    </div>
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

      {
        showCategoryGrid && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
            <div className="relative w-[90vw] max-w-[1800px] h-[90vh] max-h-[1060px] rounded-2xl bg-white p-6 shadow-2xl overflow-visible">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-charcoal">Grid de Categorias</h3>
                <button onClick={() => setShowCategoryGrid(false)} className="text-slate-500 hover:text-slate-700">
                  ✕
                </button>
              </div>
              <div className="h-full overflow-auto">
                <div className="flex flex-wrap" style={{ gap: '2px', position: 'relative', overflow: 'visible' }}>
                  {categories.map((cat) => (
                    <div
                      key={cat.key}
                      className="group relative flex h-14 w-14 items-center justify-center rounded-xl p-1 shadow-sm transition hover:scale-105 focus-within:scale-105 focus:outline-none"
                      style={{ backgroundColor: cat.color || '#e2e8f0', overflow: 'visible' }}
                      tabIndex={0}
                      aria-label={cat.label}
                      onMouseEnter={(e) => showTooltip(cat, e.currentTarget)}
                      onMouseLeave={() => setTooltipInfo(null)}
                      onFocus={(e) => showTooltip(cat, e.currentTarget)}
                      onBlur={() => setTooltipInfo(null)}
                    >
                      <div className="text-white" aria-hidden="true">
                        {getCategoryIcon(cat, 18, 'white')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      }

      {
        editing && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl p-5 md:p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-charcoal">Editar produto</h3>
                <button onClick={() => setEditing(null)} className="text-slate-500 hover:text-slate-700">
                  ✕
                </button>
              </div>
              <form className="mt-3 space-y-2 allow-text-select" onSubmit={submitEdit}>
                <input
                  placeholder="GTIN (Opcional)"
                  value={editForm.gtin}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, gtin: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm leading-tight focus:border-primary focus:outline-none"
                />
                <input
                placeholder="NOME"
                value={editForm.name}
                onChange={(e) => {
                  const val = e.target.value;
                  const suggested = suggestCategoryFromName(val);
                  setEditForm((prev) => ({
                    ...prev,
                    name: val,
                    ...(suggested ? { categoryKey: suggested } : {})
                  }));
                  setEditCatFilter(val);
                  if (suggested) {
                    const catLabel = categories.find((c) => c.key === suggested)?.label;
                    if (catLabel) setEditCatFilter(catLabel);
                  }
                }}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm leading-tight focus:border-primary focus:outline-none"
                required
              />
                <input
                  placeholder="MARCA"
                  value={editForm.brand}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, brand: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm leading-tight focus:border-primary focus:outline-none"
                  required
                />
                <div className="flex gap-2">
                  <div className="w-1/2">
                    <label className="text-xs uppercase tracking-wide text-slate-500">Valor do produto</label>
                    <div className="relative mt-1">
                      <input
                        type="text"
                        placeholder="0,00"
                        value={formatCurrency(editForm.price)}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, price: parseCurrency(e.target.value) }))}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pr-10 text-sm leading-tight focus:border-primary focus:outline-none"
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
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pr-10 text-sm leading-tight focus:border-primary focus:outline-none"
                      />
                      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-slate-500">R$</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="w-1/2">
                    <label className="text-xs uppercase tracking-wide text-slate-500">Peso / Unidade</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        value={editForm.weight}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, weight: Number(e.target.value) }))}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm leading-tight focus:border-primary focus:outline-none"
                      />
                      <select
                        value={editForm.measureUnit}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, measureUnit: e.target.value }))}
                        className="mt-1 w-24 rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm leading-tight focus:border-primary focus:outline-none"
                      >
                        <option value="kg">kg</option>
                        <option value="g">g</option>
                        <option value="mg">mg</option>
                        <option value="l">l</option>
                        <option value="ml">ml</option>
                        <option value="un">un</option>
                      </select>
                    </div>
                  </div>
                  <div className="w-1/2">
                    <label className="text-xs uppercase tracking-wide text-slate-500">Estoque Atual</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={editForm.stock}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, stock: Number(e.target.value) }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm leading-tight focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="w-1/2">
                    <label className="text-xs uppercase tracking-wide text-slate-500">Estoque Mínimo</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={editForm.stockMin}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, stockMin: Number(e.target.value) }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm leading-tight focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="w-1/2">
                    <label className="text-xs uppercase tracking-wide text-slate-500">Estoque Máximo</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={editForm.stockMax}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, stockMax: Number(e.target.value) }))}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm leading-tight focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
                {renderCategoryDropdown(
                  editForm.categoryKey,
                  (val) => setEditForm((prev) => ({ ...prev, categoryKey: val })),
                  editCatOpen,
                  setEditCatOpen,
                  false,
                  editCatFilter,
                  setEditCatFilter,
                  true
                )}
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
        )
      }
      {
        showResetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
            <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-charcoal">Reset/Limpar Lista de Estoque de Produtos</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Esta ação remove todo o estoque listado. Ela não pode ser desfeita e causará a limpeza completa da lista de produtos.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeResetModal}
                  className="text-slate-400 transition hover:text-slate-600"
                  aria-label="Fechar aviso de reset"
                >
                  ✕
                </button>
              </div>
              <label className="mt-4 block text-xs uppercase tracking-wide text-slate-500">
                Digite <span className="font-semibold text-red-700">*Quero deletar estoque de Espetinho*</span> para deletar/limpar o estoque inteiro
              </label>
              <input
                value={resetConfirmation}
                onChange={(e) => setResetConfirmation(e.target.value)}
                placeholder="Quero deletar estoque de Espetinho"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none placeholder:text-[#c25f62]/[0.76]"
                disabled={resetting}
              />
              {resetError && !showFinalConfirm && (
                <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{resetError}</p>
              )}
              <div className="mt-6 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeResetModal}
                  className="rounded-lg border border-transparent px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
                  disabled={resetting}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleResetRequest}
                  className="rounded-lg border border-transparent bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-60"
                  disabled={resetting}
                >
                  Confirmar
                </button>
              </div>
              {showFinalConfirm && (
                <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/20 px-4">
                  <div className="w-full max-w-xs rounded-2xl bg-white p-5 shadow-2xl">
                    <h4 className="text-base font-semibold text-charcoal">Tem certeza disso?</h4>
                    <p className="mt-2 text-sm text-slate-600">Esta ação apagará o estoque exibido na lista.</p>
                    <div className="mt-6 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowFinalConfirm(false)}
                        className="rounded-lg border border-transparent bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
                        disabled={resetting}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={performReset}
                        className="rounded-lg border border-transparent bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-60"
                        disabled={resetting}
                      >
                        Ok
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      }
      {
        tooltipInfo && typeof document !== 'undefined'
          ? createPortal(
            <div
              style={
                {
                  position: 'fixed',
                  top: tooltipInfo.y,
                  left: tooltipInfo.x,
                  transform: 'translateX(-50%)',
                  backgroundColor: '#211f1f',
                  borderColor: '#000000',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderRadius: '32px',
                  color: '#bab3b3',
                  padding: '4px 8px',
                  fontSize: '12px',
                  fontWeight: 500,
                  pointerEvents: 'none',
                  zIndex: 9999,
                  whiteSpace: 'nowrap'
                } as React.CSSProperties
              }
            >
              {tooltipInfo.label}
              {tooltipInfo.description ? ` – ${tooltipInfo.description}` : ''}
            </div>,
            document.body
          )
          : null
      }
    </div >
  );
};

export default ProductsPage;
