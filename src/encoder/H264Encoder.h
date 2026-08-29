#pragma once

#include <windows.h>
#include <mfapi.h>
#include <mfidl.h>
#include <mftransform.h>
#include <mferror.h>
#include <codecapi.h>
#include <strmif.h>
#include <vector>
#include <string>
#include <mutex>
#include <cstdint>
#include <cstdio>

// ---- byte writer helpers ----
static inline void W32B(std::vector<uint8_t>& b, uint32_t v) {
    b.push_back((v >> 24) & 0xFF); b.push_back((v >> 16) & 0xFF);
    b.push_back((v >> 8) & 0xFF);  b.push_back(v & 0xFF);
}
static inline void W16B(std::vector<uint8_t>& b, uint16_t v) { b.push_back((v >> 8) & 0xFF); b.push_back(v & 0xFF); }
static inline void W8B(std::vector<uint8_t>& b, uint8_t v) { b.push_back(v); }
static inline void W32AtB(std::vector<uint8_t>& b, size_t pos, uint32_t v) {
    b[pos]=(v>>24)&0xFF; b[pos+1]=(v>>16)&0xFF; b[pos+2]=(v>>8)&0xFF; b[pos+3]=v&0xFF;
}
static inline void CCB(std::vector<uint8_t>& b, const char* c) { b.push_back(c[0]); b.push_back(c[1]); b.push_back(c[2]); b.push_back(c[3]); }
static inline size_t BoxB(std::vector<uint8_t>& b, const char* c) { size_t p=b.size(); W32B(b,0); CCB(b,c); return p; }
static inline void EndBoxB(std::vector<uint8_t>& b, size_t p) { W32AtB(b,p,(uint32_t)(b.size()-p)); }

static inline size_t FindSCB(const std::vector<uint8_t>& d, size_t from) {
    for (size_t i = from; i + 3 < d.size(); i++) {
        if (d[i]==0 && d[i+1]==0) {
            if (d[i+2]==1) return i+3;
            if (d[i+2]==0 && d[i+3]==1) return i+4;
        }
    }
    return std::string::npos;
}

// -- global stream-info cache (filled by background probe thread, mutex-protected) --
extern std::string g_streamCodec;
extern int g_streamW, g_streamH;
extern bool g_streamInfoReady;
extern std::mutex g_streamInfoMutex;
extern std::vector<uint8_t> g_probeSPS, g_probePPS; // canonical SPS/PPS for a stable init segment

class H264Streamer {
public:
    std::vector<uint8_t> initSeg;
    std::vector<uint8_t> sps, pps;
    std::string codec;
    int width = 0, height = 0;
    bool initDone = false;
    int totalSamples = 0;

    ~H264Streamer() { Cleanup(); }

