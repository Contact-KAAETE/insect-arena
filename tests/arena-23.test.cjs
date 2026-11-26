// INSECT ARENA 2.3A — drie nieuwe geanimeerde vechters: registratie, assets, laadvolgorde en speciale aanvallen.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('index.html');

function registreer(){
 const types=[...Array(13)].map((_,i)=>({name:'t'+i,hp:100,speed:3,damage:10,range:80}));
 const spriteSources=[],spriteWidths=[],fighterSprites=[];
 const opts=[];
 const fighterSel={add(o){opts.push(o)}};
 class Img{set src(s){this._src=s}}
 class Opt{constructor(label,value){this.label=label;this.value=value}}
 const win={};
 new Function('types','spriteSources','spriteWidths','fighterSel','fighterSprites','window','Image','Option',read('fauna-23-pre.js'))
  (types,spriteSources,spriteWidths,fighterSel,fighterSprites,win,Img,Opt);
 return {types,spriteSources,spriteWidths,opts,win};
}

test('drie nieuwe vechters komen op index 13 t/m 15, na de bestaande 13',()=>{
 const r=registreer();
 assert.equal(r.types.length,16);
 assert.deepEqual(r.types.slice(13).map(t=>t.name),['Doornige bloemenmantis','Springstaart','Bosmijt']);
 assert.deepEqual(r.opts.map(o=>o.value),[13,14,15]);
 assert.equal(r.win.ia23Fauna.firstId,13);
 assert.equal(r.win.ia23Fauna.count,3);
 for(const t of r.types.slice(13)){
  assert.ok(t.hp>=80&&t.hp<=170,'hp in een speelbare marge');
  assert.ok(t.speed>=2.5&&t.speed<=5.2);
  assert.ok(t.damage>=10&&t.damage<=22);
  assert.ok(t.range>=60&&t.range<=130);
 }
 assert.equal(r.spriteSources.length,3);
});

test('alle beeldbestanden bestaan en zijn niet te zwaar voor een iPhone',()=>{
 const r=registreer();
 for(const s of r.spriteSources){
  const p=path.join(root,s);assert.ok(fs.existsSync(p),s);
  assert.ok(fs.statSync(p).size<80*1024,'portret blijft klein: '+s);
 }
 const sheets=read('fauna-23.js').match(/sheet:'([^']+)'/g).map(x=>x.slice(7,-1));
 assert.equal(sheets.length,3);
 for(const s of sheets){
  const p=path.join(root,'assets/fighters',s);assert.ok(fs.existsSync(p),s);
  assert.ok(fs.statSync(p).size<400*1024,'sheet blijft onder 400 KB: '+s);
 }
});

test('laadvolgorde: registratie vóór het rooster, animatie na de basislaag; nieuwe dieren zijn niet online',()=>{
 const i=n=>html.indexOf(n);
 assert.ok(i('fauna-23-pre.js')>i('expansion-15-pre.js')&&i('fauna-23-pre.js')<i('ui-07.js'),'pre-bestand vóór ui-07');
 assert.ok(i('fauna-23.js?')>i('expansion-15.js')&&i('fauna-23.js?')>i('tactical-12.js'),'animatielaag na de laag die drawInsect/attack uitbreidt');
 const duel=read('duel-08.js');
 assert.ok(duel.includes('fighter<8'),'het duelprotocol blijft op de eerste 8 beperkt');
 assert.ok(duel.includes("fighterSel.value)>7)fighterSel.value='0'"));
 assert.ok(read('ui-07.js').includes('alleen in solo'));
 for(const f of ['adventure-14.js','polish-20.js'])assert.ok(read(f).includes('16 VECHTERS'),f);
 assert.ok(html.includes('16 VECHTERS'));
});

test('de rooster-teksten dekken alle 16 dieren',()=>{
 const m=read('ui-07.js').match(/const lines=\[(.*?)\];/s)[1];
 const n=(m.match(/'(?:[^'\\]|\\.)*'/g)||[]).length;
 assert.equal(n,16);
});

// Een minimale simulatie van de speciale aanvallen en de frame-keuze
function laadLaag(){
 const log=[];
 const canvases=[];
 const doc={createElement(){const c={width:0,height:0,getContext:()=>({drawImage(){}})};canvases.push(c);return c}};
 const imgs=[];
 class Img{constructor(){imgs.push(this)}set src(s){this._src=s}get src(){return this._src}}
 const state={floaters:[],bursts:0,drawn:[],fighterSprites:[]};
 const ctx={window:{ia23Fauna:{firstId:13,count:3}},document:doc,Image:Img,performance:{now:()=>1000},console};
 const body=`
  let drawInsect=function(u){state.drawn.push([u.id,state.fighterSprites[u.id]])};
  let attack=function(a,t,special){ if(special){a.special=240; t.hp-=a.damage*2.2} };
  const floaters=state.floaters, burst=()=>{state.bursts++}, fighterSprites=state.fighterSprites;
  let player=null;
  ${read('fauna-23.js')}
  return {draw:(u)=>drawInsect(u),attack:(a,t,s)=>attack(a,t,s),setPlayer:p=>{player=p}};
 `;
 const f=new Function('state','window','document','Image','performance','console',body);
 const api=f(state,ctx.window,doc,Img,ctx.performance,console);
 return {api,state,imgs,canvases};
}

test('speciale aanvallen: effect en label per dier, gewone dieren blijven onaangetast',()=>{
 const {api,state}=laadLaag();
 const maak=(id,hp=100)=>({id,hp,damage:10,x:100,y:100,special:0,cool:0,walk:0,poison:0,slow:0,root:0});
 for(const [id,label,veld] of [[13,'BLOEDENDE SNEDE!','poison'],[14,'SPRINGSTOOT!','slow'],[15,'MIJTENPLAAG!','poison']]){
  const a=maak(id),t=maak(0);t.x=160;
  api.attack(a,t,true);
  assert.ok(t.hp<100,'schade');
  assert.ok(t[veld]>0,veld+' gezet');
  assert.ok(state.floaters.some(f=>f.value===label),label);
 }
 const springstaart=maak(14),doel=maak(0);doel.x=160;
 const x0=doel.x;api.attack(springstaart,doel,true);
 assert.ok(doel.x>x0,'springstoot duwt de tegenstander weg');
 const gewoon=maak(3),doel2=maak(0);
 const n=state.floaters.length;api.attack(gewoon,doel2,true);
 assert.equal(state.floaters.length,n,'oudere dieren krijgen geen extra effect');
 assert.equal(doel2.poison,0);
});

test('zonder geladen sheet valt het spel terug op het portret (geen fout)',()=>{
 const {api,state}=laadLaag();
 state.fighterSprites[13]='portret';
 api.draw({id:13,walk:0});
 assert.deepEqual(state.drawn.pop(),[13,'portret']);
 api.draw({id:2,walk:0});
 assert.equal(state.drawn.pop()[0],2);
});
