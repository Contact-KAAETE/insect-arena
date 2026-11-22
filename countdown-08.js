/* INSECT ARENA 0.8B — shared 3-2-1-VECHT countdown.
 * Solo: 3 seconds after start. Private duels: both phones count down to
 * the same host-specified clock target; host authoritative combat begins after GO.
 * Rendering stays alive; player, enemy and hazards cannot act during countdown. */
(()=>{
 'use strict';
 const root=document.getElementById('countdown-overlay');
 const numeral=document.getElementById('countdown-number');
 const label=document.getElementById('countdown-tag');
 const match=document.getElementById('countdown-match');
 const mode=document.getElementById('countdown-mode');
 let timer=null,hideTimer=null,lastToken=null;
 window.iaCountdownActive=false;
 function clearTimers(){
  if(timer!==null){clearInterval(timer);timer=null;}
  if(hideTimer!==null){clearTimeout(hideTimer);hideTimer=null;}
 }
 function stop(){
  clearTimers();
  window.iaCountdownActive=false;
  root.hidden=true;
  lastToken=null;
 }
 function start(target){
  clearTimers();
  const now=Date.now();
  const given=Number(target);
  const startAt=Number.isFinite(given)&&given>now-500&&given<now+10000?given:now+3200;
  window.iaCountdownActive=true;
  root.hidden=false;
  label.textContent='HET GEVECHT BEGINT';
  mode.textContent=window.iaDuelRole?'PRIVÉDUEL · 2 SPELERS':'JUNGLE ARENA · SOLO';
  match.textContent=(player?.name||'VECHTER').toUpperCase()+'   VS   '+(enemy?.name||'UITDAGER').toUpperCase();
  for(const key of ['left','right','up','down','hit','special'])keys[key]=false;
  // Keep the analog thumb position harmless until the actual fight begins.
  let finished=false;
  function tick(){
   if(finished)return;
   const remaining=startAt-Date.now();
   if(remaining<=0){
    finished=true;
    if(timer!==null){clearInterval(timer);timer=null;}
    window.iaCountdownActive=false;
    numeral.textContent='VECHT!';
    numeral.classList.add('go');
    label.textContent='DE STRIJD IS BEGONNEN';
    numeral.style.animation='none';
    void numeral.offsetWidth;
    numeral.style.animation='';
    hideTimer=setTimeout(()=>{root.hidden=true;hideTimer=null},650);
    return;
   }
   const next=String(Math.max(1,Math.min(3,Math.ceil(remaining/1000))));
   if(next!==lastToken){
    lastToken=next;
    numeral.classList.remove('go');
    numeral.textContent=next;
    numeral.style.animation='none';
    void numeral.offsetWidth;
    numeral.style.animation='';
   }
  }
  tick();
  timer=setInterval(tick,75);
 }
 window.iaStartCountdown=start;
 window.iaStopCountdown=stop;
 // One entrance for the existing solo "Start gevecht" button.
 // Network duel launches call start explicitly after both fighters exist.
 const originalReset=reset;
 reset=function(...args){
  originalReset(...args);
  if(!window.iaDuelRole)start();
 };
 document.addEventListener('visibilitychange',()=>{
  // Do not accidentally let a tab return mid-fight from a frozen intro.
  if(document.hidden&&window.iaCountdownActive){
   stop();
   paused=true;
  }
 });
})();
