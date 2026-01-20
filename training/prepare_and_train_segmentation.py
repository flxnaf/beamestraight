"""
Prepare COCO Segmentation Data and Train YOLOv8-seg Model
Combines multiple Label Studio COCO exports and trains on GPU

Usage:
    python prepare_and_train_segmentation.py
"""

import json
import os
import shutil
import zipfile
from pathlib import Path
import subprocess
import sys

# ============================================
# Configuration
# ============================================
DATASET_SOURCE = Path("datasets/teeth-seg-finalset")
DATASET_OUTPUT = Path("datasets/teeth-seg-combined")
TEMP_DIR = Path("datasets/temp_extraction")

# Training Configuration
MODEL_SIZE = "n"  # nano - best for browser
EPOCHS = 200
BATCH_SIZE = 8  # Reduced for 640x640 (uses more VRAM)
IMAGE_SIZE = 640  # Standard YOLO size - better quality for teeth details
PROJECT_NAME = "runs/segment"
EXPERIMENT_NAME = "teeth_seg_640"
OUTPUT_ONNX_PATH = Path("public/models/teeth-detection-seg.onnx")

def install_dependencies():
    """Install required packages"""
    print("\n" + "=" * 60)
    print("[1/5] Installing dependencies...")
    print("=" * 60)
    
    packages = [
        "ultralytics>=8.1.0",
        "opencv-python>=4.8.0",
        "pyyaml>=6.0",
        "pillow>=10.0.0",
    ]
    
    for package in packages:
        print(f"  Installing {package}...")
        try:
            subprocess.check_call([
                sys.executable, "-m", "pip", "install", "-q", package
            ])
        except subprocess.CalledProcessError:
            print(f"    [WARNING] Failed to install {package}, trying without version constraint...")
            try:
                subprocess.check_call([
                    sys.executable, "-m", "pip", "install", "-q", package.split(">=")[0]
                ])
            except:
                print(f"    [WARNING] Could not install {package}, continuing anyway...")
    
    # Install PyTorch with CUDA if needed
    try:
        import torch
        if torch.cuda.is_available():
            print(f"  [OK] PyTorch {torch.__version__} with CUDA {torch.version.cuda}")
        else:
            print("  [WARNING] PyTorch found but CUDA not available, installing CUDA version...")
            raise ImportError("Need CUDA")
    except:
        print("  Installing PyTorch with CUDA 11.8...")
        subprocess.check_call([
            sys.executable, "-m", "pip", "install", "-q",
            "torch", "torchvision", 
            "--index-url", "https://download.pytorch.org/whl/cu118"
        ])
    
    print("  [OK] All dependencies installed")

def extract_and_combine_coco():
    """Extract all zip files and combine COCO data"""
    print("\n" + "=" * 60)
    print("[2/5] Extracting and combining COCO data...")
    print("=" * 60)
    
    # Clean temp directory
    if TEMP_DIR.exists():
        shutil.rmtree(TEMP_DIR)
    TEMP_DIR.mkdir(parents=True, exist_ok=True)
    
    # Find all zip files
    zip_files = list(DATASET_SOURCE.glob("*.zip"))
    print(f"\n  Found {len(zip_files)} project archives")
    
    # Combined COCO data structure
    combined_coco = {
        "images": [],
        "annotations": [],
        "categories": [{"id": 0, "name": "Teeth"}]
    }
    
    next_image_id = 0
    next_annotation_id = 0
    total_images_copied = 0
    
    # Process each zip file
    for zip_idx, zip_path in enumerate(sorted(zip_files), 1):
        print(f"\n  [{zip_idx}/{len(zip_files)}] Processing {zip_path.name}...")
        
        # Extract to temp folder
        extract_dir = TEMP_DIR / f"project_{zip_idx}"
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extract_dir)
        
        # Load result.json
        result_json = extract_dir / "result.json"
        if not result_json.exists():
            print(f"    [WARNING] No result.json found in {zip_path.name}, skipping...")
            continue
        
        with open(result_json, 'r', encoding='utf-8') as f:
            coco_data = json.load(f)
        
        # Build image ID mapping (old -> new)
        image_id_map = {}
        
        # Process images
        images_dir = extract_dir / "images"
        if not images_dir.exists():
            print(f"    [WARNING] No images folder found in {zip_path.name}, skipping...")
            continue
        
        for img_data in coco_data['images']:
            old_id = img_data['id']
            new_id = next_image_id
            image_id_map[old_id] = new_id
            
            # Get actual filename from images directory
            original_filename = Path(img_data['file_name']).name
            
            # Find the actual image file (case-insensitive)
            actual_file = None
            for ext in ['jpg', 'jpeg', 'png', 'JPG', 'JPEG', 'PNG']:
                potential_file = images_dir / original_filename
                if potential_file.exists():
                    actual_file = potential_file
                    break
                # Try with different extension
                potential_file = images_dir / (Path(original_filename).stem + f'.{ext}')
                if potential_file.exists():
                    actual_file = potential_file
                    break
            
            if actual_file:
                # Create new filename with project prefix to avoid conflicts
                new_filename = f"proj{zip_idx:02d}_{actual_file.name}"
                
                combined_coco['images'].append({
                    "id": new_id,
                    "file_name": new_filename,
                    "width": img_data['width'],
                    "height": img_data['height']
                })
                
                next_image_id += 1
                total_images_copied += 1
            else:
                print(f"    [WARNING] Image not found: {original_filename}")
        
        # Process annotations
        annotations_added = 0
        for ann_data in coco_data['annotations']:
            if ann_data['image_id'] not in image_id_map:
                continue
            
            # Check if segmentation exists and is valid
            if 'segmentation' not in ann_data or not ann_data['segmentation']:
                continue
            
            combined_coco['annotations'].append({
                "id": next_annotation_id,
                "image_id": image_id_map[ann_data['image_id']],
                "category_id": 0,  # All are "Teeth"
                "segmentation": ann_data['segmentation'],
                "bbox": ann_data.get('bbox', [0, 0, 0, 0]),
                "area": ann_data.get('area', 0),
                "iscrowd": 0
            })
            
            next_annotation_id += 1
            annotations_added += 1
        
        print(f"    [OK] Added {len(image_id_map)} images, {annotations_added} annotations")
    
    print(f"\n  Combined dataset:")
    print(f"    - Total images: {len(combined_coco['images'])}")
    print(f"    - Total annotations: {len(combined_coco['annotations'])}")
    print(f"    - Average teeth per image: {len(combined_coco['annotations']) / len(combined_coco['images']):.1f}")
    
    return combined_coco

