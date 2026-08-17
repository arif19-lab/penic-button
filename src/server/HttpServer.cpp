#include "HttpServer.h"
#include "WebSocket.h"
#include "../ui/DashboardHTML.h"
#include "../video/JpegStreamer.h"
#include "../input/InputManager.h"
#include "../core/Config.h"
#include "../core/Utils.h"
#include <ws2tcpip.h>
#include <vector>
#include <string>

namespace Server {

HttpServer& HttpServer::Instance() {
    static HttpServer inst;
    return inst;
}

HttpServer::HttpServer() : serverSocket(INVALID_SOCKET), serverPort(8080), isRunning(false) {}

HttpServer::~HttpServer() {
    Stop();
}

bool HttpServer::Start(int port) {
    serverPort = port;
    serverSocket = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (serverSocket == INVALID_SOCKET) return false;

    int opt = 1;
    setsockopt(serverSocket, SOL_SOCKET, SO_REUSEADDR, (const char*)&opt, sizeof(opt));

    sockaddr_in serverAddr;
    serverAddr.sin_family = AF_INET;
    serverAddr.sin_addr.s_addr = INADDR_ANY;
    serverAddr.sin_port = htons(serverPort);

    if (bind(serverSocket, (SOCKADDR*)&serverAddr, sizeof(serverAddr)) == SOCKET_ERROR) {
        closesocket(serverSocket);
        serverSocket = INVALID_SOCKET;
        return false;
    }

    if (listen(serverSocket, SOMAXCONN) == SOCKET_ERROR) {
        closesocket(serverSocket);
        serverSocket = INVALID_SOCKET;
        return false;
    }

    isRunning = true;
    acceptThread = std::thread(&HttpServer::AcceptLoop, this);
    return true;
}

void HttpServer::Stop() {
    isRunning = false;
    if (serverSocket != INVALID_SOCKET) {
        closesocket(serverSocket);
        serverSocket = INVALID_SOCKET;
    }
    if (acceptThread.joinable()) acceptThread.join();
}

void HttpServer::AcceptLoop() {
    while (isRunning) {
        sockaddr_in clientAddr;
        int clientAddrLen = sizeof(clientAddr);
        SOCKET clientSocket = accept(serverSocket, (SOCKADDR*)&clientAddr, &clientAddrLen);
        if (clientSocket == INVALID_SOCKET) {
            if (!isRunning) break;
            continue;
        }

        std::thread([this, clientSocket]() {
            HandleClient(clientSocket);
        }).detach();
    }
}

void HttpServer::HandleClient(SOCKET clientSocket) {
    char buffer[4096];
    int bytesReceived = recv(clientSocket, buffer, sizeof(buffer) - 1, 0);
    if (bytesReceived <= 0) {
        closesocket(clientSocket);
        return;
    }
    buffer[bytesReceived] = '\0';
    std::string request(buffer);

    if (request.find("OPTIONS ") != std::string::npos) {
        std::string res = "HTTP/1.1 200 OK\r\nAccess-Control-Allow-Origin: *\r\nAccess-Control-Allow-Headers: *\r\nAccess-Control-Allow-Methods: *\r\nContent-Length: 0\r\nConnection: close\r\n\r\n";
        send(clientSocket, res.c_str(), (int)res.size(), 0);
        closesocket(clientSocket);
        return;
    }

    // ⚡ WebSocket endpoint
    if (request.find("GET /ws") != std::string::npos || request.find("Upgrade: websocket") != std::string::npos) {
        size_t keyPos = request.find("Sec-WebSocket-Key: ");
        std::string wsKey = "";
        if (keyPos != std::string::npos) {
            size_t endPos = request.find("\r\n", keyPos);
            if (endPos != std::string::npos) {
                wsKey = request.substr(keyPos + 19, endPos - (keyPos + 19));
            }
        }
        std::string acceptKey = WebSocket::CalculateWebSocketAcceptKey(wsKey);
        std::string wsResponse =
            "HTTP/1.1 101 Switching Protocols\r\n"
            "Upgrade: websocket\r\n"
            "Connection: Upgrade\r\n"
            "Sec-WebSocket-Accept: " + acceptKey + "\r\n\r\n";
        send(clientSocket, wsResponse.c_str(), (int)wsResponse.size(), 0);

        Video::JpegBroadcaster::Instance().ServeWebSocketClient(clientSocket);
        return;
    }

    // ⚡ MJPEG endpoint
    if (request.find("GET /mjpeg") != std::string::npos) {
        std::string header = 
            "HTTP/1.1 200 OK\r\n"
            "Content-Type: multipart/x-mixed-replace; boundary=frame\r\n"
            "Cache-Control: no-cache, private\r\n"
            "Pragma: no-cache\r\n"
            "Access-Control-Allow-Origin: *\r\n"
            "Connection: close\r\n\r\n";
        send(clientSocket, header.c_str(), (int)header.size(), 0);
        Video::JpegBroadcaster::Instance().ServeMjpegClient(clientSocket);
        return;
    }

    // ⚡ Mouse / Touch API
    if (request.find("GET /api/mouse_rel") != std::string::npos) {
        size_t pdx = request.find("dx=");
        size_t pdy = request.find("dy=");
        size_t pc  = request.find("click=");
        size_t ps  = request.find("scroll=");

        int dxVal = pdx != std::string::npos ? atoi(request.c_str() + pdx + 3) : 0;
        int dyVal = pdy != std::string::npos ? atoi(request.c_str() + pdy + 3) : 0;
        int clickVal = pc != std::string::npos ? atoi(request.c_str() + pc + 6) : 0;
        int scrollVal = ps != std::string::npos ? atoi(request.c_str() + ps + 7) : 0;

        if (dxVal != 0 || dyVal != 0) Input::MouseMove(dxVal, dyVal);
        if (scrollVal != 0) Input::MouseWheel(scrollVal);
        if (clickVal == 1) Input::MouseClick(false);
        else if (clickVal == 2) Input::MouseClick(true);

        std::string res = "HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: 2\r\nAccess-Control-Allow-Origin: *\r\nConnection: close\r\n\r\nOK";
        send(clientSocket, res.c_str(), (int)res.size(), 0);
        closesocket(clientSocket);
        return;
    }

    // ⚡ Keyboard Type API
    if (request.find("GET /api/type") != std::string::npos) {
        size_t textPos = request.find("text=");
        if (textPos != std::string::npos) {
            size_t spacePos = request.find(" ", textPos);
            size_t ampPos = request.find("&", textPos);
            size_t endPos = (ampPos != std::string::npos && ampPos < spacePos) ? ampPos : spacePos;
            std::string rawText = request.substr(textPos + 5, endPos - (textPos + 5));

            std::string decodedText = "";
            for (size_t i = 0; i < rawText.length(); i++) {
                if (rawText[i] == '%' && i + 2 < rawText.length()) {
                    int hexVal = 0;
                    sscanf(rawText.substr(i + 1, 2).c_str(), "%x", &hexVal);
                    decodedText += (char)hexVal;
                    i += 2;
                } else if (rawText[i] == '+') {
                    decodedText += ' ';
                } else {
                    decodedText += rawText[i];
                }
            }

            if (decodedText == "{ENTER}") Input::SendVirtualKey(VK_RETURN);
            else if (decodedText == "{BACKSPACE}") Input::SendVirtualKey(VK_BACK);
            else if (decodedText == "{ESC}") Input::SendVirtualKey(VK_ESCAPE);
            else if (decodedText == "{TAB}") Input::SendVirtualKey(VK_TAB);
            else Input::KeyboardType(decodedText);
        }
        std::string res = "HTTP/1.1 200 OK\r\nAccess-Control-Allow-Origin: *\r\nConnection: close\r\n\r\nOK";
        send(clientSocket, res.c_str(), (int)res.size(), 0);
        closesocket(clientSocket);
        return;
    }

    // ⚡ Panic Trigger API
    if (request.find("GET /panic") != std::string::npos) {
        Input::LockWorkstation();
        Input::ToggleMute();
        std::string res = "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n\r\n{\"panic\":true}";
        send(clientSocket, res.c_str(), (int)res.size(), 0);
        closesocket(clientSocket);
        return;
    }

    // ⚡ Telemetry Logger API
    if (request.find("/api/client_telemetry") != std::string::npos) {
        size_t bodyPos = request.find("\r\n\r\n");
        std::string body = (bodyPos != std::string::npos) ? request.substr(bodyPos + 4) : "";
        if (!body.empty()) {
            FILE* f = fopen("C:\\ProgramData\\PanicButton\\phone_live_debug.log", "a");
            if (f) {
                time_t now = time(NULL);
                char tbuf[64]; strftime(tbuf, sizeof(tbuf), "%Y-%m-%d %H:%M:%S", localtime(&now));
                fprintf(f, "[%s] %s\n", tbuf, body.c_str());
                fclose(f);
            }
        }
        std::string res = "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\nConnection: close\r\n\r\n{\"ok\":true}";
        send(clientSocket, res.c_str(), (int)res.size(), 0);
        closesocket(clientSocket);
        return;
    }

    // ⚡ Status Polling API
    if (request.find("GET /api/status") != std::string::npos) {
        std::string res = "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n\r\n{\"status\":\"running\",\"fps\":90}";
        send(clientSocket, res.c_str(), (int)res.size(), 0);
        closesocket(clientSocket);
        return;
    }

    // ⚡ Default HTML Web UI
    std::string html = UI::GetDashboardHTML();
    std::string httpResponse =
        "HTTP/1.1 200 OK\r\n"
        "Content-Type: text/html; charset=utf-8\r\n"
        "Cache-Control: no-cache, no-store\r\n"
        "Content-Length: " + std::to_string(html.size()) + "\r\n"
        "Access-Control-Allow-Origin: *\r\n"
        "Connection: close\r\n\r\n" + html;

    send(clientSocket, httpResponse.c_str(), (int)httpResponse.size(), 0);
    shutdown(clientSocket, SD_SEND);
    closesocket(clientSocket);
}

} // namespace Server
