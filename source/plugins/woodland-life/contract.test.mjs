import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const core=fs.readFileSync(new URL('../../core/math.js',import.meta.url),'utf8');
const plugin=fs.readFileSync(new URL('./plugin.js',import.meta.url),'utf8');
test('bounded geometry, stable identities, deterministic animation and finite transforms',()=>{
 const c=vm.createContext({});vm.runInContext(core+'\n'+plugin+'\nglobalThis.api={pieces:pinpinLifePieces,update:pinpinUpdateLife};',c);
 const pieces=c.api.pieces();assert.equal(pieces.length,24);assert.equal(c.api.pieces(),pieces);
 let tris=0;for(const p of pieces){const mesh=p.build();tris+=mesh.ib.length/3;assert.ok(mesh.nv>0);assert.equal(p.build(),mesh);for(const n of new Float32Array(mesh.vb).filter((_,i)=>i%4!==3))assert.ok(Number.isFinite(n));}
 assert.ok(tris<34000,`triangle budget: ${tris}`);
 for(const p of pieces){const mesh=p.build(),bytes=new Int8Array(mesh.vb);for(let i=0;i<mesh.nv;i++){if(p.name.includes('/understory-'))assert.equal(bytes[i*16+15],-83,'understory uses foliage marker');else assert.notEqual(bytes[i*16+15],-83,'other meshes preserve their existing aux values');}}
 const dynamic=pieces.filter(p=>p.dynamic);assert.equal(dynamic.length,18);
 const initial=JSON.stringify(dynamic.map(p=>[p.position,p.rotation]));c.api.update(1);assert.notEqual(JSON.stringify(dynamic.map(p=>[p.position,p.rotation])),initial);
 for(const t of [0,1,10000,NaN,Infinity]){c.api.update(t);for(const p of dynamic)assert.ok([...p.position,...p.rotation].every(Number.isFinite));}
 c.api.update(0);assert.equal(JSON.stringify(dynamic.map(p=>[p.position,p.rotation])),initial);
 assert.equal(pieces.filter(p=>!p.dynamic).length,6);
 console.log(`woodland life: ${tris} triangles, 24 pieces, 18 dynamic`);
});
test('texture fields are deterministic, exclude protected neighborhoods, and require registration',()=>{
 const fresh=()=>{const c=vm.createContext({});vm.runInContext(core+'\n'+plugin+'\nglobalThis.api={sample:pinpinSampleVegetationField,pieces:pinpinLifePieces};',c);return c.api;};
 const api=fresh(),density=Array(100).fill(1),excluded=Array(100).fill(false);excluded[55]=true;
 const field={width:10,height:10,density,excluded,worldFromUV:(u,v)=>[u*20,2,v*30],seed:731,limit:30,marginCells:1};
 const a=api.sample(field),b=api.sample(field);assert.equal(JSON.stringify(a),JSON.stringify(b));assert.equal(a.length,30);
 for(const p of a){const x=p.cell%10,y=Math.floor(p.cell/10);assert.ok(x>0&&x<9&&y>0&&y<9);assert.ok(Math.abs(x-5)>1||Math.abs(y-5)>1);assert.equal(p.position[1],2);}
 assert.throws(()=>api.sample({...field,worldFromUV:null}),/registered/);
 assert.throws(()=>api.sample({...field,density:[NaN,...density.slice(1)]}),/linear/);
 assert.throws(()=>api.sample({...field,worldFromUV:()=>[NaN,0,0]}),/finite/);
 const empty={...field,density:Array(100).fill(0)};assert.equal(api.sample(empty).length,0);assert.equal(fresh().pieces({vegetationField:empty}).length,0,'valid empty texture must not recreate hand-placed vegetation');
 const pieces=fresh().pieces({vegetationField:field});assert.ok(pieces.length>0);for(const p of pieces){const m=p.build(),v=new Float32Array(m.vb);assert.ok(m.nv>0);if(p.name.includes('butterfly'))continue;for(let i=0;i<m.nv;i++)assert.ok(v[i*4+1]>=1.99,'geometry follows registered terrain height');}
});
