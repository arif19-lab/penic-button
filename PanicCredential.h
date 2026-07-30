#pragma once
#include <credentialprovider.h>
#include <windows.h>
#include <string>

class CPanicCredential : public ICredentialProviderCredential
{
public:
    CPanicCredential();
    ~CPanicCredential();

    // IUnknown
    IFACEMETHODIMP QueryInterface(REFIID riid, void** ppv);
    IFACEMETHODIMP_(ULONG) AddRef();
    IFACEMETHODIMP_(ULONG) Release();

    // ICredentialProviderCredential
    IFACEMETHODIMP Advise(ICredentialProviderCredentialEvents* pcpce);
    IFACEMETHODIMP UnAdvise();
    IFACEMETHODIMP SetSelected(BOOL *pbAutoLogon);
    IFACEMETHODIMP SetDeselected();
    IFACEMETHODIMP GetFieldState(DWORD dwFieldID, CREDENTIAL_PROVIDER_FIELD_STATE* pcpfs, CREDENTIAL_PROVIDER_FIELD_INTERACTIVE_STATE* pcpfis);
    IFACEMETHODIMP GetStringValue(DWORD dwFieldID, PWSTR* ppsz);
    IFACEMETHODIMP GetBitmapValue(DWORD dwFieldID, HBITMAP* phbmp);
    IFACEMETHODIMP GetCheckboxValue(DWORD dwFieldID, BOOL* pbChecked, PWSTR* ppszLabel);
    IFACEMETHODIMP GetSubmitButtonValue(DWORD dwFieldID, DWORD* pdwAdjacentTo);
    IFACEMETHODIMP GetComboBoxValueCount(DWORD dwFieldID, DWORD* pcItems, DWORD* pdwComboBoxDefault);
    IFACEMETHODIMP GetComboBoxValueAt(DWORD dwFieldID, DWORD dwItem, PWSTR* ppszItem);
    IFACEMETHODIMP SetStringValue(DWORD dwFieldID, PCWSTR psz);
    IFACEMETHODIMP SetCheckboxValue(DWORD dwFieldID, BOOL bChecked);
    IFACEMETHODIMP SetComboBoxSelectedValue(DWORD dwFieldID, DWORD dwSelectedItem);
    IFACEMETHODIMP CommandLinkClicked(DWORD dwFieldID);
    IFACEMETHODIMP GetSerialization(CREDENTIAL_PROVIDER_GET_SERIALIZATION_RESPONSE* pcpgsr, CREDENTIAL_PROVIDER_CREDENTIAL_SERIALIZATION* pcpcs, PWSTR* ppszOptionalStatusText, CREDENTIAL_PROVIDER_STATUS_ICON* pcpsiOptionalStatusIcon);
    IFACEMETHODIMP ReportResult(NTSTATUS ntsReason, NTSTATUS ntsSubreason, PWSTR* ppszOptionalStatusText, CREDENTIAL_PROVIDER_STATUS_ICON* pcpsiOptionalStatusIcon);

    void SetPassword(const std::wstring& password);
    void TriggerLogon();

private:
    LONG _cRef;
    ICredentialProviderCredentialEvents* _pcpce;
    std::wstring _password;
    BOOL _autoLogon;
};
