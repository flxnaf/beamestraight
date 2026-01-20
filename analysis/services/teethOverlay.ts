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
  showNumbers: boolean = false // Disabled by default for cleaner look
): void {
  if (detections.length === 0) return;

  detections.forEach((tooth) => {
    // Convert box to 4-point polygon with inset corners for tooth-like shape
    const insetX = tooth.width * 0.08; // 8% inset for more rounded tooth shape
    const insetY = tooth.height * 0.06; // 6% inset vertically
    
    const corners: Point[] = [
      { x: tooth.x + insetX, y: tooth.y + insetY },
      { x: tooth.x + tooth.width - insetX, y: tooth.y + insetY },
      { x: tooth.x + tooth.width - insetX, y: tooth.y + tooth.height - insetY },
      { x: tooth.x + insetX, y: tooth.y + tooth.height - insetY }
    ];

    // Draw smooth curved polygon
    ctx.save();
    
    // Prettier glow effect (optimized)
    ctx.shadowColor = 'rgba(0, 206, 124, 0.6)';
    ctx.shadowBlur = 8;
    
    // Draw tooth shape with smooth curves
    ctx.beginPath();
    drawSmoothPolygon(ctx, corners, 0.25); // Increased tension for smoother, more natural curves
    ctx.closePath();
    
    // Gradient fill for depth
    const centerX = tooth.x + tooth.width / 2;
    const centerY = tooth.y + tooth.height / 2;
    const gradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, Math.max(tooth.width, tooth.height) / 2
    );
    gradient.addColorStop(0, 'rgba(0, 206, 124, 0.35)');
    gradient.addColorStop(1, 'rgba(0, 206, 124, 0.15)');
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Bright stroke for definition
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(0, 206, 124, 0.95)';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    
    // Inner highlight for 3D effect
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // Optional tooth number badge (cleaner UI without numbers by default)
    if (showNumbers && tooth.toothNumber) {
      const badgeY = tooth.y - 10;
      
      ctx.shadowColor = 'rgba(0, 206, 124, 0.8)';
      ctx.shadowBlur = 6;
      
      // Badge circle
      ctx.beginPath();
      ctx.arc(centerX, badgeY, 12, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 206, 124, 0.95)';
      ctx.fill();
      
      // Badge border
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      
      // Tooth number text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(tooth.toothNumber, centerX, badgeY);
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
