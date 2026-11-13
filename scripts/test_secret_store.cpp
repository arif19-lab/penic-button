// ============================================================================
// test_secret_store.cpp - unit test for src/security/SecretStore.h and
//                        src/security/ProgramDataAcl.h
// ============================================================================
//
// Covers the Fix 0.3 behaviour:
//   * secrets are stored DPAPI encrypted, never as plain text
//   * a legacy plaintext file is detected and migrated transparently
//   * the ProgramData folder gets a least-privilege ACL: SYSTEM,
//     Administrators and the interactive user - and NOT "Users" / "Everyone"
//
// Build & run:
//     g++ -std=c++17 -O2 -Isrc scripts/test_secret_store.cpp -o test_secret_store.exe -ladvapi32 -lcrypt32
//     ./test_secret_store.exe
//
// Exit code 0 = all assertions passed.
// ============================================================================
#include "security/SecretStore.h"
#include "security/ProgramDataAcl.h"

#include <cstdio>
#include <string>
#include <windows.h>

static int g_pass = 0;
static int g_fail = 0;

static void Check(bool ok, const char* label) {
    if (ok) { g_pass++; }
    else { g_fail++; std::printf("  [FAIL] %s\n", label); }
}

static std::string TempDir() {
    char buf[MAX_PATH] = {0};
    DWORD n = GetTempPathA(MAX_PATH, buf);
    std::string dir = std::string(buf, n) + "panicctrl_secrettest";
    CreateDirectoryA(dir.c_str(), NULL);
    return dir;
}

int main() {
    std::printf("SecretStore + ProgramDataAcl unit test\n");
    std::printf("-------------------------------------\n");

    std::string dir = TempDir();
    std::string secretPath = dir + "\\secret.dat";
    printf("  isolated dir: %s\n", dir.c_str());

    // ---- 1. Round trip through DPAPI -------------------------------------
    const std::string original = "MyWindowsPassword123!";
    std::string blob;
    Check(SecretStore::Protect(original, blob), "Protect encrypts the secret");
    Check(SecretStore::IsProtected(blob), "the blob carries the PCSEC1 magic");
    Check(blob.find(original) == std::string::npos, "the plaintext is NOT present in the blob");

    std::string decrypted;
    Check(SecretStore::Unprotect(blob, decrypted), "Unprotect decrypts the blob");
    Check(decrypted == original, "the decrypted value matches the original");

    // ---- 2. The encrypted blob is not usable as plain text ---------------
    std::string plain = "plaintext-password";
    Check(!SecretStore::IsProtected(plain), "a plain string is not 'protected'");

    // ---- 3. Save + Load round trip through the file ---------------------
    Check(SecretStore::SaveSecret(secretPath, original), "SaveSecret writes the secret");
    Check(SecretStore::SecretExists(secretPath), "the secret file exists");

    std::string rawOnDisk;
    Check(SecretStore::ReadRaw(secretPath, rawOnDisk), "the secret file can be read");
    Check(SecretStore::IsProtected(rawOnDisk), "the file on disk is DPAPI protected");
    Check(rawOnDisk.find(original) == std::string::npos,
          "the plaintext is NOT readable in the file on disk");

    std::string loaded;
    bool legacy = true;
    Check(SecretStore::LoadSecret(secretPath, loaded, &legacy), "LoadSecret reads the secret");
    Check(loaded == original, "the loaded secret matches");
    Check(!legacy, "a protected file is not reported as legacy");

    // ---- 4. Legacy plaintext migration ----------------------------------
    std::string legacyPath = dir + "\\legacy.dat";
    {
        FILE* f = fopen(legacyPath.c_str(), "wb");
        if (f) { fwrite(original.c_str(), 1, original.size(), f); fclose(f); }
    }
    std::string legacyLoaded;
    bool wasLegacy = false;
    Check(SecretStore::LoadSecret(legacyPath, legacyLoaded, &wasLegacy), "a legacy file still loads");
    Check(wasLegacy, "a legacy plaintext file is reported as legacy");
    Check(legacyLoaded == original, "the legacy value is returned unchanged");

    // migration: re-saving converts it to the protected format
    Check(SecretStore::SaveSecret(legacyPath, legacyLoaded), "the legacy secret can be re-saved");
    std::string migratedRaw;
    SecretStore::ReadRaw(legacyPath, migratedRaw);
    Check(SecretStore::IsProtected(migratedRaw), "the migrated file is protected");
    Check(migratedRaw.find(original) == std::string::npos,
          "the migrated file no longer contains the plaintext");

    // ---- 5. Missing / empty file ----------------------------------------
    std::string missing = dir + "\\does_not_exist.dat";
    std::string dummy;
    Check(!SecretStore::LoadSecret(missing, dummy), "a missing file yields no secret");
    Check(!SecretStore::SecretExists(missing), "a missing file is reported as absent");

    // ---- 6. Least-privilege ACL -----------------------------------------
    std::string aclError;
    bool aclOk = ProgramDataAcl::ApplyLeastPrivilege(dir, &aclError);
    Check(aclOk, "the least-privilege ACL can be applied");
    if (!aclOk) printf("    (acl error: %s)\n", aclError.c_str());

    std::string sddl = ProgramDataAcl::ReadSddl(dir);
    printf("\n  folder SDDL: %s\n", sddl.c_str());

    Check(sddl.find(";;;SY)") != std::string::npos, "SYSTEM has access");
    Check(sddl.find(";;;BA)") != std::string::npos, "Administrators have access");
    Check(sddl.find(";;;BU)") == std::string::npos, "BUILTIN\\Users does NOT have access");
    Check(sddl.find(";;;WD)") == std::string::npos, "Everyone does NOT have access");
    Check(sddl.find(";;;AU)") == std::string::npos, "Authenticated Users do NOT have access");
    Check(sddl.find(";;;IU)") == std::string::npos, "INTERACTIVE does NOT have access");

    printf("\npassed: %d   failed: %d\n", g_pass, g_fail);
    if (g_fail == 0) { printf("SecretStore: ALL TESTS PASSED\n"); return 0; }
    printf("SecretStore: %d TEST(S) FAILED\n", g_fail);
    return 1;
}
