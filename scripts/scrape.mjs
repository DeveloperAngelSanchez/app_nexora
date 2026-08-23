import { execSync } from 'child_process';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function fetchUrl(url) {
  try {
    const cmd = `curl -s -L -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36" "${url}"`;
    return execSync(cmd, { maxBuffer: 10 * 1024 * 1024 }).toString();
  } catch (e) {
    console.error(`Error fetching ${url}:`, e.message);
    return '';
  }
}

async function scrape() {
  console.log('Fetching homepage...');
  const html = fetchUrl('https://tecnoofertas.pe/');
  const $ = cheerio.load(html);
  
  console.log('Page Title:', $('title').text().trim());

  // Extract menu links / categories
  const categories = [];
  $('a').each((i, el) => {
    const href = $(el).attr('href');
    const text = $(el).text().trim();
    if (href && (href.includes('.pe/') || href.startsWith('/')) && text) {
      if (
        href.includes('/categoria') || 
        href.includes('/category') || 
        href.includes('id_category') || 
        href.match(/\.pe\/[0-9]+-/) ||
        text.toLowerCase().includes('apple') ||
        text.toLowerCase().includes('ugreen') ||
        text.toLowerCase().includes('cargador') ||
        text.toLowerCase().includes('audifono') ||
        text.toLowerCase().includes('funda') ||
        text.toLowerCase().includes('case') ||
        text.toLowerCase().includes('smartwatch') ||
        text.toLowerCase().includes('reloj') ||
        text.toLowerCase().includes('pack')
      ) {
        categories.push({ text: text.replace(/\s+/g, ' '), href });
      }
    }
  });

  // Extract products visible on home page
  const products = [];
  $('.product-miniature, .product-item, .js-product-miniature, article, .thumbnail-container').each((i, el) => {
    const title = $(el).find('.product-title, h3, h2, .product-name').text().trim();
    const price = $(el).find('.price, .product-price, .current-price').text().trim();
    const regularPrice = $(el).find('.regular-price').text().trim();
    const discount = $(el).find('.discount-percentage, .discount, .badge').text().trim();
    const img = $(el).find('img').attr('data-full-size-image-url') || $(el).find('img').attr('src') || $(el).find('img').attr('data-src');
    const link = $(el).find('a').attr('href');

    if (title && price) {
      products.push({
        title,
        price,
        regularPrice: regularPrice || null,
        discount: discount || null,
        image: img,
        url: link
      });
    }
  });

  console.log(`Found ${categories.length} potential category/nav links:`);
  console.log(categories.slice(0, 15));

  console.log(`Found ${products.length} products on homepage:`);
  console.log(products.slice(0, 5));

  // Save raw dump for inspection
  fs.writeFileSync(path.join(__dirname, 'dump_categories.json'), JSON.stringify(categories, null, 2));
  fs.writeFileSync(path.join(__dirname, 'dump_products.json'), JSON.stringify(products, null, 2));
}

scrape();
