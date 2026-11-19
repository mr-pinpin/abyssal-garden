// Demand-driven forest renderer; original underwater main.js remains available.
const forestState=window.__pinpin={ready:false,mode:'loading',models:[],frames:0,errors:[],chapter:'clearing'};
const forestFail=error=>{forestState.errors.push(String(error));const el=document.getElementById('error');el.hidden=false;el.textContent='The forest could not open. '+error.message;};
const forestSources={home:typeof pinpinHomePieces==='function'?pinpinHomePieces:null,clearing:typeof pinpinClearingPieces==='function'?pinpinClearingPieces:null,elder:typeof pinpinElderPieces==='function'?pinpinElderPieces:null};
const forestPieces=Object.values(forestSources).flatMap(make=>make?make():[]);
if(typeof pinpinLifePieces==='function')forestPieces.push(...pinpinLifePieces());
{
 const m=new Mesh();m.sweep([[-70,-.12,0],[70,-.12,0]],140,.12,()=>[0,1,0]);
 forestPieces.unshift({name:'forest/ground',asset:null,build:()=>m.build(),position:[0,0,0],rotation:[0,0,0],scale:[1,1,1],color:[.24,.34,.14]});
}
const forestGeometry=await Promise.all(forestPieces.map(async piece=>{
 const mesh=piece.asset&&typeof setPiece==='function'?await setPiece(piece.asset,piece.build):piece.build();
 if(piece.asset)forestState.models.push(mesh.source||{name:piece.asset,url:null,loaded:false});
 return {piece,mesh};
}));
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
 clearing:{target:[6,1,8.6],distance:19.5,yaw:.36,elevation:.38,kicker:'Field notes · Chapter 02',title:'Small paws.<br><em>Big discoveries.</em>',description:'A red tractor, a helpful beaver, and a bridge made just right for little paws. Every adventure begins with a little curiosity.',action:'Meet the little lookout'},
 elder:{target:[14,1.8,-16],distance:18,yaw:.42,elevation:.55,kicker:'Field notes · Chapter 03',title:'Under the roots.<br><em>Into wonder.</em>',description:'Beyond the Elder’s woven mat, pale roots lead to old paintings, warm lamps and stories about caring for one another.',action:'Look inside the sanctuary'}
};
let forestCamera={...forestPresets.clearing},forestEye=[0,0,0],forestTour=false,forestQueued=false,forestLast=0,forestDraw;
// Grounded outdoor corridor, not general mesh collision. Radius stays inside the
// authored 1.8m path; the northern endpoint stops before the sanctuary walls.
const forestWalkRoute=[[-12.4,3],[-12.4,6],[-8,8.8],[3.8,8.8],[7,8.8],[7,2.5],[9,-1],[11,-5],[14,-7]];
const forestWalk={active:false,position:[-12.4,6],yaw:Math.atan2(4.4,-2.8),pitch:-.12,keys:new Set()};
function forestWalkClamp(p){
 let best=null,distance=Infinity;
 for(let i=1;i<forestWalkRoute.length;i++){
  const a=forestWalkRoute[i-1],b=forestWalkRoute[i],dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dz)/(dx*dx+dz*dz))),q=[a[0]+dx*t,a[1]+dz*t],d=Math.hypot(p[0]-q[0],p[1]-q[1]);
  if(d<distance){distance=d;best=q;}
 }
 return distance<=.65?p:[best[0]+(p[0]-best[0])*.65/distance,best[1]+(p[1]-best[1])*.65/distance];
}
// Bridge deck is .804m high; authored earth ramps meet its two ends.
function forestWalkHeight(){const [x,z]=forestWalk.position;if(Math.abs(x-7)>.66||z<2.5||z>8.8)return 1.25;return 1.25+.804*Math.max(0,Math.min(1,(8.8-z)/1.05,(z-2.5)/.98));}
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
 const c=forestCamera,t=c.target;forestEye=[t[0]+Math.sin(c.yaw)*Math.cos(c.elevation)*c.distance,t[1]+Math.sin(c.elevation)*c.distance,t[2]+Math.cos(c.yaw)*Math.cos(c.elevation)*c.distance];
 const look=forestWalk.active?[forestWalk.position[0]+Math.sin(forestWalk.yaw)*Math.cos(forestWalk.pitch),forestWalkHeight()+Math.sin(forestWalk.pitch),forestWalk.position[1]-Math.cos(forestWalk.yaw)*Math.cos(forestWalk.pitch)]:t;
 if(forestWalk.active)forestEye=[forestWalk.position[0],forestWalkHeight(),forestWalk.position[1]];
 const z=forestVec.norm(forestVec.sub(forestEye,look)),x=forestVec.norm(forestVec.cross([0,1,0],z)),y=forestVec.cross(z,x);
 const view=Float32Array.of(x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-forestVec.dot(x,forestEye),-forestVec.dot(y,forestEye),-forestVec.dot(z,forestEye),1);
 const f=1/Math.tan(.72/2),near=.1,far=180,p=new Float32Array(16);p[0]=f/(width/height);p[5]=f;p[8]=forestWalk.active?0:width>820?-.30:0;p[9]=forestWalk.active?0:width>820?0:-.26;p[10]=far/(near-far);p[11]=-1;p[14]=far*near/(near-far);return forestMultiply(p,view);
}
const forestObjects=forestGeometry.map(({piece,mesh})=>({piece,mesh,model:forestModel(piece)}));
// Trees never stand between the reader and the text column. A tree is a "<plugin>/trunk-N" plus "<plugin>/canopy-N";
// when its screen box meets the headline, the paragraph or the buttons it fades out (dithered), and back in once the
// camera moves on. Nothing else in the scene is touched.
const forestTrees=new Map();
for(const object of forestObjects){
 const named=/^(.*\/)(?:trunk|canopy)-(\d+)$/.exec(object.piece.name);if(!named||!object.mesh.vb)continue;
 let tree=forestTrees.get(named[1]+named[2]);
 if(!tree)forestTrees.set(named[1]+named[2],tree={lo:[Infinity,Infinity,Infinity],hi:[-Infinity,-Infinity,-Infinity],fade:1,target:1});
 object.tree=tree;const f=new Float32Array(object.mesh.vb),M=object.model;
 for(let i=0;i<object.mesh.nv;i++){
  const x=f[i*4],y=f[i*4+1],z=f[i*4+2];
  for(let k=0;k<3;k++){const v=M[k]*x+M[4+k]*y+M[8+k]*z+M[12+k];tree.lo[k]=Math.min(tree.lo[k],v);tree.hi[k]=Math.max(tree.hi[k],v);}
 }
}
let forestFadeAt=0;
function forestTextRects(){
 return [document.getElementById('chapter-title'),document.getElementById('chapter-description'),document.querySelector('.intro .actions')]
  .filter(el=>el&&el.getClientRects().length).map(el=>{const r=el.getBoundingClientRect(),pad=14;return [r.left-pad,r.top-pad,r.right+pad,r.bottom+pad];});
}
function forestFadeTrees(vp){
 const now=performance.now(),step=forestFadeAt?Math.min((now-forestFadeAt)/1000,.1)*3.5:forestState.frames?.06:1,rects=forestTextRects();forestFadeAt=now;
 let moving=false;
 for(const tree of forestTrees.values()){
  let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;
  for(let c=0;c<8;c++){
   const x=c&1?tree.hi[0]:tree.lo[0],y=c&2?tree.hi[1]:tree.lo[1],z=c&4?tree.hi[2]:tree.lo[2],w=vp[3]*x+vp[7]*y+vp[11]*z+vp[15];
   if(w<=.1)continue;
   const sx=((vp[0]*x+vp[4]*y+vp[8]*z+vp[12])/w*.5+.5)*innerWidth,sy=(.5-(vp[1]*x+vp[5]*y+vp[9]*z+vp[13])/w*.5)*innerHeight;
   x0=Math.min(x0,sx);x1=Math.max(x1,sx);y0=Math.min(y0,sy);y1=Math.max(y1,sy);
  }
  tree.target=rects.some(r=>x0<r[2]&&x1>r[0]&&y0<r[3]&&y1>r[1])?0:1;
  tree.fade=tree.fade<tree.target?Math.min(tree.target,tree.fade+step):Math.max(tree.target,tree.fade-step);
  if(tree.fade!==tree.target)moving=true;
 }
 forestState.fadedTrees=[...forestTrees.values()].filter(t=>t.target===0).length;
 if(!moving)forestFadeAt=0;
 return moving;
}
let forestFading=false;
const forestDither=(x,y)=>{const v=52.9829189*((.06711056*x+.00583715*y)%1);return v-Math.floor(v);};
async function forestGPU(){
 if(!navigator.gpu)return null;
 const adapter=await navigator.gpu.requestAdapter();if(!adapter)return null;
 const device=await adapter.requestDevice(),canvas=document.getElementById('scene'),context=canvas.getContext('webgpu');
 const format=navigator.gpu.getPreferredCanvasFormat();context.configure({device,format,alphaMode:'opaque'});
 const shader=device.createShaderModule({code:W_FOREST}),messages=await shader.getCompilationInfo(),errors=messages.messages.filter(m=>m.type==='error');
 if(errors.length)throw new Error(errors.map(m=>m.message).join('; '));
 device.addEventListener('uncapturederror',e=>forestFail(e.error));
 const layout=device.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.FRAGMENT,buffer:{type:'uniform',hasDynamicOffset:true,minBindingSize:176}}]});
 const pipeline=await device.createRenderPipelineAsync({layout:device.createPipelineLayout({bindGroupLayouts:[layout]}),vertex:{module:shader,entryPoint:'vs',buffers:[{arrayStride:16,attributes:[{shaderLocation:0,offset:0,format:'float32x3'},{shaderLocation:1,offset:12,format:'snorm8x4'}]}]},fragment:{module:shader,entryPoint:'fs',targets:[{format}]},primitive:{topology:'triangle-list',cullMode:'none'},depthStencil:{format:'depth24plus',depthWriteEnabled:true,depthCompare:'less'}});
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
 forestState.mode='webgpu';forestState.draws=draws.length;
 return ()=>{
  const ratio=Math.min(devicePixelRatio||1,1.5),w=Math.max(1,Math.floor(innerWidth*ratio)),h=Math.max(1,Math.floor(innerHeight*ratio));
  if(w!==width||h!==height){width=canvas.width=w;height=canvas.height=h;depth?.destroy();depth=device.createTexture({size:[w,h],format:'depth24plus',usage:GPUTextureUsage.RENDER_ATTACHMENT});}
  const vp=forestVP(innerWidth,innerHeight);forestFading=forestFadeTrees(vp);
  for(let i=0;i<draws.length;i++){const d=draws[i],o=i*stride/4;data.set(vp,o);data.set(d.model,o+16);data.set([...d.group.color,d.tree?d.tree.fade:1],o+32);data.set([.45,.86,.25,0],o+36);data.set([...forestEye,0],o+40);}
  device.queue.writeBuffer(uniform,0,data);
  const encoder=device.createCommandEncoder(),pass=encoder.beginRenderPass({colorAttachments:[{view:context.getCurrentTexture().createView(),clearValue:{r:.66,g:.73,b:.55,a:1},loadOp:'clear',storeOp:'store'}],depthStencilAttachment:{view:depth.createView(),depthClearValue:1,depthLoadOp:'clear',depthStoreOp:'store'}});
  pass.setPipeline(pipeline);
  for(let i=0;i<draws.length;i++){const d=draws[i];if(d.tree&&d.tree.fade<=0)continue;pass.setBindGroup(0,binding,[i*stride]);pass.setVertexBuffer(0,d.vertex);pass.setIndexBuffer(d.index,'uint32');pass.drawIndexed(d.group.indexCount,1,d.group.firstIndex);}
  pass.end();device.queue.submit([encoder.finish()]);
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
  const ratio=Math.min(1,Math.sqrt(1800000/(innerWidth*innerHeight))),w=Math.max(1,Math.floor(innerWidth*ratio)),h=Math.max(1,Math.floor(innerHeight*ratio)),vp=forestVP(innerWidth,innerHeight);forestFading=forestFadeTrees(vp);
  if(w!==width||h!==height){canvas.width=width=w;canvas.height=height=h;image=context.createImageData(w,h);depth=new Float32Array(w*h);}
  const pixels=image.data;depth.fill(Infinity);
  for(let i=0;i<pixels.length;i+=4){pixels[i]=190;pixels[i+1]=201;pixels[i+2]=165;pixels[i+3]=255;}
  let drawn=0;
  // Depth testing keeps thin spines, window frames and overlapping wall pieces
  // correct in compatibility mode; triangle-average painter sorting cannot.
  for(const t of triangles){
   const fade=t.tree?t.tree.fade:1;if(fade<=0)continue;
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
     const wc=1-wa-wb;if(wa<0||wb<0||wc<0||fade<1&&forestDither(x,y)>=fade)continue;
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
 try{if(forestLifeActive()&&time-forestLifeAt>=1000/30){pinpinUpdateLife(time/1000);for(const object of forestObjects)if(object.piece.dynamic)object.model.set(forestModel(object.piece));forestLifeAt=time;}if(forestWalkMoving())forestWalkStep(forestLast?Math.max(0,(time-forestLast)/1000):0);if(forestTour)forestCamera.yaw+=Math.min((time-forestLast)/1000,.05)*.075;forestDraw();forestState.frames++;forestLast=time;}catch(error){forestFail(error);forestTour=false;}
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
