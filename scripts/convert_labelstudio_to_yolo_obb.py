"""
Beame Training Data Converter
Converts Label Studio polygon annotations to YOLO OBB format

Label Studio polygon format:
{
    "value": {
        "points": [[x1,y1], [x2,y2], [x3,y3], [x4,y4], ...],
        "polygonlabels": ["teeth"]
    }
}

YOLO OBB format (normalized 0-1):
class_id x1 y1 x2 y2 x3 y3 x4 y4

For polygons with more than 4 points, we compute the minimum bounding rotated rectangle.
"""

import os
import json
import zipfile
import shutil
import numpy as np
from pathlib import Path
from typing import List, Tuple, Dict
import cv2
import yaml

# Configuration
TRAINING_DATA_DIR = Path(__file__).parent.parent / "Training Data"
OUTPUT_DIR = Path(__file__).parent.parent / "datasets" / "teeth-obb"
CLASS_NAMES = ["teeth"]  # Single class since all teeth labeled as "teeth"


def extract_all_zips(data_dir: Path, output_dir: Path) -> Path:
    """Extract all zip files to a temporary directory"""
    extract_dir = output_dir / "raw_extracted"
    extract_dir.mkdir(parents=True, exist_ok=True)
    
    zip_files = list(data_dir.glob("*.zip"))
    print(f"Found {len(zip_files)} zip files to process")
    
    for i, zip_path in enumerate(zip_files):
        print(f"  [{i+1}/{len(zip_files)}] Extracting {zip_path.name}...")
        project_dir = extract_dir / zip_path.stem
        project_dir.mkdir(exist_ok=True)
        
        with zipfile.ZipFile(zip_path, 'r') as zf:
            zf.extractall(project_dir)
    
    return extract_dir


def find_labelstudio_json(extract_dir: Path) -> List[Path]:
    """Find all Label Studio JSON export files"""
    json_files = []
    
    for json_path in extract_dir.rglob("*.json"):
        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            # Check if it's Label Studio format (array with annotations)
            if isinstance(data, list) and len(data) > 0:
                if 'annotations' in data[0] or 'data' in data[0]:
                    json_files.append(json_path)
                    print(f"  Found Label Studio export: {json_path.name}")
        except:
            pass
    
    return json_files


def polygon_to_obb(points: List[List[float]], img_width: int, img_height: int) -> List[float]:
    """
    Convert polygon points to oriented bounding box (4 corners).
    Uses OpenCV's minAreaRect for accurate rotated rectangle fitting.
    
    Args:
        points: List of [x, y] points (in percentage 0-100 from Label Studio)
        img_width: Image width in pixels
        img_height: Image height in pixels
    
    Returns:
        List of 8 normalized coordinates [x1,y1,x2,y2,x3,y3,x4,y4]
    """
    # Convert percentage to pixel coordinates
    pixel_points = np.array([
        [p[0] * img_width / 100, p[1] * img_height / 100] 
        for p in points
    ], dtype=np.float32)
    
    # Get minimum area rotated rectangle
    rect = cv2.minAreaRect(pixel_points)
    box = cv2.boxPoints(rect)  # Returns 4 corner points
    
    # Normalize to 0-1 range
    normalized = []
    for corner in box:
        normalized.extend([
            corner[0] / img_width,
            corner[1] / img_height
        ])
    
    return normalized


