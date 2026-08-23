import { execSync } from 'child_process';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CATEGORY_URLS = [
  { id: 'packs', name: 'Tecno Packs', slug: 'tecno-pack', url: 'https://tecnoofertas.pe/9-tecno-pack' },
  { id: 'apple', name: 'Accesorios Apple', slug: 'accesorios-apple', url: 'https://tecnoofertas.pe/36-accesorios-apple' },
  { id: 'audifonos', name: 'Audífonos & Audio', slug: 'audifonos', url: 'https://tecnoofertas.pe/12-audifonos' },
  { id: 'cargadores', name: 'Cargadores & Hubs', slug: 'cargadores', url: 'https://tecnoofertas.pe/14-cargadores' },
  { id: 'smartwatch', name: 'Smartwatches & Pulseras', slug: 'smartwatch', url: 'https://tecnoofertas.pe/17-smartwatch' },
  { id: 'cases', name: 'Cases & Fundas', slug: 'cases', url: 'https://tecnoofertas.pe/18-cases-' },
  { id: 'cases-16', name: 'Cases iPhone Serie 16', slug: 'iphones-serie-16', url: 'https://tecnoofertas.pe/48-iphones-serie-16' },
  { id: 'cases-15', name: 'Cases iPhone Serie 15', slug: 'iphones-serie-15', url: 'https://tecnoofertas.pe/47-iphones-serie-15' },
  { id: 'cables', name: 'Cables & Adaptadores', slug: 'cables', url: 'https://tecnoofertas.pe/15-cables' },
  { id: 'micas', name: 'Micas & Protectores de Lente', slug: 'micas', url: 'https://tecnoofertas.pe/19-micas' }
];

function fetchHtml(url) {
  try {
    const cmd = `curl -s -L -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36" "${url}"`;
    return execSync(cmd, { maxBuffer: 15 * 1024 * 1024 }).toString();
  } catch (err) {
    console.error(`Fetch error for ${url}:`, err.message);
    return '';
  }
}

function parsePrice(str) {
  if (!str) return 0;
  // Format: "S/ 350,00" or "S/ 350" or "S/ 149.00"
  const clean = str.replace(/[^\d.,]/g, '').replace(',', '.');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : Math.round(num * 100) / 100;
}

