import os
import sys
import time

# Ensure repo root is on path
REPO_ROOT = r"C:\Users\Imran\panic-button"
sys.path.insert(0, os.path.join(REPO_ROOT, "gemini-proxy", "core"))

import ui_engine

def run_benchmark():
    test_file = r"C:\Users\Imran\benchmark_verified.txt"
    if os.path.exists(test_file):
        try:
            os.remove(test_file)
        except Exception:
            pass

    print("[Step 1] Launching Notepad & writing initial benchmark header...")
    step1 = ui_engine.execute({
        "app_name": "Notepad",
        "action": "set_text",
        "value": "[Test Run 1]: System Automation Benchmark Starting...\n"
    })
    print("  Step 1 Result:", step1.get("success"), step1.get("details", step1.get("error", "")))
    assert step1.get("success"), f"Step 1 failed: {step1}"

    print("\n[Step 2] Clicking File -> Save as to open modal dialog...")
    s2_file = ui_engine.execute({"app_name": "Notepad", "action": "click", "target": "File"})
    print("  Click File:", s2_file.get("success"))
    time.sleep(0.5)

    s2_saveas = ui_engine.execute({"app_name": "Notepad", "action": "click", "target": "Save as"})
    print("  Click Save as:", s2_saveas.get("success"))
    time.sleep(1.0)

    print("\n[Step 3] Entering absolute path in Save as dialog & saving...")
    s3_text = ui_engine.execute({"app_name": "Notepad", "action": "set_text", "target": "File name:", "value": test_file})
    print("  Enter Path:", s3_text.get("success"), s3_text.get("details", ""))
    time.sleep(0.5)

    s3_click_save = ui_engine.execute({"app_name": "Notepad", "action": "click", "target": "Save"})
    print("  Click Save Button:", s3_click_save.get("success"))
    time.sleep(1.5)

    print("\n[Step 4] Clicking 'Add New Tab' to open second tab...")
    s4_tab = ui_engine.execute({"app_name": "Notepad", "action": "click", "target": "Add New Tab"})
    print("  Open New Tab:", s4_tab.get("success"))
    time.sleep(0.8)

    print("\n[Step 5] Writing calculation result into second tab...")
    calc_res = 150 * 8
    calc_text = f"Result: {calc_res}\nCalculation Verified by AI\n"
    s5_type = ui_engine.execute({"app_name": "Notepad", "action": "set_text", "value": calc_text})
    print("  Write into Tab 2:", s5_type.get("success"), s5_type.get("details", ""))
    time.sleep(0.5)

    print("\n[Step 6] Closing second tab...")
    s6_close = ui_engine.execute({"app_name": "Notepad", "action": "click", "target": "Close Tab"})
    print("  Close Tab 2 result:", s6_close)
    time.sleep(0.6)

    # Check if Notepad asks "Do you want to save changes to Untitled?"
    s6_dont_save = ui_engine.execute({"app_name": "Notepad", "action": "click", "target": "Don't save"})
    if s6_dont_save.get("success"):
        print("  Handled unsaved tab popup: clicked 'Don't save'!")
    else:
        # Also check for alternate button label if any
        ui_engine.execute({"app_name": "Notepad", "action": "click", "target": "No"})
    time.sleep(0.8)

    print("\n[Step 7] Appending completion status to first tab and saving...")
    full_content = "[Test Run 1]: System Automation Benchmark Starting...\n\nAll Multi-App Operations Completed Successfully.\n"
    s7_type = ui_engine.execute({"app_name": "Notepad", "action": "set_text", "value": full_content})
    print("  Update Text:", s7_type.get("success"))
    time.sleep(0.5)

    s7_file = ui_engine.execute({"app_name": "Notepad", "action": "click", "target": "File"})
    time.sleep(0.4)
    s7_save = ui_engine.execute({"app_name": "Notepad", "action": "click", "target": "Save"})
    print("  Save File:", s7_save.get("success"))
    time.sleep(1.0)

    print("\n[Verification] Checking file on disk...")
    if os.path.exists(test_file):
        with open(test_file, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
        print(f"File verified at: {test_file}")
        print(f"File size: {len(content)} bytes")
        print("=== Content ===")
        print(content)
        print("===============")
        assert "System Automation Benchmark Starting" in content, "Missing benchmark header"
        assert "All Multi-App Operations Completed Successfully" in content, "Missing completion line"
        print("\n>>> ALL CLOSED-LOOP BENCHMARK VERIFICATIONS PASSED 100%! <<<")
    else:
        raise FileNotFoundError(f"File was not found on disk: {test_file}")

if __name__ == "__main__":
    run_benchmark()
