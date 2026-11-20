export interface RecipePairing {
  dishNameZh: string;
  dishNameEn: string;
  prepTime: string;
  difficulty: 'Easy' | 'Medium' | 'Chef Level';
  ingredients: string[];
  ratioTip: string;
  instructions: string[];
  chefSecret: string;
}

export interface ProductItem {
  id: string;
  sku: string;
  nameZh: string;
  nameEn: string;
  category: 'sauces' | 'powders' | 'provisions' | 'breakfast' | 'frozen';
  categoryLabelZh: string;
  categoryLabelEn: string;
  featured?: boolean;
  descriptionZh: string;
  descriptionEn: string;
  flavorProfile: string[];
  unitNetWeight: string;
  casePacking: string;
  cartonDimensions: string;
  shelfLife: string;
  storageInstructions: string;
  origin: string;
  certifications: string[];
  allergens: string[];
  ingredientsZh: string;
  ingredientsEn: string;
  image: string;
  suggestedWholesaleTier: string;
  recipePairing: RecipePairing;
}

export const CATEGORIES = [
  { id: 'all', labelZh: '全部系列', labelEn: 'All Products' },
  { id: 'sauces', labelZh: '香醬系列', labelEn: 'Sauce Series' },
  { id: 'powders', labelZh: '調味粉系列', labelEn: 'Seasoning Powders' },
  { id: 'provisions', labelZh: '乾貨雜貨', labelEn: 'Pantry Provisions' },
  { id: 'breakfast', labelZh: '早餐原料', labelEn: 'Breakfast & Specialty' },
  { id: 'frozen', labelZh: '急凍點心', labelEn: 'Frozen Delicacies' },
] as const;

