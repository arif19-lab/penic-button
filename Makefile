TARGET = PanicButton.exe
DLL_TARGET = PanicProvider.dll

SRCS = main.cpp
DLL_SRCS = PanicProvider.cpp PanicCredential.cpp
DLL_DEF = PanicProvider.def
RES = resource.o

LDFLAGS = -luser32 -lgdi32 -lole32 -luuid -lwinmm -lws2_32 -lgdiplus -lwtsapi32 -ld3d11 -ldxgi
DLL_LDFLAGS = -shared -lole32 -luuid -lshlwapi -lsecur32 -lcredui

all: $(TARGET) $(DLL_TARGET)

$(RES): resource.rc PanicButton.manifest
	windres resource.rc -o $(RES)

$(TARGET): $(SRCS) $(RES)
	g++ -O2 -Wall -mwindows -o $(TARGET) $(SRCS) $(RES) $(LDFLAGS)

$(DLL_TARGET): $(DLL_SRCS) $(DLL_DEF)
	g++ -O2 -Wall -o $(DLL_TARGET) $(DLL_SRCS) $(DLL_DEF) $(DLL_LDFLAGS)

clean:
	del /F /Q $(TARGET) $(DLL_TARGET) $(RES)

