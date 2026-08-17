TARGET = PanicButton.exe
SERVICE_TARGET = PanicService.exe
DLL_TARGET = PanicProvider.dll

SRCS = main.cpp \
       src/core/App.cpp \
       src/core/Utils.cpp \
       src/video/DXGICapture.cpp \
       src/video/JpegStreamer.cpp \
       src/input/InputManager.cpp \
       src/server/WebSocket.cpp \
       src/server/HttpServer.cpp

SERVICE_SRCS = PanicService.cpp
DLL_SRCS = PanicProvider.cpp PanicCredential.cpp
DLL_DEF = PanicProvider.def
RES = resource.o

LDFLAGS = -static -static-libgcc -static-libstdc++ -luser32 -lgdi32 -lole32 -luuid -lwinmm -lws2_32 -lgdiplus -lwtsapi32 -ld3d11 -ldxgi -lcrypt32 -lmfplat -lmfreadwrite -lmfuuid -loleaut32 -lstrmiids -lwinhttp
SERVICE_LDFLAGS = -static -static-libgcc -static-libstdc++ -lws2_32 -lwtsapi32 -luserenv -ladvapi32
DLL_LDFLAGS = -shared -static-libgcc -static-libstdc++ -lole32 -luuid -lshlwapi -lsecur32 -lcredui

all: $(TARGET) $(SERVICE_TARGET) $(DLL_TARGET)

$(RES): resource.rc PanicButton.manifest
	windres resource.rc -o $(RES)

$(TARGET): $(SRCS) $(RES)
	g++ -O2 -Wall -mwindows -o $(TARGET) $(SRCS) $(RES) $(LDFLAGS)

$(SERVICE_TARGET): $(SERVICE_SRCS)
	g++ -O2 -Wall -o $(SERVICE_TARGET) $(SERVICE_SRCS) $(SERVICE_LDFLAGS)

$(DLL_TARGET): $(DLL_SRCS) $(DLL_DEF)
	g++ -O2 -Wall -o $(DLL_TARGET) $(DLL_SRCS) $(DLL_DEF) $(DLL_LDFLAGS)

clean:
	rm -f $(TARGET) $(SERVICE_TARGET) $(DLL_TARGET) $(RES)
