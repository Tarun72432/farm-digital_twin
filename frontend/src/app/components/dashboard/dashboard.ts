import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { NgApexchartsModule } from 'ng-apexcharts';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { FarmService } from '../../services/farm.service';
import { TreeService } from '../../services/tree.service';
import { PipelineService } from '../../services/pipeline.service';
import { ValveService } from '../../services/valve.service';
import { PumpService } from '../../services/pump.service';
import { TankService } from '../../services/tank.service';
import { InfrastructureService } from '../../services/infrastructure.service';

import {
  ChartComponent,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexPlotOptions,
  ApexResponsive,
  ApexTitleSubtitle,
  ApexLegend,
  ApexStroke,
  ApexTooltip
} from 'ng-apexcharts';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    NgApexchartsModule,
    RouterLink
  ],
  template: `
    <div class="dashboard-container">
      <div class="header-section">
        <div>
          <h1 class="page-title">Digital Twin Dashboard</h1>
          <p class="page-subtitle">Real-time mapping and asset metrics for Moringa Plantation</p>
        </div>
        <button mat-flat-button color="primary" routerLink="/map" class="map-shortcut-btn">
          <mat-icon>map</mat-icon>
          <span>View Interactive GIS Map</span>
        </button>
      </div>

      <!-- KPI Grid -->
      <div class="kpi-grid">
        <mat-card class="kpi-card stat-farms">
          <mat-card-content class="kpi-content">
            <div class="kpi-icon-wrapper">
              <mat-icon>agriculture</mat-icon>
            </div>
            <div class="kpi-data">
              <span class="kpi-label">Total Farms</span>
              <div class="kpi-value-row">
                <span class="kpi-value">{{ stats().farms }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="kpi-card stat-area">
          <mat-card-content class="kpi-content">
            <div class="kpi-icon-wrapper">
              <mat-icon>landscape</mat-icon>
            </div>
            <div class="kpi-data">
              <span class="kpi-label">Mapped Area</span>
              <div class="kpi-value-row">
                <span class="kpi-value">{{ stats().area }} <span class="unit">ha</span></span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="kpi-card stat-trees">
          <mat-card-content class="kpi-content">
            <div class="kpi-icon-wrapper">
              <mat-icon>park</mat-icon>
            </div>
            <div class="kpi-data">
              <span class="kpi-label">Registered Trees</span>
              <div class="kpi-value-row">
                <span class="kpi-value">{{ stats().trees }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="kpi-card stat-pipelines">
          <mat-card-content class="kpi-content">
            <div class="kpi-icon-wrapper">
              <mat-icon>water_damage</mat-icon>
            </div>
            <div class="kpi-data">
              <span class="kpi-label">Pipelines</span>
              <div class="kpi-value-row">
                <span class="kpi-value">{{ stats().pipelinesLength }} <span class="unit">m</span></span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="kpi-card stat-valves">
          <mat-card-content class="kpi-content">
            <div class="kpi-icon-wrapper">
              <mat-icon>adjust</mat-icon>
            </div>
            <div class="kpi-data">
              <span class="kpi-label">Mapped Valves</span>
              <div class="kpi-value-row">
                <span class="kpi-value">{{ stats().valves }}</span>
                <span class="trend-badge trend-info" *ngIf="stats().valves > 0">{{ stats().activeValvesPercent }}% active</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="kpi-card stat-pumps">
          <mat-card-content class="kpi-content">
            <div class="kpi-icon-wrapper">
              <mat-icon>speed</mat-icon>
            </div>
            <div class="kpi-data">
              <span class="kpi-label">Pumps & Tanks</span>
              <div class="kpi-value-row">
                <span class="kpi-value">{{ stats().pumps + stats().tanks }}</span>
                <span class="trend-badge trend-neutral">{{ stats().pumps }} P / {{ stats().tanks }} T</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Charts Section -->
      <div class="charts-grid">
        <!-- Tree Health Pie Chart -->
        <mat-card class="chart-card glass-panel">
          <mat-card-header class="chart-header">
            <div class="title-row">
              <div class="indicator-dot dot-green"></div>
              <mat-card-title class="chart-title">Tree Health Status</mat-card-title>
            </div>
          </mat-card-header>
          <mat-card-content class="chart-content-area">
            <apx-chart
              [series]="healthChartOptions.series!"
              [chart]="healthChartOptions.chart!"
              [labels]="healthChartOptions.labels!"
              [colors]="healthChartOptions.colors!"
              [legend]="healthChartOptions.legend!"
              [stroke]="healthChartOptions.stroke!"
              [plotOptions]="healthChartOptions.plotOptions!"
              [dataLabels]="healthChartOptions.dataLabels!">
            </apx-chart>
          </mat-card-content>
        </mat-card>

        <!-- Asset Type Bar Chart -->
        <mat-card class="chart-card glass-panel">
          <mat-card-header class="chart-header">
            <div class="title-row">
              <div class="indicator-dot dot-cyan"></div>
              <mat-card-title class="chart-title">Asset Inventory Breakdown</mat-card-title>
            </div>
          </mat-card-header>
          <mat-card-content class="chart-content-area">
            <apx-chart
              [series]="assetChartOptions.series!"
              [chart]="assetChartOptions.chart!"
              [xaxis]="assetChartOptions.xaxis!"
              [plotOptions]="assetChartOptions.plotOptions!"
              [colors]="assetChartOptions.colors!"
              [dataLabels]="assetChartOptions.dataLabels!"
              [stroke]="assetChartOptions.stroke!"
              [grid]="assetChartOptions.grid!"
              [legend]="assetChartOptions.legend!"
              [tooltip]="assetChartOptions.tooltip!">
            </apx-chart>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Bottom Layout: Recent Assets and Info -->
      <div class="details-grid">
        <!-- Recent Assets Table -->
        <mat-card class="details-card glass-panel">
          <mat-card-header class="details-header">
            <div class="title-row">
              <div class="indicator-dot dot-amber"></div>
              <mat-card-title class="chart-title">Recently Mapped Assets</mat-card-title>
            </div>
            <button mat-button color="primary" routerLink="/map" class="view-all-btn">View All Map</button>
          </mat-card-header>
          <mat-card-content class="activity-content">
            <div class="activity-feed">
              <div *ngFor="let item of recentAssets()" class="activity-item">
                <div class="activity-left-accent" [ngClass]="item.type.toLowerCase()"></div>
                <div class="activity-icon-container" [ngClass]="item.type.toLowerCase()">
                  <mat-icon>{{ getAssetIcon(item.type) }}</mat-icon>
                </div>
                <div class="activity-details">
                  <p class="activity-name">{{ item.name }}</p>
                  <p class="activity-meta">Mapped on {{ item.date }} by {{ item.by }}</p>
                </div>
                <span class="activity-status" [ngClass]="item.status.toLowerCase()">
                  {{ item.status }}
                </span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Moringa Plantation Info Guide -->
        <mat-card class="details-card info-card-bg glass-panel">
          <mat-card-content class="info-content">
            <h2 class="info-title">Moringa Oleifera Mapping Guide</h2>
            <p class="info-text">
              Moringa plantations require tracking of age, irrigation zones, and health indices. 
              Our Digital Twin utilizes physical point markers, precise flow meter integration, and valve zone mapping to monitor soil hydration patterns.
            </p>
            <div class="guide-steps">
              <div class="step">
                <div class="step-num-container">
                  <div class="step-num">1</div>
                  <div class="step-line"></div>
                </div>
                <div class="step-desc">
                  <strong>Create Farm Boundary</strong>
                  <span>Walk perimeter using the mobile application GPS boundary capture.</span>
                </div>
              </div>
              <div class="step">
                <div class="step-num-container">
                  <div class="step-num">2</div>
                  <div class="step-line"></div>
                </div>
                <div class="step-desc">
                  <strong>Map Pipelines & Valves</strong>
                  <span>Record paths along lateral irrigation lines to map flow networks.</span>
                </div>
              </div>
              <div class="step">
                <div class="step-num-container">
                  <div class="step-num">3</div>
                </div>
                <div class="step-desc">
                  <strong>Tag Moringa Trees</strong>
                  <span>Capture photo, log species, age, and health details on-site.</span>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      display: flex;
      flex-direction: column;
      gap: 28px;
    }

    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .page-title {
      font-size: 30px;
      font-weight: 800;
      margin: 0;
      letter-spacing: -0.8px;
      background: linear-gradient(to right, #ffffff, #cbd5e1);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .page-subtitle {
      font-size: 14px;
      color: var(--text-secondary);
      margin: 6px 0 0 0;
      font-weight: 400;
    }

    .map-shortcut-btn {
      background: linear-gradient(90deg, var(--color-primary), #059669) !important;
      box-shadow: 0 6px 20px rgba(16, 185, 129, 0.3) !important;
      font-weight: 600 !important;
      padding: 22px 20px !important;
      border-radius: 12px !important;
      transition: var(--transition-normal) !important;
    }

    .map-shortcut-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(16, 185, 129, 0.45) !important;
    }

    .map-shortcut-btn mat-icon {
      margin-right: 8px;
    }

    /* KPI Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 20px;
    }

    .kpi-card {
      border: 1px solid rgba(255, 255, 255, 0.04) !important;
      background: linear-gradient(135deg, rgba(10, 15, 29, 0.5) 0%, rgba(5, 7, 14, 0.3) 100%) !important;
      backdrop-filter: blur(24px) !important;
      border-radius: 20px !important;
      transition: var(--transition-normal) !important;
      box-shadow: var(--shadow-md), inset 0 0 12px rgba(255, 255, 255, 0.01) !important;
    }

    .kpi-card:hover {
      transform: translateY(-4px);
    }
    .kpi-card.stat-farms:hover { border-color: rgba(59, 130, 246, 0.25) !important; box-shadow: var(--shadow-lg), 0 0 25px rgba(59, 130, 246, 0.12) !important; }
    .kpi-card.stat-area:hover { border-color: rgba(168, 85, 247, 0.25) !important; box-shadow: var(--shadow-lg), 0 0 25px rgba(168, 85, 247, 0.12) !important; }
    .kpi-card.stat-trees:hover { border-color: rgba(16, 185, 129, 0.25) !important; box-shadow: var(--shadow-lg), 0 0 25px rgba(16, 185, 129, 0.12) !important; }
    .kpi-card.stat-pipelines:hover { border-color: rgba(6, 182, 212, 0.25) !important; box-shadow: var(--shadow-lg), 0 0 25px rgba(6, 182, 212, 0.12) !important; }
    .kpi-card.stat-valves:hover { border-color: rgba(245, 158, 11, 0.25) !important; box-shadow: var(--shadow-lg), 0 0 25px rgba(245, 158, 11, 0.12) !important; }
    .kpi-card.stat-pumps:hover { border-color: rgba(244, 63, 94, 0.25) !important; box-shadow: var(--shadow-lg), 0 0 25px rgba(244, 63, 94, 0.12) !important; }

    .kpi-content {
      display: flex;
      align-items: center;
      gap: 18px;
      padding: 22px !important;
    }

    .kpi-icon-wrapper {
      width: 52px;
      height: 52px;
      border-radius: 16px;
      display: flex;
      justify-content: center;
      align-items: center;
      box-shadow: 0 8px 20px -4px rgba(0, 0, 0, 0.3);
    }

    .kpi-icon-wrapper mat-icon {
      font-size: 26px;
      width: 26px;
      height: 26px;
    }

    .kpi-data {
      display: flex;
      flex-direction: column;
      flex-grow: 1;
    }

    .kpi-label {
      font-size: 13px;
      color: var(--text-muted);
      font-weight: 500;
      font-family: var(--font-secondary);
      letter-spacing: 0.1px;
    }

    .kpi-value-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-top: 4px;
    }

    .kpi-value {
      font-size: 26px;
      font-weight: 800;
      color: var(--text-primary);
      letter-spacing: -0.5px;
    }

    .kpi-value .unit {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-muted);
      margin-left: 2px;
    }

    .trend-badge {
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 8px;
      font-family: var(--font-secondary);
    }

    .trend-up {
      background-color: rgba(16, 185, 129, 0.08);
      color: var(--color-primary);
    }

    .trend-info {
      background-color: rgba(6, 182, 212, 0.08);
      color: var(--color-accent);
    }

    .trend-neutral {
      background-color: rgba(255, 255, 255, 0.05);
      color: var(--text-muted);
    }

    /* KPI color accents */
    .stat-farms .kpi-icon-wrapper { background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.05)); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.1); }
    .stat-area .kpi-icon-wrapper { background: linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(168, 85, 247, 0.05)); color: var(--color-purple); border: 1px solid rgba(168, 85, 247, 0.1); }
    .stat-trees .kpi-icon-wrapper { background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.05)); color: var(--color-primary); border: 1px solid rgba(16, 185, 129, 0.1); }
    .stat-pipelines .kpi-icon-wrapper { background: linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(6, 182, 212, 0.05)); color: var(--color-accent); border: 1px solid rgba(6, 182, 212, 0.1); }
    .stat-valves .kpi-icon-wrapper { background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.05)); color: var(--color-warning); border: 1px solid rgba(245, 158, 11, 0.1); }
    .stat-pumps .kpi-icon-wrapper { background: linear-gradient(135deg, rgba(244, 63, 94, 0.15), rgba(244, 63, 94, 0.05)); color: var(--color-danger); border: 1px solid rgba(244, 63, 94, 0.1); }

    /* Charts Grid */
    .charts-grid {
      display: grid;
      grid-template-columns: 1fr 1.4fr;
      gap: 24px;
    }

    .chart-card {
      padding: 24px;
    }

    .chart-header {
      padding: 0 0 16px 0 !important;
    }

    .title-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .indicator-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .dot-green { background-color: var(--color-primary); box-shadow: 0 0 8px var(--color-primary); }
    .dot-cyan { background-color: var(--color-accent); box-shadow: 0 0 8px var(--color-accent); }
    .dot-amber { background-color: var(--color-warning); box-shadow: 0 0 8px var(--color-warning); }

    .chart-title {
      font-size: 17px !important;
      font-weight: 700 !important;
      color: var(--text-primary);
      letter-spacing: -0.3px;
    }

    .chart-content-area {
      padding: 12px 0 0 0 !important;
    }

    /* Details Grid */
    .details-grid {
      display: grid;
      grid-template-columns: 1.4fr 1fr;
      gap: 24px;
    }

    .details-card {
      padding: 24px;
    }

    .details-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 0 20px 0 !important;
    }

    .view-all-btn {
      font-weight: 600 !important;
      color: var(--color-primary) !important;
    }

    .activity-content {
      padding: 0 !important;
    }

    .activity-feed {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .activity-item {
      position: relative;
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 18px;
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.01);
      border: 1px solid rgba(255, 255, 255, 0.03);
      transition: var(--transition-normal);
      overflow: hidden;
    }

    .activity-item:hover {
      background: rgba(255, 255, 255, 0.03);
      border-color: rgba(255, 255, 255, 0.08);
      transform: translateX(4px);
    }

    .activity-left-accent {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      border-radius: 0 4px 4px 0;
    }

    .activity-left-accent.tree { background-color: var(--color-primary); }
    .activity-left-accent.pipeline { background-color: var(--color-accent); }
    .activity-left-accent.valve { background-color: var(--color-warning); }
    .activity-left-accent.farm { background-color: #3b82f6; }

    .activity-icon-container {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-shrink: 0;
    }

    .activity-icon-container mat-icon {
      font-size: 22px;
      width: 22px;
      height: 22px;
    }

    .activity-icon-container.tree { background: rgba(16, 185, 129, 0.08); color: var(--color-primary); }
    .activity-icon-container.pipeline { background: rgba(6, 182, 212, 0.08); color: var(--color-accent); }
    .activity-icon-container.valve { background: rgba(245, 158, 11, 0.08); color: var(--color-warning); }
    .activity-icon-container.farm { background: rgba(59, 130, 246, 0.08); color: #3b82f6; }

    .activity-details {
      flex: 1;
    }

    .activity-name {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .activity-meta {
      margin: 4px 0 0 0;
      font-size: 11px;
      color: var(--text-muted);
      font-family: var(--font-secondary);
    }

    .activity-status {
      font-size: 11px;
      font-weight: 600;
      padding: 3px 10px;
      border-radius: 8px;
      text-transform: uppercase;
      font-family: var(--font-secondary);
      letter-spacing: 0.2px;
    }

    .activity-status.active, .activity-status.healthy {
      background-color: rgba(16, 185, 129, 0.08);
      color: var(--color-primary);
      border: 1px solid rgba(16, 185, 129, 0.15);
    }

    .activity-status.stressed {
      background-color: rgba(245, 158, 11, 0.08);
      color: var(--color-warning);
      border: 1px solid rgba(245, 158, 11, 0.15);
    }

    .activity-status.operational {
      background-color: rgba(6, 182, 212, 0.08);
      color: var(--color-accent);
      border: 1px solid rgba(6, 182, 212, 0.15);
    }

    /* Moringa plantation Info Card */
    .info-card-bg {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.06), rgba(10, 17, 32, 0.4)) !important;
      border: 1px solid rgba(16, 185, 129, 0.12) !important;
    }

    .info-content {
      padding: 8px !important;
    }

    .info-title {
      font-size: 19px;
      font-weight: 700;
      color: var(--color-primary);
      margin: 0 0 14px 0;
      letter-spacing: -0.2px;
    }

    .info-text {
      font-size: 13px;
      line-height: 1.6;
      color: var(--text-secondary);
      margin-bottom: 24px;
      font-family: var(--font-secondary);
    }

    .guide-steps {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .step {
      display: flex;
      align-items: flex-start;
      gap: 16px;
    }

    .step-num-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex-shrink: 0;
    }

    .step-num {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--color-primary), #059669);
      color: white;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 13px;
      font-weight: 800;
      box-shadow: 0 0 15px rgba(16, 185, 129, 0.3);
    }

    .step-line {
      width: 2px;
      height: 32px;
      background: rgba(16, 185, 129, 0.15);
      margin-top: 4px;
    }

    .step-desc {
      font-size: 13px;
      color: var(--text-secondary);
      font-family: var(--font-secondary);
    }

    .step-desc strong {
      display: block;
      color: var(--text-primary);
      margin-bottom: 3px;
      font-family: var(--font-primary);
      font-size: 14px;
    }

    @media (max-width: 1024px) {
      .charts-grid, .details-grid {
        grid-template-columns: 1fr;
      }
      .step-line {
        display: none;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  // Inject services
  private readonly farmService = inject(FarmService);
  private readonly treeService = inject(TreeService);
  private readonly pipelineService = inject(PipelineService);
  private readonly valveService = inject(ValveService);
  private readonly pumpService = inject(PumpService);
  private readonly tankService = inject(TankService);
  private readonly infraService = inject(InfrastructureService);

  // Signals
  readonly stats = signal({
    farms: 0,
    area: 0,
    trees: 0,
    pipelinesLength: 0,
    valves: 0,
    activeValvesPercent: 0,
    pumps: 0,
    tanks: 0
  });

  readonly recentAssets = signal<any[]>([]);

  // ApexCharts configurations
  healthChartOptions: {
    series: number[];
    chart: ApexChart;
    labels: string[];
    colors: string[];
    legend: ApexLegend;
    dataLabels: ApexDataLabels;
    stroke: ApexStroke;
    plotOptions: ApexPlotOptions;
  } = {
    series: [0, 0, 0, 0], // Healthy, Stressed, Diseased, Dead
    chart: {
      type: 'donut',
      height: 320,
      foreColor: '#94a3b8',
      background: 'transparent',
      dropShadow: {
        enabled: true,
        blur: 8,
        opacity: 0.15,
        top: 2,
        left: 2
      }
    },
    labels: ['Healthy', 'Stressed', 'Diseased', 'Dead'],
    colors: ['#10b981', '#f59e0b', '#ef4444', '#64748b'],
    stroke: {
      colors: ['#0a0f1d'],
      width: 2
    },
    legend: {
      position: 'bottom',
      labels: {
        colors: '#cbd5e1'
      }
    },
    dataLabels: {
      enabled: false
    },
    plotOptions: {
      pie: {
        donut: {
          size: '72%',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '13px',
              fontFamily: 'Outfit, sans-serif',
              color: '#64748b',
              offsetY: -4
            },
            value: {
              show: true,
              fontSize: '22px',
              fontFamily: 'Outfit, sans-serif',
              fontWeight: '800',
              color: '#f8fafc',
              offsetY: 8,
              formatter: (val) => val.toString()
            },
            total: {
              show: true,
              label: 'Total Trees',
              color: '#64748b',
              formatter: () => '0'
            }
          }
        }
      }
    }
  };

  assetChartOptions: {
    series: { name: string; data: number[] }[];
    chart: ApexChart;
    xaxis: ApexXAxis;
    colors: string[];
    plotOptions: ApexPlotOptions;
    dataLabels: ApexDataLabels;
    stroke: ApexStroke;
    tooltip: ApexTooltip;
    grid: any;
    legend: ApexLegend;
  } = {
    series: [
      {
        name: 'Mapped Count',
        data: [0, 0, 0, 0, 0, 0] // Farms, Trees, Valves, Pumps, Tanks, Infrastructures
      }
    ],
    chart: {
      type: 'bar',
      height: 320,
      toolbar: { show: false },
      foreColor: '#94a3b8',
      background: 'transparent'
    },
    colors: ['#3b82f6', '#10b981', '#f59e0b', '#06b6d4', '#ef4444', '#a855f7'],
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 6,
        barHeight: '52%',
        distributed: true
      }
    },
    dataLabels: {
      enabled: true,
      textAnchor: 'start',
      style: {
        colors: ['#f8fafc'],
        fontSize: '11px',
        fontFamily: 'Inter, sans-serif',
        fontWeight: '600'
      },
      formatter: (val: any) => `  ${val}`,
      offsetX: 0
    },
    xaxis: {
      categories: ['Farms', 'Trees', 'Valves', 'Pumps', 'Tanks', 'Infrastructure'],
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    stroke: {
      show: true,
      width: 1,
      colors: ['transparent']
    },
    grid: {
      borderColor: 'rgba(255, 255, 255, 0.04)',
      strokeDashArray: 4,
      xaxis: {
        lines: { show: true }
      },
      yaxis: {
        lines: { show: false }
      }
    },
    legend: {
      show: false
    },
    tooltip: {
      theme: 'dark',
      style: {
        fontSize: '12px',
        fontFamily: 'Outfit, sans-serif'
      }
    }
  };

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    forkJoin({
      farms: this.farmService.getAllFarms(),
      trees: this.treeService.getAllTrees(),
      pipelines: this.pipelineService.getAllPipelines(),
      valves: this.valveService.getAllValves(),
      pumps: this.pumpService.getAllPumps(),
      tanks: this.tankService.getAllTanks(),
      infra: this.infraService.getAllInfrastructure()
    }).subscribe({
      next: (data) => {
        const totalArea = data.farms.reduce((acc, farm) => acc + (farm.area || 0), 0);
        const totalPipelineLength = data.pipelines.reduce((acc, pipe) => acc + (pipe.length || 0), 0);
        
        const activeValves = data.valves.filter((v: any) => v.status !== 'DAMAGED').length;
        const activeValvesPercent = data.valves.length > 0 ? Math.round((activeValves / data.valves.length) * 100) : 0;

        // Update stats signal
        this.stats.set({
          farms: data.farms.length,
          area: parseFloat(totalArea.toFixed(1)),
          trees: data.trees.length,
          pipelinesLength: Math.round(totalPipelineLength),
          valves: data.valves.length,
          activeValvesPercent,
          pumps: data.pumps.length,
          tanks: data.tanks.length
        });

        // Calculate tree health status counts
        let healthy = 0;
        let stressed = 0;
        let diseased = 0;
        let dead = 0;

        data.trees.forEach((t: any) => {
          const status = (t.healthStatus || 'HEALTHY').toUpperCase();
          if (status === 'HEALTHY') healthy++;
          else if (status === 'STRESSED') stressed++;
          else if (status === 'DISEASED') diseased++;
          else if (status === 'DEAD') dead++;
        });

        // Update health pie chart series
        this.healthChartOptions = {
          ...this.healthChartOptions,
          series: [healthy, stressed, diseased, dead],
          plotOptions: {
            ...this.healthChartOptions.plotOptions,
            pie: {
              ...this.healthChartOptions.plotOptions?.pie,
              donut: {
                ...this.healthChartOptions.plotOptions?.pie?.donut,
                labels: {
                  ...this.healthChartOptions.plotOptions?.pie?.donut?.labels,
                  total: {
                    ...this.healthChartOptions.plotOptions?.pie?.donut?.labels?.total,
                    formatter: () => data.trees.length.toLocaleString()
                  }
                }
              }
            }
          }
        };

        // Update asset chart series
        this.assetChartOptions = {
          ...this.assetChartOptions,
          series: [
            {
              name: 'Mapped Count',
              data: [
                data.farms.length,
                data.trees.length,
                data.valves.length,
                data.pumps.length,
                data.tanks.length,
                data.infra.length
              ]
            }
          ]
        };

        // Update recent assets signal
        const allAssets: any[] = [];

        data.farms.forEach((f: any) => {
          allAssets.push({
            type: 'Farm',
            name: f.name,
            date: f.createdAt ? f.createdAt.substring(0, 10) : 'N/A',
            by: 'operator',
            status: f.status || 'Active',
            timestamp: f.createdAt ? new Date(f.createdAt).getTime() : 0
          });
        });

        data.trees.forEach((t: any) => {
          allAssets.push({
            type: 'Tree',
            name: `Tree #${t.treeNumber} (${t.species})`,
            date: t.createdAt ? t.createdAt.substring(0, 10) : 'N/A',
            by: 'operator',
            status: t.healthStatus || 'Healthy',
            timestamp: t.createdAt ? new Date(t.createdAt).getTime() : 0
          });
        });

        data.pipelines.forEach((p: any) => {
          allAssets.push({
            type: 'Pipeline',
            name: p.name,
            date: p.createdAt ? p.createdAt.substring(0, 10) : 'N/A',
            by: 'operator',
            status: p.status || 'Active',
            timestamp: p.createdAt ? new Date(p.createdAt).getTime() : 0
          });
        });

        data.valves.forEach((v: any) => {
          allAssets.push({
            type: 'Valve',
            name: `Valve ${v.valveNumber}`,
            date: v.createdAt ? v.createdAt.substring(0, 10) : 'N/A',
            by: 'operator',
            status: v.status || 'Active',
            timestamp: v.createdAt ? new Date(v.createdAt).getTime() : 0
          });
        });

        data.pumps.forEach((pu: any) => {
          allAssets.push({
            type: 'Pump',
            name: pu.name,
            date: pu.createdAt ? pu.createdAt.substring(0, 10) : 'N/A',
            by: 'operator',
            status: pu.status || 'Active',
            timestamp: pu.createdAt ? new Date(pu.createdAt).getTime() : 0
          });
        });

        data.tanks.forEach((ta: any) => {
          allAssets.push({
            type: 'Tank',
            name: ta.name,
            date: ta.createdAt ? ta.createdAt.substring(0, 10) : 'N/A',
            by: 'operator',
            status: ta.status || 'Active',
            timestamp: ta.createdAt ? new Date(ta.createdAt).getTime() : 0
          });
        });

        data.infra.forEach((infr: any) => {
          allAssets.push({
            type: 'Infrastructure',
            name: infr.name,
            date: infr.createdAt ? infr.createdAt.substring(0, 10) : 'N/A',
            by: 'operator',
            status: infr.status || 'Active',
            timestamp: infr.createdAt ? new Date(infr.createdAt).getTime() : 0
          });
        });

        // Sort all assets by timestamp descending.
        allAssets.sort((a, b) => b.timestamp - a.timestamp);

        this.recentAssets.set(allAssets.slice(0, 5));
      },
      error: (err) => {
        console.error('Failed to load dashboard data from backend:', err);
        this.resetStatsToZero();
      }
    });
  }

  private resetStatsToZero(): void {
    this.stats.set({
      farms: 0,
      area: 0,
      trees: 0,
      pipelinesLength: 0,
      valves: 0,
      activeValvesPercent: 0,
      pumps: 0,
      tanks: 0
    });
    this.recentAssets.set([]);
    this.healthChartOptions = {
      ...this.healthChartOptions,
      series: [0, 0, 0, 0],
      plotOptions: {
        ...this.healthChartOptions.plotOptions,
        pie: {
          ...this.healthChartOptions.plotOptions?.pie,
          donut: {
            ...this.healthChartOptions.plotOptions?.pie?.donut,
            labels: {
              ...this.healthChartOptions.plotOptions?.pie?.donut?.labels,
              total: {
                ...this.healthChartOptions.plotOptions?.pie?.donut?.labels?.total,
                formatter: () => '0'
              }
            }
          }
        }
      }
    };
    this.assetChartOptions = {
      ...this.assetChartOptions,
      series: [
        {
          name: 'Mapped Count',
          data: [0, 0, 0, 0, 0, 0]
        }
      ]
    };
  }

  getAssetIcon(type: string): string {
    switch (type.toLowerCase()) {
      case 'tree': return 'park';
      case 'pipeline': return 'water_damage';
      case 'valve': return 'adjust';
      case 'farm': return 'agriculture';
      default: return 'help_outline';
    }
  }
}
