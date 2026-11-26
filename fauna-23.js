/* INSECT ARENA 2.3A — loopanimatie en speciale aanvallen voor de drie nieuwe vechters.
 * Elke sheet wordt één keer in losse frames geknipt; vlak vóór het tekenen wijst fighterSprites[id]
 * naar het juiste frame, zodat HUD, schade-flits, aanvalsboog en statuseffecten van eerdere lagen gewoon werken.
 * Geen wijziging aan opgeslagen voortgang of het duelprotocol (nieuwe dieren zijn alleen in solo). */
(()=>{
'use strict';
const info=window.ia23Fauna;
if(!info||typeof drawInsect!=='function')return;
const SPECS=[
 {sheet:'bloemenmantis-23.webp',cols:4,rows:4,frames:16,pingpong:true, rate:2.2,idle:140},
 {sheet:'springstaart-23.webp', cols:4,rows:2,frames:8, pingpong:false,rate:3.0,idle:210},
 {sheet:'mijt-23.webp',         cols:4,rows:2,frames:8, pingpong:false,rate:2.4,idle:190}
];
const anim={};   // id -> {frames:[Image], seq:[index]}
function slice(id,spec,sheet){
 const fw=Math.floor(sheet.naturalWidth/spec.cols),fh=Math.floor(sheet.naturalHeight/spec.rows);
 const frames=[];
 for(let i=0;i<spec.frames;i++){
  const cv=document.createElement('canvas');cv.width=fw;cv.height=fh;
  cv.getContext('2d').drawImage(sheet,(i%spec.cols)*fw,Math.floor(i/spec.cols)*fh,fw,fh,0,0,fw,fh);
  // De kern van het spel leest complete/naturalWidth/naturalHeight en tekent met drawImage; een canvas kan dat ook.
  cv.complete=true;cv.naturalWidth=fw;cv.naturalHeight=fh;
  frames.push(cv);
 }
 const seq=[...Array(spec.frames).keys()];
 if(spec.pingpong)for(let j=spec.frames-2;j>0;j--)seq.push(j);
 anim[id]={frames,seq};
}
SPECS.forEach((spec,k)=>{
 const id=info.firstId+k;
 const sheet=new Image();sheet.decoding='async';
 sheet.onload=()=>{try{slice(id,spec,sheet)}catch(e){console.warn('Animatie niet geladen',id,e)}};
 sheet.onerror=()=>console.warn('Animatiesheet niet geladen:',spec.sheet);
 sheet.src='assets/fighters/'+spec.sheet;
});

function frameVoor(u){
 const k=u.id-info.firstId,spec=SPECS[k],a=anim[u.id];
 if(!a)return null;
 const moving=Math.abs(u.walk||0)>.09;
 let pos;
 if(moving)pos=Math.floor(Math.abs(u.walk)*spec.rate);
 else pos=Math.floor(performance.now()/spec.idle);
 return a.frames[a.seq[((pos%a.seq.length)+a.seq.length)%a.seq.length]];
}

const vorigeDraw=drawInsect;
drawInsect=function(u){
 if(u&&u.id>=info.firstId&&u.id<info.firstId+info.count){
  const f=frameVoor(u);
  if(f)fighterSprites[u.id]=f;
 }
 return vorigeDraw(u);
};

// Speciale aanvallen
const vorigeAttack=attack;
attack=function(a,t,special=false){
 const own=special&&a&&t&&a.id>=info.firstId&&a.id<info.firstId+info.count;
 const before=t?.hp,cd=a?.special||0;
 vorigeAttack(a,t,special);
 if(!own||!(t.hp<before)||!(a.special>cd+1))return;
 const k=a.id-info.firstId;
 let label,color;
 if(k===0){
  t.poison=Math.max(t.poison||0,170);t.slow=Math.max(t.slow||0,40);
  label='BLOEDENDE SNEDE!';color='#ff8a5e';
 }else if(k===1){
  const dx=t.x-a.x,dy=t.y-a.y,len=Math.hypot(dx,dy)||1;
  t.x+=dx/len*62;t.y+=dy/len*20;t.slow=Math.max(t.slow||0,55);
  a.x+=dx/len*18;
  label='SPRINGSTOOT!';color='#e9dcb0';
 }else{
  t.poison=Math.max(t.poison||0,260);t.slow=Math.max(t.slow||0,70);
  label='MIJTENPLAAG!';color='#d98a3d';
 }
 floaters.push({x:t.x,y:t.y-105,value:label,life:42,color});
 burst(t.x,t.y,color,22,4.5);
 if(typeof tag==='function'&&a===player)tag(label);
};
window.ia23Fauna.ready=()=>Object.keys(anim).length;
})();
