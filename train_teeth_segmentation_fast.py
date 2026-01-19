"""
Beame Teeth SEGMENTATION Model Training Script
Optimized for real-time browser inference (~50-80ms)
"""

import os
from pathlib import Path

print("=" * 60)
print("🦷 BEAME TEETH SEGMENTATION MODEL TRAINING")
print("=" * 60)
print("GPU: NVIDIA RTX 3080 Ti (CUDA)")
print("Framework: YOLOv8-seg (Ultralytics)")
print("Target: Real-time browser inference (<100ms)")
print("=" * 60)
print()

# Step 1: Install dependencies
print("📦 Installing dependencies...")
import subprocess
import sys

try:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", "--upgrade", "roboflow", "ultralytics", "onnx"])
    print("✅ Dependencies installed successfully")
except Exception as e:
    print(f"❌ Failed to install dependencies: {e}")
    sys.exit(1)

# Step 2: Use converted dataset from Label Studio
print("\n📂 Using converted dataset from Label Studio...")
print("⚠️  Make sure you've run convert_coco_to_yolov8seg.py first!")

# Path to converted dataset
dataset_path = "teeth-seg"  # Created by convert_coco_to_yolov8seg.py

if not os.path.exists(dataset_path):
    print(f"❌ Dataset not found at: {dataset_path}")
    print()
    print("Please run the conversion script first:")
    print("  1. Update paths in convert_coco_to_yolov8seg.py")
    print("  2. Run: python convert_coco_to_yolov8seg.py")
    print("  3. Then run this training script")
    sys.exit(1)

print(f"✅ Dataset found at: {dataset_path}")

# Step 3: Train YOLOv8-seg model at 320x320 for SPEED
print("\n🚀 Starting YOLOv8-seg training...")
print("=" * 60)
print("TRAINING CONFIGURATION:")
print("  - Model: YOLOv8n-seg (nano segmentation - FAST)")
print("  - Device: CUDA (GPU: RTX 3080 Ti)")
print("  - Epochs: 100")
print("  - Batch: 16")
print("  - Image Size: 320x320 ⚡ (FAST inference ~50-80ms in browser)")
print("  - Task: Instance Segmentation (pixel-perfect tooth masks)")
print("=" * 60)
print()

from ultralytics import YOLO

# Initialize YOLOv8n-seg model (segmentation variant)
model = YOLO('yolov8n-seg.pt')  # -seg model for segmentation

# Train with 320x320 for REAL-TIME browser performance
results = model.train(
    data=f'{dataset_path}/data.yaml',
    epochs=100,
    batch=16,
    imgsz=320,               # 💡 320x320 for FAST inference (vs 640x640)
    device='0',
    workers=8,
    patience=15,
    save=True,
    pretrained=True,
    optimizer='AdamW',
    lr0=0.001,
    lrf=0.01,
    momentum=0.937,
    weight_decay=0.0005,
    warmup_epochs=3,
    warmup_momentum=0.8,
    box=7.5,
    cls=0.5,
    dfl=1.5,
    project='runs/segment',  # segment folder for segmentation models
    name='teeth_segmentation_fast',
    exist_ok=True,
    amp=True,
    cache='ram'
)

print("\n✅ Training completed!")

# Step 4: Find the best model
print("\n🔍 Locating best trained model...")
import glob

run_dirs = glob.glob('runs/segment/teeth_segmentation_fast*')
if not run_dirs:
    print("❌ No training output found!")
    sys.exit(1)

latest_run = sorted(run_dirs, key=os.path.getmtime)[-1]
best_model_path = os.path.join(latest_run, 'weights', 'best.pt')

if not os.path.exists(best_model_path):
    print(f"❌ Best model not found at: {best_model_path}")
    sys.exit(1)

print(f"✅ Found best model at: {best_model_path}")

# Step 5: Export to ONNX for browser deployment
print("\n📤 Exporting model to ONNX format...")
print("=" * 60)
print("ONNX EXPORT SETTINGS:")
print("  - Format: ONNX (browser-compatible)")
print("  - Input Size: 320x320 (FAST)")
print("  - Opset: 12")
print("  - Simplify: Yes")
print("=" * 60)
print()

trained_model = YOLO(best_model_path)
onnx_path = trained_model.export(
    format='onnx',
    opset=12,
    simplify=True,
    dynamic=False,      # Static size for better browser optimization
    imgsz=320           # Export with 320x320 input (FAST)
)

print(f"✅ ONNX model exported to: {onnx_path}")

# Step 6: Copy ONNX model to public folder
print("\n📁 Copying ONNX model to public/models/...")
import shutil

public_models_dir = Path('public/models')
public_models_dir.mkdir(parents=True, exist_ok=True)

# Save as teeth-detection-seg-fast.onnx
dest_path = public_models_dir / 'teeth-detection-seg-fast.onnx'
shutil.copy2(onnx_path, dest_path)

print(f"✅ Model copied to: {dest_path}")
print(f"📊 Model size: {os.path.getsize(dest_path) / (1024*1024):.2f} MB")

# Step 7: Display training metrics
print("\n" + "=" * 60)
print("🎉 TRAINING COMPLETE!")
print("=" * 60)
print(f"✅ Best model (PyTorch): {best_model_path}")
print(f"✅ ONNX model (Browser): {dest_path}")
print(f"✅ Training logs: {latest_run}")
print()
print("📊 TRAINING RESULTS:")
try:
    import pandas as pd
    results_csv = os.path.join(latest_run, 'results.csv')
    if os.path.exists(results_csv):
        df = pd.read_csv(results_csv)
        if len(df) > 0:
            last_row = df.iloc[-1]
            print(f"  - Final mask mAP50: {last_row.get('metrics/mAP50(M)', 'N/A')}")
            print(f"  - Final mask mAP50-95: {last_row.get('metrics/mAP50-95(M)', 'N/A')}")
            print(f"  - Total epochs: {len(df)}")
except Exception as e:
    print(f"  - Could not read training metrics: {e}")

print()
print("🚀 NEXT STEPS:")
print("  1. Update ONNX_MODEL_PATH in analysis/main.ts:")
print("     const ONNX_MODEL_PATH = '/models/teeth-detection-seg-fast.onnx';")
print("  2. Update onnxInference.ts to handle segmentation masks")
print("  3. Run: npm run dev")
print("  4. Expected inference time: 50-80ms (vs current 260ms)")
print()
print("=" * 60)
print("💡 PERFORMANCE ESTIMATE:")
print("   320x320 YOLOv8n-seg in browser: ~50-80ms")
print("   This gives you ~12-20 FPS (close to real-time!)")
print("=" * 60)
