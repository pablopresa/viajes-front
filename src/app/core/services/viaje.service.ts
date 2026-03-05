import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Viaje } from '../models/viaje.model';
import { CrearViajeRequest } from '../models/crear-viaje-request';
import { Ciudad } from '../models/ciudad';

@Injectable({ providedIn: 'root' })
export class ViajeService {

  private readonly apiUrl = '/api/viajes';

  constructor(private http: HttpClient) {}

  crearViaje(viaje: CrearViajeRequest): Observable<Viaje> {
    return this.http.post<Viaje>(this.apiUrl, viaje);
  }

  listarViajes(): Observable<Viaje[]> {
    return this.http.get<Viaje[]>(this.apiUrl);
  }

  obtenerViaje(id: number): Observable<Viaje> {
    return this.http.get<Viaje>(`${this.apiUrl}/${id}`);
  }

  obtenerCiudades(id: number): Observable<Ciudad[]> {
    return this.http.get<Ciudad[]>(`${this.apiUrl}/${id}/ciudades`);
  }
}
