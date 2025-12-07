import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { prisma } from '../utils/prisma.js';
import { requireAdmin, requireAuth } from '../middlewares/auth.js';

const router = Router();

const DATA_DIR = path.resolve(process.cwd(), 'backend', 'data');
const HISTORY_FILE = path.join(DATA_DIR, 'historico_de_sku.txt');

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

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractFlavor(name: string) {
  for (const key of Object.keys(flavorMap)) {
    if (normalize(name).includes(key)) return flavorMap[key];
  }
  return '';
}

function extractType(name: string) {
  const norm = normalize(name);
  for (const key of Object.keys(typeMap)) {
    if (norm.includes(key)) return typeMap[key];
  }
  // fallback: take initials of first three significant words
  const parts = norm.split(' ').filter((p) => p && !['de', 'do', 'da', 'para', 'com', 'sem'].includes(p));
  if (!parts.length) return '';
  const initials = parts.slice(0, 3).map((p) => p[0]).join('').toUpperCase();
  return initials;
}

function sanitizeBrandCode(brand: string) {
  const norm = normalize(brand || '');
  const compact = norm.replace(/[^a-z0-9]/g, '');
  return (compact.slice(0, 3) || 'SKU').toUpperCase();
}

function generateCompactSku(p: { name: string; brand: string; weight?: number | string; measureUnit?: string }) {
  const normBrand = normalize(p.brand || '');
  const brandCode = brandMap[normBrand] || sanitizeBrandCode(p.brand);
  const flavorCode = extractFlavor(p.name || '');
  const typeCode = extractType(p.name || '');

  let peso = Number(p.weight ?? 0);
  let unidade = normalize(p.measureUnit || '');
  if (unidade === 'kg') peso = peso * 1000;
  if (unidade === 'g') peso = peso;
  if (unidade === 'ml') peso = peso;
  if (unidade === 'l') peso = peso * 1000;
  if (!unidade || unidade === 'un') unidade = 'un';
  const pesoStr = Number.isFinite(peso) ? String(Math.round(peso)) : '0';
  const unidadeCode = unidade === 'kg' || unidade === 'g' ? 'G' : unidade.toUpperCase();

  return `${brandCode}${flavorCode}${typeCode}${pesoStr}${unidadeCode}`.replace(/[^A-Z0-9-]/gi, '').toUpperCase();
}

function mapProductsForSku(
  products: Array<{ name: string; brand: string; weight?: any; measureUnit?: string | null; price?: any; cost?: any; gtin?: any }>
) {
  return products.map((p) => ({
    name: p.name,
    brand: p.brand,
    weight: p.weight !== null && p.weight !== undefined ? Number(p.weight) : undefined,
    measureUnit: p.measureUnit || undefined,
    price: p.price !== null && p.price !== undefined ? Number(p.price) : undefined,
    cost: p.cost !== null && p.cost !== undefined ? Number(p.cost) : undefined,
    gtin: p.gtin !== null && p.gtin !== undefined ? String(p.gtin) : undefined
  }));
}

function ensureUniqueSkus(products: Array<{ name: string; brand: string; weight?: number; measureUnit?: string; price?: number; cost?: number; gtin?: string }>) {
  const seen: Record<string, number> = {};
  return products.map((p, idx) => {
    const base = generateCompactSku(p) || `SKU${idx + 1}`;
    const count = seen[base] || 0;
    seen[base] = count + 1;
    const finalSku = count === 0 ? base : `${base}-${count + 1}`;
    return { ...p, sku: finalSku };
  });
}

async function ensureDataFile() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
      await fs.access(HISTORY_FILE);
    } catch {
      // create with header
      const header = 'sku;gtin;name;brand;price;tax;measureUnit\n';
      await fs.writeFile(HISTORY_FILE, header, 'utf-8');
    }
  } catch (err) {
    // ignore
  }
}

function parseLine(line: string) {
  const parts = line.split(';');
  return {
    sku: parts[0] || '',
    gtin: parts[1] || '',
    name: parts[2] || '',
    brand: parts[3] || '',
    price: parts[4] || '',
    tax: parts[5] || '',
    measureUnit: parts[6] || ''
  };
}

router.get('/', requireAuth, async (_req, res) => {
  await ensureDataFile();
  const raw = await fs.readFile(HISTORY_FILE, 'utf-8');
  const lines = raw.split('\n').filter((l) => l.trim());
  // skip header
  const items = lines.slice(1).map(parseLine);
  return res.json(items);
});

router.get('/:code', requireAuth, async (req, res) => {
  const code = req.params.code;
  await ensureDataFile();
  const raw = await fs.readFile(HISTORY_FILE, 'utf-8');
  const lines = raw.split('\n').filter((l) => l.trim());
  const items = lines.slice(1).map(parseLine);
  const found = items.find((it) => it.sku === code || it.gtin === code);
  if (!found) return res.status(404).json({ message: 'SKU não encontrado' });
  return res.json(found);
});

