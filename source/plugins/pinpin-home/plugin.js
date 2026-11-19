// Unreviewed procedural showcase interpretation; creative content is not blanket MIT.
// No DOM/GPU/fetch/registration at definition time. See README.md and provenance.json.
function pinpinHomePieces() {
  const anchor = [-12, 0, 0], prefix = 'pinpin-home/';
  // Reduced verbatim plan records; canonical XY maps to scene X,-Z.
  const plan = {"rooms":[{"id":"common","polygon":[[-4.189406,-0.205859],[-4.225522,-0.595907],[-4.160514,-0.964286],[-4.030498,-1.27488],[-3.748796,-1.585474],[-3.676565,-1.881621],[-3.575441,-2.076645],[-3.394864,-2.278892],[-3.163724,-2.437801],[-2.845907,-2.582263],[-2.477528,-2.697833],[-1.769663,-2.813403],[-0.700642,-2.820626],[-0.693419,-2.90008],[-0.101124,-2.90008],[-0.0939,-2.820626],[1.20626,-2.80618],[1.682986,-2.733949],[2.253612,-2.57504],[2.672552,-2.394462],[2.961477,-2.184992],[2.506421,-2.177769],[2.506421,-0.364767],[3.026485,-0.357544],[3.048154,-0.155297],[3.163724,0.061396],[3.156501,0.090289],[1.928571,0.090289],[1.502408,0.155297],[1.220706,0.263644],[0.953451,0.429775],[0.455056,0.913724],[0.108347,0.7187],[-0.303371,0.610353],[-0.55618,0.60313],[-0.866774,0.653692],[-1.083467,0.733146],[-1.394061,0.913724],[-1.964687,0.545345],[-2.31862,0.444222],[-2.593098,0.408106],[-2.910915,0.408106],[-3.243178,0.458668],[-3.510433,0.538122],[-3.683788,0.458668],[-3.914928,0.27809],[-4.073836,0.06862]]},{"id":"bath","polygon":[[-2.925361,0.632022],[-2.333066,0.660915],[-2.065811,0.733146],[-1.560193,1.065409],[-1.668539,1.238764],[-1.704928,1.327137],[-1.786813,1.361341],[-1.977376,1.825323],[-2.051945,2.223022],[-2.085087,2.83614],[-2.176226,3.175841],[-2.408217,3.556969],[-2.781059,3.880099],[-3.029621,4.00438],[-3.361036,4.087234],[-3.684167,4.095519],[-4.040438,4.045807],[-4.471279,3.921526],[-4.802694,3.772389],[-5.04297,3.614967],[-5.24182,3.424403],[-5.424098,3.126129],[-5.498667,2.844426],[-5.473811,2.479869],[-5.316388,2.098741],[-5.308103,2.546152],[-4.926975,2.554437],[-4.91869,1.982745],[-5.208678,1.949604],[-5.0264,1.767325],[-4.761267,1.576761],[-3.891301,1.162492],[-3.725594,1.054782],[-3.509218,0.981808],[-3.416533,0.906501],[-3.416533,0.725923]]},{"id":"bedroom","polygon":[[0.613965,1.065409],[1.09069,0.60313],[1.379615,0.436998],[1.603531,0.357544],[1.849117,0.314205],[3.510433,0.314205],[3.806581,0.422552],[4.066613,0.632022],[4.211075,0.920947],[4.239968,1.282103],[4.189406,1.57825],[4.095506,1.852729],[3.922151,2.163323],[3.676565,2.437801],[3.423756,2.618379],[3.040931,2.777287],[2.715891,2.842295],[2.398074,2.856742],[2.036918,2.813403],[1.769663,2.733949],[1.524077,2.611156],[1.278491,2.408909],[1.134029,2.221108],[1.032905,2.033307],[0.772873,1.325441]]}],"walls":[{"id":"exterior","path":[[4.153291,2.011637],[4.001605,2.257223],[3.73435,2.538925],[3.50321,2.697833],[3.207063,2.835072],[2.932584,2.914526],[2.600321,2.957865],[2.195827,2.943419],[1.921348,2.885634],[1.711878,2.813403],[1.480738,2.697833],[1.314607,2.582263],[1.11236,2.380016],[0.917335,2.069422],[0.621188,1.347111],[0.498395,1.166533],[0.353933,1.014848],[0.166132,0.877608],[-0.057785,0.776485],[-0.368379,0.7187],[-0.635634,0.725923],[-0.852327,0.769262],[-1.076244,0.863162],[-1.264045,0.993178],[-1.373852,1.107208],[-1.451846,1.188202],[-1.544502,1.351276],[-1.720529,1.618188],[-1.836525,1.966174],[-1.894523,2.289305],[-1.927664,2.877567],[-2.04366,3.275266],[-2.134799,3.449259],[-2.358504,3.747533],[-2.549068,3.921526],[-2.756203,4.062378],[-3.046192,4.194944],[-3.352751,4.269513],[-3.775306,4.286083],[-4.148148,4.236371],[-4.636986,4.087234],[-4.960116,3.929812],[-5.225249,3.739248],[-5.374386,3.590111],[-5.515238,3.399547],[-5.664375,3.05156],[-5.697516,2.695289],[-5.67266,2.496439],[-5.614662,2.305875],[-5.432384,1.97446],[-5.192107,1.709327],[-5.001543,1.56019],[-4.620416,1.336485],[-3.982441,1.054782],[-3.791877,0.922215],[-3.589888,0.920947],[-3.553772,0.769262],[-3.568218,0.689807],[-3.571306,0.685793],[-3.640449,0.595907],[-3.914928,0.436998],[-4.066613,0.306982],[-4.196629,0.140851],[-4.29053,-0.04695],[-4.362761,-0.321429],[-4.369984,-0.574238],[-4.348315,-0.754815],[-4.26886,-1.036517],[-4.124398,-1.339888],[-3.871589,-1.657705],[-3.784912,-1.961075],[-3.698234,-2.127207],[-3.539326,-2.329454],[-3.315409,-2.502809],[-3.069823,-2.632825],[-2.788122,-2.741172],[-2.419743,-2.842295],[-1.914125,-2.928973],[-1.487961,-2.957865],[0.772873,-2.957865],[1.126806,-2.936196],[1.545746,-2.878411],[2.008026,-2.777287],[2.361958,-2.668941],[2.75923,-2.495586],[2.975923,-2.351124],[3.149278,-2.170546],[3.308186,-1.874398],[3.394864,-1.556581],[3.402087,-1.209872],[3.351525,-0.92817],[3.192616,-0.473114],[3.185393,-0.191413],[3.228732,-0.075843],[3.286517,0.003612],[3.430979,0.133628],[3.582665,0.213082],[3.835474,0.299759],[4.052167,0.422552],[4.182183,0.552568],[4.297753,0.754815],[4.369984,1.014848],[4.369984,1.318218],[4.304976,1.636035]],"closed":true,"height":2.65,"thickness":0.25105},{"id":"common-bath-1","path":[[-3.571306,0.685793],[-3.2633,0.575785],[-2.972311,0.527287],[-2.611156,0.520064],[-2.328422,0.555148],[-2.012669,0.643889],[-1.507051,0.968929],[-1.373852,1.107208]],"closed":false,"height":2.65,"thickness":0.20785},{"id":"common-bedroom-1","path":[[0.434924,1.099889],[1.005561,0.532447],[1.25321,0.375602],[1.466808,0.285829],[1.685565,0.230108],[1.946629,0.202247],[3.174559,0.202247],[3.302511,0.156845],[3.385286,0.092504]],"closed":false,"height":2.65,"thickness":0.21669}],"openings":[{"id":"door-bath","wall":"common-bath-1","station":1.848274,"width":0.53105,"height":2.05,"sillZ":0,"kind":"door","shape":"arch"},{"id":"door-bedroom","wall":"common-bedroom-1","station":0.588718,"width":0.52822,"height":2.05,"sillZ":0,"kind":"door","shape":"arch"},{"id":"door-front","wall":"exterior","station":24.290529,"width":0.59952,"height":2.05,"sillZ":0,"kind":"door","shape":"arch"},{"id":"window-bath","wall":"exterior","station":12.102907,"width":0.75203,"height":0.75203,"sillZ":0.92,"kind":"window","shape":"round"},{"id":"window-bedroom","wall":"exterior","station":1.641346,"width":0.78513,"height":0.78513,"sillZ":0.92,"kind":"window","shape":"round"},{"id":"window-front-left","wall":"exterior","station":22.712658,"width":0.7938,"height":0.7938,"sillZ":0.92,"kind":"window","shape":"round"},{"id":"window-front-right","wall":"exterior","station":25.964708,"width":0.83206,"height":0.83206,"sillZ":0.92,"kind":"window","shape":"round"}],"furniture":[{"id":"bookcase","kind":"bookcase","room":"common","centerXY":[-3.871589,-0.588684],"sizeXY":[1.32905,0.27448],"height":1.65,"rotationDegrees":90.0},{"id":"stove","kind":"stove","room":"common","centerXY":[-3.039125,-1.95927],"sizeXY":[0.69973,0.68441],"height":1.0,"rotationDegrees":45.0},{"id":"table","kind":"table","room":"common","centerXY":[-0.303371,-1.09069],"sizeXY":[0.96067,0.9679],"height":0.7,"rotationDegrees":90.0},{"id":"kitchen-counter","kind":"kitchen-counter","room":"common","centerXY":[2.770064,-1.271268],"sizeXY":[1.79856,0.49839],"height":0.88,"rotationDegrees":90.0},{"id":"washstand","kind":"washstand","room":"bath","centerXY":[-5.113396,2.260306],"sizeXY":[0.339701,0.53855],"height":0.78,"rotationDegrees":-0.0},{"id":"bathtub","kind":"bathtub","room":"bath","centerXY":[-3.738022,2.66629],"sizeXY":[1.864212,1.184811],"height":0.48,"rotationDegrees":-0.0},{"id":"bed","kind":"bed","room":"bedroom","centerXY":[2.463082,1.639647],"sizeXY":[1.50241,1.52408],"height":0.65,"rotationDegrees":-0.0},{"id":"stool-1","kind":"stool","room":"common","centerXY":[-0.819823,-0.577849],"sizeXY":[0.25281,0.25281],"height":0.37,"rotationDegrees":90.0},{"id":"stool-2","kind":"stool","room":"common","centerXY":[0.213082,-0.577849],"sizeXY":[0.25281,0.25281],"height":0.37,"rotationDegrees":90.0},{"id":"stool-3","kind":"stool","room":"common","centerXY":[-0.888443,-1.538523],"sizeXY":[0.25281,0.26003],"height":0.37,"rotationDegrees":90.0},{"id":"stool-4","kind":"stool","room":"common","centerXY":[0.263644,-1.538523],"sizeXY":[0.25281,0.25281],"height":0.37,"rotationDegrees":90.0},{"id":"bath-mat","kind":"mat","room":"bath","centerXY":[-3.588022,2.54629],"sizeXY":[2.65,2.6],"height":0.012,"rotationDegrees":-0.0}]};
  const pieces = [];
  // Helpers are private to this invocation; no shared random stream is touched.
  const add = (suffix, color, draw, origin = anchor) => {
    const mesh = new Mesh(); draw(mesh);
    let base = Infinity;
    for (let i = 1; i < mesh.p.length; i += 3) base = Math.min(base, mesh.p[i]);
    for (let i = 1; i < mesh.p.length; i += 3) mesh.p[i] -= base;
    pieces.push({ name: prefix + suffix, asset: null, build: () => mesh.build(),
      position: [origin[0], origin[1] + base, origin[2]], rotation: [0, 0, 0],
      scale: [1, 1, 1], color: color.slice() });
  };
  const box = (m, x, y, z, w, h, d) => {
    m.sweep([[x-w/2,y+h/2,z],[x+w/2,y+h/2,z]], d, h, () => [0,1,0]);
  };
  const orb = (m, x, y, z, rx, ry, rz, detail = 1) => {
    const o = icosphere(detail, (a,b,c) => [x+a*rx,y+b*ry,z+c*rz]);
    const offset = m.p.length/3;
    for(let i=0;i<o.p.length;i+=3) m.v(o.p[i],o.p[i+1],o.p[i+2]);
    for(let i=0;i<o.i.length;i+=3) m.tri(offset+o.i[i],offset+o.i[i+1],offset+o.i[i+2]);
  };
  const tube = (m, points, radius, sides = 8) => m.tube(points, radius, sides);
  const ring = (m, x,y,z,rx,rz,radius) => {
    const p=[];
    for(let i=0;i<=32;i++) { const a=i*Math.PI/16; p.push([x+Math.cos(a)*rx,y,z+Math.sin(a)*rz]); }
    tube(m,p,radius);
  };
  const twoSided = (m,a,b,c) => {
    m.tri(a,b,c);
    const reverse=[c,b,a].map(i=>m.v(m.p[i*3],m.p[i*3+1],m.p[i*3+2]));
    m.tri(...reverse);
  };
  const fern = (m,x,z,s) => {
    for(let j=0;j<5;j++) {
      const a=j*Math.PI*2/5, dx=Math.cos(a),dz=Math.sin(a);
      tube(m,[[x,0,z],[x+dx*.35*s,.45*s,z+dz*.35*s],[x+dx*.65*s,.55*s,z+dz*.65*s]],.018*s,5);
      for(let k=1;k<=4;k++) {
        const r=k*.12*s, y=(.2+k*.07)*s, b=m.v(x+dx*r,y,z+dz*r);
        for(const side of [-1,1]) {
          const c=m.v(x+dx*(r+.18*s)-dz*side*.14*s,y+.05*s,z+dz*(r+.18*s)+dx*side*.14*s);
          const d=m.v(x+dx*(r+.13*s),y+.09*s,z+dz*(r+.13*s));
          twoSided(m,b,c,d);
        }
      }
    }
  };
  // Ear clipping retains the concave room outline and the exterior rear recess.
  const floor = (m, polygon) => {
    let area=0;
    for(let i=0;i<polygon.length;i++) {const a=polygon[i],b=polygon[(i+1)%polygon.length];area+=a[0]*b[1]-b[0]*a[1];}
    const p=area>0 ? polygon.slice() : polygon.slice().reverse();
    const ids=p.map(([x,y])=>m.v(x,.035,-y));
    const work=p.map((_,i)=>i), cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
    while(work.length>3) {
      let found=false;
      for(let i=0;i<work.length;i++) {
        const a=work[(i+work.length-1)%work.length],b=work[i],c=work[(i+1)%work.length];
        if(cross(p[a],p[b],p[c])<=1e-10) continue;
        if(work.some(k=>k!==a&&k!==b&&k!==c&&cross(p[a],p[b],p[k])>=-1e-10&&cross(p[b],p[c],p[k])>=-1e-10&&cross(p[c],p[a],p[k])>=-1e-10)) continue;
        m.tri(ids[a],ids[b],ids[c]);work.splice(i,1);found=true;break;
      }
      if(!found) throw new Error('pinpin-home: invalid floor polygon');
    }
    m.tri(...work.map(i=>ids[i]));
  };
  for(const room of plan.rooms) add('floor-'+room.id,[.48,.33,.19],m=>floor(m,room.polygon));
  // Wall station coordinates stay in the original measured plan. Apertures are
  // faceted approximations of its round windows and arched door, never filled boxes.
  for(const wall of plan.walls) {
    const points=wall.path.concat(wall.closed?[wall.path[0]]:[]);
    const apertures=plan.openings.filter(o=>o.wall===wall.id);
    add('wall-'+wall.id,[.65,.53,.35],m=>{
      let station=0;
      for(let j=0;j<points.length-1;j++) {
        const a=points[j],b=points[j+1],len=Math.hypot(b[0]-a[0],b[1]-a[1]);
        const cuts=[station,station+len];
        for(const o of apertures) for(let k=0;k<=16;k++) {
          const s=o.station-o.width/2+o.width*k/16;
          if(s>station&&s<station+len)cuts.push(s);
        }
        cuts.sort((x,y)=>x-y);
        const pt=(s,y)=>[a[0]+(b[0]-a[0])*(s-station)/len,y,-a[1]-(b[1]-a[1])*(s-station)/len];
        for(let k=0;k<cuts.length-1;k++) {
          const lo=cuts[k],hi=cuts[k+1];if(hi-lo<1e-7)continue;
          const middle=(lo+hi)/2,o=apertures.find(o=>Math.abs(middle-o.station)<o.width/2);
          const bands=o ? (s=>{
            const x=Math.max(-1,Math.min(1,(s-o.station)/(o.width/2)));
            const arc=Math.sqrt(Math.max(0,1-x*x));
            if(o.kind==='window')return [[0,o.sillZ+o.height*(1-arc)/2],[o.sillZ+o.height*(1+arc)/2,wall.height]];
            const top=o.shape==='arch'?o.height-o.width/2+arc*o.width/2:o.height;
            return [[top,wall.height]];
          }) : (()=>[[0,wall.height]]);
          const start=bands(lo),end=bands(hi);
          for(let n=0;n<start.length;n++) {
            const h0=start[n][1]-start[n][0],h1=end[n][1]-end[n][0];
            if(Math.max(h0,h1)<1e-6)continue;
            // Keep elevations vertical. A sweep along a rising band center
            // rotates its cross-section and distorts circular/arched apertures.
            const p0=pt(lo,0),p1=pt(hi,0),dx=p1[0]-p0[0],dz=p1[2]-p0[2];
            const length=Math.hypot(dx,dz),nx=-dz/length*wall.thickness/2,nz=dx/length*wall.thickness/2;
            const corners=[
              [p0[0]+nx,start[n][0],p0[2]+nz],[p0[0]-nx,start[n][0],p0[2]-nz],
              [p0[0]-nx,start[n][1],p0[2]-nz],[p0[0]+nx,start[n][1],p0[2]+nz],
              [p1[0]+nx,end[n][0],p1[2]+nz],[p1[0]-nx,end[n][0],p1[2]-nz],
              [p1[0]-nx,end[n][1],p1[2]-nz],[p1[0]+nx,end[n][1],p1[2]+nz]
            ];
            for(const face of [[0,4,7,3],[1,2,6,5],[3,7,6,2],[0,1,5,4],[0,3,2,1],[4,5,6,7]])
              m.quad(...face.map(i=>m.v(...corners[i])));
          }
        }
        station+=len;
      }
    });
  }
  const stationPoint=(wall,s)=>{
    const p=wall.path.concat(wall.closed?[wall.path[0]]:[]);
    for(let i=0;i<p.length-1;i++) {
      const a=p[i],b=p[i+1],l=Math.hypot(b[0]-a[0],b[1]-a[1]);
      if(s<=l)return {p:[a[0]+(b[0]-a[0])*s/l,0,-a[1]-(b[1]-a[1])*s/l],t:[(b[0]-a[0])/l,0,-(b[1]-a[1])/l]};
      s-=l;
    }
    throw new Error('pinpin-home: opening station out of range');
  };
  for(const o of plan.openings) {
    const wall=plan.walls.find(w=>w.id===o.wall),frame=stationPoint(wall,o.station);
    if(o.kind==='window') add('frame-'+o.id,[.27,.17,.09],m=>{
      const p=[];
      for(let i=0;i<=32;i++){const a=i*Math.PI/16,dx=Math.cos(a)*o.width/2;p.push([frame.p[0]+frame.t[0]*dx,o.sillZ+o.height/2+Math.sin(a)*o.height/2,frame.p[2]+frame.t[2]*dx]);}
      tube(m,p,.04);
      tube(m,[[frame.p[0],o.sillZ,frame.p[2]],[frame.p[0],o.sillZ+o.height,frame.p[2]]],.018);
    });
    if(o.id==='door-front') {
      const hinge=stationPoint(wall,o.station-o.width/2),angle=75*Math.PI/180;
      const dx=hinge.t[0]*Math.cos(angle)-hinge.t[2]*Math.sin(angle),dz=hinge.t[0]*Math.sin(angle)+hinge.t[2]*Math.cos(angle);
      add('green-open-entry',[.19,.36,.22],m=>{
        for(let i=0;i<12;i++) {
          const u=(i+.5)/12*o.width,x=(u-o.width/2)/(o.width/2);
          const h=o.height-o.width/2+Math.sqrt(Math.max(0,1-x*x))*o.width/2;
          m.sweep([[hinge.p[0]+dx*(u-o.width/24),h/2,hinge.p[2]+dz*(u-o.width/24)],
                   [hinge.p[0]+dx*(u+o.width/24),h/2,hinge.p[2]+dz*(u+o.width/24)]],.035,h,()=>[0,1,0]);
        }
      });
    }
  }
  for(const f of plan.furniture) {
    const [x,z]=[f.centerXY[0],-f.centerXY[1]], [w,d]=f.sizeXY;
    add('furniture-'+f.id,f.kind==='mat'?[.47,.43,.27]:[.41,.25,.12],m=>{
      // Rotate rectangular footprints according to the plan's XY angle.
      if(f.kind==='bathtub') {
        ring(m,x,f.height-.06,z,w/2-.06,d/2-.06,.07);
        const p=[];for(let i=0;i<=24;i++){const a=i*Math.PI/12;p.push([x+Math.cos(a)*(w/2-.10),.09,z+Math.sin(a)*(d/2-.10)]);}tube(m,p,.06);
        for(let i=0;i<20;i++){const a=i*Math.PI/10;tube(m,[[x+Math.cos(a)*(w/2-.10),.09,z+Math.sin(a)*(d/2-.10)],[x+Math.cos(a)*(w/2-.06),f.height-.06,z+Math.sin(a)*(d/2-.06)]],.045,5);}
      } else if(['table','stool','mat','stove'].includes(f.kind)) {
        orb(m,x,f.height*.85,z,w/2,f.height*.15,d/2);
        if(f.kind==='table'||f.kind==='stool')tube(m,[[x,0,z],[x,f.height*.8,z]],Math.min(w,d)*.13);
        if(f.kind==='stove')tube(m,[[x,0,z],[x,f.height,z]],w*.38,12);
      } else {
        const angle=-f.rotationDegrees*Math.PI/180;
        m.sweep([[x-Math.cos(angle)*w/2,f.height/2,z+Math.sin(angle)*w/2],
                 [x+Math.cos(angle)*w/2,f.height/2,z-Math.sin(angle)*w/2]],d,f.height,()=>[0,1,0]);
        if(f.kind==='bookcase')for(let i=0;i<4;i++)box(m,x+.17,.22+i*.33,z,.24,.025,1.12);
      }
    });
    if(f.kind==='bed')add('quilt',[.48,.48,.31],m=>orb(m,x,f.height+.08,z,w*.46,.12,d*.45));
  }
  // The two rear moss caps are an authored cutaway roof, NOT canonical geometry.
  add('moss-roof-bath',[.24,.34,.15],m=>orb(m,-3.65,2.82,-2.55,2.05,.40,1.50,2));
  add('moss-roof-bedroom',[.29,.38,.17],m=>orb(m,2.45,2.80,-1.65,1.8,.37,1.3,2));
  add('amber-entry-lantern',[.96,.66,.23],m=>{
    box(m,-.94,1.44,3.04,.16,.22,.16);tube(m,[[-.94,1.67,3.04],[-.94,1.80,2.94]],.025);
  });
  // Forest is authored, with a continuous 1.8m path kept free of trunks.
  const route=[[-12.4,3.0],[-12.4,6],[-8,8.8],[3.8,8.8],[7,8.8],[7,2.5],[9,-1],[11,-5],[14,-7]];
  // Irregular shoulders keep the full central 1.8m ribbon available. Low
  // polygon counts and grouped materials matter more here than dense meshes.
  for(let i=0;i<route.length-1;i++)add('path-'+i,[.43,.33,.21],m=>{
    if(i===4){
      // Authored earth approaches meet the measured GLB deck at y=.804.
      for(const [z0,z1] of [[8.8,7.75],[2.5,3.48]]) {
        const ids=[[5.98,.035,z0],[8.02,.035,z0],[8.02,.804,z1],[5.98,.804,z1]].map(p=>m.v(...p));
        m.quad(...(z1>z0?ids.slice().reverse():ids));
      }
      return;
    }
    const [a,b]=[route[i],route[i+1]],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz),n=[-dz/len,dx/len];
    const rows=[];
    for(let k=0;k<=8;k++) {
      const t=k/8,x=a[0]+dx*t,z=a[1]+dz*t;
      const widths=[.91+.14*(.5+.5*Math.sin(k*2.7+i*1.8)),.91+.13*(.5+.5*Math.cos(k*2.2+i))];
      rows.push([-1,1].map((side,j)=>m.v(x+n[0]*widths[j]*side,.032+.006*Math.sin(k*1.3+i),z+n[1]*widths[j]*side)));
    }
    for(let k=0;k<8;k++)m.quad(rows[k][0],rows[k+1][0],rows[k+1][1],rows[k][1]);
  },[0,0,0]);
  // Rounded joints close the wedges left by adjoining path strips.
  route.forEach(([x,z],i)=>add('path-joint-'+i,[.47,.37,.24],m=>{
    const c=m.v(x,.052,z),top=[],bottom=[];
    for(let k=0;k<24;k++){const a=k*Math.PI/12;
      top.push(m.v(x+.9*Math.cos(a),.052,z+.9*Math.sin(a)));
      bottom.push(m.v(x+.9*Math.cos(a),0,z+.9*Math.sin(a)));}
    for(let k=0;k<24;k++){const j=(k+1)%24;m.tri(c,top[j],top[k]);m.quad(bottom[k],top[k],top[j],bottom[j]);}
  },[0,0,0]));
  const trees=[[-22,-5,7],[-21,3,6],[-20,8,7.5],[-16,10,6],[-9,-7,7],[-6,-4,6],[-5,11,7],[-1,-2,6.5],[2,7,7],[6,3,6],[7,-9,7],[11,1,6.5],[16,-2,7]];
  trees.forEach(([x,z,h],i)=>{
    add('trunk-'+i,[.25,.17,.105],m=>{
      tube(m,[[x,0,z],[x+.12,h*.45,z-.10],[x-.18,h,z+.12]],k=>.36-k*.085,9);
      for(let j=0;j<4;j++){const a=j*Math.PI/2+i;tube(m,[[x,0,z],[x+Math.cos(a)*.8,.03,z+Math.sin(a)*.8]],k=>.20-k*.16,7);}
    },[0,0,0]);
    add('canopy-'+i,[.18+(i%3)*.025,.29+(i%4)*.02,.12],m=>{
      orb(m,x,h-.2,z,1.7,1.6,1.6);orb(m,x+.8,h-.8,z-.6,1.2,1.1,1.3);
    },[0,0,0]);
  });
  // A local integer hash provides repeatable variation without advancing rseed.
  const noise=k=>{let n=Math.imul(k+117,374761393);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;};
  const routeDistance=(x,z)=>Math.min(...route.slice(1).map((b,i)=>{
    const a=route[i],dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz)));
    return Math.hypot(x-a[0]-t*dx,z-a[1]-t*dz);
  }));
  const edgeSites=[];
  for(let i=1;i<route.length-1;i++) {
    const a=route[i],b=route[i+1],dx=b[0]-a[0],dz=b[1]-a[1],l=Math.hypot(dx,dz);
    for(let k=0;k<7;k++)for(const side of [-1,1]) {
      const seed=i*71+k*7+(side+1),t=(k+.25+noise(seed)*.5)/7;
      const setback=1.16+noise(seed+1)*.65;
      const x=a[0]+dx*t-dz/l*side*setback,z=a[1]+dz*t+dx/l*side*setback;
      // At bends a shoulder can face the neighboring segment: reject it too.
      if(routeDistance(x,z)>1.18&&!(x>-3&&x<18&&Math.abs(z-5.6)<2.05))edgeSites.push([x,z,seed]);
    }
  }
  const leaf=(m,x,y,z,a,s)=>{
    const dx=Math.cos(a),dz=Math.sin(a),base=m.v(x,y,z),tip=m.v(x+dx*s*.55,y+s,z+dz*s*.55);
    const left=m.v(x+dx*s*.25-dz*s*.16,y+s*.42,z+dz*s*.25+dx*s*.16);
    const right=m.v(x+dx*s*.25+dz*s*.16,y+s*.42,z+dz*s*.25-dx*s*.16);
    twoSided(m,base,left,tip);twoSided(m,base,tip,right);
  };
  for(let shade=0;shade<3;shade++)add('understory-leaves-'+shade,[[.18,.30,.11],[.26,.38,.14],[.34,.42,.18]][shade],m=>{
    edgeSites.forEach(([x,z,seed],i)=>{if(i%3!==shade)return;
      for(let k=0;k<7;k++)leaf(m,x+(noise(seed+k)-.5)*.28,.015,z+(noise(seed+k+20)-.5)*.28,k*2.4+seed,.18+noise(seed+k+40)*.32);
    });
  },[0,0,0]);
  add('woodland-ferns',[.22,.37,.15],m=>{
    edgeSites.forEach(([x,z,seed],i)=>{if(i%9===3)fern(m,x,z,.48+noise(seed)*.3);});
  },[0,0,0]);
  add('shoulder-stones',[.40,.40,.31],m=>{
    edgeSites.forEach(([x,z,seed],i)=>{if(i%3===0)orb(m,x,.065,z,.12+noise(seed)*.16,.07+noise(seed+4)*.08,.10+noise(seed+3)*.13,0);});
  },[0,0,0]);
  add('forest-flower-stems',[.24,.34,.12],m=>{
    edgeSites.forEach(([x,z,seed],i)=>{if(i%4===1)for(let k=0;k<3;k++)tube(m,[[x+k*.09,0,z],[x+k*.09,.26+noise(seed+k)*.18,z+.04]],.009,4);});
  },[0,0,0]);
  for(let shade=0;shade<2;shade++)add('forest-flowers-'+shade,shade?[.73,.59,.34]:[.72,.69,.49],m=>{
    edgeSites.forEach(([x,z,seed],i)=>{if(i%4!==1||Math.floor(i/4)%2!==shade)return;
      for(let k=0;k<3;k++){const y=.26+noise(seed+k)*.18;for(let j=0;j<5;j++){const a=j*Math.PI*2/5;orb(m,x+k*.09+Math.cos(a)*.037,y,z+.04+Math.sin(a)*.037,.035,.018,.035,0);}}
    });
  },[0,0,0]);
  add('mushroom-stems',[.67,.58,.39],m=>{
    for(const [x,z,seed] of edgeSites.filter((_,i)=>i%11===0))for(let k=0;k<3;k++)tube(m,[[x+k*.11,0,z],[x+k*.11,.12+noise(seed+k)*.10,z]],.022,5);
  },[0,0,0]);
  add('mushroom-caps',[.57,.28,.14],m=>{
    for(const [x,z,seed] of edgeSites.filter((_,i)=>i%11===0))for(let k=0;k<3;k++)orb(m,x+k*.11,.13+noise(seed+k)*.10,z,.075,.035,.075,0);
  },[0,0,0]);
  add('entry-terracotta',[.48,.28,.15],m=>{
    for(const [x,z] of [[-1.48,3.30],[.64,3.32]]){tube(m,[[x,.02,z],[x,.29,z]],k=>.12+k*.05,10);ring(m,x,.29,z,.18,.18,.025);}
  });
  add('entry-herbs',[.30,.43,.17],m=>{
    for(const [x,z] of [[-1.48,3.30],[.64,3.32]])for(let k=0;k<9;k++)leaf(m,x,.28,z,k*2.4,.27+(k%3)*.05);
  });
  // Fine buttress roots and broken bark silhouettes bind trees to the floor.
  add('root-fingers',[.29,.20,.12],m=>{
    trees.forEach(([x,z],i)=>{for(let k=0;k<5;k++){const a=k*1.256+i*.7,r=.75+noise(i*9+k)*.35;
      if([.20,.57,r].some(d=>routeDistance(x+Math.cos(a)*d,z+Math.sin(a)*d)<.85))continue;
      tube(m,[[x+Math.cos(a)*.20,.24,z+Math.sin(a)*.20],[x+Math.cos(a)*.57,.08,z+Math.sin(a)*.57],[x+Math.cos(a)*r,.015,z+Math.sin(a)*r]],t=>.09-t*.038,5);
    }});
  },[0,0,0]);
  // Woodland enclosure: planted islands have a visible footprint, middle-height
  // foliage and slender layered crowns, rather than isolated miniature props.
  const islands=[[-21,-7,1.65],[-17.7,-7,1.45],[-14.3,-6.7,1.35],[-10.5,-6.3,1.3],
    [-7,-5.4,1.35],[-20.3,-2.8,1.5],[-20.4,1.5,1.7],[-19.7,5.7,1.6],
    [-17.2,7.6,1.35],[-8.7,3.8,1.25],[-5.3,-1,1.45],[-4,2,1.25],
    [-3.8,11.7,1.35],[1.4,11.6,1.2],[10.6,9.5,1.5],[12.7,1.8,1.35],[16.5,-3.8,1.3]];
  const crown=(m,x,y,z,r,h,seed)=>{
    const top=m.v(x+.12*r,y+h,z-.08*r),bottom=m.v(x,y-h*.23,z),rim=[];
    for(let k=0;k<9;k++){const a=k*Math.PI*2/9,q=r*(.8+.2*noise(seed+k));rim.push(m.v(x+Math.cos(a)*q,y+(.12*noise(seed+k+21)-.06)*h,z+Math.sin(a)*q));}
    for(let k=0;k<9;k++){m.tri(top,rim[(k+1)%9],rim[k]);m.tri(bottom,rim[k],rim[(k+1)%9]);}
  };
  for(let shade=0;shade<3;shade++)add('planted-ground-'+shade,[[.24,.31,.13],[.30,.36,.17],[.36,.39,.19]][shade],m=>{
    islands.forEach(([x,z,r],i)=>{if(i%3!==shade)return;const c=m.v(x,.017,z),rim=[];
      for(let k=0;k<13;k++){const a=k*Math.PI*2/13,q=r*(.85+.15*noise(i*17+k));rim.push(m.v(x+Math.cos(a)*q,.016,z+Math.sin(a)*q));}
      for(let k=0;k<13;k++)m.tri(c,rim[(k+1)%13],rim[k]);
    });
  },[0,0,0]);
  for(let shade=0;shade<3;shade++)add('island-shrubs-'+shade,[[.17,.29,.105],[.25,.36,.13],[.34,.43,.19]][shade],m=>{
    islands.forEach(([x,z,r],i)=>{
      for(let j=0;j<9;j++){if(j%3!==shade)continue;const a=j*2.4+i,q=r*(.20+.60*noise(i*13+j)),px=x+Math.cos(a)*q,pz=z+Math.sin(a)*q;
        if(routeDistance(px,pz)<1.7)continue;
        const height=.55+noise(i*41+j)*.65;
        for(let k=0;k<9;k++)leaf(m,px,.02,pz,k*2.4+j,height*(.7+.3*noise(k+j*4)));
        crown(m,px,.30,pz,.40,height*.35,i*10+j);
      }
    });
  },[0,0,0]);
  const saplings=[[-22.3,-8.5,8.5],[-20,-9.1,7.8],[-16.8,-9,8.7],[-13.7,-8.8,7.7],[-10.4,-8.7,8.5],[-7,-8,7.5],
    [-22.3,-4,7.6],[-22.3,.2,8.3],[-22.3,5,7.5],[-20.9,9.5,7.7],[-17.6,11,7.4],
    [-5.1,-6.8,7.7],[-3.6,-4.9,7.3],[-3.4,-.6,6.5],[-1.8,11.3,7.5],[3.4,11.3,7.8],[13,10.5,7.4],[17.6,1.3,7.9]];
  // Keep each tree's trunk/crown pair independently fadeable by the existing
  // renderer; a whole forest batch would hide unrelated distant trees.
  saplings.forEach(([x,z,h],i)=>{
    add('trunk-'+(100+i),[.28,.22,.13],m=>{
      tube(m,[[x,0,z],[x+.13,h*.48,z-.12],[x-.18,h*.92,z+.14]],k=>.19-k*.052,7);
      for(let k=0;k<3;k++){const a=k*2.1+i;const bx=x+Math.cos(a)*.85,bz=z+Math.sin(a)*.85;
        tube(m,[[x,h*.51,z],[bx,h*.68,bz],[bx+Math.cos(a)*.25,h*.77,bz+Math.sin(a)*.25]],t=>.075-t*.026,5);
      }
    },[0,0,0]);
    add('canopy-'+(100+i),[[.18,.28,.12],[.24,.34,.14],[.32,.39,.18]][i%3],m=>{
      for(let k=0;k<6;k++){const a=k*2.4+i,r=1.12+noise(i*11+k)*.52;
        crown(m,x+Math.cos(a)*.78,h*(.64+k*.048),z+Math.sin(a)*.78,r,.65+noise(k+i)*.40,i*17+k);
      }
    },[0,0,0]);
  });
  for(let i=0;i<6;i++)add('path-amber-marker-'+i,[.92,.68,.28],m=>{
    orb(m,0,.28,0,.055,.08,.055,0);
  },[route[i+1][0]+.95,0,route[i+1][1]+.72]);
  return pieces;
}
