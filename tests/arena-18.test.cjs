// INSECT ARENA PWA version 1.9A — zero-dependency offline/PWA update tests.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const source=path=>fs.readFileSync(require('node:path').join(root,path),'utf8');
const drain=async()=>{for(let i=0;i<14;i++)await Promise.resolve()};

function browser(options={}){
 const menu={hidden:!!options.inFight},
  status={textContent:''},
  manual={handler:null,addEventListener(name,fn){if(name==='click')this.handler=fn}};
 const listeners=new Map(),timers=[],obs=[],navigations=[],storage=new Map();
 const location={href:'https://example.test/insect-arena/?v=1.7A',hash:options.duel?'#duel=ia8-test':'',
  replace(url){navigations.push(url)}};
 const window={location,iaDuelRole:options.duel?'guest':null,
  addEventListener(k,v){listeners.set(k,v)},setInterval(fn,ms){timers.push({fn,ms})}};
 const doc={hidden:false,
  getElementById(id){return id==='menu-view'?menu:id==='ia-update-status'?status:id==='ia-check-updates'?manual:null},
  addEventListener(k,v){listeners.set(k,v)}};
 const reg={update:async()=>{},scope:'https://example.test/insect-arena/'};
 const navigator={onLine:true,serviceWorker:{
  register:async(path,opts)=>{assert.equal(path,'./sw.js');assert.equal(opts.scope,'./');return reg}
 }};
 const context={window,document:doc,navigator,location,sessionStorage:{
  getItem:key=>storage.get(key)||null,setItem:(key,v)=>storage.set(key,String(v))
 },fetch:async(url,opts)=>{
  assert.equal(opts.cache,'no-store');
  assert.ok(String(url).startsWith('https://example.test/insect-arena/version.json?check='));
  return {ok:true,json:async()=>({version:options.latest||'2.3A'})}
 },AbortController:class{constructor(){this.signal={};}abort(){}},
  MutationObserver:class{constructor(fn){obs.push(fn)}observe(){}},
  setTimeout:(fn,ms)=>{timers.push({fn,ms});return timers.length},
  clearTimeout:()=>{},
  Date,URL,Promise,console};
 vm.createContext(context);
 vm.runInContext(source('pwa-update-18.js'),context,{filename:'pwa-update-18.js'});
 async function fire(ms){
  const list=timers.splice(0,timers.length);
  const matches=list.filter(item=>item.ms===ms);
  timers.push(...list.filter(item=>item.ms!==ms));
  for(const i of matches)i.fn();
  await drain();
 }
 return {window,doc,menu,status,manual,location,listeners,timers,obs,navigations,storage,fire};
}
test('manifest URL stays permanently stable and old home-screen icons share its scope',()=>{
 const manifest=JSON.parse(source('manifest.webmanifest'));
 assert.equal(manifest.id,'/insect-arena/');
 assert.equal(manifest.start_url,'/insect-arena/');
 assert.equal(manifest.scope,'/insect-arena/');
 assert.equal(manifest.display,'standalone');
 const html=source('index.html');
 assert.ok(html.includes('pwa-update-18.js?v=2.3A'));
 assert.ok(html.includes('pwa-update-18.css?v=1.8A')); // CSS unchanged in release 1.9A
 assert.ok(html.includes('manifest.webmanifest?v=2.3A'));
 assert.ok(html.includes('id="ia-update-status"'));
 assert.ok(html.includes('id="ia-check-updates"'));
 assert.equal(JSON.parse(source('version.json')).version,'2.3A');
 assert.match(source('sw.js'),/request\.mode==='navigate'/);
 assert.match(source('sw.js'),/cache:'no-store'/);
 assert.ok(!source('pwa-update-18.js').includes('localStorage.setItem'));
 assert.ok(!source('pwa-update-18.js').includes('indexedDB.deleteDatabase'));
});
test('opening the pinned app checks version but does not reload when up-to-date',async()=>{
 const b=browser({latest:'2.3A'});
 await b.fire(1100);
 assert.equal(b.window.iaPwaUpdates.state().latest,'2.3A');
 assert.equal(b.navigations.length,0);
 assert.match(b.status.textContent,/Automatische updates actief/);
 assert.ok(b.window.iaPwaUpdates.state().worker);
});
test('newer release auto-updates once from menu, using same app scope',async()=>{
 const b=browser({latest:'2.9A'});
 await b.fire(1100);
 assert.equal(b.window.iaPwaUpdates.state().pending,'2.9A');
 await b.fire(950);
 assert.equal(b.navigations.length,1);
 const url=new URL(b.navigations[0]);
 assert.equal(url.pathname,'/insect-arena/');
 assert.equal(url.searchParams.get('v'),'2.9A');
 assert.ok(url.searchParams.has('refresh'));
 assert.equal(b.storage.get('iaPwaAutoAttempt-2.9A'),'1');
 assert.equal(b.window.iaPwaUpdates.state().reloading,true);
});
test('ongoing fight and PvP invitation never get interrupted by update checks',async()=>{
 for(const opts of [{inFight:true,latest:'2.9A'},{duel:true,latest:'2.9A'}]){
  const b=browser(opts);
  await b.fire(1100);
  await b.fire(950);
  assert.equal(b.navigations.length,0);
  assert.equal(b.window.iaPwaUpdates.state().pending,'2.9A');
  assert.equal(b.window.iaPwaUpdates.canApply(),false);
 }
});
test('after returning to menu, pending update applies automatically',async()=>{
 const b=browser({inFight:true,latest:'2.12A'});
 await b.fire(1100);await b.fire(950);
 assert.equal(b.navigations.length,0);
 b.menu.hidden=false;
 b.obs.forEach(fn=>fn());
 await b.fire(950);
 assert.equal(b.navigations.length,1);
 assert.equal(new URL(b.navigations[0]).searchParams.get('v'),'2.12A');
});
test('offline check leaves the active game intact without erasing progress',async()=>{
 const b=browser({latest:'2.9A'});
 b.doc.hidden=true;
 await b.fire(1100);
 assert.equal(b.navigations.length,0);
 assert.match(b.status.textContent,/Offline/);
 assert.equal(b.storage.size,0);
});
test('service worker only intercepts same-origin game scope and stores offline shell',async()=>{
 const handlers={};let offline=false;const put=new Map();
 const caches={
  async open(name){
   return {put:async (key,res)=>put.set(name+':'+(typeof key==='string'?key:key.url),res)};
  },
  async match(key){
   return put.get('insect-arena-owned-shell-2.3A:'+key)||
    put.get('insect-arena-owned-assets-2.3A:'+(typeof key==='string'?key:key.url));
  },
  async keys(){return ['unrelated-app-cache','insect-arena-owned-shell-1.7A','insect-arena-owned-shell-2.3A']},
  async delete(key){assert.equal(key,'insect-arena-owned-shell-1.7A');return true}
 };
 const self={registration:{scope:'https://example.test/insect-arena/'},
  location:{origin:'https://example.test'},addEventListener(k,v){handlers[k]=v},
  clients:{claim:async()=>{}},skipWaiting:async()=>{}};
 const fetch=async request=>{
  if(offline)throw new Error('offline');
  return new Response('<!doctype html><html><script src="pwa-update-18.js?v=2.3A"></script></html>',{
   status:200,headers:{'Content-Type':'text/html'}
  });
 };
 const context={self,caches,fetch,URL,Response,Promise,console};
 vm.createContext(context);
 vm.runInContext(source('sw.js'),context,{filename:'sw.js'});
 let completed;
 handlers.install({waitUntil(p){completed=p}});
 await completed;
 assert.ok(put.has('insect-arena-owned-shell-2.3A:https://example.test/insect-arena/'));
 let got=null;
 const request={method:'GET',mode:'navigate',url:'https://example.test/insect-arena/?v=1.7A'};
 handlers.fetch({request,respondWith(p){got=p}});
 assert.equal((await got).status,200);
 offline=true;got=null;
 handlers.fetch({request,respondWith(p){got=p}});
 const fallback=await got;
 assert.equal(fallback.status,200,'Pinned old-version icons must work offline');
 got=null;
 handlers.fetch({request:{method:'GET',mode:'navigate',url:'https://other.test/insect-arena/'},
  respondWith(p){got=p}});
 assert.equal(got,null,'Must not intercept unrelated websites');
 let activated;
 handlers.activate({waitUntil(p){activated=p}});
 await activated;
});
