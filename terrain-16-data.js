/* INSECT ARENA 1.6A — hand-authored arena props, 900x560 game units.
   Single source of truth for visual shapes, collision, cover and slowdown.
   cover: hard blocks; light weakens; null = decorative/terrain.
 */
(()=>{
'use strict';
const P=(id,kind,x,y,opts={})=>Object.assign({id,kind,x,y,r:25,
 cover:null,solid:false,slow:0,scale:1,seed:id.length*13},opts);
const root=(id,x,y,points,width,cover='hard',opts={})=>
 P(id,'root',x,y,{points,width,r:width*1.15,cover,solid:cover==='hard',...opts});
const log=(id,x,y,points,width,cover='hard',opts={})=>
 P(id,'log',x,y,{points,width,r:width*1.15,cover,solid:cover==='hard',...opts});
const rock=(id,x,y,rx,ry,kind='stone',opts={})=>
 P(id,kind,x,y,{rx,ry,r:Math.max(rx,ry),cover:'hard',solid:true,...opts});
const plant=(id,kind,x,y,r,opts={})=>P(id,kind,x,y,{r,...opts});

const zones={
 forest:{name:'Groene Bosbodem',tip:'Bladeren verzwakken slagen; takken bieden beschutting.',props:[
  log('bos-gevallen-tak',439,299,[[-85,-30],[-42,-12],[7,-8],[67,19]],13),
  plant('bos-bladstrooisel-a','leaves',364,395,38,{cover:'light',slow:6}),
  plant('bos-bladstrooisel-b','leaves',590,365,31,{cover:'light',slow:6}),
  plant('bos-varens-a','shrub',349,251,27,{cover:'light'}),
  plant('bos-varens-b','shrub',641,421,31,{cover:'light'}),
  root('bos-bodemwortel',536,469,[[-44,-11],[1,-5],[54,9]],9,'light',{solid:false,slow:9}),
  plant('bos-twijg','twig',500,393,31,{slow:4}),
  plant('bos-mos','moss',489,274,38,{slow:3})
 ]},
 roots:{name:'Worteldoolhof',tip:'Flankeer brede wortels; kleinere wortelstrengen remmen.',props:[
  root('wortel-middenboog',430,319,[[-119,-57],[-69,-45],[-27,-5],[17,9],[71,20]],22),
  root('wortel-onder-rug',543,452,[[-94,29],[-45,10],[5,-12],[58,-34],[117,-39]],22),
  root('wortel-bovenhoek',603,264,[[-69,-15],[-32,11],[19,20],[75,-4]],18),
  root('wortel-uitloper',382,450,[[-68,-8],[-21,-6],[37,20]],7,'light',{solid:false,slow:12}),
  root('wortel-flank',624,366,[[-40,-15],[7,-7],[48,20]],8,'light',{solid:false,slow:10}),
  plant('wortel-varen','shrub',475,264,29,{cover:'light'}),
  plant('wortel-bladeren','leaves',358,369,30,{cover:'light'}),
  plant('wortel-twijg','twig',626,474,25,{slow:4}),
  plant('wortel-mos','moss',554,309,32,{slow:3})
 ]},
 fungus:{name:'Schimmelvallei',tip:'Paddenstoelen geven dekking; schimmelmat vertraagt.',props:[
  plant('zwam-reus','mushroom',397,350,45,{cover:'hard',solid:true}),
  plant('zwam-tweede','mushroom',594,410,46,{cover:'hard',solid:true}),
  plant('zwam-klein','mushroom',525,259,25,{cover:'light'}),
  log('zwam-dood-hout',499,473,[[-55,11],[-17,4],[20,-3],[73,-6]],14),
  plant('zwam-sporenmat-a','mycelium',357,427,41,{slow:11}),
  plant('zwam-sporenmat-b','mycelium',635,309,36,{slow:11}),
  plant('zwam-blad','leaves',485,311,33,{cover:'light'}),
  plant('zwam-varens','shrub',349,244,29,{cover:'light'})
 ]},
 dew:{name:'Dauwmoeras',tip:'Water en modder vertragen beide dieren; riet verzwakt aanvallen.',props:[
  plant('moeras-riet-a','reeds',396,350,37,{cover:'light'}),
  plant('moeras-riet-b','reeds',653,391,41,{cover:'light'}),
  plant('moeras-riet-c','reeds',512,258,27,{cover:'light'}),
  log('moeras-hout',521,463,[[-55,16],[-15,6],[51,-12]],13),
  plant('moeras-bladeren','leaves',358,469,36,{cover:'light'}),
  plant('moeras-modder-a','mud',403,420,44,{slow:13}),
  plant('moeras-modder-b','mud',594,306,31,{slow:13}),
  plant('moeras-struik','shrub',740,419,27,{cover:'light'})
 ]},
 cave:{name:'Rotsholte',tip:'Grote stenen blokkeren aanvallen en maken flankeren nodig.',props:[
  rock('rot-steenblok-a',374,362,48,31),
  rock('rot-steenblok-b',562,437,57,40),
  rock('rot-rand',545,266,38,28),
  rock('rot-kiezel',457,474,27,15,'stone',{solid:false,cover:'light',slow:8}),
  rock('rot-splinters',639,314,22,13,'stone',{solid:false,cover:'light',slow:6}),
  plant('rot-kristal-a','crystal',313,430,26,{cover:'light'}),
  plant('rot-kristal-b','crystal',635,479,28,{cover:'light'}),
  plant('rot-mos','moss',472,304,29,{slow:4})
 ]},
 red:{name:'Rode Breukgrond',tip:'Basalt beschermt, as remt en hittevelden waarschuwen vooraf.',props:[
  rock('rood-basalt-a',403,349,46,31,'slag'),
  rock('rood-basalt-b',630,418,52,35,'slag'),
  rock('rood-schuilblok',542,268,37,25,'slag'),
  rock('rood-gruis',480,456,28,15,'slag',{cover:'light',solid:false,slow:7}),
  plant('rood-tak','charred',362,468,33,{cover:'light',slow:5}),
  plant('rood-struik','dryshrub',583,368,25,{cover:'light'}),
  plant('rood-as-a','ash',348,271,36,{slow:10}),
  plant('rood-as-b','ash',692,301,33,{slow:10})
 ]}
};
for(const zone of Object.values(zones)){
 const ids=new Set();
 for(const prop of zone.props){
  if(ids.has(prop.id))throw new Error('Dubbel terreinobject: '+prop.id);
  ids.add(prop.id);
  if(!Number.isFinite(prop.x)||!Number.isFinite(prop.y))throw new Error('Ongeldig terrein');
  Object.freeze(prop);
 }
 Object.freeze(zone.props);Object.freeze(zone);
}
window.iaTerrain16Zones=Object.freeze(zones);
})();