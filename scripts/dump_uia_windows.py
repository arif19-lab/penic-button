from pywinauto import Desktop
d = Desktop(backend="uia")
wins = d.windows()
print(f"Total UIA windows: {len(wins)}")
for w in wins:
    try:
        t = w.window_text()
        p = w.process_id()
        c = w.element_info.class_name
        vis = w.is_visible()
        if t or 'notepad' in c.lower():
            print(f"PID: {p}, Visible: {vis}, Title: '{t}', Class: '{c}'")
    except Exception:
        pass
