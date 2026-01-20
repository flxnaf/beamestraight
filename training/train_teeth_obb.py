"""
Beame Teeth OBB Model Training Script
For RTX 3070 Ti (8GB VRAM)

Trains YOLOv8-OBB model on teeth polygon data and exports to ONNX.

Usage:
    python train_teeth_obb.py
    
Or with custom settings:
    python train_teeth_obb.py --epochs 150 --batch 8
"""

import subprocess
import sys
import os
from pathlib import Path

# ============================================
# Configuration
# ============================================
DATASET_PATH = Path("datasets/teeth-obb/data.yaml")
MODEL_SIZE = "n"  # nano - best for browser (6MB ONNX)
EPOCHS = 100
BATCH_SIZE = 8  # RTX 3070 Ti (8GB) - conservative for OBB
IMAGE_SIZE = 640
PROJECT_NAME = "runs/obb"
EXPERIMENT_NAME = "teeth_detection_3070ti"
OUTPUT_ONNX_PATH = Path("public/models/teeth-detection-obb.onnx")


def install_dependencies():
    """Install required packages"""
    print("\n[1/5] Installing dependencies...")
    
    packages = [
        "ultralytics>=8.1.0",  # YOLOv8 with OBB support
        "onnx>=1.14.0",
        "onnxruntime>=1.15.0",
        "opencv-python>=4.8.0",
        "pyyaml>=6.0",
    ]
    
    for package in packages:
        print(f"  Installing {package}...")
        try:
            subprocess.check_call([
                sys.executable, "-m", "pip", "install", "-q", package
            ])
        except subprocess.CalledProcessError as e:
            # Windows long path issue workaround - try without -q flag
            if "onnx" in package:
                print(f"    Retrying {package} with different options...")
                try:
                    subprocess.check_call([
                        sys.executable, "-m", "pip", "install", 
                        "--no-cache-dir", "--prefer-binary", package
                    ])
                except subprocess.CalledProcessError:
                    print(f"    WARNING: Could not install {package}, continuing anyway...")
            else:
                raise e
    
    # Install PyTorch with CUDA 11.8 if not already installed with CUDA
    try:
        import torch
        if not torch.cuda.is_available():
            raise ImportError("CUDA not available")
        print(f"  PyTorch {torch.__version__} with CUDA {torch.version.cuda} already installed")
    except:
        print("  Installing PyTorch with CUDA 11.8...")
        subprocess.check_call([
            sys.executable, "-m", "pip", "install", "-q",
            "torch", "torchvision", 
            "--index-url", "https://download.pytorch.org/whl/cu118"
        ])


def verify_dataset():
    """Verify dataset exists and is valid"""
    print("\n[2/5] Verifying dataset...")
    
    if not DATASET_PATH.exists():
        print(f"  ERROR: Dataset not found at {DATASET_PATH}")
        print("  Run the conversion script first:")
        print("    python scripts/convert_labelstudio_to_yolo_obb.py")
        sys.exit(1)
    
    import yaml
    with open(DATASET_PATH) as f:
        config = yaml.safe_load(f)
    
    dataset_root = Path(config['path'])
    train_path = dataset_root / config['train']
    val_path = dataset_root / config['val']
    
    train_images = list(train_path.glob("*.*"))
    val_images = list(val_path.glob("*.*"))
    
    print(f"  Dataset root: {dataset_root}")
    print(f"  Training images: {len(train_images)}")
    print(f"  Validation images: {len(val_images)}")
    print(f"  Classes: {config['names']}")
    
    if len(train_images) == 0:
        print("  ERROR: No training images found!")
        sys.exit(1)
    
    return config


