#pragma once
#include <winsock2.h>
#include <windows.h>
#include <vector>
#include <thread>
#include <mutex>
#include <condition_variable>
#include <cstdint>

namespace Video {

class JpegBroadcaster {
public:
    static JpegBroadcaster& Instance();

    void ServeWebSocketClient(SOCKET sock);
    void ServeMjpegClient(SOCKET sock);

private:
    JpegBroadcaster();
    ~JpegBroadcaster();

    void EnsureRunning();
    void ClientDone();
    void CaptureLoop();

    std::mutex mtx;
    std::condition_variable cv;
    std::vector<uint8_t> latestFrame;
    uint64_t frameSeq;
    int subscribers;
    bool stopReq;
    std::thread worker;
};

} // namespace Video
