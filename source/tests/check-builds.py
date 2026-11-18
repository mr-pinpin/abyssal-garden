#!/usr/bin/env python3
"""Prove plugin isolation and safe disabled runtime builds; restore manifest."""
import hashlib
import json
from pathlib import Path
import subprocess
ROOT=Path(__file__).resolve().parents[2]
SOURCE=ROOT/'source';manifest=SOURCE/'manifest.json';original=manifest.read_bytes()
plugins={'pinpin-home':'pinpinHomePieces','elder-sanctuary':'pinpinElderPieces','timber-clearing':'pinpinClearingPieces','forest-ambience':'pinpinCreateAmbience'}
def command(args,cwd=SOURCE):
    return subprocess.run(args,cwd=cwd,check=True,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=60).stdout
results=[]
try:
    command(['npm','run','t0'])
    for name,function in plugins.items():
        out=command(['npm','run','t0','--',name])
        compiled=[line.split()[1] for line in out.splitlines() if 'COMPILED' in line]
        assert compiled==['plugin:'+name],out
        disabled=json.loads(original)
        next(p for p in disabled['plugins'] if p['name']==name)['enabled']=False
        manifest.write_text(json.dumps(disabled,indent=2)+'\n')
        command(['npm','run','build'])
        assert 'function '+function+'()' not in (ROOT/'dev.html').read_text()
        script="import {exercise} from './source/tests/built-scene.mjs';console.log(JSON.stringify(await exercise()));"
        runtime=json.loads(command(['node','--input-type=module','-e',script],ROOT))
        assert runtime['state']['ready'] and not runtime['state']['errors']
        results.append({'plugin':name,'compiled_alone':compiled,'disabled_build_ready':runtime['state']['ready'],'models_loaded':len(runtime['requests']),'disabled_chapters':runtime['disabled']})
        print(name+': one-unit tier 0 and disabled tier 1 runtime passed',flush=True)
        manifest.write_bytes(original)
        command(['npm','run','t0'])
finally:
    manifest.write_bytes(original)
    command(['npm','run','build'])
assert manifest.read_bytes()==original
compiler=json.loads((SOURCE/'node_modules/esbuild/package.json').read_text())['version']
report={'compiler':'esbuild '+compiler,'checks':results,'manifest_restored':True,'index_sha256':hashlib.sha256((ROOT/'index.html').read_bytes()).hexdigest(),'runtime_method':'Actual built artifact with explicit DOM/Canvas test adapter and filesystem-backed fetch; not browser/WebGPU QA'}
(SOURCE/'tests/build-evidence.json').write_text(json.dumps(report,indent=2)+'\n')
print('Manifest restored; final full build passed.')
