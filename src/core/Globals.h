#pragma once
#include <winsock2.h>
#include <windows.h>
#include <string>

extern std::string g_dynamicKey;

std::string GetLocalIP();
void GenerateDynamicKey();
bool IsWorkstationLocked();
