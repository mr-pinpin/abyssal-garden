#!/usr/bin/env python3
"""Export the browser-verified recovery study without replacing the main scene.

If this commit is absent in a shallow clone, fetch origin recovery/verified-forest.
Assets are shared with the main deployment only after byte-for-byte validation.
"""
import hashlib
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parent.parent
SOURCE = 'a52b28cfdb801b867c5a1833302d9a81972b7012'
ASSETS = ('pinpin', 'beaver', 'timber-tractor', 'footbridge', 'windfallen-tree')

def blob(path):
    return subprocess.check_output(['git', '-C', str(ROOT), 'show', SOURCE+':'+path])

page = blob('index.html').decode()
proof = {}
for name in ASSETS:
    source = blob('assets/recovered/'+name+'.glb')
    deployed = (ROOT/'assets/pinpin'/(name+'.glb')).read_bytes()
    assert source == deployed, 'Main asset differs: '+name
    old = 'assets/recovered/'+name+'.glb'
    assert page.count(old) == 1, 'Unexpected asset URL count: '+name
    page = page.replace(old, '../assets/pinpin/'+name+'.glb')
    proof[name] = hashlib.sha256(source).hexdigest()
assert 'assets/recovered/' not in page
out = ROOT/'recovery'
out.mkdir(exist_ok=True)
(out/'index.html').write_text(page)
(out/'version.json').write_text(json.dumps({'source_commit':SOURCE,
    'source_branch':'recovery/verified-forest', 'asset_sha256':proof,
    'change':'Only five asset URL prefixes change for this subdirectory export; main remains intact.'},indent=2)+'\n')
print(out/'index.html')
