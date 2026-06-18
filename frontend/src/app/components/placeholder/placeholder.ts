import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

interface ModuleMetadata {
  title: string;
  icon: string;
  week: string;
  description: string;
  fields: string[];
}

@Component({
  selector: 'app-placeholder',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule],
  template: `
    <div class="placeholder-container">
      <mat-card class="placeholder-card glass-panel hover-glow">
        <div class="icon-header" [ngStyle]="{'background-color': getIconBg()}">
          <mat-icon>{{ meta().icon }}</mat-icon>
        </div>
        
        <h1 class="title">{{ meta().title }}</h1>
        <div class="roadmap-badge">Roadmap: {{ meta().week }}</div>
        
        <p class="description">{{ meta().description }}</p>
        
        <div class="fields-section">
          <h3>Database Schema Fields (PostGIS Model)</h3>
          <ul class="fields-list">
            <li *ngFor="let field of meta().fields">
              <code>{{ field }}</code>
            </li>
          </ul>
        </div>
        
        <button mat-flat-button color="primary" class="action-btn" (click)="goHome()">
          <mat-icon>dashboard</mat-icon>
          <span>Back to Dashboard</span>
        </button>
      </mat-card>
    </div>
  `,
  styles: [`
    .placeholder-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100vh - 160px);
    }

    .placeholder-card {
      max-width: 500px;
      width: 100%;
      padding: 32px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .icon-header {
      width: 64px;
      height: 64px;
      border-radius: 16px;
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 20px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .icon-header mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: white;
    }

    .title {
      font-size: 24px;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
    }

    .roadmap-badge {
      font-size: 11px;
      font-weight: 600;
      color: var(--color-primary);
      background-color: var(--color-primary-glow);
      border: 1px solid rgba(16, 185, 129, 0.2);
      border-radius: 12px;
      padding: 4px 12px;
      margin: 8px 0 16px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .description {
      font-size: 14px;
      line-height: 1.6;
      color: var(--text-secondary);
      margin-bottom: 24px;
      font-family: var(--font-secondary);
    }

    .fields-section {
      width: 100%;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;
      text-align: left;
    }

    .fields-section h3 {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--text-muted);
      margin: 0 0 10px 0;
      letter-spacing: 0.5px;
    }

    .fields-list {
      margin: 0;
      padding-left: 20px;
      font-family: var(--font-secondary);
      font-size: 13px;
      color: var(--text-secondary);
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
    }

    .fields-list code {
      background: rgba(0, 0, 0, 0.2);
      color: var(--color-accent);
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 12px;
    }

    .action-btn {
      background: linear-gradient(90deg, var(--color-primary), #059669) !important;
      font-weight: 500 !important;
      padding: 20px 16px !important;
    }
  `]
})
export class PlaceholderComponent implements OnInit {
  private readonly router = inject(Router);
  
  readonly meta = signal<ModuleMetadata>({
    title: 'Feature Module',
    icon: 'help_outline',
    week: 'Week 2',
    description: 'This module is scheduled to be implemented.',
    fields: []
  });

  ngOnInit(): void {
    const url = this.router.url;
    this.meta.set(this.getMetadataByUrl(url));
  }

  goHome(): void {
    this.router.navigate(['/dashboard']);
  }

  getIconBg(): string {
    const icon = this.meta().icon;
    switch (icon) {
      case 'agriculture': return '#3b82f6';
      case 'park': return '#10b981';
      case 'water_damage': return '#0ea5e9';
      case 'adjust': return '#f59e0b';
      case 'speed': return '#ec4899';
      case 'opacity': return '#8b5cf6';
      case 'business': return '#10b981';
      case 'analytics': return '#0ea5e9';
      default: return '#64748b';
    }
  }

