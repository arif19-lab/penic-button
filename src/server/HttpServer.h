#pragma once
#include <winsock2.h>
#include <windows.h>

// Forward declaration
void ProcessClient(SOCKET clientSocket);

// Thread wrapper for ProcessClient
DWORD WINAPI ProcessClientThread(LPVOID lpParam);

// Master TCP listener on port 8080
DWORD WINAPI RemoteServerThread(LPVOID lpParam);
