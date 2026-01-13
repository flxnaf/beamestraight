import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';

// @ts-ignore
const FaceMeshConstructor = typeof FaceMesh !== 'undefined' ? FaceMesh : (window as any).FaceMesh;

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
const USE_FALLBACK_MODE = false; // Set to false to enable real AI generation

// Initialize Gemini AI (unused in fallback mode)
const _genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

// 🦷 LOCAL TOOTH DETECTION (ONNX - Runs in browser!)
const ONNX_MODEL_PATH = import.meta.env.VITE_ONNX_MODEL_PATH || '/models/teeth-detection.onnx';
const ENABLE_TOOTH_DETECTION = false; // 🚫 DISABLED: Model too buggy and causes lag
const SHOW_TOOTH_OVERLAY = false; // 🚫 DISABLED: Hide overlay (only relevant if detection is enabled)

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
let faceMesh: any = null; // Reusing single FaceMesh instance
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
    instruction: 'Gently bite on your back teeth and smile as wide as you can. Align your mouth within the guides.'
  },
  {
    id: 'lower_front',
    title: 'Lower Front Teeth',
    instruction: 'Raise your phone, open your mouth wide, and clearly show your lower front teeth by pulling your lips away.'
  },
  {
    id: 'upper_front',
    title: 'Upper Front Teeth',
    instruction: 'Angle your phone downward, open wide, and clearly show your upper front teeth while keeping lips out of the way.'
  },
  {
    id: 'side_bite',
    title: 'Side Bite (Profile)',
    instruction: 'Turn your head to the side, bite evenly on your back teeth, and smile broadly.'
  }
];

let stageCamera: Camera | null = null;
let stageCaptures: Array<string | null> = [null, null, null, null];
let activeStageIndex = 0;
let stageReady = false;
let stageLandmarks: any[] | null = null;
let stageTeethDetections: ToothDetection[] = [];
let stageIsDetecting = false;
let stageLastDetectTime = 0;

// Initialize MediaPipe Face Mesh
function initializeFaceMesh() {
  if (faceMesh) return; // Already initialized

  console.log('🏗️ [DEBUG] Initializing common FaceMesh instance...');
  faceMesh = new FaceMeshConstructor({
    locateFile: (file: string) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
    }
  });

  faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });

  // We set results handler depending on the current active mode
  faceMesh.onResults((results: any) => {
    const is3DTab = resultsSection.style.display !== 'none' && 
                    document.getElementById('tab-3d')?.classList.contains('active');
    
    if (is3DTab) {
      onStageFaceMeshResults(results);
    } else {
      onFaceMeshResults(results);
    }
  });
}

