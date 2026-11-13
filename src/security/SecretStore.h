// ============================================================================
// SecretStore.h - DPAPI protection for on-disk secrets
// ============================================================================
//
// PANIC CTRL stores two machine secrets on disk:
//
//   saved_pin.dat   the Windows account password, used for one-tap unlock
//   gemini_key.txt  the Google Gemini API key
//
// Both used to be written as PLAINTEXT into
// C:\ProgramData\PanicButton, and that folder was additionally granted
// "Full Control" to the whole "Users" group - so any local user could read
// the victim's Windows password and the Gemini key.
//
// The secrets are now encrypted with the Windows Data Protection API
// (CryptProtectData).  The scope is CRYPTPROTECT_LOCAL_MACHINE because the
// store is a MACHINE credential store shared by several legitimate processes
// (the agent runs elevated as the interactive user, the Session-0 service runs
// as SYSTEM).  Confidentiality therefore comes from two independent layers:
//
//   1. the file ACL  -> only SYSTEM / Administrators / the interactive user
//      can open the file at all   (see ProgramDataAcl.h)
//   2. the DPAPI blob -> the file on disk is ciphertext; the plaintext only
//      exists in memory while the process runs
//
// An administrator can still decrypt the blob (they can impersonate the
// machine), which is inherent to LOCAL_MACHINE scope and acceptable here:
// the threat being addressed is an UNPRIVILEGED local user reading the file.
//
// BACKWARD COMPATIBILITY
// ----------------------
// Files written by an older release are plain text.  LoadSecret() detects
// that (no magic header) and returns the legacy value with wasLegacy=true so
// the caller can transparently re-save it in the protected format.  Nothing
// is lost and no re-pairing is required.
// ============================================================================
#pragma once

#include <windows.h>
#include <wincrypt.h>

#include <string>
#include <vector>

namespace SecretStore {

// Magic prefix identifying a DPAPI-protected blob.
static const char  MAGIC[]     = "PCSEC1";
static const size_t MAGIC_LEN  = 6;

inline bool IsProtected(const std::string& blob) {
    return blob.size() > MAGIC_LEN &&
           blob.compare(0, MAGIC_LEN, MAGIC, MAGIC_LEN) == 0;
}

// Encrypt with DPAPI.  Returns false only if the OS refuses.
inline bool Protect(const std::string& plaintext, std::string& out) {
    DATA_BLOB in;
    in.pbData = (BYTE*)(plaintext.empty() ? (BYTE*)"" : (BYTE*)plaintext.data());
    in.cbData = (DWORD)plaintext.size();

    DATA_BLOB enc;
    if (!CryptProtectData(&in, L"PANIC CTRL secret", NULL, NULL, NULL,
                          CRYPTPROTECT_LOCAL_MACHINE | CRYPTPROTECT_UI_FORBIDDEN, &enc)) {
        return false;
    }
    out.assign(MAGIC, MAGIC_LEN);
    out.append((const char*)enc.pbData, enc.cbData);
    LocalFree(enc.pbData);
    return true;
}

// Decrypt a protected blob.  Returns false for a legacy (plaintext) input.
inline bool Unprotect(const std::string& blob, std::string& out) {
    if (!IsProtected(blob)) return false;

    DATA_BLOB in;
    in.pbData = (BYTE*)(blob.data() + MAGIC_LEN);
    in.cbData = (DWORD)(blob.size() - MAGIC_LEN);

    DATA_BLOB dec;
    if (!CryptUnprotectData(&in, NULL, NULL, NULL, NULL, CRYPTPROTECT_UI_FORBIDDEN, &dec)) {
        return false;
    }
    out.assign((const char*)dec.pbData, dec.cbData);
    LocalFree(dec.pbData);
    return true;
}

// ---- raw file helpers -----------------------------------------------------
inline bool ReadRaw(const std::string& path, std::string& out) {
    HANDLE h = CreateFileA(path.c_str(), GENERIC_READ,
                           FILE_SHARE_READ | FILE_SHARE_WRITE, NULL,
                           OPEN_EXISTING, FILE_ATTRIBUTE_NORMAL, NULL);
    if (h == INVALID_HANDLE_VALUE) return false;
    std::string data;
    char buf[4096];
    DWORD got = 0;
    while (ReadFile(h, buf, sizeof(buf), &got, NULL) && got > 0) {
        data.append(buf, got);
    }
    CloseHandle(h);
    out.swap(data);
    return true;
}

// Atomic write: temp file + rename, so a reader never sees a half-written
// secret.
inline bool WriteRawAtomic(const std::string& path, const std::string& data) {
    std::string tmp = path + ".tmp";
    HANDLE h = CreateFileA(tmp.c_str(), GENERIC_WRITE, 0, NULL,
                           CREATE_ALWAYS, FILE_ATTRIBUTE_NORMAL, NULL);
    if (h == INVALID_HANDLE_VALUE) return false;
    DWORD written = 0;
    BOOL ok = WriteFile(h, data.data(), (DWORD)data.size(), &written, NULL);
    if (ok) ok = (written == data.size());
    CloseHandle(h);
    if (!ok) { DeleteFileA(tmp.c_str()); return false; }
    if (!MoveFileExA(tmp.c_str(), path.c_str(),
                    MOVEFILE_REPLACE_EXISTING | MOVEFILE_WRITE_THROUGH)) {
        DeleteFileA(tmp.c_str());
        return false;
    }
    return true;
}

// ---- secret level helpers -------------------------------------------------
// Loads a secret, transparently accepting a legacy plaintext file.
//   returns true  -> out holds the plaintext secret
//   wasLegacy     -> true when the file was found unencrypted (caller should
//                    re-save it with SaveSecret to migrate it)
inline bool LoadSecret(const std::string& path, std::string& out, bool* wasLegacy = NULL) {
    if (wasLegacy) *wasLegacy = false;
    std::string raw;
    if (!ReadRaw(path, raw)) return false;
    if (raw.empty()) return false;

    if (IsProtected(raw)) {
        return Unprotect(raw, out);
    }
    // Legacy plaintext file.
    if (wasLegacy) *wasLegacy = true;
    out = raw;
    // Trim a single trailing newline the old writers appended.
    while (!out.empty() && (out.back() == '\r' || out.back() == '\n')) out.pop_back();
    return !out.empty();
}

// Saves a secret encrypted.  Returns false if the secret could not be
// encrypted (in that case nothing is written, so a plaintext secret is never
// left behind).
inline bool SaveSecret(const std::string& path, const std::string& plaintext) {
    std::string blob;
    if (!Protect(plaintext, blob)) return false;
    return WriteRawAtomic(path, blob);
}

// True when the file exists (used for "has saved pin" reporting).
inline bool SecretExists(const std::string& path) {
    return GetFileAttributesA(path.c_str()) != INVALID_FILE_ATTRIBUTES;
}

} // namespace SecretStore
