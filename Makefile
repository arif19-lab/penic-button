TARGET = PanicButton.exe
DLL_TARGET = PanicProvider.dll

SRCS = main.cpp
DLL_SRCS = PanicProvider.cpp PanicCredential.cpp
DLL_DEF = PanicProvider.def

LDFLAGS = -luser32 -lole32 -luuid -lwinmm -lws2_32 -lgdiplus
DLL_LDFLAGS = -shared -lole32 -luuid -lshlwapi -lsecur32 -lcredui

all: $(TARGET) $(DLL_TARGET)

$(TARGET): $(SRCS)
	g++ -O2 -Wall -mwindows -o $(TARGET) $(SRCS) $(LDFLAGS)

$(DLL_TARGET): $(DLL_SRCS) $(DLL_DEF)
	g++ -O2 -Wall -o $(DLL_TARGET) $(DLL_SRCS) $(DLL_DEF) $(DLL_LDFLAGS)

clean:
	del $(TARGET) $(DLL_TARGET)
