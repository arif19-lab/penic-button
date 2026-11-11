import os

with open('src/server/HttpRouter.cpp', 'rb') as f:
    data = f.read().decode('utf-8')

bad_block = """                    std::string deny = "HTTP/1.1 403 Forbidden\\r\\nContent-Type: application/json\\r\\nConnection: close\\r\\n\\r\r
{\\"ok\\":false,\\"status\\":403,\\"error\\":\\"unauthorized\\"}";"""

# Or let's use regex to fix any newline in deny
import re
fixed_data = re.sub(
    r'std::string deny = "HTTP/1\.1 403 Forbidden.*?\{\\"ok\\":false,\\"status\\":403,\\"error\\":\\"unauthorized\\"\}"\;',
    'std::string deny = "HTTP/1.1 403 Forbidden\\\\r\\\\nContent-Type: application/json\\\\r\\\\nConnection: close\\\\r\\\\n\\\\r\\\\n{\\\\"ok\\\\":false,\\\\"status\\\\":403,\\\\"error\\\\":\\\\"unauthorized\\\\"}";'.replace('\\\\', '\\'),
    data,
    flags=re.DOTALL
)

with open('src/server/HttpRouter.cpp', 'wb') as f:
    f.write(fixed_data.encode('utf-8'))
print("HttpRouter.cpp fixed successfully!")
