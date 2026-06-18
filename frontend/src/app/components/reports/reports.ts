import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ReportService } from '../../services/report.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressBarModule
  ],
  template: `
    <div class="reports-container">
      <div class="header-section">
        <h1 class="page-title">GIS Reports & Audits</h1>
        <p class="page-subtitle">Export structural tallies, tree health distributions, and irrigation logs</p>
      </div>

      <div class="reports-grid">
        <!-- Excel Roster Card -->
        <mat-card class="report-card glass-panel hover-glow">
          <div class="card-header-accent xls">
            <mat-icon>table_chart</mat-icon>
          </div>
          <mat-card-header>
            <mat-card-title class="card-title">Spreadsheet Roster (Excel)</mat-card-title>
            <mat-card-subtitle class="card-subtitle">Complete Inventory Logs</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content class="card-content">
            <p>
              Generates a multi-sheet Microsoft Excel workbook containing full records of:
            </p>
            <ul class="report-bullets">
              <li>Farms perimeters and calculated acreage.</li>
              <li>Moringa tree listing (species, age, health status, and coordinates).</li>
              <li>Irrigation pipelines (diameter, material, and lengths).</li>
            </ul>
            
            <mat-progress-bar *ngIf="xlsLoading()" mode="indeterminate" class="loader"></mat-progress-bar>
          </mat-card-content>
          <mat-card-actions class="card-actions">
            <button mat-flat-button color="primary" class="download-btn xls" [disabled]="xlsLoading()" (click)="downloadExcel()">
              <mat-icon>download</mat-icon>
              <span>Download Excel (.xlsx)</span>
            </button>
          </mat-card-actions>
        </mat-card>

        <!-- PDF Summary Card -->
        <mat-card class="report-card glass-panel hover-glow">
          <div class="card-header-accent pdf">
            <mat-icon>picture_as_pdf</mat-icon>
          </div>
          <mat-card-header>
            <mat-card-title class="card-title">Audit Summary Report (PDF)</mat-card-title>
            <mat-card-subtitle class="card-subtitle">Executive Layout Audit</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content class="card-content">
            <p>
              Generates a beautifully formatted PDF document summarizing:
            </p>
            <ul class="report-bullets">
              <li>High-level KPI metrics (total trees, valves, tanks, and acreage).</li>
              <li>A compact table of farm ownership and status logs.</li>
              <li>System audit timestamp and operator details.</li>
            </ul>

            <mat-progress-bar *ngIf="pdfLoading()" mode="indeterminate" class="loader"></mat-progress-bar>
          </mat-card-content>
          <mat-card-actions class="card-actions">
            <button mat-flat-button color="primary" class="download-btn pdf" [disabled]="pdfLoading()" (click)="downloadPdf()">
              <mat-icon>download</mat-icon>
              <span>Download PDF (.pdf)</span>
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .reports-container {
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

    .reports-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 24px;
    }

    .report-card {
      padding: 24px;
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .card-header-accent {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 16px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.15);
    }

    .card-header-accent mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
      color: white;
    }

    .card-header-accent.xls { background-color: #10b981; }
    .card-header-accent.pdf { background-color: #ef4444; }

    .card-title {
      font-size: 16px !important;
      font-weight: 600 !important;
      color: var(--text-primary);
    }

    .card-subtitle {
      color: var(--text-secondary) !important;
      font-size: 12px !important;
    }

    .card-content {
      flex: 1;
      padding: 16px 0 !important;
      font-family: var(--font-secondary);
      font-size: 13px;
      line-height: 1.6;
      color: var(--text-secondary);
    }

    .report-bullets {
      margin: 8px 0 0 0;
      padding-left: 20px;
      color: var(--text-muted);
    }

    .loader {
      margin-top: 12px;
    }

    .card-actions {
      padding: 0 !important;
    }

    .download-btn {
      width: 100%;
      padding: 20px 0 !important;
      border-radius: 8px !important;
      font-weight: 500 !important;
    }

    .download-btn.xls { background: linear-gradient(90deg, #10b981, #059669) !important; }
    .download-btn.pdf { background: linear-gradient(90deg, #ef4444, #dc2626) !important; }
  `]
})
export class ReportsComponent {
  private readonly reportService = inject(ReportService);

  readonly xlsLoading = signal(false);
  readonly pdfLoading = signal(false);

  downloadExcel(): void {
    this.xlsLoading.set(true);
    this.reportService.downloadExcelReport().subscribe({
      next: (blob) => {
        this.saveFile(blob, 'farm_digital_twin_report.xlsx');
        this.xlsLoading.set(false);
      },
      error: () => {
        console.error('Failed to download Excel report');
        this.xlsLoading.set(false);
      }
    });
  }

  downloadPdf(): void {
    this.pdfLoading.set(true);
    this.reportService.downloadPdfReport().subscribe({
      next: (blob) => {
        this.saveFile(blob, 'farm_digital_twin_summary.pdf');
        this.pdfLoading.set(false);
      },
      error: () => {
        console.error('Failed to download PDF report');
        this.pdfLoading.set(false);
      }
    });
  }

  private saveFile(blob: Blob, fileName: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}
