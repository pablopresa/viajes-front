import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { Itinerario } from '../models/itinerario.model';
import { Actividad } from '../models/actividad.model';
import { ItinerarioItem } from '../models/itinerario-item';
import { Trayecto } from '../models/trayecto.model';
import { Util } from '../commons/util';

@Injectable({ providedIn: 'root' })
export class ItinerarioService {

  private readonly apiUrl = '/api';

  constructor(private http: HttpClient) { }

  obtenerItinerario(viajeId: number): Observable<ItinerarioItem[]> {
    return this.http
      .get<Itinerario>(`${this.apiUrl}/viajes/${viajeId}/itinerario`)
      .pipe(map((itinerario: any) => Util.mapItinerario(itinerario)));
  }

  crearActividad(item: Actividad | Trayecto, viajeId: number): Observable<ItinerarioItem> {
    return this.http.post<ItinerarioItem>(`${this.apiUrl}/viajes/${viajeId}/actividades`, item);
  }

  agregarAdjunto(form: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/adjuntos`, form);
  }

  descargarAdjunto(adjuntoId: number): Observable<any> {
    return this.http.get(
      `${this.apiUrl}/adjuntos/${adjuntoId}`,
      { responseType: 'blob', observe: 'response' }
    );
  }
}
