/* INSECT ARENA 1.4A — first-fight tutorial, earned centipede, tactical cover.
 * Intentionally solo-only. Preserve the eight original fighters, WebRTC duel
 * transport, landscape joystick, stored victories and 1.3A tactical AI.
 */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const arena=$('arena-view'),stage=arena.querySelector('.canvasBox');
const tutorialGuide=document.createElement('div');
tutorialGuide.id='ia14-guide';tutorialGuide.hidden=true;
tutorialGuide.setAttribute('role','status');tutorialGuide.setAttribute('aria-live','polite');
arena.appendChild(tutorialGuide); // Show guide in the empty HUD row, never over the combatants.
const read=(key)=>{try{return localStorage.getItem(key)}catch(_){return null}};
const write=(key,value)=>{try{localStorage.setItem(key,value)}catch(_){}};
const unlocked=()=>read('ia14TutorialComplete')==='yes';
const solo=()=>!window.iaDuelRole;
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const presets={
 forest:[{x:420,y:360,r:56,kind:'leaf'},{x:655,y:415,r:43,kind:'leaf'},{x:520,y:255,r:42,kind:'log'}],
 fungus:[{x:392,y:369,r:48,kind:'mushroom'},{x:615,y:415,r:54,kind:'mushroom'},{x:525,y:278,r:37,kind:'leaf'}],
 roots:[{x:399,y:335,r:52,kind:'root'},{x:548,y:426,r:52,kind:'root'},{x:668,y:290,r:42,kind:'root'}]
};
let tutorial=null,blocked=0,combatFrames=0,lastFX=0;
const world=()=>window.iaWorldSelected?.()||'forest';
const nodes=()=>tutorial?.stage===2&&tutorial.cover?
 [tutorial.cover]:(window.ia15CoverNodes?.(world()) || presets[world()] || presets.forest);
