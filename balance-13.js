/* INSECT ARENA 1.3A — slimme, eerlijke solo-roofdieren.
 * Adds no paid services. PvP logic, network protocol and best-of-three unchanged.
 * Tactical AI: approach, lateral movement, readable charged attacks, limited
 * sidesteps after repetitive hits, vulnerable recovery, one last-chance boost.
 */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const selector=$('ia-difficulty'),guide=$('ia-difficulty-guide'),warning=$('ai-danger-tag');
const solo=()=>!window.iaDuelRole;
const levels={
 training:{name:'Training',enemyLife:1.4,windup:62,recover:58,dodgeHits:5,dodgeTime:12,
  advance:1.75,strikeDelay:58,attackBoost:.89,playerDelay:34,bonus:0},
 tactical:{name:'Tactisch',enemyLife:2.45,windup:44,recover:40,dodgeHits:3,dodgeTime:17,
  advance:2.65,strikeDelay:40,attackBoost:1.02,playerDelay:46,bonus:0},
 alpha:{name:'Alfa-roofdier',enemyLife:2.77,windup:32,recover:31,dodgeHits:2,dodgeTime:19,
  advance:3.1,strikeDelay:32,attackBoost:1.13,playerDelay:49,bonus:0}
};
let mode='tactical',noticeTimeout=null,lastCue='';
try{const saved=localStorage.getItem('iaDifficulty');if(saved in levels)mode=saved}catch(_){}
function updateGuide(){
 if(selector)selector.value=mode;
 const summaries={
  training:'Rustige tegenstander. Veel tijd om aanvallen te ontwijken en specials te oefenen.',
  tactical:'Aanbevolen: slimme tegenstander, ontwijkbewegingen en zichtbare waarschuwingsaanvallen. Een duel hoort meer tijd te kosten.',
  alpha:'Voor ervaren jagers: agressiever, sneller, sterker en minder tijd om uit te wijken.'
 };
 if(guide)guide.textContent=summaries[mode];
}
updateGuide();
selector?.addEventListener('change',()=>{mode=selector.value in levels?selector.value:'tactical';updateGuide();try{localStorage.setItem('iaDifficulty',mode)}catch(_){}});
$('settings-done')?.addEventListener('click',()=>{try{localStorage.setItem('iaDifficulty',mode)}catch(_){}});
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const hypot=(x,y)=>Math.hypot(x,y)||1;
const normAngle=a=>Math.atan2(Math.sin(a),Math.cos(a));
function cue(text){
 const el=$('tactical-toast');if(!el)return;
 el.textContent=text;el.hidden=false;el.classList.add('visible');
 if(noticeTimeout)clearTimeout(noticeTimeout);
 noticeTimeout=setTimeout(()=>{el.classList.remove('visible');el.hidden=true},1050);
}
function floater(u,text,color='#ffe6a9'){
 if(!u)return;
 floaters.push({x:u.x,y:u.y-68,value:text,life:38,color});
}
function setPhase(ai,phase,timer=0){ai.phase=phase;ai.timer=timer;}
function setEnemySolo(){
 if(!solo()||!enemy||!player)return;
 const cfg=levels[mode];
 enemy.maxHp=Math.round(enemy.maxHp*cfg.enemyLife);
 enemy.hp=enemy.maxHp;
 enemy.damage=Math.round(enemy.damage*cfg.attackBoost*10)/10;
 enemy.ai={phase:'hunt',timer:0,cooldown:75,aim:0,side:Math.random()<.5?-1:1,
   combo:0,evades:0,sidesteps:0,stagger:0,attacks:0,specialAttack:false};
 player.iaLastChance=false;player.iaBoost=0;
 warning.hidden=true;
}
const originalReset=reset;
reset=function(...args){
 const result=originalReset(...args);
 setEnemySolo();
 return result;
};
const originalPlayer=controlPlayer;
controlPlayer=function(dt){
 if(!player||!solo())return originalPlayer(dt);
 const originalSpeed=player.speed;
 if(player.iaBoost>0){
  player.iaBoost=Math.max(0,player.iaBoost-dt);
  player.speed*=1.17;
 }
 try{originalPlayer(dt)}finally{player.speed=originalSpeed;}
 if(!player.iaLastChance&&player.hp>0&&player.hp<=player.maxHp*.32){
  player.iaLastChance=true;player.iaBoost=220;
  player.charge=Math.min(100,(player.charge||0)+32);
  cue('✦ LAATSTE KANS! +32 SPECIAL');
  floater(player,'COMEBACK!','#baff8e');
 }
};
const coreEnemy=controlEnemy;
function moveEnemy(u,mx,my,dt,speed){
 const d=hypot(mx,my);
 const mult=u.root>0?.08:u.slow>0?.46:u.sporeSlow>0?.62:1;
 u.x+=mx/d*speed*mult*dt;
 u.y+=my/d*speed*mult*dt;
 u.walk+=.09*dt;
}
function beginWindup(ai,u,dx,dy,cfg){
 const powerful=(u.charge||0)>=100&&u.special<=0;
 ai.specialAttack=powerful;
 ai.aim=Math.atan2(dy,dx);
 ai.windupTotal=cfg.windup+(powerful?12:0);
 setPhase(ai,'windup',ai.windupTotal);
 // Keep the hit streak across windups so repeated button-mashing triggers a side-step.
 ai.cooldown=cfg.strikeDelay;
}
function rewardDodge(){
 // Dodge success earns a small advantage, but never heals automatically.
 player.charge=Math.min(100,(player.charge||0)+13);
 floater(player,'UITGEWEKEN! +13','#bcfda3');
}
controlEnemy=function(dt){
 if(!solo()||!enemy?.ai||!player||!playing||paused||window.iaCountdownActive)
  return coreEnemy(dt);
 const ai=enemy.ai,cfg=levels[mode],u=enemy;
 dt=clamp(Number(dt)||1,.2,2.2);
 let dx=player.x-u.x,dy=player.y-u.y,d=hypot(dx,dy);
 u.face=dx>=0?1:-1;
 ai.cooldown=Math.max(0,ai.cooldown-dt);
 if(ai.phase==='evade'){
  // Bright sidestep, not a random invisible dodge; short and predictable.
  moveEnemy(u,-dy*ai.side/d+(-dx/d)*.2,dx*ai.side/d+(-dy/d)*.2,dt,u.speed*4.9);
  ai.timer-=dt;
  if(ai.timer<=0){setPhase(ai,'recover',23);ai.cooldown=Math.max(ai.cooldown,23);}
  return;
 }
 if(ai.phase==='stagger'){
  u.walk*=.9;ai.timer-=dt;
  if(ai.timer<=0)setPhase(ai,'recover',22);
  return;
 }
 if(ai.phase==='windup'){
  u.walk*=.94;ai.timer-=dt;
  // Aim locks at the start: moving out of the cone is an intentional counter.
  if(ai.timer<=0){
   const x=player.x-u.x,y=player.y-u.y,dist=hypot(x,y);
   const within=dist<=Math.max(u.range*(ai.specialAttack?1.4:1.14),ai.specialAttack&&u.id===4?166:0);
   const facing=Math.abs(normAngle(Math.atan2(y,x)-ai.aim))<=.65;
   if(within&&facing){
    const before=player.hp;
    attack(u,player,ai.specialAttack);
    if(player.hp<before)ai.attacks++;
   }else rewardDodge();
   setPhase(ai,'recover',cfg.recover);
   ai.specialAttack=false;
   ai.cooldown=Math.max(ai.cooldown,20);
  }
  return;
 }
 if(ai.phase==='recover'){
  ai.timer-=dt;
  // The opponent is temporarily open after an announced attack.
  u.walk*=.95;
  if(ai.timer<=0)setPhase(ai,'hunt');
  return;
 }
 // Chase to stop endlessly kiting; strafe near the player instead of
 // standing in place receiving every hit.
 const desired=Math.max(55,u.range*.80);
 if(d>desired*1.08){
  const sprint=d>250?1.35:1;
  moveEnemy(u,dx,dy,dt,u.speed*cfg.advance*sprint);
 }else if(d<desired*.54){
  moveEnemy(u,-dx,-dy,dt,u.speed*cfg.advance*.62);
 }else{
  moveEnemy(u,-dy*ai.side,dx*ai.side,dt,u.speed*cfg.advance*.44);
 }
 d=Math.hypot(player.x-u.x,player.y-u.y);
 if(ai.cooldown<=0&&d<Math.max(u.range*.92,60)&&u.cool<=0){
  beginWindup(ai,u,player.x-u.x,player.y-u.y,cfg);
 }
};
const originalAttack=attack;
attack=function(a,t,special=false){
 if(!solo()||!a||!t||!enemy?.ai)return originalAttack(a,t,special);
 const ai=enemy.ai,cfg=levels[mode];
 if(a===player&&t===enemy&&playing&&!paused){
  // A sidestep visibly dodges a single attack, never drains the special meter.
  if(ai.phase==='evade'&&ai.timer>0){
   if(a.cool<=0){
    a.cool=Math.max(a.cool,Math.min(22,cfg.playerDelay));
    a.attackAnim=16;a.attackMax=16;
    floater(enemy,'MIS!','#b1ebff');
   }
   return;
  }
  const hpBefore=t.hp;
  originalAttack(a,t,special);
  const dealt=hpBefore-t.hp;
  if(dealt>0){
   if(!special)a.cool=Math.max(a.cool,cfg.playerDelay);
   if(ai.phase==='windup'&&special){
    // Spending a valuable special during a tell interrupts the enemy.
    setPhase(ai,'stagger',38);
    ai.specialAttack=false;ai.cooldown=Math.max(ai.cooldown,42);
    floater(enemy,'ONDERBROKEN!','#ffefb2');
    cue('PERFECTE COUNTER!');
   }else if(ai.phase!=='stagger'&&ai.phase!=='evade'){
    ai.combo++;
    if(ai.combo>=cfg.dodgeHits&&ai.phase!=='windup'){
     ai.combo=0;
     ai.side*=-1;
     setPhase(ai,'evade',cfg.dodgeTime);
     ai.evades++;
     floater(enemy,'ZIJSPRONG!','#b9efff');
    }
   }
  }
  return;
 }
 return originalAttack(a,t,special);
};
// Draw a readable cone on the floor before the strike. Important: this is
// a game telegraph, not a hidden reaction or arbitrary dodge percentage.
const originalArena=drawArena;
drawArena=function(ts){
 originalArena(ts);
 if(!solo()||!playing||paused||window.iaCountdownActive||!enemy?.ai)return;
 const ai=enemy.ai;
 if(ai.phase==='windup'&&ai.windupTotal>0){
  const progress=1-clamp(ai.timer/ai.windupTotal,0,1),alpha=.13+progress*.29;
  const len=Math.max(enemy.range*1.25,125);
  g.save();g.translate(enemy.x,enemy.y);g.rotate(ai.aim);
  g.fillStyle='rgba(255,78,37,'+alpha.toFixed(3)+')';
  g.strokeStyle='rgba(255,195,111,'+(.45+progress*.5).toFixed(3)+')';
  g.lineWidth=3+progress*2;
  g.beginPath();g.moveTo(0,0);g.arc(0,0,len,-.65,.65);g.closePath();g.fill();g.stroke();
  g.strokeStyle='rgba(255,233,152,.83)';g.lineWidth=4;
  g.beginPath();g.arc(0,0,len+7,-.65,-.65+progress*1.3);g.stroke();
  g.restore();
 }
};
const originalDraw=drawInsect;
drawInsect=function(u){
 originalDraw(u);
 if(!solo()||!u?.ai||!playing)return;
 const ai=u.ai;
 if(ai.phase!=='evade'&&ai.phase!=='windup')return;
 g.save();
 g.strokeStyle=ai.phase==='evade'?'rgba(124,232,255,.72)':'rgba(255,144,56,.64)';
 g.shadowColor=ai.phase==='evade'?'#a6eaff':'#ffad51';g.shadowBlur=12;
 g.lineWidth=4;g.beginPath();g.ellipse(u.x,u.y+24,67,20,0,0,Math.PI*2);g.stroke();
 g.restore();
};
const coreHUD=drawHUD;
drawHUD=function(){
 coreHUD();
 const ai=enemy?.ai;
 if(!solo()||!playing||paused||window.iaCountdownActive||!ai){warning.hidden=true;return;}
 if(ai.phase==='windup'){
  warning.textContent=ai.specialAttack?'⚠ SPECIALE AANVAL!':'⚠ ONTWIJK DE AANVAL!';
  warning.hidden=false;
 }else if(ai.phase==='recover'){
  warning.textContent='✦ NU TERUGSLAAN!';
  warning.hidden=false;
 }else warning.hidden=true;
};
window.iaSoloBalance={version:'1.3A',getMode:()=>mode,
 getAI:()=>enemy?.ai||null,
 config:()=>({...levels[mode]}),
 getSummary:()=>({difficulty:mode,enemyHP:enemy?.maxHp,playerHP:player?.maxHp,
   aiState:enemy?.ai?.phase,enemyAttacks:enemy?.ai?.attacks??0,evades:enemy?.ai?.evades??0})};
})();
