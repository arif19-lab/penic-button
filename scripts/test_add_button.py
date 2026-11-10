import sys, os, time
sys.path.insert(0, r"C:\Users\Imran\panic-button\gemini-proxy\core")
from uwi_engine import WindowObserver

win = WindowObserver.find_window('Notepad')
print("Window:", win.window_text())

add_btn = None
for el in win.descendants():
    try:
        if el.element_info.automation_id == "AddButton":
            add_btn = el
            break
    except Exception:
        pass

print("AddButton found:", add_btn is not None)
if add_btn:
    print("Testing click_input() on AddButton...")
    add_btn.click_input()
    time.sleep(1.0)
    tabs = [el.window_text() for el in win.descendants() if el.element_info.control_type == "TabItem"]
    print("Tabs after click_input:", len(tabs), tabs)
