# Beame Straight

AI-powered teeth alignment analysis application with real-time browser-based inference.

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

## Project Structure

See [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) for detailed organization.

```
beamestraight/
├── analysis/          # Main teeth analysis app
├── landing/           # Landing page
├── public/models/     # ONNX models for inference
├── training/          # Model training scripts
├── datasets/          # Training data
├── docs/              # Documentation
└── scripts/           # Utility scripts
```

## Features

- **Real-time teeth detection** using YOLOv8 segmentation
- **Browser-based inference** with ONNX Runtime (~50-80ms)
- **Accurate tooth segmentation** (86% mAP50)
- **Treatment planning** with arch analysis

## Model Training

To train a new model:

```bash
cd training
python prepare_and_train_segmentation.py
```

## Export to ONNX

**Local:**
```bash
python export_to_onnx_simple.py training/teeth_seg_final_best.pt
```

**Google Colab:**
Upload `export_onnx_colab.ipynb` to Colab and follow instructions.

## Current Model

- **Type**: YOLOv8n-seg (segmentation)
- **Dataset**: 510 images, 6,660 teeth
- **Performance**: 86% mAP50
- **Size**: 3.3 MB (ONNX)
- **Input**: 320x320 pixels
- **Inference**: ~50-80ms in browser

## Tech Stack

- **Frontend**: TypeScript, Vite
- **Inference**: ONNX Runtime Web
- **Training**: PyTorch, Ultralytics YOLOv8
- **Annotation**: Label Studio (COCO format)

## Documentation

- [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) - Complete project organization
- [docs/SEGMENTATION_SETUP.md](./docs/SEGMENTATION_SETUP.md) - Training setup guide
- [docs/TRAIN_WINDOWS.md](./docs/TRAIN_WINDOWS.md) - Windows-specific training notes

## License

Proprietary - Beame
