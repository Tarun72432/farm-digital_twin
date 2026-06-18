import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Tank {
  id?: number;
  farmId: number;
  name: string;
  capacity?: number;
  material?: string;
  height?: number;
  status: string;
  geometry: any; // GeoJSON Point
  photoUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TankService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/tanks';

  getAllTanks(): Observable<Tank[]> {
    return this.http.get<Tank[]>(this.apiUrl);
  }

  getTanksByFarm(farmId: number): Observable<Tank[]> {
    return this.http.get<Tank[]>(`${this.apiUrl}/farm/${farmId}`);
  }

  createTank(tank: Tank): Observable<Tank> {
    return this.http.post<Tank>(this.apiUrl, tank);
  }

  updateTank(id: number, tank: Tank): Observable<Tank> {
    return this.http.put<Tank>(`${this.apiUrl}/${id}`, tank);
  }

  deleteTank(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
