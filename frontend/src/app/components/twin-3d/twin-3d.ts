import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { forkJoin } from 'rxjs';

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { FarmService } from '../../services/farm.service';
import { TreeService } from '../../services/tree.service';
import { PipelineService } from '../../services/pipeline.service';
import { ValveService } from '../../services/valve.service';
import { PumpService } from '../../services/pump.service';
import { TankService } from '../../services/tank.service';

@Component({
  selector: 'app-twin-3d',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatSelectModule,
    MatDividerModule,
    MatTooltipModule
  ],
  template: `
    <div class="twin-workspace">
      <!-- 3D Canvas Rendering Area -->
      <div #canvasContainer class="canvas-container"></div>

      <!-- Floating HUD / KPIs (Top Left) -->
      <div class="floating-header">
        <div class="glass-panel kpi-group">
          <div class="kpi-item">
            <span class="kpi-label">3D Rendering</span>
            <span class="kpi-val text-primary">Active</span>
          </div>
          <div class="kpi-divider"></div>
          <div class="kpi-item">
            <span class="kpi-label">Trees</span>
            <span class="kpi-val text-trees">{{ renderedTreesCount() }}</span>
          </div>
          <div class="kpi-divider"></div>
          <div class="kpi-item">
            <span class="kpi-label">Pipes</span>
            <span class="kpi-val text-pipelines">{{ renderedPipesCount() }}</span>
          </div>
          <div class="kpi-divider"></div>
          <div class="kpi-item">
            <span class="kpi-label">Pumps</span>
            <span class="kpi-val text-pumps">{{ renderedPumpsCount() }}</span>
          </div>
          <div class="kpi-divider"></div>
          <div class="kpi-item">
            <span class="kpi-label">Valves</span>
            <span class="kpi-val text-valves">{{ renderedValvesCount() }}</span>
          </div>
          <div class="kpi-divider"></div>
          <div class="kpi-item">
            <span class="kpi-label">Tanks</span>
            <span class="kpi-val text-tanks">{{ renderedTanksCount() }}</span>
          </div>
        </div>
      </div>

      <!-- Floating 3D Control Panel (Bottom Left) -->
      <div class="glass-panel floating-control-menu">
        <div class="menu-header">
          <h3 class="menu-title">Digital Twin Controls</h3>
        </div>
        
        <div class="settings-section">
          <label class="control-label">Tree Health Filter</label>
          <select class="custom-select" [(ngModel)]="healthFilter" (change)="onFilterChange()">
            <option value="ALL">All Trees</option>
            <option value="HEALTHY">Healthy Only</option>
            <option value="STRESSED">Stressed Only</option>
            <option value="DISEASED">Diseased Only</option>
            <option value="DEAD">Dead Only</option>
          </select>
        </div>

        <div class="divider"></div>

        <div class="layer-list">
          <label class="layer-item">
            <input type="checkbox" [(ngModel)]="layers.farms" (change)="toggleLayerVisibility('farms')">
            <span class="custom-checkbox"><mat-icon *ngIf="layers.farms">check</mat-icon></span>
            <span class="layer-name">Farm Boundary</span>
          </label>
          <label class="layer-item">
            <input type="checkbox" [(ngModel)]="layers.trees" (change)="toggleLayerVisibility('trees')">
            <span class="custom-checkbox"><mat-icon *ngIf="layers.trees">check</mat-icon></span>
            <span class="layer-name">Trees (3D Cones)</span>
          </label>
          <label class="layer-item">
            <input type="checkbox" [(ngModel)]="layers.pipelines" (change)="toggleLayerVisibility('pipelines')">
            <span class="custom-checkbox"><mat-icon *ngIf="layers.pipelines">check</mat-icon></span>
            <span class="layer-name">Pipelines (3D Tubes)</span>
          </label>
          <label class="layer-item">
            <input type="checkbox" [(ngModel)]="layers.valves" (change)="toggleLayerVisibility('valves')">
            <span class="custom-checkbox"><mat-icon *ngIf="layers.valves">check</mat-icon></span>
            <span class="layer-name">Valves</span>
          </label>
          <label class="layer-item">
            <input type="checkbox" [(ngModel)]="layers.pumps" (change)="toggleLayerVisibility('pumps')">
            <span class="custom-checkbox"><mat-icon *ngIf="layers.pumps">check</mat-icon></span>
            <span class="layer-name">Pumps</span>
          </label>
          <label class="layer-item">
            <input type="checkbox" [(ngModel)]="layers.tanks" (change)="toggleLayerVisibility('tanks')">
            <span class="custom-checkbox"><mat-icon *ngIf="layers.tanks">check</mat-icon></span>
            <span class="layer-name">Water Tanks</span>
          </label>
        </div>
      </div>

      <!-- Floating Navigation Toolbar (Bottom Right) -->
      <div class="floating-toolbar glass-panel">
        <button class="tool-btn" (click)="setCameraView('orbit')" matTooltip="Orbit View">
          <mat-icon>hourglass_empty</mat-icon>
        </button>
        <div class="toolbar-divider"></div>
        <button class="tool-btn" (click)="setCameraView('top')" matTooltip="Top-Down View">
          <mat-icon>vertical_align_bottom</mat-icon>
        </button>
        <div class="toolbar-divider"></div>
        <button class="tool-btn" (click)="resetCamera()" matTooltip="Reset View">
          <mat-icon>refresh</mat-icon>
        </button>
      </div>

      <!-- Floating 3D Inspector Card (Right overlay panel) -->
      <div class="glass-panel floating-inspector-card" *ngIf="selectedAsset() as asset">
        <div class="inspector-header">
          <div class="title-row">
            <div class="badge-wrapper">
              <span class="health-badge" [ngClass]="(asset.healthStatus || asset.status || 'healthy').toLowerCase().split(' ')[0]">
                {{ asset.healthStatus || asset.status || 'HEALTHY' }}
              </span>
            </div>
            <h3 class="inspector-title">{{ asset.name }}</h3>
          </div>
          <button class="icon-btn close-btn" (click)="closeInspector()">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <div class="inspector-body">
          <p class="asset-type-label">3D DIGITAL TWIN ASSET: {{ asset.type }}</p>
          <div class="spec-grid">
            <div class="spec-cell" *ngIf="asset.species || asset.typeSpec || asset.material">
              <span class="spec-label">Type / Spec</span>
              <span class="spec-value">{{ asset.species || asset.typeSpec || asset.material }}</span>
            </div>
            <div class="spec-cell" *ngIf="asset.age || asset.diameter">
              <span class="spec-label">Metric 1</span>
              <span class="spec-value">{{ asset.age || asset.diameter }}</span>
            </div>
            <div class="spec-cell" *ngIf="asset.yield || asset.length || asset.capacity">
              <span class="spec-label">Metric 2</span>
              <span class="spec-value">{{ asset.yield || asset.length || asset.capacity }}</span>
            </div>
            <div class="spec-cell" *ngIf="asset.notes || asset.zone">
              <span class="spec-label">Info</span>
              <span class="spec-value">{{ asset.notes || asset.zone || 'None' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .twin-workspace {
      position: relative;
      width: 100%;
      height: calc(100vh - 112px); /* Adjusted to fit the layout screen perfectly */
      overflow: hidden;
      background: #03060c;
    }

    .canvas-container {
      width: 100%;
      height: 100%;
      cursor: grab;
    }

    .canvas-container:active {
      cursor: grabbing;
    }

    /* Floating Header / KPIs */
    .floating-header {
      position: absolute;
      top: 20px;
      left: 20px;
      z-index: 5;
    }

    .kpi-group {
      display: flex;
      align-items: center;
      padding: 10px 20px;
      gap: 16px;
      border-radius: 100px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(12, 20, 36, 0.6) !important;
      backdrop-filter: blur(16px);
    }

    .kpi-item {
      display: flex;
      align-items: baseline;
      gap: 8px;
    }

    .kpi-label {
      font-family: var(--font-secondary);
      font-size: 11px;
      color: var(--color-fg-subtle);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .kpi-val {
      font-family: var(--font-primary);
      font-size: 16px;
      font-weight: 700;
    }

    .kpi-divider {
      width: 1px;
      height: 20px;
      background: rgba(255, 255, 255, 0.1);
    }

    .text-primary { color: var(--color-primary); }
    .text-trees { color: #10b981; }
    .text-pipelines { color: #0ea5e9; }
    .text-pumps { color: #ec4899; }
    .text-valves { color: #f59e0b; }
    .text-tanks { color: #94a3b8; }

    /* Bottom Control Panel */
    .floating-control-menu {
      position: absolute;
      bottom: 20px;
      left: 20px;
      width: 260px;
      padding: 16px;
      z-index: 5;
      border: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(12, 20, 36, 0.6) !important;
      backdrop-filter: blur(16px);
      border-radius: 16px;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5);
    }

    .menu-title {
      font-family: var(--font-primary);
      font-size: 13px;
      font-weight: 700;
      color: var(--color-fg);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0 0 12px 0;
    }

    .settings-section {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 12px;
    }

    .control-label {
      font-size: 11px;
      font-weight: 600;
      color: var(--color-fg-subtle);
      text-transform: uppercase;
    }

    .custom-select {
      background: rgba(6, 9, 19, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      color: var(--color-fg);
      padding: 6px 10px;
      font-size: 13px;
      outline: none;
    }

    .divider {
      height: 1px;
      background: rgba(255, 255, 255, 0.08);
      margin: 12px 0;
    }

    .layer-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .layer-item {
      display: flex;
      align-items: center;
      cursor: pointer;
    }

    .layer-item input {
      display: none;
    }

    .custom-checkbox {
      width: 16px;
      height: 16px;
      border-radius: 4px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      display: flex;
      justify-content: center;
      align-items: center;
      margin-right: 10px;
      background: rgba(0, 0, 0, 0.2);
    }

    .custom-checkbox mat-icon {
      font-size: 12px;
      width: 12px;
      height: 12px;
      color: #03060c;
    }

    .layer-item input:checked + .custom-checkbox {
      background: var(--color-primary);
      border-color: var(--color-primary);
    }

    .layer-item input:checked + .custom-checkbox mat-icon {
      color: #ffffff;
      font-weight: bold;
    }

    .layer-name {
      font-size: 12.5px;
      color: var(--color-fg);
    }

    /* Floating Toolbar */
    .floating-toolbar {
      position: absolute;
      bottom: 20px;
      right: 20px;
      display: flex;
      align-items: center;
      padding: 6px;
      gap: 4px;
      border-radius: 100px;
      z-index: 5;
      border: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(12, 20, 36, 0.6) !important;
      backdrop-filter: blur(16px);
    }

    .tool-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: transparent;
      border: none;
      color: var(--color-fg-subtle);
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      transition: all 0.2s ease;
      outline: none;
    }

    .tool-btn:hover {
      background: rgba(255, 255, 255, 0.08);
      color: var(--color-fg);
    }

    .tool-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .toolbar-divider {
      width: 1px;
      height: 20px;
      background: rgba(255, 255, 255, 0.1);
      margin: 0 4px;
    }

    /* Floating Inspector */
    .floating-inspector-card {
      position: absolute;
      top: 20px;
      right: 20px;
      bottom: 20px;
      width: 340px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      z-index: 6;
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(12, 20, 36, 0.65) !important;
      backdrop-filter: blur(24px);
      box-shadow: -10px 0 30px rgba(0, 0, 0, 0.4);
    }

    .inspector-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
    }

    .title-row {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .inspector-title {
      font-size: 18px;
      font-weight: 700;
      color: var(--color-fg);
      margin: 0;
    }

    .badge-wrapper {
      display: flex;
    }

    .health-badge {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 2px 8px;
      border-radius: 99px;
      letter-spacing: 0.5px;
    }

    .health-badge.healthy { background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); }
    .health-badge.stressed { background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.2); }
    .health-badge.diseased { background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); }
    .health-badge.dead { background: rgba(113, 113, 122, 0.15); color: #71717a; border: 1px solid rgba(113, 113, 122, 0.2); }
    
    .health-badge.operational { background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); }
    .health-badge.active { background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); }
    .health-badge.inactive { background: rgba(113, 113, 122, 0.15); color: #71717a; border: 1px solid rgba(113, 113, 122, 0.2); }
    .health-badge.maintenance { background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.2); }
    .health-badge.damaged { background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); }

    .icon-btn {
      background: transparent;
      border: none;
      color: var(--color-fg-subtle);
      cursor: pointer;
      padding: 4px;
      border-radius: 6px;
      display: flex;
    }

    .icon-btn:hover {
      background: rgba(255, 255, 255, 0.08);
      color: var(--color-fg);
    }

    .icon-btn mat-icon { font-size: 16px; width: 16px; height: 16px; }

    .inspector-body {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .asset-type-label {
      font-size: 10px;
      font-weight: 700;
      color: var(--color-fg-subtle);
      letter-spacing: 0.5px;
      margin: 0;
    }

    .spec-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 10px;
      padding: 12px;
    }

    .spec-cell {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .spec-label {
      font-size: 9px;
      color: var(--color-fg-subtle);
      text-transform: uppercase;
      font-weight: 700;
    }

    .spec-value {
      font-size: 12.5px;
      color: var(--color-fg);
      font-weight: 500;
    }
  `]
})
export class Twin3dComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('canvasContainer', { static: true }) canvasContainer!: ElementRef<HTMLDivElement>;

  // Services
  private readonly farmService = inject(FarmService);
  private readonly treeService = inject(TreeService);
  private readonly pipelineService = inject(PipelineService);
  private readonly valveService = inject(ValveService);
  private readonly pumpService = inject(PumpService);
  private readonly tankService = inject(TankService);

  // Three.js instances
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private raycaster!: THREE.Raycaster;
  private mouseVector = new THREE.Vector2();

  // Three.js groups for toggling visibility
  private farmGroup = new THREE.Group();
  private treeGroup = new THREE.Group();
  private pipelineGroup = new THREE.Group();
  private valveGroup = new THREE.Group();
  private pumpGroup = new THREE.Group();
  private tankGroup = new THREE.Group();

  // Coordinate projection center (average coordinate of plantation)
  private centerLat = 11.0168;
  private centerLng = 76.9558;
  private LAT_TO_METERS = 111320;
  private LNG_TO_METERS = 111320 * Math.cos(11.0168 * Math.PI / 180);

  // Render arrays/data
  private allTreeMeshes: THREE.Object3D[] = [];
  private interactiveObjects: THREE.Object3D[] = [];
  private hoveredObject: THREE.Mesh | null = null;
  private hoveredOriginalColor = new THREE.Color();

  // Signals
  readonly selectedAsset = signal<any | null>(null);
  readonly renderedTreesCount = signal(0);
  readonly renderedPipesCount = signal(0);
  readonly renderedPumpsCount = signal(0);
  readonly renderedValvesCount = signal(0);
  readonly renderedTanksCount = signal(0);

  private placedPoints: Array<{ x: number, z: number, label: string }> = [];

  // Animation tracking
  private activePipelineMaterials: THREE.MeshStandardMaterial[] = [];
  private waterVolumeMeshes: Array<{ mesh: THREE.Mesh, maxHeight: number }> = [];
  private statusGlowMaterials: THREE.MeshStandardMaterial[] = [];
  private clock = new THREE.Clock();

  // Inputs/Bindings
  healthFilter = 'ALL';
  layers = {
    farms: true,
    trees: true,
    pipelines: true,
    valves: true,
    pumps: true,
    tanks: true
  };

  // Event handlers
  private onWindowResizeBound = this.onWindowResize.bind(this);
  private onMouseMoveBound = this.onMouseMove.bind(this);
  private onClickBound = this.onClick.bind(this);

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.initThree();
    this.loadData();
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.onWindowResizeBound);
    const container = this.canvasContainer.nativeElement;
    container.removeEventListener('mousemove', this.onMouseMoveBound);
    container.removeEventListener('click', this.onClickBound);

    if (this.controls) {
      this.controls.dispose();
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
  }

  private initThree(): void {
    const container = this.canvasContainer.nativeElement;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    // 1. Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#bae6fd'); // Daylight sky blue
    this.scene.fog = new THREE.FogExp2('#bae6fd', 0.008); // Daylight fog

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    this.camera.position.set(40, 35, 45);

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap; // Fixed deprecation warning
    container.appendChild(this.renderer.domElement);

    // 4. Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.05; // don't go below ground
    this.controls.minDistance = 5;
    this.controls.maxDistance = 150;

    // 5. Lighting (Daylight)
    const ambientLight = new THREE.AmbientLight('#ffffff', 0.65); // Bright ambient
    this.scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight('#bae6fd', '#dcfce7', 0.45); // Sky / Ground hemilight
    hemiLight.position.set(0, 50, 0);
    this.scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight('#fffbeb', 1.05); // Warm sunlight
    dirLight.position.set(30, 80, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 180;
    const d = 60;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0005;
    this.scene.add(dirLight);

    // 6. Ground grid & plane (Lush green farm ground)
    const gridHelper = new THREE.GridHelper(200, 50, '#3ebb65', '#a7f3d0'); // Subtle blending green grid
    gridHelper.position.y = 0.005; // Slightly above ground to avoid z-fighting
    // Set subtle opacity for grid helper
    if (gridHelper.material instanceof THREE.Material) {
      gridHelper.material.transparent = true;
      gridHelper.material.opacity = 0.25;
    }
    this.scene.add(gridHelper);

    const groundGeo = new THREE.PlaneGeometry(400, 400);
    const groundMat = new THREE.MeshStandardMaterial({
      color: '#4fa86c', // Realistic grass green
      roughness: 0.9,
      metalness: 0.05
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Add groups to scene
    this.scene.add(this.farmGroup);
    this.scene.add(this.treeGroup);
    this.scene.add(this.pipelineGroup);
    this.scene.add(this.valveGroup);
    this.scene.add(this.pumpGroup);
    this.scene.add(this.tankGroup);

    // 7. Raycasting Setup
    this.raycaster = new THREE.Raycaster();

    // 8. Event listeners
    window.addEventListener('resize', this.onWindowResizeBound);
    container.addEventListener('mousemove', this.onMouseMoveBound);
    container.addEventListener('click', this.onClickBound);

    // 9. Start loop
    const animate = () => {
      requestAnimationFrame(animate);
      this.controls.update();

      // Advanced Visual Animations
      const elapsed = this.clock.getElapsedTime();

      // A. Pulse active pipeline glowing effect
      this.activePipelineMaterials.forEach(mat => {
        // Pulse cyan emissive intensity between 0.2 and 0.8
        mat.emissiveIntensity = 0.4 + 0.3 * Math.sin(elapsed * 4.0);
      });

      // B. Oscillate water levels in tanks (slow wave)
      this.waterVolumeMeshes.forEach(w => {
        // Slowly change scale.y of water cylinder
        const scaleFactor = 0.75 + 0.15 * Math.sin(elapsed * 0.8);
        w.mesh.scale.set(1.0, scaleFactor, 1.0);
        // Correct position.y since scale shrinks from center
        w.mesh.position.y = 0.2 + (w.maxHeight * scaleFactor / 2);
      });

      // C. Pulse status neon glow lights
      this.statusGlowMaterials.forEach(mat => {
        mat.emissiveIntensity = 0.6 + 0.4 * Math.sin(elapsed * 5.0);
      });

      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }

  private getPlacedPosition(lat: number, lng: number, label: string): { x: number, z: number } {
    let x = (lng - this.centerLng) * this.LNG_TO_METERS;
    let z = -(lat - this.centerLat) * this.LAT_TO_METERS;

    // Shift check to prevent overlapping on nearly identical points
    let attempts = 0;
    let collision = true;
    const minDistance = 2.2; // meters

    while (collision && attempts < 8) {
      collision = false;
      for (const p of this.placedPoints) {
        const dx = x - p.x;
        const dz = z - p.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < minDistance) {
          collision = true;
          // Displace in spiral orbit
          const angle = (attempts * Math.PI / 4) + (label === 'Pump' ? 0 : Math.PI / 2);
          x = p.x + minDistance * Math.cos(angle);
          z = p.z + minDistance * Math.sin(angle);
          break;
        }
      }
      attempts++;
    }

    this.placedPoints.push({ x, z, label });
    return { x, z };
  }

  private loadData(): void {
    forkJoin({
      farms: this.farmService.getAllFarms(),
      trees: this.treeService.getAllTrees(),
      pipelines: this.pipelineService.getAllPipelines(),
      valves: this.valveService.getAllValves(),
      pumps: this.pumpService.getAllPumps(),
      tanks: this.tankService.getAllTanks()
    }).subscribe({
      next: (data) => {
        // Clear old meshes
        this.clearGroup(this.farmGroup);
        this.clearGroup(this.treeGroup);
        this.clearGroup(this.pipelineGroup);
        this.clearGroup(this.valveGroup);
        this.clearGroup(this.pumpGroup);
        this.clearGroup(this.tankGroup);
        this.allTreeMeshes = [];
        this.interactiveObjects = [];
        this.placedPoints = []; // Reset point registry
        this.activePipelineMaterials = [];
        this.waterVolumeMeshes = [];
        this.statusGlowMaterials = [];

        // 0. Set coordinate center based on first farm center if available
        if (data.farms.length > 0 && data.farms[0].boundary) {
          const coords = this.getPolygonCoords(data.farms[0].boundary);
          if (coords.length > 0) {
            this.centerLat = coords[0][1];
            this.centerLng = coords[0][0];
            this.LNG_TO_METERS = 111320 * Math.cos(this.centerLat * Math.PI / 180);
          }
        }

        // 1. Render Farms (Semi-transparent polygons / lines)
        data.farms.forEach(farm => {
          if (!farm.boundary) return;
          const coords = this.getPolygonCoords(farm.boundary);
          if (coords.length === 0) return;

          const points: THREE.Vector3[] = [];
          const shape = new THREE.Shape();

          coords.forEach((coord, index) => {
            const x = (coord[0] - this.centerLng) * this.LNG_TO_METERS;
            const z = -(coord[1] - this.centerLat) * this.LAT_TO_METERS;
            points.push(new THREE.Vector3(x, 0.05, z));

            if (index === 0) {
              shape.moveTo(x, -z);
            } else {
              shape.lineTo(x, -z);
            }
          });

          // Draw boundary outline
          const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
          const lineMat = new THREE.LineBasicMaterial({ color: '#3b82f6', linewidth: 2 });
          const boundaryLine = new THREE.LineLoop(lineGeo, lineMat);
          this.farmGroup.add(boundaryLine);

          // Draw boundary plane
          const shapeGeo = new THREE.ShapeGeometry(shape);
          const shapeMat = new THREE.MeshBasicMaterial({
            color: '#3b82f6',
            transparent: true,
            opacity: 0.08,
            side: THREE.DoubleSide
          });
          const boundaryMesh = new THREE.Mesh(shapeGeo, shapeMat);
          boundaryMesh.rotation.x = -Math.PI / 2;
          boundaryMesh.position.y = 0.02;
          this.farmGroup.add(boundaryMesh);
        });

        // 2. Render Trees (Procedural 3D Cones on Cylinders with spacing)
        data.trees.forEach(tree => {
          if (!tree.location || !tree.location.coordinates) return;
          const lat = tree.location.coordinates[1];
          const lng = tree.location.coordinates[0];

          const pos = this.getPlacedPosition(lat, lng, 'Tree');
          const x = pos.x;
          const z = pos.z;

          // Create Tree Group
          const treeObject = new THREE.Group();
          treeObject.position.set(x, 0, z);

          // Trunk
          const trunkGeo = new THREE.CylinderGeometry(0.12, 0.16, 0.9, 8);
          const trunkMat = new THREE.MeshStandardMaterial({ color: '#5c4033', roughness: 0.9 });
          const trunk = new THREE.Mesh(trunkGeo, trunkMat);
          trunk.position.y = 0.45;
          trunk.castShadow = true;
          trunk.receiveShadow = true;
          treeObject.add(trunk);

          // Multi-Tier foliage (organic Moringa tree style)
          let foliageColor = '#10b981'; // HEALTHY
          if (tree.healthStatus === 'STRESSED') foliageColor = '#f59e0b';
          if (tree.healthStatus === 'DISEASED') foliageColor = '#ef4444';
          if (tree.healthStatus === 'DEAD') foliageColor = '#555555';

          const foliageMat = new THREE.MeshStandardMaterial({ 
            color: foliageColor, 
            roughness: 0.7,
            metalness: 0.05
          });

          // Lower foliage tier (larger)
          const lowerFoliageGeo = new THREE.ConeGeometry(0.65, 1.3, 8);
          const lowerFoliage = new THREE.Mesh(lowerFoliageGeo, foliageMat);
          lowerFoliage.position.y = 1.3;
          lowerFoliage.castShadow = true;
          lowerFoliage.receiveShadow = true;
          
          lowerFoliage.userData = {
            type: 'Tree',
            name: `Tree #${tree.treeNumber}`,
            species: tree.species,
            age: `${tree.age} months`,
            healthStatus: tree.healthStatus,
            notes: tree.notes || 'No notes available.',
            originalColor: foliageColor
          };
          treeObject.add(lowerFoliage);

          // Upper foliage tier (smaller)
          const upperFoliageGeo = new THREE.ConeGeometry(0.45, 1.0, 8);
          const upperFoliage = new THREE.Mesh(upperFoliageGeo, foliageMat);
          upperFoliage.position.y = 2.1;
          upperFoliage.castShadow = true;
          upperFoliage.receiveShadow = true;

          upperFoliage.userData = {
            type: 'Tree',
            name: `Tree #${tree.treeNumber}`,
            species: tree.species,
            age: `${tree.age} months`,
            healthStatus: tree.healthStatus,
            notes: tree.notes || 'No notes available.',
            originalColor: foliageColor
          };
          treeObject.add(upperFoliage);

          this.treeGroup.add(treeObject);
          
          this.allTreeMeshes.push(lowerFoliage, upperFoliage);
          this.interactiveObjects.push(lowerFoliage, upperFoliage);
        });
        this.renderedTreesCount.set(data.trees.length);

        // 3. Render Pipelines (3D extruded Tubes with Support Posts)
        data.pipelines.forEach(pipe => {
          if (!pipe.geometry || !pipe.geometry.coordinates) return;
          const coords = pipe.geometry.coordinates;
          if (coords.length < 2) return;

          const points: THREE.Vector3[] = [];
          coords.forEach((c: any) => {
            const x = (c[0] - this.centerLng) * this.LNG_TO_METERS;
            const z = -(c[1] - this.centerLat) * this.LAT_TO_METERS;
            // Elevate pipeline above ground to look like it is on supports
            const pipeHeight = 0.35;
            points.push(new THREE.Vector3(x, pipeHeight, z));

            // Create support post (vertical cylinder)
            const postGeo = new THREE.CylinderGeometry(0.04, 0.05, pipeHeight, 8);
            const postMat = new THREE.MeshStandardMaterial({ color: '#475569', roughness: 0.7 });
            const postMesh = new THREE.Mesh(postGeo, postMat);
            postMesh.position.set(x, pipeHeight / 2, z);
            postMesh.castShadow = true;
            postMesh.receiveShadow = true;
            this.pipelineGroup.add(postMesh);
          });

          // Create straight polyline segments using CurvePath
          const curvePath = new THREE.CurvePath<THREE.Vector3>();
          for (let i = 0; i < points.length - 1; i++) {
            curvePath.add(new THREE.LineCurve3(points[i], points[i + 1]));
          }
          // 3D Tube geometry representing water pipeline along straight segments
          const tubeGeo = new THREE.TubeGeometry(curvePath, 64, 0.08, 8, false);
          
          let pipeColor = '#0ea5e9'; // Active/healthy pipe
          let isLeaking = false;
          if (pipe.status === 'MAINTENANCE') pipeColor = '#f59e0b';
          if (pipe.status === 'DAMAGED') {
            pipeColor = '#ef4444';
            isLeaking = true;
          }

          const tubeMat = new THREE.MeshStandardMaterial({
            color: pipeColor,
            roughness: 0.25,
            metalness: 0.85,
            emissive: isLeaking ? '#7f1d1d' : '#0284c7',
            emissiveIntensity: 0.4
          });

          if (pipe.status === 'ACTIVE') {
            this.activePipelineMaterials.push(tubeMat);
          }

          const pipelineMesh = new THREE.Mesh(tubeGeo, tubeMat);
          pipelineMesh.castShadow = true;
          pipelineMesh.receiveShadow = true;
          
          pipelineMesh.userData = {
            type: 'Pipeline',
            name: pipe.name,
            diameter: pipe.diameter ? `${pipe.diameter} mm` : 'N/A',
            material: pipe.material || 'N/A',
            length: pipe.length ? `${pipe.length.toFixed(1)} meters` : 'N/A',
            status: pipe.status,
            originalColor: pipeColor
          };

          this.pipelineGroup.add(pipelineMesh);
          this.interactiveObjects.push(pipelineMesh);
        });
        this.renderedPipesCount.set(data.pipelines.length);

        // 4. Render Pumps (Detailed 3D Pump Stations with spacing)
        data.pumps.forEach(pump => {
          if (!pump.geometry || !pump.geometry.coordinates) return;
          const lat = pump.geometry.coordinates[1];
          const lng = pump.geometry.coordinates[0];

          const pos = this.getPlacedPosition(lat, lng, 'Pump');
          const x = pos.x;
          const z = pos.z;

          const pumpObject = new THREE.Group();
          pumpObject.position.set(x, 0, z);

          // Concrete Foundation pad
          const padGeo = new THREE.BoxGeometry(1.4, 0.15, 1.4);
          const padMat = new THREE.MeshStandardMaterial({ color: '#64748b', roughness: 0.85 }); // grey pad
          const pad = new THREE.Mesh(padGeo, padMat);
          pad.position.y = 0.075;
          pad.receiveShadow = true;
          pumpObject.add(pad);

          // Motor cylinder (main pump motor - horizontal)
          const motorGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 12);
          
          let motorColor = '#10b981'; // OPERATIONAL / GREEN
          if (pump.status === 'MAINTENANCE') motorColor = '#f59e0b';
          if (pump.status === 'OFF') motorColor = '#71717a';

          const motorMat = new THREE.MeshStandardMaterial({
            color: motorColor,
            metalness: 0.8,
            roughness: 0.35
          });
          const motor = new THREE.Mesh(motorGeo, motorMat);
          motor.rotation.z = Math.PI / 2; // lie horizontal
          motor.position.set(-0.1, 0.45, 0);
          motor.castShadow = true;
          motor.receiveShadow = true;
          pumpObject.add(motor);

          // Impeller Volute housing (disc next to the motor)
          const voluteGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.2, 16);
          const voluteMat = new THREE.MeshStandardMaterial({ color: '#334155', metalness: 0.8, roughness: 0.4 });
          const volute = new THREE.Mesh(voluteGeo, voluteMat);
          volute.rotation.z = Math.PI / 2;
          volute.position.set(0.35, 0.45, 0);
          volute.castShadow = true;
          pumpObject.add(volute);

          // Outgoing Pipeline connections (L-shape pipes)
          // Pipe 1 (vertical from volute to base)
          const pipe1Geo = new THREE.CylinderGeometry(0.08, 0.08, 0.45, 8);
          const pipe1Mat = new THREE.MeshStandardMaterial({ color: '#475569', metalness: 0.9, roughness: 0.2 });
          const pipe1 = new THREE.Mesh(pipe1Geo, pipe1Mat);
          pipe1.position.set(0.35, 0.225, 0.2);
          pipe1.castShadow = true;
          pumpObject.add(pipe1);

          // Pipe 2 (horizontal bend)
          const pipe2Geo = new THREE.CylinderGeometry(0.08, 0.08, 0.4, 8);
          const pipe2 = new THREE.Mesh(pipe2Geo, pipe1Mat);
          pipe2.rotation.x = Math.PI / 2;
          pipe2.position.set(0.35, 0.45, 0.3);
          pipe2.castShadow = true;
          pumpObject.add(pipe2);

          // Status neon glow light on top
          let glowColor = '#10b981'; // Green for operational
          if (pump.status === 'MAINTENANCE') glowColor = '#eab308'; // Yellow
          if (pump.status === 'OFF') glowColor = '#ef4444'; // Red

          const glowGeo = new THREE.SphereGeometry(0.1, 12, 12);
          const glowMat = new THREE.MeshStandardMaterial({
            color: glowColor,
            emissive: glowColor,
            emissiveIntensity: 0.8,
            roughness: 0.1
          });
          const glowMesh = new THREE.Mesh(glowGeo, glowMat);
          glowMesh.position.set(0.35, 0.65, 0.3); // on top of volute/pipe bend
          pumpObject.add(glowMesh);
          
          this.statusGlowMaterials.push(glowMat);

          // Create an interactive hit box mesh that wraps the pump components for selection
          const hitBoxGeo = new THREE.BoxGeometry(1.2, 1.0, 1.2);
          const hitBoxMat = new THREE.MeshBasicMaterial({ visible: false }); // Invisible target
          const hitBox = new THREE.Mesh(hitBoxGeo, hitBoxMat);
          hitBox.position.y = 0.5;
          hitBox.userData = {
            type: 'Pump',
            name: pump.name,
            capacity: pump.capacity ? `${pump.capacity} L/hr` : 'N/A',
            power: pump.powerRating ? `${pump.powerRating} HP` : 'N/A',
            manufacturer: pump.manufacturer || 'N/A',
            status: pump.status,
            originalColor: motorColor
          };
          pumpObject.add(hitBox);

          this.pumpGroup.add(pumpObject);
          this.interactiveObjects.push(hitBox);
        });
        this.renderedPumpsCount.set(data.pumps.length);

        // 5. Render Valves (Detailed Solenoid Valves with handwheel)
        data.valves.forEach(valve => {
          if (!valve.geometry || !valve.geometry.coordinates) return;
          const lat = valve.geometry.coordinates[1];
          const lng = valve.geometry.coordinates[0];

          const pos = this.getPlacedPosition(lat, lng, 'Valve');
          const x = pos.x;
          const z = pos.z;

          const valveObject = new THREE.Group();
          valveObject.position.set(x, 0, z);

          // Valve body / conduit section (horizontal cylinder)
          const bodyGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.8, 12);
          const bodyMat = new THREE.MeshStandardMaterial({ color: '#475569', metalness: 0.8, roughness: 0.3 });
          const body = new THREE.Mesh(bodyGeo, bodyMat);
          body.rotation.z = Math.PI / 2;
          body.position.y = 0.35;
          body.castShadow = true;
          valveObject.add(body);

          // Valve bonnet (vertical cylinder stem)
          const stemGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.3, 12);
          const stem = new THREE.Mesh(stemGeo, bodyMat);
          stem.position.y = 0.55;
          stem.castShadow = true;
          valveObject.add(stem);

          // Valve handwheel (red ring Torus)
          let valveColor = '#ef4444'; // ACTIVE / OPEN -> Red wheel
          if (valve.status === 'CLOSED') valveColor = '#64748b'; // closed / greyed
          if (valve.status === 'DAMAGED') valveColor = '#7f1d1d'; // damaged

          const wheelGeo = new THREE.TorusGeometry(0.2, 0.05, 8, 16);
          const wheelMat = new THREE.MeshStandardMaterial({ color: valveColor, metalness: 0.4, roughness: 0.6 });
          const wheel = new THREE.Mesh(wheelGeo, wheelMat);
          wheel.rotation.x = Math.PI / 2; // Lie flat horizontally on top
          wheel.position.y = 0.7;
          wheel.castShadow = true;
          valveObject.add(wheel);

          // Status neon glow light on top of handwheel
          let glowColor = '#10b981'; // Green for active
          if (valve.status === 'CLOSED') glowColor = '#eab308'; // Yellow for closed
          if (valve.status === 'DAMAGED') glowColor = '#ef4444'; // Red for damaged

          const glowGeo = new THREE.SphereGeometry(0.06, 12, 12);
          const glowMat = new THREE.MeshStandardMaterial({
            color: glowColor,
            emissive: glowColor,
            emissiveIntensity: 0.8,
            roughness: 0.1
          });
          const glowMesh = new THREE.Mesh(glowGeo, glowMat);
          glowMesh.position.set(0, 0.8, 0); // on top of handwheel
          valveObject.add(glowMesh);

          this.statusGlowMaterials.push(glowMat);

          // Interactive hitbox
          const hitGeo = new THREE.BoxGeometry(0.6, 0.9, 0.6);
          const hitMat = new THREE.MeshBasicMaterial({ visible: false });
          const hitMesh = new THREE.Mesh(hitGeo, hitMat);
          hitMesh.position.y = 0.45;
          hitMesh.userData = {
            type: 'Valve',
            name: valve.valveNumber ? `Solenoid Valve ${valve.valveNumber}` : `Solenoid Valve #${valve.id}`,
            typeSpec: valve.type || 'Solenoid Valve',
            zone: valve.zone || 'N/A',
            status: valve.status,
            originalColor: valveColor
          };
          valveObject.add(hitMesh);

          this.valveGroup.add(valveObject);
          this.interactiveObjects.push(hitMesh);
        });

        // 6. Render Tanks (Detailed 3D Water Tanks with dome roof & ladder)
        data.tanks.forEach(tank => {
          if (!tank.geometry || !tank.geometry.coordinates) return;
          const lat = tank.geometry.coordinates[1];
          const lng = tank.geometry.coordinates[0];

          const pos = this.getPlacedPosition(lat, lng, 'Tank');
          const x = pos.x;
          const z = pos.z;

          const tankObject = new THREE.Group();
          tankObject.position.set(x, 0, z);

          const tankHeight = tank.height || 3.5;
          const tankRadius = 1.1;

          // 1. Concrete Base foundation pad
          const baseGeo = new THREE.CylinderGeometry(tankRadius + 0.15, tankRadius + 0.15, 0.2, 16);
          const baseMat = new THREE.MeshStandardMaterial({ color: '#64748b', roughness: 0.9 });
          const baseMesh = new THREE.Mesh(baseGeo, baseMat);
          baseMesh.position.y = 0.1;
          baseMesh.receiveShadow = true;
          tankObject.add(baseMesh);

          // 2. Tank Main Cylindrical body (Semi-transparent glass/steel shell)
          const bodyGeo = new THREE.CylinderGeometry(tankRadius, tankRadius, tankHeight, 24);
          let tankColor = '#38bdf8'; // Sleek light blue / metallic shell
          if (tank.status === 'MAINTENANCE') tankColor = '#d97706';

          const bodyMat = new THREE.MeshStandardMaterial({
            color: tankColor,
            roughness: 0.15,
            metalness: 0.85,
            transparent: true,
            opacity: 0.45 // Semi-transparent glass shell
          });
          const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
          bodyMesh.position.y = 0.2 + (tankHeight / 2);
          bodyMesh.castShadow = true;
          bodyMesh.receiveShadow = true;
          tankObject.add(bodyMesh);

          // 2.5 Inner Water Volume (Solid blue cylinder representing active water level)
          const waterMaxHeight = tankHeight * 0.95; // Fill up to 95% max
          const waterGeo = new THREE.CylinderGeometry(tankRadius - 0.05, tankRadius - 0.05, waterMaxHeight, 20);
          const waterMat = new THREE.MeshStandardMaterial({
            color: '#0284c7', // deep blue water
            roughness: 0.1,
            metalness: 0.1,
            transparent: true,
            opacity: 0.8
          });
          const waterMesh = new THREE.Mesh(waterGeo, waterMat);
          waterMesh.position.y = 0.2 + (waterMaxHeight / 2);
          waterMesh.castShadow = true;
          tankObject.add(waterMesh);

          // Register for water level animation
          this.waterVolumeMeshes.push({ mesh: waterMesh, maxHeight: waterMaxHeight });

          // 3. Conical Roof cap
          const roofHeight = 0.5;
          const roofGeo = new THREE.ConeGeometry(tankRadius + 0.05, roofHeight, 24);
          const roofMat = new THREE.MeshStandardMaterial({ color: '#1e293b', metalness: 0.8, roughness: 0.4 });
          const roofMesh = new THREE.Mesh(roofGeo, roofMat);
          roofMesh.position.y = 0.2 + tankHeight + (roofHeight / 2);
          roofMesh.castShadow = true;
          tankObject.add(roofMesh);

          // 4. Structural reinforcing bands (3 torus rings around body)
          const bandMat = new THREE.MeshStandardMaterial({ color: '#0f172a', metalness: 0.9, roughness: 0.2 });
          const bandRadius = tankRadius + 0.02;
          for (let i = 1; i <= 3; i++) {
            const bandGeo = new THREE.TorusGeometry(bandRadius, 0.025, 6, 24);
            const bandMesh = new THREE.Mesh(bandGeo, bandMat);
            bandMesh.rotation.x = Math.PI / 2;
            bandMesh.position.y = 0.2 + (tankHeight * (i / 4));
            tankObject.add(bandMesh);
          }

          // 5. Vertical Ladder on side (2 vertical rails + 5 rungs)
          const ladderGroup = new THREE.Group();
          ladderGroup.position.set(0, 0.2, bandRadius + 0.06); // Offset in front of tank

          const railGeo = new THREE.CylinderGeometry(0.015, 0.015, tankHeight, 8);
          const railMat = new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.5 });
          
          const leftRail = new THREE.Mesh(railGeo, railMat);
          leftRail.position.set(-0.15, tankHeight / 2, 0);
          ladderGroup.add(leftRail);

          const rightRail = new THREE.Mesh(railGeo, railMat);
          rightRail.position.set(0.15, tankHeight / 2, 0);
          ladderGroup.add(rightRail);

          // Rungs
          const rungGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.3, 8);
          for (let r = 0; r < 7; r++) {
            const rungMesh = new THREE.Mesh(rungGeo, railMat);
            rungMesh.rotation.z = Math.PI / 2;
            rungMesh.position.set(0, (tankHeight / 8) * (r + 1), 0);
            ladderGroup.add(rungMesh);
          }
          tankObject.add(ladderGroup);

          // Wrap hit box for selection
          const hitBoxGeo = new THREE.BoxGeometry(tankRadius * 2.2, tankHeight + roofHeight + 0.2, tankRadius * 2.2);
          const hitBoxMat = new THREE.MeshBasicMaterial({ visible: false });
          const hitBox = new THREE.Mesh(hitBoxGeo, hitBoxMat);
          hitBox.position.y = (tankHeight + roofHeight + 0.2) / 2;
          hitBox.userData = {
            type: 'Water Tank',
            name: tank.name,
            capacity: tank.capacity ? `${tank.capacity} Liters` : 'N/A',
            material: tank.material || 'Plastic / Poly',
            height: `${tankHeight} meters`,
            status: tank.status,
            originalColor: tankColor
          };
          tankObject.add(hitBox);

          this.tankGroup.add(tankObject);
          this.interactiveObjects.push(hitBox);
        });

        this.renderedValvesCount.set(data.valves.length);
        this.renderedTanksCount.set(data.tanks.length);

        // Auto center OrbitControls Target to the average coordinate bounding box
        this.centerOrbitOnAssets();
      },
      error: (err) => {
        console.error('Failed to load GIS data for 3D view:', err);
      }
    });
  }

  private centerOrbitOnAssets(): void {
    if (this.placedPoints.length === 0) return;

    let sumX = 0;
    let sumZ = 0;
    this.placedPoints.forEach(p => {
      sumX += p.x;
      sumZ += p.z;
    });

    const avgX = sumX / this.placedPoints.length;
    const avgZ = sumZ / this.placedPoints.length;
    this.controls.target.set(avgX, 0, avgZ);
    this.camera.position.set(avgX + 35, 30, avgZ + 35);
    this.controls.update();
  }

  // Camera presets
  setCameraView(mode: 'top' | 'orbit'): void {
    const target = this.controls.target;
    if (mode === 'top') {
      this.camera.position.set(target.x, 80, target.z);
    } else if (mode === 'orbit') {
      this.camera.position.set(target.x + 35, 25, target.z + 35);
    }
    this.controls.update();
  }

  resetCamera(): void {
    this.controls.target.set(0, 0, 0);
    this.camera.position.set(40, 35, 45);
    this.controls.update();
  }

  // Toggling 3D Layers
  toggleLayerVisibility(layerKey: keyof typeof this.layers): void {
    const isVisible = this.layers[layerKey];
    let threeGroup: THREE.Group | null = null;

    switch (layerKey) {
      case 'farms': threeGroup = this.farmGroup; break;
      case 'trees': threeGroup = this.treeGroup; break;
      case 'pipelines': threeGroup = this.pipelineGroup; break;
      case 'valves': threeGroup = this.valveGroup; break;
      case 'pumps': threeGroup = this.pumpGroup; break;
      case 'tanks': threeGroup = this.tankGroup; break;
    }

    if (threeGroup) {
      threeGroup.visible = isVisible;
    }
  }

  // Filter tree health
  onFilterChange(): void {
    this.allTreeMeshes.forEach(mesh => {
      const parent = mesh.parent;
      if (!parent) return;

      if (this.healthFilter === 'ALL') {
        parent.visible = true;
      } else {
        const matches = mesh.userData['healthStatus'] === this.healthFilter;
        parent.visible = matches;
      }
    });
  }

  // Raycaster hover check
  private onMouseMove(event: MouseEvent): void {
    const container = this.canvasContainer.nativeElement;
    const rect = container.getBoundingClientRect();
    
    this.mouseVector.x = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1;
    this.mouseVector.y = -((event.clientY - rect.top) / container.clientHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouseVector, this.camera);
    
    // Filter active interactive objects that are visible
    const visibleObjects = this.interactiveObjects.filter(obj => {
      // Traverse up to find root group visibility
      let visible = true;
      let current: THREE.Object3D | null = obj;
      while (current) {
        if (!current.visible) {
          visible = false;
          break;
        }
        current = current.parent;
      }
      return visible;
    });

    const intersects = this.raycaster.intersectObjects(visibleObjects);

    if (intersects.length > 0) {
      const hitObj = intersects[0].object as THREE.Mesh;
      if (this.hoveredObject !== hitObj) {
        // Restore previous hover color
        this.resetHoverState();

        // Save current and highlight new
        this.hoveredObject = hitObj;
        const mat = hitObj.material as THREE.MeshStandardMaterial;
        this.hoveredOriginalColor.copy(mat.color);
        mat.color.set('#38bdf8'); // light blue emission highlight
      }
    } else {
      this.resetHoverState();
    }
  }

  private resetHoverState(): void {
    if (this.hoveredObject) {
      const mat = this.hoveredObject.material as THREE.MeshStandardMaterial;
      mat.color.copy(this.hoveredOriginalColor);
      this.hoveredObject = null;
    }
  }

  // Raycaster click select
  private onClick(event: MouseEvent): void {
    if (this.hoveredObject) {
      this.selectedAsset.set(this.hoveredObject.userData);
    }
  }

  closeInspector(): void {
    this.selectedAsset.set(null);
  }

  // Helper parser
  private getPolygonCoords(geoJson: any): any[] {
    if (!geoJson || !geoJson.coordinates) return [];
    
    // GeoJSON Polygon coordinates are double nested array: [ [ [lng, lat], [lng, lat] ] ]
    if (geoJson.type === 'Polygon') {
      return geoJson.coordinates[0];
    }
    if (geoJson.type === 'MultiPolygon') {
      return geoJson.coordinates[0][0];
    }
    return [];
  }

  private clearGroup(group: THREE.Group): void {
    while (group.children.length > 0) {
      const obj = group.children[0];
      group.remove(obj);
    }
  }

  private onWindowResize(): void {
    const container = this.canvasContainer.nativeElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}
