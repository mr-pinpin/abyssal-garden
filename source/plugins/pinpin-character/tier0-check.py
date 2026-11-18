#!/usr/bin/env python3
"""Prove a real plugin-only rebuild and enabled:false; restore all temporary edits."""
import json
from pathlib import Path
import re
import subprocess

HERE = Path(__file__).resolve().parent
SOURCE = HERE.parents[1]
MANIFEST = SOURCE / 'manifest.json'
PLUGIN = HERE / 'plugin.js'
original_manifest, original_plugin = MANIFEST.read_bytes(), PLUGIN.read_bytes()


def run():
    return subprocess.check_output(['npm', 'run', 't0'], cwd=SOURCE, text=True)


try:
    manifest = json.loads(original_manifest)
    assert not any(p['name'] == 'pinpin-character' for p in manifest['plugins'])
    entry = {'name': 'pinpin-character', 'phase': 'pre', 'enabled': True}
    manifest['plugins'].append(entry)
    MANIFEST.write_text(json.dumps(manifest, indent=2) + '\n')
    run()  # warm existing units
    PLUGIN.write_bytes(original_plugin + b'\n// isolated tier 0 proof\n')
    isolated = run()
    print(isolated)
    assert re.findall(r'COMPILED\s+(\S+)', isolated) == ['plugin:pinpin-character']
    assert 'function pinpinCharacterPieces()' in (SOURCE.parent / 'dev.html').read_text()
    entry['enabled'] = False
    MANIFEST.write_text(json.dumps(manifest, indent=2) + '\n')
    disabled = run()
    assert 'function pinpinCharacterPieces()' not in (SOURCE.parent / 'dev.html').read_text()
    print('PASS: only plugin:pinpin-character rebuilt; enabled:false omits it; shared sources restored')
    print(disabled.rstrip())
finally:
    MANIFEST.write_bytes(original_manifest)
    PLUGIN.write_bytes(original_plugin)
    run()
    assert MANIFEST.read_bytes() == original_manifest
    assert PLUGIN.read_bytes() == original_plugin
