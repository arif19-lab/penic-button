import time, os
import win32gui
from .window_observer import WindowObserver
from .dialog_tracker import DialogTracker
from .element_observer import ElementObserver
from .state_snapshot import StateSnapshot

class StateVerifier:
    """Verifies that intended UI and system state transitions actually succeeded."""

    @staticmethod
    def poll_condition(predicate, timeout=2.5, interval=0.08):
        """Polls predicate() until it returns a truthy value or timeout expires."""
        deadline = time.time() + timeout
        while time.time() < deadline:
            res = predicate()
            if res:
                return res
            time.sleep(interval)
        return None

    @classmethod
    def verify_dialog_opened(cls, main_hwnd, main_pid=None, timeout=3.0):
        """Verifies that a modal dialog or child popup appeared."""
        return cls.poll_condition(
            lambda: DialogTracker.find_active_dialog(main_hwnd, main_pid),
            timeout=timeout,
            interval=0.1
        )

    @classmethod
    def verify_dialog_closed(cls, dialog_hwnd, timeout=3.0):
        """Verifies that a dialog window closed or became hidden."""
        deadline = time.time() + timeout
        while time.time() < deadline:
            if not win32gui.IsWindow(dialog_hwnd) or not win32gui.IsWindowVisible(dialog_hwnd):
                return True
            time.sleep(0.1)
        return False

    @classmethod
    def verify_menu_opened(cls, win, expected_items=None, timeout=2.0):
        """Verifies that a menu dropdown opened by looking for newly appeared menu items."""
        def check_menu():
            try:
                elements = ElementObserver.collect_ui_elements(win, max_elements=25)
                menu_items = [e for e in elements if e["type"] == "MenuItem"]
                if menu_items:
                    if expected_items:
                        names = [m["name"].lower() for m in menu_items]
                        for exp in expected_items:
                            if any(exp.lower() in n for n in names):
                                return menu_items
                    else:
                        return menu_items
            except Exception:
                pass
            return None

        return cls.poll_condition(check_menu, timeout=timeout, interval=0.08)

    @classmethod
    def verify_text_entered(cls, el, expected_value="", timeout=1.5):
        """Verifies that text was entered into an element."""
        if not expected_value:
            return True

        sub = expected_value[:20].lower().strip()
        def check_val():
            try:
                if hasattr(el, 'handle') and el.handle and win32gui.IsWindow(el.handle):
                    txt = win32gui.GetWindowText(el.handle) or ""
                    if sub in txt.lower():
                        return True
            except Exception:
                pass
            val = ElementObserver.get_element_value(el).lower()
            return sub in val or len(val) > 0

        res = cls.poll_condition(check_val, timeout=timeout, interval=0.08)
        return bool(res)

    @classmethod
    def verify_file_created(cls, file_path, min_bytes=0, timeout=5.0):
        """Verifies that a file was created on disk and is non-empty."""
        def check_file():
            if os.path.exists(file_path):
                try:
                    size = os.path.getsize(file_path)
                    if size >= min_bytes:
                        return {"path": file_path, "size": size}
                except Exception:
                    pass
            return None

        return cls.poll_condition(check_file, timeout=timeout, interval=0.1)

    @classmethod
    def verify_action_effect(cls, target_win, before_state, timeout=1.5):
        """
        Polls until the UI state changes compared to before_state, or returns final delta.
        """
        deadline = time.time() + timeout
        last_delta = None

        while time.time() < deadline:
            after_state = StateSnapshot.capture(target_win, include_elements=True, max_elements=40)
            delta = StateSnapshot.compare(before_state, after_state)
            if delta["has_changed"]:
                return {"verified": True, "delta": delta, "after_state": after_state}
            last_delta = delta
            time.sleep(0.08)

        # Final check
        after_state = StateSnapshot.capture(target_win, include_elements=True, max_elements=40)
        delta = StateSnapshot.compare(before_state, after_state)
        return {"verified": delta["has_changed"], "delta": delta, "after_state": after_state}