def convert_labelstudio_to_yolo_obb(json_path: Path, output_dir: Path, images_dir: Path) -> Tuple[int, int]:
    """
    Convert a Label Studio JSON export to YOLO OBB format.
    
    Returns:
        Tuple of (images_processed, annotations_count)
    """
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    images_processed = 0
    total_annotations = 0
    
    labels_dir = output_dir / "labels"
    images_out_dir = output_dir / "images"
    labels_dir.mkdir(parents=True, exist_ok=True)
    images_out_dir.mkdir(parents=True, exist_ok=True)
    
    for item in data:
        # Get image info
        if 'data' not in item:
            continue
            
        # Handle different image path formats from Label Studio
        img_data = item['data']
        img_path_key = next((k for k in img_data.keys() if 'image' in k.lower()), None)
        
        if not img_path_key:
            continue
            
        img_ref = img_data[img_path_key]
        
        # Extract filename from various formats
        if img_ref.startswith('/data/'):
            img_filename = img_ref.split('/')[-1]
        elif img_ref.startswith('http'):
            img_filename = img_ref.split('/')[-1].split('?')[0]
        else:
            img_filename = Path(img_ref).name
        
        # URL decode the filename
        import urllib.parse
        img_filename = urllib.parse.unquote(img_filename)
        
        # Find the actual image file
        img_source = None
        for search_dir in [images_dir, json_path.parent, json_path.parent / "images"]:
            potential_path = search_dir / img_filename
            if potential_path.exists():
                img_source = potential_path
                break
            # Also try without extension matching
            for ext in ['.jpg', '.jpeg', '.png', '.webp']:
                potential_path = search_dir / (Path(img_filename).stem + ext)
                if potential_path.exists():
                    img_source = potential_path
                    break
        
        if not img_source:
            # Search recursively
            for found in json_path.parent.rglob(f"*{Path(img_filename).stem}*"):
                if found.suffix.lower() in ['.jpg', '.jpeg', '.png', '.webp']:
                    img_source = found
                    break
        
        if not img_source or not img_source.exists():
            print(f"    Warning: Image not found: {img_filename}")
            continue
        
        # Read image to get dimensions
        img = cv2.imread(str(img_source))
        if img is None:
            print(f"    Warning: Could not read image: {img_source}")
            continue
            
        img_height, img_width = img.shape[:2]
        
        # Process annotations
        annotations = item.get('annotations', [])
        if not annotations:
            continue
        
        yolo_lines = []
        
        for annotation in annotations:
            results = annotation.get('result', [])
            
            for result in results:
                if result.get('type') != 'polygonlabels':
                    continue
                
                value = result.get('value', {})
                points = value.get('points', [])
                labels = value.get('polygonlabels', [])
                
                if not points or len(points) < 3:
                    continue
                
                # Get class ID (0 for "teeth" since single class)
                class_id = 0
                
                # Convert polygon to OBB
                try:
                    obb_coords = polygon_to_obb(points, img_width, img_height)
                    
                    # Validate coordinates are in range
                    if all(0 <= c <= 1 for c in obb_coords):
                        # Format: class_id x1 y1 x2 y2 x3 y3 x4 y4
                        coords_str = ' '.join(f'{c:.6f}' for c in obb_coords)
                        yolo_lines.append(f"{class_id} {coords_str}")
                        total_annotations += 1
                except Exception as e:
                    print(f"    Warning: Failed to convert polygon: {e}")
                    continue
        
        if yolo_lines:
            # Copy image to output
            output_img_name = f"{images_processed:04d}_{img_source.stem}{img_source.suffix}"
            output_img_path = images_out_dir / output_img_name
            shutil.copy2(img_source, output_img_path)
            
            # Write label file
            label_path = labels_dir / f"{output_img_name.rsplit('.', 1)[0]}.txt"
            with open(label_path, 'w') as f:
                f.write('\n'.join(yolo_lines))
            
            images_processed += 1
    
    return images_processed, total_annotations


