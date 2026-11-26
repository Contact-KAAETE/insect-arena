/* INSECT ARENA 2.4B — hands-free updates for the SAME pinned iPhone icon.
 * Checks upon opening, returning online/foreground, and every 15 minutes.
 * Never reloads during a fight, multiplayer invite, or any settings/edit flow.
 * No personal data, localStorage, IndexedDB, or saved game keys are modified.
 */
(()=>{
'use strict';
const CURRENT_VERSION='2.4B';
const root=new URL('./',window.location.href);
const $=id=>document.getElementById(id);
const menu=$('menu-view'),status=$('ia-update-status'),manual=$('ia-check-updates');
const STATE={current:CURRENT_VERSION,latest:CURRENT_VERSION,pending:null,
 checking:false,reloading:false,lastCheck:0,worker:false};
const attemptKey='iaPwaAutoAttempt-';
let controller=null,queued=false,registration=null;
const setStatus=value=>{if(status&&status.textContent!==value)status.textContent=value};
const safe=()=>!document.hidden&&menu&&!menu.hidden&&
 !window.iaDuelRole&&!/#duel=/.test(window.location.hash||'')&&!STATE.reloading;
const attemptDone=version=>{try{return sessionStorage.getItem(attemptKey+version)==='1'}catch(_){return false}};
const markAttempt=version=>{try{sessionStorage.setItem(attemptKey+version,'1')}catch(_){}};
const parse=v=>{
 const m=String(v||'').toUpperCase().match(/^(\d+)\.(\d+)([A-Z])?$/);
 return m?[Number(m[1]),Number(m[2]),m[3]?m[3].charCodeAt(0):0]:null;
};
const newer=(a,b)=>{
 const x=parse(a),y=parse(b);
 if(!x||!y)return false;
 for(let i=0;i<x.length;i++){if(x[i]!==y[i])return x[i]>y[i]}
 return false;
};
function apply(auto=true){
 const version=STATE.pending;
 if(!version||!safe())return false;
 if(auto&&attemptDone(version)){
  setStatus('Update '+version+' beschikbaar. Gebruik Controleer update als hij nog niet gestart is.');
  return false;
 }
 STATE.reloading=true;
 markAttempt(version);
 setStatus('INSECT ARENA wordt bijgewerkt naar '+version+'…');
 // Stable same-origin destination is inside the EXISTING standalone PWA scope.
 // The icon itself does NOT need to be recreated or edited.
 const target=new URL('./',root);
 target.searchParams.set('v',version);
 target.searchParams.set('refresh',String(Date.now()));
 if(window.location.hash&&!/#duel=/.test(window.location.hash))
  target.hash=window.location.hash;
 window.location.replace(target.href);
 return true;
}
function scheduleAuto(){
 if(!STATE.pending||queued)return;
 queued=true;
 setTimeout(()=>{
  queued=false;
  if(STATE.pending&&safe())apply(true);
 },950);
}
async function check(force=false){
 if(STATE.checking||STATE.reloading)return false;
 const now=Date.now();
 if(!force&&now-STATE.lastCheck<60000)return false;
 if(document.hidden||navigator.onLine===false){
  setStatus('Offline · je bestaande versie blijft speelbaar');
  return false;
 }
 STATE.checking=true;STATE.lastCheck=now;
 if(controller)controller.abort();
 controller=typeof AbortController!=='undefined'?new AbortController():null;
 const timeout=controller?setTimeout(()=>controller.abort(),9000):null;
 try{
  // Cachebuster is necessary for GitHub Pages, iOS Safari, and cached pinned URLs.
  const url=new URL('version.json',root);
  url.searchParams.set('check',String(now));
  const response=await fetch(url.href,{
   cache:'no-store',credentials:'same-origin',
   ...(controller?{signal:controller.signal}:{})
  });
  if(!response.ok)throw new Error('Versiecontrole niet bereikbaar');
  const data=await response.json();
  const remote=data?.version;
  if(!parse(remote))throw new Error('Onbekende versie');
  STATE.latest=remote;
  if(newer(remote,CURRENT_VERSION)){
   STATE.pending=remote;
   setStatus('Versie '+remote+' beschikbaar · automatisch bijwerken zodra je in het menu bent');
   scheduleAuto();
  }else{
   STATE.pending=null;
   setStatus('Automatische updates actief · versie '+CURRENT_VERSION);
  }
  return true;
 }catch(_){
  setStatus('Updatecontrole tijdelijk niet beschikbaar · spel blijft werken');
  return false;
 }finally{
  if(timeout!==null)clearTimeout(timeout);
  STATE.checking=false;
 }
}
async function registerWorker(){
 if(!('serviceWorker'in navigator)){
  setStatus('Updates worden gecontroleerd bij openen (offline-modus niet beschikbaar)');
  return;
 }
 try{
  registration=await navigator.serviceWorker.register('./sw.js',{
   scope:'./',updateViaCache:'none'
  });
  STATE.worker=true;
  // The browser checks for a changed worker script too. No forced app reload.
  await registration.update().catch(()=>{});
 }catch(_){
  // Version checks still work without worker support.
  STATE.worker=false;
 }
}
manual?.addEventListener('click',()=>{
 if(STATE.pending&&safe())apply(false);
 else check(true);
});
document.addEventListener('visibilitychange',()=>{
 if(!document.hidden){check(false);scheduleAuto()}
});
window.addEventListener('focus',()=>{check(false);scheduleAuto()});
window.addEventListener('online',()=>{check(true);scheduleAuto()});
window.addEventListener('pageshow',()=>check(false));
const menuObserver=new MutationObserver(()=>scheduleAuto());
if(menu)menuObserver.observe(menu,{attributes:true,attributeFilter:['hidden']});
window.setInterval(()=>{
 if(!document.hidden){check(true);registration?.update?.().catch(()=>{})}
},15*60*1000);
window.iaPwaUpdates={
 version:CURRENT_VERSION,
 check:()=>check(true),
 state:()=>({...STATE}),
 canApply:safe,
 apply:()=>apply(false)
};
setStatus('Automatische updates actief · versie '+CURRENT_VERSION);
registerWorker();
setTimeout(()=>check(true),1100);
})();
