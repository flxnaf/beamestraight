# Adaptive Teeth Highlight Implementation Guide

## Overview
This document describes the implementation of an **Adaptive Real-Time Teeth Whitening & Highlight System** using YOLOv8 teeth detection with 400 annotated training samples. This feature applies intelligent, adaptive white highlights to detected teeth during photo capture to create professional, aesthetically enhanced smile photos.

## Technical Architecture

### 1. Core Components

#### A. YOLO Model Training (Pre-Implementation)
- **Dataset**: 400 annotated teeth images in YOLO format
- **Model**: YOLOv8n (nano) for real-time performance
- **Export Format**: ONNX (optimized for web deployment)
- **Training Output**: 
  - Model file: `teeth-detection.onnx`
  - Confidence threshold: 0.5+ (production)
  - Classes: Individual tooth detection (32 tooth classes) or unified "tooth" class

#### B. Real-Time Detection Pipeline
```
Camera Feed → Frame Capture → ONNX Inference → Bounding Box Detection → Highlight Rendering
     ↓              ↓                ↓                    ↓                      ↓
  MediaPipe    ImageData       detectTeethONNX()    Filter by conf.      Canvas overlay
```

#### C. Adaptive Highlight System
The highlight system uses multiple layers to create natural-looking enhancement:

1. **Base Detection Layer** (ONNX)
   - Detects individual teeth bounding boxes
   - Returns: `{ x, y, width, height, confidence, class }`

2. **Segmentation Refinement Layer** (Optional)
   - Refines bounding boxes to exact tooth contours
   - Uses color-based segmentation or U-Net model
   - Masks non-tooth pixels within bounding boxes

3. **Adaptive Highlight Rendering**
   - Analyzes existing tooth brightness
   - Applies graduated highlight (center → edge fade)
   - Blends with original color (multiply/screen blend modes)
   - Adds specular highlights for "glossy" effect

### 2. Implementation Steps

#### Step 1: Train YOLO Model
```bash
# Using your 400 annotated files
python train_teeth_model.py \
  --data teeth-400/data.yaml \
  --model yolov8n.pt \
  --epochs 100 \
  --imgsz 640 \
  --batch 16 \
  --device 0

# Export to ONNX
yolo export model=runs/detect/teeth_final/weights/best.pt format=onnx
```

#### Step 2: Integrate Real-Time Detection
Update `analysis/services/onnxInference.ts`:

```typescript
export interface ToothDetection {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  class: string; // e.g., "incisor", "canine", "molar"
  toothNumber?: number; // Optional: FDI notation (11-48)
}

export async function detectTeethRealtime(
  canvas: HTMLCanvasElement,
  confidenceThreshold: number = 0.5
): Promise<ToothDetection[]> {
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  // Run ONNX inference
  const detections = await detectTeethONNX(imageData);
  
  // Filter by confidence
  return detections.filter(d => d.confidence >= confidenceThreshold);
}
```

#### Step 3: Implement Adaptive Highlight Renderer
Create new file: `analysis/services/teethHighlight.ts`

