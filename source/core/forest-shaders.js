// Small forest pipeline: original packed Mesh layout + optional GLB material groups.
const W_FOREST=/*wgsl*/`
struct Globals { vp:mat4x4f, model:mat4x4f, color:vec4f, sun:vec4f, camera:vec4f };
@group(0) @binding(0) var<uniform> g:Globals;
struct Out { @builtin(position) cp:vec4f, @location(0) wp:vec3f, @location(1) n:vec3f };
@vertex fn vs(@location(0) p:vec3f,@location(1) n:vec4f)->Out {
 var o:Out; let wp=g.model*vec4f(p,1.);o.cp=g.vp*wp;o.wp=wp.xyz;
 o.n=normalize((g.model*vec4f(n.xyz,0.)).xyz);return o;
}
@fragment fn fs(i:Out)->@location(0) vec4f {
 let n=normalize(i.n);let diffuse=max(dot(n,normalize(g.sun.xyz)),0.);
 let hemisphere=.34+.16*max(n.y,0.);var c=g.color.rgb*(hemisphere+diffuse*.78);
 // Warm sanctuary lamplight is bounded, independent of the optional ambience.
 let lamp=vec3f(14.,2.8,-19.);let d=distance(lamp,i.wp);
 c+=g.color.rgb*vec3f(.72,.40,.12)*(.60/(1.+d*d*.13));
 let fog=1.-exp(-distance(g.camera.xyz,i.wp)*.010);
 c=mix(c,vec3f(.56,.66,.47),fog*.65);
 c=c/(vec3f(1.)+c*.22);return vec4f(pow(max(c,vec3f(0.)),vec3f(1./2.2)),1.);
}`;