    // Create encoder for WxH at 30fps. Returns true on success.
    bool Init(int w, int h) {
        w &= ~1; h &= ~1; // NV12 needs even dimensions
        width = w; height = h;
        CoInitializeEx(NULL, COINIT_MULTITHREADED);
        HRESULT hr = MFStartup(MF_VERSION, MFSTARTUP_FULL);
        if (FAILED(hr)) return false;
        m_hasMF = true;

        // 1. Find ANY H.264 encoder MFT (AMD, NVIDIA, Intel, or Microsoft)
        IMFActivate** ppAct = NULL; UINT32 cnt = 0;
        MFTEnumEx(MFT_CATEGORY_VIDEO_ENCODER, MFT_ENUM_FLAG_ALL, NULL, NULL, &ppAct, &cnt);
        GUID cls = {0};
        for (UINT32 i = 0; i < cnt; i++) {
            WCHAR* nm = NULL; UINT32 l = 0;
            ppAct[i]->GetAllocatedString(MFT_FRIENDLY_NAME_Attribute, &nm, &l);
            if (nm && (wcsstr(nm, L"H264") || wcsstr(nm, L"H.264")) && !wcsstr(nm, L"Decoder")) {
                ppAct[i]->GetGUID(MFT_TRANSFORM_CLSID_Attribute, &cls);
                if (nm) CoTaskMemFree(nm);
                break;
            }
            if (nm) CoTaskMemFree(nm);
        }
        for (UINT32 i = 0; i < cnt; i++) ppAct[i]->Release();
        if (ppAct) CoTaskMemFree(ppAct);

        // Fallback to Microsoft H.264 Encoder MFT ({62268A69-3D7E-426C-A0B0-0435D3088C31}) if not found
        if (cls.Data1 == 0) {
            CLSIDFromString(L"{62268A69-3D7E-426C-A0B0-0435D3088C31}", &cls);
        }

        hr = CoCreateInstance(cls, NULL, CLSCTX_INPROC_SERVER, IID_IMFTransform, (void**)&m_enc);
        if (FAILED(hr)) return false;

        // 💎 ULTRA-LOW LATENCY 60 FPS PARSEC-GRADE HARDWARE H.264 PRESET
        uint32_t bitrate = 3500000; // 3.5 Mbps smooth 60 FPS stream (zero Wi-Fi buffer bloat)
        IMFMediaType* pOut = NULL; MFCreateMediaType(&pOut);
        pOut->SetGUID(MF_MT_MAJOR_TYPE, MFMediaType_Video);
        pOut->SetGUID(MF_MT_SUBTYPE, MFVideoFormat_H264);
        MFSetAttributeSize(pOut, MF_MT_FRAME_SIZE, w, h);
        MFSetAttributeRatio(pOut, MF_MT_FRAME_RATE, 60, 1);
        MFSetAttributeRatio(pOut, MF_MT_PIXEL_ASPECT_RATIO, 1, 1);
        pOut->SetUINT32(MF_MT_INTERLACE_MODE, MFVideoInterlace_Progressive);
        pOut->SetUINT32(MF_MT_AVG_BITRATE, bitrate);
        pOut->SetUINT32(MF_MT_MPEG2_PROFILE, eAVEncH264VProfile_Main);
        hr = m_enc->SetOutputType(0, pOut, 0);
        if (FAILED(hr)) {
            pOut->SetUINT32(MF_MT_MPEG2_PROFILE, eAVEncH264VProfile_Base);
            hr = m_enc->SetOutputType(0, pOut, 0);
            if (FAILED(hr)) { pOut->Release(); return false; }
        }
        pOut->Release();

        // 3. Input type: NV12
        IMFMediaType* pIn = NULL; MFCreateMediaType(&pIn);
        pIn->SetGUID(MF_MT_MAJOR_TYPE, MFMediaType_Video);
        pIn->SetGUID(MF_MT_SUBTYPE, MFVideoFormat_NV12);
        MFSetAttributeSize(pIn, MF_MT_FRAME_SIZE, w, h);
        MFSetAttributeRatio(pIn, MF_MT_FRAME_RATE, 60, 1);
        MFSetAttributeRatio(pIn, MF_MT_PIXEL_ASPECT_RATIO, 1, 1);
        pIn->SetUINT32(MF_MT_INTERLACE_MODE, MFVideoInterlace_Progressive);
        hr = m_enc->SetInputType(0, pIn, 0);
        pIn->Release();
        if (FAILED(hr)) return false;

        m_enc->ProcessMessage(MFT_MESSAGE_COMMAND_FLUSH, 0);
        m_enc->ProcessMessage(MFT_MESSAGE_NOTIFY_BEGIN_STREAMING, 0);
        m_enc->ProcessMessage(MFT_MESSAGE_NOTIFY_START_OF_STREAM, 0);

        // 💎 ICodecAPI Ultra Low Latency tuning (CBR, 1s GOP, 0 B-frames, sub-frame mode)
        ICodecAPI* pCodec = NULL;
        m_enc->QueryInterface(IID_ICodecAPI, (void**)&pCodec);
        if (pCodec) {
            VARIANT v; VariantInit(&v);
            v.vt = VT_I4; v.lVal = eAVEncCommonRateControlMode_CBR;
            pCodec->SetValue(&CODECAPI_AVEncCommonRateControlMode, &v);
            v.vt = VT_UI4; v.ulVal = bitrate;
            pCodec->SetValue(&CODECAPI_AVEncCommonMeanBitRate, &v);
            v.vt = VT_UI4; v.ulVal = 60; // keyframe every 60 frames (1 second at 60 FPS)
            pCodec->SetValue(&CODECAPI_AVEncMPVGOPSize, &v);
            v.vt = VT_UI4; v.ulVal = 0; // zero B-frames -> no reorder latency
            pCodec->SetValue(&CODECAPI_AVEncMPVDefaultBPictureCount, &v);
            v.vt = VT_UI4; v.ulVal = 20; // prioritize maximum speed and low latency
            pCodec->SetValue(&CODECAPI_AVEncCommonQualityVsSpeed, &v);
            v.vt = VT_BOOL; v.boolVal = VARIANT_TRUE; // CABAC entropy coding
            pCodec->SetValue(&CODECAPI_AVEncH264CABACEnable, &v);
            v.vt = VT_BOOL; v.boolVal = VARIANT_TRUE; // Ultra low-latency slice encoding
            pCodec->SetValue(&CODECAPI_AVLowLatencyMode, &v);
            VariantClear(&v);
            pCodec->Release();
        }

        MFT_OUTPUT_STREAM_INFO oi = {0};
        m_enc->GetOutputStreamInfo(0, &oi);
        m_outCb = oi.cbSize ? oi.cbSize : 1024 * 1024;
        return true;
    }