```typescript
/**
 * Adaptive Teeth Highlight Renderer
 * Applies natural-looking whitening and highlights to detected teeth
 */

export interface HighlightConfig {
  intensity: number;        // 0.0 - 1.0 (whitening strength)
  glossiness: number;       // 0.0 - 1.0 (specular highlight intensity)
  warmth: number;          // 0.0 - 1.0 (yellow tint for natural look)
  adaptiveBrightness: boolean; // Auto-adjust based on original color
}

export class TeethHighlightRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private config: HighlightConfig;
  
  constructor(canvas: HTMLCanvasElement, config: HighlightConfig) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.config = config;
  }
  
  /**
   * Apply highlights to detected teeth
   */
  applyHighlights(detections: ToothDetection[]): void {
    // Create overlay canvas for non-destructive editing
    const overlay = document.createElement('canvas');
    overlay.width = this.canvas.width;
    overlay.height = this.canvas.height;
    const overlayCtx = overlay.getContext('2d')!;
    
    for (const tooth of detections) {
      this.renderToothHighlight(overlayCtx, tooth);
    }
    
    // Blend overlay with original image
    this.ctx.globalCompositeOperation = 'screen'; // Brightening blend mode
    this.ctx.globalAlpha = this.config.intensity;
    this.ctx.drawImage(overlay, 0, 0);
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.globalAlpha = 1.0;
  }
  
  /**
   * Render highlight for a single tooth
   */
  private renderToothHighlight(
    ctx: CanvasRenderingContext2D,
    tooth: ToothDetection
  ): void {
    const { x, y, width, height } = tooth;
    
    // Calculate adaptive brightness
    const avgBrightness = this.getAverageBrightness(x, y, width, height);
    const boost = this.config.adaptiveBrightness
      ? this.calculateBoost(avgBrightness)
      : 1.0;
    
    // Create radial gradient for natural highlight
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const radius = Math.max(width, height) / 2;
    
    const gradient = ctx.createRadialGradient(
      centerX, centerY, radius * 0.2,  // Inner (bright center)
      centerX, centerY, radius           // Outer (fade to transparent)
    );
    
    // Gradient colors (white with warm tint)
    const warmWhite = this.getWarmWhite();
    gradient.addColorStop(0, `rgba(${warmWhite.r}, ${warmWhite.g}, ${warmWhite.b}, ${0.8 * boost})`);
    gradient.addColorStop(0.5, `rgba(${warmWhite.r}, ${warmWhite.g}, ${warmWhite.b}, ${0.4 * boost})`);
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    // Draw highlight
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, width, height);
    
    // Add specular highlight (glossy effect)
    if (this.config.glossiness > 0) {
      this.addSpecularHighlight(ctx, tooth, boost);
    }
  }
  
  /**
   * Calculate adaptive brightness boost
   */
  private calculateBoost(avgBrightness: number): number {
    // Darker teeth get more boost, lighter teeth get less
    const normalized = avgBrightness / 255;
    return 1.0 + (1.0 - normalized) * 0.5; // Max 1.5x boost for dark teeth
  }
  
  /**
   * Get average brightness in tooth region
   */
  private getAverageBrightness(
    x: number,
    y: number,
    width: number,
    height: number
  ): number {
    const imageData = this.ctx.getImageData(x, y, width, height);
    const data = imageData.data;
    
    let sum = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      sum += (r + g + b) / 3; // Simple average
    }
    
    return sum / (width * height);
  }
  
  /**
   * Get warm white color (natural tooth color)
   */
  private getWarmWhite(): { r: number; g: number; b: number } {
    const warmth = this.config.warmth;
    return {
      r: 255,
      g: 255 - warmth * 10,  // Slightly yellow
      b: 255 - warmth * 20   // Even more yellow
    };
  }
  
  /**
   * Add specular highlight for glossy effect
   */
  private addSpecularHighlight(
    ctx: CanvasRenderingContext2D,
    tooth: ToothDetection,
    boost: number
  ): void {
    const { x, y, width, height } = tooth;
    
    // Specular highlight at top-center (where light hits)
    const highlightX = x + width / 2;
    const highlightY = y + height * 0.3; // Upper third
    const highlightRadius = Math.min(width, height) * 0.3;
    
    const gradient = ctx.createRadialGradient(
      highlightX, highlightY, 0,
      highlightX, highlightY, highlightRadius
    );
    
    const alpha = this.config.glossiness * boost * 0.6;
    gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(highlightX, highlightY, highlightRadius, 0, Math.PI * 2);
    ctx.fill();
  }
}
```

#### Step 4: Integrate with Camera Pipeline
Update `analysis/main.ts`:

```typescript
import { TeethHighlightRenderer, HighlightConfig } from './services/teethHighlight';

// Configuration
const HIGHLIGHT_CONFIG: HighlightConfig = {
  intensity: 0.7,              // 70% whitening
  glossiness: 0.5,             // Medium gloss
  warmth: 0.3,                 // Natural warm white
  adaptiveBrightness: true     // Auto-adjust per tooth
};

let highlightRenderer: TeethHighlightRenderer | null = null;

// In camera frame processing loop
async function processFrame(videoElement: HTMLVideoElement) {
  // ... existing MediaPipe face detection ...
  
  // Draw video frame to canvas
  canvasCtx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
  
  // Detect teeth
  if (ENABLE_TOOTH_DETECTION) {
    const teeth = await detectTeethRealtime(canvas, 0.5);
    
    // Initialize renderer if needed
    if (!highlightRenderer) {
      highlightRenderer = new TeethHighlightRenderer(canvas, HIGHLIGHT_CONFIG);
    }
    
    // Apply highlights
    if (teeth.length > 0) {
      highlightRenderer.applyHighlights(teeth);
    }
  }
  
  // Continue with rest of processing...
}
```

#### Step 5: Add User Controls (Optional)
Create UI controls for live adjustment:

