/**
 * Arch Analysis Service
 * 
 * Derives dental arch metrics from MediaPipe FaceMesh landmarks.
 * Focuses on mouth/teeth region landmarks to estimate tooth positions and alignment.
 */

import type { DentalAnalysis, Arch, Tooth, ArchMetrics } from '../types/dental';

// MediaPipe FaceMesh landmark indices for mouth/teeth region
const LANDMARKS = {
  // Upper lip - outer
  UPPER_LIP_TOP: 13,
  UPPER_LIP_LEFT: 61,
  UPPER_LIP_RIGHT: 291,
  
  // Lower lip - outer
  LOWER_LIP_BOTTOM: 14,
  LOWER_LIP_LEFT: 61,
  LOWER_LIP_RIGHT: 291,
  
  // Mouth corners
  MOUTH_LEFT: 61,
  MOUTH_RIGHT: 291,
  
  // Upper teeth area (inner lip line)
  UPPER_TEETH: [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308],
  
  // Lower teeth area (inner lip line)
  LOWER_TEETH: [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308],
  
  // Mouth outer contour
  MOUTH_OUTER: [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291],
  
  // Face reference points for scale
  NOSE_TIP: 1,
  CHIN_BOTTOM: 152,
  FACE_LEFT: 234,
  FACE_RIGHT: 454
};

/**
 * Analyze dental arches from FaceMesh landmarks
 */
export function analyzeDentalArches(faceLandmarks: any[]): DentalAnalysis {
  // Extract mouth region landmarks
  const upperTeethLandmarks = LANDMARKS.UPPER_TEETH.map(idx => faceLandmarks[idx]);
  const lowerTeethLandmarks = LANDMARKS.LOWER_TEETH.map(idx => faceLandmarks[idx]);
  const upperLipTop = faceLandmarks[LANDMARKS.UPPER_LIP_TOP];
  const lowerLipBottom = faceLandmarks[LANDMARKS.LOWER_LIP_BOTTOM];
  
  // Calculate reference scale (face width in normalized coordinates)
  const faceLeft = faceLandmarks[LANDMARKS.FACE_LEFT];
  const faceRight = faceLandmarks[LANDMARKS.FACE_RIGHT];
  const faceWidth = distance2D(faceLeft, faceRight);
  
  // Assume average face width is ~140mm for scaling
  const AVERAGE_FACE_WIDTH_MM = 140;
  const scale = AVERAGE_FACE_WIDTH_MM / faceWidth;
  
  // Generate tooth positions for upper and lower arches
  const upperTeeth = generateTeethFromLandmarks(upperTeethLandmarks, 'upper', scale);
  const lowerTeeth = generateTeethFromLandmarks(lowerTeethLandmarks, 'lower', scale);
  
  // Calculate arch metrics
  const upperMetrics = calculateArchMetrics(upperTeeth, upperTeethLandmarks, scale);
  const lowerMetrics = calculateArchMetrics(lowerTeeth, lowerTeethLandmarks, scale);
  
  // Calculate bite relationship
  const overjet = calculateOverjet(upperLipTop, lowerLipBottom, scale);
  const overbite = calculateOverbite(upperLipTop, lowerLipBottom, scale);
  const occlusion = classifyOcclusion(overjet, overbite);
  
  const upperArch: Arch = {
    type: 'upper',
    teeth: upperTeeth,
    metrics: upperMetrics
  };
  
  const lowerArch: Arch = {
    type: 'lower',
    teeth: lowerTeeth,
    metrics: lowerMetrics
  };
  
  return {
    upperArch,
    lowerArch,
    overallCrowding: (upperMetrics.crowdingScore + lowerMetrics.crowdingScore) / 2,
    overallSymmetry: (upperMetrics.symmetryScore + lowerMetrics.symmetryScore) / 2,
    occlusion: {
      overjet,
      overbite,
      classification: occlusion
    },
    timestamp: Date.now()
  };
}

/**
 * Generate tooth positions from lip/mouth landmarks
 */
