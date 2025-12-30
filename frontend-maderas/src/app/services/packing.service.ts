import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { Packing } from '../models/packing.interface';

@Injectable({
  providedIn: 'root'
})
export class PackingService {
  private apiUrl = `${environment.apiUrl}/packing`;

  constructor(private http: HttpClient) { }

  getPackings(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  createPacking(packing: Packing): Observable<any> {
    return this.http.post(this.apiUrl, packing);
  }

  deletePacking(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}