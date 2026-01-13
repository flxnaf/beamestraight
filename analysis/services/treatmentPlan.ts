/**
 * Treatment Plan Generator
 * 
 * Deterministic rule-based treatment planning using dental metrics.
 * No ML models - uses explainable thresholds based on orthodontic guidelines.
 */

import type { DentalAnalysis, TreatmentPlan } from '../types/dental';

// Clinical thresholds (based on general orthodontic standards)
const THRESHOLDS = {
  // Crowding scores (0-10 scale)
  CROWDING_MILD: 3,
  CROWDING_MODERATE: 6,
  CROWDING_SEVERE: 8,
  
  // Symmetry scores (0-10 scale, higher is better)
  SYMMETRY_GOOD: 7,
  SYMMETRY_FAIR: 5,
  
  // Midline offset (mm)
  MIDLINE_ACCEPTABLE: 2,
  MIDLINE_SIGNIFICANT: 4,
  
  // Overjet/overbite (mm)
  OVERJET_NORMAL: 2,
  OVERJET_MODERATE: 5,
  OVERJET_SEVERE: 7,
  OVERBITE_NORMAL: 2,
  OVERBITE_DEEP: 4,
  OVERBITE_SEVERE: 6,
  
  // Rotation (degrees)
  ROTATION_MILD: 10,
  ROTATION_MODERATE: 25,
  ROTATION_SEVERE: 45,
  
  // Spacing (mm total)
  SPACING_MINOR: 2,
  SPACING_MODERATE: 5,
  SPACING_SIGNIFICANT: 8
};

/**
 * Generate a deterministic treatment plan based on dental analysis
 */
