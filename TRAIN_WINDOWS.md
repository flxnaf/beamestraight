# 🦷 Beame Teeth OBB Model Training on Windows (RTX 3070 Ti)

Complete guide for training your **YOLOv8-OBB** tooth detection model with oriented bounding boxes.

> **New in this version:** Uses Oriented Bounding Boxes (OBB) for accurate rotated tooth detection + automatic tooth numbering based on position!

---

## 📋 Prerequisites

### 1. Install Python 3.10 or 3.11
Download from: https://www.python.org/downloads/

**During installation:**
- ✅ Check "Add Python to PATH"
- ✅ Check "Install pip"

Verify installation:
```powershell
python --version
pip --version
```

### 2. Install NVIDIA CUDA Toolkit (for GPU acceleration)

Your RTX 3070 Ti requires CUDA for fast training.

**Download CUDA 11.8:**
https://developer.nvidia.com/cuda-11-8-0-download-archive

**Download cuDNN 8.6:**
https://developer.nvidia.com/rdp/cudnn-download
- Extract and copy files to CUDA installation folder
- Default: `C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v11.8`

**Verify CUDA:**
```powershell
nvidia-smi
```
Should show your GPU and CUDA version.

---

## 🚀 Training Instructions

### Step 1: Open PowerShell or Command Prompt

Right-click on your project folder and select:
- "Open in Terminal" (Windows 11), or
- "Open PowerShell window here", or
- Open CMD and navigate: `cd "path\to\beamestraight"`

### Step 2: Create Python Virtual Environment (Recommended)

```powershell
# Create virtual environment
python -m venv venv

# Activate it
.\venv\Scripts\activate
```

You should see `(venv)` in your terminal prompt.

### Step 3: Inspect Your Training Data (Optional)

```powershell
# Run the inspector to verify Label Studio exports
.\scripts\inspect_training_data.ps1
```

This will show you the format of your annotations.

### Step 4: Convert Label Studio Data to YOLO OBB Format

```powershell
# Install OpenCV for polygon processing
pip install opencv-python numpy pyyaml

# Run the conversion script
python scripts/convert_labelstudio_to_yolo_obb.py
```

This will:
1. ✅ Extract all zip files from `Training Data/`
2. ✅ Parse Label Studio polygon annotations
3. ✅ Convert polygons to oriented bounding boxes (OBB)
4. ✅ Create `datasets/teeth-obb/` with train/val split
5. ✅ Generate `data.yaml` for training

### Step 5: Run OBB Training Script

```powershell
python train_teeth_obb.py
```

**That's it!** The script will:
1. ✅ Install all dependencies (ultralytics, onnx, torch with CUDA)
2. ✅ Load the converted dataset
3. ✅ Train YOLOv8-OBB model on your RTX 3070 Ti
4. ✅ Export to ONNX format
5. ✅ Copy model to `public/models/teeth-detection-obb.onnx`

---

## ⏱️ Training Time

**RTX 3070 Ti (8GB VRAM) - 100 epochs:**
- Estimated time: **45-60 minutes**
- Batch size: 8 images (conservative for 8GB VRAM)
- Uses mixed precision (AMP) for speed

**Progress indicators:**
- You'll see epoch progress: `Epoch 1/100`, `Epoch 2/100`, etc.
- mAP metrics show accuracy improvement
- Training graphs saved in `runs/obb/teeth_detection_3070ti/`

---

## 📊 Monitor Training

### Real-time GPU Usage
Open another terminal and run:
```powershell
nvidia-smi -l 1
```
Shows GPU usage, memory, temperature every 1 second.

### Training Graphs
After training completes, check:
```
runs/obb/teeth_detection_3070ti/results.png
```
Shows loss curves, mAP, precision, recall over epochs.

---

## ✅ After Training

### 1. Verify Model Created
Check that this file exists:
```
public/models/teeth-detection-obb.onnx
```

### 2. Enable OBB Detection in App
Edit `analysis/main.ts`:
```typescript
const ENABLE_TOOTH_DETECTION = true;   // Enable detection
const SHOW_TOOTH_OVERLAY = true;       // Show beautiful overlay
const USE_OBB_MODEL = true;            // Use new OBB model
```

### 3. Update Model Path
```typescript
const ONNX_MODEL_PATH = '/models/teeth-detection-obb.onnx';
```

### 4. Test Locally
```powershell
# Install Node dependencies (if not done)
npm install

# Build and run dev server
npm run dev
```

Open browser to `http://localhost:3000/analysis/` and test!

---

## 🐛 Troubleshooting

