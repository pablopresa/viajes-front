import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule, NonNullableFormBuilder } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'app-trayecto-form',
  imports: [CommonModule, ReactiveFormsModule, InputTextModule, InputNumberModule, TextareaModule, ButtonModule, SelectModule],
  templateUrl: './trayecto-form.component.html',
  styleUrl: './trayecto-form.component.css',
})
export class TrayectoFormComponent {

  private fb = inject(FormBuilder);
  private dialogRef = inject(DynamicDialogRef);

  readonly inicio!: Date;
  readonly fin!: Date;
  readonly monedaBase!: string;
  readonly ciudades = this.config.data.ciudades as { label: string; value: number; }[];
  form!: any;

  constructor(private config: DynamicDialogConfig) {
    this.inicio = config.data.inicio;
    this.fin = config.data.fin;
    this.monedaBase = config.data.monedaBase;
    this.form = this.fb.nonNullable.group({
      medioTransporte: ['', Validators.required],
      origenCiudadId: [null as number | null, Validators.required],
      destinoCiudadId: [null as number | null, Validators.required],
      duracionMinutos: [this.calcularDuracion(), Validators.min(1)],
      costoEstimado: [null as number | null],
    });
  }

  mediosDeTransporte = [
    { label: 'Avión', value: 'AVION' },
    { label: 'Tren', value: 'TREN' },
    { label: 'Bus', value: 'BUS' },
    { label: 'Barco', value: 'BARCO' },
    { label: 'Pie', value: 'PIE' },
  ];

  private calcularDuracion(): number {
    const diffMs = this.fin.getTime() - this.inicio.getTime();
    return Math.max(1, Math.round(diffMs / 60000));
  }

  guardar(): void {
    if (this.form.invalid) return;
    this.dialogRef.close(this.buildActividad());
  }

  private buildActividad() {
    const fecha = this.formatDateLocal(this.inicio);
    const horaInicio = this.formatDateTimeLocal(this.inicio);

    return {
      nombre: this.obtenerNombre(),
      fecha,
      horaInicio,
      duracionMinutos: this.form.controls.duracionMinutos.value,
      costo: null,
      descripcion: this.obtenerNombre(),
      costoEstimado: this.form.controls.costoEstimado.value,
      origen: this.form.controls.origenCiudadId.value,
      destino: this.form.controls.destinoCiudadId.value,
      tipo: 'TRAYECTO',
      medioTransporte: this.form.controls.medioTransporte.value
    };
  }

  private obtenerNombre(): string {
    return this.form.controls.medioTransporte.value + ' de ' + this.obtenerNombreCiudad(this.form.controls.origenCiudadId.value) + ' a ' + this.obtenerNombreCiudad(this.form.controls.destinoCiudadId.value);
  }

  private obtenerNombreCiudad(ciudadId: number | null): string | undefined {
    return this.ciudades.find((x: any) => x.value == ciudadId)?.label;
  }


  cancelar(): void {
    this.dialogRef.close(null);
  }

  private formatDateLocal(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private formatDateTimeLocal(date: Date): string {
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${this.formatDateLocal(date)}T${h}:${min}`;
  }

}