def convert_to_yolov8_seg(combined_coco):
    """Convert combined COCO data to YOLOv8 segmentation format"""
    print("\n" + "=" * 60)
    print("[3/5] Converting to YOLOv8 segmentation format...")
    print("=" * 60)
    
    # Create output directory structure
    if DATASET_OUTPUT.exists():
        shutil.rmtree(DATASET_OUTPUT)
    
    for split in ['train', 'valid']:
        (DATASET_OUTPUT / split / 'images').mkdir(parents=True, exist_ok=True)
        (DATASET_OUTPUT / split / 'labels').mkdir(parents=True, exist_ok=True)
    
    # Build image lookup
    image_lookup = {img['id']: img for img in combined_coco['images']}
    
    # Group annotations by image
    annotations_by_image = {}
    for ann in combined_coco['annotations']:
        img_id = ann['image_id']
        if img_id not in annotations_by_image:
            annotations_by_image[img_id] = []
        annotations_by_image[img_id].append(ann)
    
    # Split data (90% train, 10% valid)
    import random
    random.seed(42)
    image_ids = list(image_lookup.keys())
    random.shuffle(image_ids)
    
    split_idx = int(len(image_ids) * 0.9)
    train_ids = set(image_ids[:split_idx])
    valid_ids = set(image_ids[split_idx:])
    
    print(f"\n  Split: {len(train_ids)} train, {len(valid_ids)} valid")
    
    converted_count = 0
    skipped_count = 0
    
    for img_id, img_data in image_lookup.items():
        split = 'train' if img_id in train_ids else 'valid'
        
        # Find source image file in temp directories
        filename = img_data['file_name']
        src_img = None
        
        # Search in extracted directories
        for project_dir in TEMP_DIR.glob("project_*"):
            potential_src = project_dir / "images" / filename.replace(f"proj{project_dir.name.split('_')[1]}_", "")
            if potential_src.exists():
                src_img = potential_src
                break
            # Try direct filename
            for img_file in (project_dir / "images").glob("*"):
                if img_file.name in filename:
                    src_img = img_file
                    break
            if src_img:
                break
        
        if not src_img or not src_img.exists():
            print(f"  [WARNING] Source image not found: {filename}")
            skipped_count += 1
            continue
        
        # Copy image
        dst_img = DATASET_OUTPUT / split / 'images' / filename
        shutil.copy2(src_img, dst_img)
        
        # Create label file
        label_filename = Path(filename).stem + '.txt'
        label_path = DATASET_OUTPUT / split / 'labels' / label_filename
        
        img_width = img_data['width']
        img_height = img_data['height']
        
        with open(label_path, 'w') as f:
            if img_id in annotations_by_image:
                for ann in annotations_by_image[img_id]:
                    # Get segmentation polygon
                    segmentation = ann['segmentation'][0]
                    
                    # Normalize coordinates to [0, 1]
                    normalized_coords = []
                    for i in range(0, len(segmentation), 2):
                        x = segmentation[i] / img_width
                        y = segmentation[i + 1] / img_height
                        # Clamp to [0, 1]
                        x = max(0.0, min(1.0, x))
                        y = max(0.0, min(1.0, y))
                        normalized_coords.extend([x, y])
                    
                    # Write: class_id x1 y1 x2 y2 x3 y3 ...
                    line = "0 " + " ".join(f"{coord:.6f}" for coord in normalized_coords)
                    f.write(line + "\n")
        
        converted_count += 1
        if converted_count % 50 == 0:
            print(f"    Processed {converted_count}/{len(image_lookup)} images...")
    
    # Create data.yaml
    data_yaml = DATASET_OUTPUT / 'data.yaml'
    with open(data_yaml, 'w') as f:
        f.write(f"path: {DATASET_OUTPUT.absolute()}\n")
        f.write(f"train: train/images\n")
        f.write(f"val: valid/images\n")
        f.write(f"\n")
        f.write(f"nc: 1\n")
        f.write(f"names:\n")
        f.write(f"  - Teeth\n")
    
    print(f"\n  [OK] Conversion complete!")
    print(f"    - Converted: {converted_count} images")
    print(f"    - Skipped: {skipped_count} images")
    print(f"    - Output: {DATASET_OUTPUT}")
    
    # Clean up temp directory
    if TEMP_DIR.exists():
        shutil.rmtree(TEMP_DIR)
    
    return data_yaml

