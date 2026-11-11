import urllib.request
import urllib.error
import json
import time
import socket

time.sleep(2) # Allow services to settle

with open('C:\\ProgramData\\PanicButton\\auth.key', 'r') as f:
    VALID_KEY = f.read().strip()

WRONG_KEY = "unauthorized_hacker_key_999"
LEGACY_KEY = "imran2024"

results = []

def record(category, test_name, passed, detail):
    symbol = "✅ PASS" if passed else "❌ FAIL"
    results.append((category, test_name, passed, detail))
    print(f"[{category}] {symbol} | {test_name}: {detail}")

print("=================================================================")
print("     PANIC CTRL — SECURITY & REGRESSION VERIFICATION SUITE       ")
print(f"     Active Installation Key: {VALID_KEY[:4]}...{VALID_KEY[-4:]} (Len: {len(VALID_KEY)})")
print("=================================================================\n")

# ─────────────────────────────────────────────────────────────────────────────
# 1. SECURITY & ZERO INFORMATION LEAK AUDIT
# ─────────────────────────────────────────────────────────────────────────────

# Test 1.1: Unauthenticated GET /api/status
try:
    req = urllib.request.Request("http://127.0.0.1:8085/api/status", headers={'Connection': 'close'})
    with urllib.request.urlopen(req, timeout=5) as resp:
        body = resp.read().decode('utf-8', errors='ignore')
        data = json.loads(body)
        
        has_no_key = ("key" not in data) and ("?key=" not in body)
        has_no_pin = ("has_saved_pin" not in data)
        has_no_hw = ("cpu_pct" not in data) and ("disk_total" not in data)
        is_safe_discovery = data.get("authenticated") is False and data.get("requires_auth") is True
        
        passed = has_no_key and has_no_pin and has_no_hw and is_safe_discovery
        detail = f"Safe discovery (auth=False, requires_auth=True, 0 secrets leaked: key={not has_no_key}, pin={not has_no_pin}, hw={not has_no_hw})"
        record("SECURITY", "Unauthenticated /api/status Information Leak Audit", passed, detail)
except Exception as e:
    record("SECURITY", "Unauthenticated /api/status Information Leak Audit", False, str(e))

# Test 1.2: Universal static key rejection on protected endpoints
def test_rejection(endpoint_name, url):
    try:
        req = urllib.request.Request(url, headers={'Connection': 'close'})
        with urllib.request.urlopen(req, timeout=5) as resp:
            # If 200, unauthorized access succeeded -> FAIL!
            record("SECURITY", endpoint_name, False, f"Expected 403 Forbidden, got HTTP {resp.status}")
    except urllib.error.HTTPError as e:
        passed = (e.code == 403)
        detail = f"HTTP {e.code} Forbidden (Blocked as expected)" if passed else f"Unexpected HTTP {e.code}"
        record("SECURITY", endpoint_name, passed, detail)
    except Exception as e:
        record("SECURITY", endpoint_name, False, str(e))

test_rejection("Universal Secret ('imran2024') Rejected on /lock", f"http://127.0.0.1:8085/lock?key={LEGACY_KEY}")
test_rejection("Universal Secret ('imran2024') Rejected on /api/key", f"http://127.0.0.1:8085/api/key?key={LEGACY_KEY}&code={{BACKSPACE}}")
test_rejection("Arbitrary Attacker Key Rejected on /lock", f"http://127.0.0.1:8085/lock?key={WRONG_KEY}")
test_rejection("Arbitrary Attacker Key Rejected on /api/exec", f"http://127.0.0.1:8085/api/exec?key={WRONG_KEY}&cmd=whoami")

# Test 1.3: Unauthenticated access to streaming endpoints
def test_raw_socket_auth(test_name, path, should_allow=False):
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(3.0)
        s.connect(('127.0.0.1', 8085))
        req = f"GET {path} HTTP/1.1\r\nHost: 127.0.0.1:8085\r\nConnection: close\r\n\r\n"
        s.sendall(req.encode('ascii'))
        data = s.recv(1024).decode('ascii', errors='ignore')
        s.close()
        status_line = data.split("\r\n")[0] if data else "empty"
        if should_allow:
            passed = "200 OK" in status_line or "101" in status_line
        else:
            passed = "403 Forbidden" in status_line
        record("SECURITY", test_name, passed, f"Status: {status_line}")
    except Exception as e:
        record("SECURITY", test_name, False, str(e))

test_raw_socket_auth("Unauthenticated /stream.h264 Video Stream Blocked", "/stream.h264", False)
test_raw_socket_auth("Universal Secret ('imran2024') /stream.h264 Blocked", f"/stream.h264?key={LEGACY_KEY}", False)

# ─────────────────────────────────────────────────────────────────────────────
# 2. LEGITIMATE AUTHENTICATED WORKFLOWS (ZERO REGRESSION)
# ─────────────────────────────────────────────────────────────────────────────

# Test 2.1: Authenticated GET /api/status with valid key
try:
    req = urllib.request.Request(f"http://127.0.0.1:8085/api/status?key={VALID_KEY}", headers={'Connection': 'close'})
    with urllib.request.urlopen(req, timeout=5) as resp:
        body = resp.read().decode('utf-8', errors='ignore')
        data = json.loads(body)
        passed = (resp.status == 200) and (data.get("authenticated") is True) and ("cpu_pct" in data)
        detail = f"HTTP 200 (authenticated=True, CPU={data.get('cpu_pct')}%, RAM={data.get('ram_pct')}%)"
        record("REGRESSION", "Authenticated /api/status Telemetry", passed, detail)
