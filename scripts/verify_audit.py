import urllib.request
import json
import time
import socket

time.sleep(1)

tests = []

def run_test(name, url, expected_status=200, check_fn=None, headers=None):
    try:
        h = {'User-Agent': 'PanicAudit/1.0', 'Connection': 'close'}
        if headers:
            h.update(headers)
        req = urllib.request.Request(url, headers=h)
        with urllib.request.urlopen(req, timeout=5) as resp:
            code = resp.status
            body = resp.read()
            passed = (code == expected_status)
            detail = f"HTTP {code}"
            if check_fn:
                valid, reason = check_fn(body, resp.headers)
                if not valid:
                    passed = False
                    detail += f" - Check failed: {reason}"
            tests.append((name, passed, detail))
    except Exception as e:
        tests.append((name, False, str(e)))

# 1. GET / (Dashboard HTML)
run_test("GET / (Dashboard Shell)", "http://127.0.0.1:8085/", 200, 
         lambda b, h: ("PANIC" in b.decode("utf-8", errors="ignore"), "PANIC not found in HTML"))

# 2. GET /api/status without key
run_test("GET /api/status (unpaired handshake)", "http://127.0.0.1:8085/api/status", 200,
         lambda b, h: (b'"panic":' in b, '"panic": missing in json'))

# 3. GET /api/status with legacy key imran2024
run_test("GET /api/status?key=imran2024", "http://127.0.0.1:8085/api/status?key=imran2024", 200,
         lambda b, h: (b'"panic":' in b, "status JSON invalid"))

# 4. GET /status alias
run_test("GET /status?key=imran2024", "http://127.0.0.1:8085/status?key=imran2024", 200)

# 5. GET /api/key?key=imran2024&code={BACKSPACE}
run_test("GET /api/key (keyboard backspace)", "http://127.0.0.1:8085/api/key?key=imran2024&code={BACKSPACE}", 200)

# 6. GET /api/type?key=imran2024&text={ENTER}
run_test("GET /api/type (keyboard enter)", "http://127.0.0.1:8085/api/type?key=imran2024&text={ENTER}", 200)

# 7. GET /download/app.apk
run_test("GET /download/app.apk", "http://127.0.0.1:8085/download/app.apk", 200,
         lambda b, h: (len(b) > 1000000, f"APK size too small: {len(b)} bytes"))

# 8. GET /gemini-proxy/api/health (routed through HttpRouter C++ bridge to Node :3001)
run_test("GET /gemini-proxy/api/health (C++ Bridge to Node :3001)", "http://127.0.0.1:8085/gemini-proxy/api/health", 200,
         lambda b, h: (b'"ok":true' in b or b'"status":"ok"' in b or b'"healthy":true' in b, f"Health JSON unexpected: {b[:100]}"))

# 9. Direct Node port 3001 health check
run_test("GET http://127.0.0.1:3001/api/health (Direct Node :3001)", "http://127.0.0.1:3001/api/health", 200)

# 10. Video stream endpoint check
def test_stream_headers(path):
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(3.0)
        s.connect(('127.0.0.1', 8085))
        req = f"GET {path} HTTP/1.1\r\nHost: 127.0.0.1:8085\r\nConnection: close\r\n\r\n"
        s.sendall(req.encode('ascii'))
        data = s.recv(512).decode('ascii', errors='ignore')
        s.close()
        return ("200 OK" in data and "video/mp4" in data, data.split("\r\n")[0] if data else "empty")
    except Exception as e:
        return (False, str(e))

stream_ok, stream_msg = test_stream_headers("/stream.h264?key=imran2024")
tests.append(("GET /stream.h264?key=imran2024 (Android Native Video)", stream_ok, stream_msg))

# 11. WebSocket Raw Handshake test on port 8085 /ws
def test_ws(path, port):
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(4.0)
        s.connect(('127.0.0.1', port))
        req = (
            f"GET {path} HTTP/1.1\r\n"
            f"Host: 127.0.0.1:{port}\r\n"
            "Upgrade: websocket\r\n"
            "Connection: Upgrade\r\n"
            "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\n"
            "Sec-WebSocket-Version: 13\r\n\r\n"
        )
        s.sendall(req.encode('ascii'))
        resp = s.recv(1024).decode('ascii', errors='ignore')
        s.close()
        return ("101 Switching Protocols" in resp, resp.split("\r\n")[0] if resp else "empty response")
    except Exception as e:
        return (False, str(e))

ws_passed, ws_status = test_ws("/ws?key=imran2024", 8085)
tests.append(("WS /ws?key=imran2024 (Canvas Video Stream WS)", ws_passed, ws_status))

ws_live_passed, ws_live_status = test_ws("/gemini-proxy/ws/live?key=imran2024", 8085)
tests.append(("WS /gemini-proxy/ws/live (Bridged Gemini Live WebSocket)", ws_live_passed, ws_live_status))

print("\n================ VERIFICATION RESULTS ================")
all_passed = True
for name, passed, detail in tests:
    symbol = "✅ PASS" if passed else "❌ FAIL"
    print(f"{symbol} | {name}: {detail}")
    if not passed:
        all_passed = False
print("======================================================")
print("OVERALL STATUS:", "ALL TESTS PASSED" if all_passed else "SOME TESTS FAILED")
