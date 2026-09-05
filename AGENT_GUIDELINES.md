# 🛡️ PANIC CTRL — Agent Guidelines & Codebase Architecture

> **Notice for all AI Agents & Contributors:**  
> This document defines the strict architectural rules, component relationships, build pipelines, and invariants for the **PANIC CTRL** repository. Any agent modifying this codebase **MUST** follow these guidelines to prevent regressions, file corruption, or security leaks.

---

## 🗺️ 1. Project High-Level Architecture

The project consists of 5 tightly coupled subsystems:

```
                  ┌──────────────────────────────────────────────┐
                  │          PANIC CTRL Core (C++)               │
                  │   src/main.cpp -> HTTP Server (port 8085)    │
                  └──────────────┬───────────────────────────────┘
                                 │
         ┌───────────────────────┼────────────────────────┐
         │ (Named Pipe)          │ (Direct3D11 / MFT)     │ (HTTP/WebSocket)
         ▼                       ▼                        ▼
┌──────────────────┐   ┌──────────────────┐   ┌───────────────────────┐
│ PanicProvider.dll│   │ LiveBroadcaster  │   │  Android App & PWA    │
│ Windows LogonUI  │   │ H.264 / JPEG     │   │  android-app/www/     │
│ Zero-Touch Unlock│   │ 60 FPS Streaming │   │  AMOLED Cyberpunk HUD │
└──────────────────┘   └──────────────────┘   └───────────┬───────────┘
                                                          │
                                         ┌────────────────┴────────────────┐
                                         │ (Tailscale WireGuard Mesh)      │
                                         │ Direct 100.64.0.0/10 Encrypted  │
                                         │ Global P2P Remote Control       │
                                         └─────────────────────────────────┘
```

1. **Native Windows Daemon (`src/`, `PanicButton.exe`)**:
   - Multi-threaded Win32 service & tray application.
   - DXGI hardware desktop capture, hardware H.264 MFT encoder, low-latency WebSockets.
   - 10-point multi-touch and Unicode keyboard injection.
   - 3-stage Panic Engine with Windows Virtual Desktop isolation and process suspension.
