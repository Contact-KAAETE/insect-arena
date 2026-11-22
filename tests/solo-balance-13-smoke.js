/* Deterministic-ish simulation: no internet / no game engine deps.
 * testSoloBalance(balanceJs,tacticalJs) exercises tactical AI with a realistic
 * 60 Hz movement/attack loop in mocked Canvas and DOM. */
function testSoloBalance(balanceJs,tacticalJs){
 function el(){return{hidden:false,textContent:'',value:'tactical',style:{setProperty(){}},
   classList:{add(){},remove(){},toggle(){}},addEventListener(k,f){if(k==='change')this.changed=f;}}}
 const ids=['special-charge-ring','special-charge-text','tactical-toast','arena-view',
   'ia-difficulty','ia-difficulty-guide','ai-danger-tag','settings-done'];
 const nodes=Object.fromEntries(ids.map(k=>[k,el()]));
 const doc={getElementById:k=>nodes[k],querySelector:()=>el()};
 const saved=new Map();const storage={getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,String(v))};
 const types=[
  {hp:125,speed:4.4,damage:16,range:82},{hp:105,speed:3.2,damage:16,range:88},
  {hp:145,speed:2.5,damage:21,range:65},{hp:115,speed:3,damage:13,range:98},
  {hp:132,speed:3.4,damage:17,range:102},{hp:106,speed:3.8,damage:17,range:115},
  {hp:128,speed:4,damage:16,range:88},{hp:154,speed:2.7,damage:20,range:96}
 ];
 const pre=`
 let player=null,enemy=null,playing=false,paused=false,frameNo=0;
 const floaters=[],statusEl={textContent:''};
 const types=${JSON.stringify(types)},c={width:900,height:560};
 const g={save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},arc(){},
   closePath(){},fill(){},stroke(){},ellipse(){},translate(){},rotate(){},quadraticCurveTo(){}};
 function burst(){}
 function unit(id,x,y){const t=types[id];return{...t,id,x,y,hp:t.hp,maxHp:t.hp,cool:0,special:0,face:1,walk:0,attackAnim:0}}
 function reset(){player=unit(0,210,330);enemy=unit(window.enemyId??1,700,320);playing=true;}
 function attack(a,t,special=false){
  if(!a||!t||a.cool>0||(special&&a.special>0))return;
  if(Math.hypot(a.x-t.x,a.y-t.y)>a.range)return;
  a.cool=special?48:(a===enemy?45:20);if(special)a.special=240;
  t.hp=Math.max(0,t.hp-a.damage*(special?2.2:1));if(!t.hp)playing=false;
 }
 function controlPlayer(){}function controlEnemy(){}
 function confine(u){u.x=Math.max(85,Math.min(c.width-85,u.x));u.y=Math.max(165,Math.min(c.height-78,u.y));u.cool=Math.max(0,u.cool-1);u.special=Math.max(0,u.special-1)}
 function drawInsect(){}function drawArena(){}function drawDamageNumbers(){}function drawHUD(){}
 ${tacticalJs}
 ${balanceJs}
 function sim(strategy,id,level='tactical'){
  window.enemyId=id;
  document.getElementById('ia-difficulty').value=level;
  document.getElementById('ia-difficulty').changed();
  reset();
  let firstHit=null,firstEnemyHit=null;
  for(let k=0;k<5400&&playing;k++){
   frameNo=k;
   const ph=player.hp,eh=enemy.hp;
   if(strategy==='spam'||strategy==='skill'){
    const x=enemy.x-player.x,y=enemy.y-player.y,d=Math.hypot(x,y)||1;
    if(strategy==='skill'&&enemy.ai?.phase==='windup'){
      player.y=Math.max(170,Math.min(470,player.y+(Math.sign(player.y-enemy.y)||1)*8));
    } else if(d>player.range*.78){
      player.x=Math.max(85,Math.min(815,player.x+x/d*9));
      player.y=Math.max(165,Math.min(482,player.y+y/d*9));
    }
    if((player.charge||0)>=100&&(strategy==='spam'||enemy.ai?.phase==='windup'))attack(player,enemy,true);
    else attack(player,enemy,false);
   }
   controlEnemy(1);confine(player);confine(enemy);
   if(player.hp<ph&&firstEnemyHit===null)firstEnemyHit=k/60;
   if(enemy.hp<eh&&firstHit===null)firstHit=k/60;
  }
  return{strategy,id,level,winner:enemy.hp<=0?'player':player.hp<=0?'enemy':'timeout',
    seconds:Math.round(frameNo/60*10)/10,playerHP:Math.round(player.hp),enemyHP:Math.round(enemy.hp),
    enemyMax:enemy.maxHp,enemyAttacks:enemy.ai?.attacks,enemyEvades:enemy.ai?.evades,
    firstEnemyHit,firstHit};
 }
 return{sim};
 `;
 const window={iaDuelRole:null,iaCountdownActive:false,iaReducedEffects:true,enemyId:1};
 const evaluator=new Function('document','window','localStorage','performance','setTimeout','clearTimeout',pre);
 const runtime=evaluator(doc,window,storage,{now:()=>1},()=>0,()=>{});
 const results=[];
 for(const strategy of ['spam','skill','idle'])for(const id of [1,2,3,5,7])
   results.push(runtime.sim(strategy,id));
 return results;
}
