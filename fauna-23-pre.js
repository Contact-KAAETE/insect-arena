/* INSECT ARENA 2.3A — drie nieuwe, geanimeerde vechters, geregistreerd vóór ui-07 (zoals expansion-15-pre).
 * Index 0..7 blijft het netwerk-compatibele rooster; 13..15 zijn alleen in SOLO te spelen.
 * De stilstaande portretten staan in het rooster; de loopanimatie (fauna-23.js) gebruikt de sheets. */
(()=>{
'use strict';
const newcomers=[
 {name:'Doornige bloemenmantis',move:'doornenklauw',body:'#e9e2c9',accent:'#d97a2b',
  hp:112,speed:3.95,damage:18,range:118,
  description:'Bloedsnelle hinderlaagjager met vangarmen vol doornen. Special: bloedende snede.'},
 {name:'Springstaart',move:'springstoot',body:'#cbbd9c',accent:'#8a7a5a',
  hp:106,speed:4.9,damage:15,range:78,
  description:'Piepklein maar razendsnel. Special: springstoot die de tegenstander terugdrijft.'},
 {name:'Bosmijt',move:'mijtenplaag',body:'#b86a2e',accent:'#5e3216',
  hp:162,speed:3.0,damage:17,range:84,
  description:'Taai pantser en sluipend gif. Special: aanhoudende vergiftiging.'}
];
const portraits=['bloemenmantis-23-portret.webp','springstaart-23-portret.webp','mijt-23-portret.webp'];
const widths=[238,176,200];
window.ia23Fauna={firstId:types.length,count:newcomers.length};
newcomers.forEach((spec,k)=>{
 const id=types.length;
 types.push(spec);
 const url='assets/fighters/'+portraits[k];
 spriteSources.push(url);spriteWidths.push(widths[k]);
 fighterSel.add(new Option(spec.name+' · '+spec.move,id));
 const img=new Image();img.decoding='async';
 img.onload=()=>{if(!fighterSprites[id])fighterSprites[id]=img};
 img.onerror=()=>{fighterSprites[id]=null;console.warn('Geen vechterbeeld',spec.name)};
 img.src=url;
});
})();
