# Individual Teeth Detection Overlay - Implementation Guide

## Overview
This feature adds a **visual white polygon overlay** that precisely follows the contour of each detected tooth to demonstrate that the system can identify individual teeth with high accuracy. This is a tech showcase feature similar to SmileSet's interface, making the detection capabilities look impressive and futuristic.

**Purpose**: Visual demonstration of AI detection capability, not a beauty filter.

## What It Does
When the user opens their mouth:
1. YOLO model detects each individual tooth (bounding boxes)
2. Segmentation algorithm extracts the precise tooth contour (polygon points)
3. A white semi-transparent polygon highlight appears following each tooth's exact shape
4. Each tooth can optionally show its number (FDI notation: 11-48)
5. The overlay updates in real-time at 30 FPS

## Technical Approach

### 1. Train YOLO Segmentation Model (400 Annotated Images)

**IMPORTANT**: Use **YOLOv8 Segmentation** (not just detection) to get polygon masks.

Your 400 annotated files should include:
- Class: tooth number (0-31) or specific tooth ID (incisor, molar, etc.)
- **Polygon points**: Multiple x,y coordinates defining tooth contour (not just bounding box)

Annotation format (YOLO segmentation):
```
# Format: class_id x1 y1 x2 y2 x3 y3 ... xn yn (normalized 0-1)
0 0.45 0.32 0.46 0.30 0.48 0.29 0.50 0.30 0.51 0.32 ...
```

```yaml
# data.yaml for training
train: teeth-400/train/images
val: teeth-400/valid/images
nc: 32  # Number of classes (32 teeth)
names: ['tooth_11', 'tooth_12', ..., 'tooth_48']  # FDI notation
```

Train with **segmentation model**:
```bash
python train_teeth_model.py \
  --data teeth-400/data.yaml \
  --model yolov8n-seg.pt \
  --epochs 100 \
  --imgsz 640
```

Export to ONNX:
```bash
yolo export model=runs/segment/teeth_final/weights/best.pt format=onnx
```

**Alternative**: If you only have bounding box annotations, you can use:
- Post-processing segmentation (GrabCut, color thresholding)
- SAM (Segment Anything Model) for automatic mask generation
- Instance segmentation with U-Net

### 2. Update ONNX Inference Service for Segmentation

Modify `analysis/services/onnxInference.ts` to return polygon masks:

