# 🦷 Real-Time Teeth Segmentation Setup Guide

This guide will help you train a YOLOv8 segmentation model for **pixel-perfect teeth overlays** like Smileset.

---

## 📋 Prerequisites

You need **polygon annotations** from Label Studio (not bounding boxes).

✅ **Correct:** Polygon/Brush tool annotations  
❌ **Wrong:** Rectangle tool annotations

---

## 🚀 Step-by-Step Process

### **Step 1: Export from Label Studio as COCO**

1. Go to your Label Studio project
2. Click **Export**
3. Select **COCO** format (NOT YOLO!)
4. Download the JSON file
5. You should get:
   - `result.json` (or similar) - contains annotations
   - Images folder (if not already in project)

---

### **Step 2: Convert COCO to YOLOv8-seg Format**

Update paths in `convert_coco_to_yolov8seg.py`:

```python
COCO_JSON_PATH = "path/to/result.json"  # Your COCO export
IMAGES_DIR = "path/to/images"           # Your images folder
OUTPUT_DIR = "teeth-seg"                # Output directory (don't change)
```

Then run:

```bash
python convert_coco_to_yolov8seg.py
```

This will create:
```
teeth-seg/
  ├── data.yaml
  ├── train/
  │   ├── images/
  │   └── labels/  # Polygon coordinates in YOLOv8-seg format
  ├── valid/
  │   ├── images/
  │   └── labels/
  └── test/
      ├── images/
      └── labels/
```

---

### **Step 3: Train YOLOv8-seg at 320x320**

```bash
python train_teeth_segmentation_fast.py
```

This will:
- Train YOLOv8n-seg model
- Input size: 320x320 (for fast inference ~50-80ms)
- Export to ONNX for browser deployment
- Save model to: `public/models/teeth-detection-seg-fast.onnx`

**Expected training time:** ~2-4 hours on RTX 3080 Ti

---

### **Step 4: Update Frontend Code**

Update `analysis/main.ts`:

```typescript
const ONNX_MODEL_PATH = '/models/teeth-detection-seg-fast.onnx';
```

Update `analysis/services/onnxInference.ts` to handle segmentation masks instead of bounding boxes.

---

## 🎯 Expected Performance

| Metric | Value |
|--------|-------|
| **Model** | YOLOv8n-seg |
| **Input Size** | 320x320 |
| **Browser Inference** | 50-80ms |
| **FPS** | 12-20 fps |
| **Accuracy** | Pixel-perfect tooth masks |

---

## 🔧 Troubleshooting

### "No segmentation for annotation"

Your Label Studio annotations were made with **Rectangle tool**, not **Polygon tool**.  
→ Re-annotate using the Polygon or Brush tool.

### "Dataset not found"

Run `convert_coco_to_yolov8seg.py` first to create the `teeth-seg/` directory.

### Inference too slow

Try:
- Reduce input size to 256x256 (less accurate but faster)
- Use YOLOv5n-seg instead (generally faster in browser)
- Enable WebGPU execution provider

---

## 📊 What You'll Get

**Before (Bounding Boxes):**
```
┌─────────────┐
│  ┌────┐     │  Rectangles around teeth
│  │    │┌───┐│  Not accurate to tooth shape
│  └────┘│   ││
│        └───┘│
└─────────────┘
```

**After (Segmentation Masks):**
```
┌─────────────┐
│   ╭───╮     │  Pixel-perfect tooth shapes
│  ╱     ╲╭──╮│  Adapts to mouth opening
│ │       │  ││  Tracks angle changes
│  ╲     ╱╰──╯│
└─────────────┘
```

---

## 📞 Support

If you get stuck, check:
1. Label Studio used **Polygon/Brush tool** (not Rectangle)
2. COCO export includes `"segmentation"` field in JSON
3. Converter script ran successfully
4. `teeth-seg/data.yaml` exists

---

## 🎉 Once Trained

Your teeth overlay will:
- ✅ Map precisely to individual teeth
- ✅ Change shape with mouth opening
- ✅ Adapt to angle changes
- ✅ Track smoothly at ~15fps
- ✅ Look as good as Smileset!

**Time to completion:** ~3-5 hours (including annotation check + training)
