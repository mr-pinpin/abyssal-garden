// Small forest pipeline: original packed Mesh layout + optional GLB material groups.
// Lighting (Konev, iteration 1): a low warm sun with a cool sky fill and warm ground bounce,
// soft wrap so shadowed sides keep their form, contact darkening near the ground, procedural
// breakup on near-horizontal surfaces so the meadow is not one flat colour, aerial perspective
// toward the horizon colour, and a gentle filmic curve. Leaf vertices (aux -0.65) get backscatter and sheen. Uniform layout is unchanged (176 bytes).
const W_FOREST=/*wgsl*/`
struct Globals { vp:mat4x4f, model:mat4x4f, color:vec4f, sun:vec4f, camera:vec4f };
@group(0) @binding(0) var<uniform> g:Globals;
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
fn filmic(x:vec3f)->vec3f { return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),vec3f(0.),vec3f(1.)); }
@fragment fn fs(i:Out)->@location(0) vec4f {
 if(g.color.a<1.){let v=52.9829189*fract(dot(floor(i.cp.xy),vec2f(.06711056,.00583715)));if(fract(v)>=g.color.a){discard;}}
 var n=normalize(i.n);
 // Thin cards are drawn double-sided: light the side that faces the camera.
 let view=normalize(g.camera.xyz-i.wp);if(dot(n,view)<0.){n=-n;}
 var albedo=g.color.rgb;
 // Breakup on ground-like surfaces: two octaves of value noise in world space.
 let flat=smoothstep(.55,.9,n.y);
 let br=vnoise(i.wp.xz*.35)*.6+vnoise(i.wp.xz*1.7)*.4;
 albedo*=mix(1.,.68+.42*br,flat);
 albedo=mix(albedo,albedo*vec3f(1.08,1.02,.82),flat*smoothstep(.55,.85,vnoise(i.wp.xz*.12+vec2f(7.,3.))));
 let sun=normalize(vec3f(.52,.62,.34));
 let sunC=vec3f(1.,.90,.74)*1.12;
 let wrap=max((dot(n,sun)+.25)/1.25,0.);
 let sky=mix(vec3f(.30,.27,.18),vec3f(.46,.56,.66),n.y*.5+.5);
 // Contact darkening: vertical faces close to the ground sit in the grass and get less sky.
 let ao=mix(.62,1.,smoothstep(-.2,1.1,i.wp.y))*mix(1.,.9,1.-flat);
 var c=albedo*(sky*.50*ao+sunC*wrap*.85);
 // Soft rim from the sun side for silhouettes against the haze.
 c+=albedo*sunC*.18*pow(1.-max(dot(n,view),0.),3.)*max(dot(sun,-view)*.5+.5,0.);
 // Foliage marker: leaf vertices carry aux = -0.65 (snorm8 -83) in the normal's w.
 // Leaves let light through (backscatter) and show a soft waxy sheen; everything else is unchanged.
 let leaf=1.-smoothstep(.02,.05,abs(i.aux+.65));
 let back=max(dot(-n,sun),0.)*.6+pow(max(dot(sun,-view),0.),4.)*.8;
 c+=leaf*albedo*vec3f(1.,1.05,.7)*sunC*back*.55;
 let hv=normalize(sun+view);
 c+=leaf*sunC*vec3f(.9,1.,.8)*.07*pow(max(dot(n,hv),0.),24.);
 c*=mix(1.,.86+.14*vnoise(i.wp.xz*3.1+i.wp.y),leaf);
 // Warm sanctuary lamplight is bounded, independent of the optional ambience.
 let lamp=vec3f(14.,2.8,-19.);let d=distance(lamp,i.wp);
 c+=albedo*vec3f(.72,.40,.12)*(.60/(1.+d*d*.13));
 // Aerial perspective: distance and height fog toward the horizon colour.
 let dist=distance(g.camera.xyz,i.wp);
 let fog=(1.-exp(-dist*.012))*mix(1.,.6,smoothstep(0.,12.,i.wp.y));
 c=mix(c,vec3f(.26,.34,.17),clamp(fog*.8,0.,1.));
 c=filmic(c*.98);let lum=dot(c,vec3f(.2126,.7152,.0722));c=max(mix(vec3f(lum),c,1.12),vec3f(0.));
 return vec4f(pow(c,vec3f(1./2.2)),1.);
}`;
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
 let haze=vec3f(.66,.73,.55);let zenith=vec3f(.58,.74,.86);let warm=vec3f(.98,.90,.70);
 var c=mix(haze,zenith,smoothstep(-.02,.45,ray.y));
 let sun=normalize(vec3f(.52,.62,.34));
 c=mix(c,warm,.45*pow(max(dot(ray,sun),0.),6.));
 return vec4f(c,1.);
}`;
