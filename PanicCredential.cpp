#include "PanicCredential.h"
#include "guid.h"
#include <ntsecapi.h>
#include <strsafe.h>

CPanicCredential::CPanicCredential() : _cRef(1), _pcpce(nullptr), _autoLogon(FALSE) {}
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
    if (_password.empty()) return E_UNEXPECTED;

    // Get current username
    WCHAR szUser[256] = {0};
    DWORD dwUserLen = 256;
    GetUserNameW(szUser, &dwUserLen);

    // Get computer name as domain for local accounts
    WCHAR szDomain[256] = {0};
    DWORD dwDomainLen = 256;
    GetComputerNameW(szDomain, &dwDomainLen);

    // Calculate sizes
    DWORD cbDomain   = (DWORD)(wcslen(szDomain) * sizeof(WCHAR));
    DWORD cbUser     = (DWORD)(wcslen(szUser) * sizeof(WCHAR));
    DWORD cbPassword = (DWORD)(_password.length() * sizeof(WCHAR));

    // Total buffer = struct + string data
    DWORD cbStruct   = sizeof(KERB_INTERACTIVE_UNLOCK_LOGON);
    DWORD cbTotal    = cbStruct + cbDomain + cbUser + cbPassword;

    BYTE* pBuffer = (BYTE*)CoTaskMemAlloc(cbTotal);
    if (!pBuffer) return E_OUTOFMEMORY;
    ZeroMemory(pBuffer, cbTotal);

    KERB_INTERACTIVE_UNLOCK_LOGON* pLogon = (KERB_INTERACTIVE_UNLOCK_LOGON*)pBuffer;
    pLogon->Logon.MessageType = KerbInteractiveLogon;

    BYTE* pData = pBuffer + cbStruct;

    // Domain
    pLogon->Logon.LogonDomainName.Length        = (USHORT)cbDomain;
    pLogon->Logon.LogonDomainName.MaximumLength = (USHORT)cbDomain;
    pLogon->Logon.LogonDomainName.Buffer        = cbDomain ? (PWSTR)(pData - pBuffer) : nullptr;
    memcpy(pData, szDomain, cbDomain);
    pData += cbDomain;

    // Username
    pLogon->Logon.UserName.Length        = (USHORT)cbUser;
    pLogon->Logon.UserName.MaximumLength = (USHORT)cbUser;
    pLogon->Logon.UserName.Buffer        = (PWSTR)(pData - pBuffer);
    memcpy(pData, szUser, cbUser);
    pData += cbUser;

    // Password
    pLogon->Logon.Password.Length        = (USHORT)cbPassword;
    pLogon->Logon.Password.MaximumLength = (USHORT)cbPassword;
    pLogon->Logon.Password.Buffer        = (PWSTR)(pData - pBuffer);
    memcpy(pData, _password.c_str(), cbPassword);

    // Get the Negotiate auth package
    ULONG authPackage = 0;
    HANDLE hLsa = NULL;
    LSA_STRING lsaName;
    lsaName.Buffer        = (PCHAR)"Negotiate";
    lsaName.Length        = 9;
    lsaName.MaximumLength = 10;
    if (LsaConnectUntrusted(&hLsa) == 0) {
        LsaLookupAuthenticationPackage(hLsa, &lsaName, &authPackage);
        LsaDeregisterLogonProcess(hLsa);
    }

    pcpcs->clsidCredentialProvider  = CLSID_PanicProvider;
    pcpcs->rgbSerialization          = pBuffer;
    pcpcs->cbSerialization           = cbTotal;
    pcpcs->ulAuthenticationPackage   = authPackage;
    *pcpgsr = CPGSR_RETURN_CREDENTIAL_FINISHED;

    return S_OK;
}

void CPanicCredential::SetPassword(const std::wstring& password) {
    _password = password;
}

void CPanicCredential::TriggerLogon() {
    _autoLogon = TRUE;
}
