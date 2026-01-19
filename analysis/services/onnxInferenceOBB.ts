/**
 * YOLOv8-OBB Inference Service for Teeth Detection
 * 
 * Handles Oriented Bounding Box detection and assigns tooth numbers
 * based on spatial position (left-to-right, upper vs lower arch).
 */

import * as ort from 'onnxruntime-web';

// ============================================
// Types
// ============================================

export interface Point {
  x: number;
  y: number;
}

export interface ToothDetectionOBB {
  // 4 corner points of the oriented bounding box
  corners: [Point, Point, Point, Point];
  // Center point
  center: Point;
  // Confidence score (0-1)
  confidence: number;
  // Assigned tooth number (e.g., "11", "21", "41")
  toothNumber: string;
  // Arch: upper or lower
  arch: 'upper' | 'lower';
  // Position index (0 = leftmost)
  positionIndex: number;
  // Rotation angle in degrees
  angle: number;
}

// ============================================
// Module State
// ============================================

let session: ort.InferenceSession | null = null;
let isLoading = false;

// ============================================
// Model Loading
// ============================================

/**
 * Load YOLOv8-OBB ONNX model
 */
export async function loadOBBModel(modelPath: string): Promise<void> {
  if (session || isLoading) return;
  
  isLoading = true;
  console.log('[OBB] Loading YOLOv8-OBB model...');
  
  try {
    ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/';
    
    session = await ort.InferenceSession.create(modelPath, {
      executionProviders: ['webgl', 'wasm'],
    });
    
    console.log('[OBB] Model loaded successfully!');
    console.log('[OBB] Input names:', session.inputNames);
    console.log('[OBB] Output names:', session.outputNames);
    isLoading = false;
  } catch (error) {
    console.error('[OBB] Failed to load model:', error);
    isLoading = false;
    throw error;
  }
}

/**
 * Check if OBB model is ready
 */
export function isOBBReady(): boolean {
  return session !== null;
}

/**
 * Unload OBB model
 */
export async function unloadOBBModel(): Promise<void> {
  if (session) {
    await session.release();
    session = null;
    console.log('[OBB] Model unloaded');
  }
}

// ============================================
// Inference
// ============================================

/**
 * Run OBB inference on image
 */
export async function detectTeethOBB(
  imageData: ImageData,
  inputSize: number = 640,
  confidenceThreshold: number = 0.3
): Promise<ToothDetectionOBB[]> {
  if (!session) {
    console.warn('[OBB] Model not loaded');
    return [];
  }

  try {
    const { width: origWidth, height: origHeight } = imageData;
    
    // Preprocess
    const tensor = preprocessImage(imageData, inputSize);
    
    // Run inference
    const startTime = performance.now();
    const results = await session.run({ images: tensor });
    const inferenceTime = performance.now() - startTime;
    console.log(`[OBB] Inference took ${inferenceTime.toFixed(1)}ms`);
    
    // Parse OBB output
    const rawDetections = parseOBBOutput(
      results, 
      origWidth, 
      origHeight, 
      inputSize, 
      confidenceThreshold
    );
    
    // Apply NMS to remove overlapping detections
    const nmsDetections = applyNMS(rawDetections, 0.5);
    
    // Assign tooth numbers based on position
    const numberedDetections = assignToothNumbers(nmsDetections, origHeight);
    
    console.log(`[OBB] Detected ${numberedDetections.length} teeth`);
    return numberedDetections;
    
  } catch (error) {
    console.error('[OBB] Inference failed:', error);
    return [];
  }
}

// ============================================
// Image Preprocessing
// ============================================

function preprocessImage(
  imageData: ImageData,
  targetSize: number
): ort.Tensor {
  const { data, width, height } = imageData;
  
  const inputSize = targetSize * targetSize;
  const r = new Float32Array(inputSize);
  const g = new Float32Array(inputSize);
  const b = new Float32Array(inputSize);
  
  const scaleX = width / targetSize;
  const scaleY = height / targetSize;
  
  for (let y = 0; y < targetSize; y++) {
    for (let x = 0; x < targetSize; x++) {
      const srcX = Math.floor(x * scaleX);
      const srcY = Math.floor(y * scaleY);
      const srcIdx = (srcY * width + srcX) * 4;
      const dstIdx = y * targetSize + x;
      
      r[dstIdx] = data[srcIdx] / 255.0;
      g[dstIdx] = data[srcIdx + 1] / 255.0;
      b[dstIdx] = data[srcIdx + 2] / 255.0;
    }
  }
  
  const inputArray = new Float32Array(3 * inputSize);
  inputArray.set(r, 0);
  inputArray.set(g, inputSize);
  inputArray.set(b, inputSize * 2);
  
  return new ort.Tensor('float32', inputArray, [1, 3, targetSize, targetSize]);
}

