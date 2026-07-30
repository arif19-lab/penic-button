#include "PanicProvider.h"
#include "PanicCredential.h"
#include "guid.h"
#include <shlwapi.h>

long g_cRefModule = 0;

CPanicProvider::CPanicProvider() : _cRef(1), _pCredential(nullptr), _pcpe(nullptr), _upAdviseContext(0), _hThread(NULL), _hStopEvent(NULL) {
    InterlockedIncrement(&g_cRefModule);
}

CPanicProvider::~CPanicProvider() {
    if (_hStopEvent) {
        SetEvent(_hStopEvent);
        if (_hThread) {
            WaitForSingleObject(_hThread, INFINITE);
            CloseHandle(_hThread);
        }
        CloseHandle(_hStopEvent);
    }
    if (_pCredential) _pCredential->Release();
    if (_pcpe) _pcpe->Release();
    InterlockedDecrement(&g_cRefModule);
}

IFACEMETHODIMP CPanicProvider::QueryInterface(REFIID riid, void** ppv) {
    if (riid == IID_IUnknown || riid == IID_ICredentialProvider) {
        *ppv = this;
        AddRef();
        return S_OK;
    }
    *ppv = nullptr;
    return E_NOINTERFACE;
}
IFACEMETHODIMP_(ULONG) CPanicProvider::AddRef() { return InterlockedIncrement(&_cRef); }
IFACEMETHODIMP_(ULONG) CPanicProvider::Release() {
    LONG cRef = InterlockedDecrement(&_cRef);
    if (!cRef) delete this;
    return cRef;
}

IFACEMETHODIMP CPanicProvider::SetUsageScenario(CREDENTIAL_PROVIDER_USAGE_SCENARIO cpus, DWORD) {
    if (cpus == CPUS_LOGON || cpus == CPUS_UNLOCK_WORKSTATION) {
        if (!_pCredential) {
            _pCredential = new CPanicCredential();
        }
        
        if (!_hThread) {
            _hStopEvent = CreateEvent(NULL, TRUE, FALSE, NULL);
            _hThread = CreateThread(NULL, 0, PipeThreadProc, this, 0, NULL);
        }
        return S_OK;
    }
    return E_NOTIMPL;
}

IFACEMETHODIMP CPanicProvider::SetSerialization(const CREDENTIAL_PROVIDER_CREDENTIAL_SERIALIZATION*) {
    return E_NOTIMPL;
}

IFACEMETHODIMP CPanicProvider::Advise(ICredentialProviderEvents* pcpe, UINT_PTR upAdviseContext) {
    if (_pcpe) _pcpe->Release();
    _pcpe = pcpe;
    if (_pcpe) _pcpe->AddRef();
    _upAdviseContext = upAdviseContext;
    return S_OK;
}

IFACEMETHODIMP CPanicProvider::UnAdvise() {
    if (_pcpe) { _pcpe->Release(); _pcpe = nullptr; }
    return S_OK;
}

IFACEMETHODIMP CPanicProvider::GetFieldDescriptorCount(DWORD* pdwCount) {
    *pdwCount = 0; 
    return S_OK;
}

IFACEMETHODIMP CPanicProvider::GetFieldDescriptorAt(DWORD, CREDENTIAL_PROVIDER_FIELD_DESCRIPTOR**) {
    return E_NOTIMPL;
}

IFACEMETHODIMP CPanicProvider::GetCredentialCount(DWORD* pdwCount, DWORD* pdwDefault, BOOL* pbAutoLogonWithDefault) {
    *pdwCount = 1;
    *pdwDefault = 0;
    *pbAutoLogonWithDefault = FALSE;
    return S_OK;
}

IFACEMETHODIMP CPanicProvider::GetCredentialAt(DWORD dwIndex, ICredentialProviderCredential** ppcpc) {
    if (dwIndex != 0 || !_pCredential) return E_INVALIDARG;
    *ppcpc = _pCredential;
    (*ppcpc)->AddRef();
    return S_OK;
}

