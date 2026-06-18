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
import { InfrastructureService, Infrastructure } from '../../services/infrastructure.service';
import { FarmService, Farm } from '../../services/farm.service';
import * as L from 'leaflet';

@Component({
  selector: 'app-infrastructure',
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
    <div class="infra-container">
      <div class="header-section">
        <h1 class="page-title">Infrastructure Mapping</h1>
        <p class="page-subtitle">Track buildings, roads, panels, fences, and water sources</p>
      </div>

      <div class="split-layout">
        <!-- Infrastructure List -->
        <mat-card class="list-card glass-panel">
          <mat-card-header>
            <mat-card-title class="card-title">Mapped Structures</mat-card-title>
          </mat-card-header>
          <mat-card-content class="table-container">
            <table mat-table [dataSource]="infraList()" class="dark-table">
              
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef> Feature Name </th>
                <td mat-cell *matCellDef="let element"> {{element.name}} </td>
              </ng-container>

              <ng-container matColumnDef="type">
                <th mat-header-cell *matHeaderCellDef> Type </th>
                <td mat-cell *matCellDef="let element">
                  <span class="type-tag">
                    {{element.type}}
                  </span>
                </td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef> Status </th>
                <td mat-cell *matCellDef="let element">
                  <span class="status-badge" [ngClass]="element.status.toLowerCase()">
                    {{element.status}}
                  </span>
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef> Actions </th>
                <td mat-cell *matCellDef="let element">
                  <button mat-icon-button color="warn" (click)="deleteInfra(element.id, $event)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;" (click)="selectInfra(row)" class="clickable-row"></tr>
            </table>

            <div *ngIf="infraList().length === 0" class="empty-state">
              <mat-icon>business</mat-icon>
              <p>No infrastructure mapped yet.</p>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Form Card -->
        <mat-card class="form-card glass-panel">
          <mat-card-header>
            <mat-card-title class="card-title">
              {{ isEditMode() ? 'Edit Feature' : 'Map Infrastructure' }}
            </mat-card-title>
          </mat-card-header>
          
          <mat-card-content class="form-content">
            <form [formGroup]="infraForm" (ngSubmit)="onSubmit()">
              <mat-form-field appearance="outline">
                <mat-label>Assign to Farm</mat-label>
                <mat-select formControlName="farmId" (selectionChange)="onFarmSelected($event.value)">
                  <mat-option *ngIf="farms().length === 0" disabled>No farms registered. Register a farm first.</mat-option>
                  <mat-option *ngFor="let farm of farms()" [value]="farm.id">{{ farm.name }}</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Feature Name</mat-label>
                <input matInput formControlName="name" placeholder="e.g. Electrical Panel Zone 3">
              </mat-form-field>

              <div class="row">
                <mat-form-field appearance="outline">
                  <mat-label>Feature Type</mat-label>
                  <mat-select formControlName="type">
                    <mat-option value="BUILDING">Building</mat-option>
                    <mat-option value="ROAD">Road</mat-option>
                    <mat-option value="STORAGE">Storage Area</mat-option>
                    <mat-option value="FENCE">Fencing</mat-option>
                    <mat-option value="PANEL">Electrical Panel</mat-option>
                    <mat-option value="SOURCE">Water Source</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Status</mat-label>
                  <mat-select formControlName="status">
                    <mat-option value="ACTIVE">Active</mat-option>
                    <mat-option value="MAINTENANCE">Maintenance</mat-option>
                    <mat-option value="INACTIVE">Inactive</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>

              <div class="map-section">
                <div #miniMapContainer class="mini-map"></div>
                <div class="coord-indicator" *ngIf="selectedLatLng() as pos">
                  Coordinates: {{ pos.lat | number:'1.5-5' }}, {{ pos.lng | number:'1.5-5' }}
                </div>
              </div>

              <div class="form-actions">
                <button type="button" mat-button *ngIf="isEditMode()" (click)="cancelEdit()">Cancel</button>
                <button mat-flat-button color="primary" type="submit" [disabled]="infraForm.invalid || !selectedLatLng()">
                  <mat-icon>save</mat-icon> Save Feature
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .infra-container {
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
export class InfrastructureComponent implements OnInit, AfterViewInit {
  private fb = inject(FormBuilder);
  private infraService = inject(InfrastructureService);
  private farmService = inject(FarmService);

  displayedColumns: string[] = ['name', 'type', 'status', 'actions'];

  // Signals
  readonly infraList = signal<Infrastructure[]>([]);
  readonly farms = signal<Farm[]>([]);
  readonly isEditMode = signal(false);
  readonly editId = signal<number | null>(null);
  readonly selectedLatLng = signal<L.LatLng | null>(null);

  // Form Group
  readonly infraForm: FormGroup = this.fb.group({
    farmId: ['', [Validators.required]],
    name: ['', [Validators.required]],
    type: ['BUILDING', [Validators.required]],
    status: ['ACTIVE']
  });

  @ViewChild('miniMapContainer') miniMapContainer!: ElementRef;
  private map!: L.Map;
  private marker: L.Marker | null = null;
  private farmBoundaryLayer: L.Polygon | null = null;

  ngOnInit(): void {
    this.loadFarms();
    this.loadInfrastructure();
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

  private loadInfrastructure(): void {
    this.infraService.getAllInfrastructure().subscribe({
      next: (list) => this.infraList.set(list),
      error: () => console.error('Failed to load infrastructure')
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

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.setMarker(e.latlng);
    });
  }

  private setMarker(latlng: L.LatLng): void {
    this.selectedLatLng.set(latlng);
    if (this.marker) {
      this.marker.setLatLng(latlng);
    } else {
      this.marker = L.marker(latlng, {
        icon: L.divIcon({
          className: 'custom-infra-pin',
          html: `<div style="background-color: #8b5cf6; width: 10px; height: 10px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px black;"></div>`,
          iconSize: [10, 10],
          iconAnchor: [5, 5]
        })
      }).addTo(this.map);
    }
  }

  onFarmSelected(farmId: number): void {
    const selectedFarm = this.farms().find(f => f.id === farmId);
    if (!selectedFarm || !selectedFarm.boundary) return;

    if (this.farmBoundaryLayer) this.farmBoundaryLayer.remove();

    const geojsonCoords = selectedFarm.boundary.coordinates[0];
    const leafletCoords = geojsonCoords.map((c: number[]) => L.latLng(c[1], c[0]));
    
    this.farmBoundaryLayer = L.polygon(leafletCoords, {
      color: '#3b82f6',
      fillColor: '#3b82f6',
      fillOpacity: 0.02,
      weight: 1.5
    }).addTo(this.map);

    this.map.fitBounds(this.farmBoundaryLayer.getBounds());
  }

  selectInfra(infra: Infrastructure): void {
    this.isEditMode.set(true);
    this.editId.set(infra.id || null);

    this.infraForm.patchValue({
      farmId: infra.farmId,
      name: infra.name,
      type: infra.type,
      status: infra.status
    });

    this.onFarmSelected(infra.farmId);

    // Map point
    if (infra.geometry && infra.geometry.coordinates) {
      const coords = infra.geometry.coordinates;
      const latlng = L.latLng(coords[1], coords[0]);
      this.setMarker(latlng);
      this.map.setView(latlng, 17);
    }
  }

  cancelEdit(): void {
    this.isEditMode.set(false);
    this.editId.set(null);
    this.infraForm.reset({ type: 'BUILDING', status: 'ACTIVE' });
    this.selectedLatLng.set(null);
    if (this.marker) {
      this.marker.remove();
      this.marker = null;
    }
    if (this.farmBoundaryLayer) {
      this.farmBoundaryLayer.remove();
      this.farmBoundaryLayer = null;
    }
  }

  onSubmit(): void {
    if (this.infraForm.invalid || !this.selectedLatLng()) return;

    const coords = [this.selectedLatLng()!.lng, this.selectedLatLng()!.lat];
    const geometry = {
      type: 'Point',
      coordinates: coords
    };

    const infraData: Infrastructure = {
      farmId: this.infraForm.value.farmId,
      name: this.infraForm.value.name,
      type: this.infraForm.value.type,
      status: this.infraForm.value.status,
      geometry: geometry
    };

    if (this.isEditMode() && this.editId()) {
      this.infraService.updateInfrastructure(this.editId()!, infraData).subscribe({
        next: () => {
          this.loadInfrastructure();
          this.cancelEdit();
        },
        error: (err) => console.error(err)
      });
    } else {
      this.infraService.createInfrastructure(infraData).subscribe({
        next: () => {
          this.loadInfrastructure();
          const farmId = this.infraForm.value.farmId;
          this.infraForm.reset({
            farmId: farmId,
            type: 'BUILDING',
            status: 'ACTIVE'
          });
          this.selectedLatLng.set(null);
          if (this.marker) {
            this.marker.remove();
            this.marker = null;
          }
        },
        error: (err) => console.error(err)
      });
    }
  }

  deleteInfra(id?: number, event?: Event): void {
    if (event) event.stopPropagation();
    if (!id || !confirm('Are you sure you want to delete this feature record?')) return;

    this.infraService.deleteInfrastructure(id).subscribe({
      next: () => {
        this.loadInfrastructure();
        if (this.editId() === id) this.cancelEdit();
      },
      error: () => console.error('Failed to delete infrastructure')
    });
  }
}
