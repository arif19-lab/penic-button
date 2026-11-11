import urllib.request
import urllib.error
import json
import time
import socket

# Wait for port 3001 to be ready (Node.js cold-start)
for _ in range(15):
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(0.5)
        if s.connect_ex(('127.0.0.1', 3001)) == 0:
            s.close()
            break
        s.close()
    except:
        pass
    time.sleep(0.5)

with open('C:\\ProgramData\\PanicButton\\auth.key', 'r') as f:
    AUTH_KEY = f.read().strip()

WRONG_KEY = "hacker_key_99999"
LEGACY_KEY = "imran2024"

tests = []

def record(category, name, passed, detail):
    symbol = "✅ PASS" if passed else "❌ FAIL"
    tests.append((category, name, passed, detail))
    print(f"[{category}] {symbol} | {name}: {detail}")

print("=================================================================")
print("      PANIC CTRL — FINAL ACCEPTANCE VERIFICATION SUITE           ")
print(f"      Active Dynamic Key: {AUTH_KEY[:4]}...{AUTH_KEY[-4:]} (Len: {len(AUTH_KEY)})")
print("=================================================================\n")

# ─────────────────────────────────────────────────────────────────────────────
# 1. HEADER-BASED AUTHENTICATION (NO QUERY PARAM IN URL)
# ─────────────────────────────────────────────────────────────────────────────

# 1.1: Authorization: Bearer <key>
try:
    req = urllib.request.Request(
        "http://127.0.0.1:8085/api/status",
        headers={'Authorization': f'Bearer {AUTH_KEY}', 'Connection': 'close'}
    )
    with urllib.request.urlopen(req, timeout=5) as resp:
        body = json.loads(resp.read().decode('utf-8'))
        passed = (resp.status == 200) and (body.get("authenticated") is True)
        detail = f"HTTP {resp.status} (authenticated=True, 0 key in URL query string)"
        record("AUTH_HEADERS", "Authorization: Bearer <key> on /api/status", passed, detail)
except Exception as e:
    record("AUTH_HEADERS", "Authorization: Bearer <key> on /api/status", False, str(e))

# 1.2: X-Panic-Key: <key>
try:
    req = urllib.request.Request(
        "http://127.0.0.1:8085/api/status",
        headers={'X-Panic-Key': AUTH_KEY, 'Connection': 'close'}
    )
    with urllib.request.urlopen(req, timeout=5) as resp:
        body = json.loads(resp.read().decode('utf-8'))
        passed = (resp.status == 200) and (body.get("authenticated") is True)
        detail = f"HTTP {resp.status} (authenticated=True via X-Panic-Key header)"
        record("AUTH_HEADERS", "X-Panic-Key: <key> on /api/status", passed, detail)
except Exception as e:
    record("AUTH_HEADERS", "X-Panic-Key: <key> on /api/status", False, str(e))

# 1.3: Authorization: Bearer with wrong key rejected on /lock
try:
    req = urllib.request.Request(
        "http://127.0.0.1:8085/lock",
        headers={'Authorization': f'Bearer {WRONG_KEY}', 'Connection': 'close'}
    )
    with urllib.request.urlopen(req, timeout=5) as resp:
        record("AUTH_HEADERS", "Authorization: Bearer <wrong_key> Rejected", False, f"Expected 403, got {resp.status}")
except urllib.error.HTTPError as e:
    passed = (e.code == 403)
    record("AUTH_HEADERS", "Authorization: Bearer <wrong_key> Rejected", passed, f"HTTP {e.code} Forbidden (Blocked)")
except Exception as e:
    record("AUTH_HEADERS", "Authorization: Bearer <wrong_key> Rejected", False, str(e))

