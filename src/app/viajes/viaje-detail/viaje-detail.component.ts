import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from "@angular/core";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { switchMap, filter, map } from "rxjs/operators";
import { ViajeService } from "../../core/services/viaje.service";
import { ItinerarioItem } from "../../core/models/itinerario-item";
import { Observable } from "rxjs";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { Viaje } from "../../core/models/viaje.model";
import { Util } from "../../core/commons/util";

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, CardModule, ButtonModule],
  templateUrl: './viaje-detail.component.html',
  styleUrls: ['./viaje-detail.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ViajeDetailComponent {

  viaje$!: Observable<Viaje>;
  itinerarioItems$!: Observable<ItinerarioItem[]>;

  constructor(
    private route: ActivatedRoute,
    private viajeService: ViajeService
  ) { }

  ngOnInit(): void {
    const viajeId$ = this.route.paramMap.pipe(
      map(p => Number(p.get('id'))),
      filter(id => !isNaN(id))
    );

    this.viaje$ = viajeId$.pipe(
      switchMap(id => this.viajeService.obtenerViaje(id))
    );

    this.itinerarioItems$ = this.viaje$.pipe(
      map(v => Util.mapItinerario(v.itinerario))
    );
  }

}
