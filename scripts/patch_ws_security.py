import os

# 1. Update src/server/HttpRouter.cpp
with open('src/server/HttpRouter.cpp', 'r', encoding='utf-8') as f:
    router_code = f.read()

old_proxy_gate = """        if (request.find("gemini-proxy/") != std::string::npos) {

            if (!IsLoopbackPeer(clientSocket) && !RequestHasValidKey(request)) {

                std::string deny = "HTTP/1.1 403 Forbidden\\r\\nContent-Type: application/json\\r\\nConnection: close\\r\\n\\r\\n{\\"ok\\":false,\\"status\\":403,\\"error\\":\\"unauthorized\\"}";

                send(clientSocket, deny.c_str(), (int)deny.size(), 0);

                closesocket(clientSocket);

                return;

            }

            BridgeToGeminiProxy(clientSocket, request);

            return;

        }"""

new_proxy_gate = """        if (request.find("gemini-proxy/") != std::string::npos) {

            // Health ping is public; all operational endpoints (especially /ws/live) strictly require auth
            if (request.find("/api/health") == std::string::npos) {

                if (!RequestHasValidKey(request)) {

                    std::string deny = "HTTP/1.1 403 Forbidden\\r\\nContent-Type: application/json\\r\\nConnection: close\\r\\n\\r\n{\\"ok\\":false,\\"status\\":403,\\"error\\":\\"unauthorized\\"}";

                    send(clientSocket, deny.c_str(), (int)deny.size(), 0);

                    closesocket(clientSocket);

                    return;

                }

            }

            BridgeToGeminiProxy(clientSocket, request);

            return;

        }"""

assert old_proxy_gate in router_code, "old_proxy_gate not found"
router_code = router_code.replace(old_proxy_gate, new_proxy_gate)

with open('src/server/HttpRouter.cpp', 'w', encoding='utf-8') as f:
    f.write(router_code)
print("HttpRouter.cpp updated: /gemini-proxy/ strictly authenticated!")

# 2. Update gemini-proxy/server.js
with open('gemini-proxy/server.js', 'r', encoding='utf-8') as f:
    proxy_code = f.read()

old_upgrade = """  if (
    url === "/ws/live" ||
    url === "/gemini-proxy/ws/live" ||
    url.endsWith("/ws/live") ||
    url === "/gemini-proxy" ||
    url === "/"
  ) {
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
  }"""

new_upgrade = """  if (
    url === "/ws/live" ||
    url === "/gemini-proxy/ws/live" ||
    url.endsWith("/ws/live") ||
    url === "/gemini-proxy" ||
    url === "/"
  ) {
    const rawUrl = req.url || "";
    let providedKey = "";
    const keyMatch = rawUrl.match(/[?&]key=([^&#\\s]+)/);
    if (keyMatch) providedKey = decodeURIComponent(keyMatch[1]);
    if (!providedKey && req.headers["authorization"]) {
      providedKey = req.headers["authorization"].replace(/^Bearer\\s+/i, "").trim();
    }
    if (!providedKey && req.headers["x-panic-key"]) {
      providedKey = String(req.headers["x-panic-key"]).trim();
    }

    if (providedKey !== agentAccessKey()) {
      socket.write("HTTP/1.1 403 Forbidden\\r\\nContent-Type: application/json\\r\\nConnection: close\\r\\n\\r\\n{\\"ok\\":false,\\"error\\":\\"unauthorized\\"}");
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
  }"""

assert old_upgrade in proxy_code, "old_upgrade not found"
proxy_code = proxy_code.replace(old_upgrade, new_upgrade)

with open('gemini-proxy/server.js', 'w', encoding='utf-8') as f:
    f.write(proxy_code)
print("gemini-proxy/server.js updated: native WebSocket upgrade check added!")
