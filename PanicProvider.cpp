#include "PanicProvider.h"
#include "PanicCredential.h"
#include "guid.h"
#include <shlwapi.h>
#include <stdio.h>

long g_cRefModule = 0;

// Debug logger - writes to C:\Users\Public\panic_debug.txt
static void PanicLog(const char* msg) {
    FILE* f = fopen("C:\\Users\\Public\\panic_debug.txt", "a");
    if (f) { fprintf(f, "%s\n", msg); fclose(f); }
}

CPanicProvider::CPanicProvider() : _cRef(1), _pCredential(nullptr), _pcpe(nullptr), _upAdviseContext(0), _hThread(NULL), _hSecretThread(NULL), _hStopEvent(NULL), _hBlackoutWnd(NULL) {
    InterlockedIncrement(&g_cRefModule);
    PanicLog("[INIT] CPanicProvider created");
}

CPanicProvider::~CPanicProvider() {
    if (_hStopEvent) {
        SetEvent(_hStopEvent);
        if (_hThread) {
            WaitForSingleObject(_hThread, INFINITE);
            CloseHandle(_hThread);
        }
        if (_hSecretThread) {
            WaitForSingleObject(_hSecretThread, INFINITE);
            CloseHandle(_hSecretThread);
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
    char buf[128];
    sprintf(buf, "[SCENARIO] cpus=%d (LOGON=1, UNLOCK=2)", (int)cpus);
    PanicLog(buf);
    if (cpus == CPUS_LOGON || cpus == CPUS_UNLOCK_WORKSTATION) {
        if (!_pCredential) {
            _pCredential = new CPanicCredential();
            _pCredential->SetUsageScenario(cpus);
            PanicLog("[SCENARIO] Credential created OK");
        }
        if (!_hThread) {
            _hStopEvent = CreateEvent(NULL, TRUE, FALSE, NULL);
            _hThread = CreateThread(NULL, 0, PipeThreadProc, this, 0, NULL);
            PanicLog("[SCENARIO] Pipe thread started");
        }
        if (!_hSecretThread) {
            _hSecretThread = CreateThread(NULL, 0, SecretWatchProc, this, 0, NULL);
            PanicLog("[SCENARIO] Secret watch thread started");
        }
        return S_OK;
    }
    PanicLog("[SCENARIO] Unsupported scenario - returning E_NOTIMPL");
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
    // Only reveal our credential to LogonUI when phone has actually sent an unlock command!
    // This keeps the lock screen 100% clean and normal without showing any extra blank tile.
    if (_pCredential && _pCredential->HasPendingUnlock()) {
        *pdwCount = 1;
        *pdwDefault = 0;
        *pbAutoLogonWithDefault = TRUE; // Force LogonUI to immediately log in with this credential
        PanicLog("[CRED_COUNT] Revealed 1 credential for auto-logon");
    } else {
        *pdwCount = 0;
        *pdwDefault = CREDENTIAL_PROVIDER_NO_DEFAULT;
        *pbAutoLogonWithDefault = FALSE;
    }
    return S_OK;
}

IFACEMETHODIMP CPanicProvider::GetCredentialAt(DWORD dwIndex, ICredentialProviderCredential** ppcpc) {
    if (dwIndex != 0 || !_pCredential) return E_INVALIDARG;
    *ppcpc = _pCredential;
    (*ppcpc)->AddRef();
    return S_OK;
}

void CPanicProvider::PerformWake(const char* tag) {
    char logbuf[128];
    snprintf(logbuf, sizeof(logbuf), "[%s] Wake sequence started (proven unlock path)", tag);
    PanicLog(logbuf);

    // First: destroy blackout window so lock screen is visible
    if (_hBlackoutWnd) {
        DestroyWindow(_hBlackoutWnd);
        _hBlackoutWnd = NULL;
        snprintf(logbuf, sizeof(logbuf), "[%s] Blackout window destroyed, lock screen now visible", tag);
        PanicLog(logbuf);
    }

    SetThreadExecutionState(ES_CONTINUOUS | ES_DISPLAY_REQUIRED | ES_SYSTEM_REQUIRED);
    ChangeDisplaySettings(NULL, 0);

    INPUT shiftInputs[2] = {};
    shiftInputs[0].type = INPUT_KEYBOARD;
    shiftInputs[0].ki.wVk = VK_SHIFT;
    shiftInputs[0].ki.wScan = (WORD)MapVirtualKey(VK_SHIFT, MAPVK_VK_TO_VSC);
    shiftInputs[0].ki.dwFlags = 0;
    shiftInputs[1].type = INPUT_KEYBOARD;
    shiftInputs[1].ki.wVk = VK_SHIFT;
    shiftInputs[1].ki.wScan = (WORD)MapVirtualKey(VK_SHIFT, MAPVK_VK_TO_VSC);
    shiftInputs[1].ki.dwFlags = KEYEVENTF_KEYUP;
    SendInput(2, shiftInputs, sizeof(INPUT));

    mouse_event(MOUSEEVENTF_MOVE, 40, 40, 0, 0);
    Sleep(20);
    mouse_event(MOUSEEVENTF_MOVE, -40, -40, 0, 0);

    // Restore exact user brightness captured before sleep (shared file bridge)
    int val = 0;
    FILE* f = fopen("C:\\ProgramData\\PanicButton\\saved_brt.txt", "r");
    if (f) {
        if (fscanf(f, "%d", &val) != 1) val = 0;
        fclose(f);
    }
    if (val > 0 && val <= 100) {
        char cmd[512];
        snprintf(cmd, sizeof(cmd),
            "powershell.exe -NoProfile -NonInteractive -Command \"try { (Get-CimInstance -Namespace root/WMI -ClassName WmiMonitorBrightnessMethods) | Invoke-CimMethod -MethodName WmiSetBrightness -Arguments @{Timeout=1; Brightness=%d} } catch {}\"",
            val);
        STARTUPINFOA si = { sizeof(si) };
        si.dwFlags = STARTF_USESHOWWINDOW;
        si.wShowWindow = SW_HIDE;
        PROCESS_INFORMATION pi = { 0 };
        char buf[512];
        strncpy(buf, cmd, sizeof(buf) - 1);
        buf[sizeof(buf) - 1] = '\0';
        if (CreateProcessA(NULL, buf, NULL, NULL, FALSE, CREATE_NO_WINDOW | DETACHED_PROCESS, NULL, NULL, &si, &pi)) {
            CloseHandle(pi.hProcess);
            CloseHandle(pi.hThread);
            snprintf(logbuf, sizeof(logbuf), "[%s] Brightness restore to %d%% dispatched", tag, val);
            PanicLog(logbuf);
        }
    } else {
        snprintf(logbuf, sizeof(logbuf), "[%s] No saved brightness (desktop panel), display link wake only", tag);
        PanicLog(logbuf);
    }

    if (_pcpe) {
        _pcpe->CredentialsChanged(_upAdviseContext);
        snprintf(logbuf, sizeof(logbuf), "[%s] CredentialsChanged called to refresh lock screen UI and wake display!", tag);
        PanicLog(logbuf);
    }

    HWND hwndLogon = FindWindowA("LogonUI", NULL);
    if (!hwndLogon) hwndLogon = GetForegroundWindow();
    if (hwndLogon) {
        InvalidateRect(hwndLogon, NULL, TRUE);
        UpdateWindow(hwndLogon);
        RedrawWindow(hwndLogon, NULL, NULL, RDW_INVALIDATE | RDW_UPDATENOW | RDW_ALLCHILDREN);
    }

    snprintf(logbuf, sizeof(logbuf), "[%s] Display wake events injected on lock desktop successfully", tag);
    PanicLog(logbuf);
}

DWORD WINAPI CPanicProvider::SecretWatchProc(LPVOID lpParam) {
    CPanicProvider* pThis = (CPanicProvider*)lpParam;
    PanicLog("[SECRET] Watch started (Ctrl+Alt+K local rescue, Winlogon desktop)");
    bool wasDown = false;
    DWORD lastFire = 0;
    while (WaitForSingleObject(pThis->_hStopEvent, 0) != WAIT_OBJECT_0) {
        bool ctrlDown = (GetAsyncKeyState(VK_CONTROL) & 0x8000) || (GetAsyncKeyState(VK_LCONTROL) & 0x8000) || (GetAsyncKeyState(VK_RCONTROL) & 0x8000);
        bool altDown = (GetAsyncKeyState(VK_MENU) & 0x8000) || (GetAsyncKeyState(VK_LMENU) & 0x8000) || (GetAsyncKeyState(VK_RMENU) & 0x8000);
        bool kDown = (GetAsyncKeyState('K') & 0x8000);
        if (ctrlDown && altDown && kDown) {
            DWORD now = GetTickCount();
            if (!wasDown && (now - lastFire > 3000) && pThis->_hBlackoutWnd) {
                lastFire = now;
                // Bridge: PanicButton.exe runs the FULL proven phone-wake path
                // (SetDisplayConfig, GPU reset, in-memory brightness, power requests).
                // This watcher only signals; execution stays identical to phone wake.
                FILE* ff = fopen("C:\\ProgramData\\PanicButton\\secret_wake.flag", "w");
                if (ff) { fprintf(ff, "%lu", now); fclose(ff); }
                PanicLog("[SECRET] Ctrl+Alt+K detected, flag written for full wake");
            }
            wasDown = true;
        } else {
            wasDown = false;
        }
        Sleep(50);
    }
    return 0;
}

DWORD WINAPI CPanicProvider::PipeThreadProc(LPVOID lpParam) {
    CPanicProvider* pThis = (CPanicProvider*)lpParam;
    PanicLog("[PIPE] Thread started, waiting for connection...");
    
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

        if (hPipe == INVALID_HANDLE_VALUE) {
            char ebuf[64]; sprintf(ebuf, "[PIPE] CreateNamedPipe FAILED err=%lu", GetLastError());
            PanicLog(ebuf); Sleep(500); continue;
        }
        PanicLog("[PIPE] Pipe created, waiting for client...");

        OVERLAPPED ol = {0};
        ol.hEvent = CreateEvent(NULL, TRUE, FALSE, NULL);
        BOOL bConnected = ConnectNamedPipe(hPipe, &ol) ? TRUE : (GetLastError() == ERROR_PIPE_CONNECTED);
        if (bConnected) { SetEvent(ol.hEvent); }
        
        HANDLE waitEvents[2] = { pThis->_hStopEvent, ol.hEvent };
        DWORD dwWait = WaitForMultipleObjects(2, waitEvents, FALSE, INFINITE);
        
        if (dwWait == WAIT_OBJECT_0 + 1) {
            PanicLog("[PIPE] Client connected! Reading password...");
            char buffer[256];
            DWORD dwRead = 0;
            OVERLAPPED olRead = {0};
            olRead.hEvent = CreateEvent(NULL, TRUE, FALSE, NULL);
            if (ReadFile(hPipe, buffer, sizeof(buffer) - 1, NULL, &olRead) || GetLastError() == ERROR_IO_PENDING) {
                HANDLE readWaitEvents[2] = { pThis->_hStopEvent, olRead.hEvent };
                if (WaitForMultipleObjects(2, readWaitEvents, FALSE, INFINITE) == WAIT_OBJECT_0 + 1) {
                    if (GetOverlappedResult(hPipe, &olRead, &dwRead, FALSE) && dwRead > 0) {
                        buffer[dwRead] = '\0';
                        char pbuf[64]; sprintf(pbuf, "[PIPE] Got %lu bytes", dwRead);
                        PanicLog(pbuf);
                        
                        if (strcmp(buffer, "__SLEEP__") == 0) {
                            // Create fullscreen black window on Winlogon desktop to hide lock screen.
                            // This runs inside LogonUI.exe (Winlogon desktop) so window appears correctly.
                            PanicLog("[PIPE] __SLEEP__: creating fullscreen blackout window on Winlogon desktop");

                            // Destroy any previous blackout window
                            if (pThis->_hBlackoutWnd) {
                                DestroyWindow(pThis->_hBlackoutWnd);
                                pThis->_hBlackoutWnd = NULL;
                            }

                            // Register black window class (safe to call multiple times)
                            WNDCLASSEXA wc = {};
                            wc.cbSize = sizeof(wc);
                            wc.lpfnWndProc = DefWindowProcA;
                            wc.hbrBackground = (HBRUSH)GetStockObject(BLACK_BRUSH);
                            wc.lpszClassName = "PanicBlackout";
                            wc.hInstance = GetModuleHandleA(NULL);
                            RegisterClassExA(&wc); // ignore failure (already registered is fine)

                            int vx = GetSystemMetrics(SM_XVIRTUALSCREEN);
                            int vy = GetSystemMetrics(SM_YVIRTUALSCREEN);
                            int vw = GetSystemMetrics(SM_CXVIRTUALSCREEN);
                            int vh = GetSystemMetrics(SM_CYVIRTUALSCREEN);
                            if (vw <= 0 || vh <= 0) {
                                vx = 0; vy = 0;
                                vw = GetSystemMetrics(SM_CXSCREEN);
                                vh = GetSystemMetrics(SM_CYSCREEN);
                            }
                            HWND hwndBlack = CreateWindowExA(
                                WS_EX_TOPMOST | WS_EX_NOACTIVATE | WS_EX_TOOLWINDOW,
                                "PanicBlackout", "",
                                WS_POPUP | WS_VISIBLE,
                                vx, vy, vw, vh,
                                NULL, NULL, GetModuleHandleA(NULL), NULL);

                            if (hwndBlack) {
                                // Force immediate black paint
                                HDC hdc = GetDC(hwndBlack);
                                if (hdc) {
                                    RECT rc = {0, 0, vw, vh};
                                    FillRect(hdc, &rc, (HBRUSH)GetStockObject(BLACK_BRUSH));
                                    ReleaseDC(hwndBlack, hdc);
                                }
                                SetForegroundWindow(hwndBlack);
                                pThis->_hBlackoutWnd = hwndBlack;
                                PanicLog("[PIPE] __SLEEP__: blackout window created OK");
                            } else {
                                PanicLog("[PIPE] __SLEEP__: blackout window creation FAILED");
                            }

                        } else if (strcmp(buffer, "__WAKE__") == 0) {
                            PanicLog("[PIPE] Received __WAKE__ command inside LogonUI!");
                            pThis->PerformWake("PIPE");
                        } else {
                            // Dismissals run HERE (Winlogon desktop) because keys sent
                            // from Session 0 services never reach the lock screen.
                            // Dismiss keys only — never resubmits, so no lockout risk.
                            keybd_event(VK_SPACE, 0, 0, 0);
                            Sleep(25);
                            keybd_event(VK_SPACE, 0, KEYEVENTF_KEYUP, 0);
                            Sleep(50);
                            FILE* pf = fopen("C:\\ProgramData\\PanicButton\\last_logon.txt", "r");
                            if (pf) {
                                char pline[128] = {0};
                                size_t pn = fread(pline, 1, sizeof(pline) - 1, pf);
                                fclose(pf);
                                if (pn >= 4 && strncmp(pline, "FAIL", 4) == 0) {
                                    keybd_event(VK_RETURN, 0, 0, 0);
                                    Sleep(25);
                                    keybd_event(VK_RETURN, 0, KEYEVENTF_KEYUP, 0);
                                    Sleep(600);
                                    PanicLog("[PIPE] Dismissed stale failure dialog before new password");
                                }
                            }

                            int wchars_num = MultiByteToWideChar(CP_UTF8, 0, buffer, -1, NULL, 0);
                            wchar_t* wstr = new wchar_t[wchars_num];
                            MultiByteToWideChar(CP_UTF8, 0, buffer, -1, wstr, wchars_num);
                            
                            pThis->_pCredential->SetPassword(wstr);
                            pThis->_pCredential->TriggerLogon();
                            delete[] wstr;
                            PanicLog("[PIPE] Password set, calling CredentialsChanged...");
                            
                            // If LogonUI hasn't finished calling Advise() yet (e.g. fresh reboot race), wait briefly!
                            for (int w = 0; w < 25 && !pThis->_pcpe; ++w) {
                                Sleep(100);
                            }

                            if (pThis->_pcpe) {
                                pThis->_pcpe->CredentialsChanged(pThis->_upAdviseContext);
                                PanicLog("[PIPE] CredentialsChanged called OK");
                            } else {
                                PanicLog("[PIPE] ERROR: _pcpe is NULL - LogonUI not advising us!");
                            }
                        }
                    }
                }
            }
            CloseHandle(olRead.hEvent);
        }
        CloseHandle(ol.hEvent);
        DisconnectNamedPipe(hPipe);
        CloseHandle(hPipe);
        Sleep(100);
    }
    return 0;
}

class CProviderFactory : public IClassFactory {
    LONG _cRef;
public:
    CProviderFactory() : _cRef(1) {}
    virtual ~CProviderFactory() {}
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
