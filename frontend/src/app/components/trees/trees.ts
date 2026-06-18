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
import { TreeService, Tree } from '../../services/tree.service';
import { FarmService, Farm } from '../../services/farm.service';
import * as L from 'leaflet';

@Component({
  selector: 'app-trees',
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
    <div class="trees-container">
      <div class="header-section">
        <h1 class="page-title">Moringa Tree Inventory</h1>
        <p class="page-subtitle">Track tree health, age distribution, and precise GPS locations</p>
      </div>

      <!-- Filters Row -->
      <mat-card class="filter-card glass-panel">
        <div class="filter-row">
          <mat-form-field appearance="outline">
            <mat-label>Filter by Farm</mat-label>
            <mat-select (selectionChange)="onFilterFarmChange($event.value)">
              <mat-option [value]="null">All Farms</mat-option>
              <mat-option *ngFor="let farm of farms()" [value]="farm.id">{{ farm.name }}</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Filter by Health</mat-label>
            <mat-select (selectionChange)="onFilterHealthChange($event.value)">
              <mat-option [value]="null">All Statuses</mat-option>
              <mat-option value="HEALTHY">Healthy</mat-option>
              <mat-option value="STRESSED">Stressed</mat-option>
              <mat-option value="DISEASED">Diseased</mat-option>
              <mat-option value="DEAD">Dead</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
      </mat-card>

      <div class="split-layout">
        <!-- Trees List -->
        <mat-card class="list-card glass-panel">
          <mat-card-header>
            <mat-card-title class="card-title">Registered Trees</mat-card-title>
          </mat-card-header>
          <mat-card-content class="table-container">
            <table mat-table [dataSource]="filteredTrees()" class="dark-table">
              
              <ng-container matColumnDef="treeNumber">
                <th mat-header-cell *matHeaderCellDef> Tree ID </th>
                <td mat-cell *matCellDef="let element"> {{element.treeNumber}} </td>
              </ng-container>

              <ng-container matColumnDef="age">
                <th mat-header-cell *matHeaderCellDef> Age (mo) </th>
                <td mat-cell *matCellDef="let element"> {{element.age}} mo </td>
              </ng-container>

              <ng-container matColumnDef="healthStatus">
                <th mat-header-cell *matHeaderCellDef> Health </th>
                <td mat-cell *matCellDef="let element">
                  <span class="health-badge" [ngClass]="element.healthStatus.toLowerCase()">
                    {{element.healthStatus}}
                  </span>
                </td>
              </ng-container>

              <ng-container matColumnDef="coords">
                <th mat-header-cell *matHeaderCellDef> Coordinates </th>
                <td mat-cell *matCellDef="let element">
                  {{ element.location.coordinates[1] | number:'1.5-5' }},
                  {{ element.location.coordinates[0] | number:'1.5-5' }}
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef> Actions </th>
                <td mat-cell *matCellDef="let element">
                  <button mat-icon-button color="warn" (click)="deleteTree(element.id, $event)">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;" (click)="selectTree(row)" class="clickable-row"></tr>
            </table>

            <div *ngIf="filteredTrees().length === 0" class="empty-state">
              <mat-icon>park</mat-icon>
              <p>No trees found matching criteria.</p>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Form Card -->
        <mat-card class="form-card glass-panel">
          <mat-card-header>
            <mat-card-title class="card-title">
              {{ isEditMode() ? 'Edit Tree Logs' : 'Register Moringa Tree' }}
            </mat-card-title>
            <mat-card-subtitle class="card-subtitle">
              Select a farm, then click on the map to pin the tree coordinates. Attach a photo if available.
            </mat-card-subtitle>
          </mat-card-header>
          
          <mat-card-content class="form-content">
            <form [formGroup]="treeForm" (ngSubmit)="onSubmit()">
              <mat-form-field appearance="outline">
                <mat-label>Assign to Farm</mat-label>
                <mat-select formControlName="farmId" (selectionChange)="onFarmSelectedInForm($event.value)">
                  <mat-option *ngIf="farms().length === 0" disabled>No farms registered. Register a farm first.</mat-option>
                  <mat-option *ngFor="let farm of farms()" [value]="farm.id">{{ farm.name }}</mat-option>
                </mat-select>
                <mat-error *ngIf="treeForm.get('farmId')?.hasError('required')">Farm assignment is required</mat-error>
              </mat-form-field>

              <div class="row">
                <mat-form-field appearance="outline">
                  <mat-label>Tree Number/ID</mat-label>
                  <input matInput formControlName="treeNumber" placeholder="e.g. M-105">
                  <mat-error *ngIf="treeForm.get('treeNumber')?.hasError('required')">Tree number is required</mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Age (months)</mat-label>
                  <input matInput type="number" formControlName="age" placeholder="e.g. 18">
                </mat-form-field>
              </div>

              <div class="row">
                <mat-form-field appearance="outline">
                  <mat-label>Species</mat-label>
                  <input matInput formControlName="species" placeholder="Moringa Oleifera">
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>Health Status</mat-label>
                  <mat-select formControlName="healthStatus">
                    <mat-option value="HEALTHY">Healthy</mat-option>
                    <mat-option value="STRESSED">Stressed</mat-option>
                    <mat-option value="DISEASED">Diseased</mat-option>
                    <mat-option value="DEAD">Dead</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>

              <!-- Photo Upload Section -->
              <div class="photo-upload-section">
                <label class="photo-input-label">Tree Photo Attachment</label>
                <div class="photo-input-row">
                  <input type="file" #fileInput (change)="onFileSelected($event)" style="display: none" accept="image/*">
                  <button type="button" mat-stroked-button (click)="fileInput.click()">
                    <mat-icon>photo_camera</mat-icon> Select Image
                  </button>
                  <span class="file-name" *ngIf="selectedFileName()">{{ selectedFileName() }}</span>
                </div>
                <div class="uploaded-preview" *ngIf="treeForm.get('photoUrl')?.value">
                  <img [src]="treeForm.get('photoUrl')?.value" alt="Uploaded Preview">
                </div>
              </div>

              <mat-form-field appearance="outline">
                <mat-label>Notes</mat-label>
                <textarea matInput formControlName="notes" placeholder="Condition details, soil moisture notes..."></textarea>
              </mat-form-field>

              <div class="map-section">
                <div #miniMapContainer class="mini-map"></div>
                <div class="coord-indicator" *ngIf="selectedLatLng() as pos">
                  Pin Lat: <strong>{{ pos.lat | number:'1.6-6' }}</strong>, Lng: <strong>{{ pos.lng | number:'1.6-6' }}</strong>
                </div>
                <div class="coord-indicator text-warn" *ngIf="!selectedLatLng()">
                  <mat-icon style="font-size:14px; width:14px; height:14px; vertical-align:middle;">warning</mat-icon> Please click on the map above to select tree position.
                </div>
              </div>

              <div class="form-actions">
                <button type="button" mat-button *ngIf="isEditMode()" (click)="cancelEdit()">Cancel</button>
                <button mat-flat-button color="primary" type="submit" [disabled]="treeForm.invalid || !selectedLatLng()">
                  <mat-icon>save</mat-icon> Save Tree
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .trees-container {
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

    .filter-card {
      padding: 16px;
    }

    .filter-row {
      display: flex;
      gap: 16px;
    }

    .filter-row mat-form-field {
      width: 250px;
      margin-bottom: 0 !important;
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

    .photo-upload-section {
      background: rgba(255, 255, 255, 0.02);
      border: 1px dashed var(--border-color);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 20px;
    }

    .photo-input-label {
      display: block;
      font-size: 13px;
      color: var(--text-secondary);
      margin-bottom: 8px;
    }

    .photo-input-row {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .file-name {
      font-size: 12px;
      color: var(--text-muted);
    }

    .uploaded-preview {
      margin-top: 12px;
    }

    .uploaded-preview img {
      width: 100%;
      height: 120px;
      object-fit: cover;
      border-radius: 6px;
      border: 1px solid var(--border-color);
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

    .text-warn {
      color: var(--color-warning);
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
export class TreesComponent implements OnInit, AfterViewInit {
  private readonly fb = inject(FormBuilder);
  private readonly treeService = inject(TreeService);
  private readonly farmService = inject(FarmService);

  displayedColumns: string[] = ['treeNumber', 'age', 'healthStatus', 'coords', 'actions'];
  
  // Signals
  readonly allTrees = signal<Tree[]>([]);
  readonly filteredTrees = signal<Tree[]>([]);
  readonly farms = signal<Farm[]>([]);
  readonly isEditMode = signal(false);
  readonly editId = signal<number | null>(null);
  readonly selectedLatLng = signal<L.LatLng | null>(null);
  readonly selectedFileName = signal<string | null>(null);

  // Filters state
  private selectedFilterFarmId: number | null = null;
  private selectedFilterHealth: string | null = null;

  // Form Group
  readonly treeForm: FormGroup = this.fb.group({
    farmId: ['', [Validators.required]],
    treeNumber: ['', [Validators.required]],
    species: ['Moringa Oleifera'],
    age: [0],
    healthStatus: ['HEALTHY'],
    photoUrl: [''],
    notes: ['']
  });

  @ViewChild('miniMapContainer') miniMapContainer!: ElementRef;
  private map!: L.Map;
  private marker: L.Marker | null = null;
  private farmBoundaryLayer: L.Polygon | null = null;

  ngOnInit(): void {
    this.loadFarms();
    this.loadTrees();
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

  private loadTrees(): void {
    this.treeService.getAllTrees().subscribe({
      next: (trees) => {
        this.allTrees.set(trees);
        this.applyFilters();
      },
      error: () => console.error('Failed to load trees')
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
          className: 'custom-tree-pin',
          html: '<div style="background-color: #10b981; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 6px rgba(0,0,0,0.5);"></div>',
          iconSize: [12, 12],
          iconAnchor: [6, 6]
        })
      }).addTo(this.map);
    }
  }

  onFarmSelectedInForm(farmId: number): void {
    const selectedFarm = this.farms().find(f => f.id === farmId);
    if (!selectedFarm || !selectedFarm.boundary) return;

    // Clear previous boundary layer
    if (this.farmBoundaryLayer) {
      this.farmBoundaryLayer.remove();
    }

    // Load and zoom to farm boundary
    const geojsonCoords = selectedFarm.boundary.coordinates[0];
    const leafletCoords = geojsonCoords.map((c: number[]) => L.latLng(c[1], c[0]));
    
    this.farmBoundaryLayer = L.polygon(leafletCoords, {
      color: '#3b82f6',
      fillColor: '#3b82f6',
      fillOpacity: 0.05,
      weight: 1.5
    }).addTo(this.map);

    this.map.fitBounds(this.farmBoundaryLayer.getBounds());
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    this.selectedFileName.set(file.name);

    this.treeService.uploadTreePhoto(file).subscribe({
      next: (res) => {
        this.treeForm.patchValue({ photoUrl: res.url });
      },
      error: () => console.error('Failed to upload file')
    });
  }

  onFilterFarmChange(farmId: number | null): void {
    this.selectedFilterFarmId = farmId;
    this.applyFilters();
  }

  onFilterHealthChange(health: string | null): void {
    this.selectedFilterHealth = health;
    this.applyFilters();
  }

  private applyFilters(): void {
    let list = this.allTrees();

    if (this.selectedFilterFarmId !== null) {
      list = list.filter(t => t.farmId === this.selectedFilterFarmId);
    }

    if (this.selectedFilterHealth !== null) {
      list = list.filter(t => t.healthStatus === this.selectedFilterHealth);
    }

    this.filteredTrees.set(list);
  }

  selectTree(tree: Tree): void {
    this.isEditMode.set(true);
    this.editId.set(tree.id || null);

    this.treeForm.patchValue({
      farmId: tree.farmId,
      treeNumber: tree.treeNumber,
      species: tree.species,
      age: tree.age,
      healthStatus: tree.healthStatus,
      photoUrl: tree.photoUrl,
      notes: tree.notes
    });

    this.onFarmSelectedInForm(tree.farmId);

    // Map point
    if (tree.location && tree.location.coordinates) {
      const coords = tree.location.coordinates;
      const latlng = L.latLng(coords[1], coords[0]);
      this.setMarker(latlng);
      this.map.setView(latlng, 18);
    }
  }

  cancelEdit(): void {
    this.isEditMode.set(false);
    this.editId.set(null);
    this.treeForm.reset({ species: 'Moringa Oleifera', age: 0, healthStatus: 'HEALTHY' });
    this.selectedLatLng.set(null);
    this.selectedFileName.set(null);
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
    if (this.treeForm.invalid || !this.selectedLatLng()) return;

    const coords = [this.selectedLatLng()!.lng, this.selectedLatLng()!.lat];
    const location = {
      type: 'Point',
      coordinates: coords
    };

    const treeData: Tree = {
      farmId: this.treeForm.value.farmId,
      treeNumber: this.treeForm.value.treeNumber,
      species: this.treeForm.value.species,
      age: this.treeForm.value.age,
      healthStatus: this.treeForm.value.healthStatus,
      location: location,
      photoUrl: this.treeForm.value.photoUrl,
      notes: this.treeForm.value.notes
    };

    if (this.isEditMode() && this.editId()) {
      this.treeService.updateTree(this.editId()!, treeData).subscribe({
        next: () => {
          this.loadTrees();
          this.cancelEdit();
        },
        error: (err) => console.error(err)
      });
    } else {
      this.treeService.createTree(treeData).subscribe({
        next: () => {
          this.loadTrees();
          // Reset form retaining farm selection for bulk mapping
          const farmId = this.treeForm.value.farmId;
          this.treeForm.reset({
            farmId: farmId,
            species: 'Moringa Oleifera',
            age: 0,
            healthStatus: 'HEALTHY'
          });
          this.selectedLatLng.set(null);
          this.selectedFileName.set(null);
          if (this.marker) {
            this.marker.remove();
            this.marker = null;
          }
        },
        error: (err) => console.error(err)
      });
    }
  }

  deleteTree(id?: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (!id || !confirm('Are you sure you want to delete this tree record?')) return;

    this.treeService.deleteTree(id).subscribe({
      next: () => {
        this.loadTrees();
        if (this.editId() === id) {
          this.cancelEdit();
        }
      },
      error: () => console.error('Failed to delete tree')
    });
  }
}
