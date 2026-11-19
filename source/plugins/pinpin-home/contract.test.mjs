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
  return {make:(options)=>vm.runInContext(functionName+'('+JSON.stringify(options??{})+')',context,{timeout:10000}),context};
}
const vertexCache=new WeakMap();
function vertices(piece) {
  if(vertexCache.has(piece))return vertexCache.get(piece);
  const built=piece.build(),f=new Float32Array(built.vb),out=[];
  for(let i=0;i<built.nv;i++)out.push([f[i*4]+piece.position[0],f[i*4+1]+piece.position[1],f[i*4+2]+piece.position[2]]);
  const bounds=[0,1,2].map(k=>[Math.min(...out.map(p=>p[k])),Math.max(...out.map(p=>p[k]))]);
  const result={built,out,bounds};vertexCache.set(piece,result);return result;
}
// Geometry assertions share immutable fixtures; determinism tests below still
// invoke fresh factories/contexts and rebuild the same descriptors independently.
const fixtures=new Map();
function fixture(quality='low'){
  if(!fixtures.has(quality))fixtures.set(quality,load().make({foliageQuality:quality}));
  return fixtures.get(quality);
}
function snapshot(pieces) {
  const hash=createHash('sha256');
  for(const p of pieces){
    const built=p.build(); // one independent rebuild; hash every packed byte
    const metadata=JSON.stringify({name:p.name,asset:p.asset,position:Array.from(p.position),rotation:Array.from(p.rotation),
      scale:Array.from(p.scale),color:Array.from(p.color),nv:built.nv,vbBytes:built.vb.byteLength,ibBytes:built.ib.byteLength});
    hash.update(metadata).update('\0');
    hash.update(Buffer.from(built.vb));
    hash.update(Buffer.from(built.ib.buffer,built.ib.byteOffset,built.ib.byteLength));
  }
  return hash.digest('hex');
}
test('definition has no browser effects; pieces meet the packed Mesh contract',()=>{
  const pieces=fixture();assert.ok(pieces.length>=40);
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
  assert.ok(totalVertices>5000&&totalVertices<130000,'bounded substantial geometry');
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
  for(const piece of pieces){const {built,out,bounds}=vertices(piece);
    // Conservative segment AABB rejection skips distant geometry, preserving
    // real triangle intersections for every potentially overlapping piece.
    if(bounds.some(([lo,hi],k)=>Math.max(start[k],end[k])<lo||Math.min(start[k],end[k])>hi))continue;
    for(let i=0;i<built.ib.length;i+=3)assert.equal(hitSegment(start,end,out[built.ib[i]],out[built.ib[i+1]],out[built.ib[i+2]]),false,piece.name+' blocks travel');}
}
test('three traced floors preserve plan areas and the outdoor recess',()=>{
  const pieces=fixture();
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
  const pieces=fixture(),route=vm.runInContext("pinpinAtlasLayout().route",load().context);
  for(let i=0;i<route.length-1;i++)for(const h of [.6,1.3])for(const offset of [-.25,0,.25])
    clear(pieces.filter(p=>!p.name.startsWith(prefix+'path-')),[route[i][0]+offset,h,route[i][1]],[route[i+1][0]+offset,h,route[i+1][1]]);
  // The canonical 0.59952m doorway is a narrower pinch point than the forest path.
  for(const offset of [-.10,0,.10])for(const h of [.6,1.3])
    clear(pieces,[-12.35+offset,h,2.6],[-12.35+offset,h,3.8]);
});
test('wall vertices remain within the canonical height envelope',()=>{
  // Aperture geometry must not add spurious height below the floor or ceiling.
  const pieces=fixture().filter(p=>p.name.startsWith(prefix+'wall-'));
  for(const piece of pieces){const {out}=vertices(piece);for(const p of out)assert.ok(p[1]>=-1e-6&&p[1]<=2.650001,piece.name+' distorted aperture elevation');}
});
test('authored understory stays within its geometry budget and outside the outdoor walking ribbon',()=>{
  const pieces=fixture();
  const details=pieces.filter(p=>/understory|woodland-ferns|shoulder-stones|forest-flower|mushroom|entry-herbs|entry-terracotta|root-fingers/.test(p.name));
  const count=details.reduce((n,p)=>n+p.build().nv,0);
  assert.ok(count>3000&&count<18000,'detail vertices '+count+' exceed the authored budget');
  assert.ok(details.length<=15,'batch detail by material instead of per sprig');
  const route=vm.runInContext("pinpinAtlasLayout().route",load().context);
  for(let i=0;i<route.length-1;i++) {
    const a=route[i],b=route[i+1],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);
    for(const offset of [-.55,0,.55])for(const y of [.12,.35,.8]) {
      const n=[-dz/len*offset,dx/len*offset];
      clear(details,[a[0]+n[0],y,a[1]+n[1]],[b[0]+n[0],y,b[1]+n[1]]);
    }
  }
});
test('the migrated path has earth ramps to each rotated physical deck end',()=>{
 const pieces=fixture(),layout=vm.runInContext('pinpinAtlasLayout()',load().context),b=layout.bridge;
 const ramps=pieces.filter(p=>p.name.startsWith(prefix+'path-')).flatMap(p=>vertices(p).out).filter(p=>Math.abs(p[1]-b.deckHeight)<.03);
 assert.ok(ramps.length>=4,'both approaches meet deck height');
 for(const end of [b.west,b.east])assert.ok(ramps.some(v=>Math.hypot(v[0]-end[0],v[2]-end[1])<1.1),'ramp reaches deck endpoint');
});
test('woodland enclosure has broad planting, layered height, and a bounded batched cost',()=>{
  const pieces=fixture(),enclosure=pieces.filter(p=>/planted-ground|island-shrubs|(?:trunk|canopy)-1\d\d$/.test(p.name));
  const cost=enclosure.reduce((n,p)=>n+p.build().nv,0);
  assert.equal(enclosure.length,42);assert.ok(cost>55000&&cost<75000,'enclosure budget '+cost);
  let area=0;
  for(const piece of enclosure.filter(p=>p.name.includes('planted-ground'))){const {out,built}=vertices(piece);
    for(let i=0;i<built.ib.length;i+=3){const [a,b,c]=[out[built.ib[i]],out[built.ib[i+1]],out[built.ib[i+2]]];area+=Math.abs((b[0]-a[0])*(c[2]-a[2])-(b[2]-a[2])*(c[0]-a[0]))/2;}
  }
  assert.ok(area>70,'ground planting must read as islands rather than tiny props');
  const shrubs=enclosure.filter(p=>p.name.includes('island-shrubs')).flatMap(p=>vertices(p).out);
  assert.ok(shrubs.some(p=>p[1]>1),'middle-height leaf silhouettes');
  const crowns=enclosure.filter(p=>/canopy-1\d\d$/.test(p.name)).flatMap(p=>vertices(p).out);
  assert.ok(crowns.some(p=>p[1]>7),'backdrop crown layer');
  const route=vm.runInContext("pinpinAtlasLayout().route",load().context);
  for(let i=0;i<route.length-1;i++){
    const a=route[i],b=route[i+1],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);
    for(const offset of [-.65,0,.65])for(const y of [.12,.5,1.25]){
      const n=[-dz/len*offset,dx/len*offset];clear(enclosure,[a[0]+n[0],y,a[1]+n[1]],[b[0]+n[0],y,b[1]+n[1]]);
    }
  }
});

