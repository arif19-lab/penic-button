#pragma once
#include <credentialprovider.h>
#include <windows.h>

class CPanicCredential;

class CPanicProvider : public ICredentialProvider
{
public:
    CPanicProvider();
    ~CPanicProvider();

    // IUnknown
    IFACEMETHODIMP QueryInterface(REFIID riid, void** ppv);
    IFACEMETHODIMP_(ULONG) AddRef();
    IFACEMETHODIMP_(ULONG) Release();

    // ICredentialProvider
    IFACEMETHODIMP SetUsageScenario(CREDENTIAL_PROVIDER_USAGE_SCENARIO cpus, DWORD dwFlags);
    IFACEMETHODIMP SetSerialization(const CREDENTIAL_PROVIDER_CREDENTIAL_SERIALIZATION* pcpcs);
    IFACEMETHODIMP Advise(ICredentialProviderEvents* pcpe, UINT_PTR upAdviseContext);
    IFACEMETHODIMP UnAdvise();
    IFACEMETHODIMP GetFieldDescriptorCount(DWORD* pdwCount);
    IFACEMETHODIMP GetFieldDescriptorAt(DWORD dwIndex, CREDENTIAL_PROVIDER_FIELD_DESCRIPTOR** ppcpfd);
    IFACEMETHODIMP GetCredentialCount(DWORD* pdwCount, DWORD* pdwDefault, BOOL* pbAutoLogonWithDefault);
    IFACEMETHODIMP GetCredentialAt(DWORD dwIndex, ICredentialProviderCredential** ppcpc);

    static DWORD WINAPI PipeThreadProc(LPVOID lpParam);

private:
    LONG _cRef;
    CPanicCredential* _pCredential;
    ICredentialProviderEvents* _pcpe;
    UINT_PTR _upAdviseContext;
    HANDLE _hThread;
    HANDLE _hStopEvent;
};
