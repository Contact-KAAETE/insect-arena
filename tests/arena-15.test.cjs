// INSECT ARENA 1.5A — offline Node smoke/regression tests (zero dependencies).
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const fighters=[
 ['Kruisspin','kruisspin-15.svg'],
 ['Roofwants','roofwants-15.svg'],
 ['Libellenlarve','libellenlarve-15.svg'],
 ['Veenmol','veenmol-15.svg']
];
const worlds=['dew','cave','red'];
test('all 13 fighters and 6 worlds are wired to the app',()=>{
 const html=read('index.html');
 for(const p of ['expansion-15-pre.js','expansion-15.js','expansion-15.css']){
  assert.ok(fs.existsSync(path.join(root,p)),p);
  assert.ok(html.includes(p+'?v=1.5A'),p+' not connected');
 }
 for(const [name,p] of fighters){
  assert.ok(read('expansion-15-pre.js').includes(name));
  assert.ok(read('assets/fighters/'+p).includes('</svg>'));
 }
 for(const p of ['dauwmoeras-15.svg','rotsholte-15.svg','rode-breukgrond-15.svg'])
  assert.ok(read('assets/worlds/'+p).includes('</svg>'));
 for(const id of worlds){
  assert.ok(html.includes('data-world="'+id+'"'));
  assert.ok(html.includes('data-choose-world="'+id+'"'));
  assert.ok(html.includes('world-play-'+id));
 }
 const scripts=['expansion-15-pre.js','expansion-15.js','adventure-14.js',
  'ui-07.js','duel-08.js','premium-11.js','balance-13.js'];
 for(const p of scripts)assert.doesNotThrow(()=>new Function(read(p)),p);
 assert.equal(JSON.parse(read('manifest.webmanifest')).start_url,'/insect-arena/');
 assert.ok(html.indexOf('adventure-14-pre.js')<html.indexOf('expansion-15-pre.js'));
 assert.ok(html.indexOf('expansion-15-pre.js')<html.indexOf('ui-07.js'));
 assert.ok(html.indexOf('adventure-14.js')<html.indexOf('expansion-15.js'));
 assert.ok(read('balance-13.js').includes('window.ia15PaintBiomeBackground'),
  'Biomes must render under enemy warning cones');
 assert.ok(read('adventure-14.js').includes('window.ia15CoverNodes'),
  'New biome cover must participate in attack blocking');
 assert.ok(read('premium-11.js').includes('window.ia15WorldArt'),
  'New backgrounds must cover landscape side gutters');
});
test('existing unlocked centipede persists, new solo animals register at 9..12',()=>{
 const map=new Map();
 const storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,String(v)),
   removeItem:k=>map.delete(k)};
 const types=Array.from({length:9},(_,i)=>({name:'existing-'+i})),
   spriteSources=Array(9).fill('existing'),spriteWidths=Array(9).fill(200),fighterSprites=Array(9).fill(null);
 let previousWorld='roots';
 const win={iaWorldSelected:()=>previousWorld,iaWorldName:()=>previousWorld,
  iaSetWorld:id=>{previousWorld=id;return true}};
 const fighterSel={add(x){this.items.push(x)},items:[]};
 class Img{set src(s){this._src=s}}
 class Opt{constructor(label,value){this.label=label;this.value=value}}
 new Function('types','spriteSources','spriteWidths','fighterSel','fighterSprites',
 'window','localStorage','Image','Option',read('expansion-15-pre.js'))
 (types,spriteSources,spriteWidths,fighterSel,fighterSprites,win,storage,Img,Opt);
 assert.equal(types.length,13);
 assert.deepEqual(types.slice(9).map(x=>x.name),fighters.map(x=>x[0]));
 assert.deepEqual(fighterSel.items.map(x=>x.value),[9,10,11,12]);
 assert.equal(win.iaWorldSelected(),'roots');
 assert.equal(win.iaSetWorld('dew'),true);
 assert.equal(win.iaWorldSelected(),'dew');
 assert.equal(win.iaWorldName(),'Dauwmoeras');
 assert.equal(map.get('ia15World'),'dew');
 assert.equal(win.iaSetWorld('cave'),true);
 assert.equal(win.iaWorldName(),'Rotsholte');
 assert.equal(win.iaSetWorld('red'),true);
 assert.equal(win.iaWorldName(),'Rode Breukgrond');
 assert.equal(win.iaSetWorld('roots'),true);
 assert.equal(win.iaWorldSelected(),'roots');
 assert.equal(map.has('ia15World'),false);
});
function makeRuntime(){
 let biome='red',now=3550;
 const elements=new Map();
 function el(id){if(!elements.has(id))elements.set(id,{
  id,textContent:'',hidden:false,style:{},listeners:[],
  classList:{add(){},remove(){}},addEventListener(name,fn){this.listeners.push({name,fn})}
 });return elements.get(id)}
 const document={getElementById:el,querySelectorAll:()=>[]};
 const win={iaDuelRole:null,iaCountdownActive:false,
  iaWorldSelected:()=>biome,iaSetWorld:id=>(biome=id,true),
  iaWorldName:()=>biome,ia15WorldArt:{dew:'dew.svg',cave:'cave.svg',red:'red.svg'},
  ia15WorldNames:{dew:'Dauwmoeras',cave:'Rotsholte',red:'Rode Breukgrond'},
  ia15NewFighters:[{id:9},{id:10},{id:11},{id:12}],
  iaUI:{refreshWorldCards(){},open(){},refreshRoster(){}},iaPremiumRefresh(){}
 };
 class ImageStub{constructor(){this.complete=false;this.naturalWidth=0}
  set src(s){this._src=s;this.complete=true;this.naturalWidth=900;if(this.onload)this.onload()}}
 const realAttack=(a,t,special)=>{if(special&&a.charge<100)return;
  if(special){a.special=240;a.charge=0}
  t.hp-=special?25:8;
 };
 const particles=[],floaters=[];
 const grad={addColorStop(){}};
 const g=new Proxy({createLinearGradient:()=>grad,createRadialGradient:()=>grad},
  {get(o,k){return k in o?o[k]:()=>{}}});
 const source=read('expansion-15.js')+
  '\nreturn {attack:(...a)=>attack(...a),confine:(...a)=>confine(...a),reset:()=>reset(),damage:()=>drawDamageNumbers()};';
 const instantiate=new Function(
  'document','window','Image','attack','confine','reset','drawDamageNumbers',
  'playing','paused','player','enemy','statusEl','wins','floaters','burst','g','c','performance',source);
 const api=instantiate(document,win,ImageStub,realAttack,()=>{},()=>{},
 ()=>{},true,false,null,null,el('status'),0,floaters,
 (...args)=>particles.push(args),g,{width:900,height:560},{now:()=>now});
 return {api,win,el,floaters,particles,setBiome:v=>biome=v,setNow:v=>now=v};
}
test('four distinct special attacks have tactical effects',()=>{
 const r=makeRuntime();
 for(let id=9;id<=12;id++){
  const a={id,x:300,y:330,special:0,cool:0,range:100,charge:100,face:1},
    t={id:2,x:400,y:330,hp:120,maxHp:120,root:0,slow:0,poison:0};
  r.api.attack(a,t,true);
  assert.equal(t.hp,95,'Damage for '+id);
  assert.equal(a.charge,0,'Charge consumed '+id);
  assert.equal(a.special,240,'Cooldown '+id);
  if(id===9)assert.ok(t.root>=100,'Web did not root');
  if(id===10)assert.ok(t.poison>=200,'Venom did not poison');
  if(id===11)assert.ok(t.x>400,'Water jet did not push');
  if(id===12)assert.ok(t.slow>=95,'Ground shock did not slow');
 }
 assert.equal(r.win.iaExpansion15.stats().effects,4);
});
test('new worlds are solo-only, environment affects both animals fairly',()=>{
 const r=makeRuntime();
 const rock=r.win.iaExpansion15.coverFor('cave');
 assert.ok(rock.length>=2);
 assert.equal(r.win.ia15PaintObstacle(rock[0],new Proxy({createLinearGradient:()=>({addColorStop(){}})},{get(o,k){return k in o?o[k]:()=>{}}})),true);
 r.setBiome('dew');
 const slow={x:320,y:418,hp:100,slow:0};
 r.api.confine(slow);
 assert.ok(slow.slow>0,'Standing in water should slow the fighter');
 r.setBiome('red');r.setNow(3550);
 const hot={x:302,y:374,hp:100,flash:0};
 r.api.confine(hot);
 assert.equal(hot.hp,97,'Heat deals low, predictable damage');
 r.api.confine(hot);assert.equal(hot.hp,97,'Heat must not fire every frame');
 const minimum={x:302,y:374,hp:2};
 r.api.confine(minimum);assert.equal(minimum.hp,1,'Heat cannot silently knock out a fighter');
 r.win.iaDuelRole='host';
 const clean={x:320,y:418,hp:100,slow:0};
 r.setBiome('dew');r.api.confine(clean);
 assert.equal(clean.slow,0,'PvP movement unchanged');
});
test('old duel protocol still restricts both phones to 8 original fighters',()=>{
 const s=read('duel-08.js');
 assert.ok(s.includes('if(i>=8)return'));
 assert.ok(s.includes('d.hostFighter<8')&&s.includes('d.guestFighter<8'));
 assert.ok(s.includes('ia8-'));
});
