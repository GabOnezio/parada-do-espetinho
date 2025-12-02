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

export default router;
