import sys, os, json, time, base64, subprocess, re
import win32gui, win32con, win32clipboard

# Ensure uwi_engine can be imported from current directory
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from pywinauto import Desktop
from uwi_engine import (
    WindowObserver,
    DialogTracker,
    ElementObserver,
    StateSnapshot,
    StateVerifier
)

sys.stdout.reconfigure(encoding='utf-8')

def get_context_windows(app_name, auto_launch=True):
    """
    Returns (main_win, active_dialog_win, active_dialog_info)
    Automatically prioritizes dialogs if present.
    """
    main_win = WindowObserver.find_window(app_name, auto_launch=auto_launch)
    if not main_win:
        return None, None, None

    dlg_info = DialogTracker.find_active_dialog(main_win.handle, main_win.process_id())
    dlg_win = None
    if dlg_info:
        try:
            d = Desktop(backend="uia")
            dlg_win = d.window(handle=dlg_info["hwnd"])
        except Exception:
            dlg_win = None

    return main_win, dlg_win, dlg_info

def find_control(win, target, for_text_input=False, dlg_win=None, timeout=1.0):
    """
    Finds control with dialog-first priority and bounded deadline polling:
    If a dialog is open, search dialog first. Fall back to main window.
    Polls up to `timeout` seconds to account for dynamic XAML/WinUI rendering.
    """
    deadline = time.time() + timeout
    while True:
        if dlg_win:
            el = ElementObserver.find_element(dlg_win, target, for_text_input=for_text_input)
            if el:
                return el, "dialog"

        el = ElementObserver.find_element(win, target, for_text_input=for_text_input)
        if el:
            return el, "main_window"

        if time.time() >= deadline:
            break
        time.sleep(0.08)

    return None, None

def click_element(el, target_name):
    """Multi-tier click executor."""
    # Tier 1: UIA Invoke (instant silent click)
    try:
        el.invoke()
        return {"success": True, "method": "invoke", "target": target_name}
    except Exception:
        pass

    # Tier 2: Select (tabs, list items, menus)
    try:
        el.select()
        return {"success": True, "method": "select", "target": target_name}
    except Exception:
        pass

    # Tier 3: Toggle
    try:
        el.toggle()
        return {"success": True, "method": "toggle", "target": target_name}
    except Exception:
        pass

    # Tier 4: Native Click Input
    try:
        el.click_input()
        return {"success": True, "method": "click_input", "target": target_name}
    except Exception as e:
        return {"success": False, "error": str(e), "target": target_name}

def set_control_text(el, val):
    """Multi-tier text input executor with guaranteed clipboard release."""
    # If element is a ComboBox or container, look for child Edit control
    try:
        if el.element_info.control_type in ["ComboBox", "Pane", "Group"]:
            for child in el.descendants():
                if child.element_info.control_type == "Edit":
                    el = child
                    break
    except Exception:
        pass

    try:
        el.set_focus()
    except Exception:
        pass
    time.sleep(0.08)

    # Tier 1: Win32 WM_SETTEXT (instant, 100% reliable for native Edit controls and #32770 dialogs)
    try:
        if hasattr(el, 'handle') and el.handle and win32gui.IsWindow(el.handle):
            c_name = win32gui.GetClassName(el.handle).lower()
            if "edit" in c_name:
                win32gui.SendMessage(el.handle, win32con.WM_SETTEXT, 0, str(val))
                time.sleep(0.05)
                # Verify
                read_back = win32gui.GetWindowText(el.handle)
                if read_back == str(val):
                    return {"success": True, "method": "wm_settext", "value": val}
    except Exception:
        pass

    # Tier 2: UIA ValuePattern (SetValue)
    try:
        if hasattr(el, 'iface_value') and el.iface_value:
            el.iface_value.SetValue(val)
            return {"success": True, "method": "value_pattern", "value": val}
    except Exception:
        pass

    # Tier 3: Native Clipboard Paste with strict try...finally release
    try:
        win32clipboard.OpenClipboard()
        try:
            win32clipboard.EmptyClipboard()
            win32clipboard.SetClipboardText(val, win32clipboard.CF_UNICODETEXT)
        finally:
            win32clipboard.CloseClipboard()
            
        time.sleep(0.05)
        if hasattr(el, 'handle') and el.handle:
            # Select all before paste
            win32gui.SendMessage(el.handle, win32con.EM_SETSEL, 0, -1)
            win32gui.SendMessage(el.handle, win32con.WM_PASTE, 0, 0)
        return {"success": True, "method": "clipboard_paste", "value": val}
    except Exception:
        pass

    # Tier 4: Key stroke injection
    try:
        el.type_keys(val, with_spaces=True)
        return {"success": True, "method": "type_keys", "value": val}
    except Exception as e:
        return {"success": False, "error": str(e)}

