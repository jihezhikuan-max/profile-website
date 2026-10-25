// Optional editing utility: no build or Node.js is needed to serve the website.
// Keep the crawlable/no-JavaScript Japanese HTML in sync with the JSON renderer.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/^\uFEFF/, '');
const data = JSON.parse(read('locales/ja.json'));
const source = read('script.js');
const marker = '// BROWSER_INITIALIZATION';
if (!source.includes(marker)) throw new Error('Renderer boundary is missing.');
const context = vm.createContext({window: {matchMedia: () => ({matches:false})}, data});
vm.runInContext(source.split(marker)[0], context);
const content = vm.runInContext('renderContent(data)', context);
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nav = ['about','projects','experience','contact'].map(id => `<a href="#${id}">${escape(data.nav[id])}${id==='contact'?' <span aria-hidden="true">↗</span>':''}</a>`).join('');
const html = read('index.html');
for (const name of ['CONTENT','NAV']) {
  if (!html.includes(`<!-- STATIC_${name}_START -->`) || !html.includes(`<!-- STATIC_${name}_END -->`)) throw new Error(`Missing static ${name} markers.`);
}
const updated = html
  .replace(/<!-- STATIC_CONTENT_START -->[\s\S]*?<!-- STATIC_CONTENT_END -->/, `<!-- STATIC_CONTENT_START -->\n${content}\n<!-- STATIC_CONTENT_END -->`)
  .replace(/<!-- STATIC_NAV_START -->[\s\S]*?<!-- STATIC_NAV_END -->/, `<!-- STATIC_NAV_START -->${nav}<!-- STATIC_NAV_END -->`)
  .replace(/<title>.*?<\/title>/, `<title>${escape(data.meta.title)}</title>`)
  .replace(/(<meta (?:name="description"|property="og:description") content=")[^"]*(">)/g, `$1${escape(data.meta.description)}$2`)
  .replace(/(<meta property="og:title" content=")[^"]*(">)/, `$1${escape(data.meta.title)}$2`);
if (process.argv.includes('--check')) {
  if (html !== updated) { console.error('Static HTML is stale. Run node scripts/sync-static.cjs'); process.exitCode=1; }
  else console.log('PASS: static Japanese HTML matches the JSON and renderer.');
} else {
  fs.writeFileSync(path.join(root,'index.html'), updated, 'utf8');
  console.log('Updated the static Japanese HTML, navigation and metadata.');
}