router.post('/', requireAuth, requireAdmin, async (req, res) => {
  const { sku, gtin, name, brand, price, tax, measureUnit } = req.body as any;
  if (!sku || !name || !brand) return res.status(400).json({ message: 'sku, name e brand são obrigatórios' });
  await ensureDataFile();
  const line = `${sku};${gtin || ''};${name};${brand};${price ?? ''};${tax ?? ''};${measureUnit || ''}\n`;
  await fs.appendFile(HISTORY_FILE, line, 'utf-8');
  return res.status(201).json({ sku, gtin, name, brand, price, tax, measureUnit });
});

router.post('/batch/generate', requireAuth, requireAdmin, async (req, res) => {
  const { products } = req.body as { products?: Array<{ id: string; name: string; brand: string; weight?: number; measureUnit?: string; price?: number; cost?: number; gtin?: string }> };
  if (!Array.isArray(products)) return res.status(400).json({ message: 'products array obrigatório' });

  await ensureDataFile();

  const header = 'sku;gtin;name;brand;price;tax;measureUnit';
  const entries = ensureUniqueSkus(mapProductsForSku(products));
  const out = [
    header,
    ...entries.map((p) => `${p.sku};${p.gtin || ''};${p.name};${p.brand};${p.price ?? ''};${p.cost ?? ''};${p.measureUnit || ''}`)
  ].join('\n') + '\n';
  await fs.writeFile(HISTORY_FILE, out, 'utf-8');

  return res.json({ generated: entries.length, message: `${entries.length} SKUs gerados` });
});

router.get('/export/txt', requireAuth, async (_req, res) => {
  await ensureDataFile();
  const raw = await fs.readFile(HISTORY_FILE, 'utf-8');
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="historico_de_sku.txt"');
  return res.send(raw);
});

router.get('/export/md', requireAuth, async (_req, res) => {
  await ensureDataFile();
  const raw = await fs.readFile(HISTORY_FILE, 'utf-8');
  const lines = raw.split('\n').filter((l) => l.trim());
  const items = lines.slice(1).map(parseLine);

  let md = '# Histórico de SKU\n\n';
  md += '| SKU | GTIN | Nome | Marca | Preço | Taxa | Medida |\n';
  md += '| --- | --- | --- | --- | --- | --- | --- |\n';
  for (const it of items) {
    md += `| ${it.sku} | ${it.gtin} | ${it.name} | ${it.brand} | ${it.price} | ${it.tax} | ${it.measureUnit} |\n`;
  }

  res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
  res.setHeader('Content-Disposition', 'inline');
  return res.send(md);
});

router.put('/', requireAuth, requireAdmin, async (req, res) => {
  const { content } = req.body as { content?: string };
  if (!content) return res.status(400).json({ message: 'content obrigatório' });

  await ensureDataFile();
  await fs.writeFile(HISTORY_FILE, content, 'utf-8');
  return res.json({ message: 'Arquivo atualizado' });
});

// Update single SKU entry (e.g., update GTIN or other fields)
router.put('/entry', requireAuth, requireAdmin, async (req, res) => {
  const { sku, gtin, name, brand, price, tax, measureUnit } = req.body as any;
  if (!sku) return res.status(400).json({ message: 'sku obrigatório' });
  await ensureDataFile();
  const raw = await fs.readFile(HISTORY_FILE, 'utf-8');
  const lines = raw.split('\n');
  const header = lines[0] || 'sku;gtin;name;brand;price;tax;measureUnit';
  const dataLines = lines.slice(1);

  let found = false;
  for (let i = 0; i < dataLines.length; i++) {
    if (!dataLines[i] || dataLines[i].trim() === '') continue;
    const parts = dataLines[i].split(';');
    if (parts[0] === sku) {
      // update only provided fields
      if (gtin !== undefined) parts[1] = gtin;
      if (name !== undefined) parts[2] = name;
      if (brand !== undefined) parts[3] = brand;
      if (price !== undefined) parts[4] = price;
      if (tax !== undefined) parts[5] = tax;
      if (measureUnit !== undefined) parts[6] = measureUnit;
      dataLines[i] = parts.join(';');
      found = true;
      break;
    }
  }

  if (!found) return res.status(404).json({ message: 'SKU não encontrado' });

  const out = [header, ...dataLines.filter((l) => l !== undefined)].join('\n') + '\n';
  await fs.writeFile(HISTORY_FILE, out, 'utf-8');
  return res.json({ message: 'Entry updated' });
});

router.post('/batch/from-db', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const products = await prisma.product.findMany({ where: { isActive: true } });

    await ensureDataFile();

    const header = 'sku;gtin;name;brand;price;tax;measureUnit';
    const entries = ensureUniqueSkus(mapProductsForSku(products));
    const out = [
      header,
      ...entries.map((p) => `${p.sku};${p.gtin || ''};${p.name};${p.brand};${p.price ?? ''};${p.cost ?? ''};${p.measureUnit || ''}`)
    ].join('\n') + '\n';
    await fs.writeFile(HISTORY_FILE, out, 'utf-8');

    return res.json({ total: products.length, generated: entries.length, message: `${products.length} produtos processados, ${entries.length} SKUs regravados` });
  } catch (error) {
    console.error('[SKU] Error generating from DB:', error);
    return res.status(500).json({ message: 'Erro ao gerar SKUs do banco' });
  }
});

export default router;
