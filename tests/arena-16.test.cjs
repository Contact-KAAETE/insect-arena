// INSECT ARENA 1.6A — Node built-ins only; no network, credits or packages.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const base=path.join(__dirname,'..');
const source=p=>fs.readFileSync(path.join(base,p),'utf8');
function runtime(){
 const state={world:'roots',now:4000};
 const calls={draw:0,basic:0,oldPaint:0,movePlayer:0,moveEnemy:0};
 const grad={addColorStop(){}};
 const ctx=new Proxy({createLinearGradient:()=>grad,createRadialGradient:()=>grad,
  drawImage:()=>calls.draw++},{get(o,k){return k in o?o[k]:()=>{}}});
 const scope={
  window:{
   iaWorldSelected:()=>state.world,iaDuelRole:null,iaCountdownActive:false,
   ia15CoverNodes:()=>null,ia15PaintObstacle:()=>{calls.oldPaint++;return false},
   iaReducedEffects:false
  },document:{createElement:t=>({
   width:0,height:0,getContext:()=>ctx
  })},
  c:{width:900,height:560},g:ctx,
  playing:true,paused:false,player:{x:210,y:330,hp:150,maxHp:150,
   speed:4,damage:16,charge:100,root:0,slow:0,face:1,walk:0,cool:0,special:0},
  enemy:{x:700,y:320,hp:150,maxHp:150,speed:3,damage:14,
   charge:100,root:0,slow:0,face:-1,walk:0,cool:0,special:0},
  attack(a,t,special=false){calls.basic++;t.hp=Math.max(0,t.hp-a.damage*(special?2:1));if(special){a.special=240;a.charge=0}},
  controlPlayer(){calls.movePlayer++;scope.player.x+=30},
  controlEnemy(){calls.moveEnemy++;scope.enemy.x-=25},
  confine(){},drawHUD(){},floaters:[],performance:{now:()=>state.now},
  Math,console
 };
 vm.createContext(scope);
 for(const file of ['terrain-16-data.js','terrain-16-art.js','terrain-16.js'])
  vm.runInContext(source(file),scope,{filename:file});
 return {scope,state,calls,ctx,api:scope.window.iaTerrain16};
}
test('all six biome prop sets are consistent and have safe spawns',()=>{
 const {api,scope,state}=runtime();
 const worlds=['forest','roots','fungus','dew','cave','red'];
 for(const world of worlds){
  state.world=world;
  const objects=api.objects(world);
  assert.ok(objects.length>=7,world);
  assert.equal(new Set(objects.map(x=>x.id)).size,objects.length,world+' duplicate IDs');
  assert.ok(objects.some(x=>x.solid),world+' requires physical cover');
  assert.ok(objects.some(x=>x.cover==='light'),world+' requires light cover');
  assert.equal(api.isSolid({x:210,y:330}),false,world+' player spawn blocked');
  assert.equal(api.isSolid({x:700,y:320}),false,world+' rival spawn blocked');
  for(const p of objects){
   assert.equal(typeof p.id,'string');
   assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));
   assert.ok(p.x>=200&&p.x<=760&&p.y>=200&&p.y<=490,
    world+': object is off playable floor '+p.id);
  }
 }
 assert.ok(api.objects('roots').some(o=>o.kind==='root'&&o.points.length>=4));
});
test('old cartoon root drawings replaced by per-world cached art',()=>{
 const {api,scope,calls,ctx,state}=runtime();
 for(const world of ['forest','roots','fungus','dew','cave','red']){
  state.world=world;
  const first=api.objects(world)[0];
  assert.equal(scope.window.ia15CoverNodes(world)[0],first);
  assert.doesNotThrow(()=>scope.window.ia15PaintObstacle(first,ctx),world);
  assert.equal(scope.window.ia15PaintObstacle(first,ctx),true);
 }
 assert.ok(calls.draw>=6,'World textures should be painted');
 assert.equal(calls.oldPaint,0,'Legacy cartoon obstacle painters should not be used');
});
test('roots and stones have actual collision based on their visible shapes',()=>{
 const {api,state,scope}=runtime();
 state.world='roots';
 const start={x:210,y:330};
 const node=api.objects('roots')[0];
 const onRoot={x:node.x+node.points[2][0],y:node.y+node.points[2][1]};
 assert.equal(api.isSolid(onRoot),true);
 const actor={...onRoot,hp:100,slow:0};
 assert.equal(api.resolve(start,actor),true);
 assert.equal(api.isSolid(actor),false);
 state.world='cave';
 const stone=api.objects('cave')[0],inside={x:stone.x,y:stone.y,hp:100};
 assert.equal(api.isSolid(inside),true);
 api.resolve(start,inside);
 assert.equal(api.isSolid(inside),false,'Stone must not swallow fighter');
 assert.equal(scope.player.x,210,'Collision helper must not mutate unrelated fighters');
});
test('hard roots block specials, but keep energy; light foliage softens attacks',()=>{
 const {api,state,scope,calls}=runtime();
 state.world='roots';
 const a={x:296,y:285,damage:20,hp:100,charge:100,cool:0,special:0,id:0},
  t={x:525,y:360,hp:200,maxHp:200};
 assert.equal(api.coverType(a,t),'hard','Winding roots should block across passage');
 const damageCalls=calls.basic;
 scope.attack(a,t,true);
 assert.equal(t.hp,200);
 assert.equal(a.charge,100,'Failed special retains charge');
 assert.equal(calls.basic,damageCalls,'Original engine must not receive blocked special');
 state.world='forest';
 const leavesA={x:310,y:394,damage:20,charge:0,cool:0,special:0,id:1},
  leavesT={x:425,y:394,hp:200,maxHp:200};
 assert.equal(api.coverType(leavesA,leavesT),'light','Leaf litter should weaken contact');
 scope.attack(leavesA,leavesT,false);
 assert.ok(leavesT.hp<200&&leavesT.hp>180,'Foliage must be damage reduction, not immunity');
 assert.equal(leavesA.damage,20,'Original damage value must be restored');
});
test('terrain slowdown, bot detours and online PvP isolation',()=>{
 const {api,state,scope,calls}=runtime();
 state.world='dew';
 const swamp={x:403,y:420,slow:0,hp:100};
 scope.confine(swamp);
 assert.ok(swamp.slow>=13,'Mud slows movement');
 state.world='cave';
 const stone=api.objects('cave')[0];
 scope.enemy.x=stone.x+65;scope.enemy.y=stone.y;
 scope.player.x=stone.x-130;scope.player.y=stone.y;
 scope.controlEnemy(1.4);
 assert.equal(api.isSolid(scope.enemy),false,'AI cannot remain inside rock');
 const playerBefore={x:scope.player.x,y:scope.player.y};
 scope.window.iaDuelRole='guest';
 state.world='roots';
 scope.controlPlayer(1);
 assert.equal(scope.player.x,playerBefore.x+30,'PvP movement must be untouched');
 const h0=scope.enemy.hp;
 scope.attack({x:300,y:280,damage:12,id:0,charge:100,cool:0,special:0},
   {x:530,y:360,hp:100},true);
 assert.ok(calls.basic>0,'PvP attack must delegate without applying new cover rules');
 assert.equal(scope.enemy.hp,h0);
});
test('tutorial and network fights stay outside new terrain simulation',()=>{
 const {scope,state,calls,api}=runtime();
 state.world='roots';
 const p=scope.player;
 const oldX=p.x;
 scope.window.iaAdventure14={isTutorialActive:()=>true};
 scope.controlPlayer(1);
 assert.equal(p.x,oldX+30,'Tutorial movement still uses original joystick controller');
 const obj=api.objects('roots')[0];
 const center={x:obj.x+obj.points[2][0],y:obj.y+obj.points[2][1]};
 const t={x:center.x+70,y:center.y+23,hp:100};
 const oldHits=calls.basic;
 scope.attack({...center,damage:18,charge:100,id:0,cool:0,special:0},t,true);
 assert.equal(calls.basic,oldHits+1,'Tutorial attack must pass to legacy engine');
 scope.window.iaAdventure14.isTutorialActive=()=>false;
 scope.window.iaDuelRole='guest';
 scope.player.x=oldX;
 scope.controlPlayer(1);
 assert.equal(scope.player.x,oldX+30,'PvP movement unchanged');
});

test('app loads new assets in correct order and stays PWA-compatible',()=>{
 const html=source('index.html');
 const scripts=['terrain-16-data.js?v=1.6A','terrain-16-art.js?v=1.6A','terrain-16.js?v=1.6A'];
 for(const s of scripts)assert.ok(html.includes(s),s);
 assert.ok(html.indexOf('terrain-16-data.js')<html.indexOf('terrain-16-art.js'));
 assert.ok(html.indexOf('terrain-16-art.js')<html.indexOf('terrain-16.js'));
 assert.ok(html.indexOf('expansion-15.js')<html.indexOf('terrain-16.js'));
 assert.ok(source('adventure-14.js').includes('window.iaTerrain16BlocksAttack'));
 assert.ok(html.includes('terrain-16.css?v=1.6A'));
 assert.equal(JSON.parse(source('manifest.webmanifest')).start_url,'/insect-arena/?v=1.6A');
 for(const f of ['terrain-16-data.js','terrain-16-art.js','terrain-16.js'])
  assert.doesNotThrow(()=>new Function(source(f)),f);
 assert.ok(source('duel-08.js').includes('d.hostFighter<8'),'Keep PvP eight fighters');
});
