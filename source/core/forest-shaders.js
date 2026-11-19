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