// Check if mouth is open wide
function isMouthOpen(landmarks: any[]): boolean {
  // Upper lip center (13)
  // Lower lip center (14)
  const upperLip = landmarks[13];
  const lowerLip = landmarks[14];
  
  if (!upperLip || !lowerLip) return false;
  
  // Calculate vertical distance between upper and lower lip
  const mouthOpenDistance = Math.abs(lowerLip.y - upperLip.y);
  
  // Threshold for considering mouth as "open wide" (adjust as needed)
  const threshold = 0.04; // ~4% of face height
  
  return mouthOpenDistance > threshold;
}

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
    const toothWidth = tooth.width;
    const toothHeight = tooth.height;
    const radius = Math.min(toothWidth, toothHeight) * 0.15;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = Math.max(2, toothWidth * 0.03);
    
    ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
    ctx.shadowBlur = Math.min(12, toothWidth * 0.15);
    
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
    
    if (tooth.toothNumber) {
      const fontSize = Math.max(12, Math.min(18, toothHeight * 0.3));
      ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 1)';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.lineWidth = fontSize * 0.2;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const textX = tooth.x + toothWidth / 2;
      const textY = tooth.y - fontSize * 0.8;
      
      ctx.strokeText(tooth.toothNumber, textX, textY);
      ctx.fillText(tooth.toothNumber, textX, textY);
    }
  });
  
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
function drawDentalOverlay(
  ctx: CanvasRenderingContext2D, 
  landmarks: any[], 
  width: number, 
  height: number, 
  isReady: boolean = true,
  stageId: string = 'preview'
) {
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
  
  // Define colors based on ready state
  const readyColor = '#00ce7c';
  const waitingColor = '#f08c00';
  const mainColor = isReady ? readyColor : waitingColor;

  // 1. Draw Face Silhouette (Subtle guide for overall head position)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  const silCenterX = width / 2;
  const silCenterY = height * 0.6;
  ctx.ellipse(silCenterX, silCenterY - height * 0.15, width * 0.25, height * 0.4, 0, 0, Math.PI * 2);
  ctx.stroke();

  // 2. Draw Mouth Focus Area (Pulsing corner brackets)
  const padding = 40;
  const frameX = mouthCenterX - mouthWidth / 2 - padding;
  const frameY = mouthCenterY - mouthHeight / 2 - padding;
  const frameWidth = mouthWidth + padding * 2;
  const frameHeight = mouthHeight + padding * 2;
  
  ctx.strokeStyle = mainColor;
  ctx.lineWidth = 3;
  ctx.shadowColor = mainColor;
  ctx.shadowBlur = isReady ? 15 : 5;
  
  const cornerSize = 25;
  const time = Date.now() / 1000;
  const pulse = isReady ? (Math.sin(time * 3) * 0.2 + 0.8) : 0.5;
  
  ctx.globalAlpha = pulse;
  
  // Corner Brackets
  const drawCorner = (x: number, y: number, dx: number, dy: number) => {
    ctx.beginPath();
    ctx.moveTo(x + dx, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + dy);
    ctx.stroke();
  };
  
  drawCorner(frameX, frameY, cornerSize, cornerSize); // TL
  drawCorner(frameX + frameWidth, frameY, -cornerSize, cornerSize); // TR
  drawCorner(frameX, frameY + frameHeight, cornerSize, -cornerSize); // BL
  drawCorner(frameX + frameWidth, frameY + frameHeight, -cornerSize, -cornerSize); // BR
  
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  
  // 3. Draw detailed lip and teeth contours
  ctx.lineWidth = 2;
  
  // A. Outer lip contour
  ctx.strokeStyle = isReady ? 'rgba(0, 206, 124, 0.9)' : 'rgba(240, 140, 0, 0.7)';
  const mouthOuter = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291];
  ctx.beginPath();
  for (let i = 0; i < mouthOuter.length; i++) {
    const idx = mouthOuter[i];
    if (landmarks[idx]) {
      const x = landmarks[idx].x * width;
      const y = landmarks[idx].y * height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
  }
  ctx.closePath();
  ctx.stroke();
  
  // B. Teeth lines
  ctx.setLineDash([2, 2]);
  ctx.strokeStyle = isReady ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.4)';
  
  const upperTeeth = [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308];
  ctx.beginPath();
  for (let i = 0; i < upperTeeth.length; i++) {
    const idx = upperTeeth[i];
    if (landmarks[idx]) {
      const x = landmarks[idx].x * width;
      const y = landmarks[idx].y * height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
  
  const lowerTeeth = [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308];
  ctx.beginPath();
  for (let i = 0; i < lowerTeeth.length; i++) {
    const idx = lowerTeeth[i];
    if (landmarks[idx]) {
      const x = landmarks[idx].x * width;
      const y = landmarks[idx].y * height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // 4. Center Guidance crosshair (Only if not ready)
  if (!isReady) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    const targetX = width / 2;
    const targetY = height * 0.6;
    ctx.beginPath();
    ctx.moveTo(targetX - 20, targetY); ctx.lineTo(targetX + 20, targetY);
    ctx.moveTo(targetX, targetY - 20); ctx.lineTo(targetX, targetY + 20);
    ctx.stroke();
  }
}

// Draw clean mouth tracking overlay - professional and minimal
function _drawCustomFaceMesh(ctx: CanvasRenderingContext2D, landmarks: any[], width: number, height: number) {
  drawDentalOverlay(ctx, landmarks, width, height, mouthOpen, 'preview');
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
    currentLandmarks = landmarks;
    mouthOpen = isMouthOpen(landmarks);
    
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
    
    drawDentalOverlay(canvasCtx, landmarks, canvasElement.width, canvasElement.height, mouthOpen, 'preview');
  } else {
    faceDetected = false;
    mouthOpen = false;
    currentLandmarks = null;
    currentTeethDetections = [];
    faceStatus.textContent = t('noFace');
    faceStatus.style.color = '#ef4444';
    analysisStatus.parentElement?.classList.remove('ready', 'not-ready');
    analysisStatus.textContent = t('openMouthWider');
    captureBtn.disabled = true;
  }

  canvasCtx.restore();
}

// Helper to get camera stream with fallbacks
async function getCameraStream(): Promise<MediaStream> {
  const constraints = [
    { video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } },
    { video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' } },
    { video: true }
  ];

  let lastError: any;
  for (const constraint of constraints) {
    try {
      console.log('📹 [DEBUG] Attempting camera with:', constraint);
      return await navigator.mediaDevices.getUserMedia(constraint);
    } catch (e) {
      console.warn('⚠️ [DEBUG] Camera constraint failed:', constraint, e);
      lastError = e;
    }
  }
  throw lastError;
}

// Start camera
async function startCamera(): Promise<boolean> {
  try {
    cameraStatus.textContent = t('cameraStarting');
    
    const stream = await getCameraStream();
    
    webcamElement.muted = true;
    webcamElement.setAttribute('playsinline', 'true');
    webcamElement.srcObject = stream;
    
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Camera timeout')), 10000);
      webcamElement.onloadedmetadata = () => {
        clearTimeout(timeout);
        webcamElement.play().then(resolve).catch(reject);
      };
    });

    initializeFaceMesh();

    const cameraLoop = {
      active: true,
      stop: () => {
        cameraLoop.active = false;
        if (webcamElement.srcObject) {
          const s = webcamElement.srcObject as MediaStream;
          s.getTracks().forEach(track => track.stop());
          webcamElement.srcObject = null;
        }
      },
      start: async () => {
        const processFrame = async () => {
          if (!cameraLoop.active) return;
          if (faceMesh && webcamElement.readyState >= 2) {
            try {
              await faceMesh.send({ image: webcamElement });
            } catch (err) {
              console.warn('FaceMesh processing error:', err);
            }
          }
          requestAnimationFrame(processFrame);
        };
        requestAnimationFrame(processFrame);
      }
    };

    camera = cameraLoop as any;
    await (camera as any).start();

    cameraStatus.textContent = t('cameraActive');
    cameraStatus.style.color = '#00ce7c';
    
    const statusBadge = document.getElementById('cameraStatusBadge');
    const statusDot = statusBadge?.querySelector('.status-dot') as HTMLElement;
    if (statusDot) {
      statusDot.style.background = '#00ce7c';
      statusDot.style.boxShadow = '0 0 10px #00ce7c';
    }
    
    captureBtn.disabled = true;
    analysisStatus.parentElement?.classList.add('not-ready');
    analysisStatus.textContent = t('openMouthWider');
    setCookie('beame_camera_allowed', 'true', 365);
    
    console.log('✅ [DEBUG] Camera started successfully');
    return true;
  } catch (error) {
    console.error('❌ [DEBUG] Camera error:', error);
    cameraStatus.textContent = t('cameraDenied');
    cameraStatus.style.color = '#ef4444';
    
    const statusBadge = document.getElementById('cameraStatusBadge');
    const statusDot = statusBadge?.querySelector('.status-dot') as HTMLElement;
    if (statusDot) {
      statusDot.style.background = '#ef4444';
      statusDot.style.boxShadow = '0 0 10px #ef4444';
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    alert(currentLanguage === 'en' 
      ? `Failed to access camera: ${errorMessage}. Please ensure permissions are granted and no other app is using the camera.` 
      : `無法訪問攝像頭: ${errorMessage}。請確保已授予權限且無其他應用正在使用攝像頭。`);
    
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
  
  if (!camera) {
    console.log('📹 [DEBUG] Camera not running, attempting to start...');
    const started = await startCamera();
    if (!started) {
      alert('Camera access is required to capture your photo. Please allow camera permissions and try again.');
      return;
    }
    const startOverlay = document.getElementById('cameraStartOverlay');
    if (startOverlay) startOverlay.classList.add('hidden');
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  if (isProcessing) return;
  if (!faceDetected) {
    alert('Please ensure your face is clearly visible in the camera.');
    return;
  }
  if (!mouthOpen) {
    alert('Please open your mouth wide to show your teeth clearly.');
    return;
  }

  isProcessing = true;
  currentGenerationId++;
  const thisGenerationId = currentGenerationId;
  captureBtn.disabled = true;

  const originalImageWithMesh = canvasElement.toDataURL('image/png');
  originalImage.src = originalImageWithMesh;
  
  const captureCanvas = document.createElement('canvas');
  const captureCtx = captureCanvas.getContext('2d')!;
  captureCanvas.width = webcamElement.videoWidth;
  captureCanvas.height = webcamElement.videoHeight;
  captureCtx.drawImage(webcamElement, 0, 0, captureCanvas.width, captureCanvas.height);
  
  const cleanImageDataUrl = captureCanvas.toDataURL('image/png');

  webcamSection.style.display = 'none';
  resultsSection.style.display = 'block';
  processingIndicator.style.display = 'flex';
  straightenedImage.style.display = 'none';
  
  updateProgressSteps(1);
  window.scrollTo({ top: 0, behavior: 'smooth' });

  await simulateAnalysis();

  const analysisPromises: Promise<void>[] = [
    generateStraightenedImage(cleanImageDataUrl, thisGenerationId)
  ];
  
  if (currentLandmarks) {
    analysisPromises.push(
      performDentalAnalysis(cleanImageDataUrl, originalImageWithMesh).catch(error => {
        console.error('❌ [DEBUG] Dental analysis failed:', error);
      })
    );
  }
  
  await Promise.all(analysisPromises);
  processingIndicator.style.display = 'none';
  straightenedImage.style.display = 'block';
  downloadBtn.style.display = 'inline-block';
  isProcessing = false;
}

// Generate straightened image with Beame logo using Gemini AI
async function generateStraightenedImage(originalDataUrl: string, generationId: number): Promise<void> {
  if (USE_FALLBACK_MODE) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      ctx.font = 'bold 40px Arial'; ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
      ctx.textAlign = 'center'; ctx.fillText('FALLBACK MODE', canvas.width / 2, 50);
      straightenedImage.src = canvas.toDataURL('image/png');
    };
    img.src = originalDataUrl;
    return;
  }
  
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      if (generationId === currentGenerationId) await _generateStraightenedImageOld(originalDataUrl);
      return;
    }

    const base64Data = originalDataUrl.split(',')[1];
    const modelsToTry = [
      { name: 'gemini-2.5-flash-image', description: 'Nano Banana' },
      { name: 'gemini-2.0-flash-exp', description: 'Experimental' }
    ];
    
    const prompt = `MANDATORY TEETH STRAIGHTENING - YOU MUST MAKE SIGNIFICANT VISIBLE CHANGES...`;

    for (let i = 0; i < modelsToTry.length; i++) {
      if (generationId !== currentGenerationId) return;
      const modelInfo = modelsToTry[i];
      try {
        const model = _genAI.getGenerativeModel({ model: modelInfo.name });
        const result = await model.generateContent([
          prompt,
          { inlineData: { mimeType: 'image/png', data: base64Data } }
        ]);

        if (generationId !== currentGenerationId) return;
        const response = await result.response;
        const parts = response.candidates?.[0]?.content?.parts || [];
        
        for (const part of parts) {
          if (part.inlineData) {
            const brandedImage = await addBeameBranding(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
            if (generationId !== currentGenerationId) return;
            straightenedImage.src = brandedImage;
            return;
          }
        }
      } catch (modelError) {
        console.warn(`⚠️ [DEBUG] ${modelInfo.name} failed`, modelError);
      }
    }
    if (generationId === currentGenerationId) await _generateStraightenedImageOld(originalDataUrl);
  } catch (error) {
    if (generationId === currentGenerationId) await _generateStraightenedImageOld(originalDataUrl);
  }
}