  private getMetadataByUrl(url: string): ModuleMetadata {
    if (url.includes('/farms')) {
      return {
        title: 'Farm Management',
        icon: 'agriculture',
        week: 'Week 2 Scope',
        description: 'Enables farm creation, owner detail collection, and boundary GPS perimeter tracking. Features spatial geometry calculations for farm acreage.',
        fields: ['id: bigint (PK)', 'name: varchar(100)', 'owner_name: varchar(100)', 'description: text', 'area: double (ha)', 'boundary: geometry(Polygon, 4326)']
      };
    }
    if (url.includes('/trees')) {
      return {
        title: 'Moringa Tree Mapping',
        icon: 'park',
        week: 'Week 3 Scope',
        description: 'Supports individual tree mapping, tagging, and tree age registration. Integrates with mobile device camera to capture health status snapshots.',
        fields: ['id: bigint (PK)', 'farm_id: bigint (FK)', 'tree_number: varchar', 'species: varchar', 'age: integer (months)', 'health_status: varchar', 'location: geometry(Point, 4326)', 'photo_url: varchar']
      };
    }
    if (url.includes('/pipelines')) {
      return {
        title: 'Pipeline Path Mapping',
        icon: 'water_damage',
        week: 'Week 4 Scope',
        description: 'Traces irrigation pipeline pathways. Records GPS path walks as PostGIS LineStrings to calculate pipe lengths and diameters.',
        fields: ['id: bigint (PK)', 'farm_id: bigint (FK)', 'name: varchar(100)', 'diameter: double (mm)', 'material: varchar(50)', 'length: double (m)', 'geometry: geometry(LineString, 4326)']
      };
    }
    if (url.includes('/valves')) {
      return {
        title: 'Valve Tagging & Status',
        icon: 'adjust',
        week: 'Week 4 Scope',
        description: 'Coordinates irrigation valves control mapping. Logs solenoid vs mechanical valve types, physical zones, and open/close state settings.',
        fields: ['id: bigint (PK)', 'farm_id: bigint (FK)', 'valve_number: varchar', 'type: varchar(50)', 'zone: varchar(50)', 'status: varchar(20)', 'geometry: geometry(Point, 4326)']
      };
    }
    if (url.includes('/pumps')) {
      return {
        title: 'Water Pumps Mapping',
        icon: 'speed',
        week: 'Week 5 Scope',
        description: 'Monitors borewells, motor ratings, pump capacities, and power logs. Prepares endpoints for active IoT status tracking.',
        fields: ['id: bigint (PK)', 'farm_id: bigint (FK)', 'name: varchar(100)', 'capacity: double (L/hr)', 'power_rating: double (HP)', 'manufacturer: varchar', 'geometry: geometry(Point, 4326)']
      };
    }
    if (url.includes('/tanks')) {
      return {
        title: 'Irrigation Tanks Mapping',
        icon: 'opacity',
        week: 'Week 5 Scope',
        description: 'Tracks water storage reservoirs, tank dimensions, heights, and volumes. Integrates water level sensor models for future phase IoT monitoring.',
        fields: ['id: bigint (PK)', 'farm_id: bigint (FK)', 'name: varchar(100)', 'capacity: double (L)', 'material: varchar(50)', 'height: double (m)', 'geometry: geometry(Point, 4326)']
      };
    }
    if (url.includes('/infrastructure')) {
      return {
        title: 'Farm Infrastructure Mapping',
        icon: 'business',
        week: 'Week 5 Scope',
        description: 'Maps buildings, electrical grids, fencing, storage areas, and access roads. Supports mixed spatial geometries (Points, Lines, Polygons).',
        fields: ['id: bigint (PK)', 'farm_id: bigint (FK)', 'name: varchar(100)', 'type: varchar(50)', 'status: varchar(20)', 'geometry: geometry(Geometry, 4326)']
      };
    }
    if (url.includes('/reports')) {
      return {
        title: 'GIS Analytics & Reports',
        icon: 'analytics',
        week: 'Week 7 Scope',
        description: 'Generates farm summary audits, tree health rosters, and pipeline leak checklists. Features background exports to PDF and Excel spreadsheets.',
        fields: ['Summary Audit API', 'Tree Health Roster PDF', 'Leak Check Excel', 'Export Services', 'Caching Layers']
      };
    }
    return {
      title: 'Account Settings',
      icon: 'settings',
      week: 'General Scope',
      description: 'Provides user profile updates, system preferences, password hashing, and API credential management.',
      fields: ['profile_photo_url', 'notification_email', 'theme_mode', 'mfa_enabled']
    };
  }
}
