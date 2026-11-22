/* INSECT ARENA 1.5A — extra creatures and worlds, registered before ui-07.
   Index 0..7 remains the original network-compatible roster. Index 8 is
   the tutorial prize; indexes 9..12 are available in SOLO only. */
(()=>{
'use strict';
const newcomers=[
 {name:'Kruisspin',move:'kleverig vangweb',body:'#bb8051',accent:'#5c3326',
  hp:124,speed:3.65,damage:15,range:132,
  description:'Vangt prooien in een sterk web. Special: tijdelijk vastzetten.'},
 {name:'Roofwants',move:'giftige steek',body:'#5e8066',accent:'#c98634',
  hp:140,speed:3.9,damage:17,range:105,
  description:'Een verborgen jager met een giftige, stekende zuigsnuit.'},
 {name:'Libellenlarve',move:'waterstraal',body:'#608977',accent:'#a4d2b0',
  hp:148,speed:3.15,damage:16,range:110,
  description:'Onderwaterroofdier met uitschietbaar vangmasker en waterstoot.'},
 {name:'Veenmol',move:'aardbeving',body:'#845d40',accent:'#dcac63',
  hp:167,speed:3.05,damage:19,range:98,
  description:'Graafkracht en ondergrondse schokgolf maken deze jager uniek.'}
];
const imgs=['kruisspin-15.svg','roofwants-15.svg','libellenlarve-15.svg','veenmol-15.svg'];
const widths=[190,200,212,235];
newcomers.forEach((spec,k)=>{
 const id=types.length;
 types.push(spec);
 const url='assets/fighters/'+imgs[k];
 spriteSources.push(url);spriteWidths.push(widths[k]);
 fighterSel.add(new Option(spec.name+' · '+spec.move,id));
 const img=new Image();img.decoding='async';
 img.onload=()=>{fighterSprites[id]=img};
 img.onerror=()=>{fighterSprites[id]=null;console.warn('Geen vechterbeeld',spec.name)};
 img.src=url;
});
const nameMap={dew:'Dauwmoeras',cave:'Rotsholte',red:'Rode Breukgrond'};
const artMap={
 dew:'assets/worlds/dauwmoeras-15.svg',
 cave:'assets/worlds/rotsholte-15.svg',
 red:'assets/worlds/rode-breukgrond-15.svg'
};
const existingGet=window.iaWorldSelected;
const existingSet=window.iaSetWorld;
const existingName=window.iaWorldName;
let extra=null;
try{
 const saved=localStorage.getItem('ia15World');
 if(saved in nameMap){extra=saved;existingSet('forest')}
}catch(_){}
window.iaWorldSelected=()=>extra||existingGet();
window.iaWorldName=()=>extra?nameMap[extra]:existingName();
window.iaSetWorld=id=>{
 if(Object.prototype.hasOwnProperty.call(nameMap,id)){
  if(!existingSet('forest'))return false;
  extra=id;
  try{localStorage.setItem('ia15World',id)}catch(_){}
  return true;
 }
 const ok=existingSet(id);
 if(ok){
  extra=null;
  try{localStorage.removeItem('ia15World')}catch(_){}
 }
 return ok;
};
window.ia15WorldArt=artMap;
window.ia15WorldNames=nameMap;
window.ia15NewFighters=newcomers.map((f,i)=>({id:i+9,name:f.name,skill:f.move}));
})();