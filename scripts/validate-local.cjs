const assert = require('node:assert/strict');
const base = 'http://localhost:3000';
const routes = ['/', '/stationery', '/notebooks', '/office-supplies', '/gift-shop', '/daily-needs', '/shop', '/shop?department=office-supplies', '/shop?department=notebooks&q=100', '/shop?department=gift-items&q=marriage', '/owner-login'];
(async () => {
  const assets = new Set();
  for (const route of routes) {
    const response = await fetch(base + route);
    assert.equal(response.status, 200, route);
    const html = await response.text();
    assert(!html.includes('Internal Server Error'), route);
    for (const match of html.matchAll(/(?:src|href)="(\/(?:images|banners|product-images|_next\/static)[^"?]*)/g)) assets.add(match[1]);
    if (route === '/') for (const text of ['4.9 Rated by Customers', 'weekly-opening-hours', 'Share Location', 'Get Directions', 'school-slideshow']) assert(html.includes(text), text);
  }
  for (const asset of assets) assert.equal((await fetch(base + asset, { method: 'HEAD' })).status, 200, asset);
  const protectedApi = await fetch(base + '/api/admin/data');
  assert.equal(protectedApi.status, 401, 'Admin data must require authentication');
  const admin = await fetch(base + '/admin', { redirect: 'manual' });
  assert([302, 303, 307, 308].includes(admin.status), 'Admin must redirect without a login');
  assert(admin.headers.get('location')?.includes('owner-login'), 'Admin login destination');
  const products = await fetch(base + '/api/products');
  assert.equal(products.status, 200, 'Live public products API');
  const data = await products.json();
  assert(Array.isArray(data.products), 'Public products response');
  for (const item of data.products) for (const field of ['customerName', 'mobileNumber', 'transactionId', 'serviceCharge']) assert(!(field in item), 'Private field in public product');
  console.log(JSON.stringify({ routes: routes.length, referencedAssets: assets.size, publicProducts: data.products.length, authentication: 'passed', result: 'passed' }, null, 2));
})().catch(error => { console.error(error.message); process.exitCode = 1; });