### Error: "CUDA out of memory"
**Solution:** Reduce batch size:
```powershell
python train_teeth_obb.py --batch 4
```

### Error: "No CUDA devices available"
**Cause:** PyTorch not detecting GPU

**Solution:** Install PyTorch with CUDA:
```powershell
pip uninstall torch torchvision
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
```

### Error: Python not found
**Solution:** Make sure Python is in PATH. Restart terminal or use full path:
```powershell
C:\Users\YourName\AppData\Local\Programs\Python\Python311\python.exe train_teeth_obb.py
```

### Error: "No images found in dataset"
**Solution:** Run the conversion script first:
```powershell
python scripts/convert_labelstudio_to_yolo_obb.py
```

### Training is slow (CPU instead of GPU)
**Check CUDA is working:**
```powershell
python -c "import torch; print(torch.cuda.is_available())"
```
Should print `True`. If `False`, reinstall PyTorch with CUDA support.

---

## 🎯 Training Tips

### For Better Accuracy:
1. **More epochs:** `python train_teeth_obb.py --epochs 150`
2. **Larger model:** `python train_teeth_obb.py --size s` (small model)
3. **More data:** Add more annotated images to Label Studio

### For Faster Training (Testing):
1. **Fewer epochs:** `python train_teeth_obb.py --epochs 25`
2. **Quick test:** `python train_teeth_obb.py --epochs 10 --batch 4`

### Model Size vs Accuracy (OBB):
- `yolov8n-obb.pt` - Nano (fastest, ~7MB, good for browser) ✅ **Recommended**
- `yolov8s-obb.pt` - Small (better accuracy, ~25MB)
- `yolov8m-obb.pt` - Medium (high accuracy, ~55MB, too large for browser)

---

## 📦 What Gets Created

```
beamestraight/
├── scripts/
│   ├── inspect_training_data.ps1      ← Data inspector
│   └── convert_labelstudio_to_yolo_obb.py  ← Converter
├── train_teeth_obb.py                 ← Training script
├── Training Data/                     ← Your Label Studio exports
│   └── project-*.zip
├── datasets/
│   └── teeth-obb/                     ← Converted dataset
│       ├── train/images/
│       ├── train/labels/
│       ├── val/images/
│       ├── val/labels/
│       └── data.yaml
├── runs/
│   └── obb/
│       └── teeth_detection_3070ti/
│           ├── weights/
│           │   ├── best.pt            ← Best model (PyTorch)
│           │   └── last.pt            ← Last epoch
│           ├── results.png            ← Training graphs
│           └── results.csv            ← Metrics
├── analysis/
│   └── services/
│       ├── onnxInferenceOBB.ts        ← OBB inference service
│       └── teethOverlay.ts            ← Beautiful overlay renderer
└── public/
    └── models/
        └── teeth-detection-obb.onnx   ← Final model for app ✅
```

---

## 💡 Quick Commands Cheatsheet

```powershell
# Create virtual environment
python -m venv venv
.\venv\Scripts\activate

# Step 1: Convert Label Studio data
python scripts/convert_labelstudio_to_yolo_obb.py

# Step 2: Train OBB model (100 epochs, production quality)
python train_teeth_obb.py

# Or quick test (25 epochs)
python train_teeth_obb.py --epochs 25

# Watch GPU usage
nvidia-smi -l 1

# Test the model in browser
npm run dev
```

---

## 🚀 Ready to Train!

**Full pipeline:**
```powershell
# 1. Convert your Label Studio data
python scripts/convert_labelstudio_to_yolo_obb.py

# 2. Train the model
python train_teeth_obb.py
```

Grab a coffee ☕ - training takes ~45-60 minutes on RTX 3070 Ti!

---

## 🎨 The Overlay System

After training, your app will show a beautiful overlay with:

1. **White highlight** - Semi-transparent white fill over each detected tooth
2. **Glowing border** - Soft white glow around tooth edges
3. **Numbered badges** - Green circular badges with FDI tooth numbers (11-48)
4. **Stats panel** - "X teeth identified" with Beame branding

The tooth numbering is assigned automatically based on position:
- **Upper right quadrant:** 11-18 (center to back)
- **Upper left quadrant:** 21-28 (center to back)
- **Lower left quadrant:** 31-38 (center to back)
- **Lower right quadrant:** 41-48 (center to back)

---

## 📞 Need Help?

- Check training logs in `runs/obb/teeth_detection_3070ti/`
- Read Ultralytics OBB docs: https://docs.ultralytics.com/tasks/obb/
- Label Studio export guide: https://labelstud.io/guide/export.html
