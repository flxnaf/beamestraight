import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { analyzeDentalArches } from './services/archAnalysis';
import { generateTreatmentPlan } from './services/treatmentPlan';
import { 
  saveCurrentSession, 
  loadCurrentSession, 
  generateSessionId,
  compressImageDataUrl 
} from './services/storage';
import { enableDiagnostics } from './utils/diagnostics';
import type { ScanSession, DentalAnalysis, TreatmentPlan } from './types/dental';
import { loadONNXModel, detectTeethONNX, isONNXReady } from './services/onnxInference';

// ⚙️ CONFIGURATION: Set to true to save API credits during development
const USE_FALLBACK_MODE = true; // Set to false to enable real AI generation

// Initialize Gemini AI (unused in fallback mode)
const _genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

// 🦷 LOCAL TOOTH DETECTION (ONNX - Runs in browser!)
const ONNX_MODEL_PATH = import.meta.env.VITE_ONNX_MODEL_PATH || '/models/teeth-detection.onnx';
const ENABLE_TOOTH_DETECTION = true; // Run tooth detection inference
const SHOW_TOOTH_OVERLAY = false; // 🚫 DISABLED: Model too buggy, set to true when model is stronger

// Roboflow API (fallback only - slower)
const ROBOFLOW_API_KEY = import.meta.env.VITE_ROBOFLOW_API_KEY || '';
const ROBOFLOW_MODEL_ID = import.meta.env.VITE_ROBOFLOW_MODEL_ID || '';
const USE_ROBOFLOW_FALLBACK = ROBOFLOW_API_KEY.length > 0 && ROBOFLOW_MODEL_ID.length > 0;

// Language state and translations
let currentLanguage = localStorage.getItem('beame-language') || 'en';

const translations: Record<string, Record<string, string>> = {
  en: {
    cameraStarting: 'Starting...',
    cameraActive: 'Active ✓',
    cameraDenied: 'Access Denied',
    faceDetected: 'Face Detected ✓',
    noFace: 'No Face Detected',
    mouthOpenTitle: 'VALID ✓',
    mouthOpenText: 'Perfect! Ready to capture',
    mouthClosedTitle: 'Open Your Mouth Wide',
    mouthClosedText: 'Show your teeth clearly',
    readyCapture: 'Ready to Capture ✓',
    openMouthWider: 'Open Mouth Wider',
    analyzingDental: 'Analyzing dental structure...',
    generatingPlan: 'Generating treatment plan...',
    savingSession: 'Saving session data...',
    preparingPlan: 'Preparing treatment plan...',
    eligibleTitle: '✓ Eligible for Treatment',
    reviewTitle: '⚠ Clinical Review Required',
    defaultMessage: 'Assessment complete.',
    months: 'months',
    aligners: 'aligners'
  },
  zh: {
    cameraStarting: '正在啟動...',
    cameraActive: '攝像頭已啟動 ✓',
    cameraDenied: '拒絕訪問攝像頭',
    faceDetected: '檢測到面部 ✓',
    noFace: '未檢測到面部',
    mouthOpenTitle: '有效 ✓',
    mouthOpenText: '太棒了！準備拍攝',
    mouthClosedTitle: '請張開嘴巴',
    mouthClosedText: '請清晰露出您的牙齒進行分析',
    readyCapture: '準備拍攝 ✓',
    openMouthWider: '請張大嘴巴',
    analyzingDental: '正在分析牙齒結構...',
    generatingPlan: '正在生成治療方案...',
    savingSession: '正在保存會話數據...',
    preparingPlan: '正在準備治療報告...',
    eligibleTitle: '✓ 符合治療條件',
    reviewTitle: '⚠ 需要臨床審核',
    defaultMessage: '評估完成。',
    months: '個月',
    aligners: '個牙套'
  }
};

function t(key: string): string {
  return translations[currentLanguage]?.[key] || key;
}

window.addEventListener('languageChanged', (e: any) => {
  currentLanguage = e.detail;
  // Trigger UI update for current state
  if (cameraStatus) cameraStatus.textContent = t('cameraActive');
  if (faceStatus) faceStatus.textContent = faceDetected ? t('faceDetected') : t('noFace');
  // Update analysis status label
  if (analysisStatus) {
    analysisStatus.textContent = mouthOpen ? t('readyCapture') : t('openMouthWider');
  }
});

// Types
interface AnalysisStep {
  step: string;
  duration: number;
}

// Cookie management
function setCookie(name: string, value: string, days: number = 365): void {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = "expires=" + date.toUTCString();
  document.cookie = `${name}=${value};${expires};path=/;SameSite=Strict`;
}

function getCookie(name: string): string | null {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

// DOM Elements
const captureBtn = document.getElementById('captureBtn') as HTMLButtonElement;
const webcamElement = document.getElementById('webcam') as HTMLVideoElement;
const canvasElement = document.getElementById('output') as HTMLCanvasElement;
const webcamSection = document.getElementById('webcamSection') as HTMLDivElement;
const resultsSection = document.getElementById('resultsSection') as HTMLDivElement;
const originalImage = document.getElementById('originalImage') as HTMLImageElement;
const straightenedImage = document.getElementById('straightenedImage') as HTMLImageElement;
const processingIndicator = document.getElementById('processingIndicator') as HTMLDivElement;
const analysisStep = document.getElementById('analysisStep') as HTMLParagraphElement;
const downloadBtn = document.getElementById('downloadBtn') as HTMLButtonElement;
const retryBtn = document.getElementById('retryBtn') as HTMLButtonElement;
// Status elements
const cameraStatus = document.getElementById('cameraStatus') as HTMLSpanElement;
const faceStatus = document.getElementById('faceStatus') as HTMLSpanElement;
const analysisStatus = document.getElementById('analysisStatus') as HTMLSpanElement;

// Treatment plan elements
const treatmentPlanSection = document.getElementById('treatmentPlanSection') as HTMLDivElement;
const eligibilityBadge = document.getElementById('eligibilityBadge') as HTMLDivElement;
const eligibilityStatus = document.getElementById('eligibilityStatus') as HTMLSpanElement;
const eligibilityMessage = document.getElementById('eligibilityMessage') as HTMLParagraphElement;
const treatmentDetails = document.getElementById('treatmentDetails') as HTMLDivElement;
const treatmentLength = document.getElementById('treatmentLength') as HTMLParagraphElement;
const stageCount = document.getElementById('stageCount') as HTMLParagraphElement;
const wearType = document.getElementById('wearType') as HTMLParagraphElement;
const correctionsList = document.getElementById('correctionsList') as HTMLDivElement;
const treatmentReasons = document.getElementById('treatmentReasons') as HTMLUListElement;
// Assessment elements (new 4-tier model)
const assessmentCaseChip = document.getElementById('assessmentCaseChip') as HTMLSpanElement;
const assessmentMeta = document.getElementById('assessmentMeta') as HTMLSpanElement;

// 4-stage capture (Tab 3) elements
const stageWebcam = document.getElementById('stageWebcam') as HTMLVideoElement;
const stageOverlay = document.getElementById('stageOverlay') as HTMLCanvasElement;
const stageCaptureBtn = document.getElementById('stageCaptureBtn') as HTMLButtonElement;
const stageRetakeBtn = document.getElementById('stageRetakeBtn') as HTMLButtonElement;
const stageCompleteBtn = document.getElementById('stageCompleteBtn') as HTMLButtonElement;
const stageStepEl = document.getElementById('stageStep') as HTMLSpanElement;
const stageTitleEl = document.getElementById('stageTitle') as HTMLHeadingElement;
const stageInstructionEl = document.getElementById('stageInstruction') as HTMLParagraphElement;
const stageReadyBadge = document.getElementById('stageReadyBadge') as HTMLDivElement;
const stageReadyText = document.getElementById('stageReadyText') as HTMLSpanElement;
const thumbBtns = [
  document.getElementById('thumb-0') as HTMLButtonElement,
  document.getElementById('thumb-1') as HTMLButtonElement,
  document.getElementById('thumb-2') as HTMLButtonElement,
  document.getElementById('thumb-3') as HTMLButtonElement
];
const thumbImgs = [
  document.getElementById('thumbImg-0') as HTMLImageElement,
  document.getElementById('thumbImg-1') as HTMLImageElement,
  document.getElementById('thumbImg-2') as HTMLImageElement,
  document.getElementById('thumbImg-3') as HTMLImageElement
];

// State
let camera: Camera | null = null;
let faceMesh: FaceMesh | null = null;
let isProcessing = false;
let faceDetected = false;
let mouthOpen = false;
let currentGenerationId = 0; // Track generation attempts
let currentLandmarks: any[] | null = null; // Store latest face landmarks
let currentSession: ScanSession | null = null;
let pendingDentalAnalysis: DentalAnalysis | null = null;
// 🦷 Tooth detection state (Roboflow ML model)
interface ToothDetection {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  class: string;
  toothNumber?: string;
}

let currentTeethDetections: ToothDetection[] = [];
let lastToothDetectionTime = 0;
const TOOTH_DETECTION_INTERVAL = 1000; // Run detection every 1000ms (reduced lag)
let isDetecting = false; // Prevent overlapping API calls

// Tab 3 (4-stage capture) state
type CaptureStageId = 'front_smile' | 'lower_front' | 'upper_front' | 'side_bite';
interface CaptureStageConfig {
  id: CaptureStageId;
  title: string;
  instruction: string;
}

const CAPTURE_STAGES: CaptureStageConfig[] = [
  {
    id: 'front_smile',
    title: 'Front Smile (Bite Down)',
    instruction: 'Gently bite on your back teeth and smile as wide as you can. Align your mouth within the green guides.'
  },
  {
    id: 'lower_front',
    title: 'Lower Front Teeth',
    instruction: 'Raise your phone, open your mouth wide, and clearly show your lower front teeth by pulling your lips away. Follow the green guides.'
  },
  {
    id: 'upper_front',
    title: 'Upper Front Teeth',
    instruction: 'Angle your phone downward, open wide, and clearly show your upper front teeth while keeping lips out of the way. Follow the green guides.'
  },
  {
    id: 'side_bite',
    title: 'Side Bite (Profile)',
    instruction: 'Turn your head to the side, bite evenly on your back teeth, and smile broadly. Use the green guides for positioning.'
  }
];

let stageCamera: Camera | null = null;
let stageFaceMesh: FaceMesh | null = null;
let stageCaptures: Array<string | null> = [null, null, null, null];
let activeStageIndex = 0;
let stageReady = false;
let stageLandmarks: any[] | null = null;
let stageTeethDetections: ToothDetection[] = [];
let stageIsDetecting = false;
let stageLastDetectTime = 0;

// Initialize MediaPipe Face Mesh
function initializeFaceMesh() {
  faceMesh = new FaceMesh({
    locateFile: (file) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
    }
  });

  faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });

  faceMesh.onResults(onFaceMeshResults);
}

