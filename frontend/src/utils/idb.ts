// Pequena ajuda para IndexedDB (sem dependências externas)
// Armazena produtos e vendas locais/pending
const DB_NAME = 'pdv-offline';
const DB_VERSION = 1;
const STORE_PRODUCTS = 'products';
const STORE_SALES = 'sales';

type Product = {
  id: string;
  name: string;
  price: number;
  gtin: string;
  brand: string;
  discountPercent?: number;
  isOnPromotion?: boolean;
};

type LocalSale = {
  id: string;
  items: { productId: string; quantity: number }[];
  total: number;
  paymentType: string;
  createdAt: number;
};

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_PRODUCTS)) {
        db.createObjectStore(STORE_PRODUCTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_SALES)) {
        db.createObjectStore(STORE_SALES, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveProducts(products: Product[]) {
  const db = await openDB();
  const tx = db.transaction(STORE_PRODUCTS, 'readwrite');
  const store = tx.objectStore(STORE_PRODUCTS);
  store.clear();
  products.forEach((p) => store.put(p));
  return tx.complete;
}

export async function getProducts(): Promise<Product[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PRODUCTS, 'readonly');
    const store = tx.objectStore(STORE_PRODUCTS);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as Product[]);
    req.onerror = () => reject(req.error);
  });
}

export async function addLocalSale(sale: LocalSale) {
  const db = await openDB();
  const tx = db.transaction(STORE_SALES, 'readwrite');
  tx.objectStore(STORE_SALES).put(sale);
  return tx.complete;
}

export async function getLocalSales(): Promise<LocalSale[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SALES, 'readonly');
    const store = tx.objectStore(STORE_SALES);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result as LocalSale[]);
    req.onerror = () => reject(req.error);
  });
}

export async function clearLocalSales() {
  const db = await openDB();
  const tx = db.transaction(STORE_SALES, 'readwrite');
  tx.objectStore(STORE_SALES).clear();
  return tx.complete;
}

export type { Product, LocalSale };
