export type CategoryKey = string;

export type SeedProduct = {
  id: string;
  gtin: string;
  name: string;
  brand: string;
  price: number;
  stock: number;
  categoryKey: CategoryKey;
  isActive: boolean;
  isSeed: true;
};

const rawSeeds: Array<Omit<SeedProduct, 'id' | 'isActive' | 'isSeed'>> = [
  { gtin: '7908256520941', name: 'Bola Inflavel de Futbol', brand: 'Bola Cruz', price: 35, stock: 15, categoryKey: 'esportes' },
  { gtin: '7897128910600', name: 'BATIDA DE AMENDOIN', brand: 'Peroba', price: 22.95, stock: 1, categoryKey: 'bebidas_alcoolicas' },
  { gtin: '7896100500792', name: 'Vinho Branco Suave', brand: 'Colina', price: 13.99, stock: 1, categoryKey: 'bebidas_alcoolicas' },
  { gtin: '7898922047899', name: 'Vinho de Mesa Branco', brand: 'Vila Trento', price: 14.9, stock: 1, categoryKey: 'bebidas_alcoolicas' },
  { gtin: '7898422671129', name: 'COCKTAIL DE COCO', brand: 'BARKAN', price: 22.95, stock: 1, categoryKey: 'bebidas_alcoolicas' },
  { gtin: '7896931611353', name: 'Vinho Tinto Seco', brand: 'Campo Largo', price: 15.98, stock: 2, categoryKey: 'bebidas_alcoolicas' },
  { gtin: '7898947813660', name: 'Vinho Suave Uva Bordô', brand: 'Bella Vista', price: 14.99, stock: 8, categoryKey: 'bebidas_alcoolicas' },
  { gtin: '7896050200124', name: 'CACHAÇA ADOÇADA', brand: 'VELHO BARREIRO', price: 19.98, stock: 9, categoryKey: 'bebidas_alcoolicas' },
  { gtin: '7896092501302', name: 'COQUETEL DE AMENDOIN', brand: 'BAIANINHA', price: 19.98, stock: 3, categoryKey: 'bebidas_alcoolicas' },
  { gtin: '7896092501326', name: 'COQUETEL DE COCO', brand: 'BAIANINHA', price: 19.98, stock: 4, categoryKey: 'bebidas_alcoolicas' },
  { gtin: '7896092501340', name: 'COQUETEL DE MARACUJA', brand: 'Baianinha', price: 19.98, stock: 3, categoryKey: 'bebidas_alcoolicas' },
  { gtin: '7898172660107', name: 'CACHAÇA ADOÇADA', brand: 'JAMEL', price: 17.99, stock: 14, categoryKey: 'bebidas_alcoolicas' },
  { gtin: '7898172661883', name: 'Bebida Vódka Tridestilada', brand: 'MISKOV', price: 18.99, stock: 12, categoryKey: 'bebidas_alcoolicas' },
  { gtin: '7896002100014', name: 'Bebida 51', brand: 'Pirassunga', price: 16.99, stock: 10, categoryKey: 'bebidas_alcoolicas' },
  { gtin: '7896706300376', name: 'Pudim de Baunilha', brand: 'NEILAR', price: 1.99, stock: 1, categoryKey: 'doces_sobremesas' },
  { gtin: '7896706300390', name: 'Pudim de Morango', brand: 'NEILAR', price: 0, stock: 0, categoryKey: 'doces_sobremesas' },
  { gtin: '7896706300420', name: 'Pudim de Chocolate', brand: 'NEILAR', price: 1.99, stock: 2, categoryKey: 'doces_sobremesas' },
  { gtin: '7898960866377', name: 'Gelatina de Abacaxi', brand: 'Nuttry', price: 1.99, stock: 2, categoryKey: 'doces_sobremesas' },
  { gtin: '7898960866407', name: 'Gelatina de Limão', brand: 'Nuttry', price: 1.99, stock: 4, categoryKey: 'doces_sobremesas' },
  { gtin: '7896460400138', name: 'Farofa Pronta', brand: 'DOBÁ', price: 4.99, stock: 1, categoryKey: 'alimentos' },
  { gtin: '7896022205737', name: 'Parafuso', brand: 'Todeschini', price: 5.99, stock: 8, categoryKey: 'utilidades_domesticas' },
  { gtin: '7896232111170', name: 'Macarrão de Ovos', brand: 'FLORIANI', price: 4.99, stock: 1, categoryKey: 'alimentos' },
  { gtin: '7896232115680', name: 'Macarrão de Sêmola com Ovo', brand: 'Jóia', price: 5.99, stock: 4, categoryKey: 'alimentos' },
  { gtin: '7898102710032', name: 'Sal Tradicional', brand: 'ZICO', price: 2.99, stock: 12, categoryKey: 'temperos' },
  { gtin: '7898043584624', name: 'Sal Grosso', brand: 'Dona Nena', price: 4.99, stock: 3, categoryKey: 'temperos' },
  { gtin: '7897154800074', name: 'Erva Mate com Açucar', brand: 'Boqueirão', price: 11.99, stock: 1, categoryKey: 'chas' },
  { gtin: '7898994503422', name: 'Erva Mate P/ Chimarrão', brand: 'PANCHEIRA', price: 9.98, stock: 1, categoryKey: 'chas' },
  { gtin: '7897060600041', name: 'Fubá de Milho Amarelo', brand: 'D. Pedro', price: 5.99, stock: 4, categoryKey: 'alimentos' },
  { gtin: '7892300004788', name: 'Canjiquinha de Xerém', brand: 'Sinhá', price: 4.99, stock: 4, categoryKey: 'alimentos' },
  { gtin: '7896003739428', name: 'Bolacha Pão de Chapa', brand: 'Pit Stop', price: 5.98, stock: 4, categoryKey: 'padaria' },
  { gtin: '7898169430027', name: 'Carvão', brand: 'Campeste', price: 22.9, stock: 3, categoryKey: 'utilidades_domesticas' },
  { gtin: '7896273905301', name: 'FAROFA MIX MILHO + MANDIOCA', brand: 'Caldo Bom', price: 7.99, stock: 4, categoryKey: 'alimentos' },
  { gtin: '7896022205775', name: 'Macarrão de Sêmola Spaghetti', brand: 'TODESCHINI', price: 5.99, stock: 12, categoryKey: 'alimentos' },
  { gtin: '7891098002044', name: 'Chá de Camomila e Cidreira & Maracujá', brand: 'Chá de Leão', price: 9.98, stock: 1, categoryKey: 'chas' },
  { gtin: '7896327512615', name: 'Amido de Milho', brand: 'Apti', price: 5.99, stock: 1, categoryKey: 'alimentos' },
  { gtin: '7896327512363', name: 'Amido de Milho', brand: 'Apiti', price: 12.99, stock: 2, categoryKey: 'alimentos' },
  { gtin: '7898112977029', name: 'Coador de Café', brand: 'Zalena', price: 9.98, stock: 2, categoryKey: 'utilidades_domesticas' },
  { gtin: '7891164027704', name: 'Leite em Pó Integral', brand: 'Aurora', price: 18.99, stock: 1, categoryKey: 'laticinios' },
  { gtin: '7896081805299', name: 'Filtro de Papel', brand: 'Iguaçu', price: 5.99, stock: 1, categoryKey: 'utilidades_domesticas' },
  { gtin: '7896005803714', name: 'Filtro de Papel', brand: '3 Corações', price: 4.99, stock: 4, categoryKey: 'utilidades_domesticas' },
  { gtin: '7896348300994', name: 'Filtro de Papel', brand: 'BOM JESUS', price: 5.99, stock: 2, categoryKey: 'utilidades_domesticas' },
  { gtin: '7898045700336', name: 'Doce de Goiabada', brand: 'Val', price: 5.99, stock: 2, categoryKey: 'doces_sobremesas' },
  { gtin: '7891104393104', name: 'Adoçante', brand: 'Adocyl', price: 7.99, stock: 1, categoryKey: 'alimentos' },
  { gtin: '7896019115278', name: 'Café Torrado e Moido Extra Forte', brand: 'Damasco', price: 31.98, stock: 1, categoryKey: 'chas' },
  { gtin: '7898929930033', name: 'Café Torrado Moido', brand: 'Alto da Serra', price: 19.98, stock: 1, categoryKey: 'chas' },
  { gtin: '7896327512967', name: 'Fermento', brand: 'Apti', price: 4.99, stock: 2, categoryKey: 'alimentos' },
  { gtin: '7896327512240', name: 'Fermento Biológico', brand: 'Apti', price: 11.99, stock: 1, categoryKey: 'alimentos' },
  { gtin: '736372060570', name: 'Leite Condensado', brand: 'PAFIA', price: 6.99, stock: 1, categoryKey: 'laticinios' },
  { gtin: '7896004401775', name: 'Leite de Coco', brand: 'MAIS COCO', price: 2.98, stock: 5, categoryKey: 'bebidas_nao_alcoolicas' },
  { gtin: '7898274690699', name: 'Vinho Suave', brand: 'GOLE do SUL', price: 19.98, stock: 1, categoryKey: 'bebidas_alcoolicas' },
  { gtin: '7898307570875', name: 'Vinho', brand: 'Pinheirense', price: 15, stock: 21, categoryKey: 'bebidas_alcoolicas' },
  { gtin: '7891030300207', name: 'Doce de Leite', brand: 'MOCOCA', price: 5.99, stock: 0, categoryKey: 'doces_sobremesas' },
  { gtin: '7898418144910', name: 'Leite de Coco', brand: 'Divina Mesa', price: 4.99, stock: 4, categoryKey: 'bebidas_nao_alcoolicas' },
  { gtin: '7899659901331', name: 'Extrato de Tomate', brand: 'Tomadoro', price: 2.99, stock: 6, categoryKey: 'alimentos' },
  { gtin: '7897517206086', name: 'Extrato de Tomate', brand: 'Fugini', price: 2.99, stock: 2, categoryKey: 'alimentos' },
  { gtin: '7896022085209', name: 'Bolacha Toons', brand: 'Isabela', price: 4.5, stock: 11, categoryKey: 'padaria' },
  { gtin: '630941717455', name: 'Extrato de Tomate', brand: 'Achei', price: 2.49, stock: 4, categoryKey: 'alimentos' },
  { gtin: '7898969994002', name: 'Carvão', brand: 'Sitio Novo', price: 22.9, stock: 6, categoryKey: 'utilidades_domesticas' },
  { gtin: '7896348200874', name: 'Pepino em Conserva', brand: 'Jureia', price: 11.99, stock: 2, categoryKey: 'alimentos' },
  { gtin: '7894000050034', name: 'Maionese', brand: "HELLMANN'S", price: 11.99, stock: 1, categoryKey: 'temperos' },
  { gtin: '7898623463233', name: 'Maionese', brand: 'Nobre Sabor', price: 4.99, stock: 1, categoryKey: 'temperos' },
  { gtin: '7896048285904', name: 'Maionese', brand: 'Castelo', price: 7.99, stock: 1, categoryKey: 'temperos' },
  { gtin: '7896114900045', name: 'Sardinhas', brand: 'PESCADOR', price: 7.98, stock: 3, categoryKey: 'carnes_peixes' },
  { gtin: '7896332722825', name: 'CHACHUP', brand: 'Accert', price: 5.99, stock: 2, categoryKey: 'temperos' },
  { gtin: '7896292343702', name: 'Grão de Milho', brand: 'SOFRUTA', price: 4.99, stock: 1, categoryKey: 'alimentos' },
  { gtin: '7896102500608', name: 'Grão de Milho', brand: 'Quero', price: 5.49, stock: 2, categoryKey: 'alimentos' },
  { gtin: '7899659900785', name: 'Grão de Milho', brand: 'Bonare', price: 4.99, stock: 13, categoryKey: 'alimentos' },
  { gtin: '7896722506578', name: 'Chá Mate', brand: 'Mandiervas', price: 5.99, stock: 6, categoryKey: 'chas' },
  { gtin: '7896722501016', name: 'Chá de Camomila', brand: 'Mandiervas', price: 5.99, stock: 2, categoryKey: 'chas' },
  { gtin: '7896327511984', name: 'Farinha de Bolo Chocolate', brand: 'Apti', price: 6.99, stock: 1, categoryKey: 'alimentos' },
  { gtin: '7896327511335', name: 'Baunilha', brand: 'Apti', price: 6.99, stock: 1, categoryKey: 'temperos' },
  { gtin: '7896279600538', name: 'Óleo de Soja', brand: 'COAMO', price: 9.98, stock: 1, categoryKey: 'alimentos' },
  { gtin: '7896407500013', name: 'Vinagre de Ácool', brand: 'Prime', price: 3.99, stock: 1, categoryKey: 'temperos' },
  { gtin: '7896407500112', name: 'Vinagre de Alcool', brand: 'Prime', price: 2.99, stock: 1, categoryKey: 'temperos' },
  { gtin: '7896297910688', name: 'Vinagre de Álcool', brand: 'Chemim', price: 3.49, stock: 7, categoryKey: 'temperos' },
  { gtin: '7896383300096', name: 'Vinagre de Álcool', brand: 'Heinig', price: 2.99, stock: 14, categoryKey: 'temperos' },
  { gtin: '7896267000135', name: 'Arroz Branco', brand: 'Buriti', price: 22.99, stock: 2, categoryKey: 'alimentos' },
  { gtin: '7898096590085', name: 'Feijão Preto', brand: 'Copa', price: 6.99, stock: 10, categoryKey: 'alimentos' },
  { gtin: '7896267000128', name: 'Arroz Branco', brand: 'Copa', price: 6.99, stock: 10, categoryKey: 'alimentos' },
  { gtin: '7897060600010', name: 'Farinha de Milho Branca', brand: 'D. Pedro', price: 9.98, stock: 4, categoryKey: 'alimentos' },
  { gtin: '7898134720023', name: 'Farinha de Milho', brand: 'Veneza', price: 7.99, stock: 3, categoryKey: 'alimentos' },
  { gtin: '7897060600027', name: 'Farinha de Milho Amarelo', brand: 'D. Pedro', price: 7.99, stock: 5, categoryKey: 'alimentos' },
  { gtin: '7891080007842', name: 'Farinha de Trigo Branquinha', brand: 'Farina', price: 19.9, stock: 1, categoryKey: 'alimentos' },
  { gtin: '7896021800209', name: 'Farinha de Trigo Enriquecida', brand: 'Sudoeste', price: 5.99, stock: 1, categoryKey: 'alimentos' },
  { gtin: '7891080007705', name: 'Farinha de Trigo', brand: 'Farina', price: 5.99, stock: 10, categoryKey: 'alimentos' },
  { gtin: '7896894900013', name: 'Açucar refinado', brand: 'Caravelas', price: 5.99, stock: 15, categoryKey: 'alimentos' },
  { gtin: '7892840822347', name: 'Doritos', brand: 'Elma Chips', price: 15, stock: -6, categoryKey: 'alimentos' }
];

