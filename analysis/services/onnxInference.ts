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
    
    // Load model
    session = await ort.InferenceSession.create(modelPath, {
      executionProviders: ['webgl', 'wasm'], // Try GPU first, fallback to CPU
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
 * Run inference on image
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
    const startTime = performance.now();
    const results = await session.run({ images: tensor });
    const endTime = performance.now();
    
    console.log(`[DEBUG] ONNX inference took ${(endTime - startTime).toFixed(1)}ms`);
    
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
  
  console.log('Output dims:', dims);
  
  // YOLOv8 format: [1, 84, 8400]
  // - dims[0] = batch (1)
  // - dims[1] = features (4 bbox + 80 classes = 84)
  // - dims[2] = num_boxes (8400)
  
  const numFeatures = dims[1]; // 84
  const numBoxes = dims[2]; // 8400
  
  const scaleX = originalWidth / inputWidth;
  const scaleY = originalHeight / inputHeight;
  const confidenceThreshold = 0.3; // Lower threshold for undertrained model
  
  try {
    // YOLOv8 uses transposed format: data is stored as [features, boxes]
    // For each box, we need to read: [x, y, w, h, class_scores...]
    
    for (let boxIdx = 0; boxIdx < numBoxes; boxIdx++) {
      // Get bbox coordinates (first 4 features)
      const x_center = outputData[boxIdx]; // Feature 0
      const y_center = outputData[numBoxes + boxIdx]; // Feature 1
      const width = outputData[numBoxes * 2 + boxIdx]; // Feature 2
      const height = outputData[numBoxes * 3 + boxIdx]; // Feature 3
      
      // Get class scores (features 4-83 for 80 classes)
      // For single-class (tooth), just use first class score
      const classScore = outputData[numBoxes * 4 + boxIdx]; // Feature 4
      
      // Apply sigmoid to get actual confidence (0-1 range)
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
          confidence: confidence, // Now properly 0-1
          class: 'tooth'
        });
      }
    }
    
    console.log(`[DEBUG] Parsed ${detections.length} detections (threshold: ${confidenceThreshold})`);
  } catch (error) {
    console.error('[DEBUG] Error parsing YOLO output:', error);
  }
  
  return detections;
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