2. **Windows Credential Provider (`PanicProvider.dll`)**:
   - Custom COM DLL installed into `C:\Windows\System32\`.
   - Intercepts Windows Lock Screen (LogonUI) to perform silent remote unlocks via `\\.\pipe\PanicUnlockPipe`.
3. **Android Client (`android-app/`, `PanicCTRL.apk`)**:
   - Hybrid Capacitor app with AMOLED cyberpunk HUD.
   - Hardware `MediaCodec` H.264 decoder, native QR camera scanner, Parsec-style touch controller.
4. **Tailscale WireGuard Mesh (`src/service/SystemDeploy.cpp`)**:
   - Detects, auto-installs, and manages peer-to-peer WireGuard mesh (`100.64.0.0/10`) for secure remote control worldwide without public port forwarding.
5. **Installer & Deployment (`installer.iss`, `PanicCTRL-Setup.exe`)**:
   - Inno Setup 6 packaging producing a single self-contained setup binary in `dist/`.

---

## ⚠️ 2. The 10 Inviolable Invariants (NEVER Break These!)

When making changes, any agent **MUST NOT** violate these 10 rules:

| # | Invariant | Reason |
|---|-----------|--------|
| **1** | **Never use `SetMute()` in `AudioManager`** | Windows `SetMute()` emits a shell media event that causes Chrome, Spotify, and YouTube to auto-resume playback. Always use `SetMasterVolumeLevelScalar(0.0f)`. |
| **2** | **Never call `CaptureDXGIFrame()` without `g_dxgiMutex`** | DXGI duplication and staging textures are global singletons. Concurrent thread access causes immediate `0xC0000005` access violations. |
| **3** | **Keep Credential Provider Stealth** | `CPanicProvider::GetCredentialCount()` MUST return `0` unless `_hasPendingUnlock == TRUE`. Never return non-zero unconditionally or a blank tile will corrupt the Windows Lock Screen. |
| **4** | **LSA Serialization Byte Offsets** | In `KERB_INTERACTIVE_UNLOCK_LOGON`, `UNICODE_STRING.Buffer` pointers MUST be byte offsets (`pData - pBuffer`), NEVER absolute memory addresses. LSA operates in a separate process space (`lsass.exe`). |
| **5** | **Physical Alt Key Wait** | `HotkeyListener.cpp` must block until `GetAsyncKeyState(VK_MENU)` is released before injecting `Win+Ctrl+D`. Injecting while Alt is pressed emits `Win+Ctrl+Alt+D`, failing virtual desktop creation. |
| **6** | **Low-Level Hook Injected Check** | Never block injected keystrokes in `KeyboardHookProc`. Always check `(pKeyBoard->flags & LLKHF_INJECTED)`. Otherwise, simulated hotkeys cannot switch or destroy virtual desktops. |
| **7** | **No Self-Taskkill in `KillAllPanicProcesses()`** | Never add `taskkill /IM PanicButton.exe` inside `TrayIcon.cpp` shutdown routines. It causes recursive shutdown deadlocks. Only kill auxiliary services (`PanicMasterService`). |
| **8** | **Always Sync Web Assets** | Any edit in `android-app/www/` MUST be synced via `python scripts/sync_assets.py`. The C++ daemon embeds `WebAssets.h` as its compile-time fallback. |
| **9** | **Tailscale IP Bitmask** | Never match Tailscale adapters by English adapter names. Always check the IANA CGNAT subnet `100.64.0.0/10` via bitmask `(hostOrder & 0xFFC00000UL) == 0x64400000UL`. |
| **10**| **APK Download Candidate Fallbacks** | When serving `/download/app.apk`, always check `GetProgramDataFolder() + "\\PanicCTRL.apk"`, then `"PanicCTRL.apk"`, then the debug output folder. Never assume a single relative path. |

---

## 🔄 3. Two-Way Asset Synchronization Pipeline

The frontend exists in `android-app/www/` and is shared across:
1. **Android APK** (`android-app/android/app/src/main/assets/public/`)
2. **C++ Embedded Fallback** (`src/ui/WebAssets.h`)

### Rule:
Whenever you modify **any** HTML, CSS, or JS file in `android-app/www/`:
```bash
python scripts/sync_assets.py
```
This script automatically:
- Mirrors the entire web tree to the Android project.
- Inlines CSS and bundles JS into `src/ui/WebAssets.h`.

---

## 🔨 4. Build & Compilation Pipelines

### A. Compile Windows Executable (`PanicButton.exe`)
```powershell
cmd /c build_release.bat
```
*(Runs asset sync, windres icon compilation, and MinGW g++ C++17 build).*

### B. Compile Android APK (`PanicCTRL.apk`)
```powershell
cmd /c "cd android-app\android && gradlew.bat assembleDebug"
Copy-Item "android-app\android\app\build\outputs\apk\debug\app-debug.apk" "PanicCTRL.apk" -Force
```

### C. Compile Windows Installer (`dist/PanicCTRL-Setup.exe`)
```powershell
& "C:\Users\Imran\AppData\Local\Programs\Inno Setup 6\ISCC.exe" "c:\Users\Imran\panic-button\installer.iss"
```

> **Note on Desktop Installers:**  
> The installer compiles to `dist\PanicCTRL-Setup.exe` first to prevent OneDrive file-locking conflicts, then is copied to the user's Desktop:  
> `Copy-Item "dist\PanicCTRL-Setup.exe" "C:\Users\Imran\OneDrive\AppData\Desktop\PanicCTRL-Setup.exe" -Force`

---

## 📋 5. Agent Verification Checklist Before Ending Any Task

Before marking any task complete, every agent must verify:
- [ ] **Code compiles cleanly:** `build_release.bat` completes with exit code 0.
- [ ] **Assets are synced:** `python scripts/sync_assets.py` was executed if frontend changed.
- [ ] **No regression in Inno Setup:** `installer.iss` compiles via `ISCC.exe` without syntax errors.
- [ ] **APK is bundled:** `PanicCTRL.apk` exists in the repo root and is included in `[Files]` of `installer.iss`.
- [ ] **Working directory clean:** No dangling `.tmp` or test lockfiles left behind.
- [ ] **Git status verified:** Changes are properly staged and committed with clean conventional commit messages.
