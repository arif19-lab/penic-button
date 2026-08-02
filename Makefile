TARGET = PanicButton.exe
SERVICE_TARGET = PanicService.exe
DLL_TARGET = PanicProvider.dll

SRCS = main.cpp
SERVICE_SRCS = PanicService.cpp
DLL_SRCS = PanicProvider.cpp PanicCredential.cpp
DLL_DEF = PanicProvider.def
RES = resource.o

LDFLAGS = -luser32 -lgdi32 -lole32 -luuid -lwinmm -lws2_32 -lgdiplus -lwtsapi32 -ld3d11 -ldxgi -lcrypt32 -lmfplat -lmfreadwrite -lmfuuid
SERVICE_LDFLAGS = -lwtsapi32 -luserenv -ladvapi32
DLL_LDFLAGS = -shared -lole32 -luuid -lshlwapi -lsecur32 -lcredui

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
	del /F /Q $(TARGET) $(SERVICE_TARGET) $(DLL_TARGET) $(RES)

