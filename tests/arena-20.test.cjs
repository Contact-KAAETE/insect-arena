// INSECT ARENA 2.0A — release consistency, readable HUD and legacy smoke suites.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const release=JSON.parse(read('version.json')).version;

// The older smoke suites define a global function and were never executed in CI.
function runLegacy(file,fn,...sources){
 const run=new Function('a','b',read(file)+'\nreturn '+fn+'(a,b);');
 return run(...sources.map(read));
}

test('one release number everywhere: version.json, PWA constant, worker, manifest',()=>{
 const html=read('index.html');
 assert.match(release,/^\d+\.\d+[A-Z]$/);
 assert.ok(read('pwa-update-18.js').includes("const CURRENT_VERSION='"+release+"'"));
 assert.ok(read('sw.js').includes("const SW_BUILD='"+release+"'"));
 assert.ok(html.includes('manifest.webmanifest?v='+release));
 assert.ok(html.includes('polish-20.css?v='+release));
 assert.ok(html.includes('polish-20.js?v='+release));
 assert.ok(html.indexOf('pwa-update-18.js?v=')<html.indexOf('polish-20.js?v='),
   'polish-20 reads the version exposed by pwa-update-18');
 const manifest=JSON.parse(read('manifest.webmanifest'));
 assert.equal(manifest.id,'/insect-arena/');
 assert.equal(manifest.start_url,'/insect-arena/');
});

test('menu label and duel invitations never carry a stale hard-coded version',()=>{
 assert.ok(!/footer\.textContent='\d+\.\d+[A-Z]/.test(read('adventure-14.js')),
   'adventure-14 must not overwrite the menu label with an old version');
 assert.match(read('adventure-14.js'),/window\.iaPwaUpdates\?\.version/);
 const duel=read('duel-08.js');
 assert.ok(!/\?v=\d+\.\d+[A-Z]#duel=/.test(duel),'invite link must not hard-code a release');
 assert.match(duel,/encodeURIComponent\(release\)\+'#duel='/);
 assert.match(read('polish-20.js'),/footer\.textContent=release\+/);
});

test('danger warning and tactical toast are placed below the health bars',()=>{
 const js=read('polish-20.js');
 assert.match(js,/premium-fighter-hud/);
 assert.match(js,/ai-danger-tag/);
 assert.match(js,/tactical-toast/);
 assert.match(js,/bar\.bottom/);
 assert.match(js,/MutationObserver/);
});

test('singular victory wording',()=>{
 const ui=read('ui-07.js');
 assert.match(ui,/wins===1\?' OVERWINNING':' OVERWINNINGEN'/);
 assert.match(ui,/wins===1\?' overwinning\.':' overwinningen\.'/);
});

test('legacy smoke: simulated two-phone best-of-three duel',()=>{
 const result=runLegacy('tests/pvp-09-smoke.js','testBestOfThree','duel-08.js');
 assert.ok(result,'duel simulation returned no result');
});

test('legacy smoke: tactical special meter and acid attack',()=>{
 const r=runLegacy('tests/tactical-12-smoke.js','testTactical','tactical-12.js');
 for(const key of ['longerBattles','chargedOnly','fourHitSpecial','comebackCharge','acidRange','corrosionFX'])
  assert.equal(r[key],true,key);
});

test('legacy smoke: solo AI balance over three difficulty modes',()=>{
 const r=runLegacy('tests/solo-balance-13-smoke.js','assertSoloBalance','balance-13.js','tactical-12.js');
 assert.deepEqual(r.modesValidated,['training','tactical','alpha']);
 assert.equal(r.idlePunished,true);
});

test('duel libraries are self-hosted, not loaded from a CDN',()=>{
 const html=read('index.html');
 assert.ok(!/<script[^>]+src=["']https?:/i.test(html),'no external scripts');
 for(const f of ['vendor/peerjs-1.5.5.min.js','vendor/qrcode-1.0.0.min.js','vendor/LICENSE-peerjs','vendor/LICENSE-qrcodejs'])
  assert.ok(fs.existsSync(path.join(root,f)),f+' missing');
 assert.ok(html.includes('vendor/peerjs-1.5.5.min.js?v='+release));
 assert.ok(html.indexOf('vendor/peerjs')<html.indexOf('duel-08.js'),'library loads before duel code');
 assert.match(read('vendor/peerjs-1.5.5.min.js'),/Peer/);
});

test('photorealistic velvet ant sprite is wired to fighter 6 and old sprite is kept',()=>{
 const sp=read('expansion-07.js');
 assert.ok(sp.includes("'velvet-ant-20.webp'"));
 assert.ok(fs.existsSync(path.join(root,'assets/fighters/velvet-ant.webp')),'rollback sprite kept');
 const buf=fs.readFileSync(path.join(root,'assets/fighters/velvet-ant-20.webp'));
 assert.equal(buf.slice(0,4).toString(),'RIFF');
 assert.equal(buf.slice(8,12).toString(),'WEBP');
 assert.ok(buf.length<200*1024,'sprite stays small');
 assert.ok(read('expansion-07.js').includes("name:'Fluweelmier'"));
});