export function generateTreatmentPlan(analysis: DentalAnalysis): TreatmentPlan {
  const reasons: string[] = [];
  const corrections = {
    crowdingCorrection: false,
    rotationCorrection: false,
    spacingCorrection: false,
    midlineCorrection: false,
    biteCorrection: false
  };
  
  // Analyze crowding
  const avgCrowding = analysis.overallCrowding;
  if (avgCrowding > THRESHOLDS.CROWDING_SEVERE) {
    reasons.push('Severe crowding detected - may require comprehensive treatment');
    corrections.crowdingCorrection = true;
  } else if (avgCrowding > THRESHOLDS.CROWDING_MODERATE) {
    reasons.push('Moderate crowding - aligners can address this');
    corrections.crowdingCorrection = true;
  } else if (avgCrowding > THRESHOLDS.CROWDING_MILD) {
    reasons.push('Mild crowding - good candidate for aligners');
    corrections.crowdingCorrection = true;
  }
  
  // Analyze symmetry
  const avgSymmetry = analysis.overallSymmetry;
  if (avgSymmetry < THRESHOLDS.SYMMETRY_FAIR) {
    reasons.push('Significant asymmetry - requires careful planning');
  } else if (avgSymmetry < THRESHOLDS.SYMMETRY_GOOD) {
    reasons.push('Minor asymmetry - can be corrected');
  }
  
  // Analyze midline
  const upperMidline = analysis.upperArch.metrics.midlineOffset;
  const lowerMidline = analysis.lowerArch.metrics.midlineOffset;
  const maxMidline = Math.max(upperMidline, lowerMidline);
  
  if (maxMidline > THRESHOLDS.MIDLINE_SIGNIFICANT) {
    reasons.push('Significant midline deviation - needs correction');
    corrections.midlineCorrection = true;
  } else if (maxMidline > THRESHOLDS.MIDLINE_ACCEPTABLE) {
    reasons.push('Minor midline deviation - can be improved');
    corrections.midlineCorrection = true;
  }
  
  // Analyze bite
  const { overjet, overbite } = analysis.occlusion;
  if (overjet > THRESHOLDS.OVERJET_SEVERE || overbite > THRESHOLDS.OVERBITE_SEVERE) {
    reasons.push('Severe bite issue - may need traditional orthodontics');
    corrections.biteCorrection = true;
  } else if (overjet > THRESHOLDS.OVERJET_MODERATE || overbite > THRESHOLDS.OVERBITE_DEEP) {
    reasons.push('Moderate bite issue - aligners can help');
    corrections.biteCorrection = true;
  }
  
  // Analyze rotation
  const avgRotation = (analysis.upperArch.metrics.averageRotation + 
                       analysis.lowerArch.metrics.averageRotation) / 2;
  if (avgRotation > THRESHOLDS.ROTATION_SEVERE) {
    reasons.push('Severe tooth rotation - challenging case');
    corrections.rotationCorrection = true;
  } else if (avgRotation > THRESHOLDS.ROTATION_MODERATE) {
    reasons.push('Moderate rotation - aligners can correct');
    corrections.rotationCorrection = true;
  } else if (avgRotation > THRESHOLDS.ROTATION_MILD) {
    reasons.push('Minor rotation - easy to fix');
    corrections.rotationCorrection = true;
  }
  
  // Analyze spacing
  const avgSpacing = (analysis.upperArch.metrics.spacing + 
                      analysis.lowerArch.metrics.spacing) / 2;
  if (avgSpacing > THRESHOLDS.SPACING_SIGNIFICANT) {
    reasons.push('Significant spacing - will be closed');
    corrections.spacingCorrection = true;
  } else if (avgSpacing > THRESHOLDS.SPACING_MODERATE) {
    reasons.push('Moderate spacing - good for aligners');
    corrections.spacingCorrection = true;
  } else if (avgSpacing > THRESHOLDS.SPACING_MINOR) {
    reasons.push('Minor spacing - quick correction');
    corrections.spacingCorrection = true;
  }
  
  // Determine eligibility
  const { eligibility, confidence } = determineEligibility(
    avgCrowding,
    avgSymmetry,
    maxMidline,
    overjet,
    overbite,
    avgRotation,
    analysis.occlusion.classification
  );
  
  // Calculate treatment parameters
  const treatmentParams = calculateTreatmentParameters(
    avgCrowding,
    avgRotation,
    avgSpacing,
    maxMidline,
    overjet,
    overbite,
    corrections
  );
  
  return {
    eligibility,
    treatmentLengthMonths: treatmentParams.months,
    stageCount: treatmentParams.stages,
    wearType: treatmentParams.wearType,
    reasons: reasons.length > 0 ? reasons : ['Teeth analysis complete - minor adjustments recommended'],
    corrections,
    confidence,
    timestamp: Date.now()
  };
}

/**
 * Determine treatment eligibility based on clinical criteria
 */
function determineEligibility(
  crowding: number,
  symmetry: number,
  midline: number,
  overjet: number,
  overbite: number,
  rotation: number,
  occlusion: string
): { eligibility: 'eligible' | 'review' | 'reject', confidence: 'high' | 'medium' | 'low' } {
  
  // Auto-reject criteria (cases too complex for clear aligners)
  if (
    crowding > 9 ||
    rotation > THRESHOLDS.ROTATION_SEVERE ||
    overjet > THRESHOLDS.OVERJET_SEVERE ||
    overbite > THRESHOLDS.OVERBITE_SEVERE ||
    occlusion === 'Class III' // Underbite cases often need surgery
  ) {
    return { eligibility: 'reject', confidence: 'high' };
  }
  
  // Review criteria (borderline cases)
  if (
    crowding > THRESHOLDS.CROWDING_SEVERE ||
    symmetry < THRESHOLDS.SYMMETRY_FAIR ||
    midline > THRESHOLDS.MIDLINE_SIGNIFICANT ||
    rotation > THRESHOLDS.ROTATION_MODERATE ||
    (overjet > THRESHOLDS.OVERJET_MODERATE && overbite > THRESHOLDS.OVERBITE_DEEP)
  ) {
    return { eligibility: 'review', confidence: 'medium' };
  }
  
  // Eligible - good candidate for aligners
  const complexityFactors = [
    crowding > THRESHOLDS.CROWDING_MODERATE,
    symmetry < THRESHOLDS.SYMMETRY_GOOD,
    midline > THRESHOLDS.MIDLINE_ACCEPTABLE,
    rotation > THRESHOLDS.ROTATION_MILD,
    overjet > THRESHOLDS.OVERJET_NORMAL || overbite > THRESHOLDS.OVERBITE_NORMAL
  ].filter(Boolean).length;
  
  const confidence = complexityFactors <= 1 ? 'high' : complexityFactors <= 3 ? 'medium' : 'low';
  
  return { eligibility: 'eligible', confidence };
}

