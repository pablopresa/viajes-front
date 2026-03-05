import { CommonModule } from "@angular/common";
import { Component, inject, OnInit } from "@angular/core";
import { ButtonModule } from "primeng/button";
import { DynamicDialogRef, DynamicDialogConfig } from "primeng/dynamicdialog";
import { ItinerarioItem } from "../../core/models/itinerario-item";
import { Util } from "../../core/commons/util";
import { FileUpload, FileUploadModule } from 'primeng/fileupload';
import { ViewChild } from '@angular/core';
import { ItinerarioService } from "../../core/services/itinerario.service";

@Component({
  selector: 'app-itinerario-detalle-modal',
  standalone: true,
  imports: [CommonModule, ButtonModule, FileUploadModule],
  templateUrl: './itinerario-detail-modal.component.html'
})
export class ItinerarioDetailModalComponent {

  @ViewChild('fileUploader') fileUploader!: FileUpload;

  item!: ItinerarioItem;
  ciudades: { label: string; value: number }[] = [];
  monedaBase!: string;

  itinerarioService = inject(ItinerarioService);
  constructor(public ref: DynamicDialogRef, public config: DynamicDialogConfig) {
    this.item = config.data.item;
    this.ciudades = config.data.ciudades;
    this.monedaBase = config.data.monedaBase;
  }

  public esActividad(): boolean {
    return this.item.tipo === 'ACTIVIDAD';
  }

  public esTrayecto(): boolean {
    return this.item.tipo === 'TRAYECTO';
  }

  public obtenerNombreCiudad(ciudadId: any): string | undefined {
    return this.ciudades.find((x: any) => x.value == ciudadId)?.label;
  }

  public obtenerDuracionString(duracionMins: number): string {
    if (duracionMins < 60) {
      return `${duracionMins} mins.`;
    }

    const horas = Math.floor(duracionMins / 60);
    const minutos = duracionMins % 60;

    if (minutos === 0) {
      return `${horas} h`;
    }

    return `${horas}:${minutos.toString().padStart(2, '0')} h`;
  }

  public capitalize(texto: string | undefined): string {
    const ret = Util.capitalize(texto ?? '');
    return ret;
  }

  public agregarAdjunto(event: any): void {
    const file: File = event.files[0];

    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('tipo', this.item.tipo); // ACTIVIDAD | TRAYECTO
    formData.append('refId', this.item.id.toString());

    this.itinerarioService.agregarAdjunto(formData).subscribe({
      next: resp => this.ref.close(resp),
      error: err => {
        if (err.status === 400) {
          alert(err.error);
        }
      }
    });
  }

  public descargarAdjunto(adjuntoId: number): void {
    this.itinerarioService.descargarAdjunto(adjuntoId).subscribe(resp => {

      const blob = resp.body!;
      // Obtener nombre desde el header
      const contentDisposition = resp.headers.get('content-disposition');
      let fileName = 'archivo';

      if (contentDisposition) {
        const match = contentDisposition.match(/filename\*?=(?:UTF-8''|")?([^";\n]+)/i);
        if (match && match[1]) {
          fileName = decodeURIComponent(match[1]);
        }
      }

      // Crear link y disparar descarga
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();

      window.URL.revokeObjectURL(url);
    });
  }

}
