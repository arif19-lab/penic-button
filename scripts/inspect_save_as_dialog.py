import time, sys, os
PROXY_DIR = r"C:\Users\Imran\panic-button\gemini-proxy"
CORE_DIR = os.path.join(PROXY_DIR, "core")
if CORE_DIR not in sys.path:
    sys.path.insert(0, CORE_DIR)

import ui_engine
from pywinauto import Desktop

# 1. Launch/focus notepad
ui_engine.execute({"action": "focus_window", "app_name": "Notepad"})
time.sleep(0.5)

# 2. Type text
ui_engine.execute({"action": "set_text", "app_name": "Notepad", "value": "Test Inspect Save As"})
time.sleep(0.5)

# 3. File -> Save as
ui_engine.execute({"action": "click", "app_name": "Notepad", "target": "File"})
time.sleep(0.3)
ui_engine.execute({"action": "click", "app_name": "Notepad", "target": "Save as"})
time.sleep(1.0)

# 4. Inspect dialog
d = Desktop(backend='uia')
wins = d.windows(title_re='(?i).*Save as.*', visible_only=True)
if not wins:
    print('No Save as window found')
else:
    dlg = wins[0]
    print(f"Dialog: {dlg.window_text()}, Class: {dlg.element_info.class_name}")
    for el in dlg.descendants():
        info = el.element_info
        if info.control_type in ['Edit', 'ComboBox', 'Button']:
            print(f"Type: {info.control_type}, Name: '{el.window_text()}', Id: '{info.automation_id}', Class: '{info.class_name}'")
