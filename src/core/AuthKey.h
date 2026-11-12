// ============================================================================
// AuthKey.h - the ONE authoritative implementation of PANIC CTRL's per-install
//              authentication key (loading, validation, generation, caching).
// ============================================================================
//
// WHY THIS MODULE EXISTS
// ----------------------
// The access key used to be implemented FOUR different ways:
//
//   1. src/core/Globals.cpp   LoadOrCreateAuthKey()  - generates + caches the
//                              key in the global g_dynamicKey
//   2. src/server/HttpRouter.cpp RequestHasValidKey() - compares the request
//                              token against that in-memory global
//   3. PanicService.cpp       SvcAuthKey()/SvcHasKey() - an independent reader
//                              with a DIFFERENT trim set (no TAB), a DIFFERENT
//                              path (hard-coded, not %ProgramData%) and a cache
//                              that was never invalidated
//   4. gemini-proxy/server.js agentAccessKey() - a Node reader with yet
//                              another path resolution (plus a
//                              PANIC_AUTH_KEY_FILE override)
//
// The two C++ implementations had already drifted, which means a key rotation
// or a redirected %ProgramData% could leave the service rejecting the phone
// while the agent kept working - with no diagnostic anywhere.
//
// THE RULE (identical for every process, on every platform)
// --------------------------------------------------------
//   * Path      : %ProgramData%\PanicButton\auth.key   (honour the env var)
//   * Trim      : leading and trailing CR, LF, SPACE and TAB
//   * Validity  : at least 16 characters, otherwise the key is unusable
//   * Tokens    : "Authorization: Bearer <key>",
//                 "X-Panic-Key: <key>", "?key=<key>"  (query parameter)
//   * Caching   : re-read at most once per second, so a rotation is picked
//                 up within a second by every process
//   * Creation  : only the agent creates the key, and it does so with an
//                 atomic CREATE_NEW so two processes racing to initialise
//                 can never end up with different keys
//
// This header is dependency-free (only <string> plus windows.h) so it can be
// used by the agent, by the Windows service and unit tested on its own.
// ============================================================================
#pragma once

#include <windows.h>

#include <cstdio>
#include <mutex>
#include <string>

