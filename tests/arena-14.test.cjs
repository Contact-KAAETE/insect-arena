// INSECT ARENA 1.4A — zero-dependency smoke tests, run: node --test tests/arena-14.test.cjs
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const base=path.join(__dirname,'..');
const get=f=>fs.readFileSync(path.join(base,f),'utf8');

test('1.4A boot references and JavaScript syntax',()=>{
 const html=get('index.html');
 for(const file of [
  'adventure-14-pre.js','adventure-14.js','adventure-14.css',
  'assets/fighters/centipede-14.svg'
 ])assert.ok(fs.existsSync(path.join(base,file)),'Missing '+file);
 assert.ok(html.includes('adventure-14-pre.js?v=1.9A'));
 assert.ok(html.includes('adventure-14.js?v=2.4A'));
 assert.ok(html.includes('adventure-14.css?v=1.4B'));
 assert.ok(html.includes('data-choose-world="roots"'));
 const order=html.indexOf('adventure-14-pre.js')<html.indexOf('ui-07.js')&&
   html.indexOf('balance-13.js')<html.indexOf('adventure-14.js');
 assert.equal(order,true,'Extension load order');
 for(const file of ['expansion-07.js','ui-07.js','duel-08.js',
  'match-09.js','tactical-12.js','balance-13.js',
  'adventure-14-pre.js','adventure-14.js'])assert.doesNotThrow(()=>new Function(get(file)),file);
 assert.equal(JSON.parse(get('manifest.webmanifest')).start_url,'/insect-arena/');
 assert.ok(get('assets/fighters/centipede-14.svg').endsWith('</svg>'));
});

test('ninth fighter and reward-gated third world',()=>{
 const cache=new Map();
 const storage={getItem:k=>cache.get(k)??null,setItem:(k,v)=>cache.set(k,String(v)),
  removeItem:k=>cache.delete(k)};
 let chosen='forest';
 const win={iaWorldSelected:()=>chosen,iaWorldName:()=>chosen,
  iaSetWorld:w=>{if(!['forest','fungus'].includes(w))return false;chosen=w;return true}};
 const types=Array.from({length:8},(_,i)=>({name:'fighter '+i}));
 const sprites=Array(8).fill('sprite'),widths=Array(8).fill(180),fighterImages=[];
 const opts=[];
 class ImageStub{set src(x){this._src=x}}
 class OptionStub{constructor(label,value){this.label=label;this.value=value}}
 const setup=new Function('types','spriteSources','spriteWidths','fighterSel',
  'fighterSprites','window','localStorage','Image','Option',get('adventure-14-pre.js'));
 setup(types,sprites,widths,{add:o=>opts.push(o)},fighterImages,win,storage,ImageStub,OptionStub);
 assert.equal(types.length,9);
 assert.equal(opts[0].value,8);
 assert.equal(win.iaSetWorld('roots'),false);
 cache.set('ia14TutorialComplete','yes');
 assert.equal(win.iaSetWorld('roots'),true);
 assert.equal(win.iaWorldSelected(),'roots');
 assert.equal(cache.get('ia14SelectedWorld'),'roots');
 assert.equal(win.iaSetWorld('fungus'),true);
 assert.equal(win.iaWorldSelected(),'fungus');
});

