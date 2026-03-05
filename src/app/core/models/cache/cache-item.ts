
import { HttpResponse } from '@angular/common/http';

export class CacheItem {
    public time: number;
    public item: HttpResponse<any>;
    public ttl: number;

    constructor(time: number, item: HttpResponse<any>, ttl: number){
        this.time = time;
        this.item = item;
        this.ttl = ttl;
    }
}