// Add Beame branding to generated image
async function addBeameBranding(imageDataUrl: string): Promise<string> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const img = new Image();
  await new Promise((resolve) => { img.onload = resolve; img.src = imageDataUrl; });
  canvas.width = img.width; canvas.height = img.height;
  ctx.drawImage(img, 0, 0);
  const logoSize = Math.min(canvas.width, canvas.height) * 0.1;
  ctx.font = `bold ${logoSize}px Arial`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  const textMetrics = ctx.measureText('BEAME');
  ctx.fillRect(canvas.width - textMetrics.width - 30, canvas.height - logoSize - 25, textMetrics.width + 20, logoSize + 10);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
  ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
  ctx.fillText('BEAME', canvas.width - 20, canvas.height - 20);
  return canvas.toDataURL('image/png');
}

// Fallback method
async function _generateStraightenedImageOld(originalDataUrl: string): Promise<void> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const img = new Image();
  await new Promise((resolve) => { img.onload = resolve; img.src = originalDataUrl; });
  canvas.width = img.width; canvas.height = img.height;
  ctx.drawImage(img, 0, 0);
  ctx.globalAlpha = 0.1; ctx.fillStyle = 'white'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = 1.0;
  straightenedImage.src = canvas.toDataURL('image/png');
}

// AI Classify
async function classifyDentalCase(imageDataUrl: string): Promise<'MILD' | 'MODERATE' | 'COMPLEX' | 'URGENT'> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') return 'MODERATE';
  try {
    const base64Data = imageDataUrl.split(',')[1];
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    const prompt = `Classify this case into MILD, MODERATE, COMPLEX, or URGENT... Respond with ONLY ONE WORD.`;
    const result = await model.generateContent([prompt, { inlineData: { mimeType: 'image/png', data: base64Data } }]);
    const text = (await result.response).text().trim().toUpperCase();
    if (text.includes('URGENT')) return 'URGENT';
    if (text.includes('COMPLEX')) return 'COMPLEX';
    if (text.includes('MODERATE')) return 'MODERATE';
    return 'MILD';
  } catch (error) { return 'MODERATE'; }
}

