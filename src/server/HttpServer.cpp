#include "HttpServer.h"
#include "HttpRouter.h"
#include "../core/Config.h"
#include "../core/Logger.h"
#include "../streaming/LiveBroadcaster.h"
#include <ws2tcpip.h>
#include <cstdio>

DWORD WINAPI ProcessClientThread(LPVOID lpParam) {
    SOCKET clientSocket = (SOCKET)(uintptr_t)lpParam;
    try {
        ProcessClient(clientSocket);
    } catch (...) {
        closesocket(clientSocket);
    }
    return 0;
}

DWORD WINAPI RemoteServerThread(LPVOID lpParam) {
    const char* LOG_PATH = "C:\\ProgramData\\PanicButton\\server_status.log";
    FILE* logF = fopen(LOG_PATH, "w");
    if (logF) { fprintf(logF, "RemoteServerThread started\n"); fflush(logF); }

    // 🎬 Initialize live broadcaster with native screen resolution
    g_live.InitDefaults();

    WSADATA wsaData;
    WSAStartup(MAKEWORD(2, 2), &wsaData);

    SOCKET serverSocket = INVALID_SOCKET;
    int attempt = 0;
    while (serverSocket == INVALID_SOCKET) {
        attempt++;
        serverSocket = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
        int opt = 1;
        setsockopt(serverSocket, SOL_SOCKET, SO_REUSEADDR, (const char*)&opt, sizeof(opt));

        sockaddr_in serverAddr;
        memset(&serverAddr, 0, sizeof(serverAddr));
        serverAddr.sin_family = AF_INET;
        serverAddr.sin_addr.s_addr = inet_addr("0.0.0.0");
        serverAddr.sin_port = htons(REMOTE_PORT);

        if (bind(serverSocket, (sockaddr*)&serverAddr, sizeof(serverAddr)) == SOCKET_ERROR) {
            int err = WSAGetLastError();
            if (logF) { fprintf(logF, "Bind attempt %d failed: err=%d\n", attempt, err); fflush(logF); }
            closesocket(serverSocket);
            serverSocket = INVALID_SOCKET;
            Sleep(500);
        }
    }

    if (logF) { fprintf(logF, "Bind SUCCESS on port 8080!\n"); fflush(logF); fclose(logF); }

    int listenRes = listen(serverSocket, SOMAXCONN);

  logF = fopen(LOG_PATH, "a");
    if (logF) { fprintf(logF, "Listen result: %d (err=%d)\n", listenRes, WSAGetLastError()); fflush(logF); }
    if (logF) { fprintf(logF, "Entering accept loop...\n"); fflush(logF); fclose(logF); }

    DWORD clientCount = 0;
    while (true) {
        SOCKET clientSocket = accept(serverSocket, NULL, NULL);
        if (clientSocket == INVALID_SOCKET) {
            int acceptErr = WSAGetLastError();
            logF = fopen(LOG_PATH, "a");
            if (logF) { fprintf(logF, "Accept invalid socket! err=%d\n", acceptErr); fflush(logF); fclose(logF); }
            if (acceptErr == WSAEINVAL || acceptErr == WSAENOTSOCK) break; // Fatal: stop looping
            Sleep(100);
            continue;
        }

        clientCount++;
        logF = fopen(LOG_PATH, "a");
        if (logF) { fprintf(logF, "Client #%lu connected!\n", clientCount); fflush(logF); fclose(logF); }

        CreateThread(NULL, 0, ProcessClientThread, (LPVOID)(uintptr_t)clientSocket, 0, NULL);
    }

    WSACleanup();
    return 0;
}
