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
    print("Testing add_btn.invoke()...")
    try:
        add_btn.invoke()
        print("invoke() called successfully!")
    except Exception as e:
        print("invoke() failed:", e)

    time.sleep(1.0)
    tabs = [el.window_text() for el in win.descendants() if el.element_info.control_type == "TabItem"]
    print("Tabs after invoke:", len(tabs), tabs)
