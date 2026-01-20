/**
 * Local ONNX Tooth Detection - Run ML in browser at MediaPipe speed!
 * 
 * This runs tooth detection locally (no API calls) for instant results.
 */

import * as ort from 'onnxruntime-web';

interface Detection {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  class: string;
}

let session: ort.InferenceSession | null = null;
let isLoading = false;

/**
 * Load ONNX model (call once on startup)
 */
export async function loadONNXModel(modelPath: string): Promise<void> {
  if (session || isLoading) return;
  
  isLoading = true;
  console.log('[DEBUG] Loading ONNX model locally...');
  
  try {
    // Configure ONNX Runtime for WebGL (GPU acceleration)
    ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/';
    ort.env.wasm.numThreads = 1; // Single thread for better stability
    
    // Load model with optimized settings
    session = await ort.InferenceSession.create(modelPath, {
      executionProviders: ['webgl', 'wasm'], // Try GPU first, fallback to CPU
      graphOptimizationLevel: 'all', // Enable all optimizations
    });
    
    console.log('[DEBUG] ONNX model loaded successfully!');
    console.log('   Input shape:', session.inputNames);
    console.log('   Output shape:', session.outputNames);
    isLoading = false;
  } catch (error) {
    console.error('[DEBUG] Failed to load ONNX model:', error);
    isLoading = false;
    throw error;
  }
}

/**
 * Run inference on image - Using 640x640 for QUALITY (teeth need details!)
 */
export async function detectTeethONNX(
  imageData: ImageData,
  inputWidth: number = 640,
  inputHeight: number = 640
): Promise<Detection[]> {
  if (!session) {
    console.warn('[DEBUG] ONNX model not loaded yet');
    return [];
  }

  try {
    // Preprocess image
    const tensor = preprocessImage(imageData, inputWidth, inputHeight);
    
    // Run inference
    const results = await session.run({ images: tensor });
    
    // Post-process results
    const detections = postprocessResults(
      results,
      imageData.width,
      imageData.height,
      inputWidth,
      inputHeight
    );
    
    return detections;
  } catch (error) {
    console.error('[DEBUG] ONNX inference failed:', error);
    return [];
  }
}

/**
 * Preprocess image for YOLO model
 */
function preprocessImage(
  imageData: ImageData,
  targetWidth: number,
  targetHeight: number
): ort.Tensor {
  const { data, width, height } = imageData;
  
  // Create Float32Array for model input [1, 3, height, width]
  const inputSize = targetWidth * targetHeight;
  const r = new Float32Array(inputSize);
  const g = new Float32Array(inputSize);
  const b = new Float32Array(inputSize);
  
  // Resize and normalize image
  const scaleX = width / targetWidth;
  const scaleY = height / targetHeight;
  
  for (let y = 0; y < targetHeight; y++) {
    for (let x = 0; x < targetWidth; x++) {
      const srcX = Math.floor(x * scaleX);
      const srcY = Math.floor(y * scaleY);
      const srcIdx = (srcY * width + srcX) * 4;
      const dstIdx = y * targetWidth + x;
      
      // Normalize to [0, 1]
      r[dstIdx] = data[srcIdx] / 255.0;
      g[dstIdx] = data[srcIdx + 1] / 255.0;
      b[dstIdx] = data[srcIdx + 2] / 255.0;
    }
  }
  
  // Combine into single array [1, 3, height, width]
  const inputArray = new Float32Array(1 * 3 * inputSize);
  inputArray.set(r, 0);
  inputArray.set(g, inputSize);
  inputArray.set(b, inputSize * 2);
  
  return new ort.Tensor('float32', inputArray, [1, 3, targetHeight, targetWidth]);
}

/**
 * Post-process YOLOv8 output - CORRECTED for proper format
 */
