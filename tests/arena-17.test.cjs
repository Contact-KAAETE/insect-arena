// INSECT ARENA 1.7A — iPhone viewport and fullscreen visual regression tests.
// No packages, external browser or GitHub credentials required.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const base=path.join(__dirname,'..');
const get=p=>fs.readFileSync(path.join(base,p),'utf8');

function scene(width=874,height=402){
 const vars=new Map(),objects=[];
 const dims={width,height};
 const style={setProperty:(k,v)=>vars.set(k,v)};
 const root={style};
 const canvas={width:900,height:560};
 const stage={
  getBoundingClientRect:()=>({width:dims.width,height:dims.height,left:0,top:0}),
  appendChild:el=>objects.push(el)
 };
 const arena={hidden:false,querySelector:sel=>sel==='.canvasBox'?stage:null};
 const document={
  documentElement:root,
  getElementById:id=>id==='arena-view'?arena:id==='arena'?canvas:null,
  createElement:tag=>{
   const classes=new Set();
   return {tag,className:'',dataset:{},style:{},attrs:{},
    classList:{toggle(k,v){if(v)classes.add(k);else classes.delete(k)},contains:k=>classes.has(k)},
    setAttribute(k,v){this.attrs[k]=v}};
  }
 };
 const win={
  iaReducedEffects:false,
  matchMedia:()=>({matches:dims.width>=580&&dims.width>dims.height}),
  addEventListener(){},
  visualViewport:{addEventListener(){}}
 };
 const player={x:350,y:340,hitAnim:12,attackAnim:0,attackSpecial:false};
 const enemy={x:610,y:340,hitAnim:0,attackAnim:25,attackSpecial:true};
 const state={draws:0};
 class Resize{observe(){}}
 class Mutation{observe(){}}
 const scope={
  window:win,document,ResizeObserver:Resize,MutationObserver:Mutation,
  player,enemy,playing:true,paused:false,
  drawHUD:()=>{state.draws++;return 'drawn';},
  setTimeout:()=>{},
  console
 };
 vm.createContext(scope);
 vm.runInContext(get('immersive-17.js'),scope,{filename:'immersive-17.js'});
 return {scope,win,canvas,dims,objects,vars,state};
}

test('new full-bleed styling does not distort the 900x560 world',()=>{
 const css=get('immersive-17.css'),html=get('index.html');
 assert.match(css,/object-fit:cover!important/);
 assert.match(css,/object-position:50% var\(--ia17-camera-y/);
 assert.match(css,/height:var\(--ia-visible-height,100dvh\)!important/);
 assert.match(css,/border-radius:0!important/);
 assert.ok(html.includes('immersive-17.css?v=1.7A'));
 assert.ok(html.includes('immersive-17.js?v=1.7A'));
 assert.ok(html.indexOf('terrain-16.js?v=1.6A')<html.indexOf('immersive-17.js?v=1.7A'));
 assert.match(css,/#arena-view #pause\{grid-column:3\}/);
 assert.match(css,/#arena-view #battle-fullscreen\{grid-column:4\}/);
 assert.match(css,/#arena-view #ia14-guide/);
 assert.match(css,/#arena-view \.touchPanel/);
 assert.equal(JSON.parse(get('manifest.webmanifest')).start_url,'/insect-arena/?v=1.7A');
});

test('iPhone landscape camera displays full playable vertical floor',()=>{
 for(const [w,h] of [[874,402],[844,390],[932,430],[667,375],[1280,720],[1536,706]]){
  const {win}=scene(w,h),cam=win.iaImmersive17.camera();
  assert.ok(cam.active,w+'x'+h+' should use immersive mode');
  assert.ok(cam.scale>0&&Number.isFinite(cam.yPercent));
  assert.ok(cam.yPercent>=0&&cam.yPercent<=100);
  for(const y of [165,280,330,482]){
   const p=win.iaImmersive17.project(450,y);
   assert.ok(p.y>=-2&&p.y<h+2,w+'x'+h+' clipped floor at y='+y+' -> '+p.y);
  }
  for(const x of [85,450,815]){
   const p=win.iaImmersive17.project(x,325);
   assert.ok(p.x>=-5&&p.x<w+5,'horizontal fight out of frame '+w+' '+x);
  }
 }
});

test('impact lighting is decoration only and respects reduced motion and pause',()=>{
 const r=scene();
 assert.equal(r.objects.length,3,'Two impact lights and one subtle biome ambience layer');
 assert.equal(r.objects[2].className,'ia17-atmosphere');
 const cam=r.win.iaImmersive17.camera();
 const first=r.objects[0],second=r.objects[1];
 assert.equal(r.scope.drawHUD(),'drawn');
 assert.equal(r.state.draws,1,'Original drawHUD must always run');
 assert.ok(Number(first.style.opacity)>0,'Hit glow visible');
 assert.ok(Number(second.style.opacity)>0,'Special glow visible');
 assert.ok(second.classList.contains('special'),'Special uses differentiated bloom');
 assert.ok(Number(first.style.left.replace('px',''))>0);
 r.win.iaReducedEffects=true;
 r.scope.drawHUD();
 assert.equal(first.style.opacity,'0');
 assert.equal(second.style.opacity,'0');
 r.win.iaReducedEffects=false;
 r.scope.paused=true;
 r.scope.drawHUD();
 assert.equal(first.style.opacity,'0');
 assert.equal(second.style.opacity,'0');
 assert.equal(r.state.draws,3,'Game rendering was not blocked');
});

test('portrait keeps original rendering instead of cropping the playfield',()=>{
 const {win,dims}=scene(402,874);
 assert.equal(win.iaImmersive17.camera().active,false);
 dims.width=874;dims.height=402;
 win.iaImmersive17.refresh();
 assert.equal(win.iaImmersive17.camera().active,true);
});

test('CSS keeps full-screen controls, progress overlay and menu touchable',()=>{
 const css=get('immersive-17.css');
 assert.ok(css.includes('pointer-events:auto!important'));
 assert.match(css,/#arena-view #joystick/);
 assert.match(css,/#arena-view \.attackBtn/);
 assert.match(css,/#arena-view \.specialBtn/);
 assert.match(css,/#arena-view \.premiumFighterHUD/);
 assert.match(css,/#arena-view \.ia17-atmosphere\[data-world="red"\]/);
 assert.match(css,/#arena-view #ia14-guide/);
 assert.match(css,/#arena-view \.floatOverlay/);
 assert.match(css,/env\(safe-area-inset-left/);
 assert.match(css,/env\(safe-area-inset-right/);
 const script=get('immersive-17.js');
 assert.doesNotThrow(()=>new Function(script));
 assert.ok(!script.includes('controlPlayer=function'));
 assert.ok(!script.includes('attack=function'));
 assert.ok(!script.includes('controlEnemy=function'));
});
