import time

INTERACTIVE_TYPES = {
    "Button", "MenuItem", "TabItem", "Edit", "Document",
    "CheckBox", "ComboBox", "RadioButton", "Hyperlink",
    "TreeItem", "ListItem", "SplitButton", "ToolBar", "Window", "Pane"
}

GENERIC_TEXT_TARGETS = {
    "", "editor", "text editor", "text", "document", "content", "input", "body", "edit"
}

class ElementObserver:
    """Extracts, formats, and discovers UI elements with robust multi-strategy matching."""

    @staticmethod
    def format_element(el):
        """Extracts a clean, JSON-serializable dictionary from a pywinauto element."""
        try:
            info = el.element_info
            c_type = info.control_type or ""
            name = el.window_text() or ""
            aid = info.automation_id or ""
            c_name = info.class_name or ""

            rect_dict = None
            try:
                r = el.rectangle()
                rect_dict = {
                    "left": r.left,
                    "top": r.top,
                    "right": r.right,
                    "bottom": r.bottom,
                    "width": r.width(),
                    "height": r.height()
                }
            except Exception:
                pass

            is_enabled = True
            try:
                is_enabled = bool(el.is_enabled())
            except Exception:
                pass

            is_visible = True
            try:
                is_visible = bool(el.is_visible())
            except Exception:
                pass

            return {
                "name": name,
                "type": c_type,
                "automation_id": aid,
                "class_name": c_name,
                "rect": rect_dict,
                "enabled": is_enabled,
                "visible": is_visible
            }
        except Exception:
            return None

    @classmethod
    def collect_ui_elements(cls, win, max_elements=50):
        """Scans descendants and returns a structured list of interactive elements."""
        try:
            desc = win.descendants()
        except Exception:
            return []

        elements = []
        for d in desc:
            try:
                c_type = d.element_info.control_type
                txt = d.window_text() or ""
                aid = d.element_info.automation_id or ""

                # Only include interactive types that have a label, an id, or are text/input containers
                if c_type in INTERACTIVE_TYPES:
                    if txt or aid or c_type in ["Document", "Edit"]:
                        formatted = cls.format_element(d)
                        if formatted:
                            elements.append(formatted)
                            if len(elements) >= max_elements:
                                break
            except Exception:
                continue

        return elements

    @classmethod
    def find_element(cls, win, target, for_text_input=False):
        """
        Locates an element inside `win` using exact match, substring match,
        automationId, or control type fallback.
        """
        try:
            desc = win.descendants()
        except Exception:
            return None

        t_low = (target or "").lower().strip()

        # Strategy 1: Text input fallback when target is generic
        if for_text_input and (not t_low or t_low in GENERIC_TEXT_TARGETS):
            for el in desc:
                try:
                    if el.element_info.control_type in ["Document", "Edit"]:
                        return el
                except Exception:
                    continue

        if t_low:
            # If looking for text input, prioritize Edit / Document with exact match first
            if for_text_input:
                for el in desc:
                    try:
                        if el.element_info.control_type in ["Edit", "Document"]:
                            aid = (el.element_info.automation_id or "").lower()
                            name = (el.window_text() or "").lower()
                            if aid == t_low or name == t_low:
                                return el
                    except Exception:
                        continue

            # Strategy 2: Exact AutomationId or Name match
            for el in desc:
                try:
                    aid = (el.element_info.automation_id or "").lower()
                    name = (el.window_text() or "").lower()
                    if aid == t_low or name == t_low:
                        return el
                except Exception:
                    continue

            # If looking for text input, prioritize Edit / Document with substring match
            if for_text_input:
                for el in desc:
                    try:
                        if el.element_info.control_type in ["Edit", "Document"]:
                            aid = (el.element_info.automation_id or "").lower()
                            name = (el.window_text() or "").lower()
                            if (aid and t_low in aid) or (name and t_low in name):
                                return el
                    except Exception:
                        continue

            # Strategy 3: Case-insensitive Substring match
            for el in desc:
                try:
                    aid = (el.element_info.automation_id or "").lower()
                    name = (el.window_text() or "").lower()
                    if (aid and t_low in aid) or (name and t_low in name):
                        return el
                except Exception:
                    continue

        # Strategy 4: Fallback for text input if named element wasn't found
        if for_text_input:
            for el in desc:
                try:
                    if el.element_info.control_type in ["Document", "Edit"]:
                        return el
                except Exception:
                    continue

        return None

    @staticmethod
    def get_element_value(el):
        """Safely retrieves current text or value from an element."""
        if not el:
            return ""
        try:
            if hasattr(el, 'iface_value') and el.iface_value:
                return el.iface_value.CurrentValue or ""
        except Exception:
            pass

        try:
            txt = el.window_text()
            if txt:
                return txt
        except Exception:
            pass

        try:
            props = el.legacy_properties()
            if props and "Value" in props:
                return str(props["Value"])
        except Exception:
            pass

        return ""
