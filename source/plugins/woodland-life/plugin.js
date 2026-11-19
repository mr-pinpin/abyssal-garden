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
