
/* INSECT ARENA 0.7B — premium menus, fighter selection and analog iPhone joystick.
   The original combat engine and local save remain intact. */
(()=>{
const ids=['menu','select','world','settings','arena','duel'];
const views=Object.fromEntries(ids.map(id=>[id,document.getElementById(id+'-view')]));
const el=id=>document.getElementById(id);
const state={page:'menu',shownResult:false};
const save=(key,val)=>{try{localStorage.setItem(key,String(val))}catch(e){}};
const read=(key,fallback)=>{try{return localStorage.getItem(key)??fallback}catch(e){return fallback}};
window.iaJoystick={active:false,x:0,y:0,sensitivity:1};
window.iaReducedEffects=false;
function switchPage(page){
 if(page!=='arena'){window.iaStopCountdown?.();window.iaMatchHUD?.stop();}
 state.page=page;
 ids.forEach(id=>views[id].hidden=id!==page);
 if(page==='menu')el('menu-wins').textContent=wins+' OVERWINNINGEN';
 if(typeof window.scrollTo==='function')window.scrollTo(0,0);
}
const hero=el('menu-hero-unit');
hero.src=spriteSources[5];
function setMenuBackground(){
 if(forestPhoto.complete&&forestPhoto.naturalWidth){
  const m=views.menu;
  m.style.backgroundImage="linear-gradient(180deg,rgba(5,23,9,.45),rgba(5,23,9,.03) 31%,rgba(4,15,7,.95) 95%),url("+forestPhoto.src+")";
  m.style.backgroundSize='cover';m.style.backgroundPosition='center';
 }
}
forestPhoto.addEventListener('load',setMenuBackground);
setMenuBackground();
const lines=['Snel, fel en wendbaar.','Meester van de sikkelklauw.','Zwaar pantser met een vernietigende ramstoot.','Gevaarlijk gif en een krachtige staart.','Metalen pantser en vurige verdedigingsstraal.','Roze roofdier met onzichtbare hinderlaag.','Fluweelachtige wesp met verrassend krachtig gif.','Grote waterrover die zijn prooi vastgrijpt.','Snelle duizendpoot met een giftige klemgreep: alleen in solo vrij te spelen.'];
function roster(){
 const root=el('fighter-roster');root.textContent='';
 types.forEach((t,i)=>{
  const b=document.createElement('button');b.type='button';b.className='fighterCard';b.dataset.fighter=String(i);
  const img=document.createElement('img');img.src=spriteSources[i];img.alt=t.name;b.appendChild(img);
  const info=document.createElement('div');info.className='fighterText';
  const title=document.createElement('div');title.className='fighterName';title.textContent=t.name;info.appendChild(title);
  const skill=document.createElement('div');skill.className='fighterSkill';skill.textContent=t.move;info.appendChild(skill);
  if(i>=4){b.classList.add('isNew');b.title='Nieuw in 0.7A'}
  const stats=[['SNELHEID',t.speed/4.4],['KRACHT',t.damage/21],['BEREIK',t.range/115]];
  for(const [name,value] of stats){
   const text=document.createElement('div');text.className='statLabel';text.textContent=name;info.appendChild(text);
   const track=document.createElement('div');track.className='barTrack';
   const fill=document.createElement('div');fill.className='barValue';fill.style.width=Math.min(100,Math.round(value*100))+'%';track.appendChild(fill);info.appendChild(track);
  }
  b.appendChild(info);
  b.addEventListener('click',()=>{fighterSel.value=String(i);refreshRoster()});
  root.appendChild(b);
 });
 refreshRoster();
}
function refreshRoster(){
 document.querySelectorAll('.fighterCard').forEach(b=>{
  const selected=+b.dataset.fighter===+fighterSel.value;
  b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));
 });
 el('selected-summary').textContent=lines[+fighterSel.value]+' · Wereld: '+window.iaWorldName();
}
function resetJoystick(){
 const j=window.iaJoystick;j.active=false;j.x=j.y=0;
 el('joystick-nub').style.transform='translate(-50%,-50%)';
 pointer=null;
 touchId=null;
}
function beginBattle(){
 resetJoystick();state.shownResult=false;
 el('battle-overlay').hidden=true;
 el('start').click();
 switchPage('arena');
}
function goMenu(){
 playing=false;paused=false;
 resetJoystick();el('battle-overlay').hidden=true;switchPage('menu');
}
el('menu-play').addEventListener('click',()=>switchPage('select'));
el('menu-fighters').addEventListener('click',()=>switchPage('select'));
el('menu-worlds').addEventListener('click',()=>switchPage('world'));
el('menu-settings').addEventListener('click',()=>switchPage('settings'));
function chooseWorld(id){window.iaSetWorld(id);refreshWorldCards();switchPage('select');refreshRoster();}
function refreshWorldCards(){
 const selected=window.iaWorldSelected();
 document.querySelectorAll('[data-world]').forEach(card=>card.classList.toggle('activeWorld',card.dataset.world===selected));
 document.querySelectorAll('[data-choose-world]').forEach(btn=>{const active=btn.dataset.chooseWorld===selected;btn.classList.toggle('activeWorld',active);btn.setAttribute('aria-pressed',String(active))});
 const current=el('current-world');if(current)current.textContent='GEKOZEN WERELD · '+window.iaWorldName().toUpperCase();
 const forest=el('world-card-forest');
 if(forest&&forestPhoto.complete&&forestPhoto.naturalWidth){forest.style.backgroundImage="linear-gradient(90deg,rgba(4,22,9,.75),rgba(4,22,9,.22)),url("+forestPhoto.src+")";forest.style.backgroundSize='cover';forest.style.backgroundPosition='center';}
}
el('world-play').addEventListener('click',()=>chooseWorld('forest'));
el('world-spores').addEventListener('click',()=>chooseWorld('fungus'));
document.querySelectorAll('[data-choose-world]').forEach(btn=>btn.addEventListener('click',()=>{window.iaSetWorld(btn.dataset.chooseWorld);refreshWorldCards();refreshRoster()}));
forestPhoto.addEventListener('load',refreshWorldCards);
refreshWorldCards();
el('launch-battle').addEventListener('click',beginBattle);
el('battle-menu').addEventListener('click',goMenu);
document.querySelectorAll('[data-back]').forEach(b=>b.addEventListener('click',()=>switchPage(b.dataset.back)));
function overlay(title,sub,actions){
 el('overlay-title').textContent=title;el('overlay-desc').textContent=sub;
 const host=el('overlay-buttons');host.textContent='';
 actions.forEach(({text,primary,action})=>{
  const b=document.createElement('button');b.className=primary?'goldButton':'iconBtn';
  b.textContent=text;b.addEventListener('click',action);host.appendChild(b);
 });
 el('battle-overlay').hidden=false;
}
function outcome(){
 if(state.shownResult)return;
 state.shownResult=true;resetJoystick();
 const won=enemy.hp<=0;
 overlay(won?'OVERWINNING!':'VERSLAGEN',
 won?'Je hebt '+types[enemy.id].name+' verslagen. Totaal: '+wins+' overwinningen.':'De '+types[enemy.id].name+' won dit duel. Probeer opnieuw!',
 [
 {text:won?'VOLGENDE DUEL':'HERKANSING',primary:true,action:beginBattle},
 {text:'ANDERE VECHTER',action:()=>{el('battle-overlay').hidden=true;switchPage('select')}},
 {text:'HOOFDMENU',action:goMenu}
 ]);
}
window.iaOnWorldKO=()=>{if(!window.iaDuelRole&&state.page==='arena'&&!state.shownResult)outcome();};
const originalAttack=attack;
attack=function(a,t,special=false){
 originalAttack(a,t,special);
 if(!window.iaDuelRole&&!playing&&player&&enemy&&state.page==='arena'&&!state.shownResult)outcome();
};
el('pause').addEventListener('click',()=>{
 if(!playing||!player)return;
 if(paused){
  overlay('PAUZE','Het gevecht staat stil.',[
    {text:'HERVATTEN',primary:true,action:()=>el('pause').click()},
    {text:'HOOFDMENU',action:goMenu}
  ]);
 }else{el('battle-overlay').hidden=true;statusEl.textContent='Gevecht hervat';}
});
const pad=el('joystick'),nub=el('joystick-nub');
let pointer=null,touchId=null;
function movePadAt(clientX,clientY){
 const box=pad.getBoundingClientRect(),r=Math.max(1,box.width*.33);
 const dx=clientX-(box.left+box.width/2),dy=clientY-(box.top+box.height/2);
 const len=Math.hypot(dx,dy),factor=len>0?Math.min(1,r/len):0;
 const x=dx*factor,y=dy*factor;
 const joy=window.iaJoystick;
 joy.x=Math.abs(x/r)<.12?0:x/r;
 joy.y=Math.abs(y/r)<.12?0:y/r;
 joy.active=true;
 nub.style.transform='translate(-50%,-50%) translate('+x.toFixed(1)+'px,'+y.toFixed(1)+'px)';
}
// Native touch handling prevents iOS text selection, page scrolling, and smart zoom.
// The first finger drives the pad; the second is free to use AANVAL/SPECIAL.
pad.addEventListener('touchstart',e=>{
 if(e.cancelable)e.preventDefault();
 if(touchId!==null || pointer!==null)return;
 const t=e.changedTouches[0];if(!t)return;
 touchId=t.identifier;
 movePadAt(t.clientX,t.clientY);
},{passive:false});
pad.addEventListener('touchmove',e=>{
 if(e.cancelable)e.preventDefault();
 if(touchId===null)return;
 const t=Array.from(e.touches).find(item=>item.identifier===touchId);
 if(t)movePadAt(t.clientX,t.clientY);
},{passive:false});
for(const kind of ['touchend','touchcancel'])pad.addEventListener(kind,e=>{
 if(e.cancelable)e.preventDefault();
 if(touchId===null)return;
 if(Array.from(e.changedTouches).some(t=>t.identifier===touchId))resetJoystick();
},{passive:false});
pad.addEventListener('pointerdown',e=>{
 if(e.pointerType==='touch'||pointer!==null||touchId!==null)return;
 e.preventDefault();pointer=e.pointerId;
 try{pad.setPointerCapture?.(e.pointerId)}catch(_){}
 movePadAt(e.clientX,e.clientY);
});
pad.addEventListener('pointermove',e=>{
 if(e.pointerType==='touch'||e.pointerId!==pointer)return;
 e.preventDefault();movePadAt(e.clientX,e.clientY);
});
for(const kind of ['pointerup','pointercancel','lostpointercapture'])pad.addEventListener(kind,e=>{
 if(e.pointerType==='touch')return;
 if(pointer!==null&&pointer===e.pointerId)resetJoystick();
});
for(const kind of ['contextmenu','selectstart','dragstart','dblclick']){
 pad.addEventListener(kind,e=>{e.preventDefault();e.stopPropagation()});
}
document.querySelectorAll('.touchPanel button').forEach(b=>{
 b.addEventListener('contextmenu',e=>e.preventDefault());
 b.addEventListener('selectstart',e=>e.preventDefault());
 b.addEventListener('touchstart',e=>{if(e.cancelable)e.preventDefault()},{passive:false});
 b.addEventListener('dblclick',e=>e.preventDefault());
});
const arenaElement=el('arena-view');
arenaElement.addEventListener('dblclick',e=>e.preventDefault());
for(const kind of ['gesturestart','gesturechange']){
 document.addEventListener(kind,e=>{if(!arenaElement.hidden&&e.cancelable)e.preventDefault()},{passive:false});
}
document.addEventListener('visibilitychange',()=>{if(document.hidden)resetJoystick()});
window.addEventListener('blur',resetJoystick);
window.addEventListener('pagehide',resetJoystick);
const slider=el('joy-sens'),motion=el('less-motion');
slider.value=read('iaJoySensitivity','100');motion.checked=read('iaReduceFX','0')==='1';
window.iaJoystick.sensitivity=(+slider.value)/100;window.iaReducedEffects=motion.checked;
function sensLabel(){el('joy-sens-label').textContent=slider.value+'%'}
sensLabel();
slider.addEventListener('input',()=>{sensLabel();window.iaJoystick.sensitivity=(+slider.value)/100});
motion.addEventListener('change',()=>window.iaReducedEffects=motion.checked);
el('settings-done').addEventListener('click',()=>{
 save('iaJoySensitivity',slider.value);save('iaReduceFX',motion.checked?'1':'0');switchPage('menu');
});
roster();refreshWorldCards();switchPage('menu');
window.iaUI={open:switchPage,beginBattle,goMenu,refreshRoster,refreshWorldCards};
})();
