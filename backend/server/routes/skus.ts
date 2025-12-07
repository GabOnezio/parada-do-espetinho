import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { prisma } from '../utils/prisma.js';
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

    // Tabelas de mapeamento
    const brandMap: Record<string, string> = {
      'doritos': 'DOR',
      'brahma': 'BRA',
      'coca cola': 'COC',
      'parada do espetinho': 'PDE',
    };
    const flavorMap: Record<string, string> = {
      'limão': 'LIM',
      'elma': 'ELM',
      'frango': 'FRG',
      'carne': 'CRN',
      'linguiça': 'LIN',
    };
    const typeMap: Record<string, string> = {
      'chips': 'CHP',
      'espetinho': 'ESP',
      'refrigerante': 'REF',
      'cerveja': 'CERV',
    };

    function normalize(text: string) {
      return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9 ]/g, '')
        .trim();
    }

    function extractFlavor(name: string) {
      for (const key of Object.keys(flavorMap)) {
        if (normalize(name).includes(key)) return flavorMap[key];
      }
      return '';
    }
    function extractType(name: string) {
      for (const key of Object.keys(typeMap)) {
        if (normalize(name).includes(key)) return typeMap[key];
      }
      return '';
    }

    function generateSkuFrom(p: any) {
      const brandCode = brandMap[normalize(p.brand)] || p.brand.slice(0,3).toUpperCase();
      const flavorCode = extractFlavor(p.name);
      const typeCode = extractType(p.name);
      // Peso para gramas
      let peso = Number(p.weight);
      let unidade = normalize(p.measureUnit);
      if (unidade === 'kg') peso = peso * 1000;
      if (unidade === 'g') peso = peso;
      if (unidade === 'ml') peso = peso; // para líquidos, manter ml
      const pesoStr = String(Math.round(peso));
      let unidadeCode = unidade === 'kg' || unidade === 'g' ? 'G' : unidade.toUpperCase();
      // SKU final
      return `${brandCode}${flavorCode}${typeCode}${pesoStr}${unidadeCode}`;
    }

    await ensureDataFile();
    const raw = await fs.readFile(HISTORY_FILE, 'utf-8');
    const lines = raw.split('\n');
    // preserve header (line 0)
    const header = lines[0] || 'sku;gtin;name;brand;price;tax;measureUnit';
    const dataLines = lines.slice(1).filter((l) => l.trim());

    // map SKU -> index in dataLines
    const skuIndexMap = new Map<string, number>();
    for (let i = 0; i < dataLines.length; i++) {
      const parts = dataLines[i].split(';');
      const s = parts[0] || '';
      if (s) skuIndexMap.set(s, i);
    }

    let generated = 0;
    let updated = 0;
    for (const p of products) {
      const sku = generateSkuFrom(p);
      const existingIdx = skuIndexMap.get(sku);
      if (existingIdx === undefined) {
        // append new
        dataLines.push(`${sku};${p.gtin || ''};${p.name};${p.brand};${p.price ?? ''};${p.cost ?? ''};${p.measureUnit || ''}`);
        skuIndexMap.set(sku, dataLines.length - 1);
        generated++;
      } else {
        // update missing GTIN if present in product
        const parts = dataLines[existingIdx].split(';');
        const currentGtin = (parts[1] || '').trim();
        if ((!currentGtin || currentGtin === '') && p.gtin) {
          parts[1] = p.gtin;
          dataLines[existingIdx] = parts.join(';');
          updated++;
        }
      }
    }

    // write back file with header + dataLines
    const out = [header, ...dataLines].join('\n') + '\n';
    await fs.writeFile(HISTORY_FILE, out, 'utf-8');

    return res.json({ total: products.length, generated, updated, message: `${products.length} produtos processados, ${generated} SKUs gerados, ${updated} registros atualizados` });
  } catch (error) {
    console.error('[SKU] Error generating from DB:', error);
    return res.status(500).json({ message: 'Erro ao gerar SKUs do banco' });
  }
});

export default router;
