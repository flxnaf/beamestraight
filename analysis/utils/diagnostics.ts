/**
 * Diagnostic utilities for debugging the application
 */

export function enableDiagnostics() {
  // Add global diagnostic functions
  (window as any).beameDiagnostics = {
    // Check if elements exist
    checkElements: () => {
      const elements = {
        treatmentPlanSection: !!document.getElementById('treatmentPlanSection'),
        visualizationSection: !!document.getElementById('visualizationSection'),
        dentalVisualization: !!document.getElementById('dentalVisualization'),
        eligibilityBadge: !!document.getElementById('eligibilityBadge'),
        treatmentLength: !!document.getElementById('treatmentLength'),
      };
      console.log('[DEBUG] Element Check:', elements);
      return elements;
    },

    // Force show all sections for testing
    showAllSections: () => {
      const sections = [
        'treatmentPlanSection',
        'visualizationSection',
        'treatmentDetails'
      ];
      sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.style.display = 'block';
          console.log(`[DEBUG] Showed ${id}`);
        } else {
          console.log(`[DEBUG] Element ${id} not found`);
        }
      });
    },

    // Check localStorage
    checkStorage: () => {
      const session = localStorage.getItem('beame_current_session');
      if (session) {
        const parsed = JSON.parse(session);
        console.log('[DEBUG] Current Session:', {
          id: parsed.id,
          timestamp: new Date(parsed.timestamp).toLocaleString(),
          hasAnalysis: !!parsed.dentalAnalysis,
          hasPlan: !!parsed.treatmentPlan,
          status: parsed.status
        });
        return parsed;
      } else {
        console.log('[DEBUG] No session in storage');
        return null;
      }
    },

    // Get help
    help: () => {
      console.log(`
[DEBUG] Beame Diagnostics Available Commands:
================================================

beameDiagnostics.checkElements()
  -> Check if all DOM elements exist

beameDiagnostics.showAllSections()
  -> Force show treatment plan & 3D viewer (testing)

beameDiagnostics.checkStorage()
  -> Check localStorage for saved session

beameDiagnostics.help()
  -> Show this help message

================================================
      `);
    }
  };

  console.log('[DEBUG] Diagnostics enabled! Type: beameDiagnostics.help()');
}

// Visual indicator that analysis is running
export function showAnalysisIndicator() {
  const indicator = document.createElement('div');
  indicator.id = 'analysis-indicator';
  indicator.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(16, 185, 129, 0.95);
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-weight: 600;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    animation: pulse 2s ease-in-out infinite;
  `;
  indicator.textContent = 'Analyzing Dental Data...';
  document.body.appendChild(indicator);
  
  return () => {
    const el = document.getElementById('analysis-indicator');
    if (el) el.remove();
  };
}
