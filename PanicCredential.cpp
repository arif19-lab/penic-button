#include "PanicCredential.h"
#include "guid.h"
#include <ntsecapi.h>
#include <strsafe.h>
#include <stdio.h>

static void CredLog(const char* msg) {
    FILE* f = fopen("C:\\Users\\Public\\panic_debug.txt", "a");
    if (f) { fprintf(f, "%s\n", msg); fclose(f); }
}

CPanicCredential::CPanicCredential() : _cRef(1), _pcpce(nullptr), _autoLogon(FALSE), _cpus(CPUS_INVALID), _hasPendingUnlock(FALSE) {}
CPanicCredential::~CPanicCredential() { if (_pcpce) _pcpce->Release(); }

IFACEMETHODIMP CPanicCredential::QueryInterface(REFIID riid, void** ppv) {
    if (riid == IID_IUnknown || riid == IID_ICredentialProviderCredential) {
        *ppv = this;
        AddRef();
        return S_OK;
    }
    *ppv = nullptr;
    return E_NOINTERFACE;
}
IFACEMETHODIMP_(ULONG) CPanicCredential::AddRef() { return InterlockedIncrement(&_cRef); }
IFACEMETHODIMP_(ULONG) CPanicCredential::Release() {
    LONG cRef = InterlockedDecrement(&_cRef);
    if (!cRef) delete this;
    return cRef;
}

IFACEMETHODIMP CPanicCredential::Advise(ICredentialProviderCredentialEvents* pcpce) {
    if (_pcpce) _pcpce->Release();
    _pcpce = pcpce;
    if (_pcpce) _pcpce->AddRef();
    return S_OK;
}
IFACEMETHODIMP CPanicCredential::UnAdvise() {
    if (_pcpce) { _pcpce->Release(); _pcpce = nullptr; }
    return S_OK;
}
IFACEMETHODIMP CPanicCredential::SetSelected(BOOL *pbAutoLogon) {
    *pbAutoLogon = _autoLogon;
    return S_OK;
}
IFACEMETHODIMP CPanicCredential::SetDeselected() {
    _autoLogon = FALSE;
    return S_OK;
}
IFACEMETHODIMP CPanicCredential::GetFieldState(DWORD dwFieldID, CREDENTIAL_PROVIDER_FIELD_STATE* pcpfs, CREDENTIAL_PROVIDER_FIELD_INTERACTIVE_STATE* pcpfis) {
    *pcpfs = CPFS_HIDDEN;
    *pcpfis = CPFIS_NONE;
    return S_OK;
}
IFACEMETHODIMP CPanicCredential::GetStringValue(DWORD, PWSTR*) { return E_NOTIMPL; }
IFACEMETHODIMP CPanicCredential::GetBitmapValue(DWORD, HBITMAP*) { return E_NOTIMPL; }
IFACEMETHODIMP CPanicCredential::GetCheckboxValue(DWORD, BOOL*, PWSTR*) { return E_NOTIMPL; }
IFACEMETHODIMP CPanicCredential::GetSubmitButtonValue(DWORD, DWORD*) { return E_NOTIMPL; }
IFACEMETHODIMP CPanicCredential::GetComboBoxValueCount(DWORD, DWORD*, DWORD*) { return E_NOTIMPL; }
IFACEMETHODIMP CPanicCredential::GetComboBoxValueAt(DWORD, DWORD, PWSTR*) { return E_NOTIMPL; }
IFACEMETHODIMP CPanicCredential::SetStringValue(DWORD, PCWSTR) { return S_OK; }
IFACEMETHODIMP CPanicCredential::SetCheckboxValue(DWORD, BOOL) { return S_OK; }
IFACEMETHODIMP CPanicCredential::SetComboBoxSelectedValue(DWORD, DWORD) { return S_OK; }
IFACEMETHODIMP CPanicCredential::CommandLinkClicked(DWORD) { return S_OK; }
IFACEMETHODIMP CPanicCredential::ReportResult(NTSTATUS, NTSTATUS, PWSTR*, CREDENTIAL_PROVIDER_STATUS_ICON*) { return S_OK; }

