// ============================================================================
// test_auth_gate.cpp - unit test for src/server/AuthGate.h
// ============================================================================
//
// Standalone, dependency-free regression test for the HTTP authentication
// gate.  It does NOT start the server and does NOT touch the machine.
//
// Build & run:
//     g++ -std=c++17 -O2 -Isrc scripts/test_auth_gate.cpp -o test_auth_gate.exe
//     ./test_auth_gate.exe
//
// Exit code 0 = all assertions passed.
//
// The bug this guards against: the gate used to classify a request as a
// "public static asset" by searching the ENTIRE raw request for ".js",
// ".css", ".png", ".ico", ".svg" or ".wav".  Appending one of those
// extensions to the query string therefore skipped authentication entirely,
// e.g. "GET /api/exec?cmd=whoami.js" executed an arbitrary PowerShell
// command on the host.
// ============================================================================
#include "server/AuthGate.h"

#include <cstdio>
#include <string>
#include <vector>

static int g_pass = 0;
static int g_fail = 0;

static void Check(bool ok, const char* kind, const std::string& request) {
    if (ok) {
        g_pass++;
    } else {
        g_fail++;
        std::printf("  [FAIL] expected %-9s : %s\n", kind, request.c_str());
    }
}

static void ExpectPublic(const std::string& req) {
    Check(AuthGate::IsPublicRequest(req), "PUBLIC", req);
}

static void ExpectProtected(const std::string& req) {
    Check(!AuthGate::IsPublicRequest(req), "PROTECTED", req);
}

static std::string GET(const std::string& target) {
    return "GET " + target + " HTTP/1.1\r\nHost: 127.0.0.1:8085\r\n\r\n";
}

