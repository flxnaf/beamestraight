"""
Convert COCO JSON (from Label Studio) to YOLOv8 Segmentation Format

Usage:
    python convert_coco_to_yolov8seg.py

This will:
1. Read your COCO JSON export from Label Studio
2. Convert polygon annotations to YOLOv8-seg format
3. Create the proper directory structure for training
"""

import json
import os
from pathlib import Path
import shutil
from PIL import Image

# CONFIGURATION - Update these paths when you get your COCO files
COCO_JSON_PATH = "path/to/your/labelstudio_export.json"  # TODO: Update this
IMAGES_DIR = "path/to/your/images"  # TODO: Update this
OUTPUT_DIR = "teeth-seg"  # Output directory for YOLOv8-seg format

def convert_coco_to_yolov8seg(coco_json_path, images_dir, output_dir):
    """
    Convert COCO format with segmentation polygons to YOLOv8-seg format
    """
    print("=" * 60)
    print("🔄 CONVERTING COCO → YOLOv8-seg FORMAT")
    print("=" * 60)
    
    # Load COCO JSON
    print(f"\n📖 Reading COCO JSON: {coco_json_path}")
    with open(coco_json_path, 'r') as f:
        coco_data = json.load(f)
    
    # Create output directories
    output_path = Path(output_dir)
    for split in ['train', 'valid', 'test']:
        (output_path / split / 'images').mkdir(parents=True, exist_ok=True)
        (output_path / split / 'labels').mkdir(parents=True, exist_ok=True)
    
    # Build category mapping
    categories = {cat['id']: idx for idx, cat in enumerate(coco_data['categories'])}
    category_names = {cat['id']: cat['name'] for cat in coco_data['categories']}
    
    print(f"\n📊 Found {len(categories)} categories:")
    for cat_id, name in category_names.items():
        print(f"   - {name} (ID: {cat_id} → YOLO class: {categories[cat_id]})")
    
    # Build image ID to filename mapping
    image_info = {img['id']: img for img in coco_data['images']}
    
    # Group annotations by image
    annotations_by_image = {}
    for ann in coco_data['annotations']:
        img_id = ann['image_id']
        if img_id not in annotations_by_image:
            annotations_by_image[img_id] = []
        annotations_by_image[img_id].append(ann)
    
    print(f"\n📝 Processing {len(image_info)} images...")
    
    # Process each image
    converted_count = 0
    skipped_count = 0
    
    for img_id, img_data in image_info.items():
        filename = img_data['file_name']
        img_width = img_data['width']
        img_height = img_data['height']
        
        # Determine split (train/valid/test) - you can customize this logic
        # For now, we'll put 80% train, 10% valid, 10% test
        if converted_count % 10 < 8:
            split = 'train'
        elif converted_count % 10 == 8:
            split = 'valid'
        else:
            split = 'test'
        
        # Copy image file
        src_img_path = Path(images_dir) / filename
        if not src_img_path.exists():
            print(f"⚠️  Warning: Image not found: {src_img_path}")
            skipped_count += 1
            continue
        
        dst_img_path = output_path / split / 'images' / filename
        shutil.copy2(src_img_path, dst_img_path)
        
        # Convert annotations to YOLOv8-seg format
        label_filename = Path(filename).stem + '.txt'
        label_path = output_path / split / 'labels' / label_filename
        
        with open(label_path, 'w') as f:
            if img_id in annotations_by_image:
                for ann in annotations_by_image[img_id]:
                    # Get class ID
                    class_id = categories[ann['category_id']]
                    
                    # Get segmentation polygon
                    if 'segmentation' not in ann or not ann['segmentation']:
                        print(f"⚠️  Warning: No segmentation for annotation in {filename}")
                        continue
                    
                    # COCO segmentation format: [[x1, y1, x2, y2, ...]]
                    segmentation = ann['segmentation'][0]  # Get first polygon
                    
                    # Normalize coordinates to [0, 1]
                    normalized_coords = []
                    for i in range(0, len(segmentation), 2):
                        x = segmentation[i] / img_width
                        y = segmentation[i + 1] / img_height
                        normalized_coords.extend([x, y])
                    
                    # Write to file: class x1 y1 x2 y2 x3 y3 ...
                    line = f"{class_id} " + " ".join(map(str, normalized_coords))
                    f.write(line + "\n")
        
        converted_count += 1
        if converted_count % 100 == 0:
            print(f"   Processed {converted_count} images...")
    
    # Create data.yaml
    data_yaml_path = output_path / 'data.yaml'
    with open(data_yaml_path, 'w') as f:
        f.write(f"path: {output_path.absolute()}\n")
        f.write(f"train: train/images\n")
        f.write(f"val: valid/images\n")
        f.write(f"test: test/images\n")
        f.write(f"\n")
        f.write(f"nc: {len(categories)}\n")
        f.write(f"names:\n")
        for cat_id in sorted(categories.keys()):
            name = category_names[cat_id]
            f.write(f"  - {name}\n")
    
    print(f"\n✅ Conversion complete!")
    print(f"   - Converted: {converted_count} images")
    print(f"   - Skipped: {skipped_count} images")
    print(f"   - Output directory: {output_path.absolute()}")
    print(f"   - data.yaml: {data_yaml_path}")
    print()
    print("=" * 60)
    print("🚀 NEXT STEP: Train YOLOv8-seg model")
    print("=" * 60)
    print(f"python train_teeth_segmentation_fast.py")
    print()

if __name__ == "__main__":
    # Check if paths are configured
    if "path/to/" in COCO_JSON_PATH or "path/to/" in IMAGES_DIR:
        print("=" * 60)
        print("⚠️  CONFIGURATION REQUIRED")
        print("=" * 60)
        print()
        print("Please update these variables at the top of this script:")
        print(f"  1. COCO_JSON_PATH = '{COCO_JSON_PATH}'")
        print(f"  2. IMAGES_DIR = '{IMAGES_DIR}'")
        print()
        print("Then run: python convert_coco_to_yolov8seg.py")
        print()
        exit(1)
    
    # Run conversion
    convert_coco_to_yolov8seg(COCO_JSON_PATH, IMAGES_DIR, OUTPUT_DIR)
