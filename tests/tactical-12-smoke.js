/* Non-network smoke test for INSECT ARENA 1.2A.
   Call testTactical(sourceCode) in a JavaScript environment. */
function testTactical(source){
 const ids=['special-charge-ring','special-charge-text','tactical-toast','arena-view'];
 const elements=Object.fromEntries(ids.map(id=>[id,{hidden:false,textContent:'',style:{setProperty(k,v){this[k]=v}},classList:{add(){},remove(){},toggle(){}}}]));
 const doc={getElementById:id=>elements[id],querySelector:()=>({classList:{add(){},remove(){},toggle(){}}})};
 const engine=`
 let player=null,enemy=null,playing=true,paused=false,partCount=0;
 const types=[{name:'Mier',hp:125,damage:16,range:82},{name:'Bidsprinkhaan',hp:105,damage:16,range:88}],floaters=[],burst=()=>{partCount++};
 const g={save(){},restore(){},beginPath(){},arc(){},stroke(){},fill(){},moveTo(){},quadraticCurveTo(){},lineTo(){}};
 function unit(id,x,y){return {...types[id],id,x,y,hp:types[id].hp,maxHp:types[id].hp,cool:0,special:0,face:1}}
 function attack(a,t,special=false){if(!a||!t||a.cool>0||(special&&a.special>0))return;if(Math.hypot(a.x-t.x,a.y-t.y)>a.range)return;
   a.cool=special?48:20;if(special)a.special=240;t.hp=Math.max(0,t.hp-a.damage*(special?2.2:1));if(t.hp<=0)playing=false}
 function confine(u){u.cool=Math.max(0,u.cool-1);u.special=Math.max(0,u.special-1)}
 function drawInsect(){}function drawDamageNumbers(){}function drawHUD(){}
 function reset(){player=unit(0,210,330);enemy=unit(1,270,330);playing=true}
 ${source}
 return {setup:()=>{reset();return{player,enemy}},hit:(a,b,s)=>attack(a,b,s),
   tick:()=>{confine(player);confine(enemy)},draw:()=>{drawInsect(player);drawDamageNumbers();drawHUD()},get:()=>({partCount})};
 `;
 let time=0;
 const app=new Function('document','window','performance','setTimeout','clearTimeout',engine)(
   doc,{iaDuelRole:null,iaCountdownActive:false,iaReducedEffects:false},{now:()=>time+=120},()=>1,()=>{});
 const {player,enemy}=app.setup();
 if(player.maxHp!==194||player.damage!==13)throw Error('Health or damage balance wrong');
 const health=enemy.hp;app.hit(player,enemy,true);
 if(enemy.hp!==health)throw Error('Uncharged special caused damage');
 for(let i=0;i<4;i++){player.cool=0;app.hit(player,enemy,false)}
 if(player.charge!==100||enemy.charge!==64)throw Error('Charge / comeback earn rules wrong');
 enemy.x=350;player.cool=0;
 const before=enemy.hp;app.hit(player,enemy,true);
 if(player.charge!==0||enemy.acid!==160||enemy.hp>=before)throw Error('Acid special did not activate');
 for(let i=0;i<26;i++)app.tick();app.draw();
 if(enemy.acid!==134||app.get().partCount<1)throw Error('Corrosion ticks or FX failed');
 return {longerBattles:true,chargedOnly:true,fourHitSpecial:true,comebackCharge:true,acidRange:true,corrosionFX:true};
}
