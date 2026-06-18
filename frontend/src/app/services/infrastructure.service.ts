import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Infrastructure {
  id?: number;
  farmId: number;
  name: string;
  type: 'BUILDING' | 'ROAD' | 'STORAGE' | 'FENCE' | 'PANEL' | 'SOURCE';
  status: string;
  geometry: any; // GeoJSON Geometry (Point, LineString, or Polygon)
  photoUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class InfrastructureService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/infrastructure';

  getAllInfrastructure(): Observable<Infrastructure[]> {
    return this.http.get<Infrastructure[]>(this.apiUrl);
  }

  getInfrastructureByFarm(farmId: number): Observable<Infrastructure[]> {
    return this.http.get<Infrastructure[]>(`${this.apiUrl}/farm/${farmId}`);
  }

  createInfrastructure(infra: Infrastructure): Observable<Infrastructure> {
    return this.http.post<Infrastructure>(this.apiUrl, infra);
  }

  updateInfrastructure(id: number, infra: Infrastructure): Observable<Infrastructure> {
    return this.http.put<Infrastructure>(`${this.apiUrl}/${id}`, infra);
  }

  deleteInfrastructure(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
