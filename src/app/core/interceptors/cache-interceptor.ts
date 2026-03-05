import { HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, of, tap, shareReplay } from 'rxjs';
import { TimeCache } from '../models/cache/time-cache';
import { Util } from '../commons/util';

const timeCache = new TimeCache();
const solicitudesPendientes = new Map<string, Observable<HttpEvent<any>>>();

export const cacheInterceptor: HttpInterceptorFn = (request: HttpRequest<any>, next: HttpHandlerFn) => {
  // Obtiene la URL de la solicitud
  const urlCompleta = Util.separarHttpRequest(request);
  // Si no es get,
  if (request.method !== 'GET') {
    return next(request).pipe(
      tap(event => {
        if (event instanceof HttpResponse && event.ok) {
          const prefijo = resolverPrefijoInvalidacion(request);
          if (prefijo) {
            timeCache.invalidateByPrefix(prefijo);
          }
        }
      })
    );
  }

  // Se busca la misma solicitud en las respuestas cacheadas
  const cachedResponse: HttpResponse<any> | null = timeCache.get(urlCompleta);
  // Si ya estaba en la caché
  if (cachedResponse) {
    // Devuelvo la respuesta cacheada
    return of(cachedResponse.clone());
  }
  // Si no estaba en la caché
  // Busco en las solicitudes que se enviaron pero todavía no se completaron
  if (solicitudesPendientes.has(urlCompleta)) {
    // Si está en esta lista, me suscribo al observable
    return solicitudesPendientes.get(urlCompleta)!;
  }
  // Si es la primera vez que se dispara esta solicitud
  const request$ = next(request).pipe(
    tap(event => {
      if (event instanceof HttpResponse && event.ok) {
        // Si ya tengo la respuesta, la inserto en caché
        timeCache.put(urlCompleta, event.clone());
      }
    }),
    shareReplay(1),
    tap({ finalize: () => { solicitudesPendientes.delete(urlCompleta); } }));
  // Si todavía no tengo la respuesta, la inserto en las pendientes
  solicitudesPendientes.set(urlCompleta, request$);
  return request$;
};

function resolverPrefijoInvalidacion(request: HttpRequest<any>): string | null {
  const url = request.url;

  // Viajes
  if (request.method === 'POST' && url === '/api/viajes') {
    return '/api/viajes';
  }

  // Actividades / trayectos → invalidan itinerario del viaje
  const matchActividades = url.match(/^\/api\/viajes\/(\d+)\/actividades/);
  if (matchActividades) {
    const viajeId = matchActividades[1];
    return `/api/viajes/${viajeId}/itinerario`;
  }

  // Adjuntos → también invalidan itinerario
  if (url.startsWith('/api/adjuntos')) {
    // acá necesitás saber el viajeId
    // opción simple: invalidar TODOS los itinerarios
    return '/api/viajes/';
  }

  return null;
}

