import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Pump {
  id?: number;
  farmId: number;
  name: string;
  capacity?: number;
  powerRating?: number;
  manufacturer?: string;
  status: 'ON' | 'OFF' | 'MAINTENANCE';
  geometry: any; // GeoJSON Point
  photoUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PumpService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/pumps';

  getAllPumps(): Observable<Pump[]> {
    return this.http.get<Pump[]>(this.apiUrl);
  }

  getPumpsByFarm(farmId: number): Observable<Pump[]> {
    return this.http.get<Pump[]>(`${this.apiUrl}/farm/${farmId}`);
  }

  createPump(pump: Pump): Observable<Pump> {
    return this.http.post<Pump>(this.apiUrl, pump);
  }

  updatePump(id: number, pump: Pump): Observable<Pump> {
    return this.http.put<Pump>(`${this.apiUrl}/${id}`, pump);
  }

  deletePump(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
