import { Component, AfterViewInit, OnDestroy, signal, ElementRef, ViewChild, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import { forkJoin } from 'rxjs';

import { FarmService } from '../../services/farm.service';
import { TreeService } from '../../services/tree.service';
import { PipelineService } from '../../services/pipeline.service';
import { ValveService } from '../../services/valve.service';
import { PumpService } from '../../services/pump.service';
import { TankService } from '../../services/tank.service';
import { InfrastructureService } from '../../services/infrastructure.service';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatSelectModule,
    MatDividerModule,
    FormsModule
  ],
  template: `
    <div class="map-workspace">
      <!-- Full-bleed Map Canvas -->
      <div class="map-container-wrapper">
        <div #mapContainer class="leaflet-map-element"></div>
      </div>

      <!-- Floating Header / KPIs (Top Left) -->
      <div class="floating-header">
        <div class="glass-panel kpi-group">
          <div class="kpi-item">
            <span class="kpi-label">Total Trees</span>
            <span class="kpi-val text-primary">{{ kpiTrees() }}</span>
          </div>
          <div class="kpi-divider"></div>
          <div class="kpi-item">
            <span class="kpi-label">Active Valves</span>
            <span class="kpi-val text-accent">{{ kpiValves() }}</span>
          </div>
          <div class="kpi-divider"></div>
          <div class="kpi-item">
            <span class="kpi-label">Operational Pumps</span>
            <span class="kpi-val text-fg">{{ kpiPumps() }}</span>
          </div>
        </div>
      </div>

      <!-- Floating GIS Layer Checklist Panel (Bottom Left overlay) -->
      <div class="glass-panel floating-layer-menu" *ngIf="showLayerMenu()">
        <div class="menu-header">
          <h3 class="menu-title">Map Layers</h3>
          <button class="icon-btn" (click)="toggleLayerMenu()">
            <mat-icon>close</mat-icon>
          </button>
        </div>
        <div class="layer-list">
          <label class="layer-item">
            <input type="checkbox" [(ngModel)]="layers.farms" (change)="toggleLayer('farms')">
            <span class="custom-checkbox"><mat-icon *ngIf="layers.farms">check</mat-icon></span>
            <mat-icon class="layer-icon icon-farms">agriculture</mat-icon>
            <span class="layer-name">Farms</span>
          </label>
          <label class="layer-item">
            <input type="checkbox" [(ngModel)]="layers.trees" (change)="toggleLayer('trees')">
            <span class="custom-checkbox"><mat-icon *ngIf="layers.trees">check</mat-icon></span>
            <mat-icon class="layer-icon icon-trees">park</mat-icon>
            <span class="layer-name">Trees</span>
          </label>
          <label class="layer-item">
            <input type="checkbox" [(ngModel)]="layers.pipelines" (change)="toggleLayer('pipelines')">
            <span class="custom-checkbox"><mat-icon *ngIf="layers.pipelines">check</mat-icon></span>
            <mat-icon class="layer-icon icon-pipelines">water_damage</mat-icon>
            <span class="layer-name">Pipelines</span>
          </label>
          <label class="layer-item">
            <input type="checkbox" [(ngModel)]="layers.valves" (change)="toggleLayer('valves')">
            <span class="custom-checkbox"><mat-icon *ngIf="layers.valves">check</mat-icon></span>
            <mat-icon class="layer-icon icon-valves">adjust</mat-icon>
            <span class="layer-name">Valves</span>
          </label>
          <label class="layer-item">
            <input type="checkbox" [(ngModel)]="layers.pumps" (change)="toggleLayer('pumps')">
            <span class="custom-checkbox"><mat-icon *ngIf="layers.pumps">check</mat-icon></span>
            <mat-icon class="layer-icon icon-pumps">speed</mat-icon>
            <span class="layer-name">Pumps</span>
          </label>
        </div>
      </div>

      <!-- Floating Map Control Toolbar (Bottom Right) -->
      <div class="floating-toolbar glass-panel">
        <button class="tool-btn" (click)="zoomIn()" matTooltip="Zoom In">
          <mat-icon>add</mat-icon>
        </button>
        <div class="toolbar-divider"></div>
        <button class="tool-btn" (click)="zoomOut()" matTooltip="Zoom Out">
          <mat-icon>remove</mat-icon>
        </button>
        <div class="toolbar-divider"></div>
        <button class="tool-btn" [class.active]="showLayerMenu()" (click)="toggleLayerMenu()" matTooltip="Toggle Layers">
          <mat-icon>layers</mat-icon>
        </button>
        <div class="toolbar-divider"></div>
        <button class="tool-btn" (click)="recenterMap()" matTooltip="Recenter View">
          <mat-icon>gps_fixed</mat-icon>
        </button>
        <div class="toolbar-divider"></div>
        <button class="tool-btn" [class.active]="satelliteMode()" (click)="toggleBasemap()" matTooltip="Toggle Satellite">
          <mat-icon>satellite</mat-icon>
        </button>
      </div>

      <!-- Floating Inspector Card (Right overlay panel) -->
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
          <div class="spec-grid">
            <div class="spec-cell" *ngIf="asset.species || asset.typeSpec || asset.material">
              <span class="spec-label">Type / Spec</span>
              <span class="spec-value">{{ asset.species || asset.typeSpec || asset.material }}</span>
            </div>
            <div class="spec-cell" *ngIf="asset.age || asset.diameter">
              <span class="spec-label">Metric 1</span>
              <span class="spec-value">{{ asset.age || asset.diameter }}</span>
            </div>
            <div class="spec-cell" *ngIf="asset.yield || asset.length">
              <span class="spec-label">Metric 2</span>
              <span class="spec-value">{{ asset.yield || asset.length }}</span>
            </div>
            <div class="spec-cell" *ngIf="asset.owner || asset.zone">
              <span class="spec-label">Assignment</span>
              <span class="spec-value">{{ asset.owner || asset.zone }}</span>
            </div>
          </div>


        </div>

        <div class="inspector-actions">
          <button class="btn-secondary">View History</button>
          <button class="btn-primary">Create Task</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .map-workspace {
      position: relative;
      width: 100%;
      height: calc(100vh - 80px); /* adjusted for global layout */
      overflow: hidden;
      background: var(--color-bg);
    }

    .map-container-wrapper {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
    }

    .leaflet-map-element {
      width: 100%;
      height: 100%;
    }

    .glass-item {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 10px;
    }

    /* Top Left Header / KPIs */
    .floating-header {
      position: absolute;
      top: 24px;
      left: 24px;
      z-index: 5;
    }

    .kpi-group {
      display: flex;
      align-items: center;
      padding: 12px 24px;
      gap: 20px;
      border-radius: 100px; /* Pill shape */
    }

    .kpi-item {
      display: flex;
      align-items: baseline;
      gap: 10px;
    }

    .kpi-label {
      font-family: var(--font-secondary);
      font-size: 11.5px;
      color: var(--color-fg-muted);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .kpi-val {
      font-family: var(--font-primary);
      font-size: 18px;
      font-weight: 700;
    }

    .kpi-divider {
      width: 1px;
      height: 24px;
      background: var(--color-border-strong);
    }

    .text-primary { color: var(--color-primary); }
    .text-accent { color: var(--color-accent); }
    .text-fg { color: var(--color-fg); }

    /* Bottom Toolbar */
    .floating-toolbar {
      position: absolute;
      bottom: 24px;
      right: 24px;
      display: flex;
      align-items: center;
      padding: 6px;
      gap: 4px;
      border-radius: 100px; /* Pill shape */
      z-index: 5;
    }

    .tool-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: transparent;
      border: none;
      color: var(--color-fg-muted);
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      transition: var(--transition-fast);
      outline: none;
    }

    .tool-btn:hover {
      background: rgba(255, 255, 255, 0.08);
      color: var(--color-fg);
    }

    .tool-btn.active {
      background: var(--color-primary);
      color: var(--color-bg);
    }

    .tool-btn mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .toolbar-divider {
      width: 1px;
      height: 24px;
      background: var(--color-border-strong);
      margin: 0 4px;
    }

    /* Layer Menu */
    .floating-layer-menu {
      position: absolute;
      bottom: 84px;
      right: 24px;
      width: 240px;
      padding: 16px;
      z-index: 5;
    }

    .menu-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .menu-title {
      font-family: var(--font-primary);
      font-size: 13px;
      font-weight: 700;
      color: var(--color-fg);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0;
    }

    .icon-btn {
      background: transparent;
      border: none;
      color: var(--color-fg-muted);
      cursor: pointer;
      padding: 4px;
      border-radius: 6px;
      display: flex;
      justify-content: center;
      align-items: center;
      transition: var(--transition-fast);
    }
    .icon-btn:hover {
      background: rgba(255, 255, 255, 0.08);
      color: var(--color-fg);
    }
    .icon-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .layer-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .layer-item {
      display: flex;
      align-items: center;
      padding: 8px 10px;
      border-radius: 8px;
      cursor: pointer;
      transition: var(--transition-fast);
    }
    .layer-item:hover {
      background: rgba(255, 255, 255, 0.04);
    }

    .layer-item input {
      display: none;
    }

    .custom-checkbox {
      width: 16px;
      height: 16px;
      border-radius: 4px;
      border: 1px solid var(--color-border-strong);
      display: flex;
      justify-content: center;
      align-items: center;
      margin-right: 12px;
      transition: var(--transition-fast);
    }
    .custom-checkbox mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
      color: var(--color-bg);
    }
    .layer-item input:checked + .custom-checkbox {
      background: var(--color-primary);
      border-color: var(--color-primary);
    }

    .layer-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      margin-right: 8px;
    }

    .layer-name {
      font-family: var(--font-secondary);
      font-size: 13.5px;
      color: var(--color-fg);
    }

    .icon-farms { color: #3b82f6; }
    .icon-trees { color: var(--color-primary); }
    .icon-pipelines { color: var(--color-accent); }
    .icon-valves { color: var(--color-warning); }
    .icon-pumps { color: #a855f7; }

    /* Right Floating Inspector Panel */
    .floating-inspector-card {
      position: absolute;
      top: 24px;
      right: 24px;
      bottom: 24px;
      width: 360px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      z-index: 6;
      box-sizing: border-box;
    }

    .inspector-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }

    .title-row {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .inspector-title {
      font-family: var(--font-primary);
      font-size: 22px;
      font-weight: 700;
      color: var(--color-fg);
      margin: 0;
      letter-spacing: -0.4px;
    }

    .badge-wrapper {
      display: flex;
    }

    .inspector-body {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 24px;
      padding-right: 8px;
    }

    /* Custom Scrollbar for Inspector */
    .inspector-body::-webkit-scrollbar { width: 4px; }
    .inspector-body::-webkit-scrollbar-track { background: transparent; }
    .inspector-body::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 4px; }
    .inspector-body::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }

    /* Spec Grid */
    .spec-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--color-border-strong);
      border-radius: 12px;
      padding: 16px;
    }

    .spec-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .spec-label {
      font-family: var(--font-secondary);
      font-size: 11px;
      color: var(--color-fg-subtle);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 600;
    }

    .spec-value {
      font-family: var(--font-secondary);
      font-size: 13.5px;
      color: var(--color-fg);
      font-weight: 500;
    }

    /* Associated Infrastructure Section */
    .associated-infra-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .section-subtitle {
      font-family: var(--font-secondary);
      font-size: 11px;
      font-weight: 600;
      color: var(--color-fg-subtle);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0;
    }

    .infra-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .infra-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 12px;
    }

    .infra-icon {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .infra-icon mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .infra-icon.pipeline {
      background: rgba(6, 182, 212, 0.1);
      color: var(--color-accent);
    }

    .infra-icon.pump {
      background: rgba(168, 85, 247, 0.1);
      color: #a855f7;
    }

    .infra-details {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .infra-name {
      font-family: var(--font-primary);
      font-size: 13px;
      font-weight: 600;
      color: var(--color-fg);
    }

    .infra-sub {
      font-family: var(--font-secondary);
      font-size: 12px;
      color: var(--color-fg-subtle);
    }

    /* Inspector Actions */
    .inspector-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid var(--color-border-strong);
    }

    .btn-secondary, .btn-primary {
      height: 40px;
      border-radius: 8px;
      font-family: var(--font-secondary);
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
      transition: var(--transition-fast);
      outline: none;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .btn-secondary {
      background: transparent;
      border: 1px solid var(--color-border-strong);
      color: var(--color-fg);
    }
    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.04);
    }

    .btn-primary {
      background: var(--color-primary);
      border: none;
      color: var(--color-bg);
    }
    .btn-primary:hover {
      background: var(--color-primary-hover);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
    }
  `]
})
export class MapComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  private map!: L.Map;
  private streetLayer!: L.TileLayer;
  private satelliteLayer!: L.TileLayer;

  // Inject services
  private readonly farmService = inject(FarmService);
  private readonly treeService = inject(TreeService);
  private readonly pipelineService = inject(PipelineService);
  private readonly valveService = inject(ValveService);
  private readonly pumpService = inject(PumpService);
  private readonly tankService = inject(TankService);

  // Layer Groups
  private farmGroup = L.layerGroup();
  private treeGroup = L.layerGroup();
  private pipelineGroup = L.layerGroup();
  private valveGroup = L.layerGroup();
  private pumpGroup = L.layerGroup();

  // Signals
  readonly satelliteMode = signal(false);
  readonly selectedAsset = signal<any | null>(null);
  readonly showLayerMenu = signal(false);

  // KPIs Signals
  readonly kpiTrees = signal(0);
  readonly kpiValves = signal(0);
  readonly kpiPumps = signal(0);

  // Checkbox bindings
  layers = {
    farms: true,
    trees: true,
    pipelines: true,
    valves: true,
    pumps: true
  };

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    this.initMap();
    this.loadGISData();
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap(): void {
    const centerLatLng: L.LatLngExpression = [11.0168, 76.9558];

    this.map = L.map(this.mapContainer.nativeElement, {
      center: centerLatLng,
      zoom: 16,
      zoomControl: false // Disable default leaflet zoom controls
    });

    this.streetLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 20
    });

    this.satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      maxZoom: 19
    });

    this.streetLayer.addTo(this.map);

    this.farmGroup.addTo(this.map);
    this.treeGroup.addTo(this.map);
    this.pipelineGroup.addTo(this.map);
    this.valveGroup.addTo(this.map);
    this.pumpGroup.addTo(this.map);
  }

  toggleBasemap(): void {
    this.satelliteMode.update(val => !val);
    if (this.satelliteMode()) {
      this.map.removeLayer(this.streetLayer);
      this.satelliteLayer.addTo(this.map);
    } else {
      this.map.removeLayer(this.satelliteLayer);
      this.streetLayer.addTo(this.map);
    }
  }

  toggleLayer(layerKey: keyof typeof this.layers): void {
    const isVisible = this.layers[layerKey];
    const group = this.getGroupByKey(layerKey);

    if (isVisible) {
      group.addTo(this.map);
    } else {
      this.map.removeLayer(group);
    }
  }

  toggleLayerMenu(): void {
    this.showLayerMenu.update(v => !v);
  }

  zoomIn(): void {
    if (this.map) {
      this.map.zoomIn();
    }
  }

  zoomOut(): void {
    if (this.map) {
      this.map.zoomOut();
    }
  }

  recenterMap(): void {
    if (this.map) {
      this.map.setView([11.0168, 76.9558], 16);
    }
  }

  closeInspector(): void {
    this.selectedAsset.set(null);
  }

  private getGroupByKey(key: keyof typeof this.layers): L.LayerGroup {
    switch (key) {
      case 'farms': return this.farmGroup;
      case 'trees': return this.treeGroup;
      case 'pipelines': return this.pipelineGroup;
      case 'valves': return this.valveGroup;
      case 'pumps': return this.pumpGroup;
    }
  }

  private loadGISData(): void {
    forkJoin({
      farms: this.farmService.getAllFarms(),
      trees: this.treeService.getAllTrees(),
      pipelines: this.pipelineService.getAllPipelines(),
      valves: this.valveService.getAllValves(),
      pumps: this.pumpService.getAllPumps(),
      tanks: this.tankService.getAllTanks()
    }).subscribe({
      next: (data) => {
        // Clear old layer contents if any
        this.farmGroup.clearLayers();
        this.treeGroup.clearLayers();
        this.pipelineGroup.clearLayers();
        this.valveGroup.clearLayers();
        this.pumpGroup.clearLayers();

        // 1. Load Farms
        data.farms.forEach(farm => {
          if (farm.boundary) {
            const polygon = L.geoJSON(farm.boundary, {
              style: {
                color: '#3b82f6',
                weight: 2,
                fillColor: '#3b82f6',
                fillOpacity: 0.08
              }
            });
            polygon.on('click', () => {
              this.selectedAsset.set({
                type: 'Farm',
                name: farm.name,
                owner: farm.ownerName,
                area: `${farm.area ? farm.area.toFixed(1) : '0'} Hectares`,
                status: farm.status,
                description: farm.description || 'No description available.'
              });
            });
            polygon.addTo(this.farmGroup);
          }
        });

        // 2. Load Pipelines
        data.pipelines.forEach(pipe => {
          if (pipe.geometry) {
            const polyline = L.geoJSON(pipe.geometry, {
              style: {
                color: '#0ea5e9',
                weight: 3.5,
                opacity: 0.8
              }
            });
            polyline.on('click', () => {
              this.selectedAsset.set({
                type: 'Pipeline',
                name: pipe.name,
                diameter: pipe.diameter ? `${pipe.diameter} mm` : 'N/A',
                material: pipe.material || 'N/A',
                length: pipe.length ? `${pipe.length.toFixed(1)} meters` : 'N/A',
                status: pipe.status
              });
            });
            polyline.addTo(this.pipelineGroup);
          }
        });

        // 3. Load Trees
        data.trees.forEach(tree => {
          if (tree.location) {
            const color = tree.healthStatus === 'HEALTHY' ? '#10b981' : tree.healthStatus === 'STRESSED' ? '#f59e0b' : '#ef4444';
            const treeMarker = L.geoJSON(tree.location, {
              pointToLayer: (geoJsonPoint, latlng) => {
                return L.circleMarker(latlng, {
                  radius: 6,
                  fillColor: color,
                  color: '#ffffff',
                  weight: 1,
                  fillOpacity: 0.95
                });
              }
            });
            treeMarker.on('click', () => {
              this.selectedAsset.set({
                type: 'Tree',
                name: `Tree #${tree.treeNumber}`,
                species: tree.species,
                age: `${tree.age} months`,
                healthStatus: tree.healthStatus,
                yield: 'N/A',
                notes: tree.notes || 'No notes available.'
              });
            });
            treeMarker.addTo(this.treeGroup);
          }
        });

        // 4. Load Valves
        data.valves.forEach(valve => {
          if (valve.geometry) {
            const valveMarker = L.geoJSON(valve.geometry, {
              pointToLayer: (geoJsonPoint, latlng) => {
                return L.circleMarker(latlng, {
                  radius: 7.5,
                  fillColor: '#f59e0b',
                  color: '#ffffff',
                  weight: 1.5,
                  fillOpacity: 1
                });
              }
            });
            valveMarker.on('click', () => {
              this.selectedAsset.set({
                type: 'Valve',
                name: `Solenoid Valve ${valve.valveNumber}`,
                typeSpec: valve.type || 'Solenoid Valve',
                zone: valve.zone || 'N/A',
                status: valve.status
              });
            });
            valveMarker.addTo(this.valveGroup);
          }
        });

        // 5. Load Pumps
        data.pumps.forEach(pump => {
          if (pump.geometry) {
            const pumpMarker = L.geoJSON(pump.geometry, {
              pointToLayer: (geoJsonPoint, latlng) => {
                return L.circleMarker(latlng, {
                  radius: 8.5,
                  fillColor: '#ec4899',
                  color: '#ffffff',
                  weight: 1.5,
                  fillOpacity: 1
                });
              }
            });
            pumpMarker.on('click', () => {
              this.selectedAsset.set({
                type: 'Pump',
                name: pump.name,
                capacity: pump.capacity ? `${pump.capacity} L/hr` : 'N/A',
                power: pump.powerRating ? `${pump.powerRating} HP` : 'N/A',
                manufacturer: pump.manufacturer || 'N/A',
                status: pump.status
              });
            });
            pumpMarker.addTo(this.pumpGroup);
          }
        });

        // Compute real KPIs
        this.kpiTrees.set(data.trees.length);
        const activeValvesCount = data.valves.filter((v: any) => v.status !== 'DAMAGED').length;
        this.kpiValves.set(activeValvesCount);
        const operationalPumpsCount = data.pumps.filter((p: any) => p.status !== 'MAINTENANCE').length;
        this.kpiPumps.set(operationalPumpsCount);

        // Autofit map view to farms if they exist
        if (data.farms.length > 0) {
          const tempGroup = L.featureGroup(this.farmGroup.getLayers());
          this.map.fitBounds(tempGroup.getBounds());
        }
      },
      error: (err) => {
        console.error('Failed to load GIS map features from backend:', err);
        this.kpiTrees.set(0);
        this.kpiValves.set(0);
        this.kpiPumps.set(0);
      }
    });
  }
}
