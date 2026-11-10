import time
from .window_observer import WindowObserver
from .dialog_tracker import DialogTracker
from .element_observer import ElementObserver

class UIState:
    """Represents a snapshot of the UI at a specific instant."""
    def __init__(self, target_win=None, include_elements=True, max_elements=40):
        self.timestamp = time.time()
        self.target_window = None
        self.foreground_window = WindowObserver.get_foreground_window()
        self.dialog = None
        self.elements = []
        self.element_names = set()

        if target_win:
            try:
                hwnd = target_win.handle
                self.target_window = WindowObserver.get_window_info(hwnd)
                if self.target_window:
                    self.target_window["is_foreground"] = (
                        self.foreground_window and self.foreground_window["hwnd"] == hwnd
                    )
                    # Check active dialog
                    self.dialog = DialogTracker.find_active_dialog(hwnd, self.target_window["pid"])
            except Exception:
                pass

            if include_elements:
                try:
                    self.elements = ElementObserver.collect_ui_elements(target_win, max_elements=max_elements)
                    for el in self.elements:
                        name = el.get("name") or el.get("automation_id")
                        if name:
                            self.element_names.add(name)
                except Exception:
                    pass

    def to_dict(self):
        return {
            "timestamp": self.timestamp,
            "target_window": self.target_window,
            "foreground_window": self.foreground_window,
            "dialog": self.dialog,
            "element_count": len(self.elements),
            "elements": self.elements
        }

class StateSnapshot:
    """Captures and compares UI state snapshots to detect state transitions."""

    @classmethod
    def capture(cls, target_win=None, include_elements=True, max_elements=40):
        return UIState(target_win, include_elements=include_elements, max_elements=max_elements)

    @staticmethod
    def compare(before, after):
        """
        Compares two UIState snapshots and calculates the delta.
        """
        if not before or not after:
            return {"has_changed": False, "reason": "Missing state snapshot"}

        before_fg = before.foreground_window.get("hwnd") if before.foreground_window else None
        after_fg = after.foreground_window.get("hwnd") if after.foreground_window else None
        fg_changed = (before_fg != after_fg)

        before_title = before.target_window.get("title") if before.target_window else ""
        after_title = after.target_window.get("title") if after.target_window else ""
        title_changed = (before_title != after_title)

        had_dialog = bool(before.dialog)
        has_dialog = bool(after.dialog)
        dialog_opened = (not had_dialog and has_dialog)
        dialog_closed = (had_dialog and not has_dialog)

        # Detect element delta
        new_elements = list(after.element_names - before.element_names)
        removed_elements = list(before.element_names - after.element_names)

        has_changed = (
            fg_changed or 
            title_changed or 
            dialog_opened or 
            dialog_closed or 
            len(new_elements) > 0 or 
            len(removed_elements) > 0
        )

        return {
            "has_changed": has_changed,
            "active_window_changed": fg_changed,
            "title_changed": title_changed,
            "old_title": before_title,
            "new_title": after_title,
            "dialog_opened": dialog_opened,
            "dialog_closed": dialog_closed,
            "active_dialog": after.dialog,
            "new_elements": new_elements[:15],
            "removed_elements": removed_elements[:15]
        }
