import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Valve {
  id?: number;
  farmId: number;
  valveNumber: string;
  type?: string;
  zone?: string;
  status: 'OPEN' | 'CLOSED' | 'DAMAGED';
  geometry: any; // GeoJSON Point
  photoUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ValveService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/valves';

  getAllValves(): Observable<Valve[]> {
    return this.http.get<Valve[]>(this.apiUrl);
  }

  getValvesByFarm(farmId: number): Observable<Valve[]> {
    return this.http.get<Valve[]>(`${this.apiUrl}/farm/${farmId}`);
  }

  createValve(valve: Valve): Observable<Valve> {
    return this.http.post<Valve>(this.apiUrl, valve);
  }

  updateValve(id: number, valve: Valve): Observable<Valve> {
    return this.http.put<Valve>(`${this.apiUrl}/${id}`, valve);
  }

  deleteValve(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
