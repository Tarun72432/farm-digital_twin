import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

export interface User {
  userId: number;
  username: String;
  email: String;
  role: 'SUPER_ADMIN' | 'FARM_MANAGER' | 'FIELD_OPERATOR' | 'VIEWER';
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  userId: number;
  username: string;
  email: string;
  role: 'SUPER_ADMIN' | 'FARM_MANAGER' | 'FIELD_OPERATOR' | 'VIEWER';
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  
  private readonly apiUrl = '/api/auth';

  // Signals
  readonly currentUser = signal<User | null>(null);
  
  // Computed properties
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly isAdmin = computed(() => this.currentUser()?.role === 'SUPER_ADMIN');
  readonly isFieldOperator = computed(() => this.currentUser()?.role === 'FIELD_OPERATOR');
  readonly isViewer = computed(() => this.currentUser()?.role === 'VIEWER');

  constructor() {
    this.loadSession();
  }

  private loadSession(): void {
    const token = localStorage.getItem('accessToken');
    const userStr = localStorage.getItem('currentUser');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        this.currentUser.set(user);
      } catch (e) {
        this.logout();
      }
    }
  }

  login(credentials: { username: string; password: String }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((res) => {
        localStorage.setItem('accessToken', res.accessToken);
        const user: User = {
          userId: res.userId,
          username: res.username,
          email: res.email,
          role: res.role
        };
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUser.set(user);
      })
    );
  }

  register(userData: { username: string; email: string; password: String; role: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, userData);
  }

  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('currentUser');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }
}
