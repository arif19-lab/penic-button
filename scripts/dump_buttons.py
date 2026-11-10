import sys
sys.path.insert(0, r"C:\Users\Imran\panic-button\gemini-proxy\core")
from uwi_engine import WindowObserver

win = WindowObserver.find_window('Notepad')
print("Window:", win.window_text())
for el in win.descendants():
    try:
        t = el.window_text()
        c = el.element_info.control_type
        a = el.element_info.automation_id
        if c in ['Button', 'TabItem', 'Custom', 'Pane', 'ListItem']:
            if any(k in (t + a).lower() for k in ['tab', 'close', 'untitled', 'add']):
                print(f'{c} | Name: "{t}" | Id: "{a}"')
    except Exception:
        pass
