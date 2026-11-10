import os, shutil

base = r"C:\Users\Imran\panic-button\gemini-proxy\tools"
archive = os.path.join(base, "_archive")
os.makedirs(archive, exist_ok=True)

# 1. Move filesystem
fs_dir = os.path.join(base, "filesystem")
if os.path.exists(fs_dir):
    dest = os.path.join(archive, "filesystem")
    if os.path.exists(dest):
        shutil.rmtree(dest)
    shutil.move(fs_dir, archive)
    print("Moved filesystem to _archive")

# 2. Move shell
shell_dir = os.path.join(base, "shell")
if os.path.exists(shell_dir):
    dest = os.path.join(archive, "shell")
    if os.path.exists(dest):
        shutil.rmtree(dest)
    shutil.move(shell_dir, archive)
    print("Moved shell to _archive")

# 3. System files to keep
keep = {"delegate_autonomous_task.js", "call_mcp_tool.js", "manage_mcp_server.js"}
sys_dir = os.path.join(base, "system")
arch_sys = os.path.join(archive, "system")
os.makedirs(arch_sys, exist_ok=True)

if os.path.exists(sys_dir):
    for f in os.listdir(sys_dir):
        if f not in keep:
            src = os.path.join(sys_dir, f)
            dst = os.path.join(arch_sys, f)
            if os.path.isfile(src):
                shutil.move(src, dst)
                print(f"Archived: {f}")

print("Clean-up completed successfully!")