// Check if mouth is open wide
function isMouthOpen(landmarks: any[]): boolean {
  // Upper lip center (13)
  // Lower lip center (14)
  const upperLip = landmarks[13];
  const lowerLip = landmarks[14];
  
  // Calculate vertical distance between upper and lower lip
  const mouthOpenDistance = Math.abs(lowerLip.y - upperLip.y);
  
  // Threshold for considering mouth as "open wide" (adjust as needed)
  const threshold = 0.04; // ~4% of face height
  
  return mouthOpenDistance > threshold;
}

// Note: Roboflow API detection removed - using local ONNX instead for browser-based inference

// Extract tooth number from class name (e.g., "tooth_11" -> "11")
function extractToothNumber(className: string): string {
  const match = className.match(/\d+/);
  return match ? match[0] : '';
}

// Filter detections to only show teeth within mouth region (reduce false positives)
function filterDetectionsInMouthRegion(
  detections: ToothDetection[], 
  landmarks: any[], 
  width: number, 
  height: number
): ToothDetection[] {
  // Get mouth bounding box from MediaPipe landmarks
  const mouthLandmarks = [
    61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, // Outer lips
    78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308,  // Upper teeth
    78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308   // Lower teeth
  ];

  // Calculate mouth bounding box with padding
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  
  mouthLandmarks.forEach(idx => {
    if (landmarks[idx]) {
      const x = landmarks[idx].x * width;
      const y = landmarks[idx].y * height;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  });

  // Add padding to mouth region (10% on each side)
  const padding = Math.max(maxX - minX, maxY - minY) * 0.1;
  minX -= padding;
  maxX += padding;
  minY -= padding;
  maxY += padding;

  // Filter detections: only keep teeth whose center is within mouth region
  return detections.filter(tooth => {
    const centerX = tooth.x + tooth.width / 2;
    const centerY = tooth.y + tooth.height / 2;
    
    const isInMouth = centerX >= minX && centerX <= maxX && 
                      centerY >= minY && centerY <= maxY;
    
    return isInMouth;
  });
}

// Draw tooth detections overlay (adapts to actual tooth sizes!)
function drawTeethDetections(ctx: CanvasRenderingContext2D, detections: ToothDetection[]) {
  if (detections.length === 0) return;

  detections.forEach((tooth) => {
    // Use ACTUAL tooth dimensions from detection (not fixed size!)
    const toothWidth = tooth.width;
    const toothHeight = tooth.height;
    
    // Calculate adaptive corner radius based on tooth size
    const radius = Math.min(toothWidth, toothHeight) * 0.15; // 15% of smaller dimension
    
    // Draw white highlight with slight transparency (SmileSet style)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = Math.max(2, toothWidth * 0.03); // Adaptive line width
    
    // Add glow effect (stronger for larger teeth)
    ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
    ctx.shadowBlur = Math.min(12, toothWidth * 0.15);
    
    // Draw rounded rectangle that matches tooth shape
    ctx.beginPath();
    ctx.moveTo(tooth.x + radius, tooth.y);
    ctx.lineTo(tooth.x + toothWidth - radius, tooth.y);
    ctx.quadraticCurveTo(tooth.x + toothWidth, tooth.y, tooth.x + toothWidth, tooth.y + radius);
    ctx.lineTo(tooth.x + toothWidth, tooth.y + toothHeight - radius);
    ctx.quadraticCurveTo(tooth.x + toothWidth, tooth.y + toothHeight, tooth.x + toothWidth - radius, tooth.y + toothHeight);
    ctx.lineTo(tooth.x + radius, tooth.y + toothHeight);
    ctx.quadraticCurveTo(tooth.x, tooth.y + toothHeight, tooth.x, tooth.y + toothHeight - radius);
    ctx.lineTo(tooth.x, tooth.y + radius);
    ctx.quadraticCurveTo(tooth.x, tooth.y, tooth.x + radius, tooth.y);
    ctx.closePath();
    
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // Draw tooth number with adaptive font size
    if (tooth.toothNumber) {
      const fontSize = Math.max(12, Math.min(18, toothHeight * 0.3)); // Scale with tooth
      ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 1)';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.lineWidth = fontSize * 0.2;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const textX = tooth.x + toothWidth / 2;
      const textY = tooth.y - fontSize * 0.8;
      
      // Draw text outline
      ctx.strokeText(tooth.toothNumber, textX, textY);
      ctx.fillText(tooth.toothNumber, textX, textY);
    }
    
    // Optional: Draw confidence score (for debugging) - scales with tooth
    if (tooth.confidence && toothWidth > 40) { // Only show if tooth is large enough
      const debugFontSize = Math.max(8, toothWidth * 0.15);
      ctx.font = `${debugFontSize}px monospace`;
      ctx.fillStyle = 'rgba(0, 206, 124, 0.8)';
      ctx.textAlign = 'left';
      ctx.fillText(`${Math.round(tooth.confidence * 100)}%`, tooth.x + 3, tooth.y + toothHeight - debugFontSize - 2);
    }
  });
  
  // 🐛 DEBUG: Draw detection statistics in top-right corner
  const avgConfidence = detections.length > 0 
    ? (detections.reduce((sum, d) => sum + d.confidence, 0) / detections.length * 100).toFixed(0)
    : '0';
  
  ctx.save();
  ctx.font = 'bold 16px monospace';
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.textAlign = 'right';
  ctx.fillRect(ctx.canvas.width - 220, 10, 210, 60);
  
  ctx.fillStyle = '#00ce7c';
  ctx.fillText(`🦷 Teeth: ${detections.length}`, ctx.canvas.width - 20, 35);
  ctx.fillText(`📊 Avg: ${avgConfidence}%`, ctx.canvas.width - 20, 55);
  ctx.restore();
}

