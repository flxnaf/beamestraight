# Beame Straight

AI-powered teeth alignment analysis application with real-time browser-based inference.

## Quick Start

### Prerequisites
- Node.js 16+ and npm

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd beame-teeth-straightener
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
# Copy the example file
cp env.example .env

# Edit .env and add your configuration
```

**Environment Variables:**
- `VITE_GEMINI_API_KEY` - Google Gemini API key for AI dental analysis (get from https://aistudio.google.com/app/apikey)
- `VITE_ONNX_MODEL_PATH` - (Optional) Path to ONNX model (default: `/models/teeth_seg_320x320.onnx`)
- `VITE_ROBOFLOW_API_KEY` - (Optional) Roboflow API key for fallback detection
- `VITE_ROBOFLOW_MODEL_ID` - (Optional) Roboflow model ID

4. **Run development server**
```bash
npm run dev
```

5. **Build for production**
```bash
npm run build
```

## Project Structure

```
beame-teeth-straightener/
├── analysis/          # Main teeth analysis app
│   ├── components/    # UI components
│   ├── services/      # ONNX inference, arch analysis
│   ├── types/         # TypeScript definitions
│   └── utils/         # Diagnostic utilities
├── landing/           # Landing page
├── public/models/     # ONNX models for inference
├── docs/              # Documentation
└── 源泉圆体/          # Custom fonts
```

## Features

- **Real-time teeth detection** using YOLOv8 segmentation
- **Browser-based inference** with ONNX Runtime (~50-80ms)
- **Accurate tooth segmentation** with pre-trained models
- **Treatment planning** with arch analysis
- **Modern UI** with TypeScript and Vite

## Current Model

- **Type**: YOLOv8n-seg (segmentation)
- **Performance**: 86% mAP50
- **Size**: ~13 MB (ONNX)
- **Input**: 320x320 or 640x640 pixels
- **Inference**: ~50-80ms in browser

## Tech Stack

- **Frontend**: TypeScript, Vite
- **Inference**: ONNX Runtime Web
- **AI**: Google Gemini API (for image processing)
- **Models**: Pre-trained YOLOv8 (ONNX format)

## Feature Configuration

You can enable/disable features by editing configuration constants in `analysis/main.ts`:

### Teeth Overlay Detection
```typescript
// Line 32: Master switch for teeth detection and overlay
const ENABLE_TEETH_OVERLAY = true; // Set to false to disable teeth detection & overlay
```
- Controls real-time teeth detection and white overlay
- Disabling this improves performance (skips ONNX inference)

### Gemini AI Integration
```typescript
// Line 22: Toggle between real AI and fallback mode
const USE_FALLBACK_MODE = false; // Set to true to disable Gemini API calls
```
- When `false`: Uses Gemini AI for dental analysis (requires API key)
- When `true`: Uses mock data (saves API credits during development)

### ONNX Model Selection
```typescript
// Line 33: Choose model resolution
const ONNX_MODEL_PATH = '/models/teeth_seg_320x320.onnx'; // or teeth_seg_640x640.onnx
```
- `320x320` - Faster inference (~50-80ms), lower resolution
- `640x640` - Higher accuracy, slower inference (~100-150ms)

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run typecheck` - Run TypeScript type checking

## Documentation

See the `docs/` folder for additional documentation on implementation details.

## License

Proprietary - Beame
