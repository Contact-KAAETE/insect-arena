/* INSECT ARENA 1.5A — independent solo biome + predator mechanics.
   No external services. Eight PvP fighters and network protocol unchanged.
   Uses the established tactical-12 charge, balance-13 AI, adventure-14 cover
   and verified 1.4B iPhone input controls without replacing any of them. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const solo=()=>!window.iaDuelRole;
const selected=()=>window.iaWorldSelected?.()||'forest';
const backgrounds={};
for(const [id,src] of Object.entries(window.ia15WorldArt||{})){
 const image=new Image();image.decoding='async';
 image.onload=()=>window.iaPremiumRefresh?.();
 image.onerror=()=>console.warn('Arena background fallback:',id);
 image.src=src;backgrounds[id]=image;
}
const cover={
 dew:[{x:401,y:350,r:53,kind:'reeds'},{x:650,y:390,r:51,kind:'reeds'}],
 cave:[{x:360,y:365,r:57,kind:'stone'},{x:555,y:432,r:63,kind:'stone'},{x:564,y:250,r:37,kind:'stone'}],
 red:[{x:398,y:344,r:52,kind:'slag'},{x:629,y:417,r:58,kind:'slag'}]
};
const waterPools=[
 {x:320,y:418,rx:136,ry:43},{x:655,y:474,rx:176,ry:47},{x:498,y:303,rx:86,ry:29}
];
const hotVents=[
 {x:302,y:374,r:56},{x:550,y:419,r:61},{x:511,y:274,r:41}
];
let combatFX=[],blocked=0,lastFeedback=0,heatHits=0,slowHits=0;
const active=()=>solo()&&playing&&!paused&&!window.iaCountdownActive;
const tag=(message)=>{const t=$('tactical-toast');if(!t)return;
 t.textContent=message;t.hidden=false;t.classList.add('visible');
 clearTimeout(tag.timeout);
 tag.timeout=setTimeout(()=>{t.classList.remove('visible');t.hidden=true},1250);
};
const inside=(u,p)=>Math.hypot((u.x-p.x)/(p.rx||p.r),(u.y-p.y)/(p.ry||p.r))<1;
const artReady=id=>backgrounds[id]?.complete&&backgrounds[id]?.naturalWidth;
const art=(id)=>window.ia15WorldArt?.[id]||'';
function chooseWorld(id){
 if(!window.iaSetWorld?.(id))return;
 window.iaUI?.refreshWorldCards?.();
 window.iaUI?.open?.('select');
 window.iaUI?.refreshRoster?.();
 window.iaPremiumRefresh?.();
}
for(const id of Object.keys(window.ia15WorldNames||{})){
 $('world-play-'+id)?.addEventListener('click',()=>chooseWorld(id));
}
const note=$('ia15-world-note');
function refreshMessage(){
 if(!note)return;
 const world=selected();
 const descriptions={
  dew:'Dauwmoeras: ondiepe waterplassen remmen alle jagers. Gebruik riet als dekking.',
  cave:'Rotsholte: enorme stenen breken een aanvalslijn. Lok je tegenstander uit de dekking.',
  red:'Rode Breukgrond: de gloeiende scheuren komen voorspelbaar tot uitbarsting. Vermijd de oranje cirkels.',
  roots:'Worteldoolhof: wortels bieden dekking en vertragen bij contact.',
  forest:'Groene Bosbodem: bladeren bieden dekking tegen gewone aanvallen.',
  fungus:'Schimmelvallei: sporenwolken vertragen beide vechters.'
 };
 note.textContent=descriptions[world]||descriptions.forest;
}
document.querySelectorAll('[data-choose-world]').forEach(b=>b.addEventListener('click',refreshMessage));
$('menu-worlds')?.addEventListener('click',refreshMessage);
$('world-play')?.addEventListener('click',refreshMessage);
$('world-spores')?.addEventListener('click',refreshMessage);
refreshMessage();
window.ia15CoverNodes=id=>cover[id]||null;
window.ia15PaintObstacle=(node,ctx)=>{
 if(!node||!['reeds','stone','slag'].includes(node.kind))return false;
 ctx.save();ctx.translate(node.x,node.y);
 if(node.kind==='reeds'){
  ctx.fillStyle='#032c2c9e';ctx.beginPath();ctx.ellipse(3,26,node.r*.92,20,0,0,Math.PI*2);ctx.fill();
  for(let i=0;i<13;i++){
   const a=i*2.4,px=Math.sin(a)*node.r*.65,py=Math.cos(a)*node.r*.18;
   ctx.strokeStyle=i%3===0?'#85c9a4':'#2b7364';
   ctx.lineWidth=4+(i%4);ctx.lineCap='round';
   ctx.beginPath();ctx.moveTo(px,py+20);
   ctx.quadraticCurveTo(px+18*Math.sin(i),-25,px+16*Math.sin(i*2),-node.r*1.3-(i%4)*6);ctx.stroke();
   if(i%3===0){
    ctx.fillStyle='#ba9d64';ctx.beginPath();
    ctx.ellipse(px+16*Math.sin(i*2),-node.r*1.3-(i%4)*6,4,14,.16,0,Math.PI*2);ctx.fill();
   }
  }
 }else{
  const r=node.r;
  ctx.fillStyle='#0009';ctx.beginPath();ctx.ellipse(4,r*.56,r*1.13,r*.35,0,0,Math.PI*2);ctx.fill();
  const grad=ctx.createLinearGradient(-r,-r,r,r);
  if(node.kind==='slag'){
   grad.addColorStop(0,'#9a6047');grad.addColorStop(.45,'#513130');grad.addColorStop(1,'#1c1d23');
  }else{
   grad.addColorStop(0,'#a6a5a7');grad.addColorStop(.4,'#666678');grad.addColorStop(1,'#292b35');
  }
  ctx.fillStyle=grad;
  ctx.strokeStyle=node.kind==='slag'?'#ed915171':'#c1c3ce7a';ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(-r,-8);ctx.lineTo(-r*.66,-r*.78);
  ctx.lineTo(-r*.08,-r*1.06);ctx.lineTo(r*.71,-r*.62);
  ctx.lineTo(r,0);ctx.lineTo(r*.5,r*.57);ctx.lineTo(-r*.65,r*.48);
  ctx.closePath();ctx.fill();ctx.stroke();
  ctx.strokeStyle='#edd5be55';ctx.lineWidth=2.5;
  ctx.beginPath();ctx.moveTo(-r*.64,-r*.75);ctx.lineTo(-r*.12,-r*.3);
  ctx.lineTo(r*.7,-r*.6);ctx.moveTo(-r*.12,-r*.3);ctx.lineTo(-r*.03,r*.38);ctx.stroke();
  if(node.kind==='slag'){
   ctx.strokeStyle='#ff9d52';ctx.shadowColor='#ff792c';ctx.shadowBlur=9;ctx.lineWidth=3;
   ctx.beginPath();ctx.moveTo(-r*.15,-r*.1);ctx.lineTo(r*.24,r*.03);ctx.lineTo(r*.37,r*.42);ctx.stroke();
  }
 }
 ctx.restore();return true;
};
window.ia15PaintBiomeBackground=(ctx,canvas,ts)=>{
 const world=selected();
 if(!solo()||!(world in backgrounds))return;
 // Real photo-backed arena remains underneath the transparent environment art.
 if(artReady(world)){ctx.drawImage(backgrounds[world],0,0,canvas.width,canvas.height)}
 else{
  ctx.fillStyle=world==='dew'?'#144f5b55':world==='cave'?'#161728a0':'#6e251f77';
  ctx.fillRect(0,0,canvas.width,canvas.height);
 }
 if(world==='dew'){
  for(const p of waterPools){
   ctx.save();ctx.strokeStyle='#d0ffec99';ctx.lineWidth=2;
   ctx.beginPath();ctx.ellipse(p.x,p.y,p.rx*(.72+.028*Math.sin(ts*.001)),p.ry*.48,0,0,Math.PI*2);ctx.stroke();
   ctx.restore();
  }
 }else if(world==='red'){
  const seconds=((ts||performance.now())%4600)/4600;
  if(seconds>.57&&seconds<.9){
   const burst=seconds>.75;
   for(const vent of hotVents){
    ctx.save();
    ctx.strokeStyle=burst?'#ffe285':'#ff9b59';
    ctx.fillStyle=burst?'#ff5e363d':'#ff87301c';
    ctx.lineWidth=burst?7:3;ctx.setLineDash(burst?[]:[9,9]);
    ctx.shadowColor='#ff6428';ctx.shadowBlur=burst?20:9;
    ctx.beginPath();ctx.ellipse(vent.x,vent.y,vent.r,vent.r*.5,0,0,Math.PI*2);
    ctx.fill();ctx.stroke();ctx.restore();
   }
  }
 }
};
const originalAttack=attack;
attack=function(a,t,special=false){
 const modified=active()&&a&&t&&special&&a.id>=9&&a.id<=12;
 const before=t?.hp,previousCooldown=a?.special||0,oldRange=a?.range;
 // A water jet and a soil shockwave reach farther than a normal bite.
 if(modified&&(a.id===11||a.id===12))a.range=Math.max(a.range,a.id===11?196:169);
 try{originalAttack(a,t,special)}finally{if(modified)a.range=oldRange}
 if(!modified||!(t.hp<before)||!(a.special>previousCooldown+1))return;
 const kind=['web','venom','water','earth'][a.id-9];
 const effect={
  kind,x0:a.x,y0:a.y-26,x1:t.x,y1:t.y-25,
  life:38,total:38
 };
 combatFX.push(effect);
 if(combatFX.length>12)combatFX.shift();
 if(a.id===9){
  t.root=Math.max(t.root||0,100);t.slow=Math.max(t.slow||0,107);
 }else if(a.id===10){
  t.poison=Math.max(t.poison||0,200);t.root=Math.max(t.root||0,36);
 }else if(a.id===11){
  const dx=t.x-a.x,dy=t.y-a.y,len=Math.hypot(dx,dy)||1;
  t.x+=dx/len*55;t.y+=dy/len*25;t.slow=Math.max(t.slow||0,75);
 }else if(a.id===12){
  t.root=Math.max(t.root||0,58);t.slow=Math.max(t.slow||0,95);
  t.x+=Math.sign(t.x-a.x||1)*33;
 }
 const label=['VANGWEB!','GIFSTEEK!','WATERSTOOT!','AARDSCHOK!'][a.id-9];
 const color=['#d9eaff','#edbd75','#a5f4f5','#e6bd76'][a.id-9];
 floaters.push({x:t.x,y:t.y-105,value:label,life:42,color});
 burst(t.x,t.y,color,22,4.5);
 if(a===player)tag(label);
};
const oldConfine=confine;
confine=function(u){
 oldConfine(u);
 if(!u||!active())return;
 const w=selected();
 if(w==='dew'&&waterPools.some(p=>inside(u,p))){
  u.slow=Math.max(u.slow||0,7);u.ia15Water=true;
  slowHits++;
 }else if(w==='dew')u.ia15Water=false;
 if(w==='red'){
  const ms=performance.now(),phase=(ms%4600)/4600;
  if(phase>.75&&phase<.9&&hotVents.some(p=>inside(u,p))){
   if(!u.ia15LastHeat||ms-u.ia15LastHeat>430){
    u.ia15LastHeat=ms;
    // Environmental risk influences tactics, but cannot silently KO a player.
    const amount=Math.min(3,Math.max(0,u.hp-1));
    if(amount>0){u.hp-=amount;u.flash=8;u.hitAnim=12;
     heatHits++;burst(u.x,u.y,'#ff9b3f',9,2.6);
     floaters.push({x:u.x,y:u.y-68,value:'HITTE '+Math.ceil(amount),life:33,color:'#ffe198'});
    }
   }
  }
 }
};
const oldReset=reset;
reset=function(...args){
 combatFX=[];blocked=0;heatHits=0;slowHits=0;
 const answer=oldReset(...args);
 if(solo()&&window.ia15WorldNames?.[selected()]){
  statusEl.textContent=window.iaWorldName()+' · Gebruik je omgeving en speciale kracht! · Overwinningen: '+wins;
 }
 return answer;
};
const oldDamage=drawDamageNumbers;
drawDamageNumbers=function(){
 oldDamage();
 if(!combatFX.length||!solo())return;
 const smooth=!window.iaReducedEffects;
 for(let i=combatFX.length-1;i>=0;i--){
  const e=combatFX[i];const t=1-e.life/e.total;
  if(active())e.life--;
  if(e.life<=0){combatFX.splice(i,1);continue}
  const alpha=Math.max(0,1-t),x=e.x0+(e.x1-e.x0)*t,y=e.y0+(e.y1-e.y0)*t;
  g.save();g.globalAlpha=alpha;g.lineCap='round';
  if(e.kind==='web'){
   g.translate(e.x1,e.y1);g.strokeStyle='#cde7ff';g.shadowColor='#c7eaff';g.shadowBlur=11;
   g.lineWidth=2.5;
   for(let k=0;k<9;k++){const a=k*Math.PI*2/9;
    g.beginPath();g.moveTo(0,0);g.lineTo(Math.cos(a)*(44+t*35),Math.sin(a)*(32+t*26));g.stroke();}
   for(const r of [.4,.7,1]){
    g.beginPath();g.ellipse(0,0,(44+t*35)*r,(32+t*26)*r,0,0,Math.PI*2);g.stroke();
   }
  }else if(e.kind==='venom'){
   g.strokeStyle='#f1cb7b';g.shadowColor='#ffaa45';g.shadowBlur=17;g.lineWidth=7;
   g.beginPath();g.moveTo(e.x0,e.y0);g.quadraticCurveTo((e.x0+e.x1)/2,e.y1-80,x,y);g.stroke();
   if(smooth)for(let k=0;k<8;k++){
    g.fillStyle=k%2?'#e3d46b':'#f89e55';
    g.beginPath();g.arc(x+Math.sin(k*3)*16,y+Math.cos(k*2)*18,3+k%3,0,Math.PI*2);g.fill();
   }
  }else if(e.kind==='water'){
   const trail=g.createLinearGradient(e.x0,e.y0,e.x1,e.y1);
   trail.addColorStop(0,'#d5fff5');trail.addColorStop(1,'#64d7ff');
   g.strokeStyle=trail;g.shadowColor='#82dfff';g.shadowBlur=19;g.lineWidth=11;
   g.beginPath();g.moveTo(e.x0,e.y0);g.quadraticCurveTo((e.x0+e.x1)/2,e.y0-64,x,y);g.stroke();
   if(smooth)for(let k=0;k<14;k++){
    g.fillStyle=k%2?'#e2ffff':'#77e6ec';
    g.beginPath();g.arc(x+Math.sin(k*4)*32,y+Math.cos(k*3)*24,2+k%3,0,Math.PI*2);g.fill();
   }
  }else{
   g.strokeStyle='#e9b977';g.shadowColor='#fbb566';g.shadowBlur=21;g.lineWidth=8*(1-t)+2;
   g.beginPath();g.ellipse(e.x1,e.y1+32,20+t*126,8+t*38,0,0,Math.PI*2);g.stroke();
   if(smooth)for(let k=0;k<13;k++){
    const a=k*Math.PI*2/13;
    g.fillStyle=k%2?'#af8660':'#f3ca84';
    g.fillRect(e.x1+Math.cos(a)*(20+t*90),e.y1+Math.sin(a)*(12+t*36),4+k%3,5+k%4);
   }
  }
  g.restore();
 }
};
window.iaExpansion15={
 version:'1.5A',worldNames:window.ia15WorldNames,
 fighters:window.ia15NewFighters,
 stats:()=>({world:selected(),slowContacts:slowHits,heatContacts:heatHits,
  effects:combatFX.length,soloOnly:true}),
 coverFor:id=>cover[id]||[]
};
})();