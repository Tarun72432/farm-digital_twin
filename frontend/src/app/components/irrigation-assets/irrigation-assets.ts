import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { FarmService, Farm } from '../../services/farm.service';
import { ValveService } from '../../services/valve.service';
import { PumpService } from '../../services/pump.service';
import { TankService } from '../../services/tank.service';
import * as L from 'leaflet';

@Component({
  selector: 'app-irrigation-assets',
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
    <div class="assets-container">
      <div class="header-section">
        <h1 class="page-title">{{ assetTitle() }} Management</h1>
        <p class="page-subtitle">Map coordinates, check operating status, and manage water points</p>
      </div>

      <div class="split-layout">
        <!-- Asset List -->
        <mat-card class="list-card glass-panel">
          <mat-card-header>
            <mat-card-title class="card-title">Mapped {{ assetTitle() }}s</mat-card-title>
          </mat-card-header>
          <mat-card-content class="table-container">
            <table mat-table [dataSource]="assetsList()" class="dark-table">
              
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef> Identifier </th>
                <td mat-cell *matCellDef="let element"> {{ getIdentifierValue(element) }} </td>
              </ng-container>

              <ng-container matColumnDef="detail">
                <th mat-header-cell *matHeaderCellDef> Tech Details </th>
                <td mat-cell *matCellDef="let element"> {{ getDetailsValue(element) }} </td>
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
                  <button mat-icon-button color="warn" (click)="deleteAsset(element.id, $event)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;" (click)="selectAsset(row)" class="clickable-row"></tr>
            </table>

            <div *ngIf="assetsList().length === 0" class="empty-state">
              <mat-icon>opacity</mat-icon>
              <p>No {{ assetTitle() }}s registered yet.</p>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Form Card -->
        <mat-card class="form-card glass-panel">
          <mat-card-header>
            <mat-card-title class="card-title">
              {{ isEditMode() ? 'Edit Info' : 'Map ' + assetTitle() }}
            </mat-card-title>
          </mat-card-header>
          
          <mat-card-content class="form-content">
            <form [formGroup]="assetForm" (ngSubmit)="onSubmit()">
              <mat-form-field appearance="outline">
                <mat-label>Assign to Farm</mat-label>
                <mat-select formControlName="farmId" (selectionChange)="onFarmSelected($event.value)">
                  <mat-option *ngIf="farms().length === 0" disabled>No farms registered. Register a farm first.</mat-option>
                  <mat-option *ngFor="let farm of farms()" [value]="farm.id">{{ farm.name }}</mat-option>
                </mat-select>
              </mat-form-field>

              <!-- Dynamic form fields depending on active asset mode -->
              <div *ngIf="mode() === 'valve'">
                <mat-form-field appearance="outline">
                  <mat-label>Valve Number/ID</mat-label>
                  <input matInput formControlName="valveNumber" placeholder="e.g. V-101">
                </mat-form-field>

                <div class="row">
                  <mat-form-field appearance="outline">
                    <mat-label>Valve Type</mat-label>
                    <mat-select formControlName="type">
                      <mat-option value="Solenoid">Solenoid (Electric)</mat-option>
                      <mat-option value="Butterfly">Butterfly (Mechanical)</mat-option>
                      <mat-option value="Ball">Ball Valve</mat-option>
                    </mat-select>
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Watering Zone</mat-label>
                    <input matInput formControlName="zone" placeholder="e.g. Zone 4">
                  </mat-form-field>
                </div>
              </div>

              <div *ngIf="mode() === 'pump'">
                <mat-form-field appearance="outline">
                  <mat-label>Pump Name</mat-label>
                  <input matInput formControlName="name" placeholder="e.g. Main Borewell Pump">
                </mat-form-field>

                <div class="row">
                  <mat-form-field appearance="outline">
                    <mat-label>Capacity (L/hr)</mat-label>
                    <input matInput type="number" formControlName="capacity" placeholder="45000">
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Power Rating (HP)</mat-label>
                    <input matInput type="number" formControlName="powerRating" placeholder="7.5">
                  </mat-form-field>
                </div>
              </div>

              <div *ngIf="mode() === 'tank'">
                <mat-form-field appearance="outline">
                  <mat-label>Tank Name</mat-label>
                  <input matInput formControlName="name" placeholder="e.g. Reservoir B">
                </mat-form-field>

                <div class="row">
                  <mat-form-field appearance="outline">
                    <mat-label>Capacity (Liters)</mat-label>
                    <input matInput type="number" formControlName="capacity" placeholder="100000">
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Material</mat-label>
                    <input matInput formControlName="material" placeholder="e.g. Concrete">
                  </mat-form-field>
                </div>
              </div>

              <mat-form-field appearance="outline">
                <mat-label>Operating Status</mat-label>
                <mat-select formControlName="status">
                  <mat-option *ngFor="let s of statusOptions()" [value]="s">{{ s }}</mat-option>
                </mat-select>
              </mat-form-field>

              <div class="map-section">
                <div #miniMapContainer class="mini-map"></div>
                <div class="coord-indicator" *ngIf="selectedLatLng() as pos">
                  Coordinates: {{ pos.lat | number:'1.5-5' }}, {{ pos.lng | number:'1.5-5' }}
                </div>
              </div>

              <div class="form-actions">
                <button type="button" mat-button *ngIf="isEditMode()" (click)="cancelEdit()">Cancel</button>
                <button mat-flat-button color="primary" type="submit" [disabled]="assetForm.invalid || !selectedLatLng()">
                  <mat-icon>save</mat-icon> Save {{ assetTitle() }}
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .assets-container {
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
export class IrrigationAssetsComponent implements OnInit, AfterViewInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly farmService = inject(FarmService);
  private readonly valveService = inject(ValveService);
  private readonly pumpService = inject(PumpService);
  private readonly tankService = inject(TankService);

  displayedColumns: string[] = ['name', 'detail', 'status', 'actions'];

  // Signals
  readonly mode = signal<'valve' | 'pump' | 'tank'>('valve');
  readonly assetTitle = signal<string>('Valve');
  readonly assetsList = signal<any[]>([]);
  readonly farms = signal<Farm[]>([]);
  readonly isEditMode = signal(false);
  readonly editId = signal<number | null>(null);
  readonly selectedLatLng = signal<L.LatLng | null>(null);
  readonly statusOptions = signal<string[]>(['CLOSED', 'OPEN', 'DAMAGED']);

  // Dynamic Form Group
  readonly assetForm: FormGroup = this.fb.group({
    farmId: ['', [Validators.required]],
    status: [''],
    // Valve fields
    valveNumber: [''],
    type: [''],
    zone: [''],
    // Pump/Tank fields
    name: [''],
    capacity: [0],
    powerRating: [0],
    material: ['']
  });

  @ViewChild('miniMapContainer') miniMapContainer!: ElementRef;
  private map!: L.Map;
  private marker: L.Marker | null = null;
  private farmBoundaryLayer: L.Polygon | null = null;

  ngOnInit(): void {
    this.resolveRouteMode();
    this.loadFarms();
    this.loadAssets();
  }

  ngAfterViewInit(): void {
    this.initMiniMap();
  }

  private resolveRouteMode(): void {
    const url = this.router.url;
    if (url.includes('/valves')) {
      this.mode.set('valve');
      this.assetTitle.set('Valve');
      this.statusOptions.set(['CLOSED', 'OPEN', 'DAMAGED']);
      this.assetForm.patchValue({ status: 'CLOSED' });
    } else if (url.includes('/pumps')) {
      this.mode.set('pump');
      this.assetTitle.set('Pump');
      this.statusOptions.set(['OFF', 'ON', 'MAINTENANCE']);
      this.assetForm.patchValue({ status: 'OFF' });
    } else if (url.includes('/tanks')) {
      this.mode.set('tank');
      this.assetTitle.set('Tank');
      this.statusOptions.set(['OPERATIONAL', 'MAINTENANCE', 'INACTIVE']);
      this.assetForm.patchValue({ status: 'OPERATIONAL' });
    }
  }

  private loadFarms(): void {
    this.farmService.getAllFarms().subscribe({
      next: (farms) => this.farms.set(farms),
      error: () => console.error('Failed to load farms')
    });
  }

  private loadAssets(): void {
    const service = this.getActiveService();
    service.getAll().subscribe({
      next: (list: any[]) => this.assetsList.set(list),
      error: () => console.error(`Failed to load ${this.mode()}s`)
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
          className: 'custom-asset-pin',
          html: `<div style="background-color: #f59e0b; width: 10px; height: 10px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px black;"></div>`,
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

  getIdentifierValue(element: any): string {
    if (this.mode() === 'valve') return element.valveNumber;
    return element.name;
  }

  getDetailsValue(element: any): string {
    if (this.mode() === 'valve') return `${element.type || ''} (Zone: ${element.zone || ''})`;
    if (this.mode() === 'pump') return `${element.capacity || 0} L/hr (${element.powerRating || 0} HP)`;
    return `${element.capacity || 0} L (${element.material || ''})`;
  }

  selectAsset(element: any): void {
    this.isEditMode.set(true);
    this.editId.set(element.id || null);

    this.assetForm.patchValue({
      farmId: element.farmId,
      status: element.status,
      valveNumber: element.valveNumber || '',
      type: element.type || '',
      zone: element.zone || '',
      name: element.name || '',
      capacity: element.capacity || 0,
      powerRating: element.powerRating || 0,
      material: element.material || ''
    });

    this.onFarmSelected(element.farmId);

    // Map point
    if (element.geometry && element.geometry.coordinates) {
      const coords = element.geometry.coordinates;
      const latlng = L.latLng(coords[1], coords[0]);
      this.setMarker(latlng);
      this.map.setView(latlng, 17);
    }
  }

  cancelEdit(): void {
    this.isEditMode.set(false);
    this.editId.set(null);
    this.assetForm.reset({ status: this.statusOptions()[0], capacity: 0, powerRating: 0 });
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
    if (this.assetForm.invalid || !this.selectedLatLng()) return;

    const coords = [this.selectedLatLng()!.lng, this.selectedLatLng()!.lat];
    const geometry = {
      type: 'Point',
      coordinates: coords
    };

    let payload: any = {
      farmId: this.assetForm.value.farmId,
      status: this.assetForm.value.status,
      geometry: geometry
    };

    if (this.mode() === 'valve') {
      payload.valveNumber = this.assetForm.value.valveNumber;
      payload.type = this.assetForm.value.type;
      payload.zone = this.assetForm.value.zone;
    } else if (this.mode() === 'pump') {
      payload.name = this.assetForm.value.name;
      payload.capacity = this.assetForm.value.capacity;
      payload.powerRating = this.assetForm.value.powerRating;
    } else {
      payload.name = this.assetForm.value.name;
      payload.capacity = this.assetForm.value.capacity;
      payload.material = this.assetForm.value.material;
    }

    const service = this.getActiveService();

    if (this.isEditMode() && this.editId()) {
      service.update(this.editId()!, payload).subscribe({
        next: () => {
          this.loadAssets();
          this.cancelEdit();
        },
        error: (err: any) => console.error(err)
      });
    } else {
      service.create(payload).subscribe({
        next: () => {
          this.loadAssets();
          const farmId = this.assetForm.value.farmId;
          this.assetForm.reset({
            farmId: farmId,
            status: this.statusOptions()[0],
            capacity: 0,
            powerRating: 0
          });
          this.selectedLatLng.set(null);
          if (this.marker) {
            this.marker.remove();
            this.marker = null;
          }
        },
        error: (err: any) => console.error(err)
      });
    }
  }

  deleteAsset(id?: number, event?: Event): void {
    if (event) event.stopPropagation();
    if (!id || !confirm('Are you sure you want to delete this asset record?')) return;

    this.getActiveService().delete(id).subscribe({
      next: () => {
        this.loadAssets();
        if (this.editId() === id) this.cancelEdit();
      },
      error: () => console.error('Failed to delete asset')
    });
  }

  private getActiveService(): any {
    if (this.mode() === 'valve') {
      return {
        getAll: () => this.valveService.getAllValves(),
        create: (data: any) => this.valveService.createValve(data),
        update: (id: number, data: any) => this.valveService.updateValve(id, data),
        delete: (id: number) => this.valveService.deleteValve(id)
      };
    } else if (this.mode() === 'pump') {
      return {
        getAll: () => this.pumpService.getAllPumps(),
        create: (data: any) => this.pumpService.createPump(data),
        update: (id: number, data: any) => this.pumpService.updatePump(id, data),
        delete: (id: number) => this.pumpService.deletePump(id)
      };
    } else {
      return {
        getAll: () => this.tankService.getAllTanks(),
        create: (data: any) => this.tankService.createTank(data),
        update: (id: number, data: any) => this.tankService.updateTank(id, data),
        delete: (id: number) => this.tankService.deleteTank(id)
      };
    }
  }
}