// ============================================
// OBB Output Parsing
// ============================================

interface RawOBBDetection {
  corners: [Point, Point, Point, Point];
  center: Point;
  confidence: number;
  angle: number;
}

function parseOBBOutput(
  results: ort.InferenceSession.OnnxValueMapType,
  origWidth: number,
  origHeight: number,
  inputSize: number,
  threshold: number
): RawOBBDetection[] {
  const detections: RawOBBDetection[] = [];
  
  // Get output tensor - YOLOv8-OBB output format varies
  const outputNames = Object.keys(results);
  const output = results[outputNames[0]];
  const outputData = output.data as Float32Array;
  const dims = output.dims;
  
  console.log('[OBB] Output dims:', dims);
  
  const scaleX = origWidth / inputSize;
  const scaleY = origHeight / inputSize;
  
  // YOLOv8-OBB output format: [batch, num_detections, 10]
  // Each detection: [x_center, y_center, width, height, angle, class_conf...]
  // OR: [batch, 10, num_detections] (transposed)
  
  if (dims.length === 3) {
    // Determine format based on dims
    const [batch, dim1, dim2] = dims as [number, number, number];
    
    if (dim1 > dim2) {
      // Format: [1, num_detections, features]
      const numDetections = dim1;
      const numFeatures = dim2;
      
      for (let i = 0; i < numDetections; i++) {
        const baseIdx = i * numFeatures;
        
        // OBB format: cx, cy, w, h, angle, class_scores...
        const cx = outputData[baseIdx] * scaleX;
        const cy = outputData[baseIdx + 1] * scaleY;
        const w = outputData[baseIdx + 2] * scaleX;
        const h = outputData[baseIdx + 3] * scaleY;
        const angle = outputData[baseIdx + 4]; // radians
        const classScore = outputData[baseIdx + 5];
        
        const confidence = sigmoid(classScore);
        
        if (confidence > threshold) {
          const corners = computeOBBCorners(cx, cy, w, h, angle);
          detections.push({
            corners,
            center: { x: cx, y: cy },
            confidence,
            angle: angle * 180 / Math.PI
          });
        }
      }
    } else {
      // Format: [1, features, num_detections] (transposed)
      const numFeatures = dim1;
      const numDetections = dim2;
      
      for (let i = 0; i < numDetections; i++) {
        // Read values from transposed format
        const cx = outputData[0 * numDetections + i] * scaleX;
        const cy = outputData[1 * numDetections + i] * scaleY;
        const w = outputData[2 * numDetections + i] * scaleX;
        const h = outputData[3 * numDetections + i] * scaleY;
        const angle = outputData[4 * numDetections + i];
        const classScore = outputData[5 * numDetections + i];
        
        const confidence = sigmoid(classScore);
        
        if (confidence > threshold) {
          const corners = computeOBBCorners(cx, cy, w, h, angle);
          detections.push({
            corners,
            center: { x: cx, y: cy },
            confidence,
            angle: angle * 180 / Math.PI
          });
        }
      }
    }
  }
  
  return detections;
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function computeOBBCorners(
  cx: number, 
  cy: number, 
  w: number, 
  h: number, 
  angle: number
): [Point, Point, Point, Point] {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  
  const hw = w / 2;
  const hh = h / 2;
  
  // Compute 4 corners relative to center, then rotate
  const corners: [Point, Point, Point, Point] = [
    { x: cx + (-hw * cos - (-hh) * sin), y: cy + (-hw * sin + (-hh) * cos) },
    { x: cx + (hw * cos - (-hh) * sin), y: cy + (hw * sin + (-hh) * cos) },
    { x: cx + (hw * cos - hh * sin), y: cy + (hw * sin + hh * cos) },
    { x: cx + (-hw * cos - hh * sin), y: cy + (-hw * sin + hh * cos) }
  ];
  
  return corners;
}

// ============================================
// Non-Maximum Suppression
// ============================================

function applyNMS(
  detections: RawOBBDetection[], 
  iouThreshold: number
): RawOBBDetection[] {
  if (detections.length === 0) return [];
  
  // Sort by confidence (descending)
  const sorted = [...detections].sort((a, b) => b.confidence - a.confidence);
  const kept: RawOBBDetection[] = [];
  
  while (sorted.length > 0) {
    const best = sorted.shift()!;
    kept.push(best);
    
    // Remove overlapping detections
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (computeIoU(best, sorted[i]) > iouThreshold) {
        sorted.splice(i, 1);
      }
    }
  }
  
  return kept;
}