    // Encode one NV12 frame (30fps implied). Samples accumulate internally.
    bool EncodeFrame(const uint8_t* nv12, LONG64 time100ns) {
        if (!m_enc) return false;
        IMFSample* ps = NULL; IMFMediaBuffer* pb = NULL;
        MFCreateSample(&ps); MFCreateMemoryBuffer((DWORD)frameSize(), &pb);
        BYTE* pd = NULL; DWORD ml = 0, cl = 0;
        pb->Lock(&pd, &ml, &cl);
        memcpy(pd, nv12, frameSize());
        pb->SetCurrentLength((DWORD)frameSize()); pb->Unlock();
        ps->AddBuffer(pb);
        ps->SetSampleTime(time100ns);
        ps->SetSampleDuration(333333);
        HRESULT hr = m_enc->ProcessInput(0, ps, 0);
        ps->Release(); pb->Release();
        if (FAILED(hr)) return false;
        DrainEncoder();
        return true;
    }

    // Collect next fragment (moof+mdat). Flushes the batch when it has >=10
    // samples or an IDR arrived (so fragments stay small for low latency).
    bool TakeFragment(std::vector<uint8_t>& frag, bool force = false, bool* outSync = NULL) {
        frag.clear();
        if (m_batch.empty()) return false;
        if (!force && (int)m_batch.size() < 10 && !m_batchHasIDR) return false;
        if (outSync) *outSync = m_batchHasIDR;
        BuildFragment(frag, m_batch, m_batchSync, m_batchDur);
        m_batch.clear(); m_batchSync.clear(); m_batchDur.clear();
        m_batchHasIDR = false;
        return true;
    }

    size_t frameSize() const { return (size_t)width * height * 3 / 2; }
    bool Ready() const { return initDone; }
    void Cleanup() {
        if (m_enc) { m_enc->Release(); m_enc = NULL; }
        if (m_hasMF) { MFShutdown(); m_hasMF = false; }
        CoUninitialize();
    }

private:
    void DrainEncoder() {
        for (int t = 0; t < 24; t++) {
            MFT_OUTPUT_DATA_BUFFER ob = {0}; ob.dwStreamID = 0;
            IMFSample* pos = NULL; MFCreateSample(&pos);
            IMFMediaBuffer* pob = NULL; MFCreateMemoryBuffer(m_outCb, &pob);
            pob->SetCurrentLength(0); pos->AddBuffer(pob); pob->Release();
            ob.pSample = pos; DWORD st = 0;
            HRESULT hr = m_enc->ProcessOutput(0, 1, &ob, &st);
            if (hr == MF_E_TRANSFORM_NEED_MORE_INPUT || FAILED(hr)) { pos->Release(); break; }
            IMFMediaBuffer* pb2 = NULL; pos->GetBufferByIndex(0, &pb2);
            BYTE* po = NULL; DWORD ol = 0;
            pb2->Lock(&po, NULL, &ol);
            std::vector<uint8_t> raw(po, po + ol);
            pb2->Unlock(); pb2->Release(); pos->Release();
            HandleSample(raw);
        }
    }

