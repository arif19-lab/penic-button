import sys, os, time
sys.path.insert(0, r"C:\Users\Imran\panic-button\gemini-proxy\core")
import ui_engine

print("[1] Add New Tab...")
res_add = ui_engine.execute({"app_name": "Notepad", "action": "click", "target": "Add New Tab"})
print("Add Tab result:", res_add)
time.sleep(1.0)

print("\n[2] Type in Tab 2...")
res_type = ui_engine.execute({"app_name": "Notepad", "action": "set_text", "value": "1200\nCalculation Verified by AI\n"})
print("Type result:", res_type)
time.sleep(0.8)

print("\n[3] Close Tab 2...")
res_close = ui_engine.execute({"app_name": "Notepad", "action": "click", "target": "Close Tab"})
print("Close Tab result:", res_close)

time.sleep(0.8)
print("\n[4] Check for confirmation dialog...")
res_dont = ui_engine.execute({"app_name": "Notepad", "action": "click", "target": "Don't save"})
print("Don't save result:", res_dont)
