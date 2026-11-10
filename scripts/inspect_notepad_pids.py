import win32gui, win32process

pids = [5684, 11120, 13592, 24896, 25072, 25396, 26260]

def cb(hwnd, _):
    _, pid = win32process.GetWindowThreadProcessId(hwnd)
    if pid in pids:
        title = win32gui.GetWindowText(hwnd)
        cname = win32gui.GetClassName(hwnd)
        vis = win32gui.IsWindowVisible(hwnd)
        rect = win32gui.GetWindowRect(hwnd)
        print(f"HWND: {hwnd}, PID: {pid}, Visible: {vis}, Title: '{title}', Class: '{cname}', Rect: {rect}")

win32gui.EnumWindows(cb, None)