// Draw clean mouth tracking overlay - professional and minimal
function drawCustomFaceMesh(ctx: CanvasRenderingContext2D, landmarks: any[], width: number, height: number) {
  // Get mouth center and size for focus area
  const upperLip = landmarks[13];
  const lowerLip = landmarks[14];
  const leftMouth = landmarks[61];
  const rightMouth = landmarks[291];
  
  if (!upperLip || !lowerLip || !leftMouth || !rightMouth) return;
  
  const mouthCenterX = (leftMouth.x + rightMouth.x) / 2 * width;
  const mouthCenterY = (upperLip.y + lowerLip.y) / 2 * height;
  const mouthWidth = Math.abs((rightMouth.x - leftMouth.x) * width);
  const mouthHeight = Math.abs((lowerLip.y - upperLip.y) * height);
  
  // Draw clean focus frame around mouth area
  const padding = 40;
  const frameX = mouthCenterX - mouthWidth / 2 - padding;
  const frameY = mouthCenterY - mouthHeight / 2 - padding;
  const frameWidth = mouthWidth + padding * 2;
  const frameHeight = mouthHeight + padding * 2;
  
  // Animated corner brackets
  ctx.strokeStyle = '#00ce7c';
  ctx.lineWidth = 3;
  ctx.shadowColor = '#00ce7c';
  ctx.shadowBlur = 5;
  
  const cornerSize = 20;
  const time = Date.now() / 1000;
  const pulse = Math.sin(time * 2) * 0.3 + 0.7; // Pulse between 0.4 and 1.0
  
  ctx.globalAlpha = pulse;
  
  // Top-left corner
  ctx.beginPath();
  ctx.moveTo(frameX + cornerSize, frameY);
  ctx.lineTo(frameX, frameY);
  ctx.lineTo(frameX, frameY + cornerSize);
  ctx.stroke();
  
  // Top-right corner
  ctx.beginPath();
  ctx.moveTo(frameX + frameWidth - cornerSize, frameY);
  ctx.lineTo(frameX + frameWidth, frameY);
  ctx.lineTo(frameX + frameWidth, frameY + cornerSize);
  ctx.stroke();
  
  // Bottom-left corner
  ctx.beginPath();
  ctx.moveTo(frameX, frameY + frameHeight - cornerSize);
  ctx.lineTo(frameX, frameY + frameHeight);
  ctx.lineTo(frameX + cornerSize, frameY + frameHeight);
  ctx.stroke();
  
  // Bottom-right corner
  ctx.beginPath();
  ctx.moveTo(frameX + frameWidth - cornerSize, frameY + frameHeight);
  ctx.lineTo(frameX + frameWidth, frameY + frameHeight);
  ctx.lineTo(frameX + frameWidth, frameY + frameHeight - cornerSize);
  ctx.stroke();
  
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  
  // Draw detailed mouth and teeth contours
  
  // 1. Outer lip contour (thicker, more prominent)
  ctx.strokeStyle = 'rgba(0, 206, 124, 0.8)';
  ctx.lineWidth = 2.5;
  const mouthOuter = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291];
  ctx.beginPath();
  for (let i = 0; i < mouthOuter.length; i++) {
    const idx = mouthOuter[i];
    if (landmarks[idx]) {
      const x = landmarks[idx].x * width;
      const y = landmarks[idx].y * height;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
  }
  ctx.stroke();
  
  // 2. Upper lip inner edge (teeth line - upper)
  ctx.strokeStyle = 'rgba(0, 206, 124, 0.6)';
  ctx.lineWidth = 2;
  const upperTeeth = [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308];
  ctx.beginPath();
  for (let i = 0; i < upperTeeth.length; i++) {
    const idx = upperTeeth[i];
    if (landmarks[idx]) {
      const x = landmarks[idx].x * width;
      const y = landmarks[idx].y * height;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
  }
  ctx.stroke();
  
  // 3. Lower lip inner edge (teeth line - lower)
  ctx.strokeStyle = 'rgba(0, 206, 124, 0.6)';
  ctx.lineWidth = 2;
  const lowerTeeth = [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308];
  ctx.beginPath();
  for (let i = 0; i < lowerTeeth.length; i++) {
    const idx = lowerTeeth[i];
    if (landmarks[idx]) {
      const x = landmarks[idx].x * width;
      const y = landmarks[idx].y * height;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
  }
  ctx.stroke();
  
  // 4. Upper and lower lip midline
  ctx.strokeStyle = 'rgba(0, 206, 124, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([3, 3]);
  
  // Upper lip line
  if (landmarks[13]) {
    const centerX = landmarks[13].x * width;
    const centerY = landmarks[13].y * height;
    ctx.beginPath();
    ctx.moveTo(centerX - 15, centerY);
    ctx.lineTo(centerX + 15, centerY);
    ctx.stroke();
  }
  
  // Lower lip line
  if (landmarks[14]) {
    const centerX = landmarks[14].x * width;
    const centerY = landmarks[14].y * height;
    ctx.beginPath();
    ctx.moveTo(centerX - 15, centerY);
    ctx.lineTo(centerX + 15, centerY);
    ctx.stroke();
  }
  
  ctx.setLineDash([]);
  
  // Clean scan line
  const scanY = mouthCenterY;
  ctx.strokeStyle = 'rgba(0, 206, 124, 0.2)';
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(frameX, scanY);
  ctx.lineTo(frameX + frameWidth, scanY);
  ctx.stroke();
  ctx.setLineDash([]);
}

// Handle Face Mesh results
function onFaceMeshResults(results: any) {
  const canvasCtx = canvasElement.getContext('2d')!;
  
  canvasElement.width = webcamElement.videoWidth;
  canvasElement.height = webcamElement.videoHeight;

  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
    faceDetected = true;
    faceStatus.textContent = t('faceDetected');
    faceStatus.style.color = '#00ce7c';
    
    const landmarks = results.multiFaceLandmarks[0];
    
    // Store landmarks for analysis
    currentLandmarks = landmarks;
    
    // Check if mouth is open
    mouthOpen = isMouthOpen(landmarks);
    
    // Show instruction overlay
    if (!isProcessing) {
      if (mouthOpen) {
        analysisStatus.parentElement?.classList.remove('not-ready');
        analysisStatus.parentElement?.classList.add('ready');
        analysisStatus.textContent = t('readyCapture');
        captureBtn.disabled = false;
      } else {
        analysisStatus.parentElement?.classList.remove('ready');
        analysisStatus.parentElement?.classList.add('not-ready');
        analysisStatus.textContent = t('openMouthWider');
        captureBtn.disabled = true;
      }
    }
    
    // Draw custom Beame face mesh
    drawCustomFaceMesh(canvasCtx, landmarks, canvasElement.width, canvasElement.height);

    // 🦷 Run tooth detection (LOCAL ONNX - Browser-based, MediaPipe speed!)
    const now = Date.now();
    const detectionInterval = 33; // 30 FPS - Same as MediaPipe!
    
    if (ENABLE_TOOTH_DETECTION && mouthOpen && !isDetecting && now - lastToothDetectionTime > detectionInterval) {
      lastToothDetectionTime = now;
      isDetecting = true;
      
      if (isONNXReady()) {
        // ⚡ LOCAL BROWSER INFERENCE - No API calls!
        const imageData = canvasCtx.getImageData(0, 0, canvasElement.width, canvasElement.height);
        detectTeethONNX(imageData)
          .then(detections => {
            // Convert ONNX detections to our format
            const converted = detections.map(d => ({
              x: d.x,
              y: d.y,
              width: d.width,
              height: d.height,
              confidence: d.confidence,
              class: d.class,
              toothNumber: extractToothNumber(d.class)
            }));
            
            // 🐛 DEBUG: Log raw detections
            console.log(`🦷 RAW DETECTIONS: ${converted.length} teeth detected`);
            if (converted.length > 50) {
              console.warn(`⚠️ WARNING: Too many detections (${converted.length})! Model is undertrained.`);
              console.warn(`   This causes lag. Need 20+ epochs for better accuracy.`);
            }
            if (converted.length > 0) {
              const avgConf = (converted.reduce((sum, d) => sum + d.confidence, 0) / converted.length * 100).toFixed(1);
              const confidences = converted.map(d => (d.confidence * 100).toFixed(0) + '%').join(', ');
              console.log(`   Average confidence: ${avgConf}%`);
              console.log(`   All confidences: [${confidences}]`);
            }
            
            // Filter to mouth region
            const filteredDetections = filterDetectionsInMouthRegion(converted, landmarks, canvasElement.width, canvasElement.height);
            
            // 🐛 DEBUG: Log filtered detections
            console.log(`✅ FILTERED: ${filteredDetections.length} teeth (removed ${converted.length - filteredDetections.length} false positives)`);
            
            currentTeethDetections = filteredDetections;
            isDetecting = false;
          })
          .catch(err => {
            console.error('ONNX detection error:', err);
            isDetecting = false;
          });
      } else {
        // Model not loaded yet
        isDetecting = false;
      }
    }

    // Draw tooth detections if available
    if (currentTeethDetections.length > 0) {
      // Only draw tooth overlay if enabled (model needs to be stronger first)
      if (SHOW_TOOTH_OVERLAY) {
        drawTeethDetections(canvasCtx, currentTeethDetections);
      }
    }

    // Clear detections when mouth closes (prevent stale overlay)
    if (!mouthOpen && currentTeethDetections.length > 0) {
      currentTeethDetections = [];
    }
  } else {
    faceDetected = false;
    mouthOpen = false;
    currentLandmarks = null;
    currentTeethDetections = []; // Clear tooth detections
    faceStatus.textContent = t('noFace');
    faceStatus.style.color = '#ef4444';
    
    // Reset analysis status
    analysisStatus.parentElement?.classList.remove('ready', 'not-ready');
    analysisStatus.textContent = t('openMouthWider');
    
    captureBtn.disabled = true;
  }

  canvasCtx.restore();
}

// Start camera
async function startCamera(): Promise<boolean> {
  try {
    cameraStatus.textContent = t('cameraStarting');
    
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 1280, height: 720 }
    });
    
    webcamElement.srcObject = stream;
    
    await new Promise((resolve) => {
      webcamElement.onloadedmetadata = () => {
        resolve(true);
      };
    });

    initializeFaceMesh();

    camera = new Camera(webcamElement, {
      onFrame: async () => {
        if (faceMesh) {
          await faceMesh.send({ image: webcamElement });
        }
      },
      width: 1280,
      height: 720
    });

    await camera.start();

    cameraStatus.textContent = t('cameraActive');
    cameraStatus.style.color = '#00ce7c';
    captureBtn.disabled = true; // Initially disabled until mouth is open
    
    // Set initial alignment status color
    analysisStatus.parentElement?.classList.add('not-ready');
    analysisStatus.textContent = t('openMouthWider');

    // Set cookie to remember camera permission was granted
    setCookie('beame_camera_allowed', 'true', 365);
    
    return true;
  } catch (error) {
    console.error('Error starting camera:', error);
    cameraStatus.textContent = t('cameraDenied');
    cameraStatus.style.color = '#ef4444';
    
    // Don't show alert on first auto-attempt
    const hasPrompted = getCookie('beame_camera_prompted');
    if (hasPrompted) {
      alert(currentLanguage === 'en' ? 'Failed to access camera. Please ensure camera permissions are granted.' : '無法訪問攝像頭。請確保已授予攝像頭權限。');
    }
    
    return false;
  }
}