```typescript
export interface ToothSegmentation {
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  polygon: Array<{ x: number; y: number }>; // Contour points
  confidence: number;
  class: string;           // e.g., "tooth_11", "tooth_21"
  toothNumber?: number;    // FDI number: 11-48
}

// Add tooth number extraction
function getToothNumber(className: string): number | undefined {
  const match = className.match(/tooth_(\d+)/);
  return match ? parseInt(match[1]) : undefined;
}

// Update postprocessResults for segmentation output
function postprocessSegmentationResults(
  results: any,
  originalWidth: number,
  originalHeight: number,
  inputWidth: number,
  inputHeight: number
): ToothSegmentation[] {
  const detections: ToothSegmentation[] = [];
  
  // YOLOv8-seg output: [output0, output1]
  // output0: [1, 116, 8400] - boxes + masks proto
  // output1: [1, 32, 160, 160] - mask prototypes
  
  const output0 = results[session!.outputNames[0]]; // Detections
  const output1 = results[session!.outputNames[1]]; // Mask prototypes
  
  const detectData = output0.data;
  const maskProtos = output1.data;
  
  const numBoxes = output0.dims[2]; // 8400
  const scaleX = originalWidth / inputWidth;
  const scaleY = originalHeight / inputHeight;
  const confidenceThreshold = 0.5;
  
  for (let boxIdx = 0; boxIdx < numBoxes; boxIdx++) {
    // Parse box
    const x_center = detectData[boxIdx];
    const y_center = detectData[numBoxes + boxIdx];
    const width = detectData[numBoxes * 2 + boxIdx];
    const height = detectData[numBoxes * 3 + boxIdx];
    
    // Get class (skip first 4 bbox coords + 32 mask coefficients)
    let maxClassScore = -Infinity;
    let maxClassIdx = 0;
    
    for (let classIdx = 0; classIdx < 32; classIdx++) {
      const score = detectData[numBoxes * (4 + 32 + classIdx) + boxIdx];
      if (score > maxClassScore) {
        maxClassScore = score;
        maxClassIdx = classIdx;
      }
    }
    
    const confidence = 1 / (1 + Math.exp(-maxClassScore));
    
    if (confidence > confidenceThreshold) {
      // Extract mask coefficients (32 values after bbox)
      const maskCoeffs = [];
      for (let i = 0; i < 32; i++) {
        maskCoeffs.push(detectData[numBoxes * (4 + i) + boxIdx]);
      }
      
      // Generate mask from prototypes
      const mask = generateMask(maskCoeffs, maskProtos, 
        x_center, y_center, width, height, 
        inputWidth, inputHeight);
      
      // Convert mask to polygon contour
      const polygon = maskToPolygon(mask, scaleX, scaleY);
      
      if (polygon.length > 0) {
        const className = `tooth_${maxClassIdx + 11}`;
        
        detections.push({
          bbox: {
            x: x_center * scaleX - (width * scaleX) / 2,
            y: y_center * scaleY - (height * scaleY) / 2,
            width: width * scaleX,
            height: height * scaleY
          },
          polygon,
          confidence,
          class: className,
          toothNumber: getToothNumber(className)
        });
      }
    }
  }
  
  return detections;
}

/**
 * Generate binary mask from mask coefficients and prototypes
 */
function generateMask(
  coeffs: number[],
  protos: Float32Array,
  cx: number, cy: number, w: number, h: number,
  imgW: number, imgH: number
): Uint8Array {
  const maskSize = 160; // YOLOv8 mask size
  const mask = new Uint8Array(maskSize * maskSize);
  
  // Matrix multiplication: coeffs × prototypes
  for (let y = 0; y < maskSize; y++) {
    for (let x = 0; x < maskSize; x++) {
      let sum = 0;
      for (let c = 0; c < 32; c++) {
        const protoIdx = c * maskSize * maskSize + y * maskSize + x;
        sum += coeffs[c] * protos[protoIdx];
      }
      
      // Sigmoid activation
      const activated = 1 / (1 + Math.exp(-sum));
      mask[y * maskSize + x] = activated > 0.5 ? 255 : 0;
    }
  }
  
  return mask;
}

/**
 * Convert binary mask to polygon contour points
 */
function maskToPolygon(
  mask: Uint8Array,
  scaleX: number,
  scaleY: number
): Array<{ x: number; y: number }> {
  const maskSize = 160;
  const polygon: Array<{ x: number; y: number }> = [];
  
  // Simple contour extraction (trace outer edge)
  // This is a simplified algorithm - for production use OpenCV.js or similar
  
  const visited = new Set<number>();
  
  // Find first edge pixel
  let startX = -1, startY = -1;
  for (let y = 0; y < maskSize; y++) {
    for (let x = 0; x < maskSize; x++) {
      const idx = y * maskSize + x;
      if (mask[idx] === 255) {
        // Check if on edge (has background neighbor)
        if (x === 0 || y === 0 || x === maskSize - 1 || y === maskSize - 1 ||
            mask[idx - 1] === 0 || mask[idx + 1] === 0 ||
            mask[idx - maskSize] === 0 || mask[idx + maskSize] === 0) {
          startX = x;
          startY = y;
          break;
        }
      }
    }
    if (startX >= 0) break;
  }
  
  if (startX < 0) return []; // No contour found
  
  // Trace contour (clockwise)
  const directions = [
    [1, 0], [1, 1], [0, 1], [-1, 1],
    [-1, 0], [-1, -1], [0, -1], [1, -1]
  ];
  
  let x = startX, y = startY;
  let dir = 0;
  const maxSteps = maskSize * maskSize; // Prevent infinite loop
  
  for (let step = 0; step < maxSteps; step++) {
    polygon.push({
      x: x * scaleX,
      y: y * scaleY
    });
    
    // Find next contour pixel
    let found = false;
    for (let i = 0; i < 8; i++) {
      const newDir = (dir + i) % 8;
      const nx = x + directions[newDir][0];
      const ny = y + directions[newDir][1];
      
      if (nx >= 0 && nx < maskSize && ny >= 0 && ny < maskSize) {
        const idx = ny * maskSize + nx;
        if (mask[idx] === 255 && !visited.has(idx)) {
          visited.add(idx);
          x = nx;
          y = ny;
          dir = newDir;
          found = true;
          break;
        }
      }
    }
    
    if (!found || (x === startX && y === startY && step > 10)) break;
  }
  
  // Simplify polygon (Douglas-Peucker algorithm)
  return simplifyPolygon(polygon, 2.0);
}

/**
 * Simplify polygon using Douglas-Peucker algorithm
 */
function simplifyPolygon(
  points: Array<{ x: number; y: number }>,
  epsilon: number
): Array<{ x: number; y: number }> {
  if (points.length <= 2) return points;
  
  // Find point with maximum distance from line
  let maxDist = 0;
  let maxIndex = 0;
  
  const p1 = points[0];
  const p2 = points[points.length - 1];
  
  for (let i = 1; i < points.length - 1; i++) {
    const dist = pointLineDistance(points[i], p1, p2);
    if (dist > maxDist) {
      maxDist = dist;
      maxIndex = i;
    }
  }
  
  // If max distance > epsilon, recursively simplify
  if (maxDist > epsilon) {
    const left = simplifyPolygon(points.slice(0, maxIndex + 1), epsilon);
    const right = simplifyPolygon(points.slice(maxIndex), epsilon);
    return [...left.slice(0, -1), ...right];
  } else {
    return [p1, p2];
  }
}

function pointLineDistance(
  point: { x: number; y: number },
  lineStart: { x: number; y: number },
  lineEnd: { x: number; y: number }
): number {
  const A = point.x - lineStart.x;
  const B = point.y - lineStart.y;
  const C = lineEnd.x - lineStart.x;
  const D = lineEnd.y - lineStart.y;
  
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  const param = lenSq !== 0 ? dot / lenSq : -1;
  
  let xx, yy;
  
  if (param < 0) {
    xx = lineStart.x;
    yy = lineStart.y;
  } else if (param > 1) {
    xx = lineEnd.x;
    yy = lineEnd.y;
  } else {
    xx = lineStart.x + param * C;
    yy = lineStart.y + param * D;
  }
  
  const dx = point.x - xx;
  const dy = point.y - yy;
  return Math.sqrt(dx * dx + dy * dy);
}
```

