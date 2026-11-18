#!/usr/bin/env python3
"""Compile this plugin alone through tier 0, test disabling, restore manifest."""
import json
from pathlib import Path
import subprocess
HERE=Path(__file__).resolve().parent
SOURCE=HERE.parents[1]
NAME='elder-sanctuary'
FUNCTION='pinpinElderPieces'
manifest=SOURCE/'manifest.json'
original=manifest.read_bytes()
def run(force=False):
    command=['npm','run','t0']+(['--',NAME] if force else [])
    return subprocess.run(command,cwd=SOURCE,check=True,text=True,
                          stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=30).stdout
try:
    base=json.loads(original)
    base['plugins']=[p for p in base['plugins'] if p['name']!=NAME]
    manifest.write_text(json.dumps(base,indent=2)+'\n')
    run()
    base['plugins'].append({'name':NAME,'phase':'pre'})
    manifest.write_text(json.dumps(base,indent=2)+'\n')
    evidence=run(force=True)
    assert 'tier 0: 1/' in evidence and '(plugin:'+NAME+')' in evidence,evidence
    assert 'function '+FUNCTION+'()' in (SOURCE.parent/'dev.html').read_text()
    cached=run()
    assert 'tier 0: 0/' in cached,cached
    base['plugins'][-1]['enabled']=False
    manifest.write_text(json.dumps(base,indent=2)+'\n')
    run()
    assert 'function '+FUNCTION+'()' not in (SOURCE.parent/'dev.html').read_text()
finally:
    manifest.write_bytes(original)
assert manifest.read_bytes()==original
compiler=json.loads((SOURCE/'node_modules/esbuild/package.json').read_text())['version']
report=('Local compiler esbuild '+compiler+'\n'+evidence+
        'PASS: only this plugin compiled; next run compiled zero units; enabled:false omitted definition.\n'+
        'PASS: manifest restored byte-for-byte. Compilation only, not browser integration.\n')
(HERE/'tier0-evidence.txt').write_text(report)
print(report)
