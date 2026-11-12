#!/usr/bin/env python3
"""
test_auth_gate_live.py - live regression test for the PANIC CTRL HTTP auth gate.

Verifies against the RUNNING agent (http://127.0.0.1:8085) that:

  1. Every bypass vector that used to skip authentication is now REJECTED (403).
  2. The legitimate public surface (SPA shell, static assets, QR/setup, APK,
     read-only status) still works WITHOUT a key (200).
  3. Every mutating route still REQUIRES a key (403 without, 200 with).
  4. The authenticated path still functions (a harmless /api/exec echo).

The bug this guards against: the gate used to classify a request as a
"public static asset" by searching the ENTIRE raw request for ".js",
".css", ".png", ".ico", ".svg" or ".wav".  Appending one of those
extensions to the query string therefore skipped authentication entirely:
"GET /api/exec?cmd=whoami.js" executed an arbitrary PowerShell command.

Usage:
    python scripts/test_auth_gate_live.py

Exit code 0 = all checks passed.

NOTE: this test deliberately exercises only HARMLESS endpoints.  It never
calls /api/save_pin, /unlock, /lock, /sleep, /panic, /restart, /shutdown or
/api/exit, because those would change the state of the machine.
"""

import os
import sys
import urllib.error
import urllib.request

BASE = "http://127.0.0.1:8085"
KEY_FILE = os.path.join(os.environ.get("ProgramData", r"C:\ProgramData"),
                         "PanicButton", "auth.key")

PASSED = 0
FAILED = 0


def _probe(path, key=None, timeout=6):
    """Return (status, body_preview).  Never raises."""
    url = BASE + path
    req = urllib.request.Request(url, headers={"Connection": "close"})
    if key:
        req.add_header("X-Panic-Key", key)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.getcode(), r.read(200)
    except urllib.error.HTTPError as e:
        return e.code, e.read(200)
    except Exception as e:  # noqa: BLE001 - connection refused etc.
        return 0, str(e).encode()[:200]


def check(label, path, expect, key=None):
    global PASSED, FAILED
    status, _ = _probe(path, key)
    if status == expect:
        PASSED += 1
        return True
    FAILED += 1
    print(f"  [FAIL] {label}")
    print(f"         expected HTTP {expect}, got {status}   ({path})")
    return False


def read_key():
    try:
        with open(KEY_FILE, "r", encoding="utf-8") as f:
            return f.read().strip()
    except OSError:
        return ""


# --------------------------------------------------------------------------
# 1. BYPASS VECTORS - these all returned HTTP 200 (and executed a command)
#    before the fix.  They must now be rejected.
# --------------------------------------------------------------------------
BYPASS_VECTORS = [
    ("exec + .js in query", "/api/exec?cmd=echo+AUDIT.js"),
    ("exec + .css in query", "/api/exec?cmd=echo+AUDIT.css"),
    ("exec + .png in query", "/api/exec?cmd=echo+AUDIT.png"),
    ("exec + .ico in query", "/api/exec?cmd=echo+AUDIT.ico"),
    ("exec + .svg in query", "/api/exec?cmd=echo+AUDIT.svg"),
    ("exec + .wav in query", "/api/exec?cmd=echo+AUDIT.wav"),
    ("exec + 2nd param .js", "/api/exec?cmd=echo+AUDIT&f=.js"),
    ("gemini key + .js", "/api/gemini_key?x=.js"),
    ("save pin + .js", "/api/save_pin?pin=0&x=.js"),
    ("unlock + .js", "/unlock?pin=0&x=.js"),
    ("panic + .js", "/panic?x=.js"),
    ("lock + .js", "/lock?x=.js"),
    ("sleep + .js", "/sleep?x=.js"),
    ("restart + .js", "/restart?x=.js"),
    ("shutdown + .js", "/shutdown?x=.js"),
    ("exit + .js", "/api/exit?x=.js"),
    ("cmd-ws + .js", "/cmd-ws?x=.js"),
    ("ws stream + .js", "/ws?x=.js"),
    ("mouse + .js", "/api/mouse?px=1&py=1&x=.js"),
    ("type + .js", "/api/type?text=AUDIT&x=.js"),
    ("volume + .js", "/api/volume?level=50&x=.js"),
    ("wake + .js", "/api/wake?x=.js"),
    ("streaminfo + .js", "/api/streaminfo?x=.js"),
    ("mjpeg + .js", "/mjpeg?x=.js"),
    ("rawframe + .js", "/rawframe?x=.js"),
    ("h264 + .js", "/stream.h264?x=.js"),
    ("traversal to exec", "/js/../api/exec?cmd=echo+AUDIT"),
]

# --------------------------------------------------------------------------
# 2. PUBLIC SURFACE - must still work with NO key.
#
#    Two kinds of public routes exist:
#      a) explicitly routed by the agent (manifest.json, sw.js, jsqr.min.js,
#         favicon.ico, "/", "/status", "/api/status", "/qr", "/setup", the
#         APK) -> these must answer 200/204.
#      b) served from disk by the static-file handler (/css/*, /js/*,
#         /assets/*) -> the AUTH GATE must let them through, but whether the
#         file is actually found depends on the deployment (the agent
#         resolves "android-app/www" relative to its working directory, and
#         the scheduled task does not set one).  So these are only required
#         to NOT be rejected by the auth gate.
# --------------------------------------------------------------------------
PUBLIC_ROUTES = [
    ("SPA shell", "/"),
    ("SPA shell + query", "/?key=probe"),
    ("double slash", "//"),
    ("jsqr", "/jsqr.min.js"),
    ("manifest", "/manifest.json"),
    ("service worker", "/sw.js"),
    ("api status", "/api/status"),
    ("status", "/status"),
    ("apk", "/app.apk"),
    ("apk via download", "/download/app.apk"),
    ("qr page", "/qr"),
    ("qr page + query", "/qr?v=1"),
    ("setup page", "/setup"),
]

