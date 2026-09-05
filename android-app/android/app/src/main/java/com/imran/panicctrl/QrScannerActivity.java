package com.imran.panicctrl;

import android.Manifest;
import android.animation.ValueAnimator;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.provider.MediaStore;
import android.util.Log;
import android.view.Gravity;
import android.view.View;
import android.view.animation.AccelerateDecelerateInterpolator;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.camera.core.Camera;
import androidx.camera.core.CameraSelector;
import androidx.camera.core.ImageAnalysis;
import androidx.camera.core.ImageProxy;
import androidx.camera.core.Preview;
import androidx.camera.lifecycle.ProcessCameraProvider;
import androidx.camera.view.PreviewView;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.FragmentActivity;
import androidx.lifecycle.LifecycleOwner;

import com.google.common.util.concurrent.ListenableFuture;
import com.google.mlkit.vision.barcode.BarcodeScanner;
import com.google.mlkit.vision.barcode.BarcodeScannerOptions;
import com.google.mlkit.vision.barcode.BarcodeScanning;
import com.google.mlkit.vision.barcode.common.Barcode;
import com.google.mlkit.vision.common.InputImage;
import com.google.zxing.BinaryBitmap;
import com.google.zxing.MultiFormatReader;
import com.google.zxing.PlanarYUVLuminanceSource;
import com.google.zxing.RGBLuminanceSource;
import com.google.zxing.Result;
import com.google.zxing.common.HybridBinarizer;

import java.io.InputStream;
import java.nio.ByteBuffer;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

public class QrScannerActivity extends FragmentActivity {

    private static final String TAG = "QrScannerActivity";
    public static final String RESULT_KEY = "qr_result";
    private static final int PERMISSION_REQ_CODE = 1001;
    private static final int GALLERY_REQ_CODE = 1002;

    private ExecutorService cameraExecutor;
    private final AtomicBoolean scanned = new AtomicBoolean(false);
    private ProcessCameraProvider cameraProvider;
    private final MultiFormatReader zxingReader = new MultiFormatReader();

    private PreviewView previewView;
    private CyberTargetView targetView;
    private Camera camera;
    private boolean isTorchOn = false;
    private Button torchBtn;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        try {
            FrameLayout root = new FrameLayout(this);
            root.setBackgroundColor(0xFF030508);

            // 1. Camera Live Feed
            previewView = new PreviewView(this);
            previewView.setLayoutParams(new FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT,
                    FrameLayout.LayoutParams.MATCH_PARENT
            ));
            root.addView(previewView);

            // 2. Futuristic Cyber Viewfinder Overlay with Sweeping Laser Line
            targetView = new CyberTargetView(this);
            int boxSize = (int) (getResources().getDisplayMetrics().widthPixels * 0.76f);
            if (boxSize > 720) boxSize = 720;
            FrameLayout.LayoutParams targetParams = new FrameLayout.LayoutParams(boxSize, boxSize);
            targetParams.gravity = Gravity.CENTER;
            targetView.setLayoutParams(targetParams);
            root.addView(targetView);

