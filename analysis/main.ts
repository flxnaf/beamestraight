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
import { drawSmoothToothOverlay } from './services/teethOverlay';
import { generateStraightenedImage as apiGenerateStraightenedImage, classifyDentalCase as apiClassifyDentalCase } from './services/apiClient';

// CONFIGURATION: Set to true to save API credits during development
const USE_FALLBACK_MODE = false; // Set to false to enable real AI generation

// Note: Gemini AI is now accessed through the backend API for security
// The @google/generative-ai import is kept for type compatibility but not used directly
const _genAI = new GoogleGenerativeAI(''); // Unused - kept for backwards compatibility

// ============================================
// TOOTH DETECTION CONFIGURATION
// ============================================
// Master switch: Set to false to completely disable white teeth overlay
// This also skips all ONNX CV detection work (saves performance)
const ENABLE_TEETH_OVERLAY = true; // Set to false to disable teeth detection & overlay
const ONNX_MODEL_PATH = import.meta.env.VITE_ONNX_MODEL_PATH || '/models/teeth_seg_320x320.onnx';

// Roboflow API (fallback only - slower)
const ROBOFLOW_API_KEY = import.meta.env.VITE_ROBOFLOW_API_KEY || '';
const ROBOFLOW_MODEL_ID = import.meta.env.VITE_ROBOFLOW_MODEL_ID || '';
const USE_ROBOFLOW_FALLBACK = ROBOFLOW_API_KEY.length > 0 && ROBOFLOW_MODEL_ID.length > 0;

// Language state and translations
let currentLanguage = localStorage.getItem('beame-language') || 'en';
// Normalize language key
if (currentLanguage.includes('zh')) currentLanguage = 'zh';
if (currentLanguage.includes('en')) currentLanguage = 'en';

  const translations: Record<string, Record<string, string>> = {
  en: {
    cameraStarting: 'Starting...',
    cameraActive: 'Active',
    cameraDenied: 'Access Denied',
    faceDetected: 'Face Detected',
    noFace: 'No Face Detected',
    mouthOpenTitle: 'VALID',
    mouthOpenText: 'Perfect! Ready to capture',
    mouthClosedTitle: 'Open Your Mouth Wide',
    mouthClosedText: 'Show your teeth clearly',
    readyCapture: 'Ready to Capture',
    openMouthWider: 'Open Mouth Wider',
    analyzingDental: 'Analyzing dental structure...',
    generatingPlan: 'Generating treatment plan...',
    savingSession: 'Saving session data...',
    preparingPlan: 'Preparing treatment plan...',
    eligibleTitle: 'Eligible for Treatment',
    reviewTitle: 'Clinical Review Required',
    rejectTitle: 'Not Suitable for Aligners',
    defaultMessage: 'Assessment complete.',
    months: 'months',
    aligners: 'aligners',
    crowdingCorrection: 'Crowding Correction',
    rotationCorrection: 'Rotation Correction',
    spacingCorrection: 'Spacing Correction',
    midlineCorrection: 'Midline Correction',
    biteCorrection: 'Bite Correction',
    'All-Day': 'All-Day',
    'Night': 'Night',
    basedOnAiAnalysis: 'Based on AI Analysis',
    frontOpenView: 'Front Open View',
    lowerTeethView: 'Lower Teeth View',
    upperTeethView: 'Upper Teeth View',
    sideOpenView: 'Side Open View',
    frontOpenInstruction: 'Open your mouth wide to clearly show all your front teeth. Align your mouth within the guides.',
    lowerTeethInstruction: 'Open your mouth wide and tilt your head down slightly to show your lower teeth clearly.',
    upperTeethInstruction: 'Open your mouth wide and tilt your head up slightly to show your upper teeth clearly.',
    sideOpenInstruction: 'Turn your head significantly to the side and open your mouth wide to show your side teeth.',
    getCloser: 'Get closer to camera',
    tooClose: 'Move back slightly',
    centerMouth: 'Center mouth',
    teethDetected: 'Teeth Detected',
    tryGetMore: 'Try get as many tooth detected',
    lookStraight: 'Look straight',
    openWider: 'Open wider',
    openMuchWider: 'Open much wider',
    closeMouth: 'Close mouth - teeth together',
    showTeeth: 'Show teeth slightly',
    tiltHeadDown: 'Tilt head down',
    tiltHeadUp: 'Tilt head up',
    turnHeadTo70: 'Turn head to 70°',
    ready: 'READY',
    detectingLandmarks: 'Detecting facial landmarks...',
    analyzingJaw: 'Analyzing jaw structure...',
    mappingTeeth: 'Mapping tooth positions...',
    calculatingAlignment: 'Calculating optimal alignment...',
    generatingImage: 'Generating straightened image...',
    applyingEnhancement: 'Applying Beame enhancement...',
    finalizingResults: 'Finalizing results...'
  },
  zh: {
    cameraStarting: '正在啟動...',
    cameraActive: '攝像頭已啟動',
    cameraDenied: '拒絕訪問攝像頭',
    faceDetected: '檢測到面部',
    noFace: '未檢測到面部',
    mouthOpenTitle: '有效',
    mouthOpenText: '太棒了！準備拍攝',
    mouthClosedTitle: '請張開嘴巴',
    mouthClosedText: '請清晰露出您的牙齒進行分析',
    readyCapture: '準備拍攝',
    openMouthWider: '請張大嘴巴',
    analyzingDental: '正在分析牙齒結構...',
    generatingPlan: '正在生成治療方案...',
    savingSession: '正在保存會話數據...',
    preparingPlan: '正在準備治療報告...',
    eligibleTitle: '符合治療條件',
    reviewTitle: '需要臨床審核',
    rejectTitle: '不適合隱形牙套',
    defaultMessage: '評估完成。',
    months: '個月',
    aligners: '個牙套',
    crowdingCorrection: '擁擠矯正',
    rotationCorrection: '旋轉矯正',
    spacingCorrection: '間隙矯正',
    midlineCorrection: '中線矯正',
    biteCorrection: '咬合矯正',
    'All-Day': '全天佩戴',
    'Night': '夜間佩戴',
    basedOnAiAnalysis: '基於 AI 分析',
    frontOpenView: '正面張口視圖',
    lowerTeethView: '下排牙齒視圖',
    upperTeethView: '上排牙齒視圖',
    sideOpenView: '側面張口視圖',
    frontOpenInstruction: '請將嘴巴張大，清楚展示您的所有前牙。請將您的嘴巴對準導引框。',
    lowerTeethInstruction: '請將嘴巴張大並稍微向下傾斜頭部，清楚展示您的下排牙齒。',
    upperTeethInstruction: '請將嘴巴張大並稍微向上傾斜頭部，清楚展示您的上排牙齒。',
    sideOpenInstruction: '請將頭部明顯轉向側面並張大嘴巴，展示您的側面牙齒。',
    getCloser: '請靠近攝像頭',
    tooClose: '請稍微後退',
    centerMouth: '請對準中心',
    teethDetected: '已偵測到牙齒',
    tryGetMore: '嘗試捕捉更多牙齒',
    lookStraight: '請直視前方',
    openWider: '請張大嘴巴',
    openMuchWider: '請將嘴巴張到最大',
    closeMouth: '請閉合嘴巴 - 牙齒併攏',
    showTeeth: '請微微露出牙齒',
    tiltHeadDown: '請下傾頭部',
    tiltHeadUp: '請上傾頭部',
    turnHeadTo70: '請將頭部側轉70度',
    ready: '準備就緒',
    detectingLandmarks: '正在檢測面部特徵點...',
    analyzingJaw: '正在分析顎骨結構...',
    mappingTeeth: '正在繪製牙齒位置圖...',
    calculatingAlignment: '正在計算最佳排列方案...',
    generatingImage: '正在生成矯正後圖像...',
    applyingEnhancement: '正在應用 Beame 增強效果...',
    finalizingResults: '正在完成最終結果...'
  }
};

function t(key: string): string {
  if (!translations[currentLanguage]) {
    console.warn(`[DEBUG] Language "${currentLanguage}" not found in translations`);
    return key;
  }
  return translations[currentLanguage][key] || key;
}

