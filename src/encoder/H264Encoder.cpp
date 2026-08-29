#include "H264Encoder.h"

// -- global stream-info cache (filled by background probe thread, mutex-protected) --
std::string g_streamCodec = "avc1.42001E";
int g_streamW = 0, g_streamH = 0;
bool g_streamInfoReady = false;
std::mutex g_streamInfoMutex;
std::vector<uint8_t> g_probeSPS, g_probePPS;
