/* INSECT ARENA 1.2A — gratis tactische gevechten.
 * Separate non-destructive extension: all original damage/AI/multiplayer
 * continues running under the existing wrappers.
 *  - ~55% more life, ~20% less per-hit damage (longer battles)
 *  - charge a special through four successful strikes or taking damage
 *  - ant acid attack reaches farther and leaves a brief corrosive effect
 *  - charge synced by host state; guest does not calculate online damage.
 */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const specialButton=document.querySelector('#arena-view button[data-key="special"]');
const meter=$('special-charge-ring'),readout=$('special-charge-text'),toast=$('tactical-toast');
if(!specialButton||!meter||!readout||!toast){console.warn('INSECT ARENA tactical HUD ontbreekt');return;}
const effects=[];
let toastTimer=null,lastDraw=0,lastReady=false;
const hpMult=1.55,damageMult=.79;
const originalUnit=unit;
unit=function(id,x,y){
 const u=originalUnit(id,x,y);
 u.maxHp=Math.max(1,Math.round((u.maxHp||u.hp)*hpMult));
 u.hp=u.maxHp;
 u.damage=Math.max(5,Math.round(u.damage*damageMult));
 u.charge=0;u.acid=0;u.acidFrame=0;
 return u;
};
function notify(message){
 if(!message||!toast)return;
 toast.textContent=message;toast.hidden=false;toast.classList.add('visible');
 if(toastTimer)clearTimeout(toastTimer);
 toastTimer=setTimeout(()=>{toast.classList.remove('visible');toast.hidden=true;toastTimer=null},1050);
}
function addCharge(u,amount){
 if(!u||!Number.isFinite(amount)||amount<=0)return;
 const before=u.charge||0;
 u.charge=Math.min(100,before+amount);
 if(u===player&&before<100&&u.charge>=100&&u.special<=0)notify('✦ SPECIAL KLAAR!');
}
function spendSpecial(u){
 u.charge=0;
 if(u===player)notify(['ZUURSTRAAL!','SIKKELSLAG!','PANTSERCHARGE!','GIFSTEEK!','VUURSTRAAL!','CAMOUFLAGE!','GIFSTEKEL!','KLEMGREEP!'][u.id]||'SPECIAL!');
}
const oldAttack=attack;
attack=function(a,t,special=false){
 if(!a||!t||!playing||paused||window.iaCountdownActive)return;
 // Online guest only sends intent; the host validates the charge and hit.
 if(window.iaDuelRole==='guest'){oldAttack(a,t,special);return;}
 if(special&&(a.charge||0)<100){
   if(a===player&&a.cool<=0)notify('LAAD JE SPECIAL OP!');
   return;
 }
 const beforeHp=t.hp,beforeSpecial=a.special||0,baseRange=a.range;
 // Ants can shoot formic-acid droplets at distance (versus ordinary melee).
 if(special&&a.id===0)a.range=Math.max(a.range,205);
 try{oldAttack(a,t,special);}finally{a.range=baseRange;}
 const dealt=Math.max(0,beforeHp-t.hp);
 const activated=special&&(a.special||0)>beforeSpecial+1;
 if(activated){
   spendSpecial(a);
   if(a.id===0&&dealt>0){
     t.acid=Math.max(t.acid||0,160);
     t.acidFrame=0;
     effects.push({type:'acid',x1:a.x,y1:a.y-13,x2:t.x,y2:t.y-22,
       life:36,maxLife:36,dir:a.face||1});
     burst(t.x,t.y,'#abf75c',22,4);
     floaters.push({x:t.x,y:t.y-90,value:'ZUUR!',life:40,color:'#c5ff76'});
   }else if(dealt>0){
     const colors=['#aaf77e','#c3e6ff','#e5cf8e','#cc84e8','#ffa63b','#ffb7ee','#e75d94','#b8ecfa'];
     effects.push({type:'blast',x1:a.x,y1:a.y-12,x2:t.x,y2:t.y-18,
       color:colors[a.id]||'#f4d17e',life:27,maxLife:27});
   }
   if(dealt>0)addCharge(t,20); // the wounded fighter can come back.
 }else if(!special&&dealt>0){
   addCharge(a,27); // four landed basic strikes fill the meter.
   addCharge(t,16); // being hit also restores comeback energy.
 }
};
const oldConfine=confine;
confine=function(u){
 oldConfine(u);
 if(!u||window.iaDuelRole==='guest'||!playing||paused||window.iaCountdownActive)return;
 if(u.acid>0){
   u.acid--;
   u.acidFrame=(u.acidFrame||0)+1;
   if(u.acidFrame%26===0&&u.hp>1){
     u.hp=Math.max(1,u.hp-2);u.flash=Math.max(3,u.flash||0);
     burst(u.x+Math.sin(u.acidFrame)*22,u.y-18,'#b7fa68',6,2.7);
   }
 }
};
// Draw green acid droplets and special particles over the two photo-fighters.
const oldDrawInsect=drawInsect;
drawInsect=function(u){
 oldDrawInsect(u);
 if(!u||!u.acid||window.iaReducedEffects)return;
 g.save();g.globalAlpha=.5;
 for(let i=0;i<6;i++){
   const phase=performance.now()*.0025+i*1.7;
   g.fillStyle=i%2?'#e5ff89':'#70ee71';
   g.beginPath();g.arc(u.x-46+i*18+Math.sin(phase)*6,
     u.y-43-Math.abs(Math.sin(phase))*27,2.8+(i%3),0,Math.PI*2);g.fill();
 }
 g.restore();
};
const oldDrawDamageNumbers=drawDamageNumbers;
drawDamageNumbers=function(){
 oldDrawDamageNumbers();
 if(!effects.length)return;
 for(let k=effects.length-1;k>=0;k--){
  const fx=effects[k];fx.life--;
  if(fx.life<=0){effects.splice(k,1);continue;}
  const p=1-fx.life/fx.maxLife;
  g.save();
  if(fx.type==='acid'){
   g.strokeStyle='rgba(186,255,96,'+(1-p)+')';
   g.shadowColor='#bcff59';g.shadowBlur=15;g.lineWidth=5+p*3;
   const cx=fx.x1+(fx.x2-fx.x1)*Math.min(1,p*1.35);
   const cy=fx.y1+(fx.y2-fx.y1)*Math.min(1,p*1.35)-Math.sin(p*Math.PI)*25;
   g.beginPath();g.moveTo(fx.x1,fx.y1);g.quadraticCurveTo((fx.x1+cx)/2,cy-24,cx,cy);g.stroke();
   for(let j=0;j<12;j++){
    const q=Math.min(1,Math.max(0,p*.98-j*.025));
    const x=fx.x1+(fx.x2-fx.x1)*q+Math.sin(j*3.4+p*15)*9;
    const y=fx.y1+(fx.y2-fx.y1)*q-Math.sin(q*Math.PI)*24+Math.cos(j*2)*7;
    g.fillStyle=j%2?'#b6ff72':'#f1ffb7';g.beginPath();g.arc(x,y,2+(j%3),0,Math.PI*2);g.fill();
   }
  }else{
   g.globalAlpha=1-p;g.strokeStyle=fx.color;g.shadowColor=fx.color;g.shadowBlur=20;
   g.lineWidth=5+p*8;g.beginPath();g.arc(fx.x2,fx.y2,14+p*68,0,Math.PI*2);g.stroke();
  }
  g.restore();
 }
};
function updateHUD(force=false){
 if(!player||!enemy||$('arena-view').hidden){
  specialButton.classList.remove('chargeReady');
  if(readout.textContent!=='0%')readout.textContent='0%';
  return;
 }
 const time=performance.now();if(!force&&time-lastDraw<90)return;lastDraw=time;
 const charge=Math.max(0,Math.min(100,Math.round(player.charge||0)));
 const cooldown=Math.max(0,Number(player.special)||0);
 const ready=charge>=100&&cooldown<=0;
 specialButton.classList.toggle('chargeReady',ready);
 meter.style.setProperty('--ia-charge-angle',(charge*3.6).toFixed(1)+'deg');
 readout.classList.toggle('cooling',cooldown>0);
 const label=ready?'KLAAR!':cooldown>0?Math.ceil(cooldown/60)+'s':charge+'%';
 if(readout.textContent!==label)readout.textContent=label;
 if(ready&&!lastReady)notify('✦ SPECIAL KLAAR!');
 lastReady=ready;
}
const oldDrawHUD=drawHUD;
drawHUD=function(){oldDrawHUD();updateHUD()};
const coreReset=reset;
reset=function(...args){
 effects.length=0;lastReady=false;
 toast.classList.remove('visible');toast.hidden=true;
 return coreReset(...args);
};
window.iaTactical={
 version:'1.2A',
 update:()=>updateHUD(true),
 charged:u=>Math.max(0,Math.min(100,u?.charge||0)),
 rules:{lifeMultiplier:hpMult,damageMultiplier:damageMult,
        chargePerHit:27,chargeOnDamage:16}
};
})();
