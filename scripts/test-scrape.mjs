import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testFetch() {
  try {
    console.log('Fetching tecnoofertas.pe homepage...');
    const response = await axios.get('https://tecnoofertas.pe/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
      },
      timeout: 10000
    });
    console.log('Status code:', response.status);
    const $ = cheerio.load(response.data);
    const title = $('title').text();
    console.log('Title:', title);
    
    // Look for product cards / links / categories
    const links = [];
    $('a[href*="/product/"], a[href*="/producto/"], a[href*="/categoria/"], a[href*="/category/"], a[href*="/coleccion/"], a[href*="/collections/"]').each((i, el) => {
      links.push($(el).attr('href'));
    });
    console.log('Found product/category link count:', links.length);
    console.log('Sample links:', links.slice(0, 10));
  } catch (err) {
    console.error('Error fetching tecnoofertas.pe:', err.message);
  }
}

testFetch();