function displayCaseClassification(classification: 'MILD' | 'MODERATE' | 'COMPLEX' | 'URGENT'): void {
  const assessmentSection = document.getElementById('aiAssessmentSection');
  const chip = document.getElementById('assessmentCaseChip');
  const cards = document.querySelectorAll('.case-card');
  const targetCard = document.getElementById(`caseCard-${classification}`);
  if (!chip || !targetCard || !assessmentSection) return;
  assessmentSection.style.display = 'block';
  chip.className = `case-chip ${classification.toLowerCase()}`;
  const chipLabels = { en: { MILD: 'Mild Case', MODERATE: 'Moderate Case', COMPLEX: 'Complex Case', URGENT: 'Urgent Case' }, zh: { MILD: '輕度個案', MODERATE: '中度個案', COMPLEX: '複雜個案', URGENT: '緊急個案' } };
  chip.textContent = chipLabels[currentLanguage as keyof typeof chipLabels][classification];
  cards.forEach(card => (card as HTMLElement).style.display = 'none');
  targetCard.style.display = 'block';
}

async function performDentalAnalysis(cleanImageUrl: string, originalImageUrl: string): Promise<void> {
  if (!currentLandmarks) return;
  try {
    analysisStep.textContent = t('analyzingDental');
    const dentalAnalysis: DentalAnalysis = analyzeDentalArches(currentLandmarks);
    const [caseClassification, treatmentPlan] = await Promise.all([
      classifyDentalCase(cleanImageUrl),
      Promise.resolve(generateTreatmentPlan(dentalAnalysis))
    ]);
    displayCaseClassification(caseClassification);
    analysisStep.textContent = t('savingSession');
    const compressedOriginal = await compressImageDataUrl(originalImageUrl);
    const compressedPreview = await compressImageDataUrl(straightenedImage.src);
    currentSession = { id: generateSessionId(), timestamp: Date.now(), originalImageUrl: compressedOriginal, previewImageUrl: compressedPreview, dentalAnalysis, treatmentPlan, status: 'pending' };
    saveCurrentSession(currentSession);
    analysisStep.textContent = t('preparingPlan');
    displayTreatmentPlan(treatmentPlan);
    pendingDentalAnalysis = dentalAnalysis;
    const tab3dBtn = document.getElementById('3dTabBtn') as HTMLButtonElement;
    if (tab3dBtn) { tab3dBtn.disabled = false; tab3dBtn.classList.remove('disabled'); }
    updateProgressSteps(2);
  } catch (error) { console.error('❌ Dental analysis failed:', error); throw error; }
}