window.addEventListener('languageChanged', (e: any) => {
  console.log(`[DEBUG] Language changed to: ${e.detail}`);
  currentLanguage = e.detail;
  
  // Update all translated elements in the DOM
  document.querySelectorAll('[data-en]').forEach((el: any) => {
    const translation = el.getAttribute(`data-${currentLanguage}`);
    if (translation) el.textContent = translation;
  });

  // Trigger UI update for current state
  if (cameraStatus) cameraStatus.textContent = t('cameraActive');
  if (faceStatus) faceStatus.textContent = faceDetected ? t('faceDetected') : t('noFace');
  // Update analysis status label
  if (analysisStatus) {
    analysisStatus.textContent = mouthOpen ? t('readyCapture') : t('openMouthWider');
  }

  // Refresh treatment plan if it exists
  if (currentSession?.treatmentPlan) {
    // We need to re-apply overrides to get the right language for reasons
    const caseType = document.querySelector('.case-tier.active')?.id.replace('tier-', '') || 'MODERATE';
    const updatedPlan = overridePlanWithClassification(currentSession.treatmentPlan, caseType);
    displayTreatmentPlan(updatedPlan);
    
    // Also update classification visualizer label
    const activeTier = document.querySelector('.case-tier.active');
    if (activeTier) {
      const classification = activeTier.id.replace('tier-', '') as 'MILD' | 'MODERATE' | 'COMPLEX' | 'URGENT';
      displayCaseClassification(classification);
    }
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
const nextToPlanBtn = document.getElementById('nextToPlanBtn') as HTMLButtonElement;
// Status elements
const cameraStatus = document.getElementById('cameraStatus') as HTMLSpanElement;
const faceStatus = document.getElementById('faceStatus') as HTMLSpanElement;
const analysisStatus = document.getElementById('analysisStatus') as HTMLSpanElement;
const teethStatus = document.getElementById('teethStatus') as HTMLSpanElement;

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
const stageForm = document.getElementById('stageForm') as HTMLDivElement;
const captureHint = document.getElementById('captureHint') as HTMLParagraphElement;
const finalSubmitBtn = document.getElementById('finalSubmitBtn') as HTMLButtonElement;
const userNameInput = document.getElementById('userName') as HTMLInputElement;
const userEmailInput = document.getElementById('userEmail') as HTMLInputElement;
const userPhoneInput = document.getElementById('userPhone') as HTMLInputElement;
const thumbBtns = [
  document.getElementById('thumb-0') as HTMLButtonElement,
  document.getElementById('thumb-1') as HTMLButtonElement,
  document.getElementById('thumb-2') as HTMLButtonElement
];
const thumbImgs = [
  document.getElementById('thumbImg-0') as HTMLImageElement,
  document.getElementById('thumbImg-1') as HTMLImageElement,
  document.getElementById('thumbImg-2') as HTMLImageElement
];

// State
let camera: Camera | null = null;
let faceMesh: any = null; // Reusing single FaceMesh instance
let isProcessing = false;
let faceDetected = false;
let mouthOpen = false;
let currentGenerationId = 0; // Track generation attempts
let hideFeedbackForCapture = false; // Flag to temporarily hide feedback text for clean capture
let currentLandmarks: any[] | null = null; // Store latest face landmarks
let currentSession: ScanSession | null = null;
let pendingDentalAnalysis: DentalAnalysis | null = null;
// Tooth detection state (Roboflow ML model)
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
const TOOTH_DETECTION_INTERVAL = 100; // Run 320x320 fast - smooth updates
let isDetecting = false; // Prevent overlapping API calls

// MediaPipe-based interpolation cache
interface TeethInterpolationCache {
  detections: ToothDetection[];           // ONNX detections at reference time
  refMouthCenter: { x: number; y: number }; // Mouth center when ONNX ran
  refMouthWidth: number;                    // Mouth width when ONNX ran
}
let teethInterpolationCache: TeethInterpolationCache | null = null;

// Landmark smoothing to reduce MediaPipe jitter
interface SmoothedLandmark {
  x: number;
  y: number;
  z?: number;
}
let smoothedLandmarks: SmoothedLandmark[] | null = null;
let smoothedStageLandmarks: SmoothedLandmark[] | null = null; // Separate smoothing for stage view
const SMOOTHING_FACTOR = 0.65; // Higher smoothing since we disabled refineLandmarks

/**
 * Smooth landmarks using Exponential Moving Average to reduce jitter
 * This makes the overlay much more stable even when MediaPipe is jittery
 */
function smoothLandmarks(rawLandmarks: any[], isStage: boolean = false): SmoothedLandmark[] {
  const buffer = isStage ? smoothedStageLandmarks : smoothedLandmarks;
  
  if (!buffer || buffer.length !== rawLandmarks.length) {
    // First frame - initialize with raw landmarks
    const newBuffer = rawLandmarks.map(lm => ({ x: lm.x, y: lm.y, z: lm.z }));
    if (isStage) {
      smoothedStageLandmarks = newBuffer;
    } else {
      smoothedLandmarks = newBuffer;
    }
    return newBuffer;
  }
  
  // Apply exponential moving average smoothing
  // smoothed = smoothed * alpha + raw * (1 - alpha)
  const alpha = SMOOTHING_FACTOR;
  const beta = 1 - alpha;
  
  for (let i = 0; i < rawLandmarks.length; i++) {
    buffer[i].x = buffer[i].x * alpha + rawLandmarks[i].x * beta;
    buffer[i].y = buffer[i].y * alpha + rawLandmarks[i].y * beta;
    if (rawLandmarks[i].z !== undefined) {
      buffer[i].z = (buffer[i].z || 0) * alpha + rawLandmarks[i].z * beta;
    }
  }
  
  return buffer;
}

/**
 * Interpolate teeth positions using MediaPipe landmarks
 * This runs at 30fps using the fast MediaPipe data to move
 * accurate ONNX detections smoothly with the face
 */
function interpolateTeethWithMediaPipe(
  currentLandmarks: any[],
  canvasWidth: number,
  canvasHeight: number
): ToothDetection[] {
  if (!teethInterpolationCache || teethInterpolationCache.detections.length === 0) {
    return [];
  }
  
  // Get current mouth position from MediaPipe (runs at 30fps)
  const leftMouth = currentLandmarks[61];
  const rightMouth = currentLandmarks[291];
  const upperLip = currentLandmarks[13];
  const lowerLip = currentLandmarks[14];
  
  if (!leftMouth || !rightMouth || !upperLip || !lowerLip) {
    return teethInterpolationCache.detections;
  }
  
  const currentMouthCenterX = ((leftMouth.x + rightMouth.x) / 2) * canvasWidth;
  const currentMouthCenterY = ((upperLip.y + lowerLip.y) / 2) * canvasHeight;
  const currentMouthWidth = Math.abs((rightMouth.x - leftMouth.x) * canvasWidth);
  
  // Calculate how mouth has moved since ONNX detection
  const deltaX = currentMouthCenterX - teethInterpolationCache.refMouthCenter.x;
  const deltaY = currentMouthCenterY - teethInterpolationCache.refMouthCenter.y;
  
  // Calculate uniform scale (prevents stretching - only scales proportionally)
  const scale = currentMouthWidth / teethInterpolationCache.refMouthWidth;
  
  // Transform each tooth to follow mouth movement
  return teethInterpolationCache.detections.map(tooth => {
    // Get tooth center relative to reference mouth center
    const toothCenterX = tooth.x + tooth.width / 2;
    const toothCenterY = tooth.y + tooth.height / 2;
    const relX = toothCenterX - teethInterpolationCache!.refMouthCenter.x;
    const relY = toothCenterY - teethInterpolationCache!.refMouthCenter.y;
    
    // Apply uniform scale around mouth center, then translate
    const newCenterX = teethInterpolationCache!.refMouthCenter.x + relX * scale + deltaX;
    const newCenterY = teethInterpolationCache!.refMouthCenter.y + relY * scale + deltaY;
    const newWidth = tooth.width * scale;
    const newHeight = tooth.height * scale;
    
    return {
      ...tooth,
      x: newCenterX - newWidth / 2,
      y: newCenterY - newHeight / 2,
      width: newWidth,
      height: newHeight
    };
  });
}

// Tab 3 (4-stage capture) state
type CaptureStageId = 'front_smile' | 'lower_front' | 'upper_front' | 'side_bite';
interface CaptureStageConfig {
  id: CaptureStageId;
  title: string;
  instruction: string;
}

// CAPTURE_STAGES is now dynamically generated to support translations
// Front view is captured in AI preview, so we only need 3 additional views
function getCaptureStages(): CaptureStageConfig[] {
  return [
    {
      id: 'lower_front',
      title: t('lowerTeethView'),
      instruction: t('lowerTeethInstruction')
    },
    {
      id: 'upper_front',
      title: t('upperTeethView'),
      instruction: t('upperTeethInstruction')
    },
    {
      id: 'side_bite',
      title: t('sideOpenView'),
      instruction: t('sideOpenInstruction')
    }
  ];
}

let stageCamera: Camera | null = null;
let stageCaptures: Array<string | null> = [null, null, null]; // 3 stages: lower, upper, side
let activeStageIndex = 0;
let stageReady = false;
let stageLandmarks: any[] | null = null;
let cleanFrontImageFromPreview: string | null = null; // Store the clean front image from AI preview
// Teeth detection disabled for Photo Scan - using MediaPipe guide only

// Example photos management
const EXAMPLE_PHOTOS_KEY = 'beame_example_photos';
let usingExamplePhotos = false;

function downloadExamplePhotos() {
  const allCaptured = stageCaptures.every(img => img !== null);
  if (!allCaptured) {
    alert(currentLanguage === 'en' 
      ? 'Please capture all 3 photos first before downloading.' 
      : '請先拍攝全部 3 張照片再下載。');
    return;
  }
  
  try {
    const labels = ['lower', 'upper', 'side'];
    // Download each photo with a delay to ensure all 3 are saved
    stageCaptures.forEach((imgDataUrl, index) => {
      if (imgDataUrl) {
        setTimeout(() => {
          const link = document.createElement('a');
          link.href = imgDataUrl;
          link.download = `beame_example_${labels[index]}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }, index * 300); // 300ms delay between each download
      }
    });
    alert(currentLanguage === 'en' 
      ? '✓ Photos downloading to your downloads folder!' 
      : '✓ 照片正在下載至您的下載資料夾！');
  } catch (error) {
    console.error('Failed to download example photos:', error);
    alert(currentLanguage === 'en' 
      ? 'Failed to download photos.' 
      : '無法下載照片。');
  }
}

function loadExamplePhotos(): boolean {
  try {
    const saved = localStorage.getItem(EXAMPLE_PHOTOS_KEY);
    if (saved) {
      const examples = JSON.parse(saved);
      if (Array.isArray(examples) && examples.length === 3) {
        stageCaptures = examples;
        usingExamplePhotos = true;
        return true;
      }
    }
  } catch (error) {
    console.error('Failed to load example photos:', error);
  }
  return false;
}

function clearExamplePhotos() {
  try {
    localStorage.removeItem(EXAMPLE_PHOTOS_KEY);
    alert(currentLanguage === 'en' 
      ? '✓ Example photos cleared!' 
      : '✓ 範例照片已清除！');
    usingExamplePhotos = false;
    stageCaptures = [null, null, null];
    thumbImgs.forEach(img => {
      if (img) {
        img.src = '';
        img.style.display = 'none';
      }
    });
    updateStageUI();
  } catch (error) {
    console.error('Failed to clear example photos:', error);
  }
}

function updateExamplePhotoIndicators() {
  thumbImgs.forEach((img, idx) => {
    if (img && stageCaptures[idx] && usingExamplePhotos) {
      img.style.border = '3px solid #f08c00';
      img.style.opacity = '0.85';
      // Add example badge if not exists
      let badge = img.parentElement?.querySelector('.example-badge') as HTMLElement;
      if (!badge) {
        badge = document.createElement('div');
        badge.className = 'example-badge';
        badge.textContent = 'EXAMPLE';
        badge.style.position = 'absolute';
        badge.style.top = '5px';
        badge.style.left = '5px';
        badge.style.background = 'rgba(240, 140, 0, 0.9)';
        badge.style.color = 'white';
        badge.style.padding = '2px 6px';
        badge.style.borderRadius = '3px';
        badge.style.fontSize = '10px';
        badge.style.fontWeight = 'bold';
        badge.style.zIndex = '10';
        if (img.parentElement) {
          img.parentElement.style.position = 'relative';
          img.parentElement.appendChild(badge);
        }
      }
      badge.style.display = 'block';
    } else if (img) {
      img.style.border = '';
      img.style.opacity = '1';
      const badge = img.parentElement?.querySelector('.example-badge') as HTMLElement;
      if (badge) badge.style.display = 'none';
    }
  });
}

// Initialize MediaPipe Face Mesh
function initializeFaceMesh() {
  if (faceMesh) return; // Already initialized

  console.log('[DEBUG] Initializing common FaceMesh instance...');
  faceMesh = new FaceMeshConstructor({
    locateFile: (file: string) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
    }
  });

  faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: false, // DISABLED - this is expensive! Saves ~40% processing time
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
    selfieMode: true // Optimize for front-facing camera
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
  
  // Threshold for considering mouth as "open wide" (increased for better validation)
  const threshold = 0.05; // Increased from 0.04 to 0.05
  
  return mouthOpenDistance > threshold;
}

// Transform cached teeth using interpolation cache (for stage view)
function transformStageTeeth(
  cache: TeethInterpolationCache,
  currentLandmarks: any[],
  width: number,
  height: number
): ToothDetection[] {
  const leftMouth = currentLandmarks[61];
  const rightMouth = currentLandmarks[291];
  const upperLip = currentLandmarks[13];
  const lowerLip = currentLandmarks[14];
  
  if (!leftMouth || !rightMouth || !upperLip || !lowerLip) {
    return cache.detections;
  }
  
  const currentMouthCenterX = ((leftMouth.x + rightMouth.x) / 2) * width;
  const currentMouthCenterY = ((upperLip.y + lowerLip.y) / 2) * height;
  const currentMouthWidth = Math.abs((rightMouth.x - leftMouth.x) * width);
  
  const deltaX = currentMouthCenterX - cache.refMouthCenter.x;
  const deltaY = currentMouthCenterY - cache.refMouthCenter.y;
  const scale = currentMouthWidth / cache.refMouthWidth;
  
  return cache.detections.map((tooth: ToothDetection) => {
    const toothCenterX = tooth.x + tooth.width / 2;
    const toothCenterY = tooth.y + tooth.height / 2;
    const relX = toothCenterX - cache.refMouthCenter.x;
    const relY = toothCenterY - cache.refMouthCenter.y;
    
    const newCenterX = cache.refMouthCenter.x + relX * scale + deltaX;
    const newCenterY = cache.refMouthCenter.y + relY * scale + deltaY;
    const newWidth = tooth.width * scale;
    const newHeight = tooth.height * scale;
    
    return {
      ...tooth,
      x: newCenterX - newWidth / 2,
      y: newCenterY - newHeight / 2,
      width: newWidth,
      height: newHeight
    };
  });
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
  // Get mouth bounding box from MediaPipe landmarks (only teeth area, not whole face)
  const teethLandmarks = [
    78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308,  // Upper teeth line
    78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308   // Lower teeth line
  ];

  // Calculate tight mouth bounding box
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  
  teethLandmarks.forEach(idx => {
    if (landmarks[idx]) {
      const x = landmarks[idx].x * width;
      const y = landmarks[idx].y * height;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  });

  // Add minimal padding (5% instead of 10% - more restrictive)
  const paddingX = (maxX - minX) * 0.05;
  const paddingY = (maxY - minY) * 0.05;
  minX -= paddingX;
  maxX += paddingX;
  minY -= paddingY;
  maxY += paddingY;

  // Filter: BOTH center AND majority of box must be in mouth region
  return detections.filter(tooth => {
    const centerX = tooth.x + tooth.width / 2;
    const centerY = tooth.y + tooth.height / 2;
    
    // Check if center is in mouth
    const centerInMouth = centerX >= minX && centerX <= maxX && 
                          centerY >= minY && centerY <= maxY;
    
    // Check if at least 60% of the box overlaps with mouth region
    const overlapX1 = Math.max(tooth.x, minX);
    const overlapY1 = Math.max(tooth.y, minY);
    const overlapX2 = Math.min(tooth.x + tooth.width, maxX);
    const overlapY2 = Math.min(tooth.y + tooth.height, maxY);
    
    const overlapArea = Math.max(0, overlapX2 - overlapX1) * Math.max(0, overlapY2 - overlapY1);
    const toothArea = tooth.width * tooth.height;
    const overlapRatio = overlapArea / toothArea;
    
    return centerInMouth && overlapRatio > 0.6;
  });
}

// Smart upper/lower teeth separator - prevents 3-layer artifacts
function splitUpperLowerTeeth(
  detections: ToothDetection[], 
  landmarks: any[], 
  width: number, 
  height: number
): ToothDetection[] {
  if (!landmarks || landmarks.length === 0) return detections;
  
  // Get upper and lower lip center points
  const upperLip = landmarks[13]; // Upper lip center
  const lowerLip = landmarks[14]; // Lower lip center
  
  if (!upperLip || !lowerLip) return detections;
  
  // Calculate midline between lips (pixel coordinates)
  const midlineY = ((upperLip.y + lowerLip.y) / 2) * height;
  const lipGap = Math.abs(lowerLip.y - upperLip.y) * height;
  
  // Define "dead zone" - very small middle area (only when teeth are CLOSED)
  // Only apply dead zone filtering when gap is small (teeth closed)
  const teethAreClosed = lipGap < 40;
  const deadZoneMargin = teethAreClosed ? lipGap * 0.15 : 0; // 30% dead zone only when closed
  const deadZoneTop = midlineY - deadZoneMargin;
  const deadZoneBottom = midlineY + deadZoneMargin;
  
  // STEP 1: Remove small noise and dead zone artifacts (only when teeth closed)
  const cleanDetections = detections.filter(tooth => {
    const toothCenter = tooth.y + tooth.height / 2;
    const inDeadZone = deadZoneMargin > 0 && toothCenter > deadZoneTop && toothCenter < deadZoneBottom;
    const tooSmall = tooth.width < 8 || tooth.height < 8;
    return !inDeadZone && !tooSmall;
  });
  
  // STEP 2: Check if we already have clear upper AND lower teeth (at least 2 of each)
  const upperTeethCount = cleanDetections.filter(t => (t.y + t.height / 2) < midlineY).length;
  const lowerTeethCount = cleanDetections.filter(t => (t.y + t.height / 2) > midlineY).length;
  const spanningCount = cleanDetections.filter(t => t.y < midlineY && (t.y + t.height) > midlineY).length;
  
  // STEP 3: Only split if we have spanning boxes AND we're missing one layer
  // This prevents creating 3 layers when teeth are closed
  const missingLayer = upperTeethCount < 2 || lowerTeethCount < 2;
  const shouldSplit = missingLayer && spanningCount > 0 && lipGap > 15;
  
  if (!shouldSplit) {
    return cleanDetections; // Already have both layers cleanly, don't split
  }
  
  // STEP 4: Split large spanning detections
  const result: ToothDetection[] = [];
  
  cleanDetections.forEach(tooth => {
    const toothTop = tooth.y;
    const toothBottom = tooth.y + tooth.height;
    
    // Check if tooth spans across the midline significantly
    const spansUpperLower = toothTop < midlineY && toothBottom > midlineY;
    const spanAmount = Math.min(midlineY - toothTop, toothBottom - midlineY);
    
    // Only split if it spans both regions (>25% on each side)
    if (spansUpperLower && spanAmount > tooth.height * 0.25) {
      // Split into upper tooth and lower tooth
      const upperTooth: ToothDetection = {
        x: tooth.x,
        y: tooth.y,
        width: tooth.width,
        height: midlineY - tooth.y,
        confidence: tooth.confidence * 0.85, // Lower confidence for splits
        class: 'tooth',
        toothNumber: tooth.toothNumber
      };
      
      const lowerTooth: ToothDetection = {
        x: tooth.x,
        y: midlineY,
        width: tooth.width,
        height: toothBottom - midlineY,
        confidence: tooth.confidence * 0.85,
        class: 'tooth',
        toothNumber: tooth.toothNumber
      };
      
      // Only keep splits that are reasonable size
      if (upperTooth.height > 5) result.push(upperTooth);
      if (lowerTooth.height > 5) result.push(lowerTooth);
    } else {
      // Keep original tooth if it doesn't span both regions
      result.push(tooth);
    }
  });
  
  return result;
}

// Draw smooth tooth overlays (professional Smileset-style)
function drawTeethDetections(ctx: CanvasRenderingContext2D, detections: ToothDetection[]) {
  if (ENABLE_TEETH_OVERLAY) {
    drawSmoothToothOverlay(ctx, detections, true); // true = show confidence percentages (supervisor approved!)
  }
}

// Draw clean mouth tracking overlay - professional and minimal
function drawCustomFaceMesh(ctx: CanvasRenderingContext2D, landmarks: any[], width: number, height: number, isValid: boolean = true, feedback: string = '') {
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
  
  // Define colors based on validity (mouth open enough)
  const readyColor = '#00ce7c'; // Green
  const errorColor = '#ef4444'; // Red
  const mainColor = isValid ? readyColor : errorColor;
  const shadowColor = isValid ? 'rgba(0, 206, 124, 0.5)' : 'rgba(239, 68, 68, 0.5)';

  // Draw clean focus frame around mouth area
  const padding = 40;
  const frameX = mouthCenterX - mouthWidth / 2 - padding;
  const frameY = mouthCenterY - mouthHeight / 2 - padding;
  const frameWidth = mouthWidth + padding * 2;
  const frameHeight = mouthHeight + padding * 2;
  
  // Animated corner brackets
  ctx.strokeStyle = mainColor;
  ctx.lineWidth = 3;
  ctx.shadowColor = mainColor;
  ctx.shadowBlur = 5;
  
  const cornerSize = 20;
  const time = Date.now() / 1000;
  const pulse = Math.sin(time * 2) * 0.3 + 0.7; // Pulse between 0.4 and 1.0
  
  ctx.globalAlpha = pulse;
  
  // Corner Brackets
  const drawCorner = (x: number, y: number, dx: number, dy: number) => {
    ctx.beginPath();
    ctx.moveTo(x + dx, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + dy);
    ctx.stroke();
  };
  
  drawCorner(frameX, frameY, cornerSize, cornerSize);
  drawCorner(frameX + frameWidth, frameY, -cornerSize, cornerSize);
  drawCorner(frameX, frameY + frameHeight, cornerSize, -cornerSize);
  drawCorner(frameX + frameWidth, frameY + frameHeight, -cornerSize, -cornerSize);
  
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  
  // Draw detailed mouth and teeth contours
  ctx.strokeStyle = isValid ? 'rgba(0, 206, 124, 0.8)' : 'rgba(239, 68, 68, 0.8)';
  ctx.lineWidth = 2.5;
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
  
  // Upper/Lower teeth line
  ctx.strokeStyle = isValid ? 'rgba(0, 206, 124, 0.6)' : 'rgba(239, 68, 68, 0.6)';
  ctx.lineWidth = 2;
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

  // Draw feedback text centered on head
  if (feedback) {
    ctx.save();
    // No mirroring needed
    
    ctx.font = 'bold 24px -apple-system, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 4;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    
    const textMetrics = ctx.measureText(feedback);
    const textWidth = textMetrics.width + 40;
    ctx.fillStyle = isValid ? 'rgba(0, 206, 124, 0.8)' : 'rgba(239, 68, 68, 0.85)';
    ctx.beginPath();
    // Move tooltip to the bottom (80% down the height)
    ctx.roundRect(width/2 - textWidth/2, height * 0.8, textWidth, 40, [20]);
    ctx.fill();
    
    ctx.fillStyle = '#fff';
    ctx.fillText(feedback, width/2, height * 0.8 + 28);
    ctx.restore();
  }
}

// Draw clean mouth tracking overlay - professional and minimal
function drawDentalOverlay(
  ctx: CanvasRenderingContext2D, 
  landmarks: any[], 
  width: number, 
  height: number, 
  isReady: boolean = true,
  stageId: string = 'preview',
  feedback: string = ''
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
  
  // Use GREEN for ready, RED for not recognized/waiting as requested
  const readyColor = '#00ce7c';
  const errorColor = '#ef4444'; 
  const mainColor = isReady ? readyColor : errorColor;

  // 1. Draw Face Silhouette (Subtle guide for overall head position)
  ctx.strokeStyle = isReady ? 'rgba(0, 206, 124, 0.2)' : 'rgba(239, 68, 68, 0.15)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  const silCenterX = width / 2;
  const silCenterY = height * 0.55; 
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
  const pulse = isReady ? (Math.sin(time * 4) * 0.2 + 0.8) : 0.6;
  
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
  ctx.lineWidth = 2.5;
  
  // A. Outer lip contour
  ctx.strokeStyle = isReady ? 'rgba(0, 206, 124, 1.0)' : 'rgba(239, 68, 68, 0.7)';
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
  ctx.strokeStyle = isReady ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.4)';
  
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
    const targetY = height * 0.55; 
    ctx.beginPath();
    ctx.moveTo(targetX - 20, targetY); ctx.lineTo(targetX + 20, targetY);
    ctx.moveTo(targetX, targetY - 20); ctx.lineTo(targetX, targetY + 20);
    ctx.stroke();
  }

  // 5. On-Canvas Feedback Text (CV Style)
  if (feedback) {
    ctx.save();
    
    // No mirroring needed
    
    ctx.font = 'bold 24px -apple-system, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 4;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    
    const textMetrics = ctx.measureText(feedback);
    const textWidth = textMetrics.width + 40;
    ctx.fillStyle = isReady ? 'rgba(0, 206, 124, 0.8)' : 'rgba(239, 68, 68, 0.85)';
    ctx.beginPath();
    // Move tooltip to the bottom (80% down the height)
    ctx.roundRect(width/2 - textWidth/2, height * 0.8, textWidth, 40, [20]);
    ctx.fill();
    
    ctx.fillStyle = '#fff';
    ctx.fillText(feedback, width/2, height * 0.8 + 28);
    ctx.restore();
  }
}

// Draw clean mouth tracking overlay - professional and minimal
function _drawCustomFaceMesh(ctx: CanvasRenderingContext2D, landmarks: any[], width: number, height: number) {
  drawCustomFaceMesh(ctx, landmarks, width, height);
}

// Handle Face Mesh results
function onFaceMeshResults(results: any) {
  const canvasCtx = canvasElement.getContext('2d')!;
  
  canvasElement.width = webcamElement.videoWidth;
  canvasElement.height = webcamElement.videoHeight;
  
  // No mirroring applied

  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

  if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
    faceDetected = true;
    faceStatus.textContent = t('faceDetected');
    faceStatus.style.color = '#00ce7c';
    
    // Apply smoothing to reduce MediaPipe jitter
    const rawLandmarks = results.multiFaceLandmarks[0];
    const landmarks = smoothLandmarks(rawLandmarks);
    currentLandmarks = landmarks;
    mouthOpen = isMouthOpen(landmarks);
    
    // Check if user is close enough for teeth detection
    const leftMouth = landmarks[61];
    const rightMouth = landmarks[291];
    const mouthWidth = Math.abs((rightMouth.x - leftMouth.x) * canvasElement.width);
    const isCloseEnough = mouthWidth > 280; // Minimum mouth width for good detection
    const isReady = isCloseEnough && mouthOpen; // Both conditions must be true for green overlay
    
    let feedback = '';
    if (!isProcessing && !hideFeedbackForCapture) {
      if (!isCloseEnough) {
        analysisStatus.parentElement?.classList.remove('ready');
        analysisStatus.parentElement?.classList.add('not-ready');
        analysisStatus.textContent = t('getCloser');
        captureBtn.disabled = true;
        feedback = t('getCloser');
      } else if (mouthOpen) {
        analysisStatus.parentElement?.classList.remove('not-ready');
        analysisStatus.parentElement?.classList.add('ready');
        analysisStatus.textContent = t('readyCapture');
        captureBtn.disabled = false;
        feedback = t('readyCapture');
      } else {
        analysisStatus.parentElement?.classList.remove('ready');
        analysisStatus.parentElement?.classList.add('not-ready');
        analysisStatus.textContent = t('openMouthWider');
        captureBtn.disabled = true;
        feedback = t('openMouthWider');
      }
    }
    
    // Run ONNX teeth detection BEFORE drawing overlays (for clean inference)
    if (ENABLE_TEETH_OVERLAY && isONNXReady() && !isDetecting) {
      const now = Date.now();
      if (now - lastToothDetectionTime > TOOTH_DETECTION_INTERVAL) {
        lastToothDetectionTime = now;
        isDetecting = true;
        
        // Get clean ImageData BEFORE overlays are drawn
        const imageData = canvasCtx.getImageData(0, 0, canvasElement.width, canvasElement.height);
        
        // Capture current mouth position for interpolation reference
        const leftMouth = landmarks[61];
        const rightMouth = landmarks[291];
        const upperLip = landmarks[13];
        const lowerLip = landmarks[14];
        
        const refMouthCenter = {
          x: ((leftMouth.x + rightMouth.x) / 2) * canvasElement.width,
          y: ((upperLip.y + lowerLip.y) / 2) * canvasElement.height
        };
        const refMouthWidth = Math.abs((rightMouth.x - leftMouth.x) * canvasElement.width);
        
        // Run ONNX detection using requestIdleCallback to avoid blocking display
        const runDetection = () => {
          detectTeethONNX(imageData, 320, 320).then(detections => {
            // Filter detections to mouth region only
            let filteredDetections = filterDetectionsInMouthRegion(
              detections, 
              landmarks, 
              canvasElement.width, 
              canvasElement.height
            );
            
            // Split detections that span both upper and lower teeth
            filteredDetections = splitUpperLowerTeeth(
              filteredDetections,
              landmarks,
              canvasElement.width,
              canvasElement.height
            );
            
            // Store detections with mouth reference for MediaPipe interpolation
            teethInterpolationCache = {
              detections: filteredDetections,
              refMouthCenter,
              refMouthWidth
            };
            
            currentTeethDetections = filteredDetections;
            isDetecting = false;
          }).catch(err => {
            console.error('[DEBUG] Teeth detection failed:', err);
            isDetecting = false;
          });
        };
        
        // Use requestIdleCallback if available, otherwise setTimeout
        if ('requestIdleCallback' in window) {
          (window as any).requestIdleCallback(runDetection, { timeout: 100 });
        } else {
          setTimeout(runDetection, 0);
        }
      }
    }
    
    // Draw custom Beame face mesh (GREEN overlay - borders, mouth)
    // Show green only when BOTH close enough AND mouth open
    drawCustomFaceMesh(canvasCtx, landmarks, canvasElement.width, canvasElement.height, isReady, feedback);
    
    // Draw teeth detections (WHITE overlay) - ONNX accuracy + MediaPipe interpolation for 30fps
    // Only show if user is close enough to camera
    if (ENABLE_TEETH_OVERLAY) {
      const leftMouth = landmarks[61];
      const rightMouth = landmarks[291];
      const mouthWidth = Math.abs((rightMouth.x - leftMouth.x) * canvasElement.width);
      const isCloseEnough = mouthWidth > 280; // Same threshold as feedback
      
      if (isCloseEnough && teethInterpolationCache) {
        const interpolatedTeeth = interpolateTeethWithMediaPipe(landmarks, canvasElement.width, canvasElement.height);
        if (interpolatedTeeth.length > 0) {
          drawTeethDetections(canvasCtx, interpolatedTeeth);
          if (teethStatus) {
            teethStatus.textContent = interpolatedTeeth.length.toString();
            teethStatus.parentElement?.classList.remove('not-ready');
            teethStatus.parentElement?.classList.add('ready');
          }
        } else if (teethStatus) {
          teethStatus.textContent = '0';
          teethStatus.parentElement?.classList.remove('ready');
          teethStatus.parentElement?.classList.add('not-ready');
        }
      } else if (teethStatus) {
        teethStatus.textContent = '-';
        teethStatus.parentElement?.classList.remove('ready', 'not-ready');
      }
    }
  } else {
    faceDetected = false;
    mouthOpen = false;
    currentLandmarks = null;
    currentTeethDetections = [];
    teethInterpolationCache = null; // Clear interpolation when face lost
    smoothedLandmarks = null; // Reset smoothing when face lost
    faceStatus.textContent = t('noFace');
    faceStatus.style.color = '#ef4444';
    analysisStatus.parentElement?.classList.remove('ready', 'not-ready');
    analysisStatus.textContent = t('openMouthWider');
    if (teethStatus) {
      teethStatus.textContent = '-';
      teethStatus.parentElement?.classList.remove('ready', 'not-ready');
    }
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
      console.log('[DEBUG] Attempting camera with:', constraint);
      return await navigator.mediaDevices.getUserMedia(constraint);
    } catch (e) {
      console.warn('[DEBUG] Camera constraint failed:', constraint, e);
      lastError = e;
    }
  }
  throw lastError;
}

// Track if we're already showing a camera error to prevent duplicate alerts
let cameraErrorShown = false;

// Start camera
async function startCamera(): Promise<boolean> {
  // Prevent starting camera multiple times
  if (camera) {
    console.log('[DEBUG] Camera already running, skipping startCamera()');
    return true;
  }
  
  try {
    cameraStatus.textContent = t('cameraStarting');
    cameraErrorShown = false; // Reset error flag
    
    const stream = await getCameraStream();
    
    webcamElement.muted = true;
    webcamElement.setAttribute('playsinline', 'true');
    webcamElement.srcObject = stream;
    
    // Mirroring disabled
    
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Camera timeout')), 15000); // Increased to 15 seconds
      
      // Handle both loadedmetadata and loadeddata events for better compatibility
      const onLoaded = () => {
        clearTimeout(timeout);
        webcamElement.removeEventListener('loadedmetadata', onLoaded);
        webcamElement.removeEventListener('loadeddata', onLoaded);
        webcamElement.play().then(resolve).catch(reject);
      };
      
      webcamElement.addEventListener('loadedmetadata', onLoaded);
      webcamElement.addEventListener('loadeddata', onLoaded);
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
    
    console.log('[DEBUG] Camera started successfully');
    return true;
  } catch (error) {
    console.error('[DEBUG] Camera error:', error);
    cameraStatus.textContent = t('cameraDenied');
    cameraStatus.style.color = '#ef4444';
    
    const statusBadge = document.getElementById('cameraStatusBadge');
    const statusDot = statusBadge?.querySelector('.status-dot') as HTMLElement;
    if (statusDot) {
      statusDot.style.background = '#ef4444';
      statusDot.style.boxShadow = '0 0 10px #ef4444';
    }
    
    // Only show alert once to prevent duplicate errors
    if (!cameraErrorShown) {
      cameraErrorShown = true;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(currentLanguage === 'en' 
        ? `Failed to access camera: ${errorMessage}. Please ensure permissions are granted and no other app is using the camera.` 
        : `無法訪問攝像頭: ${errorMessage}。請確保已授予權限且無其他應用正在使用攝像頭。`);
    }
    
    return false;
  }
}

// Simulate analysis steps
async function simulateAnalysis(): Promise<void> {
  const steps: AnalysisStep[] = [
    { step: t('detectingLandmarks'), duration: 800 },
    { step: t('analyzingJaw'), duration: 1000 },
    { step: t('mappingTeeth'), duration: 900 },
    { step: t('calculatingAlignment'), duration: 1100 },
    { step: t('generatingImage'), duration: 1200 },
    { step: t('applyingEnhancement'), duration: 800 },
    { step: t('finalizingResults'), duration: 600 }
  ];

  for (const { step, duration } of steps) {
    analysisStep.textContent = step;
    await new Promise(resolve => setTimeout(resolve, duration));
  }
}

// Capture photo and process
async function capturePhoto() {
  console.log('[DEBUG] capturePhoto function called');
  
  if (!camera) {
    console.log('[DEBUG] Camera not running, attempting to start...');
    const started = await startCamera();
    if (started) {
    const startOverlay = document.getElementById('cameraStartOverlay');
    if (startOverlay) startOverlay.classList.add('hidden');
      setCookie('beame_camera_prompted', 'true', 365);
      // Just start the camera, don't capture yet as we need time to detect face/teeth
      return;
    }
    return;
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

  currentGenerationId++;
  const thisGenerationId = currentGenerationId;
  captureBtn.disabled = true;

  // Step 1: Hide feedback text for the next frame
  hideFeedbackForCapture = true;
  
  // Step 2: Wait for the next animation frame to redraw the canvas without feedback
  await new Promise(resolve => requestAnimationFrame(resolve));
  
  // Step 3: Capture the canvas directly (with overlays but no feedback text)
  const capturedImageWithOverlays = canvasElement.toDataURL('image/png');
  originalImage.src = capturedImageWithOverlays;
  
  // Step 4: Re-enable feedback and set processing state
  hideFeedbackForCapture = false;
  isProcessing = true;
  
  // Step 5: Also capture clean webcam image for AI processing
  const cleanCanvas = document.createElement('canvas');
  const cleanCtx = cleanCanvas.getContext('2d')!;
  cleanCanvas.width = webcamElement.videoWidth;
  cleanCanvas.height = webcamElement.videoHeight;
  cleanCtx.drawImage(webcamElement, 0, 0, cleanCanvas.width, cleanCanvas.height);
  const cleanImageDataUrl = cleanCanvas.toDataURL('image/png');
  
  // Store the clean front image for later use in photo scan submission
  cleanFrontImageFromPreview = cleanImageDataUrl;
  console.log('[DEBUG] Clean front image stored for photo scan');

  // NOW stop camera loop to free up resources during processing
  if (camera) {
    (camera as any).stop();
    camera = null;
  }

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
      performDentalAnalysis(cleanImageDataUrl, cleanImageDataUrl).catch(error => {
        console.error('[DEBUG] Dental analysis failed:', error);
      })
    );
  }
  
  await Promise.all(analysisPromises);
  
  console.log('[DEBUG] All analysis promises completed');
  
  // FINAL CHECK: Ensure AI Image is actually visible before allowing tabs
  if (straightenedImage.src) {
    console.log('[DEBUG] Hiding processing indicator, showing result');
    processingIndicator.style.display = 'none';
    straightenedImage.style.display = 'block';
    downloadBtn.style.display = 'inline-block';
    if (nextToPlanBtn) nextToPlanBtn.style.display = 'inline-block';
    
    // CRITICAL: Only enable tabs AFTER the image is confirmed visible
    const tab3dBtn = document.getElementById('3dTabBtn') as HTMLButtonElement;
    const planTabBtn = document.getElementById('planTabBtn') as HTMLButtonElement;
    
    if (planTabBtn && pendingDentalAnalysis) { 
      planTabBtn.disabled = false; 
      planTabBtn.classList.remove('disabled'); 
    }
    if (tab3dBtn && pendingDentalAnalysis) { 
      tab3dBtn.disabled = false; 
      tab3dBtn.classList.remove('disabled'); 
    }
  }
  
  isProcessing = false;
}

// Generate straightened image with Beame logo using Gemini AI
async function generateStraightenedImage(originalDataUrl: string, generationId: number): Promise<void> {
  if (USE_FALLBACK_MODE) {
    console.log('[DEBUG] Using fallback mode for image generation');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Wait for image to load before drawing
    await new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width; 
          canvas.height = img.height;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0);
          ctx.font = 'bold 40px Arial'; 
          ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
          ctx.textAlign = 'center'; 
          ctx.fillText('FALLBACK MODE', canvas.width / 2, 50);
          straightenedImage.src = canvas.toDataURL('image/png');
          console.log('[DEBUG] Fallback image generated successfully');
          resolve();
        } catch (error) {
          console.error('[DEBUG] Error in fallback image generation:', error);
          reject(error);
        }
      };
      img.onerror = (error) => {
        console.error('[DEBUG] Image failed to load:', error);
        reject(error);
      };
      img.src = originalDataUrl;
    });
    return;
  }
  
  try {
    // Try models in order of preference
    const modelsToTry = [
      { name: 'gemini-2.5-flash-image', description: 'Nano Banana' },
      { name: 'gemini-2.0-flash-exp', description: 'Experimental' }
    ];

    for (let i = 0; i < modelsToTry.length; i++) {
      if (generationId !== currentGenerationId) return;
      const modelInfo = modelsToTry[i];
      try {
        // Call backend API instead of directly calling Gemini
        const imageDataUrl = await apiGenerateStraightenedImage(originalDataUrl, modelInfo.name);
        
        if (generationId !== currentGenerationId) return;
        
        // If we got a valid image data URL, use it
        if (imageDataUrl && imageDataUrl.startsWith('data:')) {
          console.log('[DEBUG] Successfully generated image with', modelInfo.name);
          straightenedImage.src = imageDataUrl;
          return;
        }
      } catch (modelError) {
        console.warn(`[DEBUG] ${modelInfo.name} failed`, modelError);
      }
    }
    
    // If all models failed, use fallback
    if (generationId === currentGenerationId) await _generateStraightenedImageOld(originalDataUrl);
  } catch (error) {
    console.error('[DEBUG] Error generating straightened image:', error);
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
  // If fallback mode is enabled, skip API call
  if (USE_FALLBACK_MODE) {
    console.log('[DEBUG] Skipping classification (fallback mode)');
    return 'MODERATE';
  }
  
  // Call backend API instead of directly calling Gemini
  try {
    return await apiClassifyDentalCase(imageDataUrl);
  } catch (error) {
    console.error('[DEBUG] Error classifying dental case:', error);
    return 'MODERATE';
  }
}

function displayCaseClassification(classification: 'MILD' | 'MODERATE' | 'COMPLEX' | 'URGENT'): void {
  console.log(`[DEBUG] Displaying classification: ${classification}`);
  const assessmentSection = document.getElementById('aiAssessmentSection');
  const tiers = document.querySelectorAll('.case-tier');
  const cards = document.querySelectorAll('.case-card');
  
  const targetCard = document.getElementById(`caseCard-${classification}`);
  const targetTier = document.getElementById(`tier-${classification}`);
  
  if (!assessmentSection) return;
  assessmentSection.style.display = 'block';
  
  // Update Tiers visualizer
  tiers.forEach(tier => tier.classList.remove('active'));
  if (targetTier) targetTier.classList.add('active');

  // Update detail cards - IMPORTANT: ensure all other cards are hidden
  cards.forEach(card => {
    (card as HTMLElement).style.display = 'none';
    card.classList.remove('active');
  });
  
  if (targetCard) {
    targetCard.style.display = 'block';
    targetCard.classList.add('active');
  }
}

async function performDentalAnalysis(cleanImageUrl: string, originalImageUrl: string): Promise<void> {
  if (!currentLandmarks) return;
  try {
    analysisStep.textContent = t('analyzingDental');
    const dentalAnalysis: DentalAnalysis = analyzeDentalArches(currentLandmarks);
    
    // Perform classification and plan generation in parallel
    const [caseClassification, treatmentPlan] = await Promise.all([
      classifyDentalCase(cleanImageUrl),
      Promise.resolve(generateTreatmentPlan(dentalAnalysis))
    ]);
    
    // OVERRIDE: Ensure clinical plan matches the AI classification
    const finalPlan = overridePlanWithClassification(treatmentPlan, caseClassification);
    
    // 1. Display the classification UI first
    displayCaseClassification(caseClassification);
    
    // 2. Display the updated treatment plan details
    displayTreatmentPlan(finalPlan);
    
    analysisStep.textContent = t('savingSession');
    const compressedOriginal = await compressImageDataUrl(originalImageUrl);
    const compressedPreview = await compressImageDataUrl(straightenedImage.src);
    
    currentSession = { 
      id: generateSessionId(), 
      timestamp: Date.now(), 
      originalImageUrl: compressedOriginal, 
      previewImageUrl: compressedPreview, 
      dentalAnalysis, 
      treatmentPlan: finalPlan, 
      status: 'pending' 
    };
    saveCurrentSession(currentSession);
    
    analysisStep.textContent = t('preparingPlan');
    pendingDentalAnalysis = dentalAnalysis;
    
    console.log('[DEBUG] Dental analysis complete, plan ready');
    
    // NOTE: Tab activation moved to capturePhoto() after straightenedImage is confirmed visible
    // This ensures users can't click tabs before the AI result is shown
    
    updateProgressSteps(2);
  } catch (error) { 
    console.error('Dental analysis failed:', error); 
    throw error; 
  }
}

/**
 * Ensures clinical reasons and eligibility match the AI classification
 */
function overridePlanWithClassification(plan: TreatmentPlan, classification: string): TreatmentPlan {
  const overrides: Record<string, { eligibility: any, reasons: string[] }> = {
    MILD: {
      eligibility: 'eligible',
      reasons: currentLanguage === 'en' 
        ? ['Good candidate for clear aligners', 'Minor adjustments needed', 'Cosmetic alignment recommended']
        : ['非常適合隱形牙套', '僅需輕微調整', '建議進行美容排列']
    },
    MODERATE: {
      eligibility: 'eligible',
      reasons: currentLanguage === 'en' 
        ? ['Suitable for clear aligners', 'Standard crowding detected', 'Predictable tooth movement']
        : ['適合隱形牙套', '檢測到中度擁擠', '預期牙齒移動量正常']
    },
    COMPLEX: {
      eligibility: 'review',
      reasons: currentLanguage === 'en' 
        ? ['Orthodontist review required', 'Complex alignment pattern', 'May require attachments or IPR']
        : ['需要矯正專科醫師審核', '排列情況較為複雜', '可能需要附件或修磨']
    },
    URGENT: {
      eligibility: 'reject',
      reasons: currentLanguage === 'en' 
        ? ['Immediate clinical review recommended', 'Not suitable for home aligners at this time', 'Please visit a dentist for evaluation']
        : ['建議立即進行臨床檢查', '目前不適合居家牙套', '請諮詢牙醫進行評估']
    }
  };

  const override = overrides[classification] || overrides.MODERATE;
  
  return {
    ...plan,
    eligibility: override.eligibility,
    reasons: override.reasons
  };
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
  const aiAssessmentSection = document.getElementById('aiAssessmentSection');
  if (aiAssessmentSection) aiAssessmentSection.style.display = 'block';
  
  if (assessmentMeta) assessmentMeta.textContent = `${t('basedOnAiAnalysis')} • ${new Date().toLocaleDateString()}`;
  
  // Update eligibility banner
  eligibilityCard.style.display = 'block';
  treatmentDetails.style.display = 'grid';
  eligibilityBadge.className = `badge ${plan.eligibility}`;
  eligibilityStatus.textContent = t(plan.eligibility + 'Title');
  eligibilityMessage.textContent = plan.reasons[0] || t('defaultMessage');
  
  // Update metrics
  treatmentLength.textContent = `${plan.treatmentLengthMonths} ${t('months')}`;
  stageCount.textContent = `${plan.stageCount} ${t('aligners')}`;
  wearType.textContent = t(plan.wearType);
  
  // Update corrections tags
  correctionsList.innerHTML = '';
  for (const [key, value] of Object.entries(plan.corrections)) {
    if (value) { // Only show active corrections
      const tag = document.createElement('span');
      tag.className = 'correction-tag';
      tag.textContent = t(key); // Use t() to translate the key
      correctionsList.appendChild(tag);
    }
  }
  
  // Update clinical reasons list
  treatmentReasons.innerHTML = '';
  plan.reasons.forEach(reason => {
    const li = document.createElement('li'); 
    li.textContent = reason; 
    treatmentReasons.appendChild(li);
  });
}

const eligibilityCard = document.getElementById('eligibilityCard') as HTMLDivElement;

// Start camera for 4-stage capture
async function startStageCamera(): Promise<boolean> {
  try {
    console.log('[DEBUG] Starting stage capture camera...');
    const stream = await getCameraStream();
    stageWebcam.muted = true;
    stageWebcam.setAttribute('playsinline', 'true');
    stageWebcam.srcObject = stream;
    
    // No mirroring applied
    
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
    console.error('[DEBUG] Stage camera error:', error);
    return false;
  }
}

// Handle FaceMesh results for stage capture
function onStageFaceMeshResults(results: any) {
  const canvasCtx = stageOverlay.getContext('2d')!;
  if (stageOverlay.width !== stageWebcam.videoWidth || stageOverlay.height !== stageWebcam.videoHeight) {
    stageOverlay.width = stageWebcam.videoWidth;
    stageOverlay.height = stageWebcam.videoHeight;
    // No mirroring applied
  }
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, stageOverlay.width, stageOverlay.height);
  canvasCtx.drawImage(results.image, 0, 0, stageOverlay.width, stageOverlay.height);

  const stages = getCaptureStages();
  const currentStage = stages[activeStageIndex];
  if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
    // Apply smoothing to reduce MediaPipe jitter
    const rawLandmarks = results.multiFaceLandmarks[0];
    const landmarks = smoothLandmarks(rawLandmarks, true); // true = stage view
    stageLandmarks = landmarks;
    
    // Get alignment status and feedback
    const validation = validateStageAlignmentVerbose(currentStage.id, landmarks, stageOverlay.width, stageOverlay.height);
    stageReady = validation.isReady;
    
    // Update ready badge UI
    if (stageReady) {
      stageReadyBadge.classList.add('ready');
      stageReadyBadge.classList.remove('not-ready');
      stageReadyText.textContent = t('readyCapture');
      stageCaptureBtn.disabled = false;
    } else {
      stageReadyBadge.classList.remove('ready');
      stageReadyBadge.classList.add('not-ready');
      stageReadyText.textContent = validation.feedback;
      stageCaptureBtn.disabled = true;
    }

    // Draw dental overlay (GREEN overlay - borders, mouth, orientation validation)
    drawDentalOverlay(canvasCtx, landmarks, stageOverlay.width, stageOverlay.height, stageReady, currentStage.id, validation.feedback);
  } else {
    stageLandmarks = null; stageReady = false;
    stageReadyBadge.classList.remove('ready');
    stageReadyBadge.classList.add('not-ready');
    stageReadyText.textContent = t('noFace');
    stageCaptureBtn.disabled = true;
  }
  canvasCtx.restore();
}

interface AlignmentValidation {
  isReady: boolean;
  feedback: string;
}

function validateStageAlignmentVerbose(stageId: CaptureStageId, landmarks: any[], width: number, height: number): AlignmentValidation {
  const mouthOpenDist = getMouthOpenDistance(landmarks);
  const yaw = getYawProxy(landmarks);
  const { mouthCenterX, mouthCenterY } = getMouthMetrics(landmarks, width, height);
  
  // 1. Basic Framing - Keep relatively lenient but ensure face is present
  const targetCenterY = height * 0.55; 
  const horizontalOffset = Math.abs(mouthCenterX - width/2)/width;
  const verticalOffset = Math.abs(mouthCenterY - targetCenterY)/height;
  
  if (horizontalOffset > 0.3 || verticalOffset > 0.35) {
    return { isReady: false, feedback: t('centerMouth') };
  }
  
  // 2. Stage-specific requirements
  switch (stageId) {
    case 'front_smile':
      // Must be looking straight
      if (Math.abs(yaw) > 0.04) return { isReady: false, feedback: t('lookStraight') };
      // FRONT VIEW: Use same threshold as AI Preview (mouth slightly open showing teeth)
      // Start being valid at 0.05 (same as AI Preview's isMouthOpen threshold)
      if (mouthOpenDist < 0.05) return { isReady: false, feedback: t('openWider') };
      // Only reject if mouth is EXTREMELY wide open (like dentist exam)
      if (mouthOpenDist > 0.13) return { isReady: false, feedback: t('closeMouth') };
      break;

    case 'lower_front':
      // Must be looking straight
      if (Math.abs(yaw) > 0.04) return { isReady: false, feedback: t('lookStraight') };
      // LOWER VIEW: Mouth must be VERY WIDE OPEN (stricter requirement)
      if (mouthOpenDist < 0.15) return { isReady: false, feedback: t('openMuchWider') };
      // Head must be tilted DOWN to focus on lower teeth
      if (getPitchProxy(landmarks) < 0.015) return { isReady: false, feedback: t('tiltHeadDown') };
      break;

    case 'upper_front':
      // Must be looking straight
      if (Math.abs(yaw) > 0.04) return { isReady: false, feedback: t('lookStraight') };
      // UPPER VIEW: Mouth must be VERY WIDE OPEN (stricter requirement)
      if (mouthOpenDist < 0.15) return { isReady: false, feedback: t('openMuchWider') };
      // Head must be tilted UP to focus on upper teeth
      if (getPitchProxy(landmarks) > -0.015) return { isReady: false, feedback: t('tiltHeadUp') };
      break;
      
    case 'side_bite':
      // Must be turned significantly (approx 70 degrees)
      if (Math.abs(yaw) < 0.12) return { isReady: false, feedback: t('turnHeadTo70') };
      // Mouth must ALSO be open for side view
      if (mouthOpenDist < 0.04) return { isReady: false, feedback: t('openWider') };
      break;
  }

  return { isReady: true, feedback: t('ready') };
}

// Deprecated - kept for compatibility if needed elsewhere
function validateStageAlignment(stageId: CaptureStageId, landmarks: any[], width: number, height: number): boolean {
  return validateStageAlignmentVerbose(stageId, landmarks, width, height).isReady;
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
function getPitchProxy(landmarks: any[]): number {
  // 152 is chin, 10 is forehead. 
  // Positive = Chin further away (Head Tilted Down - looking at lower teeth)
  // Negative = Chin closer (Head Tilted Up - looking at upper teeth)
  return landmarks[152].z - landmarks[10].z;
}
function getMouthMetrics(landmarks: any[], width: number, height: number) {
  const centerX = ((landmarks[61]?.x || 0.5) + (landmarks[291]?.x || 0.5)) / 2 * width;
  const centerY = ((landmarks[13]?.y || 0.5) + (landmarks[14]?.y || 0.5)) / 2 * height;
  const w = Math.abs(((landmarks[291]?.x || 0.55) - (landmarks[61]?.x || 0.45)) * width);
  return { mouthCenterX: centerX, mouthCenterY: centerY, mouthWidth: w };
}

async function initializeStageCapture(): Promise<void> {
  // Load demo pics as placeholders
  await loadDemoPics();
  
  if (!stageCamera) await startStageCamera();
  updateStageUI();
}

async function loadDemoPics(): Promise<void> {
  const demoPicPaths = [
    '/demopics/demopics%20professional/lowergem_optimized.jpg',
    '/demopics/demopics%20professional/uppergem_optimized.jpg',
    '/demopics/demopics%20professional/sidegem_optimized.jpg'
  ];
  
  try {
    // Load each demo pic
    for (let i = 0; i < demoPicPaths.length; i++) {
      const response = await fetch(demoPicPaths[i]);
      if (response.ok) {
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          // Set thumbnail
          if (thumbImgs[i]) {
            thumbImgs[i].src = base64data;
            thumbImgs[i].style.display = 'block';
            thumbImgs[i].style.opacity = '0.6'; // Make it obvious it's a placeholder
            
            // Add demo badge
            const parent = thumbImgs[i].parentElement;
            if (parent && !parent.querySelector('.demo-badge')) {
              const badge = document.createElement('div');
              badge.className = 'demo-badge';
              badge.textContent = 'DEMO';
              badge.style.position = 'absolute';
              badge.style.top = '5px';
              badge.style.left = '5px';
              badge.style.background = 'rgba(0, 206, 124, 0.9)'; // Changed from purple to Beame green
              badge.style.color = 'white';
              badge.style.padding = '2px 8px';
              badge.style.borderRadius = '4px';
              badge.style.fontSize = '10px';
              badge.style.fontWeight = 'bold';
              badge.style.zIndex = '10';
              badge.style.letterSpacing = '0.5px';
              badge.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
              parent.style.position = 'relative';
              parent.appendChild(badge);
            }
          }
        };
        reader.readAsDataURL(blob);
      }
    }
    console.log('[DEBUG] Demo pics loaded successfully');
  } catch (error) {
    console.error('[DEBUG] Failed to load demo pics:', error);
  }
}

function updateStageUI() {
  const stages = getCaptureStages();
  const stage = stages[activeStageIndex];
  if (stageStepEl) stageStepEl.textContent = `${activeStageIndex + 1} of 3`;
  if (stageTitleEl) stageTitleEl.textContent = stage.title;
  if (stageInstructionEl) stageInstructionEl.textContent = stage.instruction;
  stageReady = false; stageCaptureBtn.disabled = true;
  stageReadyBadge.classList.remove('ready');
  thumbBtns.forEach((btn, idx) => {
    if (btn) { btn.classList.toggle('active', idx === activeStageIndex); btn.classList.toggle('captured', stageCaptures[idx] !== null); }
  });
  
  const allCaptured = stageCaptures.every(img => img !== null);
  
  if (allCaptured) {
    // Show form, hide camera
    const captureCard = document.querySelector('.capture4-card') as HTMLElement;
    if (captureCard) captureCard.style.display = 'none';
    if (stageForm) stageForm.style.display = 'block';
    if (captureHint) captureHint.style.display = 'none';
    if (stageCamera) (stageCamera as any).stop();
  } else {
    // Standard camera view
    const captureCard = document.querySelector('.capture4-card') as HTMLElement;
    if (captureCard) captureCard.style.display = 'block';
    if (stageForm) stageForm.style.display = 'none';
    if (captureHint) captureHint.style.display = 'block';
  }
}

if (finalSubmitBtn) {
  finalSubmitBtn.addEventListener('click', async () => {
    console.log('[DEBUG] Submit button clicked!');
    
    const name = userNameInput.value.trim();
    const email = userEmailInput.value.trim();
    let phone = userPhoneInput.value.trim();

    console.log('[DEBUG] Form values:', { name, email, phone });

    if (!name || !email || !phone) {
      alert(currentLanguage === 'en' ? 'Please fill in all fields.' : '請填寫所有欄位。');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert(currentLanguage === 'en' ? 'Please enter a valid email address.' : '請輸入有效的電子郵件地址。');
      return;
    }

    // Clean and validate phone number
    // Remove all spaces and non-digit characters except +
    const cleanPhone = phone.replace(/[\s\-()]/g, '');
    
    // Check if it's a valid HK (8 digits) or China (11 digits) number
    let finalPhone = cleanPhone;
    
    // Remove country code if present for validation
    const phoneDigitsOnly = cleanPhone.replace(/^\+?852|^\+?86/, '');
    
    if (phoneDigitsOnly.length === 8) {
      // Hong Kong number (8 digits)
      if (!/^\d{8}$/.test(phoneDigitsOnly)) {
        alert(currentLanguage === 'en' ? 'Please enter a valid 8-digit Hong Kong phone number.' : '請輸入有效的 8 位數香港電話號碼。');
        return;
      }
      // Keep original format (with or without +852)
      finalPhone = cleanPhone.startsWith('+852') || cleanPhone.startsWith('852') ? cleanPhone : phoneDigitsOnly;
    } else if (phoneDigitsOnly.length === 11) {
      // China number (11 digits)
      if (!/^1\d{10}$/.test(phoneDigitsOnly)) {
        alert(currentLanguage === 'en' ? 'Please enter a valid 11-digit China phone number starting with 1.' : '請輸入以 1 開頭的有效 11 位數中國電話號碼。');
        return;
      }
      // Keep original format (with or without +86)
      finalPhone = cleanPhone.startsWith('+86') || cleanPhone.startsWith('86') ? cleanPhone : phoneDigitsOnly;
    } else {
      alert(currentLanguage === 'en' 
        ? 'Please enter a valid phone number (8 digits for HK, 11 digits for China).' 
        : '請輸入有效的電話號碼（香港 8 位數或中國 11 位數）。');
      return;
    }

    console.log('[DEBUG] Phone normalized:', finalPhone);

    // Validate that we have the front image from AI preview
    if (!cleanFrontImageFromPreview) {
      alert(currentLanguage === 'en' ? 'Please complete the AI analysis first to capture the front view.' : '請先完成 AI 分析以捕獲正面視圖。');
      return;
    }

    console.log('[DEBUG] Validation passed, preparing to submit...');

    finalSubmitBtn.disabled = true;
    finalSubmitBtn.textContent = currentLanguage === 'en' ? 'Submitting...' : '正在提交...';

    try {
      // Convert data URLs to Blob files
      const dataURLtoBlob = (dataurl: string): Blob => {
        const arr = dataurl.split(',');
        const mime = arr[0].match(/:(.*?);/)![1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
      };

      // Create FormData
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('phone', finalPhone);

      // Add front image (required) - from AI preview clean capture
      if (cleanFrontImageFromPreview) {
        const frontBlob = dataURLtoBlob(cleanFrontImageFromPreview);
        formData.append('front_image', frontBlob, 'front_image.png');
      }

      // Add optional images - ALSO as Files (API requires files despite docs saying "string")
      // New indices: [0]=lower, [1]=upper, [2]=side
      if (stageCaptures[0]) { // Lower view -> bottom_image
        const bottomBlob = dataURLtoBlob(stageCaptures[0]);
        formData.append('bottom_image', bottomBlob, 'bottom_image.png');
      }

      if (stageCaptures[1]) { // Upper view -> top_image
        const topBlob = dataURLtoBlob(stageCaptures[1]);
        formData.append('top_image', topBlob, 'top_image.png');
      }

      if (stageCaptures[2]) { // Side view -> side_image
        const sideBlob = dataURLtoBlob(stageCaptures[2]);
        formData.append('side_image', sideBlob, 'side_image.png');
      }

      console.log('[DEBUG] Submitting form to API...');
      console.log('[DEBUG] FormData contents - Name:', name, 'Email:', email, 'Phone:', finalPhone);
      console.log('[DEBUG] Images captured:', stageCaptures.map((img, i) => img ? `Image ${i}: YES` : `Image ${i}: NO`));

      // Submit to backend API
      const response = await fetch('https://mybeame.com/api/customer-manage/image', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('[DEBUG] API Response:', result);

      if (result.code !== 200 && result.code !== 0) {
        // Handle validation errors from backend
        let errorMsg = currentLanguage === 'en' ? 'Submission failed.' : '提交失敗。';
        if (result.data && result.data.phone) {
          errorMsg = currentLanguage === 'en' ? 'Please enter a valid phone number.' : '請輸入正確的手機號！';
        } else if (result.message) {
          errorMsg = result.message;
        }
        throw new Error(errorMsg);
      }

      // Show the completion modal instead of alert
      const modal = document.getElementById('completionModal');
      if (modal) {
        modal.style.display = 'flex';
      } else {
        alert(currentLanguage === 'en' 
          ? 'Interest submitted! Our specialists will contact you shortly.' 
          : '意向已提交！我們的專員將很快與您聯絡。');
      }
      
      // Reset button state
      finalSubmitBtn.textContent = currentLanguage === 'en' ? 'Submitted' : '已提交';
      finalSubmitBtn.style.background = '#0ca678';

    } catch (error: any) {
      console.error('[ERROR] Form submission failed:', error);
      alert(error.message || (currentLanguage === 'en' 
        ? 'Submission failed. Please try again or contact support.' 
        : '提交失敗。請重試或聯絡客服。'));
      
      // Re-enable button on error
      finalSubmitBtn.disabled = false;
      finalSubmitBtn.textContent = currentLanguage === 'en' ? 'Submit My Scans' : '提交我的掃描';
    }
  });
}

if (stageCaptureBtn) {
  stageCaptureBtn.addEventListener('click', () => {
    if (!stageReady) return;
    const canvas = document.createElement('canvas');
    canvas.width = stageWebcam.videoWidth; canvas.height = stageWebcam.videoHeight;
    canvas.getContext('2d')!.drawImage(stageWebcam, 0, 0);
    const dataUrl = canvas.toDataURL('image/png');
    stageCaptures[activeStageIndex] = dataUrl;
    
    // Mark as no longer using example photos when capturing new photo
    usingExamplePhotos = false;
    
    if (thumbImgs[activeStageIndex]) { 
      thumbImgs[activeStageIndex].src = dataUrl; 
      thumbImgs[activeStageIndex].style.display = 'block';
      thumbImgs[activeStageIndex].style.opacity = '1'; // Full opacity for real photos
      
      // Remove demo badge
      const parent = thumbImgs[activeStageIndex].parentElement;
      const demoBadge = parent?.querySelector('.demo-badge');
      if (demoBadge) demoBadge.remove();
    }
    if (activeStageIndex < 2) { activeStageIndex++; updateStageUI(); } else { updateStageUI(); }
  });
}

if (stageRetakeBtn) {
  stageRetakeBtn.addEventListener('click', async () => {
    stageCaptures[activeStageIndex] = null;
    if (thumbImgs[activeStageIndex]) { 
      thumbImgs[activeStageIndex].src = ''; 
      thumbImgs[activeStageIndex].style.display = 'none';
      
      // Remove demo badge if exists
      const parent = thumbImgs[activeStageIndex].parentElement;
      const demoBadge = parent?.querySelector('.demo-badge');
      if (demoBadge) demoBadge.remove();
    }
    // Reload demo pic for this slot
    await loadDemoPics();
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
  if (camera) { (camera as any).stop(); camera = null; }
  if (stageCamera) (stageCamera as any).stop(); stageCamera = null;
  pendingDentalAnalysis = null; 
  stageCaptures = [null, null, null]; 
  activeStageIndex = 0;
  cleanFrontImageFromPreview = null; // Reset the clean front image
  usingExamplePhotos = false; // Clear example photos flag on retry
  // Tracking caches removed - using raw ONNX detections
  
  // Reset form and camera card visibility
  const captureCard = document.querySelector('.capture4-card') as HTMLElement;
  if (captureCard) captureCard.style.display = 'block';
  if (stageForm) stageForm.style.display = 'none';
  if (userNameInput) userNameInput.value = '';
  if (userEmailInput) userEmailInput.value = '';
  if (userPhoneInput) userPhoneInput.value = '';
  if (finalSubmitBtn) {
    finalSubmitBtn.disabled = false;
    finalSubmitBtn.textContent = currentLanguage === 'en' ? 'Submit My Scans' : '提交我的掃描';
  }

  thumbImgs.forEach(img => { 
    if (img) { 
      img.src = ''; 
      img.style.display = 'none';
      // Clear demo badges
      const demoBadge = img.parentElement?.querySelector('.demo-badge') as HTMLElement;
      if (demoBadge) demoBadge.remove();
    } 
  });
  if (stageCompleteBtn) stageCompleteBtn.style.display = 'none';
  resultsSection.style.display = 'none';
  const assessmentSection = document.getElementById('aiAssessmentSection');
  if (assessmentSection) assessmentSection.style.display = 'none';
  const planTabBtn = document.getElementById('planTabBtn') as HTMLButtonElement;
  const tab3dBtn = document.getElementById('3dTabBtn') as HTMLButtonElement;
  if (planTabBtn) { planTabBtn.disabled = true; planTabBtn.classList.add('disabled'); }
  if (tab3dBtn) { tab3dBtn.disabled = true; tab3dBtn.classList.add('disabled'); }
  const switchTabFn = (window as any).switchTab; if (switchTabFn) switchTabFn('preview');
  webcamSection.style.display = 'block'; 
  captureBtn.disabled = false; // Allow clicking to start camera if needed
  downloadBtn.style.display = 'none'; 
  if (nextToPlanBtn) nextToPlanBtn.style.display = 'none';
  isProcessing = false;
  currentLandmarks = null; currentSession = null;
  updateProgressSteps(1);
  if (analysisStatus) { analysisStatus.parentElement?.classList.remove('ready'); analysisStatus.parentElement?.classList.add('not-ready'); analysisStatus.textContent = t('openMouthWider'); }
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (!camera) await startCamera();
}

captureBtn.addEventListener('click', capturePhoto);
downloadBtn.addEventListener('click', downloadResult);
retryBtn.addEventListener('click', retry);

// Keyboard shortcuts for example photo management
// Keyboard shortcuts removed - no longer needed

async function initializeApp() {
  console.log('[DEBUG] Beame Teeth Straightener initialized');
  if (ENABLE_TEETH_OVERLAY) {
    console.log('[DEBUG] Loading ONNX tooth detection model...');
    console.log('[DEBUG] Model path:', ONNX_MODEL_PATH);
    try { 
      await loadONNXModel(ONNX_MODEL_PATH); 
      console.log('[DEBUG] ✓ Tooth detection model loaded successfully!');
      console.log('[DEBUG] ONNX ready:', isONNXReady());
    } catch (error) { 
      console.error('[DEBUG] ✗ Failed to load tooth detection model:', error); 
    }
  } else {
    console.log('[DEBUG] Tooth detection disabled');
  }
  enableDiagnostics();
  const existingSession = loadCurrentSession();
  console.log('[DEBUG] Camera ready to start on user interaction');
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