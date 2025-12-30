import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private apiUrl = `${environment.apiUrl}/clientes`;
  constructor(private http: HttpClient) { }

  getClientes() {
    return this.http.get<any[]>(this.apiUrl);
  }
}