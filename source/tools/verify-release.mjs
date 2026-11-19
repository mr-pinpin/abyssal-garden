import fs from 'node:fs';import {fileURLToPath} from 'node:url';
export function verifyRelease(manifest,log){
 if(!manifest||!Array.isArray(manifest.plugins))throw Error('Missing release manifest plugins');
 const enabled=manifest.plugins.filter(p=>p.enabled!==false).map(p=>p.name),failed=new Set([...log.matchAll(/EXCLUDED plugin:([\w-]+)/g)].map(m=>m[1]));
 const missing=enabled.filter(name=>failed.has(name)||!log.includes('PASS contract plugin:'+name+'\n'));
 if(missing.length)throw Error('Release missing enabled plugin contracts: '+missing.join(', '));
 if(!log.includes('tier 1:'))throw Error('Release build did not complete tier1');
 return {ok:true,enabled};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){try{const result=verifyRelease(JSON.parse(fs.readFileSync(process.argv[2],'utf8')),fs.readFileSync(process.argv[3],'utf8'));console.log('Release complete: '+result.enabled.join(', '));}catch(error){console.error(error.message);process.exitCode=1;}}