// Simulate analysis steps
async function simulateAnalysis(): Promise<void> {
  const steps: AnalysisStep[] = [
    { step: 'Detecting facial landmarks...', duration: 800 },
    { step: 'Analyzing jaw structure...', duration: 1000 },
    { step: 'Mapping tooth positions...', duration: 900 },
    { step: 'Calculating optimal alignment...', duration: 1100 },
    { step: 'Generating straightened image...', duration: 1200 },
    { step: 'Applying Beame enhancement...', duration: 800 },
    { step: 'Finalizing results...', duration: 600 }
  ];

  for (const { step, duration } of steps) {
    analysisStep.textContent = step;
    await new Promise(resolve => setTimeout(resolve, duration));
  }
}

// Capture photo and process
async function capturePhoto() {
  console.log('📸 [DEBUG] capturePhoto function called');
  
  // Check if camera is running, if not, try to start it
  if (!camera) {
    console.log('📹 [DEBUG] Camera not running, attempting to start...');
    const started = await startCamera();
    if (!started) {
      alert('Camera access is required to capture your photo. Please allow camera permissions and try again.');
      return;
    }
    // Give camera a moment to initialize
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  if (isProcessing) {
    console.log('⚠️ [DEBUG] Already processing, ignoring capture request');
    return;
  }
  
  if (!faceDetected) {
    console.log('⚠️ [DEBUG] No face detected');
    alert('Please ensure your face is clearly visible in the camera.');
    return;
  }
  
  if (!mouthOpen) {
    console.log('⚠️ [DEBUG] Mouth not open');
    alert('Please open your mouth wide to show your teeth clearly.');
    return;
  }

  console.log('✅ [DEBUG] Starting capture process...');
  isProcessing = true;
  
  // Increment generation ID to cancel any previous in-flight requests
  currentGenerationId++;
  const thisGenerationId = currentGenerationId;
  console.log(`🆔 [DEBUG] New generation ID: ${thisGenerationId}`);
  
  captureBtn.disabled = true;

  // Capture from canvas WITH face mesh for display (original image)
  const originalImageWithMesh = canvasElement.toDataURL('image/png');
  console.log('📷 [DEBUG] Captured image WITH face mesh for display');
  originalImage.src = originalImageWithMesh;
  
  // Capture clean frame from video WITHOUT mesh for AI processing
  const captureCanvas = document.createElement('canvas');
  const captureCtx = captureCanvas.getContext('2d')!;
  captureCanvas.width = webcamElement.videoWidth;
  captureCanvas.height = webcamElement.videoHeight;
  captureCtx.drawImage(webcamElement, 0, 0, captureCanvas.width, captureCanvas.height);
  
  const cleanImageDataUrl = captureCanvas.toDataURL('image/png');
  console.log('📷 [DEBUG] Captured CLEAN image for AI processing (no overlay). Data URL length:', cleanImageDataUrl.length);
  console.log('📷 [DEBUG] Original display shows face mesh, AI gets clean image');

  // Show results section
  webcamSection.style.display = 'none';
  resultsSection.style.display = 'block';
  processingIndicator.style.display = 'flex';
  straightenedImage.style.display = 'none';
  
  // Keep step 1 active during processing
  updateProgressSteps(1);
  
  // Smooth scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });

  console.log('⏳ [DEBUG] Starting analysis simulation...');
  // Simulate analysis
  await simulateAnalysis();

  console.log('🤖 [DEBUG] Starting AI generation and dental analysis in parallel...');
  console.log('🤖 [DEBUG] Passing CLEAN image data to generateStraightenedImage (no mesh)');
  
  // Run AI image generation AND dental analysis in parallel for faster results
  const analysisPromises: Promise<void>[] = [
    generateStraightenedImage(cleanImageDataUrl, thisGenerationId)
  ];
  
  // Add dental analysis if we have landmarks
  if (currentLandmarks) {
    console.log('✅ [DEBUG] Landmarks available, adding dental analysis to parallel queue');
    console.log('📊 [DEBUG] Will call performDentalAnalysis with:', {
      hasCleanImage: !!cleanImageDataUrl,
      hasOriginalImage: !!originalImageWithMesh,
      landmarksCount: currentLandmarks.length
    });
    
    analysisPromises.push(
      performDentalAnalysis(cleanImageDataUrl, originalImageWithMesh).catch(error => {
        console.error('❌ [DEBUG] Dental analysis failed:', error);
        console.error('Stack trace:', error);
        // Don't block the UI - just log the error
      })
    );
  } else {
    console.warn('⚠️ [DEBUG] No landmarks available for dental analysis. Treatment plan will not be shown.');
  }
  
  // Wait for all parallel operations to complete
  await Promise.all(analysisPromises);
  console.log('✅ [DEBUG] All parallel operations completed');

  processingIndicator.style.display = 'none';
  straightenedImage.style.display = 'block';
  downloadBtn.style.display = 'inline-block';
  
  isProcessing = false;
  console.log('✨ [DEBUG] Capture process complete!');
  console.log('🔍 [DEBUG] Final check - originalImage.src length (with mesh):', originalImage.src.length);
  console.log('🔍 [DEBUG] Final check - straightenedImage.src length:', straightenedImage.src.length);
  console.log('🔍 [DEBUG] Original shows face mesh, result shows clean AI-straightened teeth');
}

// Generate straightened image with Beame logo using Gemini AI
async function generateStraightenedImage(originalDataUrl: string, generationId: number): Promise<void> {
  console.log(`🚀 [DEBUG] Starting generateStraightenedImage function (ID: ${generationId})`);
  
  // Check if fallback mode is enabled
  if (USE_FALLBACK_MODE) {
    console.log('💰 [FALLBACK] Fallback mode enabled - skipping AI to save credits');
    await new Promise(resolve => setTimeout(resolve, 1000));
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      ctx.font = 'bold 40px Arial';
      ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
      ctx.textAlign = 'center';
      ctx.fillText('FALLBACK MODE', canvas.width / 2, 50);
      ctx.font = '20px Arial';
      ctx.fillText('(AI Disabled - Testing Only)', canvas.width / 2, 85);
      straightenedImage.src = canvas.toDataURL('image/png');
    };
    img.src = originalDataUrl;
    return;
  }
  
  // ORIGINAL CODE BELOW (DISABLED)
  /*
  try {
    // Check if API key is configured
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    console.log('🔑 [DEBUG] API Key status:', apiKey ? `Configured (${apiKey.substring(0, 10)}...)` : 'NOT CONFIGURED');
    
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      console.warn('⚠️ [DEBUG] Gemini API key not configured. Using fallback method.');
      if (generationId === currentGenerationId) {
        await generateStraightenedImageOld(originalDataUrl);
      } else {
        console.log(`🚫 [DEBUG] Generation ${generationId} cancelled (current: ${currentGenerationId})`);
      }
      return;
    }

    // Convert data URL to base64 (remove the data:image/png;base64, prefix)
    const base64Data = originalDataUrl.split(',')[1];
    console.log('📸 [DEBUG] Image data prepared. Base64 length:', base64Data.length);
    
    // Array of models to try in order
    const modelsToTry = [
      { name: 'gemini-2.5-flash-image', description: 'Image generation specialist (Nano Banana)' },
      { name: 'gemini-2.0-flash-exp', description: 'Experimental with image generation' },
      { name: 'imagen-3.0-generate-001', description: 'Imagen 3.0 direct' }
    ];
    
      // Create the prompt for teeth straightening
      const prompt = `MANDATORY TEETH STRAIGHTENING - YOU MUST MAKE SIGNIFICANT VISIBLE CHANGES

YOUR TASK: Transform the teeth in this image to be perfectly straight, aligned, and symmetric. This is a dental orthodontic simulation showing the result AFTER braces treatment.

TEETH MODIFICATIONS REQUIRED (BE AGGRESSIVE):
1. Straighten ALL visible teeth - make them perfectly vertical and aligned
2. Rotate any angled/tilted teeth to face directly forward
3. Close gaps between teeth completely
4. Align teeth into a perfect smooth arch (both upper and lower)
5. Make all teeth the same height and uniformly spaced
6. Correct overbite/underbite - align upper and lower teeth properly
7. Fix crooked teeth at ANY angle (front view, side view, any perspective)
8. Ensure teeth form a perfect Hollywood smile shape
9. Make the teeth alignment dramatically better than the original
10. Apply orthodontic corrections aggressively - this should look like AFTER years of braces

CRITICAL - PRESERVE NATURAL APPEARANCE:
✓ Keep EXACT original tooth COLOR - no whitening, keep yellow/cream tones, stains, and natural discoloration
✓ Keep tooth surface texture - natural enamel with imperfections, NOT porcelain veneers
✓ Keep ALL skin texture - visible pores, wrinkles, fine lines, blemishes, freckles, moles
✓ Keep skin tone and complexion EXACTLY as original - no smoothing or beauty filters
✓ Keep facial asymmetry and natural imperfections
✓ Keep original lighting, shadows, and highlights unchanged
✓ Preserve any skin conditions, acne, scars, or texture

DO NOT MODIFY (CRITICAL):
❌ NO teeth whitening - teeth color must stay EXACTLY the same
❌ NO teeth bleaching - keep natural yellow/cream tones
❌ NO skin smoothing or blur
❌ NO beauty filters or enhancements
❌ NO blemish removal
❌ NO wrinkle reduction
❌ NO pore reduction
❌ NO skin tone evening
❌ NO lighting enhancement
❌ Face shape, structure, proportions must be identical
❌ Facial features (eyes, nose, ears, chin, forehead) untouched
❌ Lips shape and size unchanged (only teeth inside should change)
❌ Hair, clothing, background unchanged
❌ Person's identity and appearance unchanged
❌ Facial expressions unchanged

IMPORTANT FOR ALL ANGLES:
- Works for front-facing, side profiles, 3/4 angles, any perspective
- Straighten teeth regardless of camera angle or head position
- Apply aggressive corrections even if teeth look slightly straight already
- The result should be noticeably more perfect than the input

CRITICAL: ONLY change teeth ALIGNMENT (position/straightness). Everything else including tooth COLOR and skin TEXTURE must remain 100% identical to the original. This is ORTHODONTIC correction, NOT cosmetic enhancement.`;

    // Try each model in sequence
    for (let i = 0; i < modelsToTry.length; i++) {
      // Check if this generation has been cancelled
      if (generationId !== currentGenerationId) {
        console.log(`🚫 [DEBUG] Generation ${generationId} cancelled before model ${i + 1} (current: ${currentGenerationId})`);
        return;
      }
      
      const modelInfo = modelsToTry[i];
      console.log(`🤖 [DEBUG] Attempt ${i + 1}/${modelsToTry.length}: Trying model "${modelInfo.name}" (${modelInfo.description})`);
      
      try {
        const model = genAI.getGenerativeModel({ model: modelInfo.name });
        
        console.log('📝 [DEBUG] Sending request to Gemini API...');
        console.log('⏳ [DEBUG] This may take 10-30 seconds...');

        // Generate content with image
        const result = await model.generateContent([
          prompt,
          {
            inlineData: {
              mimeType: 'image/png',
              data: base64Data
            }
          }
        ]);

        // Check again after async operation
        if (generationId !== currentGenerationId) {
          console.log(`🚫 [DEBUG] Generation ${generationId} cancelled after API call (current: ${currentGenerationId})`);
          return;
        }

        console.log(`✅ [DEBUG] Received response from ${modelInfo.name}`);
        const response = await result.response;
        console.log('📦 [DEBUG] Response object:', response);
        console.log('📊 [DEBUG] Response candidates:', response.candidates);
        
        // Check if response contains image data
        let imageGenerated = false;
        const parts = response.candidates?.[0]?.content?.parts || [];
        console.log('🔍 [DEBUG] Number of parts in response:', parts.length);
        
        for (let j = 0; j < parts.length; j++) {
          const part = parts[j];
          console.log(`🔍 [DEBUG] Part ${j}:`, {
            hasInlineData: !!part.inlineData,
            hasText: !!part.text,
            keys: Object.keys(part)
          });
          
          if (part.inlineData) {
            console.log('🎨 [DEBUG] Found image data in response!');
            // Convert the generated image to displayable format
            const generatedImageData = part.inlineData.data;
            const mimeType = part.inlineData.mimeType || 'image/png';
            
            console.log('🖼️ [DEBUG] Generated image details:', {
              mimeType,
              dataLength: generatedImageData.length
            });
            
            // Check if the generated image is different from the original
            const originalLength = base64Data.length;
            const generatedLength = generatedImageData.length;
            const sizeDifference = Math.abs(generatedLength - originalLength);
            const percentDifference = (sizeDifference / originalLength) * 100;
            
            console.log('🔍 [DEBUG] Image comparison:', {
              originalSize: originalLength,
              generatedSize: generatedLength,
              difference: sizeDifference,
              percentDifference: `${percentDifference.toFixed(2)}%`,
              likelyModified: percentDifference > 1
            });
            
            if (percentDifference < 1) {
              console.warn('⚠️ [DEBUG] WARNING: Generated image size is very similar to original. AI may not have edited the image significantly.');
            }
            
            // Create data URL from generated image
            const generatedDataUrl = `data:${mimeType};base64,${generatedImageData}`;
            
            console.log('🔍 [DEBUG] Data URL comparison:');
            console.log('  Original first 100 chars:', originalDataUrl.substring(0, 100));
            console.log('  Generated first 100 chars:', generatedDataUrl.substring(0, 100));
            console.log('  Are they identical?', originalDataUrl === generatedDataUrl);
            
            console.log('🏷️ [DEBUG] Adding Beame branding...');
            // Add Beame branding to the generated image
            const brandedImage = await addBeameBranding(generatedDataUrl);
            
            // Final check before setting image
            if (generationId !== currentGenerationId) {
              console.log(`🚫 [DEBUG] Generation ${generationId} cancelled before displaying (current: ${currentGenerationId})`);
              return;
            }
            
            console.log('🎯 [DEBUG] Setting straightenedImage.src to branded AI image');
            console.log('  Branded image length:', brandedImage.length);
            straightenedImage.src = brandedImage;
            imageGenerated = true;
            console.log(`✨ [DEBUG] Successfully generated image using ${modelInfo.name}!`);
            return; // Success! Exit the function
          } else if (part.text) {
            console.log('💬 [DEBUG] Text response:', part.text.substring(0, 200));
          }
        }
        
        if (!imageGenerated) {
          console.warn(`⚠️ [DEBUG] ${modelInfo.name} did not generate an image. Trying next model...`);
          // Continue to next model
        }
        
      } catch (modelError) {
        console.warn(`⚠️ [DEBUG] ${modelInfo.name} failed:`, modelError instanceof Error ? modelError.message : 'Unknown error');
        
        // Check if this is a quota error
        if (modelError instanceof Error && modelError.message.includes('429')) {
          console.log(`⏭️ [DEBUG] Quota exceeded for ${modelInfo.name}. Trying next model...`);
        } else if (modelError instanceof Error && modelError.message.includes('404')) {
          console.log(`⏭️ [DEBUG] ${modelInfo.name} not found. Trying next model...`);
        } else {
          console.log(`⏭️ [DEBUG] ${modelInfo.name} error. Trying next model...`);
        }
        
        // Continue to next model if this isn't the last one
        if (i < modelsToTry.length - 1) {
          continue;
        }
      }
    }
    
    // If we get here, all models failed
    console.warn('⚠️ [DEBUG] All Gemini models failed or did not generate images. Using fallback method.');
    if (generationId === currentGenerationId) {
      await generateStraightenedImageOld(originalDataUrl);
    } else {
      console.log(`🚫 [DEBUG] Generation ${generationId} cancelled at fallback (current: ${currentGenerationId})`);
    }
    
  } catch (error) {
    console.error('❌ [DEBUG] Unexpected error in generateStraightenedImage:', error);
    console.error('🔍 [DEBUG] Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    // Fallback to old method if API fails
    console.log('🔄 [DEBUG] Falling back to old method...');
    if (generationId === currentGenerationId) {
      await generateStraightenedImageOld(originalDataUrl);
    } else {
      console.log(`🚫 [DEBUG] Generation ${generationId} cancelled at error fallback (current: ${currentGenerationId})`);
    }
  }
  */
}

