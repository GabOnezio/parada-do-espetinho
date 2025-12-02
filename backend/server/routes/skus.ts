import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { requireAdmin, requireAuth } from '../middlewares/auth.js';

const router = Router();

const DATA_DIR = path.resolve(process.cwd(), 'backend', 'data');
const HISTORY_FILE = path.join(DATA_DIR, 'historico_de_sku.txt');

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
  const { products } = req.body as { products?: Array<{ id: string; name: string; brand: string; weight: number; measureUnit: string; price?: number; cost?: number; gtin?: string }> };
  if (!Array.isArray(products)) return res.status(400).json({ message: 'products array obrigatório' });

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const generateSkuFrom = (p: any) => {
    const w = p.weight ? String(p.weight).replace(/\D/g, '') : '0';
    return `${slugify(p.name)}-${slugify(p.brand)}-${w}${p.measureUnit || 'un'}`;
  };

  await ensureDataFile();
  const raw = await fs.readFile(HISTORY_FILE, 'utf-8');
  const lines = raw.split('\n').filter((l) => l.trim());
  const existingSkus = new Set(lines.slice(1).map((l) => l.split(';')[0]));

  const newLines: string[] = [];
  for (const p of products) {
    const sku = generateSkuFrom(p);
    if (!existingSkus.has(sku)) {
      newLines.push(`${sku};${p.gtin || ''};${p.name};${p.brand};${p.price ?? ''};${p.cost ?? ''};${p.measureUnit || ''}\n`);
      existingSkus.add(sku);
    }
  }

  if (newLines.length > 0) {
    await fs.appendFile(HISTORY_FILE, newLines.join(''), 'utf-8');
  }

  return res.json({ generated: newLines.length, message: `${newLines.length} SKUs gerados` });
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

export default router;
