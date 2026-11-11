import os

# 1. Update HttpRouter.cpp
with open('src/server/HttpRouter.cpp', 'r', encoding='utf-8') as f:
    code = f.read()

old_fn = """static bool RequestHasValidKey(const std::string& request, bool* usedCurrentKey = nullptr) {

    EnsureAuthKeyLoaded();

    size_t pos = request.find("key=");

    while (pos != std::string::npos) {

        size_t start = pos + 4;

        size_t end = request.find_first_of(" &\\r\\n\\"", start);

        std::string value = request.substr(start, (end == std::string::npos ? request.size() : end) - start);

        if (!value.empty()) {

            if (value == g_dynamicKey) {

                if (usedCurrentKey) *usedCurrentKey = true;

                return true;

            }

        }

        pos = request.find("key=", start);

    }

    return false;

}"""

new_fn = """static bool RequestHasValidKey(const std::string& request, bool* usedCurrentKey = nullptr) {

    EnsureAuthKeyLoaded();



    // 1. Authorization: Bearer <token>

    size_t authPos = request.find("Authorization: Bearer ");

    if (authPos == std::string::npos) authPos = request.find("authorization: bearer ");

    if (authPos != std::string::npos) {

        size_t start = authPos + 22;

        size_t end = request.find_first_of("\\r\\n ", start);

        std::string val = request.substr(start, (end == std::string::npos ? request.size() : end) - start);

        if (!val.empty() && val == g_dynamicKey) {

            if (usedCurrentKey) *usedCurrentKey = true;

            return true;

        }

    }



    // 2. X-Panic-Key: <token>

    size_t xPos = request.find("X-Panic-Key: ");

    if (xPos == std::string::npos) xPos = request.find("x-panic-key: ");

    if (xPos != std::string::npos) {

        size_t start = xPos + 13;

        size_t end = request.find_first_of("\\r\\n ", start);

        std::string val = request.substr(start, (end == std::string::npos ? request.size() : end) - start);

        if (!val.empty() && val == g_dynamicKey) {

            if (usedCurrentKey) *usedCurrentKey = true;

            return true;

        }

    }



    // 3. Query parameter: key=<token> (safe fallback for QR links and WebSockets)

    size_t pos = request.find("key=");

    while (pos != std::string::npos) {

        size_t start = pos + 4;

        size_t end = request.find_first_of(" &\\r\\n\\"", start);

        std::string value = request.substr(start, (end == std::string::npos ? request.size() : end) - start);

        if (!value.empty()) {

            if (value == g_dynamicKey) {

                if (usedCurrentKey) *usedCurrentKey = true;

                return true;

            }

        }

        pos = request.find("key=", start);

    }

    return false;

}"""

assert old_fn in code, "old_fn not found in HttpRouter.cpp"
code = code.replace(old_fn, new_fn)

with open('src/server/HttpRouter.cpp', 'w', encoding='utf-8') as f:
    f.write(code)
print("HttpRouter.cpp updated with Authorization Header support!")

# 2. Update PanicService.cpp
with open('PanicService.cpp', 'r', encoding='utf-8') as f:
    svc_code = f.read()

old_svc_has_key = """static bool SvcHasKey(const std::string& req) {
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

new_svc_has_key = """static bool SvcHasKey(const std::string& req) {
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

    // 3. Query parameter: key=
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

assert old_svc_has_key in svc_code, "old_svc_has_key not found in PanicService.cpp"
svc_code = svc_code.replace(old_svc_has_key, new_svc_has_key)

with open('PanicService.cpp', 'w', encoding='utf-8') as f:
    f.write(svc_code)
print("PanicService.cpp updated with Authorization Header support!")
