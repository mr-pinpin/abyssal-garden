// Runs the actual built page through the existing Canvas/DOM adapter.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {exercise} from './built-scene.mjs';
test('built forest walk moves, bounds, releases and returns to idle overview',async()=>{
 const result=await exercise('dev.html',{width:240,height:180,instrument:code=>`const walkEvents={};const documentListen=document.addEventListener;document.addEventListener=(type,fn)=>{walkEvents["document-"+type]=fn;documentListen(type,fn);};const originalListen=addEventListener;addEventListener=(type,fn)=>{walkEvents[type]=fn;originalListen(type,fn);};\n`+code.replace("\n})().catch",`\n
 const check=(condition,message)=>{if(!condition)throw Error(message);};
 document.getElementById('walk').listeners.click();
 check(forestWalk.active,'enter walk');check(forestWalk.position[0]===-12.4&&forestWalk.position[1]===6,'start outside house');check(Math.abs(forestWalk.yaw-Math.atan2(4.4,-2.8))<1e-8,'face next path bend');
 let prevented=0;
 const key={key:'w',target:{tagName:'CANVAS'},preventDefault(){prevented++;}};
 walkEvents.keydown(key);
 const before=forestWalk.position.slice();forestLast=1000;forestFrame(1050);
 check(Math.hypot(forestWalk.position[0]-before[0],forestWalk.position[1]-before[1])>.1,'movement');
 check(prevented===1,'movement consumes key');
 walkEvents.keyup(key);check(!forestWalkMoving(),'keyup releases');
 walkEvents.keydown({...key,target:{tagName:'INPUT'}});check(!forestWalkMoving(),'input is untouched');
 walkEvents.keydown(key);walkEvents.blur();check(!forestWalkMoving(),'blur releases');
 walkEvents.keydown(key);document.hidden=true;walkEvents["document-visibilitychange"]();document.hidden=false;
 check(!forestWalkMoving(),'hidden releases');
 forestWalk.position=[7,5.6];check(Math.abs(forestWalkHeight()-2.054)<1e-6,'bridge grounded');
 for(const p of [[-100,200],[0,0],[100,-100]]){const q=forestWalkClamp(p);let distance=Infinity;for(let i=1;i<forestWalkRoute.length;i++){const a=forestWalkRoute[i-1],b=forestWalkRoute[i],dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((q[0]-a[0])*dx+(q[1]-a[1])*dz)/(dx*dx+dz*dz)));distance=Math.min(distance,Math.hypot(q[0]-a[0]-dx*t,q[1]-a[1]-dz*t));}check(distance<=.650001,'corridor margin');check(Math.hypot(...forestVec.sub(forestWalkClamp(q),q))<1e-7,'corridor clamp stable');}
 forestWalk.keys.add('d');for(let i=0;i<1000;i++)forestWalkStep(.05);check(Math.hypot(forestWalk.position[0],forestWalk.position[1])<40,'bounded movement');
 const touch=document.getElementById('walk-w');touch.listeners.pointerdown({pointerId:1,preventDefault(){}});check(forestWalk.keys.has('w'),'touch begins');touch.listeners.pointercancel();forestWalkRelease();check(!forestWalkMoving(),'touch cancellation');
 walkEvents.keydown({...key,key:'Escape'});check(!forestWalk.active,'escape exits');
 check(document.getElementById('walk-controls').hidden,'touch controls close');
 forestState.walkChecks=true;
 \n})().catch`)});
 assert.equal(result.state.walkChecks,true);
});
