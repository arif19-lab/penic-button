// ============================================================================
// test_pipe_dacl.cpp - verifies the restricted DACL for \\.\pipe\PanicUnlockPipe
// ============================================================================
//
// PanicProvider used to create the pipe with a NULL DACL, which grants FULL
// access to every local user, turning it into a local password-guessing
// oracle.  This test builds the SAME descriptor the provider now uses (they
// share src/security/PipeSecurity.h) and reports its ACL, without ever
// creating the real lock-screen pipe.
//
// Build & run:
//     g++ -std=c++17 -O2 -Isrc scripts/test_pipe_dacl.cpp -o test_pipe_dacl.exe -ladvapi32
//     ./test_pipe_dacl.exe
//
// Exit code 0 = all assertions passed.
// ============================================================================
#include "security/PipeSecurity.h"

#include <cstdio>
#include <string>
#include <windows.h>

static int g_pass = 0;
static int g_fail = 0;

static void Check(bool ok, const char* label) {
    if (ok) { g_pass++; }
    else { g_fail++; std::printf("  [FAIL] %s\n", label); }
}

static std::string SidToString(PSID sid) {
    if (!sid) return "<null>";
    LPSTR s = NULL;
    if (!ConvertSidToStringSidA(sid, &s)) return "<error>";
    std::string out = s;
    LocalFree(s);
    return out;
}

