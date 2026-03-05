import { HttpRequest } from "@angular/common/http";
import { CalendarItem } from "../../itinerario/itinerario-detail/itinerario-detail.component";
import { ItinerarioItem } from "../models/itinerario-item";

export class Util {

    static START_HOUR = 0;
    static END_HOUR = 23;
    static SLOT_MINUTES = 30;
    static PX_PER_SLOT = 24;

    public static parseLocalDate(value: string | Date): Date {
        if (value instanceof Date) return value;

        // Espera formato YYYY-MM-DD
        const [y, m, d] = value.split('-').map(Number);
        return new Date(y, m - 1, d, 0, 0, 0, 0);
    }

    public static capitalize(texto: string): string {
        return texto.charAt(0).toUpperCase() + texto.substring(1, texto.length).toLowerCase();
    }

    public static splitItemByDay(item: ItinerarioItem): CalendarItem[] {
        const result: CalendarItem[] = [];

        let currentStart = new Date(item.inicio);

        const itemEnd = new Date(item.inicio.getTime() + item.duracionMinutos * 60000);

        while (currentStart < itemEnd) {
            const dayStart = new Date(currentStart);
            dayStart.setHours(0, 0, 0, 0);

            const dayEnd = new Date(dayStart);
            dayEnd.setDate(dayEnd.getDate() + 1);

            const segmentStart = currentStart;
            const segmentEnd = new Date(Math.min(dayEnd.getTime(), itemEnd.getTime()));

            const minutesFromDayStart =
                (segmentStart.getTime() - dayStart.getTime()) / 60000;

            const durationMinutes =
                (segmentEnd.getTime() - segmentStart.getTime()) / 60000;

            result.push({
                ...item,
                inicio: new Date(segmentStart),
                fin: new Date(segmentEnd),
                top: (minutesFromDayStart / this.SLOT_MINUTES) * this.PX_PER_SLOT,
                height: (durationMinutes / this.SLOT_MINUTES) * this.PX_PER_SLOT,
                _uid: crypto.randomUUID?.() ?? Util.uuidFallback()
            });

            currentStart = segmentEnd;
        }

        return result;
    }

    public static slotToDate(day: Date, slotIndex: number): Date {
        const d = new Date(day);
        d.setHours(0, 0, 0, 0);
        d.setMinutes(slotIndex * this.SLOT_MINUTES);
        return d;
    }

    public static mapItinerario(itinerario: any): ItinerarioItem[] {
        const actividades = itinerario.actividades.map((a: any) => ({
            id: a.id,
            tipo: 'ACTIVIDAD',
            nombre: a.nombre,
            descripcion: a.descripcion,
            inicio: new Date(a.horaInicio),
            fin: new Date(a.horaFin),
            duracionMinutos: a.duracionMinutos,
            costo: a.costo,
            costoEstimado: a.costoEstimado,
            adjuntoId: a.adjuntoId
        }));

        const trayectos = itinerario.trayectos.map((t: any) => ({
            id: t.id,
            tipo: 'TRAYECTO',
            nombre: t.nombre,
            inicio: new Date(t.horaInicio),
            fin: new Date(t.horaFin),
            duracionMinutos: t.duracionMinutos,
            costo: t.costo,
            costoEstimado: t.costoEstimado,
            origen: t.origen,
            destino: t.destino,
            medioTransporte: t.medioTransporte,
            adjuntoId: t.adjuntoId
        }));

        return [...actividades, ...trayectos]
            .sort((a, b) => a.inicio.getTime() - b.inicio.getTime());
    }

    public static uuidFallback(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    public static separarHttpRequest(consulta: HttpRequest<any>): any {
        if (this.isNullOrUndefined(consulta)) {
            return null;
        }
        const queryParamsConsulta = (consulta.params + '' != '') ? '?' + consulta.params : '';
        return consulta.url + queryParamsConsulta;
    }

    public static isNullOrUndefined(valor: any) {
        return valor == null || valor == undefined;
    }


}
