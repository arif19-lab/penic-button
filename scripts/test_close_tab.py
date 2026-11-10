import sys, os, time
sys.path.insert(0, r"C:\Users\Imran\panic-button\gemini-proxy\core")
from uwi_engine import WindowObserver

win = WindowObserver.find_window('Notepad')
print("Window:", win.window_text())

tabs = [el for el in win.descendants() if el.element_info.control_type == "TabItem"]
print(f"Tabs count: {len(tabs)}")

# Find all Close buttons
close_btns = []
for el in win.descendants():
    try:
        if el.element_info.automation_id == "CloseButton":
            close_btns.append(el)
    except Exception:
        pass

print(f"CloseButton count: {len(close_btns)}")
for i, b in enumerate(close_btns):
    print(f" CloseBtn {i}: name='{b.window_text()}', parent='{b.parent().window_text() if b.parent() else ''}'")

if close_btns:
    # Target the last close button (the active/second tab's close button)
    target_btn = close_btns[-1]
    print("Invoking target close button...")
    try:
        target_btn.invoke()
        print("invoke() succeeded on close button!")
    except Exception as e:
        print("invoke() failed:", e)

    time.sleep(1.0)
    tabs_after = [el for el in win.descendants() if el.element_info.control_type == "TabItem"]
    print(f"Tabs after close: {len(tabs_after)}")
