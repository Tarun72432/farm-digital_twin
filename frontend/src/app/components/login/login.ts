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
      
      <div class="login-card glass-panel hover-glow">
        <div class="login-header">
          <div class="logo-container">
            <mat-icon class="logo-icon">spatial_tracking</mat-icon>
          </div>
          <h1 class="app-title">Moringa Twin</h1>
          <p class="app-subtitle">Farm Digital Twin Platform</p>
        </div>

        <div class="login-content">
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            
            <div class="input-group" [class.has-error]="loginForm.get('username')?.invalid && loginForm.get('username')?.touched">
              <label class="input-label">Username</label>
              <div class="input-wrapper">
                <mat-icon class="input-icon">person</mat-icon>
                <input type="text" formControlName="username" placeholder="Enter username" autocomplete="username">
              </div>
              <div class="error-msg" *ngIf="loginForm.get('username')?.hasError('required') && loginForm.get('username')?.touched">
                Username is required
              </div>
            </div>
 
            <div class="input-group" [class.has-error]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched">
              <label class="input-label">Password</label>
              <div class="input-wrapper">
                <mat-icon class="input-icon">lock</mat-icon>
                <input [type]="hidePassword() ? 'password' : 'text'" formControlName="password" placeholder="Enter password">
                <button type="button" class="visibility-btn" (click)="togglePassword($event)" [attr.aria-label]="'Hide password'">
                  <mat-icon>{{hidePassword() ? 'visibility_off' : 'visibility'}}</mat-icon>
                </button>
              </div>
              <div class="error-msg" *ngIf="loginForm.get('password')?.hasError('required') && loginForm.get('password')?.touched">
                Password is required
              </div>
            </div>

            <div *ngIf="errorMessage()" class="error-banner">
              <mat-icon>error_outline</mat-icon>
              <span>{{ errorMessage() }}</span>
            </div>

            <button type="submit" class="submit-btn" [disabled]="loginForm.invalid || isLoading()">
              <span *ngIf="!isLoading()">Sign In</span>
              <mat-spinner *ngIf="isLoading()" diameter="20" class="btn-spinner"></mat-spinner>
            </button>
          </form>
        </div>
      </div>
      
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
      background: radial-gradient(circle at 50% 50%, #080f1e 0%, #03060c 100%);
      overflow: hidden;
      font-family: var(--font-sans);
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
      filter: blur(150px);
      opacity: 0.12;
    }

    .orb-1 {
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, var(--color-primary) 0%, rgba(16, 185, 129, 0) 70%);
      top: -100px;
      left: -100px;
      animation: float 25s infinite alternate ease-in-out;
    }

    .orb-2 {
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, var(--color-accent) 0%, rgba(6, 182, 212, 0) 70%);
      bottom: -150px;
      right: -100px;
      animation: float 30s infinite alternate-reverse ease-in-out;
    }

    .orb-3 {
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, var(--color-violet) 0%, rgba(168, 85, 247, 0) 70%);
      top: 25%;
      left: 45%;
      animation: breathe 15s infinite ease-in-out;
    }

    .login-card {
      width: 100%;
      max-width: 420px;
      padding: 48px 40px;
      box-sizing: border-box;
      z-index: 1;
      border: 1px solid rgba(255, 255, 255, 0.08) !important;
      background: rgba(12, 20, 36, 0.45) !important;
      backdrop-filter: blur(32px) saturate(150%) !important;
      -webkit-backdrop-filter: blur(32px) saturate(150%) !important;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6) !important;
      border-radius: 24px !important;
      transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
    }

    .login-card:hover {
      border-color: rgba(16, 185, 129, 0.3) !important;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(16, 185, 129, 0.08) !important;
    }

    .login-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      margin-bottom: 40px;
    }

    .logo-container {
      width: 64px;
      height: 64px;
      border-radius: 18px;
      background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
      display: flex;
      justify-content: center;
      align-items: center;
      box-shadow: 0 8px 20px rgba(16, 185, 129, 0.25);
      margin-bottom: 24px;
      animation: float 6s infinite alternate ease-in-out;
    }

    .logo-icon {
      color: white;
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .app-title {
      font-family: var(--font-display);
      font-size: 28px !important;
      font-weight: 800 !important;
      color: var(--color-fg);
      letter-spacing: -0.8px;
      margin: 0 !important;
      background: linear-gradient(to right, #ffffff 30%, #a1a1aa 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .app-subtitle {
      font-family: var(--font-sans);
      font-size: 14px !important;
      color: var(--color-fg-muted) !important;
      margin-top: 8px !important;
      font-weight: 400;
      letter-spacing: 0.1px;
    }

    .login-content {
      padding: 0 !important;
    }

    /* Custom Form Styling */
    .input-group {
      margin-bottom: 24px;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      width: 100%;
    }

    .input-label {
      font-family: var(--font-sans);
      font-size: 12px;
      font-weight: 600;
      color: var(--color-fg-muted);
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 8px;
      transition: color 0.2s ease;
    }

    .input-wrapper {
      position: relative;
      width: 100%;
      box-sizing: border-box;
    }

    .input-wrapper input {
      width: 100%;
      height: 48px;
      padding: 0 16px 0 44px;
      box-sizing: border-box;
      background: rgba(6, 9, 19, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      color: var(--color-fg);
      font-family: var(--font-sans);
      font-size: 15px;
      outline: none;
      transition: all 0.2s ease;
    }

    .input-wrapper input::placeholder {
      color: rgba(255, 255, 255, 0.25);
    }

    .input-wrapper input:hover {
      border-color: rgba(255, 255, 255, 0.15);
      background: rgba(6, 9, 19, 0.5);
    }

    .input-wrapper input:focus {
      border-color: var(--color-primary);
      background: rgba(6, 9, 19, 0.6);
      box-shadow: 0 0 12px rgba(16, 185, 129, 0.15);
    }

    .input-wrapper input:focus + .input-icon {
      color: var(--color-primary);
    }

    .input-icon {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--color-fg-subtle);
      font-size: 20px;
      width: 20px;
      height: 20px;
      transition: color 0.2s ease;
      pointer-events: none;
    }

    .visibility-btn {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: var(--color-fg-subtle);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px;
      border-radius: 50%;
      transition: color 0.2s ease;
    }

    .visibility-btn:hover {
      color: var(--color-fg);
    }

    .visibility-btn mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .error-msg {
      font-family: var(--font-sans);
      font-size: 12px;
      color: var(--color-danger);
      margin-top: 6px;
      display: flex;
      align-items: center;
      animation: fadeIn 0.2s ease;
    }

    /* Error State Styling */
    .input-group.has-error .input-label {
      color: var(--color-danger);
    }

    .input-group.has-error .input-wrapper input {
      border-color: rgba(239, 68, 68, 0.4);
    }

    .input-group.has-error .input-wrapper input:focus {
      border-color: var(--color-danger);
      box-shadow: 0 0 12px rgba(239, 68, 68, 0.15);
    }

    .input-group.has-error .input-icon {
      color: var(--color-danger);
    }

    .error-banner {
      background-color: rgba(239, 68, 68, 0.08);
      border: 1px solid rgba(239, 68, 68, 0.15);
      border-radius: 12px;
      color: var(--color-danger);
      padding: 12px 16px;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
      font-family: var(--font-sans);
    }

    .error-banner mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .submit-btn {
      width: 100%;
      height: 48px;
      margin-top: 8px;
      background: linear-gradient(90deg, var(--color-primary), #059669);
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 6px 20px rgba(16, 185, 129, 0.25);
      transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .submit-btn:hover:not([disabled]) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4) !important;
      background: linear-gradient(90deg, var(--color-primary-hover), var(--color-primary));
    }

    .submit-btn:active:not([disabled]) {
      transform: translateY(0);
    }

    .submit-btn[disabled] {
      opacity: 0.6;
      cursor: not-allowed;
      box-shadow: none;
      background: rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.35);
    }

    .btn-spinner {
      margin: 0 auto;
    }

    .login-footer {
      margin-top: 32px;
      z-index: 1;
      font-size: 12px;
      color: var(--color-fg-subtle);
      font-family: var(--font-sans);
      letter-spacing: 0.1px;
    }

    @keyframes float {
      0% { transform: translateY(0px); }
      100% { transform: translateY(-10px); }
    }

    @keyframes breathe {
      0%, 100% { transform: scale(1); opacity: 0.12; }
      50% { transform: scale(1.05); opacity: 0.18; }
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-3px); }
      to { opacity: 1; transform: translateY(0); }
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
