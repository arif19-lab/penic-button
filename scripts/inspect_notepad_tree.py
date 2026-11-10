from pywinauto import Desktop
import time

d = Desktop(backend="uia")
wins = d.windows(title_re="(?i).*Notepad.*", visible_only=True)
print(f"Visible windows: {len(wins)}")
for w in wins:
    print("Window:", w.window_text(), "Handle:", w.handle)
    desc = w.descendants()
    print(f"Descendants count: {len(desc)}")
    for d_el in desc[:15]:
        print(f"  Type: {d_el.element_info.control_type}, Name: '{d_el.window_text()}', Class: '{d_el.element_info.class_name}'")
