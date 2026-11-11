with open('src/server/HttpRouter.cpp', 'r', encoding='utf-8') as f:
    text = f.read()

import re
text = re.sub(
    r'std::string deny = "HTTP/1\.1 403 Forbidden[^;]+;',
    r'std::string deny = "HTTP/1.1 403 Forbidden\\r\\nContent-Type: application/json\\r\\nConnection: close\\r\\n\\r\\n{\\"ok\\":false,\\"status\\":403,\\"error\\":\\"unauthorized\\"}";',
    text
)

with open('src/server/HttpRouter.cpp', 'w', encoding='utf-8') as f:
    f.write(text)
print("Single-line deny string written!")
