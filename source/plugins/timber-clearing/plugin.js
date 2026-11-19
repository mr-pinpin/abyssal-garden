// Unreviewed authored scene staging following timber-tractor.json. See README.md.
function pinpinClearingPieces() {
  const piece=(name,asset,position,scale=1,rotation=0,color=[.45,.33,.21])=>({
    name:'timber-clearing/'+name,asset,position,rotation:[0,rotation,0],scale:[scale,scale,scale],color,
    // Explicit visible proxy if an asset cannot load; the UI reports the fallback.
    build:()=>icosphere(1,(x,y,z)=>[x*.65,(y+1)*.45,z*.40]).build()
  });
  const result=[
    piece('young-lookout','pinpin',[4.3,.03,11.2],1,Math.PI),
    piece('beaver-in-blue-vest','beaver',[2.2,.03,11.7],1,0),
    piece('parked-red-tractor','timber-tractor',[.5,.03,9.3],1.4,-.10),
    piece('small-paw-crossing','footbridge',[7,.02,5.6],1.6,0),
    piece('windfallen-wood','windfallen-tree',[12.6,.02,5.6],1.2,0)
  ];
  const add=(name,color,draw)=>{
    const m=new Mesh();draw(m);let bottom=Infinity;
    for(let i=1;i<m.p.length;i+=3)bottom=Math.min(bottom,m.p[i]);
    for(let i=1;i<m.p.length;i+=3)m.p[i]-=bottom;
    result.push({name:'timber-clearing/'+name,asset:null,position:[0,bottom,0],rotation:[0,0,0],scale:[1,1,1],color,build:()=>m.build()});
  };
  add('stream-continuation',[.20,.46,.47],m=>m.sweep([[-3,.005,5.6],[18,.005,5.6]],2.7,.015,()=>[0,1,0]));
  for(const z of [3.95,7.25])add('fern-bank-'+z,[.29,.39,.16],m=>m.sweep([[-3,.04,z],[18,.04,z]],.60,.10,()=>[0,1,0]));
  add('clearing-path',[.46,.36,.23],m=>m.sweep([[7,.025,8.8],[4,.025,8.8],[1,.025,11.5]],1.8,.05,()=>[0,1,0]));
  for(let i=0;i<8;i++)add('bank-grass-'+i,[.31,.44,.17],m=>{
    const x=-2+i*2.7,z=i%2?3.65:7.6;
    for(let j=0;j<5;j++){const a=j*Math.PI*2/5;m.tube([[x,0,z],[x+Math.cos(a)*.17,.32+(j%2)*.10,z+Math.sin(a)*.17]],k=>k?.008:.035,4);}
  });
  return result;
}