function generateSlug(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function scrapeFullCatalog() {
  console.log('🚀 Iniciando extracción del catálogo completo...');

  const productsMap = new Map();
  const categoriesMap = new Map();

  CATEGORY_URLS.forEach(c => {
    categoriesMap.set(c.id, {
      id: c.id,
      name: c.name,
      slug: c.slug,
      productCount: 0
    });
  });

  for (const cat of CATEGORY_URLS) {
    console.log(`\n📂 Procesando categoría: ${cat.name} (${cat.url})`);
    
    // Check multiple pages if pagination exists
    for (let page = 1; page <= 3; page++) {
      const pageUrl = page === 1 ? cat.url : `${cat.url}?page=${page}`;
      const html = fetchHtml(pageUrl);
      if (!html) break;

      const $ = cheerio.load(html);
      const items = $('.js-product-miniature, .product-miniature, article');

      if (items.length === 0) {
        if (page === 1) console.log(`   ⚠️ No se encontraron productos en ${cat.name}`);
        break;
      }

      console.log(`   Página ${page}: ${items.length} productos detectados.`);

      items.each((_, el) => {
        const title = $(el).find('.product-title a, h3 a, h2 a, .product-title').text().trim();
        const productUrl = $(el).find('.product-title a, a.thumbnail, a').first().attr('href');
        const priceStr = $(el).find('.price, .current-price').text().trim();
        const regularPriceStr = $(el).find('.regular-price').text().trim();
        const discountStr = $(el).find('.discount-percentage, .discount, .badge').text().trim();
        
        let img = $(el).find('img').attr('data-full-size-image-url') ||
                  $(el).find('img').attr('src') ||
                  $(el).find('img').attr('data-src');

        if (!title || !priceStr) return;

        const currentPrice = parsePrice(priceStr);
        let regularPrice = regularPriceStr ? parsePrice(regularPriceStr) : null;
        if (!regularPrice || regularPrice <= currentPrice) {
          // If no regular price or same, calculate realistic original price for promo badge
          regularPrice = Math.round(currentPrice * 1.35);
        }

        const discountPercentage = Math.round(((regularPrice - currentPrice) / regularPrice) * 100);

        // Detect brand
        let brand = 'Genérico';
        const titleUpper = title.toUpperCase();
        if (titleUpper.includes('APPLE') || titleUpper.includes('IPHONE') || titleUpper.includes('AIRPODS') || titleUpper.includes('IWATCH') || titleUpper.includes('MAGSAFE')) {
          brand = 'Apple';
        } else if (titleUpper.includes('UGREEN')) {
          brand = 'Ugreen';
        } else if (titleUpper.includes('BASEUS')) {
          brand = 'Baseus';
        } else if (titleUpper.includes('ANKER')) {
          brand = 'Anker';
        } else if (titleUpper.includes('HUAWEI')) {
          brand = 'Huawei';
        } else if (titleUpper.includes('SAMSUNG')) {
          brand = 'Samsung';
        } else if (titleUpper.includes('CASE') || titleUpper.includes('FUNDA')) {
          brand = 'Nexora Armor';
        }

        const slug = generateSlug(title);
        const productId = `NX-${Math.abs(slug.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0)).toString(36).toUpperCase()}`;

        if (!productsMap.has(slug)) {
          productsMap.set(slug, {
            id: productId,
            slug,
            name: title,
            brand,
            categoryId: cat.id,
            categoryName: cat.name,
            price: currentPrice,
            regularPrice: regularPrice,
            discountPercentage: discountPercentage,
            currency: 'PEN',
            symbol: 'S/',
            images: img ? [img] : [],
            rating: parseFloat((4.5 + (Math.random() * 0.5)).toFixed(1)),
            reviewCount: Math.floor(Math.random() * 45) + 12,
            inStock: true,
            stock: Math.floor(Math.random() * 25) + 5,
            isFeatured: Math.random() > 0.6,
            isBestSeller: Math.random() > 0.7,
            isNew: Math.random() > 0.75,
            description: `${title} con acabados de alta calidad, compatibilidad garantizada y garantía oficial Nexora Store de 6 meses. Envío express a todo el Perú.`,
            features: [
              '100% Original y Certificado',
              'Garantía Oficial Nexora de 6 meses',
              'Envío rápido en Lima (mismo día) y a todo el Perú vía Olva Courier',
              'Soporte técnico prioritario por WhatsApp'
            ],
            variants: [
              { name: 'Color', options: ['Negro Espacial', 'Titanio Natural', 'Blanco Estelar', 'Azul Sierra'] }
            ],
            sourceUrl: productUrl
          });
        }
      });
    }
  }

  // Ensure curated popular Ugreen, Apple and Pack flagship products are present and enriched
  const curatedFlagships = [
    {
      id: 'NX-UG-65W-NEXODE',
      slug: 'cargador-ugreen-nexode-65w-gan-3-puertos',
      name: 'Cargador Rápido UGREEN Nexode 65W GaN 3 Puertos USB-C + USB-A',
      brand: 'Ugreen',
      categoryId: 'cargadores',
      categoryName: 'Cargadores & Hubs',
      price: 149.00,
      regularPrice: 219.00,
      discountPercentage: 32,
      currency: 'PEN',
      symbol: 'S/',
      images: [
        'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=80'
      ],
      rating: 4.9,
      reviewCount: 98,
      inStock: true,
      stock: 40,
      isFeatured: true,
      isBestSeller: true,
      isNew: true,
      description: 'Tecnología GaNFast revolucionaria. Carga tu MacBook Pro al 50% en solo 30 minutos o simultáneamente 3 dispositivos (iPhone, iPad, MacBook). Protección contra sobrecalentamiento y tamaño ultra compacto.',
      features: [
        'Tecnología GaN III (Nitruro de Galio) de alta eficiencia térmica',
        '2 Puertos USB-C Power Delivery 3.0 + 1 Puerto USB-A QuickCharge 4.0+',
        'Compatible con iPhone 16/15/14/13, MacBooks M1/M2/M3, iPads y Samsung S24',
        'Sistema de seguridad ThermalGuard con monitorización de temperatura 800 veces/seg'
      ],
      variants: [
        { name: 'Color', options: ['Gris Espacial', 'Blanco Glaciar'] }
      ]
    },
    {
      id: 'NX-AP-MAGSAFE-DUO',
      slug: 'cargador-inalambrico-magsafe-duo-apple-plegable',
      name: 'Cargador Inalámbrico MagSafe Plegable 3 en 1 para iPhone, Apple Watch y AirPods',
      brand: 'Apple',
      categoryId: 'cargadores',
      categoryName: 'Cargadores & Hubs',
      price: 129.00,
      regularPrice: 199.00,
      discountPercentage: 35,
      currency: 'PEN',
      symbol: 'S/',
      images: [
        'https://images.unsplash.com/photo-1622445262464-84b1456045b6?auto=format&fit=crop&w=800&q=80'
      ],
      rating: 4.8,
      reviewCount: 76,
      inStock: true,
      stock: 35,
      isFeatured: true,
      isBestSeller: true,
      isNew: false,
      description: 'Estación de carga magnética 3 en 1 con soporte MagSafe rápido de 15W. Diseño plegable ultrafino ideal para mesa de noche o viajes.',
      features: [
        'Alineación magnética fuerte N52',
        'Carga simultánea 15W iPhone + 5W Watch + 5W AirPods',
        'Indicador LED inteligente y luz nocturna tenue',
        'Incluye cable USB-C a USB-C de alta velocidad trenzado'
      ],
      variants: [
        { name: 'Color', options: ['Negro Mate', 'Blanco Perla', 'Titanio'] }
      ]
    },
    {
      id: 'NX-CASE-TITANIUM-16PRO',
      slug: 'case-nexora-armor-magsafe-titanio-iphone-16-pro-max',
      name: 'Case Nexora Armor MagSafe Titanio con Protección de Cámara Grado Militar - iPhone 16 Pro Max',
      brand: 'Nexora Armor',
      categoryId: 'cases-16',
      categoryName: 'Cases iPhone Serie 16',
      price: 69.00,
      regularPrice: 110.00,
      discountPercentage: 37,
      currency: 'PEN',
      symbol: 'S/',
      images: [
        'https://images.unsplash.com/photo-1603539260192-3ef8e1837f48?auto=format&fit=crop&w=800&q=80'
      ],
      rating: 4.9,
      reviewCount: 142,
      inStock: true,
      stock: 60,
      isFeatured: true,
      isBestSeller: true,
      isNew: true,
      description: 'Protección militar anti-impactos MIL-STD-810G con bisel de aleación de aluminio aeroespacial para la lente de cámara y anillo magnético MagSafe reforzado.',
      features: [
        'Borde de aluminio anodizado que protege el lente 360°',
        'Imanes de neodimio integrados con 1500g de fuerza magnética',
        'Acabado mate antihuellas con tacto suave sedoso',
        'Botón de acción y control de cámara metálico independiente'
      ],
      variants: [
        { name: 'Modelo', options: ['iPhone 16 Pro Max', 'iPhone 16 Pro', 'iPhone 16 Plus', 'iPhone 16'] },
        { name: 'Color', options: ['Titanio Natural', 'Titanio Negro', 'Titanio Blanco', 'Titanio Desierto'] }
      ]
    }
  ];

  curatedFlagships.forEach(p => {
    productsMap.set(p.slug, p);
  });

  const allProducts = Array.from(productsMap.values());
  
  // Recalculate category counts
  const categoriesList = Array.from(categoriesMap.values()).map(cat => {
    const count = allProducts.filter(p => p.categoryId === cat.id).length;
    return { ...cat, productCount: count };
  });

  const catalog = {
    storeName: 'Nexora Store',
    tagline: 'Lo mejor en tecnología Apple, Ugreen, Cases y Accesorios al mejor precio de Perú',
    extractedAt: new Date().toISOString(),
    totalProducts: allProducts.length,
    currency: 'PEN',
    symbol: 'S/',
    whatsappNumber: '51999999999',
    categories: categoriesList,
    brands: ['Apple', 'Ugreen', 'Nexora Armor', 'Baseus', 'Anker', 'Huawei', 'Samsung'],
    products: allProducts
  };

  const outputDir = path.join(__dirname, '../src/data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'catalog.json');
  fs.writeFileSync(outputPath, JSON.stringify(catalog, null, 2));

  console.log(`\n🎉 Catálogo exportado exitosamente con ${allProducts.length} productos en: ${outputPath}`);
}

scrapeFullCatalog();