            // 3. Top Sci-Fi Header (Status Pill + Circular Close Button)
            LinearLayout topBar = new LinearLayout(this);
            topBar.setOrientation(LinearLayout.HORIZONTAL);
            topBar.setGravity(Gravity.CENTER_VERTICAL);
            FrameLayout.LayoutParams topBarParams = new FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT,
                    FrameLayout.LayoutParams.WRAP_CONTENT
            );
            topBarParams.gravity = Gravity.TOP;
            topBarParams.setMargins(28, 60, 28, 0);
            topBar.setLayoutParams(topBarParams);

            // Glowing Title Pill
            LinearLayout titlePill = new LinearLayout(this);
            titlePill.setOrientation(LinearLayout.HORIZONTAL);
            titlePill.setGravity(Gravity.CENTER_VERTICAL);
            GradientDrawable pillBg = new GradientDrawable();
            pillBg.setColor(Color.parseColor("#CC070A10"));
            pillBg.setStroke(2, Color.parseColor("#8800F0FF"));
            pillBg.setCornerRadius(30);
            titlePill.setBackground(pillBg);
            titlePill.setPadding(26, 14, 26, 14);

            View liveDot = new View(this);
            GradientDrawable dotDraw = new GradientDrawable();
            dotDraw.setColor(Color.parseColor("#00FF41"));
            dotDraw.setCornerRadius(20);
            liveDot.setBackground(dotDraw);
            LinearLayout.LayoutParams dotParams = new LinearLayout.LayoutParams(16, 16);
            dotParams.rightMargin = 16;
            liveDot.setLayoutParams(dotParams);
            titlePill.addView(liveDot);

            TextView title = new TextView(this);
            title.setText("PANIC // OPTICAL HUD");
            title.setTextColor(Color.WHITE);
            title.setTextSize(13);
            title.setTypeface(Typeface.MONOSPACE, Typeface.BOLD);
            titlePill.addView(title);

            LinearLayout.LayoutParams pillParams = new LinearLayout.LayoutParams(
                    0, LinearLayout.LayoutParams.WRAP_CONTENT, 1.0f
            );
            titlePill.setLayoutParams(pillParams);
            topBar.addView(titlePill);

            // Circular Close Button
            Button closeBtn = new Button(this);
            closeBtn.setText("✕");
            closeBtn.setTextColor(Color.WHITE);
            closeBtn.setTextSize(17);
            GradientDrawable closeBg = new GradientDrawable();
            closeBg.setColor(Color.parseColor("#CC1A0810"));
            closeBg.setStroke(2, Color.parseColor("#AAFF0055"));
            closeBg.setCornerRadius(60);
            closeBtn.setBackground(closeBg);
            LinearLayout.LayoutParams closeParams = new LinearLayout.LayoutParams(110, 110);
            closeParams.leftMargin = 20;
            closeBtn.setLayoutParams(closeParams);
            closeBtn.setOnClickListener(v -> {
                setResult(Activity.RESULT_CANCELED);
                finish();
            });
            topBar.addView(closeBtn);
            root.addView(topBar);

            // 4. Bottom Cyber Control Deck (Frosted Card with Instructions & Quick Tools)
            LinearLayout bottomCard = new LinearLayout(this);
            bottomCard.setOrientation(LinearLayout.VERTICAL);
            bottomCard.setGravity(Gravity.CENTER_HORIZONTAL);
            GradientDrawable cardBg = new GradientDrawable();
            cardBg.setColor(Color.parseColor("#E6090D14"));
            cardBg.setStroke(2, Color.parseColor("#4400F0FF"));
            cardBg.setCornerRadius(32);
            bottomCard.setBackground(cardBg);
            bottomCard.setPadding(32, 28, 32, 28);

            FrameLayout.LayoutParams bottomParams = new FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT,
                    FrameLayout.LayoutParams.WRAP_CONTENT
            );
            bottomParams.gravity = Gravity.BOTTOM;
            bottomParams.bottomMargin = 54;
            bottomParams.leftMargin = 28;
            bottomParams.rightMargin = 28;
            bottomCard.setLayoutParams(bottomParams);

            TextView hint = new TextView(this);
            hint.setText("ALIGN QR CODE WITHIN TARGET RETICLE");
            hint.setTextColor(Color.parseColor("#00F0FF"));
            hint.setTextSize(12);
            hint.setGravity(Gravity.CENTER);
            hint.setTypeface(Typeface.MONOSPACE, Typeface.BOLD);
            bottomCard.addView(hint);

            TextView subHint = new TextView(this);
            subHint.setText("Dual-Engine Zero-Latency Optical Handshake");
            subHint.setTextColor(Color.parseColor("#8892B0"));
            subHint.setTextSize(10.5f);
            subHint.setGravity(Gravity.CENTER);
            subHint.setPadding(0, 6, 0, 22);
            bottomCard.addView(subHint);

            // Action Buttons (Torch + Photo Gallery)
            LinearLayout btnRow = new LinearLayout(this);
            btnRow.setOrientation(LinearLayout.HORIZONTAL);
            btnRow.setGravity(Gravity.CENTER);
            LinearLayout.LayoutParams rowParams = new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
            );
            btnRow.setLayoutParams(rowParams);

            torchBtn = new Button(this);
            torchBtn.setText("🔦 TORCH: OFF");
            torchBtn.setTextColor(Color.parseColor("#E2E8F0"));
            torchBtn.setTextSize(11);
            torchBtn.setTypeface(Typeface.MONOSPACE, Typeface.BOLD);
            GradientDrawable torchBg = new GradientDrawable();
            torchBg.setColor(Color.parseColor("#2200F0FF"));
            torchBg.setStroke(2, Color.parseColor("#6600F0FF"));
            torchBg.setCornerRadius(20);
            torchBtn.setBackground(torchBg);
            LinearLayout.LayoutParams torchParams = new LinearLayout.LayoutParams(0, 115, 1.0f);
            torchParams.rightMargin = 12;
            torchBtn.setLayoutParams(torchParams);
            torchBtn.setOnClickListener(v -> toggleTorch());
            btnRow.addView(torchBtn);

            Button galleryBtn = new Button(this);
            galleryBtn.setText("🖼️ GALLERY PHOTO");
            galleryBtn.setTextColor(Color.parseColor("#E2E8F0"));
            galleryBtn.setTextSize(11);
            galleryBtn.setTypeface(Typeface.MONOSPACE, Typeface.BOLD);
            GradientDrawable galleryBg = new GradientDrawable();
            galleryBg.setColor(Color.parseColor("#22FFFFFF"));
            galleryBg.setStroke(2, Color.parseColor("#44FFFFFF"));
            galleryBg.setCornerRadius(20);
            galleryBtn.setBackground(galleryBg);
            LinearLayout.LayoutParams galleryParams = new LinearLayout.LayoutParams(0, 115, 1.0f);
            galleryParams.leftMargin = 12;
            galleryBtn.setLayoutParams(galleryParams);
            galleryBtn.setOnClickListener(v -> openGalleryPicker());
            btnRow.addView(galleryBtn);

            bottomCard.addView(btnRow);
            root.addView(bottomCard);

            setContentView(root);
            cameraExecutor = Executors.newSingleThreadExecutor();

            // ⚡ 5. Strict Permission Verification Before Starting Camera
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.CAMERA}, PERMISSION_REQ_CODE);
            } else {
                startCamera();
            }
        } catch (Throwable t) {
            Log.e(TAG, "Fatal error in QrScannerActivity.onCreate", t);
            Toast.makeText(this, "Could not open camera: " + t.getMessage(), Toast.LENGTH_LONG).show();
            setResult(Activity.RESULT_CANCELED);
            finish();
        }
    }

    private void toggleTorch() {
        if (camera != null && camera.getCameraInfo().hasFlashUnit()) {
            isTorchOn = !isTorchOn;
            camera.getCameraControl().enableTorch(isTorchOn);
            if (torchBtn != null) {
                torchBtn.setText(isTorchOn ? "🔦 TORCH: ON" : "🔦 TORCH: OFF");
                torchBtn.setTextColor(isTorchOn ? Color.parseColor("#00FF41") : Color.WHITE);
                GradientDrawable bg = (GradientDrawable) torchBtn.getBackground();
                if (bg != null) {
                    bg.setColor(isTorchOn ? Color.parseColor("#3300FF41") : Color.parseColor("#2200F0FF"));
                    bg.setStroke(2, isTorchOn ? Color.parseColor("#AA00FF41") : Color.parseColor("#6600F0FF"));
                }
            }
        } else {
            Toast.makeText(this, "Torch not supported on this device", Toast.LENGTH_SHORT).show();
        }
    }

    private void openGalleryPicker() {
        Intent pickIntent = new Intent(Intent.ACTION_PICK, MediaStore.Images.Media.EXTERNAL_CONTENT_URI);
        pickIntent.setType("image/*");
        startActivityForResult(pickIntent, GALLERY_REQ_CODE);
    }

    private void startCamera() {
        ListenableFuture<ProcessCameraProvider> future = ProcessCameraProvider.getInstance(this);
        future.addListener(() -> {
            try {
                cameraProvider = future.get();
                bindCameraUseCases();
            } catch (Exception e) {
                Log.e(TAG, "Failed to get CameraProvider", e);
                Toast.makeText(this, "Camera error: " + e.getMessage(), Toast.LENGTH_LONG).show();
            }
        }, ContextCompat.getMainExecutor(this));
    }

    private void bindCameraUseCases() {
        if (cameraProvider == null) return;

        Preview preview = new Preview.Builder().build();
        preview.setSurfaceProvider(previewView.getSurfaceProvider());

        BarcodeScanner scanner = null;
        try {
            BarcodeScannerOptions options = new BarcodeScannerOptions.Builder()
                    .setBarcodeFormats(Barcode.FORMAT_QR_CODE)
                    .build();
            scanner = BarcodeScanning.getClient(options);
        } catch (Throwable t) {
            Log.w(TAG, "ML Kit not initialized, relying on ZXing", t);
        }

        final BarcodeScanner finalScanner = scanner;
        ImageAnalysis analysis = new ImageAnalysis.Builder()
                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                .build();

        analysis.setAnalyzer(cameraExecutor, imageProxy -> {
            if (scanned.get()) {
                imageProxy.close();
                return;
            }
            analyzeFrame(imageProxy, finalScanner);
        });

        CameraSelector cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA;
        try {
            if (!cameraProvider.hasCamera(CameraSelector.DEFAULT_BACK_CAMERA) && cameraProvider.hasCamera(CameraSelector.DEFAULT_FRONT_CAMERA)) {
                cameraSelector = CameraSelector.DEFAULT_FRONT_CAMERA;
            }
        } catch (Exception ignored) {}

        try {
            cameraProvider.unbindAll();
            camera = cameraProvider.bindToLifecycle((LifecycleOwner) this, cameraSelector, preview, analysis);
        } catch (Exception e) {
            Log.e(TAG, "Camera bindToLifecycle failed", e);
            Toast.makeText(this, "Camera unavailable: " + e.getMessage(), Toast.LENGTH_LONG).show();
        }
    }

    @androidx.camera.core.ExperimentalGetImage
    private void analyzeFrame(ImageProxy imageProxy, BarcodeScanner scanner) {
        try {
            // ⚡ 1. Primary Engine: Pure-Java ZXing with Stride Compensation
            ImageProxy.PlaneProxy plane = imageProxy.getPlanes()[0];
            ByteBuffer buffer = plane.getBuffer();
            int rowStride = plane.getRowStride();
            int width = imageProxy.getWidth();
            int height = imageProxy.getHeight();
            int rotation = imageProxy.getImageInfo().getRotationDegrees();

            byte[] yBytes = new byte[width * height];
            if (rowStride == width) {
                buffer.get(yBytes);
            } else {
                for (int r = 0; r < height; r++) {
                    buffer.position(r * rowStride);
                    buffer.get(yBytes, r * width, width);
                }
            }

            byte[] rotatedData = yBytes;
            int finalWidth = width;
            int finalHeight = height;

            if (rotation == 90 || rotation == 270) {
                rotatedData = new byte[width * height];
                for (int y = 0; y < height; y++) {
                    for (int x = 0; x < width; x++) {
                        if (rotation == 90) {
                            rotatedData[x * height + height - y - 1] = yBytes[x + y * width];
                        } else {
                            rotatedData[(width - x - 1) * height + y] = yBytes[x + y * width];
                        }
                    }
                }
                finalWidth = height;
                finalHeight = width;
            }

            PlanarYUVLuminanceSource source = new PlanarYUVLuminanceSource(
                    rotatedData, finalWidth, finalHeight, 0, 0, finalWidth, finalHeight, false
            );
            BinaryBitmap bitmap = new BinaryBitmap(new HybridBinarizer(source));
            Result zxingResult = zxingReader.decodeWithState(bitmap);
            if (zxingResult != null && zxingResult.getText() != null && !zxingResult.getText().isEmpty()) {
                deliverResult(zxingResult.getText());
                imageProxy.close();
                return;
            }
        } catch (Exception ignored) {
        } finally {
            zxingReader.reset();
        }

        // ⚡ 2. Secondary Fallback Engine: Google ML Kit
        if (scanner != null) {
            android.media.Image mediaImage = imageProxy.getImage();
            if (mediaImage == null) {
                imageProxy.close();
                return;
            }

            InputImage image = InputImage.fromMediaImage(mediaImage, imageProxy.getImageInfo().getRotationDegrees());
            scanner.process(image)
                    .addOnSuccessListener(barcodes -> {
                        for (Barcode barcode : barcodes) {
                            String value = barcode.getRawValue();
                            if (value != null && !value.isEmpty()) {
                                deliverResult(value);
                                return;
                            }
                        }
                    })
                    .addOnCompleteListener(task -> imageProxy.close());
        } else {
            imageProxy.close();
        }
    }

    private void deliverResult(String value) {
        if (value != null && !value.isEmpty() && scanned.compareAndSet(false, true)) {
            // Visual success indicator on HUD
            runOnUiThread(() -> {
                if (targetView != null) {
                    targetView.setSuccessColor();
                }
            });

            // Haptic Feedback
            try {
                Vibrator v = (Vibrator) getSystemService(VIBRATOR_SERVICE);
                if (v != null) {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        v.vibrate(VibrationEffect.createOneShot(90, VibrationEffect.DEFAULT_AMPLITUDE));
                    } else {
                        v.vibrate(90);
                    }
                }
            } catch (Exception ignored) {}

            Intent result = new Intent();
            result.putExtra(RESULT_KEY, value);
            setResult(Activity.RESULT_OK, result);
            finish();
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == PERMISSION_REQ_CODE) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                startCamera();
            } else {
                Toast.makeText(this, "Camera permission is required to scan QR code", Toast.LENGTH_LONG).show();
                setResult(Activity.RESULT_CANCELED);
                finish();
            }
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == GALLERY_REQ_CODE && resultCode == Activity.RESULT_OK && data != null) {
            Uri imageUri = data.getData();
            if (imageUri != null) {
                decodeImageUri(imageUri);
            }
        }
    }

    private void decodeImageUri(Uri uri) {
        try {
            InputStream is = getContentResolver().openInputStream(uri);
            Bitmap bitmap = BitmapFactory.decodeStream(is);
            if (bitmap != null) {
                int maxDim = 1024;
                float scale = Math.min(1.0f, (float) maxDim / Math.max(bitmap.getWidth(), bitmap.getHeight()));
                Bitmap scaled = Bitmap.createScaledBitmap(
                        bitmap, Math.round(bitmap.getWidth() * scale), Math.round(bitmap.getHeight() * scale), true
                );

                int[] intArray = new int[scaled.getWidth() * scaled.getHeight()];
                scaled.getPixels(intArray, 0, scaled.getWidth(), 0, 0, scaled.getWidth(), scaled.getHeight());
                RGBLuminanceSource source = new RGBLuminanceSource(scaled.getWidth(), scaled.getHeight(), intArray);
                BinaryBitmap binaryBitmap = new BinaryBitmap(new HybridBinarizer(source));
                Result result = zxingReader.decodeWithState(binaryBitmap);
                if (result != null && result.getText() != null) {
                    deliverResult(result.getText());
                    return;
                }
            }
            Toast.makeText(this, "No QR code found in selected image", Toast.LENGTH_SHORT).show();
        } catch (Exception e) {
            Toast.makeText(this, "Could not decode image: " + e.getMessage(), Toast.LENGTH_SHORT).show();
        } finally {
            zxingReader.reset();
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (targetView != null) targetView.stopAnimation();
        if (cameraExecutor != null) cameraExecutor.shutdown();
        if (cameraProvider != null) cameraProvider.unbindAll();
    }

    // 🎨 High-Tech Sci-Fi Holographic Viewfinder with Sweeping Laser Beam
    public static class CyberTargetView extends View {
        private final Paint cornerPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final Paint laserPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final Paint laserGlowPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final Paint reticlePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        private float laserY = 20f;
        private ValueAnimator laserAnim;

        public CyberTargetView(Context context) {
            super(context);
            init();
        }

        private void init() {
            cornerPaint.setColor(Color.parseColor("#00F0FF"));
            cornerPaint.setStyle(Paint.Style.STROKE);
            cornerPaint.setStrokeWidth(10f);
            cornerPaint.setStrokeCap(Paint.Cap.ROUND);

            reticlePaint.setColor(Color.parseColor("#4400F0FF"));
            reticlePaint.setStyle(Paint.Style.STROKE);
            reticlePaint.setStrokeWidth(3f);

            laserPaint.setColor(Color.parseColor("#00F0FF"));
            laserPaint.setStrokeWidth(4.5f);

            laserGlowPaint.setColor(Color.parseColor("#5500F0FF"));
            laserGlowPaint.setStrokeWidth(18f);
        }

        public void setSuccessColor() {
            cornerPaint.setColor(Color.parseColor("#00FF41"));
            laserPaint.setColor(Color.parseColor("#00FF41"));
            laserGlowPaint.setColor(Color.parseColor("#8800FF41"));
            invalidate();
        }

        @Override
        protected void onSizeChanged(int w, int h, int oldw, int oldh) {
            super.onSizeChanged(w, h, oldw, oldh);
            if (laserAnim != null) laserAnim.cancel();
            laserAnim = ValueAnimator.ofFloat(30f, h - 30f);
            laserAnim.setDuration(2000);
            laserAnim.setRepeatMode(ValueAnimator.REVERSE);
            laserAnim.setRepeatCount(ValueAnimator.INFINITE);
            laserAnim.setInterpolator(new AccelerateDecelerateInterpolator());
            laserAnim.addUpdateListener(animation -> {
                laserY = (float) animation.getAnimatedValue();
                invalidate();
            });
            laserAnim.start();
        }

        @Override
        protected void onDraw(Canvas canvas) {
            super.onDraw(canvas);
            int w = getWidth();
            int h = getHeight();
            float len = 64f;

            // 4 Futuristic Corner Brackets
            canvas.drawLine(0, 0, len, 0, cornerPaint);
            canvas.drawLine(0, 0, 0, len, cornerPaint);

            canvas.drawLine(w - len, 0, w, 0, cornerPaint);
            canvas.drawLine(w, 0, w, len, cornerPaint);

            canvas.drawLine(0, h, len, h, cornerPaint);
            canvas.drawLine(0, h, 0, h - len, cornerPaint);

            canvas.drawLine(w - len, h, w, h, cornerPaint);
            canvas.drawLine(w, h, w, h - len, cornerPaint);

            // Center Subtle Crosshair
            float cx = w / 2.0f;
            float cy = h / 2.0f;
            canvas.drawLine(cx - 24f, cy, cx + 24f, cy, reticlePaint);
            canvas.drawLine(cx, cy - 24f, cx, cy + 24f, reticlePaint);

            // Animated Sweeping Laser Line
            canvas.drawLine(16f, laserY, w - 16f, laserY, laserGlowPaint);
            canvas.drawLine(16f, laserY, w - 16f, laserY, laserPaint);
        }

        public void stopAnimation() {
            if (laserAnim != null) laserAnim.cancel();
        }
    }
}