// Add Beame branding to generated image
async function addBeameBranding(imageDataUrl: string): Promise<string> {
  console.log('🏷️ [DEBUG] addBeameBranding started');
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  // Load the AI-generated image
  const img = new Image();
  await new Promise((resolve) => {
    img.onload = resolve;
    img.src = imageDataUrl;
  });

  console.log('🖼️ [DEBUG] AI image loaded. Dimensions:', img.width, 'x', img.height);
  canvas.width = img.width;
  canvas.height = img.height;
  
  // Draw the AI-generated image
  ctx.drawImage(img, 0, 0);

  // Add Beame logo
  const logoSize = Math.min(canvas.width, canvas.height) * 0.1;
  ctx.font = `bold ${logoSize}px Arial`;
  
  const padding = 20;
  
  // Add a subtle rectangle behind the logo
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  const textMetrics = ctx.measureText('BEAME');
  ctx.fillRect(
    canvas.width - textMetrics.width - padding - 10,
    canvas.height - logoSize - padding - 5,
    textMetrics.width + 20,
    logoSize + 10
  );
  
  // Draw the logo text
  ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText('BEAME', canvas.width - padding, canvas.height - padding);

  console.log('✅ [DEBUG] Beame branding added successfully');
  return canvas.toDataURL('image/png');
}

