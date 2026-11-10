import subprocess, time
from pywinauto import Desktop

subprocess.Popen(['notepad.exe'])
time.sleep(2)
d = Desktop(backend='uia')
win = d.windows(title_re='.*Notepad.*')[0]
for el in win.descendants():
    if el.element_info.control_type in ['Edit', 'Document']:
        info = el.element_info
        print(f"Type: {info.control_type} | Name: '{el.window_text()}' | AutoId: '{info.automation_id}' | Class: '{info.class_name}'")

win.close()
