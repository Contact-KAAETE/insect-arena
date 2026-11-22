/* INSECT ARENA 1.7A — visual-only immersive canvas camera.
 * Keeps every physics coordinate, world timer, fighter position and tap handler
 * unchanged. Canvas uses object-fit:cover to fill landscape Safari/PWA without
 * nonuniform stretching. Track visible floor before cropping.
 */
(()=>{
'use strict';
const root=document.documentElement;
const arena=document.getElementById('arena-view');
const stage=arena?.querySelector('.canvasBox');
const canvas=document.getElementById('arena');
if(!arena||!stage||!canvas)return;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
let camera={scale:1,cropX:0,cropY:0,yPercent:50,stageW:0,stageH:0,active:false};
let frames=0,rendering=false;
function size(){
 const box=stage.getBoundingClientRect();
 const w=box.width,h=box.height;
 const active=window.matchMedia?.('(orientation: landscape) and (min-width:580px)').matches
   ??(w>h&&window.innerWidth>=580);
 if(!active||w<1||h<1){
  camera={...camera,active:false,stageW:w,stageH:h};
  return;
 }
 const logicalW=canvas.width||900,logicalH=canvas.height||560;
 const scale=Math.max(w/logicalW,h/logicalH);
 const drawnW=logicalW*scale,drawnH=logicalH*scale;
 const croppedHeight=Math.max(0,drawnH-h);
 // Keep the ground where animals can move (Y=165..482) visible at every
 // iPhone landscape aspect ratio, including ultrawide phones.
 const visibleWorldHeight=h/scale;
 const overlap=Math.max(0,logicalH-visibleWorldHeight);
 const playableCenter=323;
 const preferredTop=clamp(playableCenter-visibleWorldHeight/2,0,overlap);
 const yPercent=overlap>0?clamp(preferredTop/overlap*100,0,100):50;
 const cropY=croppedHeight*yPercent/100;
 const cropX=Math.max(0,(drawnW-w)/2);
 camera={scale,cropX,cropY,yPercent,stageW:w,stageH:h,active:true};
 root.style.setProperty('--ia17-camera-y',yPercent.toFixed(2)+'%');
}
const glows=[0,1].map(i=>{
 const el=document.createElement('div');
 el.className='ia17-hitglow';el.setAttribute('aria-hidden','true');
 el.dataset.actor=i?'enemy':'player';stage.appendChild(el);return el;
});
const atmosphere=document.createElement('div');
atmosphere.className='ia17-atmosphere';
atmosphere.setAttribute('aria-hidden','true');
atmosphere.dataset.world='forest';stage.appendChild(atmosphere);
function syncBiome(){
 const w=window.iaWorldSelected?.()||'forest';
 if(atmosphere.dataset.world!==w)atmosphere.dataset.world=w;
 atmosphere.style.opacity=window.iaReducedEffects?'.20':'';
}
function positionGlow(el,u){
 if(!camera.active||!u||window.iaReducedEffects||arena.hidden||!playing||paused){
  if(el.style.opacity!=='0')el.style.opacity='0';
  return;
 }
 const special=Boolean(u.attackSpecial&&(u.attackAnim||0)>0);
 const attack=(u.attackAnim||0),hit=(u.hitAnim||0);
 const energy=special?Math.min(.9,attack/30)*.68:Math.min(.7,hit/18)*.38;
 if(energy<.055){el.style.opacity='0';return}
 const x=u.x*camera.scale-camera.cropX;
 const y=(u.y-28)*camera.scale-camera.cropY;
 if(x<0||x>camera.stageW||y<0||y>camera.stageH){el.style.opacity='0';return}
 el.classList.toggle('special',special);
 el.style.left=x.toFixed(1)+'px';
 el.style.top=y.toFixed(1)+'px';
 el.style.opacity=energy.toFixed(3);
 el.style.transform='translate(-50%,-50%) scale('+(special?1.15:0.75)+')';
}
function illuminate(){
 if(!camera.active||arena.hidden)return;
 if(!frames++%25){size();syncBiome()} // Re-measure and update ambience infrequently.
 positionGlow(glows[0],typeof player!=='undefined'?player:null);
 positionGlow(glows[1],typeof enemy!=='undefined'?enemy:null);
}
const oldDrawHUD=drawHUD;
drawHUD=function(...args){
 const out=oldDrawHUD(...args);
 illuminate();
 return out;
};
const observer=typeof ResizeObserver==='function'?
 new ResizeObserver(()=>size()):null;
observer?.observe(stage);
window.addEventListener('resize',size,{passive:true});
window.addEventListener('orientationchange',()=>setTimeout(size,100),{passive:true});
window.visualViewport?.addEventListener('resize',size,{passive:true});
const show=new MutationObserver(()=>size());
show.observe(arena,{attributes:true,attributeFilter:['hidden']});
size();syncBiome();
window.iaImmersive17={
 version:'1.7A',camera:()=>({...camera}),
 refresh:size,renderCount:()=>frames,
 // Debug geometry only: does not expose player data or store state.
 project:(x,y)=>({
  x:x*camera.scale-camera.cropX,
  y:y*camera.scale-camera.cropY
 })
};
})();