namespace AuthKey {

// ── configuration ─────────────────────────────────────────────────────────
static const int   MIN_KEY_LENGTH = 16;     // a shorter value is unusable
static const char* KEY_FILE_NAME  = "auth.key";
static const int   CACHE_TTL_MS   = 1000;   // key-rotation reload window
static const int   KEY_LENGTH     = 24;     // generated key length

// ── where the state lives ──────────────────────────────────────────────────
inline std::string GetProgramDataFolder() {
    char buf[MAX_PATH] = {0};
    DWORD len = GetEnvironmentVariableA("ProgramData", buf, MAX_PATH);
    if (len > 0 && len < MAX_PATH) {
        return std::string(buf) + "\\PanicButton";
    }
    return "C:\\ProgramData\\PanicButton";
}

inline std::string KeyFilePath() {
    return GetProgramDataFolder() + "\\" + KEY_FILE_NAME;
}

// ── normalisation ──────────────────────────────────────────────────────────
// Strips leading and trailing CR, LF, SPACE and TAB.  This is the single
// trim rule used by the agent, the service and (mirrored) the Node proxy.
inline std::string Normalize(const std::string& raw) {
    size_t start = 0;
    while (start < raw.size()) {
        char c = raw[start];
        if (c == '\r' || c == '\n' || c == ' ' || c == '\t') start++; else break;
    }
    size_t end = raw.size();
    while (end > start) {
        char c = raw[end - 1];
        if (c == '\r' || c == '\n' || c == ' ' || c == '\t') end--; else break;
    }
    return raw.substr(start, end - start);
}

inline bool IsUsable(const std::string& key) {
    return key.size() >= (size_t)MIN_KEY_LENGTH;
}

// ── constant-time-ish comparison ──────────────────────────────────────────
inline bool TokenMatches(const std::string& presented, const std::string& expected) {
    if (presented.empty() || expected.empty()) return false;
    if (presented.size() != expected.size()) return false;
    unsigned char diff = 0;
    for (size_t i = 0; i < presented.size(); i++) {
        diff |= (unsigned char)(presented[i] ^ expected[i]);
    }
    return diff == 0;
}

// ── key generation (CSPRNG) ────────────────────────────────────────────────
inline bool SecureRandomBytes(unsigned char* out, int count) {
    typedef BOOLEAN (WINAPI *RtlGenRandomFn)(PVOID, ULONG);
    // Magic static: initialised once, thread safe, never needs a manual guard.
    static RtlGenRandomFn gen = []() -> RtlGenRandomFn {
        HMODULE adv = LoadLibraryA("advapi32.dll");
        if (!adv) return (RtlGenRandomFn)0;
        return (RtlGenRandomFn)GetProcAddress(adv, "SystemFunction036");
    }();
    if (!gen) return false;
    for (int i = 0; i < count; i++) {
        if (!gen(out + i, 1)) return false;
    }
    return true;
}

inline std::string GenerateKey() {
    static const char charset[] =
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const int charsetLen = (int)(sizeof(charset) - 1);

    std::string key;
    key.reserve(KEY_LENGTH);

    unsigned char buf[64];
    // Rejection sampling: 248 is a multiple of 62, so the distribution of the
    // key characters stays uniform.
    while ((int)key.size() < KEY_LENGTH) {
        if (!SecureRandomBytes(buf, (int)sizeof(buf))) break;
        for (int i = 0; i < (int)sizeof(buf) && (int)key.size() < KEY_LENGTH; i++) {
            if (buf[i] < 248) key += charset[buf[i] % charsetLen];
        }
    }
    if ((int)key.size() == KEY_LENGTH) return key;

    // Last-resort fallback if the OS CSPRNG is unavailable.  Still far better
    // than the old srand(time(NULL)) seed, which produced an 8 character key
    // that was trivially guessable.
    LARGE_INTEGER q;
    QueryPerformanceCounter(&q);
    unsigned long long seed = (unsigned long long)q.QuadPart ^ 0x9E3779B97F4A7C15ULL;
    seed ^= (unsigned long long)GetCurrentProcessId() * 0xBF58476D1CE4E5B9ULL;
    seed ^= (unsigned long long)GetTickCount64();
    for (int i = 0; i < KEY_LENGTH; i++) {
        seed = seed * 6364136223846793005ULL + 1442695040888963407ULL;
        key += charset[(seed >> 33) % (unsigned long long)charsetLen];
    }
    return key;
}

// ── file access ────────────────────────────────────────────────────────────
inline std::string ReadKeyFile() {
    HANDLE h = CreateFileA(KeyFilePath().c_str(), GENERIC_READ,
                           FILE_SHARE_READ | FILE_SHARE_WRITE, NULL,
                           OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, NULL);
    if (h == INVALID_HANDLE_VALUE) return "";
    char buf[512] = {0};
    DWORD got = 0;
    std::string raw;
    if (ReadFile(h, buf, (DWORD)(sizeof(buf) - 1), &got, NULL) && got > 0) {
        raw.assign(buf, got);
    }
    CloseHandle(h);
    std::string key = Normalize(raw);
    return IsUsable(key) ? key : std::string();
}

// Creates the key file only if it does not exist yet.  Returns true when this
// process is the one that created it.
inline bool CreateKeyFileIfAbsent(const std::string& key) {
    HANDLE h = CreateFileA(KeyFilePath().c_str(), GENERIC_WRITE, FILE_SHARE_READ,
                           NULL, CREATE_NEW, FILE_ATTRIBUTE_NORMAL, NULL);
    if (h == INVALID_HANDLE_VALUE) return false;
    std::string payload = key + "\n";
    DWORD written = 0;
    BOOL ok = WriteFile(h, payload.c_str(), (DWORD)payload.size(), &written, NULL);
    CloseHandle(h);
    return ok && written == payload.size();
}

// Replaces an existing but unusable key file.  The write goes to a temporary
// file that is then renamed over the target, so a concurrent reader never
// observes a half-written key.
inline bool ReplaceKeyFile(const std::string& key) {
    std::string tmp = KeyFilePath() + ".tmp";
    HANDLE h = CreateFileA(tmp.c_str(), GENERIC_WRITE, 0, NULL,
                           CREATE_ALWAYS, FILE_ATTRIBUTE_NORMAL, NULL);
    if (h == INVALID_HANDLE_VALUE) return false;
    std::string payload = key + "\n";
    DWORD written = 0;
    BOOL ok = WriteFile(h, payload.c_str(), (DWORD)payload.size(), &written, NULL);
    if (ok) ok = (written == payload.size());
    CloseHandle(h);
    if (!ok) { DeleteFileA(tmp.c_str()); return false; }
    if (!MoveFileExA(tmp.c_str(), KeyFilePath().c_str(),
                    MOVEFILE_REPLACE_EXISTING | MOVEFILE_WRITE_THROUGH)) {
        DeleteFileA(tmp.c_str());
        return false;
    }
    return true;
}

// ── cache ──────────────────────────────────────────────────────────────────
inline std::mutex& CacheMutex() {
    static std::mutex m;
    return m;
}

inline std::string& CachedKey() {
    static std::string k;
    return k;
}

inline ULONGLONG& CachedAt() {
    static ULONGLONG t = 0;
    return t;
}

inline void SetCachedKey(const std::string& k) {
    std::lock_guard<std::mutex> lk(CacheMutex());
    CachedKey() = k;
    CachedAt() = GetTickCount64();
}

// The current key, re-read from disk at most once per second so that a
// rotation is picked up by every process within a second.  Returns "" when
// no usable key file exists.
inline std::string CurrentKey() {
    std::lock_guard<std::mutex> lk(CacheMutex());
    ULONGLONG now = GetTickCount64();
    if (CachedAt() != 0 && (now - CachedAt()) < (ULONGLONG)CACHE_TTL_MS) {
        return CachedKey();
    }
    std::string k = ReadKeyFile();
    CachedKey() = k;
    CachedAt() = now;
    return k;
}

// The current key, creating it if the file is missing or unusable.
// Only the agent calls this; the service is a pure reader so that the
// Session-0 watchdog can never race the agent into a different key.
inline std::string EnsureKeyExists() {
    std::string k = CurrentKey();
    if (!k.empty()) return k;

    std::string fresh = GenerateKey();
    if (fresh.size() < (size_t)MIN_KEY_LENGTH) return "";

    if (CreateKeyFileIfAbsent(fresh)) {
        SetCachedKey(fresh);
        return fresh;
    }
    // The file exists but was unusable - replace it.
    if (ReplaceKeyFile(fresh)) {
        SetCachedKey(fresh);
        return fresh;
    }
    // Lost a race against another process: read whatever it wrote.
    std::lock_guard<std::mutex> lk(CacheMutex());
    std::string existing = ReadKeyFile();
    CachedKey() = existing;
    CachedAt() = GetTickCount64();
    return existing;
}

// ── request validation ─────────────────────────────────────────────────────
// Accepts the token as "Authorization: Bearer <key>", "X-Panic-Key: <key>"
// or "?key=<key>".  UsedCurrentKey is set when the presented token matched
// the current key (the caller uses that to mark a device as paired).
inline bool RequestHasValidKey(const std::string& request, bool* usedCurrentKey = NULL) {
    if (usedCurrentKey) *usedCurrentKey = false;

    std::string key = CurrentKey();
    if (key.empty()) return false;

    // 1. Authorization: Bearer <token>
    size_t authPos = request.find("Authorization: Bearer ");
    if (authPos == std::string::npos) authPos = request.find("authorization: bearer ");
    if (authPos != std::string::npos) {
        size_t start = authPos + 22;
        size_t end = request.find_first_of("\r\n ", start);
        std::string val = request.substr(start, (end == std::string::npos ? request.size() : end) - start);
        if (TokenMatches(val, key)) {
            if (usedCurrentKey) *usedCurrentKey = true;
            return true;
        }
    }

    // 2. X-Panic-Key: <token>
    size_t xPos = request.find("X-Panic-Key: ");
    if (xPos == std::string::npos) xPos = request.find("x-panic-key: ");
    if (xPos != std::string::npos) {
        size_t start = xPos + 13;
        size_t end = request.find_first_of("\r\n ", start);
        std::string val = request.substr(start, (end == std::string::npos ? request.size() : end) - start);
        if (TokenMatches(val, key)) {
            if (usedCurrentKey) *usedCurrentKey = true;
            return true;
        }
    }

    // 3. Query parameter: ?key=<token>
    size_t pos = request.find("key=");
    while (pos != std::string::npos) {
        size_t start = pos + 4;
        size_t end = request.find_first_of(" &\r\n\"", start);
        std::string value = request.substr(start, (end == std::string::npos ? request.size() : end) - start);
        if (TokenMatches(value, key)) {
            if (usedCurrentKey) *usedCurrentKey = true;
            return true;
        }
        pos = request.find("key=", start);
    }

    return false;
}

// Convenience for the places that embed the key into a URL.
inline std::string CurrentKeyForEmbedding() {
    std::string k = CurrentKey();
    if (!k.empty()) return k;
    return EnsureKeyExists();
}

} // namespace AuthKey
