import fs from 'node:fs';import zlib from 'node:zlib';import crypto from 'node:crypto';import path from 'node:path';import {fileURLToPath} from 'node:url';
const signature=Buffer.from([137,80,78,71,13,10,26,10]);
export function decodePNG(bytes){
 if(!Buffer.isBuffer(bytes))bytes=Buffer.from(bytes);if(!bytes.subarray(0,8).equals(signature))throw Error('Invalid PNG signature');
 let width,height,channels,ended=false;const parts=[];let seen=false;
 for(let at=8;at<bytes.length;){if(at+12>bytes.length)throw Error('Truncated PNG chunk');const size=bytes.readUInt32BE(at),type=bytes.toString('ascii',at+4,at+8);if(size>bytes.length-at-12)throw Error('Truncated PNG payload');const chunk=bytes.subarray(at+8,at+8+size);at+=size+12;
  if(type==='IHDR'){if(seen||size!==13)throw Error('Invalid PNG IHDR');seen=true;width=chunk.readUInt32BE(0);height=chunk.readUInt32BE(4);if(!width||!height||width*height>20e6)throw Error('PNG dimensions exceed limit');if(chunk[8]!==8||![2,6].includes(chunk[9])||chunk[10]||chunk[11]||chunk[12])throw Error('Only noninterlaced RGB/RGBA8 PNG supported');channels=chunk[9]===2?3:4;}
  else if(type==='IDAT'){if(!seen)throw Error('PNG missing IHDR');parts.push(chunk);}else if(type==='IEND'){ended=true;break;}
 }
 if(!ended||!parts.length)throw Error('Incomplete PNG');const stride=width*channels,expected=height*(stride+1);let raw;try{raw=zlib.inflateSync(Buffer.concat(parts),{maxOutputLength:expected});}catch{throw Error('Invalid PNG compressed data');}if(raw.length!==expected)throw Error('Invalid PNG scanline length');const pixels=Buffer.alloc(width*height*channels);
 const paeth=(a,b,c)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;};
 for(let y=0;y<height;y++){const filter=raw[y*(stride+1)];if(filter>4)throw Error('Invalid PNG filter');for(let x=0;x<stride;x++){const i=y*stride+x,a=x>=channels?pixels[i-channels]:0,b=y?pixels[i-stride]:0,c=y&&x>=channels?pixels[i-stride-channels]:0;pixels[i]=(raw[y*(stride+1)+1+x]+[0,a,b,Math.floor((a+b)/2),paeth(a,b,c)][filter])&255;}}
 return {width,height,channels,pixels};
}
function pixel(image,x,y){const i=(y*image.width+x)*image.channels;return [...image.pixels.subarray(i,i+3),image.channels===4?image.pixels[i+3]:255];}
export function canonClass([r,g,b,a]){if(a<128)return null;if(r>150&&r>g*1.6&&r>b*1.6)return 'water';if(g>120&&g>r*1.6&&g>b*1.4)return 'protected';if(r>70&&b>120&&b>g*1.6)return 'protected';if(g>130&&b>130&&r<100)return 'protected';return null;}
export function placementClass([r,g,b,a]){if(a<200)return 'excluded';if(b>110&&b>r*1.3&&b>g*1.15)return 'water';if(g>65&&g>r*1.15&&g>b*1.1)return 'foliage';if(r>120&&r>g*1.5&&r>b*1.5)return 'path';return 'excluded';}
function eachCellPixel(image,gx,gy,n,fn){const x0=Math.floor(gx*image.width/n),x1=Math.max(x0+1,Math.ceil((gx+1)*image.width/n)),y0=Math.floor(gy*image.height/n),y1=Math.max(y0+1,Math.ceil((gy+1)*image.height/n));for(let y=y0;y<Math.min(y1,image.height);y++)for(let x=x0;x<Math.min(x1,image.width);x++)fn(pixel(image,x,y));}
export function compileFields(height,placement,canon,{size=96,seed=731,margin=2}={}){
 if(!Number.isInteger(size)||size<8||size>256||!Number.isInteger(margin)||margin<1||margin>8||!Number.isInteger(seed))throw Error('Invalid grid options');
 for(const image of [height,placement,canon])if(!image||!Number.isInteger(image.width)||!Number.isInteger(image.height)||image.width<1||image.height<1||image.width*image.height>20e6||!image.pixels||![3,4].includes(image.channels)||image.pixels.length!==image.width*image.height*image.channels)throw Error('Invalid decoded image');
 const classes=[],heights=[];let nongray=0,total=0;
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  let protect=false,water=false,path=false,foliage=0,count=0,sum=0;
  eachCellPixel(canon,x,y,size,c=>{const k=canonClass(c);protect||=k==='protected';water||=k==='water';});
  eachCellPixel(placement,x,y,size,c=>{const k=placementClass(c);water||=k==='water';path||=k==='path';foliage+=k==='foliage'?1:0;count++;});
  eachCellPixel(height,x,y,size,c=>{nongray+=Math.max(...c.slice(0,3))-Math.min(...c.slice(0,3))>16?1:0;total++;sum+=(c[0]+c[1]+c[2])/765;});
  let samples=0;eachCellPixel(height,x,y,size,()=>samples++);
  classes.push(protect?'protected':water?'water':path?'path':foliage===count?'foliage':'excluded');heights.push(Math.round(sum/samples*10000)/10000);
 }
 if(nongray/total>.05)throw Error('Height guide must be artist-estimated grayscale, not photograph luminance');
 for(let i=0;i<classes.length;i++)if(classes[i]==='water')heights[i]=.12;
 const clearance=classes.map((k,i)=>{const x=i%size,y=Math.floor(i/size);if(k!=='foliage'||x<margin||y<margin||x>=size-margin||y>=size-margin)return false;for(let dy=-margin;dy<=margin;dy++)for(let dx=-margin;dx<=margin;dx++)if(classes[(y+dy)*size+x+dx]!=='foliage')return false;return true;});
 let state=seed>>>0;const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};const points=[];
 for(let i=0;i<clearance.length;i++)if(clearance[i]&&random()<.32)points.push({u:((i%size)+.3+random()*.4)/size,v:(Math.floor(i/size)+.3+random()*.4)/size,height:heights[i],cell:i});
 const seen=new Set(),components=[];for(let i=0;i<classes.length;i++)if(classes[i]==='water'&&!seen.has(i)){const queue=[i];seen.add(i);for(let n=0;n<queue.length;n++){const at=queue[n],x=at%size,y=Math.floor(at/size);for(const [xx,yy]of [[x-1,y],[x+1,y],[x,y-1],[x,y+1]]){const next=yy*size+xx;if(xx>=0&&yy>=0&&xx<size&&yy<size&&classes[next]==='water'&&!seen.has(next)){seen.add(next);queue.push(next);}}}components.push(queue.length);}
 return {schema:1,coordinates:'normalized image u right, v down; NO world registration',heightUnits:'artist-estimated normalized guide units; not metric or surveyed elevation',waterLevel:.12,grid:{width:size,height:size,classes,heights,clearance},seed,marginCells:margin,points,diagnostics:{blueWaterComponents:components.sort((a,b)=>b-a),meaning:'4-neighbor image-space blue/canon-lake connectivity candidate only; no surveyed stream or route claim'},limitations:['Generated guides are unreviewed interpretations, not canon terrain.','Canon mask supersedes generated holes; normalized bounds alignment is not world registration.','No game geometry or world collision is produced.']};
}
export function compileFiles(heightPath,placementPath,canonPath,output,options={}){const inputs=[heightPath,placementPath,canonPath].map(file=>{const bytes=fs.readFileSync(file);return {image:decodePNG(bytes),sha256:crypto.createHash('sha256').update(bytes).digest('hex'),file:path.basename(file)};});const fields=compileFields(...inputs.map(i=>i.image),options);fields.inputs=inputs.map(({sha256,file,image})=>({file,sha256,width:image.width,height:image.height}));fs.writeFileSync(output,JSON.stringify(fields)+'\n');return fields;}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){const [height,placement,canon,out]=process.argv.slice(2);if(!out){console.error('Usage: node atlas-fields.mjs HEIGHT.png PLACEMENT.png CANON-REGIONS.png OUTPUT.json');process.exitCode=1;}else try{const f=compileFiles(height,placement,canon,out);console.log(JSON.stringify({points:f.points.length,waterComponents:f.diagnostics.blueWaterComponents}));}catch(e){console.error(e.message);process.exitCode=1;}}
