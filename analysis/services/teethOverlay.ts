/**
 * Smooth Teeth Overlay Renderer
 * Renders beautiful, curved tooth outlines (Smileset-style)
 */

interface Point {
  x: number;
  y: number;
}

interface ToothDetection {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  toothNumber?: string;
}

/**
 * Draw smooth, professional tooth overlays
 */
export function drawSmoothToothOverlay(
  ctx: CanvasRenderingContext2D,
  detections: ToothDetection[],
  showNumbers: boolean = true // Show confidence by default - supervisor approved!
): void {
  if (detections.length === 0) return;

  detections.forEach((tooth) => {
    // Convert box to 4-point polygon with inset corners for tooth-like shape
    const insetX = tooth.width * 0.12; // 12% inset to prevent visual overlap
    const insetY = tooth.height * 0.10; // 10% inset vertically for cleaner separation
    
    const corners: Point[] = [
      { x: tooth.x + insetX, y: tooth.y + insetY },
      { x: tooth.x + tooth.width - insetX, y: tooth.y + insetY },
      { x: tooth.x + tooth.width - insetX, y: tooth.y + tooth.height - insetY },
      { x: tooth.x + insetX, y: tooth.y + tooth.height - insetY }
    ];

    // Draw smooth curved polygon
    ctx.save();
    
    // Draw tooth shape with smooth curves
    ctx.beginPath();
    drawSmoothPolygon(ctx, corners, 0.25);
    ctx.closePath();
    
    // Simple white fill with opacity for clean look
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.fill();
    
    // White stroke for definition
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Show confidence percentage (supervisor loves this!)
    if (showNumbers && tooth.confidence !== undefined) {
      const centerX = tooth.x + tooth.width / 2;
      const centerY = tooth.y + tooth.height / 2;
      const confidence = Math.round(tooth.confidence * 100);
      
      // Draw confidence tooltip
      ctx.font = 'bold 11px -apple-system, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Background for better readability
      const text = `${confidence}%`;
      const textMetrics = ctx.measureText(text);
      const padding = 4;
      const bgWidth = textMetrics.width + padding * 2;
      const bgHeight = 16;
      
      ctx.fillStyle = 'rgba(0, 206, 124, 0.9)';
      ctx.beginPath();
      ctx.roundRect(
        centerX - bgWidth / 2,
        centerY - bgHeight / 2,
        bgWidth,
        bgHeight,
        [4]
      );
      ctx.fill();
      
      // Draw text
      ctx.fillStyle = '#ffffff';
      ctx.fillText(text, centerX, centerY);
    }
    
    ctx.restore();
  });
}

/**
 * Draw smooth curved polygon using cardinal splines (optimized for performance)
 */
function drawSmoothPolygon(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  tension: number = 0.3
): void {
  if (points.length < 3) {
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    return;
  }

  const closedPoints = [...points, points[0], points[1]];
  ctx.moveTo(closedPoints[0].x, closedPoints[0].y);
  
  // Optimized loop - pre-calculate control points
  for (let i = 0; i < points.length; i++) {
    const p0 = closedPoints[i];
    const p1 = closedPoints[i + 1];
    const p2 = closedPoints[i + 2];
    const pm1 = closedPoints[Math.max(0, i - 1)];
    
    const cp1x = p0.x + (p1.x - pm1.x) * tension;
    const cp1y = p0.y + (p1.y - pm1.y) * tension;
    const cp2x = p1.x - (p2.x - p0.x) * tension;
    const cp2y = p1.y - (p2.y - p0.y) * tension;
    
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p1.x, p1.y);
  }
}

/**
 * Draw stats panel
 */
function drawStatsPanel(
  ctx: CanvasRenderingContext2D,
  teethCount: number,
  canvasWidth: number,
  canvasHeight: number
): void {
  ctx.save();
  
  const padding = 12;
  const panelWidth = 180;
  const panelHeight = 60;
  const x = canvasWidth - panelWidth - padding;
  const y = canvasHeight - panelHeight - padding;
  const radius = 12;
  
  // Panel background
  ctx.beginPath();
  ctx.roundRect(x, y, panelWidth, panelHeight, radius);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.fill();
  
  // Accent line
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + panelWidth - radius, y);
  ctx.strokeStyle = '#00ce7c';
  ctx.lineWidth = 3;
  ctx.stroke();
  
  // Text
  ctx.fillStyle = '#00ce7c';
  ctx.font = 'bold 10px -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('BEAME AI', x + 14, y + 20);
  
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px -apple-system, sans-serif';
  ctx.fillText(teethCount.toString(), x + 14, y + 46);
  
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = '12px -apple-system, sans-serif';
  ctx.fillText('teeth identified', x + 45, y + 44);
  
  ctx.fillStyle = '#00ce7c';
  ctx.font = '14px -apple-system, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('✓', x + panelWidth - 14, y + 44);
  
  ctx.restore();
}