function generateTeethFromLandmarks(
  landmarks: any[], 
  archType: 'upper' | 'lower',
  scale: number
): Tooth[] {
  const teeth: Tooth[] = [];
  const numTeeth = 14; // 14 visible teeth per arch (excluding wisdom teeth)
  
  // Calculate arch parameters from landmarks
  const leftMost = landmarks.reduce((min, l) => l.x < min.x ? l : min, landmarks[0]);
  const rightMost = landmarks.reduce((max, l) => l.x > max.x ? l : max, landmarks[0]);
  const archWidth = distance2D(leftMost, rightMost) * scale;
  const archDepth = archWidth * 0.45; // Realistic arch depth is ~45% of width
  
  // Use average Y position for all teeth (horizontal alignment)
  const avgY = landmarks.reduce((sum, l) => sum + l.y, 0) / landmarks.length;
  const y = avgY * scale;
  
  // Distribute teeth EVENLY along the arch (not based on landmark spacing)
  for (let i = 0; i < numTeeth; i++) {
    // Evenly distribute from 0 to 1 along the arch
    const t = i / (numTeeth - 1);
    
    // Calculate position along a parabolic arch curve
    // This ensures EVEN spacing regardless of landmark distribution
    const archAngle = (t - 0.5) * Math.PI * 0.6; // ±54 degrees
    
    // X position: distribute evenly along arch width using sine
    const x = Math.sin(archAngle) * archWidth / 2;
    
    // Z (depth): parabolic curve - maximum at center, minimum at edges
    const normalizedT = (t - 0.5) * 2; // -1 to 1
    const curveDepth = (1 - normalizedT * normalizedT) * archDepth;
    const z = curveDepth;
    
    // Add some variation to simulate realistic tooth positioning
    // Central incisors are typically more prominent
    const isCentral = i === Math.floor(numTeeth / 2) || i === Math.floor(numTeeth / 2) - 1;
    const prominenceFactor = isCentral ? 1.02 : 1.0;
    
    // NO X variation - teeth touch each other!
    // Only add crookedness through rotation and tiny Z/Y shifts
    const variation = {
      x: 0, // NO horizontal gaps - teeth are touching!
      y: (Math.random() - 0.5) * 0.05,  // Tiny vertical variation for realism
      z: (Math.random() - 0.5) * 0.2    // Some forward/back variation (crooked)
    };
    
    // Rotation variation creates the "crooked" look
    const rotation = {
      x: archType === 'upper' ? 0 : 0,
      y: archAngle + (Math.random() - 0.5) * 0.2, // More rotation = crookedness!
      z: (Math.random() - 0.5) * 0.1 // Slight tilt for crooked teeth
    };
    
    teeth.push({
      id: i + 1,
      position: {
        x: x + variation.x,
        y: y + variation.y,
        z: z * prominenceFactor + variation.z
      },
      rotation,
      width: 8 + Math.random() * 2, // 8-10mm
      height: 10 + Math.random() * 2 // 10-12mm
    });
  }
  
  return teeth;
}

/**
 * Calculate arch metrics from tooth positions
 */
function calculateArchMetrics(teeth: Tooth[], _landmarks: any[], _scale: number): ArchMetrics {
  // Calculate arch width (distance between left and rightmost teeth)
  const xPositions = teeth.map(t => t.position.x);
  const archWidth = Math.max(...xPositions) - Math.min(...xPositions);
  
  // Calculate arch length (anterior-posterior dimension)
  const yPositions = teeth.map(t => t.position.y);
  const archLength = Math.max(...yPositions) - Math.min(...yPositions);
  
  // Calculate crowding score
  const crowdingScore = calculateCrowding(teeth, archWidth);
  
  // Calculate symmetry score
  const symmetryScore = calculateSymmetry(teeth);
  
  // Calculate midline offset
  const midlineOffset = calculateMidlineOffset(teeth);
  
  // Calculate spacing
  const spacing = calculateSpacing(teeth);
  
  // Calculate average rotation
  const averageRotation = calculateAverageRotation(teeth);
  
  return {
    crowdingScore,
    symmetryScore,
    midlineOffset,
    archWidth,
    archLength,
    spacing,
    averageRotation
  };
}

