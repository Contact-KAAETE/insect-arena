/* INSECT ARENA 1.6A — terrain gameplay: exact geometry for every prop.
 * Physical collision, light/hard cover, realistic surface slowdown and bot routing.
 * Zero external dependencies; original WebRTC PvP remains completely untouched.
 */
(()=>{
'use strict';
const Z=window.iaTerrain16Zones,art=window.iaTerrain16Art;
if(!Z||!art)throw new Error('INSECT ARENA: terrain data or art missing');
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),hypot=Math.hypot;
const world=()=>window.iaWorldSelected?.()||'forest';
const solo=()=>!window.iaDuelRole;
const duelTerrain=()=>!!window.iaDuelRole&&!!window.iaDuelObstacles;   // 2.6A: obstacles also in online duels, when both phones support them
const active=()=>(solo()||duelTerrain())&&playing&&!paused&&!window.iaCountdownActive&&
 !window.iaAdventure14?.isTutorialActive?.(); // Existing four-step tutorial must stay unchanged.
const props=()=>Z[world()]?.props||[];
let blockedHits=0,lightHits=0,collisions=0,detours=0;
const pointSegment=(p,a,b)=>{
 const dx=b[0]-a[0],dy=b[1]-a[1],den=dx*dx+dy*dy||1;
 const t=clamp(((p[0]-a[0])*dx+(p[1]-a[1])*dy)/den,0,1);
 const x=a[0]+t*dx,y=a[1]+t*dy;
 return {x,y,d:hypot(p[0]-x,p[1]-y),t};
};
function closest(p,obj){
 const dx=p.x-obj.x,dy=p.y-obj.y;
 if(obj.points){
  let best={d:Infinity,x:obj.x,y:obj.y,r:obj.width};
  for(let i=0;i<obj.points.length-1;i++){
   const a=obj.points[i],b=obj.points[i+1];
   const q=pointSegment([dx,dy],a,b);
   if(q.d<best.d)best={d:q.d,x:obj.x+q.x,y:obj.y+q.y,r:obj.width};
  }
  return best;
 }
 if(obj.rx&&obj.ry){
  const rx=obj.rx,ry=obj.ry;
  const r=Math.hypot(dx/rx,dy/ry)||.0001;
  const inv=1/r;
  const ex=obj.x+dx*inv,ey=obj.y+dy*inv;
  // Signed elliptical distance: negative means inside the actual rock footprint.
  const d=(r-1)*Math.min(rx,ry);
  return {d,x:ex,y:ey,r:0};
 }
 const footprint=obj.solid&&obj.kind==='mushroom'?obj.r*.40:obj.r*.66;
 const d=hypot(dx,dy);
 return {d:d-footprint,x:obj.x+(dx/(d||1))*footprint,
  y:obj.y+(dy/(d||1))*footprint,r:0};
}
function distanceToSolid(p,obj){
 const hit=closest(p,obj);
 return obj.points?hit.d-hit.r:hit.d;
}
function inSolid(p,r=12){
 return props().some(o=>o.solid&&distanceToSolid(p,o)<r);
}
const insideSlow=(p,o)=>{
 if(!o.slow)return false;
 const hit=closest(p,o);
 return o.points?hit.d<=Math.max(o.width*1.8,13):
  o.rx?((p.x-o.x)**2/(o.rx+10)**2+(p.y-o.y)**2/(o.ry+8)**2)<1:
  hypot(p.x-o.x,(p.y-o.y)*1.8)<o.r*.93;
};
function danger(p){
 const w=world();
 if(w==='red'){
  for(const h of [{x:302,y:374,r:59},{x:550,y:419,r:64},{x:511,y:274,r:44}]){
   if(hypot(p.x-h.x,(p.y-h.y)*1.5)<h.r+8)return 160;
  }
 }
 if(w==='dew'){
  for(const h of [{x:320,y:418,rx:136,ry:43},{x:655,y:474,rx:176,ry:47},
   {x:498,y:303,rx:86,ry:29}]){
   if(((p.x-h.x)/h.rx)**2+((p.y-h.y)/h.ry)**2<1)return 35;
  }
 }
 return 0;
}
function collisionResolve(from,u){
 const r=11;let hit=false;
 // Never mutate objects on the network: only run after local solo simulation.
 let x=clamp(u.x,85,815),y=clamp(u.y,175,482);
 for(let pass=0;pass<4;pass++){
  let changed=false;
  for(const o of props()){
   if(!o.solid)continue;
   const q=closest({x,y},o),desired=r+(o.points?q.r:0);
   if(q.d>=desired)continue;
   let dx=x-q.x,dy=y-q.y,len=hypot(dx,dy);
   // If the creature is exactly in the middle of a root, use its normal.
   // Without this, a zero-distance collision would never resolve.
   if(len<.001&&o.points){
    const a=o.points[0],b=o.points[o.points.length-1];
    dx=-(b[1]-a[1]);dy=b[0]-a[0];len=hypot(dx,dy);
   }
   if(len<.001){dx=1;dy=0;len=1}
   // For a rock the foot's signed elliptic distance already includes the rock.
   if(!o.points){
    const x0=x-o.x,y0=y-o.y,old=hypot(x0,y0);
    if(o.rx){
     const outside=1+(r+1)/Math.min(o.rx,o.ry);
     if(old<.001){x=o.x+o.rx*outside;y=o.y}
     else{
      const ratio=Math.sqrt((x0/o.rx)**2+(y0/o.ry)**2)||.0001;
      x=o.x+x0*outside/ratio;y=o.y+y0*outside/ratio;
     }
    }else{
     const rad=o.solid&&o.kind==='mushroom'?o.r*.40:o.r*.66;
     if(old<.001){x=o.x+rad+r+1;y=o.y}
     else{x=o.x+x0/old*(rad+r+1);y=o.y+y0/old*(rad+r+1)}
    }
   }else{
    x=q.x+dx/len*(desired+1.2);
    y=q.y+dy/len*(desired+1.2);
   }
   x=clamp(x,85,815);y=clamp(y,175,482);
   changed=true;hit=true;
  }
  if(!changed)break;
 }
 if(hit)collisions++;
 u.x=x;u.y=y;return hit;
}
function lineCoverage(a,t,obj){
 const ax=a.x,ay=a.y,bx=t.x,by=t.y;
 const steps=18;
 for(let i=2;i<=steps-2;i++){
  const f=i/steps,p={x:ax+(bx-ax)*f,y:ay+(by-ay)*f};
  if(obj.points){
   if(distanceToSolid(p,obj)<(obj.cover==='hard'?4:10))return true;
  }else if(obj.rx){
   const q=((p.x-obj.x)/(obj.rx*.95))**2+((p.y-obj.y)/(obj.ry*.90))**2;
   if(q<1)return true;
  }else if(hypot(p.x-obj.x,(p.y-obj.y)*1.30)<obj.r*(obj.kind==='mushroom'?.54:.78))return true;
 }
 return false;
}
function coverType(a,t){
 if(!a||!t||(!solo()&&!duelTerrain()))return null;
 let light=false;
 for(const o of props()){
  if(!o.cover)continue;
  if(!lineCoverage(a,t,o))continue;
  if(o.cover==='hard')return 'hard';
  if(o.cover==='light')light=true;
 }
 return light?'light':null;
}
window.iaTerrain16BlocksAttack=(a,t,special=false)=>coverType(a,t)==='hard';
// Replace old comic props in ALL six worlds with one cached realistic layer.
// The stage still uses the existing photograph and the same fighter sprites.
const prevCover=window.ia15CoverNodes;
window.ia15CoverNodes=(id)=>Z[id]?.props||prevCover?.(id)||null;
const oldPainter=window.ia15PaintObstacle;
window.ia15PaintObstacle=(node,ctx)=>{
 const list=props();
 if(list.includes(node)){
  if(node===list[0]){
   const layer=art.cache(world());
   if(layer)ctx.drawImage(layer,0,0,c.width,c.height);
  }
  return true; // suppress the earlier flat ellipse/sausage prop art
 }
 return oldPainter?.(node,ctx)||false; // retain tutorial practice leaf
};
function glow(msg,where,color){
 if(!where)return;
 floaters.push({x:where.x,y:where.y-68,value:msg,life:32,color:color||'#eaf8c2'});
}
const oldAttack=attack;
attack=function(a,t,special=false){
 if(!active()||!a||!t)return oldAttack(a,t,special);
 const cover=coverType(a,t);
 // AOE / projectile specials stop at massive rock, root or mushroom trunks.
 // Defensive camouflage remains usable behind cover (fighter #5).
 if(special&&cover==='hard'&&a.id!==5&&a.cool<=0&&a.special<=0&&(a.charge||0)>=100){
  a.cool=18;a.attackAnim=19;a.attackMax=19;
  if(a===player)glow('ROTS / WORTEL BLOKKEERT',a,'#ffe9a3');
  else glow('GEDEKT!',t,'#c3f8ce');
  blockedHits++;
  return; // Charge retained; move around cover and use the special there.
 }
 // Light cover lowers ONLY basic strike damage; specials cut through foliage.
 const original=a.damage;
 if(cover==='light'&&!special){a.damage=Math.max(1,original*.72);lightHits++}
 try{return oldAttack(a,t,special)}finally{a.damage=original}
};
const oldPlayer=controlPlayer;
controlPlayer=function(dt){
 if(!active())return oldPlayer(dt);
 const before={x:player.x,y:player.y};
 const ret=oldPlayer(dt);
 collisionResolve(before,player);
 return ret;
};
function chooseDetour(u,target,dt){
 const speed=clamp((u.speed||3)*1.7*dt,3,12);
 const dx=target.x-u.x,dy=target.y-u.y,goal=Math.atan2(dy,dx);
 const directions=[0,.38,-.38,.75,-.75,1.20,-1.20,1.57,-1.57,2.2,-2.2,Math.PI];
 let best=null,bestScore=-Infinity;
 for(const offset of directions){
  const th=goal+offset,move={x:u.x+Math.cos(th)*speed,y:u.y+Math.sin(th)*speed};
  if(move.x<90||move.x>810||move.y<179||move.y>480||inSolid(move,12))continue;
  const progress=hypot(dx,dy)-hypot(target.x-move.x,target.y-move.y);
  const hazardCost=danger(move)*.085;
  const heading=Math.abs(offset)*.95;
  const coverBonus=u.hp<u.maxHp*.4&&coverType({x:move.x,y:move.y},target)==='hard'?1.7:0;
  const score=progress-hazardCost-heading+coverBonus;
  if(score>bestScore){bestScore=score;best=move}
 }
 return best;
}
const oldEnemy=controlEnemy;
controlEnemy=function(dt){
 if(!active()||!enemy||!player)return oldEnemy(dt);
 if(!solo()){   // human opponent in a duel: obstacles block, but never re-route or steer a person
  const f0={x:enemy.x,y:enemy.y},r0=oldEnemy(dt);
  if(window.iaDuelRole==='host')collisionResolve(f0,enemy);
  return r0;
 }
 const from={x:enemy.x,y:enemy.y},ret=oldEnemy(dt);
 const wanted={x:enemy.x,y:enemy.y};
 const moved=hypot(wanted.x-from.x,wanted.y-from.y);
 const wasBlocked=moved>.4&&inSolid(wanted,13);
 const newHazard=danger(wanted),oldHazard=danger(from);
 collisionResolve(from,enemy);
 // Route around stones AND around new hazards before entering a dangerous zone.
 // Low-health predators also favour a sheltered flanking position.
 const critical=enemy.hp>0&&enemy.maxHp>0&&enemy.hp/enemy.maxHp<.31;
 const reroute=(wasBlocked||newHazard>oldHazard||(critical&&coverType(enemy,player)!=='hard'));
 const committed=(enemy.ai?.phase==='windup'||enemy.ai?.phase==='attack');
 if(reroute&&moved>.4&&!committed&&enemy.hp>0){
  const candidate=chooseDetour(from,player,dt);
  if(candidate){
   enemy.x=candidate.x;enemy.y=candidate.y;
   collisionResolve(from,enemy);detours++;
  }
 }
 return ret;
};
const oldConfine=confine;
confine=function(u){
 oldConfine(u);
 if(!u||!active())return;
 const slow=props().filter(o=>insideSlow(u,o)).reduce((max,o)=>Math.max(max,o.slow||0),0);
 if(slow)u.slow=Math.max(u.slow||0,slow);
};
// Keep gameplay hints to 1 unobtrusive text element, only while actually behind cover.
const oldHUD=drawHUD;
drawHUD=function(...args){
 oldHUD(...args);
 if(!active()||!player||!enemy)return;
 if(coverType(enemy,player)==='hard'){
  g.save();g.fillStyle='#e1ecb4';g.shadowColor='#081609';g.shadowBlur=7;
  g.textAlign='center';g.font='800 11px system-ui';
  g.fillText('DEKKING',clamp(player.x,140,760),clamp(player.y-84,120,460));
  g.restore();
 }
};
window.iaTerrain16={
 version:'1.6A',currentWorld:world,
 objects:id=>Z[id]?.props||[],
 pointToObstacle:distanceToSolid,
 isSolid:p=>inSolid(p,11),
 resolve:collisionResolve,
 coverType,blocksAttack:window.iaTerrain16BlocksAttack,
 getStats:()=>({world:world(),collisionBlocks:collisions,blockedAttacks:blockedHits,
  softenedAttacks:lightHits,botDetours:detours,biome:Z[world()]?.name})
};
})();