function updateProgressSteps(currentStep: number): void {
  for (let i = 1; i <= 2; i++) {
    const step = document.getElementById(`step${i}`);
    if (step) {
      step.classList.remove('active', 'completed');
      if (i < currentStep) step.classList.add('completed');
      else if (i === currentStep) step.classList.add('active');
    }
  }
}

function determineCaseType(plan: TreatmentPlan): 'MILD' | 'MODERATE' | 'COMPLEX' | 'URGENT' {
  if (plan.eligibility === 'eligible') {
    const complexityScore = (plan.treatmentLengthMonths || 0) + (plan.stageCount || 0);
    return complexityScore < 20 ? 'MILD' : 'MODERATE';
  }
  return plan.eligibility === 'review' ? 'MODERATE' : 'COMPLEX';
}

function displayTreatmentPlan(plan: TreatmentPlan): void {
  const planTabBtn = document.getElementById('planTabBtn') as HTMLButtonElement;
  if (planTabBtn) { planTabBtn.disabled = false; planTabBtn.classList.remove('disabled'); }
  const caseType = determineCaseType(plan);
  const aiAssessmentSection = document.getElementById('aiAssessmentSection');
  if (aiAssessmentSection) aiAssessmentSection.style.display = 'block';
  const allCaseCards = document.querySelectorAll('.case-card');
  allCaseCards.forEach(card => (card as HTMLElement).style.display = 'none');
  const activeCard = document.getElementById(`caseCard-${caseType}`);
  if (activeCard) activeCard.style.display = 'block';
  if (assessmentCaseChip) {
    assessmentCaseChip.textContent = caseType;
    assessmentCaseChip.className = `case-chip ${caseType.toLowerCase()}`;
  }
  if (assessmentMeta) assessmentMeta.textContent = `Based on AI Analysis • ${new Date().toLocaleDateString()}`;
  eligibilityCard.style.display = 'block';
  treatmentDetails.style.display = 'grid';
  eligibilityBadge.className = `badge ${plan.eligibility}`;
  eligibilityStatus.textContent = t(plan.eligibility + 'Title');
  eligibilityMessage.textContent = plan.reasons[0] || t('defaultMessage');
  treatmentLength.textContent = `${plan.treatmentLengthMonths} ${t('months')}`;
  stageCount.textContent = `${plan.stageCount} ${t('aligners')}`;
  wearType.textContent = plan.wearType;
  correctionsList.innerHTML = '';
  for (const [key, value] of Object.entries(plan.corrections)) {
    const tag = document.createElement('span');
    tag.className = `correction-tag ${value ? '' : 'disabled'}`;
    tag.textContent = key; correctionsList.appendChild(tag);
  }
  treatmentReasons.innerHTML = '';
  plan.reasons.forEach(reason => {
    const li = document.createElement('li'); li.textContent = reason; treatmentReasons.appendChild(li);
  });
}