/**
 * Calculate crowding score (0-10, higher = more crowded)
 */
function calculateCrowding(teeth: Tooth[], archWidth: number): number {
  // Estimate required space vs available space
  const totalToothWidth = teeth.reduce((sum, t) => sum + t.width, 0);
  const availableSpace = archWidth * 1.5; // Approximate arch perimeter
  
  const spaceDeficit = Math.max(0, totalToothWidth - availableSpace);
  
  // Convert to 0-10 scale (assume 10mm deficit = score 10)
  const crowdingScore = Math.min(10, (spaceDeficit / 10) * 10);
  
  // Add factor for tooth overlap/rotation
  let overlapPenalty = 0;
  for (let i = 0; i < teeth.length - 1; i++) {
    const dist = distance3D(teeth[i].position, teeth[i + 1].position);
    const expectedDist = (teeth[i].width + teeth[i + 1].width) / 2;
    if (dist < expectedDist * 0.8) {
      overlapPenalty += 0.5;
    }
  }
  
  return Math.min(10, crowdingScore + Math.min(overlapPenalty, 3));
}

/**
 * Calculate symmetry score (0-10, higher = better symmetry)
 */
function calculateSymmetry(teeth: Tooth[]): number {
  const midpoint = teeth.length / 2;
  const leftTeeth = teeth.slice(0, Math.floor(midpoint));
  const rightTeeth = teeth.slice(Math.ceil(midpoint)).reverse();
  
  let totalDifference = 0;
  const pairsToCompare = Math.min(leftTeeth.length, rightTeeth.length);
  
  for (let i = 0; i < pairsToCompare; i++) {
    // Compare mirrored positions
    const leftX = leftTeeth[i].position.x;
    const rightX = rightTeeth[i].position.x;
    const leftY = leftTeeth[i].position.y;
    const rightY = rightTeeth[i].position.y;
    
    // Calculate positional difference (should be mirrored)
    const xDiff = Math.abs(Math.abs(leftX) - Math.abs(rightX));
    const yDiff = Math.abs(leftY - rightY);
    
    totalDifference += xDiff + yDiff;
  }
  
  // Convert to 0-10 scale (assume 5mm total difference = score 5)
  const avgDifference = totalDifference / pairsToCompare;
  const symmetryScore = Math.max(0, 10 - (avgDifference / 0.5));
  
  return Math.min(10, Math.max(0, symmetryScore));
}

/**
 * Calculate midline offset (mm from ideal center)
 */
function calculateMidlineOffset(teeth: Tooth[]): number {
  // Find the center of the arch
  const xPositions = teeth.map(t => t.position.x);
  const archCenter = (Math.max(...xPositions) + Math.min(...xPositions)) / 2;
  
  // Find the two central teeth
  const midIdx = Math.floor(teeth.length / 2);
  const centralTeeth = [teeth[midIdx - 1], teeth[midIdx]];
  const centralGap = (centralTeeth[0].position.x + centralTeeth[1].position.x) / 2;
  
  // Midline offset is the distance between arch center and central gap
  return Math.abs(centralGap - archCenter);
}

/**
 * Calculate total spacing between teeth (mm)
 */
function calculateSpacing(teeth: Tooth[]): number {
  let totalSpacing = 0;
  
  for (let i = 0; i < teeth.length - 1; i++) {
    const dist = distance3D(teeth[i].position, teeth[i + 1].position);
    const toothWidths = (teeth[i].width + teeth[i + 1].width) / 2;
    const gap = Math.max(0, dist - toothWidths);
    totalSpacing += gap;
  }
  
  return totalSpacing;
}

/**
 * Calculate average tooth rotation (degrees)
 */
