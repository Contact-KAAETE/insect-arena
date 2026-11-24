/* INSECT ARENA 2.0A — readable battle HUD and one release label.
 * Keeps the "ONTWIJK DE AANVAL!" warning and tactical toasts BELOW the two
 * health bars instead of on top of them, on every screen size.
 * No gameplay, stored progress or multiplayer protocol changes.
 */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const hud=$('premium-fighter-hud'),arena=$('arena-view');
const floating=[$('ai-danger-tag'),$('tactical-toast')].filter(Boolean);
const GAP=6;
function place(el){
 if(!el||el.hidden||!hud||!arena||arena.hidden)return;
 const parent=el.offsetParent;
 if(!parent)return;
 const bar=hud.getBoundingClientRect();
 if(!bar.height)return;
 const top=Math.round(bar.bottom-parent.getBoundingClientRect().top+GAP);
 const value=top+'px';
 if(el.style.top!==value)el.style.setProperty('top',value,'important');
}
const placeAll=()=>floating.forEach(place);
const watcher=new MutationObserver(placeAll);
floating.forEach(el=>watcher.observe(el,{attributes:true,attributeFilter:['hidden','class']}));
if(arena)watcher.observe(arena,{attributes:true,attributeFilter:['hidden']});
window.addEventListener('resize',placeAll);
window.addEventListener('orientationchange',()=>setTimeout(placeAll,250));
if(typeof ResizeObserver!=='undefined'&&hud)new ResizeObserver(placeAll).observe(hud);

// The release label in the main menu always follows the PWA version constant.
const release=window.iaPwaUpdates?.version;
const footer=document.querySelector('.menuFooter span:last-child');
if(footer&&release)footer.textContent=release+' · 13 VECHTERS · 6 WERELDEN';

window.ia20Hud={place:placeAll};
})();
