/**
 * Dental Domain Model
 * 
 * Represents teeth, dental arches, and derived metrics for orthodontic analysis.
 */

export interface Tooth {
  id: number; // Tooth number (1-32 in universal numbering, we'll use 1-16 per arch)
  position: { x: number; y: number; z: number }; // 3D coordinates
  rotation: { x: number; y: number; z: number }; // Euler angles in radians
  width: number; // Tooth width in mm
  height: number; // Tooth height in mm
}

export interface Arch {
  type: 'upper' | 'lower';
  teeth: Tooth[];
  metrics: ArchMetrics;
}

export interface ArchMetrics {
  // Crowding score: 0 (perfect) to 10 (severe)
  // Measures misalignment, overlapping, and spacing issues
  crowdingScore: number;
  
  // Symmetry score: 0 (asymmetric) to 10 (perfect symmetry)
  // Compares left vs right side alignment
  symmetryScore: number;
  
  // Midline offset: distance in mm from ideal centerline
  // 0 = perfect alignment, >2mm = significant deviation
  midlineOffset: number;
  
  // Arch width in mm (measured at molars)
  archWidth: number;
  
  // Arch length in mm (anterior-posterior dimension)
  archLength: number;
  
  // Overjet: horizontal overlap of upper/lower incisors (mm)
  overjet?: number;
  
  // Overbite: vertical overlap of upper/lower incisors (mm)
  overbite?: number;
  
  // Spacing: total gap space between teeth (mm)
  spacing: number;
  
  // Rotation: average tooth rotation deviation (degrees)
  averageRotation: number;
}

export interface DentalAnalysis {
  upperArch: Arch;
  lowerArch: Arch;
  
  // Combined metrics
  overallCrowding: number; // Average of both arches
  overallSymmetry: number; // Average of both arches
  
  // Relationship between arches
  occlusion: {
    overjet: number;
    overbite: number;
    classification: 'Class I' | 'Class II' | 'Class III'; // Angle's classification
  };
  
  // Analysis timestamp
  timestamp: number;
}

export interface TreatmentPlan {
  eligibility: 'eligible' | 'review' | 'reject';
  treatmentLengthMonths: number;
  stageCount: number;
  wearType: 'All-Day' | 'Night';
  
  // Reasons for eligibility decision
  reasons: string[];
  
  // Specific corrections needed
  corrections: {
    crowdingCorrection: boolean;
    rotationCorrection: boolean;
    spacingCorrection: boolean;
    midlineCorrection: boolean;
    biteCorrection: boolean;
  };
  
  // Confidence in automated assessment
  confidence: 'high' | 'medium' | 'low';
  
  // Timestamp
  timestamp: number;
}

export interface ScanSession {
  id: string;
  timestamp: number;
  
  // Original capture
  originalImageUrl: string; // Data URL or blob reference
  
  // AI preview
  previewImageUrl: string;
  
  // Analysis results
  dentalAnalysis: DentalAnalysis;
  
  // Treatment plan
  treatmentPlan: TreatmentPlan;
  
  // Status
  status: 'pending' | 'analyzed' | 'reviewed' | 'approved' | 'rejected';
}
