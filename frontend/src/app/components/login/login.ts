import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="login-container">
      <div class="background-decor">
        <div class="glow-orb orb-1"></div>
        <div class="glow-orb orb-2"></div>
        <div class="glow-orb orb-3"></div>
      </div>
      
      <mat-card class="login-card glass-panel hover-glow">
        <mat-card-header class="login-header">
          <div class="logo-container">
            <mat-icon class="logo-icon">spatial_tracking</mat-icon>
          </div>
          <mat-card-title class="app-title">Moringa Twin</mat-card-title>
          <mat-card-subtitle class="app-subtitle">Farm Digital Twin Platform</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content class="login-content">
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Username</mat-label>
              <input matInput formControlName="username" placeholder="Enter username" autocomplete="username">
              <mat-icon matSuffix>person</mat-icon>
              <mat-error *ngIf="loginForm.get('username')?.hasError('required')">
                Username is required
              </mat-error>
            </mat-form-field>
 
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Password</mat-label>
              <input matInput [type]="hidePassword() ? 'password' : 'text'" formControlName="password" placeholder="Enter password">
              <button mat-icon-button matSuffix (click)="togglePassword($event)" [attr.aria-label]="'Hide password'" [attr.aria-pressed]="hidePassword()">
                <mat-icon>{{hidePassword() ? 'visibility_off' : 'visibility'}}</mat-icon>
              </button>
              <mat-error *ngIf="loginForm.get('password')?.hasError('required')">
                Password is required
              </mat-error>
            </mat-form-field>

            <div *ngIf="errorMessage()" class="error-banner">
              <mat-icon>error_outline</mat-icon>
              <span>{{ errorMessage() }}</span>
            </div>

            <button mat-flat-button color="primary" type="submit" class="submit-btn" [disabled]="loginForm.invalid || isLoading()">
              <span *ngIf="!isLoading()">Sign In</span>
              <mat-spinner *ngIf="isLoading()" diameter="20" class="btn-spinner"></mat-spinner>
            </button>
          </form>
        </mat-card-content>
      </mat-card>
      
      <div class="login-footer">
        <p>&copy; 2026 Moringa Plantation Farm. All rights reserved.</p>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      position: relative;
      height: 100vh;
      width: 100vw;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background: radial-gradient(circle at 50% 50%, #0d1527 0%, #060913 100%);
      overflow: hidden;
      font-family: var(--font-primary);
    }

    .background-decor {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      z-index: 0;
    }

    .glow-orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(140px);
      opacity: 0.18;
    }

    .orb-1 {
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, var(--color-primary) 0%, rgba(16, 185, 129, 0) 70%);
      top: -200px;
      left: -150px;
      animation: float 25s infinite alternate ease-in-out;
    }

    .orb-2 {
      width: 700px;
      height: 700px;
      background: radial-gradient(circle, var(--color-accent) 0%, rgba(6, 182, 212, 0) 70%);
      bottom: -250px;
      right: -150px;
      animation: float 30s infinite alternate-reverse ease-in-out;
    }

    .orb-3 {
      width: 450px;
      height: 450px;
      background: radial-gradient(circle, var(--color-purple) 0%, rgba(168, 85, 247, 0) 70%);
      top: 30%;
      left: 40%;
      animation: breathe 12s infinite ease-in-out;
    }

    .login-card {
      width: 100%;
      max-width: 440px;
      padding: 44px 36px;
      box-sizing: border-box;
      z-index: 1;
      border: 1px solid rgba(255, 255, 255, 0.06) !important;
      background: rgba(10, 17, 32, 0.55) !important;
      backdrop-filter: blur(30px) saturate(140%) !important;
      box-shadow: var(--shadow-lg) !important;
      border-radius: 24px !important;
    }

    .login-card:hover {
      border-color: rgba(16, 185, 129, 0.25) !important;
      box-shadow: var(--shadow-lg), 0 0 35px rgba(16, 185, 129, 0.1) !important;
    }

    .login-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      margin-bottom: 36px;
    }

    .logo-container {
      width: 68px;
      height: 68px;
      border-radius: 20px;
      background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
      display: flex;
      justify-content: center;
      align-items: center;
      box-shadow: 0 10px 25px rgba(16, 185, 129, 0.35);
      margin-bottom: 20px;
      animation: float 6s infinite alternate ease-in-out;
    }

    .logo-icon {
      color: white;
      font-size: 36px;
      width: 36px;
      height: 36px;
    }

    .app-title {
      font-size: 30px !important;
      font-weight: 800 !important;
      color: var(--text-primary);
      letter-spacing: -0.8px;
      margin: 0 !important;
      background: linear-gradient(to right, #ffffff, #e2e8f0);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .app-subtitle {
      font-size: 14px !important;
      color: var(--text-secondary) !important;
      margin-top: 6px !important;
      font-weight: 400;
      letter-spacing: 0.2px;
    }

    .login-content {
      padding: 0 !important;
    }

    .form-field {
      margin-bottom: 20px;
    }

    .error-banner {
      background-color: rgba(244, 63, 94, 0.08);
      border: 1px solid rgba(244, 63, 94, 0.15);
      border-radius: 10px;
      color: var(--color-danger);
      padding: 12px 16px;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
      font-family: var(--font-secondary);
    }

    .submit-btn {
      width: 100%;
      padding: 26px 0 !important;
      font-size: 16px !important;
      font-weight: 600 !important;
      border-radius: 12px !important;
      background: linear-gradient(90deg, var(--color-primary), #059669) !important;
      box-shadow: 0 6px 20px rgba(16, 185, 129, 0.3) !important;
      transition: var(--transition-normal) !important;
    }

    .submit-btn:hover:not([disabled]) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(16, 185, 129, 0.45) !important;
      background: linear-gradient(90deg, var(--color-primary-hover), var(--color-primary)) !important;
    }

    .submit-btn:active:not([disabled]) {
      transform: translateY(0);
    }

    .btn-spinner {
      margin: 0 auto;
    }

    .login-footer {
      margin-top: 32px;
      z-index: 1;
      font-size: 12px;
      color: var(--text-muted);
      font-family: var(--font-secondary);
      letter-spacing: 0.1px;
    }

    ::ng-deep .mat-mdc-text-field-wrapper {
      background-color: rgba(6, 9, 19, 0.5) !important;
      border-radius: 12px !important;
      transition: var(--transition-fast) !important;
    }

    ::ng-deep .mdc-text-field--outlined:not(.mdc-text-field--disabled) .mdc-notched-outline__leading,
    ::ng-deep .mdc-text-field--outlined:not(.mdc-text-field--disabled) .mdc-notched-outline__notch,
    ::ng-deep .mdc-text-field--outlined:not(.mdc-text-field--disabled) .mdc-notched-outline__trailing {
      border-color: rgba(255, 255, 255, 0.05) !important;
      border-width: 1px !important;
      transition: var(--transition-fast) !important;
    }

    ::ng-deep .mdc-text-field--outlined:not(.mdc-text-field--disabled):hover .mdc-notched-outline__leading,
    ::ng-deep .mdc-text-field--outlined:not(.mdc-text-field--disabled):hover .mdc-notched-outline__notch,
    ::ng-deep .mdc-text-field--outlined:not(.mdc-text-field--disabled):hover .mdc-notched-outline__trailing {
      border-color: rgba(255, 255, 255, 0.15) !important;
    }

    ::ng-deep .mdc-text-field--outlined:not(.mdc-text-field--disabled).mdc-text-field--focused .mdc-notched-outline__leading,
    ::ng-deep .mdc-text-field--outlined:not(.mdc-text-field--disabled).mdc-text-field--focused .mdc-notched-outline__notch,
    ::ng-deep .mdc-text-field--outlined:not(.mdc-text-field--disabled).mdc-text-field--focused .mdc-notched-outline__trailing {
      border-color: var(--color-primary) !important;
      border-width: 1.5px !important;
    }

    ::ng-deep .mat-mdc-form-field-label {
      color: var(--text-muted) !important;
    }

    ::ng-deep .mat-mdc-form-field-focus-active .mat-mdc-form-field-label {
      color: var(--color-primary) !important;
    }

    ::ng-deep .mat-mdc-form-field mat-icon {
      color: var(--text-muted) !important;
    }

    ::ng-deep .mat-mdc-form-field-focus-active mat-icon {
      color: var(--color-primary) !important;
    }
  `]
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Form group
  readonly loginForm: FormGroup = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  // Signals
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly hidePassword = signal(true);

  togglePassword(event: Event): void {
    event.preventDefault();
    this.hidePassword.update((val) => !val);
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Invalid username or password. Please try again.');
      }
    });
  }
}
