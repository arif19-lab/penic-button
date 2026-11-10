import sys, os, time, json
sys.path.insert(0, r"C:\Users\Imran\panic-button\gemini-proxy\core")
import ui_engine
from uwi_engine import StateVerifier

test_file = r"C:\Users\Imran\benchmark_sequence.txt"
if os.path.exists(test_file):
    try: os.remove(test_file)
    except Exception: pass

print("Executing multi-step sequence on Notepad via UWIE...")
cmd = {
    "app_name": "Notepad",
    "action": "run_sequence",
    "steps": [
        {"action": "set_text", "value": "[Test Run 1]: System Automation Benchmark Starting...\n", "delay_ms": 300},
        {"action": "click", "target": "File", "delay_ms": 400},
        {"action": "click", "target": "Save as", "delay_ms": 800},
        {"action": "set_text", "target": "File name:", "value": test_file, "delay_ms": 400},
        {"action": "click", "target": "Save", "delay_ms": 1000}
    ]
}

start = time.time()
res = ui_engine.execute(cmd)
elapsed = time.time() - start

print(f"Sequence finished in {elapsed:.2f}s:")
print(json.dumps(res, indent=2))

print("\nVerifying file on disk...")
file_info = StateVerifier.verify_file_created(test_file, min_bytes=10, timeout=3.0)
print("File verification:", file_info)
if file_info:
    with open(test_file, "r", encoding="utf-8") as f:
        print("Content on disk:", f.read().strip())
    os.remove(test_file)
    print("\n>>> UWIE RUN_SEQUENCE TEST PASSED 100%! <<<")
else:
    print("FAILED to create file!")
