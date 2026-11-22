/* INSECT ARENA 0.9A — round HUD and fair solo timer.
 * 90-second round, paused during solo pause. If the round expires without
 * a knockout, the next successful hit wins (SUDDEN DEATH).
 * In online games the host is authoritative and passes clock data here. */
(()=>{
'use strict';
const root=document.getElementById('match-hud');
const roundEl=document.getElementById('match-round');
const clockEl=document.getElementById('match-clock');
const scoreEl=document.getElementById('match-score');
const flashEl=document.getElementById('match-flash');
const SOLO_MS=150000; // Solo is 2:30; online remains 90 seconds.
const state={mode:'none',active:false,startAt:0,remaining:90000,sudden:false,
  pausedAt:0,pausedTotal:0,round:1,scores:{host:0,guest:0},flashTimeout:null};
const render=()=>{
 if(!state.active)return;
 const solo=state.mode==='solo';
 roundEl.innerHTML=(solo?'SOLO · RONDE 1':('RONDE '+state.round+' / 3'))+
    '<small>'+(solo?'OVERLEEF DE UITDAGER':'BEST-OF-THREE')+'</small>';
 clockEl.textContent=state.sudden?'SUDDEN DEATH':format(state.remaining);
 scoreEl.innerHTML=solo?'JUNGLE ARENA<small>150 SECONDEN</small>':
   '<span class="scorePips">HOST '+state.scores.host+' : '+state.scores.guest+' GAST</span><small>EERSTE TOT 2 WINT</small>';
 root.classList.toggle('urgent',!state.sudden&&state.remaining<=15000);
 root.classList.toggle('suddenDeath',state.sudden);
};
function format(ms){
 const seconds=Math.max(0,Math.ceil(ms/1000));
 return String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');
}
function flash(text){
 flashEl.textContent=text;flashEl.hidden=false;
 if(state.flashTimeout)clearTimeout(state.flashTimeout);
 state.flashTimeout=setTimeout(()=>{flashEl.hidden=true;state.flashTimeout=null},1600);
}
function stop(){
 state.active=false;state.mode='none';state.sudden=false;
 root.hidden=true;root.classList.remove('urgent','suddenDeath');
 flashEl.hidden=true;
 if(state.flashTimeout)clearTimeout(state.flashTimeout);
 state.flashTimeout=null;state.pausedAt=state.pausedTotal=0;
}
function clearEffects(a){
 if(!a)return;
 a.poison=0;a.burn=0;a.cloak=0;
 // No residual poison or fire can accidentally win on the first overtime frame.
}
function beginSolo(startAt){
 state.mode='solo';state.active=true;state.sudden=false;
 state.startAt=startAt;state.remaining=SOLO_MS;
 state.pausedAt=0;state.pausedTotal=0;state.round=1;
 state.scores={host:0,guest:0};root.hidden=false;flashEl.hidden=true;
 render();
}
function beginDuel(data){
 state.mode='duel';state.active=true;state.startAt=data.startAt||Date.now();
 state.sudden=false;state.remaining=90000;state.pausedTotal=0;state.pausedAt=0;
 state.round=data.round||1;state.scores={host:data.scores?.host||0,guest:data.scores?.guest||0};
 root.hidden=false;flashEl.hidden=true;render();
}
function updateDuel(data){
 if(!state.active||state.mode!=='duel')return;
 if(typeof data.remaining==='number')state.remaining=Math.max(0,Math.min(90000,data.remaining));
 if(data.round)state.round=data.round;
 if(data.scores)state.scores={host:data.scores.host||0,guest:data.scores.guest||0};
 if(data.sudden&&!state.sudden){state.sudden=true;flash('SUDDEN DEATH!');}
 render();
}
function beginOvertime(){
 if(state.sudden)return;
 state.sudden=true;
 clearEffects(player);clearEffects(enemy);
 flash('SUDDEN DEATH!');
 statusEl.textContent='SUDDEN DEATH! De volgende rake aanval beslist!';
 render();
}
function setPaused(value){
 if(!state.active||state.mode!=='solo')return;
 if(value){if(!state.pausedAt)state.pausedAt=Date.now();}
 else if(state.pausedAt){state.pausedTotal+=Date.now()-state.pausedAt;state.pausedAt=0;}
}
function tick(){
 if(!state.active||!playing)return;
 if(state.mode!=='solo')return; // host timers are computed by the PvP module
 if(window.iaCountdownActive)return;
 if(paused){
  if(!state.pausedAt)state.pausedAt=Date.now();
  return;
 }
 if(state.pausedAt){state.pausedTotal+=Date.now()-state.pausedAt;state.pausedAt=0;}
 if(state.sudden)return;
 state.remaining=Math.max(0,SOLO_MS-(Date.now()-state.startAt-state.pausedTotal));
 if(state.remaining<=0)beginOvertime();
 else render();
}
const previousAttack=attack;
attack=function(a,t,special=false){
 const targetHP=t?.hp,wasActive=playing;
 previousAttack(a,t,special);
 if(state.mode!=='solo'||!state.active||!state.sudden||!wasActive||!playing||
    !a||!t||!(t.hp<targetHP))return;
 t.hp=0;t.flash=16;t.hitAnim=16;playing=false;
 if(t===enemy){wins++;try{localStorage.setItem('iaWins',wins)}catch(_){}
  statusEl.textContent='SUDDEN DEATH GEWONNEN! · Overwinningen: '+wins;
 }else statusEl.textContent='SUDDEN DEATH VERLOREN!';
 state.active=false;
 window.iaOnWorldKO?.();
}
window.iaMatchHUD={stop,beginSolo,beginDuel,updateDuel,tick,flash,setPaused,
  getState:()=>({mode:state.mode,active:state.active,sudden:state.sudden,
    remaining:state.remaining,round:state.round,scores:{...state.scores}})};
const beforeScheduled=window.iaOnCountdownScheduled;
window.iaOnCountdownScheduled=startAt=>{
 beforeScheduled?.(startAt);
 if(!window.iaDuelRole)beginSolo(startAt);
};
})();
