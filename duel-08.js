/* INSECT ARENA 0.8A — 1-on-1 private live duels over encrypted WebRTC DataChannel.
 * Host simulates all combat damage and movement; guest supplies movement/attack input.
 * No names, public chat, account, analytics, or persisted invitations.
 * Cloud PeerJS handles only temporary connection signaling; internet needed. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const ui=()=>window.iaUI;
const state={
 role:null,peer:null,conn:null,room:null,remoteFighter:0,remoteReady:false,
 active:false,resultShown:false,lastSeq:0,seq:0,world:'forest',
 remoteInput:{x:0,y:0,lastAt:0,hit:false,special:false},
 lastSent:0,snapshotTimer:null,joining:false,connected:false,
 round:1,scores:{host:0,guest:0},matchDone:false,sudden:false,
 startAt:0,remaining:90000,overtimeHealth:null
};
const displayStatus=(text,isError=false)=>{
 const e=$('duel-status');
 e.textContent=text;e.style.borderColor=isError?'#d66b68':'#b39d667c';
};
function syncButtons(){
 $('duel-start').disabled=!(state.role==='host'&&state.connected&&state.remoteReady&&!state.active&&!state.matchDone);
 $('duel-start').textContent=state.role==='host'?(state.round>1?'⚔ START RONDE '+state.round:'⚔ START ONLINE DUEL'):'WACHT OP DE HOST';
 $('duel-start').hidden=!state.role;
 $('duel-invite-section').hidden=state.role!=='host'||!state.room;
 $('duel-join-section').hidden=state.role!=='guest'||state.connected;
 const isGuest=state.role==='guest';
 for(const b of document.querySelectorAll('[data-duel-world]'))b.disabled=isGuest;
 $('duel-peer-count').textContent=state.connected?'2 / 2 SPELERS VERBONDEN':'WACHT OP TEGENSTANDER';
 for(const b of document.querySelectorAll('[data-duel-world]')){
  b.classList.toggle('chosen',b.dataset.duelWorld===state.world);
 }
 for(const b of document.querySelectorAll('.duelFighter'))b.classList.toggle('chosen',+b.dataset.fighter===+fighterSel.value);
 $('duel-host').classList.toggle('chosen',state.role==='host');
 $('duel-join').classList.toggle('chosen',state.role==='guest');
}
function openDuel(){
 ui().open('duel');
 let count=0;try{count=Math.max(0,Math.min(8,Number(localStorage.getItem('iaMysteryFragments')||0)))}catch(_){}
 $('duel-fragment-count').textContent='MYSTERIEFRAGMENTEN '+count+' / 8';
 syncButtons();
}
function clearSession(notify=true){
 $('pause').textContent='Ⅱ PAUZE';
 state.active=false;
 window.iaMatchHUD?.stop();
 window.iaStopCountdown?.();
 if(notify)try{state.conn?.send({t:'leave'})}catch(_){}
 if(state.snapshotTimer)clearInterval(state.snapshotTimer);
 state.snapshotTimer=null;
 try{state.conn?.close()}catch(_){}
 try{state.peer?.destroy()}catch(_){}
 state.conn=null;state.peer=null;state.room=null;state.role=null;state.connected=false;
 state.remoteReady=false;state.joining=false;state.resultShown=false;
 state.round=1;state.scores={host:0,guest:0};state.matchDone=false;
 state.sudden=false;state.startAt=0;state.remaining=90000;state.overtimeHealth=null;
 state.remoteInput={x:0,y:0,lastAt:0,hit:false,special:false};
 window.iaDuelRole=null;
 try{if(location.hash.startsWith('#duel='))history.replaceState(null,'',location.pathname+location.search)}catch(_){}
}
function endToMenu(){
 clearSession();playing=false;paused=false;$('battle-overlay').hidden=true;ui().open('menu');
}
function makeCode(){
 if(!window.crypto||!crypto.getRandomValues)throw Error('Veilige kamercodes zijn niet beschikbaar op dit apparaat.');
 const bytes=new Uint8Array(16);crypto.getRandomValues(bytes);
 return 'ia8-'+Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
}
function send(payload){
 if(state.conn?.open)try{state.conn.send(payload);return true}catch(e){displayStatus('Verzenden mislukt: '+e.message,true)}
 return false;
}
function copyURL(){
 const url=$('duel-share-link').value;
 if(navigator.share){
  navigator.share({title:'INSECT ARENA — privéduel',url}).catch(()=>{});
  return;
 }
 if(navigator.clipboard?.writeText){
  navigator.clipboard.writeText(url).then(()=>displayStatus('Uitnodigingslink gekopieerd. Deel hem met de andere speler.')).catch(()=>displayStatus('Selecteer en kopieer de link handmatig.',true));
 }else{
  $('duel-share-link').focus();$('duel-share-link').select();
  displayStatus('Selecteer en kopieer de link handmatig.');
 }
}
function drawInvite(){
 if(!state.room)return;
 const url=location.origin+location.pathname+'?v=1.3A#duel='+state.room;
 $('duel-share-link').value=url;
 $('duel-room-label').textContent='KAMER: '+state.room.slice(-8).toUpperCase();
 const qr=$('duel-qr');qr.replaceChildren();
 if(typeof window.QRCode==='function'){
  try{new window.QRCode(qr,{text:url,width:155,height:155,colorDark:'#102317',colorLight:'#ffffff',correctLevel:window.QRCode.CorrectLevel?.M??0});}
  catch(e){qr.textContent='QR niet beschikbaar. Gebruik de link.';}
 }else qr.textContent='QR niet geladen. Gebruik de link.';
}
function onDisconnect(why){
 const wasActive=state.active;
 state.active=false;state.connected=false;state.remoteReady=false;
 if(state.snapshotTimer){clearInterval(state.snapshotTimer);state.snapshotTimer=null}
 window.iaDuelRole=null;
 if(wasActive){
  playing=false;
  $('battle-overlay').hidden=false;
  $('overlay-title').textContent='VERBINDING VERBROKEN';
  $('overlay-desc').textContent=why||'De verbinding met de andere telefoon is verbroken.';
  const root=$('overlay-buttons');root.replaceChildren();
  const b=document.createElement('button');b.className='goldButton';b.textContent='TERUG NAAR MENU';b.addEventListener('click',endToMenu);root.appendChild(b);
 }else{
  displayStatus(why||'Verbinding verbroken. Maak een nieuwe kamer.',true);
 }
 syncButtons();
}
function attach(conn){
 if(state.conn?.open){
  conn.on('open',()=>{try{conn.send({t:'full'})}catch(_){}conn.close()});
  return;
 }
 state.conn=conn;
 conn.on('open',()=>{
  state.connected=true;state.joining=false;
  if(state.role==='guest'){
   displayStatus('Verbonden! Kies je vechter. De host start het duel.');
   send({t:'ready',fighter:+fighterSel.value});
  }else{
   displayStatus('Tegenstander verbonden! Kies je vechter en start zodra de ander klaar is.');
   send({t:'lobby',fighter:+fighterSel.value,world:state.world});
  }
  syncButtons();
 });
 conn.on('data',packet=>{
  if(!packet||typeof packet!=='object'||typeof packet.t!=='string')return;
  receive(packet);
 });
 conn.on('close',()=>onDisconnect('De andere speler is weg of de verbinding is weggevallen.'));
 conn.on('error',()=>onDisconnect('Er ging iets mis met de liveverbinding.'));
}
function newPeer(preset){
 if(typeof window.Peer!=='function')throw Error('De online duelbibliotheek kon niet worden geladen. Controleer internet en probeer opnieuw.');
 const peer=preset?new window.Peer(preset,{debug:0}):new window.Peer({debug:0});
 peer.on('error',err=>{
  const type=err?.type||'verbinding';
  if(type==='peer-unavailable')displayStatus('Kamer niet gevonden. Vraag de host de lobby open te houden.',true);
  else if(type==='unavailable-id')displayStatus('Deze kamercode is al in gebruik. Maak een nieuwe.',true);
  else displayStatus('Online verbinding mislukt ('+type+'). Probeer opnieuw.',true);
 });
 return peer;
}
function host(){
 clearSession();
 state.role='host';state.world=window.iaWorldSelected?.()||'forest';
 openDuel();displayStatus('Nieuwe privékamer maken...');
 try{
  state.room=makeCode();
  const peer=newPeer(state.room);
  state.peer=peer;
  peer.on('open',()=>{
   drawInvite();
   displayStatus('Kamer open! Laat de andere speler de QR-code scannen of de link openen.');
   syncButtons();
  });
  peer.on('connection',conn=>{
   if(state.conn){attach(conn);return}
   attach(conn);
  });
  peer.on('disconnected',()=>{if(!state.connected)displayStatus('Signaalverbinding onderbroken. Probeer opnieuw.',true)});
 }catch(e){displayStatus(e.message,true);state.room=null}
 syncButtons();
}
function join(code){
 if(!/^ia8-[a-f0-9]{32}$/.test(code||'')){displayStatus('Ongeldige code. Scan de QR-code of gebruik de volledige uitnodigingslink.',true);return}
 clearSession(false);
 state.role='guest';state.room=code;state.joining=true;
 $('duel-room-input').value=code;
 openDuel();displayStatus('Privékamer zoeken en verbinden...');
 try{
  const peer=newPeer();
  state.peer=peer;
  peer.on('open',()=>{
   const connection=peer.connect(code,{reliable:true,serialization:'json'});
   attach(connection);
  });
 }catch(e){displayStatus(e.message,true);state.joining=false}
 syncButtons();
}
function updateChoice(fighter){
 fighterSel.value=String(fighter);
 syncButtons();
 if(state.role==='guest')send({t:'ready',fighter:+fighterSel.value});
 if(state.role==='host')send({t:'lobby',fighter:+fighterSel.value,world:state.world});
}
function makeRoster(){
 const roster=$('duel-roster');roster.replaceChildren();
 types.forEach((t,i)=>{
  const b=document.createElement('button');b.type='button';b.className='duelFighter';b.dataset.fighter=String(i);
  const img=document.createElement('img');img.alt='';img.src=spriteSources[i];img.draggable=false;
  const title=document.createElement('span');title.textContent=t.name;
  b.append(img,title);
  b.addEventListener('click',()=>updateChoice(i));
  roster.appendChild(b);
 });
}
function newWorld(name){
 if(state.role==='guest')return;
 state.world=name;window.iaSetWorld?.(name);
 send({t:'lobby',fighter:+fighterSel.value,world:name});syncButtons();
}
function beginOnlineRound(){
 if(state.role!=='host'||!state.connected||!state.remoteReady||state.active)return;
 const info={t:'start',hostFighter:+fighterSel.value,guestFighter:state.remoteFighter,
  world:state.world,startAt:Date.now()+3200,round:state.round,
  scores:{host:state.scores.host,guest:state.scores.guest}};
 send(info);
 enterBattle(info);
}
function enterBattle(info){
 state.active=true;state.resultShown=false;state.lastSeq=0;state.seq=0;
 state.round=Math.max(1,Math.min(3,Number(info.round)||1));
 state.scores={host:Number(info.scores?.host)||0,guest:Number(info.scores?.guest)||0};
 state.startAt=Number(info.startAt)||Date.now()+3200;state.remaining=90000;
 state.sudden=false;state.overtimeHealth=null;state.matchDone=false;
 state.remoteInput={x:0,y:0,lastAt:0,hit:false,special:false};
 state.world=info.world==='fungus'?'fungus':'forest';
 window.iaSetWorld?.(state.world);
 fighterSel.value=String(state.role==='host'?info.hostFighter:info.guestFighter);
 window.iaDuelRole=state.role;
 // Existing game start is reused so all combat, UI and animations remain intact.
 ui().beginBattle();
 if(state.role==='host'){
  player=unit(info.hostFighter,210,330);enemy=unit(info.guestFighter,700,320);
  enemy.face=-1;
  state.remoteFighter=info.guestFighter;
  if(state.snapshotTimer){clearInterval(state.snapshotTimer);state.snapshotTimer=null;}
  state.snapshotTimer=setInterval(()=>{
   if(!state.connected||!state.active||state.role!=='host')return;
   hostTick();
   send({t:'state',seq:++state.seq,h:serialize(player),g:serialize(enemy),
     playing:!!playing,remaining:state.remaining,sudden:state.sudden,
     round:state.round,scores:state.scores});
   if(!playing&&!state.resultShown)result();
  },75);
 }else{
  player=unit(info.guestFighter,700,320);enemy=unit(info.hostFighter,210,330);
  player.face=-1;
 }
 statusEl.textContent='ONLINE DUEL · '+(state.role==='host'?'Jij bent host':'Jij bent uitgenodigd')+' · '+window.iaWorldName();
 $('pause').textContent='● LIVE';
 window.iaMatchHUD?.beginDuel({startAt:state.startAt,round:state.round,scores:state.scores});
 window.iaStartCountdown?.(state.startAt);
}
const savedKeys=['id','name','x','y','hp','maxHp','face','walk','cool','special','flash','attackAnim','attackMax','attackSpecial','hitAnim','burn','poison','root','slow','cloak','sporeSlow','ambush','charge','acid','acidFrame'];
function serialize(unit){
 const o={};
 for(const key of savedKeys)if(unit&&unit[key]!==undefined)o[key]=unit[key];
 return o;
}
function applySnapshot(d){
 if(!state.active||state.role!=='guest'||d.seq<=state.lastSeq)return;
 state.lastSeq=d.seq;
 if(!d.h||!d.g)return;
 // Host's guest is this phone's player; host's player is this phone's opponent.
 Object.assign(player,d.g);
 Object.assign(enemy,d.h);
 state.remaining=Math.max(0,Number(d.remaining)||0);
 state.sudden=!!d.sudden;
 window.iaMatchHUD?.updateDuel({remaining:state.remaining,sudden:state.sudden,
   round:d.round||state.round,scores:d.scores||state.scores});
 // Round victories are handled only by the host's reliable 'round_end' packet.
 // Never infer a match winner from an out-of-order position snapshot.
}
function receive(d){
 switch(d.t){
  case 'full':displayStatus('Deze kamer is al vol: maximaal twee spelers.',true);break;
  case 'leave':onDisconnect('De andere speler heeft het duel verlaten.');break;
  case 'ready':
   if(state.role==='host'&&!state.active){
    if(!Number.isInteger(d.fighter)||d.fighter<0||d.fighter>=types.length)return;
    state.remoteFighter=d.fighter;state.remoteReady=true;
    displayStatus('Beide spelers zijn verbonden. Start het duel!');
    syncButtons();
   }
   break;
  case 'lobby':
   if(state.role==='guest'&&!state.active){
    if(Number.isInteger(d.fighter)&&d.fighter>=0&&d.fighter<types.length)state.remoteFighter=d.fighter;
    if(d.world==='forest'||d.world==='fungus'){
     state.world=d.world;window.iaSetWorld?.(d.world);
    }
    displayStatus('Verbonden! Je vecht tegen '+types[state.remoteFighter].name+'. Wacht tot host start.');
    syncButtons();
   }break;
  case 'start':
   if(state.role==='guest'&&state.connected&&
      Number.isInteger(d.hostFighter)&&d.hostFighter>=0&&d.hostFighter<types.length&&
      Number.isInteger(d.guestFighter)&&d.guestFighter>=0&&d.guestFighter<types.length)enterBattle(d);
   break;
  case 'input':
   if(state.role==='host'&&state.active){
    state.remoteInput.x=Math.max(-1,Math.min(1,Number(d.x)||0));
    state.remoteInput.y=Math.max(-1,Math.min(1,Number(d.y)||0));
    state.remoteInput.lastAt=Date.now();
   }break;
  case 'hit':
   if(state.role==='host'&&state.active)state.remoteInput.hit=true;
   break;
  case 'special':
   if(state.role==='host'&&state.active)state.remoteInput.special=true;
   break;
  case 'state':if(state.role==='guest')applySnapshot(d);break;
  case 'round_end':if(state.role==='guest'&&state.active)acceptRoundEnd(d);break;
  case 'back':
   state.active=false;state.resultShown=false;playing=false;
   $('battle-overlay').hidden=true;ui().open('duel');syncButtons();
   displayStatus('Kies een vechter. De host kan een nieuw duel starten.');
   break;
 }
}
function restoreLobby(){
 state.active=false;state.resultShown=false;
 playing=false;paused=false;$('battle-overlay').hidden=true;
 window.iaMatchHUD?.stop();window.iaStopCountdown?.();
 if(state.snapshotTimer){clearInterval(state.snapshotTimer);state.snapshotTimer=null}
 send({t:'back'});
 window.iaDuelRole=null;
 ui().open('duel');syncButtons();
 displayStatus(state.role==='host'?'Kies je vechter en start een nieuw duel.':'Kies je vechter; wacht op de host.');
}
function awardMatchFragment(){
 let count=0;
 try{
  count=Math.max(0,Math.min(8,Number(localStorage.getItem('iaMysteryFragments')||0)));
  if(count<8){count++;localStorage.setItem('iaMysteryFragments',count);}
 }catch(_){}
 return count?'Mysteriefragment '+count+'/8 verzameld!':'Mysteriefragment verdiend!';
}
function showRoundResult(winner,finishedRound,matchOver,reason,fragment=''){
 const localWon=winner===state.role;
 const label=matchOver?(localWon?'KAMPIOEN!':'WEDSTRIJD VERLOREN'):
    (localWon?'RONDE GEWONNEN!':'RONDE VERLOREN');
 $('overlay-title').textContent=label;
 const tally='HOST '+state.scores.host+' : '+state.scores.guest+' GAST';
 const phase=reason==='SUDDEN DEATH'?'· SUDDEN DEATH':'· KNOCK-OUT';
 $('overlay-desc').textContent=(matchOver?'BEST-OF-THREE AFGELOPEN':'RONDE '+finishedRound+' / 3')+
   ' '+phase+' · '+tally+(fragment?' · '+fragment:'');
 const root=$('overlay-buttons');root.replaceChildren();
 if(state.role==='host'){
  const go=document.createElement('button');go.className='goldButton';
  go.textContent=matchOver?'⚔ NIEUWE WEDSTRIJD':'▶ VOLGENDE RONDE';
  go.addEventListener('click',()=>{
   if(!state.connected)return;
   if(matchOver){state.round=1;state.scores={host:0,guest:0};state.matchDone=false;}
   beginOnlineRound();
  });
  root.appendChild(go);
 }else{
  const wait=document.createElement('button');wait.className='goldButton';
  wait.textContent=matchOver?'WACHT OP NIEUWE WEDSTRIJD':'WACHT OP VOLGENDE RONDE';
  wait.disabled=true;root.appendChild(wait);
 }
 const back=document.createElement('button');back.className='iconBtn';
 back.textContent='HOOFDMENU';back.addEventListener('click',endToMenu);root.appendChild(back);
 $('battle-overlay').hidden=false;
}
function completeRound(winner,reason){
 if(state.role!=='host'||!state.active||state.resultShown)return;
 state.resultShown=true;state.active=false;playing=false;
 state.scores[winner]+=1;
 const finishedRound=state.round;
 const matchOver=state.scores.host>=2||state.scores.guest>=2||finishedRound>=3;
 state.matchDone=matchOver;
 const frag=matchOver&&winner==='host'?awardMatchFragment():'';
 const data={t:'round_end',round:finishedRound,winner,reason,
   scores:{host:state.scores.host,guest:state.scores.guest},matchOver,
   hostHp:player.hp,guestHp:enemy.hp};
 send(data);
 window.iaMatchHUD?.updateDuel({remaining:state.remaining,sudden:state.sudden,
   round:finishedRound,scores:state.scores});
 showRoundResult(winner,finishedRound,matchOver,reason,frag);
 if(!matchOver)state.round+=1;
 syncButtons();
}
function acceptRoundEnd(d){
 if(state.role!=='guest'||!state.active||state.resultShown)return;
 if(!Number.isInteger(d.round)||d.round!==state.round)return;
 if(d.winner!=='host'&&d.winner!=='guest')return;
 if(!d.scores||!Number.isInteger(d.scores.host)||!Number.isInteger(d.scores.guest))return;
 state.active=false;state.resultShown=true;playing=false;
 state.scores={host:Math.max(0,Math.min(3,d.scores.host)),guest:Math.max(0,Math.min(3,d.scores.guest))};
 state.matchDone=!!d.matchOver;
 if(Number.isFinite(d.guestHp))player.hp=Math.max(0,d.guestHp);
 if(Number.isFinite(d.hostHp))enemy.hp=Math.max(0,d.hostHp);
 if(d.winner==='guest'){wins++;try{localStorage.setItem('iaWins',wins)}catch(_){}}
 const frag=state.matchDone&&d.winner==='guest'?awardMatchFragment():'';
 window.iaMatchHUD?.updateDuel({remaining:state.remaining,sudden:state.sudden,
   round:state.round,scores:state.scores});
 showRoundResult(d.winner,d.round,state.matchDone,d.reason,frag);
 if(!state.matchDone)state.round+=1;
 syncButtons();
}
function hostTick(){
 if(state.role!=='host'||!state.active||!player||!enemy)return;
 if(!playing){result();return;}
 if(window.iaCountdownActive)return;
 state.remaining=Math.max(0,90000-(Date.now()-state.startAt));
 if(state.remaining===0&&!state.sudden){
  state.sudden=true;
  // Strip all lingering status damage so sudden death is decided by a fresh hit.
  for(const f of [player,enemy]){f.burn=0;f.poison=0;}
  state.overtimeHealth={host:player.hp,guest:enemy.hp};
  statusEl.textContent='SUDDEN DEATH · de eerstvolgende rake aanval beslist!';
 }
 if(state.sudden&&state.overtimeHealth){
  if(enemy.hp<state.overtimeHealth.guest){enemy.hp=0;playing=false;result();}
  else if(player.hp<state.overtimeHealth.host){player.hp=0;playing=false;result();}
  state.overtimeHealth={host:player.hp,guest:enemy.hp};
 }
 window.iaMatchHUD?.updateDuel({remaining:state.remaining,sudden:state.sudden,
   round:state.round,scores:state.scores});
}
function result(){
 if(state.role!=='host'||!state.active||state.resultShown)return;
 if(enemy?.hp<=0)completeRound('host',state.sudden?'SUDDEN DEATH':'KO');
 else if(player?.hp<=0)completeRound('guest',state.sudden?'SUDDEN DEATH':'KO');
}
const corePlayer=controlPlayer;
controlPlayer=function(dt){
 if(!state.active)return corePlayer(dt);
 if(state.role==='host')return corePlayer(dt);
 // Responsive guest movement is predicted locally and reconciled with host snapshots.
 corePlayer(dt);
 const now=Date.now();
 if(now-state.lastSent>60){
  const joy=window.iaJoystick;
  const x=joy?.active?joy.x*joy.sensitivity:(keys.right?1:0)-(keys.left?1:0);
  const y=joy?.active?joy.y*joy.sensitivity:(keys.down?1:0)-(keys.up?1:0);
  send({t:'input',x,y});
  state.lastSent=now;
 }
};
const coreEnemy=controlEnemy;
controlEnemy=function(dt){
 if(!state.active)return coreEnemy(dt);
 if(state.role==='guest')return; // Never run bot AI on a human opponent.
 if(!state.connected||!enemy||!player)return;
 const inp=state.remoteInput;
 let mx=Date.now()-inp.lastAt<550?inp.x:0;
 let my=Date.now()-inp.lastAt<550?inp.y:0;
 let magnitude=Math.hypot(mx,my);if(magnitude>1){mx/=magnitude;my/=magnitude;}
 if(mx||my){
  const mult=enemy.root>0?.08:enemy.slow>0?.46:enemy.sporeSlow>0?.62:1;
  enemy.x+=mx*enemy.speed*3.2*mult*dt;enemy.y+=my*enemy.speed*3.2*mult*dt;
  enemy.face=mx>=0?1:-1;enemy.walk+=.17*dt;
 }else enemy.walk*=.82;
 if(inp.hit){inp.hit=false;attack(enemy,player,false);}
 if(inp.special){inp.special=false;attack(enemy,player,true);}
};
const coreAttack=attack;
attack=function(a,t,special=false){
 if(state.active && state.role==='guest'){
  if(a===player){send({t:special?'special':'hit'});}
  return; // Host alone determines damage, winner, and ability cooldowns.
 }
 const beforePlaying=playing,previousHp=t?.hp;
 coreAttack(a,t,special);
 if(state.active&&state.role==='host'&&state.sudden&&beforePlaying&&playing&&
    t&&t.hp<previousHp){
  t.hp=0;playing=false;
  if(t===enemy){wins++;try{localStorage.setItem('iaWins',wins)}catch(_){}}
 }
 if(state.active&&state.role==='host'&&beforePlaying&&!playing)result();
};
const coreArena=drawArena;
drawArena=function(time){
 if(state.active&&state.role==='guest'){
  // Guest renders its arena, but only the host may simulate spore hazards.
  const p=playing;playing=false;
  try{coreArena(time)}finally{playing=p}
 }else coreArena(time);
};
const coreConfine=confine;
confine=function(u){
 if(state.active&&state.role==='guest'){
  u.x=Math.max(85,Math.min(c.width-85,u.x));
  u.y=Math.max(165,Math.min(c.height-78,u.y));
  return;
 }
 return coreConfine(u);
};
// The standard menu / pause buttons must not silently switch a network duel into solo mode.
$('battle-menu').addEventListener('click',()=>{
 if(state.role){send({t:'leave'});clearSession(false)}
},true);
$('pause').addEventListener('click',e=>{
 if(state.active){e.preventDefault();e.stopImmediatePropagation();statusEl.textContent='ONLINE DUEL · Pauzeren is niet beschikbaar';}
},true);
// UI actions
$('menu-duel').addEventListener('click',()=>{openDuel();displayStatus('Maak een privékamer of voer een uitnodigingscode in.')});
$('duel-back').addEventListener('click',endToMenu);
$('duel-host').addEventListener('click',host);
$('duel-join').addEventListener('click',()=>{
 if(state.role!=='guest'){clearSession(false);state.role='guest';}
 openDuel();displayStatus('Plak een uitnodigingscode of scan de QR-code van de host.');
 syncButtons();
});
$('duel-join-go').addEventListener('click',()=>{
 let input=$('duel-room-input').value.trim();
 if(input.includes('#duel='))input=input.split('#duel=')[1].split('&')[0];
 join(input.toLowerCase());
});
$('duel-copy').addEventListener('click',copyURL);
$('duel-start').addEventListener('click',beginOnlineRound);
for(const b of document.querySelectorAll('[data-duel-world]'))b.addEventListener('click',()=>newWorld(b.dataset.duelWorld));
makeRoster();syncButtons();
// A camera-scanned QR automatically joins when the second phone opens the game.
const fragment=decodeURIComponent((location.hash||'').slice(1));
if(fragment.startsWith('duel=')){
 const code=fragment.slice(5).split('&')[0].toLowerCase();
 if(/^ia8-[a-f0-9]{32}$/.test(code))join(code);
}
})();
