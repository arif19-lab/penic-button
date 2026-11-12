// ============================================================================
// test_auth_key.cpp - unit test for src/core/AuthKey.h
// ============================================================================
//
// Standalone, dependency-free regression test for the unified per-install
// access key (loading, trimming, validation, generation, caching, request
// parsing).
//
// The test redirects %ProgramData% to a throw-away directory BEFORE the
// first AuthKey call, so it never reads or writes the real install key.
//
// Build & run:
//     g++ -std=c++17 -O2 -Isrc scripts/test_auth_key.cpp -o test_auth_key.exe
//     ./test_auth_key.exe
//
// Exit code 0 = all assertions passed.
//
// The bug this guards against: the key rule used to be implemented four times
// (agent loader, agent validator, Windows service reader, Node proxy reader)
// with three different trim sets, two different path resolutions and a cache
// that was never invalidated - so a rotation or a redirected %ProgramData%
// could leave the service rejecting the phone while the agent kept working.
// ============================================================================
#include "core/AuthKey.h"

#include <cstdio>
#include <cstdlib>
#include <string>
#include <windows.h>

static int g_pass = 0;
static int g_fail = 0;

static void Check(bool ok, const char* label) {
    if (ok) {
        g_pass++;
    } else {
        g_fail++;
        std::printf("  [FAIL] %s\n", label);
    }
}

static std::string TempDir() {
    char buf[MAX_PATH] = {0};
    DWORD n = GetTempPathA(MAX_PATH, buf);
    std::string dir = std::string(buf, n) + "panicctrl_keytest";
    CreateDirectoryA(dir.c_str(), NULL);
    return dir;
}

static void WriteKeyFile(const std::string& dir, const std::string& content) {
    std::string sub = dir + "\\PanicButton";
    CreateDirectoryA(sub.c_str(), NULL);
    std::string p = sub + "\\auth.key";
    HANDLE h = CreateFileA(p.c_str(), GENERIC_WRITE, FILE_SHARE_READ, NULL,
                           CREATE_ALWAYS, FILE_ATTRIBUTE_NORMAL, NULL);
    if (h == INVALID_HANDLE_VALUE) return;
    DWORD w = 0;
    WriteFile(h, content.c_str(), (DWORD)content.size(), &w, NULL);
    CloseHandle(h);
}

static std::string Get(const std::string& url) {
    return "GET " + url + " HTTP/1.1\r\nHost: 127.0.0.1:8085\r\n\r\n";
}