# 1.4: Authorization: Bearer with legacy key ('imran2024') rejected
try:
    req = urllib.request.Request(
        "http://127.0.0.1:8085/lock",
        headers={'Authorization': f'Bearer {LEGACY_KEY}', 'Connection': 'close'}
    )
    with urllib.request.urlopen(req, timeout=5) as resp:
        record("AUTH_HEADERS", "Legacy Key ('imran2024') in Bearer Header Rejected", False, f"Expected 403, got {resp.status}")
except urllib.error.HTTPError as e:
    passed = (e.code == 403)
    record("AUTH_HEADERS", "Legacy Key ('imran2024') in Bearer Header Rejected", passed, f"HTTP {e.code} Forbidden (Blocked)")
except Exception as e:
    record("AUTH_HEADERS", "Legacy Key ('imran2024') in Bearer Header Rejected", False, str(e))

# ─────────────────────────────────────────────────────────────────────────────
# 2. ZERO INFORMATION LEAK VERIFICATION
# ─────────────────────────────────────────────────────────────────────────────

try:
    req = urllib.request.Request("http://127.0.0.1:8085/api/status", headers={'Connection': 'close'})
    with urllib.request.urlopen(req, timeout=5) as resp:
        raw_body = resp.read().decode('utf-8', errors='ignore')
        data = json.loads(raw_body)
        
        has_key = ("key" in data) or ("?key=" in raw_body) or (AUTH_KEY in raw_body)
        has_pin = ("has_saved_pin" in data)
        has_hw = ("cpu_pct" in data) or ("ram_pct" in data)
        safe = (data.get("authenticated") is False) and (data.get("requires_auth") is True)
        
        passed = (not has_key) and (not has_pin) and (not has_hw) and safe
        detail = f"Zero secrets leaked (key={has_key}, pin={has_pin}, hw={has_hw}, safe={safe})"
        record("SECURITY_LEAK", "Public Discovery /api/status Zero Leakage Audit", passed, detail)
except Exception as e:
    record("SECURITY_LEAK", "Public Discovery /api/status Zero Leakage Audit", False, str(e))

# ─────────────────────────────────────────────────────────────────────────────
# 3. REAL WORKFLOWS: KEYBOARD, VIDEO STREAM, LIVE WEBSOCKET, TOOL EXECUTION
# ─────────────────────────────────────────────────────────────────────────────

# 3.1: Authenticated Keyboard Endpoint (/api/key) via Header
try:
    req = urllib.request.Request(
        "http://127.0.0.1:8085/api/key?code={BACKSPACE}",
        headers={'Authorization': f'Bearer {AUTH_KEY}', 'Connection': 'close'}
    )
    with urllib.request.urlopen(req, timeout=5) as resp:
        passed = (resp.status == 200)
        detail = f"HTTP {resp.status} OK - Injected Backspace successfully"
        record("REAL_WORKFLOW", "Remote Keyboard Backspace (/api/key)", passed, detail)
except Exception as e:
    record("REAL_WORKFLOW", "Remote Keyboard Backspace (/api/key)", False, str(e))

# 3.2: Authenticated Keyboard Endpoint (/api/type) via Header
try:
    req = urllib.request.Request(
        "http://127.0.0.1:8085/api/type?text={ENTER}",
        headers={'Authorization': f'Bearer {AUTH_KEY}', 'Connection': 'close'}
    )
    with urllib.request.urlopen(req, timeout=5) as resp:
        passed = (resp.status == 200)
        detail = f"HTTP {resp.status} OK - Injected Enter successfully"
        record("REAL_WORKFLOW", "Remote Keyboard Enter (/api/type)", passed, detail)
except Exception as e:
    record("REAL_WORKFLOW", "Remote Keyboard Enter (/api/type)", False, str(e))

