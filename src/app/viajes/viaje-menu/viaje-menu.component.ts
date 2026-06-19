import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { Viaje } from '../../core/models/viaje.model';

@Component({
  selector: 'app-viaje-menu',
  imports: [],
  templateUrl: './viaje-menu.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './viaje-menu.component.css',
})
export class ViajeMenuComponent {

  @Input() viaje!: Viaje;

}
