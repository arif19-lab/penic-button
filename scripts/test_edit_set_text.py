import subprocess, time
from pywinauto import Desktop

p = subprocess.Popen(['notepad.exe'])
time.sleep(2)
d = Desktop(backend='uia')
win = d.windows(title_re='.*Notepad.*')[0]
win.set_focus()

doc_ctrl = None
for el in win.descendants():
    if el.element_info.control_type in ['Document', 'Edit']:
        doc_ctrl = el
        break

print("Found doc_ctrl:", doc_ctrl)
if doc_ctrl:
    try:
        doc_ctrl.set_edit_text("Hello Imran! Typing directly into Windows 11 Document area works!")
        print("SUCCESS: set_edit_text worked!")
    except Exception as e:
        print("set_edit_text failed:", e)
        try:
            doc_ctrl.set_focus()
            doc_ctrl.type_keys("Hello Imran! Typing via type_keys works!", with_spaces=True)
            print("SUCCESS: type_keys worked!")
        except Exception as e2:
            print("type_keys failed:", e2)

time.sleep(3)
win.close()
# dismiss don't save
time.sleep(1)
try:
    d = Desktop(backend='uia')
    save_dialog = d.windows(title_re='.*Notepad.*')
    if save_dialog:
        for b in save_dialog[0].descendants():
            if "don't save" in b.window_text().lower():
                b.invoke()
                break
except:
    pass