const status=text=>{if(statusEl)statusEl.textContent=text};
function toast(text){
 const el=$('tactical-toast');if(!el)return;
 el.textContent=text;el.hidden=false;el.classList.add('visible');
 clearTimeout(toast.timer);
 toast.timer=setTimeout(()=>{el.classList.remove('visible');el.hidden=true},1300);
}
function syncUnlocks(){
 const lock=!unlocked();
 const fighter=document.querySelector('.fighterCard[data-fighter="8"]');
 if(fighter){fighter.disabled=lock;fighter.classList.toggle('ia14-locked',lock);fighter.title=lock?'Voltooi je eerste gevechtstraining om de duizendpoot te ontgrendelen.':'Ontgrendeld: reuzenduizendpoot';}
 const card=$('world-card-roots'),choice=document.querySelector('[data-choose-world="roots"]');
 if(card){card.classList.toggle('ia14-locked',lock);card.setAttribute('aria-disabled',String(lock));}
 if(choice){choice.disabled=lock;choice.title=lock?'Vrij te spelen na je tutorial':'Verken het worteldoolhof';}
 const rootButton=$('world-roots');
 if(rootButton)rootButton.disabled=lock;
 const footer=document.querySelector('.menuFooter span:last-child');
 if(footer)footer.textContent='1.5A · 13 VECHTERS · 6 WERELDEN';
}
function guide(){
 if(!tutorial){tutorialGuide.hidden=true;return}
 const t=tutorial,steps=[
  ['BEWEGEN','Beweeg een stukje met de joystick links.','Loop door de arena'],
  ['AANVALLEN','Zoek de gemarkeerde kever en raak hem 2× met AANVAL.','Raak: '+t.hits+' / 2'],
  ['DEKKING ZOEKEN','Loop naar het oplichtende blad: daar kun je schuilen.','Schuil onder het blad'],
  ['SPECIALE KRACHT','Loop naar de kever en tik op SPECIAL rechts.','Gebruik de zuuraanval']
 ];
 const [title,desc,goal]=steps[t.stage];
 tutorialGuide.innerHTML='<span class="ia14-step">TRAINING '+(t.stage+1)+'/4</span>'+
  '<strong>'+title+'</strong><p>'+desc+'</p><div class="ia14-current">'+goal+
  '</div><div class="ia14-progress">'+
  steps.map((_,i)=>'<i class="'+(i<=t.stage?'done':'')+'"></i>').join('')+'</div>';
 tutorialGuide.hidden=false;
 status('TRAINING · '+title+' · '+(t.stage+1)+'/4');
}
function placeEnemy(){
 if(!tutorial||!player||!enemy)return;
 // Larger space prevents overlap between the ant and the big beetle sprite.
 const shift=player.x>500?-175:175;
 enemy.x=clamp(player.x+shift,160,740);
 enemy.y=clamp(player.y,285,425);
 enemy.hp=enemy.maxHp;
 enemy.cool=0;
 enemy.charge=0;
}
function step(number){
 if(!tutorial)return;
 tutorial.stage=number;
 if(number===1){placeEnemy();tutorial.hits=0}
 if(number===2){
  const side=player.x>620?-105:105;
  tutorial.cover={x:clamp(player.x+side,150,750),y:clamp(player.y+24,210,475),r:64,kind:'leaf'};
  enemy.x=clamp(player.x+(side>0?220:-220),120,790);enemy.y=player.y;
 }
 if(number===3){
  tutorial.cover=null;placeEnemy();
  player.charge=100;player.special=0;player.cool=0;
  window.iaTactical?.update?.();
  toast('✦ SPECIAL OPGELADEN!');
 }
 guide();
}
function finish(){
 if(!tutorial)return;
 const before=tutorial;
 tutorial=null;playing=false;paused=false;
 tutorialGuide.hidden=true;
 window.iaMatchHUD?.stop();
 window.iaStopCountdown?.();
 write('ia14TutorialComplete','yes');
 window.iaSetWorld(before.priorWorld||'forest');
 fighterSel.value=String(before.priorFighter??0);
 syncUnlocks();
 const overlay=$('battle-overlay');
 $('overlay-title').textContent='TRAINING VOLTOOID!';
 $('overlay-desc').textContent='Je hebt bewegen, aanvallen, dekking en speciale krachten geleerd. BELONING: REUZENDUIZENDPOOT + WORTELDOOLHOF ONTGRENDELD!';
 const actions=$('overlay-buttons');actions.replaceChildren();
 const btn=document.createElement('button');btn.className='goldButton';
 btn.textContent='ONTDEK JE NIEUWE VECHTER';
 btn.addEventListener('click',()=>{
  overlay.hidden=true;
  window.iaUI?.open('select');
  window.iaUI?.refreshRoster();
  window.iaUI?.refreshWorldCards();
  syncUnlocks();
 });
 actions.appendChild(btn);
 overlay.hidden=false;
 toast('NIEUWE VECHTER VRIJGESPEELD!');
}
function startTutorial(){
 if(unlocked()||tutorial)return;
 const priorFighter=+fighterSel.value||0,priorWorld=world();
 fighterSel.value='0';window.iaSetWorld('forest');
 window.iaUI.beginBattle();
 window.iaStopCountdown?.();
 window.iaMatchHUD?.stop();
 player.hp=player.maxHp;player.charge=0;
 enemy=unit(2,735,320);enemy.maxHp=1200;enemy.hp=1200;enemy.damage=0;
 playing=true;paused=false;
 tutorial={stage:0,hits:0,initialX:player.x,initialY:player.y,
  priorFighter,priorWorld,cover:null};
 guide();
 window.iaPremiumRefresh?.();
}
for(const id of ['menu-play','menu-duel','launch-battle']){
 $(id)?.addEventListener('click',e=>{
  if(unlocked()||window.iaDuelRole)return;
  e.preventDefault();e.stopImmediatePropagation();
  startTutorial();
 },true);
}
$('world-roots')?.addEventListener('click',()=>{
 if(!unlocked())return;
 window.iaSetWorld('roots');
 window.iaUI?.refreshWorldCards();
 window.iaUI?.open('select');
 window.iaUI?.refreshRoster();
});
$('battle-menu')?.addEventListener('click',()=>{
 if(tutorial){tutorial=null;tutorialGuide.hidden=true;window.iaMatchHUD?.stop();}
});
const visibility=new MutationObserver(()=>{
 if(arena.hidden&&tutorial){tutorial=null;tutorialGuide.hidden=true;}
});
visibility.observe(arena,{attributes:true,attributeFilter:['hidden']});
const rosterObserver=new MutationObserver(()=>syncUnlocks());
rosterObserver.observe($('fighter-roster'),{childList:true});
syncUnlocks();
function covered(a,t){
 if(!a||!t)return false;
 const vx=t.x-a.x,vy=t.y-a.y,denom=vx*vx+vy*vy||1;
 for(const o of nodes()){
  const u=clamp(((o.x-a.x)*vx+(o.y-a.y)*vy)/denom,0,1);
  if(u<=.12||u>=.97)continue;
  const closestX=a.x+vx*u,closestY=a.y+vy*u;
  if(Math.hypot(closestX-o.x,closestY-o.y)<o.r*.62)return true;
 }
 return false;
}
const previousAttack=attack;
attack=function(a,t,special=false){
 if(!a||!t)return previousAttack(a,t,special);
 if(tutorial&&a===enemy)return; // Training opponent never hurts first-time players.
 const valid=solo()&&!tutorial&&playing&&!paused&&!window.iaCountdownActive;
 const dist=Math.hypot(a.x-t.x,a.y-t.y);
 if(valid&&!special&&a.cool<=0&&dist<=a.range&&covered(a,t)){
  a.cool=Math.max(a.cool,23);
  a.attackAnim=17;a.attackMax=17;
  a.attackSpecial=false;
  blocked++;
  if(performance.now()-lastFX>650){
   lastFX=performance.now();
   floaters.push({x:t.x,y:t.y-82,value:'DEKKING!',life:33,color:'#c8f9ac'});
  }
  return;
 }
 const hp=t.hp,priorCooldown=a.special||0;
 previousAttack(a,t,special);
 const damage=Math.max(0,hp-t.hp);
 if(tutorial&&a===player&&t===enemy){
  if(tutorial.stage===1&&damage>0&&!special){
   tutorial.hits++;
   if(tutorial.hits>=2)step(2);else guide();
  }else if(tutorial.stage===3&&special&&damage>0&&a.special>priorCooldown)finish();
 }
 if(valid&&a.id===8&&special&&damage>0){
  t.root=Math.max(t.root||0,105);
  t.poison=Math.max(t.poison||0,175);
  burst(t.x,t.y,'#b8ed75',28,4.5);
  floaters.push({x:t.x,y:t.y-92,value:'GIFGREEP!',life:42,color:'#deff94'});
 }
};
const previousReset=reset;
reset=function(...args){
 const outcome=previousReset(...args);
 if(solo()&&world()==='roots'&&!tutorial)
  status('WORTELDOOLHOF · Gebruik wortels als schuilplek · Overwinningen: '+wins);
 return outcome;
};
const previousEnemy=controlEnemy;
controlEnemy=function(dt){
 if(tutorial)return;
 return previousEnemy(dt);
};
const previousConfine=confine;
confine=function(u){
 previousConfine(u);
 if(!u||!playing||paused||window.iaCountdownActive||!solo())return;
 if(world()==='roots'&&!tutorial){
  for(const o of presets.roots){
   if(Math.hypot(u.x-o.x,u.y-o.y)<o.r+12){
    u.slow=Math.max(u.slow||0,12); // Roots cost speed; never trap AI pathfinding.
   }
  }
 }
};
function leaf(o,glowing=false){
 const {x,y,r}=o;
 g.save();g.translate(x,y);
 g.fillStyle='#091b0ba8';g.beginPath();g.ellipse(3,19,r*.93,r*.3,0,0,Math.PI*2);g.fill();
 for(const side of [-1,1]){
  g.rotate(side*.04);
  const fill=g.createLinearGradient(-r,-r,r,r);
  fill.addColorStop(0,glowing?'#8ffbb4':'#1c6e43');
  fill.addColorStop(.5,glowing?'#58b777':'#26764d');
  fill.addColorStop(1,'#153a22');
  g.fillStyle=fill;g.strokeStyle=glowing?'#c4ffac':'#5aa06c';
  g.lineWidth=glowing?3:1.5;
  g.beginPath();g.moveTo(-r*.8,0);
  g.quadraticCurveTo(-r*.26,-r*.52*side,r*.82,-r*.2*side);
  g.quadraticCurveTo(r*.32,r*.35*side,-r*.8,0);g.fill();g.stroke();
  g.strokeStyle='#c6efa16b';g.lineWidth=2;g.beginPath();g.moveTo(-r*.75,0);g.lineTo(r*.69,-r*.13*side);g.stroke();
 }
 if(glowing){
  g.strokeStyle='#e6fe9c';g.lineWidth=3;g.setLineDash([9,8]);
  g.beginPath();g.ellipse(0,0,r+17,r*.8+12,0,0,Math.PI*2);g.stroke();g.setLineDash([]);
  g.fillStyle='#f8ffbd';g.font='bold 19px system-ui';g.textAlign='center';g.fillText('SCHUIL HIER',0,-r-22);
 }
 g.restore();
}
function root(o){
 const {x,y,r}=o;
 g.save();g.translate(x,y);
 g.strokeStyle='#120d08cc';g.lineWidth=r*.75;g.lineCap='round';
 g.beginPath();g.moveTo(-r,-r*.8);g.bezierCurveTo(-r*.6,r*.8,r*.2,-r*.4,r,r*.95);g.stroke();
 g.strokeStyle='#6d4528';g.lineWidth=r*.62;g.stroke();
 g.strokeStyle='#bd8951aa';g.lineWidth=r*.12;g.stroke();
 g.strokeStyle='#281a12';
 for(let i=-2;i<=2;i++){
  g.lineWidth=2;g.beginPath();g.moveTo(-r*.62+i*10,-r*.47);g.lineTo(-r*.32+i*9,r*.4);g.stroke();
 }
 g.restore();
}
function mushroom(o){
 const {x,y,r}=o;g.save();g.translate(x,y);
 const radial=g.createRadialGradient(0,10,1,0,10,r*1.1);
 radial.addColorStop(0,'#bc8dff77');radial.addColorStop(1,'#9a55ff00');
 g.fillStyle=radial;g.beginPath();g.arc(0,10,r*1.1,0,Math.PI*2);g.fill();
 g.fillStyle='#d4b0bd';g.beginPath();g.moveTo(-9,6);g.lineTo(-13,40);g.quadraticCurveTo(0,46,13,40);g.lineTo(9,6);g.fill();
 const cap=g.createLinearGradient(0,-r*.7,0,15);
 cap.addColorStop(0,'#c379e6');cap.addColorStop(1,'#402c5a');
 g.fillStyle=cap;g.strokeStyle='#dfa8ed';g.lineWidth=2;
 g.beginPath();g.ellipse(0,10,r*.9,r*.58,0,Math.PI,Math.PI*2);
 g.quadraticCurveTo(0,22,-r*.9,10);g.fill();g.stroke();
 if(!window.iaReducedEffects)for(let i=0;i<6;i++){
  const a=i*1.8+performance.now()*.0008;
  g.fillStyle='#d5b1ff77';g.beginPath();
  g.arc(Math.cos(a)*r*.72,Math.sin(a*1.3)*r*.6-12,2.2,0,Math.PI*2);g.fill();
 }
 g.restore();
}
const previousArena=drawArena;
drawArena=function(ts){
 previousArena(ts);
 if(!solo())return; // Online stays visually identical to the networked 1.3A arenas.
 const current=world();
 // The pulsing rings are under both animals (not covering the sprites).
 if(tutorial&&enemy&&player){
  for(const [u,color] of [[player,'#c3f6a4'],[enemy,'#ffe18c']]){
   g.save();g.strokeStyle=color;g.lineWidth=4;g.setLineDash([9,7]);
   g.shadowColor=color;g.shadowBlur=13;
   g.beginPath();g.ellipse(u.x,u.y+27,72,22,0,0,Math.PI*2);g.stroke();
   g.restore();
  }
 }
 for(const node of nodes()){
  if(window.ia15PaintObstacle?.(node,g))continue;
  if(node.kind==='mushroom')mushroom(node);
  else if(node.kind==='root'||node.kind==='log')root(node);
  else leaf(node,Boolean(tutorial&&node===tutorial.cover));
 }
 if(!tutorial||!playing||paused)return;
 if(tutorial.stage===0&&player&&
   Math.hypot(player.x-tutorial.initialX,player.y-tutorial.initialY)>=110)step(1);
 if(tutorial?.stage===2&&tutorial.cover&&player&&
   Math.hypot(player.x-tutorial.cover.x,player.y-tutorial.cover.y)<tutorial.cover.r*.67)step(3);
 combatFrames++;
};
const previousDrawInsect=drawInsect;
drawInsect=function(u){
 previousDrawInsect(u);
 // Permanent identification for the tutorial opponent.
 if(tutorial&&u===enemy&&!arena.hidden){
  g.save();
  const x=clamp(u.x,135,765),y=clamp(u.y-125,93,360);
  g.shadowColor='#000b';g.shadowBlur=8;
  g.fillStyle='rgba(8,34,23,.90)';
  g.strokeStyle='#ffd66f';g.lineWidth=2;
  g.beginPath();g.roundRect(x-85,y-16,170,32,10);g.fill();g.stroke();
  g.shadowBlur=0;g.textAlign='center';g.fillStyle='#ffe6a9';
  g.font='900 15px system-ui';
  g.fillText('▼ TEGENSTANDER ▼',x,y+6);
  g.restore();
 }
 if(!u||u.id!==8||!u.attackAnim||window.iaReducedEffects)return;
 const t=performance.now()*.009,progress=1-(u.attackAnim||0)/Math.max(1,u.attackMax||26);
 g.save();g.globalAlpha=Math.max(0,Math.sin(progress*Math.PI));
 g.strokeStyle='#c3f17f';g.shadowColor='#aaff6a';g.shadowBlur=24;g.lineWidth=7;
 g.beginPath();g.ellipse(u.x+u.face*58,u.y-18,22+progress*75,11+progress*27,0,0,Math.PI*2);g.stroke();
 for(let j=0;j<10;j++){
  const xx=u.x+u.face*(34+j*15),yy=u.y-25+Math.sin(t+j*1.9)*12;
  g.fillStyle=j%2?'#f6d56d':'#aaff5b';
  g.beginPath();g.arc(xx,yy,2.5+(j%3),0,Math.PI*2);g.fill();
 }
 g.restore();
};
window.iaAdventure14={
 version:'1.4A',isTutorialComplete:unlocked,isTutorialActive:()=>Boolean(tutorial),
 battleInfo:()=>({world:world(),coverBlocks:blocked,trainingStep:tutorial?.stage??null,
  soloTimer:window.iaMatchHUD?.getState()?.remaining||0}),
 restartTutorial:()=>{if(tutorial)return;startTutorial()}
};
})();
