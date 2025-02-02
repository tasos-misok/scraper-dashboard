const puppeteer = require('puppeteer');
const fs = require('fs');

// Συνάρτηση που επιστρέφει τυχαία καθυστέρηση (σε ms)
const randomDelay = (min = 800, max = 2000) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

//
// Ορισμός παραμέτρων για τα sites
//
const sites = [
  {
    name: 'efantasy',
    baseUrl: 'https://www.efantasy.gr/el/%CF%80%CF%81%CE%BF%CF%8A%CF%8C%CE%BD%CF%84%CE%B1/magic-the-gathering/sealed',
    pagination: (baseUrl, pageIndex) =>
      pageIndex === 0 ? baseUrl : `${baseUrl}/start=${pageIndex}`,
    productContainer: 'div.product.product-box',
    selectors: {
      name: 'div.product-title a',
      price: 'div.product-price strong',
      stock: 'div.product-stock span:first-child',
      link: 'div.product-title a'
    },
    step: 48
  },
  {
    name: 'fantasy-shop',
    baseUrl: 'https://www.fantasy-shop.gr/en/kartes/magic-the-gathering/',
    // Αν pageIndex == 0 επιστρέφει το baseUrl, αλλιώς προσθέτει "page-<pageIndex+1>/"
    pagination: (baseUrl, pageIndex) =>
      pageIndex === 0 ? baseUrl : `${baseUrl}page-${pageIndex + 1}/`,
    // Τα προϊόντα βρίσκονται μέσα σε <div class="grid-list"> και κάθε προϊόν είναι στοιχείο με class "ty-column3"
    productContainer: 'div.grid-list .ty-column3',
    selectors: {
      // Ο τίτλος βρίσκεται μέσα στο <bdi><a> (με attribute title)
      name: 'bdi a',
      // Η τιμή βρίσκεται μέσα σε <div class="ty-grid-list__price"><span>...</span></div>
      price: 'span.ty-price',
      // Δεν υπάρχει στοιχείο για το stock στο listing, οπότε το αφήνουμε ως null
      stock: null,
      // Το link βρίσκεται στο ίδιο <a> που περιέχει και τον τίτλο
      link: 'bdi a'
    },
    step: 1,
    // maxPages: 3
  }
];

//
// Συνάρτηση που κάνει scraping μιας σελίδας για ένα συγκεκριμένο site
//
const scrapePageForSite = async (page, url, siteConfig) => {
  try {
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
    );
    await page.goto(url, { waitUntil: 'networkidle0' });
    await delay(3000); // επιπλέον καθυστέρηση για δυναμικό περιεχόμενο

    const products = await page.evaluate((config) => {
      const productElements = document.querySelectorAll(config.productContainer);
      const results = [];
      productElements.forEach((product) => {
        const nameEl = product.querySelector(config.selectors.name);
        const name = nameEl ? (nameEl.getAttribute('title') || nameEl.textContent.trim()) : null;
        const price = product.querySelector(config.selectors.price)
                        ? product.querySelector(config.selectors.price).textContent.trim()
                        : null;
        const stock = config.selectors.stock
                        ? product.querySelector(config.selectors.stock)?.textContent.trim()
                        : "Not Fetched";
        const link = product.querySelector(config.selectors.link)
                        ? product.querySelector(config.selectors.link).href
                        : null;
        // Δεν χρησιμοποιούμε if (name && price && link), ώστε να συμπεριλάβουμε όλα τα προϊόντα.
        if (name === null || price === null || link === null) {
          return; // Παράλειψη αυτού του στοιχείου.
        }

        results.push({ name, price, stock, link, site: config.name });
      });
      return results;
    }, siteConfig);

    return products;
  } catch (error) {
    console.error(`Error scraping ${url} on ${siteConfig.name}:`, error);
    return [];
  }
};

//
// Συνάρτηση που διαχειρίζεται το pagination και το scraping για κάθε site
//
const scrapeSite = async (browser, siteConfig) => {
  const page = await browser.newPage();
  const siteProducts = [];
  let pageIndex = 0;

  while (true) {

    if (siteConfig.maxPages && pageIndex >= siteConfig.maxPages) {
        break;
    }

    const url = siteConfig.pagination(siteConfig.baseUrl, pageIndex);
    const products = await scrapePageForSite(page, url, siteConfig);
    if (products.length === 0) {
      break;
    }
    siteProducts.push(...products);
    pageIndex += siteConfig.step;
    await delay(randomDelay());
  }

  await page.close();
  return siteProducts;
};

//
// Συνάρτηση που συντονίζει το scraping για όλα τα sites και γράφει το CSV
//
const scrapeAllSites = async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  let allProducts = [];

  for (const siteConfig of sites) {
    const products = await scrapeSite(browser, siteConfig);
    allProducts = allProducts.concat(products);
  }

  await browser.close();

  const headers = 'Site,Name,Price,Stock,Link\n';
  const rows = allProducts.map(product =>
    `"${product.site}","${product.name}","${product.price}","${product.stock}","${product.link}"\n`
  );
  const csvContent = headers + rows.join('\n');
  fs.writeFileSync('multi_site_products.csv', csvContent, 'utf-8');
  console.log('Data saved to multi_site_products.csv');
};

scrapeAllSites();
