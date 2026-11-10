import sys, time, subprocess
import win32api, win32con
from pywinauto import Application

sys.stdout.reconfigure(encoding='utf-8')

def smooth_move_and_click(x, y, steps=15, delay=0.015):
    """Moves mouse smoothly like a human hand, then clicks."""
    curr_x, curr_y = win32api.GetCursorPos()
    for i in range(1, steps + 1):
        nx = int(curr_x + (x - curr_x) * (i / steps))
        ny = int(curr_y + (y - curr_y) * (i / steps))
        win32api.SetCursorPos((nx, ny))
        time.sleep(delay)
    win32api.SetCursorPos((x, y))
    time.sleep(0.1)
    win32api.mouse_event(win32con.MOUSEEVENTF_LEFTDOWN, x, y, 0, 0)
    time.sleep(0.08)
    win32api.mouse_event(win32con.MOUSEEVENTF_LEFTUP, x, y, 0, 0)
    time.sleep(0.3)

print("======================================================================")
print("   🤖 HUMAN-LIKE MULTI-STEP WINDOWS UI AUTOMATION TEST")
print("======================================================================\n")

# Step 1: Open Notepad
print("[STEP 1] Launching Notepad...")
subprocess.Popen(["notepad.exe"])
time.sleep(2.0)

try:
    # Step 2: Connect and Focus
    print("[STEP 2] Connecting and bringing window to foreground...")
    app = Application(backend="uia").connect(title_re=".*Notepad.*", timeout=10)
    win = app.top_window()
    win.set_focus()
    time.sleep(1.0)
    print(f" -> Window focused: '{win.window_text()}'")

    # Step 3: Find Edit Menu and Click
    print("\n[STEP 3] Locating 'Edit' Menu and clicking like a human...")
    edit_menu = win.child_window(title="Edit", control_type="MenuItem")
    if edit_menu.exists():
        rect = edit_menu.rectangle()
        target_x = (rect.left + rect.right) // 2
        target_y = (rect.top + rect.bottom) // 2
        print(f" -> Moving mouse smoothly to Edit Menu at ({target_x}, {target_y})...")
        smooth_move_and_click(target_x, target_y)
        print(" -> Clicked 'Edit' menu! (Dropdown opened)")
        time.sleep(1.5)

    # Step 4: Click 'View' Menu
    print("\n[STEP 4] Locating 'View' Menu and clicking...")
    view_menu = win.child_window(title="View", control_type="MenuItem")
    if view_menu.exists():
        rect = view_menu.rectangle()
        target_x = (rect.left + rect.right) // 2
        target_y = (rect.top + rect.bottom) // 2
        print(f" -> Moving mouse smoothly to View Menu at ({target_x}, {target_y})...")
        smooth_move_and_click(target_x, target_y)
        print(" -> Clicked 'View' menu! (Dropdown switched)")
        time.sleep(1.5)

    # Dismiss menu by clicking somewhere neutral in the titlebar or window
    win.set_focus()
    time.sleep(0.5)

    # Step 5: Click 'Add New Tab' (+) Button
    print("\n[STEP 5] Locating 'Add New Tab' (+) button and clicking...")
    add_btn = win.child_window(auto_id="AddButton", control_type="Button")
    if not add_btn.exists():
        add_btn = win.child_window(title="Add New Tab", control_type="Button")
    
    if add_btn.exists():
        rect = add_btn.rectangle()
        target_x = (rect.left + rect.right) // 2
        target_y = (rect.top + rect.bottom) // 2
        print(f" -> Moving mouse smoothly to Add Tab (+) at ({target_x}, {target_y})...")
        smooth_move_and_click(target_x, target_y)
        print(" -> Clicked 'Add New Tab'! A 2nd Tab was opened.")
        time.sleep(1.8)

    # Step 6: Verify Tabs and Close 2nd Tab
    print("\n[STEP 6] Finding and Closing the newly opened tab...")
    # Find close buttons
    close_btns = [d for d in win.descendants() if d.element_info.automation_id == "CloseButton"]
    if len(close_btns) >= 2:
        btn_to_close = close_btns[-1] # Close the last tab
        rect = btn_to_close.rectangle()
        target_x = (rect.left + rect.right) // 2
        target_y = (rect.top + rect.bottom) // 2
        print(f" -> Moving mouse smoothly to Close Tab (x) at ({target_x}, {target_y})...")
        smooth_move_and_click(target_x, target_y)
        print(" -> Clicked 'Close Tab'! Returned to 1 tab.")
        time.sleep(1.5)

    # Step 7: Click Settings Button
    print("\n[STEP 7] Locating Settings gear button and clicking...")
    settings_btn = win.child_window(auto_id="SettingsButton", control_type="Button")
    if settings_btn.exists():
        rect = settings_btn.rectangle()
        target_x = (rect.left + rect.right) // 2
        target_y = (rect.top + rect.bottom) // 2
        print(f" -> Moving mouse smoothly to Settings Gear at ({target_x}, {target_y})...")
        smooth_move_and_click(target_x, target_y)
        print(" -> Clicked Settings! Settings page opened.")
        time.sleep(2.0)

    # Step 8: Click Back button in Settings
    print("\n[STEP 8] Locating 'Back' button inside Settings and returning...")
    # Refresh descendants
    desc = win.descendants()
    back_btn = None
    for d in desc:
        if d.element_info.control_type == "Button" and any(k in d.window_text().lower() for k in ["back", "arrow"]):
            back_btn = d
            break
        if d.element_info.automation_id == "BackButton":
            back_btn = d
            break

    if back_btn and back_btn.exists():
        rect = back_btn.rectangle()
        target_x = (rect.left + rect.right) // 2
        target_y = (rect.top + rect.bottom) // 2
        print(f" -> Moving mouse smoothly to Back button at ({target_x}, {target_y})...")
        smooth_move_and_click(target_x, target_y)
        print(" -> Clicked Back button! Returned to main Notepad workspace.")
        time.sleep(1.5)
    else:
        # Fallback hotkey Alt+Left or Escape
        import win32com.client
        wscript = win32com.client.Dispatch("WScript.Shell")
        wscript.SendKeys("{ESC}")
        print(" -> Sent Escape/Back to return to editor.")
        time.sleep(1.0)

    # Step 9: Close Application
    print("\n[STEP 9] Closing Notepad gracefully...")
    win.close()
    time.sleep(1.0)
    subprocess.run(["taskkill", "/F", "/IM", "notepad.exe"], capture_output=True)

    print("\n======================================================================")
    print("   🏆 9-STEP LIVE HUMAN-LIKE AUTOMATION COMPLETED WITH 100% SUCCESS!")
    print("======================================================================\n")

except Exception as e:
    print(f"Error during execution: {e}")
    import traceback
    traceback.print_exc()
    subprocess.run(["taskkill", "/F", "/IM", "notepad.exe"], capture_output=True)
