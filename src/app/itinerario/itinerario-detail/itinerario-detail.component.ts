import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  OnInit,
  inject
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { DialogService } from 'primeng/dynamicdialog';

import { ItinerarioItem } from '../../core/models/itinerario-item';
import { ActividadFormComponent } from '../actividad-form/actividad-form.component';
import { TrayectoFormComponent } from '../trayecto-form/trayecto-form.component';
import { ItinerarioService } from '../../core/services/itinerario.service';
import { Actividad } from '../../core/models/actividad.model';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Trayecto } from '../../core/models/trayecto.model';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Util } from '../../core/commons/util';
import { ViajeService } from '../../core/services/viaje.service';
import { ItinerarioDetailModalComponent } from '../itinerario-detail-modal/itinerario-detail-modal.component';
import { forkJoin } from 'rxjs';

export interface CalendarItem extends ItinerarioItem {
  top: number;
  height: number;
  _uid: string;
}
type SelectionMode = 'NONE' | 'ACTIVIDAD' | 'TRAYECTO';

@Component({
  selector: 'app-itinerario-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ToastModule],
  providers: [DialogService, MessageService],
  templateUrl: './itinerario-detail.component.html',
  styleUrl: './itinerario-detail.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ItinerarioDetailComponent implements OnInit {

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.isSelecting) {
      this.borrarSeleccion();
      this.previewByDay = {};
    }
  }

  hoveredSlotIndex: number | null = null;

  selectionMode: SelectionMode = 'NONE';
  selectionStart: Date | null = null;
  selectionEnd: Date | null = null;
  isSelecting = false;

  previewByDay: Record<string, { top: number; height: number }[]> = {};

  items: ItinerarioItem[] = [];
  days: Date[] = [];
  hours: string[] = [];
  itemsByDay: Record<string, CalendarItem[]> = {};

  viajeInicio!: string;
  viajeFin!: string;
  monedaBase!: string;
  viajeId!: number;
  ciudadesDelViaje: { label: string; value: number }[] = [];

  private viajeService = inject(ViajeService);
  private location = inject(Location);
  private dialogService = inject(DialogService);
  private itinerarioService = inject(ItinerarioService);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private messageService = inject(MessageService);

  private readonly dayFormatter = new Intl.DateTimeFormat('es-ES', {
    weekday: 'short'
  });

  ngOnInit(): void {
    this.viajeId = Number(this.route.snapshot.paramMap.get('id'));

    this.viajeService.obtenerCiudades(this.viajeId).subscribe(ciudades => {
      this.ciudadesDelViaje = ciudades.map(c => ({
        label: `${c.nombre}`,
        value: c.id
      }));
      this.cdr.markForCheck();
    });

    forkJoin({
      viaje: this.viajeService.obtenerViaje(this.viajeId),
      items: this.itinerarioService.obtenerItinerario(this.viajeId)
    }).subscribe({
      next: ({ viaje, items }) => {
        this.monedaBase = viaje.monedaBase;
        this.viajeInicio = viaje.fechaInicio;
        this.viajeFin = viaje.fechaFin;
        
        this.buildDaysFromViaje();
        this.buildHours();
        this.items = items ?? [];
        this.mapItems();
        this.cdr.markForCheck();
      },
      error: err => console.error(err)
    });
  }

  public obtenerNombreCiudad(ciudadId: any): string | undefined {
    return this.ciudadesDelViaje.find((x: any) => x.value == ciudadId)?.label;
  }

  goBack(): void {
    this.location.back();
  }

  agregarActividad(): void {
    this.startSelection('ACTIVIDAD');
  }

  agregarTrayecto(): void {
    this.startSelection('TRAYECTO');
  }

  private startSelection(mode: SelectionMode): void {
    this.selectionMode = mode;
    this.selectionStart = null;
    this.selectionEnd = null;
    this.previewByDay = {};
    this.isSelecting = true;
  }

  borrarSeleccion(): void {
    this.selectionMode = 'NONE';
    this.selectionStart = null;
    this.selectionEnd = null;
    this.previewByDay = {};
    this.isSelecting = false;
  }

  onSlotClick(day: Date, slotIndex: number): void {
    if (!this.isSelecting) return;

    const slotStart = Util.slotToDate(day, slotIndex);
    const slotEnd = this.terminarExclusivo(slotStart);

    if (!this.selectionStart) {
      this.selectionStart = slotStart;
      this.selectionEnd = slotEnd;
      this.updatePreview();
      return;
    }

    this.selectionEnd = slotEnd;
    this.normalizeSelection();
    this.updatePreview();

    if (this.rangoValido(this.selectionStart, this.selectionEnd)) {
      this.confirmRange();
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Rango inválido',
        detail: 'El rango se superpone con otro elemento.'
      });
      this.borrarSeleccion();
    }
  }

  onSlotHover(day: Date, slotIndex: number): void {
    if (!this.isSelecting || !this.selectionStart) return;

    const slotStart = Util.slotToDate(day, slotIndex);
    this.selectionEnd = this.terminarExclusivo(slotStart);
    this.normalizeSelection();
    this.updatePreview();
  }

  private normalizeSelection(): void {
    if (this.selectionEnd! < this.selectionStart!) {
      [this.selectionStart, this.selectionEnd] =
        [this.selectionEnd!, this.selectionStart!];
    }
  }

  private updatePreview(): void {
    if (!this.selectionStart || !this.selectionEnd) return;

    const result: Record<string, { top: number; height: number }[]> = {};

    for (const day of this.days) {
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const start = Math.max(dayStart.getTime(), this.selectionStart.getTime());
      const end = Math.min(dayEnd.getTime(), this.selectionEnd.getTime());

      if (start >= end) continue;

      const minutes = (start - dayStart.getTime()) / 60000;
      const duration = (end - start) / 60000;

      result[this.claveDia(day)] = [{
        top: (minutes / Util.SLOT_MINUTES) * Util.PX_PER_SLOT,
        height: (duration / Util.SLOT_MINUTES) * Util.PX_PER_SLOT
      }];
    }

    this.previewByDay = result;
  }

  private confirmRange(): void {
    this.selectionMode === 'ACTIVIDAD'
      ? this.abrirModalActividad()
      : this.abrirModalTrayecto();
  }

  private buildDaysFromViaje(): void {
    const days: Date[] = [];
    const current = Util.parseLocalDate(this.viajeInicio);
    current.setHours(0, 0, 0, 0);

    const end = Util.parseLocalDate(this.viajeFin);
    end.setHours(0, 0, 0, 0);

    while (current <= end) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    this.days = days;
  }

  private buildHours(): void {
    const result: string[] = [];

    for (let h = 0; h < 24; h++) {
      result.push(`${h.toString().padStart(2, '0')}:00`);
      result.push(`${h.toString().padStart(2, '0')}:30`);
    }

    this.hours = result;
  }

  private mapItems(): void {
    const result: Record<string, CalendarItem[]> = {};
    this.days.forEach(d => result[this.claveDia(d)] = []);

    this.items.forEach(item => {
      Util.splitItemByDay(item).forEach(segment => {
        const clave = this.claveDia(segment.inicio);
        if (result[clave]) result[clave].push(segment);
      });
    });
    this.itemsByDay = result;
  }

  claveDia(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  obtenerNombreDia(d: Date): string {
    return Util.capitalize(this.dayFormatter.format(d));
  }

  obtenerNumeroDia(d: Date): string {
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  private terminarExclusivo(date: Date): Date {
    return new Date(date.getTime() + Util.SLOT_MINUTES * 60000);
  }

  private reset(): void {
    this.items = [];
    this.days = [];
    this.hours = [];
    this.itemsByDay = {};
  }

  private rangoValido(start: Date | null, end: Date | null): boolean {
    if (!start || !end) return false;

    const nuevoInicio = start.getTime();
    const nuevoFin = end.getTime(); // exclusivo

    return !this.items.some(item => {
      const itemInicio = item.inicio.getTime();
      const itemFin = itemInicio + item.duracionMinutos * 60_000;

      // solapamiento real
      return nuevoInicio < itemFin && itemInicio < nuevoFin;
    });
  }

  private abrirModalActividad(): void {
    const ref = this.dialogService.open(ActividadFormComponent, {
      header: 'Nueva actividad',
      width: '250px',
      data: {
        inicio: this.selectionStart,
        fin: this.selectionEnd,
        monedaBase: this.monedaBase,
        ciudades: this.ciudadesDelViaje
      }
    });

    if (!ref) return;

    ref.onClose.subscribe((actividad: Actividad | null) => {
      if (!actividad) {
        this.borrarSeleccion();
        return;
      }

      this.itinerarioService
        .crearActividad(actividad, this.viajeId)
        .subscribe({
          next: () => {
            this.recargarItinerario();
            this.borrarSeleccion();
          },
          error: err => {
            console.error('Error creando actividad', err);
            this.borrarSeleccion();
          }
        });
    });
  }

  private abrirModalTrayecto(): void {
    const ref = this.dialogService.open(TrayectoFormComponent, {
      header: 'Nuevo trayecto',
      width: '250px',
      data: {
        inicio: this.selectionStart,
        fin: this.selectionEnd,
        monedaBase: this.monedaBase,
        ciudades: this.ciudadesDelViaje
      }
    });

    if (!ref) return;

    ref.onClose.subscribe((trayecto: Trayecto | null) => {
      if (!trayecto) {
        this.borrarSeleccion();
        return;
      }

      this.itinerarioService
        .crearActividad(trayecto, this.viajeId)
        .subscribe({
          next: () => {
            this.recargarItinerario();
            this.borrarSeleccion();
          },
          error: err => {
            console.error('Error creando trayecto', err);
            this.borrarSeleccion();
          }
        });
    });
  }

  private recargarItinerario(): void {
    this.itinerarioService
      .obtenerItinerario(this.viajeId)
      .subscribe({
        next: itinerario => {
          this.items = itinerario.map(item => ({
            ...item,
            inicio: new Date(item.inicio),
            fin: new Date(item.fin)
          }));

          this.mapItems();
          this.cdr.markForCheck();
        },
        error: err => {
          console.error('Error recargando itinerario', err);
        }
      });
  }

  openDetalle(item: CalendarItem): void {
    if (this.isSelecting) return;

    this.dialogService.open(ItinerarioDetailModalComponent, {
      header: item.tipo === 'ACTIVIDAD' ? item.nombre : 'Detalle del trayecto', width: '270px',
      dismissableMask: true, closable: true, closeOnEscape: true, modal: true,
      data: {
        item,
        ciudades: this.ciudadesDelViaje,
        monedaBase: this.monedaBase,
        viajeId: this.viajeId
      }
    })?.onClose.subscribe(result => {
      if (!result) return;

      if (result.deleted) {
        this.recargarItinerario();
        return;
      }

      if (result.id) {
        item.adjuntoId = result.id;
      }
    });
  }
}
