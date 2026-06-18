import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Tree {
  id?: number;
  farmId: number;
  farmName?: string;
  treeNumber: string;
  species: string;
  age: number;
  healthStatus: 'HEALTHY' | 'STRESSED' | 'DISEASED' | 'DEAD';
  location: any; // GeoJSON Point
  photoUrl?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TreeService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/trees';

  getAllTrees(): Observable<Tree[]> {
    return this.http.get<Tree[]>(this.apiUrl);
  }

  getTreesByFarm(farmId: number): Observable<Tree[]> {
    return this.http.get<Tree[]>(`${this.apiUrl}/farm/${farmId}`);
  }

  getTreeById(id: number): Observable<Tree> {
    return this.http.get<Tree>(`${this.apiUrl}/${id}`);
  }

  createTree(tree: Tree): Observable<Tree> {
    return this.http.post<Tree>(this.apiUrl, tree);
  }

  updateTree(id: number, tree: Tree): Observable<Tree> {
    return this.http.put<Tree>(`${this.apiUrl}/${id}`, tree);
  }

  deleteTree(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  uploadTreePhoto(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ url: string }>('/api/assets/upload', formData);
  }
}