function postprocessResults(
  results: any,
  originalWidth: number,
  originalHeight: number,
  inputWidth: number,
  inputHeight: number
): Detection[] {
  const detections: Detection[] = [];
  
  // Get output tensor
  const output = results[session!.outputNames[0]];
  const outputData = output.data;
  const dims = output.dims;
  
  // YOLOv8-seg format: [1, 116, 2100] for 320x320
  // - dims[0] = batch (1)
  // - dims[1] = features (4 bbox + 1 class + 32 mask coeffs = 37 for single class, or 116 for 80 classes)
  // - dims[2] = num_boxes (2100 for 320x320, 8400 for 640x640)
  
  console.log('[DEBUG] Model output dims:', dims);
  
  const numFeatures = dims[1];
  const numBoxes = dims[2];
  
  const scaleX = originalWidth / inputWidth;
  const scaleY = originalHeight / inputHeight;
  const confidenceThreshold = 0.25; // Lower threshold for segmentation model (they tend to be more conservative)
  
  try {
    // YOLOv8-seg transposed format: data is stored as [features, boxes]
    // For 1-class model at 320x320: [1, 37, 2100] where 37 = 4 bbox + 1 class + 32 mask coeffs
    
    for (let boxIdx = 0; boxIdx < numBoxes; boxIdx++) {
      // Get bbox coordinates (first 4 features)
      const x_center = outputData[boxIdx]; // Feature 0
      const y_center = outputData[numBoxes + boxIdx]; // Feature 1
      const width = outputData[numBoxes * 2 + boxIdx]; // Feature 2
      const height = outputData[numBoxes * 3 + boxIdx]; // Feature 3
      
      // Get class score (feature 4 for single-class model)
      const classScore = outputData[numBoxes * 4 + boxIdx]; // Feature 4
      
      // Apply sigmoid to get confidence
      const confidence = 1 / (1 + Math.exp(-classScore));
      
      if (confidence > confidenceThreshold) {
        // Scale to original image size
        const x = x_center * scaleX;
        const y = y_center * scaleY;
        const w = width * scaleX;
        const h = height * scaleY;
        
        detections.push({
          x: x - w / 2, // Convert center to top-left
          y: y - h / 2,
          width: w,
          height: h,
          confidence: confidence,
          class: 'tooth'
        });
      }
    }
    
    console.log(`[DEBUG] Raw detections: ${detections.length}, Threshold: ${confidenceThreshold}`);
    if (detections.length > 0) {
      const avgConf = detections.reduce((sum, d) => sum + d.confidence, 0) / detections.length;
      console.log(`[DEBUG] Avg confidence: ${avgConf.toFixed(3)}, Range: ${Math.min(...detections.map(d => d.confidence)).toFixed(3)}-${Math.max(...detections.map(d => d.confidence)).toFixed(3)}`);
    }
  } catch (error) {
    console.error('[DEBUG] Error parsing YOLO output:', error);
  }
  
  // Apply Non-Maximum Suppression to remove overlapping detections
  const nmsDetections = applyNMS(detections, 0.25); // IOU threshold of 0.25 (balanced for segmentation)
  
  return nmsDetections;
}

/**
 * Apply Non-Maximum Suppression to remove overlapping boxes
 */
function applyNMS(detections: Detection[], iouThreshold: number = 0.4): Detection[] {
  if (detections.length === 0) return [];
  
  // Sort by confidence (highest first)
  const sorted = [...detections].sort((a, b) => b.confidence - a.confidence);
  const selected: Detection[] = [];
  
  while (sorted.length > 0) {
    // Take the detection with highest confidence
    const current = sorted.shift()!;
    selected.push(current);
    
    // Remove all detections that overlap significantly with current
    for (let i = sorted.length - 1; i >= 0; i--) {
      const iou = calculateIOU(current, sorted[i]);
      if (iou > iouThreshold) {
        sorted.splice(i, 1);
      }
    }
  }
  
  return selected;
}

/**
 * Calculate Intersection over Union between two boxes
 */
function calculateIOU(box1: Detection, box2: Detection): number {
  const x1 = Math.max(box1.x, box2.x);
  const y1 = Math.max(box1.y, box2.y);
  const x2 = Math.min(box1.x + box1.width, box2.x + box2.width);
  const y2 = Math.min(box1.y + box1.height, box2.y + box2.height);
  
  const intersectionArea = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const box1Area = box1.width * box1.height;
  const box2Area = box2.width * box2.height;
  const unionArea = box1Area + box2Area - intersectionArea;
  
  return intersectionArea / unionArea;
}

/**
 * Check if ONNX model is ready
 */
export function isONNXReady(): boolean {
  return session !== null;
}

/**
 * Unload model (cleanup)
 */
export async function unloadONNXModel(): Promise<void> {
  if (session) {
    await session.release();
    session = null;
    console.log('[DEBUG] ONNX model unloaded');
  }
}
