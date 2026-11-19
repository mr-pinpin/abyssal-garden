import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const core=fs.readFileSync(new URL('../../core/math.js',import.meta.url),'utf8');
const plugin=fs.readFileSync(new URL('./plugin.js',import.meta.url),'utf8');
test('bounded geometry, stable identities, deterministic animation and finite transforms',()=>{
 const c=vm.createContext({});vm.runInContext(core+'\n'+plugin+'\nglobalThis.api={pieces:pinpinLifePieces,update:pinpinUpdateLife};',c);
 const pieces=c.api.pieces();assert.equal(pieces.length,21);assert.equal(c.api.pieces(),pieces);
 let tris=0;for(const p of pieces){const mesh=p.build();tris+=mesh.ib.length/3;assert.ok(mesh.nv>0);assert.equal(p.build(),mesh);for(const n of new Float32Array(mesh.vb).filter((_,i)=>i%4!==3))assert.ok(Number.isFinite(n));}
 assert.ok(tris<2000,`triangle budget: ${tris}`);
 const dynamic=pieces.filter(p=>p.dynamic);assert.equal(dynamic.length,18);
 const initial=JSON.stringify(dynamic.map(p=>[p.position,p.rotation]));c.api.update(1);assert.notEqual(JSON.stringify(dynamic.map(p=>[p.position,p.rotation])),initial);
 for(const t of [0,1,10000,NaN,Infinity]){c.api.update(t);for(const p of dynamic)assert.ok([...p.position,...p.rotation].every(Number.isFinite));}
 c.api.update(0);assert.equal(JSON.stringify(dynamic.map(p=>[p.position,p.rotation])),initial);
 assert.equal(pieces.filter(p=>!p.dynamic).length,3);
 console.log(`woodland life: ${tris} triangles, 21 pieces, 18 dynamic`);
});
