// Small forest pipeline: original packed Mesh layout + optional GLB material groups.
// Lighting (Konev, iteration 1): a low warm sun with a cool sky fill and warm ground bounce,
// soft wrap so shadowed sides keep their form, contact darkening near the ground, procedural
// breakup on near-horizontal surfaces so the meadow is not one flat colour, aerial perspective
// toward the horizon colour, and a gentle filmic curve. Leaf vertices (aux -0.65) get backscatter and sheen. Uniform layout is unchanged (176 bytes).
const W_FOREST_SRC=/*wgsl*/`
struct Globals { vp:mat4x4f, model:mat4x4f, color:vec4f, sun:vec4f, camera:vec4f };
@group(0) @binding(0) var<uniform> g:Globals;
/*SHADOW_DECL*/
struct Out { @builtin(position) cp:vec4f, @location(0) wp:vec3f, @location(1) n:vec3f, @location(2) aux:f32 };
@vertex fn vs(@location(0) p:vec3f,@location(1) n:vec4f)->Out {
 var o:Out; let wp=g.model*vec4f(p,1.);o.cp=g.vp*wp;o.wp=wp.xyz;
 o.n=normalize((g.model*vec4f(n.xyz,0.)).xyz);o.aux=n.w;return o;
}
fn hash2(p:vec2f)->f32 { return fract(sin(dot(p,vec2f(127.1,311.7)))*43758.5453); }
fn vnoise(p:vec2f)->f32 {
 let i=floor(p);let f=fract(p);let u=f*f*(3.-2.*f);
 return mix(mix(hash2(i),hash2(i+vec2f(1.,0.)),u.x),mix(hash2(i+vec2f(0.,1.)),hash2(i+vec2f(1.,1.)),u.x),u.y);
}
fn hash3(p:vec3f)->vec3f { return fract(sin(vec3f(dot(p,vec3f(127.1,311.7,74.7)),dot(p,vec3f(269.5,183.3,246.1)),dot(p,vec3f(113.5,271.9,124.6))))*43758.5453); }
// Leaf cells: distance to the nearest of a jittered 3D lattice of points (F1) and that point's random id.
fn leafCells(p:vec3f)->vec2f {
 let c=floor(p);let f=fract(p);var d=8.;var id=0.;
 for(var z=-1;z<=1;z++){for(var y=-1;y<=1;y++){for(var x=-1;x<=1;x++){
  let o=vec3f(f32(x),f32(y),f32(z));let r=hash3(c+o);let v=o+r-f;let dd=dot(v,v);if(dd<d){d=dd;id=r.x;}
 }}}
 return vec2f(sqrt(d),id);
}
fn filmic(x:vec3f)->vec3f { return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),vec3f(0.),vec3f(1.)); }
@fragment fn fs(i:Out)->@location(0) vec4f {
 if(g.color.a<1.){let v=52.9829189*fract(dot(floor(i.cp.xy),vec2f(.06711056,.00583715)));if(fract(v)>=g.color.a){discard;}}
 var n=normalize(i.n);
 // Thin cards are drawn double-sided: light the side that faces the camera.
 let view=normalize(g.camera.xyz-i.wp);if(dot(n,view)<0.){n=-n;}
 var albedo=g.color.rgb;
 // Foliage is cut into separate leaves: world-space cells (~14 cm) with gaps between them, each leaf tilted and
 // toned on its own, darker toward its edge. The shadow pass cuts the same gaps, so light falls through in spots.
 let leafBand=1.-smoothstep(.03,.05,abs(i.aux+.6535));
 // Only tree crowns are cut (above 1.6 m); understory leaves near the ground keep their own silhouettes.
 if(leafBand>.5&&i.wp.y>1.6){
  let lc=leafCells(i.wp*7.);if(lc.x>.5){discard;}
  albedo*=(.80+.40*lc.y)*mix(1.,.72,smoothstep(.22,.5,lc.x));
  n=normalize(n+(hash3(vec3f(lc.y*97.3,lc.y*13.1,lc.y*51.7))-.5)*.9);
 }
 // Breakup on ground-like surfaces: two octaves of value noise in world space.
 let flat=smoothstep(.55,.9,n.y);
 let br=vnoise(i.wp.xz*.35)*.6+vnoise(i.wp.xz*1.7)*.4;
 albedo*=mix(1.,.68+.42*br,flat);
 albedo=mix(albedo,albedo*vec3f(1.08,1.02,.82),flat*smoothstep(.55,.85,vnoise(i.wp.xz*.12+vec2f(7.,3.))));
 // Ground detail by surface kind (until the atlas ground-type texture is registered): fine detail fades with distance
 // so it never shimmers. Grass: dark clumps, single blades, dry tips, a few daisies. Dirt: pebbles, ruts and dust.
 let near=1.-smoothstep(6.,26.,distance(g.camera.xyz,i.wp));
 let col=g.color.rgb;
 let grassy=flat*step(col.r+.04,col.g)*step(col.b+.04,col.g)*step(i.wp.y,.3);
 let dirt=flat*step(col.b+.06,col.r)*step(col.g*.92,col.r)*step(i.wp.y,.3);
 if(grassy>.5){
  let clump=vnoise(i.wp.xz*.9);let blade=hash2(floor(i.wp.xz*48.));let tip=hash2(floor(i.wp.xz*48.)+vec2f(5.,9.));
  albedo*=mix(1.,.62+.5*clump,.8);
  albedo*=mix(1.,.72+.56*blade,near*.9);
  albedo=mix(albedo,albedo*vec3f(1.25,1.12,.62),near*step(.93,tip)*.8);
  let dc=leafCells(vec3f(i.wp.x*4.,0.,i.wp.z*4.));
  let daisy=near*step(dc.x,.09)*step(.86,dc.y)*smoothstep(.3,.7,vnoise(i.wp.xz*.4+vec2f(3.,8.)));
  albedo=mix(albedo,vec3f(.92,.90,.82),daisy);
 }
 if(dirt>.5){
  let pc=leafCells(vec3f(i.wp.x*9.,0.,i.wp.z*9.));
  let pebble=near*(1.-smoothstep(.28,.36,pc.x));
  albedo*=mix(1.,.80+.35*vnoise(i.wp.xz*2.3),.9);
  albedo=mix(albedo,albedo*(1.15+.35*pc.y)*vec3f(1.,.98,.94),pebble);
  albedo*=mix(1.,.78,near*(1.-pebble)*smoothstep(.36,.5,pc.x)*.6);
 }
 /*GROUND_TERM*/
 let dk=clamp((-.6535-i.aux)/.0158,0.,1.);let lt=clamp((i.aux+.6535)/.0236,0.,1.);
 let tone=.94-.22*dk+.18*lt;
 albedo*=mix(1.,tone,1.-smoothstep(.03,.05,abs(i.aux+.6535)));
 let sun=normalize(vec3f(.62,.36,-.70));
 let sunC=vec3f(1.,.80,.56)*1.45;
 let wrap=max((dot(n,sun)+.25)/1.25,0.);
 let sky=mix(vec3f(.30,.25,.15),vec3f(.40,.52,.70),n.y*.5+.5);
 // Contact darkening: vertical faces close to the ground sit in the grass and get less sky.
 let ao=mix(.62,1.,smoothstep(-.2,1.1,i.wp.y))*mix(1.,.9,1.-flat);
 let sh=/*SHADOW_TERM*/1.;
 var c=albedo*(sky*.50*ao+sunC*wrap*.85*sh);
 // Soft rim from the sun side for silhouettes against the haze.
 c+=albedo*sunC*.18*sh*pow(1.-max(dot(n,view),0.),3.)*max(dot(sun,-view)*.5+.5,0.);
 // Foliage marker: leaf vertices carry aux near -0.65 in the normal's w. Cluster tone: snorm -85/-83/-80
 // (dark/mid/light) maps to albedo x0.72/0.94/1.12, interpolated and clamped; bark and others unchanged.
 // Leaves let light through (backscatter) and show a soft waxy sheen; everything else is unchanged.
 let leaf=1.-smoothstep(.03,.05,abs(i.aux+.6535));
 let back=max(dot(-n,sun),0.)*.6+pow(max(dot(sun,-view),0.),4.)*.8;
 c+=leaf*albedo*vec3f(1.,1.05,.6)*sunC*back*.85*mix(.35,1.,sh);
 let hv=normalize(sun+view);
 c+=leaf*sunC*vec3f(.9,1.,.8)*.07*sh*pow(max(dot(n,hv),0.),24.);
 c*=mix(1.,.86+.14*vnoise(i.wp.xz*3.1+i.wp.y),leaf);
 // Warm sanctuary lamplight is bounded, independent of the optional ambience.
 let lamp=vec3f(14.,2.8,-19.);let d=distance(lamp,i.wp);
 c+=albedo*vec3f(.72,.40,.12)*(.60/(1.+d*d*.13));
 // Water (stream and pond): flat, low and blue-green pieces. Small static ripples bend the normal; the surface
 // mixes its deep colour with the reflected sky by Fresnel, and the sun leaves a glint where it is not shadowed.
 let rawN=normalize(i.n);
 let water=step(.95,abs(rawN.y))*step(i.wp.y,.12)*step(g.color.r+.12,g.color.b)*step(g.color.r+.12,g.color.g);
 if(water>.5){
  let q=i.wp.xz;
  let rn=normalize(vec3f((vnoise(q*3.1)-.5)*.10+(vnoise(q*9.7+vec2f(3.,1.))-.5)*.06,1.,(vnoise(q*3.1+vec2f(17.,5.))-.5)*.10+(vnoise(q*9.7+vec2f(8.,2.))-.5)*.06));
  let r=reflect(-view,rn);
  // Low reflected rays meet the far treeline (dark green), higher ones the sky.
  let skyR=mix(vec3f(.07,.11,.05),mix(vec3f(.55,.50,.34),vec3f(.30,.46,.66),smoothstep(.1,.5,r.y)),smoothstep(.04,.22,r.y));
  let fres=.04+.96*pow(1.-max(dot(rn,view),0.),5.);
  let deep=g.color.rgb*vec3f(.16,.28,.30);
  c=mix(deep*(.5+.5*sh),skyR,clamp(fres*1.4+.12,0.,1.));
  c+=sunC*sh*2.2*pow(max(dot(r,sun),0.),180.);
 }
 // Aerial perspective: distance and height fog toward the horizon colour.
 let dist=distance(g.camera.xyz,i.wp);
 let fog=(1.-exp(-dist*.012))*mix(1.,.6,smoothstep(0.,12.,i.wp.y));
 c=mix(c,vec3f(.26,.34,.17),clamp(fog*.8,0.,1.));
 c=filmic(c*.98);let lum=dot(c,vec3f(.2126,.7152,.0722));c=max(mix(vec3f(lum),c,1.12),vec3f(0.));
 return vec4f(pow(c,vec3f(1./2.2)),1.);
}`;
// The unshadowed scene shader (used when forest-main has no shadow hook) and the shadowed variant.
const W_FOREST=W_FOREST_SRC.replace('/*SHADOW_DECL*/','').replace('/*SHADOW_TERM*/1.','1.').replace('/*GROUND_TERM*/','');
// Sun shadows (Konev): one 2048^2 depth map from an orthographic sun camera fitted to the scene's
// objects (ground-sized pieces excluded from the fit, so resolution goes to the forest). 3x3 PCF with
// a normal offset; outside the map is lit. Group 1: light matrix, depth map, comparison sampler.
const W_FOREST_SHADOWED=W_FOREST_SRC.replace('/*SHADOW_DECL*/',`
@group(1) @binding(0) var<uniform> light:mat4x4f;
@group(1) @binding(1) var shadowMap:texture_depth_2d;
@group(1) @binding(2) var shadowCmp:sampler_comparison;
// Ground types (Konev, 19 Nov): an RGBA texture in the atlas frame, R path/dirt, G garden soil, B water edge/mud,
// A rock; grass is what remains. ground.t0=(a,b,c,enabled), t1=(d,e,f,0): u=a*x+b*z+c, v=d*x+e*z+f.
struct Ground { t0:vec4f, t1:vec4f };
@group(1) @binding(3) var<uniform> ground:Ground;
@group(1) @binding(4) var groundTypes:texture_2d<f32>;
@group(1) @binding(5) var groundSampler:sampler;
fn sunShadow(wp:vec3f,n:vec3f)->f32 {
 let lp=light*vec4f(wp+n*.05,1.);let uv=lp.xy*vec2f(.5,-.5)+.5;let z=lp.z-.0012;
 if(any(uv<vec2f(.001))||any(uv>vec2f(.999))||z>1.){return 1.;}
 let t=1.25/f32(textureDimensions(shadowMap).x);var s=0.;
 for(var y=-1;y<=1;y++){for(var x=-1;x<=1;x++){s+=textureSampleCompareLevel(shadowMap,shadowCmp,uv+vec2f(f32(x),f32(y))*t,z);}}
 return s/9.;
}`).replace('/*SHADOW_TERM*/1.','sunShadow(i.wp,n)').replace('/*GROUND_TERM*/',`
 if(ground.t0.w>.5&&flat>.5&&i.wp.y<.3){
  let guv=vec2f(dot(ground.t0.xy,i.wp.xz)+ground.t0.z,dot(ground.t1.xy,i.wp.xz)+ground.t1.z);
  if(all(guv>vec2f(0.))&&all(guv<vec2f(1.))){
   let gt=textureSampleLevel(groundTypes,groundSampler,guv,0.);
   let pc=leafCells(vec3f(i.wp.x*9.,0.,i.wp.z*9.));
   let pathA=vec3f(.40,.31,.20)*(.85+.3*vnoise(i.wp.xz*2.3))*mix(1.,1.25+.3*pc.y,near*(1.-smoothstep(.28,.36,pc.x)));
   let soilA=vec3f(.24,.17,.11)*(.8+.3*vnoise(vec2f(i.wp.x*6.,i.wp.z*.8)));
   let mudA=vec3f(.17,.16,.11)*(.85+.2*vnoise(i.wp.xz*3.));
   let rc=leafCells(vec3f(i.wp.x*1.6,0.,i.wp.z*1.6));
   let rockA=vec3f(.46,.45,.42)*(.75+.35*rc.y)*mix(1.,.6,smoothstep(.35,.5,rc.x));
   let grassW=clamp(1.-gt.r-gt.g-gt.b-gt.a,0.,1.);
   albedo=albedo*grassW+pathA*gt.r+soilA*gt.g+mudA*gt.b+rockA*gt.a;
  }
 }`);
