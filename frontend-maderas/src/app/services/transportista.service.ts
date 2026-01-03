import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TransportistaService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/transportistas';

  constructor() { }

  getTransportistas(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  createTransportista(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  updateTransportista(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  deleteTransportista(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}