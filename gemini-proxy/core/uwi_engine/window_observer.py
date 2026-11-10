import time, re, subprocess, os
import win32gui, win32process, win32con
from pywinauto import Desktop

class WindowObserver:
    """Observes, finds, and focuses Windows desktop application windows."""

    @staticmethod
    def get_window_info(hwnd):
        if not hwnd or not win32gui.IsWindow(hwnd):
            return None
        try:
            title = win32gui.GetWindowText(hwnd) or ""
            class_name = win32gui.GetClassName(hwnd) or ""
            _, pid = win32process.GetWindowThreadProcessId(hwnd)
            rect = win32gui.GetWindowRect(hwnd) # (left, top, right, bottom)
            is_visible = bool(win32gui.IsWindowVisible(hwnd))
            is_minimized = bool(win32gui.IsIconic(hwnd))
            is_enabled = bool(win32gui.IsWindowEnabled(hwnd))
            owner_hwnd = win32gui.GetWindow(hwnd, win32con.GW_OWNER)

            return {
                "hwnd": hwnd,
                "title": title,
                "class_name": class_name,
                "pid": pid,
                "rect": {
                    "left": rect[0],
                    "top": rect[1],
                    "right": rect[2],
                    "bottom": rect[3],
                    "width": rect[2] - rect[0],
                    "height": rect[3] - rect[1]
                },
                "is_visible": is_visible,
                "is_minimized": is_minimized,
                "is_enabled": is_enabled,
                "owner_hwnd": owner_hwnd
            }
        except Exception:
            return None

    @classmethod
    def get_foreground_window(cls):
        try:
            hwnd = win32gui.GetForegroundWindow()
            return cls.get_window_info(hwnd)
        except Exception:
            return None

    @classmethod
    def get_process_windows(cls, target_pid):
        """Returns all top-level HWNDs for a specific PID."""
        hwnds = []
        def enum_cb(h, _):
            if win32gui.IsWindowVisible(h):
                _, pid = win32process.GetWindowThreadProcessId(h)
                if pid == target_pid:
                    hwnds.append(h)
            return True
        try:
            win32gui.EnumWindows(enum_cb, None)
        except Exception:
            pass
        return [cls.get_window_info(h) for h in hwnds if cls.get_window_info(h)]

    @classmethod
    def focus_window(cls, hwnd):
        """Robustly brings a window to the foreground."""
        if not hwnd or not win32gui.IsWindow(hwnd):
            return False
        try:
            if win32gui.IsIconic(hwnd):
                win32gui.ShowWindow(hwnd, win32con.SW_RESTORE)
            else:
                win32gui.ShowWindow(hwnd, win32con.SW_SHOW)

            fg_hwnd = win32gui.GetForegroundWindow()
            if fg_hwnd != hwnd:
                cur_thread = win32process.GetCurrentThreadId()
                fg_thread, _ = win32process.GetWindowThreadProcessId(fg_hwnd) if fg_hwnd else (0, 0)
                
                attached = False
                if fg_thread and fg_thread != cur_thread:
                    try:
                        win32process.AttachThreadInput(cur_thread, fg_thread, True)
                        attached = True
                    except Exception:
                        pass

                try:
                    win32gui.BringWindowToTop(hwnd)
                    win32gui.SetForegroundWindow(hwnd)
                finally:
                    if attached:
                        try:
                            win32process.AttachThreadInput(cur_thread, fg_thread, False)
                        except Exception:
                            pass
            time.sleep(0.08)
            return True
        except Exception:
            return False

    @classmethod
    def find_window(cls, app_name="", auto_launch=True):
        """
        Finds a pywinauto WindowSpecification matching app_name.
        If not found and auto_launch=True, safely launches the application.
        """
        d = Desktop(backend="uia")
        app_clean = (app_name or "").strip()

        if app_clean:
            # 1. Search visible windows matching app_name in title
            pattern = f"(?i).*{re.escape(app_clean)}.*"
            wins = d.windows(title_re=pattern, visible_only=True)
            if wins:
                return wins[0]

            # 2. If not found and auto_launch enabled, launch it safely without shell=True
            if auto_launch:
                # Sanitize app name to avoid command injection
                safe_name = re.sub(r'[^a-zA-Z0-9_\-\.]', '', app_clean)
                if safe_name:
                    exe_name = safe_name if safe_name.lower().endswith(".exe") else f"{safe_name}.exe"
                    try:
                        subprocess.Popen([exe_name], shell=False)
                        # Wait for window to appear and initialize controls (bounded polling)
                        found_win = None
                        for _ in range(35):
                            time.sleep(0.1)
                            wins = d.windows(title_re=pattern, visible_only=True)
                            if wins:
                                found_win = wins[0]
                                try:
                                    # Ensure UI controls have loaded (XAML / WinUI islands)
                                    if len(found_win.descendants()) >= 6:
                                        return found_win
                                except Exception:
                                    pass
                        if found_win:
                            return found_win
                    except Exception:
                        pass

        # Fallback: Top visible window
        wins = d.windows(visible_only=True)
        return wins[0] if wins else None