const W_SHADOW=/*wgsl*/`
struct Globals { vp:mat4x4f, model:mat4x4f, color:vec4f, sun:vec4f, camera:vec4f };
@group(0) @binding(0) var<uniform> g:Globals;
@group(1) @binding(0) var<uniform> light:mat4x4f;
struct SOut { @builtin(position) p:vec4f, @location(0) wp:vec3f, @location(1) aux:f32 };
@vertex fn vs(@location(0) p:vec3f,@location(1) n:vec4f)->SOut { var o:SOut;let wp=g.model*vec4f(p,1.);o.p=light*wp;o.wp=wp.xyz;o.aux=n.w;return o; }
fn hash3(p:vec3f)->vec3f { return fract(sin(vec3f(dot(p,vec3f(127.1,311.7,74.7)),dot(p,vec3f(269.5,183.3,246.1)),dot(p,vec3f(113.5,271.9,124.6))))*43758.5453); }
fn leafCells(p:vec3f)->vec2f {
 let c=floor(p);let f=fract(p);var d=8.;var id=0.;
 for(var z=-1;z<=1;z++){for(var y=-1;y<=1;y++){for(var x=-1;x<=1;x++){
  let o=vec3f(f32(x),f32(y),f32(z));let r=hash3(c+o);let v=o+r-f;let dd=dot(v,v);if(dd<d){d=dd;id=r.x;}
 }}}
 return vec2f(sqrt(d),id);
}
@fragment fn fs(i:SOut) { if(abs(i.aux+.6535)<.04&&i.wp.y>1.6&&leafCells(i.wp*7.).x>.5){discard;} }`;
const FOREST_SUN=[.62,.36,-.70];  // golden hour: low (about 21 deg) and warm; WGSL copies use the same numbers
// forestShadow(device, sceneLayout, objects) -> null | {layout, group, encode(encoder, draws, binding, stride)}
// Hook contract for forest-main: scene pipeline uses W_FOREST_SHADOWED with bindGroupLayouts
// [sceneLayout, shadow.layout]; each frame call shadow.encode(...) after writing the uniforms and
// before the scene pass, and setBindGroup(1, shadow.group) after setting the scene pipeline.
// forestGroundTexture(device): the ground-type texture named "ground-types" in manifest.json assets, with its
// "worldToUV": [a,b,c,d,e,f]. Without one (or if it fails to load) a 1x1 texture is bound and the shader ignores it.
async function forestGroundTexture(device){
 const entry=typeof PLUGIN_ASSETS==='object'&&PLUGIN_ASSETS?PLUGIN_ASSETS['ground-types']:null;
 const uniform=device.createBuffer({size:32,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});
 let texture=null,t=[0,0,0,0,0,0,0,0];
 if(entry&&entry.url&&Array.isArray(entry.worldToUV)&&entry.worldToUV.length===6){
  try{
   const bitmap=await createImageBitmap(await (await fetch(entry.url)).blob(),{colorSpaceConversion:'none',premultiplyAlpha:'none'});
   texture=device.createTexture({size:[bitmap.width,bitmap.height],format:'rgba8unorm',usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT});
   device.queue.copyExternalImageToTexture({source:bitmap},{texture},[bitmap.width,bitmap.height]);
   const [a,b,c,d,e,f]=entry.worldToUV;t=[a,b,c,1,d,e,f,0];
  }catch(error){console.warn('ground-types texture not used:',error);texture=null;}
 }
 if(!texture){texture=device.createTexture({size:[1,1],format:'rgba8unorm',usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST});device.queue.writeTexture({texture},new Uint8Array(4),{bytesPerRow:4},[1,1]);}
 device.queue.writeBuffer(uniform,0,new Float32Array(t));
 if(typeof forestState==='object')forestState.groundTypes=t[3]===1;
 return {uniform,texture};
}
async function forestShadow(device,sceneLayout,objects,size=2048){
 const n=Math.hypot(...FOREST_SUN),f=FOREST_SUN.map(v=>-v/n);
 let s=[f[2],0,-f[0]];const sl=Math.hypot(...s);s=s.map(v=>v/sl);
 const u=[s[1]*f[2]-s[2]*f[1],s[2]*f[0]-s[0]*f[2],s[0]*f[1]-s[1]*f[0]];
 const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];
 for(const o of objects){
  const vb=o.mesh&&o.mesh.vb;if(!vb)continue;const v=new Float32Array(vb.buffer||vb,vb.byteOffset||0,(vb.byteLength||vb.length*4)/4),M=o.model;
  let a=[Infinity,Infinity,Infinity],b=[-Infinity,-Infinity,-Infinity];const pts=[];
  for(let i=0;i+2<v.length;i+=4){const x=v[i],y=v[i+1],z=v[i+2],w=[M[0]*x+M[4]*y+M[8]*z+M[12],M[1]*x+M[5]*y+M[9]*z+M[13],M[2]*x+M[6]*y+M[10]*z+M[14]];for(let k=0;k<3;k++){a[k]=Math.min(a[k],w[k]);b[k]=Math.max(b[k],w[k]);}pts.push(w);}
  if(b[0]-a[0]>60||b[2]-a[2]>60)continue;
  for(const w of pts){const q=[s[0]*w[0]+s[1]*w[1]+s[2]*w[2],u[0]*w[0]+u[1]*w[1]+u[2]*w[2],f[0]*w[0]+f[1]*w[1]+f[2]*w[2]];for(let k=0;k<3;k++){lo[k]=Math.min(lo[k],q[k]);hi[k]=Math.max(hi[k],q[k]);}}
 }
 if(!isFinite(lo[0]))return null;
 lo[0]-=2;lo[1]-=2;hi[0]+=2;hi[1]+=2;lo[2]-=40;hi[2]+=40;
 const sx=2/(hi[0]-lo[0]),sy=2/(hi[1]-lo[1]),sz=1/(hi[2]-lo[2]),mx=(lo[0]+hi[0])/2,my=(lo[1]+hi[1])/2;
 const L=new Float32Array([s[0]*sx,u[0]*sy,f[0]*sz,0, s[1]*sx,u[1]*sy,f[1]*sz,0, s[2]*sx,u[2]*sy,f[2]*sz,0, -mx*sx,-my*sy,-lo[2]*sz,1]);
 const lightBuf=device.createBuffer({size:64,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});device.queue.writeBuffer(lightBuf,0,L);
 const map=device.createTexture({size:[size,size],format:'depth32float',usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.TEXTURE_BINDING});
 const castLayout=device.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.VERTEX,buffer:{type:'uniform'}}]});
 const layout=device.createBindGroupLayout({entries:[{binding:0,visibility:GPUShaderStage.FRAGMENT,buffer:{type:'uniform'}},{binding:1,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:'depth'}},{binding:2,visibility:GPUShaderStage.FRAGMENT,sampler:{type:'comparison'}},{binding:3,visibility:GPUShaderStage.FRAGMENT,buffer:{type:'uniform'}},{binding:4,visibility:GPUShaderStage.FRAGMENT,texture:{sampleType:'float'}},{binding:5,visibility:GPUShaderStage.FRAGMENT,sampler:{type:'filtering'}}]});
 const groundSet=await forestGroundTexture(device);
 const module=device.createShaderModule({code:W_SHADOW});
 const pipeline=await device.createRenderPipelineAsync({layout:device.createPipelineLayout({bindGroupLayouts:[sceneLayout,castLayout]}),vertex:{module,entryPoint:'vs',buffers:[{arrayStride:16,attributes:[{shaderLocation:0,offset:0,format:'float32x3'},{shaderLocation:1,offset:12,format:'snorm8x4'}]}]},fragment:{module,entryPoint:'fs',targets:[]},primitive:{topology:'triangle-list',cullMode:'none'},depthStencil:{format:'depth32float',depthWriteEnabled:true,depthCompare:'less',depthBias:2,depthBiasSlopeScale:2.5}});
 const castGroup=device.createBindGroup({layout:castLayout,entries:[{binding:0,resource:{buffer:lightBuf}}]});
 const group=device.createBindGroup({layout,entries:[{binding:0,resource:{buffer:lightBuf}},{binding:1,resource:map.createView()},{binding:2,resource:device.createSampler({compare:'less',magFilter:'linear',minFilter:'linear'})},{binding:3,resource:{buffer:groundSet.uniform}},{binding:4,resource:groundSet.texture.createView()},{binding:5,resource:device.createSampler({magFilter:'linear',minFilter:'linear'})}]});
 return {layout,group,light:L,encode(encoder,draws,binding,stride){
  const pass=encoder.beginRenderPass({colorAttachments:[],depthStencilAttachment:{view:map.createView(),depthClearValue:1,depthLoadOp:'clear',depthStoreOp:'store'}});
  pass.setPipeline(pipeline);pass.setBindGroup(1,castGroup);
  for(let i=0;i<draws.length;i++){const d=draws[i];if(d.tree&&d.tree.fade<=0)continue;pass.setBindGroup(0,binding,[i*stride]);pass.setVertexBuffer(0,d.vertex);pass.setIndexBuffer(d.index,'uint32');pass.drawIndexed(d.group.indexCount,1,d.group.firstIndex);}
  pass.end();
 }};
}
// Sky (Konev, iteration 1): a full-screen triangle drawn first, no depth writes. It reads the same
// uniform block as the scene (draw 0's slot: vp and camera) to rebuild each pixel's view ray, so the
// haze sits exactly on the real horizon and meets the scene fog colour; a pale blue zenith above and a
// soft warm glow around the sun direction.
const W_SKY=/*wgsl*/`
struct Globals { vp:mat4x4f, model:mat4x4f, color:vec4f, sun:vec4f, camera:vec4f };
@group(0) @binding(0) var<uniform> g:Globals;
struct SkyOut { @builtin(position) p:vec4f, @location(0) ndc:vec2f };
@vertex fn vs(@builtin(vertex_index) i:u32)->SkyOut {
 var o:SkyOut; let x=f32((i<<1u)&2u)*2.-1.;let y=f32(i&2u)*2.-1.;
 o.p=vec4f(x,-y,1.,1.);o.ndc=vec2f(x,-y);return o;
}
fn ch(p:vec2f)->f32 { return fract(sin(dot(p,vec2f(127.1,311.7)))*43758.5453); }
fn cnoise(p:vec2f)->f32 { let i=floor(p);let f=fract(p);let u=f*f*(3.-2.*f);
 return mix(mix(ch(i),ch(i+vec2f(1.,0.)),u.x),mix(ch(i+vec2f(0.,1.)),ch(i+vec2f(1.,1.)),u.x),u.y); }
fn inv4(m:mat4x4f)->mat4x4f {
 let a00=m[0][0];let a01=m[0][1];let a02=m[0][2];let a03=m[0][3];
 let a10=m[1][0];let a11=m[1][1];let a12=m[1][2];let a13=m[1][3];
 let a20=m[2][0];let a21=m[2][1];let a22=m[2][2];let a23=m[2][3];
 let a30=m[3][0];let a31=m[3][1];let a32=m[3][2];let a33=m[3][3];
 let b00=a00*a11-a01*a10;let b01=a00*a12-a02*a10;let b02=a00*a13-a03*a10;
 let b03=a01*a12-a02*a11;let b04=a01*a13-a03*a11;let b05=a02*a13-a03*a12;
 let b06=a20*a31-a21*a30;let b07=a20*a32-a22*a30;let b08=a20*a33-a23*a30;
 let b09=a21*a32-a22*a31;let b10=a21*a33-a23*a31;let b11=a22*a33-a23*a32;
 let det=b00*b11-b01*b10+b02*b09+b03*b08-b04*b07+b05*b06;
 return mat4x4f(
  vec4f(a11*b11-a12*b10+a13*b09,a02*b10-a01*b11-a03*b09,a31*b05-a32*b04+a33*b03,a22*b04-a21*b05-a23*b03),
  vec4f(a12*b08-a10*b11-a13*b07,a00*b11-a02*b08+a03*b07,a32*b02-a30*b05-a33*b01,a20*b05-a22*b02+a23*b01),
  vec4f(a10*b10-a11*b08+a13*b06,a01*b08-a00*b10-a03*b06,a30*b04-a31*b02+a33*b00,a21*b02-a20*b04-a23*b00),
  vec4f(a11*b07-a10*b09-a12*b06,a00*b09-a01*b07+a02*b06,a31*b01-a30*b03-a32*b00,a20*b03-a21*b01+a22*b00))*(1./det);
}
@fragment fn fs(i:SkyOut)->@location(0) vec4f {
 let q=inv4(g.vp)*vec4f(i.ndc,.5,1.);let ray=normalize(q.xyz/q.w-g.camera.xyz);
 let haze=vec3f(.66,.73,.55);let zenith=vec3f(.46,.66,.88);let warm=vec3f(1.,.86,.58);
 var c=mix(haze,zenith,smoothstep(-.02,.45,ray.y));
 // Soft clouds: fbm on a plane above the camera, thinning toward the horizon; lit warm on the sun side.
 if(ray.y>.01){
  let pc=ray.xz/ray.y*.35;var a=0.;var w=.5;var q=pc;
  for(var k=0;k<5;k++){a+=w*cnoise(q);q=q*2.03+vec2f(1.7,9.2);w*=.5;}
  let cov=smoothstep(.48,.78,a)*smoothstep(.01,.18,ray.y);
  let lit=mix(vec3f(.86,.86,.84),vec3f(1.,.90,.72),pow(max(dot(normalize(ray),normalize(vec3f(.62,.36,-.70))),0.),3.));
  c=mix(c,lit,cov*.85);
 }
 let sun=normalize(vec3f(.62,.36,-.70));
 let sd=max(dot(ray,sun),0.);
 c=mix(c,warm,.55*pow(sd,6.));
 c+=vec3f(1.,.92,.75)*(pow(sd,900.)*3.+pow(sd,60.)*.35);
 return vec4f(c,1.);
}`;
