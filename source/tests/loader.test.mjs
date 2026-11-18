import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../../',import.meta.url);
const code=fs.readFileSync(new URL('../plugins/gltf-loader/plugin.js',import.meta.url),'utf8');
const manifest=JSON.parse(fs.readFileSync(new URL('assets/pinpin/manifest.json',root),'utf8'));
const module=(assets={},fetcher=()=>{throw new Error('unexpected request');})=>new Function('PLUGIN_ASSETS','fetch','console',code+'\nreturn {parseGLB,setPiece};')(assets,fetcher,{info(){},warn(){}});
test('all five copied GLBs preserve provenance, valid meshes and material colors',()=>{
 assert.equal(manifest.assets.length,5);
 for(const asset of manifest.assets){
  const buffer=fs.readFileSync(new URL('assets/pinpin/'+asset.file,root));assert.equal(buffer.length,asset.size);assert.ok(buffer.length<2_000_000);
  assert.equal(createHash('sha256').update(buffer).digest('hex'),asset.sha256);
  const mesh=module().parseGLB(buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.length));
  assert.ok(mesh.nv>1000);assert.ok(mesh.ib.length>1000);assert.equal(mesh.vb.byteLength,mesh.nv*16);
  const f=new Float32Array(mesh.vb);for(let i=0;i<mesh.nv;i++)for(let k=0;k<3;k++)assert.ok(Number.isFinite(f[i*4+k]));
  assert.ok(mesh.ib.every(i=>i<mesh.nv));assert.ok(mesh.groups.length>=4);
  let index=0;for(const group of mesh.groups){assert.equal(group.firstIndex,index);assert.equal(group.indexCount%3,0);index+=group.indexCount;assert.ok(group.color.every(v=>v>=0&&v<=1));}
  assert.equal(index,mesh.ib.length);
 }
});
test('missing GLB reports fallback identity and preserves the supplied proxy',async()=>{
 const loader=module({pinpin:{url:'assets/pinpin/missing.glb'}},async()=>({ok:false,status:404}));let called=0;
 const mesh=await loader.setPiece('pinpin',()=>{called++;return{vb:new ArrayBuffer(16),ib:new Uint32Array([0,0,0]),nv:1};});
 assert.equal(called,1);assert.equal(mesh.source.loaded,false);assert.equal(mesh.source.name,'pinpin');assert.equal(mesh.source.url,'assets/pinpin/missing.glb');
});
test('successful setPiece fetches the real bytes rather than returning the proxy',async()=>{
 const buffer=fs.readFileSync(new URL('assets/pinpin/pinpin.glb',root));let calls=0;
 const loader=module({pinpin:{url:'assets/pinpin/pinpin.glb'}},async url=>{calls++;assert.equal(url,'assets/pinpin/pinpin.glb');return{ok:true,arrayBuffer:async()=>buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.length)};});
 const mesh=await loader.setPiece('pinpin',()=>{throw new Error('proxy must not run');});
 assert.equal(calls,1);assert.equal(mesh.source.loaded,true);assert.ok(mesh.nv>10000);
});