const eligibilityCard = document.getElementById('eligibilityCard') as HTMLDivElement;

// Start camera for 4-stage capture
async function startStageCamera(): Promise<boolean> {
  try {
    console.log('📸 [DEBUG] Starting stage capture camera...');
    const stream = await getCameraStream();
    stageWebcam.muted = true;
    stageWebcam.setAttribute('playsinline', 'true');
    stageWebcam.srcObject = stream;
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Stage camera timeout')), 10000);
      stageWebcam.onloadedmetadata = () => { clearTimeout(timeout); stageWebcam.play().then(resolve).catch(reject); };
    });

    initializeFaceMesh();

    const stageLoop = {
      active: true,
      stop: () => {
        stageLoop.active = false;
        if (stageWebcam.srcObject) {
          (stageWebcam.srcObject as MediaStream).getTracks().forEach(t => t.stop());
          stageWebcam.srcObject = null;
        }
      },
      start: async () => {
        const processFrame = async () => {
          if (!stageLoop.active) return;
          if (faceMesh && stageWebcam.readyState >= 2) {
            try { await faceMesh.send({ image: stageWebcam }); } 
            catch (err) { console.warn('Stage processing error:', err); }
          }
          requestAnimationFrame(processFrame);
        };
        requestAnimationFrame(processFrame);
      }
    };

    stageCamera = stageLoop as any;
    await (stageCamera as any).start();
    return true;
  } catch (error) {
    console.error('❌ [DEBUG] Stage camera error:', error);
    return false;
  }
}

// Handle FaceMesh results for stage capture
function onStageFaceMeshResults(results: any) {
  const canvasCtx = stageOverlay.getContext('2d')!;
  if (stageOverlay.width !== stageWebcam.videoWidth || stageOverlay.height !== stageWebcam.videoHeight) {
    stageOverlay.width = stageWebcam.videoWidth;
    stageOverlay.height = stageWebcam.videoHeight;
  }
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, stageOverlay.width, stageOverlay.height);
  canvasCtx.drawImage(results.image, 0, 0, stageOverlay.width, stageOverlay.height);

  const currentStage = CAPTURE_STAGES[activeStageIndex];
  if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
    const landmarks = results.multiFaceLandmarks[0];
    stageLandmarks = landmarks;
    stageReady = validateStageAlignment(currentStage.id, landmarks, stageOverlay.width, stageOverlay.height);
    
    if (stageReady) {
      stageReadyBadge.classList.add('ready');
      stageReadyText.textContent = t('readyCapture');
      stageCaptureBtn.disabled = false;
    } else {
      stageReadyBadge.classList.remove('ready');
      stageReadyText.textContent = currentLanguage === 'en' ? 'Align with markers' : '請對準標記';
      stageCaptureBtn.disabled = true;
    }
    drawDentalOverlay(canvasCtx, landmarks, stageOverlay.width, stageOverlay.height, stageReady, currentStage.id);
  } else {
    stageLandmarks = null; stageReady = false;
    stageReadyBadge.classList.remove('ready');
    stageReadyText.textContent = t('noFace');
    stageCaptureBtn.disabled = true;
  }
  canvasCtx.restore();
}

