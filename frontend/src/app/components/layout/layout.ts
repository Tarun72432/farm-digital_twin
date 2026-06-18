import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule
  ],
  template: `
    <mat-sidenav-container class="app-container">
      <!-- Sidebar Navigation (Full Height on Left) -->
      <mat-sidenav #sidenav [opened]="sidenavOpen()" mode="side" class="sidebar">
        <!-- Sidebar Header with Logo -->
        <div class="sidebar-header">
          <div class="logo-area">
            <span class="logo-text">Moringa Twin</span>
            <span class="logo-subtitle">Field Station Alpha</span>
          </div>
        </div>

        <div class="add-asset-wrapper">
          <button mat-flat-button color="primary" class="add-asset-btn" routerLink="/map">
            <mat-icon>add</mat-icon>
            <span>Add Asset</span>
          </button>
        </div>

        <mat-nav-list class="nav-list">
          <a mat-list-item routerLink="/dashboard" routerLinkActive="active-link" class="nav-item">
            <mat-icon matListItemIcon>dashboard</mat-icon>
            <span matListItemTitle>Dashboard</span>
          </a>

          <a mat-list-item routerLink="/map" routerLinkActive="active-link" class="nav-item">
            <mat-icon matListItemIcon>map</mat-icon>
            <span matListItemTitle>GIS Interactive Map</span>
          </a>

          <div class="section-title">Farm Assets</div>

          <a mat-list-item routerLink="/farms" routerLinkActive="active-link" class="nav-item">
            <mat-icon matListItemIcon>agriculture</mat-icon>
            <span matListItemTitle>Farms</span>
          </a>

          <a mat-list-item routerLink="/trees" routerLinkActive="active-link" class="nav-item">
            <mat-icon matListItemIcon>park</mat-icon>
            <span matListItemTitle>Trees</span>
          </a>

          <a mat-list-item routerLink="/pipelines" routerLinkActive="active-link" class="nav-item">
            <mat-icon matListItemIcon>linear_scale</mat-icon>
            <span matListItemTitle>Pipelines</span>
          </a>

          <a mat-list-item routerLink="/valves" routerLinkActive="active-link" class="nav-item">
            <mat-icon matListItemIcon>opacity</mat-icon>
            <span matListItemTitle>Irrigation</span>
          </a>

          <a mat-list-item routerLink="/infrastructure" routerLinkActive="active-link" class="nav-item">
            <mat-icon matListItemIcon>business</mat-icon>
            <span matListItemTitle>Infrastructure</span>
          </a>

          <div class="bottom-spacer"></div>

          <a mat-list-item routerLink="/settings" routerLinkActive="active-link" class="nav-item bottom-link">
            <mat-icon matListItemIcon>settings</mat-icon>
            <span matListItemTitle>Settings</span>
          </a>

          <a mat-list-item class="nav-item bottom-link">
            <mat-icon matListItemIcon>help_outline</mat-icon>
            <span matListItemTitle>Support</span>
          </a>
        </mat-nav-list>
      </mat-sidenav>

      <!-- Main Shell Content Area (Right Side) -->
      <mat-sidenav-content class="main-content">
        <!-- Top Toolbar Header -->
        <header class="top-toolbar">
          <button mat-icon-button (click)="toggleSidenav()" class="toolbar-btn">
            <mat-icon>menu</mat-icon>
          </button>

          <!-- Search Container -->
          <div class="search-container">
            <mat-icon class="search-icon">search</mat-icon>
            <input type="text" placeholder="Search..." class="search-input">
          </div>

          <span class="spacer"></span>

          <!-- Header Action Icons & Profile -->
          <div class="user-actions" *ngIf="authService.currentUser() as user">
            <button mat-icon-button class="action-btn">
              <mat-icon>mail_outline</mat-icon>
            </button>
            <button mat-icon-button class="action-btn">
              <mat-icon>notifications_none</mat-icon>
            </button>
            <button mat-icon-button [matMenuTriggerFor]="profileMenu" class="avatar-btn">
              <div class="avatar">{{ user.username.substring(0, 2).toUpperCase() }}</div>
            </button>
            <mat-menu #profileMenu="matMenu" xPosition="before" class="dark-menu">
              <div class="menu-header">
                <p class="menu-name">{{ user.username }}</p>
                <p class="menu-email">{{ user.email }}</p>
              </div>
              <hr class="menu-divider">
              <button mat-menu-item routerLink="/settings">
                <mat-icon>settings</mat-icon>
                <span>Account Settings</span>
              </button>
              <button mat-menu-item (click)="onLogout()">
                <mat-icon>exit_to_app</mat-icon>
                <span>Sign Out</span>
              </button>
            </mat-menu>
          </div>
        </header>

        <!-- Dynamic router content page -->
        <div class="content-wrapper">
          <router-outlet></router-outlet>
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .app-container {
      height: 100vh;
      background-color: var(--color-bg) !important;
    }

    /* Left Sidebar Navigation */
    .sidebar {
      width: 250px;
      background-color: var(--color-sidebar) !important;
      border-right: 1px solid var(--color-border) !important;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
    }

    .sidebar-header {
      padding: 24px 20px 12px 24px;
    }

    .logo-area {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .logo-text {
      font-family: var(--font-primary);
      font-weight: 800;
      font-size: 24px;
      letter-spacing: -0.6px;
      color: var(--color-primary);
    }

    .logo-subtitle {
      font-family: var(--font-secondary);
      font-size: 11.5px;
      color: var(--text-muted);
      font-weight: 500;
    }

    .add-asset-wrapper {
      padding: 12px 20px 24px 20px;
    }

    .add-asset-btn {
      width: 100%;
      height: 48px !important;
      background: var(--color-primary) !important;
      color: var(--color-bg) !important;
      font-family: var(--font-primary) !important;
      font-weight: 700 !important;
      font-size: 14px !important;
      border-radius: var(--radius-control) !important;
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.15) !important;
      transition: var(--transition-normal) !important;
    }

    .add-asset-btn:hover {
      background: var(--color-primary-hover) !important;
      transform: translateY(-1px);
    }

    .add-asset-btn mat-icon {
      margin-right: 6px;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .nav-list {
      padding: 0 16px;
      display: flex;
      flex-direction: column;
      height: calc(100% - 150px);
    }

    .section-title {
      font-size: 10px;
      color: var(--text-muted);
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 20px 0 8px 12px;
    }

    .nav-item {
      border-radius: var(--radius-control) !important;
      margin-bottom: 4px;
      color: var(--text-secondary) !important;
      transition: var(--transition-normal);
      height: 46px !important;
      border: 1px solid transparent;
    }

    ::ng-deep .nav-item .mat-mdc-list-item-title {
      color: inherit !important;
    }

    .nav-item mat-icon {
      color: var(--text-muted) !important;
      transition: var(--transition-normal);
    }

    .nav-item:hover {
      background-color: rgba(255, 255, 255, 0.02) !important;
      color: var(--text-primary) !important;
    }

    .nav-item:hover mat-icon {
      color: var(--text-primary) !important;
    }

    .active-link {
      background-color: #0e1828 !important;
      color: var(--text-primary) !important;
      border: 1px solid var(--color-border) !important;
      border-left: 3px solid var(--color-primary) !important;
      border-radius: 0 var(--radius-control) var(--radius-control) 0 !important;
    }

    .active-link mat-icon {
      color: var(--color-primary) !important;
    }

    .bottom-spacer {
      flex-grow: 1;
    }

    .bottom-link {
      margin-top: 4px;
    }

    /* Main Content Area */
    .main-content {
      background-color: var(--color-bg) !important;
      display: flex;
      flex-direction: column;
    }

    .top-toolbar {
      height: 64px;
      background-color: var(--color-bg);
      border-bottom: 1px solid var(--color-border);
      display: flex;
      align-items: center;
      padding: 0 24px;
      z-index: 10;
    }

    .toolbar-btn {
      color: var(--text-secondary);
    }

    .toolbar-btn:hover {
      color: var(--color-primary);
      background-color: rgba(255, 255, 255, 0.03) !important;
    }

    /* Search Container next to Toggle Menu button */
    .search-container {
      position: relative;
      display: flex;
      align-items: center;
      background: #090f19;
      border: 1px solid var(--color-border);
      border-radius: 99px;
      padding: 0 16px;
      width: 280px;
      margin-left: 16px;
    }

    .search-icon {
      color: var(--text-muted);
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .search-input {
      background: transparent;
      border: none;
      color: var(--text-primary);
      padding: 8px 10px;
      font-size: 13px;
      width: 100%;
      outline: none;
      font-family: var(--font-secondary);
    }

    .spacer {
      flex: 1 1 auto;
    }

    .user-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .action-btn {
      color: var(--text-secondary);
    }

    .action-btn:hover {
      color: var(--text-primary);
      background-color: rgba(255, 255, 255, 0.02) !important;
    }

    .avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
      color: var(--color-bg);
      display: flex;
      justify-content: center;
      align-items: center;
      font-weight: 700;
      font-size: 12px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      transition: var(--transition-normal);
    }

    .avatar:hover {
      transform: scale(1.03);
    }

    .avatar-btn {
      padding: 0;
      min-width: 0;
      width: 34px;
      height: 34px;
    }

    .content-wrapper {
      padding: 24px;
      box-sizing: border-box;
      flex: 1;
      overflow-y: auto;
    }

    /* Menu Custom Styling */
    ::ng-deep .dark-menu {
      background-color: var(--color-surface) !important;
      border: 1px solid var(--color-border-strong) !important;
      border-radius: 12px !important;
      box-shadow: var(--shadow-lg) !important;
    }

    ::ng-deep .dark-menu button {
      color: var(--text-secondary) !important;
      font-size: 13px !important;
      font-weight: 500 !important;
      padding: 10px 16px !important;
    }

    ::ng-deep .dark-menu button mat-icon {
      color: var(--text-muted) !important;
    }

    ::ng-deep .dark-menu button:hover {
      background-color: rgba(255, 255, 255, 0.02) !important;
      color: var(--text-primary) !important;
    }

    .menu-header {
      padding: 14px 20px;
    }

    .menu-name {
      margin: 0;
      font-weight: 700;
      color: var(--text-primary);
      font-size: 14px;
    }

    .menu-email {
      margin: 4px 0 0 0;
      font-size: 12px;
      color: var(--text-muted);
    }

    .menu-divider {
      border: 0;
      border-top: 1px solid var(--color-border);
      margin: 6px 0;
    }
  `]
})
export class LayoutComponent {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Signals
  readonly sidenavOpen = signal(true);

  toggleSidenav(): void {
    this.sidenavOpen.update((val) => !val);
  }

  formatRole(role: string): string {
    return role.replace('_', ' ');
  }

  onLogout(): void {
    this.authService.logout();
  }
}
