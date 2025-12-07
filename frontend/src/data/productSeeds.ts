export type CategoryKey = string;

export type SeedProduct = {
  id: string;
  gtin: string;
  name: string;
  brand: string;
  price: number;
  stock: number;
  stockMin?: number;
  stockMax?: number;
  weight?: number;
  measureUnit?: string;
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

const extraSeedTsv = `GTIN\tNOME DO PRODUTO\tMARCA\tPREÇO (R$)\tPESO\tESTOQUE\tESTOQUE MÍNIMO
7896004010649\tAchocolatado em Pó Original\tNescau\t2,99\t200g\t15\t5
7896722506578\tLeite Condensado Integral\tJussara\t5,99\t395g\t4\t2
7896722506592\tCreme de Leite UHT\tJussara\t5,99\t200g\t3\t1
7896004401775\tMistura P/ Bolo Laranja\tFleischmann\t2,98\t450g\t6\t2
7891030300306\tCreme de Leite Mistura Láctea\tMococa\t3,60\t200g\t3\t2
7898915414899\tCreme de Leite UHT\tTerra Viva\t4,49\t200g\t12\t5
7891030300207\tLeite Condensado Mistura Láctea\tMococa\t5,99\t395g\t8\t3
7899659900785\tMilho Verde em Conserva Lata\tBonare\t4,99\t170g\t12\t4
7896102500608\tMilho Verde em Conserva Lata\tQuero\t4,99\t170g Drenado\t1\t3
7896348200874\tQueijo Mussarela Fatiado\tTirolez\t11,99\t150g\t2\t2
7896332722825\tQueijo Minas Frescal\tPolenghi\t5,99\t200g\t2\t2
7898623463233\tManteiga c/ Sal Pote\tQualy\t4,99\t200g\t1\t1
7896114901738\tSardinha c/ Óleo Lata\tPescador\t7,98\t83g Drenado\t6\t3
7896114900045\tSardinha Molho Tomate Lata\tPescador\t7,98\t83g Drenado\t6\t2
7894000050034\tMaionese Pote Regular\tHellmann's\t11,99\t500g\t3\t2
7896102584998\tMaionese Pote\tQuero\t8,99\t495g\t2\t2
7896048285904\tMaionese Pote\tCastelo\t7,99\t500g\t6\t2
630941717455\tCafé Torrado e Moído\t3 Corações\t2,49\t250g\t10\t3
7897517206086\tMolho de Tomate Tradicional Sachê\tFugini\t2,99\t340g\t10\t3
7899659901331\tMolho de Tomate Pouck\tTomadoro\t2,99\t300g\t12\t3
7896292333000\tMolho de Tomate Tradicional Refil\tPredilecta\t2,99\t300g\t12\t3
7898102710032\tFeijão Carioca Tipo 1\tKicaldo\t2,99\t1kg\t12\t6
7898102710193\tFeijão Preto Tipo 1\tKicaldo\t4,98\t1kg\t10\t2
7896894900013\tAçúcar Refinado Pacote\tCaravelas\t5,99\t1kg\t13\t5
7896508200034\tAçúcar Refinado Pacote\tAlto Alegre\t5,99\t1kg\t11\t5
7896021800209\tFarinha de Trigo Tipo 1 Pacote\tSudoeste\t5,99\t1kg\t1\t3
7896273908340\tBiscoito Recheado Chocolate\tBauducco\t4,99\t140g\t2\t2
7896273903192\tBiscoito Recheado Morango\tBauducco\t4,99\t140g\t2\t2
7896273908333\tBiscoito Recheado Baunilha\tBauducco\t4,99\t140g\t2\t2
7898045700336\tGoiabada Tablete\tVal\t5,99\t300g\t2\t2
7891104393104\tLeite UHT Integral\tPiracanjuba\t7,99\t1L\t1\t2
7896327512967\tRequeijão Cremoso Pote\tVigor\t4,99\t200g\t5\t2
7896327512240\tQueijo Prato Fatiado\tVigor\t11,99\t150g\t1\t3
7891164027704\tAzeite de Oliva Extravirgem\tGallo\t18,99\t500ml\t1\t3
7896348300994\tMolho de Pimenta\tPredilecta\t5,99\t150ml\t6\t3
7896005803714\tAchocolatado em Pó\tToddy\t4,99\t400g\t4\t2
7896327512363\tQueijo Coalho\tVigor\t12,99\t250g\t2\t2
7898418144910\tAdoçante Liquido\tLowçucar\t4,99\t100ml\t5\t2
7896019112376\tVinho Tinto Suave\tCampo Largo\t31,90\t750ml\t1\t3
7807900005370\tBebida Energética\tRed Bull\t6,99\t250ml\t3\t5
7896523158433\tCerveja Pilsen Lata\tSkol\t8,99\t350ml\t3\t2
7898929930033\tWhisky Escocês\tPassport\t19,98\t750ml\t3\t2
7896019112352\tVinho Branco Suave\tCampo Largo\t29,99\t750ml\t1\t3
7898406230335\tRefrig. Sabor Laranja\tGuaraná Jesus\t6,99\t2L\t4\t2
7896003739428\tArroz Parbolizado Tipo 1\tTio João\t5,98\t1kg\t4\t2
7898406230311\tRefrig. Sabor Limão\tGuaraná Jesus\t6,99\t2L\t4\t2
7898926842407\tCerveja Malzbier\tBrahma\t6,99\t350ml\t3\t2
7897213319677\tCafé Solúvel Tradicional\tMelitta\t6,99\t50g\t3\t3
7897213319752\tCafé Solúvel Extra Forte\tMelitta\t6,99\t50g\t2\t3
7897213320314\tCafé Solúvel Cappuccino\tMelitta\t6,99\t50g\t3\t3
7898406230151\tRefrig. Sabor Guaraná\tGuaraná Jesus\t6,99\t2L\t6\t3
35354277\tAchocolatado Instantâneo\tOvomaltine\t6,99\t300g\t2\t3
7897426030765\tÁgua Mineral Sem Gás\tMinalba\t6,99\t1,5L\t2\t3
7898926843350\tCerveja Pilsen Long Neck\tAmstel\t6,99\t355ml\t1\t3
7897426030772\tÁgua Mineral Com Gás\tMinalba\t6,99\t1,5L\t2\t3
7892300004788\tLeite Condensado Integral Lata\tNestlé Moça\t4,99\t395g\t3\t3
7896273900108\tBiscoito Salgado Cream Cracker\tBauducco\t5,98\t200g\t3\t1
7896363400068\tBiscoito Doce Maisena\tPiraquê\t6,99\t200g\t3\t1
7896273900122\tBiscoito Salgado Água e Sal\tBauducco\t5,99\t200g\t3\t1
7896271004792\tPão de Forma Tradicional\tPullman\t4,99\t500g\t6\t2
7896363400044\tBiscoito Recheado Chocolate\tPiraquê\t5,99\t130g\t1\t3
7896273905301\tPão de Mel Coberto Chocolate\tBauducco\t7,99\t240g\t4\t2
7896460400138\tDoce de Leite Pastoso\tItambé\t4,99\t400g\t1\t3
7896022205775\tMistura P/ Pão de Queijo\tYoki\t5,99\t500g\t9\t5
7897517206086\tMolho de Tomate Tradicional Sachê\tFugini\t2,99\t340g\t3\t3
7896232115680\tFarinha Láctea Tradicional\tNestlé\t5,99\t200g\t4\t3
7896232111170\tAchocolatado em Pó\tNestlé\t5,99\t400g\t1\t3
7896022205737\tFlocão de Milho\tYoki\t5,99\t500g\t8\t5
7896022002015\tTapioca Granulada\tYoki\t6,99\t500g\t4\t3
7896022203566\tAmido de Milho\tYoki\t6,99\t200g\t2\t3
7896267000128\tCafé em Pó Extra Forte\tPilão\t6,99\t500g\t13\t5
7897154800074\tChá de Camomila\tDr. Oetker\t11,99\t10g (10 sachês)\t1\t3
7898994503422\tBiscoito Integral Aveia e Mel\tVitao\t9,98\t200g\t5\t2
7896220548292\tAzeite de Oliva Extravirgem\tBorges\t13,99\t500ml\t3\t3
7898994322184\tBarrinha de Cereal Banana\tVitao\t5,99\t60g\t2\t3
7898112977029\tMistura para Pão Integral\tKing Mix\t9,98\t500g\t2\t3
7897060600010\tTempero Completo com Pimenta\tSazón\t9,98\t300g\t3\t3
7898134720023\tTempero P/ Arroz\tKitano\t7,99\t60g\t3\t3
7897060600027\tTempero Completo Sem Pimenta\tSazón\t7,99\t300g\t3\t5
7898915343038\tFermento Biológico Fresco\tFleischmann\t5,99\t15g\t2\t3
7898096590085\tMacarrão Instantâneo Galinha Caipira\tNissin\t6,99\t80g\t9\t3
7896597601224\tSuco de Laranja Concentrado\tMaguary\t6,99\t500ml\t2\t5
7896383300096\tSabão em Pó Lavagem Perfeita\tOmo\t3,99\t800g\t14\t5
7896297910688\tDetergente Líquido Limão\tYpê\t3,99\t500ml\t6\t3
7896407500013\tPão de Queijo Congelado\tForno de Minas\t3,99\t400g\t1\t3
7896407500112\tPão de Batata Congelado\tForno de Minas\t2,99\t400g\t1\t3
7898247780297\tCafé Solúvel Vidro\tIguaçu\t9,98\t100g\t4\t3
7891000241356\tArroz Agulhinha Tipo 1\tCamil\t4,99\t1kg\t10\t3
7896022085216\tFarinha de Milho Flocada\tYoki\t4,99\t500g\t7\t3
7896022085209\tFarinha de Mandioca Torrada\tYoki\t4,50\t500g\t10\t3
7896111427132\tLeite UHT Integral\tElegê\t3,50\t1L\t3\t3
7896111427149\tLeite UHT Semidesnatado\tElegê\t3,50\t1L\t3\t3
7896004010656\tLeite Condensado TP\tNescau\t2,99\t395g\t4\t3
7896004010687\tCreme de Leite TP\tNescau\t2,99\t200g\t3\t3
7896004011295\tDoce de Leite TP\tNescau\t2,99\t200g\t4\t3
7896665200977\tPalito de Coco c/ Chocolate\tDori\t1,99\t50g\t1\t3
7896665200953\tAmendoim Japonês\tDori\t1,99\t50g\t1\t3
835281003637\tChocolate em Barra Ao Leite\tGaroto\t2,99\t90g\t5\t3
7891340365767\tBiscoito Wafer Chocolate\tTostines\t2,99\t100g\t1\t3
835281003644\tChocolate em Barra Meio Amargo\tGaroto\t2,99\t90g\t4\t3
7891340365682\tBiscoito Wafer Limão\tTostines\t2,99\t100g\t3\t3
7891203057075\tCafé Torrado e Moído Tradicional\tPelé\t3,50\t250g\t3\t3
7891203058591\tCafé Torrado e Moído Extra Forte\tPelé\t3,50\t250g\t1\t3
7898406230823\tRefrig. Zero Guaraná\tGuaraná Jesus\t1,99\t350ml Lata\t6\t3
7897426030673\tÁgua Mineral Sem Gás\tMinalba\t1,99\t500ml\t3\t3
7897426030642\tÁgua Mineral Com Gás Lata\tMinalba\t1,99\t350ml\t10\t3
7897426030697\tÁgua Tônica Lata\tMinalba\t1,99\t350ml\t5\t3
7897426030673\tÁgua Mineral Sem Gás\tMinalba\t1,99\t500ml\t2\t3
7897426030666\tRefrigerante Cola Lata\tMinalba\t1,99\t350ml\t4\t3
7898926843275\tCerveja Lager Lata\tHeineken\t1,99\t350ml\t1\t3
7897190305847\tGoma de Mascar Hortelã\tTrident\t1,25\t8g\t16\t5
7897190305861\tGoma de Mascar Morango\tTrident\t1,25\t8g\t16\t5
7897190305854\tGoma de Mascar Menta\tTrident\t1,25\t8g\t16\t5
7897190305908\tGoma de Mascar Tutti-Frutti\tTrident\t1,25\t8g\t35\t5
7897190305885\tGoma de Mascar Melancia\tTrident\t1,25\t8g\t35\t5
7897190305939\tGoma de Mascar Canela\tTrident\t1,25\t8g\t20\t5
7897190305830\tGoma de Mascar Limão\tTrident\t1,25\t8g\t16\t5
7897190305892\tGoma de Mascar Blueberry\tTrident\t1,25\t8g\t20\t5
7897190305915\tGoma de Mascar Cereja\tTrident\t1,25\t8g\t16\t5
7898966141041\tBiscoito Salgado Queijo\tParati\t1,99\t100g\t5\t3
7898699690304\tCafé em Cápsula Expresso\tNescafé Dolce Gusto\t4,99\t10g (10 cáp.)\t2\t3
7898937745230\tAchocolatado Zero Açúcar\tApti\t4,99\t200g\t3\t3
7898937745605\tAchocolatado em Pó Premium\tApti\t4,99\t200g\t2\t3
7898937745124\tCappuccino Clássico Pó\tApti\t4,99\t200g\t1\t3
7892840822316\tCerveja Premium Puro Malte\tPetra\t14,00\t600ml\t5\t3
7892840822514\tCerveja Lager Long Neck\tPetra\t15,00\t355ml\t8\t3
7898937745209\tBiscoito Maizena Zero Açúcar\tApti\t4,99\t170g\t18\t5
7898937745681\tBiscoito Recheado Chocolate Zero\tApti\t4,99\t120g\t3\t5
7899970402814\tBebida Láctea Chocolate\tItalac\t7,99\t1L\t8\t3
7899970400674\tLeite UHT Integral TP\tItalac\t6,99\t1L\t5\t3
7898142866232\tAdoçante em Sachê\tUnião\t1,99\t50g (100 sachês)\t9\t3
7898968728073\tBatata Palha Tradicional\tKisabor\t1,50\t50g\t6\t3
77940131\tCerveja Lager Lata\tQuilmes\t1,99\t355ml\t14\t5
7896706300420\tFarinha de Trigo Tipo 1\tRenata\t2,99\t1kg\t2\t3
7896706300390\tFarinha de Trigo Integral\tRenata\t2,99\t1kg\t1\t3
7896706300376\tFarinha de Trigo P/ Pastéis\tRenata\t2,99\t1kg\t1\t3
78939301\tBiscoito Salgado Cream Cracker\tTriunfo\t1,99\t200g\t46\t10
7622210575999\tChocolate em Barra Oreo\tMilka\t7,99\t100g\t8\t3
7622210575975\tChocolate em Barra Ao Leite\tMilka\t7,99\t100g\t8\t3
7896327512233\tIogurte Natural Integral\tVigor\t1,99\t170g\t6\t3
7898937630055\tPão de Forma Integral\tSeven Boys\t2,50\t400g\t6\t3
7896058506099\tRefrigerante Guaraná\tAntarctica\t2,50\t2L\t30\t10
7893642462090\tÁgua Mineral Sem Gás Garrafa\tIndaiá\t1,00\t500ml\t10\t5
7899958501607\tÁgua Mineral Com Gás Garrafa\tCrystal\t1,00\t500ml\t19\t10
7899958501591\tÁgua Mineral Sem Gás Garrafa\tCrystal\t1,00\t500ml\t11\t10
7898591457869\tBebida Láctea Chocolate UHT\tNinho\t1,99\t200ml\t1\t5
7898591455629\tLeite UHT Integral TP\tNinho\t1,99\t1L\t2\t5
7896058595468\tCerveja Pilsen Lata\tBrahma\t2,99\t350ml\t12\t5
7896058595420\tCerveja Malzbier Lata\tBrahma\t2,99\t350ml\t6\t5
78938816\tRefrigerante Laranja\tFanta\t2,50\t2L\t11\t5
78938823\tRefrigerante Limão\tFanta\t2,50\t2L\t2\t5
7908635100528\tBiscoito Salgado Queijo\tSabor da Terra\t4,99\t150g\t6\t5
`;

type SeedInput = Omit<SeedProduct, 'id' | 'isActive' | 'isSeed'>;

const parsePrice = (value: string): number => {
  const normalized = value.replace(/R\$\s*/i, '').replace(/\./g, '').replace(',', '.');
  return Number.parseFloat(normalized) || 0;
};

const parseWeight = (raw?: string): { weight?: number; measureUnit?: string } => {
  if (!raw) return {};
  const match = raw.trim().match(/([\d.,]+)\s*([a-zA-Z]+)/);
  if (!match) return {};
  const weight = Number.parseFloat(match[1].replace(',', '.'));
  const unitRaw = match[2].toLowerCase();
  const measureUnit = unitRaw === 'l' ? 'L' : unitRaw;
  return {
    weight: Number.isFinite(weight) ? weight : undefined,
    measureUnit
  };
};

const normalize = (txt: string) => txt.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

const detectCategory = (name: string, brand: string): CategoryKey => {
  const text = normalize(`${name} ${brand}`);
  if (/cerveja|vinho|whisky|lager|pilsen|malzbier|amstel|heineken|petra|passport/.test(text)) return 'bebidas_alcoolicas';
  if (/vodka|rum/.test(text)) return 'bebidas_alcoolicas';
  if (/refrig|guarana|fanta|suco|achocolat|agua|mineral|energetic|tonica|jesus|coca|red bull/.test(text)) return 'bebidas_nao_alcoolicas';
  if (/cafe|cappuccino|mate|cha/.test(text)) return 'chas';
  if (/queijo|leite|manteig|requeij|iogurt|lactea/.test(text)) return 'laticinios';
  if (/molho|maionese|pimenta|ketchup|tempero|vinagre|condimento/.test(text)) return 'temperos';
  if (/sardinh|atum|peixe|bacal/.test(text)) return 'carnes_peixes';
  if (/carne|frango|bov|aves/.test(text)) return 'carnes';
  if (/sabao|detergente|limp|omo/.test(text)) return 'limpeza';
  if (/pao|biscoito|bolacha|bolo|tapioca|farinha de trigo|mistura/.test(text)) return 'padaria';
  if (/chocolate|goiabada|doce|barrinha|goma|trident|wafer|candy|bala/.test(text)) return 'doces_sobremesas';
  return 'alimentos';
};

const parseExtraSeeds = (tsv: string): SeedInput[] => {
  const lines = tsv.trim().split('\n');
  lines.shift();
  return lines
    .map((line) => line.trim().replace(/\\t/g, '\t'))
    .filter(Boolean)
    .map((line) => {
      const [rawGtin, rawName, rawBrand, rawPrice, rawWeight, rawStock, rawStockMin] = line.split('\t');
      const gtin = (rawGtin || '').replace(/[^0-9]/g, '');
      const { weight, measureUnit } = parseWeight(rawWeight);
      const categoryKey = detectCategory(rawName, rawBrand);
      return {
        gtin: gtin.trim(),
        name: rawName.trim(),
        brand: rawBrand.trim(),
        price: parsePrice(rawPrice),
        stock: Number.parseInt(rawStock, 10) || 0,
        stockMin: Number.parseInt(rawStockMin, 10) || 0,
        weight,
        measureUnit,
        categoryKey
      };
    });
};

const extraSeeds = parseExtraSeeds(extraSeedTsv);

export const defaultProducts: SeedProduct[] = [
  ...rawSeeds.map((p) => ({
    ...p,
    stockMin: p.stockMin ?? 0,
    stockMax: p.stockMax ?? 0,
    weight: p.weight ?? 0,
    measureUnit: p.measureUnit || 'kg',
    id: `seed-${p.gtin}`,
    isActive: true,
    isSeed: true
  })),
  ...extraSeeds.map((p, idx) => ({
    ...p,
    stockMin: p.stockMin ?? 0,
    stockMax: p.stockMax ?? 0,
    weight: p.weight ?? 0,
    measureUnit: p.measureUnit || 'kg',
    id: `seed-extra-${idx}-${p.gtin || idx}`,
    isActive: true,
    isSeed: true
  }))
];

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
  const merged: (T | SeedProduct)[] = [];
  const seen = new Set<string>();

  defaultProducts.forEach((seed) => {
    if (hiddenGtins.has(seed.gtin) || hiddenGtins.has(seed.id)) return;
    merged.push(seed);
    if (seed.gtin) seen.add(seed.gtin);
    seen.add(seed.id);
  });

  products.forEach((p) => {
    const key = p.gtin || (p as any).id;
    if (key && seen.has(key)) return;
    merged.push(p);
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