function validateStageAlignment(stageId: CaptureStageId, landmarks: any[], width: number, height: number): boolean {
  const mouthOpenDist = getMouthOpenDistance(landmarks);
  const roll = getRollDegrees(landmarks);
  const yaw = getYawProxy(landmarks);
  const { mouthCenterX, mouthCenterY, mouthWidth } = getMouthMetrics(landmarks, width, height);
  
  const isCentered = Math.abs(mouthCenterX - width/2)/width < 0.15 && Math.abs(mouthCenterY - height*0.6)/height < 0.2;
  const isDistanceOk = mouthWidth/width > 0.1 && mouthWidth/width < 0.6;
  const isLevel = Math.abs(roll) < 20;

  switch (stageId) {
    case 'front_smile': return isCentered && isDistanceOk && isLevel && Math.abs(yaw) < 0.04 && mouthOpenDist < 0.05;
    case 'lower_front':
    case 'upper_front': return isCentered && isDistanceOk && isLevel && Math.abs(yaw) < 0.05 && mouthOpenDist > 0.035;
    case 'side_bite': return isCentered && isDistanceOk && isLevel && Math.abs(yaw) > 0.03 && mouthOpenDist < 0.05;
    default: return false;
  }
}

function getMouthOpenDistance(landmarks: any[]): number {
  return landmarks[13] && landmarks[14] ? Math.abs(landmarks[14].y - landmarks[13].y) : 0;
}
function getRollDegrees(landmarks: any[]): number {
  const dy = landmarks[33].y - landmarks[263].y;
  const dx = landmarks[33].x - landmarks[263].x;
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}
function getYawProxy(landmarks: any[]): number {
  return landmarks[234].z - landmarks[454].z;
}
function getMouthMetrics(landmarks: any[], width: number, height: number) {
  const centerX = ((landmarks[61]?.x || 0.5) + (landmarks[291]?.x || 0.5)) / 2 * width;
  const centerY = ((landmarks[13]?.y || 0.5) + (landmarks[14]?.y || 0.5)) / 2 * height;
  const w = Math.abs(((landmarks[291]?.x || 0.55) - (landmarks[61]?.x || 0.45)) * width);
  return { mouthCenterX: centerX, mouthCenterY: centerY, mouthWidth: w };
}

async function initializeStageCapture(): Promise<void> {
  if (!stageCamera) await startStageCamera();
  updateStageUI();
}

function updateStageUI() {
  const stage = CAPTURE_STAGES[activeStageIndex];
  if (stageStepEl) stageStepEl.textContent = `${activeStageIndex + 1} of 4`;
  if (stageTitleEl) stageTitleEl.textContent = stage.title;
  if (stageInstructionEl) stageInstructionEl.textContent = stage.instruction;
  stageReady = false; stageCaptureBtn.disabled = true;
  stageReadyBadge.classList.remove('ready');
  thumbBtns.forEach((btn, idx) => {
    if (btn) { btn.classList.toggle('active', idx === activeStageIndex); btn.classList.toggle('captured', stageCaptures[idx] !== null); }
  });
  if (stageCompleteBtn) stageCompleteBtn.style.display = stageCaptures.every(img => img !== null) ? 'block' : 'none';
}

