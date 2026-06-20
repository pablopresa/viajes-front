import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { MultiSelectModule } from 'primeng/multiselect';

import { ViajeService } from '../../core/services/viaje.service';

import { CrearViajeRequest } from '../../core/models/crear-viaje-request';
import { Ciudad } from '../../core/models/ciudad';
import { CiudadService } from '../../core/services/ciudad.service';

@Component({
  standalone: true,
  selector: 'app-viaje-create',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    InputTextModule,
    DatePickerModule,
    SelectModule,
    MultiSelectModule,
    InputNumberModule,
    ButtonModule
  ],
  templateUrl: './viaje-create.component.html',
  styleUrls: ['./viaje-create.component.css']
})
export class ViajeCreateComponent implements OnInit {

  cancelar() {
    throw new Error('Method not implemented.');
  }

  private fb: FormBuilder = inject(FormBuilder);
  private viajeService = inject(ViajeService);
  private ciudadService = inject(CiudadService);
  private router: Router = inject(Router);

  ngOnInit() {
    this.ciudadService.listar().subscribe(ciudades => {
      this.ciudadesAgrupadas = this.agruparPorPais(ciudades);
    });
  }

  loading = false;
  error?: string;
  ciudadesAgrupadas: any[] = [];

  form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    fechaInicio: [new Date(), Validators.required],
    fechaFin: [new Date(), Validators.required],
    monedaBase: ['EUR', Validators.required],
    rigidezRegistro: ['MEDIA', Validators.required],
    presupuestoTotal: [0, Validators.min(0)],
    ciudades: [[] as number[]] // 👈 nuevo
  });


  monedas = [
    { label: 'EUR', value: 'EUR' },
    { label: 'USD', value: 'USD' }
  ];

  rigideces = [
    { label: 'Baja', value: 'BAJA' },
    { label: 'Media', value: 'MEDIA' },
    { label: 'Alta', value: 'ALTA' }
  ];

  guardar(): void {
    if (this.form.invalid || this.loading) {
      return;
    }

    this.loading = true;
    this.error = undefined;

    const raw = this.form.getRawValue();

    const viaje: CrearViajeRequest = {
      nombre: raw.nombre,
      fechaInicio: this.formatDate(raw.fechaInicio),
      fechaFin: this.formatDate(raw.fechaFin),
      monedaBase: raw.monedaBase,
      rigidezRegistro: raw.rigidezRegistro,
      presupuestoTotal: raw.presupuestoTotal,
      ciudades: raw.ciudades
      // tipoCambio: raw.tipoCambio
    };

    this.viajeService.crearViaje(viaje).subscribe({
      next: () => this.router.navigate(['/viajes']),
      error: err => {
        console.error(err);
        this.error = 'Error al crear el viaje';
        this.loading = false;
      }
    });
  }

  private formatDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private agruparPorPais(ciudades: Ciudad[]) {
    const map = new Map<string, { label: string; items: any[] }>();

    ciudades.forEach(c => {
      if (!map.has(c.pais)) {
        map.set(c.pais, {
          label: c.pais,
          items: []
        });
      }

      map.get(c.pais)!.items.push({
        label: c.nombre, // visible
        value: c.id, // lo que se guarda
        pais: c.pais
      });
    });

    return Array.from(map.values());
  }


}