### 3. Create Polygon Overlay Renderer

Create new file: `analysis/services/teethOverlay.ts`

```typescript
/**
 * Teeth Segmentation Overlay Renderer
 * Displays white polygon highlights that follow exact tooth contours
 */

import type { ToothSegmentation } from './onnxInference';

export interface OverlayConfig {
  fillColor: string;            // e.g., 'rgba(255, 255, 255, 0.4)'
  strokeColor: string;          // e.g., 'rgba(255, 255, 255, 0.9)'
  strokeWidth: number;          // 2-3 pixels
  showToothNumbers: boolean;    // Show FDI numbers
  fontSize: number;             // Font size for numbers
  glowEffect: boolean;          // Add outer glow
  glowColor: string;            // Glow color
  glowBlur: number;             // Glow blur radius
}

export class TeethOverlayRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private config: OverlayConfig;
  
  constructor(canvas: HTMLCanvasElement, config: OverlayConfig) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.config = config;
  }
  
  /**
   * Render polygon overlays for all detected teeth
   */
  renderOverlay(segmentations: ToothSegmentation[]): void {
    for (const tooth of segmentations) {
      this.renderToothPolygon(tooth);
      
      if (this.config.showToothNumbers && tooth.toothNumber) {
        this.renderToothNumber(tooth);
      }
    }
  }
  
  /**
   * Render polygon highlight for a single tooth
   */
  private renderToothPolygon(tooth: ToothSegmentation): void {
    const { polygon } = tooth;
    
    if (polygon.length < 3) return; // Need at least 3 points
    
    // Create path from polygon points
    this.ctx.beginPath();
    this.ctx.moveTo(polygon[0].x, polygon[0].y);
    
    for (let i = 1; i < polygon.length; i++) {
      this.ctx.lineTo(polygon[i].x, polygon[i].y);
    }
    
    this.ctx.closePath();
    
    // Apply glow effect if enabled
    if (this.config.glowEffect) {
      this.ctx.save();
      this.ctx.shadowColor = this.config.glowColor;
      this.ctx.shadowBlur = this.config.glowBlur;
      this.ctx.strokeStyle = this.config.strokeColor;
      this.ctx.lineWidth = this.config.strokeWidth;
      this.ctx.stroke();
      this.ctx.restore();
    }
    
    // Fill polygon (semi-transparent)
    this.ctx.fillStyle = this.config.fillColor;
    this.ctx.fill();
    
    // Stroke polygon (more opaque border)
    this.ctx.strokeStyle = this.config.strokeColor;
    this.ctx.lineWidth = this.config.strokeWidth;
    this.ctx.stroke();
  }
  
  /**
   * Render tooth number at centroid of polygon
   */
  private renderToothNumber(tooth: ToothSegmentation): void {
    const { polygon, toothNumber } = tooth;
    
    if (!toothNumber || polygon.length === 0) return;
    
    // Calculate polygon centroid
    const centroid = this.calculateCentroid(polygon);
    
    // Draw text background (black semi-transparent circle)
    this.ctx.font = `bold ${this.config.fontSize}px Arial`;
    const text = toothNumber.toString();
    const metrics = this.ctx.measureText(text);
    const radius = Math.max(metrics.width, this.config.fontSize) / 2 + 6;
    
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.beginPath();
    this.ctx.arc(centroid.x, centroid.y, radius, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Draw text (white)
    this.ctx.fillStyle = 'white';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(text, centroid.x, centroid.y);
  }
  
  /**
   * Calculate centroid of polygon
   */
  private calculateCentroid(polygon: Array<{ x: number; y: number }>): { x: number; y: number } {
    let sumX = 0;
    let sumY = 0;
    
    for (const point of polygon) {
      sumX += point.x;
      sumY += point.y;
    }
    
    return {
      x: sumX / polygon.length,
      y: sumY / polygon.length
    };
  }
  
  /**
   * Render with smooth animation (interpolate between frames)
   */
  renderWithAnimation(
    current: ToothSegmentation[],
    previous: ToothSegmentation[],
    alpha: number // 0-1, interpolation factor
  ): void {
    // Match teeth between frames (by tooth number)
    const matched = new Map<number, { current: ToothSegmentation; previous?: ToothSegmentation }>();
    
    for (const tooth of current) {
      if (tooth.toothNumber) {
        matched.set(tooth.toothNumber, { current: tooth });
      }
    }
    
    for (const tooth of previous) {
      if (tooth.toothNumber && matched.has(tooth.toothNumber)) {
        matched.get(tooth.toothNumber)!.previous = tooth;
      }
    }
    
    // Render interpolated polygons
    for (const [_, { current, previous }] of matched) {
      if (previous) {
        const interpolated = this.interpolateSegmentation(previous, current, alpha);
        this.renderToothPolygon(interpolated);
        
        if (this.config.showToothNumbers && interpolated.toothNumber) {
          this.renderToothNumber(interpolated);
        }
      } else {
        // No previous frame, just render current
        this.renderToothPolygon(current);
        
        if (this.config.showToothNumbers && current.toothNumber) {
          this.renderToothNumber(current);
        }
      }
    }
  }
  
  /**
   * Interpolate between two segmentations for smooth animation
   */
  private interpolateSegmentation(
    prev: ToothSegmentation,
    curr: ToothSegmentation,
    alpha: number
  ): ToothSegmentation {
    // Interpolate polygon points (assumes same number of points)
    const polygon: Array<{ x: number; y: number }> = [];
    const minLen = Math.min(prev.polygon.length, curr.polygon.length);
    
    for (let i = 0; i < minLen; i++) {
      polygon.push({
        x: prev.polygon[i].x * (1 - alpha) + curr.polygon[i].x * alpha,
        y: prev.polygon[i].y * (1 - alpha) + curr.polygon[i].y * alpha
      });
    }
    
    return {
      ...curr,
      polygon
    };
  }
}
```

