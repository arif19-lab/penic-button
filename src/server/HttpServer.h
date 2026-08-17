#pragma once
#include <winsock2.h>
#include <windows.h>
#include <string>
#include <thread>
#include <atomic>

namespace Server {

class HttpServer {
public:
    static HttpServer& Instance();

    bool Start(int port);
    void Stop();

private:
    HttpServer();
    ~HttpServer();

    void AcceptLoop();
    void HandleClient(SOCKET clientSocket);

    SOCKET serverSocket;
    int serverPort;
    std::atomic<bool> isRunning;
    std::thread acceptThread;
};

} // namespace Server
