/* INSECT ARENA 1.4A — extension registered before menus & multiplayer.
 * Preserve all eight original creatures; ninth is solo-only, earned in tutorial.
 * Roots world wraps the original forest and adds tactical obstacles separately.
 */
(()=>{
'use strict';
const done=()=>{
 try{return localStorage.getItem('ia14TutorialComplete')==='yes'}catch(_){return false}
};
const ninth={name:'Reuzenduizendpoot',move:'gifgreep · tijdelijk verlammen',
  body:'#72392c',accent:'#df9d54',hp:146,speed:3.5,damage:16,range:106,
  description:'Een snelle bosbodemjager die zijn prooi met gif en grijppoten vasthoudt.'};
types.push(ninth);
const i=types.length-1;
const src='assets/fighters/centipede-14.svg';
spriteSources.push(src);
spriteWidths.push(220);
fighterSel.add(new Option(ninth.name+' · '+ninth.move,i));
const portrait=new Image();portrait.decoding='async';
portrait.onload=()=>{fighterSprites[i]=portrait};
portrait.onerror=()=>{fighterSprites[i]=null};
portrait.src=src;
const getWorld=window.iaWorldSelected,setWorld=window.iaSetWorld,getName=window.iaWorldName;
let roots=false;
try{roots=done()&&localStorage.getItem('ia14SelectedWorld')==='roots'}catch(_){}
if(roots)setWorld('forest');
window.iaWorldSelected=()=>roots?'roots':getWorld();
window.iaWorldName=()=>roots?'Worteldoolhof':getName();
window.iaSetWorld=id=>{
 if(id==='roots'){
  if(!done())return false;
  const ok=setWorld('forest');if(!ok)return false;
  roots=true;
  try{localStorage.setItem('ia14SelectedWorld','roots')}catch(_){}
  return true;
 }
 const ok=setWorld(id);
 if(ok){
  roots=false;
  try{localStorage.removeItem('ia14SelectedWorld')}catch(_){}
 }
 return ok;
};
window.ia14Unlocked=done;
})();