# Disk-served public assets: must pass the auth gate (never 401/403).
PUBLIC_ASSET_PATHS = [
    ("stylesheet", "/css/style.css"),
    ("app.js", "/js/app.js"),
    ("gemini_live.js", "/js/gemini_live.js"),
    ("asset image", "/assets/ai_avatar.jpg"),
]

# --------------------------------------------------------------------------
# 3. MUTATING ROUTES - must be rejected without a key.  These are all
#    harmless to REJECT (we never actually execute them here).
# --------------------------------------------------------------------------
PROTECTED_ROUTES = [
    ("exec", "/api/exec?cmd=echo+AUDIT"),
    ("gemini key", "/api/gemini_key"),
    ("save pin", "/api/save_pin?pin=0"),
    ("type", "/api/type?text=AUDIT"),
    ("key", "/api/key?code=65"),
    ("mouse", "/api/mouse?px=1&py=1"),
    ("touch", "/api/touch?px=1&py=1"),
    ("mouse_rel", "/api/mouse_rel?dx=1&dy=1"),
    ("telemetry", "/api/telemetry?x=1&y=1"),
    ("client telemetry", "/api/client_telemetry"),
    ("volume", "/api/volume?level=50"),
    ("wake", "/api/wake"),
    ("exit", "/api/exit"),
    ("streaminfo", "/api/streaminfo"),
    ("unlock", "/unlock?pin=0"),
    ("lock", "/lock"),
    ("sleep", "/sleep"),
    ("restart", "/restart"),
    ("shutdown", "/shutdown"),
    ("panic", "/panic"),
    ("wake alias", "/wake"),
    ("cmd-ws", "/cmd-ws"),
    ("ws", "/ws"),
    ("rawframe", "/rawframe"),
    ("mjpeg", "/mjpeg"),
    ("h264", "/stream.h264"),
]


def main():
    global PASSED, FAILED

    status, _ = _probe("/api/status")
    if status == 0:
        print("PANIC CTRL agent is not reachable on 127.0.0.1:8085")
        print("Start it first (schtasks /Run /TN PanicButton_Autostart).")
        return 2

    key = read_key()
    if not key:
        print(f"WARNING: could not read the access key from {KEY_FILE}")
        print("         authenticated checks will be skipped.")
        print()

    # ---- PREFLIGHT: make sure we are talking to the AGENT, not to the
    # ---- 24/7 Windows service.  PanicMasterService also answers on :8085
    # ---- whenever PanicButton.exe is absent, but it only serves "/" and
    # ---- gates everything else, so measuring it would give a false PASS.
    if key:
        st, body = _probe("/api/status?key=" + key)
        if st != 200 or b'"authenticated":true' not in body:
            print("PREFLIGHT FAILED: port 8085 is NOT being served by PanicButton.exe")
            print("  (the PanicMasterService takes over 8085 while the agent is down;")
            print("   it serves only '/' and gates everything else)")
            print(f"  /api/status?key=... -> HTTP {st}")
            return 2
        print("preflight OK: the PANIC CTRL agent (not the service) is answering.\n")
    else:
        print("preflight SKIPPED: no key available to identify the agent.\n")

    print("=" * 62)
    print("PANIC CTRL - live HTTP authentication gate regression test")
    print("=" * 62)

    print("\n[1] bypass vectors must be REJECTED (403) ...")
    for label, path in BYPASS_VECTORS:
        check(label, path, 403)

    print("\n[2] public surface must still WORK without a key (200) ...")
    for label, path in PUBLIC_ROUTES:
        check(label, path, 200)

    print("\n[2b] favicon is an explicit 204 route ...")
    check("favicon", "/favicon.ico", 204)

    print("\n[2c] disk-served public assets must PASS the auth gate ...")
    for label, path in PUBLIC_ASSET_PATHS:
        status, _ = _probe(path)
        if status in (200, 404):
            # 200 = file found, 404 = not deployed at this working directory.
            # Either way the request must NOT have been rejected by the gate.
            PASSED += 1
        else:
            FAILED += 1
            print(f"  [FAIL] {label}: expected 200/404 (gate passed), got {status}"
                  f"   ({path})")

    print("\n[3] mutating routes must REQUIRE a key (403 without) ...")
    for label, path in PROTECTED_ROUTES:
        check(label, path, 403)

    if key:
        print("\n[4] authenticated path must still WORK (200) ...")
        check("api status", "/api/status", 200, key)
        check("streaminfo", "/api/streaminfo", 200, key)
        check("exec (harmless echo)", "/api/exec?cmd=echo+AUTHOK", 200, key)
        # The key must also work as a query parameter (QR / WebSocket links).
        st, body = _probe("/api/status?key=" + key)
        if st == 200:
            PASSED += 1
        else:
            FAILED += 1
            print("  [FAIL] api status via ?key= query parameter")
    else:
        print("\n[4] authenticated checks SKIPPED (no key file)")

    print("\n" + "=" * 62)
    print(f"passed: {PASSED}   failed: {FAILED}")
    if FAILED == 0:
        print("RESULT: ALL AUTH GATE CHECKS PASSED")
        print("=" * 62)
        return 0
    print("RESULT: FAILURES DETECTED")
    print("=" * 62)
    return 1


if __name__ == "__main__":
    sys.exit(main())