// OLD CODE: Original canvas-based image generation (kept as fallback)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function _generateStraightenedImageOld(originalDataUrl: string): Promise<void> { // Disabled for fallback mode
  console.log('🔄 [DEBUG] Using fallback canvas-based image generation (old method)');
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  // Load original image
  const img = new Image();
  await new Promise((resolve) => {
    img.onload = resolve;
    img.src = originalDataUrl;
  });

  console.log('📐 [DEBUG] Original image dimensions:', img.width, 'x', img.height);
  canvas.width = img.width;
  canvas.height = img.height;
  
  // Draw original image (in production, this would be the AI-processed result)
  ctx.drawImage(img, 0, 0);

  // Add some visual enhancement (brightness/contrast to simulate "straightening")
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = 1.0;

  // Add Beame logo (using text as placeholder for now)
  const logoSize = Math.min(canvas.width, canvas.height) * 0.1;
  ctx.font = `bold ${logoSize}px Arial`;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  
  const padding = 20;
  ctx.fillText('BEAME', canvas.width - padding, canvas.height - padding);
  
  // Add a subtle rectangle behind the logo
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  const textMetrics = ctx.measureText('BEAME');
  ctx.fillRect(
    canvas.width - textMetrics.width - padding - 10,
    canvas.height - logoSize - padding - 5,
    textMetrics.width + 20,
    logoSize + 10
  );
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.fillText('BEAME', canvas.width - padding, canvas.height - padding);

  // Set result image
  straightenedImage.src = canvas.toDataURL('image/png');
  console.log('✅ [DEBUG] Fallback method completed successfully');
}

// Classify dental case using Gemini AI (returns one of: MILD, MODERATE, COMPLEX, URGENT)
async function classifyDentalCase(imageDataUrl: string): Promise<'MILD' | 'MODERATE' | 'COMPLEX' | 'URGENT'> {
  console.log('🤖 [CLASSIFY] Starting AI case classification...');
  
  // Check if API key is configured
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.warn('⚠️ [CLASSIFY] Gemini API key not configured. Using fallback classification.');
    // Fallback: return MODERATE as a safe default
    return 'MODERATE';
  }

  try {
    const base64Data = imageDataUrl.split(',')[1];
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `You are a dental AI assistant. Analyze this photo of teeth and classify the case into EXACTLY ONE of these 4 categories:

**MILD**: Minor crowding, spacing, or rotation. Minimal bite issues. Good aligner candidate.
**MODERATE**: Moderate crowding/rotation/spacing. May show some bite concerns. Needs orthodontic plan.
**COMPLEX**: Severe crowding, significant bite problems (overbite/underbite/crossbite), or advanced misalignment. May need braces or complex treatment.
**URGENT**: Signs of infection, trauma, severe swelling, bleeding, broken teeth, or other urgent dental concerns requiring immediate professional care.

CRITICAL INSTRUCTIONS:
- Respond with ONLY ONE WORD: either "MILD" or "MODERATE" or "COMPLEX" or "URGENT"
- Do NOT add any explanation, punctuation, or extra text
- If unsure between two categories, choose the MORE CONSERVATIVE (higher severity) option

Your response:`;

    console.log('📤 [CLASSIFY] Sending image to Gemini...');
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: 'image/png',
          data: base64Data
        }
      }
    ]);

    const response = await result.response;
    const text = response.text().trim().toUpperCase();
    
    console.log('📥 [CLASSIFY] Raw Gemini response:', text);

    // Extract the classification from response
    if (text.includes('URGENT')) {
      console.log('✅ [CLASSIFY] Classification: URGENT');
      return 'URGENT';
    } else if (text.includes('COMPLEX')) {
      console.log('✅ [CLASSIFY] Classification: COMPLEX');
      return 'COMPLEX';
    } else if (text.includes('MODERATE')) {
      console.log('✅ [CLASSIFY] Classification: MODERATE');
      return 'MODERATE';
    } else if (text.includes('MILD')) {
      console.log('✅ [CLASSIFY] Classification: MILD');
      return 'MILD';
    } else {
      console.warn('⚠️ [CLASSIFY] Could not parse classification from response. Defaulting to MODERATE.');
      return 'MODERATE';
    }
  } catch (error) {
    console.error('❌ [CLASSIFY] Gemini classification failed:', error);
    console.log('🔄 [CLASSIFY] Falling back to MODERATE classification');
    return 'MODERATE';
  }
}

// Display AI case classification in UI
function displayCaseClassification(classification: 'MILD' | 'MODERATE' | 'COMPLEX' | 'URGENT'): void {
  console.log('🎨 [UI] Displaying case classification:', classification);
  
  const assessmentSection = document.getElementById('aiAssessmentSection');
  const chip = document.getElementById('assessmentCaseChip');
  const cards = document.querySelectorAll('.case-card');
  const targetCard = document.getElementById(`caseCard-${classification}`);

  if (!chip || !targetCard || !assessmentSection) {
    console.error('❌ [UI] Could not find classification UI elements');
    return;
  }

  // Show the AI Assessment section
  assessmentSection.style.display = 'block';

  // Update chip styling and text
  chip.className = 'case-chip';
  
  const chipLabels = {
    en: {
      MILD: 'Mild Case',
      MODERATE: 'Moderate Case',
      COMPLEX: 'Complex Case',
      URGENT: 'Urgent Case'
    },
    zh: {
      MILD: '輕度個案',
      MODERATE: '中度個案',
      COMPLEX: '複雜個案',
      URGENT: '緊急個案'
    }
  };

  const label = chipLabels[currentLanguage as keyof typeof chipLabels][classification];
  chip.textContent = label;
  chip.setAttribute('data-en', chipLabels.en[classification]);
  chip.setAttribute('data-zh', chipLabels.zh[classification]);

  // Hide all cards
  cards.forEach(card => card.classList.remove('active'));
  
  // Show the matching card
  targetCard.classList.add('active');
  
  console.log('✅ [UI] Case classification displayed successfully');
}

// Perform dental analysis and treatment planning
async function performDentalAnalysis(cleanImageUrl: string, originalImageUrl: string): Promise<void> {
  if (!currentLandmarks) return;

  try {
    analysisStep.textContent = t('analyzingDental');
    
    const dentalAnalysis: DentalAnalysis = analyzeDentalArches(currentLandmarks);
    
    // Run AI case classification in parallel with treatment plan generation
    console.log('🔀 [DEBUG] Starting parallel: AI classification + treatment plan');
    const [caseClassification, treatmentPlan] = await Promise.all([
      classifyDentalCase(cleanImageUrl),
      Promise.resolve(generateTreatmentPlan(dentalAnalysis))
    ]);
    
    console.log('✅ [DEBUG] AI Classification result:', caseClassification);
    
    // Display the AI case classification
    displayCaseClassification(caseClassification);

    analysisStep.textContent = t('savingSession');
    const compressedOriginal = await compressImageDataUrl(originalImageUrl);
    const compressedPreview = await compressImageDataUrl(straightenedImage.src);

    const sessionId = generateSessionId();
    currentSession = {
      id: sessionId,
      timestamp: Date.now(),
      originalImageUrl: compressedOriginal,
      previewImageUrl: compressedPreview,
      dentalAnalysis,
      treatmentPlan,
      status: treatmentPlan.eligibility === 'reject' ? 'rejected' : 'pending'
    };

    saveCurrentSession(currentSession);
    
    analysisStep.textContent = t('preparingPlan');
    displayTreatmentPlan(treatmentPlan);

    pendingDentalAnalysis = dentalAnalysis;
    
    const tab3dBtn = document.getElementById('3dTabBtn') as HTMLButtonElement;
    if (tab3dBtn) {
      tab3dBtn.disabled = false;
      tab3dBtn.classList.remove('disabled');
    }
    
    updateProgressSteps(2);
  } catch (error) {
    console.error('❌ Dental analysis failed:', error);
    throw error;
  }
}

// Update progress steps (simplified to 2 steps)
function updateProgressSteps(currentStep: number): void {
  for (let i = 1; i <= 2; i++) {
    const step = document.getElementById(`step${i}`);
    if (step) {
      step.classList.remove('active', 'completed');
      if (i < currentStep) {
        step.classList.add('completed');
      } else if (i === currentStep) {
        step.classList.add('active');
      }
    }
  }
}

// Determine case type from treatment plan
function determineCaseType(plan: TreatmentPlan): 'MILD' | 'MODERATE' | 'COMPLEX' | 'URGENT' {
  // Map old eligibility to new 4-tier model
  if (plan.eligibility === 'eligible') {
    // Check complexity within eligible cases
    const complexityScore = (plan.treatmentLengthMonths || 0) + (plan.stageCount || 0);
    return complexityScore < 20 ? 'MILD' : 'MODERATE';
  } else if (plan.eligibility === 'review') {
    return 'MODERATE';
  } else {
    // reject -> COMPLEX (unless there are urgent signs like infection/trauma)
    // For now, default to COMPLEX; expand this logic if you detect urgent symptoms
    return 'COMPLEX';
  }
}

