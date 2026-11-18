// Integration execution with real geometry and GLBs, mocked DOM/WebGL (NOT a browser/GPU test).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'source/manifest.json')));
async function execute({disabled=[],missing=false,production=false}={}){
  const calls=[],buffers=[],uniforms=[],events={},inputs={},messages=[];let pending,clock=0;
  const gl=new Proxy({getShaderParameter:()=>true,getProgramParameter:()=>true,getAttribLocation:(_,n)=>['position','normal','color'].indexOf(n),getUniformLocation:(_,n)=>n,getParameter:()=> 'MOCK WebGL (not GPU evidence)',getError:()=>0,
    bufferData:(_,data)=>{assert([...data].every(Number.isFinite));buffers.push(data);},uniformMatrix4fv:(_,__,m)=>{assert(m.length===16&&[...m].every(Number.isFinite));uniforms.push(m);},drawElements:(...args)=>calls.push(args)},
    {get:(o,k)=>k in o?o[k]:String(k).startsWith('create')?()=>({}):String(k).toUpperCase()===k?1:()=>{}});
  const element=()=>({dataset:{},append(...args){for(const a of args)if(a?.dataset?.layer)inputs[a.dataset.layer]=a;},setAttribute(){},addEventListener(){},focus(){},setPointerCapture(){}});
  const canvas={...element(),width:0,height:0,getContext:name=>{assert.equal(name,'webgl2');return gl;}};
  const status=element(),layers=element(),buttons=['overview','home','pinpin','elder'].map(n=>({...element(),dataset:{view:n}}));
  const document={getElementById:id=>({c:canvas,s:status,layers}[id]||element()),querySelectorAll:()=>buttons,createElement:()=>element()};
  const context=vm.createContext({console:{info(){},warn:(...x)=>messages.push(x.join(' ')),error:(...x)=>{throw Error(x.join(' '));}},window:{},document,HTMLInputElement:class{},performance:{now:()=>clock},devicePixelRatio:1,innerWidth:1440,innerHeight:1000,
    ArrayBuffer,Uint32Array,Float32Array,Int8Array,TextDecoder,DataView,
    addEventListener:(n,fn)=>events[n]=fn,requestAnimationFrame:fn=>pending=fn,
    fetch:async url=>({ok:!missing,status:missing?404:200,arrayBuffer:async()=>{const b=fs.readFileSync(path.join(root,url));return b.buffer.slice(b.byteOffset,b.byteOffset+b.length);}})});
  const enabled=manifest.plugins.filter(p=>p.enabled!==false&&!disabled.includes(p.name));
  const files=[...manifest.core.map(n=>'core/'+n+'.js'),...enabled.filter(p=>p.phase==='pre').map(p=>'plugins/'+p.name+'/plugin.js'),'core/'+manifest.main+'.js'];
  const code=production ? fs.readFileSync(path.join(root,'index.html'),'utf8').match(/<script>([\s\S]*)<\/script>/)[1] : '(async()=>{const PLUGIN_ASSETS='+JSON.stringify(manifest.assets)+';\n'+files.map(f=>fs.readFileSync(path.join(root,'source',f),'utf8')).join('\n')+'\n})()';
  await vm.runInContext(code,context);
  const state=()=>JSON.parse(JSON.stringify(context.window.forestState()));
  assert(state().ready);assert(buffers.length===2);assert(buffers[0].length>10000);assert(buffers[1].length>10000);
  for(const idx of buffers[1])assert(idx<buffers[0].length/9);
  const tick=()=>{clock+=40;pending(clock);};tick();
  for(const view of ['overview','home','pinpin','elder']){context.window.forestView(view);tick();assert.equal(state().view,view);}
  for(const [id,input] of Object.entries(inputs)){
    const before=calls.length;tick();const normal=calls.length-before;
    input.checked=false;input.onchange();assert.equal(state().groups.find(g=>g.id===id).enabled,false);
    const start=calls.length;tick();assert.equal(calls.length-start,normal-1,'disabled runtime group must not draw');
    input.checked=true;input.onchange();
  }
  const before=state().eye;
  events.keydown({key:'w',preventDefault(){},target:{}});for(let i=0;i<10;i++)tick();events.keyup({key:'w'});
  const after=state().eye;assert(Math.hypot(...after.map((v,i)=>v-before[i]))>1);
  // Check the PinPin look target is centered and in front of the camera.
  context.window.forestView('pinpin');tick();
  const m=uniforms.at(-1),p=[0,.75,4,1],clip=Array.from({length:4},(_,r)=>p.reduce((s,v,c)=>s+m[c*4+r]*v,0));
  assert(clip[3]>0&&Math.abs(clip[0]/clip[3])<.01&&Math.abs(clip[1]/clip[3])<.01&&Math.abs(clip[2]/clip[3])<1);
  for(const [id,input]of Object.entries(inputs)){input.checked=false;input.onchange();assert.equal(state().groups.find(g=>g.id===id).enabled,false);input.checked=true;input.onchange();}
  assert(calls.length>0);
  if(!disabled.includes('pinpin-character'))assert.equal(state().assets.filter(a=>a.materialColors).length,missing?0:5);
  return {productionBundle:production,disabled,missingAssets:missing,groups:state().groups,vertices:buffers[0].length/9,triangles:buffers[1].length/3,drawCalls:calls.length,materialAssets:state().assets,warnings:messages,movement:{before,after},mockOnly:true};
}
// Verify the opt-in loader extension preserves actual material palettes while defaults stay compatible.
const parserSource=fs.readFileSync(path.join(root,'source/plugins/gltf-loader/plugin.js'),'utf8');
const parser=new Function('PLUGIN_ASSETS',parserSource+'\nreturn parseGLB;')({});
for(const id of Object.keys(manifest.assets)){
  const raw=fs.readFileSync(path.join(root,manifest.assets[id].url)),ab=raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.length);
  const mesh=parser(ab,{colors:true});assert.equal(mesh.colors.length,mesh.nv*3);
  assert([...mesh.colors].every(x=>Number.isFinite(x)&&x>=0&&x<=1));
  const palette=new Set();for(let i=0;i<mesh.nv;i++)palette.add(Array.from(mesh.colors.subarray(i*3,i*3+3)).join(','));
  assert(palette.size>1,'recovered '+id+' must retain its multiple material colors');
  assert.equal(parser(ab).colors,undefined,'old loader callers keep the same default shape');
}
const results=[];
results.push(await execute());
results.push(await execute({production:true}));
for(const name of ['pinpin-home','elder-sanctuary','pinpin-character'])results.push(await execute({disabled:[name]}));
results.push(await execute({disabled:['pinpin-home','elder-sanctuary','pinpin-character']}));
results.push(await execute({missing:true}));
fs.writeFileSync(path.join(root,'evidence/integration.json'),JSON.stringify({kind:'Mock DOM/WebGL integration; real geometry/GLB parsing; no browser screenshot',cases:results},null,2)+'\n');
console.log('PASS: seven integrated cases, real transformed/indexed geometry, five colored GLBs, individual/all disabled plugins, failed asset fallback, viewpoint projection, keyboard movement and runtime toggles. WebGL/DOM mocked; browser verification remains required.');
