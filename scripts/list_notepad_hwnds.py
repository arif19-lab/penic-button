import win32gui, win32process
def cb(hwnd, extra):
    if win32gui.IsWindowVisible(hwnd):
        title = win32gui.GetWindowText(hwnd)
        if 'notepad' in title.lower():
            _, pid = win32process.GetWindowThreadProcessId(hwnd)
            print(f'HWND: {hwnd}, PID: {pid}, Title: "{title}", Class: "{win32gui.GetClassName(hwnd)}"')
win32gui.EnumWindows(cb, None)
