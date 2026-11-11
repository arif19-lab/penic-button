import urllib.request, re

req = urllib.request.Request('http://127.0.0.1:8085/setup', headers={'Connection': 'close'})
with urllib.request.urlopen(req) as resp:
    html = resp.read().decode('utf-8', errors='ignore')

print('=== QR CODE SETUP PAGE PAYLOAD AUDIT ===')
# Look for lanUrl and tailscaleUrl in JavaScript of setup page
matches = re.findall(r'(?:lanUrl|localHttpsUrl|tailscaleUrl|tailscaleHttpsUrl)\s*=\s*["\']([^"\']+)["\']', html)
if not matches:
    matches = re.findall(r'http[s]?://[0-9a-zA-Z\.\-_:]+/\?key=[0-9a-zA-Z]+', html)

for m in set(matches):
    print('Found URL in Setup Page:', m)

# Verify whether any pairing URL contains 127.0.0.1 or localhost
pairing_on_loopback = any('127.0.0.1' in m or 'localhost' in m for m in matches)
print('Are pairing URLs pointing to loopback (127.0.0.1)?', pairing_on_loopback)
assert not pairing_on_loopback, "ERROR: Pairing URL incorrectly points to loopback!"
print('SUCCESS: QR pairing URLs point to real network interfaces (LAN/Tailscale)!')
