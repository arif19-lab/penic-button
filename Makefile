TARGET = PanicButton.exe
SERVICE_TARGET = PanicService.exe
DLL_TARGET = PanicProvider.dll

SRCS = src/main.cpp $(wildcard src/*/*.cpp)
SERVICE_SRCS = PanicService.cpp
DLL_SRCS = PanicProvider.cpp PanicCredential.cpp
DLL_DEF = PanicProvider.def
RES = resource.o

LDFLAGS = -Isrc -static -static-libgcc -static-libstdc++ -luser32 -lgdi32 -lole32 -luuid -lwinmm -lws2_32 -lgdiplus -lwtsapi32 -ld3d11 -ldxgi -lcrypt32 -lmfplat -lmfreadwrite -lmfuuid -loleaut32 -lstrmiids -lwinhttp
SERVICE_LDFLAGS = -static -static-libgcc -static-libstdc++ -lws2_32 -lwtsapi32 -luserenv -ladvapi32
DLL_LDFLAGS = -shared -static-libgcc -static-libstdc++ -lole32 -luuid -lshlwapi -lsecur32 -lcredui

all: $(TARGET) $(DLL_TARGET)

$(RES): resource.rc PanicButton.manifest
	windres resource.rc -o $(RES)

$(TARGET): $(SRCS) $(RES)
	g++ -O2 -std=c++17 -Wall -mwindows -o $(TARGET) $(SRCS) $(RES) $(LDFLAGS)

$(DLL_TARGET): $(DLL_SRCS) $(DLL_DEF)
	g++ -O2 -Wall -o $(DLL_TARGET) $(DLL_SRCS) $(DLL_DEF) $(DLL_LDFLAGS)

clean:
	-cmd /c "del /Q /F $(TARGET) $(SERVICE_TARGET) $(DLL_TARGET) $(RES) 2>nul"