```typescript
// Slider controls
<div class="highlight-controls">
  <label>Whitening: <input type="range" id="intensity" min="0" max="100" value="70"></label>
  <label>Glossiness: <input type="range" id="glossiness" min="0" max="100" value="50"></label>
  <label>Warmth: <input type="range" id="warmth" min="0" max="100" value="30"></label>
</div>

// Update config in real-time
document.getElementById('intensity')?.addEventListener('input', (e) => {
  HIGHLIGHT_CONFIG.intensity = parseInt((e.target as HTMLInputElement).value) / 100;
});
```

### 3. Performance Optimization

#### A. Frame Rate Management
```typescript
const TARGET_FPS = 30;
const FRAME_INTERVAL = 1000 / TARGET_FPS;
let lastFrameTime = 0;

function processFrameThrottled(timestamp: number) {
  if (timestamp - lastFrameTime < FRAME_INTERVAL) {
    requestAnimationFrame(processFrameThrottled);
    return;
  }
  
  lastFrameTime = timestamp;
  processFrame(video);
  requestAnimationFrame(processFrameThrottled);
}
```

#### B. Detection Caching
```typescript
// Cache detections for multiple frames to reduce inference load
let detectionCache: ToothDetection[] = [];
let cacheFrameCount = 0;
const CACHE_FRAMES = 3; // Reuse for 3 frames

if (cacheFrameCount++ >= CACHE_FRAMES) {
  detectionCache = await detectTeethRealtime(canvas);
  cacheFrameCount = 0;
}
```

#### C. WebGL Acceleration
Use WebGL shaders for highlight rendering (advanced):

```glsl
// Fragment shader for teeth whitening
precision mediump float;
uniform sampler2D u_image;
uniform vec2 u_toothCenter;
uniform float u_intensity;

void main() {
  vec2 pos = gl_FragCoord.xy;
  vec4 color = texture2D(u_image, pos);
  
  // Calculate distance from tooth center
  float dist = distance(pos, u_toothCenter);
  float falloff = smoothstep(50.0, 0.0, dist);
  
  // Apply whitening
  vec3 whitened = mix(color.rgb, vec3(1.0), u_intensity * falloff);
  gl_FragColor = vec4(whitened, color.a);
}
```

### 4. Quality Assurance

#### Testing Checklist
- [ ] Model accuracy: >90% tooth detection rate
- [ ] Real-time performance: 30 FPS on mid-range devices
- [ ] Natural appearance: No over-whitening or artifacts
- [ ] Lighting adaptation: Works in various lighting conditions
- [ ] Edge cases: Handles braces, gaps, partial smiles

#### A/B Testing Metrics
- User satisfaction score
- Photo save rate (with/without highlight)
- Processing latency
- Battery impact on mobile

### 5. Deployment

#### Production Configuration
```typescript
const PRODUCTION_CONFIG = {
  modelPath: '/models/teeth-detection-v1.onnx',
  confidenceThreshold: 0.6,
  highlightConfig: {
    intensity: 0.65,
    glossiness: 0.4,
    warmth: 0.35,
    adaptiveBrightness: true
  },
  performance: {
    targetFPS: 30,
    cacheFrames: 2,
    useWebGL: true // If available
  }
};
```

#### Model Versioning
- Store models with version tags: `teeth-detection-v1.0.0.onnx`
- Implement fallback to previous version if new model fails
- A/B test new models before full rollout

### 6. Future Enhancements

1. **Individual Tooth Tracking**: Track specific teeth across frames for more stable highlights
2. **Smile Detection Integration**: Increase highlight intensity when user smiles
3. **Color Correction**: Match highlight color to natural tooth color per user
4. **3D Mesh Projection**: Use face mesh to project highlights in 3D space
5. **Machine Learning Feedback**: Learn user preferences over time

### 7. Technical Specifications Summary

| Metric | Target | Actual (After Implementation) |
|--------|--------|-------------------------------|
| Model Size | <5 MB | TBD |
| Inference Time | <30ms | TBD |
| Detection Accuracy | >85% | TBD |
| Frame Rate | 30 FPS | TBD |
| User Satisfaction | >4.0/5 | TBD |

### 8. References

- YOLOv8 Documentation: https://docs.ultralytics.com
- ONNX Runtime Web: https://onnxruntime.ai/docs/tutorials/web/
- Canvas Blend Modes: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/globalCompositeOperation
- MediaPipe Face Mesh: https://google.github.io/mediapipe/solutions/face_mesh

---

## Quick Start Commands

```bash
# 1. Train model
npm run train:teeth

# 2. Test inference
npm run test:detection

# 3. Start dev server with highlights enabled
npm run dev

# 4. Build for production
npm run build
```

## Contact

For implementation questions, contact the development team.
