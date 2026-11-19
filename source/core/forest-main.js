// Demand-driven forest renderer; original underwater main.js remains available.
const forestState=window.__pinpin={ready:false,mode:'loading',models:[],frames:0,errors:[],chapter:'clearing'};
const forestFail=error=>{forestState.errors.push(String(error));const el=document.getElementById('error');el.hidden=false;el.textContent='The forest could not open. '+error.message;};
// BEGIN GENERATED TEXTURE RUNTIME — pure raster-driven geometry machinery.
function forestTextureWorld(data,{software=false}={}){
 const {width:w,height:h,forward:f,inverse:m}=data;
 if(data.schema!=='generated-atlas-runtime'||!Number.isInteger(w)||!Number.isInteger(h)||w*h>65536||data.heightField.length!==w*h||data.groundClasses.length!==w*h||!f?.every(Number.isFinite)||!m?.every(Number.isFinite))throw Error('Invalid required atlas texture grid');
 const project=(u,v)=>[f[0]*u+f[1]*v+f[2],f[3]*u+f[4]*v+f[5]],uv=(x,z)=>[m[0]*x+m[1]*z+m[2],m[3]*x+m[4]*z+m[5]],inside=p=>p[0]>=0&&p[0]<1&&p[1]>=0&&p[1]<1,index=(u,v)=>Math.max(0,Math.min(h-1,Math.floor(v*h)))*w+Math.max(0,Math.min(w-1,Math.floor(u*w))),ground=(x,z)=>{const p=uv(x,z);return inside(p)?data.groundClasses[index(...p)]:-1;};
 const foundations=[];
 const field=data.heightField.map((v,i)=>{if(!Number.isFinite(v)||v<0||v>1)throw Error('Invalid height texture sample');const kind=data.groundClasses[i];if(kind===2||kind>=5)return 0;const x=i%w,y=Math.floor(i/w);let distance=3;for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=w||yy>=h)continue;const k=data.groundClasses[yy*w+xx];if(k===2||k>=5)distance=Math.min(distance,Math.hypot(dx,dy));}return v*data.heightScale*Math.min(1,distance/3);});
 // Bounded slope reconstruction of generated displacement; no manual sculpt sites.
 const du=Math.hypot(f[0]/w,f[3]/w),dv=Math.hypot(f[1]/h,f[4]/h);
 for(let pass=0;pass<10;pass++)for(const reverse of [false,true])for(let q=0;q<field.length;q++){const i=reverse?field.length-1-q:q,x=i%w,y=Math.floor(i/w);for(const [xx,yy,d]of [[x-1,y,du],[x+1,y,du],[x,y-1,dv],[x,y+1,dv]])if(xx>=0&&yy>=0&&xx<w&&yy<h)field[i]=Math.min(field[i],field[yy*w+xx]+d*.45);}
 const baseHeight=(x,z)=>{const p=uv(x,z);if(!inside(p))return 0;const xx=p[0]*w-.5,yy=p[1]*h-.5,x0=Math.floor(xx),y0=Math.floor(yy),tx=xx-x0,ty=yy-y0;const at=(a,b)=>field[Math.max(0,Math.min(h-1,b))*w+Math.max(0,Math.min(w-1,a))];let value=(at(x0,y0)*(1-tx)+at(x0+1,y0)*tx)*(1-ty)+(at(x0,y0+1)*(1-tx)+at(x0+1,y0+1)*tx)*ty;for(const b of foundations){const d=Math.hypot(Math.max(0,b[0]-x,x-b[2]),Math.max(0,b[1]-z,z-b[3]));value=Math.min(value,d*.45);}return value;};
 const b=data.landmarks.bridge,t=data.bridgeTemplate,scale=b&&t?b.length/(t.max[2]-t.min[2]):1,deckHeight=b&&t?t.max[1]*scale+.02:0;
 const bridgeProfile=(x,z,base)=>{if(!b)return base;const dx=x-b.center[0],dz=z-b.center[1],along=dx*b.axis[0]+dz*b.axis[1],side=Math.abs(-dx*b.axis[1]+dz*b.axis[0]),half=b.length/2,kind=ground(x,z);if(side>.85||Math.abs(along)>half+1.5)return base;if(kind===7&&Math.abs(along)<=half)return deckHeight;if(kind!==1)return base;const blend=Math.max(0,1-Math.max(0,Math.abs(along)-half)/1.5);return base*(1-blend)+deckHeight*blend;};
 const heightAt=(x,z)=>bridgeProfile(x,z,baseHeight(x,z));
 const colors=[[.24,.36,.12],[.48,.34,.19],[.16,.43,.46],[.42,.42,.37],[.24,.29,.11],[.28,.33,.14],[.28,.33,.14],[.16,.43,.46],[.43,.34,.20]],step=software?2:1;let terrainCache=null;
 const buildTerrain=()=>{if(terrainCache)return terrainCache;const meshes=colors.map(()=>new Mesh());for(let y=0;y<h;y+=step)for(let x=0;x<w;x+=step){const kind=data.groundClasses[y*w+x],water=kind===2||kind===7,mesh=meshes[kind],corners=[[x,y],[x,Math.min(h,y+step)],[Math.min(w,x+step),Math.min(h,y+step)],[Math.min(w,x+step),y]],ids=corners.map(([a,c])=>{const p=project(a/w,c/h);return mesh.v(p[0],water?data.waterLevel:heightAt(...p),p[1]);});mesh.quad(...ids);}return terrainCache=meshes.map((mesh,kind)=>mesh.p.length?mesh.build((x,y,z)=>{if(kind===2||kind===7)return [0,1,0];const e=.08;return [-(heightAt(x+e,z)-heightAt(x-e,z))/(2*e),1,-(heightAt(x,z+e)-heightAt(x,z-e))/(2*e)];}):null);};
 const pieces=colors.flatMap((color,i)=>data.groundClasses.includes(i)?[{name:'atlas-terrain/'+data.groundNames[i],asset:null,position:[0,0,0],rotation:[0,0,0],scale:[1,1,1],color,build:()=>buildTerrain()[i]}]:[]);
 const clear=(x,z,r,{garden=false}={})=>{if(foundations.some(b=>x>=b[0]-r&&x<=b[2]+r&&z>=b[1]-r&&z<=b[3]+r))return false;for(let j=0;j<24;j++){const a=j*Math.PI/12,p=uv(x+Math.cos(a)*r,z+Math.sin(a)*r);if(!inside(p))return false;const k=data.groundClasses[index(...p)];if(k!==0&&!(garden&&k===4))return false;}return true;};
 const hash=i=>{let n=(i^data.seed)>>>0;n=Math.imul(n^(n>>>16),0x7feb352d);n=Math.imul(n^(n>>>15),0x846ca68b);return ((n^(n>>>16))>>>0)/4294967296;};
 const treePoints=[];for(const {i,rank}of data.density.trees.map((d,i)=>({i,rank:hash(i),d})).filter(p=>p.rank<p.d).sort((a,b)=>hash(a.i+1048576)-hash(b.i+1048576))){const p=project((i%w+.5)/w,(Math.floor(i/w)+.5)/h),r=data.limits.treeRadius;if(!clear(...p,r)||treePoints.some(t=>Math.hypot(t.position[0]-p[0],t.position[2]-p[1])<r*2.1))continue;treePoints.push({position:[p[0],heightAt(...p),p[1]],height:4+data.density.trees[i]*3+data.heightField[i],cell:i});if(treePoints.length>=(software?32:64))break;}
 const excluded=data.excluded.map((v,i)=>{const p=project((i%w+.5)/w,(Math.floor(i/w)+.5)/h);return !clear(...p,data.limits.understoryRadius,{garden:true});}),density=data.density.flowers.map((v,i)=>excluded[i]?0:Math.max(v,data.density.shrubs[i]*.45));
 const vegetationField={width:w,height:h,density,excluded,worldFromUV:(u,v)=>{const p=project(u,v);return [p[0],heightAt(...p),p[1]];},seed:data.seed,limit:260,marginCells:1};
 const addFoundation=box=>{if(box.length!==4||!box.every(Number.isFinite))throw Error('Invalid foundation bounds');foundations.push(box);terrainCache=null;for(let i=0;i<excluded.length;i++){const p=project((i%w+.5)/w,(Math.floor(i/w)+.5)/h);excluded[i]=!clear(...p,data.limits.understoryRadius,{garden:true});vegetationField.density[i]=excluded[i]?0:Math.max(data.density.flowers[i],data.density.shrubs[i]*.45);}};
 const propSites=data.groundClasses.map((kind,i)=>({kind,i,p:project((i%w+.5)/w,(Math.floor(i/w)+.5)/h)})).filter(p=>p.kind===0).sort((a,c)=>Math.hypot(a.p[0]-b.center[0],a.p[1]-b.center[1])-Math.hypot(c.p[0]-b.center[0],c.p[1]-b.center[1])).map(p=>p.p);
 return {data,propSites,addFoundation,foundations,pieces,project,uv,ground,heightAt,baseHeight,treePoints,vegetationField,clear,bridge:{...b,scale,deckHeight},route:data.route};
}
// END GENERATED TEXTURE RUNTIME