    void HandleSample(const std::vector<uint8_t>& raw) {
        // Annex-B -> length-prefixed NALs, extract SPS/PPS, detect IDR
        std::vector<uint8_t> lp; bool idr = false;
        std::vector<size_t> nals;
        size_t sc = FindSCB(raw, 0);
        while (sc != std::string::npos) { nals.push_back(sc); sc = FindSCB(raw, sc + 1); }
        if (nals.empty()) { lp = raw; }
        for (size_t n = 0; n < nals.size(); n++) {
            size_t st = nals[n]; size_t en = (n + 1 < nals.size()) ? nals[n + 1] : raw.size();
            size_t len = en - st; if (len == 0) continue;
            uint8_t t = raw[st] & 0x1F;
            if (t == 7 && sps.empty()) sps.assign(raw.begin() + st, raw.begin() + en);
            else if (t == 8 && pps.empty()) pps.assign(raw.begin() + st, raw.begin() + en);
            else if (t == 5) idr = true;
            if (t != 9 && t != 6) {
                uint32_t L = (uint32_t)len;
                lp.push_back((L >> 24) & 0xFF); lp.push_back((L >> 16) & 0xFF);
                lp.push_back((L >> 8) & 0xFF); lp.push_back(L & 0xFF);
                lp.insert(lp.end(), raw.begin() + st, raw.begin() + en);
            }
        }
        if (lp.empty()) return;
        totalSamples++;
        if (!initDone && !sps.empty() && !pps.empty()) {
            BuildInit();
            initDone = true;
        }
        if (!initDone) return;
        if (idr) m_batchHasIDR = true;
        m_batch.push_back(lp);
        m_batchSync.push_back(idr);
        m_batchDur.push_back(3000); // 90000/30 fps
    }

