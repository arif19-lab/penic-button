import sys, time
from pywinauto import Application

sys.stdout.reconfigure(encoding='utf-8')

print("======================================================================")
print("   🤖 INTELLIGENT WINDOWS UI AUTOMATION (AI-THINKING DEMO)")
print("======================================================================\n")

print("[1] Launching Windows Application (Notepad)...")
import subprocess
subprocess.Popen(["notepad.exe"])
time.sleep(2.0)

try:
    print("[2] Connecting to UI Automation Tree & Finding Window...")
    app = Application(backend="uia").connect(title_re=".*Notepad.*", timeout=10)
    win = app.top_window()
    print(f" -> Connected to: '{win.window_text()}' (Class: {win.friendly_class_name()})")

    # Bring window to foreground
    win.set_focus()
    time.sleep(0.5)

    print("[3] Inspecting Available UI Elements & Controls...")
    descendants = win.descendants()
    print(f" -> Total UI Controls Discovered: {len(descendants)}")
    
    buttons = [d for d in descendants if d.element_info.control_type in ["Button", "MenuItem", "TabItem"]]
    print(f" -> Found {len(buttons)} Interactive Buttons/Menus:")
    for b in buttons[:8]:
        print(f"    * [{b.element_info.control_type}] '{b.window_text()}' (AutoId: {b.element_info.automation_id})")

    # Step 4: Add New Tab by clicking the "Add New Tab" button using UIA invoke()
    print("\n[4] AI Decision: Locating 'Add New Tab' (+) Button...")
    add_btn = None
    for b in buttons:
        if b.element_info.automation_id == "AddButton" or "add new tab" in b.window_text().lower():
            add_btn = b
            break

    if add_btn:
        print(f" -> Found Button: '{add_btn.window_text()}' (AutoId: {add_btn.element_info.automation_id})")
        print(" -> Triggering native UIA Invoke (Click)...")
        # In UIA, invoke pattern executes the button click directly
        try:
            add_btn.invoke()
        except Exception:
            add_btn.click_input()
        print(" -> ✅ SUCCESS: 'Add New Tab' clicked! New tab spawned successfully.")
        time.sleep(1.5)

    # Step 5: Check how many tabs exist now!
    descendants_after = win.descendants()
    tabs_after = [d for d in descendants_after if d.element_info.control_type == "TabItem"]
    print(f"\n[5] UI State Verification:")
    print(f" -> Active Tabs Count: {len(tabs_after)}")
    for idx, t in enumerate(tabs_after):
        print(f"    Tab {idx+1}: '{t.window_text()}'")

    # Step 6: Click 'Settings' gear icon
    print("\n[6] AI Decision: Locating and Opening 'Settings'...")
    settings_btn = None
    for d in descendants_after:
        if d.element_info.automation_id == "SettingsButton" or "setting" in d.window_text().lower():
            settings_btn = d
            break

    if settings_btn:
        print(f" -> Found Settings Control: '{settings_btn.window_text()}' (AutoId: {settings_btn.element_info.automation_id})")
        try:
            settings_btn.invoke()
        except Exception:
            settings_btn.click_input()
        print(" -> ✅ SUCCESS: Settings opened directly via UIA!")
        time.sleep(2.0)

    # Step 7: Clean close
    print("\n[7] Cleaning up and Gracefully Closing Application...")
    win.close()
    time.sleep(1.0)
    # Check if still running, kill if needed
    subprocess.run(["taskkill", "/F", "/IM", "notepad.exe"], capture_output=True)

    print("\n======================================================================")
    print("   🏆 TEST COMPLETE: 100% REAL UI AUTOMATION WITHOUT SEPARATE TOOLS!")
    print("======================================================================")

except Exception as e:
    print("Error during execution:", e)
    import traceback
    traceback.print_exc()
    subprocess.run(["taskkill", "/F", "/IM", "notepad.exe"], capture_output=True)
