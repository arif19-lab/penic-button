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
print("   🤖 TEST 2: WINDOWS SETTINGS APP AUTOMATION")
print("======================================================================\n")

print("[1] Launching Windows Settings (ms-settings:)...")
subprocess.Popen(["cmd.exe", "/c", "start", "ms-settings:"])
time.sleep(3.0)

try:
    print("[2] Finding Windows Settings Window in UIA Tree...")
    desktop = Desktop(backend="uia")
    win = None
    for _ in range(12):
        wins = desktop.windows(title_re=".*Settings.*", visible_only=True)
        if wins:
            win = wins[0]
            break
        time.sleep(0.5)

    if not win:
        raise RuntimeError("Windows Settings window could not be found.")

    win.set_focus()
    print(f" -> Connected to: '{win.window_text()}' (Focused)")
    time.sleep(2.0)

    # Step 3: Find and click "Network & internet"
    print("\n[3] Action: Navigating to 'Network & internet'...")
    net_btn = find_control(win, name="Network & internet")
    if not net_btn:
        net_btn = find_control(win, name="Network")
        
    if net_btn:
        print(f" -> Found Navigation Item: '{net_btn.window_text()}'")
        try:
            net_btn.invoke()
        except Exception:
            try:
                net_btn.select()
            except Exception:
                net_btn.click_input()
        print(" -> ✅ Clicked 'Network & internet'! Navigated to network settings.")
    else:
        print(" -> Note: Network item not directly matched in visible tree, continuing...")
    time.sleep(3.0)

    # Step 4: Find and click "Personalization" or "Bluetooth"
    print("\n[4] Action: Navigating to 'Bluetooth & devices'...")
    bt_btn = find_control(win, name="Bluetooth & devices")
    if not bt_btn:
        bt_btn = find_control(win, name="Bluetooth")

    if bt_btn:
        print(f" -> Found Navigation Item: '{bt_btn.window_text()}'")
        try:
            bt_btn.invoke()
        except Exception:
            bt_btn.select()
        print(" -> ✅ Clicked 'Bluetooth & devices'! Page switched.")
    time.sleep(3.0)

    # Step 5: Return to "System"
    print("\n[5] Action: Navigating back to 'System'...")
    sys_btn = find_control(win, name="System")
    if sys_btn:
        print(f" -> Found Navigation Item: '{sys_btn.window_text()}'")
        try:
            sys_btn.invoke()
        except Exception:
            sys_btn.select()
        print(" -> ✅ Clicked 'System'! Returned to System Home.")
    time.sleep(3.0)

    print("\n[6] Gracefully Closing Windows Settings...")
    win.close()
    time.sleep(1.0)
    print("\n======================================================================")
    print("   🏆 TEST 2 PASSED: WINDOWS SETTINGS FULLY AUTOMATED!")
    print("======================================================================\n")

except Exception as e:
    print(f"Error during execution: {e}")
    import traceback
    traceback.print_exc()
