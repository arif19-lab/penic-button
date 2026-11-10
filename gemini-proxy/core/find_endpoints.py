import re

with open(r'C:\Users\Imran\panic-button\src\server\HttpRouter.cpp', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

matches = re.findall(r'(\"/(?:api/)?[a-zA-Z0-9_\-/]+\")', text)
print('Endpoints in HttpRouter.cpp:')
for m in sorted(set(matches)):
    print(' -', m)
