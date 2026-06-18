import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatDividerModule, MatIconModule],
  template: `
    <div class="settings-container">
      <div class="header-section">
        <h1 class="page-title">Account Settings</h1>
        <p class="page-subtitle">Manage profiles, security credentials, and roles</p>
      </div>

      <mat-card class="settings-card glass-panel" *ngIf="authService.currentUser() as user">
        <mat-card-header>
          <div class="user-avatar">
            {{ user.username.substring(0, 2).toUpperCase() }}
          </div>
          <mat-card-title class="username">{{ user.username }}</mat-card-title>
          <mat-card-subtitle class="role-badge">{{ formatRole(user.role) }}</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content class="profile-details">
          <mat-divider></mat-divider>
          
          <div class="detail-item">
            <mat-icon>person</mat-icon>
            <div>
              <label>Username</label>
              <span>{{ user.username }}</span>
            </div>
          </div>

          <div class="detail-item">
            <mat-icon>email</mat-icon>
            <div>
              <label>Email Address</label>
              <span>{{ user.email }}</span>
            </div>
          </div>

          <div class="detail-item">
            <mat-icon>security</mat-icon>
            <div>
              <label>Authorized Role</label>
              <span>{{ user.role }}</span>
            </div>
          </div>

          <div class="detail-item">
            <mat-icon>fingerprint</mat-icon>
            <div>
              <label>Operator Token ID</label>
              <code>USR-00{{ user.userId }}</code>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .settings-container {
      display: flex;
      flex-direction: column;
      gap: 24px;
      max-width: 600px;
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

    .settings-card {
      padding: 24px;
    }

    .user-avatar {
      width: 64px;
      height: 64px;
      border-radius: 16px;
      background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
      color: white;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 20px;
      font-weight: 700;
      box-shadow: 0 8px 16px rgba(16, 185, 129, 0.25);
      margin-right: 16px;
    }

    .username {
      font-size: 20px !important;
      font-weight: 700 !important;
      color: var(--text-primary);
    }

    .role-badge {
      font-size: 12px !important;
      color: var(--color-primary) !important;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.5px;
    }

    .profile-details {
      padding: 16px 0 0 0 !important;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .detail-item mat-icon {
      color: var(--text-muted);
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .detail-item label {
      display: block;
      font-size: 11px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }

    .detail-item span {
      font-size: 14px;
      color: var(--text-primary);
    }

    .detail-item code {
      font-size: 13px;
      color: var(--color-accent);
      background-color: rgba(14, 165, 233, 0.1);
      padding: 2px 6px;
      border-radius: 4px;
    }
  `]
})
export class SettingsComponent {
  readonly authService = inject(AuthService);

  formatRole(role: string): string {
    return role.replace('_', ' ');
  }
}
