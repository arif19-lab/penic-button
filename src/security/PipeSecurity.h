// ============================================================================
// PipeSecurity.h - the ONE definition of the security descriptor used for
//                  \\.\pipe\PanicUnlockPipe
// ============================================================================
//
// The pipe used to be created with a NULL DACL, which grants FULL access to
// everyone - including unprivileged local users.  That made it a local
// password-guessing oracle: any bytes written to the pipe are submitted to
// LogonUI as the victim's real Windows credential.
//
// The descriptor built here allows exactly the two principals that legitimately
// talk to the pipe:
//
//     NT AUTHORITY\SYSTEM          (PanicService.exe, the Session-0 watchdog;
//                                   also the account LogonUI.exe runs as)
//     BUILTIN\Administrators       (PanicButton.exe, which runs elevated)
//
// Every other principal - including NETWORK SERVICE, INTERACTIVE, Users,
// Everyone and all network logons - receives no access at all.
//
// Using fixed, well-known SIDs (rather than the process token or a name lookup)
// keeps the result identical on every host and independent of locale.
//
// The buffer is static so the DACL pointer stays valid for the lifetime of the
// SECURITY_ATTRIBUTES that wraps it.
// ============================================================================
#pragma once

#include <windows.h>
#include <sddl.h>

namespace PipeSecurity {

static const DWORD WRITE_ACCESS = FILE_GENERIC_WRITE | SYNCHRONIZE;

// Well-known SIDs.
static const char* SID_SYSTEM = "S-1-5-18";       // NT AUTHORITY\SYSTEM
static const char* SID_ADMIN  = "S-1-5-32-544";   // BUILTIN\Administrators

class RestrictedDescriptor {
public:
    RestrictedDescriptor() : m_ok(false), m_aclSize(0) {
        SECURITY_DESCRIPTOR sd;
        if (!InitializeSecurityDescriptor(&sd, SECURITY_DESCRIPTOR_REVISION)) return;

        PSID systemSid = NULL;
        PSID adminSid  = NULL;
        if (!ConvertStringSidToSidA(SID_SYSTEM, &systemSid)) return;
        if (!ConvertStringSidToSidA(SID_ADMIN, &adminSid)) { LocalFree(systemSid); return; }

        m_aclSize = sizeof(ACL)
                  + (sizeof(ACCESS_ALLOWED_ACE) - sizeof(DWORD)) + GetLengthSid(systemSid)
                  + (sizeof(ACCESS_ALLOWED_ACE) - sizeof(DWORD)) + GetLengthSid(adminSid);

        if (m_aclSize > sizeof(m_aclBuf)) {
            LocalFree(systemSid); LocalFree(adminSid);
            return;
        }

        PACL dacl = (PACL)m_aclBuf;
        if (!InitializeAcl(dacl, (WORD)m_aclSize, ACL_REVISION)) {
            LocalFree(systemSid); LocalFree(adminSid);
            return;
        }

        bool ok = AddAccessAllowedAce(dacl, ACL_REVISION, WRITE_ACCESS, systemSid)
               && AddAccessAllowedAce(dacl, ACL_REVISION, WRITE_ACCESS, adminSid);

        LocalFree(systemSid);
        LocalFree(adminSid);

        if (!ok) return;
        if (!SetSecurityDescriptorDacl(&sd, TRUE, dacl, FALSE)) return;

        m_sd = sd;
        m_sa.nLength = sizeof(SECURITY_ATTRIBUTES);
        m_sa.lpSecurityDescriptor = &m_sd;
        m_sa.bInheritHandle = FALSE;
        m_ok = true;
    }

    bool Ok() const { return m_ok; }
    const SECURITY_ATTRIBUTES* Attributes() const { return m_ok ? &m_sa : NULL; }

    // SDDL for diagnostics/tests, e.g.
    //   O:SYD:PAI(D;;FA;;;SY)(D;;FA;;;BA)
    std::string Sddl() const;

private:
    bool m_ok;
    DWORD m_aclSize;
    BYTE m_aclBuf[256];
    SECURITY_DESCRIPTOR m_sd;
    SECURITY_ATTRIBUTES m_sa;
};

// Kept out of line so the header stays free of <string> for its main users.
inline std::string RestrictedDescriptor::Sddl() const {
    if (!m_ok) return "<none>";
    LPSTR s = NULL;
    if (!ConvertSecurityDescriptorToStringSecurityDescriptorA(
            &m_sd, SDDL_REVISION_1,
            OWNER_SECURITY_INFORMATION | GROUP_SECURITY_INFORMATION | DACL_SECURITY_INFORMATION,
            &s, NULL)) {
        return "<error>";
    }
    std::string out = (s ? s : "");
    if (s) LocalFree(s);
    return out;
}

// The single instance used by the credential provider.
inline const RestrictedDescriptor& Pipe() {
    static RestrictedDescriptor instance;
    return instance;
}

} // namespace PipeSecurity