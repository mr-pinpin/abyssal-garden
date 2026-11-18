// Above-ground renderer for the garden's existing packed Mesh and plugin descriptors.
// WebGL2 keeps this static showcase usable on browsers without WebGPU adapters.
const canvas = document.getElementById('c'), status = document.getElementById('s');
const gl = canvas.getContext('webgl2', {antialias: true, alpha: false, preserveDrawingBuffer: true});
if (!gl) throw new Error('WebGL 2 is unavailable. Try a current browser with graphics enabled.');
const forestErrors = [];
canvas.addEventListener('webglcontextlost', e => {e.preventDefault(); status.textContent = 'Graphics context lost. Reload to recover.'; forestErrors.push('context lost');});
const shader = (type, code) => {
  const s = gl.createShader(type); gl.shaderSource(s, code); gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
  return s;
};
const program = gl.createProgram();
gl.attachShader(program, shader(gl.VERTEX_SHADER, `#version 300 es
precision highp float;
in vec3 position; in vec3 normal; in vec3 color;
uniform mat4 viewProjection; out vec3 world; out vec3 n; out vec3 tint;
void main(){world=position;n=normal;tint=color;gl_Position=viewProjection*vec4(position,1.);}`));
gl.attachShader(program, shader(gl.FRAGMENT_SHADER, `#version 300 es
precision highp float;
in vec3 world; in vec3 n; in vec3 tint; uniform vec3 eye; out vec4 pixel;
void main(){vec3 norm=normalize(n);if(!gl_FrontFacing)norm=-norm;
float sun=max(0.,dot(norm,normalize(vec3(-.5,1.,.6))));
float sky=.5+.5*norm.y;
vec3 lit=tint*(vec3(.27,.34,.25)+vec3(.86,.79,.55)*sun+vec3(.22,.28,.24)*sky);
float grain=.97+.03*sin(world.x*2.7+sin(world.z*3.));lit*=grain;
float fog=1.-exp(-length(world-eye)*.010);lit=mix(lit,vec3(.70,.78,.64),fog);
pixel=vec4(pow(max(lit,vec3(0.)),vec3(.86)),1.);}`));
gl.linkProgram(program);
if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
gl.useProgram(program);
const groups = [
  {id:'home',title:'Home & forest',pieces:typeof pinpinHomePieces === 'function' ? pinpinHomePieces() : null},
  {id:'elder',title:'Elder sanctuary',pieces:typeof pinpinElderPieces === 'function' ? pinpinElderPieces() : null},
  {id:'pinpin',title:'PinPin & friends',pieces:typeof pinpinCharacterPieces === 'function' ? pinpinCharacterPieces() : null}
].filter(g => g.pieces);
const environment = {id:'landscape',title:'Landscape',enabled:true,pieces:[]};
const landscapePiece = (name, build, color) => ({name,build,asset:null,position:[0,0,0],rotation:[0,0,0],scale:[1,1,1],color});
environment.pieces.push(landscapePiece('ground', () => {
  const m = new Mesh(); const a=m.v(-110,-.025,-110),b=m.v(-110,-.025,110),c=m.v(110,-.025,110),d=m.v(110,-.025,-110);m.quad(a,b,c,d);return m.build();
}, [.37,.47,.23]));
environment.pieces.push(landscapePiece('stream', () => {
  const m = new Mesh(), points=[[4,-40],[6,-24],[5,-15],[5,-7],[7,0],[10,12],[15,32]];
  const pairs=points.map(([x,z])=>[m.v(x-.68,.008,z),m.v(x+.68,.008,z)]);
  for(let i=1;i<pairs.length;i++)m.quad(pairs[i-1][0],pairs[i][0],pairs[i][1],pairs[i-1][1]);return m.build();
}, [.30,.57,.60]));
// A quiet woodland edge: repeated low-poly canopies, without blocking the authored path.
environment.pieces.push(landscapePiece('distant-woodland', () => {
  const m = new Mesh();
  for(let i=0;i<64;i++){
    const a=i/64*TAU, r=32+4*sin(i*7.1),x=cos(a)*r,z=sin(a)*r-6,h=4+2*(.5+.5*sin(i*4.3));
    m.tube([[x,0,z],[x+.1,h,z]],.17,7);
    const crown=icosphere(1,(u,v,w)=>[x+u*2.6,h+v*2.6,z+w*2.6]);
    const offset=m.p.length/3;for(let k=0;k<crown.p.length;k+=3)m.v(crown.p[k],crown.p[k+1],crown.p[k+2],.65);for(const k of crown.i)m.i.push(k+offset);
  }return m.build();
}, [.20,.35,.19]));
groups.unshift(environment);
const vertices=[], indices=[], loadedAssets=[];
function rotate(v, angles){
  let [x,y,z]=v; const [ax,ay,az]=angles;
  [y,z]=[y*cos(ax)-z*sin(ax),y*sin(ax)+z*cos(ax)];
  [x,z]=[x*cos(ay)+z*sin(ay),-x*sin(ay)+z*cos(ay)];
  [x,y]=[x*cos(az)-y*sin(az),x*sin(az)+y*cos(az)];return [x,y,z];
}
for(const group of groups){
  group.enabled=true;group.start=indices.length;
  for(const p of group.pieces){
    const mesh=p.asset && typeof setPiece==='function' ? await setPiece(p.asset,p.build) : p.build();
    if(p.asset)loadedAssets.push({id:p.asset,materialColors:!!mesh.colors,vertices:mesh.nv});
    const f=new Float32Array(mesh.vb),norm=new Int8Array(mesh.vb),base=vertices.length/9;
    for(let k=0;k<mesh.nv;k++){
      const pt=rotate([f[k*4]*p.scale[0],f[k*4+1]*p.scale[1],f[k*4+2]*p.scale[2]],p.rotation);
      const n=rotate([norm[k*16+12]/p.scale[0],norm[k*16+13]/p.scale[1],norm[k*16+14]/p.scale[2]],p.rotation);
      const len=Math.hypot(...n)||1, aux=mesh.colors ? 1 : .66+.34*Math.max(0,norm[k*16+15]/127);
      const color=mesh.colors ? Array.from(mesh.colors.subarray(k*3,k*3+3)) : p.color.map(c=>c*aux);
      vertices.push(pt[0]+p.position[0],pt[1]+p.position[1],pt[2]+p.position[2],...n.map(x=>x/len),...color);
    }
    for(const i of mesh.ib)indices.push(base+i);
  }
  group.count=indices.length-group.start;
}
const vao=gl.createVertexArray();gl.bindVertexArray(vao);
const vb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,vb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);
for(const [i,name] of ['position','normal','color'].entries()){
  const loc=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,3,gl.FLOAT,false,36,i*12);
}
const ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint32Array(indices),gl.STATIC_DRAW);
gl.enable(gl.DEPTH_TEST);gl.clearColor(.70,.78,.64,1);
function matrix(){
  const forward=[sin(yaw)*cos(pitch),sin(pitch),-cos(yaw)*cos(pitch)],right=[cos(yaw),0,sin(yaw)],up=[-sin(yaw)*sin(pitch),cos(pitch),cos(yaw)*sin(pitch)];
  const dot=(a,b)=>a.reduce((n,x,i)=>n+x*b[i],0);
  const view=[right[0],up[0],-forward[0],0,right[1],up[1],-forward[1],0,right[2],up[2],-forward[2],0,-dot(right,eye),-dot(up,eye),dot(forward,eye),1];
  const near=.08,far=220,f=1/Math.tan(55*PI/360),aspect=canvas.width/canvas.height;
  const projection=[f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0], out=new Float32Array(16);
  for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)out[c*4+r]+=projection[k*4+r]*view[c*4+k];
  return out;
}
const vpLoc=gl.getUniformLocation(program,'viewProjection'), eyeLoc=gl.getUniformLocation(program,'eye');
const views={overview:[[27,25,32],[0,0,-5]],home:[[-26,7,-2],[-12,1,-2]],pinpin:[[3.8,2.7,7],[0,.75,4]],elder:[[19,7,-4],[14,2,-16]]};
let eye=[...views.overview[0]],yaw=0,pitch=0,activeView='overview',frames=0;
function go(name){
  const [from,to]=views[name];eye=[...from];const d=to.map((x,i)=>x-from[i]);yaw=Math.atan2(d[0],-d[2]);pitch=Math.atan2(d[1],Math.hypot(d[0],d[2]));activeView=name;
  document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===name)));
}
go('overview');
for(const button of document.querySelectorAll('[data-view]'))button.onclick=()=>go(button.dataset.view);
for(const group of groups.filter(g=>g!==environment)){
  const label=document.createElement('label'), checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.checked=true;checkbox.dataset.layer=group.id;checkbox.onchange=()=>{group.enabled=checkbox.checked;};label.append(checkbox,group.title);document.getElementById('layers').append(label);
}
const keys=new Set();
addEventListener('keydown',e=>{if(e.target instanceof HTMLInputElement)return;const k=e.key.toLowerCase();if(['w','a','s','d','q','e','arrowup','arrowdown','arrowleft','arrowright','shift'].includes(k)){e.preventDefault();keys.add(k);}if('1234'.includes(k))go(Object.keys(views)[+k-1]);});
addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));addEventListener('blur',()=>keys.clear());
let dragging=false,lastX=0,lastY=0;
canvas.onpointerdown=e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId);canvas.focus();};
canvas.onpointerup=()=>dragging=false;canvas.onpointercancel=()=>dragging=false;
canvas.onpointermove=e=>{if(!dragging)return;yaw+=(e.clientX-lastX)*.005;pitch=Math.max(-1.4,Math.min(1.4,pitch-(e.clientY-lastY)*.005));lastX=e.clientX;lastY=e.clientY;};
canvas.onwheel=e=>{e.preventDefault();eye[0]+=sin(yaw)*e.deltaY*.012;eye[2]-=cos(yaw)*e.deltaY*.012;};
let previous=performance.now();
function frame(now){
  const dt=Math.max(0,Math.min(.05,(now-previous)/1000));previous=now;
  const speed=(keys.has('shift')?10:4)*dt;
  const forward=Number(keys.has('w')||keys.has('arrowup'))-Number(keys.has('s')||keys.has('arrowdown'));
  const side=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft'));
  const travel=Math.hypot(forward,side)||1;
  eye[0]+=speed*(sin(yaw)*forward+cos(yaw)*side)/travel;eye[2]+=speed*(-cos(yaw)*forward+sin(yaw)*side)/travel;
  eye[1]=Math.max(.55,eye[1]+speed*(Number(keys.has('e'))-Number(keys.has('q'))));eye[0]=Math.max(-65,Math.min(65,eye[0]));eye[2]=Math.max(-65,Math.min(65,eye[2]));
  const dpr=Math.min(1.75,devicePixelRatio||1),w=Math.round(innerWidth*dpr),h=Math.round(innerHeight*dpr);
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}gl.viewport(0,0,w,h);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  gl.uniformMatrix4fv(vpLoc,false,matrix());gl.uniform3fv(eyeLoc,eye);
  for(const group of groups)if(group.enabled)gl.drawElements(gl.TRIANGLES,group.count,gl.UNSIGNED_INT,group.start*4);
  frames++;requestAnimationFrame(frame);
}
status.textContent=`${groups.length-1} scenes · ${loadedAssets.filter(a=>a.materialColors).length}/5 Blender assets`;
window.forestState=()=>({ready:true,frames,eye:[...eye],view:activeView,groups:groups.map(g=>({id:g.id,enabled:g.enabled,pieces:g.pieces.length,triangles:g.count/3})),assets:loadedAssets,errors:[...forestErrors],glError:gl.getError(),renderer:gl.getParameter(gl.RENDERER)});
window.forestView=go;
requestAnimationFrame(frame);