IFACEMETHODIMP CPanicCredential::GetSerialization(
    CREDENTIAL_PROVIDER_GET_SERIALIZATION_RESPONSE* pcpgsr,
    CREDENTIAL_PROVIDER_CREDENTIAL_SERIALIZATION* pcpcs,
    PWSTR*, CREDENTIAL_PROVIDER_STATUS_ICON*)
{
    CredLog("[GETSERIALIZATION] Called!");
    if (_password.empty()) { CredLog("[GETSERIALIZATION] ERROR: password is empty!"); return E_UNEXPECTED; }

    // CRITICAL FIX: GetUserNameW in SYSTEM context returns "SYSTEM", not the real user!
    // Must read the actual logged-in user from registry (Winlogon stores this)
    WCHAR szUser[256] = {0};
    WCHAR szDomain[256] = {0};

    HKEY hKey;
    // Try LogonUI registry key first (most reliable for lock screen)
    if (RegOpenKeyExW(HKEY_LOCAL_MACHINE,
        L"SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Authentication\\LogonUI",
        0, KEY_READ, &hKey) == ERROR_SUCCESS) {
        DWORD cbData = sizeof(szUser);
        RegQueryValueExW(hKey, L"LastLoggedOnUser", NULL, NULL, (LPBYTE)szUser, &cbData);
        RegCloseKey(hKey);
        CredLog("[GETSERIALIZATION] Got user from LogonUI registry");
    }

    // szUser might be "DOMAIN\User" or ".\User" format - split it
    WCHAR* backslash = wcschr(szUser, L'\\');
    if (backslash) {
        DWORD domLen = (DWORD)(backslash - szUser);
        wcsncpy(szDomain, szUser, domLen);
        szDomain[domLen] = L'\0';
        WCHAR szUserTemp[256] = {0};
        wcscpy(szUserTemp, backslash + 1);
        wcscpy(szUser, szUserTemp);
    }

    // If domain is "." or empty, replace with actual computer name
    if (szDomain[0] == L'\0' || (szDomain[0] == L'.' && szDomain[1] == L'\0')) {
        DWORD dwDomainLen = 256;
        GetComputerNameW(szDomain, &dwDomainLen);
        CredLog("[GETSERIALIZATION] Domain was '.' - replaced with ComputerName");
    }

    // Log what we're using
    char logbuf[512];
    char userA[128] = {0}, domainA[128] = {0};
    WideCharToMultiByte(CP_UTF8, 0, szUser, -1, userA, 128, NULL, NULL);
    WideCharToMultiByte(CP_UTF8, 0, szDomain, -1, domainA, 128, NULL, NULL);
    sprintf(logbuf, "[GETSERIALIZATION] Using user='%s' domain='%s'", userA, domainA);
    CredLog(logbuf);

    DWORD cbDomain   = (DWORD)(wcslen(szDomain) * sizeof(WCHAR));
    DWORD cbUser     = (DWORD)(wcslen(szUser)   * sizeof(WCHAR));
    DWORD cbPassword = (DWORD)(_password.length() * sizeof(WCHAR));

    DWORD cbStruct = sizeof(KERB_INTERACTIVE_UNLOCK_LOGON);
    DWORD cbTotal  = cbStruct + cbDomain + cbUser + cbPassword;

    BYTE* pBuffer = (BYTE*)CoTaskMemAlloc(cbTotal);
    if (!pBuffer) { CredLog("[GETSERIALIZATION] ERROR: CoTaskMemAlloc failed!"); return E_OUTOFMEMORY; }
    ZeroMemory(pBuffer, cbTotal);

    KERB_INTERACTIVE_UNLOCK_LOGON* pLogon = (KERB_INTERACTIVE_UNLOCK_LOGON*)pBuffer;

    // Use correct MessageType based on usage scenario
    // CPUS_LOGON=1 -> KerbInteractiveLogon
    // CPUS_UNLOCK_WORKSTATION=2 -> KerbWorkstationUnlockLogon
    if (_cpus == CPUS_UNLOCK_WORKSTATION) {
        pLogon->Logon.MessageType = KerbWorkstationUnlockLogon;
        CredLog("[GETSERIALIZATION] MessageType = KerbWorkstationUnlockLogon");
    } else {
        pLogon->Logon.MessageType = KerbInteractiveLogon;
        CredLog("[GETSERIALIZATION] MessageType = KerbInteractiveLogon");
    }

    BYTE* pData = pBuffer + cbStruct;

    // CRITICAL: Buffer pointers must be OFFSETS from start of buffer (LSA does fixup)
    pLogon->Logon.LogonDomainName.Length        = (USHORT)cbDomain;
    pLogon->Logon.LogonDomainName.MaximumLength = (USHORT)cbDomain;
    pLogon->Logon.LogonDomainName.Buffer        = cbDomain ? (PWSTR)(pData - pBuffer) : nullptr;
    CopyMemory(pData, szDomain, cbDomain);
    pData += cbDomain;

    pLogon->Logon.UserName.Length        = (USHORT)cbUser;
    pLogon->Logon.UserName.MaximumLength = (USHORT)cbUser;
    pLogon->Logon.UserName.Buffer        = (PWSTR)(pData - pBuffer);
    CopyMemory(pData, szUser, cbUser);
    pData += cbUser;

    pLogon->Logon.Password.Length        = (USHORT)cbPassword;
    pLogon->Logon.Password.MaximumLength = (USHORT)cbPassword;
    pLogon->Logon.Password.Buffer        = (PWSTR)(pData - pBuffer);
    CopyMemory(pData, _password.c_str(), cbPassword);

    // Get Negotiate/MSV1_0 auth package
    // LogonUI runs as SYSTEM with SeTcbPrivilege, so use LsaRegisterLogonProcess
    ULONG authPackage = 10; // MSV1_0 default fallback
    HANDLE hLsa = NULL;
    LSA_STRING processName;
    processName.Buffer        = (PCHAR)"PanicProvider";
    processName.Length        = 13;
    processName.MaximumLength = 14;
    LSA_OPERATIONAL_MODE mode = 0;
    if (LsaRegisterLogonProcess(&processName, &hLsa, &mode) == 0) {
        LSA_STRING lsaName;
        lsaName.Buffer        = (PCHAR)"Negotiate";
        lsaName.Length        = 9;
        lsaName.MaximumLength = 10;
        LsaLookupAuthenticationPackage(hLsa, &lsaName, &authPackage);
        LsaDeregisterLogonProcess(hLsa);
        CredLog("[GETSERIALIZATION] LsaRegisterLogonProcess OK");
    } else {
        // Fallback: try LsaConnectUntrusted
        if (LsaConnectUntrusted(&hLsa) == 0) {
            LSA_STRING lsaName;
            lsaName.Buffer        = (PCHAR)"Negotiate";
            lsaName.Length        = 9;
            lsaName.MaximumLength = 10;
            LsaLookupAuthenticationPackage(hLsa, &lsaName, &authPackage);
            LsaDeregisterLogonProcess(hLsa);
            CredLog("[GETSERIALIZATION] LsaConnectUntrusted fallback OK");
        } else {
            CredLog("[GETSERIALIZATION] WARNING: Using hardcoded authPackage=10 (MSV1_0)");
        }
    }
    char abuf[64]; sprintf(abuf, "[GETSERIALIZATION] authPackage=%lu cpus=%d", authPackage, (int)_cpus);
    CredLog(abuf);

    pcpcs->clsidCredentialProvider = CLSID_PanicProvider;
    pcpcs->rgbSerialization         = pBuffer;
    pcpcs->cbSerialization          = cbTotal;
    pcpcs->ulAuthenticationPackage  = authPackage;
    *pcpgsr = CPGSR_RETURN_CREDENTIAL_FINISHED;

    CredLog("[GETSERIALIZATION] Done - S_OK");
    return S_OK;
}

void CPanicCredential::SetUsageScenario(CREDENTIAL_PROVIDER_USAGE_SCENARIO cpus) {
    _cpus = cpus;
}

void CPanicCredential::SetPassword(const std::wstring& password) {
    _password = password;
}

void CPanicCredential::TriggerLogon() {
    _autoLogon = TRUE;
    _hasPendingUnlock = TRUE;
}