# 3.3: Live Video Stream Frame Payload Check
try:
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(5.0)
    s.connect(('127.0.0.1', 8085))
    req = f"GET /stream.h264 HTTP/1.1\r\nHost: 127.0.0.1:8085\r\nAuthorization: Bearer {AUTH_KEY}\r\nConnection: close\r\n\r\n"
    s.sendall(req.encode('ascii'))
    
    header_data = b''
    while b'\r\n\r\n' not in header_data:
        chunk = s.recv(1024)
        if not chunk: break
        header_data += chunk
    
    header, rest = header_data.split(b'\r\n\r\n', 1)
    status_line = header.split(b'\r\n')[0].decode('ascii')
    
    # Read payload bytes
    bytes_recv = len(rest)
    while bytes_recv < 25000:
        chunk = s.recv(4096)
        if not chunk: break
        bytes_recv += len(chunk)
    s.close()
    
    passed = ("200 OK" in status_line) and (bytes_recv >= 25000)
    detail = f"{status_line} - Received {bytes_recv} bytes live video stream chunks"
    record("REAL_WORKFLOW", "Live Video Streaming via Header Auth (/stream.h264)", passed, detail)
except Exception as e:
    record("REAL_WORKFLOW", "Live Video Streaming via Header Auth (/stream.h264)", False, str(e))

