import time
import win32gui, win32con, win32process
from .window_observer import WindowObserver
from pywinauto import Desktop

class DialogTracker:
    """Tracks and identifies child dialogs, modal popups, and prompt windows."""

    @classmethod
    def find_active_dialog(cls, main_hwnd, main_pid=None):
        """
        Determines if there is an active dialog, modal, or popup belonging to the target app.
        Returns a dict describing the dialog, or None if no dialog is active.
        """
        if not main_hwnd or not win32gui.IsWindow(main_hwnd):
            return None

        if main_pid is None:
            _, main_pid = win32process.GetWindowThreadProcessId(main_hwnd)

        # 1. Check current foreground window
        fg_info = WindowObserver.get_foreground_window()
        if fg_info and fg_info["hwnd"] != main_hwnd and fg_info["is_visible"]:
            r = fg_info["rect"]
            is_tooltip = (fg_info["class_name"] == "Microsoft.UI.Content.PopupWindowSiteBridge" and
                          ((r["width"] == 0 and r["height"] == 0) or (fg_info["title"] == "PopupHost" and r["width"] < 250 and r["height"] < 100)))
            if not is_tooltip and (fg_info["pid"] == main_pid or fg_info["owner_hwnd"] == main_hwnd):
                is_standard_dialog = (fg_info["class_name"] == "#32770")
                return {
                    "is_dialog": True,
                    "hwnd": fg_info["hwnd"],
                    "title": fg_info["title"],
                    "class_name": fg_info["class_name"],
                    "rect": fg_info["rect"],
                    "pid": fg_info["pid"],
                    "is_modal": True,
                    "is_standard_dialog": is_standard_dialog,
                    "is_foreground": True
                }

        # 2. Check process windows for any popup/modal owned by or associated with main_hwnd
        proc_windows = WindowObserver.get_process_windows(main_pid)
        for win in proc_windows:
            h = win["hwnd"]
            if h == main_hwnd:
                continue
            if not win["is_visible"]:
                continue

            owner = win["owner_hwnd"]
            is_std_dlg = (win["class_name"] == "#32770")

            # Ignore transient tooltips and zero-size flyouts
            r = win["rect"]
            if win["class_name"] == "Microsoft.UI.Content.PopupWindowSiteBridge":
                if (r["width"] == 0 and r["height"] == 0) or (win["title"] == "PopupHost" and r["width"] < 250 and r["height"] < 100):
                    continue

            if owner == main_hwnd or is_std_dlg:
                return {
                    "is_dialog": True,
                    "hwnd": h,
                    "title": win["title"],
                    "class_name": win["class_name"],
                    "rect": win["rect"],
                    "pid": win["pid"],
                    "is_modal": True,
                    "is_standard_dialog": is_std_dlg,
                    "is_foreground": (fg_info and fg_info["hwnd"] == h)
                }

        # 3. Check UIA Desktop for children of type Window
        try:
            d = Desktop(backend="uia")
            for win in d.windows(visible_only=True):
                try:
                    if win.handle != main_hwnd and win.process_id() == main_pid:
                        c_type = win.element_info.control_type
                        if c_type in ["Window", "Pane"] and win.element_info.class_name == "#32770":
                            rect = win.rectangle()
                            return {
                                "is_dialog": True,
                                "hwnd": win.handle,
                                "title": win.window_text(),
                                "class_name": win.element_info.class_name,
                                "rect": {"left": rect.left, "top": rect.top, "right": rect.right, "bottom": rect.bottom},
                                "pid": main_pid,
                                "is_modal": True,
                                "is_standard_dialog": True,
                                "is_foreground": (fg_info and fg_info["hwnd"] == win.handle)
                            }
                except Exception:
                    continue
        except Exception:
            pass

        return None

    @classmethod
    def wait_for_dialog(cls, main_hwnd, main_pid=None, timeout=3.0, poll_interval=0.1):
        """Polls until a dialog appears or timeout expires."""
        deadline = time.time() + timeout
        while time.time() < deadline:
            dlg = cls.find_active_dialog(main_hwnd, main_pid)
            if dlg:
                return dlg
            time.sleep(poll_interval)
        return None

    @classmethod
    def wait_for_dialog_close(cls, dialog_hwnd, timeout=3.0, poll_interval=0.1):
        """Polls until a dialog closes or becomes invisible."""
        deadline = time.time() + timeout
        while time.time() < deadline:
            if not win32gui.IsWindow(dialog_hwnd) or not win32gui.IsWindowVisible(dialog_hwnd):
                return True
            time.sleep(poll_interval)
        return False
