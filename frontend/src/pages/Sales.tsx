import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  QrCode,
  HandCoins,
  Banknote,
  BanknoteArrowUp,
  Trash,
  Cookie,
  Wheat,
  Apple,
  Milk,
  Drumstick,
  Croissant,
  Snowflake,
  GlassWater,
  Package,
  Coffee,
  ChefHat,
  Candy,
  Sparkles,
  ShowerHead,
  Battery,
  Flame,
  ToyBrick,
  Puzzle,
  Gamepad2,
  User,
  Dices,
  Popcorn,
  Circle,
  Nut,
  Carrot,
  Pencil,
  Book,
  Trophy,
  Shirt,
  Home,
  Car,
  Dog,
  Baby,
  Heart,
  Scissors,
  Refrigerator,
  Smartphone,
  Armchair,
  Gem
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import api from '../api/client';
import { addLocalSale, addPendingSale, getPendingSales, getProducts, removePendingSale, saveProducts } from '../utils/idb';
import { mergeWithSeedProducts, readHiddenSeedGtins } from '../data/productSeeds';

type Product = {
  id: string;
  name: string;
  price: number;
  gtin: string;
  brand: string;
  discountPercent?: number;
  isOnPromotion?: boolean;
  cost?: number;
  categoryKey?: string;
  isSeed?: boolean;
};
type CartItem = { product: Product; quantity: number };
type PixKey = { id: string; type: string; key: string; isDefault: boolean };

// Constrói o texto do recibo em formato ASCII (monoespaçado)
function buildReceiptText(receipt: { items: CartItem[]; total: number; paymentType: string }) {
  const label = (() => {
    switch (receipt.paymentType) {
      case 'PIX':
        return 'PIX';
      case 'MONEY':
        return 'DINHEIRO';
      case 'CARD_DEBIT':
        return 'CARTÃO DE DÉBITO';
      case 'CARD_CREDIT':
        return 'CARTÃO DE CRÉDITO';
      default:
        return receipt.paymentType;
    }
  })();

  const lines: string[] = [];
  lines.push('(---Parada--do--Espetinho->');
  lines.push('');
  receipt.items.forEach((it) => {
    lines.push(it.product.name);
    lines.push(`GTIN ${it.product.gtin} • ${it.product.brand}`);
    lines.push(`R$ ${Number(it.product.price).toFixed(2)}`);
    if (it.product.cost) lines.push(`Taxa individual: R$ ${Number(it.product.cost).toFixed(2)}`);
    lines.push('');
  });
  lines.push(`TOTAL: R$ ${receipt.total.toFixed(2)}`);
  lines.push(`FORMA DE PAGAMENTO: ${label}`);
  lines.push('*** PAGAMENTO APROVADO ***');

  return lines.join('\n');
}

const PRODUCTS_CACHE_KEY = 'pdv-products-cache'; // mantém compat localStorage
const SALES_STATS_KEY = 'pdv-sales-stats';

const CATEGORY_STORE_KEY = 'productCategories';

type CategoryMeta = {
  key: string;
  label: string;
  icon: LucideIcon;
};

