#!/usr/bin/env python3
"""Recover exact committed blobs (--import); otherwise validate the recovered package."""
import argparse
import hashlib
import json
from pathlib import Path
import struct
import subprocess
import zlib

ROOT = Path(__file__).resolve().parents[3]
SOURCE = Path('/code/v2-first/pinpin-garden-assets')
REVISION = '8978b223db3b5bd1ae07c0fd16aec54b14056cb8'
DEST = ROOT / 'assets/recovered'
IDS = {'pinpin', 'beaver', 'timber-tractor', 'footbridge', 'windfallen-tree'}


def blob(path):
    return subprocess.check_output(['git', '-C', str(SOURCE), 'show', REVISION + ':' + path])


def sha(data):
    return hashlib.sha256(data).hexdigest()


def check_png(raw):
    assert raw[:8] == b'\x89PNG\r\n\x1a\n'
    pos, compressed, ended = 8, b'', False
    while pos < len(raw):
        size, = struct.unpack_from('>I', raw, pos)
        kind, payload = raw[pos + 4:pos + 8], raw[pos + 8:pos + 8 + size]
        assert zlib.crc32(kind + payload) & 0xffffffff == struct.unpack_from('>I', raw, pos + 8 + size)[0]
        if kind == b'IHDR':
            assert struct.unpack_from('>II', payload) == (640, 640)
        if kind == b'IDAT':
            compressed += payload
        if kind == b'IEND':
            ended = True
        pos += size + 12
    assert ended and pos == len(raw) and len(set(zlib.decompress(compressed))) > 32


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--import', dest='recover', action='store_true')
    args = parser.parse_args()
    before = subprocess.check_output(['git', '-C', str(SOURCE), 'status', '--porcelain=v1', '--untracked-files=all'])
    original = blob('assets.json')
    manifest = json.loads(original)
    assert {a['id'] for a in manifest['assets']} == IDS and len(manifest['assets']) == 5
    mappings = []
    if args.recover:
        DEST.mkdir(parents=True, exist_ok=True)
        (DEST / 'assets.json').write_bytes(original)
        for name in ['LICENSE', 'LICENSE-MIT', 'CONTENT-LICENSE.md', 'THIRD-PARTY-NOTICES.md']:
            notice = DEST / 'notices' / name
            notice.parent.mkdir(exist_ok=True)
            notice.write_bytes(blob('notices/' + name))
    assert (DEST / 'assets.json').read_bytes() == original
    for asset in manifest['assets']:
        for source, target, checksum in [
            (asset['glb'], asset['id'] + '.glb', asset['sha256']),
            (asset['turntable'], asset['id'] + '-turntable.png', asset['turntable_sha256'])
        ]:
            committed = blob(source)
            assert sha(committed) == checksum
            if args.recover:
                (DEST / target).write_bytes(committed)
            raw = (DEST / target).read_bytes()
            assert raw == committed and sha(raw) == checksum
            if target.endswith('.glb'):
                assert len(raw) == asset['size'] and 0 < len(raw) < 2_000_000
                assert struct.unpack_from('<III', raw) == (0x46546c67, 2, len(raw))
                pos, kinds = 12, []
                while pos < len(raw):
                    size, kind = struct.unpack_from('<II', raw, pos)
                    assert size % 4 == 0 and pos + 8 + size <= len(raw)
                    kinds.append(kind)
                    pos += 8 + size
                assert pos == len(raw) and kinds == [0x4e4f534a, 0x004e4942]
                json_size, = struct.unpack_from('<I', raw, 12)
                gltf = json.loads(raw[20:20 + json_size])
                assert gltf['asset']['version'] == '2.0'
                assert gltf['meshes'] and gltf['materials'] and gltf['scenes']
                assert not gltf.get('images') and all('uri' not in b for b in gltf['buffers'])
            else:
                check_png(raw)
            mappings.append({'source': source, 'target': target, 'bytes': len(raw), 'sha256': checksum})
        output = subprocess.check_output(['node', str(ROOT / 'source/glb-check.mjs'),
                                          str(DEST / (asset['id'] + '.glb'))], text=True).strip()
        print(output)
    after = subprocess.check_output(['git', '-C', str(SOURCE), 'status', '--porcelain=v1', '--untracked-files=all'])
    assert before == after, 'Source worktree changed during recovery'
    provenance = {'source_repository': str(SOURCE), 'source_commit': REVISION,
                  'original_manifest_sha256': sha(original), 'files': mappings,
                  'review_status': 'Unreviewed procedural showcase studies, not approved book art',
                  'source_worktree_status_unchanged': True}
    if args.recover:
        (DEST / 'recovery.json').write_text(json.dumps(provenance, indent=2) + '\n')
    else:
        assert json.loads((DEST / 'recovery.json').read_text()) == provenance
    for name in ['LICENSE', 'LICENSE-MIT', 'CONTENT-LICENSE.md', 'THIRD-PARTY-NOTICES.md']:
        assert (DEST / 'notices' / name).read_bytes() == blob('notices/' + name)
    print('PASS: five GLBs, five PNGs, exact manifest/notices, hashes, containers, existing loader; source unchanged')


if __name__ == '__main__':
    main()
