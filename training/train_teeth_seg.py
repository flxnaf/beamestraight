"""
Beame Teeth Segmentation Model Training Script
For RTX 3070 Ti (8GB VRAM)

Trains YOLOv8-seg model on teeth polygon data (preserving all points) and exports to ONNX.

Usage:
    python train_teeth_seg.py
    
Or with custom settings:
    python train_teeth_seg.py --epochs 50 --batch 8
"""

import subprocess
import sys
import os
from pathlib import Path

# ============================================
# Configuration
# ============================================
DATASET_PATH = Path("datasets/teeth-seg/data.yaml")
MODEL_SIZE = "n"  # nano - best for browser (6MB ONNX)
EPOCHS = 50  # Reduced for faster testing
BATCH_SIZE = 8  # RTX 3070 Ti (8GB) - conservative for segmentation
IMAGE_SIZE = 640
PROJECT_NAME = "runs/segment"
EXPERIMENT_NAME = "teeth_segmentation"
OUTPUT_ONNX_PATH = Path("public/models/teeth-detection-seg.onnx")


def install_dependencies():
    """Install required packages"""
    print("\n[1/5] Installing dependencies...")
    
    packages = [
        "ultralytics>=8.1.0",  # YOLOv8 with segmentation support
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
            if "onnx" in package:
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


def prepare_dataset():
    """Prepare segmentation dataset from existing OBB data"""
    print("\n[2/5] Preparing segmentation dataset...")
    
    import shutil
    import yaml
    
    obb_dataset = Path("datasets/teeth-obb")
    seg_dataset = Path("datasets/teeth-seg")
    
    if not obb_dataset.exists():
        print(f"  ERROR: OBB dataset not found at {obb_dataset}")
        print("  The dataset should already be created from the zip files.")
        sys.exit(1)
    
    # Copy entire dataset structure
    if seg_dataset.exists():
        print(f"  Cleaning existing segmentation dataset...")
        shutil.rmtree(seg_dataset)
    
    print(f"  Copying dataset to {seg_dataset}...")
    shutil.copytree(obb_dataset, seg_dataset)
    
    # Update data.yaml for segmentation
    yaml_path = seg_dataset / "data.yaml"
    with open(yaml_path, 'r') as f:
        config = yaml.safe_load(f)
    
    config['path'] = str(seg_dataset.absolute())
    
    with open(yaml_path, 'w') as f:
        yaml.dump(config, f, default_flow_style=False)
    
    # Count files
    train_images = list((seg_dataset / "train" / "images").glob("*.*"))
    val_images = list((seg_dataset / "val" / "images").glob("*.*"))
    
    print(f"  Dataset root: {seg_dataset}")
    print(f"  Training images: {len(train_images)}")
    print(f"  Validation images: {len(val_images)}")
    print(f"  Classes: {config['names']}")
    
    # Verify label format (should have multiple x,y pairs)
    sample_label = list((seg_dataset / "train" / "labels").glob("*.txt"))[0]
    with open(sample_label, 'r') as f:
        first_line = f.readline().strip()
        coords = first_line.split()[1:]  # Skip class ID
        num_points = len(coords) // 2
        print(f"  Sample polygon has {num_points} points (multi-point polygon)")
    
    return config


def train_model():
    """Train YOLOv8-seg model"""
    print("\n[3/5] Training YOLOv8-seg model...")
    print(f"  Model: yolov8{MODEL_SIZE}-seg.pt")
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
    
    # Load segmentation model
    model = YOLO(f"yolov8{MODEL_SIZE}-seg.pt")
    
    # Train
    results = model.train(
        data=str(DATASET_PATH),
        epochs=EPOCHS,
        batch=BATCH_SIZE,
        imgsz=IMAGE_SIZE,
        project=PROJECT_NAME,
        name=EXPERIMENT_NAME,
        exist_ok=True,
        
        # Optimization
        device=device,
        workers=4,
        amp=True if torch.cuda.is_available() else False,
        
        # Data augmentation (good for dental images)
        hsv_h=0.015,
        hsv_s=0.5,
        hsv_v=0.4,
        degrees=15,
        translate=0.1,
        scale=0.3,
        flipud=0.0,
        fliplr=0.5,
        mosaic=0.8,
        
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
    
    # Find best weights (handle nested path from Ultralytics)
    best_weights_paths = [
        Path(PROJECT_NAME) / PROJECT_NAME / EXPERIMENT_NAME / "weights" / "best.pt",  # Nested path
        Path(PROJECT_NAME) / EXPERIMENT_NAME / "weights" / "best.pt"  # Standard path
    ]
    
    best_weights = None
    for path in best_weights_paths:
        if path.exists():
            best_weights = path
            break
    
    if not best_weights:
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
        simplify=True,
        opset=12,
        dynamic=False,
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
    
    print("Key difference from OBB:")
    print("  - Preserves all polygon points (not just 4 corners)")
    print("  - More accurate tooth outlines")
    print("  - Slightly larger model size")
    print()
    
    print("Next steps:")
    print("  1. Check results.png for training curves")
    print("  2. Update frontend to use segmentation model:")
    print("     - Use onnxInference.ts (not onnxInferenceOBB.ts)")
    print("     - Load teeth-detection-seg.onnx")
    print("  3. Test in browser at http://localhost:3000/analysis/")


def main():
    global EPOCHS, BATCH_SIZE, MODEL_SIZE
    
    print("=" * 50)
    print("  Beame Teeth Segmentation Model Training")
    print("  Full Polygon Support (Variable Points)")
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
        prepare_dataset()
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