    void BuildInit() {
        int w = width, h = height;
        // 🎯 CRITICAL FIX (reload black screen): use THIS encoder's own SPS/PPS.
        // Using the probe-cached SPS/PPS made avcC mismatch the real in-band SPS
        // of later encoder instances -> decoder mismatch -> black screen on reload.
        // Each stream is self-contained now (client also parses codec from avcC).
        const std::vector<uint8_t>& useSPS = sps;
        const std::vector<uint8_t>& usePPS = pps;
        initSeg.clear();
        size_t f = BoxB(initSeg, "ftyp"); CCB(initSeg, "isom"); W32B(initSeg, 0);
        CCB(initSeg, "isom"); CCB(initSeg, "iso2"); CCB(initSeg, "avc1"); CCB(initSeg, "mp41");
        EndBoxB(initSeg, f);
        size_t moov = BoxB(initSeg, "moov");
        {   // mvhd v0 = 108 bytes
            size_t b = BoxB(initSeg, "mvhd");
            W32B(initSeg, 0);
            W32B(initSeg, 0); W32B(initSeg, 0);
            W32B(initSeg, 90000);
            W32B(initSeg, 0);
            W32B(initSeg, 0x00010000);
            W16B(initSeg, 0x0100); W16B(initSeg, 0);
            W32B(initSeg, 0); W32B(initSeg, 0);
            W32B(initSeg, 0x00010000); W32B(initSeg, 0); W32B(initSeg, 0);
            W32B(initSeg, 0); W32B(initSeg, 0x00010000); W32B(initSeg, 0);
            W32B(initSeg, 0); W32B(initSeg, 0); W32B(initSeg, 0x40000000);
            for (int i = 0; i < 6; i++) W32B(initSeg, 0);
            W32B(initSeg, 2);
            EndBoxB(initSeg, b);
        }
        {   // trak
            size_t trak = BoxB(initSeg, "trak");
            {   // tkhd v0 = 92 bytes
                size_t b = BoxB(initSeg, "tkhd");
                W32B(initSeg, 0x000007);
                W32B(initSeg, 0); W32B(initSeg, 0);
                W32B(initSeg, 1);
                W32B(initSeg, 0);
                W32B(initSeg, 0);
                W32B(initSeg, 0); W32B(initSeg, 0);
                W16B(initSeg, 0); W16B(initSeg, 0);
                W16B(initSeg, 0); W16B(initSeg, 0);
                W32B(initSeg, 0x00010000); W32B(initSeg, 0); W32B(initSeg, 0);
                W32B(initSeg, 0); W32B(initSeg, 0x00010000); W32B(initSeg, 0);
                W32B(initSeg, 0); W32B(initSeg, 0); W32B(initSeg, 0x40000000);
                W32B(initSeg, (uint32_t)w << 16);
                W32B(initSeg, (uint32_t)h << 16);
                EndBoxB(initSeg, b);
            }
            {   // mdia
                size_t mdia = BoxB(initSeg, "mdia");
                {   // mdhd v0 = 32 bytes
                    size_t b = BoxB(initSeg, "mdhd");
                    W32B(initSeg, 0);
                    W32B(initSeg, 0); W32B(initSeg, 0);
                    W32B(initSeg, 90000);
                    W32B(initSeg, 0);
                    W16B(initSeg, 0x55C4); W16B(initSeg, 0);
                    EndBoxB(initSeg, b);
                }
                {   // hdlr = 33 bytes
                    size_t b = BoxB(initSeg, "hdlr");
                    W32B(initSeg, 0);
                    W32B(initSeg, 0);
                    CCB(initSeg, "vide");
                    W32B(initSeg, 0); W32B(initSeg, 0); W32B(initSeg, 0);
                    W8B(initSeg, 0);
                    EndBoxB(initSeg, b);
                }
                {   // minf
                    size_t minf = BoxB(initSeg, "minf");
                    {   // vmhd = 20 bytes
                        size_t b = BoxB(initSeg, "vmhd");
                        W32B(initSeg, 1);
                        W16B(initSeg, 0);
                        W16B(initSeg, 0); W16B(initSeg, 0); W16B(initSeg, 0);
                        EndBoxB(initSeg, b);
                    }
                    {   // dinf
                        size_t dinf = BoxB(initSeg, "dinf");
                        {   // dref = 28 bytes
                            size_t b = BoxB(initSeg, "dref");
                            W32B(initSeg, 0); W32B(initSeg, 1);
                            {   // url self-contained = 12 bytes
                                size_t u = BoxB(initSeg, "url ");
                                W32B(initSeg, 1);
                                EndBoxB(initSeg, u);
                            }
                            EndBoxB(initSeg, b);
                        }
                        EndBoxB(initSeg, dinf);
                    }
                    {   // stbl
                        size_t stbl = BoxB(initSeg, "stbl");
                        {   // stsd
                            size_t b = BoxB(initSeg, "stsd");
                            W32B(initSeg, 0); W32B(initSeg, 1);
                            {   // avc1 visual sample entry (ISO 14496-12, fixed header = 78 bytes)
                                size_t a = BoxB(initSeg, "avc1");
                                for (int i = 0; i < 6; i++) W8B(initSeg, 0);
                                W16B(initSeg, 1);
                                W16B(initSeg, 0);
                                W16B(initSeg, 0);
                                for (int i = 0; i < 3; i++) W32B(initSeg, 0); // pre_defined[3]
                                W16B(initSeg, (uint16_t)w); W16B(initSeg, (uint16_t)h);
                                W32B(initSeg, 0x00480000); W32B(initSeg, 0x00480000);
                                W32B(initSeg, 0);
                                W16B(initSeg, 1);
                                for (int i = 0; i < 32; i++) W8B(initSeg, 0);
                                W16B(initSeg, 0x0018);
                                W16B(initSeg, 0xFFFF);
                                {   // avcC
                                    size_t ac = BoxB(initSeg, "avcC");
                                    W8B(initSeg, 1);
                                    W8B(initSeg, useSPS[1]);
                                    W8B(initSeg, useSPS[2]);
                                    W8B(initSeg, useSPS[3]);
                                    W8B(initSeg, 0xFF);
                                    W8B(initSeg, 0xE1);
                                    W16B(initSeg, (uint16_t)useSPS.size());
                                    initSeg.insert(initSeg.end(), useSPS.begin(), useSPS.end());
                                    W8B(initSeg, 1);
                                    W16B(initSeg, (uint16_t)usePPS.size());
                                    initSeg.insert(initSeg.end(), usePPS.begin(), usePPS.end());
                                    EndBoxB(initSeg, ac);
                                }
                                EndBoxB(initSeg, a);
                            }
                            EndBoxB(initSeg, b);
                        }
                        { size_t b = BoxB(initSeg, "stts"); W32B(initSeg, 0); W32B(initSeg, 0); EndBoxB(initSeg, b); }
                        { size_t b = BoxB(initSeg, "stsc"); W32B(initSeg, 0); W32B(initSeg, 0); EndBoxB(initSeg, b); }
                        { size_t b = BoxB(initSeg, "stsz"); W32B(initSeg, 0); W32B(initSeg, 0); W32B(initSeg, 0); EndBoxB(initSeg, b); }
                        { size_t b = BoxB(initSeg, "stco"); W32B(initSeg, 0); W32B(initSeg, 0); EndBoxB(initSeg, b); }
                        EndBoxB(initSeg, stbl);
                    }
                    EndBoxB(initSeg, minf);
                }
                EndBoxB(initSeg, mdia);
            }
            EndBoxB(initSeg, trak);
        }
        {   // mvex (REQUIRED by Chrome ChunkDemuxer for fragmented MP4)
            size_t mvex = BoxB(initSeg, "mvex");
            {   // trex v0 = 32 bytes
                size_t b = BoxB(initSeg, "trex");
                W32B(initSeg, 0);
                W32B(initSeg, 1);
                W32B(initSeg, 1);
                W32B(initSeg, 0);
                W32B(initSeg, 0);
                W32B(initSeg, 0);
                EndBoxB(initSeg, b);
            }
            EndBoxB(initSeg, mvex);
        }
        EndBoxB(initSeg, moov);
        char cb[16];
        sprintf(cb, "avc1.%02X%02X%02X", useSPS[1], useSPS[2], useSPS[3]);
        codec = cb;
    }