int main() {
    std::printf("AuthKey unit test\n");
    std::printf("-----------------\\n");

    // ── 1. Normalisation: the ONE trim rule (CR, LF, SPACE, TAB) ──────────
    Check(AuthKey::Normalize("abc\r\n") == "abc", "Normalize strips trailing CR/LF");
    Check(AuthKey::Normalize("abc\t") == "abc", "Normalize strips trailing TAB");
    Check(AuthKey::Normalize("abc   ") == "abc", "Normalize strips trailing spaces");
    Check(AuthKey::Normalize("\r\n abc\t") == "abc", "Normalize strips leading + trailing");
    Check(AuthKey::Normalize("a b c") == "a b c", "Normalize keeps inner spaces");
    Check(AuthKey::Normalize("abc") == "abc", "Normalize leaves clean text alone");
    Check(AuthKey::Normalize("") == "", "Normalize handles empty");

    // ── 2. Validity: at least 16 characters ────────────────────────────────
    Check(!AuthKey::IsUsable(""), "empty key is unusable");
    Check(!AuthKey::IsUsable("short"), "short key is unusable");
    Check(!AuthKey::IsUsable("012345678901234"), "15 chars is unusable");
    Check(AuthKey::IsUsable("0123456789012345"), "16 chars is usable");
    Check(AuthKey::IsUsable("012345678901234567890123"), "24 chars is usable");

    // ── 3. Token comparison ─────────────────────────────────────────────────
    Check(AuthKey::TokenMatches("abcdef", "abcdef"), "identical tokens match");
    Check(!AuthKey::TokenMatches("abcdef", "abcdeg"), "different tokens do not match");
    Check(!AuthKey::TokenMatches("abcdef", "abcdefg"), "different lengths do not match");
    Check(!AuthKey::TokenMatches("", ""), "empty tokens never match");

    // ── 4. Redirect %ProgramData% so the real key is never touched ─────────
    std::string tmp = TempDir();
    SetEnvironmentVariableA("ProgramData", tmp.c_str());
    std::string keyDir = tmp + "\\PanicButton";
    CreateDirectoryA(keyDir.c_str(), NULL);
    std::string keyFile = keyDir + "\\auth.key";

    std::printf("\n  isolated ProgramData: %s\n", tmp.c_str());

    // ── 5. No key file yet -> no key ───────────────────────────────────────
    DeleteFileA(keyFile.c_str());
    Check(AuthKey::CurrentKey().empty(), "CurrentKey is empty when no key file exists");

    // ── 6. EnsureKeyExists creates a usable key and persists it ───────────
    std::string created = AuthKey::EnsureKeyExists();
    Check(created.size() == (size_t)AuthKey::KEY_LENGTH, "EnsureKeyExists generates a 24 char key");
    Check(AuthKey::IsUsable(created), "generated key is usable");
    Check(GetFileAttributesA(keyFile.c_str()) != INVALID_FILE_ATTRIBUTES,
          "generated key is written to disk");

    // The persisted file must round-trip through the SAME trim rule.
    Check(AuthKey::CurrentKey() == created, "CurrentKey reads back the generated key");
    Check(AuthKey::EnsureKeyExists() == created, "EnsureKeyExists is idempotent");

    // ── 7. Request parsing: the three accepted token forms ─────────────────
    std::string k = created;
    bool usedCurrent = false;
    Check(AuthKey::RequestHasValidKey("GET /api/status?key=" + k + " HTTP/1.1", &usedCurrent),
          "query parameter ?key= is accepted");
    Check(usedCurrent, "usedCurrentKey is set for a matching query parameter");
    Check(AuthKey::RequestHasValidKey("GET /x HTTP/1.1\r\nAuthorization: Bearer " + k + "\r\n", &usedCurrent),
          "Authorization: Bearer is accepted");
    Check(AuthKey::RequestHasValidKey("GET /x HTTP/1.1\r\nX-Panic-Key: " + k + "\r\n", &usedCurrent),
          "X-Panic-Key header is accepted");
    Check(AuthKey::RequestHasValidKey("GET /x HTTP/1.1\r\nauthorization: bearer " + k + "\r\n"),
          "lowercase Authorization: bearer is accepted");
    Check(AuthKey::RequestHasValidKey("GET /x HTTP/1.1\r\nx-panic-key: " + k + "\r\n"),
          "lowercase X-Panic-Key is accepted");

    // ── 8. Wrong / missing / short tokens are rejected ────────────────────
    Check(!AuthKey::RequestHasValidKey("GET /api/status?key=wrongkeywrongkey HTTP/1.1"),
          "a wrong key is rejected");
    Check(!AuthKey::RequestHasValidKey("GET /api/status HTTP/1.1"),
          "a missing key is rejected");
    Check(!AuthKey::RequestHasValidKey("GET /api/status?key= HTTP/1.1"),
          "an empty key is rejected");
    Check(!AuthKey::RequestHasValidKey("GET /api/status?key=tooshort HTTP/1.1"),
          "a too short key is rejected");

    // ── 9. Rotation: a new key on disk is picked up ───────────────────────
    std::string rotated = "ROTATEDKEY0123456789abcdef";
    WriteKeyFile(tmp, rotated + "\n");
    Sleep(1100);  // exceed the 1s reload window
    Check(AuthKey::CurrentKey() == rotated, "a rotated key is picked up");
    Check(AuthKey::RequestHasValidKey("GET /api/status?key=" + rotated + " HTTP/1.1"),
          "the rotated key authenticates");
    Check(!AuthKey::RequestHasValidKey("GET /api/status?key=" + k + " HTTP/1.1"),
          "the old key stops working after a rotation");

    // ── 10. Whitespace around a stored key is trimmed consistently ────────
    WriteKeyFile(tmp, "\t  " + rotated + "  \r\n");
    Sleep(1100);
    Check(AuthKey::CurrentKey() == rotated, "surrounding whitespace is trimmed");

    // ── 11. An unusable stored key is replaced, not accepted ──────────────
    WriteKeyFile(tmp, "short\r\n");
    Sleep(1100);
    Check(AuthKey::CurrentKey().empty(), "an unusable stored key is not returned");
    std::string replaced = AuthKey::EnsureKeyExists();
    Check(replaced.size() == (size_t)AuthKey::KEY_LENGTH && replaced != "short",
          "EnsureKeyExists replaces an unusable stored key");

    // ── 12. Path resolution honours %ProgramData% ─────────────────────────
    Check(AuthKey::GetProgramDataFolder() == tmp + "\\PanicButton",
          "GetProgramDataFolder honours %ProgramData%");
    Check(AuthKey::KeyFilePath() == keyFile, "KeyFilePath points at the isolated key file");

    // ── 13. Generated keys are unique and well formed ──────────────────────
    std::string a = AuthKey::GenerateKey();
    std::string b = AuthKey::GenerateKey();
    Check(a.size() == (size_t)AuthKey::KEY_LENGTH, "GenerateKey produces 24 characters");
    Check(a != b, "GenerateKey produces a different key every time");
    bool alphaNum = true;
    for (size_t i = 0; i < a.size(); i++) {
        char c = a[i];
        if (!((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9'))) alphaNum = false;
    }
    Check(alphaNum, "GenerateKey produces only alphanumeric characters");

    std::printf("\npassed: %d   failed: %d\n", g_pass, g_fail);
    if (g_fail == 0) {
        std::printf("AuthKey: ALL TESTS PASSED\n");
        return 0;
    }
    std::printf("AuthKey: %d TEST(S) FAILED\n", g_fail);
    return 1;
}
