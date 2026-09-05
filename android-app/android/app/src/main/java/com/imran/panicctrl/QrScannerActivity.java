package com.imran.panicctrl;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
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
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.camera.core.Camera;
import androidx.camera.core.CameraSelector;
import androidx.camera.core.ImageAnalysis;
import androidx.camera.core.ImageProxy;
import androidx.camera.core.Preview;
import androidx.camera.lifecycle.ProcessCameraProvider;
import androidx.camera.view.PreviewView;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
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

public class QrScannerActivity extends AppCompatActivity {

    private static final String TAG = "QrScannerActivity";
    public static final String RESULT_KEY = "qr_result";
    private static final int PERMISSION_REQ_CODE = 1001;
    private static final int GALLERY_REQ_CODE = 1002;

    private ExecutorService cameraExecutor;
    private final AtomicBoolean scanned = new AtomicBoolean(false);
    private ProcessCameraProvider cameraProvider;
    private final MultiFormatReader zxingReader = new MultiFormatReader();

    private PreviewView previewView;
    private Camera camera;
    private boolean isTorchOn = false;
    private Button torchBtn;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(0xFF000000);

        // 1. Camera Preview View
        previewView = new PreviewView(this);
        previewView.setLayoutParams(new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
        ));
        root.addView(previewView);

        // 2. Cyber Viewfinder Target Box
        View targetFrame = new View(this);
        FrameLayout.LayoutParams targetParams = new FrameLayout.LayoutParams(620, 620);
        targetParams.gravity = Gravity.CENTER;
        targetFrame.setLayoutParams(targetParams);
        GradientDrawable border = new GradientDrawable();
        border.setColor(Color.TRANSPARENT);
        border.setStroke(4, Color.parseColor("#00F0FF"));
        border.setCornerRadius(24);
        targetFrame.setBackground(border);
        root.addView(targetFrame);

        // 3. Header HUD Bar (Title + Close Button)
        LinearLayout topBar = new LinearLayout(this);
        topBar.setOrientation(LinearLayout.HORIZONTAL);
        topBar.setGravity(Gravity.CENTER_VERTICAL);
        FrameLayout.LayoutParams topBarParams = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.WRAP_CONTENT
        );
        topBarParams.gravity = Gravity.TOP;
        topBarParams.setMargins(32, 64, 32, 0);
        topBar.setLayoutParams(topBarParams);

        TextView title = new TextView(this);
        title.setText("📷 SCAN PC QR CODE");
        title.setTextColor(Color.parseColor("#00F0FF"));
        title.setTextSize(15);
        title.setTypeface(Typeface.MONOSPACE, Typeface.BOLD);
        LinearLayout.LayoutParams titleParams = new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1.0f);
        title.setLayoutParams(titleParams);
        topBar.addView(title);

        Button closeBtn = new Button(this);
        closeBtn.setText("✕");
        closeBtn.setTextColor(Color.WHITE);
        closeBtn.setTextSize(16);
        closeBtn.setBackgroundColor(Color.parseColor("#44FF0055"));
        LinearLayout.LayoutParams closeParams = new LinearLayout.LayoutParams(110, 110);
        closeBtn.setLayoutParams(closeParams);
        closeBtn.setOnClickListener(v -> {
            setResult(Activity.RESULT_CANCELED);
            finish();
        });
        topBar.addView(closeBtn);
        root.addView(topBar);

        // 4. Bottom Controls HUD (Instruction, Torch & Gallery Picker)
        LinearLayout bottomBar = new LinearLayout(this);
        bottomBar.setOrientation(LinearLayout.VERTICAL);
        bottomBar.setGravity(Gravity.CENTER_HORIZONTAL);
        FrameLayout.LayoutParams bottomParams = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.WRAP_CONTENT
        );
        bottomParams.gravity = Gravity.BOTTOM;
        bottomParams.bottomMargin = 80;
        bottomParams.leftMargin = 32;
        bottomParams.rightMargin = 32;
        bottomBar.setLayoutParams(bottomParams);

        TextView hint = new TextView(this);
        hint.setText("POINT CAMERA AT PC SCREEN QR CODE");
        hint.setTextColor(Color.parseColor("#00FF41"));
        hint.setTextSize(12);
        hint.setGravity(Gravity.CENTER);
        hint.setTypeface(Typeface.MONOSPACE, Typeface.BOLD);
        hint.setPadding(0, 0, 0, 24);
        bottomBar.addView(hint);

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
        torchBtn.setTextColor(Color.WHITE);
        torchBtn.setTextSize(11);
        torchBtn.setBackgroundColor(Color.parseColor("#3300F0FF"));
        LinearLayout.LayoutParams torchParams = new LinearLayout.LayoutParams(0, 120, 1.0f);
        torchParams.rightMargin = 12;
        torchBtn.setLayoutParams(torchParams);
        torchBtn.setOnClickListener(v -> toggleTorch());
        btnRow.addView(torchBtn);

        Button galleryBtn = new Button(this);
        galleryBtn.setText("🖼️ GALLERY");
        galleryBtn.setTextColor(Color.WHITE);
        galleryBtn.setTextSize(11);
        galleryBtn.setBackgroundColor(Color.parseColor("#33FFFFFF"));
        LinearLayout.LayoutParams galleryParams = new LinearLayout.LayoutParams(0, 120, 1.0f);
        galleryParams.leftMargin = 12;
        galleryBtn.setLayoutParams(galleryParams);
        galleryBtn.setOnClickListener(v -> openGalleryPicker());
        btnRow.addView(galleryBtn);

        bottomBar.addView(btnRow);
        root.addView(bottomBar);

        setContentView(root);
        cameraExecutor = Executors.newSingleThreadExecutor();

        // ⚡ 5. Strict Permission Verification Before Starting Camera
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.CAMERA}, PERMISSION_REQ_CODE);
        } else {
            startCamera();
        }
    }

    private void toggleTorch() {
        if (camera != null && camera.getCameraInfo().hasFlashUnit()) {
            isTorchOn = !isTorchOn;
            camera.getCameraControl().enableTorch(isTorchOn);
            if (torchBtn != null) {
                torchBtn.setText(isTorchOn ? "🔦 TORCH: ON" : "🔦 TORCH: OFF");
                torchBtn.setTextColor(isTorchOn ? Color.parseColor("#00FF41") : Color.WHITE);
            }
        } else {
            Toast.makeText(this, "Torch not available on this device", Toast.LENGTH_SHORT).show();
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

        BarcodeScannerOptions options = new BarcodeScannerOptions.Builder()
                .setBarcodeFormats(Barcode.FORMAT_QR_CODE)
                .build();
        BarcodeScanner scanner = BarcodeScanning.getClient(options);

        ImageAnalysis analysis = new ImageAnalysis.Builder()
                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                .build();

        analysis.setAnalyzer(cameraExecutor, imageProxy -> {
            if (scanned.get()) {
                imageProxy.close();
                return;
            }
            analyzeFrame(imageProxy, scanner);
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
    }

    private void deliverResult(String value) {
        if (value != null && !value.isEmpty() && scanned.compareAndSet(false, true)) {
            // Haptic Feedback
            try {
                Vibrator v = (Vibrator) getSystemService(VIBRATOR_SERVICE);
                if (v != null) {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        v.vibrate(VibrationEffect.createOneShot(80, VibrationEffect.DEFAULT_AMPLITUDE));
                    } else {
                        v.vibrate(80);
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
                int[] intArray = new int[bitmap.getWidth() * bitmap.getHeight()];
                bitmap.getPixels(intArray, 0, bitmap.getWidth(), 0, 0, bitmap.getWidth(), bitmap.getHeight());
                RGBLuminanceSource source = new RGBLuminanceSource(bitmap.getWidth(), bitmap.getHeight(), intArray);
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
        if (cameraExecutor != null) cameraExecutor.shutdown();
        if (cameraProvider != null) cameraProvider.unbindAll();
    }
}
