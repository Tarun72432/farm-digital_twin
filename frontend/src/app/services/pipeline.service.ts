import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Pipeline {
  id?: number;
  farmId: number;
  name: string;
  diameter?: number;
  material?: string;
  length?: number;
  status: string;
  geometry: any; // GeoJSON LineString
}

@Injectable({
  providedIn: 'root'
})
export class PipelineService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/pipelines';

  getAllPipelines(): Observable<Pipeline[]> {
    return this.http.get<Pipeline[]>(this.apiUrl);
  }

  getPipelinesByFarm(farmId: number): Observable<Pipeline[]> {
    return this.http.get<Pipeline[]>(`${this.apiUrl}/farm/${farmId}`);
  }

  createPipeline(pipeline: Pipeline): Observable<Pipeline> {
    return this.http.post<Pipeline>(this.apiUrl, pipeline);
  }

  updatePipeline(id: number, pipeline: Pipeline): Observable<Pipeline> {
    return this.http.put<Pipeline>(`${this.apiUrl}/${id}`, pipeline);
  }

  deletePipeline(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
