import sys, os
sys.path.insert(0, r"C:\Users\Imran\panic-button\gemini-proxy\core")
from uwi_engine import WindowObserver, ElementObserver

win = WindowObserver.find_window('Notepad')
print("Window found:", win.window_text() if win else "None")
if win:
    for el in win.descendants():
        try:
            t = el.window_text()
            c = el.element_info.control_type
            a = el.element_info.automation_id
            if 'tab' in t.lower() or 'tab' in a.lower() or 'close' in t.lower() or 'close' in a.lower():
                print(f'Type: {c}, Name: "{t}", AutomationId: "{a}"')
        except Exception:
            pass