int main() {
    std::printf("AuthGate unit test\n");
    std::printf("-------------------\n");

    // ---- 1. The public surface must stay public (no key required) ---------
    ExpectPublic(GET("/"));
    ExpectPublic(GET("/?key=abc"));
    ExpectPublic(GET("//"));
    ExpectPublic(GET("/css/style.css"));
    ExpectPublic(GET("/css/style.css?v=2.7.0"));
    ExpectPublic(GET("/js/app.js"));
    ExpectPublic(GET("/js/gemini_live.js"));
    ExpectPublic(GET("/assets/ai_avatar.jpg"));
    ExpectPublic(GET("/jsqr.min.js"));
    ExpectPublic(GET("/manifest.json"));
    ExpectPublic(GET("/sw.js"));
    ExpectPublic(GET("/favicon.ico"));
    ExpectPublic(GET("/api/status"));
    ExpectPublic(GET("/status"));
    ExpectPublic(GET("/app.apk"));
    ExpectPublic(GET("/download/app.apk"));
    ExpectPublic(GET("/qr"));
    ExpectPublic(GET("/qr?v=1750000000"));
    ExpectPublic(GET("/setup"));
    ExpectPublic("HEAD / HTTP/1.1\r\n\r\n");

    // ---- 2. The confirmed bypass vectors must now be BLOCKED ---------------
    // Each of these returned HTTP 200 (and executed a command) before the fix.
    ExpectProtected(GET("/api/exec?cmd=whoami.js"));
    ExpectProtected(GET("/api/exec?cmd=whoami.css"));
    ExpectProtected(GET("/api/exec?cmd=whoami.png"));
    ExpectProtected(GET("/api/exec?cmd=whoami.ico"));
    ExpectProtected(GET("/api/exec?cmd=whoami.svg"));
    ExpectProtected(GET("/api/exec?cmd=whoami.wav"));
    ExpectProtected(GET("/api/exec?cmd=whoami&x=.js"));
    ExpectProtected(GET("/api/exec?cmd=whoami&file=report.js"));
    ExpectProtected(GET("/api/exec?cmd=whoami&file=report.css"));
    ExpectProtected("POST /api/exec?cmd=whoami.js HTTP/1.1\r\n\r\n");

    // ---- 3. Every mutating route must require a key -----------------------
    ExpectProtected(GET("/api/exec?cmd=whoami"));
    ExpectProtected(GET("/api/gemini_key"));
    ExpectProtected(GET("/api/gemini_key?x=.js"));
    ExpectProtected(GET("/api/save_pin?pin=1234"));
    ExpectProtected(GET("/api/save_pin?pin=1234&x=.js"));
    ExpectProtected("POST /api/save_pin?pin=1234 HTTP/1.1\r\n\r\n");
    ExpectProtected(GET("/api/type?text=hello"));
    ExpectProtected(GET("/api/type?text=hello&x=.js"));
    ExpectProtected(GET("/api/key?code=65"));
    ExpectProtected(GET("/api/mouse?px=100&py=100"));
    ExpectProtected(GET("/api/mouse?px=100&py=100&x=.js"));
    ExpectProtected(GET("/api/touch?px=100&py=100"));
    ExpectProtected(GET("/api/mouse_rel?dx=5&dy=5"));
    ExpectProtected(GET("/api/telemetry?x=1&y=1"));
    ExpectProtected(GET("/api/client_telemetry"));
    ExpectProtected(GET("/api/volume?level=50"));
    ExpectProtected(GET("/api/volume?level=50&x=.js"));
    ExpectProtected(GET("/api/wake"));
    ExpectProtected(GET("/api/exit"));
    ExpectProtected(GET("/api/exit?x=.js"));
    ExpectProtected(GET("/api/streaminfo"));
    ExpectProtected(GET("/unlock?pin=1234"));
    ExpectProtected(GET("/unlock?pin=1234&x=.js"));
    ExpectProtected(GET("/lock"));
    ExpectProtected(GET("/lock?x=.js"));
    ExpectProtected(GET("/sleep"));
    ExpectProtected(GET("/sleep?x=.js"));
    ExpectProtected(GET("/restart"));
    ExpectProtected(GET("/shutdown"));
    ExpectProtected(GET("/panic"));
    ExpectProtected(GET("/panic?x=.js"));
    ExpectProtected(GET("/wake"));
    ExpectProtected(GET("/cmd-ws"));
    ExpectProtected(GET("/cmd-ws?x=.js"));
    ExpectProtected(GET("/ws"));
    ExpectProtected(GET("/ws?x=.js"));
    ExpectProtected(GET("/rawframe"));
    ExpectProtected(GET("/mjpeg"));
    ExpectProtected(GET("/mjpeg?x=.js"));
    ExpectProtected(GET("/screen"));
    ExpectProtected(GET("/stream.h264"));
    ExpectProtected(GET("/stream.h264?x=.js"));

    // ---- 4. Path-only evaluation: the extension must live in the PATH ----
    ExpectProtected(GET("/api/exec?cmd=echo%20/x.css"));
    ExpectProtected(GET("/api/exec?cmd=echo%20/x.js"));
    ExpectProtected(GET("/api/gemini_key?note=.png"));
    // ...and a real static asset in the path IS public.
    ExpectPublic(GET("/js/logger.js"));

    // ---- 5. Traversal must never reach a protected route ------------------
    ExpectProtected(GET("/js/../api/exec?cmd=whoami"));
    ExpectProtected(GET("/css/../../api/exec?cmd=whoami"));

    // ---- 6. Malformed / empty requests are never public -------------------
    ExpectProtected("");
    ExpectProtected("GARBAGE");
    ExpectProtected("POST /css/style.css HTTP/1.1\r\n\r\n");
    ExpectProtected("OPTIONS /api/exec HTTP/1.1\r\n\r\n");

    std::printf("\npassed: %d   failed: %d\n", g_pass, g_fail);
    if (g_fail == 0) {
        std::printf("AuthGate: ALL TESTS PASSED\n");
        return 0;
    }
    std::printf("AuthGate: %d TEST(S) FAILED\n", g_fail);
    return 1;
}
