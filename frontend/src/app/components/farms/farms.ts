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
import { FarmService, Farm } from '../../services/farm.service';
import * as L from 'leaflet';

@Component({
  selector: 'app-farms',
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
    <div class="farms-container">
      <div class="header-section">
        <h1 class="page-title">Farms Management</h1>
        <p class="page-subtitle">Track perimeters, calculate acreage, and register new blocks</p>
      </div>

      <div class="split-layout">
        <!-- Farm List -->
        <mat-card class="list-card glass-panel">
          <mat-card-header>
            <mat-card-title class="card-title">Registered Farms</mat-card-title>
          </mat-card-header>
          <mat-card-content class="table-container">
            <table mat-table [dataSource]="farmsList()" class="dark-table">
              
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef> Farm Name </th>
                <td mat-cell *matCellDef="let element"> {{element.name}} </td>
              </ng-container>

              <ng-container matColumnDef="owner">
                <th mat-header-cell *matHeaderCellDef> Owner </th>
                <td mat-cell *matCellDef="let element"> {{element.ownerName}} </td>
              </ng-container>

              <ng-container matColumnDef="area">
                <th mat-header-cell *matHeaderCellDef> Area (ha) </th>
                <td mat-cell *matCellDef="let element"> {{ (element.area || 0) | number:'1.2-2' }} ha </td>
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
                  <button mat-icon-button color="warn" (click)="deleteFarm(element.id)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;" (click)="selectFarm(row)" class="clickable-row"></tr>
            </table>

            <div *ngIf="farmsList().length === 0" class="empty-state">
              <mat-icon>agriculture</mat-icon>
              <p>No farms registered yet. Fill out the form to create one.</p>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Creation Form & Draw Map -->
        <mat-card class="form-card glass-panel">
          <mat-card-header>
            <mat-card-title class="card-title">
              {{ isEditMode() ? 'Edit Farm' : 'Register New Farm' }}
            </mat-card-title>
            <mat-card-subtitle class="card-subtitle">
              Click on the map to define the farm boundary vertices. Double-click or click "Close Boundary" to complete.
            </mat-card-subtitle>
          </mat-card-header>
          
          <mat-card-content class="form-content">
            <form [formGroup]="farmForm" (ngSubmit)="onSubmit()">
              <mat-form-field appearance="outline">
                <mat-label>Farm Name</mat-label>
                <input matInput formControlName="name" placeholder="e.g. Moringa Block Alpha">
                <mat-error *ngIf="farmForm.get('name')?.hasError('required')">Name is required</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Owner Name</mat-label>
                <input matInput formControlName="ownerName" placeholder="e.g. Senthil Kumaran">
                <mat-error *ngIf="farmForm.get('ownerName')?.hasError('required')">Owner is required</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Description</mat-label>
                <textarea matInput formControlName="description" placeholder="Optional details..."></textarea>
              </mat-form-field>

              <div class="map-section">
                <div class="map-actions">
                  <button type="button" mat-stroked-button color="primary" (click)="clearDrawing()">
                    <mat-icon>delete_sweep</mat-icon> Clear Map
                  </button>
                  <button type="button" mat-flat-button color="accent" [disabled]="vertices().length < 3" (click)="closeBoundary()">
                    <mat-icon>gesture</mat-icon> Close Boundary
                  </button>
                </div>
                <div #miniMapContainer class="mini-map"></div>
                <div class="coord-indicator">
                  Vertices drawn: <strong>{{ vertices().length }}</strong>
                  <span *ngIf="isClosed()" class="closed-label">(Closed)</span>
                </div>
              </div>

              <div class="form-actions">
                <button type="button" mat-button *ngIf="isEditMode()" (click)="cancelEdit()">Cancel</button>
                <button mat-flat-button color="primary" type="submit" [disabled]="farmForm.invalid || !isClosed()">
                  <mat-icon>save</mat-icon> Save Farm
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .farms-container {
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

    .map-section {
      margin: 12px 0 20px 0;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .map-actions {
      display: flex;
      justify-content: space-between;
    }

    .mini-map {
      height: 250px;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      overflow: hidden;
    }

    .coord-indicator {
      font-size: 12px;
      color: var(--text-secondary);
      font-family: var(--font-secondary);
    }

    .closed-label {
      color: var(--color-primary);
      margin-left: 6px;
      font-weight: 600;
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
export class FarmsComponent implements OnInit, AfterViewInit {
  private readonly fb = inject(FormBuilder);
  private readonly farmService = inject(FarmService);

  // Table variables
  displayedColumns: string[] = ['name', 'owner', 'area', 'status', 'actions'];
  readonly farmsList = signal<Farm[]>([]);

  // Form Group
  readonly farmForm: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    ownerName: ['', [Validators.required]],
    description: [''],
    status: ['ACTIVE']
  });

  // State Management Signals
  readonly isEditMode = signal(false);
  readonly editId = signal<number | null>(null);
  readonly vertices = signal<L.LatLng[]>([]);
  readonly isClosed = signal(false);

  // Map variables
  @ViewChild('miniMapContainer') miniMapContainer!: ElementRef;
  private map!: L.Map;
  private polyline!: L.Polyline;
  private polygonLayer!: L.Polygon;
  private markers: L.Marker[] = [];

  ngOnInit(): void {
    this.loadFarms();
  }

  ngAfterViewInit(): void {
    this.initMiniMap();
  }

  private loadFarms(): void {
    this.farmService.getAllFarms().subscribe({
      next: (farms) => this.farmsList.set(farms),
      error: () => console.error('Failed to load farms')
    });
  }

  private initMiniMap(): void {
    // Southern India default center
    const defaultCenter: L.LatLngExpression = [11.0168, 76.9558];
    
    this.map = L.map(this.miniMapContainer.nativeElement, {
      center: defaultCenter,
      zoom: 14,
      zoomControl: true
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20
    }).addTo(this.map);

    // Initialize drawings
    this.polyline = L.polyline([], { color: '#0ea5e9', weight: 3 }).addTo(this.map);

    // Listen to click events for drawing
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      if (this.isClosed()) return;
      
      const newLatLng = e.latlng;
      this.vertices.update(coords => [...coords, newLatLng]);
      
      // Update polyline
      this.polyline.addLatLng(newLatLng);

      // Add a small marker vertex
      const vertexMarker = L.marker(newLatLng, {
        icon: L.divIcon({
          className: 'custom-vertex-icon',
          html: '<div style="background-color: #0ea5e9; width: 8px; height: 8px; border-radius: 50%; border: 1px solid white;"></div>',
          iconSize: [8, 8],
          iconAnchor: [4, 4]
        })
      }).addTo(this.map);

      this.markers.push(vertexMarker);
    });
  }

  closeBoundary(): void {
    if (this.vertices().length < 3) return;

    this.isClosed.set(true);

    // Remove polyline and markers, replace with closed polygon
    this.polyline.remove();
    this.markers.forEach(m => m.remove());
    this.markers = [];

    const coords = this.vertices().map(v => [v.lat, v.lng]);
    this.polygonLayer = L.polygon(this.vertices(), {
      color: '#10b981',
      fillColor: '#10b981',
      fillOpacity: 0.15,
      weight: 3
    }).addTo(this.map);

    this.map.fitBounds(this.polygonLayer.getBounds());
  }

  clearDrawing(): void {
    this.vertices.set([]);
    this.isClosed.set(false);

    if (this.polyline) this.polyline.setLatLngs([]);
    this.polyline.addTo(this.map);

    if (this.polygonLayer) this.polygonLayer.remove();

    this.markers.forEach(m => m.remove());
    this.markers = [];
  }

  selectFarm(farm: Farm): void {
    this.isEditMode.set(true);
    this.editId.set(farm.id || null);

    this.farmForm.patchValue({
      name: farm.name,
      ownerName: farm.ownerName,
      description: farm.description,
      status: farm.status
    });

    this.clearDrawing();

    // Load geometry onto map
    if (farm.boundary && farm.boundary.coordinates) {
      // GeoJSON has coordinates as [lng, lat] (x, y)
      // Leaflet expects [lat, lng] (y, x)
      const geojsonCoords = farm.boundary.coordinates[0];
      const leafletCoords = geojsonCoords.map((c: number[]) => L.latLng(c[1], c[0]));
      
      // Remove last coordinate if identical to first (standard in GeoJSON polygons)
      if (leafletCoords.length > 1 && leafletCoords[0].equals(leafletCoords[leafletCoords.length - 1])) {
        leafletCoords.pop();
      }

      this.vertices.set(leafletCoords);
      this.closeBoundary();
    }
  }

  cancelEdit(): void {
    this.isEditMode.set(false);
    this.editId.set(null);
    this.farmForm.reset({ status: 'ACTIVE' });
    this.clearDrawing();
  }

  onSubmit(): void {
    if (this.farmForm.invalid || !this.isClosed()) return;

    // Build GeoJSON Polygon
    // GeoJSON polygon coordinates are [[[lng, lat], [lng, lat], ..., [first_lng, first_lat]]]
    const geojsonCoords = this.vertices().map(v => [v.lng, v.lat]);
    // Close the loop for GeoJSON specification
    geojsonCoords.push(geojsonCoords[0]);

    const boundary = {
      type: 'Polygon',
      coordinates: [geojsonCoords]
    };

    const farmData: Farm = {
      name: this.farmForm.value.name,
      ownerName: this.farmForm.value.ownerName,
      description: this.farmForm.value.description,
      status: this.farmForm.value.status,
      boundary: boundary
    };

    if (this.isEditMode() && this.editId()) {
      this.farmService.updateFarm(this.editId()!, farmData).subscribe({
        next: () => {
          this.loadFarms();
          this.cancelEdit();
        },
        error: (err) => console.error(err)
      });
    } else {
      this.farmService.createFarm(farmData).subscribe({
        next: () => {
          this.loadFarms();
          this.farmForm.reset({ status: 'ACTIVE' });
          this.clearDrawing();
        },
        error: (err) => console.error(err)
      });
    }
  }

  deleteFarm(id?: number): void {
    if (!id || !confirm('Are you sure you want to delete this farm? All trees and irrigation assets inside will be deleted!')) return;

    this.farmService.deleteFarm(id).subscribe({
      next: () => {
        this.loadFarms();
        if (this.editId() === id) {
          this.cancelEdit();
        }
      },
      error: () => console.error('Failed to delete farm')
    });
  }
}
