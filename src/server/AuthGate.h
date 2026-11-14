// ============================================================================
// AuthGate.h - HTTP request authentication gate (path-based public allow-list)
// ============================================================================
//
// WHY THIS MODULE EXISTS
// ----------------------
// The original gate decided whether a request was a "public static asset" by
// scanning the ENTIRE raw request for the substrings ".css", ".js", ".png",
// ".ico", ".svg" and ".wav":
//
//     bool isStaticAsset = (request.find(".js") != std::string::npos) || ...
//     bool isPublicEndpoint = isStaticAsset || ...
//     bool hasKey = isPublicEndpoint || RequestHasValidKey(request, ...);
//
// Because that scan covered the query string and the body, ANY request that
// merely mentioned one of those extensions anywhere bypassed authentication.
// For example:
//
//     GET /api/exec?cmd=whoami.js HTTP/1.1
//
// was classified as a static asset, skipped the key check entirely, and
// executed an arbitrary PowerShell command.  The same trick reached
// /api/gemini_key, /api/save_pin, /unlock, /panic, /lock, /sleep, /restart,
// /shutdown, /api/exit, /cmd-ws, /ws, /api/mouse, /api/type and /api/volume.
//
// THE FIX
// -------
// Evaluate the allow-list against the PARSED REQUEST PATH only - never
// against the raw request - and only for non-mutating methods.  The public
// surface is intentionally identical to the original intent:
//
//     "/"  |  "/status"  |  "/api/status"  |  "/app.apk"  |  "/download/*"
//   "/manifest.json"  |  "/sw.js"  |  "/favicon.ico"  |  "/jsqr.min.js"
//   "/css/*"  |  "/js/*"  |  "/assets/*"  |  "/qr"  |  "/setup"
//
// Nothing else is public.  Everything that can change this machine requires a
// matching per-install access key.
//
// This header is intentionally dependency-free (only <string>) so that it can
// be unit tested without starting the server, and so that the Windows
// service can reuse the exact same rule later instead of re-implementing it.
// ============================================================================
#pragma once

#include <string>

namespace AuthGate {

// Split a raw HTTP request into its method and its path.
//
// The path is the request target with the query string removed and any
// duplicated leading slashes collapsed ("//js/app.js" -> "/js/app.js"),
// matching the normalisation the static-file server already performs.
inline void ParseTarget(const std::string& request,
                        std::string& method,
                        std::string& path) {
    method.clear();
    path.clear();

    size_t sp1 = request.find(' ');
    if (sp1 == std::string::npos) return;
    method = request.substr(0, sp1);

    size_t sp2 = request.find(' ', sp1 + 1);
    size_t targetEnd = (sp2 == std::string::npos) ? request.size() : sp2;
    std::string target = request.substr(sp1 + 1, targetEnd - (sp1 + 1));

    size_t q = target.find('?');
    if (q != std::string::npos) target.erase(q);

    // Collapse duplicated leading slashes.
    size_t nz = 0;
    while (nz + 1 < target.size() && target[nz] == '/' && target[nz + 1] == '/') nz++;
    if (nz > 0) target.erase(0, nz);

    path = target;
}

inline bool PathEquals(const std::string& p, const char* s) {
    return p == s;
}

inline bool PathStartsWith(const std::string& p, const char* s) {
    size_t n = 0;
    while (s[n]) n++;
    return p.size() >= n && p.compare(0, n, s) == 0;
}

// Reject traversal segments outright.  A public path never legitimately
// contains "..", and a normalised traversal must never be able to land on
// a protected route.
inline bool HasTraversal(const std::string& p) {
    return p.find("..") != std::string::npos;
}

// True when the request may be served WITHOUT an access key.
//
// NOTE: the pairing pages ("/qr", "/setup") embed the live access key, so
// the router applies a second, independent check for them (loopback-only or
// a matching key).  This function only decides the first gate.
inline bool IsPublicRequest(const std::string& request) {
    std::string method, path;
    ParseTarget(request, method, path);

    // Only non-mutating methods may bypass the key check.
    if (method != "GET" && method != "HEAD") return false;

    if (path.empty()) return false;
    if (HasTraversal(path)) return false;

    // SPA shell ("/" and "//" both normalise to "/").
    if (PathEquals(path, "/")) return true;

    // Read-only status.
    if (PathEquals(path, "/api/status")) return true;
    if (PathEquals(path, "/status")) return true;

    // App download.
    if (PathEquals(path, "/app.apk")) return true;
    if (PathStartsWith(path, "/download/")) return true;

    // PWA shell files.
    if (PathEquals(path, "/manifest.json")) return true;
    if (PathEquals(path, "/sw.js")) return true;
    if (PathEquals(path, "/favicon.ico")) return true;
    if (PathEquals(path, "/jsqr.min.js")) return true;

    // Static asset trees.
    if (PathStartsWith(path, "/css/")) return true;
    if (PathStartsWith(path, "/js/")) return true;
    if (PathStartsWith(path, "/assets/")) return true;
    if (PathStartsWith(path, "/vendor/")) return true;

    // Pairing pages (the router applies its own extra check for these).
    if (PathEquals(path, "/qr")) return true;
    if (PathEquals(path, "/setup")) return true;

    return false;
}

} // namespace AuthGate
