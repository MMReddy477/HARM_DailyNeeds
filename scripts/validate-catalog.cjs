const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const cache = new Map();
function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file);
  const module = { exports: {} };
  cache.set(file, module.exports);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS } }).outputText;
  vm.runInNewContext(code, { exports: module.exports, module, URL, process: { env: {} }, require: name => name.startsWith('@/') ? load(name.slice(2) + '.ts') : require(name) });
  return module.exports;
}
const catalog = load('lib/product-search.ts');
const { calculateQuote } = load('lib/rate-calculator.ts');
const { googleReviewTarget } = load('lib/google-reviews.ts');
assert.equal(googleReviewTarget().url, '/reviews#write-review');
assert.equal(googleReviewTarget().direct, false);
assert.equal(googleReviewTarget('https://g.page/r/CaeQwq8jEcDwEAI/review/').direct, false);
assert.equal(googleReviewTarget('https://www.google.com/').direct, false);
assert.equal(googleReviewTarget('https://example.com/review').direct, false);
assert.equal(googleReviewTarget('https://search.google.com/local/writereview?placeid=CONFIGURATION_TEST').direct, true);
const products = catalog.mergePublicProducts([]);
assert(products.length > 200, 'Catalog unexpectedly empty or truncated');
assert.equal(new Set(products.map(p => catalog.canonicalProductName(p.name))).size, products.length);
for (const [name, price] of [['Amul Curd 400g', 40], ['Water Bottle', 10], ['Long Notebook', 35]]) {
  const product = products.find(item => item.name === name);
  assert(product, 'Missing confirmed-price product: ' + name);
  assert.equal(product.price, price, name + ': incorrect price');
  assert.equal(catalog.priceLabel(product), `₹${price}`, name + ': price should not be marked estimated or starting from');
}
for (const product of products) {
  assert(product.name.trim(), 'Missing product name');
  if (product.price !== null) assert(Number.isFinite(product.price) && product.price >= 0, product.name + ': invalid price');
  if (product.image?.startsWith('/')) assert(fs.existsSync('public' + product.image), product.name + ': broken local photo');
}
for (const query of ['100', '172', '200', 'blue pen', 'black pen', 'marriage', 'housewarming', 'birthday', 'calculator']) assert(products.some(p => catalog.matchesProduct(p, query)), 'Missing search results: ' + query);
for (const id of ['school-supplies', 'notebooks', 'office-supplies', 'gift-items', 'daily-needs']) assert(products.filter(p => p.departmentIds.includes(id)).length > 10, id + ' is empty');
const saved = { key: 'test-admin-product', name: 'Couple Mug Set', department: 'Gift Items', id: 'gift-items', price: 420, unit: 'set', description: '', aliases: '', available: true };
const overridden = catalog.mergePublicProducts([saved]).find(p => p.key === saved.key);
assert.equal(overridden.price, 420);
assert.equal(overridden.estimatedPrice, false);
const total = calculateQuote([{ price: 10.15, quantity: 3 }, { price: 35, quantity: 2 }], 10);
assert.equal(total.subtotal, 100.45);
assert.equal(total.discountAmount, 10.05);
assert.equal(total.total, 90.40);
for (const line of [{ price: null, quantity: 1 }, { price: 10, quantity: 0 }, { price: 10, quantity: 1.5 }, { price: -1, quantity: 2 }, { price: NaN, quantity: 1 }]) assert.equal(calculateQuote([line]), null);
assert.equal(calculateQuote([{ price: 10, quantity: 1 }], 101), null);
assert.equal(calculateQuote([{ price: 0, quantity: 1 }]).total, 0);
const { counterRateGroups } = load('lib/counter-rates.ts');
const counter = counterRateGroups([{id:'saved-xerox',name:'B/W Xerox',price:3,unit:'page',category:'Print & Xerox',image:'',stock:0},{id:'saved-pen',name:'Blue Ball Pen',price:12,unit:'piece',category:'Stationery',image:'',stock:5}]);
assert.equal(counter.print[0].price,3);
assert.equal(counter.print[0].saved,true);
assert.equal(counter.stationery.find(p=>p.name==='Blue Ball Pen').price,12);
assert.equal(counter.stationery.find(p=>p.name==='Blue Ball Pen').saved,true);
assert.equal(calculateQuote([{price:counter.print[0].price,quantity:10}]).total,30);
assert.equal(calculateQuote([{price:counter.stationery.find(p=>p.name==='Blue Ball Pen').price,quantity:5}]).total,60);
assert.equal(counter.print.length,14);
assert.equal(counter.stationery.length,10);
for (const id of ['milk-dairy','cool-drinks']) assert(products.filter(p=>p.departmentIds.includes(id)).length>=4,id+' missing collection items');
for (const query of ['milk','curd','paneer','butter','soft drinks','fruit juices']) assert(products.some(p=>catalog.matchesProduct(p,query)),'Missing daily-needs search: '+query);
assert(!products.some(p=>p.name==='Dairy Milk'&&p.departmentIds.includes('milk-dairy')),'Chocolate must not be classified as fresh dairy');
const missing = products.filter(p => !p.image && !['print-xerox', 'money-transfer'].includes(p.id));
console.log(JSON.stringify({ products: products.length, catalogAndQuoteChecks: 'passed', physicalProductsWithoutDedicatedPhoto: missing.map(p => p.name) }, null, 2));

const {printServices,notebookNavigation}=load('lib/print-services.ts');
for(const service of printServices){const product=products.find(p=>p.name===service.name&&p.id==='print-xerox');assert(product,service.name);assert.equal(product.price,service.price);assert.equal(product.unit,service.unit);assert(product.image&&!product.image.endsWith('.svg'));}
for(const query of ['notebook','long book','classmate','milk','curd','paneer','xerox','printing',...notebookNavigation.map(item=>item.query)])assert(products.some(p=>catalog.matchesProduct(p,query)),'Missing search '+query);
assert(products.every(p=>!p.image?.endsWith('.svg')),'Illustration remains in public catalogue');
const overrideService=catalog.mergePublicProducts([{key:'owner-copy-price',name:'B/W Xerox',id:'print-xerox',department:'Print & Xerox',price:4,unit:'page',aliases:'',description:'Owner price'}]).find(p=>p.name==='Black & White Xerox');assert.equal(overrideService.price,4);
