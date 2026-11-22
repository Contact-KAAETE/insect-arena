/* INSECT ARENA 1.6A — procedural naturalistic, cached terrain art.
 * No external image service or fonts. A textured shaded ribbon replaces flat
 * cartoon roots. All positions derive from the very same object as collision.
 * Rendering is cached once per world to keep landscape Safari fast.
 */
(()=>{
'use strict';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const seed=id=>{let h=2166136261;for(let i=0;i<id.length;i++)h=Math.imul(h^id.charCodeAt(i),16777619);return h>>>0};
const generator=s=>()=>{s=(Math.imul(1664525,s)+1013904223)>>>0;return s/4294967296};
const TAU=Math.PI*2;
const curve=(p)=>{
 const out=[];
 for(let i=0;i<p.length-1;i++){
  const p0=p[Math.max(0,i-1)],p1=p[i],p2=p[i+1],p3=p[Math.min(p.length-1,i+2)];
  for(let k=0;k<9;k++){
   const t=k/9,t2=t*t,t3=t2*t;
   out.push([
    .5*((2*p1[0])+(-p0[0]+p2[0])*t+(2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*t2+(-p0[0]+3*p1[0]-3*p2[0]+p3[0])*t3),
    .5*((2*p1[1])+(-p0[1]+p2[1])*t+(2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*t2+(-p0[1]+3*p1[1]-3*p2[1]+p3[1])*t3)
   ]);
  }
 }
 out.push([...p[p.length-1]]);
 return out;
};
function ribbon(ctx,path,width,phase=0){
 const side=[[],[]];
 for(let i=0;i<path.length;i++){
  const prev=path[Math.max(0,i-1)],next=path[Math.min(path.length-1,i+1)];
  const dx=next[0]-prev[0],dy=next[1]-prev[1],len=Math.hypot(dx,dy)||1;
  const t=i/(path.length-1);
  const taper=.61+.36*Math.sin(Math.PI*t)+.08*Math.sin(i*2.2+phase);
  const w=width*taper,px=-dy/len,py=dx/len;
  side[0].push([path[i][0]+px*w,path[i][1]+py*w]);
  side[1].push([path[i][0]-px*w,path[i][1]-py*w]);
 }
 ctx.beginPath();
 for(let j=0;j<side[0].length;j++){
  const p=side[0][j];if(j===0)ctx.moveTo(p[0],p[1]);else ctx.lineTo(p[0],p[1]);
 }
 for(let j=side[1].length-1;j>=0;j--){const p=side[1][j];ctx.lineTo(p[0],p[1])}
 ctx.closePath();
}
function soil(ctx,obj,rx,ry,color='#0b100b'){
 ctx.save();ctx.translate(obj.x,obj.y);ctx.rotate(obj.rotation||0);
 ctx.fillStyle=color;ctx.shadowColor='#000d';ctx.shadowBlur=15;
 ctx.beginPath();ctx.ellipse(3,10,rx,ry,0,0,TAU);ctx.fill();ctx.restore();
}
function bark(ctx,obj){
 const rnd=generator(seed(obj.id));
 const points=curve(obj.points),width=obj.width;
 const dark=obj.kind==='log'?'#251b16':'#261e16';
 const main=obj.kind==='log'?'#63513a':'#725c42';
 const warm=obj.kind==='log'?'#947e5c':'#a08765';
 ctx.save();ctx.translate(obj.x,obj.y);
 // Broad, soft soil-stained contact shadow: not an unconnected flat polygon.
 ctx.save();ctx.translate(4,8);ctx.fillStyle='#080d08b6';
 ctx.shadowColor='#000c';ctx.shadowBlur=18;ribbon(ctx,points,width*1.29,2);ctx.fill();ctx.restore();
 ribbon(ctx,points,width);
 const grad=ctx.createLinearGradient(0,-width*2,5,width*2);
 grad.addColorStop(0,dark);grad.addColorStop(.19,warm);
 grad.addColorStop(.43,main);grad.addColorStop(.73,'#493525');
 grad.addColorStop(1,'#201d16');ctx.fillStyle=grad;ctx.fill();
 ctx.save();ctx.clip();
 // Embossed ridges follow the curvature, not identical parallel sausages.
 for(let line=0;line<16;line++){
  const offset=-width*.83+line*(width*1.67/15);
  ctx.beginPath();
  for(let i=0;i<points.length;i++){
   const p=points[i],prev=points[Math.max(0,i-1)],next=points[Math.min(points.length-1,i+1)];
   const dx=next[0]-prev[0],dy=next[1]-prev[1],len=Math.hypot(dx,dy)||1;
   const bend=offset+Math.sin(i*.36+line*1.5)*1.4;
   const x=p[0]-dy/len*bend,y=p[1]+dx/len*bend;
   if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
  }
  ctx.lineWidth=line%3===0?2.1:.65;
  ctx.strokeStyle=line%4===0?'#17150e9e':line%3===0?'#d0b3876f':'#b08c5f66';
  ctx.stroke();
 }
 // Close-grain fissures, lichen and specks integrate the bark into the photo.
 for(let i=0;i<280;i++){
  const idx=Math.floor(rnd()*points.length),pt=points[idx];
  const nx=(rnd()-.5)*width*1.6,ny=(rnd()-.5)*width*1.5;
  const r=.3+rnd()*2;
  const c=rnd();ctx.fillStyle=c<.3?'#211d139c':c<.65?'#dac18b6e':c<.88?'#386f366e':'#76955c9f';
  ctx.beginPath();ctx.ellipse(pt[0]+nx,pt[1]+ny,r*1.6,r*.62,rnd()*Math.PI,0,TAU);ctx.fill();
 }
 ctx.restore();
 // Woven rootlets taper directly into the soil.
 for(let k=1;k<points.length-2;k+=11){
  if(rnd()>.50)continue;
  const p=points[k],other=points[Math.min(points.length-1,k+2)],dx=other[0]-p[0],dy=other[1]-p[1],l=Math.hypot(dx,dy)||1,side=rnd()<.5?-1:1;
  const ox=-dy/l*side,oy=dx/l*side,extent=width*(1.05+rnd()*.9);
  const sx=p[0]+ox*width*.55,sy=p[1]+oy*width*.55;
  ctx.beginPath();ctx.moveTo(sx,sy);ctx.quadraticCurveTo(sx+ox*extent*.75+8,sy+oy*extent*.6,sx+ox*extent*1.55,sy+oy*extent);
  ctx.strokeStyle='#423122';ctx.lineWidth=1.2+rnd()*2.4;ctx.lineCap='round';ctx.stroke();
 }
 // Moss pockets along the shaded upper bank, not uniform neon decoration.
 for(let i=0;i<24;i++){
  const j=Math.floor(rnd()*points.length),pt=points[j],x=pt[0]+(rnd()-.5)*width*.9,y=pt[1]-width*.66+rnd()*4;
  ctx.fillStyle=rnd()<.5?'#346137b8':'#7596509e';
  for(let b=0;b<5;b++){ctx.beginPath();ctx.ellipse(x+rnd()*7,y+rnd()*5,1+rnd()*3,.5+rnd()*1.2,rnd()*3,0,TAU);ctx.fill()}
 }
 ctx.restore();
}
function leafShape(ctx,scale,variant=0){
 ctx.beginPath();
 ctx.moveTo(-scale*.95,0);
 ctx.bezierCurveTo(-scale*.45,-scale*.45,scale*.23,-scale*(.8+variant*.08),scale,0);
 ctx.bezierCurveTo(scale*.20,scale*.3,-scale*.50,scale*.5,-scale*.95,0);
 ctx.closePath();
}
function leaves(ctx,obj,rnd){
 soil(ctx,obj,obj.r*.85,obj.r*.26,'#18250e75');
 ctx.save();ctx.translate(obj.x,obj.y);
 for(let i=0;i<13;i++){
  const x=(rnd()-.5)*obj.r*2.2,y=(rnd()-.5)*obj.r*.9,angle=rnd()*TAU;
  const sz=obj.r*(.35+rnd()*.47);
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);
  ctx.fillStyle='#0005';ctx.shadowColor='#0009';ctx.shadowBlur=5;
  ctx.save();ctx.translate(2,4);leafShape(ctx,sz);ctx.fill();ctx.restore();
  const grad=ctx.createLinearGradient(-sz,-sz,sz,sz);
  const palette=i%3===0?['#967044','#684b2d','#2d251a']:i%3===1?
   ['#708e4b','#38562c','#27351e']:['#b69c5d','#685635','#35321e'];
  grad.addColorStop(0,palette[0]);grad.addColorStop(.55,palette[1]);grad.addColorStop(1,palette[2]);
  ctx.fillStyle=grad;ctx.strokeStyle='#d9b9763a';ctx.lineWidth=.8;
  leafShape(ctx,sz,rnd());ctx.fill();ctx.stroke();
  ctx.shadowBlur=0;
  ctx.strokeStyle='#d2d6a063';ctx.lineWidth=.85;
  ctx.beginPath();ctx.moveTo(-sz*.89,0);ctx.quadraticCurveTo(sz*.18,-sz*.05,sz*.87,-sz*.02);ctx.stroke();
  for(let k=1;k<=3;k++){
   const pos=-sz*.70+k*sz*.31;
   ctx.beginPath();ctx.moveTo(pos,0);ctx.lineTo(pos+sz*.23,-sz*.20);ctx.stroke();
   ctx.beginPath();ctx.moveTo(pos,.7);ctx.lineTo(pos+sz*.23,sz*.15);ctx.stroke();
  }
  ctx.restore();
 }
 ctx.restore();
}
function rock(ctx,obj,rnd){
 const basalt=obj.kind==='slag';
 soil(ctx,obj,obj.rx*1.08,obj.ry*.53,basalt?'#180d0caa':'#12140c90');
 ctx.save();ctx.translate(obj.x,obj.y);
 const rx=obj.rx,ry=obj.ry;
 const p=[
  [-rx*.95,ry*.27],[-rx*.88,-ry*.33],[-rx*.37,-ry*.98],
  [rx*.28,-ry*1.07],[rx*.89,-ry*.38],[rx,ry*.36],
  [rx*.42,ry*.67],[-rx*.70,ry*.59]
 ];
 const path=()=>{ctx.beginPath();p.forEach((v,i)=>i?ctx.lineTo(...v):ctx.moveTo(...v));ctx.closePath()};
 ctx.save();ctx.shadowColor='#000d';ctx.shadowBlur=11;
 const color=ctx.createLinearGradient(-rx,-ry,rx,ry);
 color.addColorStop(0,basalt?'#958070':'#b0b3a1');
 color.addColorStop(.35,basalt?'#55504a':'#73796c');
 color.addColorStop(1,basalt?'#201f23':'#303b35');
 ctx.fillStyle=color;path();ctx.fill();ctx.restore();
 ctx.save();path();ctx.clip();
 ctx.fillStyle=basalt?'#8b766a77':'#c6c9ba7a';
 ctx.beginPath();ctx.moveTo(-rx*.88,-ry*.3);ctx.lineTo(-rx*.37,-ry*.98);ctx.lineTo(rx*.28,-ry*1.07);
 ctx.lineTo(rx*.16,-ry*.24);ctx.lineTo(-rx*.22,ry*.1);ctx.closePath();ctx.fill();
 ctx.fillStyle=basalt?'#2b262a9e':'#414d479c';
 ctx.beginPath();ctx.moveTo(rx*.16,-ry*.24);ctx.lineTo(rx*.89,-ry*.38);ctx.lineTo(rx,ry*.36);ctx.lineTo(rx*.42,ry*.67);ctx.closePath();ctx.fill();
 for(let i=0;i<190;i++){
  const x=(rnd()*2-1)*rx,y=(rnd()*2-1)*ry,s=.35+rnd()*1.8;
  ctx.fillStyle=rnd()<.45?'#ece8d777':basalt?'#271c1caa':'#283a2a98';
  ctx.fillRect(x,y,s*2,s);
 }
 ctx.lineWidth=1.7;ctx.strokeStyle=basalt?'#dcb6a34f':'#dddac468';
 ctx.beginPath();ctx.moveTo(-rx*.61,-ry*.51);ctx.lineTo(-rx*.19,-ry*.07);
 ctx.lineTo(-rx*.01,ry*.39);ctx.moveTo(rx*.18,-ry*.79);
 ctx.lineTo(rx*.12,-ry*.26);ctx.lineTo(rx*.62,ry*.06);ctx.stroke();
 for(let i=0;i<10;i++)if(rnd()>.35){
  ctx.fillStyle='#66834d9e';ctx.beginPath();
  ctx.ellipse((rnd()-.5)*rx,ry*(rnd()-.5),rnd()*4+1,rnd()*2+1,rnd()*4,0,TAU);ctx.fill();
 }
 ctx.restore();ctx.restore();
}
function foliage(ctx,obj,rnd,dry=false,reeds=false){
 soil(ctx,obj,obj.r*.75,obj.r*.29,dry?'#1a110e7d':'#0e241780');
 ctx.save();ctx.translate(obj.x,obj.y);const r=obj.r;
 const count=reeds?15:dry?13:25;
 for(let i=0;i<count;i++){
  const ox=(rnd()-.5)*r*1.55,oy=(rnd()-.5)*r*.38;
  const height=reeds?r*(.7+rnd()*1.9):r*(.5+rnd()*1.3);
  const lean=(rnd()-.5)*r*1.15;
  const by=oy+r*.33;
  ctx.strokeStyle=dry?'#4c3325':reeds?'#274d3e':'#294b26';
  ctx.lineWidth=reeds?2.5+rnd()*2.8:1.7+rnd()*1.8;
  ctx.lineCap='round';ctx.beginPath();ctx.moveTo(ox,by);
  ctx.quadraticCurveTo(ox+lean*.4,by-height*.7,ox+lean,by-height);ctx.stroke();
  if(reeds){
   ctx.strokeStyle='#80ac84a9';ctx.lineWidth=.9;
   ctx.stroke();
   if(i%3===0){
    ctx.fillStyle='#b8a279';ctx.beginPath();
    ctx.ellipse(ox+lean,by-height,2.8,9+rnd()*6,-.11,0,TAU);ctx.fill();
   }
  }else{
   for(let l=0;l<3;l++){
    const tx=ox+lean*(.25+l*.24),ty=by-height*(.25+l*.24);
    const sz=r*(.21+rnd()*.19);
    ctx.save();ctx.translate(tx,ty);
    ctx.rotate((rnd()-.5)*TAU*.8);
    const grad=ctx.createLinearGradient(-sz,-sz,sz,sz);
    if(dry){grad.addColorStop(0,'#b48b56');grad.addColorStop(1,'#2e2822')}
    else{grad.addColorStop(0,'#8bb46a');grad.addColorStop(.5,'#477544');grad.addColorStop(1,'#1c402f')}
    ctx.fillStyle=grad;leafShape(ctx,sz,rnd());ctx.fill();ctx.restore();
   }
  }
 }
 ctx.restore();
}
function fungal(ctx,obj,rnd){
 soil(ctx,obj,obj.r*.88,obj.r*.30,'#17122175');
 ctx.save();ctx.translate(obj.x,obj.y);
 const r=obj.r,stem=r*.19;
 ctx.fillStyle='#927f79';ctx.shadowColor='#11080fa8';ctx.shadowBlur=8;
 ctx.beginPath();ctx.moveTo(-stem,r*.28);ctx.bezierCurveTo(-stem*.9,-r*.5,stem*.9,-r*.2,stem,-r*.62);
 ctx.lineTo(stem*1.12,r*.3);ctx.closePath();ctx.fill();
 ctx.fillStyle='#b9a6a399';ctx.beginPath();ctx.ellipse(0,r*.3,r*.24,r*.1,0,0,TAU);ctx.fill();
 const cap=ctx.createLinearGradient(0,-r*1.4,0,r*.15);
 cap.addColorStop(0,'#d5be9d');cap.addColorStop(.35,'#ad7766');
 cap.addColorStop(.8,'#644644');cap.addColorStop(1,'#352d35');
 ctx.fillStyle=cap;ctx.strokeStyle='#e6baa27c';ctx.lineWidth=2;
 ctx.beginPath();ctx.moveTo(-r*.92,-r*.65);ctx.bezierCurveTo(-r*.7,-r*1.55,r*.72,-r*1.48,r,-r*.65);
 ctx.quadraticCurveTo(r*.2,-r*.35,-r*.92,-r*.65);ctx.fill();ctx.stroke();
 ctx.strokeStyle='#eed6c074';ctx.lineWidth=1.1;
 for(let i=0;i<13;i++){
  const px=-r*.76+i*(r*1.5/12);
  ctx.beginPath();ctx.moveTo(px,-r*.62);ctx.lineTo(px*.4,-r*.46);ctx.stroke();
 }
 for(let i=0;i<25;i++){ctx.fillStyle=rnd()<.5?'#eadbb566':'#442e3277';
  ctx.beginPath();ctx.ellipse((rnd()-.5)*r*1.5,-r*(.75+rnd()*.40),rnd()*2+1,rnd()*1.4+1,0,0,TAU);ctx.fill();
 }
 ctx.restore();
}
function ground(ctx,obj,rnd){
 ctx.save();ctx.translate(obj.x,obj.y);
 const r=obj.r,t=obj.kind;
 const col=t==='ash'?'#3d2925':t==='mud'?'#4d3c2d':t==='mycelium'?'#5f5477':'#2c5736';
 ctx.fillStyle=col+'99';ctx.beginPath();
 ctx.ellipse(0,0,r*1.15,r*.38,-.1,0,TAU);ctx.fill();
 for(let i=0;i<110;i++){
  const angle=rnd()*TAU,dist=Math.sqrt(rnd()),x=Math.cos(angle)*r*dist,
   y=Math.sin(angle)*r*.35*dist;
  const hue=t==='mycelium'?rnd()<.5?'#bfb5d7':'#6e9a99':
   t==='mud'?rnd()<.5?'#8f8060':'#302c22':
   t==='ash'?rnd()<.5?'#936045':'#161b1a':
   rnd()<.5?'#7da36c':'#274d39';
  ctx.fillStyle=hue;ctx.globalAlpha=.25+rnd()*.36;
  ctx.beginPath();ctx.ellipse(x,y,1+rnd()*3,.4+rnd()*1.2,rnd()*3,0,TAU);ctx.fill();
 }
 ctx.globalAlpha=1;ctx.restore();
}
function twig(ctx,obj,rnd,charred=false){
 ctx.save();ctx.translate(obj.x,obj.y);
 ctx.lineCap='round';ctx.shadowColor='#000b';ctx.shadowBlur=6;
 for(let i=0;i<4;i++){
  const x=(rnd()-.5)*obj.r,y=(rnd()-.5)*obj.r*.28,dx=(rnd()-.5)*obj.r*2;
  ctx.strokeStyle='#0009';ctx.lineWidth=7;
  ctx.beginPath();ctx.moveTo(x+3,y+5);ctx.lineTo(x+dx+3,y+10);ctx.stroke();
  ctx.strokeStyle=charred?'#453531':'#745637';ctx.lineWidth=3.5;
  ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+dx*.5,y-6,x+dx,y+3);ctx.stroke();
  ctx.strokeStyle=charred?'#9b8670':'#b29b70';ctx.lineWidth=.8;ctx.stroke();
 }
 ctx.restore();
}
function crystals(ctx,obj,rnd){
 soil(ctx,obj,obj.r*.9,obj.r*.27,'#1115298e');
 ctx.save();ctx.translate(obj.x,obj.y);
 for(let i=0;i<8;i++){
  const x=(rnd()-.5)*obj.r*1.3,y=(rnd()-.5)*obj.r*.35,h=obj.r*(.5+rnd()*1.25),w=2+rnd()*7;
  ctx.fillStyle='#77a6b78a';ctx.shadowColor='#b9e4ee';ctx.shadowBlur=4;
  ctx.beginPath();ctx.moveTo(x-w,y);ctx.lineTo(x-w*.7,y-h*.6);ctx.lineTo(x,y-h);
  ctx.lineTo(x+w,y-h*.55);ctx.lineTo(x+w*.7,y);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#cde9e699';ctx.lineWidth=1;ctx.stroke();
 }
 ctx.restore();
}
function draw(ctx,node){
 const rnd=generator(seed(node.id));
 if(node.kind==='root'||node.kind==='log')return bark(ctx,node);
 if(node.kind==='stone'||node.kind==='slag')return rock(ctx,node,rnd);
 if(node.kind==='leaves')return leaves(ctx,node,rnd);
 if(node.kind==='shrub'||node.kind==='reeds'||node.kind==='dryshrub')
  return foliage(ctx,node,rnd,node.kind==='dryshrub',node.kind==='reeds');
 if(node.kind==='mushroom')return fungal(ctx,node,rnd);
 if(node.kind==='moss'||node.kind==='mud'||node.kind==='mycelium'||node.kind==='ash')
  return ground(ctx,node,rnd);
 if(node.kind==='twig'||node.kind==='charred')return twig(ctx,node,rnd,node.kind==='charred');
 if(node.kind==='crystal')return crystals(ctx,node,rnd);
}
const caches=new Map();
function get(id){
 if(caches.has(id))return caches.get(id);
 const z=window.iaTerrain16Zones?.[id];if(!z)return null;
 const canvas=document.createElement('canvas');canvas.width=900;canvas.height=560;
 const ctx=canvas.getContext('2d');
 if(!ctx)return null;
 for(const node of z.props.slice().sort((a,b)=>a.y-b.y))draw(ctx,node);
 caches.set(id,canvas);
 return canvas;
}
window.iaTerrain16Art={draw,cache:get,clear:()=>caches.clear()};
})();