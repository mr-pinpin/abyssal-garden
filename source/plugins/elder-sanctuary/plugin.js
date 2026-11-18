// Unreviewed procedural showcase interpretation; creative content is not blanket MIT.
// No DOM/GPU/fetch/registration at definition time. See README.md and provenance.json.
function pinpinElderPieces() {
  const anchor = [14, 0, -16], prefix = 'elder-sanctuary/';
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
  // Ground-level cutaway of the underground chamber: all dimensions are authored.
  add('broad-stone-floor',[.36,.37,.31],m=>{
    const top=m.v(0,.06,0),bottom=m.v(0,0,0),a=[],b=[];
    for(let i=0;i<48;i++){const t=i*Math.PI/24,x=Math.cos(t)*5.8,z=Math.sin(t)*5.3;a.push(m.v(x,.06,z));b.push(m.v(x,0,z));}
    for(let i=0;i<48;i++){const j=(i+1)%48;m.tri(top,a[j],a[i]);m.tri(bottom,b[i],b[j]);m.quad(b[i],a[i],a[j],b[j]);}
  });
  // Rear/side rocks leave the south approach open; no solid perimeter barrier.
  for(let i=0;i<7;i++) {
    const x=-4.8+i*1.6,z=-4.25+.055*x*x;
    add('rear-cave-rock-'+i,[.29+(i%2)*.035,.31,.27],m=>orb(m,x,2.2,z,1.05,2.2,.58,2));
  }
  for(const side of [-1,1])for(let i=0;i<3;i++)add('side-rock-'+side+'-'+i,[.30,.32,.27],m=>orb(m,side*5.15,1.6,-2.1+i*1.6,.55,1.6,.9));
  for(let j=0;j<3;j++)add('vault-root-'+j,[.33,.24,.15],m=>{
    const p=[];
    for(let k=0;k<=20;k++){const a=k*Math.PI/20;p.push([-5*Math.cos(a),.3+5*Math.sin(a),-2.8+j*2.4]);}
    tube(m,p,k=>.28+.08*Math.sin(k*.7+j),10);
    for(const side of [-1,1])tube(m,[[side*5,.24,-2.8+j*2.4],[side*5.6,.12,-2.2+j*2.4],[side*6,.05,-1.8+j*2.4]],k=>.22-k*.085,7);
  });
  // The root passage is a sequence of arches, never filled disks.
  for(let i=0;i<4;i++)add('passage-root-'+i,[.48,.42,.29],m=>{
    const p=[];for(let j=0;j<=16;j++){const a=j*Math.PI/16;p.push([-1.55*Math.cos(a),.12+2.1*Math.sin(a),4.8+i*1.15]);}
    tube(m,p,.15,9);
  });
  add('passage-earth-path',[.40,.32,.23],m=>m.sweep([[0,.035,4.3],[0,.035,8.8]],2.3,.07,()=>[0,1,0]));
  add('pale-wayfinding-stone',[.66,.65,.51],m=>orb(m,1.15,.32,6.2,.36,.32,.43));
  add('rolled-woven-mat',[.57,.43,.24],m=>{
    box(m,-2.2,.02,5.9,1.25,.035,.75);tube(m,[[-2.78,.13,6.25],[-1.62,.13,6.25]],.13,12);
    for(let i=0;i<9;i++)tube(m,[[-2.73+i*.13,.065,5.55],[-2.73+i*.13,.065,6.17]],.012,5);
  });
  add('moved-little-stool',[.38,.24,.13],m=>{
    box(m,-3.25,.55,5.55,.55,.10,.48);
    for(const x of [-3.43,-3.07])for(const z of [5.40,5.70])box(m,x,.01,z,.065,.54,.065);
  });
  add('sunny-rest-rock',[.39,.43,.28],m=>orb(m,3.5,.38,5.2,.9,.38,.7));
  add('entrance-flat-stone',[.49,.48,.39],m=>orb(m,1,.13,8.5,.52,.13,.48));
  add('fern-by-resting-place',[.25,.43,.18],m=>fern(m,3.6,5.95,.8));
  add('elder-reading-desk',[.34,.22,.12],m=>{
    box(m,-3,.75,2.9,1.3,.12,.75);
    for(const x of [-3.52,-2.48])for(const z of [2.64,3.16])box(m,x,.02,z,.08,.73,.08);
    box(m,-3,.87,2.9,.64,.055,.44);
  });
  add('open-book-pages',[.78,.70,.50],m=>{
    m.sweep([[-3.30,.95,2.90],[-3,.91,2.9],[-2.7,.95,2.9]],.40,.025,()=>[0,1,0]);
    for(let i=0;i<4;i++)box(m,-3.16,.963,2.76+i*.085,.17,.005,.009);
  });
  // New geometric relief studies, not copies of approved sacred illustrations.
  const panels=[[-4.2,-2.93],[-1.4,-3.63],[1.4,-3.63],[4.2,-2.93]];
  panels.forEach(([x,z],i)=>{
    add('mural-stone-'+i,[.48,.43,.31],m=>box(m,x,.55,z,2.35,2.75,.14));
    add('fixed-lamp-bracket-'+i,[.24,.20,.14],m=>{
      box(m,x,3.35,z+.13,.25,.08,.30);tube(m,[[x,3.35,z+.22],[x,3.65,z+.22]],.025);
    });
    add('fixed-wall-lamp-'+i,[.94,.66,.28],m=>orb(m,x,3.57,z+.23,.09,.16,.08));
  });
  // Mother of Life: long dress, expectant belly, baby in cradle, growing shoots.
  {
    const [x,z]=panels[0];
    add('mother-of-life-relief',[.71,.44,.25],m=>{
      orb(m,x-.3,2.60,z+.13,.17,.19,.055);
      const a=m.v(x-.3,2.40,z+.19),b=m.v(x-.84,1.12,z+.19),c=m.v(x+.18,1.12,z+.19);twoSided(m,a,b,c);
      orb(m,x-.20,1.95,z+.22,.25,.31,.08);
      tube(m,[[x-.4,2.28,z+.22],[x-.6,2.05,z+.23],[x-.3,1.90,z+.26]],.05);
      tube(m,[[x-.17,2.29,z+.22],[x+.08,2.13,z+.23],[x-.08,1.90,z+.26]],.05);
    });
    add('cradle-and-baby-relief',[.76,.62,.34],m=>{
      box(m,x+.55,1.23,z+.14,.63,.10,.08);
      tube(m,[[x+.25,1.24,z+.18],[x+.35,1.12,z+.18],[x+.78,1.12,z+.18],[x+.88,1.24,z+.18]],.035);
      orb(m,x+.45,1.40,z+.20,.09,.10,.04);orb(m,x+.63,1.34,z+.20,.18,.09,.035);
    });
    add('growing-shoots-relief',[.37,.53,.25],m=>{
      for(let i=0;i<4;i++){const u=x+.15+i*.22;tube(m,[[u,.78,z+.17],[u,1.05,z+.17],[u+.07,1.15,z+.17]],.016,5);orb(m,u-.05,.93,z+.19,.10,.035,.02,0);}
    });
  }
  // Shield Keeper separates little homes/families from the storm.
  {
    const [x,z]=panels[1];
    add('shield-keeper-relief',[.64,.53,.30],m=>{
      orb(m,x,2.67,z+.14,.15,.18,.05);box(m,x-.17,1.62,z+.17,.34,.83,.08);
      for(const side of [-1,1])tube(m,[[x-.15,1.69,z+.19],[x+side*.27,1.17,z+.19]],.065);
      orb(m,x+.30,2.10,z+.24,.34,.48,.07,2);tube(m,[[x-.15,2.35,z+.19],[x+.30,2.15,z+.26]],.065);
    });
    add('protected-homes-relief',[.67,.43,.25],m=>{
      for(let i=0;i<2;i++){const u=x-.93+i*.35;box(m,u,1.26,z+.18,.24,.30,.06);
        const a=m.v(u-.17,1.56,z+.23),b=m.v(u+.17,1.56,z+.23),c=m.v(u,1.75,z+.23);twoSided(m,a,b,c);}
    });
    add('storm-beyond-shield',[.27,.32,.37],m=>{
      for(let i=0;i<3;i++)tube(m,[[x+.64,2.7-i*.4,z+.20],[x+.90,2.8-i*.4,z+.20],[x+.81,2.61-i*.4,z+.20]],.025,5);
    });
  }
  // Sunlight/living tree and a cold storm; peaceful night is not the threat.
  {
    const [x,z]=panels[2];
    add('sunlight-relief',[.86,.64,.26],m=>{
      orb(m,x-.58,2.63,z+.17,.21,.21,.045);
      for(let i=0;i<10;i++){const a=i*Math.PI/5;tube(m,[[x-.58+Math.cos(a)*.28,2.63+Math.sin(a)*.28,z+.20],[x-.58+Math.cos(a)*.37,2.63+Math.sin(a)*.37,z+.20]],.014,5);}
    });
    add('living-tree-relief',[.33,.48,.23],m=>{
      tube(m,[[x-.18,1.15,z+.20],[x-.18,1.88,z+.20],[x-.36,2.12,z+.20]],.065);orb(m,x-.20,2.10,z+.20,.39,.37,.05);
    });
    add('cold-storm-relief',[.26,.32,.39],m=>{
      for(let i=0;i<4;i++)orb(m,x+.55+i*.11,2.60+(i%2)*.09,z+.19,.20,.13,.04);
      for(let i=0;i<4;i++)tube(m,[[x+.43+i*.13,2.4,z+.20],[x+.34+i*.13,1.85,z+.20]],.018,5);
    });
    add('little-home-between',[.72,.48,.28],m=>box(m,x+.14,1.1,z+.20,.35,.40,.07));
  }
  // Shared-work animals: carrying timber, food and a baby.
  {
    const [x,z]=panels[3];
    add('helpers-relief',[.67,.48,.29],m=>{
      for(let i=0;i<3;i++){
        const u=x-.72+i*.70;orb(m,u,2.30,z+.17,.17,.18,.05);
        orb(m,u-.10,2.48,z+.18,.06,.09,.035,0);orb(m,u+.10,2.48,z+.18,.06,.09,.035,0);
        orb(m,u,1.88,z+.19,.19,.30,.045);
        for(const side of [-1,1])tube(m,[[u+side*.09,1.65,z+.18],[u+side*.18,1.24,z+.18]],.04,6);
      }
      for(let i=0;i<3;i++)box(m,x-.70,2.0+i*.07,z+.25,.50,.05,.05);
      orb(m,x,2.02,z+.25,.20,.13,.05);orb(m,x+.65,2.03,z+.27,.08,.09,.04);orb(m,x+.80,1.92,z+.27,.16,.08,.035);
    });
  }
  add('stone-offering-ledge',[.42,.40,.31],m=>box(m,-4.18,.33,-2.45,1.10,.18,.48));
  add('seed-bowl',[.55,.35,.18],m=>{
    ring(m,-4.18,.61,-2.43,.24,.19,.04);orb(m,-4.18,.55,-2.43,.23,.04,.18);
  });
  add('real-seeds',[.79,.64,.33],m=>{
    for(let i=0;i<9;i++){const a=i*2.39996,r=.04+Math.sqrt(i)*.035;orb(m,-4.18+Math.cos(a)*r,.61,-2.43+Math.sin(a)*r,.025,.025,.015,0);}
  });
  return pieces;
}