    void BuildFragment(std::vector<uint8_t>& out, std::vector<std::vector<uint8_t>>& samples,
                       std::vector<bool>& syncs, std::vector<uint32_t>& durs) {
        m_fragSeq++;
        size_t moofPos = out.size();
        size_t moof = BoxB(out, "moof");
        size_t offPos = 0;
        { size_t b = BoxB(out, "mfhd"); W32B(out, 0); W32B(out, m_fragSeq); EndBoxB(out, b); }
        { size_t traf = BoxB(out, "traf");
            { size_t b = BoxB(out, "tfhd"); W32B(out, 0); W32B(out, 1); EndBoxB(out, b); }
            { size_t b = BoxB(out, "tfdt"); W32B(out, 0); W32B(out, m_baseDecodeTime); EndBoxB(out, b); }
            { size_t b = BoxB(out, "trun");
                W32B(out, 0x00000701);
                W32B(out, (uint32_t)samples.size());
                offPos = out.size(); W32B(out, 0);
                for (size_t i = 0; i < samples.size(); i++) {
                    W32B(out, durs[i]);
                    W32B(out, (uint32_t)samples[i].size());
                    W32B(out, syncs[i] ? 0x02000000u : 0x01010000u);
                }
                EndBoxB(out, b);
            }
            EndBoxB(out, traf);
        }
        EndBoxB(out, moof);
        size_t mdat = BoxB(out, "mdat");
        size_t payloadPos = out.size();
        for (auto& s : samples) out.insert(out.end(), s.begin(), s.end());
        EndBoxB(out, mdat);
        W32AtB(out, offPos, (uint32_t)(payloadPos - moofPos));
        for (size_t i = 0; i < durs.size(); i++) m_baseDecodeTime += durs[i];
    }

    IMFTransform* m_enc = NULL;
    DWORD m_outCb = 0;
    bool m_hasMF = false;
    uint32_t m_fragSeq = 0;
    uint32_t m_baseDecodeTime = 0;
    std::vector<std::vector<uint8_t>> m_batch;
    std::vector<bool> m_batchSync;
    std::vector<uint32_t> m_batchDur;
    bool m_batchHasIDR = false;
};
