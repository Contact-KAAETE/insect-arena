/* INSECT ARENA 2.4A — fotorealistische bosprops in de arena (hout, mos, varens, paddenstoelen, schimmel).
 * Alleen het UITZICHT verandert: botsing, dekking en vertraging komen nog steeds uit terrain-16-data.js.
 * Elk object krijgt zijn foto op dezelfde plek en schaal als de oude, getekende vorm; wat geen foto heeft
 * (wortels, riet, rotsen, kristal, as) blijft zoals het was. De hele laag wordt één keer per wereld gecacht.
 * Laadt een foto niet, dan valt dat ene object terug op de oude tekening.
 */
(()=>{
'use strict';
const art=window.iaTerrain16Art,Z=window.iaTerrain16Zones;
if(!art||!Z||typeof art.cache!=='function'||typeof art.draw!=='function')return;
const DIR='assets/world/props-23/';
// foto, breedte in spelpunten, verticaal anker (0 = midden, 1 = onderrand op (x,y)), spiegelen
const L=(img,w,anchor,flip)=>({img,w,anchor,flip:!!flip});
const SPEC={
 // Groene Bosbodem
 'bos-gevallen-tak':L('log',172,0),
 'bos-bladstrooisel-a':L('leaf',112,0),'bos-bladstrooisel-b':L('leaf',94,0,true),
 'bos-varens-a':L('fern',104,.7),'bos-varens-b':L('fern',118,.7,true),
 'bos-twijg':L('debris',96,0),'bos-mos':L('moss',128,0),
 // Worteldoolhof (de wortelbogen zelf blijft de bestaande getekende wortel)
 'wortel-varen':L('fern',108,.7),'wortel-bladeren':L('leaf',104,0),'wortel-twijg':L('debris',84,0),'wortel-mos':L('moss',112,0),
 // Schimmelvallei
 'zwam-reus':L('shroom',170,.78),'zwam-tweede':L('shrooms',172,.78),'zwam-klein':L('spore',84,.7),
 'zwam-dood-hout':L('logrot',176,0),'zwam-sporenmat-a':L('web',132,0),'zwam-sporenmat-b':L('web',112,0,true),
 'zwam-blad':L('leaf',108,0),'zwam-varens':L('fern',100,.7),
 // Dauwmoeras
 'moeras-hout':L('logmyc',150,0),'moeras-bladeren':L('leaf',112,0,true),'moeras-struik':L('fern',96,.7),
 // Rotsholte
 'rot-mos':L('moss',100,0)
};
const imgs={};
let klaar=0,totaal=0,gefaald=0;
const nodig=new Set(Object.values(SPEC).map(s=>s.img));
for(const naam of nodig){
 totaal++;
 const im=new Image();im.decoding='async';
 im.onload=()=>{imgs[naam]=im;klaar++;caches.clear()};
 im.onerror=()=>{gefaald++;console.warn('Terreinfoto niet geladen:',naam)};
 im.src=DIR+naam+'.webp';
}
const caches=new Map();
const basis=art.cache;
function tekenFoto(ctx,node,spec){
 const im=imgs[spec.img];
 if(!im)return false;
 const w=spec.w,h=w*im.naturalHeight/im.naturalWidth;
 ctx.save();
 ctx.translate(node.x,node.y);
 if(spec.flip)ctx.scale(-1,1);
 // zachte contactschaduw zodat het object op de bosbodem staat
 ctx.fillStyle='rgba(6,10,6,.28)';ctx.beginPath();
 ctx.ellipse(0,spec.anchor?2:h*.18,w*.40,Math.max(5,h*.12),0,0,Math.PI*2);ctx.fill();
 const top=spec.anchor?-h*spec.anchor:-h/2;
 ctx.drawImage(im,-w/2,top,w,h);
 ctx.restore();
 return true;
}
function bouw(id){
 const z=Z[id];if(!z)return null;
 const canvas=document.createElement('canvas');canvas.width=900;canvas.height=560;
 const ctx=canvas.getContext('2d');if(!ctx)return null;
 for(const node of z.props.slice().sort((a,b)=>a.y-b.y)){
  const spec=SPEC[node.id];
  if(spec&&tekenFoto(ctx,node,spec))continue;
  art.draw(ctx,node);   // geen foto (of nog niet geladen): oude tekening
 }
 return canvas;
}
art.cache=function(id){
 if(caches.has(id))return caches.get(id);
 const z=Z[id];if(!z)return basis(id);
 const alles=z.props.every(n=>!SPEC[n.id]||imgs[SPEC[n.id].img]);
 if(!alles&&gefaald===0&&klaar<totaal)return basis(id);   // foto's laden nog: tijdelijk de oude laag
 const c=bouw(id);
 if(c)caches.set(id,c);
 return c||basis(id);
};
window.iaTerrain23={spec:SPEC,ready:()=>({klaar,totaal,gefaald}),clear:()=>caches.clear()};
})();
