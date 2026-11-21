
/* INSECT ARENA 0.6A — premium menus, fighter selection and analog iPhone joystick.
   The original combat engine and local save remain intact. */
(()=>{
const ids=['menu','select','world','settings','arena'];
const views=Object.fromEntries(ids.map(id=>[id,document.getElementById(id+'-view')]));
const el=id=>document.getElementById(id);
const state={page:'menu',shownResult:false};
const save=(key,val)=>{try{localStorage.setItem(key,String(val))}catch(e){}};
const read=(key,fallback)=>{try{return localStorage.getItem(key)??fallback}catch(e){return fallback}};
window.iaJoystick={active:false,x:0,y:0,sensitivity:1};
window.iaReducedEffects=false;
function switchPage(page){
 state.page=page;
 ids.forEach(id=>views[id].hidden=id!==page);
 if(page==='menu')el('menu-wins').textContent=wins+' OVERWINNINGEN';
 if(typeof window.scrollTo==='function')window.scrollTo(0,0);
}
const hero=el('menu-hero-unit');
hero.src=spriteSources[1];
function setMenuBackground(){
 if(forestPhoto.complete&&forestPhoto.naturalWidth){
  const m=views.menu;
  m.style.backgroundImage="linear-gradient(180deg,rgba(5,23,9,.45),rgba(5,23,9,.03) 31%,rgba(4,15,7,.95) 95%),url("+forestPhoto.src+")";
  m.style.backgroundSize='cover';m.style.backgroundPosition='center';
 }
}
forestPhoto.addEventListener('load',setMenuBackground);
setMenuBackground();
const lines=['Snel, fel en wendbaar.','Meester van de sikkelklauw.','Zwaar pantser met een vernietigende ramstoot.','Gevaarlijk gif en een krachtige staart.'];
function roster(){
 const root=el('fighter-roster');root.textContent='';
 types.forEach((t,i)=>{
  const b=document.createElement('button');b.type='button';b.className='fighterCard';b.dataset.fighter=String(i);
  const img=document.createElement('img');img.src=spriteSources[i];img.alt=t.name;b.appendChild(img);
  const info=document.createElement('div');info.className='fighterText';
  const title=document.createElement('div');title.className='fighterName';title.textContent=t.name;info.appendChild(title);
  const skill=document.createElement('div');skill.className='fighterSkill';skill.textContent=t.move;info.appendChild(skill);
  const stats=[['SNELHEID',t.speed/4.4],['KRACHT',t.damage/21],['BEREIK',t.range/98]];
  for(const [name,value] of stats){
   const text=document.createElement('div');text.className='statLabel';text.textContent=name;info.appendChild(text);
   const track=document.createElement('div');track.className='barTrack';
   const fill=document.createElement('div');fill.className='barValue';fill.style.width=Math.round(value*100)+'%';track.appendChild(fill);info.appendChild(track);
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
 el('selected-summary').textContent=lines[+fighterSel.value];
}
function resetJoystick(){
 const j=window.iaJoystick;j.active=false;j.x=j.y=0;
 el('joystick-nub').style.transform='translate(-50%,-50%)';
 pointer=null;
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
el('world-play').addEventListener('click',()=>switchPage('select'));
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
const originalAttack=attack;
attack=function(a,t,special=false){
 originalAttack(a,t,special);
 if(!playing&&player&&enemy&&state.page==='arena'&&!state.shownResult)outcome();
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
const pad=el('joystick'),nub=el('joystick-nub');let pointer=null;
function movePad(e){
 const bounds=pad.getBoundingClientRect(),cx=bounds.left+bounds.width/2,cy=bounds.top+bounds.height/2;
 const r=bounds.width*.33,dx=e.clientX-cx,dy=e.clientY-cy,len=Math.hypot(dx,dy);
 const m=Math.min(r,len),x=len?dx/len*m:0,y=len?dy/len*m:0;
 const joy=window.iaJoystick;
 joy.x=Math.abs(x/r)<.10?0:x/r;joy.y=Math.abs(y/r)<.10?0:y/r;joy.active=true;
 nub.style.transform='translate(-50%,-50%) translate('+x+'px,'+y+'px)';
}
pad.addEventListener('pointerdown',e=>{
 if(pointer!==null)return;
 e.preventDefault();pointer=e.pointerId;pad.setPointerCapture?.(e.pointerId);movePad(e);
});
pad.addEventListener('pointermove',e=>{if(pointer!==e.pointerId)return;e.preventDefault();movePad(e)});
for(const kind of ['pointerup','pointercancel','lostpointercapture'])pad.addEventListener(kind,e=>{
 if(pointer===null||e.pointerId===pointer)resetJoystick();
});
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
roster();switchPage('menu');
})();
