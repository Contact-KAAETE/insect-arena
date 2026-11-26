// INSECT ARENA 1.9A — landscape scroll, roster usability and fauna regression.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

test('menu screens scroll in landscape while battle stays edge-to-edge',()=>{
 const css=read('polish-19.css'),ui=read('ui-07.js');
 for(const selector of ['#select-view:not([hidden])','#world-view:not([hidden])',
    '#settings-view:not([hidden])','#duel-view:not([hidden])'])
  assert.ok(css.includes(selector),'Scrollable view missing: '+selector);
 assert.match(css,/overflow-y:auto!important/);
 assert.match(css,/-webkit-overflow-scrolling:touch/);
 assert.match(css,/touch-action:pan-y/);
 assert.match(css,/#select-view \.roster\{/);
 assert.match(css,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)!important/);
 assert.match(css,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)!important/);
 assert.match(css,/position:sticky!important/);
 assert.match(css,/\.fighterCard\.isNew::after/);
 assert.match(css,/display:none!important;content:none!important/);
 assert.match(ui,/function syncPageScroll\(page\)/);
 assert.match(ui,/const allow=page!=='arena'/);
 assert.match(ui,/syncPageScroll\(page\)/);
 assert.match(ui,/document\.documentElement\.classList\.toggle\('ia19-menu-scroll',allow\)/);
 assert.match(ui,/document\.body\.classList\.toggle\('ia19-menu-scroll',allow\)/);
 assert.match(read('immersive-17.css'),/#arena-view:not\(\[hidden\]\)/);
 assert.ok(!css.includes('body{overflow:hidden!important}'),
   'Menu scroll must not be globally disabled');
});
test('five biologically richer animal sprites load without changing fighter IDs or skills',()=>{
 const pre8=read('adventure-14-pre.js'),preOthers=read('expansion-15-pre.js');
 assert.ok(pre8.includes('centipede-19.svg'));
 const upgraded=[
  'centipede-19.svg','kruisspin-19.svg','roofwants-19.svg',
  'libellenlarve-19.svg','veenmol-19.svg'
 ];
 for(const name of upgraded){
  const content=read('assets/fighters/'+name);
  assert.ok(content.startsWith('<svg'),'Not an SVG: '+name);
  assert.ok(content.trimEnd().endsWith('</svg>'),name);
  assert.ok(content.length>20000,'Sprite lacks fine detail: '+name);
  assert.ok(content.includes('<defs>')&&content.includes('</defs>'),name);
  assert.ok(content.includes('viewBox='),name);
 }
 for(const name of upgraded.slice(1))
  assert.ok(preOthers.includes(name),'Sprite not wired into game: '+name);
 const larva=read('assets/fighters/libellenlarve-19.svg');
 assert.match(larva,/Zes poten|zes gelede poten/i);
 assert.match(larva,/vangmasker/i);
 assert.ok(larva.includes('id="armorClip"'));
 assert.match(larva,/radialGradient id="eye"/);
 const old=read('assets/fighters/libellenlarve-15.svg');
 assert.notEqual(larva,old,'Upgraded sprite must differ');
 // The original eight are unchanged; 8 is tutorial reward, 9-12 solo additions.
 assert.match(preOthers,/indexes 9\.\.12 are available in SOLO/);
 assert.match(pre8,/const i=types\.length-1;/);
 assert.ok(read('duel-08.js').includes('d.hostFighter<8'));
});
test('new visuals leave the single-icon PWA versioning and saved data untouched',()=>{
 const html=read('index.html'),manifest=JSON.parse(read('manifest.webmanifest'));
 const version=JSON.parse(read('version.json'));
 assert.ok(/^\d+\.\d+[A-Z]$/.test(version.version));
 assert.equal(manifest.id,'/insect-arena/');
 assert.equal(manifest.start_url,'/insect-arena/');
 assert.ok(html.includes('polish-19.css?v=1.9A'));
 assert.ok(html.includes('ui-07.js?v=2.4A'));
 assert.ok(html.includes('adventure-14-pre.js?v=1.9A'));
 assert.ok(html.includes('expansion-15-pre.js?v=1.9A'));
 assert.ok(html.includes('pwa-update-18.js?v=2.4A'));
 // Release constants must agree with version.json (checked in detail by arena-20).
 assert.ok(read('pwa-update-18.js').includes("const CURRENT_VERSION='"+version.version+"'"));
 assert.ok(read('sw.js').includes("const SW_BUILD='"+version.version+"'"));
 assert.ok(read('FAUNA_19_ROADMAP.md').includes('13'));
 assert.ok(!read('ui-07.js').includes('localStorage.clear()'));
 assert.ok(!read('polish-19.css').includes('#arena-view .touchPanel{display:none'));
});