const categories: CategoryMeta[] = [
  { key: 'basicos', label: 'Alimentos Básicos', icon: Wheat },
  { key: 'hortifruti', label: 'Hortifrúti', icon: Apple },
  { key: 'laticinios', label: 'Laticínios & Frios', icon: Milk },
  { key: 'carnes', label: 'Carnes & Peixes', icon: Drumstick },
  { key: 'paes', label: 'Pães & Panificação', icon: Croissant },
  { key: 'congelados', label: 'Alimentos Congelados', icon: Snowflake },
  { key: 'bebidas', label: 'Bebidas', icon: GlassWater },
  { key: 'processados', label: 'Alimentos Processados', icon: Package },
  { key: 'ingredientes', label: 'Ingredientes Culinários', icon: ChefHat },
  { key: 'ultraprocessados', label: 'Ultraprocessados', icon: Candy },
  { key: 'limpeza', label: 'Produtos de Limpeza', icon: Sparkles },
  { key: 'higiene', label: 'Higiene Pessoal', icon: ShowerHead },
  { key: 'eletronicos', label: 'Eletrônicos', icon: Battery },
  { key: 'cafe', label: 'Bebidas Quentes', icon: Coffee },
  { key: 'tabacaria', label: 'Tabacaria & Fumo', icon: Flame },
  { key: 'brinquedos_infantis', label: 'Brinquedos Infantis', icon: ToyBrick },
  { key: 'brinquedos_educativos', label: 'Brinquedos Educativos', icon: Puzzle },
  { key: 'brinquedos_externos', label: 'Brinquedos Externos', icon: Gamepad2 },
  { key: 'bonecas_figures', label: 'Bonecas & Action Figures', icon: User },
  { key: 'jogos_board', label: 'Jogos & Board Games', icon: Dices },
  { key: 'salgadinhos', label: 'Salgadinhos & Snacks', icon: Popcorn },
  { key: 'salgadinhos_milho', label: 'Salgadinhos de Milho', icon: Circle },
  { key: 'salgadinhos_batata', label: 'Salgadinhos de Batata', icon: Circle },
  { key: 'amendoins_petiscos', label: 'Amendoins & Petiscos', icon: Nut },
  { key: 'snacks_saudaveis', label: 'Snacks Saudáveis', icon: Carrot },
  { key: 'papelaria', label: 'Papelaria', icon: Pencil },
  { key: 'livros_midias', label: 'Livros & Mídias', icon: Book },
  { key: 'esportes', label: 'Esportes & Lazer', icon: Trophy },
  { key: 'moda', label: 'Moda & Vestuário', icon: Shirt },
  { key: 'casa_jardim', label: 'Casa & Jardim', icon: Home },
  { key: 'automotivo', label: 'Automotivo', icon: Car },
  { key: 'pet', label: 'Pet Shop', icon: Dog },
  { key: 'bebes', label: 'Bebês & Crianças', icon: Baby },
  { key: 'saude', label: 'Saúde & Farmácia', icon: Heart },
  { key: 'beleza', label: 'Beleza & Perfumaria', icon: Scissors },
  { key: 'eletrodomesticos', label: 'Eletrodomésticos', icon: Refrigerator },
  { key: 'tecnologia', label: 'Tecnologia', icon: Smartphone },
  { key: 'moveis', label: 'Móveis', icon: Armchair },
  { key: 'joias', label: 'Joias & Relógios', icon: Gem },
  { key: 'bolachas', label: 'Bolachas & Cookies', icon: Cookie }
];

const renderCategoryIcon = (meta: CategoryMeta | undefined, size = 18) => {
  if (!meta?.icon) return null;
  const IconComp = meta.icon;
  return <IconComp size={size} color="white" />;
};

const categoryColors: Record<string, string> = {
  basicos: '#fbbf24',
  hortifruti: '#22c55e',
  laticinios: '#67e8f9',
  carnes: '#f97316',
  paes: '#facc15',
  congelados: '#38bdf8',
  bebidas: '#ec4899',
  processados: '#c084fc',
  ingredientes: '#a16207',
  ultraprocessados: '#f43f5e',
  limpeza: '#1e3a8a',
  higiene: '#475569',
  eletronicos: '#0f766e',
  cafe: '#7c3aed',
  tabacaria: '#334155',
  brinquedos_infantis: '#a855f7',
  brinquedos_educativos: '#c084fc',
  brinquedos_externos: '#8b5cf6',
  bonecas_figures: '#ec4899',
  jogos_board: '#6366f1',
  salgadinhos: '#f97316',
  salgadinhos_milho: '#f59e0b',
  salgadinhos_batata: '#fbbf24',
  amendoins_petiscos: '#d97706',
  snacks_saudaveis: '#22c55e',
  papelaria: '#38bdf8',
  livros_midias: '#0ea5e9',
  esportes: '#22c55e',
  moda: '#d946ef',
  casa_jardim: '#10b981',
  automotivo: '#0ea5e9',
  pet: '#f59e0b',
  bebes: '#f472b6',
  saude: '#ef4444',
  beleza: '#fb7185',
  eletrodomesticos: '#06b6d4',
  tecnologia: '#0ea5e9',
  moveis: '#c084fc',
  joias: '#fbbf24',
  bolachas: '#fb923c'
};

const SalesPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadedRemote, setLoadedRemote] = useState(false);
  const [hiddenSeedGtins] = useState<string[]>(() => readHiddenSeedGtins());
  const [search, setSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
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
  const [showCashModal, setShowCashModal] = useState(false);
  const [cashAmount, setCashAmount] = useState(0);
  const [cashPayerName, setCashPayerName] = useState('');
  const [cashPayerCpf, setCashPayerCpf] = useState('');
  const [showCardModal, setShowCardModal] = useState(false);
  const [cardBrand, setCardBrand] = useState('');
  const [cardAuthCode, setCardAuthCode] = useState('');
  const [cardValue, setCardValue] = useState(0);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'paid'>('idle');
  const [lastReceipt, setLastReceipt] = useState<{ items: CartItem[]; total: number; paymentType: string } | null>(null);
  const [pendingPixSale, setPendingPixSale] = useState<{ items: CartItem[]; total: number; paymentType: string } | null>(null);
  const [pendingCashSale, setPendingCashSale] = useState<{ items: CartItem[]; total: number; paymentType: string } | null>(null);
  const [pendingCardSale, setPendingCardSale] = useState<{ items: CartItem[]; total: number; paymentType: string } | null>(null);
  const [pendingTx, setPendingTx] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const totalItems = useMemo(() => cart.reduce((acc, item) => acc + (item.quantity || 0), 0), [cart]);

  useEffect(() => {
    // Primeiro tenta IDB
    (async () => {
      try {
        const local = await getProducts();
        if (local?.length) setProducts(local);
      } catch {
        /* ignore */
      }
    })();
    const storedCats = localStorage.getItem(CATEGORY_STORE_KEY);
    if (storedCats) {
      try {
        setCategoryMap(JSON.parse(storedCats));
      } catch {
        /* ignore */
      }
    }
    // Em seguida, legacy cache localStorage
    const cached = localStorage.getItem(PRODUCTS_CACHE_KEY);
    if (cached && !products.length) {
      try {
        const parsed = JSON.parse(cached);
        setProducts(parsed);
      } catch {
        /* ignore */
      }
    }
    // Depois busca remoto e atualiza caches
    const mergeSeeds = (list: Product[]) =>
      mergeWithSeedProducts<Product>(list, new Set(hiddenSeedGtins)) as Product[];

    const loadRemote = async () => {
      try {
        const res = await api.get('/products');
        const merged = mergeSeeds(res.data);
        setProducts(merged);
        localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(merged));
        await saveProducts(merged);
        setLoadedRemote(true);
      } catch {
        const cached = localStorage.getItem(PRODUCTS_CACHE_KEY);
        let fallback: Product[] = [];
        if (cached) {
          try {
            fallback = JSON.parse(cached);
          } catch {
            fallback = [];
          }
        }
        const mergedFallback = mergeSeeds(fallback);
        if (!mergedFallback.length) {
          const seeded = mergeSeeds([]);
          setProducts(seeded);
          localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(seeded));
          await saveProducts(seeded);
        } else {
          setProducts(mergedFallback);
          localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(mergedFallback));
          await saveProducts(mergedFallback);
        }
        setLoadedRemote(false);
      }
    };
    loadRemote();
  }, []);

  useEffect(() => {
    // tenta sincronizar vendas pendentes quando volta online
    const sync = async () => {
      if (!navigator.onLine) return;
      try {
        const pending = await getPendingSales();
        setPendingCount(pending.length);
        for (const sale of pending) {
          try {
            const saleRes = await api.post('/sales', {
              items: sale.items,
              paymentType: sale.paymentType
            });
            // não geramos pix offline; sincronização simples
            await addLocalSale({ ...sale, id: saleRes.data.id || sale.id });
            await removePendingSale(sale.id);
          } catch {
            // se falhar, tenta depois
          }
        }
        const remaining = await getPendingSales();
        setPendingCount(remaining.length);
      } catch {
        /* ignore */
      }
    };
    sync();
    window.addEventListener('online', sync);
    window.addEventListener('offline', () => setIsOffline(true));
    window.addEventListener('online', () => setIsOffline(false));
    return () => window.removeEventListener('online', sync);
  }, []);

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

  // Poll de status do PIX
  useEffect(() => {
    if (!pendingTx || paymentStatus === 'paid') return;
    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/mp/payments/${pendingTx}/status`);
        const status = (res.data.status || '').toString().toUpperCase();
        if (status === 'APPROVED' || status === 'PAID') {
          setPaymentStatus('paid');
          setTimeout(() => {
            setShowPixModal(false);
            if (pendingPixSale) {
              setLastReceipt(pendingPixSale);
              setCart([]);
              setAppliedCoupon(null);
              setCoupon('');
            }
            setPendingPixSale(null);
            setPendingTx(null);
          }, 900);
        }
      } catch {
        /* ignore */
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [pendingTx, paymentStatus, pendingPixSale]);

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

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((c) => c.product.id !== productId));
  };

  const total = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const fees = cart.reduce((sum, item) => sum + (item.product.cost || 0) * item.quantity, 0);
    const discount = appliedCoupon ? subtotal * (appliedCoupon.discountPercent / 100) : 0;
    return { subtotal, fees, discount, total: subtotal + fees - discount };
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
      setShowCashModal(false);
      const cartSnapshot = [...cart];
      const totalSnapshot = total.total;
      const paymentSnapshot = paymentType;
      setPaymentStatus('idle');
      setLastReceipt(null);
      if (paymentType === 'PIX') {
        // Integração Mercado Pago: cria a venda, depois cria o pagamento PIX (API HTTP)
        const saleRes = await api.post('/sales', {
          items: cart.map((c) => ({ productId: c.product.id, quantity: c.quantity })),
          couponCode: appliedCoupon?.code,
          paymentType
        });
        const mpRes = await api.post('/mp/pix', {
          amount: total.total,
          description: 'Venda PDV',
          payer: undefined,
          saleId: saleRes.data.id
        });
        setPendingTx(String(mpRes.data.id));
        setPixPayload(mpRes.data.qr_code || '');
        setPixQr(`data:image/png;base64,${mpRes.data.qr_base64}`);
        setMessage('PIX gerado. Escaneie o QR Code para pagar.');
        setShowPixModal(true);
        setPendingPixSale({ items: cartSnapshot, total: totalSnapshot, paymentType: paymentSnapshot });
        await recordLocalSale(cartSnapshot, paymentSnapshot, totalSnapshot);
      } else if (paymentType === 'MONEY') {
        // Dinheiro/scambo: abre modal para confirmar pagamento na mão
        setPendingCashSale({ items: cartSnapshot, total: totalSnapshot, paymentType: paymentSnapshot });
        setCashAmount(totalSnapshot);
        setShowCashModal(true);
        return;
      } else {
        // Cartões: registro manual do pagamento feito na maquininha física
        setPendingCardSale({ items: cartSnapshot, total: totalSnapshot, paymentType: paymentSnapshot });
        setCardValue(totalSnapshot);
        setShowCardModal(true);
        return;
      }
    } catch (err) {
      setMessage('Erro ao registrar venda, salvando para sincronizar depois.');
      const saleId = crypto.randomUUID();
      await addPendingSale({
        id: saleId,
        items: cart.map((c) => ({ productId: c.product.id, quantity: c.quantity })),
        total: total.total,
        paymentType,
        createdAt: Date.now()
      });
    }
  };

  const recordLocalSale = async (itemsSnapshot: CartItem[], paymentSnapshot: string, totalSnapshot: number) => {
    const statsRaw = localStorage.getItem(SALES_STATS_KEY);
    const stats: Record<string, number> = statsRaw ? JSON.parse(statsRaw) : {};
    itemsSnapshot.forEach((c) => {
      stats[c.product.id] = (stats[c.product.id] || 0) + c.quantity;
    });
    localStorage.setItem(SALES_STATS_KEY, JSON.stringify(stats));
    const saleId = crypto.randomUUID();
    await addLocalSale({
      id: saleId,
      items: itemsSnapshot.map((c) => ({ productId: c.product.id, quantity: c.quantity })),
      total: totalSnapshot,
      paymentType: paymentSnapshot,
      createdAt: Date.now()
    });
  };

  const confirmCashPayment = async () => {
    if (!pendingCashSale) return;
    try {
      // Apenas registra a venda; o pagamento já foi feito no caixa físico
      await api.post('/sales', {
        items: pendingCashSale.items.map((c) => ({ productId: c.product.id, quantity: c.quantity })),
        couponCode: appliedCoupon?.code,
        paymentType: pendingCashSale.paymentType
      });
      setMessage('Venda registrada com sucesso');
      setLastReceipt({ items: pendingCashSale.items, total: pendingCashSale.total, paymentType: pendingCashSale.paymentType });
      setCart([]);
      setAppliedCoupon(null);
      setCoupon('');
      await recordLocalSale(pendingCashSale.items, pendingCashSale.paymentType, pendingCashSale.total);
    } catch (err) {
      setMessage('Erro ao registrar venda, salvando para sincronizar depois.');
      const saleId = crypto.randomUUID();
      await addPendingSale({
        id: saleId,
        items: pendingCashSale.items.map((c) => ({ productId: c.product.id, quantity: c.quantity })),
        total: pendingCashSale.total,
        paymentType: pendingCashSale.paymentType,
        createdAt: Date.now()
      });
    } finally {
      setShowCashModal(false);
      setPendingCashSale(null);
      setCashPayerName('');
      setCashPayerCpf('');
    }
  };

  const confirmCardPayment = async () => {
    if (!pendingCardSale) return;
    try {
      // Pagamento já passou na maquininha física; aqui só registramos a venda
      await api.post('/sales', {
        items: pendingCardSale.items.map((c) => ({ productId: c.product.id, quantity: c.quantity })),
        couponCode: appliedCoupon?.code,
        paymentType: pendingCardSale.paymentType
      });
      setMessage('Venda registrada com sucesso');
      setLastReceipt({
        items: pendingCardSale.items,
        total: pendingCardSale.total,
        paymentType: pendingCardSale.paymentType
      });
      setCart([]);
      setAppliedCoupon(null);
      setCoupon('');
      await recordLocalSale(pendingCardSale.items, pendingCardSale.paymentType, pendingCardSale.total);
    } catch (err) {
      setMessage('Erro ao registrar venda, salvando para sincronizar depois.');
      const saleId = crypto.randomUUID();
      await addPendingSale({
        id: saleId,
        items: pendingCardSale.items.map((c) => ({ productId: c.product.id, quantity: c.quantity })),
        total: pendingCardSale.total,
        paymentType: pendingCardSale.paymentType,
        createdAt: Date.now()
      });
    } finally {
      setShowCardModal(false);
      setPendingCardSale(null);
      setCardAuthCode('');
      setCardBrand('');
    }
  };

  const stats = useMemo(() => {
    const raw = localStorage.getItem(SALES_STATS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  }, [cart.length]); // recalcula quando mexe no carrinho (após venda)

  const renderReceipt = () => {
    if (!lastReceipt) return null;
    const receiptText = buildReceiptText(lastReceipt);
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-mono text-slate-800">
        <pre className="whitespace-pre-wrap text-center md:text-left">{receiptText}</pre>
      </div>
    );
  };

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const term = search.toLowerCase();
    return products.filter((p) => {
      const catKey = categoryMap[p.id] || categoryMap[p.gtin] || p.categoryKey;
      const catLabel = categories.find((c) => c.key === catKey)?.label?.toLowerCase() || '';
      return (
        p.name.toLowerCase().includes(term) ||
        p.brand.toLowerCase().includes(term) ||
        p.gtin.toLowerCase().includes(term) ||
        catLabel.includes(term)
      );
    });
  }, [products, search, categoryMap]);

  // Se o scanner preenche um GTIN completo, adiciona ao carrinho e limpa o campo
  useEffect(() => {
    const code = search.trim();
    if (!code) return;
    const matched = products.find((p) => p.gtin === code);
    if (matched) {
      addToCart(matched);
      setSearch('');
      setShowSuggestions(true);
    }
  }, [search, products]);

  const bestSellers = useMemo(() => {
    const ranked = Object.entries(stats)
      .map(([id, count]) => ({ id, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map((entry) => products.find((p) => p.id === entry.id))
      .filter(Boolean) as Product[];
    if (ranked.length >= 10) return ranked;
    const fallback = products
      .filter((p) => !ranked.some((rankedItem) => rankedItem.id === p.id))
      .slice(0, Math.max(0, 10 - ranked.length));
    return [...ranked, ...fallback];
  }, [stats, products]);

  const getCategory = (p: Product) => {
    // prioridade: categoria que veio do backend (BD)
    const keyFromDb = p.categoryKey;

    // override local (se você ainda quiser usar o map do localStorage)
    const overrideKey = categoryMap[p.gtin] || categoryMap[p.id];

    const key = overrideKey || keyFromDb;
    const meta = categories.find((c) => c.key === key);

    return { key, meta };
  };

  return (
    <div className="space-y-6">
      {(isOffline || pendingCount > 0) && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {isOffline ? 'Offline – mostrando dados locais.' : 'Online'}
          {pendingCount > 0 && (
            <span className="ml-2 font-semibold text-amber-900">Vendas pendentes: {pendingCount}</span>
          )}
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-[2.5fr_0.8fr]">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-charcoal">PDV (Ponto de Venda)</h1>
            </div>
            <div className="relative w-full md:w-[clamp(20rem,35vw,34rem)]">
              <label className="text-xs uppercase tracking-wide text-slate-500">Buscar item / GTIN</label>
              <input
                ref={searchRef}
                value={search}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Escaneie o código ou digite nome/GTIN"
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
              {showSuggestions && (
                <div className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
                  {filteredProducts.length === 0 && (
                    <div className="px-3 py-2 text-sm text-slate-500">
                      {loadedRemote ? 'Nenhum produto encontrado.' : 'Digite ou escaneie para buscar produtos.'}
                    </div>
                  )}
                  {(search.trim() ? filteredProducts : bestSellers).map((p) => {
                    const productCategory = getCategory(p);
                    const meta = productCategory.meta;
                    return (
                    <button
                      key={p.id}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        addToCart(p);
                        setSearch('');
                        setShowSuggestions(false);
                      }}
                      className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left hover:bg-primary/5"
                    >
                      <span className="text-sm font-semibold text-charcoal">{p.name}</span>
                      <span className="text-xs text-slate-500">GTIN {p.gtin} • {p.brand}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-primary">R$ {Number(p.price).toFixed(2)}</span>
                        {meta && (
                          <span
                            className="flex h-6 w-6 items-center justify-center rounded-md text-white"
                            style={{
                              backgroundColor: categoryColors[productCategory.key || ''] || '#e2e8f0',
                              overflow: 'visible'
                            }}
                            title={meta.label}
                          >
                            {renderCategoryIcon(meta, 16)}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                  })}
                </div>
              )}
            </div>
          </div>
          <div className="glass-card p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-charcoal">Itens (visualização rápida)</h2>
              <span className="text-xs text-slate-500">
                {totalItems} {totalItems === 1 ? 'item' : 'itens'}
              </span>
            </div>
            <div className="mt-3 grid max-h-56 grid-cols-1 gap-3 overflow-y-auto">
              {cart.map((item) => {
                const itemCategory = getCategory(item.product);
                const meta = itemCategory.meta;
                return (
                  <div
                    key={item.product.id}
                    className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-base font-semibold text-charcoal">
                          {meta && (
                            <span
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-white"
                              style={{
                                backgroundColor: categoryColors[itemCategory.key || ''] || '#e2e8f0',
                                overflow: 'visible'
                              }}
                              title={meta.label}
                            >
                              {renderCategoryIcon(meta, 18)}
                            </span>
                          )}
                          <span>{item.product.name}</span>
                        </div>
                        <div className="text-xs text-slate-500">
                          GTIN {item.product.gtin} • {item.product.brand}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <div className="text-sm font-semibold text-primary">
                            R$ {Number(item.product.price).toFixed(2)}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Taxa individual: R$ {Number(item.product.cost || 0).toFixed(2)}
                          </div>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) => {
                                const val = Math.max(1, Number(e.target.value) || 1);
                                setCart((prev) =>
                                  prev.map((c) =>
                                    c.product.id === item.product.id ? { ...c, quantity: val } : c
                                  )
                                );
                              }}
                              className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-right text-xs"
                            />
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="rounded-lg bg-[#b91c1c] px-3 py-2 text-white transition hover:brightness-110"
                        title="Remover item"
                      >
                        <Trash size={18} className="text-black" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {cart.length === 0 && <p className="text-sm text-slate-500">Pesquise ou escaneie para adicionar itens.</p>}
            </div>
          </div>
        </div>

        <div className="w-full lg:max-w-sm lg:justify-self-end">
          <div className="glass-card p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-charcoal">Carrinho de compra</h2>
              <span className="text-xs text-slate-500">
                {totalItems} {totalItems === 1 ? 'item' : 'itens'}
              </span>
            </div>
            <div className="mt-3 space-y-2 max-h-56 overflow-y-auto">
              {cart.map((item) => {
                const itemCategory = getCategory(item.product);
                const meta = itemCategory.meta;
                return (
                  <div
                    key={item.product.id}
                    className="rounded-xl border border-slate-100 bg-white px-3 py-2 shadow-sm transition hover:-translate-y-0.5 hover:shadow"
                  >
                    <div className="flex items-start justify-between gap-2 text-sm font-semibold text-charcoal">
                      <div className="flex items-start gap-2">
                        {meta && (
                          <span
                            className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-md text-white"
                            style={{
                              backgroundColor: categoryColors[itemCategory.key || ''] || '#e2e8f0',
                              overflow: 'visible'
                            }}
                            title={meta.label}
                          >
                            {renderCategoryIcon(meta, 16)}
                          </span>
                        )}
                        <div className="flex flex-col">
                          <span>{item.product.name}</span>
                          <span className="text-xs text-slate-500">
                            {item.product.brand} • R$ {Number(item.product.price).toFixed(2)} {item.quantity > 1 && `x${item.quantity}`}
                          </span>
                          {item.product.cost ? (
                            <span className="text-[11px] text-slate-500">
                              Taxa individual: R$ {Number(item.product.cost).toFixed(2)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="rounded-lg bg-[#b91c1c] px-2 py-1 text-white transition hover:brightness-110"
                        title="Remover item"
                      >
                        <Trash size={16} className="text-black" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {cart.length === 0 && <p className="text-sm text-slate-500">Pesquise ou escaneie para adicionar itens.</p>}
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
            <div className="relative flex items-center justify-center">
              <h3 className="text-lg font-semibold text-charcoal">Pagamento PIX</h3>
              <button className="absolute right-0 text-slate-500" onClick={() => setShowPixModal(false)}>
                ✕
              </button>
            </div>
            <div className="mt-4 flex flex-col items-center gap-3">
             <div className="relative flex flex-col items-center gap-3">
               {pixQr ? (
                 <img src={pixQr} alt="QR Pix" className="h-64 w-64 transition-opacity duration-300" />
               ) : (
                 <p className="text-sm text-slate-600">Gerando QR...</p>
               )}
               {paymentStatus === 'paid' && (
                 <div className="absolute inset-0 flex items-center justify-center">
                   <div className="animate-ping-slow flex h-28 w-28 items-center justify-center rounded-full bg-green-500/80 text-white">
                     ✔
                   </div>
                 </div>
               )}
             </div>
             <div className="text-2xl font-bold text-primary">
               R$ {(pendingPixSale?.total ?? total.total).toFixed(2)}
             </div>
            </div>
            <div className="mt-4 text-right">
          <button className="btn-primary" onClick={() => setShowPixModal(false)}>
            Fechar
          </button>
        </div>
        </div>
      </div>
      )}
      {showCashModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="relative flex items-center justify-center">
              <h3 className="text-lg font-semibold text-charcoal">Pagamento por dinheiro/scambo</h3>
              <button className="absolute right-0 text-slate-500" onClick={() => setShowCashModal(false)}>
                ✕
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs uppercase tracking-wide text-slate-500">Valor recebido</label>
                <input
                  type="number"
                  step="0.01"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-slate-500">Nome (opcional)</label>
                <input
                  value={cashPayerName}
                  onChange={(e) => setCashPayerName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-slate-500">CPF (opcional)</label>
                <input
                  value={cashPayerCpf}
                  onChange={(e) => setCashPayerCpf(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <div className="mt-4 flex items-center justify-end gap-2">
                <button className="btn-ghost" onClick={() => setShowCashModal(false)}>
                  Cancelar
                </button>
                <button className="btn-primary" onClick={confirmCashPayment}>
                  Pagar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="relative flex items-center justify-center">
              <h3 className="text-lg font-semibold text-charcoal">Pagamento na maquininha</h3>
              <button className="absolute right-0 text-slate-500" onClick={() => setShowCardModal(false)}>
                ✕
              </button>
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <p>Confirme o pagamento realizado na maquininha física.</p>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 font-semibold text-charcoal">
                <span>Total</span>
                <span>R$ {(pendingCardSale?.total ?? total.total).toFixed(2)}</span>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="text-xs uppercase tracking-wide text-slate-500">Bandeira (opcional)</label>
                  <input
                    value={cardBrand}
                    onChange={(e) => setCardBrand(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    placeholder="Visa, Mastercard..."
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wide text-slate-500">NSU / Autorização</label>
                  <input
                    value={cardAuthCode}
                    onChange={(e) => setCardAuthCode(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                    placeholder="Código da maquininha"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-slate-500">Valor cobrado</label>
                <input
                  type="number"
                  step="0.01"
                  value={cardValue}
                  onChange={(e) => setCardValue(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <div className="mt-4 flex items-center justify-end gap-2">
                <button className="btn-ghost" onClick={() => setShowCardModal(false)}>
                  Cancelar
                </button>
                <button className="btn-primary" onClick={confirmCardPayment}>
                  Pagamento aprovado na maquininha
                </button>
              </div>
              <p className="text-xs text-slate-500">
                Observação: a cobrança ocorre na maquininha física. Aqui registramos apenas o resultado para estoque e
                recibo.
              </p>
            </div>
          </div>
        </div>
      )}
      {lastReceipt && renderReceipt()}
    </div>
  );
};

export default SalesPage;
