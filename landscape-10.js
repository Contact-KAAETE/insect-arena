/* INSECT ARENA 1.0A — fullscreen UX with graceful iPhone fallback.
   iOS Safari cannot grant arbitrary element fullscreen. Install as standalone
   via Share > Add to Home Screen; other browsers use requestFullscreen(). */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const arena=$('arena-view');
const fsButton=$('battle-fullscreen');
const help=$('fullscreen-help');
const installClose=$('install-help-close');
const rotateBack=$('rotate-exit');
const isStandalone=()=>{
 try{return navigator.standalone===true ||
   window.matchMedia?.('(display-mode: standalone)').matches ||
   window.matchMedia?.('(display-mode: fullscreen)').matches ||
   Boolean(document.fullscreenElement);
 }catch(_){return false}
};
function refresh(){
 const standalone=isStandalone();
 const active=!arena.hidden;
 document.documentElement.classList.toggle('ia-standalone',standalone);
 document.documentElement.classList.toggle('ia-battle-open',active);
 fsButton.textContent=document.fullscreenElement?'⛶ AFSLUITEN':'⛶ SCHERM';
 fsButton.title=standalone?'Spelen zonder browserbalken':'Volledig scherm';
 // In landscape the stage follows the visible viewport after Safari bars retract.
 // On PWA standalone, use CSS 100dvh; no zoom or manual scaling.
 const vv=window.visualViewport;
 const h=vv&&vv.scale===1?vv.height:window.innerHeight;
 if(Number.isFinite(h)&&h>0)
  document.documentElement.style.setProperty('--ia-visible-height',Math.round(h)+'px');
}
function showInstallHelp(){
 help.hidden=false;
 // Leave browser bars and viewport untouched rather than showing a fake fullscreen.
 try{installClose.focus({preventScroll:true})}catch(_){}
}
function hideInstallHelp(){help.hidden=true;try{fsButton.focus({preventScroll:true})}catch(_){}}
async function tryFullScreen(){
 if(document.fullscreenElement){
  try{await document.exitFullscreen()}catch(_){}
  refresh();return;
 }
 if(navigator.standalone===true || window.matchMedia?.('(display-mode: standalone)').matches){
  refresh();return;
 }
 const root=document.documentElement;
 if(!root.requestFullscreen){showInstallHelp();return}
 try{
  try{await root.requestFullscreen({navigationUI:'hide'})}
  catch(_){await root.requestFullscreen()}
  try{await screen.orientation?.lock?.('landscape')}catch(_){}
  refresh();
 }catch(e){showInstallHelp()}
}
fsButton.addEventListener('click',e=>{
 e.preventDefault();
 tryFullScreen();
});
installClose.addEventListener('click',hideInstallHelp);
help.addEventListener('click',e=>{if(e.target===help)hideInstallHelp()});
rotateBack.addEventListener('click',()=>{
 // Use the established battle exit, which also tells the online opponent.
 $('battle-menu').click();
});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&!help.hidden)hideInstallHelp();
});
document.addEventListener('fullscreenchange',refresh);
window.addEventListener('orientationchange',()=>setTimeout(refresh,180));
window.addEventListener('resize',refresh);
window.visualViewport?.addEventListener('resize',refresh);
// Observe screen changes from solo and online UI without changing joystick or AI.
const observer=new MutationObserver(refresh);
observer.observe(arena,{attributes:true,attributeFilter:['hidden']});
window.addEventListener('pagehide',()=>observer.disconnect(),{once:true});
refresh();
})();