### 4. Integrate with Main Camera Loop

Update `analysis/main.ts`:

```typescript
import { TeethOverlayRenderer, OverlayConfig } from './services/teethOverlay';
import { detectTeethSegmentation, type ToothSegmentation } from './services/onnxInference';

// Configuration
const OVERLAY_CONFIG: OverlayConfig = {
  fillColor: 'rgba(255, 255, 255, 0.35)',        // 35% transparent white fill
  strokeColor: 'rgba(255, 255, 255, 0.95)',      // 95% opaque white border
  strokeWidth: 2.5,
  showToothNumbers: true,                        // Show FDI numbers
  fontSize: 14,
  glowEffect: true,                              // Add glow for futuristic look
  glowColor: 'rgba(255, 255, 255, 0.6)',
  glowBlur: 8
};

// Enable tooth segmentation overlay
const ENABLE_TOOTH_OVERLAY = true;  // Set to true to show overlay

let overlayRenderer: TeethOverlayRenderer | null = null;
let cachedSegmentations: ToothSegmentation[] = [];
let previousSegmentations: ToothSegmentation[] = [];
let cacheFrameCount = 0;
const CACHE_FRAMES = 2; // Reuse segmentations for 2 frames (higher accuracy needed)

// In your camera frame processing loop
async function processVideoFrame() {
  const video = document.getElementById('video') as HTMLVideoElement;
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d')!;
  
  // Draw video frame
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  
  // Teeth segmentation overlay
  if (ENABLE_TOOTH_OVERLAY && isONNXReady()) {
    // Initialize renderer
    if (!overlayRenderer) {
      overlayRenderer = new TeethOverlayRenderer(canvas, OVERLAY_CONFIG);
    }
    
    // Get segmentations (cached or fresh)
    if (cacheFrameCount >= CACHE_FRAMES) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Store previous for animation
      previousSegmentations = [...cachedSegmentations];
      
      // Get new segmentations
      cachedSegmentations = await detectTeethSegmentation(imageData);
      cacheFrameCount = 0;
    } else {
      cacheFrameCount++;
    }
    
    // Render overlay with smooth animation
    if (cachedSegmentations.length > 0) {
      const alpha = cacheFrameCount / CACHE_FRAMES; // Interpolation factor
      
      if (previousSegmentations.length > 0) {
        // Smooth animation between frames
        overlayRenderer.renderWithAnimation(
          cachedSegmentations,
          previousSegmentations,
          alpha
        );
      } else {
        // First frame, no animation
        overlayRenderer.renderOverlay(cachedSegmentations);
      }
    }
  }
  
  // Continue with other processing (face mesh, etc.)
  requestAnimationFrame(processVideoFrame);
}
```