function computeIoU(a: RawOBBDetection, b: RawOBBDetection): number {
  // Simplified IoU using center distance and size overlap
  const dist = Math.sqrt(
    Math.pow(a.center.x - b.center.x, 2) + 
    Math.pow(a.center.y - b.center.y, 2)
  );
  
  // Get approximate sizes
  const sizeA = getPolygonSize(a.corners);
  const sizeB = getPolygonSize(b.corners);
  const avgSize = (sizeA + sizeB) / 2;
  
  // If centers are close relative to size, consider overlapping
  if (dist < avgSize * 0.5) {
    return 1 - (dist / avgSize);
  }
  
  return 0;
}

function getPolygonSize(corners: Point[]): number {
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  
  for (const p of corners) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  
  return Math.sqrt((maxX - minX) * (maxY - minY));
}

// ============================================
// Tooth Numbering
// ============================================

/**
 * Assign FDI tooth numbers based on spatial position.
 * 
 * FDI Numbering System:
 * - Upper Right: 11-18 (center to back)
 * - Upper Left: 21-28 (center to back)
 * - Lower Left: 31-38 (center to back)
 * - Lower Right: 41-48 (center to back)
 * 
 * Since we detect from a front view, we assign based on:
 * 1. Y position (upper vs lower arch)
 * 2. X position (left to right from patient's perspective)
 */
function assignToothNumbers(
  detections: RawOBBDetection[],
  imageHeight: number
): ToothDetectionOBB[] {
  if (detections.length === 0) return [];
  
  // Determine mouth center line (midpoint of all Y values)
  const avgY = detections.reduce((sum, d) => sum + d.center.y, 0) / detections.length;
  
  // Separate into upper and lower arch
  const upperTeeth = detections.filter(d => d.center.y < avgY);
  const lowerTeeth = detections.filter(d => d.center.y >= avgY);
  
  // Sort each arch by X position (left to right in image = right to left for patient)
  // In a mirrored selfie view, image-left = patient-right
  upperTeeth.sort((a, b) => a.center.x - b.center.x);
  lowerTeeth.sort((a, b) => a.center.x - b.center.x);
  
  const result: ToothDetectionOBB[] = [];
  
  // Assign upper teeth (quadrants 1 and 2)
  // Image left side = Patient right (quadrant 1: 11-18)
  // Image right side = Patient left (quadrant 2: 21-28)
  const upperMidpoint = upperTeeth.length / 2;
  
  upperTeeth.forEach((det, idx) => {
    let toothNumber: string;
    
    if (idx < upperMidpoint) {
      // Right side of mouth (quadrant 1): 18, 17, 16... 11
      const posFromCenter = Math.floor(upperMidpoint) - idx;
      toothNumber = `1${Math.min(8, posFromCenter)}`;
    } else {
      // Left side of mouth (quadrant 2): 21, 22, 23... 28
      const posFromCenter = idx - Math.floor(upperMidpoint) + 1;
      toothNumber = `2${Math.min(8, posFromCenter)}`;
    }
    
    result.push({
      ...det,
      toothNumber,
      arch: 'upper',
      positionIndex: idx
    });
  });
  
  // Assign lower teeth (quadrants 4 and 3)
  // Image left = Patient right (quadrant 4: 41-48)
  // Image right = Patient left (quadrant 3: 31-38)
  const lowerMidpoint = lowerTeeth.length / 2;
  
  lowerTeeth.forEach((det, idx) => {
    let toothNumber: string;
    
    if (idx < lowerMidpoint) {
      // Right side of mouth (quadrant 4): 48, 47, 46... 41
      const posFromCenter = Math.floor(lowerMidpoint) - idx;
      toothNumber = `4${Math.min(8, posFromCenter)}`;
    } else {
      // Left side of mouth (quadrant 3): 31, 32, 33... 38
      const posFromCenter = idx - Math.floor(lowerMidpoint) + 1;
      toothNumber = `3${Math.min(8, posFromCenter)}`;
    }
    
    result.push({
      ...det,
      toothNumber,
      arch: 'lower',
      positionIndex: idx
    });
  });
  
  return result;
}

// ============================================
// Utility
// ============================================

export function getPolygonCenter(corners: Point[]): Point {
  const x = corners.reduce((sum, p) => sum + p.x, 0) / corners.length;
  const y = corners.reduce((sum, p) => sum + p.y, 0) / corners.length;
  return { x, y };
}
