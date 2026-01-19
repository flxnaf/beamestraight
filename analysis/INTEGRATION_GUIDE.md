# Teeth OBB Overlay Integration Guide

This guide shows how to integrate the beautiful teeth overlay into `main.ts`.

## Quick Integration

Add these changes to `analysis/main.ts`:

### 1. Update Imports (top of file)

```typescript
// Add these imports
import { 
  loadOBBModel, 
  detectTeethOBB, 
  isOBBReady,
  type ToothDetectionOBB 
} from './services/onnxInferenceOBB';
import { drawTeethOverlay } from './services/teethOverlay';
```

### 2. Update Configuration

```typescript
// Change these constants near the top of main.ts
const ONNX_MODEL_PATH = '/models/teeth-detection-obb.onnx';
const ENABLE_TOOTH_DETECTION = true;  // Enable detection
const SHOW_TOOTH_OVERLAY = true;      // Show beautiful overlay
```

### 3. Add State Variable

```typescript
// Add near other state variables (around line 303)
let currentTeethOBB: ToothDetectionOBB[] = [];
```

### 4. Update Model Loading in initializeApp()

Find the `initializeApp()` function and update:

```typescript
async function initializeApp() {
  console.log('[DEBUG] Beame Teeth Straightener initialized');
  
  if (ENABLE_TOOTH_DETECTION) {
    try { 
      await loadOBBModel(ONNX_MODEL_PATH);  // Changed from loadONNXModel
      console.log('OBB Tooth detection ready!'); 
    } catch (error) { 
      console.error('Failed to load OBB model', error); 
    }
  }
  
  // ... rest of function
}
```

### 5. Add Detection in onFaceMeshResults()

Find the `onFaceMeshResults()` function and add detection call:

```typescript
function onFaceMeshResults(results: any) {
  const canvasCtx = canvasElement.getContext('2d')!;
  
  canvasElement.width = webcamElement.videoWidth;
  canvasElement.height = webcamElement.videoHeight;

  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
    // ... existing face detection code ...
    
    // ADD THIS: Run OBB tooth detection periodically
    if (ENABLE_TOOTH_DETECTION && isOBBReady() && mouthOpen) {
      const now = Date.now();
      if (now - lastToothDetectionTime > TOOTH_DETECTION_INTERVAL && !isDetecting) {
        lastToothDetectionTime = now;
        isDetecting = true;
        
        // Get image data from canvas
        const imageData = canvasCtx.getImageData(0, 0, canvasElement.width, canvasElement.height);
        
        // Run async detection
        detectTeethOBB(imageData, 640, 0.3).then(detections => {
          currentTeethOBB = detections;
          isDetecting = false;
        }).catch(() => {
          isDetecting = false;
        });
      }
    }
    
    // ADD THIS: Draw the overlay
    if (SHOW_TOOTH_OVERLAY && currentTeethOBB.length > 0) {
      drawTeethOverlay(canvasCtx, currentTeethOBB, {
        showNumbers: true,
        showStats: true,
        animate: true
      });
    }
    
    // ... existing face mesh drawing code ...
  }
  
  canvasCtx.restore();
}
```

## Full Example Section

Here's a complete replacement for the detection rendering section:

```typescript
// In onFaceMeshResults, after drawing the video frame:

// Run OBB detection when mouth is open
if (ENABLE_TOOTH_DETECTION && isOBBReady() && mouthOpen) {
  const now = Date.now();
  if (now - lastToothDetectionTime > 500 && !isDetecting) {  // Every 500ms
    lastToothDetectionTime = now;
    isDetecting = true;
    
    const imageData = canvasCtx.getImageData(0, 0, canvasElement.width, canvasElement.height);
    
    detectTeethOBB(imageData).then(detections => {
      // Filter to mouth region if landmarks available
      if (currentLandmarks) {
        currentTeethOBB = filterDetectionsInMouthRegion(
          detections as any, 
          currentLandmarks, 
          canvasElement.width, 
          canvasElement.height
        ) as any;
      } else {
        currentTeethOBB = detections;
      }
      isDetecting = false;
    }).catch(() => {
      isDetecting = false;
    });
  }
}

// Draw beautiful overlay
if (SHOW_TOOTH_OVERLAY && currentTeethOBB.length > 0) {
  drawTeethOverlay(canvasCtx, currentTeethOBB, {
    showNumbers: true,
    showStats: true,
    animate: true
  });
}
```

## Customization Options

### Overlay Appearance

Edit `analysis/services/teethOverlay.ts` to customize:

```typescript
const OVERLAY_CONFIG = {
  // Make fill more visible
  fillColor: 'rgba(255, 255, 255, 0.40)',  // Increase from 0.30
  
  // Change badge color to match your brand
  badgeFillColor: 'rgba(0, 206, 124, 0.95)',  // Beame green
  
  // Adjust glow intensity
  glowBlur: 15,  // Increase from 12
};
```

### Tooth Number Display

Options for `drawTeethOverlay()`:

```typescript
drawTeethOverlay(ctx, detections, {
  showNumbers: true,    // Show/hide number badges
  showStats: true,      // Show/hide stats panel
  animate: true,        // Enable/disable pulse animation
  selectedTooth: '21'   // Highlight specific tooth
});
```

## Testing Without Trained Model

For UI testing before training is complete, you can add mock detections:

```typescript
// In main.ts, for testing overlay without model:
const mockDetections: ToothDetectionOBB[] = [
  {
    corners: [
      { x: 200, y: 300 }, { x: 230, y: 300 },
      { x: 230, y: 350 }, { x: 200, y: 350 }
    ],
    center: { x: 215, y: 325 },
    confidence: 0.95,
    toothNumber: '11',
    arch: 'upper',
    positionIndex: 0,
    angle: 0
  },
  // Add more mock teeth...
];

// Then use: drawTeethOverlay(ctx, mockDetections, { ... });
```

## Troubleshooting

### Overlay not showing
1. Check `ENABLE_TOOTH_DETECTION = true`
2. Check `SHOW_TOOTH_OVERLAY = true`
3. Verify model loaded: `console.log(isOBBReady())`
4. Check detection results: `console.log(currentTeethOBB)`

### Numbers incorrect
The FDI numbering system assumes:
- Camera view is mirrored (selfie mode)
- Patient's right = image left
- Adjust `assignToothNumbers()` in `onnxInferenceOBB.ts` if needed

### Performance issues
- Increase `TOOTH_DETECTION_INTERVAL` to 1000ms or higher
- Reduce input size: `detectTeethOBB(imageData, 320, 0.4)`
