#include "AudioManager.h"
#include "../security/PanicEngine.h"

// Global variable definitions
float g_savedVolume = -1.0f; // -1 means not saved yet
ITaskbarList* pTaskbar = NULL;

void InitializeTaskbar() {
    CoInitialize(NULL);
    CoCreateInstance(__uuidof(TaskbarList), NULL, CLSCTX_INPROC_SERVER, __uuidof(ITaskbarList), (void**)&pTaskbar);
    if (pTaskbar) pTaskbar->HrInit();
}

// --- PROFESSIONAL AUDIO MANAGEMENT ---
// We use SetMasterVolumeLevelScalar instead of SetMute.
// Reason: SetMute() sends a Windows media event that causes Chrome, YouTube,
// and most media players to auto-resume playback — a critical privacy leak!
// SetMasterVolumeLevelScalar(0.0f) silently zeros the volume at the hardware
// level without sending ANY media events, so players stay in their current state.

IAudioEndpointVolume* GetAudioEndpoint() {
    IMMDeviceEnumerator* pEnumerator = NULL;
    HRESULT hr = CoCreateInstance(__uuidof(MMDeviceEnumerator), NULL, CLSCTX_ALL, 
        __uuidof(IMMDeviceEnumerator), (void**)&pEnumerator);
    if (FAILED(hr)) return NULL;

    IMMDevice* pDevice = NULL;
    hr = pEnumerator->GetDefaultAudioEndpoint(eRender, eConsole, &pDevice);
    pEnumerator->Release();
    if (FAILED(hr)) return NULL;

    IAudioEndpointVolume* pVol = NULL;
    hr = pDevice->Activate(__uuidof(IAudioEndpointVolume), CLSCTX_ALL, NULL, (void**)&pVol);
    pDevice->Release();
    if (FAILED(hr)) return NULL;

    return pVol;
}

void SilentZeroVolume() {
    IAudioEndpointVolume* pVol = GetAudioEndpoint();
    if (!pVol) return;
    // Save the current volume before zeroing it
    pVol->GetMasterVolumeLevelScalar(&g_savedVolume);
    // Set volume to 0.0f — completely silent, no media events fired!
    pVol->SetMasterVolumeLevelScalar(0.0f, NULL);
    pVol->Release();
}

void RestoreVolume() {
    IAudioEndpointVolume* pVol = GetAudioEndpoint();
    if (!pVol) return;
    if (g_savedVolume >= 0.0f) {
        // Restore exactly what it was before
        pVol->SetMasterVolumeLevelScalar(g_savedVolume, NULL);
        g_savedVolume = -1.0f; // Reset saved state
    }
    pVol->Release();
}
// --------------------------------------

// --- INTRUDER ALARM MAGIC ---
void MaxSystemVolume() {
    IMMDeviceEnumerator* pEnumerator = NULL;
    HRESULT hr = CoCreateInstance(__uuidof(MMDeviceEnumerator), NULL, CLSCTX_ALL, __uuidof(IMMDeviceEnumerator), (void**)&pEnumerator);
    if (SUCCEEDED(hr)) {
        IMMDevice* pDevice = NULL;
        hr = pEnumerator->GetDefaultAudioEndpoint(eRender, eConsole, &pDevice);
        if (SUCCEEDED(hr)) {
            IAudioEndpointVolume* pEndpointVolume = NULL;
            hr = pDevice->Activate(__uuidof(IAudioEndpointVolume), CLSCTX_ALL, NULL, (void**)&pEndpointVolume);
            if (SUCCEEDED(hr)) {
                // Force Unmute
                pEndpointVolume->SetMute(FALSE, NULL); 
                // Force Volume to 100% (1.0f)
                pEndpointVolume->SetMasterVolumeLevelScalar(1.0f, NULL);
                pEndpointVolume->Release();
            }
            pDevice->Release();
        }
        pEnumerator->Release();
    }
}

void SetSystemVolume(float level) {
    if (level < 0.0f) level = 0.0f;
    if (level > 1.0f) level = 1.0f;
    IAudioEndpointVolume* pVol = GetAudioEndpoint();
    if (pVol) {
        pVol->SetMute(FALSE, NULL);
        pVol->SetMasterVolumeLevelScalar(level, NULL);
        pVol->Release();
    }
}

void TriggerAlarm() {
    static DWORD lastTriggerTime = 0;
    DWORD currentTime = GetTickCount();
    
    // Only max volume if at least 1 second has passed since the last trigger, 
    // to prevent COM call spam if the intruder mashes the keyboard or mouse.
    if (currentTime - lastTriggerTime > 1000) {
        lastTriggerTime = currentTime;
        MaxSystemVolume();
    }
    
    // Static counter to keep track of which audio to play next
    static int clickCount = 1;

    char szPath[MAX_PATH];
    GetModuleFileNameA(NULL, szPath, MAX_PATH);
    std::string exePath = szPath;
    
    std::string wavName = "\\alarm" + std::to_string(clickCount) + ".wav";
    std::string wavPath = exePath.substr(0, exePath.find_last_of("\\/")) + wavName;

    // ⚡ Fallback: If running from C:\ProgramData\PanicButton\ or anywhere else
    if (GetFileAttributesA(wavPath.c_str()) == INVALID_FILE_ATTRIBUTES) {
        wavPath = "C:\\ProgramData\\PanicButton" + wavName;
    }

    PlaySoundA(wavPath.c_str(), NULL, SND_FILENAME | SND_ASYNC);

    clickCount++;
    if (clickCount > 13) {
        clickCount = 1;
    }
}
// -----------------------------
