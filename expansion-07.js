/* INSECT ARENA 0.7A — eight fighters and two playable biomes.
   This module extends, but does not replace, the proven 0.6A combat renderer. */
(function(){
 'use strict';
 const newer=[
  {name:'Bombardeerkever',move:'hete afweerstraal',body:'#274659',accent:'#ed8a36',hp:132,speed:3.4,damage:17,range:102,description:'Vurige chemische straal met brandschade.'},
  {name:'Orchidee-bidsprinkhaan',move:'bloemcamouflage',body:'#eac3e3',accent:'#ce6faf',hp:106,speed:3.8,damage:17,range:115,description:'Verdwijnt kort, ontwijkt aanvallen en slaat vanuit camouflage toe.'},
  {name:'Fluweelmier',move:'gifstekel',body:'#ab251c',accent:'#180c13',hp:128,speed:4.0,damage:16,range:88,description:'Onverwachte gifsteek met schade over tijd.'},
  {name:'Reuzenwaterwants',move:'grijpgreep',body:'#655e35',accent:'#413c29',hp:154,speed:2.7,damage:20,range:96,description:'Pantserjager die zijn slachtoffer vastgrijpt en vertraagt.'}
 ];
 types.push(...newer);
 const files=['bombardier.webp','orchid-mantis.webp','velvet-ant.webp','giant-water-bug.webp'];
 const sizes=[195,201,192,218];
 for(let i=0;i<newer.length;i++){
   const ix=4+i,src='assets/fighters/'+files[i];
   spriteSources.push(src);
   spriteWidths.push(sizes[i]);
   fighterSel.add(new Option(newer[i].name+' · '+newer[i].move,ix));
   const img=new Image();
   img.decoding='async';
   img.onload=()=>{fighterSprites[ix]=img};
   img.onerror=()=>{fighterSprites[ix]=null;console.warn('Nieuwe vechterafbeelding niet geladen:',src)};
   img.src=src;
 }
 const fungusPhoto=new Image();
 let fungusReady=false;
 fungusPhoto.decoding='async';
 fungusPhoto.onload=()=>{fungusReady=true};
 fungusPhoto.onerror=()=>{fungusReady=false;console.warn('Schimmelvallei achtergrond niet geladen; bosbodem als fallback')};
 fungusPhoto.src='assets/worlds/schimmelvallei.webp';
 const worldNames={forest:'Groene Bosbodem',fungus:'Schimmelvallei'};
 let world='forest';
 try{if(localStorage.getItem('iaWorld')==='fungus')world='fungus'}catch(e){}
 window.iaWorldName=()=>worldNames[world];
 window.iaWorldSelected=()=>world;
 window.iaSetWorld=(id)=>{
  if(!(id in worldNames))return false;
  world=id;
  try{localStorage.setItem('iaWorld',id)}catch(e){}
  return true;
 };
 const coreUnit=unit;
 unit=function(id,x,y){
   const obj=coreUnit(id,x,y);
   obj.burn=0;obj.poison=0;obj.root=0;obj.slow=0;obj.cloak=0;obj.sporeSlow=0;
   obj.ambush=false;obj.statusFrame=0;
   return obj;
 };
 const coreReset=reset;
 let spores=[],worldFrame=0;
 reset=function(){
   coreReset();
   // All eight creatures may appear as AI opponents, never the selected player.
   if(player)enemy=unit((player.id+1+Math.floor(Math.random()*(types.length-1)))%types.length,700,320);
   spores=[];worldFrame=0;
   statusEl.textContent=worldNames[world]+' · Overwin de tegenstander! · Overwinningen: '+wins;
   window.iaBattleReady?.(world);
 };
 const coreAttack=attack;
 function emitDamage(target,amount,color){
  if(!target||!playing)return;
  const n=Math.max(0,Math.round(amount));
  if(n<=0)return;
  target.hp=Math.max(0,target.hp-n);
  target.flash=6;target.hitAnim=12;
  burst(target.x,target.y,color||'#d2fa86',7,2.6);
  floaters.push({x:target.x,y:target.y-61,value:n,life:35,color:color||'#c8ef8e'});
  if(target.hp===0){
    playing=false;
    if(target===enemy){wins++;try{localStorage.setItem('iaWins',wins)}catch(e){}statusEl.textContent='GEWONNEN! Totaal: '+wins+' · Start opnieuw.'}
    else statusEl.textContent='VERLOREN! Probeer opnieuw.';
    window.iaOnWorldKO?.();
  }
 }
 attack=function(a,t,special=false){
  if(!a||!t||!playing||paused)return;
  if(t.cloak>0 && Math.random()<(special?.28:.62)){
    if(a.cool>0)return;
    a.cool=20;a.attackAnim=18;a.attackMax=18;
    burst(t.x,t.y,'#ffb5f3',12,3.5);
    floaters.push({x:t.x,y:t.y-76,value:'MIS',life:34,color:'#f4d1ff'});
    return;
  }
  if(special && a.id===5){
    if(a.special>0||a.cool>0)return;
    a.cloak=180;a.ambush=true;a.special=270;a.cool=28;
    a.attackAnim=36;a.attackMax=36;a.attackSpecial=true;
    burst(a.x,a.y,'#ffc2f6',25,4);
    floaters.push({x:a.x,y:a.y-62,value:'CAMOUFLAGE',life:42,color:'#ffe2f7'});
    return;
  }
  if(special && a.id===4){
    if(a.special>0||a.cool>0)return;
    // Bombardier can spray further than its normal bite.
    const range=a.range;a.range=166;
    coreAttack(a,t,true);
    a.range=range;
    if(a.special>0){t.burn=Math.max(t.burn,160);burst(t.x,t.y,'#ffa13a',34,5.4);}
    return;
  }
  let bonus=1;
  if(a.id===5&&a.ambush){bonus=1.55;a.ambush=false;a.cloak=0;}
  const baseDamage=a.damage;
  a.damage*=bonus;
  const hpBefore=t.hp;
  coreAttack(a,t,special);
  a.damage=baseDamage;
  if(t.hp>=hpBefore)return;  // e.g. attack was on cooldown or out of range
  if(special&&a.id===6){t.poison=Math.max(t.poison,210);burst(t.x,t.y,'#db5170',24,4);}
  if(special&&a.id===7){t.root=Math.max(t.root,70);t.slow=Math.max(t.slow,140);burst(t.x,t.y,'#bde7fa',22,4);}
 };
 const corePlayer=controlPlayer;
 controlPlayer=function(dt){
  if(!player)return;
  const speed=player.speed;
  player.speed*=player.root>0?.08:player.slow>0?.46:player.sporeSlow>0?.62:1;
  corePlayer(dt);
  player.speed=speed;
 };
 const coreEnemy=controlEnemy;
 controlEnemy=function(dt){
   if(!enemy||!player)return;
   const speed=enemy.speed;
   enemy.speed*=enemy.root>0?.08:enemy.slow>0?.46:enemy.sporeSlow>0?.62:1;
   // Controlled special usage: the four new fighters demonstrate their unique abilities.
   const dx=player.x-enemy.x,dy=player.y-enemy.y;
   const near=Math.hypot(dx,dy)<(enemy.id===4?150:enemy.range*.9);
   if(playing&&near&&enemy.id>=4&&enemy.special<=0&&enemy.cool<=0&&Math.random()<.009){
     attack(enemy,player,true);
   }else coreEnemy(dt);
   enemy.speed=speed;
 };
 const coreConfine=confine;
 confine=function(a){
   coreConfine(a);
   if(!playing||paused)return;
   a.statusFrame=(a.statusFrame||0)+1;
   if(a.burn>0){a.burn--;if(a.burn%29===0)emitDamage(a,2,'#ffb35b');}
   if(a.poison>0){a.poison--;if(a.poison%26===0)emitDamage(a,2,'#cc6de9');}
   a.root=Math.max(0,a.root-1);
   a.slow=Math.max(0,a.slow-1);
   a.sporeSlow=Math.max(0,a.sporeSlow-1);
   a.cloak=Math.max(0,a.cloak-1);
 };
 const coreArena=drawArena;
 function createSporeCloud(){
   spores.push({x:rand(185,715),y:rand(245,445),r:rand(42,72),age:0,life:230});
   if(spores.length>4)spores.shift();
 }
 drawArena=function(time){
   if(world==='forest'){coreArena(time);return;}
   if(fungusReady){g.drawImage(fungusPhoto,0,0,c.width,c.height)}
   else {coreArena(time);g.fillStyle='rgba(55,0,85,.31)';g.fillRect(0,0,c.width,c.height)}
   // Bioluminescent haze and distinct violet spore effects.
   g.save();
   const veil=g.createLinearGradient(0,0,0,c.height);
   veil.addColorStop(0,'rgba(37,7,77,.13)');veil.addColorStop(.65,'rgba(48,4,82,.02)');veil.addColorStop(1,'rgba(14,4,48,.15)');
   g.fillStyle=veil;g.fillRect(0,0,c.width,c.height);
   if(playing&&!paused&&!window.iaCountdownActive){
     worldFrame++;
     if(worldFrame%235===0)createSporeCloud();
     for(const cl of spores){
       cl.age++;cl.life--;
       for(const creature of [player,enemy]){
         if(creature&&Math.hypot(creature.x-cl.x,creature.y-cl.y)<cl.r*.75)creature.sporeSlow=36;
       }
     }
     spores=spores.filter(x=>x.life>0);
   }
   for(const cl of spores){
      const alpha=Math.min(1,cl.age/32,cl.life/32)*.52;
      const gl=g.createRadialGradient(cl.x,cl.y,2,cl.x,cl.y,cl.r);
      gl.addColorStop(0,'rgba(201,118,255,'+alpha+')');
      gl.addColorStop(.6,'rgba(137,67,212,'+(alpha*.36)+')');
      gl.addColorStop(1,'rgba(63,31,124,0)');
      g.fillStyle=gl;g.beginPath();g.arc(cl.x,cl.y,cl.r,0,Math.PI*2);g.fill();
      g.strokeStyle='rgba(224,170,255,'+(alpha*.9)+')';g.lineWidth=2;
      g.beginPath();g.ellipse(cl.x,cl.y,cl.r*.7,cl.r*.3,0,0,Math.PI*2);g.stroke();
   }
   if(!window.iaReducedEffects)for(let i=0;i<26;i++){
     const px=(i*137+time*.009*(i%3+1))%900,py=(i*71-time*.012*(i%4+1)+9000)%560;
     g.fillStyle='rgba(196,131,255,'+(.12+.15*Math.sin(time*.001+i))+')';
     g.beginPath();g.arc(px,py,1.1+(i%3)*.6,0,Math.PI*2);g.fill();
   }
   g.restore();
 };
 const coreDrawInsect=drawInsect;
 drawInsect=function(a){
   coreDrawInsect(a);
   if(!a)return;
   g.save();
   if(a.cloak>0){g.strokeStyle='rgba(255,180,244,.55)';g.lineWidth=3;g.setLineDash?.([5,10]);g.beginPath();g.ellipse(a.x,a.y-8,115,70,0,0,Math.PI*2);g.stroke();g.setLineDash?.([]);}
   if(a.burn>0){g.fillStyle='rgba(252,130,44,.64)';for(let i=0;i<4;i++){const x=a.x-42+i*26,amp=Math.sin(performance.now()*.01+i*2)*7;g.beginPath();g.ellipse(x,a.y-14+amp,7,15,Math.sin(i)*.4,0,Math.PI*2);g.fill();}}
   if(a.poison>0){g.fillStyle='rgba(209,88,214,.67)';for(let i=0;i<5;i++){const x=a.x-48+i*23,y=a.y-30-Math.sin(performance.now()*.004+i)*20;g.beginPath();g.arc(x,y,4,0,Math.PI*2);g.fill();}}
   if(a.root>0){g.strokeStyle='#bcf5ff';g.lineWidth=3;g.beginPath();g.ellipse(a.x,a.y+28,70,18,0,0,Math.PI*2);g.stroke();}
   if(a.sporeSlow>0){g.fillStyle='rgba(183,105,245,.3)';g.beginPath();g.ellipse(a.x,a.y+25,71,23,0,0,Math.PI*2);g.fill();}
   const anim=a.attackAnim||0;
   if(a.id>=4&&anim>0){
     const power=Math.sin(Math.PI*(1-anim/(a.attackMax||38)));
     g.translate(a.x,a.y);if(a.face<0)g.scale(-1,1);
     g.globalAlpha=Math.max(.01,power);
     g.shadowBlur=15;
     if(a.id===4){
       g.strokeStyle='#ffb34c';g.shadowColor='#ff9338';g.lineWidth=12;
       g.beginPath();g.moveTo(54,-22);g.quadraticCurveTo(103,-36,145,-23);g.stroke();
       for(let i=0;i<5;i++){g.fillStyle='#ffd477';g.beginPath();g.arc(93+i*12,-19+Math.sin(i*2)*13,4+i%3,0,Math.PI*2);g.fill();}
     }else if(a.id===5){
       g.strokeStyle='#ffbff0';g.shadowColor='#ff7de0';g.lineWidth=9;
       for(let i=0;i<2;i++){g.beginPath();g.arc(35,-32,45+i*13,-1.3,1.0);g.stroke();}
     }else if(a.id===6){
       g.strokeStyle='#f5578a';g.shadowColor='#f64b8d';g.lineWidth=8;
       g.beginPath();g.moveTo(30,-12);g.lineTo(110,-22);g.stroke();
       for(let i=0;i<7;i++){g.fillStyle='#db7af1';g.beginPath();g.arc(53+i*12,-18+Math.sin(i*3)*12,3,0,Math.PI*2);g.fill();}
     }else if(a.id===7){
       g.strokeStyle='#9ef2fa';g.shadowColor='#6fd2f4';g.lineWidth=8;
       for(const shift of [-18,18]){g.beginPath();g.moveTo(26,shift);g.quadraticCurveTo(86,shift*1.7,110,shift*.5);g.stroke();}
     }
   }
   g.restore();
 };
})();