// Display treatment plan in UI (updated for 4-tier model)
function displayTreatmentPlan(plan: TreatmentPlan): void {
  const planTabBtn = document.getElementById('planTabBtn') as HTMLButtonElement;
  if (planTabBtn) {
    planTabBtn.disabled = false;
    planTabBtn.classList.remove('disabled');
  }
  
  // Determine case type
  const caseType = determineCaseType(plan);
  
  // Show AI Assessment section with the appropriate card
  const aiAssessmentSection = document.getElementById('aiAssessmentSection');
  if (aiAssessmentSection) {
    aiAssessmentSection.style.display = 'block';
  }
  
  // Hide all case cards, then show the matching one
  const allCaseCards = document.querySelectorAll('.case-card');
  allCaseCards.forEach(card => {
    (card as HTMLElement).style.display = 'none';
  });
  
  const activeCard = document.getElementById(`caseCard-${caseType}`);
  if (activeCard) {
    activeCard.style.display = 'block';
  }
  
  // Update case chip and meta
  const caseLabels: Record<string, string> = {
    MILD: 'Mild Case',
    MODERATE: 'Moderate Case',
    COMPLEX: 'Complex Case',
    URGENT: 'Urgent'
  };
  if (assessmentCaseChip) {
    assessmentCaseChip.textContent = caseLabels[caseType] || caseType;
    assessmentCaseChip.className = `case-chip ${caseType.toLowerCase()}`;
  }
  if (assessmentMeta) {
    assessmentMeta.textContent = `Based on photo analysis • ${new Date().toLocaleDateString()}`;
  }
  
  // Still populate the detailed plan sections below
  eligibilityCard.style.display = 'block';
  treatmentDetails.style.display = 'grid';
  
  eligibilityBadge.className = `badge ${plan.eligibility}`;
  
  const statusMessages = {
    eligible: t('eligibleTitle'),
    review: t('reviewTitle'),
    reject: ''
  };
  
  eligibilityStatus.textContent = statusMessages[plan.eligibility as keyof typeof statusMessages];
  eligibilityMessage.textContent = plan.reasons[0] || t('defaultMessage');

  treatmentLength.textContent = `${plan.treatmentLengthMonths} ${t('months')}`;
  stageCount.textContent = `${plan.stageCount} ${t('aligners')}`;
  wearType.textContent = plan.wearType;

  correctionsList.innerHTML = '';
  const correctionLabels: Record<string, Record<string, string>> = {
    en: { crowdingCorrection: 'Crowding', rotationCorrection: 'Rotation', spacingCorrection: 'Spacing', midlineCorrection: 'Midline', biteCorrection: 'Bite' },
    zh: { crowdingCorrection: '擁擠', rotationCorrection: '扭轉', spacingCorrection: '縫隙', midlineCorrection: '中線', biteCorrection: '咬合' }
  };

  for (const [key, value] of Object.entries(plan.corrections)) {
    const tag = document.createElement('span');
    tag.className = `correction-tag ${value ? '' : 'disabled'}`;
    tag.textContent = (correctionLabels[currentLanguage as keyof typeof correctionLabels] as any)[key] || key;
    correctionsList.appendChild(tag);
  }

  treatmentReasons.innerHTML = '';
  plan.reasons.forEach(reason => {
    const li = document.createElement('li');
    li.textContent = reason;
    treatmentReasons.appendChild(li);
  });
}

// Helper to get eligibility card element
const eligibilityCard = document.getElementById('eligibilityCard') as HTMLDivElement;

// Start camera for 4-stage capture
async function startStageCamera(): Promise<boolean> {
  try {
    console.log('📸 [DEBUG] Starting stage capture camera...');
    
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 1280, height: 720 }
    });
    
    stageWebcam.srcObject = stream;
    
    await new Promise((resolve) => {
      stageWebcam.onloadedmetadata = () => {
        resolve(true);
      };
    });

    // Initialize FaceMesh for stage capture
    stageFaceMesh = new FaceMesh({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
      }
    });

    stageFaceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    stageFaceMesh.onResults(onStageFaceMeshResults);

    stageCamera = new Camera(stageWebcam, {
      onFrame: async () => {
        if (stageFaceMesh) {
          await stageFaceMesh.send({ image: stageWebcam });
        }
      },
      width: 1280,
      height: 720
    });

    await stageCamera.start();
    console.log('✅ [DEBUG] Stage camera started successfully');
    
    return true;
  } catch (error) {
    console.error('❌ [DEBUG] Failed to start stage camera:', error);
    alert(currentLanguage === 'en' ? 'Failed to access camera. Please ensure camera permissions are granted.' : '無法訪問攝像頭。請確保已授予攝像頭權限。');
    return false;
  }
}

// Handle FaceMesh results for stage capture
function onStageFaceMeshResults(results: any) {
  const canvasCtx = stageOverlay.getContext('2d')!;
  
  // Use video dimensions for internal canvas resolution
  if (stageOverlay.width !== stageWebcam.videoWidth || stageOverlay.height !== stageWebcam.videoHeight) {
    stageOverlay.width = stageWebcam.videoWidth;
    stageOverlay.height = stageWebcam.videoHeight;
  }

  canvasCtx.save();
  canvasCtx.clearRect(0, 0, stageOverlay.width, stageOverlay.height);
  
  // Draw the video frame first (mirroring is handled by CSS transform)
  canvasCtx.drawImage(results.image, 0, 0, stageOverlay.width, stageOverlay.height);

  if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
    stageLandmarks = results.multiFaceLandmarks[0];
    
    // Validate based on current stage
    const currentStage = CAPTURE_STAGES[activeStageIndex];
    stageReady = stageLandmarks ? validateStageAlignment(currentStage.id, stageLandmarks, stageOverlay.width, stageOverlay.height) : false;
    
    // Update ready badge
    if (stageReady) {
      stageReadyBadge.classList.add('ready');
      stageReadyText.textContent = currentLanguage === 'en' ? '✓ Ready to Capture' : '✓ 準備拍攝';
      stageCaptureBtn.disabled = false;
    } else {
      stageReadyBadge.classList.remove('ready');
      stageReadyText.textContent = currentLanguage === 'en' ? '⚠ Position your face' : '⚠ 調整面部位置';
      stageCaptureBtn.disabled = true;
    }
    
    // Draw alignment guides
    if (stageLandmarks) {
      drawStageGuides(canvasCtx, stageLandmarks, stageOverlay.width, stageOverlay.height, currentStage.id);
    }
  } else {
    stageLandmarks = null;
    stageReady = false;
    stageReadyBadge.classList.remove('ready');
    stageReadyText.textContent = currentLanguage === 'en' ? '⚠ No face detected' : '⚠ 未檢測到面部';
    stageCaptureBtn.disabled = true;
  }

  canvasCtx.restore();
}

// Validate alignment for each stage
function validateStageAlignment(stageId: CaptureStageId, landmarks: any[], width: number, height: number): boolean {
  const mouthOpen = getMouthOpenDistance(landmarks);
  const roll = getRollDegrees(landmarks);
  const yawProxy = getYawProxy(landmarks);
  
  switch (stageId) {
    case 'front_smile':
      // Front smile: mouth closed, face straight
      return mouthOpen < 0.03 && Math.abs(roll) < 10 && Math.abs(yawProxy) < 0.02;
    case 'lower_front':
    case 'upper_front':
      // Lower/upper: mouth open, face straight
      return mouthOpen > 0.05 && Math.abs(roll) < 15 && Math.abs(yawProxy) < 0.03;
    case 'side_bite':
      // Side bite: mouth closed, head turned
      return mouthOpen < 0.03 && Math.abs(yawProxy) > 0.05;
    default:
      return false;
  }
}

// Helper functions for validation
function getMouthOpenDistance(landmarks: any[]): number {
  const upperLip = landmarks[13];
  const lowerLip = landmarks[14];
  if (!upperLip || !lowerLip) return 0;
  return Math.abs(lowerLip.y - upperLip.y);
}

