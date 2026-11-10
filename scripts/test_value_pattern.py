import subprocess, time
from pywinauto import Desktop
import win32gui, win32con, win32clipboard

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

print("doc_ctrl handle:", doc_ctrl.handle)

# Test 1: ValuePattern
try:
    if hasattr(doc_ctrl, 'iface_value') and doc_ctrl.iface_value:
        doc_ctrl.iface_value.SetValue("Hello from ValuePattern!")
        print("SUCCESS 1: SetValue worked!")
except Exception as e:
    print("Test 1 failed:", e)

# Test 2: Clipboard Paste (Human-like instant paste)
try:
    win32clipboard.OpenClipboard()
    win32clipboard.EmptyClipboard()
    win32clipboard.SetClipboardText("Testing J.A.R.V.I.S. controls: Hello Imran!", win32clipboard.CF_UNICODETEXT)
    win32clipboard.CloseClipboard()
    
    # Send WM_PASTE to doc_ctrl handle or send ^v
    win32gui.SendMessage(doc_ctrl.handle, win32con.WM_PASTE, 0, 0)
    print("SUCCESS 2: WM_PASTE sent to handle!")
except Exception as e:
    print("Test 2 failed:", e)

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