test('each added sapling exposes one recognized trunk/canopy fade pair',()=>{
  const pieces=fixture();
  for(let i=100;i<118;i++){
    for(const kind of ['trunk','canopy'])assert.equal(pieces.filter(p=>p.name===prefix+kind+'-'+i).length,1);
  }
  assert.equal(pieces.filter(p=>/(?:trunk|canopy)-1\d\d$/.test(p.name)).length,36);
  assert.ok(!pieces.some(p=>/woodland-sapling|woodland-layered/.test(p.name)),'no enclosure-wide fade bounds');
});

test('tree crowns are small supported two-sided leaf surfaces with the signed foliage marker',()=>{
  const pieces=fixture(),crowns=pieces.filter(p=>/\/canopy-\d+$/.test(p.name));
  assert.equal(crowns.length,31);let leafVertices=0;
  for(const crown of crowns){
    const {built,out}=vertices(crown),bytes=new Int8Array(built.vb);
    assert.ok(built.nv===2048,'bounded separate front/back leaf surfaces');leafVertices+=built.nv;
    const trunk=pieces.find(p=>p.name===crown.name.replace('/canopy-','/trunk-'));
    const wood=vertices(trunk),woodBytes=new Int8Array(wood.built.vb);
    for(let i=0;i<wood.built.nv;i++)assert.ok(woodBytes[i*16+15]>=0,'bark must not carry leaf material');
    for(let i=0;i<built.nv;i++){assert.ok([-85,-83,-80].includes(bytes[i*16+15]),'signed foliage tone band');}
    for(let i=0;i<built.nv;i+=8){
      for(let k=0;k<4;k++)assert.deepEqual(out[i+k],out[i+k+4],'back face keeps leaf outline');
      const p=out[i],distance=Math.min(...wood.out.map(q=>Math.hypot(p[0]-q[0],p[1]-q[1],p[2]-q[2])));
      assert.ok(distance<1.4,'leaf clusters remain within branching envelope');
    }
    for(let i=0;i<built.ib.length;i+=3){const p=built.ib.slice(i,i+3);
      for(let k=0;k<3;k++){const a=out[p[k]],b=out[p[(k+1)%3]];assert.ok(Math.hypot(...a.map((v,j)=>v-b[j]))<.80,'no broad filled crown facets');}
    }
  }
  assert.ok(leafVertices<65000,'tree leaf budget');
});
function leafArea(piece){
  const {built,out}=vertices(piece);let area=0;
  for(let i=0;i<built.ib.length;i+=3){const [a,b,c]=[out[built.ib[i]],out[built.ib[i+1]],out[built.ib[i+2]]];
    area+=Math.abs((b[0]-a[0])*(c[2]-a[2])-(b[2]-a[2])*(c[0]-a[0]))/2;
  }
  return area/2; // count the physical leaf once, excluding duplicated reverse faces
}
function crownCoverage(piece){
  const {built,out}=vertices(piece),lo=[Infinity,Infinity],hi=[-Infinity,-Infinity];
  for(const p of out)for(let k=0;k<2;k++){const v=p[k*2];lo[k]=Math.min(lo[k],v);hi[k]=Math.max(hi[k],v);}
  const triangles=[];
  for(let i=0;i<built.ib.length;i+=12)for(let k=0;k<6;k+=3)triangles.push([0,1,2].map(j=>out[built.ib[i+k+j]]));
  let covered=0;
  const cross=(a,b,x,z)=>(b[0]-a[0])*(z-a[2])-(b[2]-a[2])*(x-a[0]);
  for(let i=0;i<32;i++)for(let j=0;j<32;j++){
    const x=lo[0]+(i+.5)/32*(hi[0]-lo[0]),z=lo[1]+(j+.5)/32*(hi[1]-lo[1]);
    if(triangles.some(([a,b,c])=>{const q=[cross(a,b,x,z),cross(b,c,x,z),cross(c,a,x,z)];return q.every(v=>v>=0)||q.every(v=>v<=0);}))covered++;
  }
  return covered/1024;
}
test('both pure quality levels retain leaf mass, canopy coverage and deterministic canonical guards',()=>{
  const {make,context}=load(),low=fixture(),high=fixture('high');
  assert.throws(()=>make({foliageQuality:'automatic'}),/foliageQuality/);
  assert.equal(high.length,low.length);assert.deepEqual(Array.from(high,p=>p.name),Array.from(low,p=>p.name));
  for(const [pieces,limit,minArea] of [[low,130000,32],[high,330000,55]]){
    assert.ok(pieces.reduce((n,p)=>n+p.build().nv,0)<limit,'explicit quality geometry budget');
    const crowns=pieces.filter(p=>/\/canopy-\d+$/.test(p.name));
    for(const p of crowns){assert.ok(leafArea(p)>minArea,p.name+' lacks overlapping projected leaf area');
      for(const [x,y,z] of vertices(p).out)assert.ok(x>-25&&x<20&&y>3&&y<12&&z>-12&&z<14,'quality crown bounds/child clearance');
    }
    for(const crown of crowns){const coverage=crownCoverage(crown);assert.ok(coverage>.70,crown.name+' crown coverage '+coverage);}
  }
  assert.equal(snapshot(low.filter(p=>!p.name.includes('/canopy-'))),snapshot(high.filter(p=>!p.name.includes('/canopy-'))),'quality changes only crowns');
  vm.runInContext('rseed(735)',context);const before=vm.runInContext('_seed',context);
  assert.equal(snapshot(high),snapshot(make({foliageQuality:'high'})));assert.equal(vm.runInContext('_seed',context),before);
});
test('authored leaders end in tiny tapered tips beneath inner crown foliage',()=>{
  const pieces=fixture();
  for(const tree of pieces.filter(p=>/\/trunk-\d+$/.test(p.name))){
    const index=Number(tree.name.split('-').at(-1)),sides=index>=100?7:9;
    const out=vertices(tree).out,tip=out[sides*4];
    for(const p of out.slice(sides*3,sides*4))assert.ok(Math.hypot(...p.map((v,k)=>v-tip[k]))<.009,'leader no longer ends in a broad flat cut');
    const crown=pieces.find(p=>p.name===tree.name.replace('/trunk-','/canopy-'));
    assert.ok(vertices(crown).out.some(p=>Math.hypot(p[0]-tip[0],p[2]-tip[2])<.4&&p[1]>tip[1]+.15),'inner foliage overtops leader');
  }
});
