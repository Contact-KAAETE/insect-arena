/* INSECT ARENA 1.1A — premium live-game visual adapter.
 * All existing movement, damage, wins, AI, multiplayer, timer and joystick
 * logic is unchanged. The old canvas HUD is replaced by native DOM HUD
 * to avoid clipped names and to improve iPhone landscape readability. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const arena=$('arena-view'),stage=arena.querySelector('.canvasBox'),menu=$('menu-view');
const pImg=$('premium-player-avatar'),eImg=$('premium-enemy-avatar');
const pName=$('premium-player-name'),eName=$('premium-enemy-name');
const pHp=$('premium-player-hp'),eHp=$('premium-enemy-hp');
const pLife=$('premium-player-label'),eLife=$('premium-enemy-label');
const overlay=$('battle-overlay');
const images=[...spriteSources];
let lastUpdate=0,prevPlayer=-1,prevEnemy=-1,wasVisible=false;
function background(){
 let world='forest';
 try{world=window.iaWorldSelected?.()||'forest'}catch(_){}
 const newArt=window.ia15WorldArt?.[world]||null;
 const url=newArt||(world==='fungus'?'assets/worlds/schimmelvallei.webp':(forestPhoto?.src||''));
 if(!url)return;
 const img='linear-gradient(90deg,rgba(4,17,8,.55),rgba(4,16,10,.03) 22%,rgba(3,15,10,.03) 77%,rgba(3,17,8,.58)),url("'+url+'")'+
   (newArt&&forestPhoto?.src?',url("'+forestPhoto.src+'")':'');
 if(stage.dataset.premiumWorld===world)return;
 stage.dataset.premiumWorld=world;
 stage.style.backgroundImage=img;
 stage.style.backgroundSize='cover';
 stage.style.backgroundPosition='center';
}
forestPhoto?.addEventListener('load',()=>{stage.dataset.premiumWorld='';background()});
function doUpdate(force=false){
 if(arena.hidden||!player||!enemy){
  $('premium-fighter-hud').hidden=true;
  wasVisible=false;return;
 }
 const now=performance.now();
 if(!force&&now-lastUpdate<100)return;
 lastUpdate=now;
 $('premium-fighter-hud').hidden=false;
 if(!wasVisible){background();wasVisible=true}
 const pi=player.id|0,ei=enemy.id|0;
 if(pi!==prevPlayer){
  prevPlayer=pi;pImg.src=images[pi]||'';pImg.alt=player.name+' portret';
 }
 if(ei!==prevEnemy){
  prevEnemy=ei;eImg.src=images[ei]||'';eImg.alt=enemy.name+' portret';
 }
 const pn='JIJ · '+player.name,en='VIJAND · '+enemy.name;
 if(pName.textContent!==pn)pName.textContent=pn;
 if(eName.textContent!==en)eName.textContent=en;
 const p=Math.max(0,Math.min(100,100*player.hp/Math.max(1,player.maxHp)));
 const e=Math.max(0,Math.min(100,100*enemy.hp/Math.max(1,enemy.maxHp)));
 const pPercent=Math.round(p)+'%',ePercent=Math.round(e)+'%';
 if(pHp.style.width!==pPercent)pHp.style.width=pPercent;
 if(eHp.style.width!==ePercent)eHp.style.width=ePercent;
 pLife.textContent=Math.ceil(Math.max(0,player.hp))+' / '+Math.ceil(player.maxHp||1);
 eLife.textContent=Math.ceil(Math.max(0,enemy.hp))+' / '+Math.ceil(enemy.maxHp||1);
 background();
 if(!overlay.hidden){
  const title=$('overlay-title')?.textContent||'';
  overlay.classList.toggle('premiumWin',/GEWONNEN|KAMPIOEN|OVERWINNING/i.test(title));
 }else overlay.classList.remove('premiumWin');
}
const coreDrawHUD=drawHUD;
drawHUD=function(){
 // drawHUD used to paint on the canvas; we display equivalent readable data
 // in native HTML overlay. No gameplay state is changed by this replacement.
 doUpdate();
};
// Keep overlays styled even when the fight has ended and the drawing loop
// continues with a frozen player state.
const observer=new MutationObserver(()=>doUpdate(true));
observer.observe(overlay,{attributes:true,attributeFilter:['hidden']});
const viewObs=new MutationObserver(()=>{if(!arena.hidden){wasVisible=false;doUpdate(true)}});
viewObs.observe(arena,{attributes:true,attributeFilter:['hidden']});
window.addEventListener('orientationchange',()=>doUpdate(true));
window.addEventListener('resize',()=>doUpdate(true));
// If needed, the caller can update immediately after selecting a different world.
window.iaPremiumRefresh=()=>{wasVisible=false;stage.dataset.premiumWorld='';doUpdate(true)};
setTimeout(doUpdate,120);
const rival=$('menu-hero-rival');
if(rival){rival.src=images[0]||'';rival.alt='Rode mier in de jungle';}
})();
