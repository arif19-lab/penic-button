#pragma once

#include <windows.h>
#include <mmdeviceapi.h>
#include <endpointvolume.h>
#include <shobjidl.h>
#include <mmsystem.h>
#include <string>

// Extern globals
extern float g_savedVolume;
extern bool isPanicMode;
extern ITaskbarList* pTaskbar;

// Function declarations
void InitializeTaskbar();
IAudioEndpointVolume* GetAudioEndpoint();
void SilentZeroVolume();
void RestoreVolume();
void MaxSystemVolume();
void SetSystemVolume(float level);
void TriggerAlarm();