export const PRODUCTS_DATA: ProductItem[] = [
  {
    id: 'ky-xo-sauce',
    sku: 'KY-SC-01',
    nameZh: '錦源特級蝦米瑤柱XO醬',
    nameEn: 'Artisanal Scallop & Shrimp XO Chili Sauce',
    category: 'sauces',
    categoryLabelZh: '香醬系列',
    categoryLabelEn: 'Sauce Series',
    featured: true,
    descriptionZh: '嚴選北海道特級一等元貝與南中國海野生海蝦米，慢火炒製出金黃醇厚的鮮甜海味與秘製焦香辣油，色澤油亮、絲絲分明。',
    descriptionEn: 'Handcrafted with grade-A dried Hokkaido scallops and wild sea shrimp, slowly simmered with infused chili oil and aromatics for an intensely savory, umami-rich Cantonese profile.',
    flavorProfile: ['濃郁元貝鮮香', '微辛辣油', '酥脆海味', '金黃焦香'],
    unitNetWeight: '250g / 玻璃罐 (Glass Jar)',
    casePacking: '24 罐 / 箱 (24 Jars / Carton, 9.8 kg)',
    cartonDimensions: '390 × 265 × 165 mm',
    shelfLife: '24 個月 (未開封常溫 / 24 Months)',
    storageInstructions: '避免陽光直射，置於陰涼乾燥處；開封後請務必冷藏 (2-6°C)。',
    origin: '香港製造 (Made in Hong Kong)',
    certifications: ['HACCP Certified', 'ISO 22000', '香港Q嘜優質標誌'],
    allergens: ['甲殼類甲殼動物 (Crustaceans)', '軟體動物 (Molluscs)', '大豆 (Soybean)'],
    ingredientsZh: '特選元貝、海蝦米、金華火腿、辣椒、蒜頭、紅蔥頭、優質植物油、天然海鹽、冰糖。',
    ingredientsEn: 'Dried Scallops, Wild Sea Shrimps, Jinhua Ham, Red Chilies, Fresh Garlic, Shallots, Vegetable Oil, Sea Salt, Rock Sugar.',
    image: '/src/assets/images/product_xo_sauce_1794477289762.jpg',
    suggestedWholesaleTier: '起訂量 5 箱 (MOQ 5 Cartons / 120 Jars)',
    recipePairing: {
      dishNameZh: '錦源XO醬生煎日本帶子皇',
      dishNameEn: 'Pan-Seared Jumbo Scallops in Kam Yuen XO Sauce',
      prepTime: '12 分鐘',
      difficulty: 'Easy',
      ingredients: [
        '特級帶子 6-8 顆',
        '錦源特級XO醬 2 湯匙',
        '青蘆筍 100g',
        '無鹽牛油 10g',
        '特級初榨橄欖油 1 湯匙'
      ],
      ratioTip: '每 300g 海鮮或肉類加入 2 湯匙 XO 醬，於最後 30 秒大火翻炒，香氣最為澎湃。',
      instructions: [
        '將新鮮帶子吸乾水分，表面輕劃十字刀紋，少許海鹽提味。',
        '平底鍋熱油加牛油，大火將帶子兩面煎至微金黃（約每面 1.5 分鐘）。',
        '加入錦源特級XO醬與炒熟蘆筍，迅速翻炒 20 秒裹勻醬汁即可擺盤。'
      ],
      chefSecret: '切忌過早下XO醬，因醬內干貝絲含糖與蛋白質，高溫久煎易焦苦；出鍋前淋入能完整鎖住香氣。'
    }
  },
  {
    id: 'ky-sand-ginger',
    sku: 'KY-PW-02',
    nameZh: '正宗雲南特級純沙薑粉',
    nameEn: 'Fine Yunnan Sand Ginger Powder (Kaempferia Galanga)',
    category: 'powders',
    categoryLabelZh: '調味粉系列',
    categoryLabelEn: 'Seasoning Powders',
    featured: true,
    descriptionZh: '採用雲南高山原生態老沙薑，清洗去皮經低溫低濕慢速脫水研磨，保留最純正獨特的辛香辛溫氣息，無任何防腐劑與增香劑。',
    descriptionEn: 'Milled from high-altitude mature Yunnan aromatic ginger rhizomes under low-temperature drying to preserve maximum essential oils and its signature medicinal fragrance.',
    flavorProfile: ['高雅沙薑香氣', '微辛甘醇', '去腥解膩', '傳統粵菜香韻'],
    unitNetWeight: '80g / 罐 (玻璃罐) & 1kg / 商用鋁箔袋',
    casePacking: '36 罐 / 箱 或 10 包 / 箱 (商用大宗規格)',
    cartonDimensions: '340 × 240 × 180 mm',
    shelfLife: '18 個月 (密封常溫 / 18 Months)',
    storageInstructions: '置於通風陰涼處，密封防潮防日光曝曬。',
    origin: '中國雲南產地直採 · 香港分裝',
    certifications: ['HACCP Certified', 'ISO 22000', '無添加人工色素'],
    allergens: ['無已知過敏原 (Allergen Free)'],
    ingredientsZh: '100% 天然精選沙薑 (Kaempferia Galanga Rhizome)。',
    ingredientsEn: '100% Pure Natural Dried Sand Ginger Rhizome.',
    image: '/src/assets/images/product_sand_ginger_1794477289474.jpg',
    suggestedWholesaleTier: '起訂量 10 箱 (MOQ 10 Cartons / 360 Jars)',
    recipePairing: {
      dishNameZh: '順德古法沙薑蔥油白切雞',
      dishNameEn: 'Traditional Poached Chicken with Sand Ginger Scallion Oil',
      prepTime: '25 分鐘',
      difficulty: 'Medium',
      ingredients: [
        '優質三黃雞半隻 (約 700g)',
        '錦源沙薑粉 1.5 茶匙',
        '新鮮沙薑碎 1 湯匙',
        '小蔥碎 3 湯匙',
        '高溫花生油 4 湯匙',
        '頭抽生抽 2 湯匙'
      ],
      ratioTip: '沙薑粉與熱油比例約 1:3，油溫約 180°C 淋下瞬間激發沙薑烯芳香物。',
      instructions: [
        '三黃雞浸熟冰鎮後切塊裝盤。',
        '碗中放入錦源沙薑粉、鮮沙薑碎、小蔥花及細鹽。',
        '起鍋將花生油燒熱至微冒青煙，分兩次淋入碗中爆香，最後調入生抽即可作為蘸料。'
      ],
      chefSecret: '沙薑粉比新鮮沙薑香氣更濃縮深沉，兩者各半混搭能達到既有顆粒咬感又有馥郁回味的頂級效果。'
    }
  },
  {
    id: 'ky-crispy-shallots',
    sku: 'KY-PV-03',
    nameZh: '金牌香酥紅蔥頭蒜酥',
    nameEn: 'Artisan Crispy Fried Shallots & Garlic Medley',
    category: 'provisions',
    categoryLabelZh: '乾貨雜貨',
    categoryLabelEn: 'Pantry Provisions',
    featured: true,
    descriptionZh: '精選新鮮紫皮紅蔥頭與特級金蒜，恆溫精控炸製，瀝油徹底，色澤金黃酥脆無焦苦，是拉麵、撈麵、粥品及蒸魚不可或缺的靈魂調味。',
    descriptionEn: 'Slow-fried fresh purple shallots and premium garlic in small batches, meticulously spun-dry for lasting crunch, rich golden aroma, and clean zero-grease finish.',
    flavorProfile: ['極致酥脆', '焦糖蔥香', '蒜香濃醇', '不含油耗味'],
    unitNetWeight: '250g / 密封罐 & 5kg / 商用大袋',
    casePacking: '20 罐 / 箱 (20 Cans / Carton, 6.2 kg)',
    cartonDimensions: '420 × 280 × 200 mm',
    shelfLife: '12 個月 (密封乾燥 / 12 Months)',
    storageInstructions: '避免受潮，每次使用後緊閉瓶蓋，保持乾燥爽脆。',
    origin: '廣東精製 (Guangdong)',
    certifications: ['HACCP Certified', 'ISO 22000', 'HALAL Certified'],
    allergens: ['無已知過敏原 (Allergen Free)'],
    ingredientsZh: '新鮮紅蔥頭、特選大蒜、精煉棕櫚植物油、小麥澱粉、海鹽。',
    ingredientsEn: 'Fresh Shallots, Fresh Garlic, Refined Vegetable Oil, Wheat Starch, Salt.',
    image: '/src/assets/images/product_crispy_shallots_1794477289731.jpg',
    suggestedWholesaleTier: '起訂量 8 箱 (MOQ 8 Cartons)',
    recipePairing: {
      dishNameZh: '廣式金蒜紅蔥生滾牛肉粥',
      dishNameEn: 'Cantonese Congee with Tender Beef and Crispy Shallots',
      prepTime: '20 分鐘',
      difficulty: 'Easy',
      ingredients: [
        '珍珠米瑤柱清粥底 2 碗',
        '鮮切牛柳薄片 150g',
        '錦源香酥紅蔥蒜酥 2 湯匙',
        '生薑絲與香菜 少許',
        '特級白胡椒粉 1 茶匙'
      ],
      ratioTip: '食用前直接撒在熱騰騰的菜餚頂部，切勿下鍋久煮以維持極致酥脆。',
      instructions: [
        '牛柳片加入少許生抽、糖及生粉醃製 10 分鐘。',
        '滾沸的白粥底中滑入牛肉片，輕輕攪散關火燜 1 分鐘至牛肉剛好斷生。',
        '舀入大碗，表面鋪上生薑絲、香菜，豪邁撒滿錦源香酥紅蔥頭蒜酥即可上桌。'
      ],
      chefSecret: '油脂瀝乾技術高超，即使泡在熱粥湯汁中 3 分鐘仍能維持酥化口感。'
    }
  },
  {
    id: 'ky-pepper-marinade',
    sku: 'KY-SC-04',
    nameZh: '港式特濃黑椒牛扒汁 / 醃料',
    nameEn: 'Cantonese Black Pepper Steak & Rib Marinade Sauce',
    category: 'sauces',
    categoryLabelZh: '香醬系列',
    categoryLabelEn: 'Sauce Series',
    featured: true,
    descriptionZh: '依據香港經典茶餐廳與豉油西餐廳傳奇配方調配，粗粒黑胡椒搭配焦糖洋蔥與上湯基底，辛辣順口、醬香濃稠，掛汁均勻。',
    descriptionEn: 'Authentic Hong Kong western-diner style black pepper glaze crafted with coarse cracked peppercorns, caramelized shallots, and rich savory broth base.',
    flavorProfile: ['黑椒辛香激昂', '甘醇鹹甜', '自然稠度', '肉香提鮮'],
    unitNetWeight: '250ml / 玻璃瓶 & 2.2kg / 商用大容量桶',
    casePacking: '24 瓶 / 箱 (24 Bottles / Carton)',
    cartonDimensions: '360 × 250 × 210 mm',
    shelfLife: '24 個月 (24 Months)',
    storageInstructions: '常溫陰涼處保存，開封後請冷藏。',
    origin: '香港製造 (Made in Hong Kong)',
    certifications: ['HACCP Certified', 'ISO 22000'],
    allergens: ['大豆 (Soybean)', '小麥含有麩質 (Gluten)'],
    ingredientsZh: '水、粗粒黑胡椒、釀造醬油、洋蔥、蒜茸、番茄糊、冰糖、食鹽、改性澱粉。',
    ingredientsEn: 'Water, Coarse Black Pepper, Brewed Soy Sauce, Onion, Garlic, Tomato Puree, Sugar, Salt, Modified Starch.',
    image: '/src/assets/images/product_pepper_marinade_1794477290081.jpg',
    suggestedWholesaleTier: '起訂量 6 箱 (MOQ 6 Cartons / 144 Bottles)',
    recipePairing: {
      dishNameZh: '鐵板黑椒安格斯牛柳粒',
      dishNameEn: 'Sizzling Angus Beef Cubes with Black Pepper Glaze',
      prepTime: '15 分鐘',
      difficulty: 'Medium',
      ingredients: [
        '安格斯牛柳粒 300g',
        '洋蔥塊 1/2 顆',
        '紅綠甜椒塊 100g',
        '錦源黑椒牛扒汁 3 湯匙',
        '蒜片 3 瓣'
      ],
      ratioTip: '醃肉時每 500g 牛肉加入 2 湯匙抓勻；起鍋收汁再淋入 1 湯匙快速包裹。',
      instructions: [
        '牛肉粒用少許黑椒汁及蛋清抓醃 15 分鐘。',
        '熱鍋旺油將牛肉粒煎至外表焦香約 7 分熟盛起備用。',
        '原鍋炒香蒜片、洋蔥與甜椒，倒回牛肉粒並淋入錦源黑椒牛扒汁，大火翻炒 15 秒收汁即可出鍋。'
      ],
      chefSecret: '若使用鑄鐵板上菜，在燒熱鐵板底部抹一層薄牛油，倒入菜餚時能爆發撲鼻的鑊氣與奶香。'
    }
  },
  {
    id: 'ky-chili-paste',
    sku: 'KY-SC-05',
    nameZh: '錦源潮汕風味蝦米辣椒醬',
    nameEn: 'Chaozhou Style Dried Shrimp & Garlic Chili Paste',
    category: 'sauces',
    categoryLabelZh: '香醬系列',
    categoryLabelEn: 'Sauce Series',
    featured: false,
    descriptionZh: '傳承潮汕漁民古法，以慢火油爆蒜茸、乾蔥及海蝦乾，結合指天椒提味，辣中帶鮮，鹹香適口，是拌麵、蘸水餃與炒芥藍的最佳拍檔。',
    descriptionEn: 'Traditional Chaozhou fishermen recipe with wok-crisped dried shrimp, aromatic garlic, and fiery sun-dried chilies for an unctuous, layered spice profile.',
    flavorProfile: ['鮮香微甜', '蒜辣交融', '蝦乾顆粒感', '開胃下飯'],
    unitNetWeight: '220g / 罐',
    casePacking: '24 罐 / 箱',
    cartonDimensions: '350 × 240 × 150 mm',
    shelfLife: '24 個月',
    storageInstructions: '置於通風陰涼處，開封後冷藏保存。',
    origin: '香港製造 (Made in Hong Kong)',
    certifications: ['HACCP Certified', 'ISO 22000'],
    allergens: ['甲殼類甲殼動物 (Crustaceans)', '大豆 (Soybean)'],
    ingredientsZh: '精選辣椒、海蝦乾、大蒜、大豆油、食鹽、白砂糖。',
    ingredientsEn: 'Chilies, Dried Shrimp, Fresh Garlic, Soybean Oil, Salt, Sugar.',
    image: '/src/assets/images/product_xo_sauce_1794477289762.jpg',
    suggestedWholesaleTier: '起訂量 5 箱',
    recipePairing: {
      dishNameZh: '蝦米辣椒醬乾拌潮州手打手工麵',
      dishNameEn: 'Chaozhou Hand-Pulled Noodles with Shrimp Chili Paste',
      prepTime: '8 分鐘',
      difficulty: 'Easy',
      ingredients: [
        '潮州手工幼麵 150g',
        '錦源蝦米辣椒醬 1.5 湯匙',
        '鎮江香醋 1 茶匙',
        '頭抽 1 茶匙',
        '香蔥與白芝麻 少許'
      ],
      ratioTip: '醬料與香醋以 3:1 調配，能解膩並大幅提昇鮮味。',
      instructions: [
        '水滾下麵條煮約 2.5 分鐘撈起瀝乾水分。',
        '碗底放入生抽、香醋與錦源蝦米辣椒醬拌勻。',
        '趁熱加入麵條拌勻，撒上蔥花與芝麻即可。'
      ],
      chefSecret: '煮麵水留 1 湯匙拌入麵中，醬汁更容易乳化掛在麵條上。'
    }
  },
  {
    id: 'ky-five-spice',
    sku: 'KY-PW-06',
    nameZh: '錦源傳承特級五香粉',
    nameEn: 'Heritage Golden Five Spice Powder Blend',
    category: 'powders',
    categoryLabelZh: '調味粉系列',
    categoryLabelEn: 'Seasoning Powders',
    featured: false,
    descriptionZh: '採用八角、肉桂、丁香、小茴香與花椒五種天然原粒草本植物按黃金比例烘焙精研，香氣層次綿長，是滷水、燒味及酥炸排骨的定味靈魂。',
    descriptionEn: 'Master blend of whole star anise, cinnamon bark, cloves, fennel seed, and Sichuan peppercorns gently toasted and pulverized for aromatic Cantonese marinades.',
    flavorProfile: ['木質甜香', '溫和微麻', '回味甘醇', '草本芳香'],
    unitNetWeight: '75g / 罐 & 1kg / 鋁箔袋',
    casePacking: '36 罐 / 箱',
    cartonDimensions: '320 × 220 × 160 mm',
    shelfLife: '24 個月',
    storageInstructions: '避免光照與潮濕，常溫避光保存。',
    origin: '香港精製 (Hong Kong)',
    certifications: ['HACCP Certified', 'ISO 22000', '純素 (Vegan)'],
    allergens: ['無已知過敏原 (Allergen Free)'],
    ingredientsZh: '八角、肉桂、小茴香、花椒、丁香。',
    ingredientsEn: 'Star Anise, Cassia Cinnamon, Fennel, Sichuan Pepper, Cloves.',
    image: '/src/assets/images/product_sand_ginger_1794477289474.jpg',
    suggestedWholesaleTier: '起訂量 10 箱',
    recipePairing: {
      dishNameZh: '港式茶樓金牌五香滷水牛腱',
      dishNameEn: 'Braised Beef Shank in Heritage Five Spice Master Broth',
      prepTime: '60 分鐘',
      difficulty: 'Chef Level',
      ingredients: [
        '金錢牛腱 2 條 (約 800g)',
        '錦源五香粉 1.5 湯匙',
        '老抽 3 湯匙、生抽 4 湯匙',
        '老冰糖 40g',
        '生薑蔥段 少許'
      ],
      ratioTip: '每 1 公升滷水加入 1 湯匙五香粉，溫火慢燉能使香料精華浸透肉質深層纖維。',
      instructions: [
        '牛腱冷水下鍋焯水洗淨。',
        '鍋內少許油炒香冰糖至棗紅色，加入水、醬油、生薑及錦源五香粉煮沸成滷汁。',
        '放入牛腱轉小火慢燉 50 分鐘，關火浸泡 3 小時以上放涼切薄片。'
      ],
      chefSecret: '滷好後不要立即切片，浸泡過夜再切能保持肉片完整且紋理清爽吸汁。'
    }
  },
  {
    id: 'ky-fried-garlic',
    sku: 'KY-PV-07',
    nameZh: '特選天然金黃炸蒜茸',
    nameEn: 'Golden Crispy Fried Minced Garlic Flakes',
    category: 'provisions',
    categoryLabelZh: '乾貨雜貨',
    categoryLabelEn: 'Pantry Provisions',
    featured: false,
    descriptionZh: '精選新鮮大蒜切粒，低溫慢火炸製成均勻金黃色澤，蒜香撲鼻、粒粒酥鬆，無多餘油脂殘留，廣受粵菜酒樓蒸蝦、蒸扇貝與生蠔指定選用。',
    descriptionEn: 'Precision-diced fresh garlic gently crisped to golden perfection with zero bitterness, an essential topper for steamed seafood and dim sum feasts.',
    flavorProfile: ['濃郁熟蒜香', '極致酥化', '不苦不油', '自然甘甜'],
    unitNetWeight: '200g / 罐 & 5kg / 批發裝',
    casePacking: '24 罐 / 箱',
    cartonDimensions: '400 × 260 × 190 mm',
    shelfLife: '12 個月',
    storageInstructions: '置於乾燥陰涼處，避免受潮。',
    origin: '廣東精製 (Guangdong)',
    certifications: ['HACCP Certified', 'ISO 22000'],
    allergens: ['無已知過敏原 (Allergen Free)'],
    ingredientsZh: '大蒜、大豆沙拉油、玉米澱粉。',
    ingredientsEn: 'Fresh Garlic, Soybean Oil, Corn Starch.',
    image: '/src/assets/images/product_crispy_shallots_1794477289731.jpg',
    suggestedWholesaleTier: '起訂量 8 箱',
    recipePairing: {
      dishNameZh: '金銀蒜蓉粉絲蒸大蝦',
      dishNameEn: 'Steamed Prawns with Glass Noodles & Duo Garlic Glaze',
      prepTime: '15 分鐘',
      difficulty: 'Easy',
      ingredients: [
        '鮮活基圍蝦 10 隻 (開背去蝦線)',
        '綠豆粉絲 1 紮 (泡軟墊底)',
        '錦源金黃炸蒜茸 2 湯匙',
        '生大蒜茸 2 湯匙',
        '蒸魚豉油 2 湯匙'
      ],
      ratioTip: '生蒜茸與炸蒜茸以 1:1 調製成「金銀蒜」，生蒜辛辣香氣與熟蒜酥甜交融。',
      instructions: [
        '粉絲泡軟鋪在盤底，上面整齊碼放開背大蝦。',
        '生蒜蓉與錦源炸蒜茸調和少許生抽與花生油，均勻抹在蝦肉上。',
        '水滾後大火蒸 5 分鐘出鍋，淋上熱蒸魚豉油即可。'
      ],
      chefSecret: '金銀蒜調配時加入 1 茶匙高湯，可使蒸製過程中蒜香更快滲透至粉絲。'
    }
  },
  {
    id: 'ky-toast-syrup',
    sku: 'KY-BK-08',
    nameZh: '港式茶餐廳特級西多士專用糖漿',
    nameEn: 'Hong Kong Diner Classic Golden French Toast Syrup',
    category: 'breakfast',
    categoryLabelZh: '早餐原料',
    categoryLabelEn: 'Breakfast & Specialty',
    featured: false,
    descriptionZh: '傳承五十年冰室風味，精選天然焦糖與植物蔗糖慢熬調配，黏稠度恰到好處，甜而不膩，帶有溫潤太妃糖與楓糖芳香，熱烘烘淋在牛油上化開香味無敵。',
    descriptionEn: 'The quintessential cha chaan teng syrup infused with subtle caramel and buttery notes, formulated for high viscosity and slow absorption into golden brioche.',
    flavorProfile: ['焦糖甜香', '太妃香韻', '稠厚掛絲', '濃醇甘甜'],
    unitNetWeight: '450g / 擠壓瓶 & 5kg / 商用大桶',
    casePacking: '12 瓶 / 箱',
    cartonDimensions: '320 × 240 × 230 mm',
    shelfLife: '24 個月',
    storageInstructions: '常溫陰涼處存放。',
    origin: '香港製造 (Hong Kong)',
    certifications: ['HACCP Certified', 'ISO 22000'],
    allergens: ['無已知過敏原 (Allergen Free)'],
    ingredientsZh: '天然蔗糖、水、焦糖色素、食用香料。',
    ingredientsEn: 'Cane Sugar, Filtered Water, Caramel Color, Natural Flavors.',
    image: '/src/assets/images/hero_culinary_pantry_1794477287879.jpg',
    suggestedWholesaleTier: '起訂量 5 箱',
    recipePairing: {
      dishNameZh: '經典冰室黃金熔岩流心西多士',
      dishNameEn: 'Hong Kong Cafe Golden Lava French Toast',
      prepTime: '10 分鐘',
      difficulty: 'Easy',
      ingredients: [
        '厚切吐司 2 片',
        '特濃花生醬 2 湯匙',
        '全蛋液 2 顆',
        '無鹽牛油 1 厚塊 (約 15g)',
        '錦源西多士糖漿 隨心淋上'
      ],
      ratioTip: '出鍋 30 秒內趁熱放置牛油塊並淋上糖漿，利用餘溫融化牛油結合糖香。',
      instructions: [
        '吐司切去四邊硬皮，中間抹上厚厚一層花生醬夾緊。',
        '將吐司浸入打散的蛋液中，六面均勻吸飽蛋汁。',
        '平底鍋熱油慢煎或半煎炸至表面金黃鼓起，夾出瀝油放上牛油與糖漿。'
      ],
      chefSecret: '浸泡蛋液時加入一茶匙淡奶，炸出來的西多士外酥內嫩如同布丁。'
    }
  },
  {
    id: 'ky-wonton-dumpling',
    sku: 'KY-FZ-09',
    nameZh: '錦源手工鮮蝦雲吞 (急凍點心)',
    nameEn: 'Handcrafted Jumbo Prawn Wontons (Frozen Dim Sum)',
    category: 'frozen',
    categoryLabelZh: '急凍點心',
    categoryLabelEn: 'Frozen Delicacies',
    featured: false,
    descriptionZh: '嚴選整隻南美白蝦肉與特選豬前腿肉，皮薄如蟬翼，煮熟後晶瑩剔透，咬開爆汁彈牙，配上大地魚清湯底，是正宗廣式雲吞麵的最佳標準。',
    descriptionEn: 'Crisp hand-folded delicate wonton pastries packed with whole wild-caught prawns and pork tenderloin, quick-frozen at -35°C to lock in coastal freshness.',
    flavorProfile: ['蝦肉鮮甜脆彈', '肉汁豐富', '薄皮滑順', '大地魚底香'],
    unitNetWeight: '24 粒 / 盒 (約 450g) & 100 粒 / 商用包',
    casePacking: '16 盒 / 箱 (16 Boxes / Carton)',
    cartonDimensions: '440 × 310 × 240 mm',
    shelfLife: '12 個月 (-18°C 保持冷凍)',
    storageInstructions: '極致冷凍儲存 (-18°C)，烹飪前無需解凍直接下鍋。',
    origin: '香港精製 (Hong Kong)',
    certifications: ['HACCP Certified', 'ISO 22000', '冷鏈全程監控'],
    allergens: ['甲殼類動物 (Prawns)', '小麥含有麩質 (Gluten)', '雞蛋 (Eggs)'],
    ingredientsZh: '整隻蝦仁、豬肉、小麥粉、雞蛋、大地魚粉、芝麻油、食鹽、胡椒粉。',
    ingredientsEn: 'Whole Prawns, Pork, Wheat Flour, Fresh Eggs, Flounder Fish Powder, Sesame Oil, Salt, White Pepper.',
    image: '/src/assets/images/hero_culinary_pantry_1794477287879.jpg',
    suggestedWholesaleTier: '起訂量 10 箱 (冷鏈配送)',
    recipePairing: {
      dishNameZh: '大地魚韭黃鮮蝦雲吞竹昇麵',
      dishNameEn: 'Classic Cantonese Prawn Wonton Noodle Soup',
      prepTime: '8 分鐘',
      difficulty: 'Easy',
      ingredients: [
        '錦源鮮蝦雲吞 5-6 粒',
        '全蛋竹昇幼麵 1 團',
        '大地魚骨上湯 400ml',
        '新鮮韭黃段 少許',
        '紅醋 少許 (蘸料)'
      ],
      ratioTip: '水沸後直接投入急凍雲吞，大火煮 4.5 分鐘浮起變透明即可撈出。',
      instructions: [
        '另起滾水鍋，散開生麵煮 45 秒撈起過冷水，再回滾水中過一下瀝乾裝碗。',
        '雲吞煮熟後置於碗底，以麵條覆蓋在雲吞上方（防止雲吞泡爛），撒上韭黃。',
        '沿碗邊徐徐注入滾燙的大地魚上湯即可趁熱品嚐。'
      ],
      chefSecret: '「匙羹在底，雲吞在中，麵在頂，湯在邊」是廣州與香港雲吞麵百年不變的擺盤智慧。'
    }
  }
];
