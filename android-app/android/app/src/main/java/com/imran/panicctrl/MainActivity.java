package com.imran.panicctrl;

import android.graphics.Color;
import android.app.Activity;
import android.content.Intent;
import android.media.MediaCodec;
import android.media.MediaFormat;
import android.os.Build;
import android.os.Bundle;
import android.view.Display;
import android.view.MotionEvent;
import android.view.Surface;
import android.view.SurfaceHolder;
import android.view.SurfaceView;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.widget.FrameLayout;

import com.getcapacitor.BridgeActivity;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.HttpURLConnection;
import java.net.InetAddress;
import java.net.URL;
import java.nio.ByteBuffer;
import java.util.concurrent.atomic.AtomicBoolean;

public class MainActivity extends BridgeActivity {
    private SurfaceView mSurfaceView;
    private Surface mSurface;
    private MediaCodec mDecoder;
    private Thread mStreamThread;
    private final AtomicBoolean mIsStreaming = new AtomicBoolean(false);

    // ⚡ Ultra-Fast Native UDP Input Dispatcher (<0.05ms)
    private DatagramSocket mInputSocket;
    private InetAddress mHostInetAddr;
    private int mHostPort = 8080;
    private boolean mNativeInputActive = false;
    private int mDisplayW = 1080;
    private int mDisplayH = 2400;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 🚀 1. Unlock Maximum Hardware Display Refresh Rate (90Hz / 120Hz AMOLED Gaming Mode)
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Display display = getWindowManager().getDefaultDisplay();
                Display.Mode[] modes = display.getSupportedModes();
                Display.Mode maxMode = null;
                float maxFps = 60.0f;
                for (Display.Mode m : modes) {
                    if (m.getRefreshRate() > maxFps) {
                        maxFps = m.getRefreshRate();
                        maxMode = m;
                    }
                }
                if (maxMode != null) {
                    WindowManager.LayoutParams params = getWindow().getAttributes();
                    params.preferredDisplayModeId = maxMode.getModeId();
                    getWindow().setAttributes(params);
                }
            }
            android.graphics.Point p = new android.graphics.Point();
            getWindowManager().getDefaultDisplay().getRealSize(p);
            mDisplayW = p.x;
            mDisplayH = p.y;
        } catch (Exception e) {}

        // 🚀 2. Enforce Hardware Acceleration & Edge-to-Edge System Bar Matching
        try {
            getWindow().setFlags(
                WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED,
                WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED
            );
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

            int appBgColor = Color.parseColor("#07090e");
            getWindow().setBackgroundDrawable(new android.graphics.drawable.ColorDrawable(appBgColor));

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                getWindow().addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
                getWindow().setStatusBarColor(appBgColor);
                getWindow().setNavigationBarColor(appBgColor);
            }

            if (this.bridge != null && this.bridge.getWebView() != null) {
                this.bridge.getWebView().setLayerType(View.LAYER_TYPE_HARDWARE, null);
                this.bridge.getWebView().setBackgroundColor(Color.parseColor("#07090e"));

                WebSettings settings = this.bridge.getWebView().getSettings();
                settings.setJavaScriptEnabled(true);
                settings.setDomStorageEnabled(true);
                settings.setDatabaseEnabled(true);
                settings.setMediaPlaybackRequiresUserGesture(false);
                settings.setAllowFileAccess(true);
                settings.setAllowContentAccess(true);
                settings.setRenderPriority(WebSettings.RenderPriority.HIGH);
                settings.setCacheMode(WebSettings.LOAD_NO_CACHE);
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
                }

                // ⚡ Grant camera, microphone and media permissions to WebView automatically
                this.bridge.getWebView().setWebChromeClient(new android.webkit.WebChromeClient() {
                    @Override
                    public void onPermissionRequest(final android.webkit.PermissionRequest request) {
                        runOnUiThread(() -> request.grant(request.getResources()));
                    }
                });

                // ⚡ Register Native Moonlight Bridge to JavaScript
                this.bridge.getWebView().addJavascriptInterface(new NativeStreamBridge(), "AndroidNativeStream");
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                String[] perms = {
                    android.Manifest.permission.CAMERA,
                    android.Manifest.permission.RECORD_AUDIO
                };
                boolean needReq = false;
                for (String p : perms) {
                    if (checkSelfPermission(p) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                        needReq = true;
                        break;
                    }
                }
                if (needReq) {
                    requestPermissions(perms, 101);
                }
            }
        } catch (Exception e) {}

        // 🚀 3. Check if PC was previously paired, otherwise start Discovery
        try {
            String savedUrl = getSharedPreferences("panic_prefs", MODE_PRIVATE).getString("saved_pc_url", null);
            if (savedUrl != null && !savedUrl.isEmpty()) {
                if (this.bridge != null && this.bridge.getWebView() != null) {
                    this.bridge.getWebView().post(() -> {
                        this.bridge.getWebView().loadUrl(savedUrl);
                    });
                }
            }
        } catch (Exception e) {}

        // 🚀 4. Inject Native SurfaceView Directly Beneath WebView
        initNativeSurface();

        // 🚀 5. Launch Instant Native UDP Auto-Discovery for Zero-Config PC Connection
        startAutoDiscovery();
    }

    private void startAutoDiscovery() {
        new Thread(() -> {
            try {
                DatagramSocket socket = new DatagramSocket();
                socket.setBroadcast(true);
                socket.setSoTimeout(2500);

                byte[] reqData = "PANIC_DISCOVER_REQ".getBytes();
                String[] targets = {"255.255.255.255", "10.72.151.255", "192.168.0.255", "192.168.1.255", "10.72.151.59", "127.0.0.1"};
                for (String t : targets) {
                    try {
                        DatagramPacket packet = new DatagramPacket(reqData, reqData.length, InetAddress.getByName(t), 8888);
                        socket.send(packet);
                    } catch (Exception ignored) {}
                }

                byte[] buf = new byte[512];
                DatagramPacket recvPacket = new DatagramPacket(buf, buf.length);
                socket.receive(recvPacket);

                String resp = new String(recvPacket.getData(), 0, recvPacket.getLength());
                if (resp.startsWith("PANIC_DISCOVER_RESP:")) {
                    String cleanUrl = resp.substring("PANIC_DISCOVER_RESP:".length()).split(";")[0].trim();
                    runOnUiThread(() -> {
                        if (bridge != null && bridge.getWebView() != null) {
                            getSharedPreferences("panic_prefs", MODE_PRIVATE).edit().putString("saved_pc_url", cleanUrl).apply();
                            bridge.getWebView().loadUrl(cleanUrl);
                        }
                    });
                }
                socket.close();
            } catch (Exception e) {}
        }).start();
    }

    private void initNativeSurface() {
        try {
            mSurfaceView = new SurfaceView(this);
            mSurfaceView.setVisibility(View.GONE); // Hidden until streaming starts
            mSurfaceView.getHolder().addCallback(new SurfaceHolder.Callback() {
                @Override
                public void surfaceCreated(SurfaceHolder holder) {
                    mSurface = holder.getSurface();
                }

                @Override
                public void surfaceChanged(SurfaceHolder holder, int format, int width, int height) {
                    mSurface = holder.getSurface();
                }

                @Override
                public void surfaceDestroyed(SurfaceHolder holder) {
                    mSurface = null;
                    stopNativeStream();
                }
            });

            ViewGroup rootView = (ViewGroup) getWindow().getDecorView().findViewById(android.R.id.content);
            if (rootView != null) {
                FrameLayout layout = new FrameLayout(this);
                layout.setLayoutParams(new FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                ));
                layout.addView(mSurfaceView, new FrameLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                ));
                rootView.addView(layout, 0); // Layer 0: directly behind WebView!
            }
        } catch (Exception e) {}
    }

    // ⚡ ROOT-LEVEL ANDROID MOTION EVENT INTERCEPTOR (<0.05ms!)
    @Override
    public boolean dispatchTouchEvent(MotionEvent ev) {
        if (mNativeInputActive && mInputSocket != null && mHostInetAddr != null) {
            int action = ev.getActionMasked();
            String actStr = null;
            if (action == MotionEvent.ACTION_DOWN || action == MotionEvent.ACTION_POINTER_DOWN) actStr = "down";
            else if (action == MotionEvent.ACTION_MOVE) actStr = "move";
            else if (action == MotionEvent.ACTION_UP || action == MotionEvent.ACTION_POINTER_UP) actStr = "up";

            if (actStr != null) {
                int px = (int)((ev.getX() / (float)mDisplayW) * 10000);
                int py = (int)((ev.getY() / (float)mDisplayH) * 10000);
                final String payload = "T:" + actStr + ":" + px + ":" + py + ":" + ev.getPointerId(ev.getActionIndex());

                new Thread(new Runnable() {
                    @Override
                    public void run() {
                        try {
                            byte[] bytes = payload.getBytes();
                            DatagramPacket packet = new DatagramPacket(bytes, bytes.length, mHostInetAddr, mHostPort);
                            mInputSocket.send(packet);
                        } catch (Exception e) {}
                    }
                }).start();
            }
        }
        return super.dispatchTouchEvent(ev);
    }

    private void startNativeStream(final String streamUrl) {
        stopNativeStream();
        mIsStreaming.set(true);

        runOnUiThread(() -> {
            if (mSurfaceView != null) mSurfaceView.setVisibility(View.VISIBLE);
            if (this.bridge != null && this.bridge.getWebView() != null) {
                this.bridge.getWebView().setBackgroundColor(Color.TRANSPARENT);
            }
        });

        mStreamThread = new Thread(new Runnable() {
            @Override
            public void run() {
                InputStream is = null;
                HttpURLConnection conn = null;
                try {
                    URL url = new URL(streamUrl);
                    mHostInetAddr = InetAddress.getByName(url.getHost());
                    mHostPort = url.getPort() > 0 ? url.getPort() : 8080;
                    if (mInputSocket == null) mInputSocket = new DatagramSocket();

                    // Init Low-Latency MediaCodec
                    mDecoder = MediaCodec.createDecoderByType("video/avc");
                    MediaFormat format = MediaFormat.createVideoFormat("video/avc", 1280, 720);
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                        format.setInteger(MediaFormat.KEY_LOW_LATENCY, 1);
                    }
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        format.setInteger(MediaFormat.KEY_OPERATING_RATE, 120);
                        format.setInteger(MediaFormat.KEY_PRIORITY, 0); // Realtime
                    }
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                        format.setInteger(MediaFormat.KEY_MAX_B_FRAMES, 0);
                    }

                    if (mSurface != null) {
                        mDecoder.configure(format, mSurface, null, 0);
                        mDecoder.start();
                    } else {
                        return;
                    }

                    conn = (HttpURLConnection) url.openConnection();
                    conn.setConnectTimeout(3000);
                    conn.setReadTimeout(5000);
                    conn.setRequestProperty("User-Agent", "PanicCTRL-Native/2.0");
                    conn.connect();
                    is = conn.getInputStream();

                    byte[] buffer = new byte[32768];
                    ByteArrayOutputStream nalAccumulator = new ByteArrayOutputStream(131072);
                    MediaCodec.BufferInfo info = new MediaCodec.BufferInfo();

                    while (mIsStreaming.get()) {
                        int len = is.read(buffer);
                        if (len <= 0) break;

                        nalAccumulator.write(buffer, 0, len);
                        byte[] all = nalAccumulator.toByteArray();

                        // 🔍 Parse Discrete Annex-B NAL Units (0x00000001)
                        int start = 0;
                        int nextSc = findStartCode(all, 4);

                        while (nextSc > 0) {
                            int nalLen = nextSc - start;
                            if (nalLen > 4) {
                                feedNalToDecoder(all, start, nalLen, info);
                            }
                            start = nextSc;
                            nextSc = findStartCode(all, start + 4);
                        }

                        // Retain unconsumed tail bytes
                        nalAccumulator.reset();
                        if (start < all.length) {
                            nalAccumulator.write(all, start, all.length - start);
                        }
                    }
                } catch (Exception e) {
                } finally {
                    try { if (is != null) is.close(); } catch (Exception e) {}
                    try { if (conn != null) conn.disconnect(); } catch (Exception e) {}
                    try {
                        if (mDecoder != null) {
                            mDecoder.stop();
                            mDecoder.release();
                            mDecoder = null;
                        }
                    } catch (Exception e) {}
                }
            }
        });
        mStreamThread.setPriority(Thread.MAX_PRIORITY);
        mStreamThread.start();
    }

    private int findStartCode(byte[] data, int offset) {
        for (int i = offset; i + 3 < data.length; i++) {
            if (data[i] == 0 && data[i + 1] == 0) {
                if (data[i + 2] == 1) return i;
                if (data[i + 2] == 0 && data[i + 3] == 1) return i;
            }
        }
        return -1;
    }

    private void feedNalToDecoder(byte[] data, int offset, int length, MediaCodec.BufferInfo info) {
        if (mDecoder == null) return;
        try {
            int inIndex = mDecoder.dequeueInputBuffer(4000);
            if (inIndex >= 0) {
                ByteBuffer inputBuffer;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    inputBuffer = mDecoder.getInputBuffer(inIndex);
                } else {
                    inputBuffer = mDecoder.getInputBuffers()[inIndex];
                }
                if (inputBuffer != null) {
                    inputBuffer.clear();
                    inputBuffer.put(data, offset, length);

                    int nalType = (offset + 4 < data.length) ? (data[offset + 4] & 0x1F) : 0;
                    int flags = 0;
                    if (nalType == 7 || nalType == 8) flags = MediaCodec.BUFFER_FLAG_CODEC_CONFIG;
                    else if (nalType == 5) flags = MediaCodec.BUFFER_FLAG_KEY_FRAME;

                    mDecoder.queueInputBuffer(inIndex, 0, length, System.nanoTime() / 1000, flags);
                }
            }

            int outIndex = mDecoder.dequeueOutputBuffer(info, 0);
            while (outIndex >= 0) {
                mDecoder.releaseOutputBuffer(outIndex, true);
                outIndex = mDecoder.dequeueOutputBuffer(info, 0);
            }
        } catch (Exception e) {}
    }

    private void stopNativeStream() {
        mIsStreaming.set(false);
        if (mStreamThread != null) {
            mStreamThread.interrupt();
            mStreamThread = null;
        }
        runOnUiThread(() -> {
            if (mSurfaceView != null) mSurfaceView.setVisibility(View.GONE);
            if (this.bridge != null && this.bridge.getWebView() != null) {
                this.bridge.getWebView().setBackgroundColor(Color.parseColor("#07090e"));
            }
        });
    }

    public class NativeStreamBridge {
        @JavascriptInterface
        public boolean isNativeSupported() {
            return true;
        }

        @JavascriptInterface
        public void setNativeInput(boolean enabled) {
            mNativeInputActive = enabled;
        }

        @JavascriptInterface
        public void savePcUrl(String url) {
            if (url != null && !url.isEmpty()) {
                getSharedPreferences("panic_prefs", MODE_PRIVATE).edit().putString("saved_pc_url", url).apply();
            }
        }

        @JavascriptInterface
        public void clearSavedPc() {
            getSharedPreferences("panic_prefs", MODE_PRIVATE).edit().remove("saved_pc_url").apply();
        }

        @JavascriptInterface
        public void start(String url) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    startNativeStream(url);
                }
            });
        }

        @JavascriptInterface
        public void stop() {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    stopNativeStream();
                }
            });
        }

        @JavascriptInterface
        public void startQrScan() {
            // ⚡ Launch Native QR Scanner Activity (bypasses all browser camera restrictions!)
            runOnUiThread(() -> {
                Intent intent = new Intent(MainActivity.this, QrScannerActivity.class);
                startActivityForResult(intent, 1337);
            });
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == 1337 && resultCode == Activity.RESULT_OK && data != null) {
            String qrValue = data.getStringExtra(QrScannerActivity.RESULT_KEY);
            if (qrValue != null && !qrValue.isEmpty()) {
                final String escapedValue = qrValue.replace("'", "\\'");
                // ⚡ Pass result back to JavaScript
                if (bridge != null && bridge.getWebView() != null) {
                    bridge.getWebView().post(() ->
                        bridge.getWebView().evaluateJavascript(
                            "if(typeof onQrCodeSuccess==='function') onQrCodeSuccess('" + escapedValue + "');",
                            null
                        )
                    );
                }
            }
        }
    }
}
