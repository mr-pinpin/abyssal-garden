// Executes the actual built HTML script with an explicit DOM/Canvas test adapter.
// This is not a browser or WebGPU validation claim. Fetch reads local asset bytes.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {png} from './png.mjs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
export async function exercise(file='index.html',options={}){
 const html=fs.readFileSync(path.join(root,file),'utf8'),code=html.match(/<script>([\s\S]*?)<\/script>/)[1];
 const elements=new Map(),raf=[],requests=[],warnings=[],exceptions=[],listeners={};
 const ids=new Set(Array.from(html.matchAll(/\bid=["']([^"']+)["']/g),m=>m[1]));
 let image=null, time=0;
 const canvas={createImageData:(width,height)=>({width,height,data:new Uint8ClampedArray(width*height*4)}),
  putImageData(value){image=value;}};
 function element(id){if(!elements.has(id))elements.set(id,{id,hidden:id==='compat'||id==='error',textContent:'',innerHTML:'',disabled:false,attributes:{},listeners:{},
  addEventListener(type,fn){this.listeners[type]=fn;},setAttribute(k,v){this.attributes[k]=String(v);},getAttribute(k){return this.attributes[k]??null;},
  getContext(kind){assert.equal(kind,'2d');return canvas;},setPointerCapture(){},async click(){if(!this.disabled)await this.listeners.click?.({});}});return elements.get(id);}
 const names=Array.from(html.matchAll(/data-chapter=["']([^"']+)["']/g),m=>m[1]);assert.deepEqual(names.slice().sort(),['clearing','elder','home']);
 const buttons=names.map(name=>{const e=element('button-'+name);e.dataset={chapter:name};return e;});
 function withLayout(target,selector){
  target.getBoundingClientRect=()=>options.rectangles?.[selector]??{};
  target.getClientRects=()=>options.rectangles?.[selector]?[target.getBoundingClientRect()]:[];
  return target;
 }
 const document={hidden:false,querySelector(selector){
  return selector==='.intro .actions'&&/class=["']actions["']/.test(html)?withLayout(element('actions'),selector):null;
 },getElementById:id=>ids.has(id)?withLayout(element(id),'#'+id):null,querySelectorAll(selector){return selector==='canvas'?[element('scene'),element('compat')]:buttons;},addEventListener(type,fn){listeners[type]=fn;},removeEventListener(type){delete listeners[type];}};
 const sandbox={document,navigator:{},ArrayBuffer,Uint32Array,Uint8Array,Uint8ClampedArray,Float32Array,Int8Array,DataView,TextDecoder,
  innerWidth:options.width||1440,innerHeight:options.height||900,devicePixelRatio:1,
  requestAnimationFrame:fn=>raf.push(fn),setTimeout:()=>{throw new Error('unexpected idle timer');},setInterval:()=>{throw new Error('unexpected idle interval');},clearInterval(){},performance:{now:()=>time},
  addEventListener(type,fn){listeners[type]=fn;},console:{info(){},warn(...args){warnings.push(args.join(' '));},error(...args){exceptions.push(args.join(' '));}},
  fetch:async url=>{
   if(url==='assets/atlas-studies/runtime-v3.json'){const data=JSON.parse(fs.readFileSync(path.join(root,url),'utf8'));return {ok:true,status:200,json:async()=>data};}
   assert.ok(url.startsWith('assets/pinpin/')&&!url.includes('..'),'only local model fetches');
   const fail=options.failAsset&&url.endsWith('/'+options.failAsset+'.glb');
   const bytes=fail?null:fs.readFileSync(path.join(root,url));
   requests.push({url,status:fail?404:200,bytes:bytes?.length||0,sha256:bytes?createHash('sha256').update(bytes).digest('hex'):null});
   return {ok:!fail,status:fail?404:200,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.length)};
  }};
 const context=vm.createContext(sandbox);vm.runInContext('window=globalThis',context);
 if(options.inspectFrame)context.inspectFrame=options.inspectFrame;
 await vm.runInContext(options.instrument?.(code)??code,context,{filename:file,timeout:10000});
 function draw(){let n=0;while(raf.length){assert.ok(n++<4,'unexpected continuous rendering');time+=100;raf.shift()(time);}}
 draw();const state=context.__pinpin;
 assert.ok(state.ready,'built scene did not become ready');assert.equal(state.mode,'canvas2d');assert.ok(state.frames>0);
 assert.deepEqual(Array.from(state.errors),[]);assert.deepEqual(exceptions,[]);assert.ok(state.drawnTriangles>1000,'scene drew too little geometry');
 if(options.output)fs.writeFileSync(options.output+'-clearing.png',png(image));
 for(const name of ['home','elder','clearing'])if(!element('button-'+name).disabled){
  await element('button-'+name).click();draw();assert.equal(state.chapter,name);assert.ok(state.drawnTriangles>1000);
  if(options.output)fs.writeFileSync(options.output+'-'+name+'.png',png(image));
 }
 const frameCount=state.frames;assert.equal(raf.length,0,'idle scene should not churn');
 if(!options.failAsset&&requests.length){assert.equal(requests.length,state.atlasTextures?4:5);assert.ok(state.models.every(m=>m.loaded));}
 if(options.failAsset){assert.equal(state.models.filter(m=>m.loaded).length,state.atlasTextures?3:4);assert.ok(element('load-status').textContent.includes('fallback'));assert.ok(warnings.length);}
 return {state:JSON.parse(JSON.stringify(state)),requests,warnings,status:element('load-status').textContent,frameCount,trianglesDrawn:state.drawnTriangles,disabled:buttons.filter(b=>b.disabled).map(b=>b.dataset.chapter)};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const directory=process.argv[2]||'/tmp/pinpin-built-check';fs.mkdirSync(directory,{recursive:true});
 const normal=await exercise('index.html',{output:path.join(directory,'scene')});
 const missing=await exercise('index.html',{failAsset:'pinpin'});
 const mobile=await exercise('index.html',{width:390,height:844,output:path.join(directory,'mobile')});
 fs.writeFileSync(path.join(directory,'evidence.json'),JSON.stringify({method:'Actual built HTML script executed with explicit DOM/Canvas adapter and filesystem-backed fetch; NOT browser/WebGPU QA',normal,missing,mobile},null,2)+'\n');
 console.log(JSON.stringify({ready:normal.state.ready,mode:normal.state.mode,models:normal.requests.map(r=>({url:r.url,status:r.status,bytes:r.bytes})),fault:missing.status,mobile:mobile.state.ready,idleRafQueue:0,evidence:directory},null,2));
}