if (stageCaptureBtn) {
  stageCaptureBtn.addEventListener('click', () => {
    if (!stageReady) return;
    const canvas = document.createElement('canvas');
    canvas.width = stageWebcam.videoWidth; canvas.height = stageWebcam.videoHeight;
    canvas.getContext('2d')!.drawImage(stageWebcam, 0, 0);
    const dataUrl = canvas.toDataURL('image/png');
    stageCaptures[activeStageIndex] = dataUrl;
    if (thumbImgs[activeStageIndex]) { thumbImgs[activeStageIndex].src = dataUrl; thumbImgs[activeStageIndex].style.display = 'block'; }
    if (activeStageIndex < 3) { activeStageIndex++; updateStageUI(); } else { updateStageUI(); }
  });
}

if (stageRetakeBtn) {
  stageRetakeBtn.addEventListener('click', () => {
    stageCaptures[activeStageIndex] = null;
    if (thumbImgs[activeStageIndex]) { thumbImgs[activeStageIndex].src = ''; thumbImgs[activeStageIndex].style.display = 'none'; }
    updateStageUI();
  });
}

if (stageCompleteBtn) {
  stageCompleteBtn.addEventListener('click', () => {
    alert(currentLanguage === 'en' ? 'Photos submitted!' : '照片已提交！');
    const switchTabFn = (window as any).switchTab; if (switchTabFn) switchTabFn('plan');
  });
}

thumbBtns.forEach((btn, idx) => {
  if (btn) btn.addEventListener('click', () => { activeStageIndex = idx; updateStageUI(); });
});

function downloadResult() {
  const link = document.createElement('a'); link.download = 'beame-result.png';
  link.href = straightenedImage.src; link.click();
}

async function retry() {
  if (stageCamera) (stageCamera as any).stop(); stageCamera = null;
  pendingDentalAnalysis = null; stageCaptures = [null, null, null, null]; activeStageIndex = 0;
  thumbImgs.forEach(img => { if (img) { img.src = ''; img.style.display = 'none'; } });
  if (stageCompleteBtn) stageCompleteBtn.style.display = 'none';
  resultsSection.style.display = 'none';
  const assessmentSection = document.getElementById('aiAssessmentSection');
  if (assessmentSection) assessmentSection.style.display = 'none';
  const planTabBtn = document.getElementById('planTabBtn') as HTMLButtonElement;
  const tab3dBtn = document.getElementById('3dTabBtn') as HTMLButtonElement;
  if (planTabBtn) { planTabBtn.disabled = true; planTabBtn.classList.add('disabled'); }
  if (tab3dBtn) { tab3dBtn.disabled = true; tab3dBtn.classList.add('disabled'); }
  const switchTabFn = (window as any).switchTab; if (switchTabFn) switchTabFn('preview');
  webcamSection.style.display = 'block'; captureBtn.disabled = true;
  downloadBtn.style.display = 'none'; isProcessing = false;
  currentLandmarks = null; currentSession = null;
  updateProgressSteps(1);
  if (analysisStatus) { analysisStatus.parentElement?.classList.remove('ready'); analysisStatus.parentElement?.classList.add('not-ready'); analysisStatus.textContent = t('openMouthWider'); }
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (!camera) await startCamera();
}

captureBtn.addEventListener('click', capturePhoto);
downloadBtn.addEventListener('click', downloadResult);
retryBtn.addEventListener('click', retry);

async function initializeApp() {
  console.log('🚀 [DEBUG] Beame Teeth Straightener initialized');
  if (ENABLE_TOOTH_DETECTION) {
    try { await loadONNXModel(ONNX_MODEL_PATH); console.log('✅ Tooth detection ready!'); } catch (error) { console.error('❌ Failed to load model', error); }
  }
  enableDiagnostics();
  const existingSession = loadCurrentSession();
  console.log('📹 [DEBUG] Camera ready to start on user interaction');
  const startOverlay = document.getElementById('cameraStartOverlay');
  if (startOverlay && !camera) {
    startOverlay.addEventListener('click', async () => {
      if (!camera) {
        const started = await startCamera();
        if (started) { setCookie('beame_camera_prompted', 'true', 365); startOverlay.classList.add('hidden'); }
      }
    });
    cameraStatus.textContent = currentLanguage === 'en' ? 'Waiting for camera...' : '等待啟動攝像頭';
    cameraStatus.style.color = '#f08c00';
    const statusBadge = document.getElementById('cameraStatusBadge');
    const statusDot = statusBadge?.querySelector('.status-dot') as HTMLElement;
    if (statusDot) { statusDot.style.background = '#f08c00'; statusDot.style.boxShadow = '0 0 10px #f08c00'; }
  }
}

(window as any).initializeStageCapture = initializeStageCapture;
initializeApp();
