import urllib.request, urllib.error, json, time

with open('C:\\ProgramData\\PanicButton\\auth.key', 'r') as f:
    AUTH_KEY = f.read().strip()

results = []

def test_ctrl(name, url, method="GET", data=None, content_type=None):
    try:
        headers = {'Authorization': f'Bearer {AUTH_KEY}', 'Connection': 'close'}
        if content_type:
            headers['Content-Type'] = content_type
        req = urllib.request.Request(url, data=data, headers=headers)
        with urllib.request.urlopen(req, timeout=5) as resp:
            body = resp.read().decode('utf-8', errors='ignore')
            passed = (resp.status == 200)
            results.append((name, passed, f"HTTP {resp.status} - {body[:60]}"))
    except Exception as e:
        results.append((name, False, str(e)))

print("=== FULL REMOTE CONTROL REGRESSION SUITE ===")

# 1. Telemetry Status
test_ctrl("Get Status (/api/status)", "http://127.0.0.1:8085/api/status")

# 2. Remote Mouse Move & Click
test_ctrl("Mouse Click (/api/mouse)", "http://127.0.0.1:8085/api/mouse?action=click&button=left")
test_ctrl("Mouse Move Relative (/api/mouse)", "http://127.0.0.1:8085/api/mouse?dx=5&dy=5")

# 3. Volume and Audio
test_ctrl("Volume Query (/api/volume)", "http://127.0.0.1:8085/api/volume")
test_ctrl("Volume Set (/api/volume?level=80)", "http://127.0.0.1:8085/api/volume?level=80")
test_ctrl("Media Key via Exec (/api/exec)", "http://127.0.0.1:8085/api/exec?cmd=powershell+-c+%22echo+MEDIA_OK%22")

# 4. Keyboard Typing & Special Keys
test_ctrl("Keyboard Text Typing (/api/type)", "http://127.0.0.1:8085/api/type?text=test")
test_ctrl("Keyboard Backspace (/api/key)", "http://127.0.0.1:8085/api/key?code={BACKSPACE}")
test_ctrl("Keyboard Enter (/api/key)", "http://127.0.0.1:8085/api/key?code={ENTER}")

# 5. Screen Capture (Single Frame)
test_ctrl("JPEG Rawframe (/rawframe)", "http://127.0.0.1:8085/rawframe")
test_ctrl("JPEG Screen (/screen)", "http://127.0.0.1:8085/screen")

# 6. Tailscale status check
test_ctrl("Tailscale Status (/api/tailscale-status)", "http://127.0.0.1:8085/api/tailscale-status")

# 7. AI Tool Execution
tool_payload = json.dumps({
    'name': 'execute_system_script',
    'args': {'script': 'Write-Output "PANIC_CTRL_VERIFIED"', 'interpreter': 'powershell'}
}).encode('utf-8')
test_ctrl("Gemini Proxy Tool Execute", "http://127.0.0.1:3001/api/tools/execute", "POST", tool_payload, "application/json")

print("\n=== RESULTS ===")
all_passed = True
for name, p, det in results:
    sym = "✅ PASS" if p else "❌ FAIL"
    print(f"{sym} | {name}: {det}")
    if not p: all_passed = False

print("\nALL REMOTE CONTROLS OPERATIONAL:", all_passed)
assert all_passed, "Some remote controls failed!"