function getRollDegrees(landmarks: any[]): number {
  const leftEye = landmarks[33];
  const rightEye = landmarks[263];
  if (!leftEye || !rightEye) return 0;
  const dy = leftEye.y - rightEye.y;
  const dx = leftEye.x - rightEye.x;
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

function getYawProxy(landmarks: any[]): number {
  const leftCheek = landmarks[234];
  const rightCheek = landmarks[454];
  if (!leftCheek || !rightCheek) return 0;
  return leftCheek.z - rightCheek.z;
}

// Draw alignment guides on overlay
function drawStageGuides(ctx: CanvasRenderingContext2D, landmarks: any[], width: number, height: number, stageId: CaptureStageId) {
  const { mouthCenterX, mouthCenterY, mouthWidth, mouthHeight } = getMouthMetrics(landmarks, width, height);
  
  // Draw guide circle/ellipse
  ctx.strokeStyle = stageReady ? '#00ce7c' : '#f08c00';
  ctx.lineWidth = 3;
  ctx.shadowColor = stageReady ? '#00ce7c' : '#f08c00';
  ctx.shadowBlur = 8;
  
  if (stageId === 'front_smile' || stageId === 'side_bite') {
    // Closed mouth guide - horizontal ellipse
    ctx.beginPath();
    ctx.ellipse(mouthCenterX, mouthCenterY, mouthWidth * 0.6, mouthHeight * 2, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    // Open mouth guide - circular
    ctx.beginPath();
    ctx.ellipse(mouthCenterX, mouthCenterY, mouthWidth * 0.7, mouthHeight * 2.5, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  
  ctx.shadowBlur = 0;
}

function getMouthMetrics(landmarks: any[], width: number, height: number) {
  const upperLip = landmarks[13];
  const lowerLip = landmarks[14];
  const leftMouth = landmarks[61];
  const rightMouth = landmarks[291];

  const mouthCenterX = ((leftMouth?.x || 0.5) + (rightMouth?.x || 0.5)) / 2 * width;
  const mouthCenterY = ((upperLip?.y || 0.5) + (lowerLip?.y || 0.5)) / 2 * height;
  const mouthWidth = Math.abs(((rightMouth?.x || 0.55) - (leftMouth?.x || 0.45)) * width);
  const mouthHeight = Math.abs(((lowerLip?.y || 0.52) - (upperLip?.y || 0.48)) * height);

  return { mouthCenterX, mouthCenterY, mouthWidth, mouthHeight };
}

// Initialize tab 3 (4-stage capture) when user clicks it
async function initializeStageCapture(): Promise<void> {
  console.log('📸 [DEBUG] Initializing 4-stage capture tab...');
  
  // Start camera for the stage capture if not already running
  if (!stageCamera) {
    await startStageCamera();
  }
  
  // Update UI for first stage
  updateStageUI();
}

// Update stage UI (instructions, thumbnails, etc.)
function updateStageUI() {
  const stage = CAPTURE_STAGES[activeStageIndex];
  if (stageStepEl) stageStepEl.textContent = `${activeStageIndex + 1} of 4`;
  if (stageTitleEl) stageTitleEl.textContent = stage.title;
  if (stageInstructionEl) stageInstructionEl.textContent = stage.instruction;
  
  // Update thumbnail active states
  thumbBtns.forEach((btn, idx) => {
    if (btn) {
      btn.classList.toggle('active', idx === activeStageIndex);
      btn.classList.toggle('captured', stageCaptures[idx] !== null);
    }
  });

  // Toggle buttons based on whether all stages are captured
  const allCaptured = stageCaptures.every(img => img !== null);
  if (stageCompleteBtn) {
    stageCompleteBtn.style.display = allCaptured ? 'block' : 'none';
  }
}

// Capture button handler
if (stageCaptureBtn) {
  stageCaptureBtn.addEventListener('click', () => {
    if (!stageReady) {
      console.log('⚠️ [DEBUG] Stage not ready for capture');
      return;
    }
    
    console.log(`📸 [DEBUG] Capturing photo for stage ${activeStageIndex + 1}`);
    
    // Capture photo
    const captureCanvas = document.createElement('canvas');
    captureCanvas.width = stageWebcam.videoWidth;
    captureCanvas.height = stageWebcam.videoHeight;
    const ctx = captureCanvas.getContext('2d')!;
    ctx.drawImage(stageWebcam, 0, 0);
    
    const dataUrl = captureCanvas.toDataURL('image/png');
    stageCaptures[activeStageIndex] = dataUrl;
    
    // Update thumbnail
    if (thumbImgs[activeStageIndex]) {
      thumbImgs[activeStageIndex].src = dataUrl;
      thumbImgs[activeStageIndex].style.display = 'block';
    }
    
    // Move to next stage
    if (activeStageIndex < 3) {
      activeStageIndex++;
      updateStageUI();
    } else {
      // All 4 captured
      console.log('✅ All 4 stages captured!');
      updateStageUI();
    }
  });
}

// Done button handler
if (stageCompleteBtn) {
  stageCompleteBtn.addEventListener('click', () => {
    alert(currentLanguage === 'en' ? 'Photos submitted! Our clinicians will review them.' : '照片已提交！我們的臨床醫生將進行審核。');
    // Switch back to treatment plan tab
    const switchTabFn = (window as any).switchTab;
    if (switchTabFn) switchTabFn('plan');
  });
}

// Download result
function downloadResult() {
  const link = document.createElement('a');
  link.download = 'beame-straightened-teeth.png';
  link.href = straightenedImage.src;
  link.click();
}

// Retry - go back to camera
async function retry() {
  // Cleanup stage capture
  if (stageCamera) {
    const stream = stageWebcam.srcObject as MediaStream | null;
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
    }
    stageWebcam.srcObject = null;
    stageCamera = null;
  }
  if (stageFaceMesh) {
    stageFaceMesh = null;
  }
  
  pendingDentalAnalysis = null;
  stageCaptures = [null, null, null, null];
  activeStageIndex = 0;
  
  // Clear stage thumbnails
  thumbImgs.forEach(img => {
    if (img) {
      img.src = '';
      img.style.display = 'none';
    }
  });
  if (stageCompleteBtn) stageCompleteBtn.style.display = 'none';

  // Hide main results section
  resultsSection.style.display = 'none';
  
  // Hide AI Assessment section
  const assessmentSection = document.getElementById('aiAssessmentSection');
  if (assessmentSection) {
    assessmentSection.style.display = 'none';
  }
  
  // Disable tab buttons
  const planTabBtn = document.getElementById('planTabBtn') as HTMLButtonElement;
  const tab3dBtn = document.getElementById('3dTabBtn') as HTMLButtonElement;
  if (planTabBtn) {
    planTabBtn.disabled = true;
    planTabBtn.classList.add('disabled');
  }
  if (tab3dBtn) {
    tab3dBtn.disabled = true;
    tab3dBtn.classList.add('disabled');
  }
  
  // Reset to first tab
  const switchTabFn = (window as any).switchTab;
  if (switchTabFn) switchTabFn('preview');
  
  // Show webcam
  webcamSection.style.display = 'block';
  captureBtn.disabled = true; // Will be enabled when mouth opens
  downloadBtn.style.display = 'none';
  isProcessing = false;
  
  // Reset state
  currentLandmarks = null;
  currentSession = null;
  
  // Reset progress steps
  updateProgressSteps(1);
  
  // Set initial alignment status color
  if (analysisStatus) {
    analysisStatus.parentElement?.classList.remove('ready');
    analysisStatus.parentElement?.classList.add('not-ready');
    analysisStatus.textContent = t('openMouthWider');
  }
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Restart camera if it's not running
  if (!camera) {
    console.log('📹 [DEBUG] Restarting camera...');
    await startCamera();
  }
}

// Event Listeners
captureBtn.addEventListener('click', capturePhoto);
downloadBtn.addEventListener('click', downloadResult);
retryBtn.addEventListener('click', retry);

// Initialize on page load
async function initializeApp() {
  console.log('🚀 [DEBUG] Beame Teeth Straightener initialized');
  console.log('🔧 [DEBUG] Environment check:');
  console.log('  - Gemini API Key:', import.meta.env.VITE_GEMINI_API_KEY ? 'Configured ✓' : 'NOT configured ✗');
  console.log('');
  console.log('🦷 [TOOTH DETECTION]:');
  console.log('  - Mode: LOCAL ONNX ⚡ (Browser-based, like SmileSet!)');
  console.log('  - Model Path:', ONNX_MODEL_PATH);
  console.log('  - Update Rate: ~30 FPS (33ms) - MediaPipe speed!');
  console.log('  - Runs in browser: ✅ Yes (WebGL/WebAssembly)');
  console.log('  - API calls: ❌ None (100% local)');
  console.log('');
  
  console.log('📥 Loading tooth detection model...');
  
  console.log('  - Mode:', import.meta.env.MODE);
  console.log('  - Base URL:', import.meta.env.BASE_URL);

  // Load ONNX model for local tooth detection
  try {
    await loadONNXModel(ONNX_MODEL_PATH);
    console.log('✅ Tooth detection ready! Model running locally in browser.');
    console.log('💡 No API calls, instant detection, works offline!');
  } catch (error) {
    console.error('❌ Failed to load tooth detection model:', error);
    console.error('💡 Make sure model file exists at:', ONNX_MODEL_PATH);
    console.error('📖 See ONNX_LOCAL_SETUP.md for setup instructions');
  }
  console.log('');

  // Enable diagnostics
  enableDiagnostics();

  // Check for existing session
  const existingSession = loadCurrentSession();
  if (existingSession) {
    console.log('💾 [DEBUG] Found existing session:', existingSession.id);
    
    // Optionally restore session (you can add a prompt here)
    // For now, we'll just log it
    console.log('📊 [DEBUG] Previous session available. Status:', existingSession.status);
    
    // You could add UI to let user view their previous scan
    // For this implementation, we'll start fresh each time
  }

  // Auto-start camera on page load
  console.log('📹 [DEBUG] Attempting to start camera automatically...');
  setCookie('beame_camera_prompted', 'true', 365);
  await startCamera();
  
  // Log available elements
  console.log('🔍 [DEBUG] Checking DOM elements...');
  console.log('  - treatmentPlanSection:', !!treatmentPlanSection);
  console.log('  - stageWebcam:', !!stageWebcam);
  console.log('  - stageOverlay:', !!stageOverlay);
}

// Expose initializeStageCapture to window for tab switching
(window as any).initializeStageCapture = initializeStageCapture;

// Call initialization
initializeApp();


