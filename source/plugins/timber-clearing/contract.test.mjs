import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const math=fs.readFileSync(new URL('../../core/math.js',import.meta.url),'utf8'),plugin=fs.readFileSync(new URL('./plugin.js',import.meta.url),'utf8');
function pieces(){return vm.runInNewContext(math+'\n'+plugin+'\npinpinClearingPieces()');}
test('clearing approach stays on the bank and joins the physical bridge route',()=>{
 const p=pieces().find(p=>p.name.endsWith('/clearing-path')),m=p.build(),v=new Float32Array(m.vb);
 for(let i=0;i<m.nv;i++){const z=v[i*4+2]+p.position[2];assert.ok(z>=7.75,'dirt route must never pave the stream or bank at z4.25..7.75');}
 const xs=Array.from({length:m.nv},(_,i)=>v[i*4]);assert.ok(Math.max(...xs)>=7,'approach meets bridge-side route');assert.ok(Math.min(...xs)<=1,'approach reaches clearing');
});
test('clearing descriptors retain five distinct assets and finite bounded procedural geometry',()=>{
 const all=pieces();assert.equal(new Set(all.map(p=>p.name)).size,all.length);assert.equal(all.filter(p=>p.asset).length,5);
 for(const p of all){const m=p.build();assert.ok(m.nv>0&&m.nv<20000);const f=new Float32Array(m.vb);for(let i=0;i<m.nv;i++)for(let k=0;k<3;k++)assert.ok(Number.isFinite(f[i*4+k]));for(const i of m.ib)assert.ok(i<m.nv);}
});
