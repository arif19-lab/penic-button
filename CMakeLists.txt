cmake_minimum_required(VERSION 3.15)
project(PanicButton LANGUAGES CXX RC)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Optimization and release flags
add_compile_options(-O2 -Wall)

# Source files
file(GLOB_RECURSE SOURCES "src/*.cpp")

# Resource file
set(RESOURCE_FILES "resource.rc")

# Executable target
add_executable(PanicButton WIN32 ${SOURCES} ${RESOURCE_FILES})

# Include directories
target_include_directories(PanicButton PRIVATE src)

# Link libraries
target_link_libraries(PanicButton PRIVATE
    ws2_32
    winhttp
    gdiplus
    dxgi
    d3d11
    mfplat
    mfuuid
    wmcodecdspuuid
    strmiids
    uuid
    ole32
    oleaut32
    crypt32
    winmm
    wtsapi32
)

# Static linking for portability
target_link_options(PanicButton PRIVATE -static)