DWORD WINAPI CPanicProvider::PipeThreadProc(LPVOID lpParam) {
    CPanicProvider* pThis = (CPanicProvider*)lpParam;
    
    SECURITY_DESCRIPTOR sd;
    InitializeSecurityDescriptor(&sd, SECURITY_DESCRIPTOR_REVISION);
    SetSecurityDescriptorDacl(&sd, TRUE, NULL, FALSE);
    SECURITY_ATTRIBUTES sa;
    sa.nLength = sizeof(SECURITY_ATTRIBUTES);
    sa.lpSecurityDescriptor = &sd;
    sa.bInheritHandle = FALSE;

    while (WaitForSingleObject(pThis->_hStopEvent, 0) != WAIT_OBJECT_0) {
        HANDLE hPipe = CreateNamedPipeA(
            "\\\\.\\pipe\\PanicUnlockPipe",
            PIPE_ACCESS_INBOUND | FILE_FLAG_OVERLAPPED,
            PIPE_TYPE_MESSAGE | PIPE_READMODE_MESSAGE | PIPE_WAIT,
            1, 1024, 1024, 0, &sa);

        if (hPipe != INVALID_HANDLE_VALUE) {
            OVERLAPPED ol = {0};
            ol.hEvent = CreateEvent(NULL, TRUE, FALSE, NULL);
            BOOL bConnected = ConnectNamedPipe(hPipe, &ol) ? TRUE : (GetLastError() == ERROR_PIPE_CONNECTED);
            if (bConnected) {
                SetEvent(ol.hEvent);
            }
            
            HANDLE waitEvents[2] = { pThis->_hStopEvent, ol.hEvent };
            DWORD dwWait = WaitForMultipleObjects(2, waitEvents, FALSE, INFINITE);
            
            if (dwWait == WAIT_OBJECT_0 + 1) { 
                char buffer[256];
                DWORD dwRead = 0;
                OVERLAPPED olRead = {0};
                olRead.hEvent = CreateEvent(NULL, TRUE, FALSE, NULL);
                if (ReadFile(hPipe, buffer, sizeof(buffer) - 1, NULL, &olRead) || GetLastError() == ERROR_IO_PENDING) {
                    HANDLE readWaitEvents[2] = { pThis->_hStopEvent, olRead.hEvent };
                    if (WaitForMultipleObjects(2, readWaitEvents, FALSE, INFINITE) == WAIT_OBJECT_0 + 1) {
                        if (GetOverlappedResult(hPipe, &olRead, &dwRead, FALSE) && dwRead > 0) {
                            buffer[dwRead] = '\0';
                            
                            int wchars_num = MultiByteToWideChar(CP_UTF8, 0, buffer, -1, NULL, 0);
                            wchar_t* wstr = new wchar_t[wchars_num];
                            MultiByteToWideChar(CP_UTF8, 0, buffer, -1, wstr, wchars_num);
                            
                            // Ghost Keyboard Bypass!
                            // Wake up the password box
                            INPUT space[2] = {0};
                            space[0].type = INPUT_KEYBOARD; space[0].ki.wVk = VK_SPACE;
                            space[1].type = INPUT_KEYBOARD; space[1].ki.wVk = VK_SPACE; space[1].ki.dwFlags = KEYEVENTF_KEYUP;
                            SendInput(2, space, sizeof(INPUT));
                            
                            Sleep(500); // Wait for UI animation
                            
                            // Type password
                            for (int i = 0; i < wchars_num && wstr[i] != L'\0'; i++) {
                                INPUT inp[2] = {0};
                                inp[0].type = INPUT_KEYBOARD; inp[0].ki.wScan = wstr[i]; inp[0].ki.dwFlags = KEYEVENTF_UNICODE;
                                inp[1].type = INPUT_KEYBOARD; inp[1].ki.wScan = wstr[i]; inp[1].ki.dwFlags = KEYEVENTF_UNICODE | KEYEVENTF_KEYUP;
                                SendInput(2, inp, sizeof(INPUT));
                                Sleep(10);
                            }
                            
                            // Press Enter
                            INPUT enter[2] = {0};
                            enter[0].type = INPUT_KEYBOARD; enter[0].ki.wVk = VK_RETURN;
                            enter[1].type = INPUT_KEYBOARD; enter[1].ki.wVk = VK_RETURN; enter[1].ki.dwFlags = KEYEVENTF_KEYUP;
                            SendInput(2, enter, sizeof(INPUT));
                            
                            delete[] wstr;
                        }
                    }
                }
                CloseHandle(olRead.hEvent);
            }
            CloseHandle(ol.hEvent);
            DisconnectNamedPipe(hPipe);
            CloseHandle(hPipe);
        }
        Sleep(100);
    }
    return 0;
}

class CProviderFactory : public IClassFactory {
    LONG _cRef;
public:
    CProviderFactory() : _cRef(1) {}
    IFACEMETHODIMP QueryInterface(REFIID riid, void** ppv) {
        if (riid == IID_IUnknown || riid == IID_IClassFactory) { *ppv = this; AddRef(); return S_OK; }
        *ppv = nullptr; return E_NOINTERFACE;
    }
    IFACEMETHODIMP_(ULONG) AddRef() { return InterlockedIncrement(&_cRef); }
    IFACEMETHODIMP_(ULONG) Release() { LONG cRef = InterlockedDecrement(&_cRef); if (!cRef) delete this; return cRef; }
    IFACEMETHODIMP CreateInstance(IUnknown* pUnkOuter, REFIID riid, void** ppv) {
        if (pUnkOuter) return CLASS_E_NOAGGREGATION;
        CPanicProvider* pProvider = new CPanicProvider();
        HRESULT hr = pProvider->QueryInterface(riid, ppv);
        pProvider->Release();
        return hr;
    }
    IFACEMETHODIMP LockServer(BOOL bLock) {
        if (bLock) InterlockedIncrement(&g_cRefModule); else InterlockedDecrement(&g_cRefModule);
        return S_OK;
    }
};

STDAPI DllGetClassObject(REFIID rclsid, REFIID riid, void** ppv) {
    if (rclsid == CLSID_PanicProvider) {
        CProviderFactory* pFactory = new CProviderFactory();
        HRESULT hr = pFactory->QueryInterface(riid, ppv);
        pFactory->Release();
        return hr;
    }
    return CLASS_E_CLASSNOTAVAILABLE;
}
STDAPI DllCanUnloadNow() { return g_cRefModule == 0 ? S_OK : S_FALSE; }
STDAPI DllRegisterServer() { return S_OK; }
STDAPI DllUnregisterServer() { return S_OK; }
