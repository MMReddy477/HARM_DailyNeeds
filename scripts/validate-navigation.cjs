const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
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
const { schoolCategories, navigationSlug } = load('lib/school-navigation.ts');
const routes = schoolCategories.flatMap(group => ['/category/' + group.slug, ...group.items.map(name => '/products/' + navigationSlug(name))]);
assert.equal(schoolCategories.length, 7);
assert.equal(new Set(routes).size, routes.length, 'Duplicate navigation slug');
(async () => {
  for (const route of routes) {
    const response = await fetch('http://localhost:3000' + route);
    assert.equal(response.status, 200, route);
    const html = (await response.text()).replace(/<!--.*?-->/g, '');
    const heading = html.match(/class="catalog-results-heading"[\s\S]*?<span>(\d+) results?<\/span>/);
    assert(heading && Number(heading[1]) > 0, route + ': no product results');
    assert(html.includes('H.A.R.M DAILY NEEDS'), route + ': missing brand');
  }
  for (const route of ['/category/unknown-category', '/products/unknown-product']) assert.equal((await fetch('http://localhost:3000' + route)).status, 404, route);
  console.log(JSON.stringify({ categories: schoolCategories.length, navigationRoutes: routes.length, productResults: 'passed', invalidRoutes: '404', result: 'passed' }, null, 2));
})().catch(error => { console.error(error.message); process.exitCode = 1; });
