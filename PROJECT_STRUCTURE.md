# Beame Straight - Project Structure

## Directory Organization

```
beamestraight/
├── analysis/              # Main teeth analysis application
│   ├── services/          # ONNX inference, overlay, treatment planning
│   └── types/             # TypeScript type definitions
│
├── landing/               # Landing page
│   ├── pics/              # Images and assets
│   └── Font/              # Custom fonts
│
├── public/
│   └── models/            # ONNX models for browser inference
│       ├── teeth-detection-seg.onnx  # Current segmentation model
│       └── best.onnx                  # Legacy model
│
├── datasets/              # Training data (gitignored)
│   ├── teeth-seg-finalset/  # COCO format data from Label Studio
│   └── teeth-seg-combined/  # Converted YOLOv8 format
│
├── training/              # Model training scripts
│   ├── prepare_and_train_segmentation.py  # Main training pipeline
│   ├── teeth_seg_final_best.pt            # Trained model weights
│   └── [other training scripts]
│
├── docs/                  # Documentation
│   ├── SEGMENTATION_SETUP.md
│   ├── TRAIN_WINDOWS.md
│   └── [other docs]
│
├── scripts/               # Utility scripts
│
└── runs/                  # Training outputs (gitignored)
```

## Key Files

### Application
- `index.html` - Main entry point
- `analysis/main.ts` - Analysis app entry point
- `package.json` - Dependencies

### Model Training
- `training/prepare_and_train_segmentation.py` - Complete training pipeline
- `training/teeth_seg_final_best.pt` - Trained model (6.7MB)

### Model Export
- `export_to_onnx_simple.py` - Convert .pt to ONNX locally
- `export_onnx_colab.ipynb` - Google Colab notebook for conversion

## Workflows

### Training a New Model
```bash
cd training
python prepare_and_train_segmentation.py
```

### Converting Model to ONNX
**Option 1: Local**
```bash
python export_to_onnx_simple.py training/teeth_seg_final_best.pt
```

**Option 2: Google Colab**
1. Upload `export_onnx_colab.ipynb` to Colab
2. Upload `training/teeth_seg_final_best.pt`
3. Run cells, download ONNX
4. Save to `public/models/teeth-detection-seg.onnx`

### Running the App
```bash
npm install
npm run dev
```

## Current Model Stats
- **Images**: 510
- **Annotations**: 6,660 teeth
- **Mask mAP50**: 0.860 (86%)
- **Model Size**: 6.7 MB (.pt), ~3-4 MB (ONNX)
- **Input Size**: 320x320
- **Inference Time**: ~50-80ms in browser
