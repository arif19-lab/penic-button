import socket

with open('C:\\ProgramData\\PanicButton\\auth.key', 'r') as f:
    AUTH_KEY = f.read().strip()

LEGACY_KEY = "imran2024"
WRONG_KEY = "hacker_key_99999"

def probe_ws(path, headers=None):
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(3.0)
        s.connect(('127.0.0.1', 8085))
        h_str = ""
        if headers:
            for k, v in headers.items():
                h_str += f"{k}: {v}\r\n"
        req = (
            f"GET {path} HTTP/1.1\r\n"
            "Host: 127.0.0.1:8085\r\n"
            "Upgrade: websocket\r\n"
            "Connection: Upgrade\r\n"
            "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\n"
            "Sec-WebSocket-Version: 13\r\n"
            f"{h_str}\r\n"
        )
        s.sendall(req.encode('ascii'))
        data = s.recv(1024).decode('ascii', errors='ignore')
        s.close()
        status_line = data.split("\r\n")[0] if data else "empty"
        return status_line
    except Exception as e:
        return str(e)

print("=== WEBSOCKET SECURITY AUDIT ===")

endpoints = ["/ws", "/cmd-ws", "/gemini-proxy/ws/live"]

for ep in endpoints:
    print(f"\n--- Testing Endpoint: {ep} ---")
    
    # 1. Missing Key
    st_missing = probe_ws(ep)
    p_missing = "403" in st_missing
    print(f" - Missing Key:          {'✅ BLOCKED' if p_missing else '❌ LEAKED'} ({st_missing})")
    assert p_missing, f"Missing key was not blocked on {ep}!"

    # 2. Wrong Key
    st_wrong = probe_ws(f"{ep}?key={WRONG_KEY}")
    p_wrong = "403" in st_wrong
    print(f" - Wrong Key:            {'✅ BLOCKED' if p_wrong else '❌ LEAKED'} ({st_wrong})")
    assert p_wrong, f"Wrong key was not blocked on {ep}!"

    # 3. Legacy Key (imran2024)
    st_legacy = probe_ws(f"{ep}?key={LEGACY_KEY}")
    p_legacy = "403" in st_legacy
    print(f" - Legacy Key (imran2024): {'✅ BLOCKED' if p_legacy else '❌ LEAKED'} ({st_legacy})")
    assert p_legacy, f"Legacy key was not blocked on {ep}!"

    # 4. Valid Key
    st_valid = probe_ws(f"{ep}?key={AUTH_KEY}")
    p_valid = "101" in st_valid
    print(f" - Valid Key:            {'✅ CONNECTED' if p_valid else '❌ FAILED'} ({st_valid})")
    assert p_valid, f"Valid key failed to connect on {ep}!"

print("\nALL WEBSOCKET SECURITY TESTS PASSED 100%!")
