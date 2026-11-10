import os, sys, time, json

# Ensure core and uwi_engine can be imported
PROXY_DIR = r"C:\Users\Imran\panic-button\gemini-proxy"
CORE_DIR = os.path.join(PROXY_DIR, "core")
if CORE_DIR not in sys.path:
    sys.path.insert(0, CORE_DIR)

import ui_engine
from uwi_engine import StateVerifier

def run_test():
    print("=== UWIE Closed-Loop Notepad Automation Integration Test ===")
    unique_id = int(time.time())
    test_filename = f"uwie_test_{unique_id}.txt"
    test_file_path = os.path.join(CORE_DIR, test_filename)

    test_content = f"UWIE Closed Loop Test Successful at {time.strftime('%Y-%m-%d %H:%M:%S')} (ID: {unique_id})"

    # Step 1: Open / Focus Notepad
    print("\n[Step 1] Focusing or launching Notepad...")
    res = ui_engine.execute({"action": "focus_window", "app_name": "Notepad"})
    print("Result:", json.dumps(res, indent=2))
    assert res.get("success"), f"Failed to focus/launch Notepad: {res}"
    time.sleep(0.5)

    # Step 2: Observe UI Tree
    print("\n[Step 2] Observing UI Tree of Notepad...")
    tree = ui_engine.execute({"action": "get_ui_tree", "app_name": "Notepad"})
    print(f"Controls count: {tree.get('count')}")
    sample_controls = tree.get("controls", [])[:5]
    print("Sample controls:", json.dumps(sample_controls, indent=2))
    assert tree.get("success") and tree.get("count", 0) > 0, "Failed to get UI tree"

    # Step 3: Type text into document
    print("\n[Step 3] Setting text in document...")
    res_text = ui_engine.execute({
        "action": "set_text",
        "app_name": "Notepad",
        "target": "",
        "value": test_content
    })
    print("Result:", json.dumps(res_text, indent=2))
    assert res_text.get("success"), "Failed to set text"

    # Step 4: Click 'File' menu
    print("\n[Step 4] Clicking 'File' menu...")
    res_file = ui_engine.execute({
        "action": "click",
        "app_name": "Notepad",
        "target": "File"
    })
    print("Result:", json.dumps(res_file, indent=2))
    assert res_file.get("success"), "Failed to click File menu"
    time.sleep(0.4)

    # Step 5: Click 'Save as' menu item
    print("\n[Step 5] Clicking 'Save as'...")
    res_saveas = ui_engine.execute({
        "action": "click",
        "app_name": "Notepad",
        "target": "Save as"
    })
    print("Result:", json.dumps(res_saveas, indent=2))
    assert res_saveas.get("success"), "Failed to click Save as"

    # Step 6: Verify Save As Dialog is Detected
    print("\n[Step 6] Verifying Dialog Detection...")
    main_win, dlg_win, dlg_info = ui_engine.get_context_windows("Notepad", auto_launch=False)
    print("Active Dialog Info:", json.dumps(dlg_info, indent=2))
    assert dlg_info is not None, "DialogTracker failed to detect the Save As dialog!"
    print(f"-> Successfully detected modal dialog: '{dlg_info.get('title')}' (class: {dlg_info.get('class_name')})")

    # Step 7: Enter test file path in the Save As dialog
    print("\n[Step 7] Entering file path into Save As dialog...")
    res_path = ui_engine.execute({
        "action": "set_text",
        "app_name": "Notepad",
        "target": "File name:",
        "value": test_file_path
    })
    print("Result:", json.dumps(res_path, indent=2))
    assert res_path.get("success"), "Failed to set file name in Save As dialog"

    # Step 8: Click 'Save' button in Save As dialog
    print("\n[Step 8] Clicking 'Save' button inside dialog...")
    res_save_btn = ui_engine.execute({
        "action": "click",
        "app_name": "Notepad",
        "target": "Save"
    })
    print("Result:", json.dumps(res_save_btn, indent=2))
    assert res_save_btn.get("success"), "Failed to click Save button in dialog"

    # Check if a confirmation dialog appeared (e.g. "Confirm Save As")
    time.sleep(0.5)
    res_yes = ui_engine.execute({
        "action": "click",
        "app_name": "Notepad",
        "target": "Yes"
    })
    if res_yes.get("success"):
        print("Confirmed file overwrite with 'Yes'!")

    # Step 9: Verify Real File on Disk (System Verification)
    print("\n[Step 9] Verifying file creation on disk...")
    file_info = StateVerifier.verify_file_created(test_file_path, min_bytes=5, timeout=5.0)
    print("File verification result:", file_info)
    assert file_info is not None, f"File {test_file_path} was not created on disk!"

    with open(test_file_path, "r", encoding="utf-8") as f:
        saved_text = f.read()
    print(f"File content read back ({len(saved_text)} chars): '{saved_text}'")
    assert test_content in saved_text, "Saved content does not match expected content!"

    # Clean up test file
    try:
        os.remove(test_file_path)
        print(f"Cleaned up test file: {test_file_path}")
    except Exception:
        pass

    # Step 10: Close Notepad cleanly
    print("\n[Step 10] Closing Notepad...")
    ui_engine.execute({"action": "click", "app_name": "Notepad", "target": "File"})
    time.sleep(0.3)
    ui_engine.execute({"action": "click", "app_name": "Notepad", "target": "Exit"})

    print("\n========================================================")
    print(" ALL CLOSED-LOOP UWIE TESTS PASSED WITH 100% SUCCESS! ")
    print("========================================================")

if __name__ == "__main__":
    run_test()
