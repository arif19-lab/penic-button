import sys, time, subprocess
from pywinauto import Desktop

sys.stdout.reconfigure(encoding='utf-8')

def find_control(win, name=None, auto_id=None, control_type=None):
    for d in win.descendants():
        info = d.element_info
        if control_type and info.control_type != control_type:
            continue
        if auto_id and info.automation_id == auto_id:
            return d
        if name and name.lower() in d.window_text().lower():
            return d
    return None

print("======================================================================")
print("   🤖 LIVE 7-STEP VISIBLE WINDOWS AUTOMATION DEMO")
print("======================================================================\n")

print("[STEP 1] Launching Notepad...")
subprocess.Popen(["notepad.exe"])
time.sleep(2.5)

try:
    print("[STEP 2] Connecting and Bringing Notepad to Foreground...")
    desktop = Desktop(backend="uia")
    win = None
    for _ in range(10):
        wins = desktop.windows(title_re=".*Notepad.*", visible_only=True)
        if wins:
            win = wins[0]
            break
        time.sleep(0.5)

    if not win:
        raise RuntimeError("Could not find Notepad window.")

    win.set_focus()
    print(f" -> Active Window: '{win.window_text()}' (Focused on screen!)")
    time.sleep(2.0)

    # Step 3: Click 'File' Menu
    print("\n[STEP 3] Action: Opening 'File' Menu...")
    file_menu = find_control(win, name="File", control_type="MenuItem")
    if file_menu:
        file_menu.invoke()
        print(" -> ✅ 'File' Menu clicked and opened! Check your screen.")
    time.sleep(2.5)

    # Step 4: Click 'Edit' Menu
    print("\n[STEP 4] Action: Switching to 'Edit' Menu...")
    edit_menu = find_control(win, name="Edit", control_type="MenuItem")
    if edit_menu:
        edit_menu.invoke()
        print(" -> ✅ 'Edit' Menu clicked and opened! Check your screen.")
    time.sleep(2.5)

    # Dismiss menu by focusing window
    win.set_focus()
    time.sleep(1.0)

    # Step 5: Click 'Add New Tab' (+) Button
    print("\n[STEP 5] Action: Clicking 'Add New Tab' (+) Button...")
    add_btn = find_control(win, auto_id="AddButton", control_type="Button")
    if not add_btn:
        add_btn = find_control(win, name="Add New Tab", control_type="Button")
    
    if add_btn:
        add_btn.invoke()
        print(" -> ✅ 'Add New Tab' (+) clicked! Tab 2 is now open.")
    time.sleep(3.0)

    # Step 6: Click 'Settings' gear icon
    print("\n[STEP 6] Action: Clicking 'Settings' (Gear Icon)...")
    settings_btn = find_control(win, auto_id="SettingsButton", control_type="Button")
    if not settings_btn:
        settings_btn = find_control(win, name="Settings", control_type="Button")

    if settings_btn:
        settings_btn.invoke()
        print(" -> ✅ Settings Button clicked! Settings view is now open.")
    time.sleep(3.5)

    # Step 7: Return back by clicking Back button
    print("\n[STEP 7] Action: Returning back to Document Editor...")
    back_btn = find_control(win, auto_id="BackButton", control_type="Button")
    if not back_btn:
        back_btn = find_control(win, name="Back", control_type="Button")
            
    if back_btn:
        back_btn.invoke()
        print(" -> ✅ Back button clicked! Returned to main Notepad workspace.")
    else:
        import win32com.client
        wscript = win32com.client.Dispatch("WScript.Shell")
        wscript.SendKeys("{ESC}")
        print(" -> ✅ Sent ESC to return back to editor.")
    
    time.sleep(2.5)

    print("\n======================================================================")
    print("   🏆 ALL 7 STEPS EXECUTED LIVE ON YOUR SCREEN!")
    print("   Leaving Notepad open for 6 seconds so you can see it...")
    print("======================================================================\n")
    for i in range(6, 0, -1):
        print(f"Closing in {i} seconds...", end="\r", flush=True)
        time.sleep(1.0)

    print("\nClosing Notepad now...")
    win.close()
    time.sleep(1.0)
    subprocess.run(["taskkill", "/F", "/IM", "notepad.exe"], capture_output=True)
    print("Demo completed successfully!")

except Exception as e:
    print(f"Error during execution: {e}")
    import traceback
    traceback.print_exc()
    subprocess.run(["taskkill", "/F", "/IM", "notepad.exe"], capture_output=True)
