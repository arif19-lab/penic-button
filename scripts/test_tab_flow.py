import sys, os, time
sys.path.insert(0, r"C:\Users\Imran\panic-button\gemini-proxy\core")
import ui_engine

print("Initial UI Tree:")
tree1 = ui_engine.execute({"app_name": "Notepad", "action": "get_ui_tree"})
tabs1 = [c for c in tree1.get("controls", []) if c["type"] == "TabItem"]
print(f"TabItems count: {len(tabs1)}")
for t in tabs1:
    print(" ", t["name"])

print("\nClicking 'Add New Tab'...")
res = ui_engine.execute({"app_name": "Notepad", "action": "click", "target": "Add New Tab"})
print("Click result:", res.get("success"), res.get("method"))
time.sleep(1.0)

print("\nUI Tree after click:")
tree2 = ui_engine.execute({"app_name": "Notepad", "action": "get_ui_tree"})
tabs2 = [c for c in tree2.get("controls", []) if c["type"] == "TabItem"]
print(f"TabItems count: {len(tabs2)}")
for t in tabs2:
    print(" ", t["name"])
