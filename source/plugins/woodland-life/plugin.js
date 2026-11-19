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