def create_dataset_yaml(output_dir: Path, train_ratio: float = 0.8):
    """Create YOLO dataset configuration file and split data"""
    images_dir = output_dir / "images"
    labels_dir = output_dir / "labels"
    
    # Get all images
    all_images = list(images_dir.glob("*.*"))
    all_images = [p for p in all_images if p.suffix.lower() in ['.jpg', '.jpeg', '.png', '.webp']]
    
    if not all_images:
        print("ERROR: No images found in dataset!")
        return
    
    # Shuffle and split
    np.random.seed(42)
    np.random.shuffle(all_images)
    
    split_idx = int(len(all_images) * train_ratio)
    train_images = all_images[:split_idx]
    val_images = all_images[split_idx:]
    
    # Create train/val directories
    for split, images in [("train", train_images), ("val", val_images)]:
        split_img_dir = output_dir / split / "images"
        split_lbl_dir = output_dir / split / "labels"
        split_img_dir.mkdir(parents=True, exist_ok=True)
        split_lbl_dir.mkdir(parents=True, exist_ok=True)
        
        for img_path in images:
            # Move image
            shutil.move(str(img_path), str(split_img_dir / img_path.name))
            
            # Move label
            label_name = img_path.stem + ".txt"
            label_path = labels_dir / label_name
            if label_path.exists():
                shutil.move(str(label_path), str(split_lbl_dir / label_name))
    
    # Clean up original directories
    if images_dir.exists() and not list(images_dir.glob("*")):
        images_dir.rmdir()
    if labels_dir.exists() and not list(labels_dir.glob("*")):
        labels_dir.rmdir()
    
    # Create data.yaml
    yaml_content = {
        'path': str(output_dir.absolute()),
        'train': 'train/images',
        'val': 'val/images',
        'names': {0: 'teeth'}
    }
    
    yaml_path = output_dir / "data.yaml"
    with open(yaml_path, 'w') as f:
        yaml.dump(yaml_content, f, default_flow_style=False)
    
    print(f"\nDataset split complete:")
    print(f"  Train: {len(train_images)} images")
    print(f"  Val: {len(val_images)} images")
    print(f"  Config: {yaml_path}")


def main():
    print("=" * 50)
    print("  Beame Label Studio to YOLO OBB Converter")
    print("=" * 50)
    print()
    
    # Check if training data exists
    if not TRAINING_DATA_DIR.exists():
        print(f"ERROR: Training data directory not found: {TRAINING_DATA_DIR}")
        return
    
    # Clean output directory
    if OUTPUT_DIR.exists():
        print(f"Cleaning existing output directory...")
        shutil.rmtree(OUTPUT_DIR)
    OUTPUT_DIR.mkdir(parents=True)
    
    # Step 1: Extract all zips
    print("\n[Step 1/4] Extracting zip files...")
    extract_dir = extract_all_zips(TRAINING_DATA_DIR, OUTPUT_DIR)
    
    # Step 2: Find Label Studio JSON files
    print("\n[Step 2/4] Finding Label Studio exports...")
    json_files = find_labelstudio_json(extract_dir)
    
    if not json_files:
        print("ERROR: No Label Studio JSON exports found!")
        print("Make sure your zip files contain Label Studio JSON exports.")
        return
    
    # Step 3: Convert each JSON file
    print("\n[Step 3/4] Converting annotations to YOLO OBB format...")
    total_images = 0
    total_annots = 0
    
    for json_path in json_files:
        print(f"\nProcessing: {json_path.name}")
        images_dir = json_path.parent / "images"
        
        images, annots = convert_labelstudio_to_yolo_obb(json_path, OUTPUT_DIR, images_dir)
        total_images += images
        total_annots += annots
        print(f"  Converted {images} images with {annots} teeth annotations")
    
    print(f"\n[Step 3/4] Conversion complete!")
    print(f"  Total images: {total_images}")
    print(f"  Total teeth annotations: {total_annots}")
    
    # Step 4: Create dataset yaml and split
    print("\n[Step 4/4] Creating dataset configuration...")
    create_dataset_yaml(OUTPUT_DIR)
    
    # Cleanup extracted files
    print("\nCleaning up temporary files...")
    raw_dir = OUTPUT_DIR / "raw_extracted"
    if raw_dir.exists():
        shutil.rmtree(raw_dir)
    
    print("\n" + "=" * 50)
    print("  Conversion Complete!")
    print("=" * 50)
    print(f"\nDataset ready at: {OUTPUT_DIR}")
    print("\nNext step: Run training with:")
    print("  python train_teeth_obb.py")


if __name__ == "__main__":
    main()
