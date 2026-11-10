import re

with open(r'C:\Users\Imran\panic-button\src\server\HttpRouter.cpp', 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

for i, l in enumerate(lines):
    if any(k in l for k in ['TouchInjector', 'KeyboardInjector', 'Inject', 'mouse', 'click', 'websocket']):
        if not l.strip().startswith('//'):
            print(f"L{i+1}: {l.strip()[:100]}")
