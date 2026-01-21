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
    // Configure ONNX Runtime - WebGL for GPU acceleration
    ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/';
    ort.env.wasm.numThreads = 1; // WebGL doesn't use threads
    
    // Try WebGL first for GPU acceleration (faster for 640x640)
    session = await ort.InferenceSession.create(modelPath, {
      executionProviders: ['webgl', 'wasm'], // GPU first, fallback to CPU
      graphOptimizationLevel: 'all',
      enableCpuMemArena: false, // Disable for WebGL
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
    const { width: originalWidth, height: originalHeight } = imageData;
    
    // Calculate letterbox parameters to avoid stretching
    const ratio = Math.min(inputWidth / originalWidth, inputHeight / originalHeight);
    const newWidth = Math.round(originalWidth * ratio);
    const newHeight = Math.round(originalHeight * ratio);
    const offsetX = (inputWidth - newWidth) / 2;
    const offsetY = (inputHeight - newHeight) / 2;

    // Preprocess image with letterboxing
    const tensor = preprocessImage(imageData, inputWidth, inputHeight, newWidth, newHeight, offsetX, offsetY);
    
    // Run inference
    const results = await session.run({ images: tensor });
    
    // Post-process results accounting for letterboxing
    const detections = postprocessResults(
      results,
      originalWidth,
      originalHeight,
      inputWidth,
      inputHeight,
      ratio,
      offsetX,
      offsetY
    );
    
    return detections;
  } catch (error) {
    console.error('[DEBUG] ONNX inference failed:', error);
    return [];
  }
}

/**
 * Preprocess image for YOLO model with letterboxing (prevents stretching)
 */
// Pre-allocated buffer for better performance
let preprocessBuffer: Float32Array | null = null;
let lastBufferSize = 0;

function preprocessImage(
  imageData: ImageData,
  targetWidth: number,
  targetHeight: number,
  newWidth: number,
  newHeight: number,
  offsetX: number,
  offsetY: number
): ort.Tensor {
  const { data, width, height } = imageData;
  
  const inputSize = targetWidth * targetHeight;
  const totalSize = 3 * inputSize;
  
  // Reuse buffer if same size
  if (!preprocessBuffer || lastBufferSize !== totalSize) {
    preprocessBuffer = new Float32Array(totalSize);
    lastBufferSize = totalSize;
  }
  preprocessBuffer.fill(0.5); // Gray padding
  
  const scaleX = width / newWidth;
  const scaleY = height / newHeight;
  const offsetXInt = Math.floor(offsetX);
  const offsetYInt = Math.floor(offsetY);
  
  // Optimized: single pass, direct indexing, multiply instead of divide
  for (let y = 0; y < newHeight; y++) {
    const dstY = y + offsetYInt;
    if (dstY < 0 || dstY >= targetHeight) continue;
    
    const srcY = Math.floor(y * scaleY);
    const srcRowIdx = srcY * width;
    const dstRowIdx = dstY * targetWidth;
    
    for (let x = 0; x < newWidth; x++) {
      const dstX = x + offsetXInt;
      if (dstX < 0 || dstX >= targetWidth) continue;
      
      const srcX = Math.floor(x * scaleX);
      const srcIdx = (srcRowIdx + srcX) * 4;
      const dstIdx = dstRowIdx + dstX;
      
      // Multiply by 1/255 instead of divide (faster)
      preprocessBuffer[dstIdx] = data[srcIdx] * 0.00392156862745098;
      preprocessBuffer[inputSize + dstIdx] = data[srcIdx + 1] * 0.00392156862745098;
      preprocessBuffer[inputSize * 2 + dstIdx] = data[srcIdx + 2] * 0.00392156862745098;
    }
  }
  
  return new ort.Tensor('float32', preprocessBuffer, [1, 3, targetHeight, targetWidth]);
}

/**
 * Post-process YOLOv8 output - CORRECTED for letterboxing and confidence
 */
function postprocessResults(
  results: any,
  originalWidth: number,
  originalHeight: number,
  inputWidth: number,
  inputHeight: number,
  ratio: number,
  offsetX: number,
  offsetY: number
): Detection[] {
  const detections: Detection[] = [];
  
  // Get output tensor
  const output = results[session!.outputNames[0]];
  const outputData = output.data;
  const dims = output.dims;
  
  const numFeatures = dims[1];
  const numBoxes = dims[2];
  
  console.log('[DEBUG] Full output dims:', dims, 'Data length:', outputData.length);
  console.log('[DEBUG] Sample raw values:', Array.from(outputData.slice(0, 20)));
  
  // Track confidence distribution for debugging
  let maxConf = -Infinity;
  let minConf = Infinity;
  let allConfidences: number[] = [];
  
  // Optimized thresholds for 320x320 segmentation model
  const confidenceThreshold = 0.16; // Catches lower teeth and partial teeth, filters noise
  const iouThreshold = 0.28; // Strict NMS to prevent 3-layer artifacts while allowing separate layers
  
  try {
    // First pass: collect confidence statistics
    for (let boxIdx = 0; boxIdx < Math.min(numBoxes, 100); boxIdx++) {
      const rawScore = outputData[numBoxes * 4 + boxIdx];
      allConfidences.push(rawScore);
      maxConf = Math.max(maxConf, rawScore);
      minConf = Math.min(minConf, rawScore);
    }
    
    console.log(`[DEBUG] Confidence range (first 100 boxes): ${minConf.toFixed(3)} - ${maxConf.toFixed(3)}`);
    
    // Determine if scores need sigmoid
    const needsSigmoid = maxConf > 1.0 || minConf < 0;
    console.log(`[DEBUG] Scores need sigmoid: ${needsSigmoid}`);
    
    // Second pass: extract detections
    for (let boxIdx = 0; boxIdx < numBoxes; boxIdx++) {
      // Get raw class score
      let confidence = outputData[numBoxes * 4 + boxIdx];
      
      // Apply sigmoid if needed
      if (needsSigmoid) {
        confidence = 1 / (1 + Math.exp(-confidence));
      }
      
      if (confidence > confidenceThreshold) {
        // Get bbox coordinates (raw pixels in 640x640 space)
        const x_center = outputData[boxIdx]; 
        const y_center = outputData[numBoxes + boxIdx]; 
        const w_raw = outputData[numBoxes * 2 + boxIdx]; 
        const h_raw = outputData[numBoxes * 3 + boxIdx]; 
        
        // Remove letterbox offsets and scale back to original size
        const x = (x_center - offsetX) / ratio;
        const y = (y_center - offsetY) / ratio;
        const w = w_raw / ratio;
        const h = h_raw / ratio;
        
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
      const detMinConf = Math.min(...detections.map(d => d.confidence));
      const detMaxConf = Math.max(...detections.map(d => d.confidence));
      console.log(`[DEBUG] Detection confidences - Avg: ${avgConf.toFixed(3)}, Range: ${detMinConf.toFixed(3)}-${detMaxConf.toFixed(3)}`);
    }
  } catch (error) {
    console.error('[DEBUG] Error parsing YOLO output:', error);
  }
  
  // Apply Non-Maximum Suppression to remove overlapping detections
  const nmsDetections = applyNMS(detections, iouThreshold);
  
  console.log(`[DEBUG] Final detections after NMS: ${nmsDetections.length}`);
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
