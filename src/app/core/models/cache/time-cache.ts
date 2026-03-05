
import { HttpResponse } from '@angular/common/http';
import { CacheItem } from './cache-item';

export class TimeCache {

  private readonly values: Map<string, CacheItem> = new Map<string, CacheItem>();

  public get(key: string): HttpResponse<any> | null {
    if (!this.values.has(key)) {
      return null;
    }

    const respuestaCacheada = this.values.get(key);

    if (respuestaCacheada == undefined || !this.respuestaVigente(respuestaCacheada)) {
      this.values.delete(key);
      return null;
    }

    return respuestaCacheada.item;
  }

  public put(key: string, value: HttpResponse<any>) {
    const tiempoIngreso = Date.now();

    const cacheItem = new CacheItem(tiempoIngreso, value, 600000);
    this.values.set(key, cacheItem);
  }

  private respuestaVigente(item: CacheItem): boolean {
    return (Date.now() - item.time < item.ttl);
  }

  public invalidateByPrefix(prefix: string): void {
    for (const key of this.values.keys()) {
      if (key.startsWith(prefix)) {
        this.values.delete(key);
      }
    }
  }
}
