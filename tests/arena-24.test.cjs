// INSECT ARENA 2.4A — fotorealistische bosprops: alleen uitzicht, geen wijziging van botsing of dekking.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('index.html');

function zones(){
 const win={};
 new Function('window',read('terrain-16-data.js'))(win);
 return win.iaTerrain16Zones;
}
function laad(imgsOk=true){
 const win={iaTerrain16Zones:zones()};
 const drawn=[];
 win.iaTerrain16Art={cache:id=>({basis:id}),draw:(ctx,node)=>drawn.push('oud:'+node.id)};
 const loaded=[];
 class Img{set src(s){this._src=s;loaded.push(s);this.naturalWidth=300;this.naturalHeight=200;
  Promise.resolve().then(()=>imgsOk?this.onload&&this.onload():this.onerror&&this.onerror())}}
 const ctx={save(){},restore(){},translate(){},scale(){},beginPath(){},ellipse(){},fill(){},
  drawImage(im,x,y,w,h){drawn.push('foto:'+im._src.split('/').pop())},set fillStyle(v){}};
 const doc={createElement:()=>({width:0,height:0,getContext:()=>ctx})};
 new Function('window','document','Image','console',read('terrain-23.js'))(win,doc,Img,{warn(){}});
 return {win,drawn,loaded};
}

test('elk foto-object bestaat in de terreindata en elk fotobestand bestaat',()=>{
 const Z=zones(),{win}=laad();
 const ids=new Set(Object.values(Z).flatMap(z=>z.props.map(p=>p.id)));
 for(const [id,spec] of Object.entries(win.iaTerrain23.spec)){
  assert.ok(ids.has(id),'onbekend terreinobject '+id);
  const f=path.join(root,'assets/world/props-23',spec.img+'.webp');
  assert.ok(fs.existsSync(f),f);
  assert.ok(fs.statSync(f).size<80*1024,'foto blijft licht: '+spec.img);
  assert.ok(spec.w>=60&&spec.w<=220,'redelijke grootte '+id);
 }
});

test('botsing, dekking en vertraging blijven onaangeroerd (terrain-23 raakt de data niet)',()=>{
 const src=read('terrain-23.js');
 assert.ok(!/cover\s*=|solid\s*=|\.slow\s*=|\.r\s*=/.test(src));
 const before=JSON.stringify(zones());
 laad();
 assert.equal(JSON.stringify(zones()),before);
});

test('met geladen foto’s tekent de laag foto’s en valt voor de rest terug op de oude tekening',async()=>{
 const {win,drawn}=laad(true);
 await new Promise(r=>setTimeout(r,5));
 const c=win.iaTerrain16Art.cache('forest');
 assert.ok(c&&!c.basis,'eigen laag, niet de oude');
 assert.ok(drawn.some(x=>x==='foto:log.webp'));
 assert.ok(drawn.some(x=>x==='foto:fern.webp'));
 assert.ok(drawn.includes('oud:bos-bodemwortel'),'de wortel heeft geen foto en blijft getekend');
 assert.equal(win.iaTerrain16Art.cache('forest'),c,'één keer per wereld gecacht');
});

test('als een foto niet laadt, blijft het spel werken met de oude tekeningen',async()=>{
 const {win,drawn}=laad(false);
 await new Promise(r=>setTimeout(r,5));
 const c=win.iaTerrain16Art.cache('fungus');
 assert.ok(c);
 assert.ok(!drawn.some(x=>x.startsWith('foto:')));
 assert.ok(drawn.includes('oud:zwam-reus'));
});

test('laadvolgorde en versie',()=>{
 const i=n=>html.indexOf(n);
 assert.ok(i('terrain-23.js')>i('terrain-16.js?'),'na de terreinlaag');
 assert.ok(i('terrain-23.js')<i('immersive-17.js'));
 assert.ok(html.includes('terrain-23.js?v='+JSON.parse(read('version.json')).version));
 for(const f of ['bloemenmantis','springstaart','mijt'])assert.ok(fs.existsSync(path.join(root,'assets/fighters',f+'-23.webp')));
});
