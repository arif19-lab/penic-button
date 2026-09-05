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
import android.graphics.Path;
import android.graphics.RectF;
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
            root.setBackgroundColor(0xFF000000);

            // 1. Live Camera Preview (Full Screen)
            previewView = new PreviewView(this);
            previewView.setLayoutParams(new FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT,
                    FrameLayout.LayoutParams.MATCH_PARENT
            ));
            root.addView(previewView);

            // 2. Fullscreen Cybernetic HUD Mask with Center Target Box & Sweeping Laser
            targetView = new CyberTargetView(this);
            targetView.setLayoutParams(new FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT,
                    FrameLayout.LayoutParams.MATCH_PARENT
            ));
            root.addView(targetView);

            // 3. Top Navigation Bar - Comfortably placed DOWN below the status bar & camera notch
            LinearLayout topBar = new LinearLayout(this);
            topBar.setOrientation(LinearLayout.HORIZONTAL);
            topBar.setGravity(Gravity.CENTER_VERTICAL);
            FrameLayout.LayoutParams topBarParams = new FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT,
                    FrameLayout.LayoutParams.WRAP_CONTENT
            );
            topBarParams.gravity = Gravity.TOP;
            // ⚡ Generous top margin (135px) so title sits naturally below notch & status bar
            topBarParams.setMargins(36, 135, 36, 0);
            topBar.setLayoutParams(topBarParams);

            // Title & Subtitle Group (Left)
            LinearLayout titleGroup = new LinearLayout(this);
            titleGroup.setOrientation(LinearLayout.VERTICAL);
            LinearLayout.LayoutParams titleGroupParams = new LinearLayout.LayoutParams(
                    0, LinearLayout.LayoutParams.WRAP_CONTENT, 1.0f
            );
            titleGroup.setLayoutParams(titleGroupParams);

            TextView title = new TextView(this);
            title.setText("📷 Scan QR Code");
            title.setTextColor(Color.WHITE);
            title.setTextSize(18);
            title.setTypeface(Typeface.SANS_SERIF, Typeface.BOLD);
            titleGroup.addView(title);

            TextView subTitle = new TextView(this);
            subTitle.setText("Point camera at PC screen pairing code");
            subTitle.setTextColor(Color.parseColor("#00F0FF"));
            subTitle.setTextSize(11.5f);
            subTitle.setTypeface(Typeface.MONOSPACE, Typeface.NORMAL);
            subTitle.setPadding(0, 4, 0, 0);
            titleGroup.addView(subTitle);

            topBar.addView(titleGroup);

            // Circular Close Button (Right)
            Button closeBtn = new Button(this);
            closeBtn.setText("✕");
            closeBtn.setTextColor(Color.WHITE);
            closeBtn.setTextSize(16);
            GradientDrawable closeBg = new GradientDrawable();
            closeBg.setColor(Color.parseColor("#80150A10"));
            closeBg.setStroke(2, Color.parseColor("#80FF0055"));
            closeBg.setCornerRadius(60);
            closeBtn.setBackground(closeBg);
            LinearLayout.LayoutParams closeParams = new LinearLayout.LayoutParams(115, 115);
            closeBtn.setLayoutParams(closeParams);
            closeBtn.setOnClickListener(v -> {
                setResult(Activity.RESULT_CANCELED);
                finish();
            });
            topBar.addView(closeBtn);
            root.addView(topBar);

            // 4. Bottom Controls Deck - Floating Pill Bar
            LinearLayout bottomCard = new LinearLayout(this);
            bottomCard.setOrientation(LinearLayout.VERTICAL);
            bottomCard.setGravity(Gravity.CENTER_HORIZONTAL);

            FrameLayout.LayoutParams bottomParams = new FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT,
                    FrameLayout.LayoutParams.WRAP_CONTENT
            );
            bottomParams.gravity = Gravity.BOTTOM;
            bottomParams.bottomMargin = 90;
            bottomParams.leftMargin = 36;
            bottomParams.rightMargin = 36;
            bottomCard.setLayoutParams(bottomParams);

            // Action Buttons Row (Torch + Photo Gallery)
            LinearLayout btnRow = new LinearLayout(this);
            btnRow.setOrientation(LinearLayout.HORIZONTAL);
            btnRow.setGravity(Gravity.CENTER);
            LinearLayout.LayoutParams rowParams = new LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
            );
            btnRow.setLayoutParams(rowParams);

            torchBtn = new Button(this);
            torchBtn.setText("🔦 Flashlight: Off");
            torchBtn.setTextColor(Color.WHITE);
            torchBtn.setTextSize(11.5f);
            torchBtn.setTypeface(Typeface.SANS_SERIF, Typeface.BOLD);
            GradientDrawable torchBg = new GradientDrawable();
            torchBg.setColor(Color.parseColor("#B30A101A"));
            torchBg.setStroke(2, Color.parseColor("#5500F0FF"));
            torchBg.setCornerRadius(30);
            torchBtn.setBackground(torchBg);
            LinearLayout.LayoutParams torchParams = new LinearLayout.LayoutParams(0, 120, 1.0f);
            torchParams.rightMargin = 14;
            torchBtn.setLayoutParams(torchParams);
            torchBtn.setOnClickListener(v -> toggleTorch());
            btnRow.addView(torchBtn);

            Button galleryBtn = new Button(this);
            galleryBtn.setText("🖼️ Import Photo");
            galleryBtn.setTextColor(Color.WHITE);
            galleryBtn.setTextSize(11.5f);
            galleryBtn.setTypeface(Typeface.SANS_SERIF, Typeface.BOLD);
            GradientDrawable galleryBg = new GradientDrawable();
            galleryBg.setColor(Color.parseColor("#B312151D"));
            galleryBg.setStroke(2, Color.parseColor("#55FFFFFF"));
            galleryBg.setCornerRadius(30);
            galleryBtn.setBackground(galleryBg);
            LinearLayout.LayoutParams galleryParams = new LinearLayout.LayoutParams(0, 120, 1.0f);
            galleryParams.leftMargin = 14;
            galleryBtn.setLayoutParams(galleryParams);
            galleryBtn.setOnClickListener(v -> openGalleryPicker());
            btnRow.addView(galleryBtn);

            bottomCard.addView(btnRow);
            root.addView(bottomCard);

            setContentView(root);
            cameraExecutor = Executors.newSingleThreadExecutor();

            // ⚡ 5. Runtime Camera Permission Request
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
                torchBtn.setText(isTorchOn ? "🔦 Flashlight: ON" : "🔦 Flashlight: Off");
                torchBtn.setTextColor(isTorchOn ? Color.parseColor("#00FF41") : Color.WHITE);
                GradientDrawable bg = (GradientDrawable) torchBtn.getBackground();
                if (bg != null) {
                    bg.setColor(isTorchOn ? Color.parseColor("#CC0D251A") : Color.parseColor("#B30A101A"));
                    bg.setStroke(2, isTorchOn ? Color.parseColor("#AA00FF41") : Color.parseColor("#5500F0FF"));
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
                scaled.getPixels(intArray, 0, bitmap.getWidth(), 0, 0, scaled.getWidth(), scaled.getHeight());
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

    // 🎨 Ultra-Clean Modern Scanner Overlay with 70% Dark Scrim Mask & Sweeping Neon Laser
    public static class CyberTargetView extends View {
        private final Paint scrimPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final Paint cornerPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final Paint laserPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final Paint laserGlowPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final Paint reticlePaint = new Paint(Paint.ANTI_ALIAS_FLAG);

        private float laserProgress = 0f;
        private ValueAnimator laserAnim;
        private RectF targetRect = new RectF();

        public CyberTargetView(Context context) {
            super(context);
            init();
        }

        private void init() {
            // Dark vignette scrim outside the center cutout
            scrimPaint.setColor(Color.parseColor("#B3000000")); // 70% black scrim
            scrimPaint.setStyle(Paint.Style.FILL);

            cornerPaint.setColor(Color.parseColor("#00F0FF"));
            cornerPaint.setStyle(Paint.Style.STROKE);
            cornerPaint.setStrokeWidth(9f);
            cornerPaint.setStrokeCap(Paint.Cap.ROUND);

            reticlePaint.setColor(Color.parseColor("#3300F0FF"));
            reticlePaint.setStyle(Paint.Style.STROKE);
            reticlePaint.setStrokeWidth(2f);

            laserPaint.setColor(Color.parseColor("#00F0FF"));
            laserPaint.setStrokeWidth(4f);

            laserGlowPaint.setColor(Color.parseColor("#6600F0FF"));
            laserGlowPaint.setStrokeWidth(16f);
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
            float boxSize = Math.min(w * 0.72f, 680f);
            float left = (w - boxSize) / 2f;
            // Shift target slightly above vertical center to allow generous room for bottom deck
            float top = (h - boxSize) / 2f - 40f;
            targetRect.set(left, top, left + boxSize, top + boxSize);

            if (laserAnim != null) laserAnim.cancel();
            laserAnim = ValueAnimator.ofFloat(15f, boxSize - 15f);
            laserAnim.setDuration(2200);
            laserAnim.setRepeatMode(ValueAnimator.REVERSE);
            laserAnim.setRepeatCount(ValueAnimator.INFINITE);
            laserAnim.setInterpolator(new AccelerateDecelerateInterpolator());
            laserAnim.addUpdateListener(animation -> {
                laserProgress = (float) animation.getAnimatedValue();
                invalidate();
            });
            laserAnim.start();
        }

        @Override
        protected void onDraw(Canvas canvas) {
            super.onDraw(canvas);
            int w = getWidth();
            int h = getHeight();

            // 1. Draw Semi-Transparent Dark Scrim around the cutout
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                Path maskPath = new Path();
                maskPath.addRect(0, 0, w, h, Path.Direction.CW);
                Path cutoutPath = new Path();
                cutoutPath.addRoundRect(targetRect, 28f, 28f, Path.Direction.CW);
                maskPath.op(cutoutPath, Path.Op.DIFFERENCE);
                canvas.drawPath(maskPath, scrimPaint);
            } else {
                // Fallback for older API
                canvas.drawRect(0, 0, w, targetRect.top, scrimPaint);
                canvas.drawRect(0, targetRect.bottom, w, h, scrimPaint);
                canvas.drawRect(0, targetRect.top, targetRect.left, targetRect.bottom, scrimPaint);
                canvas.drawRect(targetRect.right, targetRect.top, w, targetRect.bottom, scrimPaint);
            }

            float left = targetRect.left;
            float top = targetRect.top;
            float right = targetRect.right;
            float bottom = targetRect.bottom;
            float len = 58f;

            // 2. 4 Elegant Rounded Corner Brackets
            // Top-Left
            canvas.drawLine(left, top, left + len, top, cornerPaint);
            canvas.drawLine(left, top, left, top + len, cornerPaint);

            // Top-Right
            canvas.drawLine(right - len, top, right, top, cornerPaint);
            canvas.drawLine(right, top, right, top + len, cornerPaint);

            // Bottom-Left
            canvas.drawLine(left, bottom, left + len, bottom, cornerPaint);
            canvas.drawLine(left, bottom, left, bottom - len, cornerPaint);

            // Bottom-Right
            canvas.drawLine(right - len, bottom, right, bottom, cornerPaint);
            canvas.drawLine(right, bottom, right, bottom - len, cornerPaint);

            // 3. Subtle Center Crosshairs
            float cx = targetRect.centerX();
            float cy = targetRect.centerY();
            canvas.drawLine(cx - 20f, cy, cx + 20f, cy, reticlePaint);
            canvas.drawLine(cx, cy - 20f, cx, cy + 20f, reticlePaint);

            // 4. Sweeping Neon Laser Line inside the target box
            float currentLaserY = top + laserProgress;
            canvas.drawLine(left + 20f, currentLaserY, right - 20f, currentLaserY, laserGlowPaint);
            canvas.drawLine(left + 20f, currentLaserY, right - 20f, currentLaserY, laserPaint);
        }

        public void stopAnimation() {
            if (laserAnim != null) laserAnim.cancel();
        }
    }
}