### 5. Optional: Add Toggle UI

Add a button to enable/disable the overlay:

```html
<!-- In your HTML -->
<div class="controls">
  <button id="toggleOverlay">Show Tooth Detection</button>
</div>
```

```typescript
// In main.ts
let overlayEnabled = false;

document.getElementById('toggleOverlay')?.addEventListener('click', () => {
  overlayEnabled = !overlayEnabled;
  const btn = document.getElementById('toggleOverlay') as HTMLButtonElement;
  btn.textContent = overlayEnabled ? 'Hide Tooth Detection' : 'Show Tooth Detection';
});

// Update processVideoFrame condition
if (overlayEnabled && isONNXReady()) {
  // ... render overlay
}
```

### 6. Styling Options

You can make it look more futuristic like SmileSet:

```typescript
// Cyberpunk/Futuristic style
const CYBERPUNK_CONFIG: OverlayConfig = {
  fillColor: 'rgba(0, 255, 200, 0.25)',          // Cyan fill
  strokeColor: 'rgba(0, 255, 200, 1)',           // Bright cyan border
  strokeWidth: 3,
  showToothNumbers: true,
  fontSize: 16,
  glowEffect: true,
  glowColor: 'rgba(0, 255, 200, 0.8)',
  glowBlur: 12
};

// Minimal style
const MINIMAL_CONFIG: OverlayConfig = {
  fillColor: 'rgba(255, 255, 255, 0.15)',        // Very subtle
  strokeColor: 'rgba(255, 255, 255, 0.6)',       // Subtle border
  strokeWidth: 1,
  showToothNumbers: false,                       // No numbers
  fontSize: 12,
  glowEffect: false,
  glowColor: '',
  glowBlur: 0
};

// Medical/Professional style (like SmileSet)
const MEDICAL_CONFIG: OverlayConfig = {
  fillColor: 'rgba(255, 120, 50, 0.3)',          // Orange fill
  strokeColor: 'rgba(255, 150, 50, 1)',          // Orange border
  strokeWidth: 2.5,
  showToothNumbers: true,
  fontSize: 15,
  glowEffect: true,
  glowColor: 'rgba(255, 150, 50, 0.5)',
  glowBlur: 6
};

// Neon/Gaming style
const NEON_CONFIG: OverlayConfig = {
  fillColor: 'rgba(255, 0, 255, 0.2)',           // Magenta fill
  strokeColor: 'rgba(255, 0, 255, 1)',           // Bright magenta
  strokeWidth: 3,
  showToothNumbers: true,
  fontSize: 18,
  glowEffect: true,
  glowColor: 'rgba(255, 0, 255, 1)',
  glowBlur: 15
};
```

