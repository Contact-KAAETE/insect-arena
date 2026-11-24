/* INSECT ARENA 0.9A regression: simulated two-device PeerJS match.
 * Run via new Function('source', fileSource + 'return testBestOfThree(source)').
 * Uses a deterministic clock, peer pair, fake DOM and in-memory localStorage. */
function testBestOfThree(source) {
 let now=100000;const events=[],peers=new Map();
 const flush=()=>{for(let i=0;i<1000&&events.length;i++)events.shift()();if(events.length)throw Error('message delivery stalled')};
 class E{constructor(){this.ev={};this.open=false}on(k,f){(this.ev[k]??=[]).push(f)}emit(k,a){(this.ev[k]||[]).forEach(f=>f(a))}}
 let count=0;
 class P extends E{
  constructor(id){super();this.id=id||'g'+(++count);peers.set(this.id,this);events.push(()=>this.emit('open',this.id))}
  connect(id){let h=peers.get(id),a=new E(),b=new E();
   if(!h)throw Error('Unknown room');
   a.send=x=>events.push(()=>b.emit('data',x));b.send=x=>events.push(()=>a.emit('data',x));
   a.close=()=>events.push(()=>b.emit('close'));b.close=()=>events.push(()=>a.emit('close'));
   events.push(()=>{h.emit('connection',b);a.open=b.open=true;a.emit('open');b.emit('open')});
   return a;
  }
  destroy(){peers.delete(this.id)}
 }
 function elem(id){return{id,hidden:false,disabled:false,value:'0',textContent:'',style:{},dataset:{},children:[],ev:{},classList:{toggle(){},add(){}},
   addEventListener(k,f){(this.ev[k]??=[]).push(f)},
   click(){(this.ev.click||[]).forEach(f=>f({preventDefault(){},stopImmediatePropagation(){}}))},
   append(...x){this.children.push(...x)},appendChild(x){this.children.push(x)},
   replaceChildren(...x){this.children=x},setAttribute(){},focus(){},select(){}}}
 const types=Array.from({length:8},(_,i)=>({name:'F'+i,damage:20,hp:100,speed:3,range:100}));
 const debug=source.replace(/\}\)\(\);\s*$/, "window.probe=()=>({role:state.role,active:state.active,round:state.round,score:{...state.scores},shown:state.resultShown,connected:state.connected,ready:state.remoteReady,sudden:state.sudden,matchDone:state.matchDone});})();");
 if(!debug.includes('window.probe='))throw Error('Failed to instrument duel script');
 const pre="let player=null,enemy=null,playing=false,paused=false,wins=0;const c={width:900,height:560},keys={},fighterSel=document.getElementById('fighter'),statusEl=document.getElementById('duel-status'),spriteSources=types.map((_,i)=>'s'+i);function unit(id,x,y){const t=types[id];return {...t,id,x,y,hp:t.hp,maxHp:t.hp,face:1,special:0}}function attack(a,b){b.hp=Math.max(0,b.hp-20);if(!b.hp)playing=false}function controlPlayer(){}function controlEnemy(){}function drawArena(){}function confine(){}window.iaUI={open(p){window.page=p},beginBattle(){player=unit(0,210,330);enemy=unit(1,700,320);playing=true;window.page='arena'}};";
 const post="return{probe:window.probe,live:()=>({player,enemy,playing,wins}),set:(p,hp)=>{const u=p==='player'?player:enemy;u.hp=hp;if(!hp)playing=false},attackLocal:(p)=>attack(p==='host'?player:enemy,p==='host'?enemy:player)};";
 const run=new Function('document','window','location','history','navigator','crypto','setInterval','clearInterval','localStorage','Date','types',pre+debug+'\n'+post);
 function client(){
  const elems=new Map(),timers=[],store=new Map();
  const get=id=>{if(!elems.has(id))elems.set(id,elem(id));return elems.get(id)};
  const worlds=['forest','fungus'].map(k=>{const v=elem(k);v.dataset.duelWorld=k;return v});
  const doc={getElementById:get,createElement:elem,querySelectorAll:q=>q==='[data-duel-world]'?worlds:q==='.duelFighter'?get('duel-roster').children:[]};
  const win={Peer:P,crypto:{getRandomValues(x){x.forEach((_,i)=>x[i]=i+1)}},iaUI:null,
   iaMatchHUD:{beginDuel(){},updateDuel(o){win.lastHud=o},stop(){}},
   iaStartCountdown(){},iaStopCountdown(){},iaWorldSelected:()=> 'forest',iaSetWorld(){},iaWorldName:()=> 'forest',addEventListener(){}};
  const x=run(doc,win,{origin:'https://example.com',pathname:'/game/',hash:''},{replaceState(){}},{},win.crypto,
    f=>{const t={f,alive:true};timers.push(t);return t},t=>{if(t)t.alive=false},
    {getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,String(v))},{now:()=>now},types);
  return {...x,get,timers,store,win};
 }
 const h=client(),g=client();
 h.get('duel-host').click();flush();const invite=h.get('duel-share-link').value;
 if(!/\?v=[^#]+#duel=/.test(invite))throw Error('Wrong invitation URL version');
 g.get('duel-join').click();g.get('duel-room-input').value=invite;g.get('duel-join-go').click();flush();
 if(!h.probe().ready||!g.probe().connected)throw Error('Connection failed');
 function start(){h.get('duel-start').click();flush();if(!h.probe().active||!g.probe().active)throw Error('Round did not start')}
 function tick(){const live=h.timers.filter(x=>x.alive);if(!live.length)throw Error('Host tick missing');live.at(-1).f();flush()}
 function end(target){h.set(target,0);tick()}
 start();end('enemy');
 if(h.probe().score.host!==1||g.probe().score.host!==1||h.probe().round!==2)throw Error('First round wrong');
 if(h.store.has('iaMysteryFragments')||g.store.has('iaMysteryFragments'))throw Error('Fragment given before match win');
 h.get('overlay-buttons').children[0].click();flush();end('player');
 if(h.probe().score.guest!==1||g.probe().score.guest!==1||h.probe().round!==3)throw Error('Second round wrong');
 h.get('overlay-buttons').children[0].click();flush();end('enemy');
 if(!h.probe().matchDone||!g.probe().matchDone||h.probe().score.host!==2||h.probe().score.guest!==1)throw Error('Third round wrong');
 if(h.store.get('iaMysteryFragments')!=='1'||g.store.get('iaMysteryFragments'))throw Error('Winner-only fragment failed');
 const finalScore={...h.probe().score};
 h.get('overlay-buttons').children[0].click();flush();
 if(h.probe().round!==1||g.probe().round!==1||h.probe().score.host!==0)throw Error('New match failed');
 now+=94000;tick();
 if(!h.probe().sudden||!g.probe().sudden)throw Error('Sudden death not synchronized');
 h.attackLocal('host');flush();
 if(h.probe().score.host!==1||g.probe().score.host!==1)throw Error('Sudden death hit failed');
 return {connected:true,threeRounds:true,finalScore,fragmentWinnerOnly:true,newMatchReset:true,suddenDeathSynced:true,suddenDeathHit:true};
}
