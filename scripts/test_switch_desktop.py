import ctypes
import win32service, win32api, win32con
from pywinauto import Desktop

cur_dt = win32service.GetThreadDesktop(win32api.GetCurrentThreadId())
print('Current Desktop:', win32service.GetUserObjectInformation(cur_dt, win32service.UOI_NAME))

try:
    hDesk = ctypes.windll.user32.OpenDesktopW("Default", 0, False, win32con.MAXIMUM_ALLOWED)
    if hDesk:
        res = ctypes.windll.user32.SetThreadDesktop(hDesk)
        print("SetThreadDesktop result:", res)
        
        cur_dt2 = win32service.GetThreadDesktop(win32api.GetCurrentThreadId())
        print('New Desktop:', win32service.GetUserObjectInformation(cur_dt2, win32service.UOI_NAME))

        d = Desktop(backend="uia")
        wins = d.windows(visible_only=True)
        print(f"UIA Visible Windows on Default: {len(wins)}")
        for w in wins[:10]:
            print(f"  Title: '{w.window_text()}', Class: '{w.element_info.class_name}'")
    else:
        print("Failed to OpenDesktop Default, error:", ctypes.GetLastError())
except Exception as e:
    print("Error:", e)
