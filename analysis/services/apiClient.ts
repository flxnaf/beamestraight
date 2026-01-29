/**
 * API Client for Backend Communication
 * 
 * This service handles all communication with the backend API,
 * which securely manages the Gemini API key and makes AI requests.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

interface GenerateImageResponse {
  success: boolean;
  imageDataUrl?: string;
  model?: string;
  error?: string;
  message?: string;
}

interface ClassifyResponse {
  success: boolean;
  classification?: 'MILD' | 'MODERATE' | 'COMPLEX' | 'URGENT';
  fallback?: 'MILD' | 'MODERATE' | 'COMPLEX' | 'URGENT';
  error?: string;
  message?: string;
}

/**
 * Generate a straightened teeth image using AI
 * @param imageData - Base64 encoded image data (with or without data URL prefix)
 * @param modelName - Optional Gemini model name to use
 * @returns Generated image data URL or throws error
 */
export async function generateStraightenedImage(
  imageData: string,
  modelName?: string
): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/generate-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageData, modelName }),
    });

    const data: GenerateImageResponse = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || data.error || 'Failed to generate image');
    }

    return data.imageDataUrl || '';
  } catch (error) {
    console.error('Error calling backend generate-image API:', error);
    throw error;
  }
}

/**
 * Classify dental case severity using AI
 * @param imageData - Base64 encoded image data (with or without data URL prefix)
 * @returns Classification category
 */
export async function classifyDentalCase(
  imageData: string
): Promise<'MILD' | 'MODERATE' | 'COMPLEX' | 'URGENT'> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/classify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageData }),
    });

    const data: ClassifyResponse = await response.json();

    if (!response.ok || !data.success) {
      console.warn('Classification API error, using fallback:', data.message || data.error);
      return data.fallback || 'MODERATE';
    }

    return data.classification || 'MODERATE';
  } catch (error) {
    console.error('Error calling backend classify API:', error);
    // Return moderate as safe default if backend is unavailable
    return 'MODERATE';
  }
}

/**
 * Check if backend API is available
 * @returns true if backend is healthy, false otherwise
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
    });
    return response.ok;
  } catch (error) {
    console.error('Backend health check failed:', error);
    return false;
  }
}
