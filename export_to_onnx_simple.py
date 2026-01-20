"""
Simple ONNX Export Script
Works on Windows, Mac, or Linux

Usage:
    python export_to_onnx_simple.py training/teeth_seg_final_best.pt
"""

import sys
from pathlib import Path

if len(sys.argv) < 2:
    print("Usage: python export_to_onnx_simple.py path/to/best.pt")
    sys.exit(1)

model_path = Path(sys.argv[1])
if not model_path.exists():
    print(f"Error: Model not found at {model_path}")
    sys.exit(1)

print("Installing ultralytics...")
import subprocess
subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", "ultralytics"])

print(f"\nLoading model: {model_path}")
from ultralytics import YOLO
model = YOLO(str(model_path))

print(f"Model: {model.model_name}")
print(f"Task: {model.task}")

print("\nExporting to ONNX...")
onnx_path = model.export(
    format="onnx",
    imgsz=640,  # 640x640 for quality (teeth need details!)
    simplify=True,
    opset=12,
    dynamic=False,
)

print(f"\n✓ Export successful!")
print(f"ONNX file: {onnx_path}")

size_mb = Path(onnx_path).stat().st_size / (1024 * 1024)
print(f"File size: {size_mb:.2f} MB")

# Copy to public/models
import shutil
output_path = Path("public/models/teeth-detection-seg.onnx")
output_path.parent.mkdir(parents=True, exist_ok=True)
shutil.copy2(onnx_path, output_path)
print(f"\n✓ Copied to: {output_path}")