# 3.4: Gemini Live AI Tool Execution Benchmark
try:
    t0 = time.perf_counter()
    tool_req = urllib.request.Request(
        'http://127.0.0.1:3001/api/tools/execute',
        data=json.dumps({
            'name': 'execute_system_script',
            'args': {'script': 'Get-Process -Name PanicButton | Select-Object -ExpandProperty Id', 'interpreter': 'powershell'}
        }).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(tool_req, timeout=5) as tool_resp:
        tool_data = json.loads(tool_resp.read().decode('utf-8'))
        t_tool = (time.perf_counter() - t0) * 1000
        pid = tool_data.get('stdout', '').strip()
        passed = (tool_resp.status == 200) and (tool_data.get('success') is True) and (len(pid) > 0)
        detail = f"HTTP {tool_resp.status} - Tool executed in {t_tool:.1f}ms, verified PanicButton PID: {pid}"
        record("REAL_WORKFLOW", "Gemini AI Tool Execution (execute_system_script)", passed, detail)
except Exception as e:
    record("REAL_WORKFLOW", "Gemini AI Tool Execution (execute_system_script)", False, str(e))

# ─────────────────────────────────────────────────────────────────────────────
# 4. PERFORMANCE & LATENCY MEASUREMENTS
# ─────────────────────────────────────────────────────────────────────────────

# 4.1: Dashboard Load Time
try:
    t0 = time.perf_counter()
    req = urllib.request.Request("http://127.0.0.1:8085/", headers={'Connection': 'close'})
    with urllib.request.urlopen(req, timeout=5) as resp:
        content = resp.read()
        t_load = (time.perf_counter() - t0) * 1000
        passed = (resp.status == 200) and (t_load < 50) # sub-50ms target
        detail = f"{t_load:.2f}ms TTFB + Transfer ({len(content)} bytes)"
        record("PERFORMANCE", "Dashboard Shell Load Time", passed, detail)
except Exception as e:
    record("PERFORMANCE", "Dashboard Shell Load Time", False, str(e))

# 4.2: /api/status API Round-Trip Latency
try:
    latencies = []
    for _ in range(5):
        t0 = time.perf_counter()
        req = urllib.request.Request(
            "http://127.0.0.1:8085/api/status",
            headers={'Authorization': f'Bearer {AUTH_KEY}', 'Connection': 'close'}
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            resp.read()
            latencies.append((time.perf_counter() - t0) * 1000)
    avg_lat = sum(latencies) / len(latencies)
    passed = avg_lat < 60.0 # sub-60ms hardware telemetry target
    detail = f"Avg: {avg_lat:.2f}ms (Min: {min(latencies):.2f}ms, Max: {max(latencies):.2f}ms)"
    record("PERFORMANCE", "Telemetry API Latency (/api/status)", passed, detail)
except Exception as e:
    record("PERFORMANCE", "Telemetry API Latency (/api/status)", False, str(e))

# 4.3: WebSocket Handshake Duration
try:
    t0 = time.perf_counter()
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(3.0)
    s.connect(('127.0.0.1', 8085))
    ws_req = (
        f"GET /ws?key={AUTH_KEY} HTTP/1.1\r\n"
        f"Host: 127.0.0.1:8085\r\n"
        "Upgrade: websocket\r\n"
        "Connection: Upgrade\r\n"
        "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\n"
        "Sec-WebSocket-Version: 13\r\n\r\n"
    )
    s.sendall(ws_req.encode('ascii'))
    data = s.recv(1024)
    t_ws = (time.perf_counter() - t0) * 1000
    s.close()
    passed = (b"101 Switching Protocols" in data) and (t_ws < 25.0)
    detail = f"Handshake completed in {t_ws:.2f}ms (Status: 101 Switching Protocols)"
    record("PERFORMANCE", "WebSocket Handshake Latency (/ws)", passed, detail)
except Exception as e:
    record("PERFORMANCE", "WebSocket Handshake Latency (/ws)", False, str(e))

# ─────────────────────────────────────────────────────────────────────────────
# 5. ALL APPLICATION NAVIGATION & ASSET ROUTES
# ─────────────────────────────────────────────────────────────────────────────
routes = [
    ("Dashboard Root (/)", "http://127.0.0.1:8085/", 200),
    ("Pairing Setup Screen (/setup)", "http://127.0.0.1:8085/setup", 200),
    ("Pairing QR Page (/qr)", "http://127.0.0.1:8085/qr", 200),
    ("PWA Web App Manifest (/manifest.json)", "http://127.0.0.1:8085/manifest.json", 200),
    ("In-App QR Engine (/jsqr.min.js)", "http://127.0.0.1:8085/jsqr.min.js", 200),
    ("Android APK Direct Download (/download/app.apk)", "http://127.0.0.1:8085/download/app.apk", 200),
    ("Gemini Proxy Health (/gemini-proxy/api/health)", "http://127.0.0.1:8085/gemini-proxy/api/health", 200),
]

for r_name, r_url, r_expected in routes:
    try:
        req = urllib.request.Request(r_url, headers={'Connection': 'close'})
        with urllib.request.urlopen(req, timeout=5) as resp:
            passed = (resp.status == r_expected)
            record("ROUTE_COVERAGE", r_name, passed, f"HTTP {resp.status}")
    except Exception as e:
        record("ROUTE_COVERAGE", r_name, False, str(e))

# ─────────────────────────────────────────────────────────────────────────────
# SUMMARY & FINAL VERDICT
# ─────────────────────────────────────────────────────────────────────────────
print("\n=================================================================")
passed_count = sum(1 for _, _, p, _ in tests if p)
total_count = len(tests)
all_ok = (passed_count == total_count)

print(f"TOTAL TESTS:       {passed_count}/{total_count} PASSED")
print(f"AUTH HEADERS:      {'✅ ALL PASSED' if all(p for c, _, p, _ in tests if c == 'AUTH_HEADERS') else '❌ FAILED'}")
print(f"SECURITY LEAK:     {'✅ ALL PASSED' if all(p for c, _, p, _ in tests if c == 'SECURITY_LEAK') else '❌ FAILED'}")
print(f"REAL WORKFLOWS:    {'✅ ALL PASSED' if all(p for c, _, p, _ in tests if c == 'REAL_WORKFLOW') else '❌ FAILED'}")
print(f"PERFORMANCE:       {'✅ ALL PASSED' if all(p for c, _, p, _ in tests if c == 'PERFORMANCE') else '❌ FAILED'}")
print(f"ROUTE COVERAGE:    {'✅ ALL PASSED' if all(p for c, _, p, _ in tests if c == 'ROUTE_COVERAGE') else '❌ FAILED'}")
print(f"FINAL ACCEPTANCE:  {'✅ ACCEPTED - 100% PRODUCTION READY' if all_ok else '❌ REJECTED'}")
print("=================================================================")