/**
 * Calculate treatment duration, stages, and wear type
 */
function calculateTreatmentParameters(
  crowding: number,
  rotation: number,
  spacing: number,
  midline: number,
  overjet: number,
  overbite: number,
  _corrections: any
): { months: number, stages: number, wearType: 'All-Day' | 'Night' } {
  
  // Base duration (months) - start at 6 for minor cases
  let months = 6;
  
  // Add time for crowding
  if (crowding > THRESHOLDS.CROWDING_MODERATE) {
    months += 8;
  } else if (crowding > THRESHOLDS.CROWDING_MILD) {
    months += 4;
  } else if (crowding > 0) {
    months += 2;
  }
  
  // Add time for rotation
  if (rotation > THRESHOLDS.ROTATION_MODERATE) {
    months += 6;
  } else if (rotation > THRESHOLDS.ROTATION_MILD) {
    months += 3;
  }
  
  // Add time for bite corrections
  if (overjet > THRESHOLDS.OVERJET_MODERATE || overbite > THRESHOLDS.OVERBITE_DEEP) {
    months += 4;
  } else if (overjet > THRESHOLDS.OVERJET_NORMAL || overbite > THRESHOLDS.OVERBITE_NORMAL) {
    months += 2;
  }
  
  // Add time for midline correction
  if (midline > THRESHOLDS.MIDLINE_ACCEPTABLE) {
    months += 2;
  }
  
  // Add time for spacing (actually can be faster, but add refinement time)
  if (spacing > THRESHOLDS.SPACING_MODERATE) {
    months += 1;
  }
  
  // Cap at reasonable maximum
  months = Math.min(months, 24);
  
  // Calculate stages (aligners changed every 1-2 weeks, so ~2 per month)
  const stages = Math.round(months * 2);
  
  // Determine wear type
  // Night-only for very minor cases, All-Day for everything else
  const isMinorCase = 
    crowding < THRESHOLDS.CROWDING_MILD &&
    rotation < THRESHOLDS.ROTATION_MILD &&
    midline < THRESHOLDS.MIDLINE_ACCEPTABLE &&
    overjet < THRESHOLDS.OVERJET_NORMAL &&
    overbite < THRESHOLDS.OVERBITE_NORMAL;
  
  const wearType = isMinorCase ? 'Night' : 'All-Day';
  
  return { months, stages, wearType };
}

/**
 * Helper function to assess complexity score (0-100)
 */
export function calculateComplexityScore(analysis: DentalAnalysis): number {
  let score = 0;
  
  // Crowding contribution (0-40 points)
  score += Math.min(analysis.overallCrowding * 4, 40);
  
  // Rotation contribution (0-20 points)
  const avgRotation = (analysis.upperArch.metrics.averageRotation + 
                       analysis.lowerArch.metrics.averageRotation) / 2;
  score += Math.min(avgRotation / 2, 20);
  
  // Symmetry contribution (0-20 points, inverted)
  score += Math.max(20 - analysis.overallSymmetry * 2, 0);
  
  // Bite contribution (0-20 points)
  const biteScore = Math.max(
    analysis.occlusion.overjet / THRESHOLDS.OVERJET_SEVERE,
    analysis.occlusion.overbite / THRESHOLDS.OVERBITE_SEVERE
  ) * 20;
  score += Math.min(biteScore, 20);
  
  return Math.min(Math.round(score), 100);
}
