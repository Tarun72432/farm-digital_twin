import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { PipelineService, Pipeline } from '../../services/pipeline.service';
import { FarmService, Farm } from '../../services/farm.service';
import * as L from 'leaflet';

@Component({
  selector: 'app-pipelines',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule
  ],
  template: `
    <div class="pipelines-container">
      <div class="header-section">
        <h1 class="page-title">Irrigation Pipelines</h1>
        <p class="page-subtitle">Track water flow networks, pipeline lengths, and diameters</p>
      </div>

      <div class="split-layout">
        <!-- Pipelines List -->
        <mat-card class="list-card glass-panel">
          <mat-card-header>
            <mat-card-title class="card-title">Mapped Pipelines</mat-card-title>
          </mat-card-header>
          <mat-card-content class="table-container">
            <table mat-table [dataSource]="pipelinesList()" class="dark-table">
              
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef> Pipe Name </th>
                <td mat-cell *matCellDef="let element"> {{element.name}} </td>
              </ng-container>

              <ng-container matColumnDef="diameter">
                <th mat-header-cell *matHeaderCellDef> Diameter </th>
                <td mat-cell *matCellDef="let element"> {{element.diameter}} mm </td>
              </ng-container>

              <ng-container matColumnDef="length">
                <th mat-header-cell *matHeaderCellDef> Length (m) </th>
                <td mat-cell *matCellDef="let element"> {{ (element.length || 0) | number:'1.1-1' }} m </td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef> Status </th>
                <td mat-cell *matCellDef="let element">
                  <span class="status-badge" [ngClass]="element.status.toLowerCase()">
                    {{element.status}}
                  </span>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;" (click)="selectPipeline(row)" class="clickable-row"></tr>
            </table>

            <div *ngIf="pipelinesList().length === 0" class="empty-state">
              <mat-icon>water_damage</mat-icon>
              <p>No pipelines registered yet.</p>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Form Card -->
        <mat-card class="form-card glass-panel">
          <mat-card-header>
            <mat-card-title class="card-title">
              {{ isEditMode() ? 'Edit Pipeline Path' : 'Map Pipeline' }}
            </mat-card-title>
            <mat-card-subtitle class="card-subtitle">
              Select a farm, then click along the pipe route on the map to define vertices.
            </mat-card-subtitle>
          </mat-card-header>
          
          <mat-card-content class="form-content">
            <form [formGroup]="pipeForm" (ngSubmit)="onSubmit()">
              <mat-form-field appearance="outline">
                <mat-label>Assign to Farm</mat-label>
                <mat-select formControlName="farmId" (selectionChange)="onFarmSelected($event.value)">
                  <mat-option *ngIf="farms().length === 0" disabled>No farms registered. Register a farm first.</mat-option>
                  <mat-option *ngFor="let farm of farms()" [value]="farm.id">{{ farm.name }}</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Pipeline Name</mat-label>
                <input matInput formControlName="name" placeholder="e.g. Lateral Line A">
              </mat-form-field>

              <div class="row">
                <mat-form-field appearance="outline">
                  <mat-label>Diameter (mm)</mat-label>
                  <input matInput type="number" formControlName="diameter" placeholder="90">
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Material</mat-label>
                  <mat-select formControlName="material">
                    <mat-option value="HDPE">HDPE</mat-option>
                    <mat-option value="PVC">PVC</mat-option>
                    <mat-option value="GI">GI (Galvanized Iron)</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>

              <div class="map-section">
                <div class="map-actions">
                  <button type="button" mat-stroked-button color="primary" (click)="clearDrawing()">
                    <mat-icon>delete_sweep</mat-icon> Clear Path
                  </button>
                </div>
                <div #miniMapContainer class="mini-map"></div>
                <div class="coord-indicator">
                  Vertices drawn: <strong>{{ vertices().length }}</strong>
                </div>
              </div>

              <div class="form-actions">
                <button type="button" mat-button *ngIf="isEditMode()" (click)="cancelEdit()">Cancel</button>
                <button mat-flat-button color="primary" type="submit" [disabled]="pipeForm.invalid || vertices().length < 2">
                  <mat-icon>save</mat-icon> Save Pipeline
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .pipelines-container {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .page-title {
      font-size: 28px;
      font-weight: 700;
      margin: 0;
      color: var(--text-primary);
    }

    .page-subtitle {
      font-size: 14px;
      color: var(--text-secondary);
      margin: 4px 0 0 0;
    }

    .split-layout {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 20px;
    }

    .list-card, .form-card {
      padding: 16px;
      height: fit-content;
    }

    .card-title {
      font-size: 16px !important;
      font-weight: 600 !important;
      color: var(--text-primary);
    }

    .card-subtitle {
      color: var(--text-secondary) !important;
      font-size: 12px !important;
    }

    .table-container {
      padding: 16px 0 0 0 !important;
      overflow-x: auto;
    }



    .empty-state {
      text-align: center;
      padding: 40px;
      color: var(--text-muted);
    }

    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 8px;
    }

    .form-content {
      padding: 16px 0 0 0 !important;
    }

    .row {
      display: flex;
      gap: 16px;
    }

    .row mat-form-field {
      flex: 1;
    }

    .map-section {
      margin: 12px 0 20px 0;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .map-actions {
      display: flex;
    }

    .mini-map {
      height: 200px;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      overflow: hidden;
    }

    .coord-indicator {
      font-size: 12px;
      color: var(--text-secondary);
      font-family: var(--font-secondary);
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    @media (max-width: 1024px) {
      .split-layout {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class PipelinesComponent implements OnInit, AfterViewInit {
  private readonly fb = inject(FormBuilder);
  private readonly pipelineService = inject(PipelineService);
  private readonly farmService = inject(FarmService);

  displayedColumns: string[] = ['name', 'diameter', 'length', 'status'];
  
  // Signals
  readonly pipelinesList = signal<Pipeline[]>([]);
  readonly farms = signal<Farm[]>([]);
  readonly isEditMode = signal(false);
  readonly editId = signal<number | null>(null);
  readonly vertices = signal<L.LatLng[]>([]);

  // Form Group
  readonly pipeForm: FormGroup = this.fb.group({
    farmId: ['', [Validators.required]],
    name: ['', [Validators.required]],
    diameter: [90, [Validators.required]],
    material: ['HDPE'],
    status: ['ACTIVE']
  });

  @ViewChild('miniMapContainer') miniMapContainer!: ElementRef;
  private map!: L.Map;
  private polyline!: L.Polyline;
  private markers: L.Marker[] = [];
  private farmBoundaryLayer: L.Polygon | null = null;

  ngOnInit(): void {
    this.loadFarms();
    this.loadPipelines();
  }

  ngAfterViewInit(): void {
    this.initMiniMap();
  }

  private loadFarms(): void {
    this.farmService.getAllFarms().subscribe({
      next: (farms) => this.farms.set(farms),
      error: () => console.error('Failed to load farms')
    });
  }

  private loadPipelines(): void {
    this.pipelineService.getAllPipelines().subscribe({
      next: (pipes) => this.pipelinesList.set(pipes),
      error: () => console.error('Failed to load pipelines')
    });
  }

  private initMiniMap(): void {
    const defaultCenter: L.LatLngExpression = [11.0168, 76.9558];
    
    this.map = L.map(this.miniMapContainer.nativeElement, {
      center: defaultCenter,
      zoom: 14,
      zoomControl: true
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20
    }).addTo(this.map);

    this.polyline = L.polyline([], { color: '#0ea5e9', weight: 4 }).addTo(this.map);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const newLatLng = e.latlng;
      this.vertices.update(coords => [...coords, newLatLng]);
      this.polyline.addLatLng(newLatLng);

      const m = L.marker(newLatLng, {
        icon: L.divIcon({
          className: 'custom-vertex-icon',
          html: '<div style="background-color: #0ea5e9; width: 6px; height: 6px; border-radius: 50%; border: 1px solid white;"></div>',
          iconSize: [6, 6],
          iconAnchor: [3, 3]
        })
      }).addTo(this.map);
      this.markers.push(m);
    });
  }

  onFarmSelected(farmId: number): void {
    const selectedFarm = this.farms().find(f => f.id === farmId);
    if (!selectedFarm || !selectedFarm.boundary) return;

    if (this.farmBoundaryLayer) {
      this.farmBoundaryLayer.remove();
    }

    const geojsonCoords = selectedFarm.boundary.coordinates[0];
    const leafletCoords = geojsonCoords.map((c: number[]) => L.latLng(c[1], c[0]));
    
    this.farmBoundaryLayer = L.polygon(leafletCoords, {
      color: '#3b82f6',
      fillColor: '#3b82f6',
      fillOpacity: 0.03,
      weight: 1.5
    }).addTo(this.map);

    this.map.fitBounds(this.farmBoundaryLayer.getBounds());
  }

  clearDrawing(): void {
    this.vertices.set([]);
    if (this.polyline) this.polyline.setLatLngs([]);
    this.markers.forEach(m => m.remove());
    this.markers = [];
  }

  selectPipeline(pipe: Pipeline): void {
    this.isEditMode.set(true);
    this.editId.set(pipe.id || null);

    this.pipeForm.patchValue({
      farmId: pipe.farmId,
      name: pipe.name,
      diameter: pipe.diameter,
      material: pipe.material,
      status: pipe.status
    });

    this.onFarmSelected(pipe.farmId);
    this.clearDrawing();

    if (pipe.geometry && pipe.geometry.coordinates) {
      const leafletCoords = pipe.geometry.coordinates.map((c: number[]) => L.latLng(c[1], c[0]));
      this.vertices.set(leafletCoords);
      this.polyline.setLatLngs(leafletCoords);

      // Draw markers
      leafletCoords.forEach((c: L.LatLng) => {
        const m = L.marker(c, {
          icon: L.divIcon({
            className: 'custom-vertex-icon',
            html: '<div style="background-color: #0ea5e9; width: 6px; height: 6px; border-radius: 50%; border: 1px solid white;"></div>',
            iconSize: [6, 6],
            iconAnchor: [3, 3]
          })
        }).addTo(this.map);
        this.markers.push(m);
      });

      this.map.setView(leafletCoords[0], 16);
    }
  }

  cancelEdit(): void {
    this.isEditMode.set(false);
    this.editId.set(null);
    this.pipeForm.reset({ diameter: 90, material: 'HDPE', status: 'ACTIVE' });
    this.clearDrawing();
    if (this.farmBoundaryLayer) {
      this.farmBoundaryLayer.remove();
      this.farmBoundaryLayer = null;
    }
  }

  onSubmit(): void {
    if (this.pipeForm.invalid || this.vertices().length < 2) return;

    const geojsonCoords = this.vertices().map(v => [v.lng, v.lat]);
    const geometry = {
      type: 'LineString',
      coordinates: geojsonCoords
    };

    const pipeData: Pipeline = {
      farmId: this.pipeForm.value.farmId,
      name: this.pipeForm.value.name,
      diameter: this.pipeForm.value.diameter,
      material: this.pipeForm.value.material,
      status: this.pipeForm.value.status,
      geometry: geometry
    };

    if (this.isEditMode() && this.editId()) {
      this.pipelineService.updatePipeline(this.editId()!, pipeData).subscribe({
        next: () => {
          this.loadPipelines();
          this.cancelEdit();
        },
        error: (err) => console.error(err)
      });
    } else {
      this.pipelineService.createPipeline(pipeData).subscribe({
        next: () => {
          this.loadPipelines();
          this.pipeForm.reset({ farmId: pipeData.farmId, diameter: 90, material: 'HDPE', status: 'ACTIVE' });
          this.clearDrawing();
        },
        error: (err) => console.error(err)
      });
    }
  }
}
