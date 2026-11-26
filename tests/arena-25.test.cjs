// INSECT ARENA 2.5A — de drie geanimeerde vechters mogen ook online duelleren (protocol 2, met versiecontrole).
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

test('duel-lijst: de originele acht en de drie nieuwe dieren, de andere solo-dieren niet',()=>{
 const ok=duelLijst();
 const toegestaan=[...Array(20).keys()].filter(ok);
 assert.deepEqual(toegestaan,[0,1,2,3,4,5,6,7,13,14,15]);
 assert.equal(ok(-1),false);assert.equal(ok(1.5),false);assert.equal(ok('13'),false);assert.equal(ok(null),false);
});

test('protocol: versie wordt uitgewisseld en een oudere versie wordt netjes geweigerd',()=>{
 const d=read('duel-08.js');
 assert.ok(d.includes('const PROTO=2'));
 for(const regel of ["send({t:'ready',fighter:+fighterSel.value,v:PROTO})","send({t:'lobby',fighter:+fighterSel.value,world:state.world,v:PROTO})"])
  assert.ok(d.includes(regel),regel);
 assert.ok(/t:'start',v:PROTO/.test(d));
 assert.ok(d.includes('state.peerV=Number(d.v)||1'),'zonder versie telt de ander als oud (1)');
 assert.ok(/function blocked\(\)/.test(d)&&d.includes("needsNew(+fighterSel.value)"));
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
