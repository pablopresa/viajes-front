import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { Gasto } from '../models/gasto.model';

@Injectable({ providedIn: 'root' })
export class GastoService {
  constructor(private http: HttpClient) { }

  private readonly baseApi = '/api/viajes';

  listar(viajeId: number, estado?: string): Observable<Gasto[]> {
    const url = `${this.baseApi}/${viajeId}/gastos`;
    let params = new HttpParams();
    if (estado) params = params.set('estado', estado);
    return this.http.get<Gasto[]>(url, { params });
  }
}