def train_model():
    """Train YOLOv8-OBB model"""
    print("\n[3/5] Training YOLOv8-OBB model...")
    print(f"  Model: yolov8{MODEL_SIZE}-obb.pt")
    print(f"  Epochs: {EPOCHS}")
    print(f"  Batch size: {BATCH_SIZE}")
    print(f"  Image size: {IMAGE_SIZE}")
    print()
    
    from ultralytics import YOLO
    import torch
    
    # Check GPU
    if torch.cuda.is_available():
        gpu_name = torch.cuda.get_device_name(0)
        gpu_mem = torch.cuda.get_device_properties(0).total_memory / 1e9
        print(f"  GPU: {gpu_name} ({gpu_mem:.1f} GB)")
        device = 0
    else:
        print("  WARNING: No GPU detected! Training will be slow.")
        print("  Using CPU for training...")
        device = 'cpu'
    
    # Load OBB model
    model = YOLO(f"yolov8{MODEL_SIZE}-obb.pt")
    
    # Train
    results = model.train(
        data=str(DATASET_PATH),
        epochs=EPOCHS,
        batch=BATCH_SIZE,
        imgsz=IMAGE_SIZE,
        project=PROJECT_NAME,
        name=EXPERIMENT_NAME,
        exist_ok=True,
        
        # Optimization for 3070 Ti (or CPU)
        device=device,  # Use GPU if available, else CPU
        workers=4,  # Reduced for Windows stability
        amp=True if torch.cuda.is_available() else False,  # Mixed precision for speed (GPU only)
        
        # Data augmentation (good for dental images)
        hsv_h=0.015,  # Hue variation
        hsv_s=0.5,    # Saturation variation
        hsv_v=0.4,    # Value variation
        degrees=15,   # Rotation (teeth can be at angles)
        translate=0.1,
        scale=0.3,
        flipud=0.0,   # Don't flip vertically (teeth have orientation)
        fliplr=0.5,   # Horizontal flip OK
        mosaic=0.8,   # Mosaic augmentation
        
        # Validation
        val=True,
        plots=True,
        save=True,
    )
    
    return results


def export_to_onnx():
    """Export trained model to ONNX format"""
    print("\n[4/5] Exporting to ONNX...")
    
    from ultralytics import YOLO
    
    # Find best weights
    best_weights = Path(PROJECT_NAME) / EXPERIMENT_NAME / "weights" / "best.pt"
    
    if not best_weights.exists():
        print(f"  ERROR: Best weights not found at {best_weights}")
        sys.exit(1)
    
    print(f"  Loading: {best_weights}")
    model = YOLO(str(best_weights))
    
    # Export to ONNX
    print(f"  Exporting to ONNX...")
    model.export(
        format="onnx",
        imgsz=IMAGE_SIZE,
        simplify=True,  # Simplify graph for browser
        opset=12,       # Good compatibility
        dynamic=False,  # Fixed input size for browser
    )
    
    # Copy to public folder
    onnx_source = best_weights.with_suffix('.onnx')
    OUTPUT_ONNX_PATH.parent.mkdir(parents=True, exist_ok=True)
    
    import shutil
    shutil.copy2(onnx_source, OUTPUT_ONNX_PATH)
    
    onnx_size = OUTPUT_ONNX_PATH.stat().st_size / 1e6
    print(f"  Exported: {OUTPUT_ONNX_PATH} ({onnx_size:.1f} MB)")
    
    return OUTPUT_ONNX_PATH


def print_summary():
    """Print training summary and next steps"""
    print("\n[5/5] Training Complete!")
    print("=" * 50)
    print()
    
    results_dir = Path(PROJECT_NAME) / EXPERIMENT_NAME
    
    print("Training artifacts:")
    print(f"  Best weights: {results_dir / 'weights' / 'best.pt'}")
    print(f"  Results plot: {results_dir / 'results.png'}")
    print(f"  ONNX model:   {OUTPUT_ONNX_PATH}")
    print()
    
    print("Next steps:")
    print("  1. Check results.png for training curves")
    print("  2. Test model in browser:")
    print("     npm run dev")
    print("     Open http://localhost:3000/analysis/")
    print()
    print("  3. Enable OBB detection in analysis/main.ts:")
    print("     const ENABLE_TOOTH_DETECTION = true;")
    print("     const SHOW_TOOTH_OVERLAY = true;")


def main():
    global EPOCHS, BATCH_SIZE, MODEL_SIZE
    
    print("=" * 50)
    print("  Beame Teeth OBB Model Training")
    print("  RTX 3070 Ti Optimized")
    print("=" * 50)
    
    # Parse arguments
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--epochs', type=int, default=EPOCHS)
    parser.add_argument('--batch', type=int, default=BATCH_SIZE)
    parser.add_argument('--size', type=str, default=MODEL_SIZE, choices=['n', 's', 'm'])
    args = parser.parse_args()
    
    EPOCHS = args.epochs
    BATCH_SIZE = args.batch
    MODEL_SIZE = args.size
    
    try:
        install_dependencies()
        verify_dataset()
        train_model()
        export_to_onnx()
        print_summary()
    except KeyboardInterrupt:
        print("\n\nTraining interrupted by user.")
    except Exception as e:
        print(f"\n\nERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
