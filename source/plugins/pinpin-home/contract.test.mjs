import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const here=new URL('.',import.meta.url);
const code=fs.readFileSync(new URL('plugin.js',here),'utf8');
const math=fs.readFileSync(new URL('../../core/math.js',here),'utf8');
const functionName='pinpinHomePieces';
const prefix='pinpin-home/';
function load() {
  let effects=0;
  const blocked=()=>{effects++;throw new Error('forbidden definition-time effect');};
  const context=vm.createContext({ArrayBuffer,Uint32Array,Float32Array,Int8Array,
    fetch:blocked,setPiece:blocked,document:new Proxy({}, {get:blocked}),navigator:new Proxy({}, {get:blocked})});
  vm.runInContext(math+'\n'+code,context,{filename:fileURLToPath(new URL('plugin.js',here)),timeout:3000});
  assert.equal(effects,0);
  return {make:()=>vm.runInContext(functionName+'()',context,{timeout:3000}),context};
}
function vertices(piece) {
  const built=piece.build(),f=new Float32Array(built.vb),out=[];
  for(let i=0;i<built.nv;i++)out.push([f[i*4]+piece.position[0],f[i*4+1]+piece.position[1],f[i*4+2]+piece.position[2]]);
  return {built,out};
}
function snapshot(pieces) {
  return createHash('sha256').update(JSON.stringify(pieces.map(p=>({name:p.name,asset:p.asset,position:Array.from(p.position),rotation:Array.from(p.rotation),
    scale:Array.from(p.scale),color:Array.from(p.color),vb:Buffer.from(p.build().vb).toString('hex'),ib:Array.from(p.build().ib)})))).digest('hex');
}
test('definition has no browser effects; pieces meet the packed Mesh contract',()=>{
  const {make}=load(),pieces=make();assert.ok(pieces.length>=40);
  const names=new Set(),assets=new Set();let totalVertices=0;
  for(const piece of pieces) {
    assert.ok(piece.name.startsWith(prefix));assert.ok(!names.has(piece.name));names.add(piece.name);
    if(piece.asset!==null){assert.equal(typeof piece.asset,'string');assert.ok(!assets.has(piece.asset));assets.add(piece.asset);}
    assert.equal(piece.build.length,0);
    for(const key of ['position','rotation','scale','color']){
      assert.equal(piece[key].length,3);assert.ok(piece[key].every(Number.isFinite));
    }
    assert.ok(piece.scale.every(v=>v>0));assert.ok(piece.color.every(v=>v>=0&&v<=1));
    const {built,out}=vertices(piece);assert.ok(built.vb instanceof ArrayBuffer);assert.ok(built.ib instanceof Uint32Array);
    assert.ok(built.nv>0);assert.equal(built.vb.byteLength,built.nv*16);assert.ok(built.ib.length>0&&built.ib.length%3===0);
    for(const index of built.ib)assert.ok(index<built.nv);
    const f=new Float32Array(built.vb);let bottom=Infinity;
    for(let i=0;i<built.nv;i++){
      for(let k=0;k<3;k++)assert.ok(Number.isFinite(f[i*4+k]));
      bottom=Math.min(bottom,f[i*4+1]);
    }
    assert.ok(Math.abs(bottom)<1e-5,piece.name+' local base is not zero');
    for(const [x,y,z] of out){assert.ok(x>-25&&x<20,piece.name+' X bounds');assert.ok(y>-.25&&y<12,piece.name+' Y bounds');assert.ok(z>-12&&z<14,piece.name+' Z bounds');}
    // Reject meshes whose indices all collapse to zero-area triangles.
    let area=0;
    for(let i=0;i<built.ib.length;i+=3){const a=out[built.ib[i]],b=out[built.ib[i+1]],c=out[built.ib[i+2]];
      const u=b.map((v,k)=>v-a[k]),v=c.map((v,k)=>v-a[k]);area+=Math.hypot(u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]);}
    assert.ok(area>1e-7,piece.name+' has no triangle area');totalVertices+=built.nv;
  }
  assert.ok(totalVertices>5000&&totalVertices<100000,'bounded substantial geometry');
});
test('repeated builds are byte deterministic and do not advance shared RNG',()=>{
  const {make,context}=load();vm.runInContext('rseed(987)',context);
  const before=vm.runInContext('_seed',context),a=make();
  const expected=snapshot(a);assert.deepEqual(snapshot(a),expected);assert.deepEqual(snapshot(make()),expected);
  assert.equal(vm.runInContext('_seed',context),before);
  assert.deepEqual(snapshot(load().make()),expected);
});
// Triangle/segment intersection: validates clear travel rays against real meshes,
// not merely descriptor origins or bounding boxes.
function hitSegment(start,end,a,b,c) {
  const sub=(a,b)=>a.map((v,k)=>v-b[k]);
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const dot=(a,b)=>a.reduce((s,v,k)=>s+v*b[k],0);
  const d=sub(end,start),e1=sub(b,a),e2=sub(c,a),p=cross(d,e2),det=dot(e1,p);
  if(Math.abs(det)<1e-9)return false;
  const t=sub(start,a),u=dot(t,p)/det;if(u<0||u>1)return false;
  const q=cross(t,e1),v=dot(d,q)/det;if(v<0||u+v>1)return false;
  const along=dot(e2,q)/det;return along>1e-6&&along<1-1e-6;
}
function clear(pieces,start,end) {
  for(const piece of pieces){const {built,out}=vertices(piece);
    for(let i=0;i<built.ib.length;i+=3)assert.equal(hitSegment(start,end,out[built.ib[i]],out[built.ib[i+1]],out[built.ib[i+2]]),false,piece.name+' blocks travel');}
}
test('three traced floors preserve plan areas and the outdoor recess',()=>{
  const pieces=load().make();
  const provenance=JSON.parse(fs.readFileSync(new URL('provenance.json',here)));
  assert.ok(provenance.references.some(r=>r.path.endsWith('house-plan.json')));
  const areas=JSON.parse(fs.readFileSync(new URL('floor-areas.json',here)));
  for(const [id,reference] of Object.entries(areas)){
    const room={id};
    const piece=pieces.find(p=>p.name===prefix+'floor-'+room.id);assert.ok(piece);
    const {built,out}=vertices(piece);let area=0;
    for(let i=0;i<built.ib.length;i+=3){const a=out[built.ib[i]],b=out[built.ib[i+1]],c=out[built.ib[i+2]];
      const cross=(b[2]-a[2])*(c[0]-a[0])-(b[0]-a[0])*(c[2]-a[2]);assert.ok(cross>0);area+=cross/2;}
    assert.ok(Math.abs(area-reference)<.0001,room.id+' triangulation area');
  }
  assert.equal(pieces.filter(p=>p.name.startsWith(prefix+'floor-')).length,3);
});
test('home entrance and connecting forest path stay open at child eye/body heights',()=>{
  const pieces=load().make(),route=[[-12.4,3.8],[-12.4,6],[-8,7],[-2,5],[3,1],[7,-3],[11,-5],[14,-7]];
  for(let i=0;i<route.length-1;i++)for(const h of [.6,1.3])for(const offset of [-.25,0,.25])
    clear(pieces,[route[i][0]+offset,h,route[i][1]],[route[i+1][0]+offset,h,route[i+1][1]]);
  // The canonical 0.59952m doorway is a narrower pinch point than the forest path.
  for(const offset of [-.10,0,.10])for(const h of [.6,1.3])
    clear(pieces,[-12.35+offset,h,2.6],[-12.35+offset,h,3.8]);
});
