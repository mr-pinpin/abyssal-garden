// Demand-driven forest renderer; original underwater main.js remains available.
const forestState=window.__pinpin={ready:false,mode:'loading',models:[],frames:0,errors:[],chapter:'clearing'};
const forestFail=error=>{forestState.errors.push(String(error));const el=document.getElementById('error');el.hidden=false;el.textContent='The forest could not open. '+error.message;};
// Choose geometry detail only after an actual device succeeds. Keep the adapter
// and device alive for the renderer; software fallback builds the lower detail.
const forestPreparedGPU=await(async()=>{
 if(!navigator.gpu)return null;
 try{const adapter=await navigator.gpu.requestAdapter();return adapter?{adapter,device:await adapter.requestDevice()}:null;}catch{return null;}
})();
const forestFoliageQuality=forestPreparedGPU?'high':'low';forestState.foliageQuality=forestFoliageQuality;
const forestSources={home:typeof pinpinHomePieces==='function'?()=>pinpinHomePieces({foliageQuality:forestFoliageQuality}):null,clearing:typeof pinpinClearingPieces==='function'?pinpinClearingPieces:null,elder:typeof pinpinElderPieces==='function'?pinpinElderPieces:null};
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
 clearing:{target:[10,1,11],distance:38,yaw:.36,elevation:.70,kicker:'Field notes · Chapter 02',title:'Small paws.<br><em>Big discoveries.</em>',description:'A red tractor, a helpful beaver, and a bridge made just right for little paws. Every adventure begins with a little curiosity.',action:'Meet the little lookout'},
 elder:{target:[14,1.8,-16],distance:18,yaw:.42,elevation:.55,kicker:'Field notes · Chapter 03',title:'Under the roots.<br><em>Into wonder.</em>',description:'Beyond the Elder’s woven mat, pale roots lead to old paintings, warm lamps and stories about caring for one another.',action:'Look inside the sanctuary'}
};
let forestCamera={...forestPresets.clearing},forestEye=[0,0,0],forestTour=false,forestQueued=false,forestLast=0,forestDraw;
// Grounded outdoor corridor, not general mesh collision. Radius stays inside the
// authored 1.8m path; the northern endpoint stops before the sanctuary walls.
const forestWalkRoute=typeof pinpinAtlasLayout==='function'?pinpinAtlasLayout().route:[[-12.4,3],[-12.4,6],[-8,8.8],[14,-7]];
const forestWalk={active:false,position:[-12.4,6],yaw:Math.atan2(forestWalkRoute[2][0]-forestWalkRoute[1][0],forestWalkRoute[1][1]-forestWalkRoute[2][1]),pitch:-.12,keys:new Set()};
function forestWalkClamp(p){
 let best=null,distance=Infinity;
 for(let i=1;i<forestWalkRoute.length;i++){
  const a=forestWalkRoute[i-1],b=forestWalkRoute[i],dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dz)/(dx*dx+dz*dz))),q=[a[0]+dx*t,a[1]+dz*t],d=Math.hypot(p[0]-q[0],p[1]-q[1]);
  if(d<distance){distance=d;best=q;}
 }
 return distance<=.65?p:[best[0]+(p[0]-best[0])*.65/distance,best[1]+(p[1]-best[1])*.65/distance];
}
// Bridge deck is .804m high; authored earth ramps meet its two ends.
function forestWalkHeight(){if(typeof pinpinAtlasLayout!=='function')return 1.25;const b=pinpinAtlasLayout().bridge,a=b.outerWest,z=b.outerEast,dx=z[0]-a[0],dz=z[1]-a[1],len=Math.hypot(dx,dz),p=forestWalk.position,t=((p[0]-a[0])*dx+(p[1]-a[1])*dz)/len,lateral=Math.abs((p[0]-a[0])*dz-(p[1]-a[1])*dx)/len;if(lateral>.85||t<0||t>len)return 1.25;return 1.25+b.deckHeight*Math.max(0,Math.min(1,t/1.3,(len-t)/1.3));}
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
  if(skyPipeline&&draws.length){pass.setPipeline(skyPipeline);pass.setBindGroup(0,binding,[0]);pass.draw(3);}
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
