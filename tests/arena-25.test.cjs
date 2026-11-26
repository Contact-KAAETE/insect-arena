// INSECT ARENA 2.6A — alle 16 vechters en de arena-hindernissen ook online (protocol 3, met versiecontrole).
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

function duelLijst(){
 const types=[...Array(13)].map((_,i)=>({name:'t'+i,hp:100,speed:3,damage:10,range:80}));
 const win={};
 class Img{set src(s){}}
 new Function('types','spriteSources','spriteWidths','fighterSel','fighterSprites','window','Image','Option',read('fauna-23-pre.js'))
  (types,[],[],{add(){}},[],win,Img,function(){});
 return win.ia23DuelOk;
}

test('duel-lijst: alle 16 vechters, niets daarbuiten',()=>{
 const ok=duelLijst();
 const toegestaan=[...Array(20).keys()].filter(ok);
 assert.deepEqual(toegestaan,[...Array(16).keys()]);
 assert.equal(ok(-1),false);assert.equal(ok(1.5),false);assert.equal(ok('13'),false);assert.equal(ok(null),false);
});

test('protocol: versie wordt uitgewisseld en een oudere versie wordt netjes geweigerd',()=>{
 const d=read('duel-08.js');
 assert.ok(d.includes('const PROTO=3'));
 assert.ok(d.includes('const minV=')&&/id>=13\?2:3/.test(d),'ids 13-15 vanaf protocol 2, ids 8-12 vanaf protocol 3');
 for(const regel of ["send({t:'ready',fighter:+fighterSel.value,v:PROTO})","send({t:'lobby',fighter:+fighterSel.value,world:state.world,v:PROTO})"])
  assert.ok(d.includes(regel),regel);
 assert.ok(/t:'start',v:PROTO/.test(d));
 assert.ok(d.includes('state.peerV=Number(d.v)||1'),'zonder versie telt de ander als oud (1)');
 assert.ok(/function blocked\(\)/.test(d)&&d.includes('state.peerV<minV(+fighterSel.value)'));
 assert.ok(d.includes('OUDE_VERSIE'));
 // validatie van binnenkomende pakketten gaat via de duel-lijst
 assert.ok(d.includes('duelOk(d.fighter)')&&d.includes('duelOk(d.hostFighter)&&duelOk(d.guestFighter)'));
});

test('de rest van het duelgedrag is niet aangeraakt (host rekent, gast stuurt invoer)',()=>{
 const d=read('duel-08.js');
 assert.ok(d.includes("Host alone determines damage"));
 assert.ok(d.includes("send({t:special?'special':'hit'})"));
 assert.ok(d.includes('savedKeys'));
 assert.ok(/saved|serialize/.test(d));
});

test('hindernissen online: alleen als beide telefoons het kennen, en nooit sturen of omleiden van een mens',()=>{
 const d=read('duel-08.js'),t=read('terrain-16.js'),a=read('adventure-14.js');
 assert.ok(d.includes('obst:state.peerV>=PROTO'),'host zet de vlag alleen aan bij protocol 3');
 assert.ok(d.includes('window.iaDuelObstacles=!!info.obst'));
 assert.ok(d.includes('window.iaDuelRole=null;window.iaDuelObstacles=false;'),'vlag gaat uit na het duel');
 assert.ok(t.includes('const duelTerrain=()=>!!window.iaDuelRole&&!!window.iaDuelObstacles'));
 assert.ok(/if\(!solo\(\)\)\{[^\n]*\n[^\n]*f0=[^\n]*\n[^\n]*iaDuelRole==='host'\)collisionResolve\(f0,enemy\)/.test(t),'in een duel alleen botsen, geen omleiding van de tegenstander');
 assert.ok(a.includes('!window.iaDuelObstacles'),'de arena tekent hindernissen online alleen met de vlag');
 // biome hazards remain solo-only
 assert.ok(read('expansion-15.js').includes('if(!u||!active()||!solo())return;'));
});
