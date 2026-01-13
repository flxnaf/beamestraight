# 🦷 Beame Teeth Model Training on Windows (RTX 3080 Ti)

Complete guide for training your tooth detection model on Windows with NVIDIA GPU.

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

Your RTX 3080 Ti requires CUDA for fast training.

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
- Open CMD and navigate: `cd "path\to\Beame Teeth Straightener"`

### Step 2: Create Python Virtual Environment (Recommended)

```powershell
# Create virtual environment
python -m venv venv

# Activate it
.\venv\Scripts\activate
```

You should see `(venv)` in your terminal prompt.

### Step 3: Run Training Script

```powershell
python train_teeth_model.py
```

**That's it!** The script will:
1. ✅ Install all dependencies (roboflow, ultralytics, onnx)
2. ✅ Download the teeth dataset from Roboflow
3. ✅ Train YOLOv8 model on your RTX 3080 Ti
4. ✅ Export to ONNX format
5. ✅ Copy model to `public/models/teeth-detection.onnx`

---

## ⏱️ Training Time

**RTX 3080 Ti (12GB VRAM) - 100 epochs:**
- Estimated time: **30-45 minutes**
- Batch size: 16 images
- Uses mixed precision (AMP) for speed

**Progress indicators:**
- You'll see epoch progress: `Epoch 1/100`, `Epoch 2/100`, etc.
- mAP metrics show accuracy improvement
- Training graphs saved in `runs/detect/teeth_detection_3080ti/`

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
runs/detect/teeth_detection_3080ti/results.png
```
Shows loss curves, mAP, precision, recall over epochs.

---

## ✅ After Training

### 1. Verify Model Created
Check that this file exists:
```
public/models/teeth-detection.onnx
```

### 2. Enable Detection in App
Edit `analysis/main.ts`:
```typescript
const ENABLE_TOOTH_DETECTION = true;  // Change to true
```

### 3. Test Locally
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
**Solution:** Reduce batch size in `train_teeth_model.py`:
```python
batch=8,  # Change from 16 to 8
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
C:\Users\YourName\AppData\Local\Programs\Python\Python311\python.exe train_teeth_model.py
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
1. **More epochs:** Change `epochs=100` to `epochs=150` or `200`
2. **Larger model:** Change `YOLO('yolov8n.pt')` to `YOLO('yolov8s.pt')`
3. **More data:** Add more annotated images to Roboflow dataset

### For Faster Training (Testing):
1. **Fewer epochs:** Change `epochs=100` to `epochs=25`
2. **Smaller batch:** Change `batch=16` to `batch=8`

### Model Size vs Accuracy:
- `yolov8n.pt` - Nano (fastest, 6MB, good for browser) ✅ **Recommended**
- `yolov8s.pt` - Small (better accuracy, 22MB)
- `yolov8m.pt` - Medium (high accuracy, 52MB, too large for browser)

---

## 📦 What Gets Created

```
Beame Teeth Straightener/
├── train_teeth_model.py           ← Training script
├── teeth-2/                        ← Downloaded dataset
│   ├── train/
│   ├── valid/
│   └── data.yaml
├── runs/                           ← Training outputs
│   └── detect/
│       └── teeth_detection_3080ti/
│           ├── weights/
│           │   ├── best.pt        ← Best model (PyTorch)
│           │   └── last.pt        ← Last epoch
│           ├── results.png        ← Training graphs
│           └── results.csv        ← Metrics
└── public/
    └── models/
        └── teeth-detection.onnx   ← Final model for app ✅
```

---

## 💡 Quick Commands Cheatsheet

```powershell
# Create virtual environment
python -m venv venv
.\venv\Scripts\activate

# Run training (100 epochs, production quality)
python train_teeth_model.py

# Watch GPU usage
nvidia-smi -l 1

# Test the model
npm run dev
```

---

## 🚀 Ready to Train!

**Just run this:**
```powershell
python train_teeth_model.py
```

Grab a coffee ☕ - training takes ~30-45 minutes on RTX 3080 Ti!

---

## 📞 Need Help?

- Check training logs in `runs/detect/teeth_detection_3080ti/`
- Read Ultralytics docs: https://docs.ultralytics.com/
- Check Roboflow dataset: https://universe.roboflow.com/beame/teeth-8cswa-l8slz/2
