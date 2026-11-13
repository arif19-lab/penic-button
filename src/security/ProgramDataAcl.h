// ============================================================================
// ProgramDataAcl.h - least-privilege ACL for C:\ProgramData\PanicButton
// ============================================================================
//
// PANIC CTRL keeps its runtime state in C:\ProgramData\PanicButton:
//
//   auth.key          the per-install remote-access key
//   saved_pin.dat     the Windows account password (DPAPI protected)
//   gemini_key.txt    the Google Gemini API key (DPAPI protected)
//   PanicProvider.dll, PanicService.exe, the alarm wavs, gemini-proxy/, ...
//
// The folder used to be granted "Full Control" to the whole "Users" group on
// every launch:
//
//     icacls "C:\ProgramData\PanicButton" /grant Users:(OI)(CI)(F) /T /Q
//
// which meant ANY local account could read the credentials above.
//
// The ACL is now applied explicitly and grants access to exactly:
//
//   NT AUTHORITY\SYSTEM          the Session-0 watchdog service
//   BUILTIN\Administrators       the elevated agent, the credential provider
//                                 and the installer
//   the interactive user          the agent runs as this user (elevated)
//
// and to nobody else - not "Users", not "Everyone", not "Authenticated Users".
//
// The ACEs are inheritable, so every file and sub-directory (gemini-proxy/,
// ssl/, ...) inherits the same restriction from one call.
//
// The user's own SID is taken from the current process token: the agent always
// runs elevated in the interactive session, so this IS the interactive user.
// ============================================================================
#pragma once

#include <windows.h>
#include <aclapi.h>
#include <sddl.h>

#include <string>
#include <vector>

namespace ProgramDataAcl {

// Well-known SIDs.
static const char* SID_SYSTEM = "S-1-5-18";       // NT AUTHORITY\SYSTEM
static const char* SID_ADMIN  = "S-1-5-32-544";   // BUILTIN\Administrators

// The SID of the account the current process runs as.
inline bool CurrentUserSid(std::vector<BYTE>& out) {
    HANDLE hToken = NULL;
    if (!OpenProcessToken(GetCurrentProcess(), TOKEN_QUERY, &hToken)) return false;

    DWORD need = 0;
    GetTokenInformation(hToken, TokenUser, NULL, 0, &need);
    bool ok = false;
    if (need > 0) {
        std::vector<BYTE> buf(need);
        if (GetTokenInformation(hToken, TokenUser, buf.data(), need, &need)) {
            TOKEN_USER* tu = (TOKEN_USER*)buf.data();
            DWORD sidLen = GetLengthSid(tu->User.Sid);
            out.assign((BYTE*)tu->User.Sid, (BYTE*)tu->User.Sid + sidLen);
            ok = true;
        }
    }
    CloseHandle(hToken);
    return ok;
}

// Applies the restricted ACL to `path` (a directory).  The ACEs are
// inheritable so children pick the restriction up automatically.
// Returns true when the ACL was applied.
inline bool ApplyLeastPrivilege(const std::string& path, std::string* error = NULL) {
    PSID systemSid = NULL, adminSid = NULL;
    if (!ConvertStringSidToSidA(SID_SYSTEM, &systemSid)) {
        if (error) *error = "ConvertStringSidToSidA(SYSTEM) failed";
        return false;
    }
    if (!ConvertStringSidToSidA(SID_ADMIN, &adminSid)) {
        LocalFree(systemSid);
        if (error) *error = "ConvertStringSidToSidA(Administrators) failed";
        return false;
    }

    std::vector<BYTE> userSid;
    bool haveUser = CurrentUserSid(userSid);

    // EXPLICIT_ACCESS entry per principal.
    const DWORD INHERIT = OBJECT_INHERIT_ACE | CONTAINER_INHERIT_ACE;
    std::vector<EXPLICIT_ACCESS> ea;

    EXPLICIT_ACCESS a1 = {0};
    a1.grfAccessPermissions = FILE_ALL_ACCESS;
    a1.grfAccessMode = SET_ACCESS;
    a1.grfInheritance = INHERIT;
    a1.Trustee.TrusteeForm = TRUSTEE_IS_SID;
    a1.Trustee.ptstrName = (LPSTR)systemSid;
    ea.push_back(a1);

    EXPLICIT_ACCESS a2 = {0};
    a2.grfAccessPermissions = FILE_ALL_ACCESS;
    a2.grfAccessMode = SET_ACCESS;
    a2.grfInheritance = INHERIT;
    a2.Trustee.TrusteeForm = TRUSTEE_IS_SID;
    a2.Trustee.ptstrName = (LPSTR)adminSid;
    ea.push_back(a2);

    if (haveUser) {
        EXPLICIT_ACCESS a3 = {0};
        a3.grfAccessPermissions = FILE_ALL_ACCESS;
        a3.grfAccessMode = SET_ACCESS;
        a3.grfInheritance = INHERIT;
        a3.Trustee.TrusteeForm = TRUSTEE_IS_SID;
        a3.Trustee.ptstrName = (LPSTR)userSid.data();
        ea.push_back(a3);
    }

    PACL newAcl = NULL;
    DWORD rc = SetEntriesInAclA((ULONG)ea.size(), ea.data(), NULL, &newAcl);
    bool ok = false;
    if (rc == ERROR_SUCCESS && newAcl) {
        // PROTECTED_DACL_SECURITY_INFORMATION stops the folder from inheriting
        // the permissive ProgramData ACL, and replaces it with ours.
        rc = SetNamedSecurityInfoA((LPSTR)path.c_str(),
                                   SE_FILE_OBJECT,
                                   DACL_SECURITY_INFORMATION | PROTECTED_DACL_SECURITY_INFORMATION,
                                   NULL, NULL, newAcl, NULL);
        ok = (rc == ERROR_SUCCESS);
        if (!ok && error) *error = "SetNamedSecurityInfoA failed";
        LocalFree(newAcl);
    } else if (error) {
        *error = "SetEntriesInAclA failed";
    }

    LocalFree(systemSid);
    LocalFree(adminSid);
    return ok;
}

// Reads back the effective ACL as SDDL (diagnostics / tests).
inline std::string ReadSddl(const std::string& path) {
    PACL dacl = NULL;
    PSECURITY_DESCRIPTOR psd = NULL;
    std::string out;
    if (GetNamedSecurityInfoA((LPSTR)path.c_str(), SE_FILE_OBJECT, DACL_SECURITY_INFORMATION,
                              NULL, NULL, &dacl, NULL, &psd) == ERROR_SUCCESS && psd) {
        LPSTR sddl = NULL;
        if (ConvertSecurityDescriptorToStringSecurityDescriptorA(
                psd, SDDL_REVISION_1, DACL_SECURITY_INFORMATION, &sddl, NULL) && sddl) {
            out = sddl;
            LocalFree(sddl);
        }
        LocalFree(psd);
    }
    return out;
}

} // namespace ProgramDataAcl