// Choose geometry detail only after an actual device succeeds. Keep the adapter
// and device alive for the renderer; software fallback builds the lower detail.
const forestPreparedGPU=await(async()=>{
 if(!navigator.gpu)return null;
 try{const adapter=await navigator.gpu.requestAdapter();return adapter?{adapter,device:await adapter.requestDevice()}:null;}catch{return null;}
})();
const forestFoliageQuality=forestPreparedGPU?'high':'low';forestState.foliageQuality=forestFoliageQuality;
const forestAtlasResponse=await fetch('assets/atlas-studies/runtime-v3.json');if(!forestAtlasResponse.ok)throw Error('Required generated atlas fields could not load');
const forestAtlas=forestTextureWorld(await forestAtlasResponse.json(),{software:!forestPreparedGPU});forestState.atlasTextures={version:3,inputs:forestAtlas.data.provenance,trees:forestAtlas.treePoints.length,routeCells:forestAtlas.route.length};
const forestSources={home:typeof pinpinHomePieces==='function'?()=>pinpinHomePieces({foliageQuality:forestFoliageQuality,textureField:forestAtlas}):null,clearing:typeof pinpinClearingPieces==='function'?()=>pinpinClearingPieces().filter(p=>p.asset&&p.asset!=='windfallen-tree'):null,elder:typeof pinpinElderPieces==='function'?pinpinElderPieces:null};
const forestPieces=[...forestAtlas.pieces,...Object.values(forestSources).flatMap(make=>make?make():[])];