### 7. Performance Optimization

```typescript
// Only render overlay when mouth is open
if (mouthOpenRatio > 0.3 && overlayEnabled) {
  overlayRenderer.renderOverlay(cachedDetections);
}

// Reduce detection frequency during preview (not capture)
const DETECTION_FPS = isCapturing ? 30 : 15; // Lower FPS when just previewing
```

## Testing Checklist

- [ ] Model detects at least 20+ teeth when mouth fully open
- [ ] Overlay renders at 30 FPS without lag
- [ ] Tooth numbers are readable and correctly positioned
- [ ] Highlights don't obstruct the view too much
- [ ] Works in different lighting conditions
- [ ] Cache system reduces CPU usage

## Expected Result

When users open their mouth, they'll see:
- Individual white **polygon masks** precisely following each tooth's contour
- Smooth, organic shapes that match the actual tooth boundaries
- Small numbers (11-48) labeling each tooth at its center
- Real-time updates at 30 FPS with smooth interpolation between frames
- Optional glow effect for futuristic appearance
- Professional, tech-forward look similar to SmileSet or AR filters

This creates an impressive visual demonstration that your AI can:
1. Identify individual teeth with high precision
2. Extract exact tooth shapes (not just boxes)
3. Track teeth in real-time
4. Provide professional-grade segmentation

Much more impressive than simple bounding boxes!

## Quick Start

```bash
# 1. Train model with 400 annotations
python train_teeth_model.py

# 2. Export to ONNX
yolo export model=runs/detect/best.pt format=onnx

# 3. Copy model to public folder
cp best.onnx public/models/teeth-detection.onnx

# 4. Update main.ts with overlay code
# 5. Start dev server
npm run dev
```

## Customization

Change appearance in `OVERLAY_CONFIG`:
- `fillColor`: Polygon fill color (adjust alpha for transparency)
- `strokeColor`: Polygon outline color
- `strokeWidth`: Thickness of border
- `showToothNumbers`: Toggle FDI numbering
- `fontSize`: Size of tooth numbers
- `glowEffect`: Enable outer glow
- `glowColor`: Color of glow effect
- `glowBlur`: Blur radius for glow

## Alternative: Simplified Approach (If Segmentation is Too Complex)

If YOLOv8 segmentation is too resource-intensive or you don't have polygon annotations yet, you can use a **hybrid approach**:

1. **Use YOLO detection** (bounding boxes) for initial tooth location
2. **Apply GrabCut or color-based segmentation** within each bounding box to extract tooth contour
3. **Convert mask to polygon** using contour tracing

```typescript
// Simplified: Use bounding box + color segmentation
async function extractToothPolygon(
  imageData: ImageData,
  bbox: { x: number; y: number; width: number; height: number }
): Promise<Array<{ x: number; y: number }>> {
  // Extract tooth region
  const toothRegion = extractRegion(imageData, bbox);
  
  // Apply color thresholding (teeth are typically white/light colored)
  const mask = colorThreshold(toothRegion, {
    hueMin: 0, hueMax: 60,       // Yellowish to white
    satMin: 0, satMax: 30,       // Low saturation
    valMin: 180, valMax: 255     // Bright
  });
  
  // Find contours
  const contours = findContours(mask);
  
  // Get largest contour (main tooth)
  const mainContour = contours.sort((a, b) => b.length - a.length)[0];
  
  // Offset by bbox position
  return mainContour.map(p => ({
    x: p.x + bbox.x,
    y: p.y + bbox.y
  }));
}
```

## Future Enhancements

1. **Color-coded teeth**: Different colors for incisors, canines, molars, etc.
2. **Confidence indicator**: Opacity/color based on detection confidence
3. **Smooth transitions**: Already implemented with `renderWithAnimation()`
4. **3D depth effect**: Add shadow/glow based on tooth position (front vs back)
5. **Pulse animation**: Highlight newly detected teeth with pulse effect
6. **Tooth health overlay**: Color-code based on condition (white = healthy, yellow = warning, red = issue)
7. **Interactive**: Click on tooth to see details
8. **Export**: Save annotated image with overlays
