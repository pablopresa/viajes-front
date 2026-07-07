import { CommonModule, Location } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { catchError, finalize, take } from 'rxjs/operators';
import { Ciudad } from '../core/models/ciudad';
import { ViajeService } from '../core/services/viaje.service';

@Component({
    standalone: true,
    imports: [CommonModule],
    selector: 'app-mapa',
    templateUrl: './mapa.component.html',
    styleUrls: ['./mapa.component.css']
})
export class MapaComponent implements OnInit {
    private readonly route = inject(ActivatedRoute);
    private readonly viajeService = inject(ViajeService);
    private readonly location = inject(Location);
    private readonly cdr = inject(ChangeDetectorRef);
    ciudades: Ciudad[] = [];
    cargando = true;
    error = 'Error cargando las ciudades del viaje.';

    ngOnInit(): void {
        const viajeIdFromRoute = Number(this.route.snapshot.paramMap.get('id'));
        const viajeId = Number.isFinite(viajeIdFromRoute) ? viajeIdFromRoute : Number(this.route.snapshot.firstChild?.paramMap.get('id'));

        if (!Number.isFinite(viajeId)) {
            this.error = 'No se pudo identificar el viaje.';
            this.cargando = false;
            this.cdr.markForCheck();
            return;
        }

        this.cargarCiudades(viajeId);

        this.route.paramMap.subscribe(params => {
            const nuevoId = Number(params.get('id'));
            if (Number.isFinite(nuevoId) && nuevoId !== viajeId) {
                this.cargarCiudades(nuevoId);
            }
        });
    }

    calcularPosicionX(ciudad: Ciudad): number {
        return ((ciudad.longitud + 180) / 360) * 100;
    }

    calcularPosicionY(ciudad: Ciudad): number {
        return ((90 - ciudad.latitud) / 180) * 100;
    }

    goBack(): void {
        this.location.back();
    }

    private cargarCiudades(viajeId: number): void {
        this.cargando = true;
        this.error = '';
        this.ciudades = [];
        this.cdr.markForCheck();

        const timeoutId = window.setTimeout(() => {
            if (this.cargando) {
                this.error = 'No se pudieron cargar las ciudades del viaje.';
                this.cargando = false;
                this.cdr.markForCheck();
            }
        }, 8000);

        this.viajeService.obtenerCiudades(viajeId).pipe(
            take(1),
            catchError(() => {
                this.error = 'No se pudieron cargar las ciudades del viaje.';
                this.cargando = false;
                this.cdr.markForCheck();
                return of([] as Ciudad[]);
            }),
            finalize(() => {
                window.clearTimeout(timeoutId);
            })
        ).subscribe((ciudades) => {
            this.ciudades = [...ciudades].sort((a, b) => a.orden - b.orden);
            this.cargando = false;
            this.cdr.markForCheck();
        });
    }

}