// Align existing character/architecture templates to GENERATED class-map ports.
for(const p of forestPieces){
 let delta=null;
 if(p.name.startsWith('pinpin-home/')&&!/\/(?:trunk|canopy)-/.test(p.name)){const port=forestAtlas.data.landmarks.home?.port,legacy=forestAtlas.data.templatePorts.home;if(port)delta=[port[0]-legacy[0],0,port[1]-legacy[1]];}
 if(p.name.startsWith('elder-sanctuary/')){const port=forestAtlas.data.landmarks.elder?.port,legacy=forestAtlas.data.templatePorts.elder;if(port)delta=[port[0]-legacy[0],0,port[1]-legacy[1]];}
 if(delta)p.position=p.position.map((v,i)=>v+delta[i]);
 if(p.asset==='timber-tractor'&&forestAtlas.data.landmarks.tractor){p.textureAnchor=forestAtlas.data.landmarks.tractor.center;const t=forestAtlas.data.landmarks.tractor,a=t.axis,sign=(forestAtlas.bridge.center[0]-t.center[0])*a[0]+(forestAtlas.bridge.center[1]-t.center[1])*a[1]>=0?1:-1;p.rotation=[0,-Math.atan2(a[1]*sign,a[0]*sign),0];}
 if(p.asset&&p.asset!=='footbridge'&&p.asset!=='timber-tractor')p.texturePlacement=true;
 if(p.asset==='footbridge'&&forestAtlas.bridge.center){const b=forestAtlas.bridge,t=forestAtlas.data.bridgeTemplate,yaw=Math.atan2(b.axis[0],b.axis[1]),mid=[(t.min[0]+t.max[0])/2,(t.min[2]+t.max[2])/2];p.rotation=[0,yaw,0];p.scale=[b.scale,b.scale,b.scale];p.position=[b.center[0]-b.scale*(Math.cos(yaw)*mid[0]+Math.sin(yaw)*mid[1]),.02,b.center[1]-b.scale*(-Math.sin(yaw)*mid[0]+Math.cos(yaw)*mid[1])];}
}
// Physical constraints are derived from the existing asset geometry, never new
// authored world coordinates. They keep floor/route physics valid during conversion.
for(const p of forestPieces.filter(p=>/pinpin-home\/floor-|elder-sanctuary\/(?:broad-stone-floor|passage-earth-path)/.test(p.name))){const mesh=p.build(),f=new Float32Array(mesh.vb),bounds=[Infinity,Infinity,-Infinity,-Infinity];for(let i=0;i<mesh.nv;i++){const x=f[i*4]+p.position[0],z=f[i*4+2]+p.position[2];bounds[0]=Math.min(bounds[0],x);bounds[1]=Math.min(bounds[1],z);bounds[2]=Math.max(bounds[2],x);bounds[3]=Math.max(bounds[3],z);}forestAtlas.addFoundation(bounds);}
for(let i=forestPieces.length-1;i>=0;i--){const p=forestPieces[i],match=/pinpin-home\/(?:trunk|canopy)-(\d+)$/.exec(p.name);if(!match)continue;const point=forestAtlas.treePoints[Number(match[1])];if(!point||!forestAtlas.clear(point.position[0],point.position[2],forestAtlas.data.limits.treeRadius)){forestPieces.splice(i,1);continue;}p.position[1]+=forestAtlas.heightAt(point.position[0],point.position[2])-point.position[1];}
forestState.atlasTextures.trees=forestPieces.filter(p=>/pinpin-home\/trunk-/.test(p.name)).length;
if(typeof pinpinLifePieces==='function')forestPieces.push(...pinpinLifePieces({vegetationField:forestAtlas.vegetationField}));
const forestGeometry=await Promise.all(forestPieces.map(async piece=>{
 const mesh=piece.asset&&typeof setPiece==='function'?await setPiece(piece.asset,piece.build):piece.build();

 if(piece.asset)forestState.models.push(mesh.source||{name:piece.asset,url:null,loaded:false});
 return {piece,mesh};
}));
const forestPropPlacements=[];
for(const object of forestGeometry){const {piece:p,mesh}=object;if(!p.textureAnchor&&!p.texturePlacement)continue;const f=new Float32Array(mesh.vb),lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];for(let i=0;i<mesh.nv;i++)for(let k=0;k<3;k++){lo[k]=Math.min(lo[k],f[i*4+k]);hi[k]=Math.max(hi[k],f[i*4+k]);}if(p.asset==='timber-tractor'){const scale=forestAtlas.data.landmarks.tractor.length/(hi[0]-lo[0]);p.scale=[scale,scale,scale];}
 const r=Math.hypot((hi[0]-lo[0])*p.scale[0],(hi[2]-lo[2])*p.scale[2])/2;
 if(p.texturePlacement){const target=forestAtlas.propSites.find(q=>forestAtlas.clear(...q,r+.15)&&forestPropPlacements.every(o=>Math.hypot(o.anchor[0]-q[0],o.anchor[1]-q[1])>o.radius+r+.25));if(!target)throw Error('Generated textures have no clear footprint for '+p.asset);p.textureAnchor=target;p.rotation=[0,Math.atan2(forestAtlas.bridge.center[0]-target[0],forestAtlas.bridge.center[1]-target[1]),0];}
 const mid=[(lo[0]+hi[0])/2,(lo[2]+hi[2])/2],a=p.rotation[1];p.position=[p.textureAnchor[0]-p.scale[0]*(Math.cos(a)*mid[0]+Math.sin(a)*mid[1]),forestAtlas.heightAt(...p.textureAnchor)-lo[1]*p.scale[1],p.textureAnchor[1]-p.scale[2]*(-Math.sin(a)*mid[0]+Math.cos(a)*mid[1])];forestPropPlacements.push({asset:p.asset,anchor:p.textureAnchor.slice(),radius:r});
}
// Keep full generated tree footprints clear of the actual generated prop sites.
for(let i=forestGeometry.length-1;i>=0;i--){const o=forestGeometry[i],match=/pinpin-home\/(?:trunk|canopy)-(\d+)$/.exec(o.piece.name);if(!match)continue;const point=forestAtlas.treePoints[Number(match[1])];if(forestPropPlacements.some(p=>Math.hypot(p.anchor[0]-point.position[0],p.anchor[1]-point.position[2])<p.radius+forestAtlas.data.limits.treeRadius)){forestGeometry.splice(i,1);}}
forestState.atlasTextures.trees=forestGeometry.filter(o=>/pinpin-home\/trunk-/.test(o.piece.name)).length;forestState.atlasTextures.props=forestPropPlacements;
const forestLoaded=forestState.models.filter(m=>m.loaded).length;
document.getElementById('load-status').textContent=forestState.models.length?`${forestLoaded} / ${forestState.models.length} story studies ready${forestLoaded<forestState.models.length?' · fallback shapes in use':''}`:'Procedural forest · models plugin switched off';
const forestVec={sub:(a,b)=>a.map((v,i)=>v-b[i]),dot:(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),cross:(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],norm:a=>{const l=Math.hypot(...a)||1;return a.map(v=>v/l);}};
function forestMultiply(a,b){const m=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)m[c*4+r]+=a[k*4+r]*b[c*4+k];return m;}
function forestModel(piece){
 const q=qMul(qMul(qAxis(0,0,1,piece.rotation[2]),qAxis(0,1,0,piece.rotation[1])),qAxis(1,0,0,piece.rotation[0]));
 const [x,y,z,w]=q,[sx,sy,sz]=piece.scale,[tx,ty,tz]=piece.position;
 return Float32Array.of((1-2*(y*y+z*z))*sx,2*(x*y+z*w)*sx,2*(x*z-y*w)*sx,0,2*(x*y-z*w)*sy,(1-2*(x*x+z*z))*sy,2*(y*z+x*w)*sy,0,2*(x*z+y*w)*sz,2*(y*z-x*w)*sz,(1-2*(x*x+y*y))*sz,0,tx,ty,tz,1);
}
const forestPresets={
 home:{target:[-12,1.5,0],distance:23,yaw:.65,elevation:.70,kicker:'Field notes · Chapter 01',title:'A quiet place.<br><em>A warm welcome.</em>',description:'A green door, round windows and a mossy roof. Follow the woodland path to the place PinPin and his family call home.',action:'Step a little closer'},
 clearing:{target:[10,1,11],distance:38,yaw:.36,elevation:.70,kicker:'Field notes · Chapter 02',title:'Small paws.<br><em>Big discoveries.</em>',description:'A red tractor, a helpful beaver, and a bridge made just right for little paws. Every adventure begins with a little curiosity.',action:'Meet the little lookout'},
 elder:{target:[14,1.8,-16],distance:18,yaw:.42,elevation:.55,kicker:'Field notes · Chapter 03',title:'Under the roots.<br><em>Into wonder.</em>',description:'Beyond the Elder’s woven mat, pale roots lead to old paintings, warm lamps and stories about caring for one another.',action:'Look inside the sanctuary'}
};
let forestCamera={...forestPresets.clearing},forestEye=[0,0,0],forestTour=false,forestQueued=false,forestLast=0,forestDraw;
// Grounded outdoor corridor, not general mesh collision. Radius stays inside the
// authored 1.8m path; the northern endpoint stops before the sanctuary walls.
const forestWalkRoute=forestAtlas.route;if(forestWalkRoute.length<2)throw Error('Generated class texture has no connected home-to-Elder walking route');
const forestWalk={active:false,position:forestWalkRoute[0].slice(),yaw:Math.atan2(forestWalkRoute[1][0]-forestWalkRoute[0][0],forestWalkRoute[0][1]-forestWalkRoute[1][1]),pitch:-.12,keys:new Set()};
function forestWalkClamp(p){
 let best=null,distance=Infinity;
 for(let i=1;i<forestWalkRoute.length;i++){
  const a=forestWalkRoute[i-1],b=forestWalkRoute[i],dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dz)/(dx*dx+dz*dz))),q=[a[0]+dx*t,a[1]+dz*t],d=Math.hypot(p[0]-q[0],p[1]-q[1]);
  if(d<distance){distance=d;best=q;}
 }
 const candidate=distance<=.65?p:[best[0]+(p[0]-best[0])*.65/distance,best[1]+(p[1]-best[1])*.65/distance];if([1,7].includes(forestAtlas.ground(...candidate)))return candidate;return forestWalkRoute.reduce((a,q)=>Math.hypot(q[0]-candidate[0],q[1]-candidate[1])<Math.hypot(a[0]-candidate[0],a[1]-candidate[1])?q:a).slice();
}
// Bridge deck is .804m high; authored earth ramps meet its two ends.
function forestWalkHeight(){return 1.25+forestAtlas.heightAt(...forestWalk.position);}
function forestWalkMoving(){return forestWalk.active&&forestWalk.keys.size>0;}
function forestWalkRelease(){forestWalk.keys.clear();forestLast=0;}
function forestWalkMode(active){
 forestWalkRelease();forestWalk.active=active;forestState.walking=active;forestTour=false;
 document.getElementById('walk').textContent=active?'Return to overview':'Enter forest';
 document.getElementById('walk').setAttribute('aria-pressed',String(active));
 document.getElementById('walk-controls').hidden=!active;
 document.getElementById('walk-help').hidden=!active;
 document.getElementById('tour').setAttribute('aria-pressed','false');document.getElementById('tour').textContent='Take a gentle tour';
 document.getElementById('chapter-title').hidden=active;document.getElementById('chapter-description').hidden=active;
 forestRequest();
}
function forestWalkStep(dt){
 const k=forestWalk.keys,forward=(k.has('w')||k.has('arrowup')?1:0)-(k.has('s')||k.has('arrowdown')?1:0),side=(k.has('d')||k.has('arrowright')?1:0)-(k.has('a')||k.has('arrowleft')?1:0),length=Math.hypot(forward,side)||1,speed=2.4*Math.min(dt,.05)/length;
 const [x,z]=forestWalk.position,y=forestWalk.yaw;
 forestWalk.position=forestWalkClamp([x+(Math.sin(y)*forward+Math.cos(y)*side)*speed,z+(-Math.cos(y)*forward+Math.sin(y)*side)*speed]);
 forestState.walkPosition=forestWalk.position.slice();
}
function forestVP(width,height){
 if(window.location?.search?.includes('view=atlas')){const m=forestAtlas.data.inverse,range=32;forestEye=[0,range,0];return Float32Array.of(2*m[0],-2*m[3],0,0,0,0,-1/range,0,2*m[1],-2*m[4],0,0,2*m[2]-1,1-2*m[5],.8,1);}

 const c=forestCamera,t=c.target;forestEye=[t[0]+Math.sin(c.yaw)*Math.cos(c.elevation)*c.distance,t[1]+Math.sin(c.elevation)*c.distance,t[2]+Math.cos(c.yaw)*Math.cos(c.elevation)*c.distance];
 const look=forestWalk.active?[forestWalk.position[0]+Math.sin(forestWalk.yaw)*Math.cos(forestWalk.pitch),forestWalkHeight()+Math.sin(forestWalk.pitch),forestWalk.position[1]-Math.cos(forestWalk.yaw)*Math.cos(forestWalk.pitch)]:t;
 if(forestWalk.active)forestEye=[forestWalk.position[0],forestWalkHeight(),forestWalk.position[1]];
 const z=forestVec.norm(forestVec.sub(forestEye,look)),x=forestVec.norm(forestVec.cross([0,1,0],z)),y=forestVec.cross(z,x);
 const view=Float32Array.of(x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-forestVec.dot(x,forestEye),-forestVec.dot(y,forestEye),-forestVec.dot(z,forestEye),1);
 const f=1/Math.tan(.72/2),near=.1,far=180,p=new Float32Array(16);p[0]=f/(width/height);p[5]=f;p[8]=forestWalk.active?0:width>820?-.30:0;p[9]=forestWalk.active?0:width>820?0:-.26;p[10]=far/(near-far);p[11]=-1;p[14]=far*near/(near-far);return forestMultiply(p,view);
}
const forestObjects=forestGeometry.map(({piece,mesh})=>({piece,mesh,model:forestModel(piece)}));
// UI readability must never remove world geometry.
let forestFading=false;
forestState.fadedTrees=0;
// Canvas readback rows are padded to 256 bytes; preserve alpha and convert BGRA.
function forestCapturePixels(source,destination,width,height,bytesPerRow,format){
 const bgra=format.startsWith('bgra');
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=y*bytesPerRow+x*4,o=(y*width+x)*4;
  destination[o]=source[i+(bgra?2:0)];destination[o+1]=source[i+1];destination[o+2]=source[i+(bgra?0:2)];destination[o+3]=source[i+3];
 }
}
async function forestGPU(){
 if(!forestPreparedGPU)return null;
 const {device}=forestPreparedGPU,canvas=document.getElementById('scene'),context=canvas.getContext('webgpu');
 const format=navigator.gpu.getPreferredCanvasFormat();context.configure({device,format,alphaMode:'opaque',usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.COPY_SRC});
 const layout=device.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:'uniform',hasDynamicOffset:true,minBindingSize:176}}]});
 const shadow=typeof forestShadow==='function'?await forestShadow(device,layout,forestObjects):null;forestState.shadows=!!shadow;
 const shader=device.createShaderModule({code:shadow?W_FOREST_SHADOWED:W_FOREST}),messages=await shader.getCompilationInfo(),errors=messages.messages.filter(m=>m.type==='error');
 if(errors.length)throw new Error(errors.map(m=>m.message).join('; '));
 device.addEventListener('uncapturederror',e=>forestFail(e.error));
 const pipeline=await device.createRenderPipelineAsync({layout:device.createPipelineLayout({bindGroupLayouts:shadow?[layout,shadow.layout]:[layout]}),vertex:{module:shader,entryPoint:'vs',buffers:[{arrayStride:16,attributes:[{shaderLocation:0,offset:0,format:'float32x3'},{shaderLocation:1,offset:12,format:'snorm8x4'}]}]},fragment:{module:shader,entryPoint:'fs',targets:[{format}]},primitive:{topology:'triangle-list',cullMode:'none'},depthStencil:{format:'depth24plus',depthWriteEnabled:true,depthCompare:'less'}});
 const upload=(data,usage)=>{const b=device.createBuffer({size:(data.byteLength+3)&~3,usage:usage|GPUBufferUsage.COPY_DST});device.queue.writeBuffer(b,0,data);return b;};
 const draws=[];
 for(const object of forestObjects){
  const vertex=upload(object.mesh.vb,GPUBufferUsage.VERTEX),index=upload(object.mesh.ib,GPUBufferUsage.INDEX);
  const groups=object.mesh.groups?.length?object.mesh.groups:[{firstIndex:0,indexCount:object.mesh.ib.length,color:object.piece.color}];
  for(const group of groups)draws.push({vertex,index,group,model:object.model,tree:object.tree});
 }
 const stride=Math.ceil(176/device.limits.minUniformBufferOffsetAlignment)*device.limits.minUniformBufferOffsetAlignment,uniform=device.createBuffer({size:stride*draws.length,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});
 const binding=device.createBindGroup({layout,entries:[{binding:0,resource:{buffer:uniform,size:176}}]});
 const data=new Float32Array(stride/4*draws.length);let depth,width=0,height=0;
 device.lost.then(info=>{if(info.reason!=='destroyed')forestFail(new Error('The graphics device was lost; reload to reopen the forest.'));});
 const skyShader=typeof W_SKY==='string'?device.createShaderModule({code:W_SKY}):null;
 const skyPipeline=skyShader&&await device.createRenderPipelineAsync({layout:device.createPipelineLayout({bindGroupLayouts:[layout]}),vertex:{module:skyShader,entryPoint:'vs'},fragment:{module:skyShader,entryPoint:'fs',targets:[{format}]},primitive:{topology:'triangle-list'},depthStencil:{format:'depth24plus',depthWriteEnabled:false,depthCompare:'always'}});
 forestState.sky=!!skyPipeline;
 forestState.mode='webgpu';forestState.draws=draws.length;
 return ()=>{
  const ratio=Math.min(devicePixelRatio||1,1.5),w=Math.max(1,Math.floor(innerWidth*ratio)),h=Math.max(1,Math.floor(innerHeight*ratio));
  if(w!==width||h!==height){width=canvas.width=w;height=canvas.height=h;depth?.destroy();depth=device.createTexture({size:[w,h],format:'depth24plus',usage:GPUTextureUsage.RENDER_ATTACHMENT});}
  const vp=forestVP(innerWidth,innerHeight);forestFading=false;
  for(let i=0;i<draws.length;i++){const d=draws[i],o=i*stride/4;data.set(vp,o);data.set(d.model,o+16);data.set([...d.group.color,1],o+32);data.set([.45,.86,.25,0],o+36);data.set([...forestEye,0],o+40);}
  device.queue.writeBuffer(uniform,0,data);
  const texture=context.getCurrentTexture(),encoder=device.createCommandEncoder();shadow?.encode(encoder,draws,binding,stride);const pass=encoder.beginRenderPass({colorAttachments:[{view:texture.createView(),clearValue:{r:.66,g:.73,b:.55,a:1},loadOp:'clear',storeOp:'store'}],depthStencilAttachment:{view:depth.createView(),depthClearValue:1,depthLoadOp:'clear',depthStoreOp:'store'}});
  if(skyPipeline&&draws.length&&!window.location?.search?.includes('view=atlas')){pass.setPipeline(skyPipeline);pass.setBindGroup(0,binding,[0]);pass.draw(3);}
  pass.setPipeline(pipeline);if(shadow)pass.setBindGroup(1,shadow.group);
  for(let i=0;i<draws.length;i++){const d=draws[i];pass.setBindGroup(0,binding,[i*stride]);pass.setVertexBuffer(0,d.vertex);pass.setIndexBuffer(d.index,'uint32');pass.drawIndexed(d.group.indexCount,1,d.group.firstIndex);}
  pass.end();
  // Explicit QA request only: no mapping, pixel copy or extra frame in ordinary use.
  let capture=null;
  if(window.__capture&&!window.__capturing){
   window.__capture=false;window.__capturing=true;delete window.__captured;delete window.__captureError;
   const bytesPerRow=Math.ceil(w*4/256)*256;
   if(bytesPerRow*h>64*1024*1024){window.__captureError='Capture exceeds the 64 MiB readback limit.';window.__capturing=false;}
   else try{
    capture={bytesPerRow,buffer:device.createBuffer({size:bytesPerRow*h,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ})};
    encoder.copyTextureToBuffer({texture},{buffer:capture.buffer,bytesPerRow},[w,h]);
   }catch(error){capture?.buffer.destroy();capture=null;window.__captureError=String(error);window.__capturing=false;}
  }
  device.queue.submit([encoder.finish()]);
  if(capture){const {buffer,bytesPerRow}=capture;
   buffer.mapAsync(GPUMapMode.READ).then(()=>{
    const output=document.createElement('canvas');output.width=w;output.height=h;
    const ctx=output.getContext('2d'),image=ctx.createImageData(w,h);
    forestCapturePixels(new Uint8Array(buffer.getMappedRange()),image.data,w,h,bytesPerRow,format);
    ctx.putImageData(image,0,0);window.__captured=output.toDataURL('image/png');
   }).catch(error=>{window.__captureError=String(error);}).finally(()=>{buffer.unmap();buffer.destroy();window.__capturing=false;});
  }
 };
}
// Compatibility mode still draws the actual loaded model triangles, not a poster.
function forestCompatibility(){
 document.getElementById('scene').hidden=true;const canvas=document.getElementById('compat');canvas.hidden=false;
 const context=canvas.getContext('2d');forestState.mode='canvas2d';const triangles=[];
 for(const object of forestObjects){
  const {mesh,model,piece}=object,f=new Float32Array(mesh.vb),vertices=[];
  for(let i=0;i<mesh.nv;i++){const x=f[i*4],y=f[i*4+1],z=f[i*4+2];vertices.push([model[0]*x+model[4]*y+model[8]*z+model[12],model[1]*x+model[5]*y+model[9]*z+model[13],model[2]*x+model[6]*y+model[10]*z+model[14]]);}
  const groups=mesh.groups?.length?mesh.groups:[{firstIndex:0,indexCount:mesh.ib.length,color:piece.color}];
  for(const group of groups)for(let i=group.firstIndex;i<group.firstIndex+group.indexCount;i+=3){
   const a=vertices[mesh.ib[i]],b=vertices[mesh.ib[i+1]],c=vertices[mesh.ib[i+2]],n=forestVec.norm(forestVec.cross(forestVec.sub(b,a),forestVec.sub(c,a))),light=.43+.65*Math.abs(forestVec.dot(n,forestVec.norm([.45,.86,.25])));
   triangles.push({v:[a,b,c],tree:object.tree,color:group.color.map(v=>Math.round(Math.pow(Math.min(1,v*light),1/2.2)*255))});
  }
 }
 let image,depth,width=0,height=0;
 return ()=>{
  const ratio=Math.min(1,Math.sqrt(1800000/(innerWidth*innerHeight))),w=Math.max(1,Math.floor(innerWidth*ratio)),h=Math.max(1,Math.floor(innerHeight*ratio)),vp=forestVP(innerWidth,innerHeight);forestFading=false;
  if(w!==width||h!==height){canvas.width=width=w;canvas.height=height=h;image=context.createImageData(w,h);depth=new Float32Array(w*h);}
  const pixels=image.data;depth.fill(Infinity);
  for(let i=0;i<pixels.length;i+=4){pixels[i]=190;pixels[i+1]=201;pixels[i+2]=165;pixels[i+3]=255;}
  let drawn=0;
  // Depth testing keeps thin spines, window frames and overlapping wall pieces
  // correct in compatibility mode; triangle-average painter sorting cannot.
  for(const t of triangles){
   const fade=1;
   const p=t.v.map(v=>{const [x,y,z]=v,cw=vp[3]*x+vp[7]*y+vp[11]*z+vp[15];return [(vp[0]*x+vp[4]*y+vp[8]*z+vp[12])/cw*w/2+w/2,h/2-(vp[1]*x+vp[5]*y+vp[9]*z+vp[13])/cw*h/2,(vp[2]*x+vp[6]*y+vp[10]*z+vp[14])/cw,cw];});
   if(p.some(v=>v[3]<=.1))continue;
   const [a,b,c]=p,den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);
   if(Math.abs(den)<1e-8)continue;
   const minX=Math.max(0,Math.floor(Math.min(a[0],b[0],c[0]))),maxX=Math.min(w-1,Math.ceil(Math.max(a[0],b[0],c[0])));
   const minY=Math.max(0,Math.floor(Math.min(a[1],b[1],c[1]))),maxY=Math.min(h-1,Math.ceil(Math.max(a[1],b[1],c[1])));
   if(maxX<minX||maxY<minY)continue;drawn++;
   const stepA=(b[1]-c[1])/den,stepB=(c[1]-a[1])/den;
   for(let y=minY;y<=maxY;y++){
    let wa=((b[1]-c[1])*(minX+.5-c[0])+(c[0]-b[0])*(y+.5-c[1]))/den;
    let wb=((c[1]-a[1])*(minX+.5-c[0])+(a[0]-c[0])*(y+.5-c[1]))/den;
    for(let x=minX;x<=maxX;x++,wa+=stepA,wb+=stepB){
     const wc=1-wa-wb;if(wa<0||wb<0||wc<0)continue;
     const z=wa*a[2]+wb*b[2]+wc*c[2],index=y*w+x;
     if(z<0||z>1||z>=depth[index])continue;depth[index]=z;
     const offset=index*4;pixels[offset]=t.color[0];pixels[offset+1]=t.color[1];pixels[offset+2]=t.color[2];
    }
   }
  }
  context.putImageData(image,0,0);forestState.drawnTriangles=drawn;

 };
}
try{forestDraw=await forestGPU();}catch(error){forestState.compatibilityReason=String(error);console.warn('Using the compatibility renderer:',error);}
if(!forestDraw)forestDraw=forestCompatibility();
function forestRequest(){if(!forestQueued){forestQueued=true;requestAnimationFrame(forestFrame);}}
let forestLifeAt=-Infinity;
const forestMotion=typeof matchMedia==='function'?matchMedia('(prefers-reduced-motion: reduce)'):null;
function forestLifeActive(){return forestState.mode==='webgpu'&&typeof pinpinUpdateLife==='function'&&!forestMotion?.matches&&!document.hidden;}
forestMotion?.addEventListener?.('change',()=>{forestLifeAt=-Infinity;if(forestMotion.matches&&typeof pinpinUpdateLife==='function'){pinpinUpdateLife(0);for(const object of forestObjects)if(object.piece.dynamic)object.model.set(forestModel(object.piece));}forestRequest();});
function forestFrame(time){
 forestQueued=false;if(document.hidden)return;
 try{if(forestLifeActive()&&time-forestLifeAt>=1000/30){pinpinUpdateLife(time/1000);for(const object of forestObjects)if(object.piece.dynamic)object.model.set(forestModel(object.piece));forestLifeAt=time;}if(forestWalkMoving())forestWalkStep(forestLast?Math.max(0,(time-forestLast)/1000):0);if(forestTour)forestCamera.yaw+=Math.min((time-forestLast)/1000,.05)*.075;forestDraw();forestState.fading=forestFading;forestState.frames++;forestLast=time;}catch(error){forestFail(error);forestTour=false;}
 if(forestTour||forestLifeActive())setTimeout(forestRequest,forestState.mode==='canvas2d'?150:33);else if(forestFading||forestWalkMoving())forestRequest();
}
function forestChapter(name){
 if(!forestSources[name])return;
 if(forestWalk.active)forestWalkMode(false);
 forestCamera={...forestPresets[name],target:forestPresets[name].target.slice()};forestState.chapter=name;
 for(const [id,key] of [['chapter-kicker','kicker'],['chapter-title','title'],['chapter-description','description']]){
  const el=document.getElementById(id);if(key==='title')el.innerHTML=forestCamera[key];else el.textContent=forestCamera[key];
 }
 document.getElementById('explore').textContent=forestCamera.action+' ↗';
 document.querySelectorAll('[data-chapter]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.chapter===name)));forestRequest();
}
document.querySelectorAll('[data-chapter]').forEach(button=>{button.disabled=!forestSources[button.dataset.chapter];button.addEventListener('click',()=>forestChapter(button.dataset.chapter));});
let forestDrag=null;
for(const canvas of document.querySelectorAll('canvas')){
 canvas.addEventListener('pointerdown',event=>{forestDrag=[event.clientX,event.clientY];canvas.setPointerCapture(event.pointerId);});
 canvas.addEventListener('pointermove',event=>{if(!forestDrag)return;if(forestWalk.active){forestWalk.yaw+=(event.clientX-forestDrag[0])*.006;forestWalk.pitch=Math.max(-1.1,Math.min(1.1,forestWalk.pitch-(event.clientY-forestDrag[1])*.005));forestDrag=[event.clientX,event.clientY];forestRequest();return;}forestCamera.yaw-=(event.clientX-forestDrag[0])*.006;forestCamera.elevation=Math.max(.12,Math.min(1.25,forestCamera.elevation+(event.clientY-forestDrag[1])*.005));forestDrag=[event.clientX,event.clientY];forestRequest();});
 canvas.addEventListener('pointerup',()=>forestDrag=null);canvas.addEventListener('pointercancel',()=>forestDrag=null);
 canvas.addEventListener('wheel',event=>{if(forestWalk.active)return;event.preventDefault();forestCamera.distance=Math.max(5,Math.min(45,forestCamera.distance*Math.exp(event.deltaY*.001)));forestRequest();},{passive:false});
}
document.getElementById('walk').addEventListener('click',()=>forestWalkMode(!forestWalk.active));
const forestWalkKey=event=>String(event.key||'').toLowerCase();
const forestTextInput=event=>event.target?.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(event.target?.tagName||'');
addEventListener('keydown',event=>{if(!forestWalk.active||forestTextInput(event))return;const key=forestWalkKey(event);if(key==='escape'){forestWalkMode(false);return;}if(!['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(key))return;event.preventDefault();forestWalk.keys.add(key);forestRequest();});
addEventListener('keyup',event=>{forestWalk.keys.delete(forestWalkKey(event));});
addEventListener('blur',forestWalkRelease);
for(const key of ['w','a','s','d']){const button=document.getElementById('walk-'+key);button.addEventListener('pointerdown',event=>{event.preventDefault();button.setPointerCapture(event.pointerId);forestWalk.keys.add(key);forestRequest();});for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,()=>forestWalk.keys.delete(key));}
document.getElementById('explore').addEventListener('click',()=>{forestCamera.distance=Math.max(7,forestPresets[forestState.chapter].distance*.62);forestRequest();});
document.getElementById('tour').addEventListener('click',()=>{if(forestWalk.active)forestWalkMode(false);forestTour=!forestTour;document.getElementById('tour').setAttribute('aria-pressed',String(forestTour));document.getElementById('tour').textContent=forestTour?'Pause the gentle tour':'Take a gentle tour';forestLast=performance.now();forestRequest();});
const forestAudio=typeof pinpinCreateAmbience==='function'?pinpinCreateAmbience():null,forestSound=document.getElementById('sound');forestSound.disabled=!forestAudio;
forestSound.addEventListener('click',async()=>{const enabled=forestSound.getAttribute('aria-pressed')!=='true';try{await forestAudio.setEnabled(enabled);forestSound.setAttribute('aria-pressed',String(enabled));forestSound.textContent=enabled?'♫  Sound on':'♫  Sound off';}catch(error){forestSound.textContent='Sound unavailable';forestSound.disabled=true;}});
addEventListener('pagehide',()=>forestAudio?.dispose(),{once:true});addEventListener('resize',forestRequest);document.addEventListener('visibilitychange',()=>{forestWalkRelease();if(!document.hidden)forestRequest();});
forestState.ready=true;forestState.pieces=forestPieces.length;forestChapter(forestSources.clearing?'clearing':Object.keys(forestSources).find(key=>forestSources[key]));forestRequest();
