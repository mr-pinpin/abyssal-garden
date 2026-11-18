#!/usr/bin/env python3
"""Real Chrome CDP verification, no third-party browser/Python packages required."""
import base64
import hashlib
import json
import os
from pathlib import Path
import socket
import struct
import time
import urllib.request
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent

class CDP:
    def __init__(self, url):
        u = urlparse(url)
        self.s = socket.create_connection((u.hostname, u.port), timeout=20)
        key = base64.b64encode(os.urandom(16)).decode()
        self.s.sendall(('GET %s HTTP/1.1\r\nHost: %s:%s\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: %s\r\nSec-WebSocket-Version: 13\r\n\r\n' % (u.path, u.hostname, u.port, key)).encode())
        response = b''
        while b'\r\n\r\n' not in response:
            response += self.s.recv(1)
        # HTTP reason phrases are free text: Chrome 157 says '101 WebSocket Protocol Handshake'
        assert response.split(b'\r\n', 1)[0].split()[1:2] == [b'101'], response
        expected = base64.b64encode(hashlib.sha1((key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').encode()).digest())
        assert expected.lower() in response.lower()
        self.id = 0
        self.events = []
    def exact(self, n):
        data = b''
        while len(data) < n:
            part = self.s.recv(n-len(data))
            if not part: raise EOFError('Chrome connection closed')
            data += part
        return data
    def send(self, data):
        data = json.dumps(data).encode(); mask = os.urandom(4)
        head = bytes([0x81, 0x80 | (len(data) if len(data) < 126 else 126 if len(data)<65536 else 127)])
        if len(data)>=65536: head += struct.pack('>Q',len(data))
        elif len(data)>=126: head += struct.pack('>H',len(data))
        self.s.sendall(head + mask + bytes(c ^ mask[i%4] for i,c in enumerate(data)))
    def receive(self):
        head = self.exact(2); size = head[1] & 127
        if size == 126: size = struct.unpack('>H', self.exact(2))[0]
        if size == 127: size = struct.unpack('>Q', self.exact(8))[0]
        mask = self.exact(4) if head[1] & 128 else None
        data = self.exact(size)
        if mask: data = bytes(c ^ mask[i%4] for i,c in enumerate(data))
        if head[0] & 15 == 8: raise EOFError('Chrome websocket closed')
        return json.loads(data)
    def call(self, method, params=None):
        self.id += 1; seq = self.id
        self.send({'id':seq, 'method':method, 'params':params or {}})
        while True:
            message = self.receive()
            if message.get('id') == seq:
                assert 'error' not in message, message
                return message.get('result', {})
            self.events.append(message)
    def js(self, expression):
        result = self.call('Runtime.evaluate', {'expression':expression, 'returnByValue':True, 'awaitPromise':True})
        assert 'exceptionDetails' not in result, result
        return result['result'].get('value')


def connect():
    with urllib.request.urlopen('http://127.0.0.1:9227/json/list') as response:
        pages = json.load(response)
    return CDP(next(p['webSocketDebuggerUrl'] for p in pages if p['type']=='page'))


def main():
    c = connect()
    c.call('Runtime.enable'); c.call('Log.enable'); c.call('Page.enable');c.call('Network.enable')
    c.call('Emulation.setDeviceMetricsOverride', {'width':1440,'height':1000,'deviceScaleFactor':1,'mobile':False})
    c.call('Page.navigate', {'url':'http://127.0.0.1:8174/'})
    for _ in range(120):
        if c.js('!!window.forestState && forestState().frames>2'): break
        time.sleep(.25)
    else: raise AssertionError('Forest never became ready')
    initial=c.js('forestState()')
    assert len(initial['groups']) == 4, initial
    assert len(initial['assets']) == 5 and all(a['materialColors'] for a in initial['assets']), initial
    assert initial['glError']==0 and not initial['errors'], initial
    for view in ['overview','home','pinpin','elder']:
        c.js('forestView(%s)' % json.dumps(view));time.sleep(.5)
        screenshot=c.call('Page.captureScreenshot', {'format':'png'})['data']
        (ROOT/'evidence'/('forest-'+view+'.png')).write_bytes(base64.b64decode(screenshot))
    c.js("forestView('pinpin')")
    before=c.js('forestState().eye')
    c.call('Input.dispatchKeyEvent', {'type':'keyDown','key':'w','code':'KeyW'})
    # Movement happens per animation frame. Software GL (SwiftShader) can run only a few frames a
    # second and stall after screenshots, so hold until 3 frames have run (at most 3 s), not 0.5 s.
    held=c.js('forestState().frames'); deadline=time.time()+3
    while c.js('forestState().frames')<held+3 and time.time()<deadline: time.sleep(.05)
    c.call('Input.dispatchKeyEvent', {'type':'keyUp','key':'w','code':'KeyW'})
    after=c.js('forestState().eye')
    assert sum((a-b)**2 for a,b in zip(before,after))>.01,(before,after)
    for layer in ['home','elder','pinpin']:
        assert c.js("(()=>{const x=document.querySelector('[data-layer=%s]');x.checked=false;x.dispatchEvent(new Event('change'));return forestState().groups.find(g=>g.id==='%s').enabled})()" % (layer,layer)) is False
        c.js("(()=>{const x=document.querySelector('[data-layer=%s]');x.checked=true;x.dispatchEvent(new Event('change'))})()" % layer)
    c.js("forestView('overview')")
    final=c.js('forestState()')
    assert final['glError']==0 and not final['errors'], final
    errors=[e for e in c.events if e.get('method')=='Runtime.exceptionThrown' or (e.get('method')=='Log.entryAdded' and e['params']['entry'].get('level')=='error') or (e.get('method')=='Runtime.consoleAPICalled' and e['params'].get('type')=='error')]
    assert not errors,errors
    report={'browser':c.call('Browser.getVersion'), 'initial':initial, 'final':final,'movement':{'before':before,'after':after},'runtime_layer_toggles':'all passed','console_errors':errors,'screenshots':['forest-'+v+'.png' for v in ['overview','home','pinpin','elder']]}
    (ROOT/'evidence/browser.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))

if __name__=='__main__':main()
