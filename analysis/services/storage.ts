/**
 * Storage Service
 * 
 * Manages localStorage persistence for scan sessions, dental analysis, and treatment plans.
 */

import type { ScanSession } from '../types/dental';

const STORAGE_KEYS = {
  CURRENT_SESSION: 'beame_current_session',
  SESSION_HISTORY: 'beame_session_history',
  SETTINGS: 'beame_settings'
};

const MAX_HISTORY_ITEMS = 10; // Keep last 10 sessions

/**
 * Save current scan session
 */
export function saveCurrentSession(session: ScanSession): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(session));
    addToHistory(session);
  } catch (error) {
    console.error('Failed to save session:', error);
    // Handle quota exceeded or other errors
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      // Clear old history to make space
      clearOldHistory();
      // Retry
      try {
        localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION, JSON.stringify(session));
      } catch (retryError) {
        console.error('Failed to save session after clearing history:', retryError);
      }
    }
  }
}

/**
 * Load current scan session
 */
export function loadCurrentSession(): ScanSession | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION);
    if (!data) return null;
    
    return JSON.parse(data) as ScanSession;
  } catch (error) {
    console.error('Failed to load session:', error);
    return null;
  }
}

/**
 * Clear current session
 */
export function clearCurrentSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION);
  } catch (error) {
    console.error('Failed to clear session:', error);
  }
}

/**
 * Add session to history
 */
function addToHistory(session: ScanSession): void {
  try {
    const history = getSessionHistory();
    
    // Add new session at the beginning
    history.unshift(session);
    
    // Keep only the most recent sessions
    const trimmedHistory = history.slice(0, MAX_HISTORY_ITEMS);
    
    localStorage.setItem(STORAGE_KEYS.SESSION_HISTORY, JSON.stringify(trimmedHistory));
  } catch (error) {
    console.error('Failed to add to history:', error);
  }
}

/**
 * Get session history
 */
export function getSessionHistory(): ScanSession[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SESSION_HISTORY);
    if (!data) return [];
    
    return JSON.parse(data) as ScanSession[];
  } catch (error) {
    console.error('Failed to load history:', error);
    return [];
  }
}

/**
 * Clear old history (keep only last 5 items)
 */
function clearOldHistory(): void {
  try {
    const history = getSessionHistory();
    const trimmedHistory = history.slice(0, 5);
    localStorage.setItem(STORAGE_KEYS.SESSION_HISTORY, JSON.stringify(trimmedHistory));
  } catch (error) {
    console.error('Failed to clear old history:', error);
  }
}

/**
 * Clear all history
 */
export function clearAllHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.SESSION_HISTORY);
  } catch (error) {
    console.error('Failed to clear all history:', error);
  }
}

/**
 * Get session by ID
 */
export function getSessionById(id: string): ScanSession | null {
  const history = getSessionHistory();
  return history.find(session => session.id === id) || null;
}

/**
 * Update session status
 */
export function updateSessionStatus(
  sessionId: string, 
  status: ScanSession['status']
): void {
  try {
    // Update in history
    const history = getSessionHistory();
    const sessionIndex = history.findIndex(s => s.id === sessionId);
    
    if (sessionIndex !== -1) {
      history[sessionIndex].status = status;
      localStorage.setItem(STORAGE_KEYS.SESSION_HISTORY, JSON.stringify(history));
    }
    
    // Update current session if it matches
    const currentSession = loadCurrentSession();
    if (currentSession && currentSession.id === sessionId) {
      currentSession.status = status;
      saveCurrentSession(currentSession);
    }
  } catch (error) {
    console.error('Failed to update session status:', error);
  }
}

/**
 * Export session data (for download/sharing)
 */
export function exportSession(session: ScanSession): string {
  try {
    // Create a clean export without large image data
    const exportData = {
      id: session.id,
      timestamp: session.timestamp,
      status: session.status,
      dentalAnalysis: session.dentalAnalysis,
      treatmentPlan: session.treatmentPlan,
      note: 'Image data excluded from export'
    };
    
    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    console.error('Failed to export session:', error);
    return '';
  }
}

/**
 * Check if localStorage is available and working
 */
export function isStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get storage usage information
 */
export function getStorageInfo(): {
  isAvailable: boolean;
  currentSessionExists: boolean;
  historyCount: number;
  estimatedSize: number;
} {
  const isAvailable = isStorageAvailable();
  const currentSessionExists = loadCurrentSession() !== null;
  const historyCount = getSessionHistory().length;
  
  // Estimate storage size
  let estimatedSize = 0;
  try {
    for (const key in localStorage) {
      if (key.startsWith('beame_')) {
        estimatedSize += localStorage.getItem(key)?.length || 0;
      }
    }
  } catch (error) {
    console.error('Failed to calculate storage size:', error);
  }
  
  return {
    isAvailable,
    currentSessionExists,
    historyCount,
    estimatedSize: Math.round(estimatedSize / 1024) // KB
  };
}

/**
 * Create a new session ID
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Compress image data URL (reduce quality for storage)
 */
export async function compressImageDataUrl(
  dataUrl: string, 
  maxWidth: number = 800,
  quality: number = 0.8
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      // Calculate new dimensions
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    
    img.onerror = () => {
      // If compression fails, return original
      resolve(dataUrl);
    };
    
    img.src = dataUrl;
  });
}

/**
 * Save user settings/preferences
 */
export interface UserSettings {
  hasSeenIntro: boolean;
  preferredView: 'front' | 'top' | 'left' | 'right';
  autoSave: boolean;
}

export function saveSettings(settings: Partial<UserSettings>): void {
  try {
    const currentSettings = loadSettings();
    const updatedSettings = { ...currentSettings, ...settings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updatedSettings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

export function loadSettings(): UserSettings {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!data) {
      return {
        hasSeenIntro: false,
        preferredView: 'front',
        autoSave: true
      };
    }
    
    return JSON.parse(data) as UserSettings;
  } catch (error) {
    console.error('Failed to load settings:', error);
    return {
      hasSeenIntro: false,
      preferredView: 'front',
      autoSave: true
    };
  }
}