def train_model(data_yaml):
    """Train YOLOv8-seg model on GPU"""
    print("\n" + "=" * 60)
    print("[4/5] Training YOLOv8-seg model...")
    print("=" * 60)
    
    from ultralytics import YOLO
    import torch
    
    # Check GPU
    if torch.cuda.is_available():
        gpu_name = torch.cuda.get_device_name(0)
        gpu_mem = torch.cuda.get_device_properties(0).total_memory / 1e9
        print(f"\n  GPU: {gpu_name} ({gpu_mem:.1f} GB)")
        print(f"  CUDA Version: {torch.version.cuda}")
        device = 0
    else:
        print("\n  [WARNING] No GPU detected! Training will be VERY slow.")
        print("  Please ensure CUDA is properly installed.")
        device = 'cpu'
    
    print(f"\n  Model: yolov8{MODEL_SIZE}-seg.pt")
    print(f"  Epochs: {EPOCHS}")
    print(f"  Batch size: {BATCH_SIZE}")
    print(f"  Image size: {IMAGE_SIZE}x{IMAGE_SIZE}")
    print(f"  Device: {device}")
    print()
    
    # Load model
    model = YOLO(f"yolov8{MODEL_SIZE}-seg.pt")
    
    # Train
    results = model.train(
        data=str(data_yaml),
        epochs=EPOCHS,
        batch=BATCH_SIZE,
        imgsz=IMAGE_SIZE,
        project=PROJECT_NAME,
        name=EXPERIMENT_NAME,
        exist_ok=True,
        
        # Hardware optimization
        device=device,
        workers=8,
        amp=True if torch.cuda.is_available() else False,
        
        # Data augmentation
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
        cache=False,  # Disabled for 640x640 (too much RAM)
        
        # Early stopping
        patience=15,
    )
    
    print("\n  [OK] Training complete!")
    return results

def export_to_onnx():
    """Export trained model to ONNX"""
    print("\n" + "=" * 60)
    print("[5/5] Exporting to ONNX...")
    print("=" * 60)
    
    from ultralytics import YOLO
    
    # Find best weights
    best_weights = Path(PROJECT_NAME) / EXPERIMENT_NAME / "weights" / "best.pt"
    
    if not best_weights.exists():
        print(f"  [ERROR] Best weights not found at {best_weights}")
        sys.exit(1)
    
    print(f"\n  Loading: {best_weights}")
    model = YOLO(str(best_weights))
    
    # Export
    print(f"  Exporting to ONNX...")
    onnx_path = model.export(
        format="onnx",
        imgsz=IMAGE_SIZE,
        simplify=True,
        opset=12,
        dynamic=False,
    )
    
    # Copy to public folder
    OUTPUT_ONNX_PATH.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(onnx_path, OUTPUT_ONNX_PATH)
    
    onnx_size = OUTPUT_ONNX_PATH.stat().st_size / 1e6
    print(f"\n  [OK] Exported: {OUTPUT_ONNX_PATH} ({onnx_size:.1f} MB)")
    
    return OUTPUT_ONNX_PATH

def print_summary():
    """Print training summary"""
    print("\n" + "=" * 60)
    print("TRAINING COMPLETE!")
    print("=" * 60)
    
    results_dir = Path(PROJECT_NAME) / EXPERIMENT_NAME
    
    print("\nTraining artifacts:")
    print(f"  - Best weights: {results_dir / 'weights' / 'best.pt'}")
    print(f"  - Results plot: {results_dir / 'results.png'}")
    print(f"  - ONNX model:   {OUTPUT_ONNX_PATH}")
    
    print("\nCheck training results:")
    print(f"  - Open: {results_dir / 'results.png'}")
    
    print("\nNext steps:")
    print("  1. Review training curves in results.png")
    print("  2. Test the model in browser at /analysis/")
    print("  3. Model is ready for deployment!")
    print()

def main():
    try:
        print("=" * 60)
        print("BEAME TEETH SEGMENTATION TRAINING")
        print("Full Pipeline: Extract -> Combine -> Convert -> Train")
        print("=" * 60)
        
        install_dependencies()
        combined_coco = extract_and_combine_coco()
        data_yaml = convert_to_yolov8_seg(combined_coco)
        train_model(data_yaml)
        export_to_onnx()
        print_summary()
        
    except KeyboardInterrupt:
        print("\n\n[WARNING] Training interrupted by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n[ERROR] {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