int main() {
    std::printf("PanicUnlockPipe DACL test\n");
    std::printf("-------------------------\n");

    const PipeSecurity::RestrictedDescriptor& d = PipeSecurity::Pipe();

    // ---- 1. The descriptor must build -----------------------------------
    Check(d.Ok(), "restricted descriptor builds successfully");
    if (!d.Ok()) {
        std::printf("\ncannot continue: descriptor build failed\n");
        return 1;
    }

    const SECURITY_ATTRIBUTES* sa = d.Attributes();
    Check(sa != NULL, "SECURITY_ATTRIBUTES is available");
    Check(sa && sa->lpSecurityDescriptor != NULL, "SECURITY_ATTRIBUTES carries a descriptor");
    Check(sa && !sa->bInheritHandle, "the pipe handle is not inheritable");

    // ---- 2. An explicit (non-NULL) DACL must be present ------------------
    SECURITY_DESCRIPTOR sdCopy;
    memcpy(&sdCopy, sa->lpSecurityDescriptor, sizeof(SECURITY_DESCRIPTOR));

    BOOL present = FALSE, defaulted = FALSE;
    PACL dacl = NULL;
    BOOL daclOk = GetSecurityDescriptorDacl(&sdCopy, &present, &dacl, &defaulted);

    Check(daclOk && present, "an explicit DACL is present");
    Check(daclOk && !defaulted, "the DACL is NOT NULL (this is the vulnerability being fixed)");
    Check(dacl != NULL, "the DACL pointer is valid");

    // ---- 3. Exactly the two expected principals are allowed --------------
    if (dacl) {
        ACL_SIZE_INFORMATION info;
        if (GetAclInformation(dacl, &info, sizeof(info), AclSizeInformation)) {
            std::printf("\n  DACL entries: %u\n", info.AceCount);
            Check(info.AceCount == 2, "exactly two ACEs (SYSTEM + Administrators)");
        } else {
            Check(false, "GetAclInformation on the DACL");
        }

        bool sawSystem = false, sawAdmin = false, sawAnyoneElse = false;
        for (DWORD i = 0; i < 64; i++) {
            LPVOID aceRaw = NULL;
            if (!GetAce(dacl, i, &aceRaw)) break;
            ACCESS_ALLOWED_ACE* ace = (ACCESS_ALLOWED_ACE*)aceRaw;
            if (ace->Header.AceType != ACCESS_ALLOWED_ACE_TYPE) continue;

            std::string sid = SidToString(&ace->SidStart);
            std::printf("    ACE %u: %-18s access=0x%08lX\n", i, sid.c_str(), ace->Mask);

            if (sid == "S-1-5-18")          sawSystem = true;   // NT AUTHORITY\SYSTEM
            else if (sid == "S-1-5-32-544") sawAdmin  = true;   // BUILTIN\Administrators
            else                            sawAnyoneElse = true;
        }
        Check(sawSystem, "NT AUTHORITY\\SYSTEM is allowed");
        Check(sawAdmin,  "BUILTIN\\Administrators is allowed");
        Check(!sawAnyoneElse, "no other principal is allowed");
    }

    // ---- 4. SDDL round-trip (human readable, easy to audit) -------------
    std::string sddl = d.Sddl();
    std::printf("\n  SDDL: %s\n", sddl.c_str());
    Check(sddl.find("D:") != std::string::npos, "SDDL contains a DACL");
    // The provider only ever needs to WRITE to the pipe (it reads from its own
    // instance), so FILE_GENERIC_WRITE ("FW") is the minimum correct right.
    Check(sddl.find("(A;;FW;;;SY)") != std::string::npos, "SDDL grants SYSTEM write access");
    Check(sddl.find("(A;;FW;;;BA)") != std::string::npos, "SDDL grants Administrators write access");
    Check(sddl.find(";;;WD)") == std::string::npos, "SDDL does NOT grant Everyone access");
    Check(sddl.find(";;;AU)") == std::string::npos, "SDDL does NOT grant Authenticated Users");
    Check(sddl.find(";;;NU)") == std::string::npos, "SDDL does NOT grant NETWORK access");
    Check(sddl.find(";;;IU)") == std::string::npos, "SDDL does NOT grant INTERACTIVE access");
    Check(sddl.find(";;;BU)") == std::string::npos, "SDDL does NOT grant BUILTIN\\Users");
    Check(sddl.find(";;;S-1-5-11)") == std::string::npos, "SDDL does NOT grant Authenticated Service");

    // ---- 5. The DACL is actually ENFORCED, not merely declared -----------
    // Create a pipe with exactly this descriptor and try to open it for
    // writing from this (unprivileged) token.  It must be denied.
    {
        const char* testPipe = "\\\\.\\pipe\\PanicDaclEnforcementTest";
        SECURITY_ATTRIBUTES sa = *d.Attributes();
        HANDLE hp = CreateNamedPipeA(testPipe,
                                     PIPE_ACCESS_INBOUND | FILE_FLAG_OVERLAPPED,
                                     PIPE_TYPE_MESSAGE | PIPE_READMODE_MESSAGE | PIPE_WAIT,
                                     1, 1024, 1024, 0, &sa);
        if (hp != INVALID_HANDLE_VALUE) {
            // The server end is up; a client that is not SYSTEM/Administrator
            // must not be able to open it for writing.
            HANDLE hc = CreateFileA(testPipe, GENERIC_WRITE, 0, NULL, OPEN_EXISTING, 0, NULL);
            Check(hc == INVALID_HANDLE_VALUE, "an unprivileged client CANNOT open the pipe for writing");
            if (hc == INVALID_HANDLE_VALUE) {
                DWORD err = GetLastError();
                std::printf("    client open denied with error %lu (ERROR_ACCESS_DENIED=%lu)\n",
                            err, (DWORD)ERROR_ACCESS_DENIED);
                Check(err == ERROR_ACCESS_DENIED, "the denial is ERROR_ACCESS_DENIED");
            } else {
                CloseHandle(hc);
            }
            DisconnectNamedPipe(hp);
            CloseHandle(hp);
        } else {
            Check(false, "could not create the enforcement test pipe");
        }
    }

    std::printf("\npassed: %d   failed: %d\n", g_pass, g_fail);
    if (g_fail == 0) { std::printf("PipeDACL: ALL TESTS PASSED\n"); return 0; }
    std::printf("PipeDACL: %d TEST(S) FAILED\n", g_fail);
    return 1;
}