function fixture(){
 const values=new Map(),storage={getItem:k=>values.get(k)??null,
  setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)};
 const elements=new Map();
 function el(id){
  if(!elements.has(id))elements.set(id,{
   id,hidden:false,textContent:'',innerHTML:'',style:{},disabled:false,
   attrs:{},listeners:[],children:[],classList:{toggle(){},add(){},remove(){}},
   appendChild(child){this.children.push(child)},
   replaceChildren(...children){this.children=children},
   setAttribute(k,v){this.attrs[k]=v},
   addEventListener(type,fn,capture){this.listeners.push({type,fn,capture})},
   querySelector(sel){return sel==='.canvasBox'?el('stage'):null}
  });
  return elements.get(id);
 }
 const document={
  getElementById:el,
  createElement:tag=>el('generated-'+tag+'-'+Math.random()),
  querySelector:selector=>selector.includes('fighterCard')?el('centipede-card'):
   selector.includes('data-choose-world')?el('roots-choice'):
   selector==='.menuFooter span:last-child'?el('footer'):null
 };
 const ui={beginBattle(){el('battle-overlay').hidden=true;el('arena-view').hidden=false},
  open(page){el('arena-view').hidden=page!=='arena'},
  refreshRoster(){},refreshWorldCards(){}};
 let world='forest';
 const win={iaUI:ui,iaDuelRole:null,
  iaWorldSelected:()=>world,iaSetWorld:w=>{world=w;return true},
  iaMatchHUD:{stop(){},getState:()=>({remaining:150000})},
  iaStopCountdown(){},iaPremiumRefresh(){},iaTactical:{update(){}}};
 const unit=(id,x,y)=>({id,x,y,hp:195,maxHp:195,
  damage:10,range:205,charge:0,special:0,cool:0});
 const player=unit(0,210,330),enemy=unit(1,700,320);
 const fighterSel={value:'3'};
 const attack=(a,t,special)=>{
  if(special&&a.charge<100)return;
  if(special){a.special=240;a.charge=0}
  t.hp-=special?40:10;
 };
 const g=new Proxy({createLinearGradient:()=>({addColorStop(){}})},
  {get(o,k){return k in o?o[k]:()=>{}}});
 const noop=()=>{};
 const source='let reset=()=>{};let wins=0;\n'+get('adventure-14.js')+
  '\nreturn {state:()=>({player,enemy,playing,paused}),attack:(...xs)=>attack(...xs),tick:(...xs)=>drawArena(...xs)};';
 const runner=new Function(
  'document','window','localStorage','MutationObserver','fighterSel',
  'player','enemy','playing','paused','statusEl','unit','attack','controlEnemy',
  'confine','drawArena','drawInsect','g','c','floaters','burst','performance','types',source);
 const hooks=runner(document,win,storage,class{observe(){}},fighterSel,
  player,enemy,true,false,el('status'),unit,attack,noop,noop,noop,noop,
  g,{width:900,height:560},[],noop,{now:()=>1000},Array.from({length:9},()=>({})));
 const click=id=>{
  const listener=el(id).listeners.find(x=>x.type==='click'&&x.capture===true);
  assert.ok(listener,'Missing capture handler for '+id);
  listener.fn({preventDefault(){},stopImmediatePropagation(){}});
 };
 return {hooks,win,storage,el,click};
}

test('mandatory training progresses only through real actions and unlocks the reward',()=>{
 const {hooks,win,storage,el,click}=fixture();
 click('menu-play');
 assert.equal(win.iaAdventure14.battleInfo().trainingStep,0);
 hooks.state().player.x+=120;
 hooks.tick(1000);
 assert.equal(win.iaAdventure14.battleInfo().trainingStep,1);
 hooks.attack(hooks.state().player,hooks.state().enemy,false);
 assert.equal(win.iaAdventure14.battleInfo().trainingStep,1);
 hooks.attack(hooks.state().player,hooks.state().enemy,false);
 assert.equal(win.iaAdventure14.battleInfo().trainingStep,2);
 hooks.state().player.x+=105;hooks.state().player.y+=24;hooks.tick(2000);
 assert.equal(win.iaAdventure14.battleInfo().trainingStep,3);
 assert.equal(hooks.state().player.charge,100);
 hooks.attack(hooks.state().player,hooks.state().enemy,true);
 assert.equal(storage.getItem('ia14TutorialComplete'),'yes');
 assert.equal(win.iaAdventure14.isTutorialActive(),false);
 assert.equal(el('battle-overlay').hidden,false);
 assert.match(el('overlay-desc').textContent,/REUZENDUIZENDPOOT/);
});

test('PvP remains original eight fighters and its timer stays 90 seconds',()=>{
 const duel=get('duel-08.js'),timer=get('match-09.js');
 assert.match(duel,/if\(i>=8\)return/);
 assert.match(duel,/if\(\(\+fighterSel.value\)>7\)fighterSel.value='0'/);
 assert.match(timer,/const SOLO_MS=150000/);
 assert.match(timer,/state\.remaining=90000/);
});
