// Authored woodland detail. No timers, DOM, asset requests or audio ownership.
const pinpinLifeActors=[];
let pinpinLifeScene=null;
function pinpinLifePieces(){
 if(pinpinLifeScene)return pinpinLifeScene;
 const pieces=[];
 const descriptor=(name,mesh,color,position=[0,0,0],dynamic=false)=>{
  const built=mesh.build();const p={name:'woodland-life/'+name,asset:null,build:()=>built,color,position,rotation:[0,0,0],scale:[1,1,1],dynamic};pieces.push(p);return p;
 };
 // Three batched meshes: stems, warm petals and pale flower centres.
 const stems=new Mesh(),petals=new Mesh(),centres=new Mesh();
 for(let i=0;i<32;i++){
  const a=i*2.399963,x=8.7+Math.cos(a)*(1+(i%7)*.22),z=10.1+Math.sin(a)*(.7+(i%5)*.17),h=.19+(i%4)*.055;
  stems.tube([[x,.02,z],[x+.035,h,z]],t=>t?.012:.021,4);
  for(let j=0;j<5;j++){
   const r=j*Math.PI*2/5,px=x+Math.cos(r)*.10,pz=z+Math.sin(r)*.10;
   const v=petals.v(x,h,z),l=petals.v(px-Math.sin(r)*.058,h+.035,pz+Math.cos(r)*.058),tip=petals.v(x+Math.cos(r)*.18,h+.025,z+Math.sin(r)*.18),rr=petals.v(px+Math.sin(r)*.058,h+.035,pz-Math.cos(r)*.058);petals.quad(v,l,tip,rr);
  }
  centres.tube([[x,h,z],[x,h+.027,z]],()=>.044,6);
 }
 // Low leaves gather the flowers into a habitat instead of isolated stems.
 for(let i=0;i<60;i++){
  const a=i*2.399963,r=.35+Math.sqrt(i/60)*1.9,x=8.7+Math.cos(a)*r,z=10.1+Math.sin(a)*r*.72;
  for(let j=0;j<3;j++){
   const d=a+j*2.094,h=.12+(i%5)*.024,dx=Math.cos(d),dz=Math.sin(d);
   const b=stems.v(x-dz*.035,.015,z+dx*.035),c=stems.v(x+dz*.035,.015,z-dx*.035),tip=stems.v(x+dx*.16,h,z+dz*.16);stems.tri(b,tip,c);
  }
 }
 // Three feathered ferns frame the patch; individual leaf silhouettes, one batch.
 for(const [x,z,size] of [[11.1,11.6,.9],[7.2,11.5,.7],[10.7,8.7,.65]]){
  for(let f=0;f<5;f++){
   const a=f*Math.PI*2/5,dx=Math.cos(a),dz=Math.sin(a);
   for(let k=1;k<=6;k++){
    const t=k/7,cx=x+dx*t*size,cz=z+dz*t*size,cy=.04+Math.sin(t*Math.PI*.8)*size*.65;
    for(const side of [-1,1]){
     const w=(1-t)*size*.30,base=stems.v(cx,cy,cz),tip=stems.v(cx-dz*w*side+dx*.11*size,cy+.02,cz+dx*w*side+dz*.11*size),end=stems.v(cx+dx*.13*size,cy+.04,cz+dz*.13*size);stems.tri(base,tip,end);
    }
   }
  }
 }
 descriptor('meadow-stems',stems,[.25,.39,.13]);descriptor('meadow-petals',petals,[.94,.65,.22]);descriptor('meadow-pollen',centres,[1,.89,.53]);
 // Atlas-led understory: irregular colonies, arching blades and folded leaves.
 // These local habitat ellipses are authored world positions, NOT recovered atlas heights.
 const habitat=[{x:9.1,z:11.5,rx:2.4,rz:1.0},{x:12.3,z:9.2,rx:1.5,rz:1.2},{x:12.4,z:13.8,rx:3.1,rz:1.25},{x:16.5,z:10.8,rx:1.3,rz:2.1}];
 const foliage=[new Mesh(),new Mesh(),new Mesh()];
 let seed=29173;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 // A bent, folded ribbon keeps its silhouette from both top-down and eye-level views.
 function leaf(mesh,x,y,z,angle,length,width,rise,segments=5){
  const dx=Math.cos(angle),dz=Math.sin(angle),rows=[];
  for(let k=0;k<=segments;k++){
   const t=k/segments,w=width*Math.sin(Math.PI*t)*(.85+.15*t),cx=x+dx*length*t,cz=z+dz*length*t,cy=y+rise*Math.sin(t*Math.PI*.72);
   rows.push([mesh.v(cx-dz*w,cy-w*.22,cz+dx*w),mesh.v(cx,cy+w*.16,cz),mesh.v(cx+dz*w,cy-w*.22,cz-dx*w)]);
   if(k){const a=rows[k-1],b=rows[k];mesh.quad(a[0],b[0],b[1],a[1]);mesh.quad(a[1],b[1],b[2],a[2]);}
  }
 }
 for(let i=0;i<260;i++){
  const h=habitat[i%habitat.length],a=random()*Math.PI*2,r=Math.sqrt(random()),x=h.x+Math.cos(a)*r*h.rx,z=h.z+Math.sin(a)*r*h.rz;
  // Keep the stream and bridge corridor clear even if an ellipse is later widened.
  if(z<8.15||Math.abs(x-7)<1.2&&z<11)continue;
  const mesh=foliage[i%3],height=.13+random()*.29;
  for(let j=0;j<4;j++)leaf(mesh,x,.018,z,random()*Math.PI*2,.12+random()*.20,.012+random()*.014,height*(.6+random()*.4));
 }
 for(let i=0;i<12;i++){
  const h=habitat[i%habitat.length],a=random()*Math.PI*2,r=Math.sqrt(random()),x=h.x+Math.cos(a)*r*h.rx,z=h.z+Math.sin(a)*r*h.rz,mesh=foliage[i%3];
  for(let f=0;f<7;f++){
   const angle=f*Math.PI*2/7+random()*.22,dx=Math.cos(angle),dz=Math.sin(angle),size=.4+random()*.45;
   for(let k=1;k<=7;k++){
    const t=k/8,cx=x+dx*t*size,cz=z+dz*t*size,cy=.03+Math.sin(t*Math.PI*.8)*size*.65;
    for(const side of [-1,1])leaf(mesh,cx,cy,cz,angle+side*1.05,(1-t)*size*.34,.018+(1-t)*.025,.035,2);
   }
  }
 }
 [[.12,.23,.065],[.22,.34,.09],[.34,.42,.14]].forEach((color,i)=>descriptor('understory-'+i,foliage[i],color));
 const wing=(side)=>{
  const m=new Mesh(),v=(x,z)=>m.v(x*side,0,z);
  const root=v(0,0),a=v(.12,-.21),b=v(.32,-.18),c=v(.29,.04),d=v(.20,.18),e=v(.06,.15);
  m.tri(root,b,a);m.tri(root,c,b);m.tri(root,d,c);m.tri(root,e,d);return m;
 };
 for(let i=0;i<6;i++){
  const color=i%2?[.98,.73,.28]:[.59,.77,.86];
  const left=descriptor('butterfly-'+i+'-left',wing(-1),color,[0,0,0],true);
  const right=descriptor('butterfly-'+i+'-right',wing(1),color,[0,0,0],true);
  const m=new Mesh();m.tube([[0,0,-.13],[0,0,.15]],()=>.025,5);
  const body=descriptor('butterfly-'+i+'-body',m,[.24,.19,.12],[0,0,0],true);
  pinpinLifeActors.push({left,right,body,phase:i*2.399963});
 }
 pinpinLifeScene=pieces;pinpinUpdateLife(0);return pieces;
}
function pinpinUpdateLife(seconds){
 const t=Number.isFinite(seconds)?seconds:0;
 for(const {left,right,body,phase} of pinpinLifeActors){
  const a=t*.30+phase,x=8.7+Math.cos(a)*1.65,z=10.1+Math.sin(a*.83+phase)*1.1,y=.82+.32*Math.sin(t*.71+phase);
  for(const p of [left,right,body]){p.position[0]=x;p.position[1]=y;p.position[2]=z;p.rotation[1]=-a;}
  const flap=.30+.9*(.5+.5*Math.sin(t*13+phase));left.rotation[2]=-flap;right.rotation[2]=flap;
 }
}
