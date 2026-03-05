import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { Ciudad } from "../models/ciudad";

@Injectable({ providedIn: 'root' })
export class CiudadService {
  constructor(private http: HttpClient) { }

  private readonly apiUrl = '/api/ciudades';

  listar(): Observable<Ciudad[]> {
    return this.http.get<Ciudad[]>(`${this.apiUrl}`);
  }
}
