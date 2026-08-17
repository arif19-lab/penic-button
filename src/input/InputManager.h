#pragma once
#include <windows.h>
#include <string>

namespace Input {
    void EnsureTouchInjectionInit();
    void InjectTouch(const std::string& act, int px, int py, int pointerId);
    void MouseMove(int dx, int dy);
    void MouseMoveAbs(int x, int y);
    void MouseClick(bool isRight);
    void MouseDoubleClick();
    void MouseWheel(int delta);
    void KeyboardType(const std::string& text);
    void SendVirtualKey(WORD vk);
    void LockWorkstation();
    void SetSystemVolume(float vol);
    void ToggleMute();
    void SuspendProcess(const std::string& procName);
    void ResumeProcess(const std::string& procName);
}
