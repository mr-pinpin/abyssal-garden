// PNG encoder for the actual compatibility renderer's RGBA frames (Node stdlib).
import {deflateSync} from 'node:zlib';
function crc(buffer){let value=0xffffffff;for(const byte of buffer){value^=byte;for(let i=0;i<8;i++)value=(value>>>1)^((value&1)?0xedb88320:0);}return(value^0xffffffff)>>>0;}
function chunk(type,data){const tag=Buffer.from(type),size=Buffer.alloc(4),sum=Buffer.alloc(4);size.writeUInt32BE(data.length);sum.writeUInt32BE(crc(Buffer.concat([tag,data])));return Buffer.concat([size,tag,data,sum]);}
export function png(image){const {width,height,data}=image,header=Buffer.alloc(13);header.writeUInt32BE(width);header.writeUInt32BE(height,4);header[8]=8;header[9]=6;
 const raw=Buffer.alloc(height*(width*4+1));for(let y=0;y<height;y++)Buffer.from(data.buffer,data.byteOffset+y*width*4,width*4).copy(raw,y*(width*4+1)+1);
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);}
