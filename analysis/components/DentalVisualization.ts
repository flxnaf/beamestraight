/**
 * Dental Visualization Component
 * 
 * Pseudo-3D visualization of dental arches using Three.js
 * Shows current → target alignment with smooth interpolation
 */

import * as THREE from 'three';
import type { Arch, Tooth } from '../types/dental';

export type ViewMode = 'front' | 'top' | 'left' | 'right';

export class DentalVisualization {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private currentArch: Arch;
  private targetArch: Arch;
  private lowerArch: Arch | null = null;
  private lowerTargetArch: Arch | null = null;
  private currentMeshes: THREE.Mesh[] = [];
  private targetMeshes: THREE.Mesh[] = [];
  private lowerMeshes: THREE.Mesh[] = [];
  private interpolationProgress: number = 0;
  private isAnimating: boolean = false;
  private animationId: number | null = null;
  private currentCenterX: number = 0;
  private currentCenterY: number = 0;
  private currentCenterZ: number = 0;
  private targetCenterX: number = 0;
  private targetCenterY: number = 0;
  private targetCenterZ: number = 0;
  private scale: number = 0.1;
  
  constructor(containerId: string, currentArch: Arch, targetArch: Arch, lowerArch?: Arch, lowerTargetArch?: Arch) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container element #${containerId} not found`);
    }
    
    this.container = container;
    this.currentArch = currentArch;
    this.targetArch = targetArch;
    this.lowerArch = lowerArch || null;
    this.lowerTargetArch = lowerTargetArch || null;
    
    // Initialize Three.js scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf9fafb);
    
    // Setup camera
    this.camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.setCameraForView('front');
    
    // Setup renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(this.renderer.domElement);
    
    // Add lights
    this.setupLights();
    
    // Create arch meshes
    this.createArchMeshes();
    
    // Initialize to current state (progress = 0)
    this.updateInterpolation(0);
    console.log('🦷 [3D] Initialized to current arch (progress = 0)');
    
    // Handle window resize
    window.addEventListener('resize', () => this.handleResize());
    
    // Start render loop
    this.animate();
  }
  
  private setupLights(): void {
    // Softer ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);
    
    // Key light (main directional light from above and front)
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
    keyLight.position.set(30, 50, 40);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    this.scene.add(keyLight);
    
    // Fill light from the side
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-30, 10, 20);
    this.scene.add(fillLight);
    
    // Rim light for definition
    const rimLight = new THREE.DirectionalLight(0xaaccff, 0.3);
    rimLight.position.set(0, 10, -40);
    this.scene.add(rimLight);
    
    // Point light for dental chair effect
    const pointLight = new THREE.PointLight(0xffffff, 0.5, 100);
    pointLight.position.set(0, 30, 30);
    this.scene.add(pointLight);
    
    // Hemisphere light for natural environment
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x8899aa, 0.4);
    this.scene.add(hemiLight);
  }
  
  private createArchMeshes(): void {
    console.log('🦷 [3D] Creating arch meshes...');
    console.log('🦷 [3D] Current arch teeth count:', this.currentArch.teeth.length);
    console.log('🦷 [3D] Target arch teeth count:', this.targetArch.teeth.length);
    
    // Clear existing meshes
    this.currentMeshes.forEach(mesh => this.scene.remove(mesh));
    this.targetMeshes.forEach(mesh => this.scene.remove(mesh));
    this.currentMeshes = [];
    this.targetMeshes = [];
    
    // Calculate center point of both arches separately
    this.currentCenterX = this.currentArch.teeth.reduce((sum, t) => sum + t.position.x, 0) / this.currentArch.teeth.length;
    this.currentCenterY = this.currentArch.teeth.reduce((sum, t) => sum + t.position.y, 0) / this.currentArch.teeth.length;
    this.currentCenterZ = this.currentArch.teeth.reduce((sum, t) => sum + t.position.z, 0) / this.currentArch.teeth.length;
    
    this.targetCenterX = this.targetArch.teeth.reduce((sum, t) => sum + t.position.x, 0) / this.targetArch.teeth.length;
    this.targetCenterY = this.targetArch.teeth.reduce((sum, t) => sum + t.position.y, 0) / this.targetArch.teeth.length;
    this.targetCenterZ = this.targetArch.teeth.reduce((sum, t) => sum + t.position.z, 0) / this.targetArch.teeth.length;
    
    console.log('🦷 [3D] Current arch center:', { x: this.currentCenterX, y: this.currentCenterY, z: this.currentCenterZ });
    console.log('🦷 [3D] Target arch center:', { x: this.targetCenterX, y: this.targetCenterY, z: this.targetCenterZ });
    
    // Create tooth meshes for current arch (centered at origin)
    this.currentArch.teeth.forEach((tooth, index) => {
      const mesh = this.createToothMesh(tooth, this.currentCenterX, this.currentCenterY, this.currentCenterZ, 0xf5f5f5);
      this.currentMeshes.push(mesh);
      this.scene.add(mesh);
      
      if (index === 0) {
        console.log('🦷 [3D] First tooth centered position:', mesh.position);
      }
    });
    
    // Create lower arch teeth if available
    if (this.lowerArch && this.lowerArch.teeth.length > 0) {
      console.log('🦷 [3D] Creating lower arch...');
      const lowerCenterX = this.lowerArch.teeth.reduce((sum, t) => sum + t.position.x, 0) / this.lowerArch.teeth.length;
      const lowerCenterY = this.lowerArch.teeth.reduce((sum, t) => sum + t.position.y, 0) / this.lowerArch.teeth.length;
      const lowerCenterZ = this.lowerArch.teeth.reduce((sum, t) => sum + t.position.z, 0) / this.lowerArch.teeth.length;
      
      this.lowerArch.teeth.forEach((tooth) => {
        const mesh = this.createToothMesh(tooth, lowerCenterX, lowerCenterY, lowerCenterZ, 0xf5f5f5);
        // Offset lower teeth down a bit
        mesh.position.y -= 2;
        this.lowerMeshes.push(mesh);
        this.scene.add(mesh);
      });
      console.log('🦷 [3D] Lower arch teeth created:', this.lowerMeshes.length);
    }
    
    console.log('🦷 [3D] Total meshes in scene:', this.scene.children.length);
    console.log('🦷 [3D] Camera position:', this.camera.position);
    
    // Add a subtle arch curve guide (use current arch center as reference)
    this.addArchGuide(this.currentCenterX, this.currentCenterY, this.currentCenterZ);
  }
  
  private addArchGuide(centerX: number, centerY: number, centerZ: number): void {
    // Create a subtle curve showing the dental arch
    const points: THREE.Vector3[] = [];
    const scale = 0.1; // Scale down from pixel coordinates to 3D world units
    
    this.currentArch.teeth.forEach(tooth => {
      points.push(new THREE.Vector3(
        (tooth.position.x - centerX) * scale,
        -(tooth.position.y - centerY) * scale - 0.5, // FLIP Y and slightly below teeth
        (tooth.position.z - centerZ) * scale
      ));
    });
    
    const curve = new THREE.CatmullRomCurve3(points);
    const curvePoints = curve.getPoints(50);
    const curveGeometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
    const curveMaterial = new THREE.LineBasicMaterial({ 
      color: 0x10b981, 
      transparent: true, 
      opacity: 0.3,
      linewidth: 2
    });
    const curveLine = new THREE.Line(curveGeometry, curveMaterial);
    this.scene.add(curveLine);
  }
  
  private createToothMesh(tooth: Tooth, centerX: number, centerY: number, centerZ: number, color: number): THREE.Mesh {
    // Scale factor to convert pixel coordinates to 3D world units
    const scale = 0.1;
    
    // Scale tooth dimensions appropriately
    const toothWidth = tooth.width * scale;
    const toothHeight = tooth.height * scale;
    
    // Create realistic tooth shape using multiple geometries
    const group = new THREE.Group();
    
    // Main crown (tapered box shape, more realistic than cylinder)
    const crownGeometry = new THREE.BoxGeometry(
      toothWidth * 0.7,   // Width
      toothHeight * 0.6,  // Height
      toothWidth * 0.6    // Depth
    );
    
    // Taper the crown geometry to be narrower at top
    const positionAttribute = crownGeometry.attributes.position;
    for (let i = 0; i < positionAttribute.count; i++) {
      const y = positionAttribute.getY(i);
      if (y > 0) {
        // Taper the top vertices inward
        const x = positionAttribute.getX(i);
        const z = positionAttribute.getZ(i);
        positionAttribute.setX(i, x * 0.85);
        positionAttribute.setZ(i, z * 0.85);
      }
    }
    crownGeometry.computeVertexNormals();
    
    // Realistic tooth material with subsurface scattering effect
    const toothMaterial = new THREE.MeshPhysicalMaterial({
      color: color,
      roughness: 0.15,
      metalness: 0,
      clearcoat: 0.3,
      clearcoatRoughness: 0.2,
      reflectivity: 0.5,
      transparent: true,
      opacity: 0.98,
      side: THREE.FrontSide
    });
    
    const crownMesh = new THREE.Mesh(crownGeometry, toothMaterial);
    crownMesh.position.y = toothHeight * 0.2;
    group.add(crownMesh);
    
    // Rounded top cap (incisal edge)
    const capGeometry = new THREE.SphereGeometry(
      toothWidth * 0.4,
      20,
      12,
      0,
      Math.PI * 2,
      0,
      Math.PI / 2.5
    );
    const capMesh = new THREE.Mesh(capGeometry, toothMaterial.clone());
    capMesh.position.y = toothHeight * 0.45;
    group.add(capMesh);
    
    // Root (slightly darker, narrower)
    const rootGeometry = new THREE.CylinderGeometry(
      toothWidth * 0.25,  // Top radius
      toothWidth * 0.2,   // Bottom radius (tapered)
      toothHeight * 0.4,  // Height
      16,
      1
    );
    const rootMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(color).multiplyScalar(0.9),
      roughness: 0.3,
      metalness: 0,
      transparent: true,
      opacity: 0.9
    });
    const rootMesh = new THREE.Mesh(rootGeometry, rootMaterial);
    rootMesh.position.y = -toothHeight * 0.15;
    group.add(rootMesh);
    
    // Add subtle specular highlights (enamel shine)
    const highlightGeometry = new THREE.SphereGeometry(
      toothWidth * 0.15,
      12,
      8
    );
    const highlightMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.2
    });
    const highlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
    highlight.position.set(toothWidth * 0.2, toothHeight * 0.3, toothWidth * 0.3);
    group.add(highlight);
    
    // Center the position at origin
    // INVERT Y to match 3D coordinate system (FaceMesh Y goes down, 3D Y goes up)
    group.position.set(
      (tooth.position.x - centerX) * scale, 
      -(tooth.position.y - centerY) * scale, // Negative to flip Y axis
      (tooth.position.z - centerZ) * scale
    );
    group.rotation.set(tooth.rotation.x, tooth.rotation.y, tooth.rotation.z);
    
    // Cast shadows for realism
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    
    // Create a wrapper mesh to maintain compatibility
    const wrapperMesh = new THREE.Mesh();
    wrapperMesh.add(group);
    
    return wrapperMesh;
  }
  
  /**
   * Set camera position for different view modes
   */
  public setCameraForView(view: ViewMode): void {
    const distance = 15; // Optimal viewing distance
    const elevation = 3; // Slight elevation
    
    switch (view) {
      case 'front':
        // Looking straight at the teeth from the FRONT (outside view, like patient facing you)
        // Camera at POSITIVE Z looking back toward origin (viewing labial/facial surface)
        this.camera.position.set(0, elevation, distance);
        this.camera.lookAt(0, 0, 0);
        break;
      case 'top':
        // Looking down from above
        this.camera.position.set(0, distance, 0);
        this.camera.lookAt(0, 0, 0);
        break;
      case 'left':
        // Looking from the left side (patient's left)
        this.camera.position.set(-distance, elevation, 0);
        this.camera.lookAt(0, 0, 0);
        break;
      case 'right':
        // Looking from the right side (patient's right)
        this.camera.position.set(distance, elevation, 0);
        this.camera.lookAt(0, 0, 0);
        break;
    }
  }
  
  /**
   * Change view mode
   */
  public setView(view: ViewMode): void {
    this.animateCameraTransition(view);
  }
  
  private animateCameraTransition(targetView: ViewMode): void {
    // Smooth camera transition
    const startPosition = this.camera.position.clone();
    const distance = 15;
    const elevation = 3;
    let targetPosition: THREE.Vector3;
    let lookAtTarget: THREE.Vector3;
    
    switch (targetView) {
      case 'front':
        // Camera at POSITIVE Z to view from front (outside)
        targetPosition = new THREE.Vector3(0, elevation, distance);
        lookAtTarget = new THREE.Vector3(0, 0, 0);
        break;
      case 'top':
        targetPosition = new THREE.Vector3(0, distance, 0);
        lookAtTarget = new THREE.Vector3(0, 0, 0);
        break;
      case 'left':
        targetPosition = new THREE.Vector3(-distance, elevation, 0);
        lookAtTarget = new THREE.Vector3(0, 0, 0);
        break;
      case 'right':
        targetPosition = new THREE.Vector3(distance, elevation, 0);
        lookAtTarget = new THREE.Vector3(0, 0, 0);
        break;
    }
    
    // Animate camera position over 60 frames
    let frame = 0;
    const totalFrames = 60;
    
    const animateCamera = () => {
      frame++;
      const t = frame / totalFrames;
      const eased = this.easeInOutCubic(t);
      
      this.camera.position.lerpVectors(startPosition, targetPosition, eased);
      this.camera.lookAt(lookAtTarget.x, lookAtTarget.y, lookAtTarget.z);
      
      if (frame < totalFrames) {
        requestAnimationFrame(animateCamera);
      }
    };
    
    animateCamera();
  }
  
  /**
   * Animate teeth moving from current to target position (in place)
   * Camera NEVER moves, only teeth move to show correction
   */
  public startInterpolation(duration: number = 2000): void {
    if (this.isAnimating) return;
    
    console.log('🎬 Starting tooth transformation animation (camera fixed)');
    
    this.isAnimating = true;
    const startProgress = this.interpolationProgress;
    const startTime = Date.now();
    
    // Store camera position to ensure it never changes
    const fixedCameraPosition = this.camera.position.clone();
    const fixedCameraRotation = this.camera.rotation.clone();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      
      // Animate from current progress to 1 (target)
      this.interpolationProgress = startProgress + (1 - startProgress) * progress;
      this.updateInterpolation(this.interpolationProgress);
      
      // Force camera to stay fixed (in case something tries to move it)
      this.camera.position.copy(fixedCameraPosition);
      this.camera.rotation.copy(fixedCameraRotation);
      this.camera.lookAt(0, 0, 0);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.isAnimating = false;
        this.interpolationProgress = 1;
        console.log('✓ Transformation animation complete');
      }
    };
    
    animate();
  }
  
  /**
   * Animate back to current arch (reverse animation, no camera reset)
   */
  public resetToCurrentArch(): void {
    if (this.isAnimating) return;
    
    console.log('🎬 Starting reverse animation to current arch (camera stays fixed)');
    
    this.isAnimating = true;
    const startProgress = this.interpolationProgress;
    const startTime = Date.now();
    const duration = 2000;
    
    // Store camera position to ensure it never changes
    const fixedCameraPosition = this.camera.position.clone();
    const fixedCameraRotation = this.camera.rotation.clone();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      
      // Animate from current progress to 0 (reverse to current)
      this.interpolationProgress = startProgress - (startProgress * progress);
      this.updateInterpolation(this.interpolationProgress);
      
      // Force camera to stay fixed
      this.camera.position.copy(fixedCameraPosition);
      this.camera.rotation.copy(fixedCameraRotation);
      this.camera.lookAt(0, 0, 0);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.isAnimating = false;
        this.interpolationProgress = 0;
        console.log('✓ Reverse animation complete - showing current arch');
      }
    };
    
    animate();
  }
  
  /**
   * Show target arch (progress = 1)
   */
  public showTargetArch(): void {
    this.interpolationProgress = 1;
    this.updateInterpolation(1);
  }
  
  /**
   * Update interpolation between current and target arches
   */
  private updateInterpolation(progress: number): void {
    const eased = this.easeInOutCubic(progress);
    
    // Animate upper teeth
    this.currentMeshes.forEach((mesh, idx) => {
      const currentTooth = this.currentArch.teeth[idx];
      const targetTooth = this.targetArch.teeth[idx];
      
      // Use separate centers for current and target
      // This keeps teeth in the same location, just adjusts their alignment
      // INVERT Y to match 3D coordinate system
      const currentX = (currentTooth.position.x - this.currentCenterX) * this.scale;
      const currentY = -(currentTooth.position.y - this.currentCenterY) * this.scale;
      const currentZ = (currentTooth.position.z - this.currentCenterZ) * this.scale;
      
      // Target positions use their own coordinate space, centered around origin
      const targetX = (targetTooth.position.x - this.targetCenterX) * this.scale;
      const targetY = -(targetTooth.position.y - this.targetCenterY) * this.scale;
      const targetZ = (targetTooth.position.z - this.targetCenterZ) * this.scale;
      
      // Interpolate position - teeth stay in same general area, just align better
      mesh.position.x = THREE.MathUtils.lerp(currentX, targetX, eased);
      mesh.position.y = THREE.MathUtils.lerp(currentY, targetY, eased);
      mesh.position.z = THREE.MathUtils.lerp(currentZ, targetZ, eased);
      
      // Interpolate rotation
      mesh.rotation.y = THREE.MathUtils.lerp(
        currentTooth.rotation.y,
        targetTooth.rotation.y,
        eased
      );
    });
    
    // Animate lower teeth if they exist
    if (this.lowerArch && this.lowerTargetArch && this.lowerMeshes.length > 0) {
      // Calculate centers for lower arch (do this once, not per tooth!)
      const lowerCurrentCenterX = this.lowerArch.teeth.reduce((sum, t) => sum + t.position.x, 0) / this.lowerArch.teeth.length;
      const lowerCurrentCenterY = this.lowerArch.teeth.reduce((sum, t) => sum + t.position.y, 0) / this.lowerArch.teeth.length;
      const lowerCurrentCenterZ = this.lowerArch.teeth.reduce((sum, t) => sum + t.position.z, 0) / this.lowerArch.teeth.length;
      
      const lowerTargetCenterX = this.lowerTargetArch.teeth.reduce((sum, t) => sum + t.position.x, 0) / this.lowerTargetArch.teeth.length;
      const lowerTargetCenterY = this.lowerTargetArch.teeth.reduce((sum, t) => sum + t.position.y, 0) / this.lowerTargetArch.teeth.length;
      const lowerTargetCenterZ = this.lowerTargetArch.teeth.reduce((sum, t) => sum + t.position.z, 0) / this.lowerTargetArch.teeth.length;
      
      this.lowerMeshes.forEach((mesh, idx) => {
        if (idx >= this.lowerArch!.teeth.length || idx >= this.lowerTargetArch!.teeth.length) return;
        
        const currentTooth = this.lowerArch!.teeth[idx];
        const targetTooth = this.lowerTargetArch!.teeth[idx];
        
        // INVERT Y for lower teeth too, and apply offset
        const currentX = (currentTooth.position.x - lowerCurrentCenterX) * this.scale;
        const currentY = -(currentTooth.position.y - lowerCurrentCenterY) * this.scale - 2; // Offset down
        const currentZ = (currentTooth.position.z - lowerCurrentCenterZ) * this.scale;
        
        const targetX = (targetTooth.position.x - lowerTargetCenterX) * this.scale;
        const targetY = -(targetTooth.position.y - lowerTargetCenterY) * this.scale - 2; // Offset down
        const targetZ = (targetTooth.position.z - lowerTargetCenterZ) * this.scale;
        
        mesh.position.x = THREE.MathUtils.lerp(currentX, targetX, eased);
        mesh.position.y = THREE.MathUtils.lerp(currentY, targetY, eased);
        mesh.position.z = THREE.MathUtils.lerp(currentZ, targetZ, eased);
        
        mesh.rotation.y = THREE.MathUtils.lerp(
          currentTooth.rotation.y,
          targetTooth.rotation.y,
          eased
        );
      });
    }
  }
  
  /**
   * Easing function for smooth animations
   */
  private easeInOutCubic(t: number): number {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  
  /**
   * Animation loop
   */
  private frameCount = 0;
  
  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);
    
    // Slight rotation for visual interest (disabled during view changes)
    if (!this.isAnimating) {
      // Optional: Add subtle idle animation
    }
    
    this.renderer.render(this.scene, this.camera);
    
    // Debug: Log first frame
    if (this.frameCount === 0) {
      console.log('🎬 [3D] First animation frame rendered');
      console.log('🎬 [3D] Renderer size:', this.renderer.getSize(new THREE.Vector2()));
      console.log('🎬 [3D] Canvas dimensions:', {
        width: this.renderer.domElement.width,
        height: this.renderer.domElement.height
      });
    }
    this.frameCount++;
  }
  
  /**
   * Handle window resize
   */
  private handleResize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    this.renderer.setSize(width, height);
  }
  
  /**
   * Update arches (useful for live updates)
   */
  public updateArches(currentArch: Arch, targetArch: Arch): void {
    this.currentArch = currentArch;
    this.targetArch = targetArch;
    this.createArchMeshes();
    this.updateInterpolation(this.interpolationProgress);
  }
  
  /**
   * Cleanup and dispose resources
   */
  public dispose(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    
    window.removeEventListener('resize', () => this.handleResize());
    
    // Dispose geometries and materials
    this.currentMeshes.forEach(mesh => {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
      this.scene.remove(mesh);
    });
    
    this.targetMeshes.forEach(mesh => {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
      this.scene.remove(mesh);
    });
    
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
  }
  
  /**
   * Get current interpolation progress
   */
  public getProgress(): number {
    return this.interpolationProgress;
  }
  
  /**
   * Set interpolation progress manually
   */
  public setProgress(progress: number): void {
    this.interpolationProgress = Math.max(0, Math.min(1, progress));
    this.updateInterpolation(this.interpolationProgress);
  }
}

/**
 * Create a visualization for both upper and lower arches
 */
export function createDualArchVisualization(
  containerId: string,
  upperCurrent: Arch,
  upperTarget: Arch,
  _lowerCurrent: Arch,
  _lowerTarget: Arch
): DentalVisualization {
  // For simplicity, we'll visualize upper arch
  // In a full implementation, you'd render both arches together
  return new DentalVisualization(containerId, upperCurrent, upperTarget);
}
