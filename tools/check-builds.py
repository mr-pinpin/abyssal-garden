#!/usr/bin/env python3
"""Integrated build proof: one plugin edit recompiles one unit; disable each via manifest."""
import json
from pathlib import Path
import re
import subprocess
ROOT=Path(__file__).resolve().parent.parent
SOURCE=ROOT/'source'
MANIFEST=SOURCE/'manifest.json'
original=MANIFEST.read_bytes()
log=[]
def run(tier):
    text=subprocess.check_output(['npm','run',tier],cwd=SOURCE,text=True)
    log.append(text.rstrip())
    return text
try:
    run('t0')
    for name in ['pinpin-home','elder-sanctuary','pinpin-character']:
        path=SOURCE/'plugins'/name/'plugin.js'; saved=path.read_bytes()
        try:
            path.write_bytes(saved+b'\n// integrated isolation proof\n')
            output=run('t0')
            assert re.findall(r'COMPILED\s+(\S+)',output)==['plugin:'+name]
        finally:
            path.write_bytes(saved)
        run('t0')
        manifest=json.loads(original)
        for plugin in manifest['plugins']:
            if plugin['name']==name:plugin['enabled']=False
        MANIFEST.write_text(json.dumps(manifest,indent=2)+'\n')
        run('t0')
        definitions={'pinpin-home':'pinpinHomePieces','elder-sanctuary':'pinpinElderPieces','pinpin-character':'pinpinCharacterPieces'}
        assert 'function '+definitions[name]+'(' not in (ROOT/'dev.html').read_text()
        MANIFEST.write_bytes(original)
        run('t0')
    cached=run('t0');assert not re.findall(r'COMPILED\s+(\S+)',cached)
finally:
    MANIFEST.write_bytes(original)
    run('build')
(ROOT/'evidence/builds.txt').write_text('\n\n'.join(log).rstrip()+'\n')
print('PASS: all three individual plugin-only recompiles, manifest disable, warm cache, restored final tier1 build')
