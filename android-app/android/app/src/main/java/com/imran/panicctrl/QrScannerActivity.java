package com.imran.panicctrl;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.util.Size;
import android.view.Gravity;
import android.view.View;
import android.widget.FrameLayout;
import android.widget.ImageButton;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;
import androidx.camera.core.CameraSelector;
import androidx.camera.core.ImageAnalysis;
import androidx.camera.core.ImageProxy;
import androidx.camera.core.Preview;
import androidx.camera.lifecycle.ProcessCameraProvider;
import androidx.camera.view.PreviewView;
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
import com.google.zxing.Result;
import com.google.zxing.common.HybridBinarizer;

import java.nio.ByteBuffer;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

public class QrScannerActivity extends AppCompatActivity {

    public static final String RESULT_KEY = "qr_result";
    private ExecutorService cameraExecutor;
    private final AtomicBoolean scanned = new AtomicBoolean(false);
    private ProcessCameraProvider cameraProvider;
    private final MultiFormatReader zxingReader = new MultiFormatReader();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(0xFF000000);

        PreviewView previewView = new PreviewView(this);
        previewView.setLayoutParams(new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
        ));
        root.addView(previewView);

        // Viewfinder target box
        View targetFrame = new View(this);
        FrameLayout.LayoutParams targetParams = new FrameLayout.LayoutParams(600, 600);
        targetParams.gravity = Gravity.CENTER;
        targetFrame.setLayoutParams(targetParams);
        android.graphics.drawable.GradientDrawable border = new android.graphics.drawable.GradientDrawable();
        border.setColor(Color.TRANSPARENT);
        border.setStroke(4, Color.parseColor("#00F0FF"));
        border.setCornerRadius(24);
        targetFrame.setBackground(border);
        root.addView(targetFrame);

        // Instruction
        TextView hint = new TextView(this);
        hint.setText("POINT CAMERA AT PC SCREEN QR CODE");
        hint.setTextColor(Color.parseColor("#00F0FF"));
        hint.setTextSize(13);
        hint.setGravity(Gravity.CENTER);
        hint.setTypeface(android.graphics.Typeface.MONOSPACE, android.graphics.Typeface.BOLD);
        FrameLayout.LayoutParams hintParams = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.WRAP_CONTENT, FrameLayout.LayoutParams.WRAP_CONTENT
        );
        hintParams.gravity = Gravity.CENTER_HORIZONTAL | Gravity.BOTTOM;
        hintParams.bottomMargin = 140;
        hint.setLayoutParams(hintParams);
        root.addView(hint);

        ImageButton cancelBtn = new ImageButton(this);
        cancelBtn.setBackgroundColor(0xCCFF0055);
        cancelBtn.setPadding(24, 24, 24, 24);
        FrameLayout.LayoutParams cancelParams = new FrameLayout.LayoutParams(140, 140);
        cancelParams.gravity = Gravity.TOP | Gravity.END;
        cancelParams.setMargins(0, 80, 40, 0);
        cancelBtn.setLayoutParams(cancelParams);
        cancelBtn.setOnClickListener(v -> {
            setResult(Activity.RESULT_CANCELED);
            finish();
        });
        root.addView(cancelBtn);

        setContentView(root);
        cameraExecutor = Executors.newSingleThreadExecutor();

        ListenableFuture<ProcessCameraProvider> future = ProcessCameraProvider.getInstance(this);
        future.addListener(() -> {
            try {
                cameraProvider = future.get();
                bindCamera(previewView);
            } catch (Exception e) {
                setResult(Activity.RESULT_CANCELED);
                finish();
            }
        }, ContextCompat.getMainExecutor(this));
    }

    private void bindCamera(PreviewView previewView) {
        Preview preview = new Preview.Builder().build();
        preview.setSurfaceProvider(previewView.getSurfaceProvider());

        BarcodeScannerOptions options = new BarcodeScannerOptions.Builder()
                .setBarcodeFormats(Barcode.FORMAT_QR_CODE)
                .build();
        BarcodeScanner scanner = BarcodeScanning.getClient(options);

        ImageAnalysis analysis = new ImageAnalysis.Builder()
                .setTargetResolution(new Size(1280, 720))
                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                .build();

        analysis.setAnalyzer(cameraExecutor, imageProxy -> {
            if (scanned.get()) { imageProxy.close(); return; }
            analyzeFrame(imageProxy, scanner);
        });

        CameraSelector cameraSelector = new CameraSelector.Builder()
                .requireLensFacing(CameraSelector.LENS_FACING_BACK)
                .build();

        cameraProvider.unbindAll();
        cameraProvider.bindToLifecycle((LifecycleOwner) this, cameraSelector, preview, analysis);
    }

    @androidx.camera.core.ExperimentalGetImage
    private void analyzeFrame(ImageProxy imageProxy, BarcodeScanner scanner) {
        try {
            // ⚡ 1. Primary Engine: ZXing Pure-Java Offline Barcode Decoder
            ByteBuffer yBuffer = imageProxy.getPlanes()[0].getBuffer();
            int ySize = yBuffer.remaining();
            byte[] yBytes = new byte[ySize];
            yBuffer.get(yBytes);

            int width = imageProxy.getWidth();
            int height = imageProxy.getHeight();
            int rotation = imageProxy.getImageInfo().getRotationDegrees();

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

        // ⚡ 2. Secondary Engine: Google ML Kit
        android.media.Image mediaImage = imageProxy.getImage();
        if (mediaImage == null) { imageProxy.close(); return; }

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
            Intent result = new Intent();
            result.putExtra(RESULT_KEY, value);
            setResult(Activity.RESULT_OK, result);
            finish();
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (cameraExecutor != null) cameraExecutor.shutdown();
        if (cameraProvider != null) cameraProvider.unbindAll();
    }
}