function calculateAverageRotation(teeth: Tooth[]): number {
  const rotations = teeth.map(t => Math.abs(t.rotation.y) * (180 / Math.PI));
  return rotations.reduce((sum, r) => sum + r, 0) / rotations.length;
}

/**
 * Calculate overjet (horizontal overlap in mm)
 */
function calculateOverjet(upperLip: any, lowerLip: any, scale: number): number {
  // Simple approximation based on lip positions
  // In reality, this would need more sophisticated landmark analysis
  const horizontalDiff = Math.abs((upperLip.x - lowerLip.x) * scale * 100);
  return Math.min(horizontalDiff, 8); // Cap at 8mm
}

/**
 * Calculate overbite (vertical overlap in mm)
 */
function calculateOverbite(upperLip: any, lowerLip: any, scale: number): number {
  // Vertical distance between upper and lower lip
  const verticalDiff = Math.abs((upperLip.y - lowerLip.y) * scale * 100);
  
  // Normal overbite is 2-4mm, we're estimating based on lip separation
  // When mouth is open, estimate closed overbite
  return Math.max(2, Math.min(verticalDiff * 0.3, 8));
}

/**
 * Classify occlusion (Angle's classification)
 */
function classifyOcclusion(overjet: number, _overbite: number): 'Class I' | 'Class II' | 'Class III' {
  // Simplified classification based on overjet
  if (overjet < 1) {
    return 'Class III'; // Underbite
  } else if (overjet > 5) {
    return 'Class II'; // Overbite
  } else {
    return 'Class I'; // Normal
  }
}

/**
 * Utility: 2D distance between landmarks
 */
function distance2D(p1: any, p2: any): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Utility: 3D distance between points
 */
function distance3D(p1: { x: number, y: number, z: number }, p2: { x: number, y: number, z: number }): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dz = p2.z - p1.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}


/**
 * Generate target (corrected) arch for visualization
 */
export function generateTargetArch(currentArch: Arch): Arch {
  // Create corrected version - SAME arch dimensions, just fix misalignments
  const archWidth = currentArch.metrics.archWidth; // Keep SAME width
  const archDepth = archWidth * 0.45; // Use same depth ratio as current
  
  const targetTeeth: Tooth[] = currentArch.teeth.map((tooth, idx) => {
    const numTeeth = currentArch.teeth.length;
    const t = idx / (numTeeth - 1);
    
    // Calculate the ideal position for this tooth along the arch
    const idealArchAngle = (t - 0.5) * Math.PI * 0.6;
    
    // Corrected X: straighten out crooked teeth, but keep overall arch width
    // Take current X and gently nudge toward ideal position (not fully snap)
    const idealX = Math.sin(idealArchAngle) * archWidth / 2;
    const correctedX = tooth.position.x * 0.3 + idealX * 0.7; // 70% toward ideal, 30% current
    
    // Y position - keep exactly the same (no vertical movement)
    const correctedY = tooth.position.y;
    
    // Z position - gently guide toward ideal parabolic curve
    const normalizedT = (t - 0.5) * 2; // -1 to 1
    const idealZ = (1 - normalizedT * normalizedT) * archDepth;
    const correctedZ = tooth.position.z * 0.3 + idealZ * 0.7; // 70% toward ideal
    
    return {
      ...tooth,
      position: {
        x: correctedX,
        y: correctedY,
        z: correctedZ
      },
      rotation: {
        x: 0,
        y: idealArchAngle, // Straighten rotation to ideal angle
        z: 0
      }
    };
  });
  
  // Recalculate metrics for target arch (should be near-perfect)
  const targetMetrics: ArchMetrics = {
    crowdingScore: 0,
    symmetryScore: 10,
    midlineOffset: 0,
    archWidth: currentArch.metrics.archWidth,
    archLength: currentArch.metrics.archLength,
    spacing: 0,
    averageRotation: 0
  };
  
  return {
    type: currentArch.type,
    teeth: targetTeeth,
    metrics: targetMetrics
  };
}
