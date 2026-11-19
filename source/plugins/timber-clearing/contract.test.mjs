import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const math=fs.readFileSync(new URL('../../core/math.js',import.meta.url),'utf8'),plugin=fs.readFileSync(new URL('./plugin.js',import.meta.url),'utf8');
function pieces(){return vm.runInNewContext(math+'\n'+plugin+'\npinpinClearingPieces()');}
test('clearing has one migrated crossing and no stale duplicate road',()=>{
 const all=pieces();assert.ok(!all.some(p=>p.name.endsWith('/clearing-path')));
 const bridge=all.find(p=>p.asset==='footbridge'),tractor=all.find(p=>p.asset==='timber-tractor');
 assert.ok(Math.abs(bridge.rotation[1]+1.738624097)<1e-7);
 assert.ok(tractor.position[0]>bridge.position[0]&&tractor.position[2]>bridge.position[2]);
});
test('clearing descriptors retain five distinct assets and finite bounded procedural geometry',()=>{
 const all=pieces();assert.equal(new Set(all.map(p=>p.name)).size,all.length);assert.equal(all.filter(p=>p.asset).length,5);
 for(const p of all){const m=p.build();assert.ok(m.nv>0&&m.nv<20000);const f=new Float32Array(m.vb);for(let i=0;i<m.nv;i++)for(let k=0;k<3;k++)assert.ok(Number.isFinite(f[i*4+k]));for(const i of m.ib)assert.ok(i<m.nv);}
});