export const defaultProducts: SeedProduct[] = rawSeeds.map((item) => ({
  id: `seed-${item.gtin}`,
  isActive: true,
  isSeed: true,
  ...item
}));

export const HIDDEN_SEEDS_KEY = 'hiddenSeedGtins';

export function buildSeedCategoryMap(hiddenGtins: Set<string> = new Set()): Record<string, CategoryKey> {
  const map: Record<string, CategoryKey> = {};
  defaultProducts.forEach((p) => {
    if (hiddenGtins.has(p.gtin)) return;
    map[p.id] = p.categoryKey;
    map[p.gtin] = p.categoryKey;
  });
  return map;
}

export function mergeWithSeedProducts<T extends { gtin: string }>(
  products: T[],
  hiddenGtins: Set<string> = new Set()
): (T | SeedProduct)[] {
  const existing = new Set(products.map((p) => p.gtin));
  const merged: (T | SeedProduct)[] = [...products];
  defaultProducts.forEach((seed) => {
    if (hiddenGtins.has(seed.gtin) || existing.has(seed.gtin)) return;
    merged.push(seed);
  });
  return merged;
}

export function readHiddenSeedGtins(): string[] {
  if (typeof localStorage === 'undefined') return [];
  const raw = localStorage.getItem(HIDDEN_SEEDS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function persistHiddenSeedGtins(list: string[]) {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(HIDDEN_SEEDS_KEY, JSON.stringify(list));
}
