import os

with open('PanicService.cpp', 'r', encoding='utf-8') as f:
    svc_code = f.read()

old_block = """static bool SvcHasKey(const std::string& req) {
    size_t pos = req.find("key=");
    while (pos != std::string::npos) {
        size_t start = pos + 4;
        size_t end = req.find_first_of(" &\\r\\n\\"", start);
        std::string value = req.substr(start, (end == std::string::npos ? req.size() : end) - start);
        if (!value.empty()) {
            if (value == SvcAuthKey() || value == "imran2024") return true;
        }
        pos = req.find("key=", start);
    }
    return false;
}"""

new_block = """static bool SvcHasKey(const std::string& req) {
    // 1. Authorization: Bearer <token>
    size_t authPos = req.find("Authorization: Bearer ");
    if (authPos == std::string::npos) authPos = req.find("authorization: bearer ");
    if (authPos != std::string::npos) {
        size_t start = authPos + 22;
        size_t end = req.find_first_of("\\r\\n ", start);
        std::string val = req.substr(start, (end == std::string::npos ? req.size() : end) - start);
        if (!val.empty() && val == SvcAuthKey()) return true;
    }

    // 2. X-Panic-Key: <token>
    size_t xPos = req.find("X-Panic-Key: ");
    if (xPos == std::string::npos) xPos = req.find("x-panic-key: ");
    if (xPos != std::string::npos) {
        size_t start = xPos + 13;
        size_t end = req.find_first_of("\\r\\n ", start);
        std::string val = req.substr(start, (end == std::string::npos ? req.size() : end) - start);
        if (!val.empty() && val == SvcAuthKey()) return true;
    }

    // 3. Query parameter key=
    size_t pos = req.find("key=");
    while (pos != std::string::npos) {
        size_t start = pos + 4;
        size_t end = req.find_first_of(" &\\r\\n\\"", start);
        std::string value = req.substr(start, (end == std::string::npos ? req.size() : end) - start);
        if (!value.empty()) {
            if (value == SvcAuthKey()) return true;
        }
        pos = req.find("key=", start);
    }
    return false;
}"""

assert old_block.replace('\r\n', '\n') in svc_code.replace('\r\n', '\n')
if old_block in svc_code:
    svc_code = svc_code.replace(old_block, new_block)
else:
    svc_code = svc_code.replace(old_block.replace('\r\n', '\n'), new_block.replace('\r\n', '\n'))

with open('PanicService.cpp', 'w', encoding='utf-8') as f:
    f.write(svc_code)
print("PanicService.cpp successfully updated!")
