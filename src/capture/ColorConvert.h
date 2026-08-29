#pragma once

#include <cstdint>

// 🚀 ULTRA-FAST VECTORIZED / PARALLEL BGRA -> NV12 CONVERTER (<1ms on CPU!)
void BGRAtoNV12(const uint8_t* bgra, int w, int h, uint8_t* nv12);