except Exception as e:
    record("REGRESSION", "Authenticated /api/status Telemetry", False, str(e))

# Test 2.2: Authenticated Keyboard Endpoint (/api/key)
try:
    req = urllib.request.Request(f"http://127.0.0.1:8085/api/key?key={VALID_KEY}&code={{BACKSPACE}}", headers={'Connection': 'close'})
    with urllib.request.urlopen(req, timeout=5) as resp:
        body = resp.read().decode('utf-8', errors='ignore')
        passed = (resp.status == 200)
        detail = f"HTTP {resp.status} - Key Backspace processed"
        record("REGRESSION", "Authenticated Keyboard /api/key", passed, detail)
except Exception as e:
    record("REGRESSION", "Authenticated Keyboard /api/key", False, str(e))

# Test 2.3: Authenticated Keyboard Endpoint (/api/type)
try:
    req = urllib.request.Request(f"http://127.0.0.1:8085/api/type?key={VALID_KEY}&text={{ENTER}}", headers={'Connection': 'close'})
    with urllib.request.urlopen(req, timeout=5) as resp:
        passed = (resp.status == 200)
        detail = f"HTTP {resp.status} - Key Enter processed"
        record("REGRESSION", "Authenticated Keyboard /api/type", passed, detail)
except Exception as e:
    record("REGRESSION", "Authenticated Keyboard /api/type", False, str(e))

# Test 2.4: Authenticated Video Stream (/stream.h264)
try:
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(3.0)
    s.connect(('127.0.0.1', 8085))
    req = f"GET /stream.h264?key={VALID_KEY} HTTP/1.1\r\nHost: 127.0.0.1:8085\r\nConnection: close\r\n\r\n"
    s.sendall(req.encode('ascii'))
    data = s.recv(512).decode('ascii', errors='ignore')
    s.close()
    passed = "200 OK" in data and "video/mp4" in data
    detail = f"Status: {data.split(chr(13))[0]}"
    record("REGRESSION", "Authenticated /stream.h264 Native Video Stream", passed, detail)
except Exception as e:
    record("REGRESSION", "Authenticated /stream.h264 Native Video Stream", False, str(e))

# Test 2.5: Authenticated Canvas Stream WebSocket (/ws)
try:
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(4.0)
    s.connect(('127.0.0.1', 8085))
    req = (
        f"GET /ws?key={VALID_KEY} HTTP/1.1\r\n"
        f"Host: 127.0.0.1:8085\r\n"
        "Upgrade: websocket\r\n"
        "Connection: Upgrade\r\n"
        "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\n"
        "Sec-WebSocket-Version: 13\r\n\r\n"
    )
    s.sendall(req.encode('ascii'))
    data = s.recv(1024).decode('ascii', errors='ignore')
    s.close()
    passed = "101 Switching Protocols" in data
    detail = f"Status: {data.split(chr(13))[0]}"
    record("REGRESSION", "Authenticated /ws Video Canvas WebSocket", passed, detail)
except Exception as e:
    record("REGRESSION", "Authenticated /ws Video Canvas WebSocket", False, str(e))

# Test 2.6: Authenticated Gemini Live WebSocket (/gemini-proxy/ws/live)
try:
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(4.0)
    s.connect(('127.0.0.1', 8085))
    req = (
        f"GET /gemini-proxy/ws/live?key={VALID_KEY} HTTP/1.1\r\n"
        f"Host: 127.0.0.1:8085\r\n"
        "Upgrade: websocket\r\n"
        "Connection: Upgrade\r\n"
        "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\n"
        "Sec-WebSocket-Version: 13\r\n\r\n"
    )
    s.sendall(req.encode('ascii'))
    data = s.recv(1024).decode('ascii', errors='ignore')
    s.close()
    passed = "101 Switching Protocols" in data
    detail = f"Status: {data.split(chr(13))[0]}"
    record("REGRESSION", "Authenticated /gemini-proxy/ws/live WebSocket", passed, detail)
except Exception as e:
    record("REGRESSION", "Authenticated /gemini-proxy/ws/live WebSocket", False, str(e))

# Test 2.7: Android APK Download Endpoint
try:
    req = urllib.request.Request("http://127.0.0.1:8085/download/app.apk", headers={'Connection': 'close'})
    with urllib.request.urlopen(req, timeout=5) as resp:
        length = resp.headers.get('Content-Length')
        passed = (resp.status == 200) and (int(length) > 10000000 if length else True)
        detail = f"HTTP 200 - APK Binary Size: {length} bytes"
        record("REGRESSION", "Public APK Download /download/app.apk", passed, detail)
except Exception as e:
    record("REGRESSION", "Public APK Download /download/app.apk", False, str(e))

# ─────────────────────────────────────────────────────────────────────────────
# SUMMARY
# ─────────────────────────────────────────────────────────────────────────────
print("\n=================================================================")
all_passed = all(p for _, _, p, _ in results)
sec_passed = all(p for cat, _, p, _ in results if cat == "SECURITY")
reg_passed = all(p for cat, _, p, _ in results if cat == "REGRESSION")

print(f"SECURITY TESTS:    {'✅ ALL PASSED' if sec_passed else '❌ SOME FAILED'}")
print(f"REGRESSION TESTS:  {'✅ ALL PASSED' if reg_passed else '❌ SOME FAILED'}")
print(f"OVERALL STATUS:    {'✅ READY FOR RELEASE' if all_passed else '❌ NOT READY'}")
print("=================================================================")
