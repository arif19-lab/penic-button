#include "PanicCredential.h"
#include "guid.h"
#include <ntsecapi.h>
#include <strsafe.h>

#ifndef KERB_INTERACTIVE_UNLOCK_LOGON
#define KERB_INTERACTIVE_UNLOCK_LOGON 13
#endif

#pragma pack(push, 1)
struct KERB_INTERACTIVE_UNLOCK_LOGON_PACK {
    KERB_LOGON_SUBMIT_TYPE MessageType;
    UNICODE_STRING LogonDomainName;
    UNICODE_STRING UserName;
    UNICODE_STRING Password;
};
#pragma pack(pop)

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
    
    WCHAR szUser[256];
    DWORD dwUserLen = 256;
    GetUserNameW(szUser, &dwUserLen);

    WCHAR szDomain[256];
    szDomain[0] = L'\0'; 

    DWORD cbStruct = sizeof(KERB_INTERACTIVE_UNLOCK_LOGON_PACK);
    DWORD cbDomain = (DWORD)(wcslen(szDomain) * sizeof(WCHAR));
    DWORD cbUser = (DWORD)(wcslen(szUser) * sizeof(WCHAR));
    DWORD cbPassword = (DWORD)(_password.length() * sizeof(WCHAR));
    
    DWORD cbTotal = cbStruct + cbDomain + cbUser + cbPassword;
    BYTE* pBuffer = (BYTE*)CoTaskMemAlloc(cbTotal);
    if (!pBuffer) return E_OUTOFMEMORY;
    
    ZeroMemory(pBuffer, cbTotal);
    KERB_INTERACTIVE_UNLOCK_LOGON_PACK* pLogon = (KERB_INTERACTIVE_UNLOCK_LOGON_PACK*)pBuffer;
    pLogon->MessageType = (KERB_LOGON_SUBMIT_TYPE)KERB_INTERACTIVE_UNLOCK_LOGON;
    
    BYTE* pData = pBuffer + cbStruct;
    
    pLogon->LogonDomainName.Length = (USHORT)cbDomain;
    pLogon->LogonDomainName.MaximumLength = (USHORT)cbDomain;
    pLogon->LogonDomainName.Buffer = (PWSTR)pData;
    memcpy(pData, szDomain, cbDomain);
    pData += cbDomain;
    
    pLogon->UserName.Length = (USHORT)cbUser;
    pLogon->UserName.MaximumLength = (USHORT)cbUser;
    pLogon->UserName.Buffer = (PWSTR)pData;
    memcpy(pData, szUser, cbUser);
    pData += cbUser;
    
    pLogon->Password.Length = (USHORT)cbPassword;
    pLogon->Password.MaximumLength = (USHORT)cbPassword;
    pLogon->Password.Buffer = (PWSTR)pData;
    memcpy(pData, _password.c_str(), cbPassword);
    
    pcpcs->clsidCredentialProvider = CLSID_PanicProvider;
    pcpcs->cbSerialization = cbTotal;
    pcpcs->rgbSerialization = pBuffer;
    
    ULONG authPackage = 0;
    HANDLE hLsa;
    LSA_STRING name;
    name.Buffer = (PCHAR)"Negotiate";
    name.Length = 9;
    name.MaximumLength = 10;
    if (LsaConnectUntrusted(&hLsa) == 0) {
        LsaLookupAuthenticationPackage(hLsa, &name, &authPackage);
        LsaDeregisterLogonProcess(hLsa);
    }
    
    pcpcs->ulAuthenticationPackage = authPackage;
    *pcpgsr = CPGSR_RETURN_CREDENTIAL_FINISHED;
    
    return S_OK;
}

void CPanicCredential::SetPassword(const std::wstring& password) {
    _password = password;
}

void CPanicCredential::TriggerLogon() {
    _autoLogon = TRUE;
}