def execute_single_action(win, action, target, val, dlg_win=None, dlg_info=None):
    """
    Executes a single action with pre-observation and post-verification.
    """
    active_target_win = dlg_win if dlg_win else win
    before_state = StateSnapshot.capture(active_target_win, include_elements=True, max_elements=30)

    if action == "click":
        el, context = find_control(win, target, for_text_input=False, dlg_win=dlg_win)
        if not el:
            # Refresh windows in case a new dialog just popped up
            _, new_dlg_win, _ = get_context_windows("", auto_launch=False)
            if new_dlg_win:
                el, context = find_control(win, target, for_text_input=False, dlg_win=new_dlg_win)

        if not el:
            return {
                "success": False,
                "error": f"Element '{target}' not found in active window or dialog.",
                "active_dialog": dlg_info
            }

        click_res = click_element(el, target)
        if not click_res.get("success"):
            return click_res

        # Closed-loop verification
        verify_res = StateVerifier.verify_action_effect(win, before_state, timeout=1.2)
        click_res["context"] = context
        click_res["verified"] = verify_res["verified"]
        click_res["state_delta"] = verify_res["delta"]
        click_res["active_dialog"] = verify_res["delta"].get("active_dialog")
        return click_res

    elif action == "set_text":
        el, context = find_control(win, target, for_text_input=True, dlg_win=dlg_win)
        if not el:
            return {
                "success": False,
                "error": f"Text input field '{target}' not found in active window or dialog.",
                "active_dialog": dlg_info
            }

        set_res = set_control_text(el, val)
        if not set_res.get("success"):
            return set_res

        verified = StateVerifier.verify_text_entered(el, expected_value=val, timeout=1.0)
        set_res["context"] = context
        set_res["verified"] = verified
        return set_res

    elif action == "get_ui_tree":
        main_elements = ElementObserver.collect_ui_elements(win, max_elements=35)
        for e in main_elements:
            e["in_dialog"] = False

        dlg_elements = []
        if dlg_win:
            dlg_elements = ElementObserver.collect_ui_elements(dlg_win, max_elements=25)
            for e in dlg_elements:
                e["in_dialog"] = True

        all_elements = dlg_elements + main_elements
        return {
            "success": True,
            "window": win.window_text(),
            "active_dialog": dlg_info,
            "has_dialog": bool(dlg_info),
            "count": len(all_elements),
            "controls": all_elements
        }

    elif action == "focus_window":
        hwnd = dlg_win.handle if dlg_win else win.handle
        WindowObserver.focus_window(hwnd)
        return {
            "success": True,
            "window": win.window_text(),
            "active_dialog": dlg_info
        }

    else:
        return {"success": False, "error": f"Unsupported action '{action}'"}

def execute(cmd):
    action = cmd.get("action", "click")
    app_name = cmd.get("app_name", "")
    target = cmd.get("target", "")
    val = cmd.get("value", "")
    steps = cmd.get("steps", [])

    try:
        main_win = None
        dlg_win = None
        dlg_info = None

        if app_name:
            main_win, dlg_win, dlg_info = get_context_windows(app_name, auto_launch=True)
            if not main_win and not (action == "run_sequence" or steps):
                return {"success": False, "error": f"Application or window '{app_name}' not found."}
            if main_win:
                focus_target = dlg_win.handle if dlg_win else main_win.handle
                WindowObserver.focus_window(focus_target)

        # Handle multi-step execution sequence with dynamic closed-loop updates
        if action == "run_sequence" or steps:
            results = []
            for step in steps:
                s_act = step.get("action", "click")
                s_tgt = step.get("target", "")
                s_val = step.get("value", "")
                s_app = step.get("app_name") or app_name
                s_delay = step.get("delay_ms", 300) / 1000.0

                # Re-observe context before each step (to catch newly opened dialogs/menus)
                cur_main, cur_dlg, cur_dlg_info = get_context_windows(s_app, auto_launch=True)
                step_main = cur_main if cur_main else main_win
                step_dlg = cur_dlg
                step_dlg_info = cur_dlg_info

                if step_dlg:
                    WindowObserver.focus_window(step_dlg.handle)
                elif step_main:
                    WindowObserver.focus_window(step_main.handle)

                res = execute_single_action(step_main, s_act, s_tgt, s_val, dlg_win=step_dlg, dlg_info=step_dlg_info)
                results.append({"step": step, "result": res})

                if not res.get("success", False):
                    # Stop sequence on failure so agent can observe and recover
                    break

                if s_delay > 0:
                    time.sleep(s_delay)

            all_success = all(r["result"].get("success", False) for r in results) if results else False
            return {
                "success": all_success,
                "action": "run_sequence",
                "steps_executed": len(results),
                "details": results
            }

        if not main_win:
            return {"success": False, "error": f"Application or window '{app_name}' not found."}

        return execute_single_action(main_win, action, target, val, dlg_win=dlg_win, dlg_info=dlg_info)

    except Exception as err:
        return {"success": False, "error": str(err)}

if __name__ == "__main__":
    raw_json = None
    if len(sys.argv) > 2 and sys.argv[1] == "--b64":
        raw_json = base64.b64decode(sys.argv[2]).decode("utf-8")
    elif len(sys.argv) > 1:
        raw_json = sys.argv[1]
    else:
        raw_json = sys.stdin.read().strip()

    try:
        cmd = json.loads(raw_json)
        result = execute(cmd)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
