import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'app-actividad-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    InputNumberModule,
    TextareaModule,
    ButtonModule,
    SelectModule
  ],
  templateUrl: './actividad-form.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './actividad-form.component.css'
})
export class ActividadFormComponent {

  private fb = inject(FormBuilder);
  private dialogRef = inject(DynamicDialogRef);
  private config = inject(DynamicDialogConfig);

  readonly inicio: Date = this.config.data.inicio;
  readonly fin: Date = this.config.data.fin;
  readonly monedaBase: string = this.config.data.monedaBase;
  readonly ciudades = this.config.data.ciudades as { label: string; value: number; }[];

  form = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    ciudadId: [null as number | null, Validators.required],
    duracionMinutos: [
      this.calcularDuracion(),
      [Validators.required, Validators.min(1)]
    ],
    costoEstimado: [null as number | null],
    descripcion: ['']
  });

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
      nombre: this.form.controls.nombre.value,
      fecha,
      horaInicio,
      duracionMinutos: this.form.controls.duracionMinutos.value,
      ubicacion: this.form.controls.ciudadId.value ?? '',
      costo: null,
      descripcion: this.form.controls.descripcion.value ?? '',
      costoEstimado: this.form.controls.costoEstimado.value,
      tipo: 'ACTIVIDAD'
    };
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
