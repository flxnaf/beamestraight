# Beame Teeth Straightener

AI-powered teeth straightening app with real-time tooth detection and treatment planning.

## Features

- 🦷 **Real-time Tooth Detection** - Individual tooth detection using ONNX (runs in browser)
- 🎨 **3D Visualization** - Interactive 3D dental arch visualization
- 🤖 **AI Treatment Planning** - Powered by Google Gemini AI
- 📸 **Facial Analysis** - MediaPipe-powered face mesh tracking
- 🌐 **Bilingual** - English & Traditional Chinese support

## Tech Stack

- **Frontend:** Vite + TypeScript
- **ML:** ONNX Runtime Web (browser-based inference)
- **Face Tracking:** MediaPipe Face Mesh
- **3D Rendering:** Three.js
- **AI:** Google Gemini API

## Deployment

### Vercel (Recommended)

1. **Fork/Clone this repo**

2. **Import to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import from GitHub: `https://github.com/flxnaf/beamestraight`

3. **Environment Variables:**
   Add these in Vercel dashboard:
   ```
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Build Settings (Auto-detected):**
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

5. **Deploy!** 🚀

### Local Development

```bash
# Install dependencies
npm install

# Add environment variables
cp env.example .env
# Edit .env with your API keys

# Run dev server
npm run dev

# Build for production
npm run build
```

## Environment Variables

```env
# Required for treatment planning
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Optional: If you want to use Roboflow API (for cloud training)
# Local ONNX inference works without these
VITE_ROBOFLOW_API_KEY=your_roboflow_key
VITE_ROBOFLOW_MODEL_ID=your_model_id
```

## Tooth Detection

The app uses **local ONNX inference** for tooth detection:
- ✅ Runs entirely in browser (no API calls)
- ✅ 30 FPS real-time detection
- ✅ Works offline
- ✅ Privacy-preserving (data never leaves browser)

Model file: `public/models/teeth-detection.onnx` (included in repo)

## Architecture

```
/
├── analysis/           # Main analysis app
│   ├── main.ts        # Core webcam & detection logic
│   ├── services/      # ML, analysis, storage
│   └── components/    # 3D visualization
├── landing/           # Marketing pages
├── public/
│   └── models/        # ONNX model (6MB)
└── aligner.vue        # Legacy Vue component
```

## License

MIT

## Credits

Built with ❤️ by Beame
