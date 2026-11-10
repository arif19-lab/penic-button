import sys, os, time
import win32gui, win32con, win32clipboard
from pywinauto import Desktop

PROXY_DIR = r"C:\Users\Imran\panic-button\gemini-proxy"
CORE_DIR = os.path.join(PROXY_DIR, "core")
if CORE_DIR not in sys.path:
    sys.path.insert(0, CORE_DIR)

from uwi_engine import DialogTracker, ElementObserver

d = Desktop(backend='uia')
wins = d.windows(title_re='(?i).*Notepad.*', visible_only=True)
if not wins:
    print("Notepad not found")
    sys.exit(1)

np = wins[0]
print("Notepad:", np.window_text())
dlg_info = DialogTracker.find_active_dialog(np.handle, np.process_id())
print("Active dialog:", dlg_info)

# Find Edit control in dialog or notepad
test_path = os.path.join(CORE_DIR, "uwie_closed_loop_test.txt")
print("Target path:", test_path)

dlg_win = d.window(handle=dlg_info["hwnd"]) if dlg_info else np
for el in dlg_win.descendants():
    if el.element_info.control_type == 'Edit' and el.element_info.automation_id == '1001':
        print("Found Edit 1001! Setting text via WM_SETTEXT and ValuePattern...")
        el.set_focus()
        time.sleep(0.1)
        # Try WM_SETTEXT
        try:
            win32gui.SendMessage(el.handle, win32con.WM_SETTEXT, 0, test_path)
            print("WM_SETTEXT sent successfully! Read back:", win32gui.GetWindowText(el.handle))
        except Exception as e:
            print("WM_SETTEXT failed:", e)

        # Also click Save
        for b in dlg_win.descendants():
            if b.element_info.control_type == 'Button' and b.window_text() == 'Save':
                print("Found Save button! Invoking...")
                b.invoke()
                time.sleep(1.0)
                break
        break

if os.path.exists(test_path):
    print("SUCCESS: File exists on disk! Size:", os.path.getsize(test_path))
else:
    print("File still not on disk.")
